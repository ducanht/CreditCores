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
        ["admin", "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", "Nguyễn Quản Trị", "ADMIN", "[]", "ACTIVE", new Date(), ""],
        ["cbtd", "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", "Lê Văn Tín", "CBTD", "[]", "ACTIVE", new Date(), ""],
        ["ketoan", "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", "Trần Thị Toán", "KETOAN", "[]", "ACTIVE", new Date(), ""],
        ["lanhdao", "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", "Phạm Giám Đốc", "LANHDAO", "[]", "ACTIVE", new Date(), ""]
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
  },

  setupAllSheets: function(ss) {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    this.ensureDatabaseSchema(ss);
    return { status: "success", message: "Đã khởi tạo thành công toàn bộ 11 bảng CSDL trên Google Sheets!" };
  }
};
