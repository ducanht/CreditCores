/**
 * ========================================================================================
 * CREDITCORES - DEBITCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Phân hệ Quản lý & Tự động hóa Trích nợ Auto-Debit:
 *              1. Đăng ký trích nợ cấp Khách hàng (Tài khoản CASA, Giấy đề nghị trích nợ A4)
 *              2. Cấu hình các Đợt trích nợ linh hoạt theo Ngày vay trong tháng (day of month)
 *              3. Lập đợt trích nợ, tính lãi ngày thực tế TT 14/2017/TT-NHNN & Chốt đợt
 * @updated     18/09/2026
 * @version     3.2 Enterprise Auto-Debit
 * ========================================================================================
 */

var DebitController = {

  // ======================================================================================
  // 1. QUẢN LÝ ĐĂNG KÝ TRÍCH NỢ CẤP KHÁCH HÀNG (CUSTOMER LEVEL)
  // ======================================================================================

  handleGetDebitRegistrations: function(ss) {
    var cached = CacheHelper.getCachedData('debit_registrations');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("DANG_KY_TRICH_NO");
    }

    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var numRows = sheet.getLastRow() - 1;
    var values = sheet.getRange(2, 1, numRows, sheet.getLastColumn()).getValues();
    var results = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var rawMaKH = String(HeaderUtils.getCell(row, colMap, "MaKH", "")).replace(/^'/, "").trim();
      if (!rawMaKH) continue;

      var hoTen = String(HeaderUtils.getCell(row, colMap, "HoTen", "") || HeaderUtils.getCell(row, colMap, "TenKH", "")).trim();
      var cccd = String(HeaderUtils.getCell(row, colMap, "CCCD", "") || HeaderUtils.getCell(row, colMap, "SoGTTT", "")).replace(/^'/, "").trim();
      var ngayCap = formatGasDate(HeaderUtils.getCell(row, colMap, "NgayCap", ""));
      var dienThoai = String(HeaderUtils.getCell(row, colMap, "DienThoai", "")).replace(/^'/, "").trim();
      var diaChi = String(HeaderUtils.getCell(row, colMap, "DiaChi", "")).trim();
      var soTK = String(HeaderUtils.getCell(row, colMap, "SoTK", "")).replace(/^'/, "").trim();
      var kyTrich = Number(HeaderUtils.getCell(row, colMap, "KyTrichMacDinh", 0) || HeaderUtils.getCell(row, colMap, "KyTrichNo", 0) || HeaderUtils.getCell(row, colMap, "KyTrich", 0)) || 0;
      var trangThai = String(HeaderUtils.getCell(row, colMap, "TrangThai", "Hiệu lực")).trim();
      var ghiChu = String(HeaderUtils.getCell(row, colMap, "GhiChu", "")).trim();
      var ngayTao = formatGasDateTime(HeaderUtils.getCell(row, colMap, "NgayTao", ""));

      results.push({
        maKH: rawMaKH,
        hoTen: hoTen,
        tenKH: hoTen,
        cccd: cccd,
        soGTTT: cccd,
        ngayCap: ngayCap,
        dienThoai: dienThoai,
        diaChi: diaChi,
        soTK: soTK,
        kyTrich: kyTrich,
        kyTrichMacDinh: kyTrich,
        trangThai: trangThai,
        ghiChu: ghiChu,
        ngayTao: ngayTao
      });
    }

    CacheHelper.setCachedData('debit_registrations', results, 30);
    return { status: "success", data: results };
  },

  handleSaveDebitRegister: function(ss, data) {
    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("DANG_KY_TRICH_NO");
    }

    var maKHInput = String(data.maKH || "").replace(/^'/, "").trim();
    if (!maKHInput) {
      return { status: "error", message: "Mã khách hàng không được để trống!" };
    }

    var cleanCCCD = String(data.cccd || data.gttt || "").replace(/^'/, "").trim();
    var cleanSoTK = String(data.soTK || "").replace(/^'/, "").trim();
    var hoTen = String(data.hoTen || "").trim();
    var diaChi = String(data.diaChi || "").trim();
    var dienThoai = String(data.dienThoai || "").replace(/^'/, "").trim();
    var ngayCap = data.ngayCap ? parseGasDateToSheet(data.ngayCap) : "";
    var kyTrich = Number(data.kyTrichMacDinh !== undefined ? data.kyTrichMacDinh : (data.kyTrich || 0)) || 0;
    var trangThai = String(data.trangThai || "Hiệu lực").trim();
    var ghiChu = String(data.ghiChu || "").trim();

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var defaultHeaders = [
      "MaKH", "HoTen", "CCCD", "NgayCap", "DienThoai", "DiaChi", "SoTK", "KyTrichMacDinh", "TrangThai", "GhiChu", "NgayTao"
    ];

    var lastRow = sheet.getLastRow();
    var existingRowIndex = -1;

    if (lastRow > 1) {
      var allRows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
      for (var r = 0; r < allRows.length; r++) {
        var curMa = String(HeaderUtils.getCell(allRows[r], colMap, "MaKH", "")).replace(/^'/, "").trim();
        if (curMa === maKHInput) {
          existingRowIndex = r + 2;
          break;
        }
      }
    }

    if (existingRowIndex > 0) {
      // Cập nhật thông tin dòng hiện có
      if (hoTen) HeaderUtils.setCell(sheet, existingRowIndex, colMap, "HoTen", hoTen);
      if (cleanCCCD) HeaderUtils.setCell(sheet, existingRowIndex, colMap, "CCCD", "'" + cleanCCCD);
      if (ngayCap) HeaderUtils.setCell(sheet, existingRowIndex, colMap, "NgayCap", ngayCap);
      if (dienThoai) HeaderUtils.setCell(sheet, existingRowIndex, colMap, "DienThoai", "'" + dienThoai);
      if (diaChi) HeaderUtils.setCell(sheet, existingRowIndex, colMap, "DiaChi", diaChi);
      if (cleanSoTK) HeaderUtils.setCell(sheet, existingRowIndex, colMap, "SoTK", "'" + cleanSoTK);
      HeaderUtils.setCell(sheet, existingRowIndex, colMap, "KyTrichMacDinh", kyTrich);
      HeaderUtils.setCell(sheet, existingRowIndex, colMap, "TrangThai", trangThai);
      HeaderUtils.setCell(sheet, existingRowIndex, colMap, "GhiChu", ghiChu);

      CacheHelper.invalidateModuleCache('debit');
      return {
        status: "success",
        message: "Đã cập nhật thỏa thuận trích nợ tự động của khách hàng " + (hoTen || maKHInput) + "!",
        maKH: maKHInput
      };
    } else {
      // Thêm mới khách hàng đăng ký trích nợ
      var dict = {
        MaKH: "'" + maKHInput,
        HoTen: hoTen,
        CCCD: cleanCCCD ? ("'" + cleanCCCD) : "",
        NgayCap: ngayCap,
        DienThoai: dienThoai ? ("'" + dienThoai) : "",
        DiaChi: diaChi,
        SoTK: cleanSoTK ? ("'" + cleanSoTK) : "",
        KyTrichMacDinh: kyTrich,
        TrangThai: trangThai,
        GhiChu: ghiChu,
        NgayTao: new Date()
      };

      var newRow = HeaderUtils.dictToRow(dict, colMap, defaultHeaders);
      sheet.appendRow(newRow);

      CacheHelper.invalidateModuleCache('debit');
      return {
        status: "success",
        message: "Đăng ký dịch vụ trích nợ tự động cho khách hàng " + (hoTen || maKHInput) + " thành công!",
        maKH: maKHInput
      };
    }
  },

  handleToggleDebitRegisterStatus: function(ss, data) {
    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "error", message: "Không tìm thấy dữ liệu đăng ký trích nợ!" };
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var maKHInput = String(data.maKH || "").replace(/^'/, "").trim();
    var lastRow = sheet.getLastRow();
    var targetRow = -1;
    var currentStatus = "Hiệu lực";

    var allRows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    for (var i = 0; i < allRows.length; i++) {
      var curMa = String(HeaderUtils.getCell(allRows[i], colMap, "MaKH", "")).replace(/^'/, "").trim();
      if (curMa === maKHInput) {
        targetRow = i + 2;
        currentStatus = String(HeaderUtils.getCell(allRows[i], colMap, "TrangThai", "Hiệu lực")).trim();
        break;
      }
    }

    if (targetRow === -1) {
      return { status: "error", message: "Không tìm thấy hồ sơ đăng ký của khách hàng " + maKHInput };
    }

    var newStatus = data.newStatus;
    if (!newStatus) {
      newStatus = (currentStatus === "Hiệu lực" || currentStatus === "Hieu luc" || currentStatus === "ACTIVE") ? "Tạm ngưng" : "Hiệu lực";
    }

    HeaderUtils.setCell(sheet, targetRow, colMap, "TrangThai", newStatus);
    CacheHelper.invalidateModuleCache('debit');
    return {
      status: "success",
      message: "Đã chuyển trạng thái thỏa thuận trích nợ của KH " + maKHInput + " sang: " + newStatus,
      newStatus: newStatus
    };
  },

  handleDeleteDebitRegister: function(ss, data) {
    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "error", message: "Không tìm thấy dữ liệu đăng ký trích nợ!" };
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var maKHInput = String(data.maKH || "").replace(/^'/, "").trim();
    var lastRow = sheet.getLastRow();
    var targetRow = -1;

    var allRows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    for (var i = 0; i < allRows.length; i++) {
      var curMa = String(HeaderUtils.getCell(allRows[i], colMap, "MaKH", "")).replace(/^'/, "").trim();
      if (curMa === maKHInput) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) {
      return { status: "error", message: "Không tìm thấy hồ sơ đăng ký của khách hàng " + maKHInput };
    }

    sheet.deleteRow(targetRow);
    CacheHelper.invalidateModuleCache('debit');
    return { status: "success", message: "Đã xóa thỏa thuận trích nợ tự động của khách hàng " + maKHInput + " thành công!" };
  },

  // ======================================================================================
  // 2. CẤU HÌNH CÁC ĐỢT TRÍCH NỢ LINH HOẠT THEO NGÀY VAY TRONG THÁNG
  // ======================================================================================

  handleGetDebitConfigs: function(ss) {
    var cached = CacheHelper.getCachedData('debit_configs');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("CAU_HINH_DOT_TRICH_NO");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("CAU_HINH_DOT_TRICH_NO");
    }

    var defaultConfigs = [
      { maDotConfig: "DOT_01", tenDot: "Đợt 1 - Kỳ ngày 05", tuNgayVay: 26, denNgayVay: 4, ngayTrichHangThang: 5, trangThai: "ACTIVE", ghiChu: "Áp dụng cho HĐTD giải ngân ngày 26 đến ngày 04" },
      { maDotConfig: "DOT_02", tenDot: "Đợt 2 - Kỳ ngày 15", tuNgayVay: 5, denNgayVay: 15, ngayTrichHangThang: 15, trangThai: "ACTIVE", ghiChu: "Áp dụng cho HĐTD giải ngân ngày 05 đến ngày 15" },
      { maDotConfig: "DOT_03", tenDot: "Đợt 3 - Kỳ ngày 25", tuNgayVay: 16, denNgayVay: 25, ngayTrichHangThang: 25, trangThai: "ACTIVE", ghiChu: "Áp dụng cho HĐTD giải ngân ngày 16 đến ngày 25" }
    ];

    if (!sheet || sheet.getLastRow() <= 1) {
      CacheHelper.setCachedData('debit_configs', defaultConfigs, 60);
      return { status: "success", data: defaultConfigs };
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    var results = [];

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var ma = String(HeaderUtils.getCell(r, colMap, "MaDotConfig", "")).trim();
      if (!ma) continue;

      results.push({
        maDotConfig: ma,
        tenDot: String(HeaderUtils.getCell(r, colMap, "TenDot", "")).trim(),
        tuNgayVay: Number(HeaderUtils.getCell(r, colMap, "TuNgayVay", 1)) || 1,
        denNgayVay: Number(HeaderUtils.getCell(r, colMap, "DenNgayVay", 31)) || 31,
        ngayTrichHangThang: Number(HeaderUtils.getCell(r, colMap, "NgayTrichHangThang", 15)) || 15,
        trangThai: String(HeaderUtils.getCell(r, colMap, "TrangThai", "ACTIVE")).trim(),
        ghiChu: String(HeaderUtils.getCell(r, colMap, "GhiChu", "")).trim()
      });
    }

    if (results.length === 0) results = defaultConfigs;

    CacheHelper.setCachedData('debit_configs', results, 60);
    return { status: "success", data: results };
  },

  handleSaveDebitConfig: function(ss, data) {
    var sheet = ss.getSheetByName("CAU_HINH_DOT_TRICH_NO");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("CAU_HINH_DOT_TRICH_NO");
    }

    var maDotConfig = String(data.maDotConfig || ("DOT_" + Utilities.formatDate(new Date(), "GMT+7", "yyMMdd_HHmmss"))).trim();
    var tenDot = String(data.tenDot || "Đợt Trích Nợ").trim();
    var tuNgayVay = Number(data.tuNgayVay) || 1;
    var denNgayVay = Number(data.denNgayVay) || 31;
    var ngayTrichHangThang = Number(data.ngayTrichHangThang) || 15;
    var trangThai = String(data.trangThai || "ACTIVE").trim();
    var ghiChu = String(data.ghiChu || "").trim();

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var defaultHeaders = ["MaDotConfig", "TenDot", "TuNgayVay", "DenNgayVay", "NgayTrichHangThang", "TrangThai", "GhiChu"];

    var lastRow = sheet.getLastRow();
    var targetRow = -1;

    if (lastRow > 1) {
      var allRows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
      for (var r = 0; r < allRows.length; r++) {
        var curMa = String(HeaderUtils.getCell(allRows[r], colMap, "MaDotConfig", "")).trim();
        if (curMa === maDotConfig) {
          targetRow = r + 2;
          break;
        }
      }
    }

    var dict = {
      MaDotConfig: maDotConfig,
      TenDot: tenDot,
      TuNgayVay: tuNgayVay,
      DenNgayVay: denNgayVay,
      NgayTrichHangThang: ngayTrichHangThang,
      TrangThai: trangThai,
      GhiChu: ghiChu
    };

    if (targetRow > 0) {
      HeaderUtils.setCell(sheet, targetRow, colMap, "TenDot", tenDot);
      HeaderUtils.setCell(sheet, targetRow, colMap, "TuNgayVay", tuNgayVay);
      HeaderUtils.setCell(sheet, targetRow, colMap, "DenNgayVay", denNgayVay);
      HeaderUtils.setCell(sheet, targetRow, colMap, "NgayTrichHangThang", ngayTrichHangThang);
      HeaderUtils.setCell(sheet, targetRow, colMap, "TrangThai", trangThai);
      HeaderUtils.setCell(sheet, targetRow, colMap, "GhiChu", ghiChu);
    } else {
      var row = HeaderUtils.dictToRow(dict, colMap, defaultHeaders);
      sheet.appendRow(row);
    }

    CacheHelper.invalidateModuleCache('debit');
    return {
      status: "success",
      message: "Lưu cấu hình đợt trích nợ (" + tenDot + ") thành công!",
      maDotConfig: maDotConfig
    };
  },

  // ======================================================================================
  // 3. QUẢN LÝ CÁC ĐỢT TRÍCH NỢ ĐÃ LẬP (DEBIT BATCHES & DETAILS)
  // ======================================================================================

  handleGetDebitBatches: function(ss) {
    var cached = CacheHelper.getCachedData('debit_batches');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("DOT_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    var results = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var maDot = String(HeaderUtils.getCell(row, colMap, "MaDot", "")).trim();
      if (!maDot) continue;

      results.push({
        maDot: maDot,
        thangNam: String(HeaderUtils.getCell(row, colMap, "ThangNam", "")).trim(),
        kyTrich: Number(HeaderUtils.getCell(row, colMap, "KyTrichNo", 1) || HeaderUtils.getCell(row, colMap, "KyTrich", 1)) || 1,
        tongSoHD: Number(HeaderUtils.getCell(row, colMap, "TongSoHD", 0)) || 0,
        tongSoKH: Number(HeaderUtils.getCell(row, colMap, "TongSoKH", 0)) || 0,
        tongPhaiThu: Number(HeaderUtils.getCell(row, colMap, "TongPhaiThu", 0)) || 0,
        tongDaTrich: Number(HeaderUtils.getCell(row, colMap, "TongDaTrich", 0)) || 0,
        tongConNo: Number(HeaderUtils.getCell(row, colMap, "TongConNo", 0)) || 0,
        trangThai: String(HeaderUtils.getCell(row, colMap, "TrangThai", "CHO_TRICH_NO")).trim(),
        ngayTao: formatGasDateTime(HeaderUtils.getCell(row, colMap, "NgayTao", ""))
      });
    }

    // Mới nhất lên đầu
    results.reverse();

    CacheHelper.setCachedData('debit_batches', results, 30);
    return { status: "success", data: results };
  },

  handleCreateDebitBatch: function(ss, data) {
    var thangNam = String(data.thangNam || Utilities.formatDate(new Date(), "GMT+7", "yyyyMM")).replace(/[^0-9]/g, "");
    var kyTrich = Number(data.kyTrich) || 1;
    var maDot = String(data.maDot || ("DOT-" + thangNam + "-K" + kyTrich)).trim();

    var sDot = ss.getSheetByName("DOT_TRICH_NO");
    var sDetail = ss.getSheetByName("LICH_SU_TRICH_NO") || ss.getSheetByName("CHI_TIET_TRICH_NO") || ss.getSheetByName("LICH_SU_GIAO_DICH");

    if (!sDot || !sDetail) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sDot = ss.getSheetByName("DOT_TRICH_NO");
      sDetail = ss.getSheetByName("LICH_SU_TRICH_NO");
    }

    var items = data.chiTietDanhSach || [];
    if (!items || items.length === 0) {
      return { status: "error", message: "Danh sách hợp đồng trích nợ được chọn rỗng!" };
    }

    var detailColMap = HeaderUtils.getHeaderMap(sDetail);
    var detailDefaultHeaders = [
      "MaDot", "SoHDTD", "MaKH", "TenKH", "SoTK", "TongTienPhaiThu", "DaTrich", "ConNo", "TrangThaiCore", "MaGiaoDichCore", "NgayTrich"
    ];

    var totalPhaiThu = 0;
    var distinctKHMaps = {};
    var newDetailRows = [];
    var nowTime = new Date();

    for (var k = 0; k < items.length; k++) {
      var it = items[k];
      var amt = Number(it.soTienTrich !== undefined ? it.soTienTrich : (it.tongDuKien || it.tongTien || 0)) || 0;
      totalPhaiThu += amt;

      var cleanMaKH = String(it.maKH || "").replace(/^'/, "").trim();
      if (cleanMaKH) distinctKHMaps[cleanMaKH] = true;

      var dict = {
        MaDot: maDot,
        SoHDTD: String(it.soHDTD || "").trim(),
        MaKH: "'" + cleanMaKH,
        TenKH: String(it.hoTen || it.tenKH || "").trim(),
        SoTK: "'" + String(it.soTK || "").replace(/^'/, "").trim(),
        TongTienPhaiThu: amt,
        DaTrich: 0,
        ConNo: amt,
        TrangThaiCore: "CHO_TRICH_NO",
        MaGiaoDichCore: "",
        NgayTrich: nowTime
      };

      newDetailRows.push(HeaderUtils.dictToRow(dict, detailColMap, detailDefaultHeaders));
    }

    // Ghi hàng loạt vào bảng chi tiết LICH_SU_TRICH_NO
    if (newDetailRows.length > 0) {
      sDetail.getRange(sDetail.getLastRow() + 1, 1, newDetailRows.length, newDetailRows[0].length).setValues(newDetailRows);
    }

    // Ghi vào bảng Master DOT_TRICH_NO
    var dotColMap = HeaderUtils.getHeaderMap(sDot);
    var dotDefaultHeaders = [
      "MaDot", "ThangNam", "KyTrichNo", "TongSoHD", "TongSoKH", "TongPhaiThu", "TongDaTrich", "TongConNo", "TrangThai", "NgayTao"
    ];

    var countKH = Object.keys(distinctKHMaps).length;
    var countHD = items.length;

    var dotDict = {
      MaDot: maDot,
      ThangNam: thangNam,
      KyTrichNo: kyTrich,
      TongSoHD: countHD,
      TongSoKH: countKH,
      TongPhaiThu: totalPhaiThu,
      TongDaTrich: 0,
      TongConNo: totalPhaiThu,
      TrangThai: "CHO_TRICH_NO",
      NgayTao: nowTime
    };

    var dotRow = HeaderUtils.dictToRow(dotDict, dotColMap, dotDefaultHeaders);
    sDot.appendRow(dotRow);

    CacheHelper.invalidateModuleCache('debit');

    return {
      status: "success",
      message: "Khởi tạo và chốt đợt trích nợ " + maDot + " thành công! Tổng số tiền: " + totalPhaiThu.toLocaleString('vi-VN') + " đ (" + countKH + " khách hàng, " + countHD + " hợp đồng).",
      summary: {
        maDot: maDot,
        thangNam: thangNam,
        kyTrich: kyTrich,
        tongSoKH: countKH,
        tongSoHD: countHD,
        tongPhaiThu: totalPhaiThu
      }
    };
  }
};
