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

    var sKH = ss.getSheetByName("KH_CORE");
    var sHDTD = ss.getSheetByName("HDTD_CORE");

    if (!sKH || sKH.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    // 1. Đọc dữ liệu hợp đồng và Gom vào Hash Map theo MaKH O(M)
    var hdValues = (sHDTD && sHDTD.getLastRow() > 1) 
      ? sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, Math.min(sHDTD.getLastColumn(), 16)).getValues() 
      : [];

    var contractsByMaKH = {};
    for (var j = 0; j < hdValues.length; j++) {
      var rowSoHD = String(hdValues[j][0] || "").trim();
      var rowMaKH = String(hdValues[j][1] || "").trim();
      if (!rowMaKH) continue;

      var cbtdUser = String(hdValues[j][11] || "qtdyentho.cbtd").trim();
      var tenCBTD = String(hdValues[j][12] || "Lê Văn Tín (CBTD)").trim();
      var duNo = Number(hdValues[j][3] || 0);
      var trangThaiHD = String(hdValues[j][13] || (duNo > 0 ? "DANG_VAY" : "DA_TAT_TOAN")).trim();
      var ngayTatToan = hdValues[j][14] ? formatGasDate(hdValues[j][14]) : "";

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
        tienVay: Number(hdValues[j][2] || 0),
        duNo: duNo,
        laiSuat: Number(hdValues[j][4] || 0),
        ngayVay: formatGasDate(hdValues[j][5]),
        denHan: formatGasDate(hdValues[j][6]),
        traLaiDenNgay: formatGasDate(hdValues[j][7]),
        maLoaiVay: String(hdValues[j][8] || "LV01"),
        soThangVay: Number(hdValues[j][9] || 12),
        moTaVay: String(hdValues[j][10] || ""),
        cbtdPhuTrach: cbtdUser,
        tenCBTD: tenCBTD,
        trangThaiHD: trangThaiHD,
        ngayTatToan: ngayTatToan,
        ngayCapNhat: hdValues[j][15] ? formatGasDateTime(hdValues[j][15]) : ""
      });
    }

    // 2. Đọc bảng Khách hàng
    var khValues = sKH.getRange(2, 1, sKH.getLastRow() - 1, Math.min(sKH.getLastColumn(), 16)).getValues();
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
        maKH: String(row[0]),
        hoTen: String(row[1] || ""),
        diaChi: String(row[2] || ""),
        ngaySinh: formatGasDate(row[3]),
        cccd: String(row[4] || ""),
        ngayCap: formatGasDate(row[5]),
        noiCap: String(row[6] || ""),
        dienThoai: String(row[7] || ""),
        dienThoaiDD: String(row[8] || ""),
        soTK: String(row[9] || ""),
        khuVuc: String(row[10] || ""),
        soTV: String(row[11] || ""),
        soSoCP: String(row[12] || ""),
        ngayVaoTV: formatGasDate(row[13]),
        tongTienCP: Number(row[14] || 0),
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
        var mKH = String(khValues[k][0]).trim();
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
            var currMaKH = String(khValues[idx][0]).trim();
            if (!seenCust[currMaKH]) {
              seenCust[currMaKH] = true;
              results.push(buildCustomerObj(khValues[idx], contractsByMaKH[currMaKH] || []));
            }
          }
        }
      }

      return { status: "success", data: results, total: results.length, isFiltered: false };
    }

    // TRƯỜNG HỢP 2: Người dùng CÓ nhập từ khóa tìm kiếm (query)
    for (var i = 0; i < khValues.length; i++) {
      if (results.length >= maxLimit) break;

      var maKH = String(khValues[i][0]).trim();
      var hoTen = String(khValues[i][1] || "").trim();
      var cccd = String(khValues[i][4] || "").trim();
      var phone = String(khValues[i][8] || "").trim();
      var soTK = String(khValues[i][9] || "").trim();
      var khuVuc = String(khValues[i][10] || "").trim();

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
    var sKH = ss.getSheetByName("KH_CORE");

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

    var hdValues = sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, Math.min(sHDTD.getLastColumn(), 16)).getValues();
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
      if (!hdValues[i][0]) continue;
      var soHD = String(hdValues[i][0]);
      var maKH = String(hdValues[i][1]);
      var tienVay = Number(hdValues[i][2] || 0);
      var duNo = Number(hdValues[i][3] || 0);
      var cbtd = String(hdValues[i][11] || "qtdyentho.cbtd").trim();
      var tenCBTD = String(hdValues[i][12] || "Lê Văn Tín (CBTD)").trim();
      var trangThai = String(hdValues[i][13] || (duNo > 0 ? "DANG_VAY" : "DA_TAT_TOAN")).trim();
      var rawDenHan = hdValues[i][6];

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
          if (rawDenHan instanceof Date && !isNaN(rawDenHan.getTime())) {
            if (rawDenHan < now) {
              pastDueContracts++;
            } else if (rawDenHan <= in30Days) {
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

    var hdValues = sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, Math.min(sHDTD.getLastColumn(), 16)).getValues();
    var updatedCount = 0;

    for (var i = 0; i < hdValues.length; i++) {
      var rowSoHD = String(hdValues[i][0]).trim();
      var rowMaKH = String(hdValues[i][1]).trim();

      var shouldUpdate = false;
      if (assignAllForCustomer && maKH && rowMaKH === maKH) {
        shouldUpdate = true;
      } else if (soHDTD && rowSoHD === soHDTD) {
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        var rowIndex = i + 2;
        sHDTD.getRange(rowIndex, 12).setValue(cbtdUsername);
        sHDTD.getRange(rowIndex, 13).setValue(tenCBTD);
        sHDTD.getRange(rowIndex, 16).setValue(new Date());
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

