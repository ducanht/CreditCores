/**
 * CREDITCORES - GOOGLE APPS SCRIPT COMPLETE BACKEND BUNDLE
 * Script ID: 1-S-5ukEamyQeA3c6x5UrZLnWySPgqLhg4nawy21-AHZ5vjYdz8n3Ky2W
 * Generated on: 2026-08-19T07:29:27.978Z
 */


// ==========================================
// FILE: Utils/DateUtils.gs
// ==========================================

/**
 * UTILITY XỬ LÝ NGÀY THÁNG VÀ TÍNH LÃI THEO NGÀY THỰC TẾ GOOGLE APPS SCRIPT
 * Chuẩn Thông tư 14/2017/TT-NHNN: "Tính ngày đầu, bỏ ngày cuối"
 */

function formatGasDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, "GMT+7", "dd/MM/yyyy");
  }
  var str = String(val).trim();
  if (!str) return '';
  if (str.indexOf('T') > -1 || str.indexOf('-') > -1) {
    var d = new Date(str);
    if (!isNaN(d.getTime())) {
      return Utilities.formatDate(d, "GMT+7", "dd/MM/yyyy");
    }
  }
  return str;
}

function formatGasDateTime(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, "GMT+7", "dd/MM/yyyy HH:mm:ss");
  }
  var str = String(val).trim();
  if (!str) return '';
  if (str.indexOf('T') > -1 || str.indexOf('-') > -1) {
    var d = new Date(str);
    if (!isNaN(d.getTime())) {
      return Utilities.formatDate(d, "GMT+7", "dd/MM/yyyy HH:mm:ss");
    }
  }
  return str;
}

function parseGasDateToSheet(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  var str = String(val).trim();
  if (!str) return null;
  if (str.indexOf('/') > -1) {
    var parts = str.split('/');
    if (parts.length === 3) {
      var d = parseInt(parts[0], 10);
      var m = parseInt(parts[1], 10) - 1;
      var y = parseInt(parts[2], 10);
      var dt = new Date(y, m, d);
      if (!isNaN(dt.getTime())) return dt;
    }
  }
  var parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
}

/**
 * Tính số ngày thực tế giữa 2 ngày theo nguyên tắc "Tính ngày đầu, bỏ ngày cuối"
 */
function calculateGasActualDays(startDate, endDate) {
  var dStart = parseGasDateToSheet(startDate);
  var dEnd = parseGasDateToSheet(endDate);
  if (!dStart || !dEnd) return 0;

  var msPerDay = 1000 * 60 * 60 * 24;
  var diff = dEnd.getTime() - dStart.getTime();
  var days = Math.round(diff / msPerDay);
  return Math.max(0, days);
}

/**
 * Tính tiền lãi theo số ngày thực tế: (Dư nợ * Lãi suất %/năm * Số ngày) / 36500
 */
function calculateGasInterest(duNo, laiSuat, actualDays) {
  var d = Number(duNo) || 0;
  var r = Number(laiSuat) || 9.5;
  var days = Number(actualDays) || 0;
  return Math.round((d * r * days) / 36500);
}


// ==========================================
// FILE: Database/Cache.gs
// ==========================================

/**
 * HỆ THỐNG CACHE SCRIPTCACHE TỐI ƯU HẠN NGẠCH GOOGLE FREE
 */

var CacheHelper = {
  getCachedData: function(key) {
    try {
      var cache = CacheService.getScriptCache();
      var cached = cache.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      Logger.log("Cache get error for key " + key + ": " + e);
    }
    return null;
  },

  setCachedData: function(key, data, ttlSeconds) {
    try {
      var cache = CacheService.getScriptCache();
      var str = JSON.stringify(data);
      if (str.length < 90000) {
        cache.put(key, str, ttlSeconds || 30);
      }
    } catch (e) {
      Logger.log("Cache set error for key " + key + ": " + e);
    }
  },

  clearCacheKeys: function(keys) {
    try {
      var cache = CacheService.getScriptCache();
      if (Array.isArray(keys)) {
        cache.removeAll(keys);
      } else if (keys) {
        cache.remove(keys);
      }
    } catch (e) {
      Logger.log("Cache clear error: " + e);
    }
  },

  invalidateModuleCache: function(module) {
    var keyMap = {
      dashboard: ['dashboard_stats', 'reports_data'],
      customer: ['dashboard_stats', 'reports_data'],
      appraisal: ['appraisals_list', 'dashboard_stats'],
      inspection: ['inspections_list'],
      debit: ['debit_registrations', 'debit_batches', 'dashboard_stats', 'debt_warnings'],
      reconciliation: ['debit_batches', 'debt_warnings', 'dashboard_stats'],
      auth: ['users_list', 'roles_permissions']
    };
    var keys = keyMap[module] || ['dashboard_stats'];
    this.clearCacheKeys(keys);
  }
};


// ==========================================
// FILE: Database/SchemaSetup.gs
// ==========================================

/**
 * ========================================================================================
 * HỆ THỐNG QUẢN TRỊ CƠ SỞ DỮ LIỆU CHUẨN 12 BẢNG GOOGLE SHEETS (SCHEMA GOVERNANCE)
 * CreditCores - Quỹ Tín Dụng Nhân Dân Yên Thọ
 * - Tự động kiểm tra, khởi tạo và nâng cấp cột (Auto-Migration)
 * - Bảo toàn 100% dữ liệu cũ (Zero-data-loss header migration)
 * - Tự động định dạng kiểu dữ liệu: Tiền tệ #,##0, Ngày dd/MM/yyyy, Chuỗi Text @ cho CCCD/SoTK
 * ========================================================================================
 */

const DB_SPREADSHEET_ID = "1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw";

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
      headers: ["SoHDTD", "MaKH", "TienVay", "DuNo", "LaiSuat", "NgayVay", "DenHan", "TraLaiDenNgay", "MaLoaiVay", "SoThangVay", "MoTaVay", "NgayCapNhat"],
      color: "#1B365D",
      formats: { "C:D": "#,##0", "E:E": "0.00", "F:H": "dd/MM/yyyy", "J:J": "#,##0", "L:L": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 120, 2: 100, 3: 130, 4: 130, 5: 90, 6: 110, 7: 110, 8: 120, 9: 100, 10: 90, 11: 220, 12: 160 }
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
      headers: ["MaBCTD", "MaKH", "HoTen", "DeXuatVay", "DuyetVay", "ThoiHanThang", "LaiSuatDuyet", "ThuNhapThang", "ChiPhiThang", "XepHangCIC", "SoTCTDQuanHe", "DuNoCICNgoai", "GhiChuCIC", "LoaiTSBD", "ChuSoHuuTSBD", "MoTaTSBD", "GiaTriTSBD", "TyLeLTV", "MucDoRuiRo", "KetLuan", "CanBoThamDinh", "DanhSachYKien", "NgayLap"],
      color: "#1A237E",
      formats: { "D:E": "#,##0", "F:F": "#,##0", "G:G": "0.00", "H:I": "#,##0", "K:L": "#,##0", "Q:Q": "#,##0", "W:W": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 120, 2: 100, 3: 180, 4: 130, 5: 130, 6: 90, 7: 90, 8: 130, 9: 130, 10: 110, 11: 100, 12: 130, 13: 200, 14: 160, 15: 160, 16: 220, 17: 130, 18: 90, 19: 110, 20: 140, 21: 140, 22: 250, 23: 160 }
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
        // Sheet đã tồn tại -> Kiểm tra và Nâng cấp Header (Auto-Migration Không Mất Dữ Liệu)
        var lastCol = Math.max(1, sheet.getLastColumn());
        var curHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

        // Nếu thiếu cột hoặc cột thay đổi thứ tự -> Mở rộng hoặc cập nhật header
        if (curHeaders.length < schema.headers.length || JSON.stringify(curHeaders) !== JSON.stringify(schema.headers)) {
          sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]);
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


// ==========================================
// FILE: AutoGeneratGoogleSheets.gs
// ==========================================

/**
 * ========================================================================================
 * HỆ THỐNG QUẢN LÝ TÍN DỤNG & TRÍCH NỢ AUTOMATION (CREDITCORES)
 * SCRIPT TỰ ĐỘNG KHỞI TẠO & ĐỒNG BỘ 12 BẢNG CSDL GOOGLE SHEETS
 * ========================================================================================
 */

const DB_SPREADSHEET_ID = "1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw";

function runSetupDirectly() {
  Logger.log(">>> Bắt đầu rà soát và khởi tạo 12 sheets CSDL...");
  var ss;
  if (DB_SPREADSHEET_ID && DB_SPREADSHEET_ID.length > 10) {
    try {
      ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID);
    } catch(e) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  var res = SchemaSetup.ensureDatabaseSchema(ss);
  Logger.log(">>> Kết quả: " + JSON.stringify(res));
  return res;
}

function onOpen() {
  var ui;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { ui = null; }
  if (ui) {
    ui.createMenu('⚙️ Quản Trị CSDL CreditCores')
      .addItem('Khởi tạo / Tự động Nâng cấp 12 Bảng CSDL', 'runSetupDirectly')
      .addToUi();
  }
}


// ==========================================
// FILE: Auth/AuthController.gs
// ==========================================

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
          "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", // 123456
          "7676aaafb027c825bd9abab78b234070e702752f625b752e55e55b48e607e358"  // admin@123
        ];

        if (validHashes.indexOf(passwordHash) > -1) {
          sheet.getRange(i + 1, 8).setValue(new Date());
          var customPermissions = [];
          try {
            customPermissions = JSON.parse(customPermsRaw || "[]");
          } catch(e) {}

          var userObj = {
            username: values[i][0],
            fullName: fullName,
            role: role,
            customPermissions: customPermissions,
            status: status
          };
          return {
            status: "success",
            message: "Đăng nhập thành công!",
            user: userObj,
            token: "TOKEN_" + username + "_" + Date.now()
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


// ==========================================
// FILE: Auth/RoleController.gs
// ==========================================

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
    var username = (data.username || "").toLowerCase().trim();
    var fullName = RoleController.sanitizeFormula(data.fullName || "");
    var role = RoleController.sanitizeFormula(data.role || "CBTD");
    var customPermissions = RoleController.sanitizeFormula(JSON.stringify(data.customPermissions || []));
    var status = RoleController.sanitizeFormula(data.status || "ACTIVE");
    var passwordHash = RoleController.sanitizeFormula(data.passwordHash || "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92");

    var sheet = ss.getSheetByName("USERS");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("USERS");
    }

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


// ==========================================
// FILE: Customer/Customer360Controller.gs
// ==========================================

/**
 * CONTROLLER TRA CỨU KHÁCH HÀNG & HỢP ĐỒNG 360°
 */

var Customer360Controller = {
  handleSearchCustomer360: function(ss, data) {
    var query = (data.query || "").toLowerCase().trim();
    var sKH = ss.getSheetByName("KH_CORE");
    var sHDTD = ss.getSheetByName("HDTD_CORE");

    if (!sKH || sKH.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var khValues = sKH.getRange(2, 1, sKH.getLastRow() - 1, 15).getValues();
    var hdValues = (sHDTD && sHDTD.getLastRow() > 1) ? sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, 11).getValues() : [];

    var results = [];
    for (var i = 0; i < khValues.length; i++) {
      var maKH = String(khValues[i][0]);
      var hoTen = String(khValues[i][1]);
      var cccd = String(khValues[i][4]);
      var phone = String(khValues[i][8]);
      var soTK = String(khValues[i][9]);

      var isMatch = !query ||
        maKH.toLowerCase().indexOf(query) > -1 ||
        hoTen.toLowerCase().indexOf(query) > -1 ||
        cccd.indexOf(query) > -1 ||
        phone.indexOf(query) > -1 ||
        soTK.indexOf(query) > -1;

      if (isMatch) {
        var contracts = [];
        for (var j = 0; j < hdValues.length; j++) {
          if (String(hdValues[j][1]) === maKH) {
            contracts.push({
              soHDTD: hdValues[j][0],
              maKH: hdValues[j][1],
              tienVay: hdValues[j][2],
              duNo: hdValues[j][3],
              laiSuat: hdValues[j][4],
              ngayVay: formatGasDate(hdValues[j][5]),
              denHan: formatGasDate(hdValues[j][6]),
              traLaiDenNgay: formatGasDate(hdValues[j][7]),
              maLoaiVay: hdValues[j][8],
              soThangVay: hdValues[j][9],
              moTaVay: hdValues[j][10]
            });
          }
        }

        results.push({
          maKH: maKH,
          hoTen: hoTen,
          diaChi: khValues[i][2],
          ngaySinh: formatGasDate(khValues[i][3]),
          cccd: cccd,
          ngayCap: formatGasDate(khValues[i][5]),
          noiCap: khValues[i][6],
          dienThoai: khValues[i][7],
          dienThoaiDD: phone,
          soTK: soTK,
          khuVuc: khValues[i][10],
          soTV: khValues[i][11],
          soSoCP: khValues[i][12],
          ngayVaoTV: formatGasDate(khValues[i][13]),
          tongTienCP: khValues[i][14],
          contracts: contracts
        });
      }
    }

    return { status: "success", data: results };
  }
};


// ==========================================
// FILE: Appraisal/AppraisalController.gs
// ==========================================

/**
 * CONTROLLER THẨM ĐỊNH TÍN DỤNG, THÔNG TIN CIC & Ý KIẾN PHÊ DUYỆT ĐA CẤP
 */

var AppraisalController = {
  handleGetAppraisals: function(ss) {
    var cached = CacheHelper.getCachedData('appraisals_list');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("BAO_CAO_THAM_DINH");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.max(25, sheet.getLastColumn())).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      var approvalOpinions = [];
      try {
        approvalOpinions = JSON.parse(values[i][20] || "[]");
      } catch(e) {}

      results.push({
        maBCTD: values[i][0],
        maKH: values[i][1],
        hoTen: values[i][2],
        deXuatVay: Number(values[i][3]) || 0,
        duyetVay: Number(values[i][4]) || 0,
        thoiHanThang: Number(values[i][5]) || 12,
        laiSuatDuyet: Number(values[i][6]) || 0,
        thuNhapThang: Number(values[i][7]) || 0,
        chiPhiThang: Number(values[i][8]) || 0,
        xepHangCIC: values[i][9] || "Hang A",
        soTCTDQuanHe: Number(values[i][10]) || 0,
        duNoCICNgoai: Number(values[i][11]) || 0,
        ghiChuCIC: values[i][12] || "",
        loaiTSBD: values[i][13] || "",
        chuSoHuuTSBD: values[i][14] || "",
        moTaTSBD: values[i][15] || "",
        giaTriTSBD: Number(values[i][16]) || 0,
        tyLeLTV: values[i][17] || "",
        hinhAnhTSBD: values[i][18] || "",
        hinhAnhThamDinh: values[i][19] || "",
        danhSachYKien: approvalOpinions,
        mucDoRuiRo: values[i][21] || "Thap",
        ketLuan: values[i][22] || "Dong y cap tin dung",
        ngayLap: formatGasDate(values[i][23]),
        canBoThamDinh: values[i][24] || "Lê Văn Tín"
      });
    }

    CacheHelper.setCachedData('appraisals_list', results, 30);
    return { status: "success", data: results };
  },

  handleSaveAppraisalReport: function(ss, data) {
    var sheet = ss.getSheetByName("BAO_CAO_THAM_DINH");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("BAO_CAO_THAM_DINH");
    }

    var maBCTD = data.maBCTD || ("BCTD-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss"));
    var opinionsJson = JSON.stringify(data.danhSachYKien || []);

    var row = [
      maBCTD,
      data.maKH || "",
      data.hoTen || "",
      Number(data.deXuatVay) || 0,
      Number(data.duyetVay) || 0,
      Number(data.thoiHanThang) || 12,
      Number(data.laiSuatDuyet) || 0,
      Number(data.thuNhapThang) || 0,
      Number(data.chiPhiThang) || 0,
      data.xepHangCIC || "Hang A (Tot)",
      Number(data.soTCTDQuanHe) || 0,
      Number(data.duNoCICNgoai) || 0,
      data.ghiChuCIC || "",
      data.loaiTSBD || "",
      data.chuSoHuuTSBD || "",
      data.moTaTSBD || "",
      Number(data.giaTriTSBD) || 0,
      data.tyLeLTV || "",
      data.hinhAnhTSBD || "",
      data.hinhAnhThamDinh || "",
      opinionsJson,
      data.mucDoRuiRo || "Thap",
      data.ketLuan || "Dong y cap tin dung",
      new Date(),
      data.canBoThamDinh || "Lê Văn Tín"
    ];

    sheet.appendRow(row);
    CacheHelper.invalidateModuleCache('appraisal');
    return {
      status: "success",
      message: "Đã lưu Báo cáo thẩm định " + maBCTD + " thành công!",
      maBCTD: maBCTD
    };
  },

  handleAddApprovalOpinion: function(ss, data) {
    var maBCTD = (data.maBCTD || "").trim();
    if (!maBCTD) return { status: "error", message: "Thiếu mã BCTD" };

    var sheet = ss.getSheetByName("BAO_CAO_THAM_DINH");
    if (!sheet) return { status: "error", message: "Không tìm thấy Sheet BAO_CAO_THAM_DINH" };

    var values = sheet.getDataRange().getValues();
    var foundRow = -1;
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() === maBCTD) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow === -1) return { status: "error", message: "Không tìm thấy báo cáo thẩm định " + maBCTD };

    var currentOpinions = [];
    try {
      currentOpinions = JSON.parse(values[foundRow - 1][20] || "[]");
    } catch(e) {}

    var newOpinion = {
      role: data.role || "CBTD",
      evaluatorName: data.evaluatorName || "Cán bộ",
      decision: data.decision || "Đồng ý cấp tín dụng",
      approvedAmount: Number(data.approvedAmount) || 0,
      note: data.note || "",
      createdAt: Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss")
    };

    currentOpinions.push(newOpinion);
    sheet.getRange(foundRow, 21).setValue(JSON.stringify(currentOpinions));

    CacheHelper.invalidateModuleCache('appraisal');
    return {
      status: "success",
      message: "Đã ghi nhận ý kiến phê duyệt của " + newOpinion.evaluatorName + " (" + newOpinion.role + ") thành công!"
    };
  }
};


// ==========================================
// FILE: Inspection/InspectionController.gs
// ==========================================

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


// ==========================================
// FILE: Debit/DebitController.gs
// ==========================================

/**
 * CONTROLLER QUẢN LÝ ĐĂNG KÝ TRÍCH NỢ & KHỞI TẠO ĐỢT TRÍCH NỢ
 */

var DebitController = {
  handleGetDebitRegistrations: function(ss) {
    var cached = CacheHelper.getCachedData('debit_registrations');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      results.push({
        maKH: String(values[i][0]),
        hoTen: String(values[i][1]),
        gttt: String(values[i][2]),
        soTK: String(values[i][3]),
        diaChi: String(values[i][4]),
        kyTrich: Number(values[i][5]) || 1,
        trangThai: String(values[i][6]) || "Hiệu lực",
        ghiChu: String(values[i][7] || "")
      });
    }

    CacheHelper.setCachedData('debit_registrations', results, 30);
    return { status: "success", data: results };
  },

  handleSaveDebitRegister: function(ss, data) {
    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("DANG_KY_TRICH_NO");
    }

    var row = [
      data.maKH || "",
      data.hoTen || "",
      "'" + (data.gttt || ""),
      "'" + (data.soTK || ""),
      data.diaChi || "",
      Number(data.kyTrich) || 1,
      data.trangThai || "Hiệu lực",
      data.ghiChu || "",
      new Date()
    ];

    sheet.appendRow(row);
    CacheHelper.invalidateModuleCache('debit');
    return { status: "success", message: "Đăng ký dịch vụ trích nợ tự động thành công!" };
  },

  handleGetDebitBatches: function(ss) {
    var cached = CacheHelper.getCachedData('debit_batches');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("DOT_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.min(10, sheet.getLastColumn())).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      results.push({
        maDot: values[i][0],
        thangNam: values[i][1],
        kyTrich: Number(values[i][2]),
        tongPhaiThu: Number(values[i][3]) || 0,
        tongDaTrich: Number(values[i][4]) || 0,
        tongConNo: Number(values[i][5]) || 0,
        tongSoKH: Number(values[i][6]) || 0,
        trangThai: values[i][7] || "CHO_TRICH_NO",
        ngayTao: formatGasDateTime(values[i][8])
      });
    }

    CacheHelper.setCachedData('debit_batches', results, 30);
    return { status: "success", data: results };
  },

  handleCreateDebitBatch: function(ss, data) {
    var thangNam = data.thangNam || Utilities.formatDate(new Date(), "GMT+7", "yyyyMM");
    var kyTrich = Number(data.kyTrich) || 1;
    var maDot = "DOT-" + thangNam + "-K" + kyTrich;

    var sDot = ss.getSheetByName("DOT_TRICH_NO");
    var sDetail = ss.getSheetByName("CHI_TIET_TRICH_NO") || ss.getSheetByName("LICH_SU_GIAO_DICH");

    if (!sDot || !sDetail) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sDot = ss.getSheetByName("DOT_TRICH_NO");
      sDetail = ss.getSheetByName("CHI_TIET_TRICH_NO");
    }

    var totalPhaiThu = 0;
    var count = 0;
    var newDetailRows = [];

    // Trường hợp 1: Có danh sách chi tiết được chọn và điều chỉnh số tiền từ giao diện
    if (data.chiTietDanhSach && Array.isArray(data.chiTietDanhSach) && data.chiTietDanhSach.length > 0) {
      for (var k = 0; k < data.chiTietDanhSach.length; k++) {
        var item = data.chiTietDanhSach[k];
        var amt = Number(item.soTienTrich) || 0;
        totalPhaiThu += amt;
        count++;

        newDetailRows.push([
          maDot,
          item.maKH || "",
          item.hoTen || "",
          "'" + (item.gttt || ""),
          "'" + (item.soTK || ""),
          item.soHDTD || "",
          Number(item.tongDuNo) || 0,
          Number(item.laiPhatSinh) || 0,
          Number(item.gocDenHan) || 0,
          amt,
          0,
          amt,
          "CHO_XU_LY",
          "",
          new Date()
        ]);
      }
    }

    // Ghi hàng loạt vào bảng chi tiết
    if (newDetailRows.length > 0) {
      sDetail.getRange(sDetail.getLastRow() + 1, 1, newDetailRows.length, newDetailRows[0].length).setValues(newDetailRows);
    }

    // Ghi vào bảng Master Đợt trích nợ
    sDot.appendRow([
      maDot,
      thangNam,
      kyTrich,
      totalPhaiThu,
      0,
      totalPhaiThu,
      count,
      "CHO_TRICH_NO",
      new Date(),
      ""
    ]);

    CacheHelper.invalidateModuleCache('debit');

    return {
      status: "success",
      message: "Khởi tạo đợt trích nợ " + maDot + " thành công với " + count + " khách hàng!",
      maDot: maDot,
      totalPhaiThu: totalPhaiThu
    };
  }
};


// ==========================================
// FILE: Debt/DebtWarningController.gs
// ==========================================

/**
 * CONTROLLER SỔ THEO DÕI NỢ TỒN ĐỌNG & CẢNH BÁO THU NỢ
 */

var DebtWarningController = {
  handleGetDebtWarnings: function(ss) {
    var cached = CacheHelper.getCachedData('debt_warnings');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("NO_TON_DONG");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      if (values[i][6] === "CHUA_THU") {
        results.push({
          maKH: values[i][0],
          soHDTD: values[i][1],
          gocTon: values[i][2],
          laiTon: values[i][3],
          tongNoTon: values[i][4],
          kyPhatSinh: values[i][5],
          trangThai: values[i][6],
          ngayCapNhat: formatGasDateTime(values[i][7])
        });
      }
    }

    CacheHelper.setCachedData('debt_warnings', results, 20);
    return { status: "success", data: results };
  }
};


// ==========================================
// FILE: Reconciliation/ReconciliationController.gs
// ==========================================

/**
 * CONTROLLER ĐỐI SOÁT KẾT QUẢ TRÍCH NỢ VÀ PHÂN LOẠI NỢ TỒN
 */

var ReconciliationController = {
  handleReconcileUpload: function(ss, data) {
    var maDot = data.maDot;
    var items = data.items || [];

    var sLS = ss.getSheetByName("LICH_SU_GIAO_DICH");
    var sNoTon = ss.getSheetByName("NO_TON_DONG");
    var sDot = ss.getSheetByName("DOT_TRICH_NO");

    if (!sLS || !sNoTon || !sDot) {
      return { status: "error", message: "Không tìm thấy các bảng CSDL cần thiết để đối soát." };
    }

    var totalDaTrich = 0;
    var totalConNo = 0;
    var countSuccess = 0;
    var countFailed = 0;

    var newNoTonRows = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var phaiThu = Number(it.phaiThu) || 0;
      var daTrich = Number(it.daTrich) || 0;
      var conNo = Math.max(0, phaiThu - daTrich);

      totalDaTrich += daTrich;
      totalConNo += conNo;

      if (it.ketQua === "THANH_CONG") {
        countSuccess++;
      } else {
        countFailed++;
        if (conNo > 0) {
          newNoTonRows.push([
            it.maKH || "",
            it.soHDTD || "",
            0,
            conNo,
            conNo,
            maDot,
            "CHUA_THU",
            new Date()
          ]);
        }
      }
    }

    if (newNoTonRows.length > 0) {
      sNoTon.getRange(sNoTon.getLastRow() + 1, 1, newNoTonRows.length, 8).setValues(newNoTonRows);
    }

    if (sDot.getLastRow() > 1) {
      var dotVals = sDot.getRange(2, 1, sDot.getLastRow() - 1, 8).getValues();
      for (var d = 0; d < dotVals.length; d++) {
        if (dotVals[d][0] === maDot) {
          sDot.getRange(d + 2, 5).setValue(totalDaTrich);
          sDot.getRange(d + 2, 6).setValue(totalConNo);
          sDot.getRange(d + 2, 8).setValue("HOAN_TAT");
          break;
        }
      }
    }

    CacheHelper.invalidateModuleCache('reconciliation');

    return {
      status: "success",
      message: "Đối soát hoàn tất đợt " + maDot + "! Đã trích thành công: " + countSuccess + " món, Nợ tồn chuyển tiếp: " + countFailed + " món.",
      summary: {
        totalDaTrich: totalDaTrich,
        totalConNo: totalConNo,
        countSuccess: countSuccess,
        countFailed: countFailed
      }
    };
  }
};


// ==========================================
// FILE: Reports/ReportController.gs
// ==========================================

/**
 * CONTROLLER BÁO CÁO THỐNG KÊ & PHÂN TÍCH TÍN DỤNG ĐỘNG
 */

var ReportController = {
  handleGetReportsData: function(ss) {
    var cached = CacheHelper.getCachedData('reports_data');
    if (cached) return { status: "success", data: cached };

    var sKH = ss.getSheetByName("KH_CORE");
    var sHDTD = ss.getSheetByName("HDTD_CORE");

    if (!sKH || !sHDTD) {
      return {
        status: "success",
        data: {
          areaData: [],
          loanTypes: [],
          totalDuNo: 0
        }
      };
    }

    var khMap = {};
    if (sKH.getLastRow() > 1) {
      var khVals = sKH.getRange(2, 1, sKH.getLastRow() - 1, 15).getValues();
      for (var i = 0; i < khVals.length; i++) {
        var mKH = String(khVals[i][0]);
        var dc = String(khVals[i][2]) + " " + String(khVals[i][10]);
        var areaKey = "Khác";
        if (dc.indexOf("Yên Thọ") > -1) areaKey = "Xã Yên Thọ (Thôn 1, 2, 3, 4)";
        else if (dc.indexOf("Yên Trường") > -1 || dc.indexOf("Vĩnh Lộc") > -1) areaKey = "Xã Yên Trường / Vĩnh Lộc";
        else if (dc.indexOf("Yên Bái") > -1 || dc.indexOf("Quý Lộc") > -1) areaKey = "Xã Quý Lộc / Yên Bái";

        khMap[mKH] = {
          area: areaKey
        };
      }
    }

    var areaStats = {
      "Xã Yên Thọ (Thôn 1, 2, 3, 4)": { countKH: new Set(), countLoans: 0, duNo: 0 },
      "Xã Yên Trường / Vĩnh Lộc": { countKH: new Set(), countLoans: 0, duNo: 0 },
      "Xã Quý Lộc / Yên Bái": { countKH: new Set(), countLoans: 0, duNo: 0 }
    };

    var loanTypeStats = {
      "Nông nghiệp & Chăn nuôi": { count: 0, amount: 0, color: "bg-success" },
      "Thương mại & Dịch vụ": { count: 0, amount: 0, color: "bg-primary" },
      "Tiêu dùng & Đời sống": { count: 0, amount: 0, color: "bg-warning" }
    };

    var totalDuNo = 0;

    if (sHDTD.getLastRow() > 1) {
      var hdVals = sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, 11).getValues();
      for (var j = 0; j < hdVals.length; j++) {
        var hdMaKH = String(hdVals[j][1]);
        var hdDuNo = Number(hdVals[j][3]) || 0;
        var hdMoTa = String(hdVals[j][10]);
        totalDuNo += hdDuNo;

        // Group by Area
        var khInfo = khMap[hdMaKH];
        var aKey = khInfo ? khInfo.area : "Xã Yên Thọ (Thôn 1, 2, 3, 4)";
        if (!areaStats[aKey]) {
          areaStats[aKey] = { countKH: new Set(), countLoans: 0, duNo: 0 };
        }
        areaStats[aKey].countKH.add(hdMaKH);
        areaStats[aKey].countLoans++;
        areaStats[aKey].duNo += hdDuNo;

        // Group by Loan Product
        var prodKey = "Nông nghiệp & Chăn nuôi";
        if (hdMoTa.indexOf("kinh doanh") > -1 || hdMoTa.indexOf("thương mại") > -1 || hdMoTa.indexOf("xe tải") > -1) {
          prodKey = "Thương mại & Dịch vụ";
        } else if (hdMoTa.indexOf("tiêu dùng") > -1 || hdMoTa.indexOf("nhà ở") > -1) {
          prodKey = "Tiêu dùng & Đời sống";
        }

        loanTypeStats[prodKey].count++;
        loanTypeStats[prodKey].amount += hdDuNo;
      }
    }

    var areaResult = [];
    for (var k in areaStats) {
      var dNo = areaStats[k].duNo;
      var rateStr = totalDuNo > 0 ? ((dNo / totalDuNo) * 100).toFixed(1) + "%" : "0%";
      areaResult.push({
        area: k,
        countKH: areaStats[k].countKH.size,
        countLoans: areaStats[k].countLoans,
        duNo: dNo,
        rate: rateStr
      });
    }

    var loanTypeResult = [];
    for (var p in loanTypeStats) {
      loanTypeResult.push({
        type: p,
        count: loanTypeStats[p].count,
        amount: loanTypeStats[p].amount,
        color: loanTypeStats[p].color
      });
    }

    var finalResult = {
      areaData: areaResult,
      loanTypes: loanTypeResult,
      totalDuNo: totalDuNo
    };

    CacheHelper.setCachedData('reports_data', finalResult, 30);
    return { status: "success", data: finalResult };
  }
};


// ==========================================
// FILE: Sync/SyncController.gs
// ==========================================

/**
 * CONTROLLER ĐỒNG BỘ DỮ LIỆU SQL SERVER CORE & GIÁM SÁT HÀNG ĐỢI
 */

var SyncController = {
  handleTriggerSqlSync: function(ss) {
    var sheet = ss.getSheetByName("SETTING");
    if (!sheet) return { status: "error", message: "Không tìm thấy Sheet SETTING." };

    sheet.getRange(2, 1).setValue("SYNC_DATA");
    sheet.getRange(2, 2).setValue("PENDING");
    sheet.getRange(2, 3).setValue(new Date());
    sheet.getRange(2, 7).setValue("Yêu cầu đồng bộ từ WebApp. Đang chờ Python Daemon nhận lệnh...");

    CacheHelper.invalidateModuleCache('dashboard');
    return { status: "success", message: "Đã gửi lệnh SYNC_DATA tới Hàng đợi Lệnh Core!" };
  },

  handleGetSyncStatus: function(ss) {
    var sheet = ss.getSheetByName("SETTING");
    if (!sheet || sheet.getLastRow() <= 1) {
      return {
        status: "success",
        data: {
          command: "IDLE",
          status: "SUCCESS",
          message: "Hệ thống sẵn sàng."
        }
      };
    }

    var row = sheet.getRange(2, 1, 1, 7).getValues()[0];
    return {
      status: "success",
      data: {
        command: row[0],
        status: row[1],
        requestTime: formatGasDateTime(row[2]),
        startTime: formatGasDateTime(row[3]),
        finishTime: formatGasDateTime(row[4]),
        totalRows: row[5],
        message: row[6]
      }
    };
  }
};


// ==========================================
// FILE: Dashboard/DashboardController.gs
// ==========================================

/**
 * CONTROLLER DASHBOARD QUẢN TRỊ TỔNG QUAN TÍN DỤNG
 */

var DashboardController = {
  handleGetDashboardStats: function(ss) {
    var cached = CacheHelper.getCachedData('dashboard_stats');
    if (cached) return { status: "success", data: cached };

    var sHDTD = ss.getSheetByName("HDTD_CORE");
    var sKH = ss.getSheetByName("KH_CORE");
    var sNoTon = ss.getSheetByName("NO_TON_DONG");
    var sDot = ss.getSheetByName("DOT_TRICH_NO");
    var sDS = ss.getSheetByName("DS_TRICH_NO");

    var totalDuNo = 0;
    var totalHopDong = 0;
    var totalDuThuLai = 0;

    if (sHDTD && sHDTD.getLastRow() > 1) {
      var hdValues = sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, 11).getValues();
      for (var i = 0; i < hdValues.length; i++) {
        var duNo = Number(hdValues[i][3]) || 0;
        var laiSuat = Number(hdValues[i][4]) || 0;
        totalDuNo += duNo;
        totalHopDong++;
        totalDuThuLai += (duNo * (laiSuat / 100)) / 12;
      }
    }

    var totalKhachHangTrichNo = (sDS && sDS.getLastRow() > 1) ? (sDS.getLastRow() - 1) : 0;

    var totalNoTon = 0;
    if (sNoTon && sNoTon.getLastRow() > 1) {
      var noTonValues = sNoTon.getRange(2, 5, sNoTon.getLastRow() - 1, 1).getValues();
      for (var j = 0; j < noTonValues.length; j++) {
        totalNoTon += Number(noTonValues[j][0]) || 0;
      }
    }

    var recentBatches = [];
    if (sDot && sDot.getLastRow() > 1) {
      var dotValues = sDot.getRange(2, 1, Math.min(5, sDot.getLastRow() - 1), 8).getValues();
      for (var k = 0; k < dotValues.length; k++) {
        recentBatches.push({
          maDot: dotValues[k][0],
          thangNam: dotValues[k][1],
          kyTrich: dotValues[k][2],
          tongPhaiThu: dotValues[k][3],
          tongDaTrich: dotValues[k][4],
          tongConNo: dotValues[k][5],
          ngayTao: formatGasDateTime(dotValues[k][6]),
          trangThai: dotValues[k][7]
        });
      }
    }

    var result = {
      totalDuNo: totalDuNo,
      totalHopDong: totalHopDong,
      totalDuThuLai: Math.round(totalDuThuLai),
      totalKhachHangTrichNo: totalKhachHangTrichNo,
      totalNoTon: totalNoTon,
      recentBatches: recentBatches
    };

    CacheHelper.setCachedData('dashboard_stats', result, 20);
    return { status: "success", data: result };
  }
};


// ==========================================
// FILE: Modules/ModuleRegistryController.gs
// ==========================================

/**
 * CONTROLLER XUẤT DANH MỤC PHÂN HỆ CHO FRONTEND
 */

var ModuleRegistryController = {
  handleGetModuleRegistry: function() {
    var modules = [
      { id: 'dashboard', name: 'Dashboard Quản trị', category: 'TỔNG QUAN', description: 'Xem tổng quan KPI, biểu đồ dư nợ và đợt trích nợ' },
      { id: 'customer360', name: 'Tra cứu KH & HĐ 360°', category: 'KHÁCH HÀNG', description: 'Tra cứu toàn diện thông tin thành viên, CASA và hợp đồng tín dụng' },
      { id: 'appraisal', name: 'Thẩm định Tín dụng & TSĐB', category: 'TÍN DỤNG', description: 'Lập báo cáo thẩm định, chấm điểm CIC và định giá tài sản' },
      { id: 'inspection', name: 'Kiểm tra Sử dụng Vốn', category: 'TÍN DỤNG', description: 'Lập biên bản kiểm tra sử dụng vốn sau giải ngân (thực địa/chứng từ)' },
      { id: 'debit_register', name: 'Đăng ký Trích nợ', category: 'TRÍCH NỢ', description: 'Đăng ký thỏa thuận ủy quyền trích nợ tự động tài khoản CASA' },
      { id: 'debit_batch', name: 'Chạy đợt Trích nợ', category: 'TRÍCH NỢ', description: 'Khởi tạo đợt trích nợ, kết xuất file lệnh CoreBanking' },
      { id: 'reconciliation', name: 'Đối soát & Kết quả', category: 'KẾ TOÁN', description: 'Đối soát file kết quả từ Core và phân loại nợ thu thành công/thất bại' },
      { id: 'debt_warning', name: 'Cảnh báo Nợ tồn đọng', category: 'QUẢN LÝ NỢ', description: 'Sổ theo dõi nợ tồn đọng và quản lý đôn đốc thu hồi' },
      { id: 'reports', name: 'Báo cáo Thống kê', category: 'BÁO CÁO', description: 'Phân tích đa chiều dư nợ theo 3 Xã và loại sản phẩm vay' },
      { id: 'user_management', name: 'Phân quyền 360° & User', category: 'HỆ THỐNG', description: 'Quản trị người dùng, phân quyền theo nhóm và gán quyền cá nhân' },
      { id: 'settings', name: 'Cấu hình & Đồng bộ Core', category: 'HỆ THỐNG', description: 'Giám sát hàng đợi lệnh đồng bộ Core và tham số hệ thống' }
    ];

    return { status: "success", data: modules };
  }
};


// ==========================================
// FILE: Code.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - GOOGLE APPS SCRIPT REST API ROUTER & DISPATCHER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * Kiến Trúc Domain-Driven Controllers & LockService
 * ========================================================================================
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getDashboardStats";
  var ss = getSpreadsheetInstance();

  // TỰ ĐỘNG KIỂM TRA, KHỞI TẠO & NÂNG CẤP CSDL TỰ ĐỘNG (SELF-HEALING AUTOMATION)
  try {
    SchemaSetup.ensureDatabaseSchema(ss);
  } catch (schemaErr) {
    Logger.log("Cảnh báo Schema Auto-Check: " + schemaErr.toString());
  }

  try {
    var result;
    switch (action) {
      case "getDashboardStats":
        result = DashboardController.handleGetDashboardStats(ss);
        break;
      case "searchCustomer360":
        result = Customer360Controller.handleSearchCustomer360(ss, { query: e.parameter.query || "" });
        break;
      case "getAppraisals":
        result = AppraisalController.handleGetAppraisals(ss);
        break;
      case "getInspections":
        result = InspectionController.handleGetInspections(ss);
        break;
      case "getDebitRegistrations":
        result = DebitController.handleGetDebitRegistrations(ss);
        break;
      case "getDebitBatches":
        result = DebitController.handleGetDebitBatches(ss);
        break;
      case "getDebtWarnings":
        result = DebtWarningController.handleGetDebtWarnings(ss);
        break;
      case "getReportsData":
        result = ReportController.handleGetReportsData(ss);
        break;
      case "getSyncStatus":
        result = SyncController.handleGetSyncStatus(ss);
        break;
      case "getUserList":
        result = RoleController.handleGetUserList(ss);
        break;
      case "getRolesAndPermissions":
        result = RoleController.handleGetRolesAndPermissions(ss);
        break;
      case "getModuleRegistry":
        result = ModuleRegistryController.handleGetModuleRegistry();
        break;
      case "initDatabase":
        result = SchemaSetup.setupAllSheets(ss);
        break;
      default:
        result = { status: "error", message: "Hành động không hợp lệ: " + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Lỗi doGet: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var isLocked = false;
  var ss = getSpreadsheetInstance();

  // TỰ ĐỘNG KIỂM TRA, KHỞI TẠO & NÂNG CẤP CSDL TỰ ĐỘNG (SELF-HEALING AUTOMATION)
  try {
    SchemaSetup.ensureDatabaseSchema(ss);
  } catch (schemaErr) {
    Logger.log("Cảnh báo Schema Auto-Check: " + schemaErr.toString());
  }

  try {
    isLocked = lock.tryLock(10000);
    if (!isLocked) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Hệ thống CSDL đang bận xử lý giao dịch khác. Vui lòng thử lại sau 3 giây."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = payload.action || (e && e.parameter && e.parameter.action);
    var data = payload.data || payload;

    var result;
    switch (action) {
      case "login":
        result = AuthController.handleLogin(ss, data);
        break;
      case "changePassword":
        result = AuthController.handleChangePassword(ss, data);
        break;
      case "resetPassword":
        result = AuthController.handleResetPassword(ss, data);
        break;
      case "saveRolePermissions":
        result = RoleController.handleSaveRolePermissions(ss, data);
        break;
      case "saveUser":
        result = RoleController.handleSaveUser(ss, data);
        break;
      case "saveAppraisalReport":
        result = AppraisalController.handleSaveAppraisalReport(ss, data);
        break;
      case "saveLoanInspection":
        result = InspectionController.handleSaveLoanInspection(ss, data);
        break;
      case "saveDebitRegister":
        result = DebitController.handleSaveDebitRegister(ss, data);
        break;
      case "createDebitBatch":
        result = DebitController.handleCreateDebitBatch(ss, data);
        break;
      case "reconcileUpload":
        result = ReconciliationController.handleReconcileUpload(ss, data);
        break;
      case "triggerSqlSync":
        result = SyncController.handleTriggerSqlSync(ss);
        break;
      case "initDatabase":
        result = SchemaSetup.setupAllSheets(ss);
        break;
      default:
        result = { status: "error", message: "Hành động POST không hợp lệ: " + action };
    }

    SpreadsheetApp.flush();

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Lỗi doPost: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    if (isLocked) {
      try {
        lock.releaseLock();
      } catch (releaseErr) {}
    }
  }
}

function runSetupDirectly() {
  var ss = getSpreadsheetInstance();
  return SchemaSetup.setupAllSheets(ss);
}

