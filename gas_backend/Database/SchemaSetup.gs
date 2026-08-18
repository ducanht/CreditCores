/**
 * KHỞI TẠO & KIỂM TRA ĐỒNG BỘ CSDL 11 SHEETS GOOGLE SHEETS
 */

var SchemaSetup = {
  ensureDatabaseSchema: function(ss) {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Kiểm tra / tạo Sheet ROLES
    var sRoles = ss.getSheetByName("ROLES");
    if (!sRoles) {
      sRoles = ss.insertSheet("ROLES");
      var headers = ["RoleCode", "RoleName", "Permissions", "Description", "UpdatedAt"];
      sRoles.getRange(1, 1, 1, headers.length).setValues([headers]);
      sRoles.getRange(1, 1, 1, headers.length).setBackground("#1E3E62").setFontColor("#FFFFFF").setFontWeight("bold");

      var defaultRoles = [
        ["ADMIN", "Quản Trị Viên Toàn Quyền", JSON.stringify(["dashboard", "customer360", "appraisal", "inspection", "debit_register", "debit_batch", "reconciliation", "debt_warning", "reports", "user_management", "settings"]), "Toàn quyền quản trị hệ thống và người dùng", new Date()],
        ["CBTD", "Cán Bộ Tín Dụng", JSON.stringify(["dashboard", "customer360", "appraisal", "inspection", "debit_register", "reports"]), "Thẩm định, kiểm tra vốn và theo dõi khách hàng", new Date()],
        ["KETOAN", "Kế Toán Viên / Thủ Quỹ", JSON.stringify(["dashboard", "customer360", "debit_register", "debit_batch", "reconciliation", "debt_warning", "reports"]), "Quản lý trích nợ, đối soát và sổ theo dõi nợ", new Date()],
        ["BKS", "Ban Kiểm Soát", JSON.stringify(["dashboard", "customer360", "appraisal", "inspection", "debt_warning", "reports"]), "Kiểm soát, giám sát rủi ro và báo cáo", new Date()],
        ["LANHDAO", "Ban Giám Đốc / HĐQT", JSON.stringify(["dashboard", "customer360", "debt_warning", "reports"]), "Giám sát tổng quan báo cáo và phê duyệt rủi ro", new Date()]
      ];
      sRoles.getRange(2, 1, defaultRoles.length, headers.length).setValues(defaultRoles);
      sRoles.getRange("E:E").setNumberFormat("dd/MM/yyyy HH:mm:ss");
      sRoles.autoResizeColumns(1, headers.length);
    }

    // 2. Kiểm tra / tạo Sheet USERS
    var sUsers = ss.getSheetByName("USERS");
    if (!sUsers) {
      sUsers = ss.insertSheet("USERS");
      var uHeaders = ["Username", "PasswordHash", "FullName", "Role", "CustomPermissions", "Status", "CreatedAt", "LastLogin"];
      sUsers.getRange(1, 1, 1, uHeaders.length).setValues([uHeaders]);
      sUsers.getRange(1, 1, 1, uHeaders.length).setBackground("#0B192C").setFontColor("#FFFFFF").setFontWeight("bold");

      var defaultUsers = [
        ["qtdyentho.admin", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Quản Trị Viên Hệ Thống", "ADMIN", "[]", "ACTIVE", new Date(), ""],
        ["qtdyentho.cbtd", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Cán Bộ Tín Dụng", "CBTD", "[]", "ACTIVE", new Date(), ""],
        ["qtdyentho.ketoan", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Kế Toán Viên", "KETOAN", "[]", "ACTIVE", new Date(), ""],
        ["qtdyentho.bks", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Ban Kiểm Soát", "BKS", "[]", "ACTIVE", new Date(), ""]
      ];
      sUsers.getRange(2, 1, defaultUsers.length, uHeaders.length).setValues(defaultUsers);
      sUsers.getRange("G:H").setNumberFormat("dd/MM/yyyy HH:mm:ss");
      sUsers.autoResizeColumns(1, uHeaders.length);
    } else {
      var headerVals = sUsers.getRange(1, 1, 1, sUsers.getLastColumn()).getValues()[0];
      if (headerVals.indexOf("CustomPermissions") === -1) {
        sUsers.insertColumnAfter(4);
        sUsers.getRange(1, 5).setValue("CustomPermissions").setFontWeight("bold");
        var lastR = sUsers.getLastRow();
        if (lastR > 1) {
          var empties = [];
          for (var i = 2; i <= lastR; i++) empties.push(["[]"]);
          sUsers.getRange(2, 5, empties.length, 1).setValues(empties);
        }
      }
    }

    // 3. Kiểm tra / tạo Sheet KIEM_TRA_VON
    var sKT = ss.getSheetByName("KIEM_TRA_VON");
    var ktHeaders = [
      "MaBBKT", "SoHDTD", "MaKH", "HoTen", "LoaiDoanKT", "ThanhPhanDoan", 
      "NgayKiemTra", "LanKiemTra", "NgayKTNext", "HinhThuc", "DiaDiemKT", 
      "DanhGiaMucDich", "TienDoSuDungVon", "MucDoRuiRo", "MoTaThucTe", 
      "KienNghi", "FileBienBanUrl", "HinhAnhKiemTra", "TrangThai", "NgayTao"
    ];
    if (!sKT) {
      sKT = ss.insertSheet("KIEM_TRA_VON");
      sKT.getRange(1, 1, 1, ktHeaders.length).setValues([ktHeaders]);
      sKT.getRange(1, 1, 1, ktHeaders.length).setBackground("#047857").setFontColor("#FFFFFF").setFontWeight("bold");
      sKT.getRange("G:G").setNumberFormat("dd/MM/yyyy");
      sKT.getRange("I:I").setNumberFormat("dd/MM/yyyy");
      sKT.getRange("T:T").setNumberFormat("dd/MM/yyyy HH:mm:ss");
      sKT.autoResizeColumns(1, ktHeaders.length);
    } else {
      var existingKTHeaders = sKT.getRange(1, 1, 1, Math.max(1, sKT.getLastColumn())).getValues()[0];
      if (existingKTHeaders.indexOf("NgayKTNext") === -1 || existingKTHeaders.indexOf("LoaiDoanKT") === -1) {
        // Cập nhật lại dòng tiêu đề cho đủ 20 cột
        sKT.getRange(1, 1, 1, ktHeaders.length).setValues([ktHeaders]);
        sKT.getRange(1, 1, 1, ktHeaders.length).setBackground("#047857").setFontColor("#FFFFFF").setFontWeight("bold");
      }
    }
  },

  setupAllSheets: function(ss) {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    this.ensureDatabaseSchema(ss);
    return { status: "success", message: "Đã khởi tạo và nâng cấp thành công toàn bộ 11 bảng CSDL trên Google Sheets!" };
  }
};
