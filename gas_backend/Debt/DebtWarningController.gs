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

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var lastCol = sheet.getLastColumn();
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var trangThai = HeaderUtils.getCell(row, colMap, "TrangThai", "");
      if (trangThai === "CHUA_THU") {
        results.push({
          soHDTD: HeaderUtils.getCell(row, colMap, "SoHDTD", ""),
          maKH: HeaderUtils.getCell(row, colMap, "MaKH", ""),
          tenKH: HeaderUtils.getCell(row, colMap, "TenKH", ""),
          gocTon: Number(HeaderUtils.getCell(row, colMap, "GocTon", 0)) || 0,
          laiTon: Number(HeaderUtils.getCell(row, colMap, "LaiTon", 0)) || 0,
          tongNoTon: Number(HeaderUtils.getCell(row, colMap, "TongNoTon", 0)) || 0,
          kyPhatSinh: HeaderUtils.getCell(row, colMap, "KyPhatSinh", ""),
          trangThai: trangThai,
          ghiChu: HeaderUtils.getCell(row, colMap, "GhiChu", ""),
          ngayCapNhat: formatGasDateTime(HeaderUtils.getCell(row, colMap, "NgayCapNhat", ""))
        });
      }
    }

    CacheHelper.setCachedData('debt_warnings', results, 20);
    return { status: "success", data: results };
  }
};
