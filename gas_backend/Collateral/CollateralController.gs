/**
 * ========================================================================================
 * CREDITCORES - COLLATERALCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module CollateralController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var CollateralController = {
  /**
   * Lấy danh sách toàn bộ tài sản bảo đảm trong kho TSBD_CORE
   */
  handleGetCollaterals: function(ss, data) {
    var sheet = ss.getSheetByName("TSBD_CORE");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var lastCol = sheet.getLastColumn();
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
    var list = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var maTSBD = String(HeaderUtils.getCell(row, colMap, "MaTSBD", "")).trim();
      var soGCN = String(HeaderUtils.getCell(row, colMap, "SoGCN", "")).trim();
      if (!soGCN && !maTSBD) continue;

      list.push({
        maTSBD: maTSBD,
        soGCN: soGCN,
        soVaoSoCapGCN: String(HeaderUtils.getCell(row, colMap, "SoVaoSoCapGCN", "")),
        ngayCapGCN: formatGasDate(HeaderUtils.getCell(row, colMap, "NgayCapGCN", "")),
        noiCapGCN: String(HeaderUtils.getCell(row, colMap, "NoiCapGCN", "")),
        maKH: String(HeaderUtils.getCell(row, colMap, "MaKH", "")),
        chuSoHuu: String(HeaderUtils.getCell(row, colMap, "ChuSoHuu", "")),
        cccdChuTS: String(HeaderUtils.getCell(row, colMap, "CCCDChuTS", "")),
        quanHeChuTS: String(HeaderUtils.getCell(row, colMap, "QuanHeChuTS", "Chính chủ")),
        nguoiDongSoHuu: String(HeaderUtils.getCell(row, colMap, "NguoiDongSoHuu", "")),
        thuaDatSo: String(HeaderUtils.getCell(row, colMap, "ThuaDatSo", "")),
        toBanDoSo: String(HeaderUtils.getCell(row, colMap, "ToBanDoSo", "")),
        diaChiThuaDat: String(HeaderUtils.getCell(row, colMap, "DiaChiThuaDat", "")),
        dienTich: Number(HeaderUtils.getCell(row, colMap, "DienTich", 0)) || 0,
        hinhThucSuDung: String(HeaderUtils.getCell(row, colMap, "HinhThucSuDung", "Sử dụng riêng")),
        chiTietPhanLoaiDat: String(HeaderUtils.getCell(row, colMap, "ChiTietPhanLoaiDat", "")),
        nguonGocSuDung: String(HeaderUtils.getCell(row, colMap, "NguonGocSuDung", "Nhận chuyển nhượng quyền sử dụng đất")),
        giaTriDinhGiaQTD: Number(HeaderUtils.getCell(row, colMap, "GiaTriDinhGiaQTD", 0)) || 0,
        giaTriThiTruong: Number(HeaderUtils.getCell(row, colMap, "GiaTriThiTruong", 0)) || 0,
        tyLeChoVayToiDa: Number(HeaderUtils.getCell(row, colMap, "TyLeChoVayToiDa", 70)) || 70,
        soTienDamBaoToiDa: Number(HeaderUtils.getCell(row, colMap, "SoTienDamBaoToiDa", 0)) || 0,
        trangThaiTheChap: String(HeaderUtils.getCell(row, colMap, "TrangThaiTheChap", "DANG_THE_CHAP")),
        soHDTD_LienKet: String(HeaderUtils.getCell(row, colMap, "SoHDTD_LienKet", "")),
        soCongChung: String(HeaderUtils.getCell(row, colMap, "SoCongChung", "")),
        ngayCongChung: formatGasDate(HeaderUtils.getCell(row, colMap, "NgayCongChung", "")),
        vanPhongCongChung: String(HeaderUtils.getCell(row, colMap, "VanPhongCongChung", "")),
        soDangKyGDBD: String(HeaderUtils.getCell(row, colMap, "SoDangKyGDBD", "")),
        ngayDangKyGDBD: formatGasDate(HeaderUtils.getCell(row, colMap, "NgayDangKyGDBD", "")),
        hinhAnhGCN: String(HeaderUtils.getCell(row, colMap, "HinhAnhGCN", "")),
        hinhAnhThucDia: String(HeaderUtils.getCell(row, colMap, "HinhAnhThucDia", "")),
        ngayCapNhat: formatGasDateTime(HeaderUtils.getCell(row, colMap, "NgayCapNhat", ""))
      });
    }

    return { status: "success", data: list };
  },

  /**
   * Lưu hoặc Cập nhật Tài sản bảo đảm vào TSBD_CORE
   */
  handleSaveCollateral: function(ss, data) {
    if (!data || !data.soGCN) {
      return { status: "error", message: "Số Giấy chứng nhận QSDĐ (Sổ đỏ) là trường bắt buộc!" };
    }

    var sheet = ss.getSheetByName("TSBD_CORE");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("TSBD_CORE");
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var defaultHeaders = [
      "MaTSBD", "SoGCN", "SoVaoSoCapGCN", "NgayCapGCN", "NoiCapGCN", "MaKH", "ChuSoHuu", "CCCDChuTS", "QuanHeChuTS", "NguoiDongSoHuu",
      "ThuaDatSo", "ToBanDoSo", "DiaChiThuaDat", "DienTich", "HinhThucSuDung", "ChiTietPhanLoaiDat", "NguonGocSuDung", "GiaTriDinhGiaQTD",
      "GiaTriThiTruong", "TyLeChoVayToiDa", "SoTienDamBaoToiDa", "TrangThaiTheChap", "SoHDTD_LienKet", "SoCongChung", "NgayCongChung",
      "VanPhongCongChung", "SoDangKyGDBD", "NgayDangKyGDBD", "HinhAnhGCN", "HinhAnhThucDia", "NgayCapNhat"
    ];

    var soGCN = String(data.soGCN).trim();
    var maTSBD = data.maTSBD || ("TSBD-" + new Date().getFullYear() + "-" + String(Math.floor(1000 + Math.random() * 9000)));

    var lastRow = sheet.getLastRow();
    var targetRowIndex = -1;

    if (lastRow > 1) {
      var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
      for (var i = 0; i < values.length; i++) {
        var rowGCN = String(HeaderUtils.getCell(values[i], colMap, "SoGCN", "")).trim();
        var rowMa = String(HeaderUtils.getCell(values[i], colMap, "MaTSBD", "")).trim();
        if (rowGCN === soGCN || (data.maTSBD && rowMa === String(data.maTSBD).trim())) {
          targetRowIndex = i + 2;
          maTSBD = rowMa || maTSBD;
          break;
        }
      }
    }

    var dict = {
      MaTSBD: maTSBD,
      SoGCN: soGCN,
      SoVaoSoCapGCN: data.soVaoSoCapGCN || "",
      NgayCapGCN: data.ngayCapGCN ? parseGasDateToSheet(data.ngayCapGCN) : "",
      NoiCapGCN: data.noiCapGCN || "",
      MaKH: data.maKH || "",
      ChuSoHuu: data.chuSoHuu || "",
      CCCDChuTS: data.cccdChuTS || "",
      QuanHeChuTS: data.quanHeChuTS || "Chính chủ",
      NguoiDongSoHuu: data.nguoiDongSoHuu || "",
      ThuaDatSo: data.thuaDatSo || "",
      ToBanDoSo: data.toBanDoSo || "",
      DiaChiThuaDat: data.diaChiThuaDat || "",
      DienTich: Number(data.dienTich) || 0,
      HinhThucSuDung: data.hinhThucSuDung || "Sử dụng riêng",
      ChiTietPhanLoaiDat: typeof data.chiTietPhanLoaiDat === 'object' ? JSON.stringify(data.chiTietPhanLoaiDat) : (data.chiTietPhanLoaiDat || ""),
      NguonGocSuDung: data.nguonGocSuDung || "Nhận chuyển nhượng quyền sử dụng đất",
      GiaTriDinhGiaQTD: Number(data.giaTriDinhGiaQTD) || 0,
      GiaTriThiTruong: Number(data.giaTriThiTruong) || 0,
      TyLeChoVayToiDa: Number(data.tyLeChoVayToiDa) || 70,
      SoTienDamBaoToiDa: Number(data.soTienDamBaoToiDa) || (Number(data.giaTriDinhGiaQTD || 0) * (Number(data.tyLeChoVayToiDa || 70) / 100)),
      TrangThaiTheChap: data.trangThaiTheChap || "DANG_THE_CHAP",
      SoHDTD_LienKet: data.soHDTD_LienKet || "",
      SoCongChung: data.soCongChung || "",
      NgayCongChung: data.ngayCongChung ? parseGasDateToSheet(data.ngayCongChung) : "",
      VanPhongCongChung: data.vanPhongCongChung || "",
      SoDangKyGDBD: data.soDangKyGDBD || "",
      NgayDangKyGDBD: data.ngayDangKyGDBD ? parseGasDateToSheet(data.ngayDangKyGDBD) : "",
      HinhAnhGCN: data.hinhAnhGCN || "",
      HinhAnhThucDia: data.hinhAnhThucDia || "",
      NgayCapNhat: new Date()
    };

    var row = HeaderUtils.dictToRow(dict, colMap, defaultHeaders);

    if (targetRowIndex > 0) {
      sheet.getRange(targetRowIndex, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    CacheHelper.invalidateModuleCache('collaterals');
    return {
      status: "success",
      message: "Lưu thông tin Tài sản bảo đảm (Sổ đỏ: " + soGCN + ") thành công!",
      data: { maTSBD: maTSBD, soGCN: soGCN }
    };
  }
};
