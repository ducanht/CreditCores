/**
 * ========================================================================================
 * CREDITCORES - DEBTWARNINGCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module DebtWarningController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var DebtWarningController = {
  handleGetDebtWarnings: function(ss) {
    var cached = CacheHelper.getCachedData('debt_warnings');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("NO_TON_DONG");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      if (values[i][6] === "CHUA_THU") {
        results.push({
          maKH: values[i][0],
          soHDTD: values[i][1],
          gocTon: values[i][2],
          laiTon: values[i][3],
          tongNoTon: values[i][4],
          kyPhatSinh: values[i][5],
          trangThai: values[i][6],
          ngayCapNhat: formatGasDateTime(values[i][7])
        });
      }
    }

    CacheHelper.setCachedData('debt_warnings', results, 20);
    return { status: "success", data: results };
  }
};
