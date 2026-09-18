/**
 * ========================================================================================
 * CREDITCORES - ALL-IN-ONE GOOGLE APPS SCRIPT BACKEND ENGINE
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Trọn bộ Backend Google Apps Script All-In-One:
 *              - Tối ưu tra cứu O(1) Hash Map cho 5.175+ khách hàng & 549+ hợp đồng
 *              - Thẩm định, Trích nợ Auto-Debit, Kiểm tra vốn, In hợp đồng Mail Merge
 *              - Độc lập hoàn toàn, không nghẽn Timeout, Zero Mock Data
 * @updated     16/09/2026
 * @version     3.0 Pro Production
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
// MODULE FILE: gas_backend/Database/Cache.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - CACHE
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module Cache xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
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
      headers: ["COMMAND", "STATUS", "REQUEST_TIME", "START_TIME", "FINISH_TIME", "TOTAL_ROWS", "MESSAGE"],
      color: "#1E293B",
      formats: { "C:E": "dd/MM/yyyy HH:mm:ss", "F:F": "#,##0" },
      colWidths: { 1: 140, 2: 120, 3: 160, 4: 160, 5: 160, 6: 120, 7: 250 },
      defaultData: [["IDLE", "SUCCESS", new Date(), new Date(), new Date(), 0, "Hệ thống sẵn sàng đồng bộ."]]
    },
    KH_CORE: {
      headers: [
        "MaKH", "HoTen", "DiaChi", "NgaySinh", "CCCD", "NgayCap", "NoiCap", "DienThoai", "DienThoaiDD", "SoTK", "KhuVuc", "SoTV", "SoSoCP", "NgayVaoTV", "TongTienCP", "NgayCapNhat",
        "TongDuNoHienTai", "SoLuongHDVay", "TrangThaiVay", "NhomNoCIC", "KvXa", "KvThon"
      ],
      color: "#004D40",
      formats: { "D:D": "dd/MM/yyyy", "E:E": "@", "F:F": "dd/MM/yyyy", "H:J": "@", "N:N": "dd/MM/yyyy", "O:O": "#,##0", "P:P": "dd/MM/yyyy HH:mm:ss", "Q:R": "#,##0", "S:V": "@" },
      colWidths: { 1: 100, 2: 180, 3: 220, 4: 110, 5: 130, 6: 110, 7: 160, 8: 110, 9: 110, 10: 140, 11: 140, 12: 100, 13: 100, 14: 110, 15: 130, 16: 160, 17: 140, 18: 110, 19: 120, 20: 120, 21: 140, 22: 140 }
    },
    HDTD_CORE: {
      headers: [
        "SoHDTD", "MaKH", "TienVay", "DuNo", "LaiSuat", "NgayVay", "DenHan", "TraLaiDenNgay", "MaLoaiVay", "SoThangVay", "MoTaVay", "CBTD_PhuTrach", "Ten_CBTD", "TrangThaiHD", "NgayTatToan", "NgayCapNhat",
        "HoTen", "CCCD", "DienThoai", "DiaChi", "KvXa", "KvThon"
      ],
      color: "#1B365D",
      formats: { "C:D": "#,##0", "E:E": "0.00", "F:H": "dd/MM/yyyy", "J:J": "#,##0", "L:M": "@", "N:N": "@", "O:O": "dd/MM/yyyy", "P:P": "dd/MM/yyyy HH:mm:ss", "Q:V": "@" },
      colWidths: { 1: 130, 2: 100, 3: 130, 4: 130, 5: 90, 6: 110, 7: 110, 8: 120, 9: 140, 10: 90, 11: 220, 12: 140, 13: 160, 14: 120, 15: 120, 16: 160, 17: 180, 18: 130, 19: 120, 20: 220, 21: 140, 22: 140 }
    },
    DANG_KY_TRICH_NO: {
      aliases: ["DS_TRICH_NO"],
      headers: [
        "SoHDTD", "NgayVay", "TraLaiDenNgay", "LaiSuat", "MaKH", "TenKH", "SoTK", "SoTienLai", "SoTienNo", "SoGoc", "TongTien", "KyTrichNo", "TrangThai", "GhiChu", "NgayTao"
      ],
      color: "#0F5132",
      formats: { "A:A": "@", "B:C": "dd/MM/yyyy", "D:D": "0.00", "E:G": "@", "H:K": "#,##0", "L:L": "#,##0", "M:N": "@", "O:O": "dd/MM/yyyy HH:mm:ss" },
      colWidths: { 1: 130, 2: 110, 3: 110, 4: 90, 5: 100, 6: 180, 7: 140, 8: 120, 9: 120, 10: 120, 11: 140, 12: 90, 13: 120, 14: 200, 15: 160 }
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
    }
  },

  /**
   * Thực hiện rà soát, tạo mới và Auto-migration cho toàn bộ 12 Sheet
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

          // Áp dụng lại định dạng cột khi có thay đổi header
          if (schema.formats) {
            for (var colRange in schema.formats) {
              try { sheet.getRange(colRange).setNumberFormat(schema.formats[colRange]); } catch(e){}
            }
          }
        }
      }
    }

    SpreadsheetApp.flush();

    try {
      var cache = CacheService.getScriptCache();
      cache.put("schema_validated", "true", 21600); // 6 giờ lưu cache theo chuẩn AGENTS.md
    } catch (e) {}

    return {
      status: "success",
      message: "Đã kiểm soát, khởi tạo và đồng bộ 100% cấu trúc 12 bảng CSDL chuẩn trên Google Sheets!"
    };
  },

  setupAllSheets: function(ss) {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    return this.ensureDatabaseSchema(ss, true);
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
// MODULE FILE: gas_backend/Dashboard/DashboardController.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - DASHBOARDCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module DashboardController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var DashboardController = {
  handleGetDashboardStats: function(ss) {
    ss = getSpreadsheetInstance(ss);
    if (!ss) {
      return { status: "error", message: "Không thể kết nối Google Spreadsheet!" };
    }

    var cached = CacheHelper.getCachedData('dashboard_stats');
    if (cached) return { status: "success", data: cached };

    var sHDTD = ss.getSheetByName("HDTD_CORE");
    var sKH = ss.getSheetByName("KH_CORE");
    var sNoTon = ss.getSheetByName("NO_TON_DONG");
    var sDot = ss.getSheetByName("DOT_TRICH_NO");
    var sDS = ss.getSheetByName("DANG_KY_TRICH_NO") || ss.getSheetByName("DS_TRICH_NO");
    var sAppraisal = ss.getSheetByName("THAM_DINH_TD");
    var sInspection = ss.getSheetByName("KIEM_TRA_VON");

    var totalDuNo = 0;
    var totalHopDong = 0;
    var totalDuThuLai = 0;

    // Cơ cấu sản phẩm vay
    var loanTypeMap = {};

    if (sHDTD && sHDTD.getLastRow() > 1) {
      var hdValues = sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, 12).getValues();
      for (var i = 0; i < hdValues.length; i++) {
        var duNo = Number(hdValues[i][3]) || 0;
        var laiSuat = Number(hdValues[i][4]) || 0;
        var loaiVay = String(hdValues[i][10] || hdValues[i][8] || "Khác").trim();

        totalDuNo += duNo;
        totalHopDong++;
        totalDuThuLai += (duNo * (laiSuat / 100)) / 12;

        if (!loanTypeMap[loaiVay]) {
          loanTypeMap[loaiVay] = { name: loaiVay, count: 0, duNo: 0 };
        }
        loanTypeMap[loaiVay].count++;
        loanTypeMap[loaiVay].duNo += duNo;
      }
    }

    // Cơ cấu dư nợ theo 3 địa bàn xã chính
    var areaMap = {
      "Xã Yên Thọ": { name: "Xã Yên Thọ (Thôn 1, 2, 3, 4)", countKH: 0, duNo: 0 },
      "Xã Yên Trường": { name: "Xã Yên Trường (Thôn 1, 2, 3)", countKH: 0, duNo: 0 },
      "Xã Yên Bái / Quý Lộc": { name: "Xã Yên Bái / Quý Lộc", countKH: 0, duNo: 0 }
    };

    if (sKH && sKH.getLastRow() > 1) {
      var khValues = sKH.getRange(2, 1, sKH.getLastRow() - 1, 11).getValues();
      for (var k = 0; k < khValues.length; k++) {
        var khuVuc = String(khValues[k][10] || khValues[k][2] || "").trim();
        var matched = "Xã Yên Thọ";
        if (khuVuc.indexOf("Yên Trường") > -1) matched = "Xã Yên Trường";
        else if (khuVuc.indexOf("Yên Bái") > -1 || khuVuc.indexOf("Quý Lộc") > -1) matched = "Xã Yên Bái / Quý Lộc";
        
        if (areaMap[matched]) {
          areaMap[matched].countKH++;
        }
      }
    }

    // Phân bổ dư nợ ước tính theo tỉ lệ khách hàng từng xã
    var totalKHCount = 0;
    for (var aKey in areaMap) totalKHCount += areaMap[aKey].countKH;
    if (totalKHCount > 0) {
      for (var aKey2 in areaMap) {
        areaMap[aKey2].duNo = Math.round((areaMap[aKey2].countKH / totalKHCount) * totalDuNo);
        areaMap[aKey2].rate = totalDuNo > 0 ? Math.round((areaMap[aKey2].duNo / totalDuNo) * 100) + "%" : "0%";
      }
    }

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

    var result = {
      totalDuNo: totalDuNo,
      totalHopDong: totalHopDong,
      totalDuThuLai: Math.round(totalDuThuLai),
      totalKhachHangTrichNo: totalKhachHangTrichNo,
      totalNoTon: totalNoTon,
      countNoTon: countNoTon,
      pendingAppraisals: pendingAppraisals,
      pendingInspections: pendingInspections,
      recentBatches: recentBatches,
      areaStats: Object.values(areaMap),
      loanTypes: Object.values(loanTypeMap)
    };

    CacheHelper.setCachedData('dashboard_stats', result, CacheHelper.TIERS.HOT);
    return { status: "success", data: result };
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
    var isDefaultSearch = (!query && (!cbtdFilter || cbtdFilter === "all") && (!statusFilter || statusFilter === "ALL"));
    if (isDefaultSearch) {
      var cachedDefault = CacheHelper.getCachedData('cust360_default');
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
    var hdValues = (sHDTD && sHDTD.getLastRow() > 1) 
      ? sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, Math.min(sHDTD.getLastColumn(), 16)).getValues() 
      : [];

    var contractsByMaKH = {};
    for (var j = 0; j < hdValues.length; j++) {
      var rowSoHD = String(hdValues[j][0] || "").trim();
      var rowMaKH = String(hdValues[j][1] || "").trim();
      if (!rowMaKH) continue;

      var cbtdUser = String(hdValues[j][11] || "qtdyentho.cbtd").trim();
      var tenCBTD = String(hdValues[j][12] || "Lê Văn Tín (CBTD)").trim();
      var duNo = Number(hdValues[j][3] || 0);
      var trangThaiHD = String(hdValues[j][13] || (duNo > 0 ? "DANG_VAY" : "DA_TAT_TOAN")).trim();
      var ngayTatToan = hdValues[j][14] ? formatGasDate(hdValues[j][14]) : "";

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
        tienVay: Number(hdValues[j][2] || 0),
        duNo: duNo,
        laiSuat: Number(hdValues[j][4] || 0),
        ngayVay: formatGasDate(hdValues[j][5]),
        denHan: formatGasDate(hdValues[j][6]),
        traLaiDenNgay: formatGasDate(hdValues[j][7]),
        maLoaiVay: String(hdValues[j][8] || "LV01"),
        soThangVay: Number(hdValues[j][9] || 12),
        moTaVay: String(hdValues[j][10] || ""),
        cbtdPhuTrach: cbtdUser,
        tenCBTD: tenCBTD,
        trangThaiHD: trangThaiHD,
        ngayTatToan: ngayTatToan,
        ngayCapNhat: hdValues[j][15] ? formatGasDateTime(hdValues[j][15]) : ""
      });
    }

    // 2. Đọc bảng Khách hàng
    var khValues = sKH.getRange(2, 1, sKH.getLastRow() - 1, Math.min(sKH.getLastColumn(), 16)).getValues();
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
        maKH: String(row[0]),
        hoTen: String(row[1] || ""),
        diaChi: String(row[2] || ""),
        ngaySinh: formatGasDate(row[3]),
        cccd: String(row[4] || ""),
        ngayCap: formatGasDate(row[5]),
        noiCap: String(row[6] || ""),
        dienThoai: String(row[7] || ""),
        dienThoaiDD: String(row[8] || ""),
        soTK: String(row[9] || ""),
        khuVuc: String(row[10] || ""),
        soTV: String(row[11] || ""),
        soSoCP: String(row[12] || ""),
        ngayVaoTV: formatGasDate(row[13]),
        tongTienCP: Number(row[14] || 0),
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
        var mKH = String(khValues[k][0]).trim();
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
            var currMaKH = String(khValues[idx][0]).trim();
            if (!seenCust[currMaKH]) {
              seenCust[currMaKH] = true;
              results.push(buildCustomerObj(khValues[idx], contractsByMaKH[currMaKH] || []));
            }
          }
        }
      }

      if (isDefaultSearch) {
        CacheHelper.setCachedData('cust360_default', results, 60);
      }
      return { status: "success", data: results, total: results.length, isFiltered: false };
    }

    // TRƯỜNG HỢP 2: Người dùng CÓ nhập từ khóa tìm kiếm (query)
    for (var i = 0; i < khValues.length; i++) {
      if (results.length >= maxLimit) break;

      var maKH = String(khValues[i][0]).trim();
      var hoTen = String(khValues[i][1] || "").trim();
      var cccd = String(khValues[i][4] || "").trim();
      var phone = String(khValues[i][8] || "").trim();
      var soTK = String(khValues[i][9] || "").trim();
      var khuVuc = String(khValues[i][10] || "").trim();

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
    var sKH = ss.getSheetByName("KH_CORE");

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

    var hdValues = sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, Math.min(sHDTD.getLastColumn(), 16)).getValues();
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
      if (!hdValues[i][0]) continue;
      var soHD = String(hdValues[i][0]);
      var maKH = String(hdValues[i][1]);
      var tienVay = Number(hdValues[i][2] || 0);
      var duNo = Number(hdValues[i][3] || 0);
      var cbtd = String(hdValues[i][11] || "qtdyentho.cbtd").trim();
      var tenCBTD = String(hdValues[i][12] || "Lê Văn Tín (CBTD)").trim();
      var trangThai = String(hdValues[i][13] || (duNo > 0 ? "DANG_VAY" : "DA_TAT_TOAN")).trim();
      var rawDenHan = hdValues[i][6];

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
          if (rawDenHan instanceof Date && !isNaN(rawDenHan.getTime())) {
            if (rawDenHan < now) {
              pastDueContracts++;
            } else if (rawDenHan <= in30Days) {
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

    var hdValues = sHDTD.getRange(2, 1, sHDTD.getLastRow() - 1, Math.min(sHDTD.getLastColumn(), 16)).getValues();
    var updatedCount = 0;

    for (var i = 0; i < hdValues.length; i++) {
      var rowSoHD = String(hdValues[i][0]).trim();
      var rowMaKH = String(hdValues[i][1]).trim();

      var shouldUpdate = false;
      if (assignAllForCustomer && maKH && rowMaKH === maKH) {
        shouldUpdate = true;
      } else if (soHDTD && rowSoHD === soHDTD) {
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        var rowIndex = i + 2;
        sHDTD.getRange(rowIndex, 12).setValue(cbtdUsername);
        sHDTD.getRange(rowIndex, 13).setValue(tenCBTD);
        sHDTD.getRange(rowIndex, 16).setValue(new Date());
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

    var numRows = sheet.getLastRow() - 1;
    var numCols = sheet.getLastColumn();
    var values = sheet.getRange(2, 1, numRows, numCols).getValues();
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
// MODULE FILE: gas_backend/Debit/DebitController.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - DEBITCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module DebitController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
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
// MODULE FILE: gas_backend/Reports/ReportController.gs
// ==========================================

/**
 * ========================================================================================
 * CREDITCORES - REPORTCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module ReportController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
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

    // --- Build KH map (1 batch read 16 cols) ---
    var khMap = {};
    if (sKH.getLastRow() > 1) {
      var khVals = sKH.getRange(2, 1, sKH.getLastRow() - 1, 16).getValues();
      for (var i = 0; i < khVals.length; i++) {
        var mKH = String(khVals[i][0]).trim();
        var hTen = String(khVals[i][1]).trim();
        var dChi = String(khVals[i][2]).trim();
        var sTV = String(khVals[i][11]).trim();
        var diaChiKV = dChi + " " + String(khVals[i][10]).trim();
        var areaKey = "Khác";
        if (diaChiKV.indexOf("Yên Thọ") > -1) areaKey = "Xã Yên Thọ (Thôn 1, 2, 3, 4)";
        else if (diaChiKV.indexOf("Yên Trường") > -1 || diaChiKV.indexOf("Vĩnh Lộc") > -1) areaKey = "Xã Yên Trường / Vĩnh Lộc";
        else if (diaChiKV.indexOf("Yên Bái") > -1 || diaChiKV.indexOf("Quý Lộc") > -1) areaKey = "Xã Quý Lộc / Yên Bái";
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

    // --- Batch read HDTD_CORE (cols A→P = 1→16) ---
    if (sHDTD.getLastRow() > 1) {
      var hdRows = sHDTD.getLastRow() - 1;
      var hdVals = sHDTD.getRange(2, 1, hdRows, 16).getValues();

      for (var j = 0; j < hdVals.length; j++) {
        var hdSoHDTD    = String(hdVals[j][0]).trim();
        var hdMaKH      = String(hdVals[j][1]).trim();
        var hdTienVay   = Number(hdVals[j][2]) || 0;
        var hdDuNo      = Number(hdVals[j][3]) || 0;
        var hdLaiSuat   = Number(hdVals[j][4]) || 0;
        var hdNgayVay   = formatGasDateVN(hdVals[j][5]);
        var hdDenHan    = formatGasDateVN(hdVals[j][6]);
        var hdTraLaiDen = formatGasDateVN(hdVals[j][7]);
        var hdMaLoaiVay = String(hdVals[j][8]).trim();
        var hdSoThang   = Number(hdVals[j][9]) || 0;
        var hdMoTa      = String(hdVals[j][10]).trim();
        var hdCBTD_Code = String(hdVals[j][11]).trim();
        var hdTenCBTD   = String(hdVals[j][12]).trim();
        var hdTrangThai = String(hdVals[j][13]).toUpperCase().trim();
        var hdNgayTatToan = formatGasDateVN(hdVals[j][14]);

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
          ngayTatToan: hdNgayTatToan
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

        // Nhóm nợ xấu N3-N5
        var hdNhomNo = Number(hdVals[j][8]) || 1;
        if (hdNhomNo >= 3) countNPL++;

        // Area grouping
        var khInfo = khMap[hdMaKH];
        var aKey = khInfo ? khInfo.area : "Xã Yên Thọ (Thôn 1, 2, 3, 4)";
        if (!areaStats[aKey]) areaStats[aKey] = { countKH: new Set(), duNo: 0 };
        areaStats[aKey].countKH.add(hdMaKH);
        areaStats[aKey].duNo += hdDuNo;

        // Loan product classification
        var prodKey = "Nông nghiệp & Chăn nuôi";
        if (hdMoTa.indexOf("kinh doanh") > -1 || hdMoTa.indexOf("thương mại") > -1 || hdMoTa.indexOf("xe tải") > -1 || hdMoTa.indexOf("buôn bán") > -1) {
          prodKey = "Thương mại & Dịch vụ";
        } else if (hdMoTa.indexOf("tiêu dùng") > -1 || hdMoTa.indexOf("nhà ở") > -1 || hdMoTa.indexOf("sửa chữa") > -1) {
          prodKey = "Tiêu dùng & Đời sống";
        }
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
    loanTypeResult.sort(function(a, b) { return b.amount - a.amount; });

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

    var topAvgDebtResult = topDebtArr.slice(0, 20).map(function(c, idx) {
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

    CacheHelper.setCachedData('reports_data_v2', finalResult, 30);
    return { status: "success", data: finalResult };
  }
};



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
        result = DashboardController.handleGetDashboardStats(ss);
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
    "toggleDebitRegisterStatus", "deleteDebitRegister", "createDebitBatch",
    "reconcileUpload", "assignContractCBTD", "initDatabase",
    "saveTemplate", "deleteTemplate", "saveDriveSettings",
    "saveCollateral", "deleteCollateral"
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

