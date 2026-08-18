/**
 * CONTROLLER QUẢN LÝ ĐĂNG KÝ TRÍCH NỢ & KHỞI TẠO ĐỢT TRÍCH NỢ
 */

var DebitController = {
  handleGetDebitRegistrations: function(ss) {
    var cached = CacheHelper.getCachedData('debit_registrations');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("DS_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      results.push({
        maKH: values[i][0],
        hoTen: values[i][1],
        gttt: values[i][2],
        diaChi: values[i][3],
        soTK: values[i][4],
        kyTrich: values[i][5],
        trangThai: values[i][6],
        ghiChu: values[i][7]
      });
    }

    CacheHelper.setCachedData('debit_registrations', results, 30);
    return { status: "success", data: results };
  },

  handleSaveDebitRegister: function(ss, data) {
    var sheet = ss.getSheetByName("DS_TRICH_NO");
    if (!sheet) return { status: "error", message: "Không tìm thấy Sheet DS_TRICH_NO" };

    var row = [
      data.maKH || "",
      data.hoTen || "",
      data.gttt || "",
      data.diaChi || "",
      data.soTK || "",
      Number(data.kyTrich) || 1,
      data.trangThai || "Hieu luc",
      data.ghiChu || ""
    ];

    sheet.appendRow(row);
    CacheHelper.invalidateModuleCache('debit');
    return { status: "success", message: "Đăng ký dịch vụ trích nợ tự động thành công!" };
  },

  handleGetDebitBatches: function(ss) {
    var cached = CacheHelper.getCachedData('debit_batches');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("DOT_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      results.push({
        maDot: values[i][0],
        thangNam: values[i][1],
        kyTrich: values[i][2],
        tongPhaiThu: values[i][3],
        tongDaTrich: values[i][4],
        tongConNo: values[i][5],
        ngayTao: formatGasDateTime(values[i][6]),
        trangThai: values[i][7]
      });
    }

    CacheHelper.setCachedData('debit_batches', results, 30);
    return { status: "success", data: results };
  },

  handleCreateDebitBatch: function(ss, data) {
    var thangNam = data.thangNam || Utilities.formatDate(new Date(), "GMT+7", "yyyyMM");
    var kyTrich = Number(data.kyTrich) || 1;
    var maDot = "DOT-" + thangNam + "-K" + kyTrich;

    var sDot = ss.getSheetByName("DOT_TRICH_NO");
    var sLS = ss.getSheetByName("LICH_SU_GIAO_DICH");
    var sDS = ss.getSheetByName("DS_TRICH_NO");
    var sHDTD = ss.getSheetByName("HDTD_CORE");
    var sNoTon = ss.getSheetByName("NO_TON_DONG");

    if (!sDot || !sLS || !sDS || !sHDTD) {
      return { status: "error", message: "Thiếu các bảng CSDL cần thiết để tạo đợt trích nợ." };
    }

    var totalPhaiThu = 0;
    var count = 0;

    var dsValues = sDS.getLastRow() > 1 ? sDS.getRange(2, 1, sDS.getLastRow() - 1, 8).getValues() : [];
    var hdValues = sHDTD.getLastRow() > 1 ? sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, 11).getValues() : [];
    var noTonValues = (sNoTon && sNoTon.getLastRow() > 1) ? sNoTon.getRange(2, 1, sNoTon.getLastRow() - 1, 8).getValues() : [];

    var newTxRows = [];
    for (var i = 0; i < dsValues.length; i++) {
      if (Number(dsValues[i][5]) === kyTrich && dsValues[i][6] === "Hieu luc") {
        var maKH = dsValues[i][0];
        var soTK = dsValues[i][4];

        for (var j = 0; j < hdValues.length; j++) {
          if (hdValues[j][1] === maKH) {
            var soHDTD = hdValues[j][0];
            var duNo = Number(hdValues[j][3]) || 0;
            var laiSuat = Number(hdValues[j][4]) || 0;
            var phaiThuLai = Math.round((duNo * (laiSuat / 100)) / 12);
            var phaiThuGoc = 0;

            var noTonTruoc = 0;
            for (var k = 0; k < noTonValues.length; k++) {
              if (noTonValues[k][1] === soHDTD && noTonValues[k][6] === "CHUA_THU") {
                noTonTruoc += Number(noTonValues[k][4]) || 0;
              }
            }

            var tongThu = phaiThuGoc + phaiThuLai + noTonTruoc;
            totalPhaiThu += tongThu;
            count++;

            var txId = "TX-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "-" + (1000 + count);
            newTxRows.push([
              txId,
              maDot,
              maKH,
              soHDTD,
              soTK,
              phaiThuGoc,
              phaiThuLai,
              noTonTruoc,
              tongThu,
              0,
              tongThu,
              "CHO_XU_LY",
              "",
              new Date()
            ]);
          }
        }
      }
    }

    if (newTxRows.length > 0) {
      sLS.getRange(sLS.getLastRow() + 1, 1, newTxRows.length, 14).setValues(newTxRows);
    }

    sDot.appendRow([maDot, thangNam, kyTrich, totalPhaiThu, 0, totalPhaiThu, new Date(), "CHO_TRICH_NO"]);
    CacheHelper.invalidateModuleCache('debit');

    return {
      status: "success",
      message: "Khởi tạo đợt trích nợ " + maDot + " thành công với " + count + " món vay!",
      maDot: maDot,
      totalPhaiThu: totalPhaiThu
    };
  }
};
