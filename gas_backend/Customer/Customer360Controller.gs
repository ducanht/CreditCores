/**
 * ========================================================================================
 * CREDITCORES - CUSTOMER360CONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module Customer360Controller xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var Customer360Controller = {
  /**
   * Tra cứu 360° khách hàng và danh sách hợp đồng tín dụng
   * Tối ưu hiệu năng O(1) cho 5.175+ khách hàng và 549+ hợp đồng
   */
  handleSearchCustomer360: function(ss, data) {
    data = data || {};
    var query = (data.query || "").toLowerCase().trim();
    var cbtdFilter = (data.cbtdUsername || "").toLowerCase().trim();
    var statusFilter = (data.status || "").toUpperCase().trim(); // 'ALL' | 'DANG_VAY' | 'DA_TAT_TOAN'
    var maxLimit = data.limit ? Number(data.limit) : 250;
    var isDefaultSearch = (!query && (!cbtdFilter || cbtdFilter === "all") && (!statusFilter || statusFilter === "ALL"));
    if (isDefaultSearch) {
      var cachedDefault = (typeof CacheHelper !== 'undefined') ? CacheHelper.getCachedData('cust360_default') : null;
      if (cachedDefault) {
        return { status: "success", data: cachedDefault, total: cachedDefault.length, isFiltered: false };
      }
    }

    var sKH = ss.getSheetByName("KH_CORE");
    var sHDTD = ss.getSheetByName("HDTD_CORE");

    if (!sKH || sKH.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    // 1. Đọc dữ liệu hợp đồng và Gom vào Hash Map theo MaKH O(M)
    var colMapHD = HeaderUtils.getHeaderMap(sHDTD);
    var hdValues = (sHDTD && sHDTD.getLastRow() > 1) 
      ? sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, sHDTD.getLastColumn()).getValues() 
      : [];

    var contractsByMaKH = {};
    for (var j = 0; j < hdValues.length; j++) {
      var rowSoHD = String(HeaderUtils.getCell(hdValues[j], colMapHD, "SoHDTD", "")).trim();
      var rowMaKH = String(HeaderUtils.getCell(hdValues[j], colMapHD, "MaKH", "")).replace(/^'/, "").trim();
      if (!rowMaKH) continue;

      var cbtdUser = String(HeaderUtils.getCell(hdValues[j], colMapHD, "CBTD_PhuTrach", "qtdyentho.cbtd")).trim();
      var tenCBTD = String(HeaderUtils.getCell(hdValues[j], colMapHD, "Ten_CBTD", "Lê Văn Tín (CBTD)")).trim();
      var duNo = Number(HeaderUtils.getCell(hdValues[j], colMapHD, "DuNo", 0)) || 0;
      var trangThaiHD = String(HeaderUtils.getCell(hdValues[j], colMapHD, "TrangThaiHD", duNo > 0 ? "DANG_VAY" : "DA_TAT_TOAN")).trim();
      var ngayTatToan = HeaderUtils.getCell(hdValues[j], colMapHD, "NgayTatToan", "");
      if (ngayTatToan) ngayTatToan = formatGasDate(ngayTatToan);

      // Kiểm tra bộ lọc trạng thái
      if (statusFilter && statusFilter !== "ALL" && trangThaiHD !== statusFilter) {
        continue;
      }

      // Kiểm tra bộ lọc CBTD
      if (cbtdFilter && cbtdFilter !== "all" && cbtdUser.toLowerCase() !== cbtdFilter) {
        continue;
      }

      if (!contractsByMaKH[rowMaKH]) {
        contractsByMaKH[rowMaKH] = [];
      }

      contractsByMaKH[rowMaKH].push({
        soHDTD: rowSoHD,
        maKH: rowMaKH,
        tienVay: Number(HeaderUtils.getCell(hdValues[j], colMapHD, "TienVay", 0)) || 0,
        duNo: duNo,
        laiSuat: Number(HeaderUtils.getCell(hdValues[j], colMapHD, "LaiSuat", 0)) || 0,
        ngayVay: formatGasDate(HeaderUtils.getCell(hdValues[j], colMapHD, "NgayVay", "")),
        denHan: formatGasDate(HeaderUtils.getCell(hdValues[j], colMapHD, "DenHan", "")),
        traLaiDenNgay: formatGasDate(HeaderUtils.getCell(hdValues[j], colMapHD, "TraLaiDenNgay", "")),
        maLoaiVay: String(HeaderUtils.getCell(hdValues[j], colMapHD, "MaLoaiVay", "LV01")),
        soThangVay: Number(HeaderUtils.getCell(hdValues[j], colMapHD, "SoThangVay", 12)) || 12,
        moTaVay: String(HeaderUtils.getCell(hdValues[j], colMapHD, "MoTaVay", "")),
        hoTen: String(HeaderUtils.getCell(hdValues[j], colMapHD, "HoTen", "")),
        cccd: String(HeaderUtils.getCell(hdValues[j], colMapHD, "CCCD", "")).replace(/^'/, ""),
        dienThoai: String(HeaderUtils.getCell(hdValues[j], colMapHD, "DienThoai", "")).replace(/^'/, ""),
        diaChi: String(HeaderUtils.getCell(hdValues[j], colMapHD, "DiaChi", "")),
        kvXa: String(HeaderUtils.getCell(hdValues[j], colMapHD, "KvXa", "")),
        kvThon: String(HeaderUtils.getCell(hdValues[j], colMapHD, "KvThon", "")),
        cbtdPhuTrach: cbtdUser,
        tenCBTD: tenCBTD,
        trangThaiHD: trangThaiHD,
        ngayTatToan: ngayTatToan,
        ngayCapNhat: HeaderUtils.getCell(hdValues[j], colMapHD, "NgayCapNhat", "") ? formatGasDateTime(HeaderUtils.getCell(hdValues[j], colMapHD, "NgayCapNhat", "")) : ""
      });
    }

    // 2. Đọc bảng Khách hàng
    var colMapKH = HeaderUtils.getHeaderMap(sKH);
    var khValues = sKH.getRange(2, 1, sKH.getLastRow() - 1, sKH.getLastColumn()).getValues();
    var results = [];

    // Helper đóng gói object khách hàng
    var buildCustomerObj = function(row, contracts) {
      var custContracts = contracts || [];
      var custCBTD = "";
      var custTenCBTD = "";
      if (custContracts.length > 0) {
        custCBTD = custContracts[0].cbtdPhuTrach;
        custTenCBTD = custContracts[0].tenCBTD;
      }

      return {
        maKH: String(HeaderUtils.getCell(row, colMapKH, "MaKH", "")).replace(/^'/, "").trim(),
        hoTen: String(HeaderUtils.getCell(row, colMapKH, "HoTen", "")).trim(),
        diaChi: String(HeaderUtils.getCell(row, colMapKH, "DiaChi", "")).trim(),
        ngaySinh: formatGasDate(HeaderUtils.getCell(row, colMapKH, "NgaySinh", "")),
        cccd: String(HeaderUtils.getCell(row, colMapKH, "CCCD", "")).replace(/^'/, "").trim(),
        ngayCap: formatGasDate(HeaderUtils.getCell(row, colMapKH, "NgayCap", "")),
        noiCap: String(HeaderUtils.getCell(row, colMapKH, "NoiCap", "")).trim(),
        dienThoai: String(HeaderUtils.getCell(row, colMapKH, "DienThoai", "")).replace(/^'/, "").trim(),
        dienThoaiDD: String(HeaderUtils.getCell(row, colMapKH, "DienThoaiDD", "")).replace(/^'/, "").trim(),
        soTK: String(HeaderUtils.getCell(row, colMapKH, "SoTK", "")).replace(/^'/, "").trim(),
        khuVuc: String(HeaderUtils.getCell(row, colMapKH, "KhuVuc", "")).trim(),
        kvXa: String(HeaderUtils.getCell(row, colMapKH, "KvXa", "")).trim(),
        kvThon: String(HeaderUtils.getCell(row, colMapKH, "KvThon", "")).trim(),
        soTV: String(HeaderUtils.getCell(row, colMapKH, "SoTV", "")).replace(/^'/, "").trim(),
        soSoCP: String(HeaderUtils.getCell(row, colMapKH, "SoSoCP", "")).trim(),
        ngayVaoTV: formatGasDate(HeaderUtils.getCell(row, colMapKH, "NgayVaoTV", "")),
        tongTienCP: Number(HeaderUtils.getCell(row, colMapKH, "TongTienCP", 0)) || 0,
        tongDuNoHienTai: Number(HeaderUtils.getCell(row, colMapKH, "TongDuNoHienTai", 0)) || 0,
        soLuongHDVay: Number(HeaderUtils.getCell(row, colMapKH, "SoLuongHDVay", 0)) || 0,
        trangThaiVay: String(HeaderUtils.getCell(row, colMapKH, "TrangThaiVay", "")).trim(),
        nhomNoCIC: String(HeaderUtils.getCell(row, colMapKH, "NhomNoCIC", "")).trim(),
        cbtdPhuTrach: custCBTD || "qtdyentho.cbtd",
        tenCBTD: custTenCBTD || "Lê Văn Tín (CBTD)",
        contracts: custContracts
      };
    };

    // TRƯỜNG HỢP 1: Người dùng KHÔNG nhập từ khóa tìm kiếm (query rỗng)
    // Ưu tiên hiển thị tức thì toàn bộ khách hàng CÓ HỢP ĐỒNG VAY thỏa mãn bộ lọc
    if (!query) {
      // Lập Map tra cứu khách hàng nhanh O(1)
      var khMap = {};
      for (var k = 0; k < khValues.length; k++) {
        var mKH = String(HeaderUtils.getCell(khValues[k], colMapKH, "MaKH", "")).replace(/^'/, "").trim();
        if (mKH) khMap[mKH] = khValues[k];
      }

      // Lấy danh sách khách hàng từ các hợp đồng thỏa mãn bộ lọc
      var seenCust = {};
      for (var cMaKH in contractsByMaKH) {
        if (results.length >= maxLimit) break;
        if (!seenCust[cMaKH]) {
          seenCust[cMaKH] = true;
          var khRow = khMap[cMaKH];
          if (khRow) {
            results.push(buildCustomerObj(khRow, contractsByMaKH[cMaKH]));
          }
        }
      }

      // Nếu không có bộ lọc CBTD và Trạng thái và số lượng chưa đủ, bổ sung thêm các KH đầu tiên
      if (!cbtdFilter || cbtdFilter === "all") {
        if (!statusFilter || statusFilter === "ALL") {
          for (var idx = 0; idx < khValues.length && results.length < maxLimit; idx++) {
            var currMaKH = String(HeaderUtils.getCell(khValues[idx], colMapKH, "MaKH", "")).replace(/^'/, "").trim();
            if (!seenCust[currMaKH]) {
              seenCust[currMaKH] = true;
              results.push(buildCustomerObj(khValues[idx], contractsByMaKH[currMaKH] || []));
            }
          }
        }
      }

      if (isDefaultSearch && typeof CacheHelper !== 'undefined') {
        CacheHelper.setCachedData('cust360_default', results, 60);
      }
      return { status: "success", data: results, total: results.length, isFiltered: false };
    }

    // TRƯỜNG HỢP 2: Người dùng CÓ nhập từ khóa tìm kiếm (query)
    for (var i = 0; i < khValues.length; i++) {
      if (results.length >= maxLimit) break;

      var maKH = String(HeaderUtils.getCell(khValues[i], colMapKH, "MaKH", "")).replace(/^'/, "").trim();
      var hoTen = String(HeaderUtils.getCell(khValues[i], colMapKH, "HoTen", "")).trim();
      var cccd = String(HeaderUtils.getCell(khValues[i], colMapKH, "CCCD", "")).replace(/^'/, "").trim();
      var phone = String(HeaderUtils.getCell(khValues[i], colMapKH, "DienThoai", "") || HeaderUtils.getCell(khValues[i], colMapKH, "DienThoaiDD", "")).replace(/^'/, "").trim();
      var soTK = String(HeaderUtils.getCell(khValues[i], colMapKH, "SoTK", "")).replace(/^'/, "").trim();
      var khuVuc = String(HeaderUtils.getCell(khValues[i], colMapKH, "KhuVuc", "") || HeaderUtils.getCell(khValues[i], colMapKH, "DiaChi", "")).trim();

      var isMatch = 
        maKH.toLowerCase().indexOf(query) > -1 ||
        hoTen.toLowerCase().indexOf(query) > -1 ||
        cccd.indexOf(query) > -1 ||
        phone.indexOf(query) > -1 ||
        soTK.indexOf(query) > -1 ||
        khuVuc.toLowerCase().indexOf(query) > -1;

      if (isMatch) {
        var cList = contractsByMaKH[maKH] || [];
        // Nếu có lọc theo CBTD hoặc Trạng thái mà không có hợp đồng thỏa mãn -> bỏ qua
        if (((cbtdFilter && cbtdFilter !== "all") || (statusFilter && statusFilter !== "ALL")) && cList.length === 0) {
          continue;
        }

        results.push(buildCustomerObj(khValues[i], cList));
      }
    }

    return { status: "success", data: results, total: results.length, isFiltered: true };
  },

  /**
   * Tính toán Thống kê KPI Danh mục Hợp đồng cho CBTD
   */
  handleGetCBTDPortfolioStats: function(ss, data) {
    var cbtdUsername = (data.cbtdUsername || "").toLowerCase().trim();
    var sHDTD = ss.getSheetByName("HDTD_CORE");

    if (!sHDTD || sHDTD.getLastRow() <= 1) {
      return {
        status: "success",
        data: {
          totalContracts: 0,
          activeContracts: 0,
          settledContracts: 0,
          totalActivePrincipal: 0,
          totalOriginalLoan: 0,
          totalCustomers: 0,
          dueIn30Days: 0,
          pastDueContracts: 0,
          cbtdList: []
        }
      };
    }

    var colMapHD = HeaderUtils.getHeaderMap(sHDTD);
    var hdValues = sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, sHDTD.getLastColumn()).getValues();
    var now = new Date();
    var in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    var totalContracts = 0;
    var activeContracts = 0;
    var settledContracts = 0;
    var totalActivePrincipal = 0;
    var totalOriginalLoan = 0;
    var uniqueCustomers = {};
    var dueIn30Days = 0;
    var pastDueContracts = 0;
    var cbtdSummaryMap = {};

    for (var i = 0; i < hdValues.length; i++) {
      var soHD = String(HeaderUtils.getCell(hdValues[i], colMapHD, "SoHDTD", "")).trim();
      if (!soHD) continue;
      var maKH = String(HeaderUtils.getCell(hdValues[i], colMapHD, "MaKH", "")).replace(/^'/, "").trim();
      var tienVay = Number(HeaderUtils.getCell(hdValues[i], colMapHD, "TienVay", 0)) || 0;
      var duNo = Number(HeaderUtils.getCell(hdValues[i], colMapHD, "DuNo", 0)) || 0;
      var cbtd = String(HeaderUtils.getCell(hdValues[i], colMapHD, "CBTD_PhuTrach", "qtdyentho.cbtd")).trim();
      var tenCBTD = String(HeaderUtils.getCell(hdValues[i], colMapHD, "Ten_CBTD", "Lê Văn Tín (CBTD)")).trim();
      var trangThai = String(HeaderUtils.getCell(hdValues[i], colMapHD, "TrangThaiHD", duNo > 0 ? "DANG_VAY" : "DA_TAT_TOAN")).trim();
      var rawDenHan = HeaderUtils.getCell(hdValues[i], colMapHD, "DenHan", "");

      // Ghi nhận vào danh sách CBTD tổng thể
      if (!cbtdSummaryMap[cbtd]) {
        cbtdSummaryMap[cbtd] = {
          username: cbtd,
          fullName: tenCBTD,
          totalContracts: 0,
          activeContracts: 0,
          settledContracts: 0,
          totalDuNo: 0,
          customers: {}
        };
      }
      cbtdSummaryMap[cbtd].totalContracts++;
      if (trangThai === "DANG_VAY" || duNo > 0) {
        cbtdSummaryMap[cbtd].activeContracts++;
        cbtdSummaryMap[cbtd].totalDuNo += duNo;
        cbtdSummaryMap[cbtd].customers[maKH] = true;
      } else {
        cbtdSummaryMap[cbtd].settledContracts++;
      }

      // Nếu đang lọc theo 1 CBTD cụ thể
      var isTargetCBTD = !cbtdUsername || cbtdUsername === "all" || cbtd.toLowerCase() === cbtdUsername;
      if (isTargetCBTD) {
        totalContracts++;
        totalOriginalLoan += tienVay;

        if (trangThai === "DANG_VAY" || duNo > 0) {
          activeContracts++;
          totalActivePrincipal += duNo;
          uniqueCustomers[maKH] = true;

          // Kiểm tra ngày đến hạn
          var dDate = rawDenHan instanceof Date ? rawDenHan : (typeof rawDenHan === "string" ? new Date(rawDenHan) : null);
          if (dDate && !isNaN(dDate.getTime())) {
            if (dDate < now) {
              pastDueContracts++;
            } else if (dDate <= in30Days) {
              dueIn30Days++;
            }
          }
        } else {
          settledContracts++;
        }
      }
    }

    var cbtdList = [];
    for (var key in cbtdSummaryMap) {
      cbtdList.push({
        username: cbtdSummaryMap[key].username,
        fullName: cbtdSummaryMap[key].fullName,
        totalContracts: cbtdSummaryMap[key].totalContracts,
        activeContracts: cbtdSummaryMap[key].activeContracts,
        settledContracts: cbtdSummaryMap[key].settledContracts,
        totalDuNo: cbtdSummaryMap[key].totalDuNo,
        customerCount: Object.keys(cbtdSummaryMap[key].customers).length
      });
    }

    return {
      status: "success",
      data: {
        totalContracts: totalContracts,
        activeContracts: activeContracts,
        settledContracts: settledContracts,
        totalActivePrincipal: totalActivePrincipal,
        totalOriginalLoan: totalOriginalLoan,
        totalCustomers: Object.keys(uniqueCustomers).length,
        dueIn30Days: dueIn30Days,
        pastDueContracts: pastDueContracts,
        cbtdList: cbtdList
      }
    };
  },

  /**
   * Phân công hoặc Chuyển giao Cán bộ Tín dụng phụ trách Hợp đồng / Khách hàng
   */
  handleAssignContractCBTD: function(ss, data) {
    var soHDTD = String(data.soHDTD || "").trim();
    var maKH = String(data.maKH || "").trim();
    var cbtdUsername = String(data.cbtdUsername || "").trim();
    var tenCBTD = String(data.tenCBTD || "").trim();
    var assignAllForCustomer = Boolean(data.assignAllForCustomer);

    if (!cbtdUsername) {
      return { status: "error", message: "Vui lòng chọn Cán bộ Tín dụng phụ trách!" };
    }

    var sHDTD = ss.getSheetByName("HDTD_CORE");
    if (!sHDTD || sHDTD.getLastRow() <= 1) {
      return { status: "error", message: "Bảng dữ liệu HDTD_CORE chưa tồn tại hoặc rỗng!" };
    }

    var colMapHD = HeaderUtils.getHeaderMap(sHDTD);
    var hdValues = sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, sHDTD.getLastColumn()).getValues();
    var updatedCount = 0;

    for (var i = 0; i < hdValues.length; i++) {
      var rowSoHD = String(HeaderUtils.getCell(hdValues[i], colMapHD, "SoHDTD", "")).trim();
      var rowMaKH = String(HeaderUtils.getCell(hdValues[i], colMapHD, "MaKH", "")).replace(/^'/, "").trim();

      var shouldUpdate = false;
      if (assignAllForCustomer && maKH && rowMaKH === maKH) {
        shouldUpdate = true;
      } else if (soHDTD && rowSoHD === soHDTD) {
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        var rowIndex = i + 2;
        HeaderUtils.setCell(sHDTD, rowIndex, colMapHD, "CBTD_PhuTrach", cbtdUsername);
        HeaderUtils.setCell(sHDTD, rowIndex, colMapHD, "Ten_CBTD", tenCBTD);
        HeaderUtils.setCell(sHDTD, rowIndex, colMapHD, "NgayCapNhat", new Date());
        updatedCount++;
      }
    }

    SpreadsheetApp.flush();
    CacheHelper.invalidateModuleCache('customer');

    if (updatedCount > 0) {
      return {
        status: "success",
        message: "Đã phân công CBTD " + tenCBTD + " phụ trách thành công " + updatedCount + " hợp đồng!"
      };
    } else {
      return { status: "error", message: "Không tìm thấy hợp đồng phù hợp để phân công!" };
    }
  }
};

