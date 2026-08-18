/**
 * CONTROLLER BIÊN BẢN KIỂM TRA SỬ DỤNG VỐN SAU GIẢI NGÂN
 */

var InspectionController = {
  handleGetInspections: function(ss) {
    var cached = CacheHelper.getCachedData('inspections_list');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("KIEM_TRA_VON");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      results.push({
        maBBKT: values[i][0],
        soHDTD: values[i][1],
        maKH: values[i][2],
        hoTen: values[i][3],
        ngayKiemTra: formatGasDate(values[i][4]),
        hinhThuc: values[i][5],
        danhGiaMucDich: values[i][6],
        mucDoRuiRo: values[i][7],
        moTaThucTe: values[i][8],
        hinhAnhKiemTra: values[i][9],
        canBoKiemTra: values[i][10]
      });
    }

    CacheHelper.setCachedData('inspections_list', results, 30);
    return { status: "success", data: results };
  },

  handleSaveLoanInspection: function(ss, data) {
    var sheet = ss.getSheetByName("KIEM_TRA_VON");
    if (!sheet) return { status: "error", message: "Không tìm thấy Sheet KIEM_TRA_VON" };

    var maBBKT = "BBKT-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss");
    var row = [
      maBBKT,
      data.soHDTD || "",
      data.maKH || "",
      data.hoTen || "",
      parseGasDateToSheet(data.ngayKiemTra) || new Date(),
      data.hinhThuc || "Thực địa",
      data.danhGiaMucDich || "Đúng mục đích",
      data.mucDoRuiRo || "Thấp",
      data.moTaThucTe || "",
      data.hinhAnhKiemTra || "",
      data.canBoKiemTra || "Lê Văn Tín"
    ];

    sheet.appendRow(row);
    CacheHelper.invalidateModuleCache('inspection');
    return { status: "success", message: "Đã lưu Biên bản kiểm tra sử dụng vốn thành công!", maBBKT: maBBKT };
  }
};
