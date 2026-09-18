/**
 * ========================================================================================
 * CREDITCORES - INSPECTIONCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module InspectionController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var InspectionController = {
  handleGetInspections: function(ss) {
    var cached = CacheHelper.getCachedData('inspections_list');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("KIEM_TRA_VON");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var numRows = sheet.getLastRow() - 1;
    var numCols = sheet.getLastColumn();
    var values = sheet.getRange(2, 1, numRows, numCols).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      results.push({
        maBBKT: HeaderUtils.getCell(row, colMap, "MaBBKT", ""),
        soHDTD: HeaderUtils.getCell(row, colMap, "SoHDTD", ""),
        maKH: HeaderUtils.getCell(row, colMap, "MaKH", ""),
        hoTen: HeaderUtils.getCell(row, colMap, "HoTen", ""),
        loaiDoanKT: HeaderUtils.getCell(row, colMap, "LoaiDoanKT", "CBTD"),
        thanhPhanDoan: HeaderUtils.getCell(row, colMap, "ThanhPhanDoan", ""),
        ngayKiemTra: formatGasDate(HeaderUtils.getCell(row, colMap, "NgayKiemTra", "")),
        lanKiemTra: HeaderUtils.getCell(row, colMap, "LanKiemTra", "Lần 1 (Sau giải ngân)"),
        ngayKTNext: formatGasDate(HeaderUtils.getCell(row, colMap, "NgayKTNext", "")),
        hinhThuc: HeaderUtils.getCell(row, colMap, "HinhThuc", "Thực địa"),
        diaDiemKT: HeaderUtils.getCell(row, colMap, "DiaDiemKT", ""),
        danhGiaMucDich: HeaderUtils.getCell(row, colMap, "DanhGiaMucDich", "Đúng mục đích"),
        tienDoSuDungVon: HeaderUtils.getCell(row, colMap, "TienDoSuDungVon", "Đã đưa vào sản xuất"),
        mucDoRuiRo: HeaderUtils.getCell(row, colMap, "MucDoRuiRo", "Thấp"),
        moTaThucTe: HeaderUtils.getCell(row, colMap, "MoTaThucTe", ""),
        kienNghi: HeaderUtils.getCell(row, colMap, "KienNghi", ""),
        fileBienBanUrl: HeaderUtils.getCell(row, colMap, "FileBienBanUrl", ""),
        hinhAnhKiemTra: HeaderUtils.getCell(row, colMap, "HinhAnhKiemTra", ""),
        trangThai: HeaderUtils.getCell(row, colMap, "TrangThai", "ĐÃ_DUYỆT"),
        ngayTao: formatGasDateTime(HeaderUtils.getCell(row, colMap, "NgayTao", ""))
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
    var colMap = HeaderUtils.getHeaderMap(sheet);
    var defaultHeaders = [
      "MaBBKT", "SoHDTD", "MaKH", "HoTen", "LoaiDoanKT", "ThanhPhanDoan", "NgayKiemTra", "LanKiemTra", "NgayKTNext", "HinhThuc", "DiaDiemKT", "DanhGiaMucDich", "TienDoSuDungVon", "MucDoRuiRo", "MoTaThucTe", "KienNghi", "FileBienBanUrl", "HinhAnhKiemTra", "TrangThai", "NgayTao"
    ];

    var dict = {
      MaBBKT: maBBKT,
      SoHDTD: data.soHDTD || "",
      MaKH: data.maKH || "",
      HoTen: data.hoTen || "",
      LoaiDoanKT: data.loaiDoanKT || "CBTD",
      ThanhPhanDoan: data.thanhPhanDoan || "Lê Văn Tín (CBTD)",
      NgayKiemTra: parseGasDateToSheet(data.ngayKiemTra) || new Date(),
      LanKiemTra: data.lanKiemTra || "Lần 1 (Sau giải ngân)",
      NgayKTNext: parseGasDateToSheet(data.ngayKTNext) || "",
      HinhThuc: data.hinhThuc || "Thực địa",
      DiaDiemKT: data.diaDiemKT || "",
      DanhGiaMucDich: data.danhGiaMucDich || "Đúng mục đích",
      TienDoSuDungVon: data.tienDoSuDungVon || "Đã đưa vào sản xuất",
      MucDoRuiRo: data.mucDoRuiRo || "Thấp",
      MoTaThucTe: data.moTaThucTe || "",
      KienNghi: data.kienNghi || "Tiếp tục theo dõi định kỳ",
      FileBienBanUrl: data.fileBienBanUrl || "",
      HinhAnhKiemTra: data.hinhAnhKiemTra || "",
      TrangThai: data.trangThai || "ĐÃ_DUYỆT",
      NgayTao: new Date()
    };

    var row = HeaderUtils.dictToRow(dict, colMap, defaultHeaders);
    sheet.appendRow(row);
    CacheHelper.invalidateModuleCache('inspection');
    return {
      status: "success",
      message: "Đã lưu Biên bản kiểm tra sử dụng vốn " + maBBKT + " thành công!",
      maBBKT: maBBKT
    };
  }
};
