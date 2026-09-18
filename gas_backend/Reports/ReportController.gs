/**
 * ========================================================================================
 * CREDITCORES - REPORTCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module ReportController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var ReportController = {
  handleGetReportsData: function(ss) {
    var cached = CacheHelper.getCachedData('reports_data_v2');
    if (cached) return { status: "success", data: cached };

    var sKH = ss.getSheetByName("KH_CORE");
    var sHDTD = ss.getSheetByName("HDTD_CORE");

    if (!sKH || !sHDTD) {
      return {
        status: "success",
        data: {
          areaData: [],
          loanTypes: [],
          kpiMetrics: {},
          summary: { totalDuNo: 0, totalKH: 0 }
        }
      };
    }

    // --- Build KH area map (1 batch read) ---
    var khMap = {};
    if (sKH.getLastRow() > 1) {
      var khVals = sKH.getRange(2, 1, sKH.getLastRow() - 1, 15).getValues();
      for (var i = 0; i < khVals.length; i++) {
        var mKH = String(khVals[i][0]).trim();
        var diaChiKV = String(khVals[i][2]).trim() + " " + String(khVals[i][10]).trim();
        var areaKey = "Khác";
        if (diaChiKV.indexOf("Yên Thọ") > -1) areaKey = "Xã Yên Thọ (Thôn 1, 2, 3, 4)";
        else if (diaChiKV.indexOf("Yên Trường") > -1 || diaChiKV.indexOf("Vĩnh Lộc") > -1) areaKey = "Xã Yên Trường / Vĩnh Lộc";
        else if (diaChiKV.indexOf("Yên Bái") > -1 || diaChiKV.indexOf("Quý Lộc") > -1) areaKey = "Xã Quý Lộc / Yên Bái";
        khMap[mKH] = { area: areaKey };
      }
    }

    var areaStats = {
      "Xã Yên Thọ (Thôn 1, 2, 3, 4)": { countKH: new Set(), duNo: 0 },
      "Xã Yên Trường / Vĩnh Lộc":      { countKH: new Set(), duNo: 0 },
      "Xã Quý Lộc / Yên Bái":           { countKH: new Set(), duNo: 0 }
    };

    var loanTypeStats = {
      "Nông nghiệp & Chăn nuôi": { count: 0, amount: 0, color: "#16a34a" },
      "Thương mại & Dịch vụ":    { count: 0, amount: 0, color: "#0284c7" },
      "Tiêu dùng & Đời sống":    { count: 0, amount: 0, color: "#eab308" }
    };

    var totalDuNo = 0;
    var totalCASA = 0;
    var countCASA = 0;
    var countNPL = 0;   // Nợ xấu N3-N5
    var totalKH = new Set();

    // --- Batch read HDTD_CORE (cols A→O = 1→15) ---
    if (sHDTD.getLastRow() > 1) {
      var hdRows = sHDTD.getLastRow() - 1;
      var hdVals = sHDTD.getRange(2, 1, hdRows, 15).getValues();

      for (var j = 0; j < hdVals.length; j++) {
        var hdMaKH    = String(hdVals[j][1]).trim();
        var hdDuNo    = Number(hdVals[j][3]) || 0;
        var hdNhomNo  = Number(hdVals[j][8]) || 1;  // col I (0-indexed = 8)
        var hdMoTa    = String(hdVals[j][10]).toLowerCase().trim();
        var hdTrangThai = String(hdVals[j][11]).toUpperCase().trim(); // col L: TrangThaiHD

        // Skip đã tất toán
        if (hdTrangThai === "DA_TAT_TOAN") continue;

        totalDuNo += hdDuNo;
        totalKH.add(hdMaKH);

        // CASA coverage (có đăng ký trích nợ)
        if (hdVals[j][12] !== "" && hdVals[j][12] !== null) {
          countCASA++;
        }

        // NPL N3-N5
        if (hdNhomNo >= 3) countNPL++;

        // Area grouping
        var khInfo = khMap[hdMaKH];
        var aKey = khInfo ? khInfo.area : "Xã Yên Thọ (Thôn 1, 2, 3, 4)";
        if (!areaStats[aKey]) areaStats[aKey] = { countKH: new Set(), duNo: 0 };
        areaStats[aKey].countKH.add(hdMaKH);
        areaStats[aKey].duNo += hdDuNo;

        // Loan product classification
        var prodKey = "Nông nghiệp & Chăn nuôi";
        if (hdMoTa.indexOf("kinh doanh") > -1 || hdMoTa.indexOf("thương mại") > -1 || hdMoTa.indexOf("xe tải") > -1 || hdMoTa.indexOf("buôn bán") > -1) {
          prodKey = "Thương mại & Dịch vụ";
        } else if (hdMoTa.indexOf("tiêu dùng") > -1 || hdMoTa.indexOf("nhà ở") > -1 || hdMoTa.indexOf("sửa chữa") > -1) {
          prodKey = "Tiêu dùng & Đời sống";
        }
        loanTypeStats[prodKey].count++;
        loanTypeStats[prodKey].amount += hdDuNo;
      }
    }

    var totalLoanCount = Object.keys(loanTypeStats).reduce(function(acc, k) {
      return acc + loanTypeStats[k].count;
    }, 0);

    // --- Build areaData result ---
    var areaResult = [];
    for (var k in areaStats) {
      var dNo = areaStats[k].duNo;
      var rateStr = totalDuNo > 0 ? ((dNo / totalDuNo) * 100).toFixed(1) + "%" : "0%";
      areaResult.push({
        area: k,
        countKH: areaStats[k].countKH.size,
        duNo: dNo,
        rate: rateStr
      });
    }
    areaResult.sort(function(a, b) { return b.duNo - a.duNo; });

    // --- Build loanTypes result ---
    var loanTypeResult = [];
    for (var p in loanTypeStats) {
      var ltRate = totalLoanCount > 0 ? ((loanTypeStats[p].count / totalLoanCount) * 100).toFixed(1) + "%" : "0%";
      loanTypeResult.push({
        type: p,
        count: loanTypeStats[p].count,
        amount: loanTypeStats[p].amount,
        rate: ltRate,
        color: loanTypeStats[p].color
      });
    }
    loanTypeResult.sort(function(a, b) { return b.amount - a.amount; });

    var totalKHCount = totalKH.size;
    var nplRate  = totalLoanCount > 0 ? ((countNPL / totalLoanCount) * 100).toFixed(2) : null;
    var casaCoverage = totalKHCount > 0 ? ((countCASA / totalLoanCount) * 100).toFixed(1) : null;

    var finalResult = {
      areaData: areaResult,
      loanTypes: loanTypeResult,
      kpiMetrics: {},
      summary: {
        totalDuNo: totalDuNo,
        totalKH: totalKHCount,
        nplRate: nplRate,
        casaCoverage: casaCoverage,
        inspectionRate: null,
        ltvAvg: null
      }
    };

    CacheHelper.setCachedData('reports_data_v2', finalResult, 30);
    return { status: "success", data: finalResult };
  }
};
