/**
 * CONTROLLER QUẢN LÝ ĐĂNG KÝ TRÍCH NỢ & KHỞI TẠO ĐỢT TRÍCH NỢ
 */

var DebitController = {
  handleGetDebitRegistrations: function(ss) {
    var cached = CacheHelper.getCachedData('debit_registrations');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      results.push({
        maKH: String(values[i][0]),
        hoTen: String(values[i][1]),
        gttt: String(values[i][2]),
        soTK: String(values[i][3]),
        diaChi: String(values[i][4]),
        kyTrich: Number(values[i][5]) || 1,
        trangThai: String(values[i][6]) || "Hiệu lực",
        ghiChu: String(values[i][7] || "")
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

    var row = [
      data.maKH || "",
      data.hoTen || "",
      "'" + (data.gttt || ""),
      "'" + (data.soTK || ""),
      data.diaChi || "",
      Number(data.kyTrich) || 1,
      data.trangThai || "Hiệu lực",
      data.ghiChu || "",
      new Date()
    ];

    sheet.appendRow(row);
    CacheHelper.invalidateModuleCache('debit');
    return { status: "success", message: "Đăng ký dịch vụ trích nợ tự động thành công!" };
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
