/**
 * CONTROLLER BIÊN BẢN KIỂM TRA SỬ DỤNG VỐN SAU GIẢI NGÂN
 * Hỗ trợ phân loại đoàn kiểm tra (CBTD, BKS, HĐQT), ngày kiểm tra tiếp theo và link tải biên bản
 */

var InspectionController = {
  handleGetInspections: function(ss) {
    var cached = CacheHelper.getCachedData('inspections_list');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("KIEM_TRA_VON");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.max(20, sheet.getLastColumn())).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      results.push({
        maBBKT: values[i][0],
        soHDTD: values[i][1],
        maKH: values[i][2],
        hoTen: values[i][3],
        loaiDoanKT: values[i][4] || "CBTD",
        thanhPhanDoan: values[i][5] || "",
        ngayKiemTra: formatGasDate(values[i][6]),
        lanKiemTra: values[i][7] || "Lần 1 (Sau giải ngân)",
        ngayKTNext: formatGasDate(values[i][8]),
        hinhThuc: values[i][9] || "Thực địa",
        diaDiemKT: values[i][10] || "",
        danhGiaMucDich: values[i][11] || "Đúng mục đích",
        tienDoSuDungVon: values[i][12] || "Đã đưa vào sản xuất",
        mucDoRuiRo: values[i][13] || "Thấp",
        moTaThucTe: values[i][14] || "",
        kienNghi: values[i][15] || "",
        fileBienBanUrl: values[i][16] || "",
        hinhAnhKiemTra: values[i][17] || "",
        trangThai: values[i][18] || "ĐÃ_DUYỆT",
        ngayTao: formatGasDateTime(values[i][19])
      });
    }

    CacheHelper.setCachedData('inspections_list', results, 30);
    return { status: "success", data: results };
  },

  handleSaveLoanInspection: function(ss, data) {
    var sheet = ss.getSheetByName("KIEM_TRA_VON");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("KIEM_TRA_VON");
    }

    var maBBKT = data.maBBKT || ("BBKT-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss"));
    var row = [
      maBBKT,
      data.soHDTD || "",
      data.maKH || "",
      data.hoTen || "",
      data.loaiDoanKT || "CBTD",
      data.thanhPhanDoan || "Lê Văn Tín (CBTD)",
      parseGasDateToSheet(data.ngayKiemTra) || new Date(),
      data.lanKiemTra || "Lần 1 (Sau giải ngân)",
      parseGasDateToSheet(data.ngayKTNext) || "",
      data.hinhThuc || "Thực địa",
      data.diaDiemKT || "",
      data.danhGiaMucDich || "Đúng mục đích",
      data.tienDoSuDungVon || "Đã đưa vào sản xuất",
      data.mucDoRuiRo || "Thấp",
      data.moTaThucTe || "",
      data.kienNghi || "Tiếp tục theo dõi định kỳ",
      data.fileBienBanUrl || "",
      data.hinhAnhKiemTra || "",
      data.trangThai || "ĐÃ_DUYỆT",
      new Date()
    ];

    sheet.appendRow(row);
    CacheHelper.invalidateModuleCache('inspection');
    return {
      status: "success",
      message: "Đã lưu Biên bản kiểm tra sử dụng vốn " + maBBKT + " thành công!",
      maBBKT: maBBKT
    };
  }
};
