/**
 * ========================================================================================
 * CREDITCORES - DASHBOARDCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module DashboardController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var DashboardController = {
  handleGetDashboardStats: function(ss) {
    ss = getSpreadsheetInstance(ss);
    if (!ss) {
      return { status: "error", message: "Không thể kết nối Google Spreadsheet!" };
    }

    var cached = CacheHelper.getCachedData('dashboard_stats');
    if (cached) return { status: "success", data: cached };

    var sHDTD = ss.getSheetByName("HDTD_CORE");
    var sKH = ss.getSheetByName("KH_CORE");
    var sNoTon = ss.getSheetByName("NO_TON_DONG");
    var sDot = ss.getSheetByName("DOT_TRICH_NO");
    var sDS = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    var sAppraisal = ss.getSheetByName("THAM_DINH_TD");
    var sInspection = ss.getSheetByName("KIEM_TRA_VON");

    var totalDuNo = 0;
    var totalHopDong = 0;
    var totalDuThuLai = 0;

    // Cơ cấu sản phẩm vay
    var loanTypeMap = {};

    if (sHDTD && sHDTD.getLastRow() > 1) {
      var hdValues = sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, 12).getValues();
      for (var i = 0; i < hdValues.length; i++) {
        var duNo = Number(hdValues[i][3]) || 0;
        var laiSuat = Number(hdValues[i][4]) || 0;
        var loaiVay = String(hdValues[i][10] || hdValues[i][8] || "Khác").trim();

        totalDuNo += duNo;
        totalHopDong++;
        totalDuThuLai += (duNo * (laiSuat / 100)) / 12;

        if (!loanTypeMap[loaiVay]) {
          loanTypeMap[loaiVay] = { name: loaiVay, count: 0, duNo: 0 };
        }
        loanTypeMap[loaiVay].count++;
        loanTypeMap[loaiVay].duNo += duNo;
      }
    }

    // Cơ cấu dư nợ theo 3 địa bàn xã chính
    var areaMap = {
      "Xã Yên Thọ": { name: "Xã Yên Thọ (Thôn 1, 2, 3, 4)", countKH: 0, duNo: 0 },
      "Xã Yên Trường": { name: "Xã Yên Trường (Thôn 1, 2, 3)", countKH: 0, duNo: 0 },
      "Xã Yên Bái / Quý Lộc": { name: "Xã Yên Bái / Quý Lộc", countKH: 0, duNo: 0 }
    };

    if (sKH && sKH.getLastRow() > 1) {
      var khValues = sKH.getRange(2, 1, sKH.getLastRow() - 1, 11).getValues();
      for (var k = 0; k < khValues.length; k++) {
        var khuVuc = String(khValues[k][10] || khValues[k][2] || "").trim();
        var matched = "Xã Yên Thọ";
        if (khuVuc.indexOf("Yên Trường") > -1) matched = "Xã Yên Trường";
        else if (khuVuc.indexOf("Yên Bái") > -1 || khuVuc.indexOf("Quý Lộc") > -1) matched = "Xã Yên Bái / Quý Lộc";
        
        if (areaMap[matched]) {
          areaMap[matched].countKH++;
        }
      }
    }

    // Phân bổ dư nợ ước tính theo tỉ lệ khách hàng từng xã
    var totalKHCount = 0;
    for (var aKey in areaMap) totalKHCount += areaMap[aKey].countKH;
    if (totalKHCount > 0) {
      for (var aKey2 in areaMap) {
        areaMap[aKey2].duNo = Math.round((areaMap[aKey2].countKH / totalKHCount) * totalDuNo);
        areaMap[aKey2].rate = totalDuNo > 0 ? Math.round((areaMap[aKey2].duNo / totalDuNo) * 100) + "%" : "0%";
      }
    }

    // Đăng ký trích nợ
    var totalKhachHangTrichNo = 0;
    if (sDS && sDS.getLastRow() > 1) {
      var dsValues = sDS.getRange(2, 1, sDS.getLastRow() - 1, 7).getValues();
      for (var d = 0; d < dsValues.length; d++) {
        if (String(dsValues[d][6]).toUpperCase() !== "NGUNG" && String(dsValues[d][6]).toUpperCase() !== "HUY") {
          totalKhachHangTrichNo++;
        }
      }
    }

    // Nợ tồn đọng
    var totalNoTon = 0;
    var countNoTon = 0;
    if (sNoTon && sNoTon.getLastRow() > 1) {
      var noTonValues = sNoTon.getRange(2, 1, sNoTon.getLastRow() - 1, 7).getValues();
      for (var j = 0; j < noTonValues.length; j++) {
        var st = Number(noTonValues[j][4]) || 0;
        if (st > 0) {
          totalNoTon += st;
          countNoTon++;
        }
      }
    }

    // Đợt trích nợ gần nhất
    var recentBatches = [];
    if (sDot && sDot.getLastRow() > 1) {
      var maxRows = Math.min(6, sDot.getLastRow() - 1);
      var dotValues = sDot.getRange(2, 1, maxRows, 8).getValues();
      for (var b = 0; b < dotValues.length; b++) {
        var phaiThu = Number(dotValues[b][3]) || 0;
        var daTrich = Number(dotValues[b][4]) || 0;
        var conNo = Number(dotValues[b][5]) || 0;
        var cRate = phaiThu > 0 ? Math.round((daTrich / phaiThu) * 100) : 0;

        recentBatches.push({
          maDot: String(dotValues[b][0]),
          thangNam: String(dotValues[b][1]),
          kyTrich: Number(dotValues[b][2]) || 1,
          tongPhaiThu: phaiThu,
          tongDaTrich: daTrich,
          tongConNo: conNo,
          completionRate: cRate,
          ngayTao: formatGasDateTime(dotValues[b][6]),
          trangThai: String(dotValues[b][7] || "KHOI_TAO")
        });
      }
    }

    // Thẩm định chờ duyệt
    var pendingAppraisals = 0;
    if (sAppraisal && sAppraisal.getLastRow() > 1) {
      var appValues = sAppraisal.getRange(2, 1, sAppraisal.getLastRow() - 1, 14).getValues();
      for (var ap = 0; ap < appValues.length; ap++) {
        var appStatus = String(appValues[ap][13] || "");
        if (appStatus.indexOf("CHO_DUYET") > -1 || appStatus.indexOf("KHOI_TAO") > -1) {
          pendingAppraisals++;
        }
      }
    }

    // Kiểm tra vốn cần thực hiện
    var pendingInspections = 0;
    if (sInspection && sInspection.getLastRow() > 1) {
      var insValues = sInspection.getRange(2, 1, sInspection.getLastRow() - 1, 12).getValues();
      for (var ip = 0; ip < insValues.length; ip++) {
        var insStatus = String(insValues[ip][10] || "");
        if (insStatus.indexOf("DANG_THEO_DOI") > -1 || insStatus.indexOf("CHUA_DAT") > -1) {
          pendingInspections++;
        }
      }
    }

    var result = {
      totalDuNo: totalDuNo,
      totalHopDong: totalHopDong,
      totalDuThuLai: Math.round(totalDuThuLai),
      totalKhachHangTrichNo: totalKhachHangTrichNo,
      totalNoTon: totalNoTon,
      countNoTon: countNoTon,
      pendingAppraisals: pendingAppraisals,
      pendingInspections: pendingInspections,
      recentBatches: recentBatches,
      areaStats: Object.values(areaMap),
      loanTypes: Object.values(loanTypeMap)
    };

    CacheHelper.setCachedData('dashboard_stats', result, 15);
    return { status: "success", data: result };
  }
};
