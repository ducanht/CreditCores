/**
 * CONTROLLER THẨM ĐỊNH TÍN DỤNG & TÀI SẢN ĐẢM BẢO
 */

var AppraisalController = {
  handleGetAppraisals: function(ss) {
    var cached = CacheHelper.getCachedData('appraisals_list');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("BAO_CAO_THAM_DINH");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 20).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      results.push({
        maBCTD: values[i][0],
        maKH: values[i][1],
        hoTen: values[i][2],
        deXuatVay: values[i][3],
        duyetVay: values[i][4],
        thoiHanThang: values[i][5],
        laiSuatDuyet: values[i][6],
        thuNhapThang: values[i][7],
        xepHangCIC: values[i][8],
        loaiTSBD: values[i][9],
        chuSoHuuTSBD: values[i][10],
        moTaTSBD: values[i][11],
        giaTriTSBD: values[i][12],
        tyLeLTV: values[i][13],
        hinhAnhTSBD: values[i][14],
        hinhAnhThamDinh: values[i][15],
        mucDoRuiRo: values[i][16],
        ketLuan: values[i][17],
        ngayLap: formatGasDate(values[i][18]),
        canBoThamDinh: values[i][19]
      });
    }

    CacheHelper.setCachedData('appraisals_list', results, 30);
    return { status: "success", data: results };
  },

  handleSaveAppraisalReport: function(ss, data) {
    var sheet = ss.getSheetByName("BAO_CAO_THAM_DINH");
    if (!sheet) return { status: "error", message: "Không tìm thấy Sheet BAO_CAO_THAM_DINH" };

    var maBCTD = "BCTD-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss");
    var row = [
      maBCTD,
      data.maKH || "",
      data.hoTen || "",
      Number(data.deXuatVay) || 0,
      Number(data.duyetVay) || 0,
      Number(data.thoiHanThang) || 12,
      Number(data.laiSuatDuyet) || 0,
      Number(data.thuNhapThang) || 0,
      data.xepHangCIC || "Hang A",
      data.loaiTSBD || "",
      data.chuSoHuuTSBD || "",
      data.moTaTSBD || "",
      Number(data.giaTriTSBD) || 0,
      data.tyLeLTV || "",
      data.hinhAnhTSBD || "",
      data.hinhAnhThamDinh || "",
      data.mucDoRuiRo || "Thap",
      data.ketLuan || "Dong y cap tin dung",
      new Date(),
      data.canBoThamDinh || "Lê Văn Tín"
    ];

    sheet.appendRow(row);
    CacheHelper.invalidateModuleCache('appraisal');
    return { status: "success", message: "Đã lưu Báo cáo thẩm định tín dụng thành công!", maBCTD: maBCTD };
  }
};
