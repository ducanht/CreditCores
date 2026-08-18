/**
 * CONTROLLER TRA CỨU KHÁCH HÀNG & HỢP ĐỒNG 360°
 */

var Customer360Controller = {
  handleSearchCustomer360: function(ss, data) {
    var query = (data.query || "").toLowerCase().trim();
    var sKH = ss.getSheetByName("KH_CORE");
    var sHDTD = ss.getSheetByName("HDTD_CORE");

    if (!sKH || sKH.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var khValues = sKH.getRange(2, 1, sKH.getLastRow() - 1, 15).getValues();
    var hdValues = (sHDTD && sHDTD.getLastRow() > 1) ? sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, 11).getValues() : [];

    var results = [];
    for (var i = 0; i < khValues.length; i++) {
      var maKH = String(khValues[i][0]);
      var hoTen = String(khValues[i][1]);
      var cccd = String(khValues[i][4]);
      var phone = String(khValues[i][8]);
      var soTK = String(khValues[i][9]);

      var isMatch = !query ||
        maKH.toLowerCase().indexOf(query) > -1 ||
        hoTen.toLowerCase().indexOf(query) > -1 ||
        cccd.indexOf(query) > -1 ||
        phone.indexOf(query) > -1 ||
        soTK.indexOf(query) > -1;

      if (isMatch) {
        var contracts = [];
        for (var j = 0; j < hdValues.length; j++) {
          if (String(hdValues[j][1]) === maKH) {
            contracts.push({
              soHDTD: hdValues[j][0],
              maKH: hdValues[j][1],
              tienVay: hdValues[j][2],
              duNo: hdValues[j][3],
              laiSuat: hdValues[j][4],
              ngayVay: formatGasDate(hdValues[j][5]),
              denHan: formatGasDate(hdValues[j][6]),
              traLaiDenNgay: formatGasDate(hdValues[j][7]),
              maLoaiVay: hdValues[j][8],
              soThangVay: hdValues[j][9],
              moTaVay: hdValues[j][10]
            });
          }
        }

        results.push({
          maKH: maKH,
          hoTen: hoTen,
          diaChi: khValues[i][2],
          ngaySinh: formatGasDate(khValues[i][3]),
          cccd: cccd,
          ngayCap: formatGasDate(khValues[i][5]),
          noiCap: khValues[i][6],
          dienThoai: khValues[i][7],
          dienThoaiDD: phone,
          soTK: soTK,
          khuVuc: khValues[i][10],
          soTV: khValues[i][11],
          soSoCP: khValues[i][12],
          ngayVaoTV: formatGasDate(khValues[i][13]),
          tongTienCP: khValues[i][14],
          contracts: contracts
        });
      }
    }

    return { status: "success", data: results };
  }
};
