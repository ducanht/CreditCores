/**
 * CONTROLLER BÁO CÁO THỐNG KÊ & PHÂN TÍCH TÍN DỤNG ĐỘNG
 */

var ReportController = {
  handleGetReportsData: function(ss) {
    var cached = CacheHelper.getCachedData('reports_data');
    if (cached) return { status: "success", data: cached };

    var sKH = ss.getSheetByName("KH_CORE");
    var sHDTD = ss.getSheetByName("HDTD_CORE");

    if (!sKH || !sHDTD) {
      return {
        status: "success",
        data: {
          areaData: [],
          loanTypes: [],
          totalDuNo: 0
        }
      };
    }

    var khMap = {};
    if (sKH.getLastRow() > 1) {
      var khVals = sKH.getRange(2, 1, sKH.getLastRow() - 1, 15).getValues();
      for (var i = 0; i < khVals.length; i++) {
        var mKH = String(khVals[i][0]);
        var dc = String(khVals[i][2]) + " " + String(khVals[i][10]);
        var areaKey = "Khác";
        if (dc.indexOf("Yên Thọ") > -1) areaKey = "Xã Yên Thọ (Thôn 1, 2, 3, 4)";
        else if (dc.indexOf("Yên Trường") > -1 || dc.indexOf("Vĩnh Lộc") > -1) areaKey = "Xã Yên Trường / Vĩnh Lộc";
        else if (dc.indexOf("Yên Bái") > -1 || dc.indexOf("Quý Lộc") > -1) areaKey = "Xã Quý Lộc / Yên Bái";

        khMap[mKH] = {
          area: areaKey
        };
      }
    }

    var areaStats = {
      "Xã Yên Thọ (Thôn 1, 2, 3, 4)": { countKH: new Set(), countLoans: 0, duNo: 0 },
      "Xã Yên Trường / Vĩnh Lộc": { countKH: new Set(), countLoans: 0, duNo: 0 },
      "Xã Quý Lộc / Yên Bái": { countKH: new Set(), countLoans: 0, duNo: 0 }
    };

    var loanTypeStats = {
      "Nông nghiệp & Chăn nuôi": { count: 0, amount: 0, color: "bg-success" },
      "Thương mại & Dịch vụ": { count: 0, amount: 0, color: "bg-primary" },
      "Tiêu dùng & Đời sống": { count: 0, amount: 0, color: "bg-warning" }
    };

    var totalDuNo = 0;

    if (sHDTD.getLastRow() > 1) {
      var hdVals = sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, 11).getValues();
      for (var j = 0; j < hdVals.length; j++) {
        var hdMaKH = String(hdVals[j][1]);
        var hdDuNo = Number(hdVals[j][3]) || 0;
        var hdMoTa = String(hdVals[j][10]);
        totalDuNo += hdDuNo;

        // Group by Area
        var khInfo = khMap[hdMaKH];
        var aKey = khInfo ? khInfo.area : "Xã Yên Thọ (Thôn 1, 2, 3, 4)";
        if (!areaStats[aKey]) {
          areaStats[aKey] = { countKH: new Set(), countLoans: 0, duNo: 0 };
        }
        areaStats[aKey].countKH.add(hdMaKH);
        areaStats[aKey].countLoans++;
        areaStats[aKey].duNo += hdDuNo;

        // Group by Loan Product
        var prodKey = "Nông nghiệp & Chăn nuôi";
        if (hdMoTa.indexOf("kinh doanh") > -1 || hdMoTa.indexOf("thương mại") > -1 || hdMoTa.indexOf("xe tải") > -1) {
          prodKey = "Thương mại & Dịch vụ";
        } else if (hdMoTa.indexOf("tiêu dùng") > -1 || hdMoTa.indexOf("nhà ở") > -1) {
          prodKey = "Tiêu dùng & Đời sống";
        }

        loanTypeStats[prodKey].count++;
        loanTypeStats[prodKey].amount += hdDuNo;
      }
    }

    var areaResult = [];
    for (var k in areaStats) {
      var dNo = areaStats[k].duNo;
      var rateStr = totalDuNo > 0 ? ((dNo / totalDuNo) * 100).toFixed(1) + "%" : "0%";
      areaResult.push({
        area: k,
        countKH: areaStats[k].countKH.size,
        countLoans: areaStats[k].countLoans,
        duNo: dNo,
        rate: rateStr
      });
    }

    var loanTypeResult = [];
    for (var p in loanTypeStats) {
      loanTypeResult.push({
        type: p,
        count: loanTypeStats[p].count,
        amount: loanTypeStats[p].amount,
        color: loanTypeStats[p].color
      });
    }

    var finalResult = {
      areaData: areaResult,
      loanTypes: loanTypeResult,
      totalDuNo: totalDuNo
    };

    CacheHelper.setCachedData('reports_data', finalResult, 30);
    return { status: "success", data: finalResult };
  }
};
