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

    // 1. Ánh xạ địa bàn khách hàng (Xã & Thôn) từ KH_CORE
    var custMap = {};
    if (sKH && sKH.getLastRow() > 1) {
      var khValues = sKH.getRange(2, 1, sKH.getLastRow() - 1, 12).getValues();
      for (var k = 0; k < khValues.length; k++) {
        var makh = String(khValues[k][0]).replace(/^'/, '').trim();
        var rawKhuVuc = (String(khValues[k][10] || "") + " " + String(khValues[k][2] || "")).trim();
        var hoten = String(khValues[k][1] || "").trim();
        var sotv = String(khValues[k][11] || "").trim();

        var rawLower = rawKhuVuc.toLowerCase();
        var xa = "Xã Quý Lộc";
        if (rawLower.indexOf("yên trường") > -1 || rawLower.indexOf("yen truong") > -1) {
          xa = "Xã Yên Trường";
        } else if (rawLower.indexOf("vĩnh lộc") > -1 || rawLower.indexOf("vinh loc") > -1) {
          xa = "Xã Vĩnh Lộc";
        } else {
          xa = "Xã Quý Lộc";
        }

        var thon = "Khu trung tâm " + xa.replace("Xã ", "");
        var m = rawKhuVuc.match(/thôn\s+[^,]+/i);
        if (m && m[0]) {
          var rawThon = m[0].trim();
          var tl = rawThon.toLowerCase();
          if (tl.indexOf("tu mục") > -1) thon = "Thôn Tu Mục";
          else if (tl.indexOf("tân lộc") > -1) thon = "Thôn Tân Lộc";
          else if (tl.indexOf("đan nê") > -1) thon = "Thôn Đan Nê";
          else if (tl.indexOf("phố kiểu") > -1) thon = "Thôn Phố Kiểu";
          else if (tl.indexOf("lựu khê") > -1) thon = "Thôn Lựu Khê";
          else if (tl.indexOf("thạc quả") > -1) thon = "Thôn Thạc Quả";
          else if (tl.indexOf("yên lạc") > -1) thon = "Thôn Yên Lạc";
          else if (tl.indexOf("thọ vực") > -1) thon = "Thôn Thọ Vực";
          else if (tl.indexOf("phi bình") > -1) thon = "Thôn Phi Bình";
          else if (tl.indexOf("kỳ ngãi") > -1) thon = "Thôn Kỳ Ngãi";
          else if (tl.indexOf("vĩnh khang 1") > -1) thon = "Thôn Vĩnh Khang 1";
          else if (tl.indexOf("vĩnh khang 2") > -1) thon = "Thôn Vĩnh Khang 2";
          else thon = rawThon;
        }
        custMap[makh] = { hoten: hoten, sotv: sotv, xa: xa, thon: thon };
      }
    }

    // 2. Cơ cấu theo 3 địa bàn xã chính & phân rã theo Thôn
    var byCommuneMap = {
      "Xã Quý Lộc": {
        key: "quyloc",
        name: "Xã Quý Lộc",
        subText: "Địa bàn trọng điểm (Thôn Đan Nê, Tân Lộc, Tu Mục)",
        cbqlUser: "qtdyentho.huyennhu",
        cbqlName: "Trần Như Huyền",
        countHD: 0,
        countKH: 0,
        duNo: 0,
        khSet: {},
        loanGroups: { "Nông nghiệp": 0, "Tiêu dùng - Đời sống": 0, "Thương mại - Dịch vụ": 0 },
        thonsMap: {}
      },
      "Xã Yên Trường": {
        key: "yentruong",
        name: "Xã Yên Trường",
        subText: "Địa bàn mở rộng (Thôn Phố Kiểu, Lựu Khê, Thạc Quả)",
        cbqlUser: "qtdyentho.luudinh",
        cbqlName: "Lưu Thị Định",
        countHD: 0,
        countKH: 0,
        duNo: 0,
        khSet: {},
        loanGroups: { "Nông nghiệp": 0, "Tiêu dùng - Đời sống": 0, "Thương mại - Dịch vụ": 0 },
        thonsMap: {}
      },
      "Xã Vĩnh Lộc": {
        key: "vinhloc",
        name: "Xã Vĩnh Lộc",
        subText: "Địa bàn liên kết (Thôn Kỳ Ngãi, Phi Bình, Yên Lạc, Thọ Vực)",
        cbqlUser: "qtdyentho.huunhan",
        cbqlName: "Nguyễn Hữu Nhân",
        countHD: 0,
        countKH: 0,
        duNo: 0,
        khSet: {},
        loanGroups: { "Nông nghiệp": 0, "Tiêu dùng - Đời sống": 0, "Thương mại - Dịch vụ": 0 },
        thonsMap: {}
      }
    };

    // 3. Cơ cấu theo Cán bộ quản lý tín dụng (CBTD Portfolio)
    var byCbtdMap = {
      "qtdyentho.huyennhu": {
        user: "qtdyentho.huyennhu",
        name: "Trần Như Huyền",
        role: "Cán Bộ Tín Dụng Quản Lý",
        assignedArea: "Xã Quý Lộc",
        duNo: 0,
        countHD: 0,
        countKH: 0,
        khSet: {},
        loanGroups: { "Nông nghiệp": 0, "Tiêu dùng - Đời sống": 0, "Thương mại - Dịch vụ": 0 },
        xasMap: {}
      },
      "qtdyentho.luudinh": {
        user: "qtdyentho.luudinh",
        name: "Lưu Thị Định",
        role: "Cán Bộ Tín Dụng Quản Lý",
        assignedArea: "Xã Yên Trường",
        duNo: 0,
        countHD: 0,
        countKH: 0,
        khSet: {},
        loanGroups: { "Nông nghiệp": 0, "Tiêu dùng - Đời sống": 0, "Thương mại - Dịch vụ": 0 },
        xasMap: {}
      },
      "qtdyentho.huunhan": {
        user: "qtdyentho.huunhan",
        name: "Nguyễn Hữu Nhân",
        role: "Cán Bộ Tín Dụng Quản Lý",
        assignedArea: "Xã Vĩnh Lộc",
        duNo: 0,
        countHD: 0,
        countKH: 0,
        khSet: {},
        loanGroups: { "Nông nghiệp": 0, "Tiêu dùng - Đời sống": 0, "Thương mại - Dịch vụ": 0 },
        xasMap: {}
      }
    };

    // 4. Cơ cấu sản phẩm tín dụng theo 3 nhóm chính
    var loanGroups = {
      "nong_nghiep": {
        key: "nong_nghiep",
        name: "Nông Nghiệp & Phát Triển Nông Thôn",
        description: "Phục vụ sản xuất nông nghiệp, chăn nuôi, trồng trọt trang trại",
        count: 0,
        duNo: 0,
        subtypes: {}
      },
      "sinh_hoat": {
        key: "sinh_hoat",
        name: "Tiêu Dùng & Đời Sống Thành Viên",
        description: "Xây sửa chữa nhà ở, tiêu dùng sinh hoạt thành viên",
        count: 0,
        duNo: 0,
        subtypes: {}
      },
      "kinh_doanh": {
        key: "kinh_doanh",
        name: "Thương Mại Dịch Vụ & Ngành Nghề",
        description: "Kinh doanh buôn bán, tiểu thủ công nghiệp và dịch vụ nông thôn",
        count: 0,
        duNo: 0,
        subtypes: {}
      }
    };

    var allBorrowersSet = {};
    var totalWeightedLai = 0;

    if (sHDTD && sHDTD.getLastRow() > 1) {
      var hdValues = sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, 14).getValues();
      for (var i = 0; i < hdValues.length; i++) {
        var makh = String(hdValues[i][1]).replace(/^'/, '').trim();
        var duNo = Number(hdValues[i][3]) || 0;
        var laiSuat = Number(String(hdValues[i][4]).replace(',', '.')) || 0;
        var maLoaiVay = String(hdValues[i][8] || "").trim();
        var moTaVay = String(hdValues[i][10] || "").trim();
        var cbtdUser = String(hdValues[i][11] || "").trim();
        var cbtdName = String(hdValues[i][12] || "").trim();
        var trangThaiHD = String(hdValues[i][13] || "DANG_VAY").trim();

        if (trangThaiHD !== "DA_TAT_TOAN" && duNo > 0) {
          totalDuNo += duNo;
          totalHopDong++;
          totalDuThuLai += (duNo * (laiSuat / 100)) / 12;
          totalWeightedLai += (duNo * laiSuat);
          allBorrowersSet[makh] = true;

          var cust = custMap[makh] || { xa: "Xã Quý Lộc", thon: "Thôn khác" };
          var xa = cust.xa;
          var thon = cust.thon;

          // Phân loại nhóm cho vay
          var prodName = maLoaiVay || moTaVay || "Cho vay khác";
          var grpKey = "kinh_doanh";
          var grpShort = "Thương mại - Dịch vụ";
          if (prodName.indexOf("Sản Xuất NN") > -1 || prodName.indexOf("Nông nghiệp") > -1) {
            grpKey = "nong_nghiep";
            grpShort = "Nông nghiệp";
          } else if (prodName.indexOf("Sinh hoạt") > -1 || prodName.indexOf("Tiêu dùng") > -1) {
            grpKey = "sinh_hoat";
            grpShort = "Tiêu dùng - Đời sống";
          }

          // A. Tích lũy 3 nhóm cho vay
          loanGroups[grpKey].count++;
          loanGroups[grpKey].duNo += duNo;
          if (!loanGroups[grpKey].subtypes[prodName]) {
            loanGroups[grpKey].subtypes[prodName] = { name: prodName, count: 0, duNo: 0 };
          }
          loanGroups[grpKey].subtypes[prodName].count++;
          loanGroups[grpKey].subtypes[prodName].duNo += duNo;

          // B. Tích lũy theo Xã & Thôn
          if (!byCommuneMap[xa]) xa = "Xã Quý Lộc";
          var cObj = byCommuneMap[xa];
          cObj.countHD++;
          cObj.duNo += duNo;
          if (!cObj.khSet[makh]) {
            cObj.khSet[makh] = true;
            cObj.countKH++;
          }
          cObj.loanGroups[grpShort] = (cObj.loanGroups[grpShort] || 0) + duNo;

          if (!cObj.thonsMap[thon]) {
            cObj.thonsMap[thon] = {
              name: thon,
              duno: 0,
              countHD: 0,
              countKH: 0,
              khSet: {},
              loanGroups: { "Nông nghiệp": 0, "Tiêu dùng - Đời sống": 0, "Thương mại - Dịch vụ": 0 }
            };
          }
          var tObj = cObj.thonsMap[thon];
          tObj.duno += duNo;
          tObj.countHD++;
          if (!tObj.khSet[makh]) {
            tObj.khSet[makh] = true;
            tObj.countKH++;
          }
          tObj.loanGroups[grpShort] = (tObj.loanGroups[grpShort] || 0) + duNo;

          // C. Tích lũy theo Cán bộ quản lý
          var cbKey = cbtdUser;
          if (!byCbtdMap[cbKey]) {
            if (xa === "Xã Yên Trường") cbKey = "qtdyentho.luudinh";
            else if (xa === "Xã Vĩnh Lộc") cbKey = "qtdyentho.huunhan";
            else cbKey = "qtdyentho.huyennhu";
          }
          var cbObj = byCbtdMap[cbKey];
          cbObj.countHD++;
          cbObj.duNo += duNo;
          if (!cbObj.khSet[makh]) {
            cbObj.khSet[makh] = true;
            cbObj.countKH++;
          }
          cbObj.loanGroups[grpShort] = (cbObj.loanGroups[grpShort] || 0) + duNo;

          if (!cbObj.xasMap[xa]) {
            cbObj.xasMap[xa] = {
              name: xa,
              duno: 0,
              countHD: 0,
              countKH: 0,
              khSet: {},
              thonsMap: {}
            };
          }
          var cbXa = cbObj.xasMap[xa];
          cbXa.duno += duNo;
          cbXa.countHD++;
          if (!cbXa.khSet[makh]) {
            cbXa.khSet[makh] = true;
            cbXa.countKH++;
          }

          if (!cbXa.thonsMap[thon]) {
            cbXa.thonsMap[thon] = {
              name: thon,
              duno: 0,
              countHD: 0,
              countKH: 0,
              khSet: {},
              loanGroups: { "Nông nghiệp": 0, "Tiêu dùng - Đời sống": 0, "Thương mại - Dịch vụ": 0 }
            };
          }
          var cbThon = cbXa.thonsMap[thon];
          cbThon.duno += duNo;
          cbThon.countHD++;
          if (!cbThon.khSet[makh]) {
            cbThon.khSet[makh] = true;
            cbThon.countKH++;
          }
          cbThon.loanGroups[grpShort] = (cbThon.loanGroups[grpShort] || 0) + duNo;
        }
      }
    }

    // Hoàn tất định dạng byCommune & thons
    var finalAreaStats = [];
    for (var aKey in byCommuneMap) {
      var item = byCommuneMap[aKey];
      delete item.khSet;
      item.rate = totalDuNo > 0 ? (Math.round((item.duNo / totalDuNo) * 1000) / 10) + "%" : "0%";
      item.duNoBinhQuanHD = item.countHD > 0 ? Math.round(item.duNo / item.countHD) : 0;
      item.duNoBinhQuanTV = item.countKH > 0 ? Math.round(item.duNo / item.countKH) : 0;

      var thonsList = [];
      for (var tKey in item.thonsMap) {
        var tItem = item.thonsMap[tKey];
        delete tItem.khSet;
        tItem.rateCommune = item.duNo > 0 ? (Math.round((tItem.duno / item.duNo) * 1000) / 10) + "%" : "0%";
        tItem.rateTotal = totalDuNo > 0 ? (Math.round((tItem.duno / totalDuNo) * 1000) / 10) + "%" : "0%";
        tItem.duNoBinhQuanHD = tItem.countHD > 0 ? Math.round(tItem.duno / tItem.countHD) : 0;
        tItem.duNoBinhQuanTV = tItem.countKH > 0 ? Math.round(tItem.duno / tItem.countKH) : 0;
        thonsList.push(tItem);
      }
      thonsList.sort(function(a, b) { return b.duno - a.duno; });
      delete item.thonsMap;
      item.thons = thonsList;
      finalAreaStats.push(item);
    }

    // Hoàn tất định dạng byCBTD
    var finalCbtdStats = [];
    for (var cKey in byCbtdMap) {
      var cb = byCbtdMap[cKey];
      delete cb.khSet;
      cb.rate = totalDuNo > 0 ? (Math.round((cb.duNo / totalDuNo) * 1000) / 10) + "%" : "0%";
      cb.duNoBinhQuanHD = cb.countHD > 0 ? Math.round(cb.duNo / cb.countHD) : 0;
      cb.duNoBinhQuanTV = cb.countKH > 0 ? Math.round(cb.duNo / cb.countKH) : 0;

      var xasList = [];
      for (var xk in cb.xasMap) {
        var xData = cb.xasMap[xk];
        delete xData.khSet;
        var cbThons = [];
        for (var tk in xData.thonsMap) {
          var tObj2 = xData.thonsMap[tk];
          delete tObj2.khSet;
          tObj2.rateCommune = xData.duno > 0 ? (Math.round((tObj2.duno / xData.duno) * 1000) / 10) + "%" : "0%";
          tObj2.rateTotal = totalDuNo > 0 ? (Math.round((tObj2.duno / totalDuNo) * 1000) / 10) + "%" : "0%";
          tObj2.duNoBinhQuanHD = tObj2.countHD > 0 ? Math.round(tObj2.duno / tObj2.countHD) : 0;
          tObj2.duNoBinhQuanTV = tObj2.countKH > 0 ? Math.round(tObj2.duno / tObj2.countKH) : 0;
          cbThons.push(tObj2);
        }
        cbThons.sort(function(a, b) { return b.duno - a.duno; });
        delete xData.thonsMap;
        xData.thons = cbThons;
        xasList.push(xData);
      }
      delete cb.xasMap;
      cb.communes = xasList;
      finalCbtdStats.push(cb);
    }

    // Hoàn tất loanGroups
    for (var gKey in loanGroups) {
      loanGroups[gKey].rate = totalDuNo > 0 ? (Math.round((loanGroups[gKey].duNo / totalDuNo) * 1000) / 10) + "%" : "0%";
      loanGroups[gKey].subtypes = Object.values(loanGroups[gKey].subtypes);
    }

    var totalThanhVienVay = Object.keys(allBorrowersSet).length;
    var avgLaiSuat = totalDuNo > 0 ? (Math.round((totalWeightedLai / totalDuNo) * 10) / 10) : 0;

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
      totalThanhVienVay: totalThanhVienVay,
      duNoBinhQuanHD: totalHopDong > 0 ? Math.round(totalDuNo / totalHopDong) : 0,
      duNoBinhQuanTV: totalThanhVienVay > 0 ? Math.round(totalDuNo / totalThanhVienVay) : 0,
      laiSuatBinhQuan: avgLaiSuat,
      totalDuThuLai: Math.round(totalDuThuLai),
      totalKhachHangTrichNo: totalKhachHangTrichNo,
      totalNoTon: totalNoTon,
      countNoTon: countNoTon,
      pendingAppraisals: pendingAppraisals,
      pendingInspections: pendingInspections,
      recentBatches: recentBatches,
      areaStats: finalAreaStats,
      cbtdStats: finalCbtdStats,
      loanTypes: Object.values(loanGroups),
      loanGroups: Object.values(loanGroups)
    };

    CacheHelper.setCachedData('dashboard_stats', result, 15);
    return { status: "success", data: result };
  }
};
