/**
 * ========================================================================================
 * CREDITCORES - DASHBOARDCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module DashboardController xử lý nghiệp vụ liên quan
 *              Hỗ trợ chế độ:
 *              - 'current': Tổng quan hiện tại thời gian thực (HDTD_CORE)
 *              - 'as_of_date': Tổng quan đến ngày chốt số liệu (HDTD_CORE_DN)
 *              - 'compare': Đối sánh tăng trưởng giữa các mốc / các năm
 * @created     15/08/2026
 * @updated     21/09/2026
 * @version     3.2 Multi-Period & As-Of-Date Snapshot Engine
 * ========================================================================================
 */

var DashboardController = {
  /**
   * Quét và lập danh sách các sheet snapshot lưu trữ theo mốc ngày / các năm
   */
  _listSnapshotSheets: function(ss) {
    var allSheets = ss.getSheets();
    var snapshots = [];
    for (var i = 0; i < allSheets.length; i++) {
      var name = allSheets[i].getName();
      if (name.indexOf("HDTD_CORE_") === 0) {
        var subName = name.replace("HDTD_CORE_", "");
        var label = "Đến ngày (" + subName + ")";
        if (subName === "DN") {
          label = "Dữ liệu đến ngày (HDTD_CORE_DN)";
        } else if (subName === "ALL") {
          label = "Dữ liệu các ngày cuối tháng (HDTD_CORE_ALL)";
        } else if (/^\d{4}$/.test(subName)) {
          label = "Năm " + subName + " (" + name + ")";
        }
        snapshots.push({
          sheetName: name,
          label: label,
          rowCount: Math.max(0, allSheets[i].getLastRow() - 1)
        });
      }
    }
    return snapshots;
  },

  /**
   * Ánh xạ thông tin khách hàng từ KH_CORE
   */
  _buildCustMap: function(sKH) {
    var custMap = {};
    if (!sKH || sKH.getLastRow() <= 1) return custMap;

    var colMapKH = HeaderUtils.getHeaderMap(sKH);
    var khValues = sKH.getRange(2, 1, sKH.getLastRow() - 1, sKH.getLastColumn()).getValues();
    for (var k = 0; k < khValues.length; k++) {
      var makh = String(HeaderUtils.getCell(khValues[k], colMapKH, "MaKH", "")).replace(/^'/, '').trim();
      var directXa = String(HeaderUtils.getCell(khValues[k], colMapKH, "KvXa", "")).trim();
      var directThon = String(HeaderUtils.getCell(khValues[k], colMapKH, "KvThon", "")).trim();
      var rawKhuVuc = (String(HeaderUtils.getCell(khValues[k], colMapKH, "KhuVuc", "")) + " " + String(HeaderUtils.getCell(khValues[k], colMapKH, "DiaChi", ""))).trim();
      var hoten = String(HeaderUtils.getCell(khValues[k], colMapKH, "HoTen", "")).trim();
      var sotv = String(HeaderUtils.getCell(khValues[k], colMapKH, "SoTV", "")).replace(/^'/, "").trim();

      var xa = directXa;
      if (!xa) {
        var rawLower = rawKhuVuc.toLowerCase();
        if (rawLower.indexOf("yên trường") > -1 || rawLower.indexOf("yen truong") > -1) {
          xa = "Xã Yên Trường";
        } else if (rawLower.indexOf("vĩnh lộc") > -1 || rawLower.indexOf("vinh loc") > -1) {
          xa = "Xã Vĩnh Lộc";
        } else {
          xa = "Xã Quý Lộc";
        }
      }

      var thon = directThon;
      if (!thon) {
        thon = "Khu trung tâm " + xa.replace("Xã ", "");
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
      }
      custMap[makh] = { hoten: hoten, sotv: sotv, xa: xa, thon: thon };
    }
    return custMap;
  },

  /**
   * Tính toán bộ chỉ số thống kê từ một Sheet Hợp đồng Tín dụng (HDTD_CORE hoặc HDTD_CORE_DN)
   * Hỗ trợ tự động nhận diện Sheet 2 tầng (Dòng 1: Banner Metadata sao kê, Dòng 2: Header 17 cột, Dòng 3+: Data)
   */
  _computeHdtdStats: function(sHDTD, custMap, sDS, sNoTon, sDot, sAppraisal, sInspection, sheetDisplayName) {
    var isTwoTier = false;
    var asOfMetadataText = "";
    if (sHDTD && sHDTD.getLastRow() >= 1) {
      var firstCellVal = String(sHDTD.getRange(1, 1).getValue() || "").trim();
      if (firstCellVal.indexOf("Sao kê") > -1 || firstCellVal.indexOf("Lưu trữ") > -1 || sHDTD.getFrozenRows() >= 2 || sHDTD.getName().indexOf("HDTD_CORE_DN") > -1 || sHDTD.getName().indexOf("HDTD_CORE_ALL") > -1) {
        isTwoTier = true;
        asOfMetadataText = firstCellVal;
      }
    }

    var minRequiredRows = isTwoTier ? 2 : 1;
    if (!sHDTD || sHDTD.getLastRow() <= minRequiredRows) {
      return {
        hasData: false,
        sheetName: sHDTD ? sHDTD.getName() : "",
        sheetDisplayName: sheetDisplayName || "",
        asOfMetadata: asOfMetadataText,
        isTwoTier: isTwoTier,
        totalDuNo: 0,
        totalHopDong: 0,
        totalThanhVienVay: 0,
        duNoBinhQuanHD: 0,
        duNoBinhQuanTV: 0,
        laiSuatBinhQuan: 0,
        totalDuThuLai: 0,
        totalKhachHangTrichNo: 0,
        totalNoTon: 0,
        countNoTon: 0,
        pendingAppraisals: 0,
        pendingInspections: 0,
        recentBatches: [],
        areaStats: [],
        cbtdStats: [],
        loanTypes: [],
        loanGroups: [],
        securityTypes: [],
        top50DuNoDenNgay: [],
        top50DuNoBinhQuanCuoiThang: [],
        monthlyDebtTrend: []
      };
    }

    var totalDuNo = 0;
    var totalHopDong = 0;
    var totalDuThuLai = 0;

    // 1. Phân bổ theo 3 địa bàn xã chính & phân rã theo Thôn
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

    // 2. Cơ cấu theo Cán bộ quản lý tín dụng (CBTD Portfolio)
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

    // 4. Cơ cấu 7 loại mã hợp đồng bảo đảm
    var securityTypesMap = {
      "THCDBTNMT": { code: "THCDBTNMT", label: "Trung hạn có đảm bảo, đăng ký GDBĐ", count: 0, duNo: 0, color: "#2563eb" },
      "THBLCDBTNMT": { code: "THBLCDBTNMT", label: "Trung hạn đăng ký GDBĐ uỷ quyền", count: 0, duNo: 0, color: "#0891b2" },
      "NHCDBTNMT": { code: "NHCDBTNMT", label: "Ngắn hạn có đảm bảo, đăng ký GDBĐ", count: 0, duNo: 0, color: "#059669" },
      "THCDB": { code: "THCDB", label: "Trung hạn có TSBĐ không đăng ký GDBĐ", count: 0, duNo: 0, color: "#d97706" },
      "NHCDB": { code: "NHCDB", label: "Ngắn hạn có TSBĐ không đăng ký GDBĐ", count: 0, duNo: 0, color: "#ea580c" },
      "NHKDB": { code: "NHKDB", label: "Ngắn hạn, tín chấp", count: 0, duNo: 0, color: "#64748b" },
      "THKDB": { code: "THKDB", label: "Trung hạn tín chấp", count: 0, duNo: 0, color: "#475569" }
    };

    var allBorrowersSet = {};
    var totalWeightedLai = 0;

    var headerRow = isTwoTier ? 2 : 1;
    var startDataRow = isTwoTier ? 3 : 2;
    var numDataRows = sHDTD.getLastRow() - headerRow;
    var colMapHD = HeaderUtils.getHeaderMap(sHDTD, headerRow);
    var hdValues = sHDTD.getRange(startDataRow, 1, numDataRows, sHDTD.getLastColumn()).getValues();

    var customerAggMap = {}; // { [makh]: { maKH, hoTen, diaChi, xa, thon, soHDCount, tongDuNo, monthlyDebts: {} } }
    var monthlyTrendMap = {}; // { [dateKey]: { dateKey, totalDuNo, countHD, khSet: {} } }

    for (var i = 0; i < hdValues.length; i++) {
      var makh = String(HeaderUtils.getCell(hdValues[i], colMapHD, "MaKH", "")).replace(/^'/, '').trim();
      var duNo = Number(HeaderUtils.getCell(hdValues[i], colMapHD, "DuNo", 0)) || 0;
      var laiSuat = Number(String(HeaderUtils.getCell(hdValues[i], colMapHD, "LaiSuat", 0)).replace(',', '.')) || 0;
      var maLoaiVay = String(HeaderUtils.getCell(hdValues[i], colMapHD, "MaLoaiVay", "")).trim();
      var moTaVay = String(HeaderUtils.getCell(hdValues[i], colMapHD, "MoTaVay", "")).trim();
      var cbtdUser = String(HeaderUtils.getCell(hdValues[i], colMapHD, "CBTD_PhuTrach", "")).trim();
      var cbtdName = String(HeaderUtils.getCell(hdValues[i], colMapHD, "Ten_CBTD", "")).trim();
      var trangThaiHD = String(HeaderUtils.getCell(hdValues[i], colMapHD, "TrangThaiHD", duNo > 0 ? "DANG_VAY" : "DA_TAT_TOAN")).trim();
      var maLoaiHD = String(HeaderUtils.getCell(hdValues[i], colMapHD, "MaLoaiHD", "")).trim();
      var directXa = String(HeaderUtils.getCell(hdValues[i], colMapHD, "KvXa", "")).trim();
      var directThon = String(HeaderUtils.getCell(hdValues[i], colMapHD, "KvThon", "")).trim();
      var rawHoTen = String(HeaderUtils.getCell(hdValues[i], colMapHD, "HoTen", "")).trim();
      var rawDiaChi = String(HeaderUtils.getCell(hdValues[i], colMapHD, "DiaChi", "")).trim();
      var ngayDuLieu = String(HeaderUtils.getCell(hdValues[i], colMapHD, "NgayDuLieu", "")).trim();

      if (trangThaiHD !== "DA_TAT_TOAN" && duNo > 0) {
        totalDuNo += duNo;
        totalHopDong++;
        totalDuThuLai += (duNo * (laiSuat / 100)) / 12;
        totalWeightedLai += (duNo * laiSuat);
        allBorrowersSet[makh] = true;

        var cust = custMap[makh] || { hoten: rawHoTen, xa: "Xã Quý Lộc", thon: "Thôn khác" };
        var xa = directXa || cust.xa || "Xã Quý Lộc";
        var thon = directThon || cust.thon || "Thôn khác";
        var hoten = rawHoTen || cust.hoten || ("Khách hàng " + makh);
        var diachi = rawDiaChi || (thon + ", " + xa);

        // Thu thập dữ liệu khách hàng cho Top 50 & Báo cáo
        if (!customerAggMap[makh]) {
          customerAggMap[makh] = {
            maKH: makh,
            hoTen: hoten,
            diaChi: diachi,
            xa: xa,
            thon: thon,
            soHDCount: 0,
            tongDuNo: 0,
            monthlyDebts: {}
          };
        }
        customerAggMap[makh].soHDCount++;
        customerAggMap[makh].tongDuNo += duNo;

        // Nếu có NgayDuLieu (sao kê các mốc hoặc ngày chốt)
        var dateKey = ngayDuLieu || "Hiện tại";
        if (!monthlyTrendMap[dateKey]) {
          monthlyTrendMap[dateKey] = {
            dateKey: dateKey,
            totalDuNo: 0,
            countHD: 0,
            khSet: {}
          };
        }
        monthlyTrendMap[dateKey].totalDuNo += duNo;
        monthlyTrendMap[dateKey].countHD++;
        monthlyTrendMap[dateKey].khSet[makh] = true;

        customerAggMap[makh].monthlyDebts[dateKey] = (customerAggMap[makh].monthlyDebts[dateKey] || 0) + duNo;

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

        // Tích lũy nhóm cho vay
        loanGroups[grpKey].count++;
        loanGroups[grpKey].duNo += duNo;
        if (!loanGroups[grpKey].subtypes[prodName]) {
          loanGroups[grpKey].subtypes[prodName] = { name: prodName, count: 0, duNo: 0 };
        }
        loanGroups[grpKey].subtypes[prodName].count++;
        loanGroups[grpKey].subtypes[prodName].duNo += duNo;

        // Tích lũy hình thức bảo đảm MaLoaiHD
        var cleanLoaiHD = maLoaiHD.toUpperCase();
        if (securityTypesMap[cleanLoaiHD]) {
          securityTypesMap[cleanLoaiHD].count++;
          securityTypesMap[cleanLoaiHD].duNo += duNo;
        } else {
          var fallbackKey = cleanLoaiHD.indexOf("TH") === 0 ? "THCDBTNMT" : "NHCDBTNMT";
          securityTypesMap[fallbackKey].count++;
          securityTypesMap[fallbackKey].duNo += duNo;
        }

        // Tích lũy theo Xã & Thôn
        if (!byCommuneMap[xa]) xa = "Xã Quý Lộc";
        var cObj = byCommuneMap[xa];
        cObj.countHD++;
        cObj.duNo += duNo;
        cObj.loanGroups[grpShort] = (cObj.loanGroups[grpShort] || 0) + duNo;
        if (!cObj.khSet[makh]) {
          cObj.khSet[makh] = true;
          cObj.countKH++;
        }

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
        var thonObj = cObj.thonsMap[thon];
        thonObj.duno += duNo;
        thonObj.countHD++;
        thonObj.loanGroups[grpShort] = (thonObj.loanGroups[grpShort] || 0) + duNo;
        if (!thonObj.khSet[makh]) {
          thonObj.khSet[makh] = true;
          thonObj.countKH++;
        }

        // Tích lũy theo CBTD
        var cbKey = cbtdUser;
        if (!byCbtdMap[cbKey]) {
          if (xa === "Xã Quý Lộc") cbKey = "qtdyentho.huyennhu";
          else if (xa === "Xã Yên Trường") cbKey = "qtdyentho.luudinh";
          else cbKey = "qtdyentho.huunhan";
        }

        var cbObj = byCbtdMap[cbKey];
        cbObj.countHD++;
        cbObj.duNo += duNo;
        cbObj.loanGroups[grpShort] = (cbObj.loanGroups[grpShort] || 0) + duNo;
        if (!cbObj.khSet[makh]) {
          cbObj.khSet[makh] = true;
          cbObj.countKH++;
        }

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

    // Hoàn tất securityTypes
    var securityTypesList = [];
    for (var sCode in securityTypesMap) {
      var sItem = securityTypesMap[sCode];
      sItem.rate = totalDuNo > 0 ? (Math.round((sItem.duNo / totalDuNo) * 1000) / 10) + "%" : "0%";
      securityTypesList.push(sItem);
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

    // 5. Tính Top 50 khách hàng có dư nợ lớn nhất đến ngày
    var allCustList = [];
    for (var mId in customerAggMap) {
      allCustList.push(customerAggMap[mId]);
    }
    allCustList.sort(function(a, b) { return b.tongDuNo - a.tongDuNo; });

    var top50DuNoDenNgay = [];
    var topCount = Math.min(50, allCustList.length);
    for (var cIdx = 0; cIdx < topCount; cIdx++) {
      var cItem = allCustList[cIdx];
      top50DuNoDenNgay.push({
        rank: cIdx + 1,
        maKH: cItem.maKH,
        hoTen: cItem.hoTen,
        diaChi: cItem.diaChi,
        xa: cItem.xa,
        thon: cItem.thon,
        soHDCount: cItem.soHDCount,
        tongDuNo: cItem.tongDuNo,
        tyLe: totalDuNo > 0 ? (Math.round((cItem.tongDuNo / totalDuNo) * 1000) / 10) + "%" : "0%"
      });
    }

    // 6. Tính Biểu đồ xu hướng dư nợ theo các tháng/mốc (monthlyDebtTrend)
    var monthlyDebtTrend = [];
    var dateKeys = Object.keys(monthlyTrendMap);
    dateKeys.sort(function(a, b) {
      var parseD = function(str) {
        var p = String(str).split('/');
        if (p.length === 3) return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0])).getTime();
        return 0;
      };
      return parseD(a) - parseD(b);
    });

    for (var dIdx = 0; dIdx < dateKeys.length; dIdx++) {
      var dKey = dateKeys[dIdx];
      var mData = monthlyTrendMap[dKey];
      var countKH = Object.keys(mData.khSet).length;
      monthlyDebtTrend.push({
        date: dKey,
        totalDuNo: mData.totalDuNo,
        countHD: mData.countHD,
        countKH: countKH,
        duNoBinhQuanKH: countKH > 0 ? Math.round(mData.totalDuNo / countKH) : 0
      });
    }

    // 7. Tính Top 50 khách hàng có dư nợ bình quân lớn nhất (chỉ tính đến các ngày cuối tháng sao kê)
    var numSnapshots = dateKeys.length > 0 ? dateKeys.length : 1;
    var allCustAvgList = [];
    for (var aId in customerAggMap) {
      var custObj = customerAggMap[aId];
      var sumAllMonths = 0;
      var activeMonthsCount = 0;
      for (var dk in custObj.monthlyDebts) {
        sumAllMonths += custObj.monthlyDebts[dk];
        if (custObj.monthlyDebts[dk] > 0) activeMonthsCount++;
      }
      var duNoBinhQuan = Math.round(sumAllMonths / numSnapshots);
      allCustAvgList.push({
        maKH: custObj.maKH,
        hoTen: custObj.hoTen,
        diaChi: custObj.diaChi,
        xa: custObj.xa,
        thon: custObj.thon,
        duNoBinhQuan: duNoBinhQuan,
        tongDuNoHienTai: custObj.tongDuNo,
        soThangCoDuNo: activeMonthsCount,
        chiTietThang: custObj.monthlyDebts
      });
    }
    allCustAvgList.sort(function(a, b) { return b.duNoBinhQuan - a.duNoBinhQuan; });

    var top50DuNoBinhQuanCuoiThang = [];
    var topAvgCount = Math.min(50, allCustAvgList.length);
    for (var avgIdx = 0; avgIdx < topAvgCount; avgIdx++) {
      var avgItem = allCustAvgList[avgIdx];
      avgItem.rank = avgIdx + 1;
      top50DuNoBinhQuanCuoiThang.push(avgItem);
    }

    return {
      hasData: true,
      sheetName: sHDTD.getName(),
      sheetDisplayName: sheetDisplayName || sHDTD.getName(),
      asOfMetadata: asOfMetadataText,
      isTwoTier: isTwoTier,
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
      loanGroups: Object.values(loanGroups),
      securityTypes: securityTypesList,
      top50DuNoDenNgay: top50DuNoDenNgay,
      top50DuNoBinhQuanCuoiThang: top50DuNoBinhQuanCuoiThang,
      monthlyDebtTrend: monthlyDebtTrend
    };
  },

  /**
   * Handler chính trả về Dashboard Stats theo chế độ:
   * - 'current': Hiện tại từ HDTD_CORE
   * - 'as_of_date': Đến ngày từ HDTD_CORE_DN (hoặc sheet được chỉ định)
   * - 'compare': Đối sánh tăng trưởng Hiện tại vs Đến ngày / Các năm
   */
  handleGetDashboardStats: function(ss, params) {
    ss = getSpreadsheetInstance(ss);
    if (!ss) {
      return { status: "error", message: "Không thể kết nối Google Spreadsheet!" };
    }

    params = params || {};
    var mode = params.mode || "current"; // "current" | "as_of_date" | "compare"
    var targetSheet = params.sheetName || (mode === "as_of_date" ? "HDTD_CORE_DN" : "HDTD_CORE");
    var asOfDate = params.asOfDate || "";

    var cacheKey = "dashboard_stats_" + mode + "_" + targetSheet + "_" + (asOfDate ? asOfDate.replace(/\//g, "") : "");
    var cached = CacheHelper.getCachedData(cacheKey);
    if (cached) return { status: "success", data: cached };

    var sKH = ss.getSheetByName("KH_CORE");
    var sNoTon = ss.getSheetByName("NO_TON_DONG");
    var sDot = ss.getSheetByName("DOT_TRICH_NO");
    var sDS = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    var sAppraisal = ss.getSheetByName("THAM_DINH_TD");
    var sInspection = ss.getSheetByName("KIEM_TRA_VON");

    var custMap = this._buildCustMap(sKH);
    var snapshotSheets = this._listSnapshotSheets(ss);

    // 1. Tính toán dữ liệu Hiện Tại (HDTD_CORE)
    var sCurrent = ss.getSheetByName("HDTD_CORE");
    var currentStats = this._computeHdtdStats(sCurrent, custMap, sDS, sNoTon, sDot, sAppraisal, sInspection, "Hiện Tại (Thời Gian Thực)");
    currentStats.mode = "current";

    var finalResult;

    if (mode === "current") {
      finalResult = currentStats;
      finalResult.availableSnapshots = snapshotSheets;
    } else if (mode === "as_of_date") {
      // 2. Chế độ Đến Ngày: Lấy từ sheet chỉ định (mặc định HDTD_CORE_DN)
      var sTarget = ss.getSheetByName(targetSheet);
      if (!sTarget) {
        // Tự động kiểm tra schema nếu sheet chưa có
        SchemaSetup.ensureDatabaseSchema(ss);
        sTarget = ss.getSheetByName(targetSheet);
      }

      var displayName = "Đến Ngày Chốt (" + (asOfDate || targetSheet) + ")";
      var asOfStats = this._computeHdtdStats(sTarget, custMap, sDS, sNoTon, sDot, sAppraisal, sInspection, displayName);
      asOfStats.mode = "as_of_date";
      asOfStats.asOfDate = asOfDate;
      asOfStats.availableSnapshots = snapshotSheets;

      finalResult = asOfStats;
    } else {
      // 3. Chế độ So Sánh: Đối chiếu giữa Current và As-Of / Kỳ năm
      var sCompareTarget = ss.getSheetByName(targetSheet);
      var compareDisplayName = targetSheet === "HDTD_CORE_DN" ? ("Đến Ngày " + (asOfDate || "Chốt")) : targetSheet;
      var targetStats = this._computeHdtdStats(sCompareTarget, custMap, sDS, sNoTon, sDot, sAppraisal, sInspection, compareDisplayName);

      // Tính chênh lệch
      var diffDuNo = currentStats.totalDuNo - targetStats.totalDuNo;
      var growthDuNo = targetStats.totalDuNo > 0 ? (Math.round((diffDuNo / targetStats.totalDuNo) * 1000) / 10) : 0;
      var diffHD = currentStats.totalHopDong - targetStats.totalHopDong;
      var diffTV = currentStats.totalThanhVienVay - targetStats.totalThanhVienVay;

      finalResult = {
        mode: "compare",
        current: currentStats,
        asOf: targetStats,
        comparison: {
          targetSheet: targetSheet,
          asOfDate: asOfDate,
          diffDuNo: diffDuNo,
          growthDuNo: growthDuNo,
          diffHopDong: diffHD,
          diffThanhVien: diffTV
        },
        availableSnapshots: snapshotSheets
      };
    }

    // 4. Tự động kết nối và nạp số liệu chuỗi thời gian từ kho lưu trữ cuối tháng HDTD_CORE_ALL
    // TỐI ƯU HÓA FREE QUOTA: Sử dụng Cold Cache (6 giờ) để triệt tiêu việc đọc lại <10.000 dòng từ Google Sheets
    try {
      var allStatsCacheKey = "dashboard_stats_HDTD_CORE_ALL";
      var cachedAllStats = CacheHelper.getCachedData(allStatsCacheKey);

      if (!cachedAllStats) {
        var sAll = ss.getSheetByName("HDTD_CORE_ALL");
        if (sAll && sAll.getLastRow() > 2) {
          var allStats = this._computeHdtdStats(sAll, custMap, sDS, sNoTon, sDot, sAppraisal, sInspection, "Lưu Trữ Cuối Tháng (HDTD_CORE_ALL)");
          if (allStats && allStats.hasData) {
            cachedAllStats = {
              monthlyDebtTrend: allStats.monthlyDebtTrend || [],
              top50DuNoBinhQuanCuoiThang: allStats.top50DuNoBinhQuanCuoiThang || [],
              allMonthlyStats: {
                hasData: true,
                sheetName: "HDTD_CORE_ALL",
                asOfMetadata: allStats.asOfMetadata,
                totalSnapshots: allStats.monthlyDebtTrend ? allStats.monthlyDebtTrend.length : 0,
                totalDuNo: allStats.totalDuNo,
                totalHopDong: allStats.totalHopDong
              }
            };
            CacheHelper.setCachedData(allStatsCacheKey, cachedAllStats, CacheHelper.TIERS.COLD);
          }
        }
      }

      if (cachedAllStats) {
        if (cachedAllStats.monthlyDebtTrend && cachedAllStats.monthlyDebtTrend.length > 0) {
          finalResult.monthlyDebtTrend = cachedAllStats.monthlyDebtTrend;
        }
        if (cachedAllStats.top50DuNoBinhQuanCuoiThang && cachedAllStats.top50DuNoBinhQuanCuoiThang.length > 0) {
          finalResult.top50DuNoBinhQuanCuoiThang = cachedAllStats.top50DuNoBinhQuanCuoiThang;
        }
        finalResult.allMonthlyStats = cachedAllStats.allMonthlyStats;
      }
    } catch (eAll) {
      Logger.log("Lỗi nạp HDTD_CORE_ALL: " + eAll);
    }

    CacheHelper.setCachedData(cacheKey, finalResult, CacheHelper.TIERS.HOT);
    return { status: "success", data: finalResult };
  }
};
