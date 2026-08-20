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
   */
  handleSearchCustomer360: function(ss, data) {
    var query = (data.query || "").toLowerCase().trim();
    var cbtdFilter = (data.cbtdUsername || "").toLowerCase().trim();
    var statusFilter = (data.status || "").toUpperCase().trim(); // 'ALL' | 'DANG_VAY' | 'DA_TAT_TOAN'

    var sKH = ss.getSheetByName("KH_CORE");
    var sHDTD = ss.getSheetByName("HDTD_CORE");

    if (!sKH || sKH.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var khValues = sKH.getRange(2, 1, sKH.getLastRow() - 1, Math.min(sKH.getLastColumn(), 16)).getValues();
    var hdValues = (sHDTD && sHDTD.getLastRow() > 1) 
      ? sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, Math.min(sHDTD.getLastColumn(), 16)).getValues() 
      : [];

    var results = [];
    for (var i = 0; i < khValues.length; i++) {
      var maKH = String(khValues[i][0]);
      var hoTen = String(khValues[i][1]);
      var cccd = String(khValues[i][4]);
      var phone = String(khValues[i][8]);
      var soTK = String(khValues[i][9]);
      var khuVuc = String(khValues[i][10] || "");

      var isMatchQuery = !query ||
        maKH.toLowerCase().indexOf(query) > -1 ||
        hoTen.toLowerCase().indexOf(query) > -1 ||
        cccd.indexOf(query) > -1 ||
        phone.indexOf(query) > -1 ||
        soTK.indexOf(query) > -1 ||
        khuVuc.toLowerCase().indexOf(query) > -1;

      if (isMatchQuery) {
        var contracts = [];
        var custCBTD = "";
        var custTenCBTD = "";

        for (var j = 0; j < hdValues.length; j++) {
          if (String(hdValues[j][1]) === maKH) {
            var cbtdUser = String(hdValues[j][11] || "qtdyentho.cbtd").trim();
            var tenCBTD = String(hdValues[j][12] || "Lê Văn Tín (CBTD)").trim();
            var duNo = Number(hdValues[j][3] || 0);
            var trangThaiHD = String(hdValues[j][13] || (duNo > 0 ? "DANG_VAY" : "DA_TAT_TOAN")).trim();
            var ngayTatToan = hdValues[j][14] ? formatGasDate(hdValues[j][14]) : "";

            if (!custCBTD) custCBTD = cbtdUser;
            if (!custTenCBTD) custTenCBTD = tenCBTD;

            // Kiểm tra bộ lọc trạng thái nếu có
            if (statusFilter && statusFilter !== "ALL" && trangThaiHD !== statusFilter) {
              continue;
            }

            // Kiểm tra bộ lọc CBTD nếu có
            if (cbtdFilter && cbtdFilter !== "all" && cbtdUser.toLowerCase() !== cbtdFilter) {
              continue;
            }

            contracts.push({
              soHDTD: String(hdValues[j][0]),
              maKH: maKH,
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
        }

        // Nếu có lọc theo CBTD hoặc trạng thái và khách hàng này không có HĐ thỏa mãn -> bỏ qua
        if ((cbtdFilter && cbtdFilter !== "all") || (statusFilter && statusFilter !== "ALL")) {
          if (contracts.length === 0) continue;
        }

        results.push({
          maKH: maKH,
          hoTen: hoTen,
          diaChi: String(khValues[i][2] || ""),
          ngaySinh: formatGasDate(khValues[i][3]),
          cccd: cccd,
          ngayCap: formatGasDate(khValues[i][5]),
          noiCap: String(khValues[i][6] || ""),
          dienThoai: String(khValues[i][7] || ""),
          dienThoaiDD: phone,
          soTK: soTK,
          khuVuc: khuVuc,
          soTV: String(khValues[i][11] || ""),
          soSoCP: String(khValues[i][12] || ""),
          ngayVaoTV: formatGasDate(khValues[i][13]),
          tongTienCP: Number(khValues[i][14] || 0),
          cbtdPhuTrach: custCBTD || "qtdyentho.cbtd",
          tenCBTD: custTenCBTD || "Lê Văn Tín (CBTD)",
          contracts: contracts
        });
      }
    }

    return { status: "success", data: results };
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

