/**
 * CONTROLLER DASHBOARD QUẢN TRỊ TỔNG QUAN TÍN DỤNG
 */

var DashboardController = {
  handleGetDashboardStats: function(ss) {
    var cached = CacheHelper.getCachedData('dashboard_stats');
    if (cached) return { status: "success", data: cached };

    var sHDTD = ss.getSheetByName("HDTD_CORE");
    var sKH = ss.getSheetByName("KH_CORE");
    var sNoTon = ss.getSheetByName("NO_TON_DONG");
    var sDot = ss.getSheetByName("DOT_TRICH_NO");
    var sDS = ss.getSheetByName("DS_TRICH_NO");

    var totalDuNo = 0;
    var totalHopDong = 0;
    var totalDuThuLai = 0;

    if (sHDTD && sHDTD.getLastRow() > 1) {
      var hdValues = sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, 11).getValues();
      for (var i = 0; i < hdValues.length; i++) {
        var duNo = Number(hdValues[i][3]) || 0;
        var laiSuat = Number(hdValues[i][4]) || 0;
        totalDuNo += duNo;
        totalHopDong++;
        totalDuThuLai += (duNo * (laiSuat / 100)) / 12;
      }
    }

    var totalKhachHangTrichNo = (sDS && sDS.getLastRow() > 1) ? (sDS.getLastRow() - 1) : 0;

    var totalNoTon = 0;
    if (sNoTon && sNoTon.getLastRow() > 1) {
      var noTonValues = sNoTon.getRange(2, 5, sNoTon.getLastRow() - 1, 1).getValues();
      for (var j = 0; j < noTonValues.length; j++) {
        totalNoTon += Number(noTonValues[j][0]) || 0;
      }
    }

    var recentBatches = [];
    if (sDot && sDot.getLastRow() > 1) {
      var dotValues = sDot.getRange(2, 1, Math.min(5, sDot.getLastRow() - 1), 8).getValues();
      for (var k = 0; k < dotValues.length; k++) {
        recentBatches.push({
          maDot: dotValues[k][0],
          thangNam: dotValues[k][1],
          kyTrich: dotValues[k][2],
          tongPhaiThu: dotValues[k][3],
          tongDaTrich: dotValues[k][4],
          tongConNo: dotValues[k][5],
          ngayTao: formatGasDateTime(dotValues[k][6]),
          trangThai: dotValues[k][7]
        });
      }
    }

    var result = {
      totalDuNo: totalDuNo,
      totalHopDong: totalHopDong,
      totalDuThuLai: Math.round(totalDuThuLai),
      totalKhachHangTrichNo: totalKhachHangTrichNo,
      totalNoTon: totalNoTon,
      recentBatches: recentBatches
    };

    CacheHelper.setCachedData('dashboard_stats', result, 20);
    return { status: "success", data: result };
  }
};
