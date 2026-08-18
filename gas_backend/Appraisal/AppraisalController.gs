/**
 * CONTROLLER THẨM ĐỊNH TÍN DỤNG, THÔNG TIN CIC & Ý KIẾN PHÊ DUYỆT ĐA CẤP
 */

var AppraisalController = {
  handleGetAppraisals: function(ss) {
    var cached = CacheHelper.getCachedData('appraisals_list');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("BAO_CAO_THAM_DINH");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.max(25, sheet.getLastColumn())).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      var approvalOpinions = [];
      try {
        approvalOpinions = JSON.parse(values[i][20] || "[]");
      } catch(e) {}

      results.push({
        maBCTD: values[i][0],
        maKH: values[i][1],
        hoTen: values[i][2],
        deXuatVay: Number(values[i][3]) || 0,
        duyetVay: Number(values[i][4]) || 0,
        thoiHanThang: Number(values[i][5]) || 12,
        laiSuatDuyet: Number(values[i][6]) || 0,
        thuNhapThang: Number(values[i][7]) || 0,
        chiPhiThang: Number(values[i][8]) || 0,
        xepHangCIC: values[i][9] || "Hang A",
        soTCTDQuanHe: Number(values[i][10]) || 0,
        duNoCICNgoai: Number(values[i][11]) || 0,
        ghiChuCIC: values[i][12] || "",
        loaiTSBD: values[i][13] || "",
        chuSoHuuTSBD: values[i][14] || "",
        moTaTSBD: values[i][15] || "",
        giaTriTSBD: Number(values[i][16]) || 0,
        tyLeLTV: values[i][17] || "",
        hinhAnhTSBD: values[i][18] || "",
        hinhAnhThamDinh: values[i][19] || "",
        danhSachYKien: approvalOpinions,
        mucDoRuiRo: values[i][21] || "Thap",
        ketLuan: values[i][22] || "Dong y cap tin dung",
        ngayLap: formatGasDate(values[i][23]),
        canBoThamDinh: values[i][24] || "Lê Văn Tín"
      });
    }

    CacheHelper.setCachedData('appraisals_list', results, 30);
    return { status: "success", data: results };
  },

  handleSaveAppraisalReport: function(ss, data) {
    var sheet = ss.getSheetByName("BAO_CAO_THAM_DINH");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("BAO_CAO_THAM_DINH");
    }

    var maBCTD = data.maBCTD || ("BCTD-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss"));
    var opinionsJson = JSON.stringify(data.danhSachYKien || []);

    var row = [
      maBCTD,
      data.maKH || "",
      data.hoTen || "",
      Number(data.deXuatVay) || 0,
      Number(data.duyetVay) || 0,
      Number(data.thoiHanThang) || 12,
      Number(data.laiSuatDuyet) || 0,
      Number(data.thuNhapThang) || 0,
      Number(data.chiPhiThang) || 0,
      data.xepHangCIC || "Hang A (Tot)",
      Number(data.soTCTDQuanHe) || 0,
      Number(data.duNoCICNgoai) || 0,
      data.ghiChuCIC || "",
      data.loaiTSBD || "",
      data.chuSoHuuTSBD || "",
      data.moTaTSBD || "",
      Number(data.giaTriTSBD) || 0,
      data.tyLeLTV || "",
      data.hinhAnhTSBD || "",
      data.hinhAnhThamDinh || "",
      opinionsJson,
      data.mucDoRuiRo || "Thap",
      data.ketLuan || "Dong y cap tin dung",
      new Date(),
      data.canBoThamDinh || "Lê Văn Tín"
    ];

    sheet.appendRow(row);
    CacheHelper.invalidateModuleCache('appraisal');
    return {
      status: "success",
      message: "Đã lưu Báo cáo thẩm định " + maBCTD + " thành công!",
      maBCTD: maBCTD
    };
  },

  handleAddApprovalOpinion: function(ss, data) {
    var maBCTD = (data.maBCTD || "").trim();
    if (!maBCTD) return { status: "error", message: "Thiếu mã BCTD" };

    var sheet = ss.getSheetByName("BAO_CAO_THAM_DINH");
    if (!sheet) return { status: "error", message: "Không tìm thấy Sheet BAO_CAO_THAM_DINH" };

    var values = sheet.getDataRange().getValues();
    var foundRow = -1;
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() === maBCTD) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow === -1) return { status: "error", message: "Không tìm thấy báo cáo thẩm định " + maBCTD };

    var currentOpinions = [];
    try {
      currentOpinions = JSON.parse(values[foundRow - 1][20] || "[]");
    } catch(e) {}

    var newOpinion = {
      role: data.role || "CBTD",
      evaluatorName: data.evaluatorName || "Cán bộ",
      decision: data.decision || "Đồng ý cấp tín dụng",
      approvedAmount: Number(data.approvedAmount) || 0,
      note: data.note || "",
      createdAt: Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss")
    };

    currentOpinions.push(newOpinion);
    sheet.getRange(foundRow, 21).setValue(JSON.stringify(currentOpinions));

    CacheHelper.invalidateModuleCache('appraisal');
    return {
      status: "success",
      message: "Đã ghi nhận ý kiến phê duyệt của " + newOpinion.evaluatorName + " (" + newOpinion.role + ") thành công!"
    };
  }
};
