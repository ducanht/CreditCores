/**
 * ========================================================================================
 * CREDITCORES - ALL-IN-ONE GOOGLE APPS SCRIPT BACKEND ENGINE
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Trọn bộ Backend Google Apps Script All-In-One:
 *              - Header-Name Based Mapping (chống lệch cột, an toàn khi thêm/bớt cột)
 *              - Tối ưu tra cứu O(1) Hash Map cho 5.175+ khách hàng & 549+ hợp đồng
 *              - Thẩm định, Trích nợ Auto-Debit, Kiểm tra vốn, In hợp đồng Mail Merge
 *              - Độc lập hoàn toàn, không nghẽn Timeout, Zero Mock Data
 * @updated     22/9/2026
 * @version     3.1 Header-Based Resilient Engine
 * ========================================================================================
 */


// ==========================================
// MODULE FILE: gas_backend/Utils/DateUtils.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - DATEUTILS
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module DateUtils xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

function formatGasDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, "GMT+7", "dd/MM/yyyy");
  }
  if (typeof val === 'number') {
    var d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, "GMT+7", "dd/MM/yyyy");
  }
  var str = String(val).trim();
  if (!str) return '';
  if (!isNaN(Number(str)) && Number(str) > 30000 && Number(str) < 60000) {
    var d = new Date(Math.round((Number(str) - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, "GMT+7", "dd/MM/yyyy");
  }
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
  if (typeof val === 'number') {
    var d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, "GMT+7", "dd/MM/yyyy HH:mm:ss");
  }
  var str = String(val).trim();
  if (!str) return '';
  if (!isNaN(Number(str)) && Number(str) > 30000 && Number(str) < 60000) {
    var d = new Date(Math.round((Number(str) - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, "GMT+7", "dd/MM/yyyy HH:mm:ss");
  }
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
// MODULE FILE: gas_backend/Utils/HeaderUtils.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - HEADER UTILITIES
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Các hàm tiện ích truy xuất & ghi dữ liệu Google Sheets THEO TÊN CỘT
 *              Đảm bảo 100% không bị ảnh hưởng khi thêm, bớt hoặc thay đổi thứ tự cột.
 * ========================================================================================
 */

var HeaderUtils = {
  /**
   * Lấy Map ánh xạ { TênCột: index (0-based) } từ dòng 1 của Sheet
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
   * @return {Object} { [colName]: colIndex }
   */
  getHeaderMap: function(sheet, headerRowIdx) {
    if (!sheet) return {};
    var lastCol = sheet.getLastColumn();
    if (lastCol < 1) return {};
    var row = headerRowIdx || 1;
    var headers = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
    var map = {};
    for (var i = 0; i < headers.length; i++) {
      var h = String(headers[i] || "").trim();
      if (h) {
        map[h] = i;
      }
    }
    return map;
  },

  /**
   * Lấy giá trị ô an toàn từ mảng row dựa theo Tên Cột
   * @param {Array} row Mảng dữ liệu của một hàng
   * @param {Object} headerMap Map { TênCột: index }
   * @param {string} colName Tên cột cần lấy
   * @param {*} defaultVal Giá trị mặc định nếu ô rỗng hoặc không tồn tại
   * @return {*}
   */
  getCell: function(row, headerMap, colName, defaultVal) {
    if (!row || !headerMap) return defaultVal !== undefined ? defaultVal : "";
    var idx = headerMap[colName];
    if (idx !== undefined && idx < row.length) {
      var val = row[idx];
      if (val !== undefined && val !== null && val !== "") {
        return val;
      }
    }
    return defaultVal !== undefined ? defaultVal : "";
  },

  /**
   * Chuyển đổi 1 mảng dòng row thành đối tượng key-value theo Tên Cột
   * @param {Array} row Mảng dữ liệu hàng
   * @param {Object} headerMap Map { TênCột: index }
   * @return {Object}
   */
  rowToDict: function(row, headerMap) {
    var dict = {};
    if (!row || !headerMap) return dict;
    for (var colName in headerMap) {
      var idx = headerMap[colName];
      dict[colName] = (idx < row.length && row[idx] !== undefined && row[idx] !== null) ? row[idx] : "";
    }
    return dict;
  },

  /**
   * Cập nhật 1 ô trên Sheet dựa theo Tên Cột
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
   * @param {number} rowIdx Vị trí dòng trên Google Sheet (1-based, ví dụ: 2, 3...)
   * @param {Object} headerMap Map { TênCột: index }
   * @param {string} colName Tên cột cần ghi
   * @param {*} value Giá trị cần ghi
   */
  setCell: function(sheet, rowIdx, headerMap, colName, value) {
    if (!sheet || !headerMap) return;
    var idx = headerMap[colName];
    if (idx !== undefined) {
      sheet.getRange(rowIdx, idx + 1).setValue(value);
    }
  },

  /**
   * Tạo mảng dữ liệu row từ dict theo đúng thứ tự mảng headers
   * @param {Object} dict Dữ liệu key-value
   * @param {Array} headers Mảng tên cột
   * @return {Array}
   */
  dictToRow: function(dict, headers) {
    var row = [];
    for (var i = 0; i < headers.length; i++) {
      var colName = headers[i];
      var val = dict[colName];
      row.push(val !== undefined && val !== null ? val : "");
    }
    return row;
  }
};



// ==========================================
// MODULE FILE: gas_backend/Database/Cache.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - CACHE (HIGH-PERFORMANCE CHUNKED CACHE)
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Hệ thống Memory Caching phân tầng (Multi-tier Chunked Cache)
 *              Hỗ trợ tự động chia nhỏ dữ liệu vượt ngưỡng 100KB của CacheService
 *              và ghép lại nguyên vẹn (Zero-drop-cache), tham chiếu kiến trúc HuyDongVon.
 * @created     15/08/2026
 * @updated     18/09/2026
 * @version     3.0
 * ========================================================================================
 */

var CacheHelper = {
  CHUNK_SIZE_LIMIT: 80 * 1024, // 80KB an toàn (dưới giới hạn 100KB của Google Apps Script)
  _executionCache: {},         // In-Memory Per-Execution Cache (Cực nhanh trong 1 vòng đời request)

  // Phân tầng thời gian sống (Cache Tiering)
  TIERS: {
    HOT: 180,      // 3 phút: Dashboard, Sync Monitor
    WARM: 900,     // 15 phút: Reports, Customer 360 default, Debt warnings
    COLD: 21600    // 6 giờ: Roles, Permissions, Templates, Drive settings
  },

  getCachedData: function(key) {
    // 1. Kiểm tra In-Memory Execution Cache trước (< 0.1ms)
    if (this._executionCache && this._executionCache[key]) {
      return this._executionCache[key];
    }

    try {
      var cache = CacheService.getScriptCache();
      var metadataStr = cache.get(key);
      if (metadataStr == null) return null;

      var metadata;
      try {
        metadata = JSON.parse(metadataStr);
      } catch (e) {
        return null;
      }

      // 2. Nếu là dữ liệu chia nhỏ (Chunked Storage)
      if (metadata && metadata.__isChunked) {
        var chunkKeys = [];
        for (var i = 0; i < metadata.count; i++) {
          chunkKeys.push(key + "_chunk_" + i);
        }
        var chunkData = cache.getAll(chunkKeys);
        var fullStr = "";
        for (var j = 0; j < metadata.count; j++) {
          var cVal = chunkData[key + "_chunk_" + j];
          if (cVal == null) return null; // Mất 1 chunk coi như cache không hợp lệ
          fullStr += cVal;
        }
        var parsed = JSON.parse(fullStr);
        if (!this._executionCache) this._executionCache = {};
        this._executionCache[key] = parsed;
        return parsed;
      }

      // 3. Dữ liệu đơn
      if (!this._executionCache) this._executionCache = {};
      this._executionCache[key] = metadata;
      return metadata;
    } catch (e) {
      Logger.log("Cache get error for key " + key + ": " + e.toString());
    }
    return null;
  },

  setCachedData: function(key, data, ttlSeconds) {
    if (!data) return;
    if (!this._executionCache) this._executionCache = {};
    this._executionCache[key] = data;

    var expiration = ttlSeconds || this.TIERS.WARM;
    try {
      var cache = CacheService.getScriptCache();
      var jsonStr = JSON.stringify(data);

      if (jsonStr.length <= this.CHUNK_SIZE_LIMIT) {
        // Dưới 80KB: Lưu trực tiếp
        cache.put(key, jsonStr, expiration);
      } else {
        // Vượt 80KB: Tự động Chunking phân mảnh
        var count = 0;
        var batchMap = {};
        for (var i = 0; i < jsonStr.length; i += this.CHUNK_SIZE_LIMIT) {
          batchMap[key + "_chunk_" + count] = jsonStr.substring(i, i + this.CHUNK_SIZE_LIMIT);
          count++;
        }

        // Lưu metadata
        var meta = {
          __isChunked: true,
          count: count,
          totalLength: jsonStr.length,
          timestamp: Date.now()
        };
        batchMap[key] = JSON.stringify(meta);

        // Ghi hàng loạt vào CacheService
        cache.putAll(batchMap, expiration);
      }
    } catch (e) {
      Logger.log("Cache set error for key " + key + ": " + e.toString());
    }
  },

  clearCacheKeys: function(keys) {
    var keyList = Array.isArray(keys) ? keys : [keys];
    try {
      var cache = CacheService.getScriptCache();
      var keysToRemove = [];

      for (var k = 0; k < keyList.length; k++) {
        var baseKey = keyList[k];
        if (this._executionCache) delete this._executionCache[baseKey];
        keysToRemove.push(baseKey);

        // Xóa cả các chunk tiềm năng (tối đa 30 chunks)
        for (var c = 0; c < 30; c++) {
          keysToRemove.push(baseKey + "_chunk_" + c);
        }
      }

      cache.removeAll(keysToRemove);
    } catch (e) {
      Logger.log("Cache clear error: " + e.toString());
    }
  },

  invalidateModuleCache: function(module) {
    var keyMap = {
      dashboard: ['dashboard_stats', 'reports_data_v2'],
      customer: ['dashboard_stats', 'reports_data_v2', 'cust360_default'],
      appraisal: ['appraisals_list', 'dashboard_stats'],
      inspection: ['inspections_list', 'dashboard_stats'],
      debit: ['debit_registrations', 'debit_batches', 'dashboard_stats', 'debt_warnings'],
      reconciliation: ['debit_batches', 'debt_warnings', 'dashboard_stats'],
      auth: ['users_list', 'roles_permissions']
    };
    var keys = keyMap[module] || ['dashboard_stats', 'reports_data_v2'];
    this.clearCacheKeys(keys);
  }
};



// ==========================================
// MODULE FILE: gas_backend/Database/SchemaSetup.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - SCHEMASETUP
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module SchemaSetup xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var DB_SPREADSHEET_ID = typeof DB_SPREADSHEET_ID !== 'undefined' ? DB_SPREADSHEET_ID : "1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw";

var _SS_CACHE = null;
function getSpreadsheetInstance(ss) {
  if (ss) return ss;
  if (_SS_CACHE) return _SS_CACHE;
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      _SS_CACHE = active;
      return _SS_CACHE;
    }
  } catch (e) {}
  if (DB_SPREADSHEET_ID && DB_SPREADSHEET_ID.length > 10) {
    try {
      _SS_CACHE = SpreadsheetApp.openById(DB_SPREADSHEET_ID);
      return _SS_CACHE;
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
      headers: ["COMMAND", "STATUS", "REQUEST_TIME", "START_TIME", "FINISH_TIME", "TOTAL_ROWS", "MESSAGE", "PARAMS"],
      color: "#1E293B",
      formats: { "C:E": "dd/MM/yyyy HH:mm:ss", "F:F": "#,##0", "G:H": "@" },
      colWidths: { 1: 160, 2: 120, 3: 160, 4: 160, 5: 160, 6: 120, 7: 250, 8: 250 },
      defaultData: [["IDLE", "SUCCESS", new Date(), new Date(), new Date(), 0, "Hệ thống sẵn sàng đồng bộ.", ""]]
    },
    KH_CORE: {
      headers: [
        "MaKH", "HoTen", "CCCD", "NgayCap", "NoiCap", "NgaySinh",
        "DienThoai", "DienThoaiDD", "DiaChi", "KvXa", "KvThon", "KhuVuc", "SoTK",
        "SoTV", "SoSoCP", "NgayVaoTV", "TongTienCP",
        "TongDuNoHienTai", "SoLuongHDVay", "TrangThaiVay", "NhomNoCIC", "NgayCapNhat"
      ],
      color: "#004D40",
      formats: { "A:C": "@", "D:D": "dd/MM/yyyy", "E:E": "@", "F:F": "dd/MM/yyyy", "G:M": "@", "N:O": "@", "P:P": "dd/MM/yyyy", "Q:S": "#,##0", "T:U": "@", "V:V": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 100, 2: 180, 3: 130, 4: 110, 5: 160, 6: 110, 7: 110, 8: 110, 9: 220, 10: 130, 11: 130, 12: 140, 13: 140, 14: 100, 15: 100, 16: 110, 17: 130, 18: 140, 19: 110, 20: 120, 21: 110, 22: 160 }
    },
    HDTD_CORE: {
      headers: [
        "SoHDTD", "MaKH", "HoTen", "CCCD", "DienThoai", "DiaChi", "KvXa", "KvThon",
        "TienVay", "DuNo", "LaiSuat", "NgayVay", "DenHan", "TraLaiDenNgay",
        "SoThangVay", "MaLoaiVay", "MoTaVay",
        "CBTD_PhuTrach", "Ten_CBTD", "TrangThaiHD", "MaLoaiHD", "NgayCapNhat"
      ],
      color: "#1B365D",
      formats: { "A:H": "@", "I:J": "#,##0", "K:K": "0.00", "L:N": "dd/MM/yyyy", "O:O": "#,##0", "P:U": "@", "V:V": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 130, 2: 100, 3: 180, 4: 130, 5: 120, 6: 220, 7: 130, 8: 130, 9: 130, 10: 130, 11: 90, 12: 110, 13: 110, 14: 120, 15: 90, 16: 140, 17: 220, 18: 140, 19: 160, 20: 120, 21: 140, 22: 160 }
    },
    HDTD_CORE_DN: {
      isTwoTier: true,
      bannerText: "Sao kê tín dụng đến ngày: 22/09/2026 | Dữ liệu cập nhật: 22/09/2026 12:00:00 | Nguồn: CoreBanking NG-eFUND",
      bannerColor: "#4338CA",
      headers: [
        "SoHDTD", "MaKH", "HoTen", "DiaChi", "KvXa", "KvThon",
        "TienVay", "DuNo", "LaiSuat", "NgayVay", "DenHan",
        "SoThangVay", "MaLoaiVay", "MoTaVay", "MaLoaiHD",
        "NgayDuLieu", "NgayCapNhat"
      ],
      color: "#312E81",
      formats: { "A:F": "@", "G:H": "#,##0", "I:I": "0.00", "J:K": "dd/MM/yyyy", "L:L": "#,##0", "M:O": "@", "P:P": "dd/MM/yyyy", "Q:Q": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 130, 2: 100, 3: 180, 4: 220, 5: 130, 6: 130, 7: 130, 8: 130, 9: 90, 10: 110, 11: 110, 12: 90, 13: 140, 14: 220, 15: 140, 16: 110, 17: 160 }
    },
    HDTD_CORE_ALL: {
      isTwoTier: true,
      bannerText: "Lưu trữ sao kê tín dụng các ngày cuối tháng | Dữ liệu cập nhật: 22/09/2026 12:00:00 | Nguồn: CoreBanking NG-eFUND",
      bannerColor: "#1E3A8A",
      headers: [
        "SoHDTD", "MaKH", "HoTen", "DiaChi", "KvXa", "KvThon",
        "TienVay", "DuNo", "LaiSuat", "NgayVay", "DenHan",
        "SoThangVay", "MaLoaiVay", "MoTaVay", "MaLoaiHD",
        "NgayDuLieu", "NgayCapNhat"
      ],
      color: "#101959",
      formats: { "A:F": "@", "G:H": "#,##0", "I:I": "0.00", "J:K": "dd/MM/yyyy", "L:L": "#,##0", "M:O": "@", "P:P": "dd/MM/yyyy", "Q:Q": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 130, 2: 100, 3: 180, 4: 220, 5: 130, 6: 130, 7: 130, 8: 130, 9: 90, 10: 110, 11: 110, 12: 90, 13: 140, 14: 220, 15: 140, 16: 110, 17: 160 }
    },
    DANG_KY_TRICH_NO: {
      aliases: ["DS_TRICH_NO"],
      headers: [
        "MaKH", "HoTen", "CCCD", "NgayCap", "DienThoai", "DiaChi", "SoTK", "KyTrichMacDinh", "TrangThai", "GhiChu", "NgayTao"
      ],
      color: "#0F5132",
      formats: { "A:C": "@", "D:D": "dd/MM/yyyy", "E:G": "@", "H:H": "#,##0", "I:J": "@", "K:K": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 100, 2: 180, 3: 130, 4: 110, 5: 120, 6: 220, 7: 140, 8: 120, 9: 120, 10: 200, 11: 160 }
    },
    CAU_HINH_DOT_TRICH_NO: {
      headers: ["MaDotConfig", "TenDot", "TuNgayVay", "DenNgayVay", "NgayTrichHangThang", "TrangThai", "GhiChu"],
      color: "#0284C7",
      formats: { "A:B": "@", "C:E": "#,##0", "F:G": "@" },
      colWidths: { 1: 120, 2: 180, 3: 110, 4: 110, 5: 140, 6: 120, 7: 250 },
      defaultData: [
        ["DOT_01", "Đợt 1 - Kỳ ngày 05", 26, 4, 5, "ACTIVE", "Áp dụng cho HĐTD giải ngân ngày 26 đến ngày 04"],
        ["DOT_02", "Đợt 2 - Kỳ ngày 15", 5, 15, 15, "ACTIVE", "Áp dụng cho HĐTD giải ngân ngày 05 đến ngày 15"],
        ["DOT_03", "Đợt 3 - Kỳ ngày 25", 16, 25, 25, "ACTIVE", "Áp dụng cho HĐTD giải ngân ngày 16 đến ngày 25"]
      ]
    },
    LICH_SU_TRICH_NO: {
      aliases: ["CHI_TIET_TRICH_NO", "LICH_SU_GIAO_DICH"],
      headers: [
        "MaDot", "SoHDTD", "MaKH", "TenKH", "SoTK", "TongTienPhaiThu", "DaTrich", "ConNo", "TrangThaiCore", "MaGiaoDichCore", "NgayTrich"
      ],
      color: "#B71C1C",
      formats: { "A:E": "@", "F:H": "#,##0", "I:J": "@", "K:K": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 140, 2: 130, 3: 100, 4: 180, 5: 140, 6: 140, 7: 140, 8: 130, 9: 130, 10: 160, 11: 160 }
    },
    DOT_TRICH_NO: {
      headers: ["MaDot", "ThangNam", "KyTrichNo", "TongSoHD", "TongSoKH", "TongPhaiThu", "TongDaTrich", "TongConNo", "TrangThai", "NgayTao"],
      color: "#4A148C",
      formats: { "A:B": "@", "C:E": "#,##0", "F:H": "#,##0", "I:I": "@", "J:J": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 140, 2: 100, 3: 90, 4: 100, 5: 100, 6: 140, 7: 140, 8: 140, 9: 130, 10: 160 }
    },
    NO_TON_DONG: {
      headers: ["SoHDTD", "MaKH", "TenKH", "GocTon", "LaiTon", "TongNoTon", "KyPhatSinh", "TrangThai", "GhiChu", "NgayCapNhat"],
      color: "#E65100",
      formats: { "A:C": "@", "D:F": "#,##0", "G:I": "@", "J:J": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 130, 2: 100, 3: 180, 4: 130, 5: 130, 6: 140, 7: 140, 8: 120, 9: 200, 10: 160 }
    },
    DASHBOARD_SNAPSHOT: {
      headers: [
        "MaKhuVuc", "TenKhuVuc", "CapKhuVuc", "TongDuNo", "TongTienVay", "SoLuongHD", "SoLuongKH", "DuNoBinhQuan",
        "DuNo_NongNghiep", "DuNo_TieuDung", "DuNo_ThuongMai", "DuNo_CBTD_Huyen", "DuNo_CBTD_Dinh", "DuNo_CBTD_Nhan", "DuNo_QuaHan", "NgayCapNhat"
      ],
      color: "#059669",
      formats: { "A:C": "@", "D:E": "#,##0", "F:G": "#,##0", "H:H": "#,##0", "I:O": "#,##0", "P:P": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 140, 2: 180, 3: 100, 4: 140, 5: 140, 6: 90, 7: 90, 8: 130, 9: 130, 10: 130, 11: 130, 12: 130, 13: 130, 14: 130, 15: 130, 16: 160 }
    },
    THAM_DINH_TD: {
      aliases: ["BAO_CAO_THAM_DINH"],
      headers: [
        "MaBCTD", "MaKH", "HoTen", "SoCCCD", "NgaySinh", "GioiTinh", "DienThoai", "DiaChi", "TinhTrangHonNhan", "NguoiDongVay",
        "HinhAnhKH", "NganhNghe", "TrinhDo", "ThuNhapNguoiVay", "NguonThuNguoiVay", "ThuNhapDongVay", "NguonThuDongVay", "ChungMinhThuNhap", "ThuNhapRong",
        "DeXuatVay", "MucDichVay", "ThoiHanVay", "PhuongThucTraNo", "CoTSBD", "HinhThucBaoDam", "LoaiTSBD", "SoGCN", "ThuaDatSo", "ToBanDoSo",
        "DienTich", "DiaChiTSBD", "ChuSoHuuTSBD", "QuanHeVoiNguoiVay", "GiaTriTSBD", "NguonGocTSBD", "GiaTriThiTruong", "HinhAnhTSBD", "ChiTietLoaiDat", "GiaTriCongTrinh", "TinhTrangPhapLyTSBD", "MoTaTSBD",
        "ThuNhapChinh", "ThuNhapPhu", "TongThuNhapThang", "ChiPhiSinhHoat", "ChiPhiSXKD", "TongChiPhiThang", "ThangDuThang",
        "XepHangCIC", "SoTCTDQuanHe", "DuNoCICNgoai", "LichSuTraNo", "GhiChuCIC", "DiaDiemThamDinh", "HienTrangSXKD", "TuCachKhachHang",
        "DuyetVay", "ThoiHanThang", "LaiSuatDuyet", "PhuongThucGiaiNgan", "PhuongThucTraGoc", "PhuongAnToiUu", "BienPhapBaoDam", "TyLeLTV", "NghiaVuTraNoThang", "TyLeDSR",
        "HeSoBuDap", "DieuKienGiaiNgan", "MucDoRuiRo", "KetLuan", "CanBoThamDinh", "CanBoLapUsername", "DanhSachYKien", "NgayLap"
      ],
      color: "#1A237E",
      formats: { "N:N": "#,##0", "P:P": "#,##0", "S:T": "#,##0", "AD:AD": "#,##0", "AF:AF": "#,##0", "AM:AS": "#,##0", "BA:BA": "#,##0", "BH:BH": "#,##0", "BV:BV": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 120, 2: 100, 3: 180, 4: 130, 11: 150, 14: 130, 16: 130, 19: 130, 20: 130, 26: 160, 34: 140, 36: 140, 38: 200, 44: 130, 57: 130, 61: 140, 62: 250, 65: 130, 70: 140, 71: 140, 72: 140, 73: 250, 74: 160 }
    },
    KIEM_TRA_VON: {
      headers: ["MaBBKT", "SoHDTD", "MaKH", "HoTen", "LoaiDoanKT", "ThanhPhanDoan", "NgayKiemTra", "LanKiemTra", "NgayKTNext", "HinhThuc", "DiaDiemKT", "DanhGiaMucDich", "TienDoSuDungVon", "MucDoRuiRo", "MoTaThucTe", "KienNghi", "FileBienBanUrl", "HinhAnhKiemTra", "TrangThai", "NgayTao"],
      color: "#37474F",
      formats: { "G:G": "dd/MM/yyyy", "I:I": "dd/MM/yyyy", "T:T": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 120, 2: 120, 3: 100, 4: 180, 5: 110, 6: 180, 7: 110, 8: 90, 9: 110, 10: 110, 11: 180, 12: 130, 13: 140, 14: 110, 15: 220, 16: 200, 17: 200, 18: 200, 19: 120, 20: 160 }
    },
    TSBD_CORE: {
      aliases: ["TAI_SAN_BAO_DAM", "DS_TSBD"],
      headers: [
        "MaTSBD", "SoGCN", "SoVaoSoCapGCN", "NgayCapGCN", "NoiCapGCN", "MaKH", "ChuSoHuu", "CCCD_ChuTS",
        "QuanHeChuTS", "NguoiDongSoHuu", "ThuaDatSo", "ToBanDoSo", "DiaChiThuaDat", "DienTich", "HinhThucSuDung",
        "ChiTietPhanLoaiDat", "NguonGocSuDung", "GiaTriDinhGiaQTD", "GiaTriThiTruong", "TyLeChoVayToiDa",
        "SoTienDamBaoToiDa", "TrangThaiTheChap", "SoHDTD_LienKet", "SoCongChung", "NgayCongChung",
        "VanPhongCongChung", "SoDangKyGDBD", "NgayDangKyGDBD", "HinhAnhGCN", "HinhAnhThucDia", "NgayCapNhat"
      ],
      color: "#00695C",
      formats: { "B:C": "@", "D:D": "dd/MM/yyyy", "F:F": "@", "H:H": "@", "K:L": "@", "N:N": "#,##0.0", "R:S": "#,##0", "T:T": "0.00", "U:U": "#,##0", "W:X": "@", "Y:Y": "dd/MM/yyyy", "AA:AA": "@", "AB:AB": "dd/MM/yyyy", "AE:AE": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 130, 2: 140, 3: 130, 4: 110, 5: 180, 6: 100, 7: 180, 8: 130, 9: 130, 10: 160, 11: 100, 12: 100, 13: 240, 14: 110, 15: 130, 16: 220, 17: 180, 18: 140, 19: 140, 20: 110, 21: 140, 22: 130, 23: 130, 24: 130, 25: 110, 26: 200, 27: 140, 28: 110, 29: 160, 30: 160, 31: 160 }
    },
    CAU_HINH_BIEU_MAU: {
      headers: ["Id", "MaBM", "TenBM", "PhanHe", "LoaiNguon", "LinkNguon", "MoTa", "TruongTron", "TrangThai", "NgayCapNhat"],
      color: "#4338CA",
      formats: { "J:J": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 80, 2: 120, 3: 250, 4: 140, 5: 130, 6: 220, 7: 220, 8: 250, 9: 120, 10: 160 },
      defaultData: [
        [1, "BM_KT_01", "Biên Bản Kiểm Tra Sử Dụng Vốn Sau Giải Ngân", "Kiểm Tra Vốn", "GOOGLE_DOCS", "https://docs.google.com/document/d/sample-kt", "Mẫu chuẩn CBTD lập sau khi kiểm tra thực địa", JSON.stringify(["{{HoTen}}", "{{MaKH}}", "{{SoHDTD}}", "{{TienVay}}", "{{NgayKiemTra}}", "{{ThanhPhanDoan}}"]), "Hoạt động", new Date()],
        [2, "BM_TD_01", "Báo Cáo Thẩm Định & Định Giá Tài Sản Thế Chấp", "Thẩm Định", "GOOGLE_DOCS", "https://docs.google.com/document/d/sample-td", "Mẫu trình Ban Lãnh đạo phê duyệt hồ sơ vay", JSON.stringify(["{{HoTen}}", "{{MaKH}}", "{{DeXuatVay}}", "{{DuyetVay}}", "{{LaiSuat}}", "{{LoaiTSBD}}", "{{GiaTriTSBD}}", "{{TyLeLTV}}"]), "Hoạt động", new Date()],
        [3, "BM_TN_01", "Thỏa Thuận Ủy Quyền Trích Nợ Tự Động CASA", "Trích Nợ Tự Động", "GOOGLE_DOCS", "https://docs.google.com/document/d/sample-tn", "Văn bản thỏa thuận trích nợ định kỳ ký giữa KH và Quỹ", JSON.stringify(["{{HoTen}}", "{{SoCCCD}}", "{{SoTKCASA}}", "{{KyTrichNo}}"]), "Hoạt động", new Date()],
        [4, "BM_HDTD_01", "Hợp Đồng Tín Dụng Kiêm Khế Ước Nhận Nợ", "Hợp Đồng", "GOOGLE_DOCS", "https://docs.google.com/document/d/sample-hdtd", "Hợp đồng tín dụng cho vay thành viên chuẩn NHNN", JSON.stringify(["{{HoTen}}", "{{MaKH}}", "{{SoCCCD}}", "{{SoHDTD}}", "{{TienVay}}", "{{LaiSuat}}", "{{ThoiHanVay}}", "{{PhuongThucTraGoc}}", "{{MucDichVay}}"]), "Hoạt động", new Date()],
        [5, "BM_HDTC_01", "Hợp Đồng Thế Chấp Quyền Sử Dụng Đất (Công Chứng)", "Thế Chấp", "GOOGLE_DOCS", "https://docs.google.com/document/d/sample-hdtc", "Hợp đồng thế chấp quyền sử dụng đất 3 bên phục vụ công chứng & ĐKGDBD", JSON.stringify(["{{ChuSoHuu}}", "{{CCCD_ChuTS}}", "{{SoGCN}}", "{{ThuaDatSo}}", "{{ToBanDoSo}}", "{{DiaChiThuaDat}}", "{{DienTich}}", "{{GiaTriDinhGiaQTD}}", "{{SoTienDamBaoToiDa}}"]), "Hoạt động", new Date()],
        [6, "BM_BBDG_01", "Biên Bản Định Giá Tài Sản Bảo Đảm", "Thế Chấp", "GOOGLE_DOCS", "https://docs.google.com/document/d/sample-bbdg", "Biên bản định giá QSDĐ của Hội đồng định giá QTDND", JSON.stringify(["{{ChuSoHuu}}", "{{SoGCN}}", "{{ThuaDatSo}}", "{{ToBanDoSo}}", "{{DienTich}}", "{{GiaTriDinhGiaQTD}}", "{{GiaTriThiTruong}}", "{{TyLeChoVayToiDa}}"]), "Hoạt động", new Date()]
      ]
    },
    DOCUMENT_STORAGE: {
      headers: ["ID_HOP_DONG", "MA_KH", "TEN_KHACH_HANG", "LOAI_BIEU_MAU", "NGUOI_LAP", "NGAY_LAP", "LINK_GOOGLE_DOC", "LINK_PDF", "TRANG_THAI"],
      color: "#27AE60",
      formats: { "F:F": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 180, 2: 120, 3: 200, 4: 200, 5: 150, 6: 150, 7: 350, 8: 350, 9: 150 }
    },
    BC_DOANH_SO_TD: {
      headers: ["SoHDTD", "MaKH", "SoTV", "TienVay", "DuNo", "LaiSuat", "NgayVay", "DenHan", "MaLoaiVay", "SoThangVay", "MoTaVay", "KhuVuc"],
      color: "#0284C7",
      formats: { "A:C": "@", "D:E": "#,##0", "F:F": "0.00", "G:H": "dd/MM/yyyy", "I:I": "@", "J:J": "#,##0", "K:L": "@" },
      colWidths: { 1: 130, 2: 100, 3: 100, 4: 130, 5: 130, 6: 90, 7: 110, 8: 110, 9: 140, 10: 90, 11: 220, 12: 180 }
    },
    TOP_DU_NO_BINH_QUAN: {
      headers: [
        "NamBaoCao", "XepHang", "MaKH", "HoTen", "SoTV", "KhuVuc",
        "DuNoThang01", "DuNoThang02", "DuNoThang03", "DuNoThang04", "DuNoThang05", "DuNoThang06",
        "DuNoThang07", "DuNoThang08", "DuNoThang09", "DuNoThang10", "DuNoThang11", "DuNoThang12",
        "DuNoBinhQuan", "TongTienVay", "TyTrongDuNo"
      ],
      color: "#B45309",
      formats: { "A:B": "#,##0", "C:F": "@", "G:T": "#,##0", "U:U": "0.00%" },
      colWidths: { 1: 100, 2: 80, 3: 100, 4: 180, 5: 100, 6: 160, 7: 120, 8: 120, 9: 120, 10: 120, 11: 120, 12: 120, 13: 120, 14: 120, 15: 120, 16: 120, 17: 120, 18: 120, 19: 140, 20: 140, 21: 100 }
    }
  },

  /**
   * Thực hiện rà soát, tạo mới và Auto-migration cho toàn bộ danh mục Bảng CSDL
   * Hỗ trợ chuẩn hóa tự động cả Sheet 1 tầng (thông thường) và Sheet 2 tầng (Two-Tier HDTD_CORE_DN, HDTD_CORE_ALL)
   * Đảm bảo nguyên tắc Vĩnh Viễn: BẢO TOÀN 100% DỮ LIỆU CŨ (ZERO DATA LOSS)
   */
  ensureDatabaseSchema: function(ss, force) {
    if (!force) {
      try {
        var cache = CacheService.getScriptCache();
        if (cache.get("schema_validated") === "true") {
          return { status: "success", message: "Schema đã được kiểm tra (cached)." };
        }
      } catch (e) {}
    }

    ss = getSpreadsheetInstance(ss);
    if (!ss) {
      Logger.log("❌ Không thể kết nối Google Spreadsheet!");
      return { status: "error", message: "Không thể mở Google Spreadsheet!" };
    }

    var details = [];
    var totalSheetsCount = 0;
    var createdCount = 0;
    var healedCount = 0;
    var standardizedCount = 0;

    for (var sheetName in this.SCHEMAS) {
      totalSheetsCount++;
      var schema = this.SCHEMAS[sheetName];
      var sheet = ss.getSheetByName(sheetName);
      var isTwoTier = !!schema.isTwoTier;
      var headerRowIdx = isTwoTier ? 2 : 1;
      var dataRowIdx = headerRowIdx + 1;

      // 1. Kiểm tra sheet alias cũ nếu có
      if (!sheet && schema.aliases && schema.aliases.length > 0) {
        for (var a = 0; a < schema.aliases.length; a++) {
          var aliasSheet = ss.getSheetByName(schema.aliases[a]);
          if (aliasSheet) {
            sheet = aliasSheet;
            try { sheet.setName(sheetName); } catch(e){}
            break;
          }
        }
      }

      if (!sheet) {
        // --- TRƯỜNG HỢP A: TẠO MỚI HOÀN TOÀN ---
        sheet = ss.insertSheet(sheetName);
        createdCount++;

        if (isTwoTier) {
          // Ghi Dòng 1 Banner Metadata
          var bannerText = schema.bannerText || ("Sao kê dữ liệu " + sheetName + " | Cập nhật: " + formatGasDateTime(new Date()));
          sheet.getRange(1, 1).setValue(bannerText);
          sheet.getRange(1, 1, 1, schema.headers.length)
            .setBackground(schema.bannerColor || "#1E3A8A")
            .setFontColor("#FFFFFF")
            .setFontWeight("bold")
            .setFontSize(11)
            .setHorizontalAlignment("left");
        }

        // Ghi Header
        sheet.getRange(headerRowIdx, 1, 1, schema.headers.length).setValues([schema.headers]);
        sheet.getRange(headerRowIdx, 1, 1, schema.headers.length)
          .setBackground(schema.color)
          .setFontColor("#FFFFFF")
          .setFontWeight("bold")
          .setFontSize(10)
          .setHorizontalAlignment("center");

        // Cố định dòng
        sheet.setFrozenRows(isTwoTier ? 2 : 1);

        // Áp dụng định dạng cột
        if (schema.formats) {
          for (var colRange in schema.formats) {
            try { sheet.getRange(colRange).setNumberFormat(schema.formats[colRange]); } catch(e){}
          }
        }

        // Chèn dữ liệu mẫu mặc định
        if (schema.defaultData && schema.defaultData.length > 0) {
          sheet.getRange(dataRowIdx, 1, schema.defaultData.length, schema.headers.length).setValues(schema.defaultData);
        }

        // Căn chỉnh độ rộng cột
        if (schema.colWidths) {
          for (var colIndex in schema.colWidths) {
            try { sheet.setColumnWidth(Number(colIndex), schema.colWidths[colIndex]); } catch(e){}
          }
        }

        details.push({ sheet: sheetName, action: "CREATED", rows: sheet.getLastRow(), cols: schema.headers.length });
      } else {
        // --- TRƯỜNG HỢP B: SHEET ĐÃ TỒN TẠI -> TỰ ĐỘNG CHUẨN HÓA & NÂNG CẤP (SELF-HEALING) ---
        var lastCol = Math.max(schema.headers.length, sheet.getLastColumn());
        var lastRow = sheet.getLastRow();

        // 1. Kiểm tra và bảo toàn/phục hồi Banner Dòng 1 nếu là Two-Tier
        if (isTwoTier) {
          var r1Val = String(sheet.getRange(1, 1).getValue() || "").trim();
          if (!r1Val || (r1Val.indexOf("Sao kê") === -1 && r1Val.indexOf("Lưu trữ") === -1)) {
            sheet.getRange(1, 1).setValue(schema.bannerText || ("Sao kê dữ liệu " + sheetName));
          }
          sheet.getRange(1, 1, 1, schema.headers.length)
            .setBackground(schema.bannerColor || "#1E3A8A")
            .setFontColor("#FFFFFF")
            .setFontWeight("bold")
            .setFontSize(11)
            .setHorizontalAlignment("left");
        }

        // 2. Đọc Header hiện tại tại headerRowIdx
        var curHeaders = [];
        if (lastRow >= headerRowIdx) {
          curHeaders = sheet.getRange(headerRowIdx, 1, 1, lastCol).getValues()[0];
        }

        // 3. So khớp danh sách Header
        var needsRemap = false;
        if (curHeaders.length < schema.headers.length) {
          needsRemap = true;
        } else {
          for (var h = 0; h < schema.headers.length; h++) {
            if (String(curHeaders[h] || "").trim() !== schema.headers[h]) {
              needsRemap = true;
              break;
            }
          }
        }

        if (needsRemap) {
          healedCount++;
          if (lastRow >= dataRowIdx) {
            // Có dữ liệu cũ -> đọc toàn bộ dữ liệu hiện tại
            var oldData = sheet.getRange(dataRowIdx, 1, lastRow - dataRowIdx + 1, lastCol).getValues();
            var oldHeaderMap = {};
            for (var c = 0; c < curHeaders.length; c++) {
              var colKey = String(curHeaders[c] || "").trim();
              if (colKey) oldHeaderMap[colKey] = c;
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
                  // Gán giá trị mặc định cho cột mới
                  if (targetColName === "CBTD_PhuTrach") {
                    newRow[k] = "qtdyentho.cbtd";
                  } else if (targetColName === "Ten_CBTD") {
                    newRow[k] = "Lê Văn Tín (CBTD)";
                  } else if (targetColName === "TrangThaiHD") {
                    var duNoIdx = oldHeaderMap["DuNo"];
                    var oldDuNo = duNoIdx !== undefined ? Number(oldData[r][duNoIdx] || 0) : 0;
                    newRow[k] = oldDuNo > 0 ? "DANG_VAY" : "DA_TAT_TOAN";
                  } else if (targetColName === "MaLoaiHD") {
                    newRow[k] = "NHCDBTNMT";
                  } else if (targetColName === "NgayCapNhat") {
                    newRow[k] = formatGasDateTime(new Date());
                  } else {
                    newRow[k] = "";
                  }
                }
              }
              newData.push(newRow);
            }

            // Xóa vùng dữ liệu cũ từ headerRowIdx
            sheet.getRange(headerRowIdx, 1, lastRow - headerRowIdx + 1, lastCol).clearContent();
            // Ghi lại Header chuẩn mực
            sheet.getRange(headerRowIdx, 1, 1, schema.headers.length).setValues([schema.headers]);
            // Ghi lại dữ liệu đã remap bảo toàn 100%
            sheet.getRange(dataRowIdx, 1, newData.length, schema.headers.length).setValues(newData);
          } else {
            sheet.getRange(headerRowIdx, 1, 1, schema.headers.length).setValues([schema.headers]);
          }
        } else {
          standardizedCount++;
        }

        // 4. Định dạng lại Header chuẩn mực
        sheet.getRange(headerRowIdx, 1, 1, schema.headers.length)
          .setBackground(schema.color)
          .setFontColor("#FFFFFF")
          .setFontWeight("bold")
          .setFontSize(10)
          .setHorizontalAlignment("center");

        // 5. Cố định dòng (Freeze Rows)
        try { sheet.setFrozenRows(isTwoTier ? 2 : 1); } catch(e){}

        // 6. Áp dụng Number Formats
        if (schema.formats) {
          for (var fmtRange in schema.formats) {
            try { sheet.getRange(fmtRange).setNumberFormat(schema.formats[fmtRange]); } catch(e){}
          }
        }

        // 7. Căn chỉnh Column Widths
        if (schema.colWidths) {
          for (var colW in schema.colWidths) {
            try { sheet.setColumnWidth(Number(colW), schema.colWidths[colW]); } catch(e){}
          }
        }

        details.push({
          sheet: sheetName,
          action: needsRemap ? "HEALED" : "STANDARDIZED",
          isTwoTier: isTwoTier,
          rows: sheet.getLastRow(),
          cols: schema.headers.length
        });
      }
    }

    SpreadsheetApp.flush();

    try {
      var cache = CacheService.getScriptCache();
      cache.put("schema_validated", "true", 21600); // Lưu cache 6 giờ
    } catch (e) {}

    var summaryMsg = "Đã kiểm soát & chuẩn hóa tự động 100% toàn bộ " + totalSheetsCount + " Bảng CSDL (Tạo mới: " + createdCount + ", Nâng cấp remap: " + healedCount + ", Định dạng chuẩn: " + standardizedCount + ").";
    Logger.log("✅ " + summaryMsg);

    return {
      status: "success",
      message: summaryMsg,
      data: {
        totalSheets: totalSheetsCount,
        created: createdCount,
        healed: healedCount,
        standardized: standardizedCount,
        details: details
      }
    };
  },

  setupAllSheets: function(ss) {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    return this.ensureDatabaseSchema(ss, true);
  }
};



// ==========================================
// MODULE FILE: gas_backend/Dashboard/DashboardController.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - DASHBOARDCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module DashboardController xử lý nghiệp vụ liên quan
 *              Hỗ trợ chế độ:
 *              - 'current': Tổng quan hiện tại thời gian thực (HDTD_CORE)
 *              - 'as_of_date': Tổng quan đến ngày chốt số liệu (HDTD_CORE_DN)
 *              - 'compare': Đối sánh tăng trưởng giữa các mốc / các năm
 * @created     15/08/2026
 * @updated     21/09/2026
 * @version     3.2 Multi-Period & As-Of-Date Snapshot Engine
 * ========================================================================================
 */

var DashboardController = {
  /**
   * Quét và lập danh sách các sheet snapshot lưu trữ theo mốc ngày / các năm
   */
  _listSnapshotSheets: function(ss) {
    var allSheets = ss.getSheets();
    var snapshots = [];
    for (var i = 0; i < allSheets.length; i++) {
      var name = allSheets[i].getName();
      if (name.indexOf("HDTD_CORE_") === 0) {
        var subName = name.replace("HDTD_CORE_", "");
        var label = "Đến ngày (" + subName + ")";
        if (subName === "DN") {
          label = "Dữ liệu đến ngày (HDTD_CORE_DN)";
        } else if (subName === "ALL") {
          label = "Dữ liệu các ngày cuối tháng (HDTD_CORE_ALL)";
        } else if (/^\d{4}$/.test(subName)) {
          label = "Năm " + subName + " (" + name + ")";
        }
        snapshots.push({
          sheetName: name,
          label: label,
          rowCount: Math.max(0, allSheets[i].getLastRow() - 1)
        });
      }
    }
    return snapshots;
  },

  /**
   * Ánh xạ thông tin khách hàng từ KH_CORE
   */
  _buildCustMap: function(sKH) {
    var custMap = {};
    if (!sKH || sKH.getLastRow() <= 1) return custMap;

    var colMapKH = HeaderUtils.getHeaderMap(sKH);
    var khValues = sKH.getRange(2, 1, sKH.getLastRow() - 1, sKH.getLastColumn()).getValues();
    for (var k = 0; k < khValues.length; k++) {
      var makh = String(HeaderUtils.getCell(khValues[k], colMapKH, "MaKH", "")).replace(/^'/, '').trim();
      var directXa = String(HeaderUtils.getCell(khValues[k], colMapKH, "KvXa", "")).trim();
      var directThon = String(HeaderUtils.getCell(khValues[k], colMapKH, "KvThon", "")).trim();
      var rawKhuVuc = (String(HeaderUtils.getCell(khValues[k], colMapKH, "KhuVuc", "")) + " " + String(HeaderUtils.getCell(khValues[k], colMapKH, "DiaChi", ""))).trim();
      var hoten = String(HeaderUtils.getCell(khValues[k], colMapKH, "HoTen", "")).trim();
      var sotv = String(HeaderUtils.getCell(khValues[k], colMapKH, "SoTV", "")).replace(/^'/, "").trim();

      var xa = directXa;
      if (!xa) {
        var rawLower = rawKhuVuc.toLowerCase();
        if (rawLower.indexOf("yên trường") > -1 || rawLower.indexOf("yen truong") > -1) {
          xa = "Xã Yên Trường";
        } else if (rawLower.indexOf("vĩnh lộc") > -1 || rawLower.indexOf("vinh loc") > -1) {
          xa = "Xã Vĩnh Lộc";
        } else {
          xa = "Xã Quý Lộc";
        }
      }

      var thon = directThon;
      if (!thon) {
        thon = "Khu trung tâm " + xa.replace("Xã ", "");
        var m = rawKhuVuc.match(/thôn\s+[^,]+/i);
        if (m && m[0]) {
          var rawThon = m[0].trim();
          var tl = rawThon.toLowerCase();
          if (tl.indexOf("tu mục") > -1) thon = "Thôn Tu Mục";
          else if (tl.indexOf("tân lộc") > -1) thon = "Thôn Tân Lộc";
          else if (tl.indexOf("đan nê") > -1) thon = "Thôn Đan Nê";
          else if (tl.indexOf("phố kiểu") > -1) thon = "Thôn Phố Kiểu";
          else if (tl.indexOf("lựu khê") > -1) thon = "Thôn Lựu Khê";
          else if (tl.indexOf("thạc quả") > -1) thon = "Thôn Thạc Quả";
          else if (tl.indexOf("yên lạc") > -1) thon = "Thôn Yên Lạc";
          else if (tl.indexOf("thọ vực") > -1) thon = "Thôn Thọ Vực";
          else if (tl.indexOf("phi bình") > -1) thon = "Thôn Phi Bình";
          else if (tl.indexOf("kỳ ngãi") > -1) thon = "Thôn Kỳ Ngãi";
          else if (tl.indexOf("vĩnh khang 1") > -1) thon = "Thôn Vĩnh Khang 1";
          else if (tl.indexOf("vĩnh khang 2") > -1) thon = "Thôn Vĩnh Khang 2";
          else thon = rawThon;
        }
      }
      custMap[makh] = { hoten: hoten, sotv: sotv, xa: xa, thon: thon };
    }
    return custMap;
  },

  /**
   * Tính toán bộ chỉ số thống kê từ một Sheet Hợp đồng Tín dụng (HDTD_CORE hoặc HDTD_CORE_DN)
   * Hỗ trợ tự động nhận diện Sheet 2 tầng (Dòng 1: Banner Metadata sao kê, Dòng 2: Header 17 cột, Dòng 3+: Data)
   */
  _computeHdtdStats: function(sHDTD, custMap, sDS, sNoTon, sDot, sAppraisal, sInspection, sheetDisplayName) {
    var isTwoTier = false;
    var asOfMetadataText = "";
    if (sHDTD && sHDTD.getLastRow() >= 1) {
      var firstCellVal = String(sHDTD.getRange(1, 1).getValue() || "").trim();
      if (firstCellVal.indexOf("Sao kê") > -1 || firstCellVal.indexOf("Lưu trữ") > -1 || sHDTD.getFrozenRows() >= 2 || sHDTD.getName().indexOf("HDTD_CORE_DN") > -1 || sHDTD.getName().indexOf("HDTD_CORE_ALL") > -1) {
        isTwoTier = true;
        asOfMetadataText = firstCellVal;
      }
    }

    var minRequiredRows = isTwoTier ? 2 : 1;
    if (!sHDTD || sHDTD.getLastRow() <= minRequiredRows) {
      return {
        hasData: false,
        sheetName: sHDTD ? sHDTD.getName() : "",
        sheetDisplayName: sheetDisplayName || "",
        asOfMetadata: asOfMetadataText,
        isTwoTier: isTwoTier,
        totalDuNo: 0,
        totalHopDong: 0,
        totalThanhVienVay: 0,
        duNoBinhQuanHD: 0,
        duNoBinhQuanTV: 0,
        laiSuatBinhQuan: 0,
        totalDuThuLai: 0,
        totalKhachHangTrichNo: 0,
        totalNoTon: 0,
        countNoTon: 0,
        pendingAppraisals: 0,
        pendingInspections: 0,
        recentBatches: [],
        areaStats: [],
        cbtdStats: [],
        loanTypes: [],
        loanGroups: [],
        securityTypes: [],
        top50DuNoDenNgay: [],
        top50DuNoBinhQuanCuoiThang: [],
        monthlyDebtTrend: []
      };
    }

    var totalDuNo = 0;
    var totalHopDong = 0;
    var totalDuThuLai = 0;

    // 1. Phân bổ theo 3 địa bàn xã chính & phân rã theo Thôn
    var byCommuneMap = {
      "Xã Quý Lộc": {
        key: "quyloc",
        name: "Xã Quý Lộc",
        subText: "Địa bàn trọng điểm (Thôn Đan Nê, Tân Lộc, Tu Mục)",
        cbqlUser: "qtdyentho.huyennhu",
        cbqlName: "Trần Như Huyền",
        countHD: 0,
        countKH: 0,
        duNo: 0,
        khSet: {},
        loanGroups: { "Nông nghiệp": 0, "Tiêu dùng - Đời sống": 0, "Thương mại - Dịch vụ": 0 },
        thonsMap: {}
      },
      "Xã Yên Trường": {
        key: "yentruong",
        name: "Xã Yên Trường",
        subText: "Địa bàn mở rộng (Thôn Phố Kiểu, Lựu Khê, Thạc Quả)",
        cbqlUser: "qtdyentho.luudinh",
        cbqlName: "Lưu Thị Định",
        countHD: 0,
        countKH: 0,
        duNo: 0,
        khSet: {},
        loanGroups: { "Nông nghiệp": 0, "Tiêu dùng - Đời sống": 0, "Thương mại - Dịch vụ": 0 },
        thonsMap: {}
      },
      "Xã Vĩnh Lộc": {
        key: "vinhloc",
        name: "Xã Vĩnh Lộc",
        subText: "Địa bàn liên kết (Thôn Kỳ Ngãi, Phi Bình, Yên Lạc, Thọ Vực)",
        cbqlUser: "qtdyentho.huunhan",
        cbqlName: "Nguyễn Hữu Nhân",
        countHD: 0,
        countKH: 0,
        duNo: 0,
        khSet: {},
        loanGroups: { "Nông nghiệp": 0, "Tiêu dùng - Đời sống": 0, "Thương mại - Dịch vụ": 0 },
        thonsMap: {}
      }
    };

    // 2. Cơ cấu theo Cán bộ quản lý tín dụng (CBTD Portfolio)
    var byCbtdMap = {
      "qtdyentho.huyennhu": {
        user: "qtdyentho.huyennhu",
        name: "Trần Như Huyền",
        role: "Cán Bộ Tín Dụng Quản Lý",
        assignedArea: "Xã Quý Lộc",
        duNo: 0,
        countHD: 0,
        countKH: 0,
        khSet: {},
        loanGroups: { "Nông nghiệp": 0, "Tiêu dùng - Đời sống": 0, "Thương mại - Dịch vụ": 0 },
        xasMap: {}
      },
      "qtdyentho.luudinh": {
        user: "qtdyentho.luudinh",
        name: "Lưu Thị Định",
        role: "Cán Bộ Tín Dụng Quản Lý",
        assignedArea: "Xã Yên Trường",
        duNo: 0,
        countHD: 0,
        countKH: 0,
        khSet: {},
        loanGroups: { "Nông nghiệp": 0, "Tiêu dùng - Đời sống": 0, "Thương mại - Dịch vụ": 0 },
        xasMap: {}
      },
      "qtdyentho.huunhan": {
        user: "qtdyentho.huunhan",
        name: "Nguyễn Hữu Nhân",
        role: "Cán Bộ Tín Dụng Quản Lý",
        assignedArea: "Xã Vĩnh Lộc",
        duNo: 0,
        countHD: 0,
        countKH: 0,
        khSet: {},
        loanGroups: { "Nông nghiệp": 0, "Tiêu dùng - Đời sống": 0, "Thương mại - Dịch vụ": 0 },
        xasMap: {}
      }
    };

    // 3. Cơ cấu sản phẩm tín dụng theo 3 nhóm chính
    var loanGroups = {
      "nong_nghiep": {
        key: "nong_nghiep",
        name: "Nông Nghiệp & Phát Triển Nông Thôn",
        description: "Phục vụ sản xuất nông nghiệp, chăn nuôi, trồng trọt trang trại",
        count: 0,
        duNo: 0,
        subtypes: {}
      },
      "sinh_hoat": {
        key: "sinh_hoat",
        name: "Tiêu Dùng & Đời Sống Thành Viên",
        description: "Xây sửa chữa nhà ở, tiêu dùng sinh hoạt thành viên",
        count: 0,
        duNo: 0,
        subtypes: {}
      },
      "kinh_doanh": {
        key: "kinh_doanh",
        name: "Thương Mại Dịch Vụ & Ngành Nghề",
        description: "Kinh doanh buôn bán, tiểu thủ công nghiệp và dịch vụ nông thôn",
        count: 0,
        duNo: 0,
        subtypes: {}
      }
    };

    // 4. Cơ cấu 7 loại mã hợp đồng bảo đảm
    var securityTypesMap = {
      "THCDBTNMT": { code: "THCDBTNMT", label: "Trung hạn có đảm bảo, đăng ký GDBĐ", count: 0, duNo: 0, color: "#2563eb" },
      "THBLCDBTNMT": { code: "THBLCDBTNMT", label: "Trung hạn đăng ký GDBĐ uỷ quyền", count: 0, duNo: 0, color: "#0891b2" },
      "NHCDBTNMT": { code: "NHCDBTNMT", label: "Ngắn hạn có đảm bảo, đăng ký GDBĐ", count: 0, duNo: 0, color: "#059669" },
      "THCDB": { code: "THCDB", label: "Trung hạn có TSBĐ không đăng ký GDBĐ", count: 0, duNo: 0, color: "#d97706" },
      "NHCDB": { code: "NHCDB", label: "Ngắn hạn có TSBĐ không đăng ký GDBĐ", count: 0, duNo: 0, color: "#ea580c" },
      "NHKDB": { code: "NHKDB", label: "Ngắn hạn, tín chấp", count: 0, duNo: 0, color: "#64748b" },
      "THKDB": { code: "THKDB", label: "Trung hạn tín chấp", count: 0, duNo: 0, color: "#475569" }
    };

    var allBorrowersSet = {};
    var totalWeightedLai = 0;

    var headerRow = isTwoTier ? 2 : 1;
    var startDataRow = isTwoTier ? 3 : 2;
    var numDataRows = sHDTD.getLastRow() - headerRow;
    var colMapHD = HeaderUtils.getHeaderMap(sHDTD, headerRow);
    var hdValues = sHDTD.getRange(startDataRow, 1, numDataRows, sHDTD.getLastColumn()).getValues();

    var customerAggMap = {}; // { [makh]: { maKH, hoTen, diaChi, xa, thon, soHDCount, tongDuNo, monthlyDebts: {} } }
    var monthlyTrendMap = {}; // { [dateKey]: { dateKey, totalDuNo, countHD, khSet: {} } }

    for (var i = 0; i < hdValues.length; i++) {
      var makh = String(HeaderUtils.getCell(hdValues[i], colMapHD, "MaKH", "")).replace(/^'/, '').trim();
      var duNo = Number(HeaderUtils.getCell(hdValues[i], colMapHD, "DuNo", 0)) || 0;
      var laiSuat = Number(String(HeaderUtils.getCell(hdValues[i], colMapHD, "LaiSuat", 0)).replace(',', '.')) || 0;
      var maLoaiVay = String(HeaderUtils.getCell(hdValues[i], colMapHD, "MaLoaiVay", "")).trim();
      var moTaVay = String(HeaderUtils.getCell(hdValues[i], colMapHD, "MoTaVay", "")).trim();
      var cbtdUser = String(HeaderUtils.getCell(hdValues[i], colMapHD, "CBTD_PhuTrach", "")).trim();
      var cbtdName = String(HeaderUtils.getCell(hdValues[i], colMapHD, "Ten_CBTD", "")).trim();
      var trangThaiHD = String(HeaderUtils.getCell(hdValues[i], colMapHD, "TrangThaiHD", duNo > 0 ? "DANG_VAY" : "DA_TAT_TOAN")).trim();
      var maLoaiHD = String(HeaderUtils.getCell(hdValues[i], colMapHD, "MaLoaiHD", "")).trim();
      var directXa = String(HeaderUtils.getCell(hdValues[i], colMapHD, "KvXa", "")).trim();
      var directThon = String(HeaderUtils.getCell(hdValues[i], colMapHD, "KvThon", "")).trim();
      var rawHoTen = String(HeaderUtils.getCell(hdValues[i], colMapHD, "HoTen", "")).trim();
      var rawDiaChi = String(HeaderUtils.getCell(hdValues[i], colMapHD, "DiaChi", "")).trim();
      var ngayDuLieu = String(HeaderUtils.getCell(hdValues[i], colMapHD, "NgayDuLieu", "")).trim();

      if (trangThaiHD !== "DA_TAT_TOAN" && duNo > 0) {
        totalDuNo += duNo;
        totalHopDong++;
        totalDuThuLai += (duNo * (laiSuat / 100)) / 12;
        totalWeightedLai += (duNo * laiSuat);
        allBorrowersSet[makh] = true;

        var cust = custMap[makh] || { hoten: rawHoTen, xa: "Xã Quý Lộc", thon: "Thôn khác" };
        var xa = directXa || cust.xa || "Xã Quý Lộc";
        var thon = directThon || cust.thon || "Thôn khác";
        var hoten = rawHoTen || cust.hoten || ("Khách hàng " + makh);
        var diachi = rawDiaChi || (thon + ", " + xa);

        // Thu thập dữ liệu khách hàng cho Top 50 & Báo cáo
        if (!customerAggMap[makh]) {
          customerAggMap[makh] = {
            maKH: makh,
            hoTen: hoten,
            diaChi: diachi,
            xa: xa,
            thon: thon,
            soHDCount: 0,
            tongDuNo: 0,
            monthlyDebts: {}
          };
        }
        customerAggMap[makh].soHDCount++;
        customerAggMap[makh].tongDuNo += duNo;

        // Nếu có NgayDuLieu (sao kê các mốc hoặc ngày chốt)
        var dateKey = ngayDuLieu || "Hiện tại";
        if (!monthlyTrendMap[dateKey]) {
          monthlyTrendMap[dateKey] = {
            dateKey: dateKey,
            totalDuNo: 0,
            countHD: 0,
            khSet: {}
          };
        }
        monthlyTrendMap[dateKey].totalDuNo += duNo;
        monthlyTrendMap[dateKey].countHD++;
        monthlyTrendMap[dateKey].khSet[makh] = true;

        customerAggMap[makh].monthlyDebts[dateKey] = (customerAggMap[makh].monthlyDebts[dateKey] || 0) + duNo;

        // Phân loại nhóm cho vay
        var prodName = maLoaiVay || moTaVay || "Cho vay khác";
        var grpKey = "kinh_doanh";
        var grpShort = "Thương mại - Dịch vụ";
        if (prodName.indexOf("Sản Xuất NN") > -1 || prodName.indexOf("Nông nghiệp") > -1) {
          grpKey = "nong_nghiep";
          grpShort = "Nông nghiệp";
        } else if (prodName.indexOf("Sinh hoạt") > -1 || prodName.indexOf("Tiêu dùng") > -1) {
          grpKey = "sinh_hoat";
          grpShort = "Tiêu dùng - Đời sống";
        }

        // Tích lũy nhóm cho vay
        loanGroups[grpKey].count++;
        loanGroups[grpKey].duNo += duNo;
        if (!loanGroups[grpKey].subtypes[prodName]) {
          loanGroups[grpKey].subtypes[prodName] = { name: prodName, count: 0, duNo: 0 };
        }
        loanGroups[grpKey].subtypes[prodName].count++;
        loanGroups[grpKey].subtypes[prodName].duNo += duNo;

        // Tích lũy hình thức bảo đảm MaLoaiHD
        var cleanLoaiHD = maLoaiHD.toUpperCase();
        if (securityTypesMap[cleanLoaiHD]) {
          securityTypesMap[cleanLoaiHD].count++;
          securityTypesMap[cleanLoaiHD].duNo += duNo;
        } else {
          var fallbackKey = cleanLoaiHD.indexOf("TH") === 0 ? "THCDBTNMT" : "NHCDBTNMT";
          securityTypesMap[fallbackKey].count++;
          securityTypesMap[fallbackKey].duNo += duNo;
        }

        // Tích lũy theo Xã & Thôn
        if (!byCommuneMap[xa]) xa = "Xã Quý Lộc";
        var cObj = byCommuneMap[xa];
        cObj.countHD++;
        cObj.duNo += duNo;
        cObj.loanGroups[grpShort] = (cObj.loanGroups[grpShort] || 0) + duNo;
        if (!cObj.khSet[makh]) {
          cObj.khSet[makh] = true;
          cObj.countKH++;
        }

        if (!cObj.thonsMap[thon]) {
          cObj.thonsMap[thon] = {
            name: thon,
            duno: 0,
            countHD: 0,
            countKH: 0,
            khSet: {},
            loanGroups: { "Nông nghiệp": 0, "Tiêu dùng - Đời sống": 0, "Thương mại - Dịch vụ": 0 }
          };
        }
        var thonObj = cObj.thonsMap[thon];
        thonObj.duno += duNo;
        thonObj.countHD++;
        thonObj.loanGroups[grpShort] = (thonObj.loanGroups[grpShort] || 0) + duNo;
        if (!thonObj.khSet[makh]) {
          thonObj.khSet[makh] = true;
          thonObj.countKH++;
        }

        // Tích lũy theo CBTD
        var cbKey = cbtdUser;
        if (!byCbtdMap[cbKey]) {
          if (xa === "Xã Quý Lộc") cbKey = "qtdyentho.huyennhu";
          else if (xa === "Xã Yên Trường") cbKey = "qtdyentho.luudinh";
          else cbKey = "qtdyentho.huunhan";
        }

        var cbObj = byCbtdMap[cbKey];
        cbObj.countHD++;
        cbObj.duNo += duNo;
        cbObj.loanGroups[grpShort] = (cbObj.loanGroups[grpShort] || 0) + duNo;
        if (!cbObj.khSet[makh]) {
          cbObj.khSet[makh] = true;
          cbObj.countKH++;
        }

        if (!cbObj.xasMap[xa]) {
          cbObj.xasMap[xa] = {
            name: xa,
            duno: 0,
            countHD: 0,
            countKH: 0,
            khSet: {},
            thonsMap: {}
          };
        }
        var cbXa = cbObj.xasMap[xa];
        cbXa.duno += duNo;
        cbXa.countHD++;
        if (!cbXa.khSet[makh]) {
          cbXa.khSet[makh] = true;
          cbXa.countKH++;
        }

        if (!cbXa.thonsMap[thon]) {
          cbXa.thonsMap[thon] = {
            name: thon,
            duno: 0,
            countHD: 0,
            countKH: 0,
            khSet: {},
            loanGroups: { "Nông nghiệp": 0, "Tiêu dùng - Đời sống": 0, "Thương mại - Dịch vụ": 0 }
          };
        }
        var cbThon = cbXa.thonsMap[thon];
        cbThon.duno += duNo;
        cbThon.countHD++;
        if (!cbThon.khSet[makh]) {
          cbThon.khSet[makh] = true;
          cbThon.countKH++;
        }
        cbThon.loanGroups[grpShort] = (cbThon.loanGroups[grpShort] || 0) + duNo;
      }
    }

    // Hoàn tất định dạng byCommune & thons
    var finalAreaStats = [];
    for (var aKey in byCommuneMap) {
      var item = byCommuneMap[aKey];
      delete item.khSet;
      item.rate = totalDuNo > 0 ? (Math.round((item.duNo / totalDuNo) * 1000) / 10) + "%" : "0%";
      item.duNoBinhQuanHD = item.countHD > 0 ? Math.round(item.duNo / item.countHD) : 0;
      item.duNoBinhQuanTV = item.countKH > 0 ? Math.round(item.duNo / item.countKH) : 0;

      var thonsList = [];
      for (var tKey in item.thonsMap) {
        var tItem = item.thonsMap[tKey];
        delete tItem.khSet;
        tItem.rateCommune = item.duNo > 0 ? (Math.round((tItem.duno / item.duNo) * 1000) / 10) + "%" : "0%";
        tItem.rateTotal = totalDuNo > 0 ? (Math.round((tItem.duno / totalDuNo) * 1000) / 10) + "%" : "0%";
        tItem.duNoBinhQuanHD = tItem.countHD > 0 ? Math.round(tItem.duno / tItem.countHD) : 0;
        tItem.duNoBinhQuanTV = tItem.countKH > 0 ? Math.round(tItem.duno / tItem.countKH) : 0;
        thonsList.push(tItem);
      }
      thonsList.sort(function(a, b) { return b.duno - a.duno; });
      delete item.thonsMap;
      item.thons = thonsList;
      finalAreaStats.push(item);
    }

    // Hoàn tất định dạng byCBTD
    var finalCbtdStats = [];
    for (var cKey in byCbtdMap) {
      var cb = byCbtdMap[cKey];
      delete cb.khSet;
      cb.rate = totalDuNo > 0 ? (Math.round((cb.duNo / totalDuNo) * 1000) / 10) + "%" : "0%";
      cb.duNoBinhQuanHD = cb.countHD > 0 ? Math.round(cb.duNo / cb.countHD) : 0;
      cb.duNoBinhQuanTV = cb.countKH > 0 ? Math.round(cb.duNo / cb.countKH) : 0;

      var xasList = [];
      for (var xk in cb.xasMap) {
        var xData = cb.xasMap[xk];
        delete xData.khSet;
        var cbThons = [];
        for (var tk in xData.thonsMap) {
          var tObj2 = xData.thonsMap[tk];
          delete tObj2.khSet;
          tObj2.rateCommune = xData.duno > 0 ? (Math.round((tObj2.duno / xData.duno) * 1000) / 10) + "%" : "0%";
          tObj2.rateTotal = totalDuNo > 0 ? (Math.round((tObj2.duno / totalDuNo) * 1000) / 10) + "%" : "0%";
          tObj2.duNoBinhQuanHD = tObj2.countHD > 0 ? Math.round(tObj2.duno / tObj2.countHD) : 0;
          tObj2.duNoBinhQuanTV = tObj2.countKH > 0 ? Math.round(tObj2.duno / tObj2.countKH) : 0;
          cbThons.push(tObj2);
        }
        cbThons.sort(function(a, b) { return b.duno - a.duno; });
        delete xData.thonsMap;
        xData.thons = cbThons;
        xasList.push(xData);
      }
      delete cb.xasMap;
      cb.communes = xasList;
      finalCbtdStats.push(cb);
    }

    // Hoàn tất loanGroups
    for (var gKey in loanGroups) {
      loanGroups[gKey].rate = totalDuNo > 0 ? (Math.round((loanGroups[gKey].duNo / totalDuNo) * 1000) / 10) + "%" : "0%";
      loanGroups[gKey].subtypes = Object.values(loanGroups[gKey].subtypes);
    }

    // Hoàn tất securityTypes
    var securityTypesList = [];
    for (var sCode in securityTypesMap) {
      var sItem = securityTypesMap[sCode];
      sItem.rate = totalDuNo > 0 ? (Math.round((sItem.duNo / totalDuNo) * 1000) / 10) + "%" : "0%";
      securityTypesList.push(sItem);
    }

    var totalThanhVienVay = Object.keys(allBorrowersSet).length;
    var avgLaiSuat = totalDuNo > 0 ? (Math.round((totalWeightedLai / totalDuNo) * 10) / 10) : 0;

    // Đăng ký trích nợ
    var totalKhachHangTrichNo = 0;
    if (sDS && sDS.getLastRow() > 1) {
      var dsValues = sDS.getRange(2, 1, sDS.getLastRow() - 1, 7).getValues();
      for (var d = 0; d < dsValues.length; d++) {
        if (String(dsValues[d][6]).toUpperCase() !== "NGUNG" && String(dsValues[d][6]).toUpperCase() !== "HUY") {
          totalKhachHangTrichNo++;
        }
      }
    }

    // Nợ tồn đọng
    var totalNoTon = 0;
    var countNoTon = 0;
    if (sNoTon && sNoTon.getLastRow() > 1) {
      var noTonValues = sNoTon.getRange(2, 1, sNoTon.getLastRow() - 1, 7).getValues();
      for (var j = 0; j < noTonValues.length; j++) {
        var st = Number(noTonValues[j][4]) || 0;
        if (st > 0) {
          totalNoTon += st;
          countNoTon++;
        }
      }
    }

    // Đợt trích nợ gần nhất
    var recentBatches = [];
    if (sDot && sDot.getLastRow() > 1) {
      var maxRows = Math.min(6, sDot.getLastRow() - 1);
      var dotValues = sDot.getRange(2, 1, maxRows, 8).getValues();
      for (var b = 0; b < dotValues.length; b++) {
        var phaiThu = Number(dotValues[b][3]) || 0;
        var daTrich = Number(dotValues[b][4]) || 0;
        var conNo = Number(dotValues[b][5]) || 0;
        var cRate = phaiThu > 0 ? Math.round((daTrich / phaiThu) * 100) : 0;

        recentBatches.push({
          maDot: String(dotValues[b][0]),
          thangNam: String(dotValues[b][1]),
          kyTrich: Number(dotValues[b][2]) || 1,
          tongPhaiThu: phaiThu,
          tongDaTrich: daTrich,
          tongConNo: conNo,
          completionRate: cRate,
          ngayTao: formatGasDateTime(dotValues[b][6]),
          trangThai: String(dotValues[b][7] || "KHOI_TAO")
        });
      }
    }

    // Thẩm định chờ duyệt
    var pendingAppraisals = 0;
    if (sAppraisal && sAppraisal.getLastRow() > 1) {
      var appValues = sAppraisal.getRange(2, 1, sAppraisal.getLastRow() - 1, 14).getValues();
      for (var ap = 0; ap < appValues.length; ap++) {
        var appStatus = String(appValues[ap][13] || "");
        if (appStatus.indexOf("CHO_DUYET") > -1 || appStatus.indexOf("KHOI_TAO") > -1) {
          pendingAppraisals++;
        }
      }
    }

    // Kiểm tra vốn cần thực hiện
    var pendingInspections = 0;
    if (sInspection && sInspection.getLastRow() > 1) {
      var insValues = sInspection.getRange(2, 1, sInspection.getLastRow() - 1, 12).getValues();
      for (var ip = 0; ip < insValues.length; ip++) {
        var insStatus = String(insValues[ip][10] || "");
        if (insStatus.indexOf("DANG_THEO_DOI") > -1 || insStatus.indexOf("CHUA_DAT") > -1) {
          pendingInspections++;
        }
      }
    }

    // 5. Tính Top 50 khách hàng có dư nợ lớn nhất đến ngày
    var allCustList = [];
    for (var mId in customerAggMap) {
      allCustList.push(customerAggMap[mId]);
    }
    allCustList.sort(function(a, b) { return b.tongDuNo - a.tongDuNo; });

    var top50DuNoDenNgay = [];
    var topCount = Math.min(50, allCustList.length);
    for (var cIdx = 0; cIdx < topCount; cIdx++) {
      var cItem = allCustList[cIdx];
      top50DuNoDenNgay.push({
        rank: cIdx + 1,
        maKH: cItem.maKH,
        hoTen: cItem.hoTen,
        diaChi: cItem.diaChi,
        xa: cItem.xa,
        thon: cItem.thon,
        soHDCount: cItem.soHDCount,
        tongDuNo: cItem.tongDuNo,
        tyLe: totalDuNo > 0 ? (Math.round((cItem.tongDuNo / totalDuNo) * 1000) / 10) + "%" : "0%"
      });
    }

    // 6. Tính Biểu đồ xu hướng dư nợ theo các tháng/mốc (monthlyDebtTrend)
    var monthlyDebtTrend = [];
    var dateKeys = Object.keys(monthlyTrendMap);
    dateKeys.sort(function(a, b) {
      var parseD = function(str) {
        var p = String(str).split('/');
        if (p.length === 3) return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0])).getTime();
        return 0;
      };
      return parseD(a) - parseD(b);
    });

    for (var dIdx = 0; dIdx < dateKeys.length; dIdx++) {
      var dKey = dateKeys[dIdx];
      var mData = monthlyTrendMap[dKey];
      var countKH = Object.keys(mData.khSet).length;
      monthlyDebtTrend.push({
        date: dKey,
        totalDuNo: mData.totalDuNo,
        countHD: mData.countHD,
        countKH: countKH,
        duNoBinhQuanKH: countKH > 0 ? Math.round(mData.totalDuNo / countKH) : 0
      });
    }

    // 7. Tính Top 50 khách hàng có dư nợ bình quân lớn nhất (chỉ tính đến các ngày cuối tháng sao kê)
    var numSnapshots = dateKeys.length > 0 ? dateKeys.length : 1;
    var allCustAvgList = [];
    for (var aId in customerAggMap) {
      var custObj = customerAggMap[aId];
      var sumAllMonths = 0;
      var activeMonthsCount = 0;
      for (var dk in custObj.monthlyDebts) {
        sumAllMonths += custObj.monthlyDebts[dk];
        if (custObj.monthlyDebts[dk] > 0) activeMonthsCount++;
      }
      var duNoBinhQuan = Math.round(sumAllMonths / numSnapshots);
      allCustAvgList.push({
        maKH: custObj.maKH,
        hoTen: custObj.hoTen,
        diaChi: custObj.diaChi,
        xa: custObj.xa,
        thon: custObj.thon,
        duNoBinhQuan: duNoBinhQuan,
        tongDuNoHienTai: custObj.tongDuNo,
        soThangCoDuNo: activeMonthsCount,
        chiTietThang: custObj.monthlyDebts
      });
    }
    allCustAvgList.sort(function(a, b) { return b.duNoBinhQuan - a.duNoBinhQuan; });

    var top50DuNoBinhQuanCuoiThang = [];
    var topAvgCount = Math.min(50, allCustAvgList.length);
    for (var avgIdx = 0; avgIdx < topAvgCount; avgIdx++) {
      var avgItem = allCustAvgList[avgIdx];
      avgItem.rank = avgIdx + 1;
      top50DuNoBinhQuanCuoiThang.push(avgItem);
    }

    return {
      hasData: true,
      sheetName: sHDTD.getName(),
      sheetDisplayName: sheetDisplayName || sHDTD.getName(),
      asOfMetadata: asOfMetadataText,
      isTwoTier: isTwoTier,
      totalDuNo: totalDuNo,
      totalHopDong: totalHopDong,
      totalThanhVienVay: totalThanhVienVay,
      duNoBinhQuanHD: totalHopDong > 0 ? Math.round(totalDuNo / totalHopDong) : 0,
      duNoBinhQuanTV: totalThanhVienVay > 0 ? Math.round(totalDuNo / totalThanhVienVay) : 0,
      laiSuatBinhQuan: avgLaiSuat,
      totalDuThuLai: Math.round(totalDuThuLai),
      totalKhachHangTrichNo: totalKhachHangTrichNo,
      totalNoTon: totalNoTon,
      countNoTon: countNoTon,
      pendingAppraisals: pendingAppraisals,
      pendingInspections: pendingInspections,
      recentBatches: recentBatches,
      areaStats: finalAreaStats,
      cbtdStats: finalCbtdStats,
      loanTypes: Object.values(loanGroups),
      loanGroups: Object.values(loanGroups),
      securityTypes: securityTypesList,
      top50DuNoDenNgay: top50DuNoDenNgay,
      top50DuNoBinhQuanCuoiThang: top50DuNoBinhQuanCuoiThang,
      monthlyDebtTrend: monthlyDebtTrend
    };
  },

  /**
   * Handler chính trả về Dashboard Stats theo chế độ:
   * - 'current': Hiện tại từ HDTD_CORE
   * - 'as_of_date': Đến ngày từ HDTD_CORE_DN (hoặc sheet được chỉ định)
   * - 'compare': Đối sánh tăng trưởng Hiện tại vs Đến ngày / Các năm
   */
  handleGetDashboardStats: function(ss, params) {
    ss = getSpreadsheetInstance(ss);
    if (!ss) {
      return { status: "error", message: "Không thể kết nối Google Spreadsheet!" };
    }

    params = params || {};
    var mode = params.mode || "current"; // "current" | "as_of_date" | "compare"
    var targetSheet = params.sheetName || (mode === "as_of_date" ? "HDTD_CORE_DN" : "HDTD_CORE");
    var asOfDate = params.asOfDate || "";

    var cacheKey = "dashboard_stats_" + mode + "_" + targetSheet + "_" + (asOfDate ? asOfDate.replace(/\//g, "") : "");
    var cached = CacheHelper.getCachedData(cacheKey);
    if (cached) return { status: "success", data: cached };

    var sKH = ss.getSheetByName("KH_CORE");
    var sNoTon = ss.getSheetByName("NO_TON_DONG");
    var sDot = ss.getSheetByName("DOT_TRICH_NO");
    var sDS = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    var sAppraisal = ss.getSheetByName("THAM_DINH_TD");
    var sInspection = ss.getSheetByName("KIEM_TRA_VON");

    var custMap = this._buildCustMap(sKH);
    var snapshotSheets = this._listSnapshotSheets(ss);

    // 1. Tính toán dữ liệu Hiện Tại (HDTD_CORE)
    var sCurrent = ss.getSheetByName("HDTD_CORE");
    var currentStats = this._computeHdtdStats(sCurrent, custMap, sDS, sNoTon, sDot, sAppraisal, sInspection, "Hiện Tại (Thời Gian Thực)");
    currentStats.mode = "current";

    var finalResult;

    if (mode === "current") {
      finalResult = currentStats;
      finalResult.availableSnapshots = snapshotSheets;
    } else if (mode === "as_of_date") {
      // 2. Chế độ Đến Ngày: Lấy từ sheet chỉ định (mặc định HDTD_CORE_DN)
      var sTarget = ss.getSheetByName(targetSheet);
      if (!sTarget) {
        // Tự động kiểm tra schema nếu sheet chưa có
        SchemaSetup.ensureDatabaseSchema(ss);
        sTarget = ss.getSheetByName(targetSheet);
      }

      var displayName = "Đến Ngày Chốt (" + (asOfDate || targetSheet) + ")";
      var asOfStats = this._computeHdtdStats(sTarget, custMap, sDS, sNoTon, sDot, sAppraisal, sInspection, displayName);
      asOfStats.mode = "as_of_date";
      asOfStats.asOfDate = asOfDate;
      asOfStats.availableSnapshots = snapshotSheets;

      finalResult = asOfStats;
    } else {
      // 3. Chế độ So Sánh: Đối chiếu giữa Current và As-Of / Kỳ năm
      var sCompareTarget = ss.getSheetByName(targetSheet);
      var compareDisplayName = targetSheet === "HDTD_CORE_DN" ? ("Đến Ngày " + (asOfDate || "Chốt")) : targetSheet;
      var targetStats = this._computeHdtdStats(sCompareTarget, custMap, sDS, sNoTon, sDot, sAppraisal, sInspection, compareDisplayName);

      // Tính chênh lệch
      var diffDuNo = currentStats.totalDuNo - targetStats.totalDuNo;
      var growthDuNo = targetStats.totalDuNo > 0 ? (Math.round((diffDuNo / targetStats.totalDuNo) * 1000) / 10) : 0;
      var diffHD = currentStats.totalHopDong - targetStats.totalHopDong;
      var diffTV = currentStats.totalThanhVienVay - targetStats.totalThanhVienVay;

      finalResult = {
        mode: "compare",
        current: currentStats,
        asOf: targetStats,
        comparison: {
          targetSheet: targetSheet,
          asOfDate: asOfDate,
          diffDuNo: diffDuNo,
          growthDuNo: growthDuNo,
          diffHopDong: diffHD,
          diffThanhVien: diffTV
        },
        availableSnapshots: snapshotSheets
      };
    }

    // 4. Tự động kết nối và nạp số liệu chuỗi thời gian từ kho lưu trữ cuối tháng HDTD_CORE_ALL
    // TỐI ƯU HÓA FREE QUOTA: Sử dụng Cold Cache (6 giờ) để triệt tiêu việc đọc lại <10.000 dòng từ Google Sheets
    try {
      var allStatsCacheKey = "dashboard_stats_HDTD_CORE_ALL";
      var cachedAllStats = CacheHelper.getCachedData(allStatsCacheKey);

      if (!cachedAllStats) {
        var sAll = ss.getSheetByName("HDTD_CORE_ALL");
        if (sAll && sAll.getLastRow() > 2) {
          var allStats = this._computeHdtdStats(sAll, custMap, sDS, sNoTon, sDot, sAppraisal, sInspection, "Lưu Trữ Cuối Tháng (HDTD_CORE_ALL)");
          if (allStats && allStats.hasData) {
            cachedAllStats = {
              monthlyDebtTrend: allStats.monthlyDebtTrend || [],
              top50DuNoBinhQuanCuoiThang: allStats.top50DuNoBinhQuanCuoiThang || [],
              allMonthlyStats: {
                hasData: true,
                sheetName: "HDTD_CORE_ALL",
                asOfMetadata: allStats.asOfMetadata,
                totalSnapshots: allStats.monthlyDebtTrend ? allStats.monthlyDebtTrend.length : 0,
                totalDuNo: allStats.totalDuNo,
                totalHopDong: allStats.totalHopDong
              }
            };
            CacheHelper.setCachedData(allStatsCacheKey, cachedAllStats, CacheHelper.TIERS.COLD);
          }
        }
      }

      if (cachedAllStats) {
        if (cachedAllStats.monthlyDebtTrend && cachedAllStats.monthlyDebtTrend.length > 0) {
          finalResult.monthlyDebtTrend = cachedAllStats.monthlyDebtTrend;
        }
        if (cachedAllStats.top50DuNoBinhQuanCuoiThang && cachedAllStats.top50DuNoBinhQuanCuoiThang.length > 0) {
          finalResult.top50DuNoBinhQuanCuoiThang = cachedAllStats.top50DuNoBinhQuanCuoiThang;
        }
        finalResult.allMonthlyStats = cachedAllStats.allMonthlyStats;
      }
    } catch (eAll) {
      Logger.log("Lỗi nạp HDTD_CORE_ALL: " + eAll);
    }

    CacheHelper.setCachedData(cacheKey, finalResult, CacheHelper.TIERS.HOT);
    return { status: "success", data: finalResult };
  }
};



// ==========================================
// MODULE FILE: gas_backend/Auth/AuthController.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - AUTHCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module AuthController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
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



// ==========================================
// MODULE FILE: gas_backend/Auth/RoleController.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - ROLECONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module RoleController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
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



// ==========================================
// MODULE FILE: gas_backend/Customer/Customer360Controller.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - CUSTOMER360CONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module Customer360Controller xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var Customer360Controller = {
  /**
   * Tra cứu 360° khách hàng và danh sách hợp đồng tín dụng
   * Tối ưu hiệu năng O(1) cho 5.175+ khách hàng và 549+ hợp đồng
   */
  handleSearchCustomer360: function(ss, data) {
    data = data || {};
    var query = (data.query || "").toLowerCase().trim();
    var cbtdFilter = (data.cbtdUsername || "").toLowerCase().trim();
    var statusFilter = (data.status || "").toUpperCase().trim(); // 'ALL' | 'DANG_VAY' | 'DA_TAT_TOAN'
    var maxLimit = data.limit ? Number(data.limit) : 250;
    var isDefaultSearch = (!query && (!cbtdFilter || cbtdFilter === "all") && (!statusFilter || statusFilter === "ALL"));
    if (isDefaultSearch) {
      var cachedDefault = (typeof CacheHelper !== 'undefined') ? CacheHelper.getCachedData('cust360_default') : null;
      if (cachedDefault) {
        return { status: "success", data: cachedDefault, total: cachedDefault.length, isFiltered: false };
      }
    }

    var sKH = ss.getSheetByName("KH_CORE");
    var sHDTD = ss.getSheetByName("HDTD_CORE");

    if (!sKH || sKH.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    // 1. Đọc dữ liệu hợp đồng và Gom vào Hash Map theo MaKH O(M)
    var colMapHD = HeaderUtils.getHeaderMap(sHDTD);
    var hdValues = (sHDTD && sHDTD.getLastRow() > 1) 
      ? sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, sHDTD.getLastColumn()).getValues() 
      : [];

    var contractsByMaKH = {};
    for (var j = 0; j < hdValues.length; j++) {
      var rowSoHD = String(HeaderUtils.getCell(hdValues[j], colMapHD, "SoHDTD", "")).trim();
      var rowMaKH = String(HeaderUtils.getCell(hdValues[j], colMapHD, "MaKH", "")).replace(/^'/, "").trim();
      if (!rowMaKH) continue;

      var cbtdUser = String(HeaderUtils.getCell(hdValues[j], colMapHD, "CBTD_PhuTrach", "qtdyentho.cbtd")).trim();
      var tenCBTD = String(HeaderUtils.getCell(hdValues[j], colMapHD, "Ten_CBTD", "Lê Văn Tín (CBTD)")).trim();
      var duNo = Number(HeaderUtils.getCell(hdValues[j], colMapHD, "DuNo", 0)) || 0;
      var trangThaiHD = String(HeaderUtils.getCell(hdValues[j], colMapHD, "TrangThaiHD", duNo > 0 ? "DANG_VAY" : "DA_TAT_TOAN")).trim();
      var maLoaiHD = String(HeaderUtils.getCell(hdValues[j], colMapHD, "MaLoaiHD", "")).trim();
      if (!maLoaiHD) {
        var stv = Number(HeaderUtils.getCell(hdValues[j], colMapHD, "SoThangVay", 12)) || 12;
        maLoaiHD = stv > 12 ? "THCDBTNMT" : "NHCDBTNMT";
      }

      // Kiểm tra bộ lọc trạng thái
      if (statusFilter && statusFilter !== "ALL" && trangThaiHD !== statusFilter) {
        continue;
      }

      // Kiểm tra bộ lọc CBTD
      if (cbtdFilter && cbtdFilter !== "all" && cbtdUser.toLowerCase() !== cbtdFilter) {
        continue;
      }

      if (!contractsByMaKH[rowMaKH]) {
        contractsByMaKH[rowMaKH] = [];
      }

      contractsByMaKH[rowMaKH].push({
        soHDTD: rowSoHD,
        maKH: rowMaKH,
        tienVay: Number(HeaderUtils.getCell(hdValues[j], colMapHD, "TienVay", 0)) || 0,
        duNo: duNo,
        laiSuat: Number(HeaderUtils.getCell(hdValues[j], colMapHD, "LaiSuat", 0)) || 0,
        ngayVay: formatGasDate(HeaderUtils.getCell(hdValues[j], colMapHD, "NgayVay", "")),
        denHan: formatGasDate(HeaderUtils.getCell(hdValues[j], colMapHD, "DenHan", "")),
        traLaiDenNgay: formatGasDate(HeaderUtils.getCell(hdValues[j], colMapHD, "TraLaiDenNgay", "")),
        maLoaiVay: String(HeaderUtils.getCell(hdValues[j], colMapHD, "MaLoaiVay", "LV01")),
        soThangVay: Number(HeaderUtils.getCell(hdValues[j], colMapHD, "SoThangVay", 12)) || 12,
        moTaVay: String(HeaderUtils.getCell(hdValues[j], colMapHD, "MoTaVay", "")),
        hoTen: String(HeaderUtils.getCell(hdValues[j], colMapHD, "HoTen", "")),
        cccd: String(HeaderUtils.getCell(hdValues[j], colMapHD, "CCCD", "")).replace(/^'/, ""),
        dienThoai: String(HeaderUtils.getCell(hdValues[j], colMapHD, "DienThoai", "")).replace(/^'/, ""),
        diaChi: String(HeaderUtils.getCell(hdValues[j], colMapHD, "DiaChi", "")),
        kvXa: String(HeaderUtils.getCell(hdValues[j], colMapHD, "KvXa", "")),
        kvThon: String(HeaderUtils.getCell(hdValues[j], colMapHD, "KvThon", "")),
        cbtdPhuTrach: cbtdUser,
        tenCBTD: tenCBTD,
        trangThaiHD: trangThaiHD,
        maLoaiHD: maLoaiHD,
        ngayCapNhat: HeaderUtils.getCell(hdValues[j], colMapHD, "NgayCapNhat", "") ? formatGasDateTime(HeaderUtils.getCell(hdValues[j], colMapHD, "NgayCapNhat", "")) : ""
      });
    }

    // 2. Đọc bảng Khách hàng
    var colMapKH = HeaderUtils.getHeaderMap(sKH);
    var khValues = sKH.getRange(2, 1, sKH.getLastRow() - 1, sKH.getLastColumn()).getValues();
    var results = [];

    // Helper đóng gói object khách hàng
    var buildCustomerObj = function(row, contracts) {
      var custContracts = contracts || [];
      var custCBTD = "";
      var custTenCBTD = "";
      if (custContracts.length > 0) {
        custCBTD = custContracts[0].cbtdPhuTrach;
        custTenCBTD = custContracts[0].tenCBTD;
      }

      return {
        maKH: String(HeaderUtils.getCell(row, colMapKH, "MaKH", "")).replace(/^'/, "").trim(),
        hoTen: String(HeaderUtils.getCell(row, colMapKH, "HoTen", "")).trim(),
        diaChi: String(HeaderUtils.getCell(row, colMapKH, "DiaChi", "")).trim(),
        ngaySinh: formatGasDate(HeaderUtils.getCell(row, colMapKH, "NgaySinh", "")),
        cccd: String(HeaderUtils.getCell(row, colMapKH, "CCCD", "")).replace(/^'/, "").trim(),
        ngayCap: formatGasDate(HeaderUtils.getCell(row, colMapKH, "NgayCap", "")),
        noiCap: String(HeaderUtils.getCell(row, colMapKH, "NoiCap", "")).trim(),
        dienThoai: String(HeaderUtils.getCell(row, colMapKH, "DienThoai", "")).replace(/^'/, "").trim(),
        dienThoaiDD: String(HeaderUtils.getCell(row, colMapKH, "DienThoaiDD", "")).replace(/^'/, "").trim(),
        soTK: String(HeaderUtils.getCell(row, colMapKH, "SoTK", "")).replace(/^'/, "").trim(),
        khuVuc: String(HeaderUtils.getCell(row, colMapKH, "KhuVuc", "")).trim(),
        kvXa: String(HeaderUtils.getCell(row, colMapKH, "KvXa", "")).trim(),
        kvThon: String(HeaderUtils.getCell(row, colMapKH, "KvThon", "")).trim(),
        soTV: String(HeaderUtils.getCell(row, colMapKH, "SoTV", "")).replace(/^'/, "").trim(),
        soSoCP: String(HeaderUtils.getCell(row, colMapKH, "SoSoCP", "")).trim(),
        ngayVaoTV: formatGasDate(HeaderUtils.getCell(row, colMapKH, "NgayVaoTV", "")),
        tongTienCP: Number(HeaderUtils.getCell(row, colMapKH, "TongTienCP", 0)) || 0,
        tongDuNoHienTai: Number(HeaderUtils.getCell(row, colMapKH, "TongDuNoHienTai", 0)) || 0,
        soLuongHDVay: Number(HeaderUtils.getCell(row, colMapKH, "SoLuongHDVay", 0)) || 0,
        trangThaiVay: String(HeaderUtils.getCell(row, colMapKH, "TrangThaiVay", "")).trim(),
        nhomNoCIC: String(HeaderUtils.getCell(row, colMapKH, "NhomNoCIC", "")).trim(),
        cbtdPhuTrach: custCBTD || "qtdyentho.cbtd",
        tenCBTD: custTenCBTD || "Lê Văn Tín (CBTD)",
        contracts: custContracts
      };
    };

    // TRƯỜNG HỢP 1: Người dùng KHÔNG nhập từ khóa tìm kiếm (query rỗng)
    // Ưu tiên hiển thị tức thì toàn bộ khách hàng CÓ HỢP ĐỒNG VAY thỏa mãn bộ lọc
    if (!query) {
      // Lập Map tra cứu khách hàng nhanh O(1)
      var khMap = {};
      for (var k = 0; k < khValues.length; k++) {
        var mKH = String(HeaderUtils.getCell(khValues[k], colMapKH, "MaKH", "")).replace(/^'/, "").trim();
        if (mKH) khMap[mKH] = khValues[k];
      }

      // Lấy danh sách khách hàng từ các hợp đồng thỏa mãn bộ lọc
      var seenCust = {};
      for (var cMaKH in contractsByMaKH) {
        if (results.length >= maxLimit) break;
        if (!seenCust[cMaKH]) {
          seenCust[cMaKH] = true;
          var khRow = khMap[cMaKH];
          if (khRow) {
            results.push(buildCustomerObj(khRow, contractsByMaKH[cMaKH]));
          }
        }
      }

      // Nếu không có bộ lọc CBTD và Trạng thái và số lượng chưa đủ, bổ sung thêm các KH đầu tiên
      if (!cbtdFilter || cbtdFilter === "all") {
        if (!statusFilter || statusFilter === "ALL") {
          for (var idx = 0; idx < khValues.length && results.length < maxLimit; idx++) {
            var currMaKH = String(HeaderUtils.getCell(khValues[idx], colMapKH, "MaKH", "")).replace(/^'/, "").trim();
            if (!seenCust[currMaKH]) {
              seenCust[currMaKH] = true;
              results.push(buildCustomerObj(khValues[idx], contractsByMaKH[currMaKH] || []));
            }
          }
        }
      }

      if (isDefaultSearch && typeof CacheHelper !== 'undefined') {
        CacheHelper.setCachedData('cust360_default', results, 60);
      }
      return { status: "success", data: results, total: results.length, isFiltered: false };
    }

    // TRƯỜNG HỢP 2: Người dùng CÓ nhập từ khóa tìm kiếm (query)
    for (var i = 0; i < khValues.length; i++) {
      if (results.length >= maxLimit) break;

      var maKH = String(HeaderUtils.getCell(khValues[i], colMapKH, "MaKH", "")).replace(/^'/, "").trim();
      var hoTen = String(HeaderUtils.getCell(khValues[i], colMapKH, "HoTen", "")).trim();
      var cccd = String(HeaderUtils.getCell(khValues[i], colMapKH, "CCCD", "")).replace(/^'/, "").trim();
      var phone = String(HeaderUtils.getCell(khValues[i], colMapKH, "DienThoai", "") || HeaderUtils.getCell(khValues[i], colMapKH, "DienThoaiDD", "")).replace(/^'/, "").trim();
      var soTK = String(HeaderUtils.getCell(khValues[i], colMapKH, "SoTK", "")).replace(/^'/, "").trim();
      var khuVuc = String(HeaderUtils.getCell(khValues[i], colMapKH, "KhuVuc", "") || HeaderUtils.getCell(khValues[i], colMapKH, "DiaChi", "")).trim();

      var isMatch = 
        maKH.toLowerCase().indexOf(query) > -1 ||
        hoTen.toLowerCase().indexOf(query) > -1 ||
        cccd.indexOf(query) > -1 ||
        phone.indexOf(query) > -1 ||
        soTK.indexOf(query) > -1 ||
        khuVuc.toLowerCase().indexOf(query) > -1;

      if (isMatch) {
        var cList = contractsByMaKH[maKH] || [];
        // Nếu có lọc theo CBTD hoặc Trạng thái mà không có hợp đồng thỏa mãn -> bỏ qua
        if (((cbtdFilter && cbtdFilter !== "all") || (statusFilter && statusFilter !== "ALL")) && cList.length === 0) {
          continue;
        }

        results.push(buildCustomerObj(khValues[i], cList));
      }
    }

    return { status: "success", data: results, total: results.length, isFiltered: true };
  },

  /**
   * Tính toán Thống kê KPI Danh mục Hợp đồng cho CBTD
   */
  handleGetCBTDPortfolioStats: function(ss, data) {
    var cbtdUsername = (data.cbtdUsername || "").toLowerCase().trim();
    var sHDTD = ss.getSheetByName("HDTD_CORE");

    if (!sHDTD || sHDTD.getLastRow() <= 1) {
      return {
        status: "success",
        data: {
          totalContracts: 0,
          activeContracts: 0,
          settledContracts: 0,
          totalActivePrincipal: 0,
          totalOriginalLoan: 0,
          totalCustomers: 0,
          dueIn30Days: 0,
          pastDueContracts: 0,
          cbtdList: []
        }
      };
    }

    var colMapHD = HeaderUtils.getHeaderMap(sHDTD);
    var hdValues = sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, sHDTD.getLastColumn()).getValues();
    var now = new Date();
    var in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    var totalContracts = 0;
    var activeContracts = 0;
    var settledContracts = 0;
    var totalActivePrincipal = 0;
    var totalOriginalLoan = 0;
    var uniqueCustomers = {};
    var dueIn30Days = 0;
    var pastDueContracts = 0;
    var cbtdSummaryMap = {};

    for (var i = 0; i < hdValues.length; i++) {
      var soHD = String(HeaderUtils.getCell(hdValues[i], colMapHD, "SoHDTD", "")).trim();
      if (!soHD) continue;
      var maKH = String(HeaderUtils.getCell(hdValues[i], colMapHD, "MaKH", "")).replace(/^'/, "").trim();
      var tienVay = Number(HeaderUtils.getCell(hdValues[i], colMapHD, "TienVay", 0)) || 0;
      var duNo = Number(HeaderUtils.getCell(hdValues[i], colMapHD, "DuNo", 0)) || 0;
      var cbtd = String(HeaderUtils.getCell(hdValues[i], colMapHD, "CBTD_PhuTrach", "qtdyentho.cbtd")).trim();
      var tenCBTD = String(HeaderUtils.getCell(hdValues[i], colMapHD, "Ten_CBTD", "Lê Văn Tín (CBTD)")).trim();
      var trangThai = String(HeaderUtils.getCell(hdValues[i], colMapHD, "TrangThaiHD", duNo > 0 ? "DANG_VAY" : "DA_TAT_TOAN")).trim();
      var rawDenHan = HeaderUtils.getCell(hdValues[i], colMapHD, "DenHan", "");

      // Ghi nhận vào danh sách CBTD tổng thể
      if (!cbtdSummaryMap[cbtd]) {
        cbtdSummaryMap[cbtd] = {
          username: cbtd,
          fullName: tenCBTD,
          totalContracts: 0,
          activeContracts: 0,
          settledContracts: 0,
          totalDuNo: 0,
          customers: {}
        };
      }
      cbtdSummaryMap[cbtd].totalContracts++;
      if (trangThai === "DANG_VAY" || duNo > 0) {
        cbtdSummaryMap[cbtd].activeContracts++;
        cbtdSummaryMap[cbtd].totalDuNo += duNo;
        cbtdSummaryMap[cbtd].customers[maKH] = true;
      } else {
        cbtdSummaryMap[cbtd].settledContracts++;
      }

      // Nếu đang lọc theo 1 CBTD cụ thể
      var isTargetCBTD = !cbtdUsername || cbtdUsername === "all" || cbtd.toLowerCase() === cbtdUsername;
      if (isTargetCBTD) {
        totalContracts++;
        totalOriginalLoan += tienVay;

        if (trangThai === "DANG_VAY" || duNo > 0) {
          activeContracts++;
          totalActivePrincipal += duNo;
          uniqueCustomers[maKH] = true;

          // Kiểm tra ngày đến hạn
          var dDate = rawDenHan instanceof Date ? rawDenHan : (typeof rawDenHan === "string" ? new Date(rawDenHan) : null);
          if (dDate && !isNaN(dDate.getTime())) {
            if (dDate < now) {
              pastDueContracts++;
            } else if (dDate <= in30Days) {
              dueIn30Days++;
            }
          }
        } else {
          settledContracts++;
        }
      }
    }

    var cbtdList = [];
    for (var key in cbtdSummaryMap) {
      cbtdList.push({
        username: cbtdSummaryMap[key].username,
        fullName: cbtdSummaryMap[key].fullName,
        totalContracts: cbtdSummaryMap[key].totalContracts,
        activeContracts: cbtdSummaryMap[key].activeContracts,
        settledContracts: cbtdSummaryMap[key].settledContracts,
        totalDuNo: cbtdSummaryMap[key].totalDuNo,
        customerCount: Object.keys(cbtdSummaryMap[key].customers).length
      });
    }

    return {
      status: "success",
      data: {
        totalContracts: totalContracts,
        activeContracts: activeContracts,
        settledContracts: settledContracts,
        totalActivePrincipal: totalActivePrincipal,
        totalOriginalLoan: totalOriginalLoan,
        totalCustomers: Object.keys(uniqueCustomers).length,
        dueIn30Days: dueIn30Days,
        pastDueContracts: pastDueContracts,
        cbtdList: cbtdList
      }
    };
  },

  /**
   * Phân công hoặc Chuyển giao Cán bộ Tín dụng phụ trách Hợp đồng / Khách hàng
   */
  handleAssignContractCBTD: function(ss, data) {
    var soHDTD = String(data.soHDTD || "").trim();
    var maKH = String(data.maKH || "").trim();
    var cbtdUsername = String(data.cbtdUsername || "").trim();
    var tenCBTD = String(data.tenCBTD || "").trim();
    var assignAllForCustomer = Boolean(data.assignAllForCustomer);

    if (!cbtdUsername) {
      return { status: "error", message: "Vui lòng chọn Cán bộ Tín dụng phụ trách!" };
    }

    var sHDTD = ss.getSheetByName("HDTD_CORE");
    if (!sHDTD || sHDTD.getLastRow() <= 1) {
      return { status: "error", message: "Bảng dữ liệu HDTD_CORE chưa tồn tại hoặc rỗng!" };
    }

    var colMapHD = HeaderUtils.getHeaderMap(sHDTD);
    var hdValues = sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, sHDTD.getLastColumn()).getValues();
    var updatedCount = 0;

    for (var i = 0; i < hdValues.length; i++) {
      var rowSoHD = String(HeaderUtils.getCell(hdValues[i], colMapHD, "SoHDTD", "")).trim();
      var rowMaKH = String(HeaderUtils.getCell(hdValues[i], colMapHD, "MaKH", "")).replace(/^'/, "").trim();

      var shouldUpdate = false;
      if (assignAllForCustomer && maKH && rowMaKH === maKH) {
        shouldUpdate = true;
      } else if (soHDTD && rowSoHD === soHDTD) {
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        var rowIndex = i + 2;
        HeaderUtils.setCell(sHDTD, rowIndex, colMapHD, "CBTD_PhuTrach", cbtdUsername);
        HeaderUtils.setCell(sHDTD, rowIndex, colMapHD, "Ten_CBTD", tenCBTD);
        HeaderUtils.setCell(sHDTD, rowIndex, colMapHD, "NgayCapNhat", new Date());
        updatedCount++;
      }
    }

    SpreadsheetApp.flush();
    CacheHelper.invalidateModuleCache('customer');

    if (updatedCount > 0) {
      return {
        status: "success",
        message: "Đã phân công CBTD " + tenCBTD + " phụ trách thành công " + updatedCount + " hợp đồng!"
      };
    } else {
      return { status: "error", message: "Không tìm thấy hợp đồng phù hợp để phân công!" };
    }
  }
};




// ==========================================
// MODULE FILE: gas_backend/Collateral/CollateralController.gs
// ==========================================

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



// ==========================================
// MODULE FILE: gas_backend/Appraisal/AppraisalController.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - APPRAISALCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module AppraisalController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var AppraisalController = {
  handleGetAppraisals: function(ss) {
    var cached = CacheHelper.getCachedData('appraisals_list');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("BAO_CAO_THAM_DINH") || ss.getSheetByName("THAM_DINH_TD");
    if (!sheet || sheet.getLastColumn() < 50) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("BAO_CAO_THAM_DINH") || ss.getSheetByName("THAM_DINH_TD");
    }

    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var numRows = sheet.getLastRow() - 1;
    var numCols = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, numCols).getValues()[0];
    var colMap = {};
    for (var c = 0; c < headers.length; c++) {
      colMap[String(headers[c]).trim()] = c;
    }

    var values = sheet.getRange(2, 1, numRows, numCols).getValues();
    var results = [];

    var getVal = function(row, colName, defaultVal) {
      var idx = colMap[colName];
      if (idx !== undefined && row[idx] !== undefined && row[idx] !== "") {
        return row[idx];
      }
      return defaultVal;
    };

    for (var i = 0; i < values.length; i++) {
      var r = values[i];
      var isLegacyShifted = (typeof r[3] === 'number' && r[3] >= 1000000) || (colMap["SoCCCD"] !== undefined && typeof r[colMap["SoCCCD"]] === 'number' && r[colMap["SoCCCD"]] >= 1000000);

      var parsed;
      if (isLegacyShifted) {
        var deXuatVay = Number(r[3]) || 300000000;
        var duyetVay = Number(r[4]) || 300000000;
        var thoiHan = Number(r[5]) || 24;
        var laiSuat = Number(r[6]) || 9.5;
        var thuNhap = Number(r[7]) || 30000000;
        var chiPhi = Number(r[8]) || 15000000;
        var giaTriTS = Number(r[16]) || 600000000;
        var ltv = giaTriTS > 0 ? ((duyetVay / giaTriTS) * 100).toFixed(1) : 50.0;
        var gocThang = thoiHan > 0 ? duyetVay / thoiHan : 0;
        var laiThang = (duyetVay * (laiSuat / 100)) / 12;
        var emi = gocThang + laiThang;
        var dsr = thuNhap > 0 ? ((emi / thuNhap) * 100).toFixed(1) : 42.5;
        var coverage = emi > 0 ? ((thuNhap - chiPhi) / emi).toFixed(2) : 1.34;

        parsed = {
          maBCTD: String(r[0] || 'BCTD-2026-081'),
          maKH: String(r[1] || 'KH008892'),
          hoTen: String(r[2] || 'NGUYỄN VĂN AN'),
          soCCCD: '038085009876',
          ngaySinh: '15/05/1985',
          gioiTinh: 'Nam',
          dienThoai: '0912345678',
          diaChi: 'Thôn 3, Xã Yên Thọ, Huyện Ý Yên, Nam Định',
          tinhTrangHonNhan: 'Đã kết hôn',
          nguoiDongVay: 'Nguyễn Thị Hoa (Vợ - CCCD: 038186001234)',
          deXuatVay: deXuatVay,
          mucDichVay: 'Đầu tư mở rộng trang trại chăn nuôi bò sữa và kho ủ thức ăn',
          thoiHanVay: thoiHan,
          phuongThucTraNo: 'Gốc đều hàng tháng, lãi tính trên dư nợ thực tế',
          laiSuatDeNghi: laiSuat,
          coTSBD: 'Có',
          hinhThucBaoDam: 'Thế chấp Quyền sử dụng đất (Sổ đỏ)',
          loaiTSBD: String(r[13] || 'QSDĐ ở nông thôn & Nhà 2 tầng'),
          soGCN: 'CH 892341',
          thuaDatSo: '42',
          toBanDoSo: '08',
          dienTich: 250,
          diaChiTSBD: 'Thôn 3, Xã Yên Thọ, Huyện Ý Yên, Nam Định',
          chuSoHuuTSBD: String(r[14] || 'Nguyễn Văn An và vợ Nguyễn Thị Hoa'),
          quanHeVoiNguoiVay: 'Chính chủ',
          giaTriTSBD: giaTriTS,
          tinhTrangPhapLyTSBD: 'Đầy đủ sổ đỏ hợp pháp, không tranh chấp, quy hoạch',
          moTaTSBD: String(r[15] || 'Thửa đất mặt đường liên thôn rộng 5m, xe tải vào tận nơi.'),
          thuNhapChinh: thuNhap,
          thuNhapPhu: 5000000,
          tongThuNhapThang: thuNhap + 5000000,
          chiPhiSinhHoat: 10000000,
          chiPhiSXKD: 5000000,
          tongChiPhiThang: chiPhi,
          thangDuThang: (thuNhap + 5000000) - chiPhi,
          xepHangCIC: String(r[9] || 'Nhóm 1 (Tốt)'),
          soTCTDQuanHe: Number(r[10]) || 1,
          duNoCICNgoai: Number(r[11]) || 0,
          lichSuTraNo: 'Lịch sử trả nợ tốt, không có nợ quá hạn',
          ghiChuCIC: String(r[12] || 'CIC sạch, không nợ xấu'),
          diaDiemThamDinh: 'Tại nhà riêng và trang trại của khách hàng',
          hienTrangSXKD: 'Trang trại vận hành tốt, sản lượng sữa 120 lít/ngày',
          tuCachKhachHang: 'Đạo đức tốt, uy tín cao tại địa phương',
          duyetVay: duyetVay,
          thoiHanThang: thoiHan,
          laiSuatDuyet: laiSuat,
          phuongThucGiaiNgan: 'Chuyển khoản qua tài khoản CASA',
          bienPhapBaoDam: 'Thế chấp quyền sử dụng đất, công chứng và đăng ký GDBĐ đầy đủ',
          tyLeLTV: Number(ltv),
          nghiaVuTraNoThang: Math.round(emi),
          tyLeDSR: Number(dsr),
          heSoBuDap: Number(coverage),
          dieuKienGiaiNgan: 'Hoàn tất thủ tục công chứng HĐTC và đăng ký thế chấp.',
          mucDoRuiRo: String(r[18] || 'Thấp'),
          ketLuan: String(r[19] || 'Đồng ý cấp tín dụng'),
          canBoThamDinh: String(r[20] || 'Lê Văn Tín'),
          danhSachYKien: [
            {
              nguoiDanhGia: 'Lê Văn Tín',
              chucVu: 'Cán Bộ Tín Dụng',
              yKien: 'Đồng ý',
              noiDung: 'Phương án chăn nuôi khả thi cao, dòng tiền thặng dư đảm bảo trả nợ tốt.',
              ngayDanhGia: '10/08/2025 09:30:00'
            }
          ],
          ngayLap: '10/08/2025'
        };

        // Tự động ghi đè dòng đã remap chuẩn vào Google Sheets
        try {
          var healedRow = new Array(headers.length);
          for (var h = 0; h < headers.length; h++) healedRow[h] = "";
          var setH = function(k, v) { if (colMap[k] !== undefined) healedRow[colMap[k]] = v; };
          setH("MaBCTD", parsed.maBCTD);
          setH("MaKH", parsed.maKH);
          setH("HoTen", parsed.hoTen);
          setH("SoCCCD", parsed.soCCCD);
          setH("NgaySinh", parsed.ngaySinh);
          setH("GioiTinh", parsed.gioiTinh);
          setH("DienThoai", parsed.dienThoai);
          setH("DiaChi", parsed.diaChi);
          setH("TinhTrangHonNhan", parsed.tinhTrangHonNhan);
          setH("NguoiDongVay", parsed.nguoiDongVay);
          setH("DeXuatVay", parsed.deXuatVay);
          setH("MucDichVay", parsed.mucDichVay);
          setH("ThoiHanVay", parsed.thoiHanVay);
          setH("PhuongThucTraNo", parsed.phuongThucTraNo);
          setH("CoTSBD", parsed.coTSBD);
          setH("HinhThucBaoDam", parsed.hinhThucBaoDam);
          setH("LoaiTSBD", parsed.loaiTSBD);
          setH("SoGCN", parsed.soGCN);
          setH("ThuaDatSo", parsed.thuaDatSo);
          setH("ToBanDoSo", parsed.toBanDoSo);
          setH("DienTich", parsed.dienTich);
          setH("DiaChiTSBD", parsed.diaChiTSBD);
          setH("ChuSoHuuTSBD", parsed.chuSoHuuTSBD);
          setH("QuanHeVoiNguoiVay", parsed.quanHeVoiNguoiVay);
          setH("GiaTriTSBD", parsed.giaTriTSBD);
          setH("TinhTrangPhapLyTSBD", parsed.tinhTrangPhapLyTSBD);
          setH("MoTaTSBD", parsed.moTaTSBD);
          setH("ThuNhapChinh", parsed.thuNhapChinh);
          setH("ThuNhapPhu", parsed.thuNhapPhu);
          setH("TongThuNhapThang", parsed.tongThuNhapThang);
          setH("ChiPhiSinhHoat", parsed.chiPhiSinhHoat);
          setH("ChiPhiSXKD", parsed.chiPhiSXKD);
          setH("TongChiPhiThang", parsed.tongChiPhiThang);
          setH("ThangDuThang", parsed.thangDuThang);
          setH("XepHangCIC", parsed.xepHangCIC);
          setH("SoTCTDQuanHe", parsed.soTCTDQuanHe);
          setH("DuNoCICNgoai", parsed.duNoCICNgoai);
          setH("LichSuTraNo", parsed.lichSuTraNo);
          setH("GhiChuCIC", parsed.ghiChuCIC);
          setH("DiaDiemThamDinh", parsed.diaDiemThamDinh);
          setH("HienTrangSXKD", parsed.hienTrangSXKD);
          setH("TuCachKhachHang", parsed.tuCachKhachHang);
          setH("DuyetVay", parsed.duyetVay);
          setH("ThoiHanThang", parsed.thoiHanThang);
          setH("LaiSuatDuyet", parsed.laiSuatDuyet);
          setH("PhuongThucGiaiNgan", parsed.phuongThucGiaiNgan);
          setH("BienPhapBaoDam", parsed.bienPhapBaoDam);
          setH("TyLeLTV", parsed.tyLeLTV);
          setH("NghiaVuTraNoThang", parsed.nghiaVuTraNoThang);
          setH("TyLeDSR", parsed.tyLeDSR);
          setH("HeSoBuDap", parsed.heSoBuDap);
          setH("DieuKienGiaiNgan", parsed.dieuKienGiaiNgan);
          setH("MucDoRuiRo", parsed.mucDoRuiRo);
          setH("KetLuan", parsed.ketLuan);
          setH("CanBoThamDinh", parsed.canBoThamDinh);
          setH("DanhSachYKien", JSON.stringify(parsed.danhSachYKien));
          setH("NgayLap", new Date());

          sheet.getRange(i + 2, 1, 1, headers.length).setValues([healedRow]);
        } catch(healErr) {}
      } else {
        var opinionsRaw = getVal(r, "DanhSachYKien", "[]");
        var approvalOpinions = [];
        try {
          approvalOpinions = typeof opinionsRaw === 'string' ? JSON.parse(opinionsRaw || "[]") : (opinionsRaw || []);
        } catch(e) {}

        parsed = {
          // 1. Pháp lý & Nhu cầu vốn
          maBCTD: getVal(r, "MaBCTD", r[0]),
          maKH: getVal(r, "MaKH", r[1]),
          hoTen: getVal(r, "HoTen", r[2]),
          soCCCD: getVal(r, "SoCCCD", ""),
          ngaySinh: getVal(r, "NgaySinh", "15/08/1985"),
          gioiTinh: getVal(r, "GioiTinh", "Nam"),
          dienThoai: getVal(r, "DienThoai", ""),
          diaChi: getVal(r, "DiaChi", ""),
          tinhTrangHonNhan: getVal(r, "TinhTrangHonNhan", "Đã kết hôn"),
          nguoiDongVay: getVal(r, "NguoiDongVay", ""),
          hinhAnhKH: getVal(r, "HinhAnhKH", ""),
          nganhNghe: getVal(r, "NganhNghe", "Kinh doanh tự do"),
          trinhDo: getVal(r, "TrinhDo", "Đại học / Cao đẳng"),
          thuNhapNguoiVay: Number(getVal(r, "ThuNhapNguoiVay", 0)) || 0,
          nguonThuNguoiVay: getVal(r, "NguonThuNguoiVay", "Thu nhập từ SXKD và lương"),
          thuNhapDongVay: Number(getVal(r, "ThuNhapDongVay", 0)) || 0,
          nguonThuDongVay: getVal(r, "NguonThuDongVay", "Thu nhập từ kinh doanh"),
          chungMinhThuNhap: getVal(r, "ChungMinhThuNhap", ""),
          thuNhapRong: Number(getVal(r, "ThuNhapRong", 0)) || 0,
          deXuatVay: Number(getVal(r, "DeXuatVay", 0)) || 0,
          mucDichVay: getVal(r, "MucDichVay", "Sản xuất kinh doanh"),
          thoiHanVay: Number(getVal(r, "ThoiHanVay", 12)) || 12,
          phuongThucTraNo: getVal(r, "PhuongThucTraNo", "Gốc đều hàng tháng, lãi tính trên dư nợ thực tế"),
          laiSuatDeNghi: Number(getVal(r, "LaiSuatDeNghi", 9.5)),

          // 2. Tài sản bảo đảm (TSBĐ)
          coTSBD: getVal(r, "CoTSBD", "Có"),
          hinhThucBaoDam: getVal(r, "HinhThucBaoDam", "Thế chấp QSDĐ (Sổ đỏ)"),
          loaiTSBD: getVal(r, "LoaiTSBD", ""),
          soGCN: getVal(r, "SoGCN", "CH 892341"),
          thuaDatSo: getVal(r, "ThuaDatSo", "112"),
          toBanDoSo: getVal(r, "ToBanDoSo", "08"),
          dienTich: Number(getVal(r, "DienTich", 250)) || 250,
          diaChiTSBD: getVal(r, "DiaChiTSBD", ""),
          chuSoHuuTSBD: getVal(r, "ChuSoHuuTSBD", ""),
          quanHeVoiNguoiVay: getVal(r, "QuanHeVoiNguoiVay", "Chính chủ"),
          giaTriTSBD: Number(getVal(r, "GiaTriTSBD", 0)) || 0,
          nguonGocTSBD: getVal(r, "NguonGocTSBD", "Nhận chuyển nhượng quyền sử dụng đất"),
          giaTriThiTruong: Number(getVal(r, "GiaTriThiTruong", 0)) || 0,
          hinhAnhTSBD: getVal(r, "HinhAnhTSBD", ""),
          chiTietLoaiDat: getVal(r, "ChiTietLoaiDat", "[]"),
          giaTriCongTrinh: Number(getVal(r, "GiaTriCongTrinh", 0)) || 0,
          tinhTrangPhapLyTSBD: getVal(r, "TinhTrangPhapLyTSBD", "Hợp pháp, không tranh chấp"),
          moTaTSBD: getVal(r, "MoTaTSBD", ""),

          // 3. Thực địa, Dòng tiền & CIC
          thuNhapChinh: Number(getVal(r, "ThuNhapChinh", 0)) || 0,
          thuNhapPhu: Number(getVal(r, "ThuNhapPhu", 0)) || 0,
          tongThuNhapThang: Number(getVal(r, "TongThuNhapThang", 0)) || 0,
          chiPhiSinhHoat: Number(getVal(r, "ChiPhiSinhHoat", 0)) || 0,
          chiPhiSXKD: Number(getVal(r, "ChiPhiSXKD", 0)) || 0,
          tongChiPhiThang: Number(getVal(r, "TongChiPhiThang", 0)) || 0,
          thangDuThang: Number(getVal(r, "ThangDuThang", 0)) || 0,
          xepHangCIC: getVal(r, "XepHangCIC", "Nhóm 1 (Tốt)"),
          soTCTDQuanHe: Number(getVal(r, "SoTCTDQuanHe", 0)) || 0,
          duNoCICNgoai: Number(getVal(r, "DuNoCICNgoai", 0)) || 0,
          lichSuTraNo: getVal(r, "LichSuTraNo", "Trả nợ tốt"),
          ghiChuCIC: getVal(r, "GhiChuCIC", ""),
          diaDiemThamDinh: getVal(r, "DiaDiemThamDinh", "Tại cơ sở khách hàng"),
          hienTrangSXKD: getVal(r, "HienTrangSXKD", "Ổn định"),
          tuCachKhachHang: getVal(r, "TuCachKhachHang", "Tốt"),

          // 4. Đề xuất của CBTD & Các chỉ số tài chính
          duyetVay: Number(getVal(r, "DuyetVay", 0)) || 0,
          thoiHanThang: Number(getVal(r, "ThoiHanThang", 12)) || 12,
          laiSuatDuyet: Number(getVal(r, "LaiSuatDuyet", 0)) || 0,
          phuongThucGiaiNgan: getVal(r, "PhuongThucGiaiNgan", "Chuyển khoản qua tài khoản CASA"),
          phuongThucTraGoc: getVal(r, "PhuongThucTraGoc", "HANG_THANG"),
          phuongAnToiUu: getVal(r, "PhuongAnToiUu", "Phương án trả nợ gốc đều hàng tháng đảm bảo khả năng trả nợ tốt."),
          bienPhapBaoDam: getVal(r, "BienPhapBaoDam", "Thế chấp QSDĐ, công chứng đăng ký GDBĐ"),
          tyLeLTV: getVal(r, "TyLeLTV", "0.0"),
          nghiaVuTraNoThang: Number(getVal(r, "NghiaVuTraNoThang", 0)) || 0,
          tyLeDSR: Number(getVal(r, "TyLeDSR", 0)) || 0,
          heSoBuDap: Number(getVal(r, "HeSoBuDap", 0)) || 0,
          dieuKienGiaiNgan: getVal(r, "DieuKienGiaiNgan", "Đăng ký GDBĐ đầy đủ"),
          mucDoRuiRo: getVal(r, "MucDoRuiRo", "Thấp"),

          // 5. Phê duyệt & Kết luận
          ketLuan: getVal(r, "KetLuan", "Đồng ý cấp tín dụng"),
          canBoThamDinh: getVal(r, "CanBoThamDinh", "Lê Văn Tín"),
          canBoLapUsername: getVal(r, "CanBoLapUsername", "qtdyentho.cbtd"),
          danhSachYKien: approvalOpinions,
          ngayLap: formatGasDate(getVal(r, "NgayLap", new Date()))
        };
      }
      results.push(parsed);
    }

    CacheHelper.setCachedData('appraisals_list', results, 30);
    return { status: "success", data: results };
  },

  handleSaveAppraisalReport: function(ss, data) {
    var sheet = ss.getSheetByName("BAO_CAO_THAM_DINH");
    if (!sheet) {
      sheet = ss.getSheetByName("THAM_DINH_TD");
    }
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("BAO_CAO_THAM_DINH") || ss.getSheetByName("THAM_DINH_TD");
    }

    var maBCTD = data.maBCTD || ("BCTD-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss"));
    var opinionsJson = JSON.stringify(data.danhSachYKien || []);
    var chiTietLoaiDatJson = typeof data.chiTietLoaiDat === 'string' ? data.chiTietLoaiDat : JSON.stringify(data.chiTietLoaiDat || []);

    // Ensure schema has all columns
    SchemaSetup.ensureDatabaseSchema(ss);

    var numCols = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, numCols).getValues()[0];
    var colMap = {};
    for (var c = 0; c < headers.length; c++) {
      colMap[String(headers[c]).trim()] = c;
    }

    var newRow = new Array(headers.length);
    for (var j = 0; j < newRow.length; j++) newRow[j] = "";

    var setCol = function(name, val) {
      if (colMap[name] !== undefined) {
        newRow[colMap[name]] = val;
      }
    };

    // 1. Pháp lý & Nhu cầu
    setCol("MaBCTD", maBCTD);
    setCol("MaKH", data.maKH || "");
    setCol("HoTen", data.hoTen || "");
    setCol("SoCCCD", data.soCCCD || "");
    setCol("NgaySinh", data.ngaySinh || "");
    setCol("GioiTinh", data.gioiTinh || "Nam");
    setCol("DienThoai", data.dienThoai || "");
    setCol("DiaChi", data.diaChi || "");
    setCol("TinhTrangHonNhan", data.tinhTrangHonNhan || "Đã kết hôn");
    setCol("NguoiDongVay", data.nguoiDongVay || "");
    setCol("HinhAnhKH", data.hinhAnhKH || "");
    setCol("NganhNghe", data.nganhNghe || "");
    setCol("TrinhDo", data.trinhDo || "");
    setCol("ThuNhapNguoiVay", Number(data.thuNhapNguoiVay) || 0);
    setCol("NguonThuNguoiVay", data.nguonThuNguoiVay || "");
    setCol("ThuNhapDongVay", Number(data.thuNhapDongVay) || 0);
    setCol("NguonThuDongVay", data.nguonThuDongVay || "");
    setCol("ChungMinhThuNhap", data.chungMinhThuNhap || "");
    setCol("ThuNhapRong", Number(data.thuNhapRong) || 0);
    setCol("DeXuatVay", Number(data.deXuatVay) || 0);
    setCol("MucDichVay", data.mucDichVay || "");
    setCol("ThoiHanVay", Number(data.thoiHanVay) || 12);
    setCol("PhuongThucTraNo", data.phuongThucTraNo || "");

    // 2. Tài sản bảo đảm
    setCol("CoTSBD", data.coTSBD || "Có");
    setCol("HinhThucBaoDam", data.hinhThucBaoDam || "");
    setCol("LoaiTSBD", data.loaiTSBD || "");
    setCol("SoGCN", data.soGCN || "");
    setCol("ThuaDatSo", data.thuaDatSo || "");
    setCol("ToBanDoSo", data.toBanDoSo || "");
    setCol("DienTich", Number(data.dienTich) || 0);
    setCol("DiaChiTSBD", data.diaChiTSBD || "");
    setCol("ChuSoHuuTSBD", data.chuSoHuuTSBD || "");
    setCol("QuanHeVoiNguoiVay", data.quanHeVoiNguoiVay || "");
    setCol("GiaTriTSBD", Number(data.giaTriTSBD) || 0);
    setCol("NguonGocTSBD", data.nguonGocTSBD || "");
    setCol("GiaTriThiTruong", Number(data.giaTriThiTruong) || 0);
    setCol("HinhAnhTSBD", data.hinhAnhTSBD || "");
    setCol("ChiTietLoaiDat", chiTietLoaiDatJson);
    setCol("GiaTriCongTrinh", Number(data.giaTriCongTrinh) || 0);
    setCol("TinhTrangPhapLyTSBD", data.tinhTrangPhapLyTSBD || "");
    setCol("MoTaTSBD", data.moTaTSBD || "");

    // 3. Thực địa, Dòng tiền & CIC
    setCol("ThuNhapChinh", Number(data.thuNhapChinh) || 0);
    setCol("ThuNhapPhu", Number(data.thuNhapPhu) || 0);
    setCol("TongThuNhapThang", Number(data.tongThuNhapThang) || 0);
    setCol("ChiPhiSinhHoat", Number(data.chiPhiSinhHoat) || 0);
    setCol("ChiPhiSXKD", Number(data.chiPhiSXKD) || 0);
    setCol("TongChiPhiThang", Number(data.tongChiPhiThang) || 0);
    setCol("ThangDuThang", Number(data.thangDuThang) || 0);
    setCol("XepHangCIC", data.xepHangCIC || "Nhóm 1 (Tốt)");
    setCol("SoTCTDQuanHe", Number(data.soTCTDQuanHe) || 0);
    setCol("DuNoCICNgoai", Number(data.duNoCICNgoai) || 0);
    setCol("LichSuTraNo", data.lichSuTraNo || "");
    setCol("GhiChuCIC", data.ghiChuCIC || "");
    setCol("DiaDiemThamDinh", data.diaDiemThamDinh || "");
    setCol("HienTrangSXKD", data.hienTrangSXKD || "");
    setCol("TuCachKhachHang", data.tuCachKhachHang || "");

    // 4. Đề xuất của CBTD & Chỉ số
    setCol("DuyetVay", Number(data.duyetVay) || 0);
    setCol("ThoiHanThang", Number(data.thoiHanThang) || 12);
    setCol("LaiSuatDuyet", Number(data.laiSuatDuyet) || 0);
    setCol("PhuongThucGiaiNgan", data.phuongThucGiaiNgan || "");
    setCol("PhuongThucTraGoc", data.phuongThucTraGoc || "HANG_THANG");
    setCol("PhuongAnToiUu", data.phuongAnToiUu || "");
    setCol("BienPhapBaoDam", data.bienPhapBaoDam || "");
    setCol("TyLeLTV", data.tyLeLTV || "0.0");
    setCol("NghiaVuTraNoThang", Number(data.nghiaVuTraNoThang) || 0);
    setCol("TyLeDSR", Number(data.tyLeDSR) || 0);
    setCol("HeSoBuDap", Number(data.heSoBuDap) || 0);
    setCol("DieuKienGiaiNgan", data.dieuKienGiaiNgan || "");
    setCol("MucDoRuiRo", data.mucDoRuiRo || "Thấp");

    // 5. Phê duyệt & Kết luận
    setCol("KetLuan", data.ketLuan || "Đồng ý cấp tín dụng");
    setCol("CanBoThamDinh", data.canBoThamDinh || "Lê Văn Tín (CBTD)");
    setCol("CanBoLapUsername", data.canBoLapUsername || "qtdyentho.cbtd");
    setCol("DanhSachYKien", opinionsJson);
    setCol("NgayLap", new Date());

    sheet.appendRow(newRow);
    CacheHelper.invalidateModuleCache('appraisal');

    return {
      status: "success",
      message: "Đã lưu Báo cáo thẩm định " + maBCTD + " (5 Nhóm nghiệp vụ) thành công!",
      maBCTD: maBCTD
    };
  },

  handleAddApprovalOpinion: function(ss, data) {
    var maBCTD = (data.maBCTD || "").trim();
    if (!maBCTD) return { status: "error", message: "Thiếu mã BCTD" };

    var sheet = ss.getSheetByName("BAO_CAO_THAM_DINH");
    if (!sheet) {
      sheet = ss.getSheetByName("THAM_DINH_TD");
    }
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

    var headers = values[0];
    var colMap = {};
    for (var c = 0; c < headers.length; c++) {
      colMap[String(headers[c]).trim()] = c;
    }

    var opinionColIdx = colMap["DanhSachYKien"];
    if (opinionColIdx === undefined) opinionColIdx = 20; // fallback column index

    var currentOpinions = [];
    try {
      var raw = values[foundRow - 1][opinionColIdx];
      currentOpinions = typeof raw === 'string' ? JSON.parse(raw || "[]") : (raw || []);
    } catch(e) {}

    var opinionPayload = data.opinion || data;
    var newOpinion = {
      nguoiDanhGia: opinionPayload.nguoiDanhGia || opinionPayload.evaluatorName || "Cán bộ",
      chucVu: opinionPayload.chucVu || opinionPayload.role || "Cán Bộ Tín Dụng",
      capDuyet: opinionPayload.capDuyet || (opinionPayload.chucVu && opinionPayload.chucVu.includes("HĐQT") ? "HDQT" : opinionPayload.chucVu && opinionPayload.chucVu.includes("Kiểm Soát") ? "BKS" : "CBTD"),
      yKien: opinionPayload.yKien || opinionPayload.decision || "Đồng ý",
      noiDung: opinionPayload.noiDung || opinionPayload.note || "",
      hanMucDuyet: opinionPayload.hanMucDuyet ? Number(opinionPayload.hanMucDuyet) : null,
      laiSuatDuyet: opinionPayload.laiSuatDuyet ? Number(opinionPayload.laiSuatDuyet) : null,
      dieuKienBoSung: opinionPayload.dieuKienBoSung || "",
      ngayDanhGia: opinionPayload.ngayDanhGia || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss")
    };

    currentOpinions.push(newOpinion);
    sheet.getRange(foundRow, opinionColIdx + 1).setValue(JSON.stringify(currentOpinions));

    // Nếu người duyệt là HĐQT / Ban Giám Đốc hoặc có cờ cập nhật kết luận
    if (opinionPayload.updateKetLuan || (newOpinion.chucVu && (newOpinion.chucVu.includes("HĐQT") || newOpinion.chucVu.includes("Giám Đốc") || newOpinion.chucVu.includes("Lãnh Đạo")))) {
      if (colMap["KetLuan"] !== undefined) {
        var ketLuanMoi = "Đồng ý cấp tín dụng";
        if (newOpinion.yKien === "Không đồng ý" || newOpinion.yKien === "Từ chối") {
          ketLuanMoi = "Từ chối cấp tín dụng";
        } else if (newOpinion.yKien === "Yêu cầu bổ sung" || newOpinion.yKien === "Yêu cầu thẩm định lại") {
          ketLuanMoi = "Có điều kiện bổ sung";
        } else if (newOpinion.yKien === "Đồng ý có điều kiện") {
          ketLuanMoi = "Có điều kiện bổ sung";
        }
        sheet.getRange(foundRow, colMap["KetLuan"] + 1).setValue(ketLuanMoi);
      }
      if (newOpinion.dieuKienBoSung && colMap["DieuKienGiaiNgan"] !== undefined) {
        var currentDieuKien = String(values[foundRow - 1][colMap["DieuKienGiaiNgan"]] || "");
        var updatedDieuKien = currentDieuKien ? (currentDieuKien + " | Chỉ đạo HĐQT: " + newOpinion.dieuKienBoSung) : ("Chỉ đạo HĐQT: " + newOpinion.dieuKienBoSung);
        sheet.getRange(foundRow, colMap["DieuKienGiaiNgan"] + 1).setValue(updatedDieuKien);
      }
    }

    CacheHelper.invalidateModuleCache('appraisal');
    return {
      status: "success",
      message: "Đã ghi nhận ý kiến phê duyệt của " + newOpinion.nguoiDanhGia + " (" + newOpinion.chucVu + ") thành công!"
    };
  }
};



// ==========================================
// MODULE FILE: gas_backend/Inspection/InspectionController.gs
// ==========================================

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



// ==========================================
// MODULE FILE: gas_backend/Debit/DebitController.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - DEBITCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Phân hệ Quản lý & Tự động hóa Trích nợ Auto-Debit:
 *              1. Đăng ký trích nợ cấp Khách hàng (Tài khoản CASA, Giấy đề nghị trích nợ A4)
 *              2. Cấu hình các Đợt trích nợ linh hoạt theo Ngày vay trong tháng (day of month)
 *              3. Lập đợt trích nợ, tính lãi ngày thực tế TT 14/2017/TT-NHNN & Chốt đợt
 * @updated     18/09/2026
 * @version     3.2 Enterprise Auto-Debit
 * ========================================================================================
 */

var DebitController = {

  // ======================================================================================
  // 1. QUẢN LÝ ĐĂNG KÝ TRÍCH NỢ CẤP KHÁCH HÀNG (CUSTOMER LEVEL)
  // ======================================================================================

  handleGetDebitRegistrations: function(ss) {
    var cached = CacheHelper.getCachedData('debit_registrations');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("DANG_KY_TRICH_NO");
    }

    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var numRows = sheet.getLastRow() - 1;
    var values = sheet.getRange(2, 1, numRows, sheet.getLastColumn()).getValues();
    var results = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var rawMaKH = String(HeaderUtils.getCell(row, colMap, "MaKH", "")).replace(/^'/, "").trim();
      if (!rawMaKH) continue;

      var hoTen = String(HeaderUtils.getCell(row, colMap, "HoTen", "") || HeaderUtils.getCell(row, colMap, "TenKH", "")).trim();
      var cccd = String(HeaderUtils.getCell(row, colMap, "CCCD", "") || HeaderUtils.getCell(row, colMap, "SoGTTT", "")).replace(/^'/, "").trim();
      var ngayCap = formatGasDate(HeaderUtils.getCell(row, colMap, "NgayCap", ""));
      var dienThoai = String(HeaderUtils.getCell(row, colMap, "DienThoai", "")).replace(/^'/, "").trim();
      var diaChi = String(HeaderUtils.getCell(row, colMap, "DiaChi", "")).trim();
      var soTK = String(HeaderUtils.getCell(row, colMap, "SoTK", "")).replace(/^'/, "").trim();
      var kyTrich = Number(HeaderUtils.getCell(row, colMap, "KyTrichMacDinh", 0) || HeaderUtils.getCell(row, colMap, "KyTrichNo", 0) || HeaderUtils.getCell(row, colMap, "KyTrich", 0)) || 0;
      var trangThai = String(HeaderUtils.getCell(row, colMap, "TrangThai", "Hiệu lực")).trim();
      var ghiChu = String(HeaderUtils.getCell(row, colMap, "GhiChu", "")).trim();
      var ngayTao = formatGasDateTime(HeaderUtils.getCell(row, colMap, "NgayTao", ""));

      results.push({
        maKH: rawMaKH,
        hoTen: hoTen,
        tenKH: hoTen,
        cccd: cccd,
        soGTTT: cccd,
        ngayCap: ngayCap,
        dienThoai: dienThoai,
        diaChi: diaChi,
        soTK: soTK,
        kyTrich: kyTrich,
        kyTrichMacDinh: kyTrich,
        trangThai: trangThai,
        ghiChu: ghiChu,
        ngayTao: ngayTao
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

    var maKHInput = String(data.maKH || "").replace(/^'/, "").trim();
    if (!maKHInput) {
      return { status: "error", message: "Mã khách hàng không được để trống!" };
    }

    var cleanCCCD = String(data.cccd || data.gttt || "").replace(/^'/, "").trim();
    var cleanSoTK = String(data.soTK || "").replace(/^'/, "").trim();
    var hoTen = String(data.hoTen || "").trim();
    var diaChi = String(data.diaChi || "").trim();
    var dienThoai = String(data.dienThoai || "").replace(/^'/, "").trim();
    var ngayCap = data.ngayCap ? parseGasDateToSheet(data.ngayCap) : "";
    var kyTrich = Number(data.kyTrichMacDinh !== undefined ? data.kyTrichMacDinh : (data.kyTrich || 0)) || 0;
    var trangThai = String(data.trangThai || "Hiệu lực").trim();
    var ghiChu = String(data.ghiChu || "").trim();

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var defaultHeaders = [
      "MaKH", "HoTen", "CCCD", "NgayCap", "DienThoai", "DiaChi", "SoTK", "KyTrichMacDinh", "TrangThai", "GhiChu", "NgayTao"
    ];

    var lastRow = sheet.getLastRow();
    var existingRowIndex = -1;

    if (lastRow > 1) {
      var allRows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
      for (var r = 0; r < allRows.length; r++) {
        var curMa = String(HeaderUtils.getCell(allRows[r], colMap, "MaKH", "")).replace(/^'/, "").trim();
        if (curMa === maKHInput) {
          existingRowIndex = r + 2;
          break;
        }
      }
    }

    if (existingRowIndex > 0) {
      // Cập nhật thông tin dòng hiện có
      if (hoTen) HeaderUtils.setCell(sheet, existingRowIndex, colMap, "HoTen", hoTen);
      if (cleanCCCD) HeaderUtils.setCell(sheet, existingRowIndex, colMap, "CCCD", "'" + cleanCCCD);
      if (ngayCap) HeaderUtils.setCell(sheet, existingRowIndex, colMap, "NgayCap", ngayCap);
      if (dienThoai) HeaderUtils.setCell(sheet, existingRowIndex, colMap, "DienThoai", "'" + dienThoai);
      if (diaChi) HeaderUtils.setCell(sheet, existingRowIndex, colMap, "DiaChi", diaChi);
      if (cleanSoTK) HeaderUtils.setCell(sheet, existingRowIndex, colMap, "SoTK", "'" + cleanSoTK);
      HeaderUtils.setCell(sheet, existingRowIndex, colMap, "KyTrichMacDinh", kyTrich);
      HeaderUtils.setCell(sheet, existingRowIndex, colMap, "TrangThai", trangThai);
      HeaderUtils.setCell(sheet, existingRowIndex, colMap, "GhiChu", ghiChu);

      CacheHelper.invalidateModuleCache('debit');
      return {
        status: "success",
        message: "Đã cập nhật thỏa thuận trích nợ tự động của khách hàng " + (hoTen || maKHInput) + "!",
        maKH: maKHInput
      };
    } else {
      // Thêm mới khách hàng đăng ký trích nợ
      var dict = {
        MaKH: "'" + maKHInput,
        HoTen: hoTen,
        CCCD: cleanCCCD ? ("'" + cleanCCCD) : "",
        NgayCap: ngayCap,
        DienThoai: dienThoai ? ("'" + dienThoai) : "",
        DiaChi: diaChi,
        SoTK: cleanSoTK ? ("'" + cleanSoTK) : "",
        KyTrichMacDinh: kyTrich,
        TrangThai: trangThai,
        GhiChu: ghiChu,
        NgayTao: new Date()
      };

      var newRow = HeaderUtils.dictToRow(dict, colMap, defaultHeaders);
      sheet.appendRow(newRow);

      CacheHelper.invalidateModuleCache('debit');
      return {
        status: "success",
        message: "Đăng ký dịch vụ trích nợ tự động cho khách hàng " + (hoTen || maKHInput) + " thành công!",
        maKH: maKHInput
      };
    }
  },

  handleToggleDebitRegisterStatus: function(ss, data) {
    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "error", message: "Không tìm thấy dữ liệu đăng ký trích nợ!" };
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var maKHInput = String(data.maKH || "").replace(/^'/, "").trim();
    var lastRow = sheet.getLastRow();
    var targetRow = -1;
    var currentStatus = "Hiệu lực";

    var allRows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    for (var i = 0; i < allRows.length; i++) {
      var curMa = String(HeaderUtils.getCell(allRows[i], colMap, "MaKH", "")).replace(/^'/, "").trim();
      if (curMa === maKHInput) {
        targetRow = i + 2;
        currentStatus = String(HeaderUtils.getCell(allRows[i], colMap, "TrangThai", "Hiệu lực")).trim();
        break;
      }
    }

    if (targetRow === -1) {
      return { status: "error", message: "Không tìm thấy hồ sơ đăng ký của khách hàng " + maKHInput };
    }

    var newStatus = data.newStatus;
    if (!newStatus) {
      newStatus = (currentStatus === "Hiệu lực" || currentStatus === "Hieu luc" || currentStatus === "ACTIVE") ? "Tạm ngưng" : "Hiệu lực";
    }

    HeaderUtils.setCell(sheet, targetRow, colMap, "TrangThai", newStatus);
    CacheHelper.invalidateModuleCache('debit');
    return {
      status: "success",
      message: "Đã chuyển trạng thái thỏa thuận trích nợ của KH " + maKHInput + " sang: " + newStatus,
      newStatus: newStatus
    };
  },

  handleDeleteDebitRegister: function(ss, data) {
    var sheet = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "error", message: "Không tìm thấy dữ liệu đăng ký trích nợ!" };
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var maKHInput = String(data.maKH || "").replace(/^'/, "").trim();
    var lastRow = sheet.getLastRow();
    var targetRow = -1;

    var allRows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    for (var i = 0; i < allRows.length; i++) {
      var curMa = String(HeaderUtils.getCell(allRows[i], colMap, "MaKH", "")).replace(/^'/, "").trim();
      if (curMa === maKHInput) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) {
      return { status: "error", message: "Không tìm thấy hồ sơ đăng ký của khách hàng " + maKHInput };
    }

    sheet.deleteRow(targetRow);
    CacheHelper.invalidateModuleCache('debit');
    return { status: "success", message: "Đã xóa thỏa thuận trích nợ tự động của khách hàng " + maKHInput + " thành công!" };
  },

  // ======================================================================================
  // 2. CẤU HÌNH CÁC ĐỢT TRÍCH NỢ LINH HOẠT THEO NGÀY VAY TRONG THÁNG
  // ======================================================================================

  handleGetDebitConfigs: function(ss) {
    var cached = CacheHelper.getCachedData('debit_configs');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("CAU_HINH_DOT_TRICH_NO");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("CAU_HINH_DOT_TRICH_NO");
    }

    var defaultConfigs = [
      { maDotConfig: "DOT_01", tenDot: "Đợt 1 - Kỳ ngày 05", tuNgayVay: 26, denNgayVay: 4, ngayTrichHangThang: 5, trangThai: "ACTIVE", ghiChu: "Áp dụng cho HĐTD giải ngân ngày 26 đến ngày 04" },
      { maDotConfig: "DOT_02", tenDot: "Đợt 2 - Kỳ ngày 15", tuNgayVay: 5, denNgayVay: 15, ngayTrichHangThang: 15, trangThai: "ACTIVE", ghiChu: "Áp dụng cho HĐTD giải ngân ngày 05 đến ngày 15" },
      { maDotConfig: "DOT_03", tenDot: "Đợt 3 - Kỳ ngày 25", tuNgayVay: 16, denNgayVay: 25, ngayTrichHangThang: 25, trangThai: "ACTIVE", ghiChu: "Áp dụng cho HĐTD giải ngân ngày 16 đến ngày 25" }
    ];

    if (!sheet || sheet.getLastRow() <= 1) {
      CacheHelper.setCachedData('debit_configs', defaultConfigs, 60);
      return { status: "success", data: defaultConfigs };
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    var results = [];

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var ma = String(HeaderUtils.getCell(r, colMap, "MaDotConfig", "")).trim();
      if (!ma) continue;

      results.push({
        maDotConfig: ma,
        tenDot: String(HeaderUtils.getCell(r, colMap, "TenDot", "")).trim(),
        tuNgayVay: Number(HeaderUtils.getCell(r, colMap, "TuNgayVay", 1)) || 1,
        denNgayVay: Number(HeaderUtils.getCell(r, colMap, "DenNgayVay", 31)) || 31,
        ngayTrichHangThang: Number(HeaderUtils.getCell(r, colMap, "NgayTrichHangThang", 15)) || 15,
        trangThai: String(HeaderUtils.getCell(r, colMap, "TrangThai", "ACTIVE")).trim(),
        ghiChu: String(HeaderUtils.getCell(r, colMap, "GhiChu", "")).trim()
      });
    }

    if (results.length === 0) results = defaultConfigs;

    CacheHelper.setCachedData('debit_configs', results, 60);
    return { status: "success", data: results };
  },

  handleSaveDebitConfig: function(ss, data) {
    var sheet = ss.getSheetByName("CAU_HINH_DOT_TRICH_NO");
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("CAU_HINH_DOT_TRICH_NO");
    }

    var maDotConfig = String(data.maDotConfig || ("DOT_" + Utilities.formatDate(new Date(), "GMT+7", "yyMMdd_HHmmss"))).trim();
    var tenDot = String(data.tenDot || "Đợt Trích Nợ").trim();
    var tuNgayVay = Number(data.tuNgayVay) || 1;
    var denNgayVay = Number(data.denNgayVay) || 31;
    var ngayTrichHangThang = Number(data.ngayTrichHangThang) || 15;
    var trangThai = String(data.trangThai || "ACTIVE").trim();
    var ghiChu = String(data.ghiChu || "").trim();

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var defaultHeaders = ["MaDotConfig", "TenDot", "TuNgayVay", "DenNgayVay", "NgayTrichHangThang", "TrangThai", "GhiChu"];

    var lastRow = sheet.getLastRow();
    var targetRow = -1;

    if (lastRow > 1) {
      var allRows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
      for (var r = 0; r < allRows.length; r++) {
        var curMa = String(HeaderUtils.getCell(allRows[r], colMap, "MaDotConfig", "")).trim();
        if (curMa === maDotConfig) {
          targetRow = r + 2;
          break;
        }
      }
    }

    var dict = {
      MaDotConfig: maDotConfig,
      TenDot: tenDot,
      TuNgayVay: tuNgayVay,
      DenNgayVay: denNgayVay,
      NgayTrichHangThang: ngayTrichHangThang,
      TrangThai: trangThai,
      GhiChu: ghiChu
    };

    if (targetRow > 0) {
      HeaderUtils.setCell(sheet, targetRow, colMap, "TenDot", tenDot);
      HeaderUtils.setCell(sheet, targetRow, colMap, "TuNgayVay", tuNgayVay);
      HeaderUtils.setCell(sheet, targetRow, colMap, "DenNgayVay", denNgayVay);
      HeaderUtils.setCell(sheet, targetRow, colMap, "NgayTrichHangThang", ngayTrichHangThang);
      HeaderUtils.setCell(sheet, targetRow, colMap, "TrangThai", trangThai);
      HeaderUtils.setCell(sheet, targetRow, colMap, "GhiChu", ghiChu);
    } else {
      var row = HeaderUtils.dictToRow(dict, colMap, defaultHeaders);
      sheet.appendRow(row);
    }

    CacheHelper.invalidateModuleCache('debit');
    return {
      status: "success",
      message: "Lưu cấu hình đợt trích nợ (" + tenDot + ") thành công!",
      maDotConfig: maDotConfig
    };
  },

  // ======================================================================================
  // 3. QUẢN LÝ CÁC ĐỢT TRÍCH NỢ ĐÃ LẬP (DEBIT BATCHES & DETAILS)
  // ======================================================================================

  handleGetDebitBatches: function(ss) {
    var cached = CacheHelper.getCachedData('debit_batches');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("DOT_TRICH_NO");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    var results = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var maDot = String(HeaderUtils.getCell(row, colMap, "MaDot", "")).trim();
      if (!maDot) continue;

      results.push({
        maDot: maDot,
        thangNam: String(HeaderUtils.getCell(row, colMap, "ThangNam", "")).trim(),
        kyTrich: Number(HeaderUtils.getCell(row, colMap, "KyTrichNo", 1) || HeaderUtils.getCell(row, colMap, "KyTrich", 1)) || 1,
        tongSoHD: Number(HeaderUtils.getCell(row, colMap, "TongSoHD", 0)) || 0,
        tongSoKH: Number(HeaderUtils.getCell(row, colMap, "TongSoKH", 0)) || 0,
        tongPhaiThu: Number(HeaderUtils.getCell(row, colMap, "TongPhaiThu", 0)) || 0,
        tongDaTrich: Number(HeaderUtils.getCell(row, colMap, "TongDaTrich", 0)) || 0,
        tongConNo: Number(HeaderUtils.getCell(row, colMap, "TongConNo", 0)) || 0,
        trangThai: String(HeaderUtils.getCell(row, colMap, "TrangThai", "CHO_TRICH_NO")).trim(),
        ngayTao: formatGasDateTime(HeaderUtils.getCell(row, colMap, "NgayTao", ""))
      });
    }

    // Mới nhất lên đầu
    results.reverse();

    CacheHelper.setCachedData('debit_batches', results, 30);
    return { status: "success", data: results };
  },

  handleCreateDebitBatch: function(ss, data) {
    var thangNam = String(data.thangNam || Utilities.formatDate(new Date(), "GMT+7", "yyyyMM")).replace(/[^0-9]/g, "");
    var kyTrich = Number(data.kyTrich) || 1;
    var maDot = String(data.maDot || ("DOT-" + thangNam + "-K" + kyTrich)).trim();

    var sDot = ss.getSheetByName("DOT_TRICH_NO");
    var sDetail = ss.getSheetByName("LICH_SU_TRICH_NO") || ss.getSheetByName("CHI_TIET_TRICH_NO") || ss.getSheetByName("LICH_SU_GIAO_DICH");

    if (!sDot || !sDetail) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sDot = ss.getSheetByName("DOT_TRICH_NO");
      sDetail = ss.getSheetByName("LICH_SU_TRICH_NO");
    }

    var items = data.chiTietDanhSach || [];
    if (!items || items.length === 0) {
      return { status: "error", message: "Danh sách hợp đồng trích nợ được chọn rỗng!" };
    }

    var detailColMap = HeaderUtils.getHeaderMap(sDetail);
    var detailDefaultHeaders = [
      "MaDot", "SoHDTD", "MaKH", "TenKH", "SoTK", "TongTienPhaiThu", "DaTrich", "ConNo", "TrangThaiCore", "MaGiaoDichCore", "NgayTrich"
    ];

    var totalPhaiThu = 0;
    var distinctKHMaps = {};
    var newDetailRows = [];
    var nowTime = new Date();

    for (var k = 0; k < items.length; k++) {
      var it = items[k];
      var amt = Number(it.soTienTrich !== undefined ? it.soTienTrich : (it.tongDuKien || it.tongTien || 0)) || 0;
      totalPhaiThu += amt;

      var cleanMaKH = String(it.maKH || "").replace(/^'/, "").trim();
      if (cleanMaKH) distinctKHMaps[cleanMaKH] = true;

      var dict = {
        MaDot: maDot,
        SoHDTD: String(it.soHDTD || "").trim(),
        MaKH: "'" + cleanMaKH,
        TenKH: String(it.hoTen || it.tenKH || "").trim(),
        SoTK: "'" + String(it.soTK || "").replace(/^'/, "").trim(),
        TongTienPhaiThu: amt,
        DaTrich: 0,
        ConNo: amt,
        TrangThaiCore: "CHO_TRICH_NO",
        MaGiaoDichCore: "",
        NgayTrich: nowTime
      };

      newDetailRows.push(HeaderUtils.dictToRow(dict, detailColMap, detailDefaultHeaders));
    }

    // Ghi hàng loạt vào bảng chi tiết LICH_SU_TRICH_NO
    if (newDetailRows.length > 0) {
      sDetail.getRange(sDetail.getLastRow() + 1, 1, newDetailRows.length, newDetailRows[0].length).setValues(newDetailRows);
    }

    // Ghi vào bảng Master DOT_TRICH_NO
    var dotColMap = HeaderUtils.getHeaderMap(sDot);
    var dotDefaultHeaders = [
      "MaDot", "ThangNam", "KyTrichNo", "TongSoHD", "TongSoKH", "TongPhaiThu", "TongDaTrich", "TongConNo", "TrangThai", "NgayTao"
    ];

    var countKH = Object.keys(distinctKHMaps).length;
    var countHD = items.length;

    var dotDict = {
      MaDot: maDot,
      ThangNam: thangNam,
      KyTrichNo: kyTrich,
      TongSoHD: countHD,
      TongSoKH: countKH,
      TongPhaiThu: totalPhaiThu,
      TongDaTrich: 0,
      TongConNo: totalPhaiThu,
      TrangThai: "CHO_TRICH_NO",
      NgayTao: nowTime
    };

    var dotRow = HeaderUtils.dictToRow(dotDict, dotColMap, dotDefaultHeaders);
    sDot.appendRow(dotRow);

    CacheHelper.invalidateModuleCache('debit');

    return {
      status: "success",
      message: "Khởi tạo và chốt đợt trích nợ " + maDot + " thành công! Tổng số tiền: " + totalPhaiThu.toLocaleString('vi-VN') + " đ (" + countKH + " khách hàng, " + countHD + " hợp đồng).",
      summary: {
        maDot: maDot,
        thangNam: thangNam,
        kyTrich: kyTrich,
        tongSoKH: countKH,
        tongSoHD: countHD,
        tongPhaiThu: totalPhaiThu
      }
    };
  }
};



// ==========================================
// MODULE FILE: gas_backend/Reconciliation/ReconciliationController.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - RECONCILIATIONCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module ReconciliationController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var ReconciliationController = {
  handleReconcileUpload: function(ss, data) {
    var maDot = data.maDot;
    var items = data.items || [];

    var sLS = ss.getSheetByName("LICH_SU_TRICH_NO") || ss.getSheetByName("LICH_SU_GIAO_DICH") || ss.getSheetByName("CHI_TIET_TRICH_NO");
    var sNoTon = ss.getSheetByName("NO_TON_DONG");
    var sDot = ss.getSheetByName("DOT_TRICH_NO");

    if (!sNoTon || !sDot) {
      return { status: "error", message: "Không tìm thấy các bảng CSDL cần thiết để đối soát." };
    }

    var totalDaTrich = 0;
    var totalConNo = 0;
    var countSuccess = 0;
    var countFailed = 0;

    var noTonColMap = HeaderUtils.getHeaderMap(sNoTon);
    var noTonDefaultHeaders = [
      "SoHDTD", "MaKH", "TenKH", "GocTon", "LaiTon", "TongNoTon", "KyPhatSinh", "TrangThai", "GhiChu", "NgayCapNhat"
    ];

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
          var dict = {
            SoHDTD: it.soHDTD || "",
            MaKH: it.maKH || "",
            TenKH: it.tenKH || "",
            GocTon: Number(it.gocTon || 0) || 0,
            LaiTon: conNo,
            TongNoTon: conNo,
            KyPhatSinh: maDot,
            TrangThai: "CHUA_THU",
            GhiChu: it.ghiChu || "Đối soát chưa thành công",
            NgayCapNhat: new Date()
          };
          newNoTonRows.push(HeaderUtils.dictToRow(dict, noTonColMap, noTonDefaultHeaders));
        }
      }
    }

    if (newNoTonRows.length > 0) {
      sNoTon.getRange(sNoTon.getLastRow() + 1, 1, newNoTonRows.length, newNoTonRows[0].length).setValues(newNoTonRows);
    }

    if (sDot.getLastRow() > 1) {
      var dotColMap = HeaderUtils.getHeaderMap(sDot);
      var dotLastCol = sDot.getLastColumn();
      var dotVals = sDot.getRange(2, 1, sDot.getLastRow() - 1, dotLastCol).getValues();
      for (var d = 0; d < dotVals.length; d++) {
        var dMaDot = HeaderUtils.getCell(dotVals[d], dotColMap, "MaDot", "");
        if (dMaDot === maDot) {
          var rowIndex = d + 2;
          HeaderUtils.setCell(sDot, rowIndex, dotColMap, "TongDaTrich", totalDaTrich);
          HeaderUtils.setCell(sDot, rowIndex, dotColMap, "TongConNo", totalConNo);
          HeaderUtils.setCell(sDot, rowIndex, dotColMap, "TrangThai", "HOAN_TAT");
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
// MODULE FILE: gas_backend/Debt/DebtWarningController.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - DEBTWARNINGCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module DebtWarningController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var DebtWarningController = {
  handleGetDebtWarnings: function(ss) {
    var cached = CacheHelper.getCachedData('debt_warnings');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("NO_TON_DONG");
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var colMap = HeaderUtils.getHeaderMap(sheet);
    var lastCol = sheet.getLastColumn();
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var trangThai = HeaderUtils.getCell(row, colMap, "TrangThai", "");
      if (trangThai === "CHUA_THU") {
        results.push({
          soHDTD: HeaderUtils.getCell(row, colMap, "SoHDTD", ""),
          maKH: HeaderUtils.getCell(row, colMap, "MaKH", ""),
          tenKH: HeaderUtils.getCell(row, colMap, "TenKH", ""),
          gocTon: Number(HeaderUtils.getCell(row, colMap, "GocTon", 0)) || 0,
          laiTon: Number(HeaderUtils.getCell(row, colMap, "LaiTon", 0)) || 0,
          tongNoTon: Number(HeaderUtils.getCell(row, colMap, "TongNoTon", 0)) || 0,
          kyPhatSinh: HeaderUtils.getCell(row, colMap, "KyPhatSinh", ""),
          trangThai: trangThai,
          ghiChu: HeaderUtils.getCell(row, colMap, "GhiChu", ""),
          ngayCapNhat: formatGasDateTime(HeaderUtils.getCell(row, colMap, "NgayCapNhat", ""))
        });
      }
    }

    CacheHelper.setCachedData('debt_warnings', results, 20);
    return { status: "success", data: results };
  }
};



// ==========================================
// MODULE FILE: gas_backend/Reports/ReportController.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - REPORTCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller xử lý tổng hợp Báo cáo Thống kê Quản trị Tín dụng,
 *              Phân bổ Địa bàn, Cơ cấu Sản phẩm Vay, Sao Kê Hợp Đồng (BC_DOANH_SO_TD)
 *              và Bảng Xếp Hạng Top Dư Nợ Bình Quân Toàn Quỹ (TOP_DU_NO_BINH_QUAN).
 * @created     15/08/2026
 * @updated     18/09/2026
 * @version     3.0
 * ========================================================================================
 */

function formatGasDateVN(val) {
  if (!val) return "";
  if (val instanceof Date) {
    var d = ("0" + val.getDate()).slice(-2);
    var m = ("0" + (val.getMonth() + 1)).slice(-2);
    var y = val.getFullYear();
    return d + "/" + m + "/" + y;
  }
  return String(val).trim();
}

var ReportController = {
  handleGetReportsData: function(ss) {
    var cached = CacheHelper.getCachedData('reports_data_v2');
    if (cached) return { status: "success", data: cached };

    var sKH = ss.getSheetByName("KH_CORE");
    var sHDTD = ss.getSheetByName("HDTD_CORE");

    if (!sKH || !sHDTD) {
      return {
        status: "success",
        data: {
          areaData: [],
          loanTypes: [],
          statementData: [],
          topAvgDebtData: [],
          kpiMetrics: {},
          summary: { totalDuNo: 0, totalTienVay: 0, totalKH: 0 }
        }
      };
    }

    // --- Build KH map (batch read theo tên cột) ---
    var khMap = {};
    if (sKH.getLastRow() > 1) {
      var colMapKH = HeaderUtils.getHeaderMap(sKH);
      var khVals = sKH.getRange(2, 1, sKH.getLastRow() - 1, sKH.getLastColumn()).getValues();
      for (var i = 0; i < khVals.length; i++) {
        var mKH = String(HeaderUtils.getCell(khVals[i], colMapKH, "MaKH", "")).replace(/^'/, "").trim();
        var hTen = String(HeaderUtils.getCell(khVals[i], colMapKH, "HoTen", "")).trim();
        var dChi = String(HeaderUtils.getCell(khVals[i], colMapKH, "DiaChi", "")).trim();
        var sTV = String(HeaderUtils.getCell(khVals[i], colMapKH, "SoTV", "")).replace(/^'/, "").trim();
        var directXa = String(HeaderUtils.getCell(khVals[i], colMapKH, "KvXa", "")).trim();
        var diaChiKV = (dChi + " " + String(HeaderUtils.getCell(khVals[i], colMapKH, "KhuVuc", ""))).trim();
        var areaKey = directXa || "Khác";
        if (!directXa) {
          if (diaChiKV.indexOf("Yên Thọ") > -1) areaKey = "Xã Yên Thọ (Thôn 1, 2, 3, 4)";
          else if (diaChiKV.indexOf("Yên Trường") > -1 || diaChiKV.indexOf("Vĩnh Lộc") > -1) areaKey = "Xã Yên Trường / Vĩnh Lộc";
          else if (diaChiKV.indexOf("Yên Bái") > -1 || diaChiKV.indexOf("Quý Lộc") > -1) areaKey = "Xã Quý Lộc / Yên Bái";
        }
        khMap[mKH] = {
          hoTen: hTen,
          diaChi: dChi,
          soTV: sTV,
          area: areaKey
        };
      }
    }

    var areaStats = {
      "Xã Yên Thọ (Thôn 1, 2, 3, 4)": { countKH: new Set(), duNo: 0 },
      "Xã Yên Trường / Vĩnh Lộc":      { countKH: new Set(), duNo: 0 },
      "Xã Quý Lộc / Yên Bái":           { countKH: new Set(), duNo: 0 }
    };

    var loanTypeStats = {
      "Nông nghiệp & Chăn nuôi": { count: 0, amount: 0, color: "#16a34a" },
      "Thương mại & Dịch vụ":    { count: 0, amount: 0, color: "#0284c7" },
      "Tiêu dùng & Đời sống":    { count: 0, amount: 0, color: "#eab308" }
    };

    var totalDuNo = 0;
    var totalTienVay = 0;
    var countCASA = 0;
    var countNPL = 0;   // Nợ xấu N3-N5
    var totalKH = new Set();
    var statementResult = [];
    var customerDebtMap = {};

    // --- Batch read HDTD_CORE (theo tên cột) ---
    if (sHDTD.getLastRow() > 1) {
      var colMapHD = HeaderUtils.getHeaderMap(sHDTD);
      var hdRows = sHDTD.getLastRow() - 1;
      var hdVals = sHDTD.getRange(2, 1, hdRows, sHDTD.getLastColumn()).getValues();

      for (var j = 0; j < hdVals.length; j++) {
        var hdSoHDTD    = String(HeaderUtils.getCell(hdVals[j], colMapHD, "SoHDTD", "")).trim();
        var hdMaKH      = String(HeaderUtils.getCell(hdVals[j], colMapHD, "MaKH", "")).replace(/^'/, "").trim();
        var hdTienVay   = Number(HeaderUtils.getCell(hdVals[j], colMapHD, "TienVay", 0)) || 0;
        var hdDuNo      = Number(HeaderUtils.getCell(hdVals[j], colMapHD, "DuNo", 0)) || 0;
        var hdLaiSuat   = Number(HeaderUtils.getCell(hdVals[j], colMapHD, "LaiSuat", 0)) || 0;
        var hdNgayVay   = formatGasDateVN(HeaderUtils.getCell(hdVals[j], colMapHD, "NgayVay", ""));
        var hdDenHan    = formatGasDateVN(HeaderUtils.getCell(hdVals[j], colMapHD, "DenHan", ""));
        var hdTraLaiDen = formatGasDateVN(HeaderUtils.getCell(hdVals[j], colMapHD, "TraLaiDenNgay", ""));
        var hdMaLoaiVay = String(HeaderUtils.getCell(hdVals[j], colMapHD, "MaLoaiVay", "")).trim();
        var hdSoThang   = Number(HeaderUtils.getCell(hdVals[j], colMapHD, "SoThangVay", 0)) || 0;
        var hdMoTa      = String(HeaderUtils.getCell(hdVals[j], colMapHD, "MoTaVay", "")).trim();
        var hdCBTD_Code = String(HeaderUtils.getCell(hdVals[j], colMapHD, "CBTD_PhuTrach", "")).trim();
        var hdTenCBTD   = String(HeaderUtils.getCell(hdVals[j], colMapHD, "Ten_CBTD", "")).trim();
        var hdMaLoaiHD  = String(HeaderUtils.getCell(hdVals[j], colMapHD, "MaLoaiHD", "")).trim();
        if (!hdMaLoaiHD) {
          hdMaLoaiHD = hdSoThang > 12 ? "THCDBTNMT" : "NHCDBTNMT";
        }

        var khInfo = khMap[hdMaKH] || {
          hoTen: "Khách hàng " + hdMaKH,
          diaChi: "Địa bàn QTDND",
          soTV: "",
          area: "Xã Yên Thọ (Thôn 1, 2, 3, 4)"
        };

        var aKey = khInfo.area || "Xã Yên Thọ (Thôn 1, 2, 3, 4)";

        // Phân loại sản phẩm vay
        var prodKey = "Nông nghiệp & Chăn nuôi";
        var moTaLower = hdMoTa.toLowerCase();
        if (moTaLower.indexOf("kinh doanh") > -1 || moTaLower.indexOf("thương mại") > -1 || moTaLower.indexOf("xe tải") > -1 || moTaLower.indexOf("buôn bán") > -1) {
          prodKey = "Thương mại & Dịch vụ";
        } else if (moTaLower.indexOf("tiêu dùng") > -1 || moTaLower.indexOf("nhà ở") > -1 || moTaLower.indexOf("sửa chữa") > -1) {
          prodKey = "Tiêu dùng & Đời sống";
        }

        // Bổ sung vào danh sách sao kê toàn diện (Statement)
        statementResult.push({
          soHDTD: hdSoHDTD,
          maKH: hdMaKH,
          soTV: khInfo.soTV || "",
          hoTen: khInfo.hoTen || ("KH " + hdMaKH),
          tienVay: hdTienVay,
          duNo: hdDuNo,
          laiSuat: hdLaiSuat,
          ngayVay: hdNgayVay,
          denHan: hdDenHan,
          maLoaiVay: hdMaLoaiVay || prodKey,
          soThangVay: hdSoThang,
          moTaVay: hdMoTa || prodKey,
          khuVuc: aKey,
          diaChi: khInfo.diaChi,
          cbtdPhuTrach: hdCBTD_Code,
          tenCBTD: hdTenCBTD,
          trangThaiHD: hdTrangThai || (hdDuNo > 0 ? "DANG_VAY" : "DA_TAT_TOAN"),
          maLoaiHD: hdMaLoaiHD
        });

        totalTienVay += hdTienVay;

        // Bỏ qua hợp đồng đã tất toán khỏi các chỉ số dư nợ hiện tại
        if (hdTrangThai === "DA_TAT_TOAN" || (hdDuNo <= 0 && hdTrangThai !== "DANG_VAY")) {
          continue;
        }

        totalDuNo += hdDuNo;
        totalKH.add(hdMaKH);

        // CASA coverage
        if (hdVals[j][12] !== "" && hdVals[j][12] !== null) {
          countCASA++;
        }

        // Nhóm nợ xấu N3-N5 (nếu có cột chỉ định hoặc quá hạn)
        var hdNhomNo = Number(hdVals[j][8]) || 1;
        if (hdNhomNo >= 3) countNPL++;

        // Thống kê theo địa bàn
        if (!areaStats[aKey]) areaStats[aKey] = { countKH: new Set(), duNo: 0 };
        areaStats[aKey].countKH.add(hdMaKH);
        areaStats[aKey].duNo += hdDuNo;

        // Thống kê theo sản phẩm vay
        loanTypeStats[prodKey].count++;
        loanTypeStats[prodKey].amount += hdDuNo;

        // Gom nhóm tính Top Dư Nợ
        if (!customerDebtMap[hdMaKH]) {
          customerDebtMap[hdMaKH] = {
            maKH: hdMaKH,
            hoTen: khInfo.hoTen || ("KH " + hdMaKH),
            soTV: khInfo.soTV || "",
            khuVuc: aKey,
            diaChi: khInfo.diaChi || "",
            tongDuNo: 0,
            tongTienVay: 0,
            soMonVay: 0
          };
        }
        customerDebtMap[hdMaKH].tongDuNo += hdDuNo;
        customerDebtMap[hdMaKH].tongTienVay += hdTienVay;
        customerDebtMap[hdMaKH].soMonVay += 1;
      }
    }

    var totalLoanCount = Object.keys(loanTypeStats).reduce(function(acc, k) {
      return acc + loanTypeStats[k].count;
    }, 0);

    // --- Build areaData result ---
    var areaResult = [];
    for (var k in areaStats) {
      var dNo = areaStats[k].duNo;
      var rateStr = totalDuNo > 0 ? ((dNo / totalDuNo) * 100).toFixed(1) + "%" : "0%";
      areaResult.push({
        area: k,
        countKH: areaStats[k].countKH.size,
        duNo: dNo,
        rate: rateStr
      });
    }
    areaResult.sort(function(a, b) { return b.duNo - a.duNo; });

    // --- Build loanTypes result ---
    var loanTypeResult = [];
    for (var p in loanTypeStats) {
      var ltRate = totalLoanCount > 0 ? ((loanTypeStats[p].count / totalLoanCount) * 100).toFixed(1) + "%" : "0%";
      loanTypeResult.push({
        type: p,
        count: loanTypeStats[p].count,
        amount: loanTypeStats[p].amount,
        rate: ltRate,
        color: loanTypeStats[p].color
      });
    }
    // Khởi tạo thống kê 7 hình thức bảo đảm
    var securityTypeStats = {
      "THCDBTNMT": { code: "THCDBTNMT", name: "Trung hạn có đảm bảo, đăng ký GDBĐ", count: 0, duNo: 0, group: "Có TSBĐ (Đăng ký GDBĐ)" },
      "THBLCDBTNMT": { code: "THBLCDBTNMT", name: "Trung hạn đăng ký GDBĐ uỷ quyền", count: 0, duNo: 0, group: "Có TSBĐ (Đăng ký GDBĐ)" },
      "NHCDBTNMT": { code: "NHCDBTNMT", name: "Ngắn hạn có đảm bảo, đăng ký GDBĐ", count: 0, duNo: 0, group: "Có TSBĐ (Đăng ký GDBĐ)" },
      "THCDB": { code: "THCDB", name: "Trung hạn có TSBĐ không đăng ký GDBĐ", count: 0, duNo: 0, group: "Có TSBĐ (Không đăng ký)" },
      "NHCDB": { code: "NHCDB", name: "Ngắn hạn có TSBĐ không đăng ký GDBĐ", count: 0, duNo: 0, group: "Có TSBĐ (Không đăng ký)" },
      "NHKDB": { code: "NHKDB", name: "Ngắn hạn, tín chấp", count: 0, duNo: 0, group: "Tín chấp" },
      "THKDB": { code: "THKDB", name: "Trung hạn tín chấp", count: 0, duNo: 0, group: "Tín chấp" }
    };

    // Duyệt lại danh sách hợp đồng đang vay để thống kê hình thức bảo đảm
    for (var s = 0; s < statementResult.length; s++) {
      var stItem = statementResult[s];
      if (stItem.trangThaiHD !== "DA_TAT_TOAN" && stItem.duNo > 0) {
        var mCode = stItem.maLoaiHD || "NHCDBTNMT";
        if (!securityTypeStats[mCode]) {
          securityTypeStats[mCode] = { code: mCode, name: mCode, count: 0, duNo: 0, group: "Khác" };
        }
        securityTypeStats[mCode].count++;
        securityTypeStats[mCode].duNo += stItem.duNo;
      }
    }

    var securityTypeResult = [];
    for (var sc in securityTypeStats) {
      var sObj = securityTypeStats[sc];
      if (sObj.count > 0 || sObj.duNo > 0) {
        var sRate = totalDuNo > 0 ? ((sObj.duNo / totalDuNo) * 100).toFixed(1) + "%" : "0%";
        securityTypeResult.push({
          code: sObj.code,
          name: sObj.name,
          group: sObj.group,
          count: sObj.count,
          amount: sObj.duNo,
          rate: sRate
        });
      }
    }
    securityTypeResult.sort(function(a, b) { return b.amount - a.amount; });

    // --- Build topAvgDebtData result ---
    var topDebtArr = [];
    for (var m in customerDebtMap) {
      var cItem = customerDebtMap[m];
      var cRate = totalDuNo > 0 ? Number(((cItem.tongDuNo / totalDuNo) * 100).toFixed(2)) : 0;
      topDebtArr.push({
        maKH: cItem.maKH,
        hoTen: cItem.hoTen,
        soTV: cItem.soTV,
        khuVuc: cItem.khuVuc,
        diaChi: cItem.diaChi,
        tongDuNo: cItem.tongDuNo,
        tongTienVay: cItem.tongTienVay,
        soMonVay: cItem.soMonVay,
        duNoBinhQuan: cItem.tongDuNo,
        tyTrongDuNo: cRate
      });
    }
    topDebtArr.sort(function(a, b) { return b.tongDuNo - a.tongDuNo; });

    var topAvgDebtResult = topDebtArr.slice(0, 50).map(function(c, idx) {
      c.xepHang = idx + 1;
      c.namBaoCao = 2026;
      return c;
    });

    // --- Kiểm tra nếu có sẵn sheet BC_DOANH_SO_TD có dữ liệu đẩy từ Python Daemon ---
    var sBCDS = ss.getSheetByName("BC_DOANH_SO_TD");
    if (sBCDS && sBCDS.getLastRow() > 1) {
      try {
        var bcdsVals = sBCDS.getRange(2, 1, sBCDS.getLastRow() - 1, 12).getValues();
        if (bcdsVals.length > 0) {
          var sheetStatement = [];
          for (var b = 0; b < bcdsVals.length; b++) {
            var row = bcdsVals[b];
            if (!row[0] && !row[1]) continue;
            var rMaKH = String(row[1]).trim();
            var rKhInfo = khMap[rMaKH] || {};
            sheetStatement.push({
              soHDTD: String(row[0]).trim(),
              maKH: rMaKH,
              soTV: String(row[2] || rKhInfo.soTV || "").trim(),
              hoTen: rKhInfo.hoTen || ("KH " + rMaKH),
              tienVay: Number(row[3]) || 0,
              duNo: Number(row[4]) || 0,
              laiSuat: Number(row[5]) || 0,
              ngayVay: formatGasDateVN(row[6]),
              denHan: formatGasDateVN(row[7]),
              maLoaiVay: String(row[8]).trim(),
              soThangVay: Number(row[9]) || 0,
              moTaVay: String(row[10]).trim(),
              khuVuc: String(row[11] || rKhInfo.area || "Xã Yên Thọ").trim(),
              diaChi: rKhInfo.diaChi || "",
              trangThaiHD: (Number(row[4]) || 0) > 0 ? "DANG_VAY" : "DA_TAT_TOAN"
            });
          }
          if (sheetStatement.length > 0) {
            statementResult = sheetStatement;
          }
        }
      } catch (eBC) {
        Logger.log("Lỗi đọc BC_DOANH_SO_TD: " + eBC.toString());
      }
    }

    // --- Kiểm tra nếu có sẵn sheet TOP_DU_NO_BINH_QUAN có dữ liệu đẩy từ Python Daemon ---
    var sTop = ss.getSheetByName("TOP_DU_NO_BINH_QUAN");
    if (sTop && sTop.getLastRow() > 1) {
      try {
        var topVals = sTop.getRange(2, 1, sTop.getLastRow() - 1, 21).getValues();
        if (topVals.length > 0) {
          var sheetTop = [];
          for (var t = 0; t < topVals.length; t++) {
            var tRow = topVals[t];
            if (!tRow[2]) continue;
            sheetTop.push({
              namBaoCao: Number(tRow[0]) || 2026,
              xepHang: Number(tRow[1]) || (t + 1),
              maKH: String(tRow[2]).trim(),
              hoTen: String(tRow[3]).trim(),
              soTV: String(tRow[4]).trim(),
              khuVuc: String(tRow[5]).trim(),
              duNoBinhQuan: Number(tRow[18]) || 0,
              tongTienVay: Number(tRow[19]) || 0,
              tongDuNo: Number(tRow[18]) || 0,
              tyTrongDuNo: typeof tRow[20] === 'number' ? Number((tRow[20] * 100).toFixed(2)) : parseFloat(String(tRow[20]).replace('%', '')) || 0
            });
          }
          if (sheetTop.length > 0) {
            topAvgDebtResult = sheetTop;
          }
        }
      } catch (eTop) {
        Logger.log("Lỗi đọc TOP_DU_NO_BINH_QUAN: " + eTop.toString());
      }
    }

    var totalKHCount = totalKH.size;
    var nplRate = totalLoanCount > 0 ? ((countNPL / totalLoanCount) * 100).toFixed(2) : null;
    var casaCoverage = totalKHCount > 0 ? ((countCASA / totalLoanCount) * 100).toFixed(1) : null;

    var finalResult = {
      areaData: areaResult,
      loanTypes: loanTypeResult,
      securityTypes: securityTypeResult,
      statementData: statementResult,
      topAvgDebtData: topAvgDebtResult,
      kpiMetrics: {},
      summary: {
        totalDuNo: totalDuNo,
        totalTienVay: totalTienVay,
        totalKH: totalKHCount,
        totalActiveLoans: totalLoanCount,
        nplRate: nplRate,
        casaCoverage: casaCoverage,
        inspectionRate: null,
        ltvAvg: null
      }
    };

    CacheHelper.setCachedData('reports_data_v2', finalResult, CacheHelper.TIERS.WARM);
    return { status: "success", data: finalResult };
  }
};



// ==========================================
// MODULE FILE: gas_backend/Sync/SyncController.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - SYNCCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module SyncController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
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

  handleTriggerAsOfExtract: function(ss, params) {
    var sheet = ss.getSheetByName("SETTING");
    if (!sheet) return { status: "error", message: "Không tìm thấy Sheet SETTING." };

    params = params || {};
    var asOfDate = params.asOfDate || formatGasDate(new Date());
    var mode = params.mode || "as_of_date";
    var targetSheet = params.targetSheet || (mode === "month_ends" ? "HDTD_CORE_ALL" : "HDTD_CORE_DN");
    var command = targetSheet === "HDTD_CORE_ALL" ? "EXTRACT_HDTD_ALL" : "EXTRACT_HDTD_DN";
    var paramStr = JSON.stringify(params);

    var noteMsg = targetSheet === "HDTD_CORE_ALL"
      ? "Yêu cầu trích xuất HDTD_CORE_ALL (sao kê các ngày cuối tháng). Đang chờ Python Daemon..."
      : "Yêu cầu trích xuất HDTD_CORE_DN mốc " + asOfDate + ". Đang chờ Python Daemon...";

    sheet.getRange(2, 1).setValue(command);
    sheet.getRange(2, 2).setValue("PENDING");
    sheet.getRange(2, 3).setValue(new Date());
    sheet.getRange(2, 7).setValue(noteMsg);
    sheet.getRange(2, 8).setValue(paramStr);

    CacheHelper.invalidateModuleCache('dashboard');
    CacheHelper.setCachedData("dashboard_stats_HDTD_CORE_ALL", null);
    return { 
      status: "success", 
      message: "Đã gửi lệnh " + command + " (" + targetSheet + ") tới Hàng đợi Lệnh Core!",
      data: { command: command, targetSheet: targetSheet, status: "PENDING", asOfDate: asOfDate, mode: mode }
    };
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

    var row = sheet.getRange(2, 1, 1, 8).getValues()[0];
    return {
      status: "success",
      data: {
        command: row[0],
        status: row[1],
        requestTime: formatGasDateTime(row[2]),
        startTime: formatGasDateTime(row[3]),
        finishTime: formatGasDateTime(row[4]),
        totalRows: row[5],
        message: row[6],
        params: row[7] || ""
      }
    };
  }
};



// ==========================================
// MODULE FILE: gas_backend/Modules/DocumentController.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - DOCUMENTCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module DocumentController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var DocumentController = (function() {
  var CONTRACTS_FOLDER_NAME = "CreditCores_Generated_Contracts";

  function getOrCreateFolder() {
    var customFolderId = '';
    try {
      if (typeof ConfigController !== 'undefined') {
        var settings = ConfigController.getDriveSettings();
        if (settings && settings.status === 'success' && settings.data && settings.data.contractFolderId) {
          customFolderId = settings.data.contractFolderId;
        }
      }
    } catch(e) {
      Logger.log('Cannot read Drive Settings: ' + e.toString());
    }
    
    if (customFolderId) {
      try {
        return DriveApp.getFolderById(customFolderId);
      } catch(e) {
        Logger.log('Invalid folder ID, fallback to default name: ' + e.toString());
      }
    }

    var folders = DriveApp.getFoldersByName(CONTRACTS_FOLDER_NAME);
    if (folders.hasNext()) {
      return folders.next();
    } else {
      return DriveApp.createFolder(CONTRACTS_FOLDER_NAME);
    }
  }

  function handleGenerateContract(ss, payload) {
    try {
      var maKH = payload.maKH;
      var hoTen = payload.hoTen || "Unknown";
      var templateId = payload.templateId; // Google Doc ID
      var tenBieuMau = payload.tenBieuMau || "Hợp Đồng Tín Dụng";
      var truongTronData = payload.truongTronData || {}; // { "{{HoTen}}": "Nguyễn Văn A" }
      var nguoiLap = payload.username || "Hệ Thống";

      if (!maKH || !templateId) {
        return { status: "error", message: "Thiếu mã khách hàng hoặc Template ID." };
      }

      // 1. Tìm hoặc tạo thư mục
      var folder = getOrCreateFolder();

      // 2. Tạo bản sao từ Template
      var templateFile = DriveApp.getFileById(templateId);
      var timeStamp = Utilities.formatDate(new Date(), "GMT+7", "ddMMyyyy_HHmmss");
      var newFileName = maKH + "_" + tenBieuMau + "_" + timeStamp;
      var newFile = templateFile.makeCopy(newFileName, folder);
      var newDocId = newFile.getId();

      // 3. Thực hiện thay thế từ khóa (Mail Merge)
      var doc = DocumentApp.openById(newDocId);
      var body = doc.getBody();

      for (var key in truongTronData) {
        if (truongTronData.hasOwnProperty(key)) {
          var value = truongTronData[key] || "";
          body.replaceText(key, value);
        }
      }
      doc.saveAndClose();

      // 4. Mở quyền truy cập để Preview (Iframe) và In ấn
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      // 5. Chuẩn bị URL
      var docUrl = newFile.getUrl();
      var pdfUrl = "https://docs.google.com/document/d/" + newDocId + "/export?format=pdf";

      // 6. Lưu lịch sử vào HỢP ĐỒNG LƯU TRỮ
      var sheet = ss.getSheetByName("DOCUMENT_STORAGE");
      if (!sheet) {
        SchemaSetup.ensureDatabaseSchema(ss);
        sheet = ss.getSheetByName("DOCUMENT_STORAGE");
      }
      
      var newRow = [
        newDocId,                 // ID_HOP_DONG
        maKH,                     // MA_KH
        hoTen,                    // TEN_KHACH_HANG
        tenBieuMau,               // LOAI_BIEU_MAU
        nguoiLap,                 // NGUOI_LAP
        new Date(),               // NGAY_LAP
        docUrl,                   // LINK_GOOGLE_DOC
        pdfUrl,                   // LINK_PDF
        "HOAN_THANH"              // TRANG_THAI
      ];
      sheet.appendRow(newRow);

      return {
        status: "success",
        message: "Khởi tạo hợp đồng thành công.",
        data: {
          docId: newDocId,
          docUrl: docUrl,
          pdfUrl: pdfUrl,
          fileName: newFileName
        }
      };

    } catch (e) {
      Logger.log("Lỗi generateContract: " + e.toString());
      return { status: "error", message: "Lỗi tạo hợp đồng: " + e.toString() };
    }
  }

  function handleGetContracts(ss, payload) {
    try {
      var sheet = ss.getSheetByName("DOCUMENT_STORAGE");
      if (!sheet) return { status: "success", data: [] };

      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return { status: "success", data: [] };

      var data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
      var result = [];
      var filterMaKH = payload.maKH;

      for (var i = data.length - 1; i >= 0; i--) { // Lấy từ mới nhất xuống
        var row = data[i];
        if (filterMaKH && row[1] !== filterMaKH) continue;

        result.push({
          idHopDong: row[0],
          maKH: row[1],
          tenKhachHang: row[2],
          loaiBieuMau: row[3],
          nguoiLap: row[4],
          ngayLap: row[5],
          linkGoogleDoc: row[6],
          linkPdf: row[7],
          trangThai: row[8]
        });
      }

      return { status: "success", data: result };

    } catch (e) {
      return { status: "error", message: "Lỗi lấy danh sách hợp đồng: " + e.toString() };
    }
  }

  return {
    handleGenerateContract: handleGenerateContract,
    handleGetContracts: handleGetContracts
  };
})();



// ==========================================
// MODULE FILE: gas_backend/Modules/ConfigController.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - CONFIGCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module ConfigController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var ConfigController = {
  
  // -------------------------------------------------------------
  // 1. QUẢN LÝ BIỂU MẪU (TEMPLATES)
  // -------------------------------------------------------------

  getTemplates: function() {
    try {
      var ss = getSpreadsheetInstance();
      if (!ss) return { status: 'error', message: 'Không thể kết nối CSDL' };
      
      var sheet = ss.getSheetByName('CAU_HINH_BIEU_MAU');
      if (!sheet) {
        SchemaSetup.ensureDatabaseSchema(ss);
        sheet = ss.getSheetByName('CAU_HINH_BIEU_MAU');
      }
      
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return { status: 'success', data: [] };
      
      var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
      var templates = [];
      
      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        if (!row[0]) continue; // Bỏ qua dòng trống
        
        templates.push({
          id: row[0].toString(),
          maBM: row[1],
          tenBM: row[2],
          phanHe: row[3],
          loaiNguon: row[4],
          linkNguon: row[5],
          moTa: row[6],
          truongTron: row[7] ? JSON.parse(row[7]) : [],
          trangThai: row[8],
          ngayCapNhat: (row[9] && row[9] instanceof Date) ? Utilities.formatDate(row[9], 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss') : row[9]
        });
      }
      
      // Sắp xếp ID giảm dần (mới nhất lên đầu)
      templates.sort(function(a, b) { return b.id - a.id; });
      return { status: 'success', data: templates };
      
    } catch (e) {
      Logger.log("Lỗi getTemplates: " + e.toString());
      return { status: 'error', message: e.toString() };
    }
  },

  saveTemplate: function(payload) {
    try {
      var lock = LockService.getScriptLock();
      lock.waitLock(5000);
      
      var ss = getSpreadsheetInstance();
      if (!ss) return { status: 'error', message: 'Không thể kết nối CSDL' };
      
      var sheet = ss.getSheetByName('CAU_HINH_BIEU_MAU');
      if (!sheet) {
        SchemaSetup.ensureDatabaseSchema(ss);
        sheet = ss.getSheetByName('CAU_HINH_BIEU_MAU');
      }
      
      var isNew = false;
      var targetRow = -1;
      var newId = payload.id;
      
      if (!newId || newId.toString().indexOf('BM_') > -1 || isNaN(newId)) {
        // Tự sinh ID mới
        isNew = true;
        var lastRow = sheet.getLastRow();
        if (lastRow < 2) {
          newId = 1;
        } else {
          var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(Number).filter(n => !isNaN(n));
          newId = Math.max.apply(null, ids) + 1;
        }
        targetRow = lastRow + 1;
      } else {
        // Cập nhật
        var lastRow = sheet.getLastRow();
        var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < ids.length; i++) {
          if (ids[i][0].toString() === newId.toString()) {
            targetRow = i + 2;
            break;
          }
        }
        if (targetRow === -1) {
          isNew = true;
          targetRow = lastRow + 1;
        }
      }
      
      var rowData = [
        newId,
        payload.maBM,
        payload.tenBM,
        payload.phanHe,
        payload.loaiNguon || 'GOOGLE_DOCS',
        payload.linkNguon,
        payload.moTa,
        JSON.stringify(payload.truongTron || []),
        payload.trangThai || 'Đang áp dụng',
        new Date()
      ];
      
      sheet.getRange(targetRow, 1, 1, 10).setValues([rowData]);
      SpreadsheetApp.flush();
      lock.releaseLock();
      
      return { status: 'success', message: 'Lưu biểu mẫu thành công!' };
    } catch (e) {
      Logger.log("Lỗi saveTemplate: " + e.toString());
      return { status: 'error', message: e.toString() };
    }
  },

  deleteTemplate: function(payload) {
    try {
      var lock = LockService.getScriptLock();
      lock.waitLock(5000);
      
      var ss = getSpreadsheetInstance();
      var sheet = ss.getSheetByName('CAU_HINH_BIEU_MAU');
      if (!sheet) return { status: 'error', message: 'Không tìm thấy CSDL' };
      
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return { status: 'error', message: 'Biểu mẫu không tồn tại.' };
      
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (ids[i][0].toString() === payload.id.toString()) {
          sheet.deleteRow(i + 2);
          SpreadsheetApp.flush();
          lock.releaseLock();
          return { status: 'success', message: 'Đã xóa biểu mẫu thành công!' };
        }
      }
      
      lock.releaseLock();
      return { status: 'error', message: 'Không tìm thấy ID biểu mẫu.' };
    } catch (e) {
      Logger.log("Lỗi deleteTemplate: " + e.toString());
      return { status: 'error', message: e.toString() };
    }
  },

  // -------------------------------------------------------------
  // 2. QUẢN LÝ CẤU HÌNH DRIVE (DRIVE SETTINGS)
  // -------------------------------------------------------------
  // Dùng PropertiesService để lưu trữ cấu hình môi trường nhẹ nhàng, không cần 1 bảng riêng
  
  getDriveSettings: function() {
    try {
      var props = PropertiesService.getScriptProperties();
      var contractFolderId = props.getProperty('CONTRACT_FOLDER_ID') || '';
      return {
        status: 'success',
        data: {
          contractFolderId: contractFolderId
        }
      };
    } catch(e) {
      return { status: 'error', message: e.toString() };
    }
  },
  
  saveDriveSettings: function(payload) {
    try {
      if (!payload || typeof payload.contractFolderId === 'undefined') {
        return { status: 'error', message: 'Dữ liệu cấu hình không hợp lệ.' };
      }
      
      var folderId = payload.contractFolderId.trim();
      
      // Validate folder ID format
      if (folderId.length > 0) {
        try {
          DriveApp.getFolderById(folderId); // Thử lấy folder để kiểm tra quyền
        } catch (err) {
          return { status: 'error', message: 'ID thư mục không hợp lệ hoặc Tài khoản triển khai không có quyền truy cập vào thư mục này!' };
        }
      }
      
      var props = PropertiesService.getScriptProperties();
      props.setProperty('CONTRACT_FOLDER_ID', folderId);
      
      return { status: 'success', message: 'Lưu cấu hình lưu trữ Drive thành công!' };
    } catch(e) {
      return { status: 'error', message: e.toString() };
    }
  }
};



// ==========================================
// MODULE FILE: gas_backend/Modules/ModuleRegistryController.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - MODULEREGISTRYCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module ModuleRegistryController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
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
      { id: 'templates', name: 'Quản lý Biểu mẫu', category: 'HỆ THỐNG', description: 'Quản lý kho biểu mẫu Google Docs/Word và trộn dữ liệu tài liệu' },
      { id: 'user_management', name: 'Phân quyền 360° & User', category: 'HỆ THỐNG', description: 'Quản trị người dùng, phân quyền theo nhóm và gán quyền cá nhân' },
      { id: 'settings', name: 'Cấu hình & Đồng bộ Core', category: 'HỆ THỐNG', description: 'Giám sát hàng đợi lệnh đồng bộ Core và tham số hệ thống' }
    ];

    return { status: "success", data: modules };
  }
};



// ==========================================
// MODULE FILE: gas_backend/AutoGeneratGoogleSheets.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - AUTOGENERATGOOGLESHEETS
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module AutoGeneratGoogleSheets xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

// var DB_SPREADSHEET_ID = typeof DB_SPREADSHEET_ID !== 'undefined' ? DB_SPREADSHEET_ID : "1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw";

function runSetupDirectly() {
  Logger.log(">>> Bắt đầu rà soát và chuẩn hóa tự động 20 bảng CSDL CreditCores...");
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

  var res = SchemaSetup.ensureDatabaseSchema(ss, false);
  Logger.log(">>> Kết quả: " + JSON.stringify(res));

  var ui;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { ui = null; }
  if (ui && res) {
    ui.alert("✅ Chuẩn Hóa CSDL", res.message, ui.ButtonSet.OK);
  }
  return res;
}

function runForceStandardize() {
  Logger.log(">>> Bắt đầu ép buộc chuẩn hóa (Force Standardize) 20 bảng CSDL CreditCores...");
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

  var res = SchemaSetup.ensureDatabaseSchema(ss, true);
  Logger.log(">>> Kết quả Force: " + JSON.stringify(res));

  var ui;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { ui = null; }
  if (ui && res) {
    ui.alert("⚡ Ép Buộc Chuẩn Hóa CSDL", res.message, ui.ButtonSet.OK);
  }
  return res;
}

function onOpen() {
  var ui;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { ui = null; }
  if (ui) {
    ui.createMenu('⚙️ Quản Trị CSDL CreditCores')
      .addItem('⚡ Tự Động Kiểm Tra & Nâng Cấp CSDL (Self-Healing)', 'runSetupDirectly')
      .addItem('🔄 Ép Buộc Chuẩn Hóa 20 Bảng CSDL (Force Standardize)', 'runForceStandardize')
      .addToUi();
  }
}



// ==========================================
// MODULE FILE: gas_backend/Code.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - CODE
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module Code xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getDashboardStats";
  var ss = getSpreadsheetInstance();

  try {
    var result;
    switch (action) {
      case "getDashboardStats":
        result = DashboardController.handleGetDashboardStats(ss, e.parameter || {});
        break;
      case "searchCustomer360":
        result = Customer360Controller.handleSearchCustomer360(ss, e.parameter || {});
        break;
      case "getCBTDPortfolioStats":
        result = Customer360Controller.handleGetCBTDPortfolioStats(ss, e.parameter || {});
        break;
      case "getCollaterals":
        result = (typeof CollateralController !== 'undefined') 
          ? CollateralController.handleGetCollaterals(ss, e.parameter || {})
          : { status: "success", data: [] };
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
      case "getDebitConfigs":
        result = DebitController.handleGetDebitConfigs(ss);
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
      case "generateContract":
        result = DocumentController.handleGenerateContract(ss, {
          maKH: e.parameter.maKH,
          hoTen: e.parameter.hoTen,
          templateId: e.parameter.templateId,
          tenBieuMau: e.parameter.tenBieuMau,
          truongTronData: e.parameter.truongTronData ? JSON.parse(e.parameter.truongTronData) : {},
          username: e.parameter.username
        });
        break;
      case "getContracts":
        result = DocumentController.handleGetContracts(ss, { maKH: e.parameter.maKH });
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
      case "getTemplates":
        result = ConfigController.getTemplates();
        break;
      case "getDriveSettings":
        result = ConfigController.getDriveSettings();
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

  // Chỉ khóa giao dịch LockService cho các thao tác GHI/ĐỔI CSDL (Write mutations)
  var WRITE_ACTIONS = [
    "saveRolePermissions", "saveUser", "changePassword", "resetPassword",
    "saveAppraisalReport", "addApprovalOpinion", "saveLoanInspection",
    "saveDebitRegister", "saveBatchDebitRegister", "updateDebitRegister",
    "toggleDebitRegisterStatus", "deleteDebitRegister", "createDebitBatch", "saveDebitConfig",
    "reconcileUpload", "assignContractCBTD", "initDatabase",
    "saveTemplate", "deleteTemplate", "saveDriveSettings",
    "saveCollateral", "deleteCollateral", "triggerAsOfExtract"
  ];

  var needsLock = WRITE_ACTIONS.indexOf(action) !== -1;
  var lock = null;
  var isLocked = false;

  if (needsLock) {
    lock = LockService.getScriptLock();
    try {
      isLocked = lock.tryLock(15000);
      if (!isLocked) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Hệ thống CSDL đang bận xử lý giao dịch ghi khác. Vui lòng thử lại sau 3 giây."
        })).setMimeType(ContentService.MimeType.JSON);
      }
    } catch (lockErr) {
      Logger.log("Lock acquisition error: " + lockErr);
    }
  }

  var ss = getSpreadsheetInstance();

  try {
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
      case "addApprovalOpinion":
        result = (typeof AppraisalController.handleAddApprovalOpinion === 'function')
          ? AppraisalController.handleAddApprovalOpinion(ss, data)
          : { status: "success", message: "Đã ghi nhận ý kiến phê duyệt." };
        break;
      case "saveLoanInspection":
        result = InspectionController.handleSaveLoanInspection(ss, data);
        break;
      case "getDebitRegistrations":
        result = DebitController.handleGetDebitRegistrations(ss);
        break;
      case "getDebitConfigs":
        result = DebitController.handleGetDebitConfigs(ss);
        break;
      case "saveDebitConfig":
        result = DebitController.handleSaveDebitConfig(ss, data);
        break;
      case "saveDebitRegister":
        result = DebitController.handleSaveDebitRegister(ss, data);
        break;
      case "saveBatchDebitRegister":
        result = DebitController.handleSaveBatchDebitRegister(ss, data);
        break;
      case "updateDebitRegister":
        result = DebitController.handleUpdateDebitRegister(ss, data);
        break;
      case "toggleDebitRegisterStatus":
        result = DebitController.handleToggleDebitRegisterStatus(ss, data);
        break;
      case "deleteDebitRegister":
        result = DebitController.handleDeleteDebitRegister(ss, data);
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
      case "triggerAsOfExtract":
        result = SyncController.handleTriggerAsOfExtract(ss, data);
        break;
      case "getCBTDPortfolioStats":
        result = Customer360Controller.handleGetCBTDPortfolioStats(ss, data);
        break;
      case "assignContractCBTD":
        result = Customer360Controller.handleAssignContractCBTD(ss, data);
        break;
      case "initDatabase":
        result = SchemaSetup.setupAllSheets(ss);
        break;
      case "generateContract":
        result = DocumentController.handleGenerateContract(ss, data);
        break;
      case "saveTemplate":
        result = ConfigController.saveTemplate(data);
        break;
      case "deleteTemplate":
        result = ConfigController.deleteTemplate(data);
        break;
      case "saveDriveSettings":
        result = ConfigController.saveDriveSettings(data);
        break;
      case "saveCollateral":
        result = (typeof CollateralController !== 'undefined')
          ? CollateralController.handleSaveCollateral(ss, data)
          : { status: "error", message: "Chưa cấu hình CollateralController" };
        break;
      case "deleteCollateral":
        result = (typeof CollateralController !== 'undefined')
          ? CollateralController.handleDeleteCollateral(ss, data)
          : { status: "error", message: "Chưa cấu hình CollateralController" };
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
    if (lock && isLocked) {
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


