/**
 * ========================================================================================
 * CREDITCORES - REPORTCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller xử lý tổng hợp Báo cáo Thống kê Quản trị Tín dụng,
 *              Phân bổ Địa bàn, Cơ cấu Sản phẩm Vay, Sao Kê Hợp Đồng (BC_DOANH_SO_TD)
 *              và Bảng Xếp Hạng Top Dư Nợ Bình Quân Toàn Quỹ (TOP_DU_NO_BINH_QUAN).
 * @created     15/08/2026
 * @updated     18/09/2026
 * @version     3.0
 * ========================================================================================
 */

function formatGasDateVN(val) {
  if (!val) return "";
  if (val instanceof Date) {
    var d = ("0" + val.getDate()).slice(-2);
    var m = ("0" + (val.getMonth() + 1)).slice(-2);
    var y = val.getFullYear();
    return d + "/" + m + "/" + y;
  }
  return String(val).trim();
}

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
          statementData: [],
          topAvgDebtData: [],
          kpiMetrics: {},
          summary: { totalDuNo: 0, totalTienVay: 0, totalKH: 0 }
        }
      };
    }

    // --- Build KH map (batch read theo tên cột) ---
    var khMap = {};
    if (sKH.getLastRow() > 1) {
      var colMapKH = HeaderUtils.getHeaderMap(sKH);
      var khVals = sKH.getRange(2, 1, sKH.getLastRow() - 1, sKH.getLastColumn()).getValues();
      for (var i = 0; i < khVals.length; i++) {
        var mKH = String(HeaderUtils.getCell(khVals[i], colMapKH, "MaKH", "")).replace(/^'/, "").trim();
        var hTen = String(HeaderUtils.getCell(khVals[i], colMapKH, "HoTen", "")).trim();
        var dChi = String(HeaderUtils.getCell(khVals[i], colMapKH, "DiaChi", "")).trim();
        var sTV = String(HeaderUtils.getCell(khVals[i], colMapKH, "SoTV", "")).replace(/^'/, "").trim();
        var directXa = String(HeaderUtils.getCell(khVals[i], colMapKH, "KvXa", "")).trim();
        var diaChiKV = (dChi + " " + String(HeaderUtils.getCell(khVals[i], colMapKH, "KhuVuc", ""))).trim();
        var areaKey = directXa || "Khác";
        if (!directXa) {
          if (diaChiKV.indexOf("Yên Thọ") > -1) areaKey = "Xã Yên Thọ (Thôn 1, 2, 3, 4)";
          else if (diaChiKV.indexOf("Yên Trường") > -1 || diaChiKV.indexOf("Vĩnh Lộc") > -1) areaKey = "Xã Yên Trường / Vĩnh Lộc";
          else if (diaChiKV.indexOf("Yên Bái") > -1 || diaChiKV.indexOf("Quý Lộc") > -1) areaKey = "Xã Quý Lộc / Yên Bái";
        }
        khMap[mKH] = {
          hoTen: hTen,
          diaChi: dChi,
          soTV: sTV,
          area: areaKey
        };
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
    var totalTienVay = 0;
    var countCASA = 0;
    var countNPL = 0;   // Nợ xấu N3-N5
    var totalKH = new Set();
    var statementResult = [];
    var customerDebtMap = {};

    // --- Batch read HDTD_CORE (theo tên cột) ---
    if (sHDTD.getLastRow() > 1) {
      var colMapHD = HeaderUtils.getHeaderMap(sHDTD);
      var hdRows = sHDTD.getLastRow() - 1;
      var hdVals = sHDTD.getRange(2, 1, hdRows, sHDTD.getLastColumn()).getValues();

      for (var j = 0; j < hdVals.length; j++) {
        var hdSoHDTD    = String(HeaderUtils.getCell(hdVals[j], colMapHD, "SoHDTD", "")).trim();
        var hdMaKH      = String(HeaderUtils.getCell(hdVals[j], colMapHD, "MaKH", "")).replace(/^'/, "").trim();
        var hdTienVay   = Number(HeaderUtils.getCell(hdVals[j], colMapHD, "TienVay", 0)) || 0;
        var hdDuNo      = Number(HeaderUtils.getCell(hdVals[j], colMapHD, "DuNo", 0)) || 0;
        var hdLaiSuat   = Number(HeaderUtils.getCell(hdVals[j], colMapHD, "LaiSuat", 0)) || 0;
        var hdNgayVay   = formatGasDateVN(HeaderUtils.getCell(hdVals[j], colMapHD, "NgayVay", ""));
        var hdDenHan    = formatGasDateVN(HeaderUtils.getCell(hdVals[j], colMapHD, "DenHan", ""));
        var hdTraLaiDen = formatGasDateVN(HeaderUtils.getCell(hdVals[j], colMapHD, "TraLaiDenNgay", ""));
        var hdMaLoaiVay = String(HeaderUtils.getCell(hdVals[j], colMapHD, "MaLoaiVay", "")).trim();
        var hdSoThang   = Number(HeaderUtils.getCell(hdVals[j], colMapHD, "SoThangVay", 0)) || 0;
        var hdMoTa      = String(HeaderUtils.getCell(hdVals[j], colMapHD, "MoTaVay", "")).trim();
        var hdCBTD_Code = String(HeaderUtils.getCell(hdVals[j], colMapHD, "CBTD_PhuTrach", "")).trim();
        var hdTenCBTD   = String(HeaderUtils.getCell(hdVals[j], colMapHD, "Ten_CBTD", "")).trim();
        var hdMaLoaiHD  = String(HeaderUtils.getCell(hdVals[j], colMapHD, "MaLoaiHD", "")).trim();
        if (!hdMaLoaiHD) {
          hdMaLoaiHD = hdSoThang > 12 ? "THCDBTNMT" : "NHCDBTNMT";
        }

        var khInfo = khMap[hdMaKH] || {
          hoTen: "Khách hàng " + hdMaKH,
          diaChi: "Địa bàn QTDND",
          soTV: "",
          area: "Xã Yên Thọ (Thôn 1, 2, 3, 4)"
        };

        var aKey = khInfo.area || "Xã Yên Thọ (Thôn 1, 2, 3, 4)";

        // Phân loại sản phẩm vay
        var prodKey = "Nông nghiệp & Chăn nuôi";
        var moTaLower = hdMoTa.toLowerCase();
        if (moTaLower.indexOf("kinh doanh") > -1 || moTaLower.indexOf("thương mại") > -1 || moTaLower.indexOf("xe tải") > -1 || moTaLower.indexOf("buôn bán") > -1) {
          prodKey = "Thương mại & Dịch vụ";
        } else if (moTaLower.indexOf("tiêu dùng") > -1 || moTaLower.indexOf("nhà ở") > -1 || moTaLower.indexOf("sửa chữa") > -1) {
          prodKey = "Tiêu dùng & Đời sống";
        }

        // Bổ sung vào danh sách sao kê toàn diện (Statement)
        statementResult.push({
          soHDTD: hdSoHDTD,
          maKH: hdMaKH,
          soTV: khInfo.soTV || "",
          hoTen: khInfo.hoTen || ("KH " + hdMaKH),
          tienVay: hdTienVay,
          duNo: hdDuNo,
          laiSuat: hdLaiSuat,
          ngayVay: hdNgayVay,
          denHan: hdDenHan,
          maLoaiVay: hdMaLoaiVay || prodKey,
          soThangVay: hdSoThang,
          moTaVay: hdMoTa || prodKey,
          khuVuc: aKey,
          diaChi: khInfo.diaChi,
          cbtdPhuTrach: hdCBTD_Code,
          tenCBTD: hdTenCBTD,
          trangThaiHD: hdTrangThai || (hdDuNo > 0 ? "DANG_VAY" : "DA_TAT_TOAN"),
          maLoaiHD: hdMaLoaiHD
        });

        totalTienVay += hdTienVay;

        // Bỏ qua hợp đồng đã tất toán khỏi các chỉ số dư nợ hiện tại
        if (hdTrangThai === "DA_TAT_TOAN" || (hdDuNo <= 0 && hdTrangThai !== "DANG_VAY")) {
          continue;
        }

        totalDuNo += hdDuNo;
        totalKH.add(hdMaKH);

        // CASA coverage
        if (hdVals[j][12] !== "" && hdVals[j][12] !== null) {
          countCASA++;
        }

        // Nhóm nợ xấu N3-N5 (nếu có cột chỉ định hoặc quá hạn)
        var hdNhomNo = Number(hdVals[j][8]) || 1;
        if (hdNhomNo >= 3) countNPL++;

        // Thống kê theo địa bàn
        if (!areaStats[aKey]) areaStats[aKey] = { countKH: new Set(), duNo: 0 };
        areaStats[aKey].countKH.add(hdMaKH);
        areaStats[aKey].duNo += hdDuNo;

        // Thống kê theo sản phẩm vay
        loanTypeStats[prodKey].count++;
        loanTypeStats[prodKey].amount += hdDuNo;

        // Gom nhóm tính Top Dư Nợ
        if (!customerDebtMap[hdMaKH]) {
          customerDebtMap[hdMaKH] = {
            maKH: hdMaKH,
            hoTen: khInfo.hoTen || ("KH " + hdMaKH),
            soTV: khInfo.soTV || "",
            khuVuc: aKey,
            diaChi: khInfo.diaChi || "",
            tongDuNo: 0,
            tongTienVay: 0,
            soMonVay: 0
          };
        }
        customerDebtMap[hdMaKH].tongDuNo += hdDuNo;
        customerDebtMap[hdMaKH].tongTienVay += hdTienVay;
        customerDebtMap[hdMaKH].soMonVay += 1;
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
    // Khởi tạo thống kê 7 hình thức bảo đảm
    var securityTypeStats = {
      "THCDBTNMT": { code: "THCDBTNMT", name: "Trung hạn có đảm bảo, đăng ký GDBĐ", count: 0, duNo: 0, group: "Có TSBĐ (Đăng ký GDBĐ)" },
      "THBLCDBTNMT": { code: "THBLCDBTNMT", name: "Trung hạn đăng ký GDBĐ uỷ quyền", count: 0, duNo: 0, group: "Có TSBĐ (Đăng ký GDBĐ)" },
      "NHCDBTNMT": { code: "NHCDBTNMT", name: "Ngắn hạn có đảm bảo, đăng ký GDBĐ", count: 0, duNo: 0, group: "Có TSBĐ (Đăng ký GDBĐ)" },
      "THCDB": { code: "THCDB", name: "Trung hạn có TSBĐ không đăng ký GDBĐ", count: 0, duNo: 0, group: "Có TSBĐ (Không đăng ký)" },
      "NHCDB": { code: "NHCDB", name: "Ngắn hạn có TSBĐ không đăng ký GDBĐ", count: 0, duNo: 0, group: "Có TSBĐ (Không đăng ký)" },
      "NHKDB": { code: "NHKDB", name: "Ngắn hạn, tín chấp", count: 0, duNo: 0, group: "Tín chấp" },
      "THKDB": { code: "THKDB", name: "Trung hạn tín chấp", count: 0, duNo: 0, group: "Tín chấp" }
    };

    // Duyệt lại danh sách hợp đồng đang vay để thống kê hình thức bảo đảm
    for (var s = 0; s < statementResult.length; s++) {
      var stItem = statementResult[s];
      if (stItem.trangThaiHD !== "DA_TAT_TOAN" && stItem.duNo > 0) {
        var mCode = stItem.maLoaiHD || "NHCDBTNMT";
        if (!securityTypeStats[mCode]) {
          securityTypeStats[mCode] = { code: mCode, name: mCode, count: 0, duNo: 0, group: "Khác" };
        }
        securityTypeStats[mCode].count++;
        securityTypeStats[mCode].duNo += stItem.duNo;
      }
    }

    var securityTypeResult = [];
    for (var sc in securityTypeStats) {
      var sObj = securityTypeStats[sc];
      if (sObj.count > 0 || sObj.duNo > 0) {
        var sRate = totalDuNo > 0 ? ((sObj.duNo / totalDuNo) * 100).toFixed(1) + "%" : "0%";
        securityTypeResult.push({
          code: sObj.code,
          name: sObj.name,
          group: sObj.group,
          count: sObj.count,
          amount: sObj.duNo,
          rate: sRate
        });
      }
    }
    securityTypeResult.sort(function(a, b) { return b.amount - a.amount; });

    // --- Build topAvgDebtData result ---
    var topDebtArr = [];
    for (var m in customerDebtMap) {
      var cItem = customerDebtMap[m];
      var cRate = totalDuNo > 0 ? Number(((cItem.tongDuNo / totalDuNo) * 100).toFixed(2)) : 0;
      topDebtArr.push({
        maKH: cItem.maKH,
        hoTen: cItem.hoTen,
        soTV: cItem.soTV,
        khuVuc: cItem.khuVuc,
        diaChi: cItem.diaChi,
        tongDuNo: cItem.tongDuNo,
        tongTienVay: cItem.tongTienVay,
        soMonVay: cItem.soMonVay,
        duNoBinhQuan: cItem.tongDuNo,
        tyTrongDuNo: cRate
      });
    }
    topDebtArr.sort(function(a, b) { return b.tongDuNo - a.tongDuNo; });

    var topAvgDebtResult = topDebtArr.slice(0, 50).map(function(c, idx) {
      c.xepHang = idx + 1;
      c.namBaoCao = 2026;
      return c;
    });

    // --- Kiểm tra nếu có sẵn sheet BC_DOANH_SO_TD có dữ liệu đẩy từ Python Daemon ---
    var sBCDS = ss.getSheetByName("BC_DOANH_SO_TD");
    if (sBCDS && sBCDS.getLastRow() > 1) {
      try {
        var bcdsVals = sBCDS.getRange(2, 1, sBCDS.getLastRow() - 1, 12).getValues();
        if (bcdsVals.length > 0) {
          var sheetStatement = [];
          for (var b = 0; b < bcdsVals.length; b++) {
            var row = bcdsVals[b];
            if (!row[0] && !row[1]) continue;
            var rMaKH = String(row[1]).trim();
            var rKhInfo = khMap[rMaKH] || {};
            sheetStatement.push({
              soHDTD: String(row[0]).trim(),
              maKH: rMaKH,
              soTV: String(row[2] || rKhInfo.soTV || "").trim(),
              hoTen: rKhInfo.hoTen || ("KH " + rMaKH),
              tienVay: Number(row[3]) || 0,
              duNo: Number(row[4]) || 0,
              laiSuat: Number(row[5]) || 0,
              ngayVay: formatGasDateVN(row[6]),
              denHan: formatGasDateVN(row[7]),
              maLoaiVay: String(row[8]).trim(),
              soThangVay: Number(row[9]) || 0,
              moTaVay: String(row[10]).trim(),
              khuVuc: String(row[11] || rKhInfo.area || "Xã Yên Thọ").trim(),
              diaChi: rKhInfo.diaChi || "",
              trangThaiHD: (Number(row[4]) || 0) > 0 ? "DANG_VAY" : "DA_TAT_TOAN"
            });
          }
          if (sheetStatement.length > 0) {
            statementResult = sheetStatement;
          }
        }
      } catch (eBC) {
        Logger.log("Lỗi đọc BC_DOANH_SO_TD: " + eBC.toString());
      }
    }

    // --- Kiểm tra nếu có sẵn sheet TOP_DU_NO_BINH_QUAN có dữ liệu đẩy từ Python Daemon ---
    var sTop = ss.getSheetByName("TOP_DU_NO_BINH_QUAN");
    if (sTop && sTop.getLastRow() > 1) {
      try {
        var topVals = sTop.getRange(2, 1, sTop.getLastRow() - 1, 21).getValues();
        if (topVals.length > 0) {
          var sheetTop = [];
          for (var t = 0; t < topVals.length; t++) {
            var tRow = topVals[t];
            if (!tRow[2]) continue;
            sheetTop.push({
              namBaoCao: Number(tRow[0]) || 2026,
              xepHang: Number(tRow[1]) || (t + 1),
              maKH: String(tRow[2]).trim(),
              hoTen: String(tRow[3]).trim(),
              soTV: String(tRow[4]).trim(),
              khuVuc: String(tRow[5]).trim(),
              duNoBinhQuan: Number(tRow[18]) || 0,
              tongTienVay: Number(tRow[19]) || 0,
              tongDuNo: Number(tRow[18]) || 0,
              tyTrongDuNo: typeof tRow[20] === 'number' ? Number((tRow[20] * 100).toFixed(2)) : parseFloat(String(tRow[20]).replace('%', '')) || 0
            });
          }
          if (sheetTop.length > 0) {
            topAvgDebtResult = sheetTop;
          }
        }
      } catch (eTop) {
        Logger.log("Lỗi đọc TOP_DU_NO_BINH_QUAN: " + eTop.toString());
      }
    }

    var totalKHCount = totalKH.size;
    var nplRate = totalLoanCount > 0 ? ((countNPL / totalLoanCount) * 100).toFixed(2) : null;
    var casaCoverage = totalKHCount > 0 ? ((countCASA / totalLoanCount) * 100).toFixed(1) : null;

    var finalResult = {
      areaData: areaResult,
      loanTypes: loanTypeResult,
      securityTypes: securityTypeResult,
      statementData: statementResult,
      topAvgDebtData: topAvgDebtResult,
      kpiMetrics: {},
      summary: {
        totalDuNo: totalDuNo,
        totalTienVay: totalTienVay,
        totalKH: totalKHCount,
        totalActiveLoans: totalLoanCount,
        nplRate: nplRate,
        casaCoverage: casaCoverage,
        inspectionRate: null,
        ltvAvg: null
      }
    };

    CacheHelper.setCachedData('reports_data_v2', finalResult, CacheHelper.TIERS.WARM);
    return { status: "success", data: finalResult };
  }
};
