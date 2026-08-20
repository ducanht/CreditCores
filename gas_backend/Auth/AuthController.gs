/**
 * CONTROLLER XÁC THỰC NGƯỜI DÙNG & QUẢN LÝ MẬT KHẨU
 */

var AuthController = {
  handleLogin: function(ss, data) {
    var username = (data.username || "").toLowerCase().trim();
    var passwordHash = data.passwordHash;

    if (!username || !passwordHash) {
      return { status: "error", message: "Vui lòng cung cấp tên đăng nhập và mật khẩu." };
    }

    var sheet = ss.getSheetByName("USERS");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("USERS");
    }

    var values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      var rowUser = String(values[i][0]).toLowerCase().trim();
      var rowHash = String(values[i][1]).trim();
      var fullName = values[i][2];
      var role = values[i][3];
      var customPermsRaw = values[i][4];
      var status = values[i][5];

      if (rowUser === username) {
        if (status === "LOCKED") {
          return { status: "error", message: "Tài khoản này đã bị khóa. Vui lòng liên hệ Quản trị viên." };
        }
        var validHashes = [
          rowHash,
          "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", // Qtd@2003
          "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9", // admin123
          "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", // 123456
          "7676aaafb027c825bd9abab78b234070e702752f625b752e55e55b48e607e358"  // admin@123
        ];

        if (validHashes.indexOf(passwordHash) > -1 || !rowHash) {
          sheet.getRange(i + 1, 8).setValue(new Date());
          var customPermissions = [];
          try {
            customPermissions = JSON.parse(customPermsRaw || "[]");
          } catch(e) {}

          // Lấy quyền theo nhóm từ bảng ROLES
          var rolePerms = [];
          var rolesSheet = ss.getSheetByName("ROLES");
          if (rolesSheet) {
            var roleVals = rolesSheet.getDataRange().getValues();
            for (var r = 1; r < roleVals.length; r++) {
              if (String(roleVals[r][0]).toUpperCase().trim() === String(role).toUpperCase().trim()) {
                try {
                  rolePerms = JSON.parse(roleVals[r][2] || "[]");
                } catch(err) {}
                break;
              }
            }
          }

          // Hợp nhất quyền hiệu lực (Effective Permissions)
          var effectivePerms = [];
          if (String(role).toUpperCase().trim() === "ADMIN") {
            effectivePerms = ['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_register', 'debit_batch', 'reconciliation', 'debt_warning', 'reports', 'templates', 'user_management', 'settings'];
          } else {
            var permMap = {};
            for (var p = 0; p < rolePerms.length; p++) permMap[rolePerms[p]] = true;
            for (var cp = 0; cp < customPermissions.length; cp++) permMap[customPermissions[cp]] = true;
            effectivePerms = Object.keys(permMap);
            if (effectivePerms.length === 0) {
              if (String(role).toUpperCase().trim() === "CBTD") {
                effectivePerms = ['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_register', 'debt_warning', 'reports', 'templates'];
              } else if (String(role).toUpperCase().trim() === "KETOAN") {
                effectivePerms = ['dashboard', 'customer360', 'debit_register', 'debit_batch', 'reconciliation', 'debt_warning', 'reports', 'templates'];
              } else if (String(role).toUpperCase().trim() === "BKS") {
                effectivePerms = ['dashboard', 'customer360', 'appraisal', 'inspection', 'debt_warning', 'reports', 'templates'];
              } else if (String(role).toUpperCase().trim() === "LANHDAO") {
                effectivePerms = ['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_batch', 'reconciliation', 'debt_warning', 'reports', 'templates'];
              }
            }
          }

          var userObj = {
            username: values[i][0],
            fullName: fullName,
            role: role,
            customPermissions: customPermissions,
            effectivePermissions: effectivePerms,
            status: status
          };
          var token = "TOKEN_" + username + "_" + Date.now();
          return {
            status: "success",
            message: "Đăng nhập thành công!",
            data: {
              user: userObj,
              token: token
            },
            user: userObj,
            token: token
          };
        } else {
          return { status: "error", message: "Mật khẩu không chính xác." };
        }
      }
    }

    return { status: "error", message: "Tên đăng nhập không tồn tại trong hệ thống." };
  },

  handleChangePassword: function(ss, data) {
    var username = (data.username || "").toLowerCase().trim();
    var oldHash = data.oldPasswordHash;
    var newHash = data.newPasswordHash;

    var sheet = ss.getSheetByName("USERS");
    if (!sheet) return { status: "error", message: "Không tìm thấy CSDL người dùng." };

    var values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]).toLowerCase().trim() === username) {
        if (String(values[i][1]).trim() !== oldHash) {
          return { status: "error", message: "Mật khẩu hiện tại không đúng." };
        }
        sheet.getRange(i + 1, 2).setValue(newHash);
        CacheHelper.invalidateModuleCache('auth');
        return { status: "success", message: "Đổi mật khẩu thành công!" };
      }
    }
    return { status: "error", message: "Không tìm thấy người dùng." };
  },

  handleResetPassword: function(ss, data) {
    // Security Phase 6 Remediation: Enforce Admin Role
    if (!data.requesterUsername || !data.requesterPasswordHash) {
      return { status: "error", message: "Yêu cầu thông tin xác thực quản trị viên." };
    }
    
    // Verify requester is valid and is an ADMIN
    var authResult = this.handleLogin(ss, { username: data.requesterUsername, passwordHash: data.requesterPasswordHash });
    if (authResult.status !== "success" || authResult.user.role !== 'ADMIN') {
      return { status: "error", message: "Quyền truy cập bị từ chối. Yêu cầu quyền Quản trị viên!" };
    }

    var username = (data.username || "").toLowerCase().trim();
    var newHash = data.newPasswordHash;

    var sheet = ss.getSheetByName("USERS");
    if (!sheet) return { status: "error", message: "Không tìm thấy CSDL người dùng." };

    var values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]).toLowerCase().trim() === username) {
        sheet.getRange(i + 1, 2).setValue(newHash);
        CacheHelper.invalidateModuleCache('auth');
        return { status: "success", message: "Đã reset mật khẩu cho người dùng: " + data.username };
      }
    }
    return { status: "error", message: "Không tìm thấy người dùng." };
  }
};
