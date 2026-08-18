/**
 * CONTROLLER ĐỐI SOÁT KẾT QUẢ TRÍCH NỢ VÀ PHÂN LOẠI NỢ TỒN
 */

var ReconciliationController = {
  handleReconcileUpload: function(ss, data) {
    var maDot = data.maDot;
    var items = data.items || [];

    var sLS = ss.getSheetByName("LICH_SU_GIAO_DICH");
    var sNoTon = ss.getSheetByName("NO_TON_DONG");
    var sDot = ss.getSheetByName("DOT_TRICH_NO");

    if (!sLS || !sNoTon || !sDot) {
      return { status: "error", message: "Không tìm thấy các bảng CSDL cần thiết để đối soát." };
    }

    var totalDaTrich = 0;
    var totalConNo = 0;
    var countSuccess = 0;
    var countFailed = 0;

    var newNoTonRows = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var phaiThu = Number(it.phaiThu) || 0;
      var daTrich = Number(it.daTrich) || 0;
      var conNo = Math.max(0, phaiThu - daTrich);

      totalDaTrich += daTrich;
      totalConNo += conNo;

      if (it.ketQua === "THANH_CONG") {
        countSuccess++;
      } else {
        countFailed++;
        if (conNo > 0) {
          newNoTonRows.push([
            it.maKH || "",
            it.soHDTD || "",
            0,
            conNo,
            conNo,
            maDot,
            "CHUA_THU",
            new Date()
          ]);
        }
      }
    }

    if (newNoTonRows.length > 0) {
      sNoTon.getRange(sNoTon.getLastRow() + 1, 1, newNoTonRows.length, 8).setValues(newNoTonRows);
    }

    if (sDot.getLastRow() > 1) {
      var dotVals = sDot.getRange(2, 1, sDot.getLastRow() - 1, 8).getValues();
      for (var d = 0; d < dotVals.length; d++) {
        if (dotVals[d][0] === maDot) {
          sDot.getRange(d + 2, 5).setValue(totalDaTrich);
          sDot.getRange(d + 2, 6).setValue(totalConNo);
          sDot.getRange(d + 2, 8).setValue("HOAN_TAT");
          break;
        }
      }
    }

    CacheHelper.invalidateModuleCache('reconciliation');

    return {
      status: "success",
      message: "Đối soát hoàn tất đợt " + maDot + "! Đã trích thành công: " + countSuccess + " món, Nợ tồn chuyển tiếp: " + countFailed + " món.",
      summary: {
        totalDaTrich: totalDaTrich,
        totalConNo: totalConNo,
        countSuccess: countSuccess,
        countFailed: countFailed
      }
    };
  }
};
