/**
 * ========================================================================================
 * CREDITCORES - RECONCILIATIONCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module ReconciliationController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var ReconciliationController = {
  handleReconcileUpload: function(ss, data) {
    var maDot = data.maDot;
    var items = data.items || [];

    var sLS = ss.getSheetByName("LICH_SU_TRICH_NO") || ss.getSheetByName("LICH_SU_GIAO_DICH") || ss.getSheetByName("CHI_TIET_TRICH_NO");
    var sNoTon = ss.getSheetByName("NO_TON_DONG");
    var sDot = ss.getSheetByName("DOT_TRICH_NO");

    if (!sNoTon || !sDot) {
      return { status: "error", message: "Không tìm thấy các bảng CSDL cần thiết để đối soát." };
    }

    var totalDaTrich = 0;
    var totalConNo = 0;
    var countSuccess = 0;
    var countFailed = 0;

    var noTonColMap = HeaderUtils.getHeaderMap(sNoTon);
    var noTonDefaultHeaders = [
      "SoHDTD", "MaKH", "TenKH", "GocTon", "LaiTon", "TongNoTon", "KyPhatSinh", "TrangThai", "GhiChu", "NgayCapNhat"
    ];

    var newNoTonRows = [];
    var lsColMap = sLS ? HeaderUtils.getHeaderMap(sLS) : null;
    var lsRows = (sLS && sLS.getLastRow() > 1) ? sLS.getRange(2, 1, sLS.getLastRow() - 1, sLS.getLastColumn()).getValues() : [];

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var phaiThu = Number(it.phaiThu !== undefined ? it.phaiThu : (it.soTienTrich || it.tongDuKien || 0)) || 0;
      var daTrich = Number(it.daTrich !== undefined ? it.daTrich : 0);
      var conNo = Math.max(0, phaiThu - daTrich);
      var ketQua = String(it.ketQua || (conNo === 0 ? "THANH_CONG" : (daTrich > 0 ? "TRICH_MOT_PHAN" : "THAT_BAI"))).trim();

      totalDaTrich += daTrich;
      totalConNo += conNo;

      if (ketQua === "THANH_CONG") {
        countSuccess++;
      } else {
        countFailed++;
        if (conNo > 0) {
          var dict = {
            SoHDTD: it.soHDTD || "",
            MaKH: it.maKH || "",
            TenKH: it.tenKH || it.hoTen || "",
            GocTon: Number(it.gocTon || 0) || 0,
            LaiTon: conNo,
            TongNoTon: conNo,
            KyPhatSinh: maDot,
            TrangThai: "CHUA_THU",
            GhiChu: it.ghiChu || "Đối soát chưa thành công",
            NgayCapNhat: new Date()
          };
          newNoTonRows.push(HeaderUtils.dictToRow(dict, noTonColMap, noTonDefaultHeaders));
        }
      }

      // Cập nhật từng món trong bảng LICH_SU_TRICH_NO
      if (sLS && lsColMap && lsRows.length > 0) {
        var itMaKH = String(it.maKH || "").replace(/^'/, "").trim();
        var itSoHD = String(it.soHDTD || "").trim();

        for (var rIdx = 0; rIdx < lsRows.length; rIdx++) {
          var rMaDot = String(HeaderUtils.getCell(lsRows[rIdx], lsColMap, "MaDot", "")).trim();
          var rMaKH = String(HeaderUtils.getCell(lsRows[rIdx], lsColMap, "MaKH", "")).replace(/^'/, "").trim();
          var rSoHD = String(HeaderUtils.getCell(lsRows[rIdx], lsColMap, "SoHDTD", "")).trim();

          if (rMaDot === maDot && (rSoHD === itSoHD || (rMaKH === itMaKH && !itSoHD))) {
            var targetRow = rIdx + 2;
            HeaderUtils.setCell(sLS, targetRow, lsColMap, "DaTrich", daTrich);
            HeaderUtils.setCell(sLS, targetRow, lsColMap, "ConNo", conNo);
            HeaderUtils.setCell(sLS, targetRow, lsColMap, "TrangThaiCore", ketQua);
            if (it.maGiaoDichCore) {
              HeaderUtils.setCell(sLS, targetRow, lsColMap, "MaGiaoDichCore", it.maGiaoDichCore);
            }
            HeaderUtils.setCell(sLS, targetRow, lsColMap, "NgayTrich", new Date());
            break;
          }
        }
      }
    }

    if (newNoTonRows.length > 0) {
      sNoTon.getRange(sNoTon.getLastRow() + 1, 1, newNoTonRows.length, newNoTonRows[0].length).setValues(newNoTonRows);
    }

    if (sDot.getLastRow() > 1) {
      var dotColMap = HeaderUtils.getHeaderMap(sDot);
      var dotLastCol = sDot.getLastColumn();
      var dotVals = sDot.getRange(2, 1, sDot.getLastRow() - 1, dotLastCol).getValues();
      for (var d = 0; d < dotVals.length; d++) {
        var dMaDot = HeaderUtils.getCell(dotVals[d], dotColMap, "MaDot", "");
        if (dMaDot === maDot) {
          var rowIndex = d + 2;
          HeaderUtils.setCell(sDot, rowIndex, dotColMap, "TongDaTrich", totalDaTrich);
          HeaderUtils.setCell(sDot, rowIndex, dotColMap, "TongConNo", totalConNo);
          HeaderUtils.setCell(sDot, rowIndex, dotColMap, "TrangThai", "HOAN_TAT");
          break;
        }
      }
    }

    CacheHelper.invalidateModuleCache('reconciliation');
    CacheHelper.invalidateModuleCache('debit');

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
