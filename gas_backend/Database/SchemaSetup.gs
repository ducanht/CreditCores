/**
 * KHỞI TẠO, NÂNG CẤP & KIỂM SOÁT TOÀN VẸN CSDL 12 BẢNG GOOGLE SHEETS
 * Tự động kiểm tra tiêu đề, bảo toàn dữ liệu cũ và mở rộng an toàn (Auto-Migration)
 */

var SchemaSetup = {
  ensureDatabaseSchema: function(ss) {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();

    // Danh mục định nghĩa cấu trúc 12 Bảng CSDL Chuẩn
    var SCHEMAS = {
      ROLES: {
        headers: ["RoleCode", "RoleName", "Permissions", "Description", "UpdatedAt"],
        color: "#1E3E62",
        formats: { "E:E": "dd/MM/yyyy HH:mm:ss" },
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
        defaultData: [
          ["qtdyentho.admin", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Quản Trị Viên Hệ Thống", "ADMIN", "[]", "ACTIVE", new Date(), ""],
          ["qtdyentho.cbtd", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Cán Bộ Tín Dụng", "CBTD", "[]", "ACTIVE", new Date(), ""],
          ["qtdyentho.ketoan", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Kế Toán Viên", "KETOAN", "[]", "ACTIVE", new Date(), ""],
          ["qtdyentho.bks", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Ban Kiểm Soát", "BKS", "[]", "ACTIVE", new Date(), ""]
        ]
      },
      KH_CORE: {
        headers: ["MaKH", "HoTen", "DiaChi", "NgaySinh", "CCCD", "NgayCap", "NoiCap", "DienThoai", "DienThoaiDD", "SoTK", "KhuVuc", "SoTV", "SoSoCP", "NgayVaoTV", "TongTienCP", "NgayCapNhat"],
        color: "#1E3E62",
        formats: { "E:E": "@", "J:J": "@" }
      },
      HDTD_CORE: {
        headers: ["SoHDTD", "MaKH", "TienVay", "DuNo", "LaiSuat", "NgayVay", "DenHan", "TraLaiDenNgay", "MaLoaiVay", "SoThangVay", "MoTaVay", "NgayCapNhat"],
        color: "#1E3E62",
        formats: { "C:D": "#,##0", "E:E": "0.00%", "F:H": "dd/MM/yyyy" }
      },
      THAM_DINH_TD: {
        headers: ["MaBCTD", "MaKH", "HoTen", "DeXuatVay", "DuyetVay", "ThoiHanThang", "LaiSuatDuyet", "ThuNhapThang", "ChiPhiThang", "XepHangCIC", "SoTCTDQuanHe", "DuNoCICNgoai", "GhiChuCIC", "LoaiTSBD", "ChuSoHuuTSBD", "MoTaTSBD", "GiaTriTSBD", "TyLeLTV", "MucDoRuiRo", "KetLuan", "CanBoThamDinh", "DanhSachYKien", "NgayLap"],
        color: "#047857",
        formats: { "D:E": "#,##0", "H:I": "#,##0", "L:L": "#,##0", "Q:Q": "#,##0", "W:W": "dd/MM/yyyy HH:mm:ss" }
      },
      KIEM_TRA_VON: {
        headers: ["MaBBKT", "SoHDTD", "MaKH", "HoTen", "LoaiDoanKT", "ThanhPhanDoan", "NgayKiemTra", "LanKiemTra", "NgayKTNext", "HinhThuc", "DiaDiemKT", "DanhGiaMucDich", "TienDoSuDungVon", "MucDoRuiRo", "MoTaThucTe", "KienNghi", "FileBienBanUrl", "HinhAnhKiemTra", "TrangThai", "NgayTao"],
        color: "#047857",
        formats: { "G:G": "dd/MM/yyyy", "I:I": "dd/MM/yyyy", "T:T": "dd/MM/yyyy HH:mm:ss" }
      },
      DANG_KY_TRICH_NO: {
        headers: ["MaKH", "HoTen", "GTTT", "SoTK", "DiaChi", "KyTrich", "TrangThai", "GhiChu", "NgayTao"],
        color: "#9ACD32",
        formats: { "C:D": "@", "I:I": "dd/MM/yyyy HH:mm:ss" }
      },
      DOT_TRICH_NO: {
        headers: ["MaDot", "ThangNam", "KyTrich", "TongPhaiThu", "TongDaTrich", "TongConNo", "TongSoKH", "TrangThai", "NgayTao", "NgayHoanTat"],
        color: "#B45309",
        formats: { "D:F": "#,##0", "I:J": "dd/MM/yyyy HH:mm:ss" }
      },
      CHI_TIET_TRICH_NO: {
        headers: ["MaDot", "MaKH", "HoTen", "SoCCCD", "SoTK_CASA", "SoHDTD", "DuNoGoc_Snap", "LaiDuKien", "GocDuKien", "SoTienTrichThucTe", "DaTrich", "ConNo", "TrangThai", "MaGiaoDichCore", "NgayCapNhat"],
        color: "#B45309",
        formats: { "D:E": "@", "G:L": "#,##0", "O:O": "dd/MM/yyyy HH:mm:ss" }
      },
      NO_TON_DONG: {
        headers: ["MaKH", "SoHDTD", "GocTon", "LaiTon", "TongNoTon", "KyPhatSinh", "TrangThai", "GhiChu", "NgayCapNhat"],
        color: "#B91C1C",
        formats: { "C:E": "#,##0", "I:I": "dd/MM/yyyy HH:mm:ss" }
      },
      CAU_HINH_BIEU_MAU: {
        headers: ["Id", "MaBM", "TenBM", "PhanHe", "LoaiNguon", "LinkNguon", "MoTa", "TruongTron", "TrangThai", "NgayCapNhat"],
        color: "#4338CA",
        formats: { "J:J": "dd/MM/yyyy" }
      },
      SETTING: {
        headers: ["COMMAND", "STATUS", "REQUEST_TIME", "START_TIME", "FINISH_TIME", "TOTAL_ROWS", "MESSAGE"],
        color: "#1E293B",
        formats: { "C:E": "dd/MM/yyyy HH:mm:ss" },
        defaultData: [["IDLE", "SUCCESS", new Date(), new Date(), new Date(), 0, "Hệ thống sẵn sàng."]]
      }
    };

    // Duyệt qua từng bảng và thực hiện Migration tự động
    for (var sheetName in SCHEMAS) {
      var schema = SCHEMAS[sheetName];
      var sheet = ss.getSheetByName(sheetName);

      if (!sheet) {
        // Tạo mới sheet nếu chưa có
        sheet = ss.insertSheet(sheetName);
        sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]);
        sheet.getRange(1, 1, 1, schema.headers.length).setBackground(schema.color).setFontColor("#FFFFFF").setFontWeight("bold");

        if (schema.formats) {
          for (var colRange in schema.formats) {
            try { sheet.getRange(colRange).setNumberFormat(schema.formats[colRange]); } catch(e){}
          }
        }

        if (schema.defaultData && schema.defaultData.length > 0) {
          sheet.getRange(2, 1, schema.defaultData.length, schema.headers.length).setValues(schema.defaultData);
        }
        sheet.autoResizeColumns(1, schema.headers.length);
      } else {
        // Nâng cấp dòng Header (Auto-migration không mất dữ liệu)
        var curCols = Math.max(1, sheet.getLastColumn());
        var curHeaders = sheet.getRange(1, 1, 1, curCols).getValues()[0];

        // Nếu thiếu cột hoặc sai header, cập nhật dòng header mới
        if (curHeaders.length < schema.headers.length || JSON.stringify(curHeaders) !== JSON.stringify(schema.headers)) {
          sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]);
          sheet.getRange(1, 1, 1, schema.headers.length).setBackground(schema.color).setFontColor("#FFFFFF").setFontWeight("bold");
        }
      }
    }
  },

  setupAllSheets: function(ss) {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    this.ensureDatabaseSchema(ss);
    return { status: "success", message: "Đã kiểm soát và nâng cấp thành công toàn bộ 12 bảng CSDL chuẩn trên Google Sheets!" };
  }
};
