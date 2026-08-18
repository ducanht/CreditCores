/**
 * ========================================================================================
 * HỆ THỐNG QUẢN LÝ TÍN DỤNG & TRÍCH NỢ AUTOMATION (CREDITCORES)
 * TOÀN BỘ BACKEND REST API + PHÂN QUYỀN 360° ĐA CHỨC NĂNG + TỰ ĐỘNG CẬP NHẬT CSDL GOOGLE SHEETS
 * TỐI ƯU HÓA HẠN NGẠCH TÀI KHOẢN GOOGLE FREE (CACHING + BATCH OPERATIONS)
 * CHUẨN HÓA NGÀY THÁNG HIỂN THỊ VIỆT NAM (dd/MM/yyyy) & QUỐC TẾ GOOGLE SHEETS
 * 
 * Google Apps Script Web App Project:
 * https://script.google.com/d/1NI0PAQ56mfyrEALtn_MtaJ2EBwD0lS3TUOyHSOD72eiG8lEh9LlY_1vp/edit
 * Google Sheets Database:
 * https://docs.google.com/spreadsheets/d/1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw/edit
 * ========================================================================================
 */

// 1. CẤU HÌNH ID GOOGLE SHEETS CƠ SỞ DỮ LIỆU
const DB_SPREADSHEET_ID = "1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw";

/**
 * TIỆN ÍCH CHUẨN HÓA NGÀY THÁNG GOOGLE APPS SCRIPT (VIETNAM STANDARD dd/MM/yyyy)
 */
function formatGasDate(val) {
  if (!val) return "";
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return "";
    return Utilities.formatDate(val, "GMT+7", "dd/MM/yyyy");
  }
  var str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    var parts = str.substring(0, 10).split('-');
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }
  return str;
}

function formatGasDateTime(val) {
  if (!val) return "";
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return "";
    return Utilities.formatDate(val, "GMT+7", "dd/MM/yyyy HH:mm:ss");
  }
  return String(val);
}

function parseGasDateToSheet(val) {
  if (!val) return "";
  if (val instanceof Date) return val;
  var str = String(val).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    var p = str.split('/');
    return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    var p2 = str.split('-');
    return new Date(parseInt(p2[0], 10), parseInt(p2[1], 10) - 1, parseInt(p2[2], 10));
  }
  return str;
}

/**
 * GOOGLE FREE QUOTA CACHE LAYER (ScriptCache)
 * Giảm tải 90% số lần đọc Google Sheets API, chống vượt hạn ngạch tài khoản miễn phí
 */
function getCachedData(key) {
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(key);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    Logger.log("Cache get error: " + e.message);
  }
  return null;
}

function setCachedData(key, data, ttlSeconds) {
  try {
    var cache = CacheService.getScriptCache();
    var jsonStr = JSON.stringify(data);
    if (jsonStr.length < 90000) {
      cache.put(key, jsonStr, ttlSeconds || 25);
    }
  } catch (e) {
    Logger.log("Cache set error: " + e.message);
  }
}

function clearCacheKeys(keys) {
  try {
    var cache = CacheService.getScriptCache();
    cache.removeAll(keys);
  } catch (e) {
    Logger.log("Cache clear error: " + e.message);
  }
}

/**
 * DANH MỤC PHÂN HỆ NGHIỆP VỤ MỞ RỘNG (MODULE REGISTRY)
 */
const DEFAULT_SYSTEM_MODULES = [
  { id: 'dashboard', label: 'Dashboard Quản trị', description: 'Xem tổng quan KPI, biểu đồ dư nợ, dự thu và tiến độ' },
  { id: 'customer360', label: 'Tra cứu KH & HĐ 360°', description: 'Tra cứu thông tin khách hàng, khế ước, vốn góp và tài khoản' },
  { id: 'appraisal', label: 'Thẩm định Tín dụng & TSĐB', description: 'Lập báo cáo thẩm định, định giá TSĐB, chấm điểm CIC và duyệt hạn mức' },
  { id: 'inspection', label: 'Kiểm tra Sử dụng Vốn', description: 'Lập biên bản kiểm tra sử dụng vốn sau giải ngân (thực địa/chứng từ)' },
  { id: 'debit_register', label: 'Đăng ký Dịch vụ Trích nợ', description: 'Tiếp nhận và quản lý thỏa thuận ủy quyền trích nợ theo kỳ' },
  { id: 'debit_batch', label: 'Khởi tạo & Chạy đợt Trích nợ', description: 'Tự động tính nợ tồn + lãi + gốc và xuất file lệnh CoreBanking' },
  { id: 'reconciliation', label: 'Đối soát Kết quả Core', description: 'Upload file kết quả, đối soát tự động và phân loại 3 trạng thái' },
  { id: 'debt_warning', label: 'Sổ Theo dõi Nợ tồn đọng', description: 'Quản lý danh sách nợ chưa thu được và cảnh báo đôn đốc thu hồi' },
  { id: 'reports', label: 'Báo cáo Thống kê & Phân tích', description: 'Báo cáo đa chiều theo địa bàn 3 xã và cơ cấu sản phẩm vay' },
  { id: 'user_management', label: 'Phân quyền 360° & Tài khoản', description: 'Quản lý người dùng, phân nhóm và cấu hình quyền chi tiết từng chức năng' },
  { id: 'settings', label: 'Cấu hình & Đồng bộ Core', description: 'Điều khiển hàng đợi SETTING và giám sát Python Daemon' }
];

/**
 * TỰ ĐỘNG KIỂM TRA & NÂNG CẤP CẤU TRÚC SHEETS (SELF-HEALING AUTO-MIGRATION)
 */
function getSpreadsheet() {
  let ss;
  if (DB_SPREADSHEET_ID) {
    try {
      ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID);
    } catch (e) {
      Logger.log("Lỗi mở Spreadsheet theo ID: " + e.message);
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  if (ss) {
    ensureDatabaseSchema(ss);
  }
  return ss;
}

function runSetupDirectly() {
  Logger.log(">>> Bắt đầu khởi tạo CSDL với Google Sheet ID: " + DB_SPREADSHEET_ID);
  setupAllSheets(DB_SPREADSHEET_ID);
}

function onOpen() {
  let ui;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { ui = null; }
  if (ui) {
    ui.createMenu('Hệ thống Tín dụng')
      .addItem('Khởi tạo / Tự động Đồng bộ CSDL', 'runSetupDirectly')
      .addToUi();
  }
}

/**
 * XỬ LÝ GET REQUEST (REST API READ OPERATIONS)
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || 'getDashboardStats';
    let result = {};

    switch (action) {
      case 'initDatabase':
        result = handleInitDatabase();
        break;
      case 'login':
        result = handleLogin(params.username, params.passwordHash);
        break;
      case 'getDashboardStats':
        result = handleGetDashboardStats();
        break;
      case 'searchCustomer360':
        result = handleSearchCustomer360(params.query || '');
        break;
      case 'getAppraisals':
        result = handleGetAppraisals();
        break;
      case 'getInspections':
        result = handleGetInspections();
        break;
      case 'getDebitRegistrations':
        result = handleGetDebitRegistrations();
        break;
      case 'getDebitBatches':
        result = handleGetDebitBatches();
        break;
      case 'getDebitBatchDetail':
        result = handleGetDebitBatchDetail(params.maDot);
        break;
      case 'getDebtWarnings':
        result = handleGetDebtWarnings();
        break;
      case 'getReports':
        result = handleGetReports();
        break;
      case 'getSyncStatus':
        result = handleGetSyncStatus();
        break;
      case 'getUserList':
        result = handleGetUserList();
        break;
      case 'getRolesAndPermissions':
        result = handleGetRolesAndPermissions();
        break;
      default:
        result = { status: 'error', message: 'Hành động không hợp lệ: ' + action };
    }

    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

/**
 * XỬ LÝ POST REQUEST (REST API WRITE & MUTATION OPERATIONS)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Tránh Race Condition
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = {};
      }
    }

    const action = payload.action || (e && e.parameter && e.parameter.action);
    let result = {};

    switch (action) {
      case 'login':
        result = handleLogin(payload.username, payload.passwordHash);
        break;
      case 'changePassword':
        result = handleChangePassword(payload.username, payload.oldPasswordHash, payload.newPasswordHash);
        break;
      case 'saveUser':
        result = handleSaveUser(payload.data);
        break;
      case 'resetPassword':
        result = handleResetPassword(payload.username, payload.newPasswordHash);
        break;
      case 'saveRolePermissions':
        result = handleSaveRolePermissions(payload.data);
        break;
      case 'initDatabase':
        result = handleInitDatabase();
        break;
      case 'saveAppraisalReport':
        result = handleSaveAppraisalReport(payload.data);
        break;
      case 'saveLoanInspection':
        result = handleSaveLoanInspection(payload.data);
        break;
      case 'saveDebitRegister':
        result = handleSaveDebitRegister(payload.data);
        break;
      case 'createDebitBatch':
        result = handleCreateDebitBatch(payload.data);
        break;
      case 'reconcileUpload':
        result = handleReconcileUpload(payload.data);
        break;
      case 'triggerSqlSync':
        result = handleTriggerSqlSync();
        break;
      default:
        result = { status: 'error', message: 'Hành động POST không hợp lệ: ' + action };
    }

    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  } finally {
    try { lock.releaseLock(); } catch(e){}
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================================================================
// 2. TỰ ĐỘNG NÂNG CẤP VÀ ĐỒNG BỘ CẤU TRÚC 11 SHEETS (DYNAMIC SCHEMA MIGRATION)
// ========================================================================================

function ensureDatabaseSchema(ss) {
  try {
    // 1. Kiểm tra sheet ROLES
    if (!ss.getSheetByName("ROLES")) {
      setupSheet(ss, "ROLES", [
        { name: "RoleCode", width: 120, align: "center", format: "@" },
        { name: "RoleName", width: 180, align: "left", format: "@" },
        { name: "Permissions", width: 350, align: "left", format: "@" },
        { name: "Description", width: 250, align: "left", format: "@" },
        { name: "UpdatedAt", width: 160, align: "center", format: "dd/MM/yyyy HH:mm:ss" }
      ], 1, 0, "#4a148c");

      const roleSheet = ss.getSheetByName("ROLES");
      roleSheet.getRange(2, 1, 4, 5).setValues([
        ["ADMIN", "Quản Trị Viên Hệ Thống", JSON.stringify(DEFAULT_SYSTEM_MODULES.map(m => m.id)), "Toàn quyền trên toàn bộ các phân hệ", Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss")],
        ["CBTD", "Cán Bộ Tín Dụng", JSON.stringify(['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_register', 'debt_warning', 'reports']), "Thẩm định, kiểm tra vốn và quản lý nợ", Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss")],
        ["KETOAN", "Kế Toán Viên", JSON.stringify(['dashboard', 'customer360', 'debit_register', 'debit_batch', 'reconciliation', 'debt_warning', 'reports']), "Trích nợ tự động và đối soát hạch toán", Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss")],
        ["LANHDAO", "Ban Giám Đốc / Lãnh Đạo", JSON.stringify(['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_batch', 'reconciliation', 'debt_warning', 'reports']), "Phê duyệt, đối soát và báo cáo thống kê", Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss")]
      ]);
    }

    // 2. Kiểm tra sheet USERS
    if (!ss.getSheetByName("USERS")) {
      setupSheet(ss, "USERS", [
        { name: "Username", width: 120, align: "center", format: "@" },
        { name: "PasswordHash", width: 220, align: "center", format: "@" },
        { name: "FullName", width: 180, align: "left", format: "@" },
        { name: "Role", width: 120, align: "center", format: "@" },
        { name: "CustomPermissions", width: 300, align: "left", format: "@" },
        { name: "Status", width: 110, align: "center", format: "@" },
        { name: "CreatedAt", width: 160, align: "center", format: "dd/MM/yyyy HH:mm:ss" },
        { name: "LastLogin", width: 160, align: "center", format: "dd/MM/yyyy HH:mm:ss" }
      ], 1, 0, "#0d47a1");

      const userSheet = ss.getSheetByName("USERS");
      userSheet.getRange(2, 1, 4, 8).setValues([
        ["admin", "7676aaafb027c825bd9abab78b234070e702752f625b752e55e55b48e607e358", "Quản Trị Viên Hệ Thống", "ADMIN", "[]", "ACTIVE", "18/08/2026 08:00:00", "18/08/2026 08:00:00"],
        ["cbtd", "3e00a18bcfd6744fee22728d750f00c48dfa75a3bde2002f9ce53480d72d2cc0", "Lê Văn Tín (Cán Bộ Tín Dụng)", "CBTD", "[]", "ACTIVE", "18/08/2026 08:00:00", "---"],
        ["ketoan", "fad6fda10dd6d54384c03532eb64b86b7ab3bfba4b258a83646ca8ef0d4be98e", "Nguyễn Thị Hằng (Kế Toán Viên)", "KETOAN", "[]", "ACTIVE", "18/08/2026 08:00:00", "---"],
        ["lanhdao", "cbe973fb461f4ab4007d2a1c2da904992d41db551702603c5f7a93e16da4750d", "Trần Đình Trọng (Giám Đốc)", "LANHDAO", "[]", "ACTIVE", "18/08/2026 08:00:00", "---"]
      ]);
    } else {
      const uSheet = ss.getSheetByName("USERS");
      if (uSheet.getLastColumn() === 7) {
        uSheet.insertColumnAfter(4);
        uSheet.getRange(1, 5).setValue("CustomPermissions").setFontWeight("bold").setFontColor("#fff").setBackground("#0d47a1").setHorizontalAlignment("center");
        uSheet.setColumnWidth(5, 300);
      }
    }

    // 3. Đảm bảo các sheet nghiệp vụ khác luôn tồn tại
    const otherSheets = ["SETTING", "KH_CORE", "HDTD_CORE", "DS_TRICH_NO", "DOT_TRICH_NO", "LICH_SU_GIAO_DICH", "NO_TON_DONG", "BAO_CAO_THAM_DINH", "KIEM_TRA_VON"];
    let needFullSetup = false;
    otherSheets.forEach(sName => {
      if (!ss.getSheetByName(sName)) needFullSetup = true;
    });

    if (needFullSetup) {
      setupAllSheets(ss.getId());
    }
  } catch (err) {
    Logger.log("Lỗi tự động nâng cấp cấu trúc CSDL: " + err.message);
  }
}

function handleInitDatabase() {
  setupAllSheets(DB_SPREADSHEET_ID);
  clearCacheKeys(['stats', 'roles', 'users', 'debt_warnings']);
  return { status: 'success', message: 'Đã khởi tạo thành công toàn bộ 11 bảng CSDL trên Google Sheets!' };
}

function setupAllSheets(targetSheetId) {
  let ss;
  const finalSheetId = targetSheetId || DB_SPREADSHEET_ID;

  if (finalSheetId) {
    try {
      ss = SpreadsheetApp.openById(finalSheetId);
    } catch (e) {
      throw new Error("Không thể mở Google Sheet ID: " + finalSheetId);
    }
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  // 1. ROLES
  setupSheet(ss, "ROLES", [
    { name: "RoleCode", width: 120, align: "center", format: "@" },
    { name: "RoleName", width: 180, align: "left", format: "@" },
    { name: "Permissions", width: 350, align: "left", format: "@" },
    { name: "Description", width: 250, align: "left", format: "@" },
    { name: "UpdatedAt", width: 160, align: "center", format: "dd/MM/yyyy HH:mm:ss" }
  ], 1, 0, "#4a148c");

  // 2. USERS
  setupSheet(ss, "USERS", [
    { name: "Username", width: 120, align: "center", format: "@" },
    { name: "PasswordHash", width: 220, align: "center", format: "@" },
    { name: "FullName", width: 180, align: "left", format: "@" },
    { name: "Role", width: 120, align: "center", format: "@" },
    { name: "CustomPermissions", width: 300, align: "left", format: "@" },
    { name: "Status", width: 110, align: "center", format: "@" },
    { name: "CreatedAt", width: 160, align: "center", format: "dd/MM/yyyy HH:mm:ss" },
    { name: "LastLogin", width: 160, align: "center", format: "dd/MM/yyyy HH:mm:ss" }
  ], 1, 0, "#0d47a1");

  // 3. SETTING
  setupSheet(ss, "SETTING", [
    { name: "COMMAND", width: 130, align: "center", format: "@" },
    { name: "STATUS", width: 130, align: "center", format: "@" },
    { name: "REQUEST_TIME", width: 160, align: "center", format: "dd/MM/yyyy HH:mm:ss" },
    { name: "START_TIME", width: 160, align: "center", format: "dd/MM/yyyy HH:mm:ss" },
    { name: "FINISH_TIME", width: 160, align: "center", format: "dd/MM/yyyy HH:mm:ss" },
    { name: "TOTAL_ROWS", width: 120, align: "right", format: "#,##0" },
    { name: "MESSAGE", width: 250, align: "left", format: "@" }
  ], 1, 0, "#2c3e50");

  // 4. KH_CORE
  setupSheet(ss, "KH_CORE", [
    { name: "MaKH", width: 100, align: "center", format: "@" },
    { name: "HoTen", width: 180, align: "left", format: "@" },
    { name: "DiaChi", width: 220, align: "left", format: "@" },
    { name: "NgaySinh", width: 110, align: "center", format: "dd/MM/yyyy" },
    { name: "CCCD", width: 120, align: "center", format: "@" },
    { name: "NgayCap", width: 110, align: "center", format: "dd/MM/yyyy" },
    { name: "NoiCap", width: 160, align: "left", format: "@" },
    { name: "DienThoai", width: 110, align: "center", format: "@" },
    { name: "DienThoaiDD", width: 110, align: "center", format: "@" },
    { name: "SoTK", width: 140, align: "center", format: "@" },
    { name: "KhuVuc", width: 140, align: "left", format: "@" },
    { name: "SoTV", width: 100, align: "center", format: "@" },
    { name: "SoSoCP", width: 100, align: "center", format: "@" },
    { name: "NgayVaoTV", width: 110, align: "center", format: "dd/MM/yyyy" },
    { name: "TongTienCP", width: 130, align: "right", format: "#,##0" }
  ], 1, 2, "#004d40");

  // 5. HDTD_CORE
  setupSheet(ss, "HDTD_CORE", [
    { name: "SoHDTD", width: 120, align: "center", format: "@" },
    { name: "MaKH", width: 100, align: "center", format: "@" },
    { name: "TienVay", width: 130, align: "right", format: "#,##0" },
    { name: "DuNo", width: 130, align: "right", format: "#,##0" },
    { name: "LaiSuat", width: 90, align: "right", format: "0.00" },
    { name: "NgayVay", width: 110, align: "center", format: "dd/MM/yyyy" },
    { name: "DenHan", width: 110, align: "center", format: "dd/MM/yyyy" },
    { name: "TraLaiDenNgay", width: 120, align: "center", format: "dd/MM/yyyy" },
    { name: "MaLoaiVay", width: 100, align: "center", format: "@" },
    { name: "SoThangVay", width: 90, align: "center", format: "#,##0" },
    { name: "MoTaVay", width: 200, align: "left", format: "@" }
  ], 1, 2, "#1b365d");

  // 6. DS_TRICH_NO
  setupSheet(ss, "DS_TRICH_NO", [
    { name: "MaKH", width: 100, align: "center", format: "@" },
    { name: "HoTen", width: 180, align: "left", format: "@" },
    { name: "GTTT", width: 130, align: "center", format: "@" },
    { name: "DiaChi", width: 220, align: "left", format: "@" },
    { name: "SoTK", width: 140, align: "center", format: "@" },
    { name: "KyTrich", width: 90, align: "center", format: "#,##0" },
    { name: "TrangThai", width: 120, align: "center", format: "@" },
    { name: "GhiChu", width: 200, align: "left", format: "@" }
  ], 1, 1, "#0f5132");

  // 7. DOT_TRICH_NO
  setupSheet(ss, "DOT_TRICH_NO", [
    { name: "MaDot", width: 120, align: "center", format: "@" },
    { name: "ThangNam", width: 100, align: "center", format: "@" },
    { name: "KyTrich", width: 90, align: "center", format: "#,##0" },
    { name: "TongPhaiThu", width: 140, align: "right", format: "#,##0" },
    { name: "TongDaTrich", width: 140, align: "right", format: "#,##0" },
    { name: "TongConNo", width: 140, align: "right", format: "#,##0" },
    { name: "NgayTao", width: 160, align: "center", format: "dd/MM/yyyy HH:mm" },
    { name: "TrangThai", width: 130, align: "center", format: "@" }
  ], 1, 1, "#4a148c");

  // 8. LICH_SU_GIAO_DICH
  setupSheet(ss, "LICH_SU_GIAO_DICH", [
    { name: "IDGiaoDich", width: 140, align: "center", format: "@" },
    { name: "MaDot", width: 120, align: "center", format: "@" },
    { name: "MaKH", width: 100, align: "center", format: "@" },
    { name: "SoHDTD", width: 120, align: "center", format: "@" },
    { name: "SoTK", width: 140, align: "center", format: "@" },
    { name: "PhaiThuGoc", width: 130, align: "right", format: "#,##0" },
    { name: "PhaiThuLai", width: 130, align: "right", format: "#,##0" },
    { name: "NoTonTruoc", width: 130, align: "right", format: "#,##0" },
    { name: "TongPhaiThu", width: 140, align: "right", format: "#,##0" },
    { name: "DaTrich", width: 130, align: "right", format: "#,##0" },
    { name: "ConNo", width: 130, align: "right", format: "#,##0" },
    { name: "KetQua", width: 130, align: "center", format: "@" },
    { name: "LyDoLoi", width: 180, align: "left", format: "@" },
    { name: "NgayCapNhat", width: 160, align: "center", format: "dd/MM/yyyy HH:mm" }
  ], 1, 1, "#b71c1c");

  // 9. NO_TON_DONG
  setupSheet(ss, "NO_TON_DONG", [
    { name: "MaKH", width: 100, align: "center", format: "@" },
    { name: "SoHDTD", width: 120, align: "center", format: "@" },
    { name: "GocTon", width: 130, align: "right", format: "#,##0" },
    { name: "LaiTon", width: 130, align: "right", format: "#,##0" },
    { name: "TongNoTon", width: 140, align: "right", format: "#,##0" },
    { name: "KyPhatSinh", width: 120, align: "center", format: "@" },
    { name: "TrangThai", width: 120, align: "center", format: "@" },
    { name: "NgayCapNhat", width: 160, align: "center", format: "dd/MM/yyyy HH:mm" }
  ], 1, 1, "#e65100");

  // 10. BAO_CAO_THAM_DINH
  setupSheet(ss, "BAO_CAO_THAM_DINH", [
    { name: "MaBCTD", width: 120, align: "center", format: "@" },
    { name: "MaKH", width: 100, align: "center", format: "@" },
    { name: "HoTen", width: 180, align: "left", format: "@" },
    { name: "DeXuatVay", width: 130, align: "right", format: "#,##0" },
    { name: "DuyetVay", width: 130, align: "right", format: "#,##0" },
    { name: "ThoiHanThang", width: 90, align: "center", format: "#,##0" },
    { name: "LaiSuatDuyet", width: 90, align: "right", format: "0.00" },
    { name: "ThuNhapThang", width: 130, align: "right", format: "#,##0" },
    { name: "XepHangCIC", width: 110, align: "center", format: "@" },
    { name: "LoaiTSBD", width: 160, align: "left", format: "@" },
    { name: "ChuSoHuuTSBD", width: 160, align: "left", format: "@" },
    { name: "MoTaTSBD", width: 250, align: "left", format: "@" },
    { name: "GiaTriTSBD", width: 130, align: "right", format: "#,##0" },
    { name: "TyLeLTV", width: 90, align: "right", format: "0.00%" },
    { name: "HinhAnhTSBD", width: 220, align: "left", format: "@" },
    { name: "HinhAnhThamDinh", width: 220, align: "left", format: "@" },
    { name: "MucDoRuiRo", width: 110, align: "center", format: "@" },
    { name: "KetLuan", width: 140, align: "center", format: "@" },
    { name: "NgayLap", width: 110, align: "center", format: "dd/MM/yyyy" },
    { name: "CanBoThamDinh", width: 140, align: "left", format: "@" }
  ], 1, 1, "#1a237e");

  // 11. KIEM_TRA_VON
  setupSheet(ss, "KIEM_TRA_VON", [
    { name: "MaBBKT", width: 120, align: "center", format: "@" },
    { name: "SoHDTD", width: 120, align: "center", format: "@" },
    { name: "MaKH", width: 100, align: "center", format: "@" },
    { name: "HoTen", width: 180, align: "left", format: "@" },
    { name: "NgayKiemTra", width: 110, align: "center", format: "dd/MM/yyyy" },
    { name: "HinhThuc", width: 110, align: "center", format: "@" },
    { name: "DanhGiaMucDich", width: 130, align: "center", format: "@" },
    { name: "MucDoRuiRo", width: 110, align: "center", format: "@" },
    { name: "MoTaThucTe", width: 250, align: "left", format: "@" },
    { name: "HinhAnhKiemTra", width: 220, align: "left", format: "@" },
    { name: "CanBoKiemTra", width: 140, align: "left", format: "@" }
  ], 1, 1, "#37474f");

  seedSampleData(ss);
  SpreadsheetApp.flush();
}

function setupSheet(ss, sheetName, columns, frozenRows, frozenCols, headerBg) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  sheet.clear();
  sheet.setFrozenRows(0);
  sheet.setFrozenColumns(0);

  const numCols = columns.length;
  if (sheet.getMaxColumns() < numCols) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), numCols - sheet.getMaxColumns());
  }

  const headers = columns.map(c => c.name);
  const headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setValues([headers]);
  headerRange.setFontWeight("bold");
  headerRange.setFontColor("#ffffff");
  headerRange.setBackground(headerBg || "#1b365d");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 38);

  columns.forEach((col, index) => {
    const colIndex = index + 1;
    sheet.setColumnWidth(colIndex, col.width || 120);
    const dataRange = sheet.getRange(2, colIndex, Math.max(sheet.getMaxRows() - 1, 1), 1);
    if (col.format) dataRange.setNumberFormat(col.format);
    if (col.align) dataRange.setHorizontalAlignment(col.align);
  });

  if (frozenRows > 0) sheet.setFrozenRows(frozenRows);
  if (frozenCols > 0) sheet.setFrozenColumns(frozenCols);

  sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 10), numCols).setFontFamily("Roboto");
}

function seedSampleData(ss) {
  // USERS
  const userSheet = ss.getSheetByName("USERS");
  if (userSheet && userSheet.getLastRow() < 2) {
    userSheet.getRange(2, 1, 4, 8).setValues([
      ["admin", "7676aaafb027c825bd9abab78b234070e702752f625b752e55e55b48e607e358", "Quản Trị Viên Hệ Thống", "ADMIN", "[]", "ACTIVE", "18/08/2026 08:00:00", "18/08/2026 08:00:00"],
      ["cbtd", "3e00a18bcfd6744fee22728d750f00c48dfa75a3bde2002f9ce53480d72d2cc0", "Lê Văn Tín (Cán Bộ Tín Dụng)", "CBTD", "[]", "ACTIVE", "18/08/2026 08:00:00", "---"],
      ["ketoan", "fad6fda10dd6d54384c03532eb64b86b7ab3bfba4b258a83646ca8ef0d4be98e", "Nguyễn Thị Hằng (Kế Toán Viên)", "KETOAN", "[]", "ACTIVE", "18/08/2026 08:00:00", "---"],
      ["lanhdao", "cbe973fb461f4ab4007d2a1c2da904992d41db551702603c5f7a93e16da4750d", "Trần Đình Trọng (Giám Đốc)", "LANHDAO", "[]", "ACTIVE", "18/08/2026 08:00:00", "---"]
    ]);
  }

  // SETTING
  const settingSheet = ss.getSheetByName("SETTING");
  if (settingSheet && settingSheet.getLastRow() < 2) {
    settingSheet.getRange("A2:G2").setValues([[
      "IDLE", "SUCCESS", "18/08/2026 08:00:00", "18/08/2026 08:00:01", "18/08/2026 08:00:05", 342, "Hệ thống vận hành bình thường. Sẵn sàng nhận lệnh."
    ]]);
  }

  // KH_CORE
  const khSheet = ss.getSheetByName("KH_CORE");
  if (khSheet && khSheet.getLastRow() < 2) {
    khSheet.getRange(2, 1, 3, 15).setValues([
      ["KH008892", "NGUYỄN VĂN AN", "Thôn 3, Xã Yên Thọ", "15/05/1985", "038086012345", "15/05/2021", "Cục CSQLHC về TTXH", "02373850123", "0912345678", "3500205123456", "Thôn 3, Yên Thọ", "TV-0892", "CP-0412", "10/01/2018", 15000000],
      ["KH009102", "LÊ THỊ MAI", "Thôn 1, Xã Yên Trường", "20/10/1990", "038190098765", "10/08/2020", "CA Tỉnh Thanh Hóa", "02373850999", "0988123456", "3500205987654", "Thôn 1, Yên Trường", "TV-0910", "CP-0511", "15/03/2019", 20000000],
      ["KH007415", "TRẦN VĂN QUÂN", "Thôn 5, Xã Yên Bái", "08/12/1979", "038079001122", "12/04/2022", "Cục CSQLHC về TTXH", "02373850888", "0903456789", "3500205556677", "Thôn 5, Yên Bái", "TV-0741", "CP-0320", "20/11/2016", 30000000]
    ]);
  }

  // HDTD_CORE
  const hdtdSheet = ss.getSheetByName("HDTD_CORE");
  if (hdtdSheet && hdtdSheet.getLastRow() < 2) {
    hdtdSheet.getRange(2, 1, 4, 11).setValues([
      ["KU-2025-0982", "KH008892", 300000000, 250000000, 9.50, "15/08/2025", "15/08/2026", "15/07/2026", "LV01", 12, "Cho vay phát triển chăn nuôi bò sữa"],
      ["KU-2026-0145", "KH008892", 300000000, 200000000, 10.20, "10/02/2026", "10/02/2028", "10/07/2026", "LV03", 24, "Cho vay kinh doanh vật tư nông nghiệp"],
      ["KU-2026-0312", "KH009102", 200000000, 150000000, 9.80, "05/03/2026", "05/03/2028", "05/07/2026", "LV02", 24, "Cho vay trồng trọt công nghệ cao"],
      ["KU-2025-0811", "KH007415", 500000000, 420000000, 9.50, "20/11/2025", "20/11/2027", "20/07/2026", "LV03", 24, "Cho vay mua xe tải vận chuyển nông sản"]
    ]);
  }

  // DS_TRICH_NO
  const dsTrichSheet = ss.getSheetByName("DS_TRICH_NO");
  if (dsTrichSheet && dsTrichSheet.getLastRow() < 2) {
    dsTrichSheet.getRange(2, 1, 3, 8).setValues([
      ["KH008892", "NGUYỄN VĂN AN", "038086012345", "Thôn 3, Xã Yên Thọ", "3500205123456", 2, "Hieu luc", "Ủy quyền trích nợ tự động ngày 15"],
      ["KH009102", "LÊ THỊ MAI", "038190098765", "Thôn 1, Xã Yên Trường", "3500205987654", 1, "Hieu luc", "Ủy quyền trích nợ tự động ngày 05"],
      ["KH007415", "TRẦN VĂN QUÂN", "038079001122", "Thôn 5, Xã Yên Bái", "3500205556677", 3, "Hieu luc", "Ủy quyền trích nợ tự động ngày 25"]
    ]);
  }

  // DOT_TRICH_NO
  const dotTrichSheet = ss.getSheetByName("DOT_TRICH_NO");
  if (dotTrichSheet && dotTrichSheet.getLastRow() < 2) {
    dotTrichSheet.getRange(2, 1, 2, 8).setValues([
      ["DOT-202608-K1", "202608", 1, 145000000, 138500000, 6500000, "05/08/2026 08:30", "HOAN_TAT"],
      ["DOT-202608-K2", "202608", 2, 120000000, 114000000, 6000000, "15/08/2026 08:30", "HOAN_TAT"]
    ]);
  }

  // NO_TON_DONG
  const noTonSheet = ss.getSheetByName("NO_TON_DONG");
  if (noTonSheet && noTonSheet.getLastRow() < 2) {
    noTonSheet.getRange(2, 1, 2, 8).setValues([
      ["KH008892", "KU-2025-0982", 0, 6000000, 6000000, "DOT-202608-K2", "CHUA_THU", "15/08/2026 10:00"],
      ["KH009102", "KU-2026-0312", 0, 6500000, 6500000, "DOT-202608-K1", "CHUA_THU", "05/08/2026 10:00"]
    ]);
  }
}

// ========================================================================================
// 3. XÁC THỰC VÀ PHÂN QUYỀN 360° CHI TIẾT (AUTH & RBAC 360 HANDLERS)
// ========================================================================================

function handleLogin(username, passwordHash) {
  if (!username || !passwordHash) {
    return { status: 'error', message: 'Tên đăng nhập và mật khẩu không được để trống.' };
  }

  const ss = getSpreadsheet();
  const userSheet = ss.getSheetByName('USERS');
  const roleSheet = ss.getSheetByName('ROLES');

  const usersData = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 8).getValues();
  const uInput = String(username).trim().toLowerCase();

  // Load Roles Map
  const rolesMap = {};
  if (roleSheet && roleSheet.getLastRow() > 1) {
    const rData = roleSheet.getRange(2, 1, roleSheet.getLastRow() - 1, 4).getValues();
    rData.forEach(r => {
      let perms = [];
      try { perms = JSON.parse(r[2]); } catch (e) { perms = []; }
      rolesMap[r[0]] = { roleCode: r[0], roleName: r[1], permissions: perms, description: r[3] };
    });
  }

  for (let i = 0; i < usersData.length; i++) {
    const row = usersData[i];
    const uDb = String(row[0]).trim().toLowerCase();
    const pHashDb = String(row[1]).trim();
    const fullName = row[2];
    const role = row[3];
    let customPerms = [];
    try { customPerms = JSON.parse(row[4] || '[]'); } catch (e) { customPerms = []; }
    const status = row[5];

    if (uDb === uInput) {
      if (status !== 'ACTIVE') {
        return { status: 'error', message: 'Tài khoản của bạn đang bị khóa hoặc tạm dừng.' };
      }
      if (pHashDb === String(passwordHash).trim()) {
        userSheet.getRange(i + 2, 8).setValue(Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss"));

        const rolePerms = rolesMap[role] ? rolesMap[role].permissions : [];
        const effectiveSet = new Set([...rolePerms, ...customPerms]);
        const effectivePermissions = Array.from(effectiveSet);

        return {
          status: 'success',
          message: 'Đăng nhập thành công',
          user: {
            username: row[0],
            fullName: fullName,
            role: role,
            customPermissions: customPerms,
            effectivePermissions: effectivePermissions
          },
          token: 'TOKEN-' + Utilities.getUuid()
        };
      } else {
        return { status: 'error', message: 'Mật khẩu không chính xác. Vui lòng thử lại.' };
      }
    }
  }

  return { status: 'error', message: 'Tài khoản không tồn tại trong hệ thống.' };
}

function handleGetRolesAndPermissions() {
  const cached = getCachedData('roles_permissions');
  if (cached) return { status: 'success', data: cached };

  const ss = getSpreadsheet();
  const roleSheet = ss.getSheetByName('ROLES');

  const roles = [];
  if (roleSheet && roleSheet.getLastRow() > 1) {
    const data = roleSheet.getRange(2, 1, roleSheet.getLastRow() - 1, 5).getValues();
    data.forEach(r => {
      let perms = [];
      try { perms = JSON.parse(r[2]); } catch (e) { perms = []; }
      roles.push({
        roleCode: r[0],
        roleName: r[1],
        permissions: perms,
        description: r[3],
        updatedAt: formatGasDateTime(r[4])
      });
    });
  }

  const result = {
    modules: DEFAULT_SYSTEM_MODULES,
    roles: roles
  };

  setCachedData('roles_permissions', result, 60);
  return { status: 'success', data: result };
}

function handleSaveRolePermissions(roleData) {
  const ss = getSpreadsheet();
  const roleSheet = ss.getSheetByName('ROLES');
  if (!roleSheet) throw new Error("Không tìm thấy bảng ROLES");

  const roleCode = String(roleData.roleCode || '').trim().toUpperCase();
  const roleName = roleData.roleName || roleCode;
  const permissions = JSON.stringify(roleData.permissions || []);
  const description = roleData.description || '';
  const nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

  if (roleSheet.getLastRow() > 1) {
    const data = roleSheet.getRange(2, 1, roleSheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]).toUpperCase() === roleCode) {
        roleSheet.getRange(i + 2, 2, 1, 4).setValues([[roleName, permissions, description, nowStr]]);
        clearCacheKeys(['roles_permissions']);
        return { status: 'success', message: `Cập nhật quyền cho nhóm ${roleName} (${roleCode}) thành công!` };
      }
    }
  }

  roleSheet.appendRow([roleCode, roleName, permissions, description, nowStr]);
  clearCacheKeys(['roles_permissions']);
  return { status: 'success', message: `Tạo mới nhóm quyền ${roleName} thành công!` };
}

function handleGetUserList() {
  const ss = getSpreadsheet();
  const userSheet = ss.getSheetByName('USERS');
  if (!userSheet || userSheet.getLastRow() <= 1) return { status: 'success', data: [] };

  const data = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 8).getValues();
  const users = data.map(r => {
    let customPerms = [];
    try { customPerms = JSON.parse(r[4] || '[]'); } catch (e) { customPerms = []; }
    return {
      username: r[0],
      fullName: r[2],
      role: r[3],
      customPermissions: customPerms,
      status: r[5],
      createdAt: formatGasDateTime(r[6]),
      lastLogin: formatGasDateTime(r[7])
    };
  });

  return { status: 'success', data: users };
}

function handleSaveUser(userData) {
  const ss = getSpreadsheet();
  const userSheet = ss.getSheetByName('USERS');
  if (!userSheet) throw new Error("Không tìm thấy sheet USERS");

  const username = String(userData.username || '').trim();
  const passwordHash = userData.passwordHash || '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';
  const fullName = userData.fullName || username;
  const role = userData.role || 'CBTD';
  const customPermsStr = JSON.stringify(userData.customPermissions || []);
  const status = userData.status || 'ACTIVE';

  if (userSheet.getLastRow() > 1) {
    const data = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 8).getValues();
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === username.toLowerCase()) {
        userSheet.getRange(i + 2, 3, 1, 4).setValues([[fullName, role, customPermsStr, status]]);
        if (userData.passwordHash) {
          userSheet.getRange(i + 2, 2).setValue(userData.passwordHash);
        }
        return { status: 'success', message: 'Cập nhật tài khoản & phân quyền thành công!' };
      }
    }
  }

  userSheet.appendRow([
    username,
    passwordHash,
    fullName,
    role,
    customPermsStr,
    status,
    Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss"),
    "---"
  ]);

  return { status: 'success', message: 'Tạo mới tài khoản người dùng thành công!' };
}

function handleChangePassword(username, oldPasswordHash, newPasswordHash) {
  const ss = getSpreadsheet();
  const userSheet = ss.getSheetByName('USERS');
  if (!userSheet || userSheet.getLastRow() <= 1) throw new Error("Chưa khởi tạo bảng USERS");

  const usersData = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 2).getValues();
  const uInput = String(username).trim().toLowerCase();

  for (let i = 0; i < usersData.length; i++) {
    if (String(usersData[i][0]).trim().toLowerCase() === uInput) {
      if (String(usersData[i][1]).trim() !== String(oldPasswordHash).trim()) {
        return { status: 'error', message: 'Mật khẩu cũ không chính xác.' };
      }
      userSheet.getRange(i + 2, 2).setValue(newPasswordHash);
      return { status: 'success', message: 'Đổi mật khẩu thành công!' };
    }
  }
  return { status: 'error', message: 'Không tìm thấy người dùng.' };
}

function handleResetPassword(username, newPasswordHash) {
  const ss = getSpreadsheet();
  const userSheet = ss.getSheetByName('USERS');
  if (!userSheet || userSheet.getLastRow() <= 1) throw new Error("Chưa khởi tạo USERS");

  const data = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 2).getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === String(username).toLowerCase()) {
      userSheet.getRange(i + 2, 2).setValue(newPasswordHash);
      return { status: 'success', message: 'Đã reset mật khẩu cho: ' + username };
    }
  }
  return { status: 'error', message: 'Không tìm thấy người dùng.' };
}

// ========================================================================================
// 4. CÁC HÀM XỬ LÝ NGHIỆP VỤ (DASHBOARD, 360, THẨM ĐỊNH, TRÍCH NỢ, ĐỐI SOÁT)
// ========================================================================================

function handleGetDashboardStats() {
  const cached = getCachedData('dashboard_stats');
  if (cached) return { status: 'success', data: cached };

  const ss = getSpreadsheet();
  const hdtdSheet = ss.getSheetByName('HDTD_CORE');
  const dsTrichSheet = ss.getSheetByName('DS_TRICH_NO');
  const noTonSheet = ss.getSheetByName('NO_TON_DONG');
  const dotTrichSheet = ss.getSheetByName('DOT_TRICH_NO');

  let totalDuNo = 0;
  let totalHopDong = 0;
  let totalDuThuLai = 0;

  if (hdtdSheet && hdtdSheet.getLastRow() > 1) {
    const data = hdtdSheet.getRange(2, 1, hdtdSheet.getLastRow() - 1, 11).getValues();
    totalHopDong = data.length;
    data.forEach(row => {
      const duNo = Number(row[3]) || 0;
      const laiSuat = Number(row[4]) || 0;
      totalDuNo += duNo;
      totalDuThuLai += duNo * (laiSuat / 100 / 12);
    });
  }

  let totalKhachHangTrichNo = 0;
  if (dsTrichSheet && dsTrichSheet.getLastRow() > 1) {
    totalKhachHangTrichNo = dsTrichSheet.getLastRow() - 1;
  }

  let totalNoTon = 0;
  if (noTonSheet && noTonSheet.getLastRow() > 1) {
    const noTonData = noTonSheet.getRange(2, 1, noTonSheet.getLastRow() - 1, 8).getValues();
    noTonData.forEach(row => {
      totalNoTon += Number(row[4]) || 0;
    });
  }

  let recentBatches = [];
  if (dotTrichSheet && dotTrichSheet.getLastRow() > 1) {
    const batchData = dotTrichSheet.getRange(2, 1, dotTrichSheet.getLastRow() - 1, 8).getValues();
    recentBatches = batchData.map(r => ({
      maDot: r[0],
      thangNam: r[1],
      kyTrich: r[2],
      tongPhaiThu: Number(r[3]) || 0,
      tongDaTrich: Number(r[4]) || 0,
      tongConNo: Number(r[5]) || 0,
      ngayTao: formatGasDateTime(r[6]),
      trangThai: r[7]
    })).slice(-5).reverse();
  }

  const result = {
    totalDuNo: Math.round(totalDuNo),
    totalHopDong,
    totalDuThuLai: Math.round(totalDuThuLai),
    totalKhachHangTrichNo,
    totalNoTon: Math.round(totalNoTon),
    recentBatches
  };

  setCachedData('dashboard_stats', result, 20);
  return { status: 'success', data: result };
}

function handleSearchCustomer360(query) {
  const ss = getSpreadsheet();
  const q = String(query).trim().toLowerCase();
  const khSheet = ss.getSheetByName('KH_CORE');
  const hdtdSheet = ss.getSheetByName('HDTD_CORE');

  if (!khSheet || khSheet.getLastRow() <= 1) {
    return { status: 'success', data: [] };
  }

  const khData = khSheet.getRange(2, 1, khSheet.getLastRow() - 1, 15).getValues();
  const hdtdData = hdtdSheet && hdtdSheet.getLastRow() > 1 
    ? hdtdSheet.getRange(2, 1, hdtdSheet.getLastRow() - 1, 11).getValues() 
    : [];

  const matchedCustomers = [];

  khData.forEach(khRow => {
    const maKH = String(khRow[0] || '');
    const hoTen = String(khRow[1] || '');
    const cccd = String(khRow[4] || '');
    const sdt = String(khRow[8] || khRow[7] || '');
    const soTK = String(khRow[9] || '');

    const isMatch = !q || maKH.toLowerCase().includes(q) || 
      hoTen.toLowerCase().includes(q) || 
      cccd.toLowerCase().includes(q) || 
      sdt.includes(q) || 
      soTK.includes(q);

    if (isMatch) {
      const contracts = hdtdData.filter(hdRow => String(hdRow[1]) === maKH).map(hdRow => ({
        soHDTD: hdRow[0],
        maKH: hdRow[1],
        tienVay: Number(hdRow[2]) || 0,
        duNo: Number(hdRow[3]) || 0,
        laiSuat: Number(hdRow[4]) || 0,
        ngayVay: formatGasDate(hdRow[5]),
        denHan: formatGasDate(hdRow[6]),
        traLaiDenNgay: formatGasDate(hdRow[7]),
        maLoaiVay: hdRow[8],
        soThangVay: hdRow[9],
        moTaVay: hdRow[10]
      }));

      matchedCustomers.push({
        maKH: khRow[0],
        hoTen: khRow[1],
        diaChi: khRow[2],
        ngaySinh: formatGasDate(khRow[3]),
        cccd: khRow[4],
        ngayCap: formatGasDate(khRow[5]),
        noiCap: khRow[6],
        dienThoai: khRow[7],
        dienThoaiDD: khRow[8],
        soTK: khRow[9],
        khuVuc: khRow[10],
        soTV: khRow[11],
        soSoCP: khRow[12],
        ngayVaoTV: formatGasDate(khRow[13]),
        tongTienCP: Number(khRow[14]) || 0,
        contracts: contracts
      });
    }
  });

  return { status: 'success', data: matchedCustomers };
}

function handleGetAppraisals() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('BAO_CAO_THAM_DINH');
  if (!sheet || sheet.getLastRow() <= 1) return { status: 'success', data: [] };

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 20).getValues();
  const result = data.map(r => ({
    maBCTD: r[0],
    maKH: r[1],
    hoTen: r[2],
    deXuatVay: Number(r[3]) || 0,
    duyetVay: Number(r[4]) || 0,
    thoiHanThang: Number(r[5]) || 0,
    laiSuatDuyet: Number(r[6]) || 0,
    thuNhapThang: Number(r[7]) || 0,
    xepHangCIC: r[8],
    loaiTSBD: r[9],
    chuSoHuuTSBD: r[10],
    moTaTSBD: r[11],
    giaTriTSBD: Number(r[12]) || 0,
    tyLeLTV: r[13],
    hinhAnhTSBD: r[14],
    hinhAnhThamDinh: r[15],
    mucDoRuiRo: r[16],
    ketLuan: r[17],
    ngayLap: formatGasDate(r[18]),
    canBoThamDinh: r[19]
  }));

  return { status: 'success', data: result };
}

function handleSaveAppraisalReport(data) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('BAO_CAO_THAM_DINH');
  if (!sheet) throw new Error("Không tìm thấy sheet BAO_CAO_THAM_DINH");

  const maBCTD = data.maBCTD || ("BCTD-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss"));
  const ngayLapVal = parseGasDateToSheet(data.ngayLap || new Date());

  const rowValues = [
    maBCTD,
    data.maKH || '',
    data.hoTen || '',
    Number(data.deXuatVay) || 0,
    Number(data.duyetVay) || 0,
    Number(data.thoiHanThang) || 12,
    Number(data.laiSuatDuyet) || 0,
    Number(data.thuNhapThang) || 0,
    data.xepHangCIC || 'Hang A (Tot)',
    data.loaiTSBD || '',
    data.chuSoHuuTSBD || '',
    data.moTaTSBD || '',
    Number(data.giaTriTSBD) || 0,
    data.tyLeLTV || '0%',
    data.hinhAnhTSBD || '',
    data.hinhAnhThamDinh || '',
    data.mucDoRuiRo || 'Thap',
    data.ketLuan || 'Dong y cap tin dung',
    ngayLapVal,
    data.canBoThamDinh || 'Lê Văn Tín'
  ];

  sheet.appendRow(rowValues);
  clearCacheKeys(['dashboard_stats']);
  return { status: 'success', message: 'Lưu báo cáo thẩm định thành công!', maBCTD: maBCTD };
}

function handleGetInspections() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('KIEM_TRA_VON');
  if (!sheet || sheet.getLastRow() <= 1) return { status: 'success', data: [] };

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();
  const result = data.map(r => ({
    maBBKT: r[0],
    soHDTD: r[1],
    maKH: r[2],
    hoTen: r[3],
    ngayKiemTra: formatGasDate(r[4]),
    hinhThuc: r[5],
    danhGiaMucDich: r[6],
    mucDoRuiRo: r[7],
    moTaThucTe: r[8],
    hinhAnhKiemTra: r[9],
    canBoKiemTra: r[10]
  }));

  return { status: 'success', data: result };
}

function handleSaveLoanInspection(data) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('KIEM_TRA_VON');
  if (!sheet) throw new Error("Không tìm thấy sheet KIEM_TRA_VON");

  const maBBKT = data.maBBKT || ("BBKT-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss"));
  const ngayKTVal = parseGasDateToSheet(data.ngayKiemTra || new Date());

  const rowValues = [
    maBBKT,
    data.soHDTD || '',
    data.maKH || '',
    data.hoTen || '',
    ngayKTVal,
    data.hinhThuc || 'Thực địa',
    data.danhGiaMucDich || 'Đúng mục đích',
    data.mucDoRuiRo || 'Thấp',
    data.moTaThucTe || '',
    data.hinhAnhKiemTra || '',
    data.canBoKiemTra || 'Lê Văn Tín'
  ];

  sheet.appendRow(rowValues);
  return { status: 'success', message: 'Lưu biên bản kiểm tra sử dụng vốn thành công!', maBBKT: maBBKT };
}

function handleGetDebitRegistrations() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('DS_TRICH_NO');
  if (!sheet || sheet.getLastRow() <= 1) return { status: 'success', data: [] };

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  const result = data.map(r => ({
    maKH: r[0],
    hoTen: r[1],
    gttt: r[2],
    diaChi: r[3],
    soTK: r[4],
    kyTrich: Number(r[5]) || 1,
    trangThai: r[6],
    ghiChu: r[7]
  }));

  return { status: 'success', data: result };
}

function handleSaveDebitRegister(data) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('DS_TRICH_NO');
  if (!sheet) throw new Error("Không tìm thấy sheet DS_TRICH_NO");

  const maKH = String(data.maKH || '').trim();
  const rowValues = [
    maKH,
    data.hoTen || '',
    data.gttt || '',
    data.diaChi || '',
    data.soTK || '',
    Number(data.kyTrich) || 1,
    data.trangThai || 'Hieu luc',
    data.ghiChu || ''
  ];

  if (sheet.getLastRow() > 1) {
    const mData = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < mData.length; i++) {
      if (String(mData[i][0]).toLowerCase() === maKH.toLowerCase()) {
        sheet.getRange(i + 2, 1, 1, 8).setValues([rowValues]);
        clearCacheKeys(['dashboard_stats']);
        return { status: 'success', message: 'Cập nhật thỏa thuận trích nợ thành công!' };
      }
    }
  }

  sheet.appendRow(rowValues);
  clearCacheKeys(['dashboard_stats']);
  return { status: 'success', message: 'Đăng ký thỏa thuận trích nợ thành công!' };
}

function handleGetDebitBatches() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('DOT_TRICH_NO');
  if (!sheet || sheet.getLastRow() <= 1) return { status: 'success', data: [] };

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  const result = data.map(r => ({
    maDot: r[0],
    thangNam: r[1],
    kyTrich: r[2],
    tongPhaiThu: Number(r[3]) || 0,
    tongDaTrich: Number(r[4]) || 0,
    tongConNo: Number(r[5]) || 0,
    ngayTao: formatGasDateTime(r[6]),
    trangThai: r[7]
  })).reverse();

  return { status: 'success', data: result };
}

function handleGetDebitBatchDetail(maDot) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('LICH_SU_GIAO_DICH');
  if (!sheet || sheet.getLastRow() <= 1) return { status: 'success', data: [] };

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).getValues();
  const matched = data.filter(r => String(r[1]) === String(maDot)).map(r => ({
    idGiaoDich: r[0],
    maDot: r[1],
    maKH: r[2],
    soHDTD: r[3],
    soTK: r[4],
    phaiThuGoc: Number(r[5]) || 0,
    phaiThuLai: Number(r[6]) || 0,
    noTonTruoc: Number(r[7]) || 0,
    tongPhaiThu: Number(r[8]) || 0,
    daTrich: Number(r[9]) || 0,
    conNo: Number(r[10]) || 0,
    ketQua: r[11],
    lyDoLoi: r[12],
    ngayCapNhat: formatGasDateTime(r[13])
  }));

  return { status: 'success', data: matched };
}

function handleCreateDebitBatch(data) {
  const ss = getSpreadsheet();
  const dotSheet = ss.getSheetByName('DOT_TRICH_NO');
  const lsSheet = ss.getSheetByName('LICH_SU_GIAO_DICH');
  const dsTrichSheet = ss.getSheetByName('DS_TRICH_NO');
  const hdtdSheet = ss.getSheetByName('HDTD_CORE');
  const noTonSheet = ss.getSheetByName('NO_TON_DONG');

  const thangNam = data.thangNam;
  const kyTrich = Number(data.kyTrich);
  const maDot = `DOT-${thangNam}-K${kyTrich}`;

  const dsTrichData = dsTrichSheet.getRange(2, 1, Math.max(dsTrichSheet.getLastRow() - 1, 1), 8).getValues();
  const eligibleKH = dsTrichData.filter(r => Number(r[5]) === kyTrich && String(r[6]).toLowerCase().includes('hieu luc'));

  const hdtdData = hdtdSheet.getRange(2, 1, Math.max(hdtdSheet.getLastRow() - 1, 1), 11).getValues();
  const noTonData = (noTonSheet && noTonSheet.getLastRow() > 1) 
    ? noTonSheet.getRange(2, 1, noTonSheet.getLastRow() - 1, 8).getValues() 
    : [];

  let batchPhaiThu = 0;
  const batchDetails = [];
  const nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

  eligibleKH.forEach(kh => {
    const maKH = kh[0];
    const soTK = kh[4];
    const userHds = hdtdData.filter(h => String(h[1]) === String(maKH));

    userHds.forEach(hd => {
      const soHD = hd[0];
      const duNo = Number(hd[3]) || 0;
      const laiSuat = Number(hd[4]) || 0;
      const phaiThuLai = Math.round(duNo * (laiSuat / 100 / 12));
      const phaiThuGoc = 0;

      let noTon = 0;
      const existNoTon = noTonData.find(nt => String(nt[0]) === String(maKH) && String(nt[1]) === String(soHD) && String(nt[6]) === 'CHUA_THU');
      if (existNoTon) noTon = Number(existNoTon[4]) || 0;

      const tongPhaiThu = phaiThuGoc + phaiThuLai + noTon;
      batchPhaiThu += tongPhaiThu;

      batchDetails.push([
        `GD-${maDot}-${soHD}`,
        maDot,
        maKH,
        soHD,
        soTK,
        phaiThuGoc,
        phaiThuLai,
        noTon,
        tongPhaiThu,
        0,
        tongPhaiThu,
        'CHO_TRICH',
        '',
        nowStr
      ]);
    });
  });

  // Batch insert
  dotSheet.appendRow([
    maDot,
    thangNam,
    kyTrich,
    batchPhaiThu,
    0,
    batchPhaiThu,
    nowStr,
    'KHOI_TAO'
  ]);

  if (batchDetails.length > 0) {
    lsSheet.getRange(lsSheet.getLastRow() + 1, 1, batchDetails.length, 14).setValues(batchDetails);
  }

  clearCacheKeys(['dashboard_stats']);
  return { status: 'success', message: `Khởi tạo đợt trích nợ ${maDot} thành công với ${batchDetails.length} hợp đồng.`, maDot: maDot };
}

function handleReconcileUpload(data) {
  const ss = getSpreadsheet();
  const dotSheet = ss.getSheetByName('DOT_TRICH_NO');
  const lsSheet = ss.getSheetByName('LICH_SU_GIAO_DICH');
  const noTonSheet = ss.getSheetByName('NO_TON_DONG');

  const maDot = data.maDot;
  const results = data.results || [];
  const nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

  let totalDaTrich = 0;
  let totalConNo = 0;

  if (lsSheet.getLastRow() > 1) {
    const lsData = lsSheet.getRange(2, 1, lsSheet.getLastRow() - 1, 14).getValues();
    const newNoTonRows = [];

    for (let i = 0; i < lsData.length; i++) {
      if (String(lsData[i][1]) === String(maDot)) {
        const idGD = lsData[i][0];
        const resItem = results.find(r => r.idGiaoDich === idGD);

        if (resItem) {
          const phaiThu = Number(lsData[i][8]) || 0;
          const daTrich = Number(resItem.daTrich) || 0;
          const conNo = Math.max(0, phaiThu - daTrich);
          const ketQua = conNo === 0 ? 'THANH_CONG' : (daTrich > 0 ? 'TRICH_MOT_PHAN' : 'THAT_BAI');

          totalDaTrich += daTrich;
          totalConNo += conNo;

          lsSheet.getRange(i + 2, 10, 1, 5).setValues([[
            daTrich,
            conNo,
            ketQua,
            resItem.lyDoLoi || (conNo > 0 ? 'Không đủ số dư' : ''),
            nowStr
          ]]);

          if (conNo > 0) {
            newNoTonRows.push([
              lsData[i][2],
              lsData[i][3],
              0,
              conNo,
              conNo,
              maDot,
              'CHUA_THU',
              nowStr
            ]);
          }
        }
      }
    }

    if (newNoTonRows.length > 0) {
      noTonSheet.getRange(noTonSheet.getLastRow() + 1, 1, newNoTonRows.length, 8).setValues(newNoTonRows);
    }
  }

  // Cập nhật DOT_TRICH_NO
  if (dotSheet.getLastRow() > 1) {
    const dData = dotSheet.getRange(2, 1, dotSheet.getLastRow() - 1, 8).getValues();
    for (let i = 0; i < dData.length; i++) {
      if (String(dData[i][0]) === String(maDot)) {
        dotSheet.getRange(i + 2, 5, 1, 4).setValues([[
          totalDaTrich,
          totalConNo,
          nowStr,
          'HOAN_TAT'
        ]]);
        break;
      }
    }
  }

  clearCacheKeys(['dashboard_stats', 'debt_warnings']);
  return { status: 'success', message: 'Đối soát kết quả trích nợ hoàn tất!' };
}

function handleGetDebtWarnings() {
  const cached = getCachedData('debt_warnings');
  if (cached) return { status: 'success', data: cached };

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('NO_TON_DONG');
  const khSheet = ss.getSheetByName('KH_CORE');

  if (!sheet || sheet.getLastRow() <= 1) return { status: 'success', data: [] };

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  const khData = (khSheet && khSheet.getLastRow() > 1) ? khSheet.getRange(2, 1, khSheet.getLastRow() - 1, 2).getValues() : [];
  const khMap = {};
  khData.forEach(r => { khMap[r[0]] = r[1]; });

  const result = data.filter(r => String(r[6]) === 'CHUA_THU').map(r => ({
    maKH: r[0],
    hoTen: khMap[r[0]] || 'Khách hàng',
    soHDTD: r[1],
    gocTon: Number(r[2]) || 0,
    laiTon: Number(r[3]) || 0,
    tongNoTon: Number(r[4]) || 0,
    kyPhatSinh: r[5],
    trangThai: r[6],
    ngayCapNhat: formatGasDateTime(r[7])
  }));

  setCachedData('debt_warnings', result, 20);
  return { status: 'success', data: result };
}

function handleGetReports() {
  const ss = getSpreadsheet();
  const khSheet = ss.getSheetByName('KH_CORE');
  const hdtdSheet = ss.getSheetByName('HDTD_CORE');

  const khData = (khSheet && khSheet.getLastRow() > 1) ? khSheet.getRange(2, 1, khSheet.getLastRow() - 1, 15).getValues() : [];
  const hdtdData = (hdtdSheet && hdtdSheet.getLastRow() > 1) ? hdtdSheet.getRange(2, 1, hdtdSheet.getLastRow() - 1, 11).getValues() : [];

  const areaReport = {};
  khData.forEach(kh => {
    const area = kh[10] || 'Khu vực khác';
    if (!areaReport[area]) areaReport[area] = { count: 0, duNo: 0 };
    areaReport[area].count += 1;

    const userHds = hdtdData.filter(h => String(h[1]) === String(kh[0]));
    userHds.forEach(h => {
      areaReport[area].duNo += Number(h[3]) || 0;
    });
  });

  const productReport = {};
  hdtdData.forEach(h => {
    const prod = h[8] || 'Khác';
    if (!productReport[prod]) productReport[prod] = { count: 0, duNo: 0 };
    productReport[prod].count += 1;
    productReport[prod].duNo += Number(h[3]) || 0;
  });

  return {
    status: 'success',
    data: {
      byArea: areaReport,
      byProduct: productReport
    }
  };
}

function handleGetSyncStatus() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('SETTING');
  if (!sheet || sheet.getLastRow() <= 1) {
    return { status: 'success', data: { status: 'IDLE', message: 'Hệ thống sẵn sàng' } };
  }

  const row = sheet.getRange("A2:G2").getValues()[0];
  return {
    status: 'success',
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

function handleTriggerSqlSync() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('SETTING');
  if (!sheet) throw new Error("Không tìm thấy bảng SETTING");

  const nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
  sheet.getRange("A2:C2").setValues([["SYNC_DATA", "PENDING", nowStr]]);
  sheet.getRange("G2").setValue("Đã gửi lệnh SYNC_DATA từ WebApp. Đang chờ Python Daemon xử lý...");

  return { status: 'success', message: 'Đã gửi lệnh đồng bộ dữ liệu vào hàng đợi. Python Daemon sẽ xử lý trong giây lát.' };
}
