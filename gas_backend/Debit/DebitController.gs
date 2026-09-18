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

    var numRows = sheet.getLastRow() - 1;
    var numCols = Math.min(9, sheet.getLastColumn());
    var values = sheet.getRange(2, 1, numRows, numCols).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var rawMaKH = String(row[0] || "").trim();
      if (!rawMaKH) continue;

      results.push({
        maKH: rawMaKH,
        hoTen: String(row[1] || "").trim(),
        gttt: String(row[2] || "").replace(/^'/, "").trim(),
        soTK: String(row[3] || "").replace(/^'/, "").trim(),
        diaChi: String(row[4] || "").trim(),
        kyTrich: Number(row[5]) || 1,
        trangThai: String(row[6] || "Hiệu lực").trim(),
        ghiChu: String(row[7] || "").trim(),
        ngayTao: row[8] ? formatGasDateTime(row[8]) : ""
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

  handleUpdateDebitRegister: function(ss, data) {
    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "error", message: "Không tìm thấy dữ liệu đăng ký trích nợ!" };
    }

    var maKHInput = String(data.maKH || "").trim();
    var lastRow = sheet.getLastRow();
    var targetRow = -1;
    var colMaKH = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

    for (var i = 0; i < colMaKH.length; i++) {
      var cur = String(colMaKH[i][0] || "").trim();
      if (cur === maKHInput || cur.replace(/^'/, "") === maKHInput.replace(/^'/, "")) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) {
      return { status: "error", message: "Không tìm thấy khách hàng " + maKHInput + " trong danh sách đăng ký!" };
    }

    if (data.soTK !== undefined) {
      var cleanSoTK = String(data.soTK).replace(/^'/, "").trim();
      sheet.getRange(targetRow, 4).setValue("'" + cleanSoTK);
    }
    if (data.kyTrich !== undefined) {
      sheet.getRange(targetRow, 6).setValue(Number(data.kyTrich) || 1);
    }
    if (data.trangThai !== undefined) {
      sheet.getRange(targetRow, 7).setValue(String(data.trangThai).trim());
    }
    if (data.ghiChu !== undefined) {
      sheet.getRange(targetRow, 8).setValue(String(data.ghiChu).trim());
    }

    CacheHelper.invalidateModuleCache('debit');
    return { status: "success", message: "Cập nhật đăng ký trích nợ thành công!" };
  },

  handleToggleDebitRegisterStatus: function(ss, data) {
    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "error", message: "Không tìm thấy dữ liệu đăng ký trích nợ!" };
    }

    var maKHInput = String(data.maKH || "").trim();
    var lastRow = sheet.getLastRow();
    var targetRow = -1;
    var currentStatus = "Hiệu lực";

    var colData = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    for (var i = 0; i < colData.length; i++) {
      var cur = String(colData[i][0] || "").trim();
      if (cur === maKHInput || cur.replace(/^'/, "") === maKHInput.replace(/^'/, "")) {
        targetRow = i + 2;
        currentStatus = String(colData[i][6] || "Hiệu lực").trim();
        break;
      }
    }

    if (targetRow === -1) {
      return { status: "error", message: "Không tìm thấy khách hàng " + maKHInput + " trong danh sách đăng ký!" };
    }

    var newStatus = data.newStatus;
    if (!newStatus) {
      newStatus = (currentStatus === "Hiệu lực" || currentStatus === "Hieu luc") ? "Tạm ngưng" : "Hiệu lực";
    }

    sheet.getRange(targetRow, 7).setValue(newStatus);
    CacheHelper.invalidateModuleCache('debit');
    return { status: "success", message: "Đã chuyển trạng thái sang: " + newStatus, newStatus: newStatus };
  },

  handleDeleteDebitRegister: function(ss, data) {
    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "error", message: "Không tìm thấy dữ liệu đăng ký trích nợ!" };
    }

    var maKHInput = String(data.maKH || "").trim();
    var lastRow = sheet.getLastRow();
    var targetRow = -1;

    var colMaKH = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < colMaKH.length; i++) {
      var cur = String(colMaKH[i][0] || "").trim();
      if (cur === maKHInput || cur.replace(/^'/, "") === maKHInput.replace(/^'/, "")) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) {
      return { status: "error", message: "Không tìm thấy khách hàng " + maKHInput + " trong danh sách đăng ký!" };
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

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.min(10, sheet.getLastColumn())).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      results.push({
        maDot: values[i][0],
        thangNam: values[i][1],
        kyTrich: Number(values[i][2]),
        tongPhaiThu: Number(values[i][3]) || 0,
        tongDaTrich: Number(values[i][4]) || 0,
        tongConNo: Number(values[i][5]) || 0,
        tongSoKH: Number(values[i][6]) || 0,
        trangThai: values[i][7] || "CHO_TRICH_NO",
        ngayTao: formatGasDateTime(values[i][8])
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
