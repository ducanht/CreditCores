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

    // 1. Ánh xạ địa bàn khách hàng từ KH_CORE
    var custAreaMap = {};
    if (sKH && sKH.getLastRow() > 1) {
      var khValues = sKH.getRange(2, 1, sKH.getLastRow() - 1, 11).getValues();
      for (var k = 0; k < khValues.length; k++) {
        var makh = String(khValues[k][0]).replace(/^'/, '').trim();
        var rawKhuVuc = (String(khValues[k][10] || "") + " " + String(khValues[k][2] || "")).toLowerCase();
        var matchedArea = "Quý Lộc";
        if (rawKhuVuc.indexOf("yên trường") > -1 || rawKhuVuc.indexOf("yen truong") > -1) {
          matchedArea = "Yên Trường";
        } else if (rawKhuVuc.indexOf("vĩnh lộc") > -1 || rawKhuVuc.indexOf("vinh loc") > -1) {
          matchedArea = "Vĩnh Lộc";
        } else {
          matchedArea = "Quý Lộc";
        }
        custAreaMap[makh] = matchedArea;
      }
    }

    // 2. Cơ cấu dư nợ theo 3 địa bàn xã chính & Cán bộ quản lý phụ trách
    var areaMap = {
      "Quý Lộc": {
        key: "quyloc",
        name: "Xã Quý Lộc",
        subText: "Địa bàn trọng điểm (Thôn Đan Nê, Tân Lộc, Tu Mục)",
        cbqlUser: "qtdyentho.huyennhu",
        cbqlName: "Trần Như Huyền",
        countHD: 0,
        countKH: 0,
        duNo: 0,
        khSet: {}
      },
      "Yên Trường": {
        key: "yentruong",
        name: "Xã Yên Trường",
        subText: "Địa bàn mở rộng (Thôn Phố Kiểu, Lựu Khê, Thạc Quả)",
        cbqlUser: "qtdyentho.luudinh",
        cbqlName: "Lưu Thị Định",
        countHD: 0,
        countKH: 0,
        duNo: 0,
        khSet: {}
      },
      "Vĩnh Lộc": {
        key: "vinhloc",
        name: "Xã Vĩnh Lộc",
        subText: "Địa bàn liên kết (Thôn Kỳ Ngãi, Phi Bình, Yên Lạc, Thọ Vực)",
        cbqlUser: "qtdyentho.huunhan",
        cbqlName: "Nguyễn Hữu Nhân",
        countHD: 0,
        countKH: 0,
        duNo: 0,
        khSet: {}
      }
    };

    // 3. Cơ cấu sản phẩm tín dụng theo 3 nhóm chính
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

    if (sHDTD && sHDTD.getLastRow() > 1) {
      var hdValues = sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, 14).getValues();
      for (var i = 0; i < hdValues.length; i++) {
        var makh = String(hdValues[i][1]).replace(/^'/, '').trim();
        var duNo = Number(hdValues[i][3]) || 0;
        var laiSuat = Number(hdValues[i][4]) || 0;
        var maLoaiVay = String(hdValues[i][8] || "").trim();
        var moTaVay = String(hdValues[i][10] || "").trim();
        var trangThaiHD = String(hdValues[i][13] || "DANG_VAY").trim();

        if (trangThaiHD !== "DA_TAT_TOAN" && duNo > 0) {
          totalDuNo += duNo;
          totalHopDong++;
          totalDuThuLai += (duNo * (laiSuat / 100)) / 12;

          // Phân bổ địa bàn 3 Xã theo khách hàng thực tế
          var areaKey = custAreaMap[makh] || "Quý Lộc";
          if (areaMap[areaKey]) {
            areaMap[areaKey].countHD++;
            areaMap[areaKey].duNo += duNo;
            if (!areaMap[areaKey].khSet[makh]) {
              areaMap[areaKey].khSet[makh] = true;
              areaMap[areaKey].countKH++;
            }
          }

          // Phân loại 3 nhóm sản phẩm cho vay
          var productName = maLoaiVay || moTaVay || "Cho vay khác";
          var grpKey = "kinh_doanh";
          if (productName.indexOf("Sản Xuất NN") > -1 || productName.indexOf("Nông nghiệp") > -1) {
            grpKey = "nong_nghiep";
          } else if (productName.indexOf("Sinh hoạt") > -1 || productName.indexOf("Tiêu dùng") > -1) {
            grpKey = "sinh_hoat";
          }
          loanGroups[grpKey].count++;
          loanGroups[grpKey].duNo += duNo;
          if (!loanGroups[grpKey].subtypes[productName]) {
            loanGroups[grpKey].subtypes[productName] = { name: productName, count: 0, duNo: 0 };
          }
          loanGroups[grpKey].subtypes[productName].count++;
          loanGroups[grpKey].subtypes[productName].duNo += duNo;
        }
      }
    }

    // Tính tỷ trọng % cho 3 Xã và 3 Nhóm sản phẩm
    for (var aKey in areaMap) {
      delete areaMap[aKey].khSet;
      areaMap[aKey].rate = totalDuNo > 0 ? (Math.round((areaMap[aKey].duNo / totalDuNo) * 1000) / 10) + "%" : "0%";
    }
    for (var gKey in loanGroups) {
      loanGroups[gKey].rate = totalDuNo > 0 ? (Math.round((loanGroups[gKey].duNo / totalDuNo) * 1000) / 10) + "%" : "0%";
      loanGroups[gKey].subtypes = Object.values(loanGroups[gKey].subtypes);
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
      loanTypes: Object.values(loanGroups),
      loanGroups: Object.values(loanGroups)
    };

    CacheHelper.setCachedData('dashboard_stats', result, 15);
    return { status: "success", data: result };
  }
};
