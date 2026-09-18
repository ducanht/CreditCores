/**
 * ========================================================================================
 * CREDITCORES - DEBITCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module DebitController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var DebitController = {
  handleGetDebitRegistrations: function(ss) {
    var cached = CacheHelper.getCachedData('debit_registrations');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
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
      var rawSoHD = String(HeaderUtils.getCell(row, colMap, "SoHDTD", "")).trim();
      if (!rawMaKH && !rawSoHD) continue;

      results.push({
        soHDTD: rawSoHD,
        maKH: rawMaKH,
        hoTen: String(HeaderUtils.getCell(row, colMap, "TenKH", "") || HeaderUtils.getCell(row, colMap, "HoTen", "")).trim(),
        tenKH: String(HeaderUtils.getCell(row, colMap, "TenKH", "") || HeaderUtils.getCell(row, colMap, "HoTen", "")).trim(),
        soTK: String(HeaderUtils.getCell(row, colMap, "SoTK", "")).replace(/^'/, "").trim(),
        ngayVay: formatGasDate(HeaderUtils.getCell(row, colMap, "NgayVay", "")),
        traLaiDenNgay: formatGasDate(HeaderUtils.getCell(row, colMap, "TraLaiDenNgay", "")),
        laiSuat: Number(HeaderUtils.getCell(row, colMap, "LaiSuat", 0)) || 0,
        soTienLai: Number(HeaderUtils.getCell(row, colMap, "SoTienLai", 0)) || 0,
        soTienNo: Number(HeaderUtils.getCell(row, colMap, "SoTienNo", 0)) || 0,
        soGoc: Number(HeaderUtils.getCell(row, colMap, "SoGoc", 0)) || 0,
        tongTien: Number(HeaderUtils.getCell(row, colMap, "TongTien", 0)) || 0,
        kyTrich: Number(HeaderUtils.getCell(row, colMap, "KyTrichNo", 1) || HeaderUtils.getCell(row, colMap, "KyTrich", 1)) || 1,
        kyTrichNo: Number(HeaderUtils.getCell(row, colMap, "KyTrichNo", 1) || HeaderUtils.getCell(row, colMap, "KyTrich", 1)) || 1,
        trangThai: String(HeaderUtils.getCell(row, colMap, "TrangThai", "Hiệu lực")).trim(),
        ghiChu: String(HeaderUtils.getCell(row, colMap, "GhiChu", "")).trim(),
        ngayTao: HeaderUtils.getCell(row, colMap, "NgayTao", "") ? formatGasDateTime(HeaderUtils.getCell(row, colMap, "NgayTao", "")) : ""
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

    var maKHInput = String(data.maKH || "").trim();
    if (!maKHInput) {
      return { status: "error", message: "Mã khách hàng không được để trống!" };
    }

    var cleanGTTT = String(data.gttt || "").replace(/^'/, "").trim();
    var cleanSoTK = String(data.soTK || "").replace(/^'/, "").trim();

    // Kiểm tra xem khách hàng đã tồn tại trong danh sách chưa
    var lastRow = sheet.getLastRow();
    var existingRowIndex = -1;
    if (lastRow > 1) {
      var colMaKH = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var r = 0; r < colMaKH.length; r++) {
        var currentMaKH = String(colMaKH[r][0] || "").trim();
        if (currentMaKH === maKHInput || currentMaKH.replace(/^'/, "") === maKHInput.replace(/^'/, "")) {
          existingRowIndex = r + 2;
          break;
        }
      }
    }

    if (existingRowIndex > 0) {
      // Đã tồn tại -> Cập nhật thông tin dòng hiện có
      sheet.getRange(existingRowIndex, 2).setValue(data.hoTen || "");
      sheet.getRange(existingRowIndex, 3).setValue("'" + cleanGTTT);
      sheet.getRange(existingRowIndex, 4).setValue("'" + cleanSoTK);
      sheet.getRange(existingRowIndex, 5).setValue(data.diaChi || "");
      sheet.getRange(existingRowIndex, 6).setValue(Number(data.kyTrich) || 1);
      sheet.getRange(existingRowIndex, 7).setValue(data.trangThai || "Hiệu lực");
      sheet.getRange(existingRowIndex, 8).setValue(data.ghiChu || "");
      CacheHelper.invalidateModuleCache('debit');
      return { status: "success", message: "Đã cập nhật thỏa thuận trích nợ tự động của khách hàng " + (data.hoTen || maKHInput) };
    } else {
      // Chưa có -> Thêm dòng mới
      var row = [
        maKHInput.startsWith("'") ? maKHInput : ("'" + maKHInput),
        data.hoTen || "",
        "'" + cleanGTTT,
        "'" + cleanSoTK,
        data.diaChi || "",
        Number(data.kyTrich) || 1,
        data.trangThai || "Hiệu lực",
        data.ghiChu || "",
        new Date()
      ];
      sheet.appendRow(row);
      CacheHelper.invalidateModuleCache('debit');
      return { status: "success", message: "Đăng ký dịch vụ trích nợ tự động thành công!" };
    }
  },

  handleSaveBatchDebitRegister: function(ss, data) {
    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("DANG_KY_TRICH_NO");
    }

    var items = data.items || (Array.isArray(data) ? data : []);
    if (!items || items.length === 0) {
      return { status: "error", message: "Danh sách hợp đồng / khách hàng đăng ký rỗng!" };
    }

    var defaultKyTrich = Number(data.kyTrich) || 1;
    var defaultTrangThai = data.trangThai || "Hiệu lực";
    var defaultGhiChu = data.ghiChu || "";

    var lastRow = sheet.getLastRow();
    var existingRowMap = {}; // cleanMaKH -> rowIndex
    if (lastRow > 1) {
      var colMaKH = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var r = 0; r < colMaKH.length; r++) {
        var cleanKey = String(colMaKH[r][0] || "").replace(/^'/, "").trim();
        if (cleanKey) {
          existingRowMap[cleanKey] = r + 2;
        }
      }
    }

    var updatedCount = 0;
    var newRows = [];
    var nowTime = new Date();

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var rawMaKH = String(item.maKH || "").trim();
      var cleanMaKH = rawMaKH.replace(/^'/, "");
      if (!cleanMaKH) continue;

      var cleanGTTT = String(item.gttt || item.cccd || "").replace(/^'/, "").trim();
      var cleanSoTK = String(item.soTK || "").replace(/^'/, "").trim();
      var hoTen = String(item.hoTen || "").trim();
      var diaChi = String(item.diaChi || "").trim();
      var kyTrich = Number(item.kyTrich || defaultKyTrich) || 1;
      var trangThai = String(item.trangThai || defaultTrangThai).trim();
      var ghiChu = String(item.ghiChu || defaultGhiChu).trim();

      if (existingRowMap[cleanMaKH]) {
        // Đã tồn tại -> Cập nhật thông tin dòng cũ
        var rowIdx = existingRowMap[cleanMaKH];
        if (hoTen) sheet.getRange(rowIdx, 2).setValue(hoTen);
        if (cleanGTTT) sheet.getRange(rowIdx, 3).setValue("'" + cleanGTTT);
        if (cleanSoTK) sheet.getRange(rowIdx, 4).setValue("'" + cleanSoTK);
        if (diaChi) sheet.getRange(rowIdx, 5).setValue(diaChi);
        sheet.getRange(rowIdx, 6).setValue(kyTrich);
        sheet.getRange(rowIdx, 7).setValue(trangThai);
        if (ghiChu) sheet.getRange(rowIdx, 8).setValue(ghiChu);
        updatedCount++;
      } else {
        // Chưa có -> Chuẩn bị dòng mới
        newRows.push([
          "'" + cleanMaKH,
          hoTen,
          "'" + cleanGTTT,
          "'" + cleanSoTK,
          diaChi,
          kyTrich,
          trangThai,
          ghiChu,
          nowTime
        ]);
        // Cập nhật map tạm để tránh trùng nếu trong cùng 1 lần submit có 2 HĐTD của cùng 1 KH
        existingRowMap[cleanMaKH] = lastRow + newRows.length;
      }
    }

    if (newRows.length > 0) {
      sheet.getRange(lastRow + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    }

    CacheHelper.invalidateModuleCache('debit');

    return {
      status: "success",
      message: "Đã thêm mới " + newRows.length + " và cập nhật " + updatedCount + " thỏa thuận trích nợ tự động thành công!",
      newCount: newRows.length,
      updatedCount: updatedCount,
      totalCount: newRows.length + updatedCount
    };
  },

  handleUpdateDebitRegister: function(ss, data) {
    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "error", message: "Không tìm thấy dữ liệu đăng ký trích nợ!" };
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var maKHInput = String(data.maKH || "").replace(/^'/, "").trim();
    var soHDTDInput = String(data.soHDTD || "").trim();
    var lastRow = sheet.getLastRow();
    var targetRow = -1;
    var allRows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

    for (var i = 0; i < allRows.length; i++) {
      var curMa = String(HeaderUtils.getCell(allRows[i], colMap, "MaKH", "")).replace(/^'/, "").trim();
      var curHD = String(HeaderUtils.getCell(allRows[i], colMap, "SoHDTD", "")).trim();
      if ((soHDTDInput && curHD === soHDTDInput) || (maKHInput && curMa === maKHInput)) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) {
      return { status: "error", message: "Không tìm thấy hồ sơ đăng ký trích nợ!" };
    }

    if (data.soTK !== undefined) {
      HeaderUtils.setCell(sheet, targetRow, colMap, "SoTK", "'" + String(data.soTK).replace(/^'/, "").trim());
    }
    if (data.kyTrich !== undefined || data.kyTrichNo !== undefined) {
      var kt = Number(data.kyTrich || data.kyTrichNo) || 1;
      HeaderUtils.setCell(sheet, targetRow, colMap, "KyTrichNo", kt);
      HeaderUtils.setCell(sheet, targetRow, colMap, "KyTrich", kt);
    }
    if (data.soTienLai !== undefined) {
      HeaderUtils.setCell(sheet, targetRow, colMap, "SoTienLai", Number(data.soTienLai) || 0);
    }
    if (data.soTienNo !== undefined) {
      HeaderUtils.setCell(sheet, targetRow, colMap, "SoTienNo", Number(data.soTienNo) || 0);
    }
    if (data.soGoc !== undefined) {
      HeaderUtils.setCell(sheet, targetRow, colMap, "SoGoc", Number(data.soGoc) || 0);
    }
    if (data.tongTien !== undefined) {
      HeaderUtils.setCell(sheet, targetRow, colMap, "TongTien", Number(data.tongTien) || 0);
    }
    if (data.trangThai !== undefined) {
      HeaderUtils.setCell(sheet, targetRow, colMap, "TrangThai", String(data.trangThai).trim());
    }
    if (data.ghiChu !== undefined) {
      HeaderUtils.setCell(sheet, targetRow, colMap, "GhiChu", String(data.ghiChu).trim());
    }

    CacheHelper.invalidateModuleCache('debit');
    return { status: "success", message: "Cập nhật đăng ký trích nợ thành công!" };
  },

  handleToggleDebitRegisterStatus: function(ss, data) {
    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "error", message: "Không tìm thấy dữ liệu đăng ký trích nợ!" };
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var maKHInput = String(data.maKH || "").replace(/^'/, "").trim();
    var soHDTDInput = String(data.soHDTD || "").trim();
    var lastRow = sheet.getLastRow();
    var targetRow = -1;
    var currentStatus = "Hiệu lực";

    var allRows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    for (var i = 0; i < allRows.length; i++) {
      var curMa = String(HeaderUtils.getCell(allRows[i], colMap, "MaKH", "")).replace(/^'/, "").trim();
      var curHD = String(HeaderUtils.getCell(allRows[i], colMap, "SoHDTD", "")).trim();
      if ((soHDTDInput && curHD === soHDTDInput) || (maKHInput && curMa === maKHInput)) {
        targetRow = i + 2;
        currentStatus = String(HeaderUtils.getCell(allRows[i], colMap, "TrangThai", "Hiệu lực")).trim();
        break;
      }
    }

    if (targetRow === -1) {
      return { status: "error", message: "Không tìm thấy hồ sơ đăng ký trích nợ!" };
    }

    var newStatus = data.newStatus;
    if (!newStatus) {
      newStatus = (currentStatus === "Hiệu lực" || currentStatus === "Hieu luc" || currentStatus === "HOAT_DONG") ? "Tạm ngưng" : "Hiệu lực";
    }

    HeaderUtils.setCell(sheet, targetRow, colMap, "TrangThai", newStatus);
    CacheHelper.invalidateModuleCache('debit');
    return { status: "success", message: "Đã chuyển trạng thái sang: " + newStatus, newStatus: newStatus };
  },

  handleDeleteDebitRegister: function(ss, data) {
    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "error", message: "Không tìm thấy dữ liệu đăng ký trích nợ!" };
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var maKHInput = String(data.maKH || "").replace(/^'/, "").trim();
    var soHDTDInput = String(data.soHDTD || "").trim();
    var lastRow = sheet.getLastRow();
    var targetRow = -1;

    var allRows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    for (var i = 0; i < allRows.length; i++) {
      var curMa = String(HeaderUtils.getCell(allRows[i], colMap, "MaKH", "")).replace(/^'/, "").trim();
      var curHD = String(HeaderUtils.getCell(allRows[i], colMap, "SoHDTD", "")).trim();
      if ((soHDTDInput && curHD === soHDTDInput) || (maKHInput && curMa === maKHInput)) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) {
      return { status: "error", message: "Không tìm thấy hồ sơ đăng ký trích nợ!" };
    }

    sheet.deleteRow(targetRow);
    CacheHelper.invalidateModuleCache('debit');
    return { status: "success", message: "Đã xóa thỏa thuận trích nợ tự động thành công!" };
  },

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
        tongPhaiThu: Number(HeaderUtils.getCell(row, colMap, "TongPhaiThu", 0)) || 0,
        tongDaTrich: Number(HeaderUtils.getCell(row, colMap, "TongDaTrich", 0)) || 0,
        tongConNo: Number(HeaderUtils.getCell(row, colMap, "TongConNo", 0)) || 0,
        tongSoKH: Number(HeaderUtils.getCell(row, colMap, "TongSoKH", 0)) || 0,
        tongSoHD: Number(HeaderUtils.getCell(row, colMap, "TongSoHD", 0)) || 0,
        trangThai: String(HeaderUtils.getCell(row, colMap, "TrangThai", "CHO_TRICH_NO")).trim(),
        ngayTao: HeaderUtils.getCell(row, colMap, "NgayTao", "") ? formatGasDateTime(HeaderUtils.getCell(row, colMap, "NgayTao", "")) : ""
      });
    }

    CacheHelper.setCachedData('debit_batches', results, 30);
    return { status: "success", data: results };
  },

  handleCreateDebitBatch: function(ss, data) {
    var thangNam = data.thangNam || Utilities.formatDate(new Date(), "GMT+7", "yyyyMM");
    var kyTrich = Number(data.kyTrich) || 1;
    var maDot = "DOT-" + thangNam + "-K" + kyTrich;

    var sDot = ss.getSheetByName("DOT_TRICH_NO");
    var sDetail = ss.getSheetByName("CHI_TIET_TRICH_NO") || ss.getSheetByName("LICH_SU_GIAO_DICH");

    if (!sDot || !sDetail) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sDot = ss.getSheetByName("DOT_TRICH_NO");
      sDetail = ss.getSheetByName("CHI_TIET_TRICH_NO");
    }

    var totalPhaiThu = 0;
    var count = 0;
    var newDetailRows = [];

    // Trường hợp 1: Có danh sách chi tiết được chọn và điều chỉnh số tiền từ giao diện
    if (data.chiTietDanhSach && Array.isArray(data.chiTietDanhSach) && data.chiTietDanhSach.length > 0) {
      for (var k = 0; k < data.chiTietDanhSach.length; k++) {
        var item = data.chiTietDanhSach[k];
        var amt = Number(item.soTienTrich) || 0;
        totalPhaiThu += amt;
        count++;

        newDetailRows.push([
          maDot,
          item.maKH || "",
          item.hoTen || "",
          "'" + (item.gttt || ""),
          "'" + (item.soTK || ""),
          item.soHDTD || "",
          Number(item.tongDuNo) || 0,
          Number(item.laiPhatSinh) || 0,
          Number(item.gocDenHan) || 0,
          amt,
          0,
          amt,
          "CHO_XU_LY",
          "",
          new Date()
        ]);
      }
    }

    // Ghi hàng loạt vào bảng chi tiết
    if (newDetailRows.length > 0) {
      sDetail.getRange(sDetail.getLastRow() + 1, 1, newDetailRows.length, newDetailRows[0].length).setValues(newDetailRows);
    }

    // Ghi vào bảng Master Đợt trích nợ
    sDot.appendRow([
      maDot,
      thangNam,
      kyTrich,
      totalPhaiThu,
      0,
      totalPhaiThu,
      count,
      "CHO_TRICH_NO",
      new Date(),
      ""
    ]);

    CacheHelper.invalidateModuleCache('debit');

    return {
      status: "success",
      message: "Khởi tạo đợt trích nợ " + maDot + " thành công với " + count + " khách hàng!",
      maDot: maDot,
      totalPhaiThu: totalPhaiThu
    };
  }
};
