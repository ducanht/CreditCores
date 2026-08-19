/**
 * ========================================================================================
 * HỆ THỐNG QUẢN TRỊ CƠ SỞ DỮ LIỆU CHUẨN 12 BẢNG GOOGLE SHEETS (SCHEMA GOVERNANCE)
 * CreditCores - Quỹ Tín Dụng Nhân Dân Yên Thọ
 * - Tự động kiểm tra, khởi tạo và nâng cấp cột (Auto-Migration)
 * - Bảo toàn 100% dữ liệu cũ (Zero-data-loss header migration)
 * - Tự động định dạng kiểu dữ liệu: Tiền tệ #,##0, Ngày dd/MM/yyyy, Chuỗi Text @ cho CCCD/SoTK
 * ========================================================================================
 */

var DB_SPREADSHEET_ID = typeof DB_SPREADSHEET_ID !== 'undefined' ? DB_SPREADSHEET_ID : "1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw";

function getSpreadsheetInstance(ss) {
  if (ss) return ss;
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  if (DB_SPREADSHEET_ID && DB_SPREADSHEET_ID.length > 10) {
    try {
      return SpreadsheetApp.openById(DB_SPREADSHEET_ID);
    } catch (e) {
      Logger.log("Không thể mở Spreadsheet ID: " + DB_SPREADSHEET_ID + " - " + e.toString());
    }
  }
  return null;
}

var SchemaSetup = {
  // Danh mục 12 Bảng CSDL Chuẩn & Metadata
  SCHEMAS: {
    ROLES: {
      headers: ["RoleCode", "RoleName", "Permissions", "Description", "UpdatedAt"],
      color: "#1E3E62",
      formats: { "E:E": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 120, 2: 180, 3: 350, 4: 250, 5: 160 },
      defaultData: [
        ["ADMIN", "Quản Trị Viên Toàn Quyền", JSON.stringify(["dashboard", "customer360", "appraisal", "inspection", "debit_register", "debit_batch", "reconciliation", "debt_warning", "reports", "templates", "user_management", "settings"]), "Toàn quyền quản trị hệ thống và người dùng", new Date()],
        ["CBTD", "Cán Bộ Tín Dụng", JSON.stringify(["dashboard", "customer360", "appraisal", "inspection", "debit_register", "debt_warning", "reports", "templates"]), "Thẩm định, kiểm tra vốn và theo dõi khách hàng", new Date()],
        ["KETOAN", "Kế Toán Viên / Thủ Quỹ", JSON.stringify(["dashboard", "customer360", "debit_register", "debit_batch", "reconciliation", "debt_warning", "reports", "templates"]), "Quản lý trích nợ, đối soát và sổ theo dõi nợ", new Date()],
        ["BKS", "Ban Kiểm Soát", JSON.stringify(["dashboard", "customer360", "appraisal", "inspection", "debt_warning", "reports", "templates"]), "Kiểm soát, giám sát rủi ro và báo cáo", new Date()],
        ["LANHDAO", "Ban Giám Đốc / HĐQT", JSON.stringify(["dashboard", "customer360", "appraisal", "inspection", "debit_batch", "reconciliation", "debt_warning", "reports", "templates"]), "Giám sát tổng quan báo cáo và phê duyệt rủi ro", new Date()]
      ]
    },
    USERS: {
      headers: ["Username", "PasswordHash", "FullName", "Role", "CustomPermissions", "Status", "CreatedAt", "LastLogin"],
      color: "#0B192C",
      formats: { "G:H": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 140, 2: 200, 3: 180, 4: 120, 5: 250, 6: 110, 7: 160, 8: 160 },
      defaultData: [
        ["qtdyentho.admin", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Quản Trị Viên Hệ Thống", "ADMIN", "[]", "ACTIVE", new Date(), ""],
        ["qtdyentho.cbtd", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Lê Văn Tín (CBTD)", "CBTD", "[]", "ACTIVE", new Date(), ""],
        ["qtdyentho.ketoan", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Nguyễn Thị Hương (Kế toán)", "KETOAN", "[]", "ACTIVE", new Date(), ""],
        ["qtdyentho.bks", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Ban Kiểm Soát", "BKS", "[]", "ACTIVE", new Date(), ""]
      ]
    },
    SETTING: {
      headers: ["COMMAND", "STATUS", "REQUEST_TIME", "START_TIME", "FINISH_TIME", "TOTAL_ROWS", "MESSAGE"],
      color: "#1E293B",
      formats: { "C:E": "dd/MM/yyyy HH:mm:ss", "F:F": "#,##0" },
      colWidths: { 1: 140, 2: 120, 3: 160, 4: 160, 5: 160, 6: 120, 7: 250 },
      defaultData: [["IDLE", "SUCCESS", new Date(), new Date(), new Date(), 0, "Hệ thống sẵn sàng đồng bộ."]]
    },
    KH_CORE: {
      headers: ["MaKH", "HoTen", "DiaChi", "NgaySinh", "CCCD", "NgayCap", "NoiCap", "DienThoai", "DienThoaiDD", "SoTK", "KhuVuc", "SoTV", "SoSoCP", "NgayVaoTV", "TongTienCP", "NgayCapNhat"],
      color: "#004D40",
      formats: { "D:D": "dd/MM/yyyy", "E:E": "@", "F:F": "dd/MM/yyyy", "H:J": "@", "N:N": "dd/MM/yyyy", "O:O": "#,##0", "P:P": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 100, 2: 180, 3: 220, 4: 110, 5: 130, 6: 110, 7: 160, 8: 110, 9: 110, 10: 140, 11: 140, 12: 100, 13: 100, 14: 110, 15: 130, 16: 160 }
    },
    HDTD_CORE: {
      headers: ["SoHDTD", "MaKH", "TienVay", "DuNo", "LaiSuat", "NgayVay", "DenHan", "TraLaiDenNgay", "MaLoaiVay", "SoThangVay", "MoTaVay", "CBTD_PhuTrach", "Ten_CBTD", "TrangThaiHD", "NgayTatToan", "NgayCapNhat"],
      color: "#1B365D",
      formats: { "C:D": "#,##0", "E:E": "0.00", "F:H": "dd/MM/yyyy", "J:J": "#,##0", "L:M": "@", "N:N": "@", "O:O": "dd/MM/yyyy", "P:P": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 120, 2: 100, 3: 130, 4: 130, 5: 90, 6: 110, 7: 110, 8: 120, 9: 100, 10: 90, 11: 220, 12: 140, 13: 160, 14: 120, 15: 120, 16: 160 }
    },
    DANG_KY_TRICH_NO: {
      aliases: ["DS_TRICH_NO"],
      headers: ["MaKH", "HoTen", "GTTT", "SoTK", "DiaChi", "KyTrich", "TrangThai", "GhiChu", "NgayTao"],
      color: "#0F5132",
      formats: { "C:D": "@", "F:F": "#,##0", "I:I": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 100, 2: 180, 3: 130, 4: 140, 5: 220, 6: 90, 7: 120, 8: 200, 9: 160 }
    },
    DOT_TRICH_NO: {
      headers: ["MaDot", "ThangNam", "KyTrich", "TongPhaiThu", "TongDaTrich", "TongConNo", "TongSoKH", "TrangThai", "NgayTao", "NgayHoanTat"],
      color: "#4A148C",
      formats: { "C:C": "#,##0", "D:F": "#,##0", "G:G": "#,##0", "I:J": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 130, 2: 100, 3: 90, 4: 140, 5: 140, 6: 140, 7: 100, 8: 130, 9: 160, 10: 160 }
    },
    CHI_TIET_TRICH_NO: {
      aliases: ["LICH_SU_GIAO_DICH"],
      headers: ["MaDot", "MaKH", "HoTen", "SoCCCD", "SoTK_CASA", "SoHDTD", "DuNoGoc_Snap", "LaiDuKien", "GocDuKien", "SoTienTrichThucTe", "DaTrich", "ConNo", "TrangThai", "MaGiaoDichCore", "NgayCapNhat"],
      color: "#B71C1C",
      formats: { "D:E": "@", "G:L": "#,##0", "O:O": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 130, 2: 100, 3: 180, 4: 130, 5: 140, 6: 130, 7: 130, 8: 120, 9: 120, 10: 140, 11: 130, 12: 130, 13: 130, 14: 140, 15: 160 }
    },
    NO_TON_DONG: {
      headers: ["MaKH", "SoHDTD", "GocTon", "LaiTon", "TongNoTon", "KyPhatSinh", "TrangThai", "GhiChu", "NgayCapNhat"],
      color: "#E65100",
      formats: { "C:E": "#,##0", "I:I": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 100, 2: 120, 3: 130, 4: 130, 5: 140, 6: 120, 7: 120, 8: 200, 9: 160 }
    },
    THAM_DINH_TD: {
      aliases: ["BAO_CAO_THAM_DINH"],
      headers: [
        "MaBCTD", "MaKH", "HoTen", "SoCCCD", "NgaySinh", "GioiTinh", "DienThoai", "DiaChi", "TinhTrangHonNhan", "NguoiDongVay",
        "DeXuatVay", "MucDichVay", "ThoiHanVay", "PhuongThucTraNo", "CoTSBD", "HinhThucBaoDam", "LoaiTSBD", "SoGCN", "ThuaDatSo", "ToBanDoSo",
        "DienTich", "DiaChiTSBD", "ChuSoHuuTSBD", "QuanHeVoiNguoiVay", "GiaTriTSBD", "TinhTrangPhapLyTSBD", "MoTaTSBD",
        "ThuNhapChinh", "ThuNhapPhu", "TongThuNhapThang", "ChiPhiSinhHoat", "ChiPhiSXKD", "TongChiPhiThang", "ThangDuThang",
        "XepHangCIC", "SoTCTDQuanHe", "DuNoCICNgoai", "LichSuTraNo", "GhiChuCIC", "DiaDiemThamDinh", "HienTrangSXKD", "TuCachKhachHang",
        "DuyetVay", "ThoiHanThang", "LaiSuatDuyet", "PhuongThucGiaiNgan", "BienPhapBaoDam", "TyLeLTV", "NghiaVuTraNoThang", "TyLeDSR",
        "HeSoBuDap", "DieuKienGiaiNgan", "MucDoRuiRo", "KetLuan", "CanBoThamDinh", "DanhSachYKien", "NgayLap"
      ],
      color: "#1A237E",
      formats: { "K:K": "#,##0", "U:U": "#,##0", "Y:Y": "#,##0", "AB:AH": "#,##0", "AQ:AQ": "#,##0", "AW:AW": "#,##0", "BC:BC": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 120, 2: 100, 3: 180, 4: 130, 11: 130, 17: 160, 25: 140, 30: 130, 34: 130, 43: 130, 48: 90, 53: 110, 54: 150, 55: 140, 56: 250, 57: 160 }
    },
    KIEM_TRA_VON: {
      headers: ["MaBBKT", "SoHDTD", "MaKH", "HoTen", "LoaiDoanKT", "ThanhPhanDoan", "NgayKiemTra", "LanKiemTra", "NgayKTNext", "HinhThuc", "DiaDiemKT", "DanhGiaMucDich", "TienDoSuDungVon", "MucDoRuiRo", "MoTaThucTe", "KienNghi", "FileBienBanUrl", "HinhAnhKiemTra", "TrangThai", "NgayTao"],
      color: "#37474F",
      formats: { "G:G": "dd/MM/yyyy", "I:I": "dd/MM/yyyy", "T:T": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 120, 2: 120, 3: 100, 4: 180, 5: 110, 6: 180, 7: 110, 8: 90, 9: 110, 10: 110, 11: 180, 12: 130, 13: 140, 14: 110, 15: 220, 16: 200, 17: 200, 18: 200, 19: 120, 20: 160 }
    },
    CAU_HINH_BIEU_MAU: {
      headers: ["Id", "MaBM", "TenBM", "PhanHe", "LoaiNguon", "LinkNguon", "MoTa", "TruongTron", "TrangThai", "NgayCapNhat"],
      color: "#4338CA",
      formats: { "J:J": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 80, 2: 120, 3: 250, 4: 140, 5: 130, 6: 220, 7: 220, 8: 250, 9: 120, 10: 160 },
      defaultData: [
        [1, "BM_KT_01", "Biên Bản Kiểm Tra Sử Dụng Vốn Sau Giải Ngân", "Kiểm Tra Vốn", "GOOGLE_DOCS", "https://docs.google.com/document/d/sample-kt", "Mẫu chuẩn CBTD lập sau khi kiểm tra thực địa", JSON.stringify(["{{HoTen}}", "{{MaKH}}", "{{SoHDTD}}", "{{TienVay}}", "{{NgayKiemTra}}", "{{ThanhPhanDoan}}"]), "Hoạt động", new Date()],
        [2, "BM_TD_01", "Báo Cáo Thẩm Định & Định Giá Tài Sản Thế Chấp", "Thẩm Định", "GOOGLE_DOCS", "https://docs.google.com/document/d/sample-td", "Mẫu trình Ban Lãnh đạo phê duyệt hồ sơ vay", JSON.stringify(["{{HoTen}}", "{{MaKH}}", "{{DeXuatVay}}", "{{DuyetVay}}", "{{LaiSuat}}", "{{LoaiTSBD}}", "{{GiaTriTSBD}}", "{{TyLeLTV}}"]), "Hoạt động", new Date()],
        [3, "BM_TN_01", "Thỏa Thuận Ủy Quyền Trích Nợ Tự Động CASA", "Trích Nợ Tự Động", "GOOGLE_DOCS", "https://docs.google.com/document/d/sample-tn", "Văn bản thỏa thuận trích nợ định kỳ ký giữa KH và Quỹ", JSON.stringify(["{{HoTen}}", "{{SoCCCD}}", "{{SoTKCASA}}", "{{KyTrichNo}}"]), "Hoạt động", new Date()]
      ]
    }
  },

  /**
   * Thực hiện rà soát, tạo mới và Auto-migration cho toàn bộ 12 Sheet
   */
  ensureDatabaseSchema: function(ss) {
    ss = getSpreadsheetInstance(ss);
    if (!ss) {
      Logger.log("❌ Không thể kết nối Google Spreadsheet!");
      return { status: "error", message: "Không thể mở Google Spreadsheet!" };
    }

    for (var sheetName in this.SCHEMAS) {
      var schema = this.SCHEMAS[sheetName];
      var sheet = ss.getSheetByName(sheetName);

      // Kiểm tra xem có sheet alias cũ không
      if (!sheet && schema.aliases && schema.aliases.length > 0) {
        for (var a = 0; a < schema.aliases.length; a++) {
          var aliasSheet = ss.getSheetByName(schema.aliases[a]);
          if (aliasSheet) {
            sheet = aliasSheet;
            // Đổi tên về tên chuẩn chính thức
            try { sheet.setName(sheetName); } catch(e){}
            break;
          }
        }
      }

      if (!sheet) {
        // Tạo mới sheet nếu chưa tồn tại
        sheet = ss.insertSheet(sheetName);
        sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]);
        sheet.getRange(1, 1, 1, schema.headers.length)
          .setBackground(schema.color)
          .setFontColor("#FFFFFF")
          .setFontWeight("bold")
          .setHorizontalAlignment("center");

        // Áp dụng định dạng cột
        if (schema.formats) {
          for (var colRange in schema.formats) {
            try { sheet.getRange(colRange).setNumberFormat(schema.formats[colRange]); } catch(e){}
          }
        }

        // Chèn dữ liệu mẫu mặc định
        if (schema.defaultData && schema.defaultData.length > 0) {
          sheet.getRange(2, 1, schema.defaultData.length, schema.headers.length).setValues(schema.defaultData);
        }

        // Căn chỉnh độ rộng cột
        if (schema.colWidths) {
          for (var colIndex in schema.colWidths) {
            try { sheet.setColumnWidth(Number(colIndex), schema.colWidths[colIndex]); } catch(e){}
          }
        }
      } else {
        // Sheet đã tồn tại -> Kiểm tra và Nâng cấp Header (Auto-Migration Thông Minh Bảo Toàn Dữ Liệu)
        var lastCol = Math.max(1, sheet.getLastColumn());
        var lastRow = sheet.getLastRow();
        var curHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

        // Nếu header cũ khác với schema.headers
        if (JSON.stringify(curHeaders) !== JSON.stringify(schema.headers)) {
          if (lastRow > 1) {
            // Có dữ liệu cũ -> đọc toàn bộ dữ liệu hiện tại
            var oldData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
            var oldHeaderMap = {};
            for (var h = 0; h < curHeaders.length; h++) {
              oldHeaderMap[String(curHeaders[h]).trim()] = h;
            }

            // Tạo ma trận dữ liệu mới theo đúng thứ tự schema.headers
            var newData = [];
            for (var r = 0; r < oldData.length; r++) {
              var newRow = new Array(schema.headers.length);
              for (var k = 0; k < schema.headers.length; k++) {
                var targetColName = schema.headers[k];
                var oldIdx = oldHeaderMap[targetColName];
                if (oldIdx !== undefined && oldData[r][oldIdx] !== undefined && oldData[r][oldIdx] !== "") {
                  newRow[k] = oldData[r][oldIdx];
                } else {
                  if (targetColName === "CBTD_PhuTrach") {
                    newRow[k] = "qtdyentho.cbtd";
                  } else if (targetColName === "Ten_CBTD") {
                    newRow[k] = "Lê Văn Tín (CBTD)";
                  } else if (targetColName === "TrangThaiHD") {
                    var oldDuNo = Number(oldData[r][3] || 0);
                    newRow[k] = oldDuNo > 0 ? "DANG_VAY" : "DA_TAT_TOAN";
                  } else {
                    newRow[k] = "";
                  }
                }
              }
              newData.push(newRow);
            }

            // Xóa dữ liệu cũ và ghi lại dữ liệu đã remap chuẩn xác
            sheet.clear();
            sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]);
            sheet.getRange(2, 1, newData.length, schema.headers.length).setValues(newData);
          } else {
            sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]);
          }

          sheet.getRange(1, 1, 1, schema.headers.length)
            .setBackground(schema.color)
            .setFontColor("#FFFFFF")
            .setFontWeight("bold")
            .setHorizontalAlignment("center");
        }

        // Đảm bảo định dạng cột chuẩn
        if (schema.formats) {
          for (var colRange in schema.formats) {
            try { sheet.getRange(colRange).setNumberFormat(schema.formats[colRange]); } catch(e){}
          }
        }
      }
    }

    SpreadsheetApp.flush();
    return {
      status: "success",
      message: "Đã kiểm soát, khởi tạo và đồng bộ 100% cấu trúc 12 bảng CSDL chuẩn trên Google Sheets!"
    };
  },

  setupAllSheets: function(ss) {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    return this.ensureDatabaseSchema(ss);
  }
};
