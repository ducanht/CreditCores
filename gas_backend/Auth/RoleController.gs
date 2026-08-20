/**
 * CONTROLLER PHÂN QUYỀN NHÓM & QUẢN TRỊ NGƯỜI DÙNG 360°
 */

var RoleController = {
  handleGetRolesAndPermissions: function(ss) {
    var cached = CacheHelper.getCachedData('roles_permissions');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("ROLES");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("ROLES");
    }

    var values = sheet.getDataRange().getValues();
    var roles = [];
    for (var i = 1; i < values.length; i++) {
      if (!values[i][0]) continue;
      var perms = [];
      try {
        perms = JSON.parse(values[i][2] || "[]");
      } catch(e) {}
      roles.push({
        roleCode: values[i][0],
        roleName: values[i][1],
        permissions: perms,
        description: values[i][3],
        updatedAt: formatGasDateTime(values[i][4])
      });
    }

    CacheHelper.setCachedData('roles_permissions', roles, 60);
    return { status: "success", data: roles };
  },

  handleSaveRolePermissions: function(ss, data) {
    var roleCode = (data.roleCode || "").toUpperCase().trim();
    var permissions = JSON.stringify(data.permissions || []);
    var description = data.description || "";
    var roleName = data.roleName || roleCode;

    var sheet = ss.getSheetByName("ROLES");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("ROLES");
    }

    var values = sheet.getDataRange().getValues();
    var foundIndex = -1;
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]).toUpperCase().trim() === roleCode) {
        foundIndex = i + 1;
        break;
      }
    }

    if (foundIndex > 0) {
      sheet.getRange(foundIndex, 2).setValue(roleName);
      sheet.getRange(foundIndex, 3).setValue(permissions);
      sheet.getRange(foundIndex, 4).setValue(description);
      sheet.getRange(foundIndex, 5).setValue(new Date());
    } else {
      sheet.appendRow([roleCode, roleName, permissions, description, new Date()]);
    }

    CacheHelper.invalidateModuleCache('auth');
    return { status: "success", message: "Đã cập nhật phân quyền nhóm " + roleCode + " thành công!" };
  },

  handleGetUserList: function(ss) {
    var cached = CacheHelper.getCachedData('users_list');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("USERS");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("USERS");
    }

    var values = sheet.getDataRange().getValues();
    var users = [];
    for (var i = 1; i < values.length; i++) {
      if (!values[i][0]) continue;
      var customPerms = [];
      try {
        customPerms = JSON.parse(values[i][4] || "[]");
      } catch(e) {}

      users.push({
        username: values[i][0],
        fullName: values[i][2],
        role: values[i][3],
        customPermissions: customPerms,
        status: values[i][5],
        createdAt: formatGasDateTime(values[i][6]),
        lastLogin: values[i][7] ? formatGasDateTime(values[i][7]) : "---"
      });
    }

    CacheHelper.setCachedData('users_list', users, 30);
    return { status: "success", data: users };
  },

  sanitizeFormula: function(val) {
    if (typeof val === 'string' && /^[=+\-@]/.test(val)) {
      return "'" + val;
    }
    return val;
  },

  handleSaveUser: function(ss, data) {
    if (!data.username) {
      return { status: "error", message: "Tên đăng nhập không được để trống!" };
    }

    var sheet = ss.getSheetByName("TBL_USERS");
    if (!sheet) {
      return { status: "error", message: "Không tìm thấy bảng TBL_USERS!" };
    }

    var username = String(data.username).toLowerCase().trim();
    var fullName = RoleController.sanitizeFormula(data.fullName || "");
    var role = RoleController.sanitizeFormula(data.role || "Cán bộ tín dụng");
    var customPermissions = RoleController.sanitizeFormula(data.customPermissions || "");
    var status = RoleController.sanitizeFormula(data.status || "ACTIVE");
    var passwordHash = RoleController.sanitizeFormula(data.passwordHash || "");

    var values = sheet.getDataRange().getValues();
    var foundIndex = -1;
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]).toLowerCase().trim() === username) {
        foundIndex = i + 1;
        break;
      }
    }

    if (foundIndex > 0) {
      sheet.getRange(foundIndex, 3).setValue(fullName);
      sheet.getRange(foundIndex, 4).setValue(role);
      sheet.getRange(foundIndex, 5).setValue(customPermissions);
      sheet.getRange(foundIndex, 6).setValue(status);
      if (data.passwordHash) {
        sheet.getRange(foundIndex, 2).setValue(RoleController.sanitizeFormula(data.passwordHash));
      }
      CacheHelper.invalidateModuleCache('auth');
      return { status: "success", message: "Đã cập nhật thông tin người dùng " + username + " thành công!" };
    } else {
      sheet.appendRow([username, passwordHash, fullName, role, customPermissions, status, new Date(), ""]);
      CacheHelper.invalidateModuleCache('auth');
      return { status: "success", message: "Đã tạo mới người dùng " + username + " thành công!" };
    }
  }
};
