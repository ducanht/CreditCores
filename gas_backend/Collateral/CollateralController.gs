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

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.min(sheet.getLastColumn(), 31)).getValues();
    var list = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var maTSBD = String(row[0] || "");
      var soGCN = String(row[1] || "");
      if (!soGCN && !maTSBD) continue;

      list.push({
        maTSBD: maTSBD,
        soGCN: soGCN,
        soVaoSoCapGCN: String(row[2] || ""),
        ngayCapGCN: row[3] ? formatGasDate(row[3]) : "",
        noiCapGCN: String(row[4] || ""),
        maKH: String(row[5] || ""),
        chuSoHuu: String(row[6] || ""),
        cccdChuTS: String(row[7] || ""),
        quanHeChuTS: String(row[8] || "Chính chủ"),
        nguoiDongSoHuu: String(row[9] || ""),
        thuaDatSo: String(row[10] || ""),
        toBanDoSo: String(row[11] || ""),
        diaChiThuaDat: String(row[12] || ""),
        dienTich: Number(row[13] || 0),
        hinhThucSuDung: String(row[14] || "Sử dụng riêng"),
        chiTietPhanLoaiDat: String(row[15] || ""),
        nguonGocSuDung: String(row[16] || "Nhận chuyển nhượng quyền sử dụng đất"),
        giaTriDinhGiaQTD: Number(row[17] || 0),
        giaTriThiTruong: Number(row[18] || 0),
        tyLeChoVayToiDa: Number(row[19] || 70),
        soTienDamBaoToiDa: Number(row[20] || 0),
        trangThaiTheChap: String(row[21] || "DANG_THE_CHAP"),
        soHDTD_LienKet: String(row[22] || ""),
        soCongChung: String(row[23] || ""),
        ngayCongChung: row[24] ? formatGasDate(row[24]) : "",
        vanPhongCongChung: String(row[25] || ""),
        soDangKyGDBD: String(row[26] || ""),
        ngayDangKyGDBD: row[27] ? formatGasDate(row[27]) : "",
        hinhAnhGCN: String(row[28] || ""),
        hinhAnhThucDia: String(row[29] || ""),
        ngayCapNhat: row[30] ? formatGasDateTime(row[30]) : ""
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

    var soGCN = String(data.soGCN).trim();
    var maTSBD = data.maTSBD || ("TSBD-" + new Date().getFullYear() + "-" + String(Math.floor(1000 + Math.random() * 9000)));

    var values = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues() : [];
    var targetRowIndex = -1;

    for (var i = 0; i < values.length; i++) {
      if (String(values[i][1]).trim() === soGCN || (data.maTSBD && String(values[i][0]).trim() === data.maTSBD)) {
        targetRowIndex = i + 2;
        maTSBD = String(values[i][0]).trim() || maTSBD;
        break;
      }
    }

    var rowData = [
      maTSBD,
      soGCN,
      data.soVaoSoCapGCN || "",
      data.ngayCapGCN ? parseGasDate(data.ngayCapGCN) : "",
      data.noiCapGCN || "",
      data.maKH || "",
      data.chuSoHuu || "",
      data.cccdChuTS || "",
      data.quanHeChuTS || "Chính chủ",
      data.nguoiDongSoHuu || "",
      data.thuaDatSo || "",
      data.toBanDoSo || "",
      data.diaChiThuaDat || "",
      Number(data.dienTich) || 0,
      data.hinhThucSuDung || "Sử dụng riêng",
      typeof data.chiTietPhanLoaiDat === 'object' ? JSON.stringify(data.chiTietPhanLoaiDat) : (data.chiTietPhanLoaiDat || ""),
      data.nguonGocSuDung || "Nhận chuyển nhượng quyền sử dụng đất",
      Number(data.giaTriDinhGiaQTD) || 0,
      Number(data.giaTriThiTruong) || 0,
      Number(data.tyLeChoVayToiDa) || 70,
      Number(data.soTienDamBaoToiDa) || (Number(data.giaTriDinhGiaQTD) * (Number(data.tyLeChoVayToiDa || 70) / 100)),
      data.trangThaiTheChap || "DANG_THE_CHAP",
      data.soHDTD_LienKet || "",
      data.soCongChung || "",
      data.ngayCongChung ? parseGasDate(data.ngayCongChung) : "",
      data.vanPhongCongChung || "",
      data.soDangKyGDBD || "",
      data.ngayDangKyGDBD ? parseGasDate(data.ngayDangKyGDBD) : "",
      data.hinhAnhGCN || "",
      data.hinhAnhThucDia || "",
      new Date()
    ];

    if (targetRowIndex > 0) {
      sheet.getRange(targetRowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    CacheHelper.invalidateModuleCache('collaterals');
    return {
      status: "success",
      message: "Lưu thông tin Tài sản bảo đảm (Sổ đỏ: " + soGCN + ") thành công!",
      data: { maTSBD: maTSBD, soGCN: soGCN }
    };
  }
};
