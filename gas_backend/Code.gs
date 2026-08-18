/**
 * ========================================================================================
 * HỆ THỐNG QUẢN LÝ TÍN DỤNG & TRÍCH NỢ AUTOMATION (CREDITCORES)
 * TOÀN BỘ BACKEND REST API + PHÂN QUYỀN 360° ĐA CHỨC NĂNG + TỰ ĐỘNG CẬP NHẬT CSDL GOOGLE SHEETS
 * Google Apps Script Web App Project:
 * https://script.google.com/d/1NI0PAQ56mfyrEALtn_MtaJ2EBwD0lS3TUOyHSOD72eiG8lEh9LlY_1vp/edit
 * Google Sheets Database:
 * https://docs.google.com/spreadsheets/d/1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw/edit
 * ========================================================================================
 */

// 1. CẤU HÌNH ID GOOGLE SHEETS CƠ SỞ DỮ LIỆU
const DB_SPREADSHEET_ID = "1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw";

/**
 * DANH MỤC PHÂN HỆ NGHIỆP VỤ MỞ RỘNG (MODULE REGISTRY)
 * Có thể mở rộng không giới hạn các chức năng về sau
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
 * Chạy ngầm trong mọi Request mà người dùng không cần bấm Script thủ công
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
      case 'getDebtWarnings':
        result = handleGetDebtWarnings();
        break;
      case 'getReportData':
        result = handleGetReportData(params.type, params.filter);
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
 * XỬ LÝ POST REQUEST (REST API WRITE / UPDATE OPERATIONS)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const action = payload.action || '';
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
    lock.releaseLock();
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
      // Tự động thêm cột CustomPermissions nếu sheet USERS cũ chỉ có 7 cột
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
    { name: "NgaySinh", width: 100, align: "center", format: "dd/MM/yyyy" },
    { name: "CCCD", width: 120, align: "center", format: "@" },
    { name: "NgayCap", width: 100, align: "center", format: "dd/MM/yyyy" },
    { name: "NoiCap", width: 160, align: "left", format: "@" },
    { name: "DienThoai", width: 110, align: "center", format: "@" },
    { name: "DienThoaiDD", width: 110, align: "center", format: "@" },
    { name: "SoTK", width: 140, align: "center", format: "@" },
    { name: "KhuVuc", width: 140, align: "left", format: "@" },
    { name: "SoTV", width: 100, align: "center", format: "@" },
    { name: "SoSoCP", width: 100, align: "center", format: "@" },
    { name: "NgayVaoTV", width: 100, align: "center", format: "dd/MM/yyyy" },
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

function setupSheet(ss, sheetName, columns, freezeRows, freezeCols, headerBgColor) {
  let ws = ss.getSheetByName(sheetName);
  if (!ws) {
    ws = ss.insertSheet(sheetName);
  }

  const numCols = columns.length;
  const headers = columns.map(c => c.name);

  const headerRange = ws.getRange(1, 1, 1, numCols);
  headerRange.setValues([headers]);
  headerRange.setFontWeight("bold");
  headerRange.setFontColor("#ffffff");
  headerRange.setBackground(headerBgColor);
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  ws.setRowHeight(1, 35);

  if (freezeRows > 0) ws.setFrozenRows(freezeRows);
  if (freezeCols > 0) ws.setFrozenColumns(freezeCols);

  const maxRows = Math.max(ws.getMaxRows() - 1, 100);
  for (let i = 0; i < numCols; i++) {
    const colIndex = i + 1;
    const col = columns[i];
    
    ws.setColumnWidth(colIndex, col.width);

    const dataRange = ws.getRange(2, colIndex, maxRows, 1);
    dataRange.setHorizontalAlignment(col.align);
    dataRange.setNumberFormat(col.format);
  }

  ws.setHiddenGridlines(false);
}

function seedSampleData(ss) {
  // ROLES
  const roleSheet = ss.getSheetByName("ROLES");
  if (roleSheet && roleSheet.getLastRow() < 2) {
    roleSheet.getRange(2, 1, 4, 5).setValues([
      ["ADMIN", "Quản Trị Viên Hệ Thống", JSON.stringify(DEFAULT_SYSTEM_MODULES.map(m => m.id)), "Toàn quyền trên toàn bộ các phân hệ", Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss")],
      ["CBTD", "Cán Bộ Tín Dụng", JSON.stringify(['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_register', 'debt_warning', 'reports']), "Thẩm định, kiểm tra vốn và quản lý nợ", Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss")],
      ["KETOAN", "Kế Toán Viên", JSON.stringify(['dashboard', 'customer360', 'debit_register', 'debit_batch', 'reconciliation', 'debt_warning', 'reports']), "Trích nợ tự động và đối soát hạch toán", Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss")],
      ["LANHDAO", "Ban Giám Đốc / Lãnh Đạo", JSON.stringify(['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_batch', 'reconciliation', 'debt_warning', 'reports']), "Phê duyệt, đối soát và báo cáo thống kê", Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss")]
    ]);
  }

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

        // Tính toán quyền hợp nhất: Role Permissions + Custom Permissions
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
        updatedAt: r[4]
      });
    });
  }

  return {
    status: 'success',
    data: {
      modules: DEFAULT_SYSTEM_MODULES,
      roles: roles
    }
  };
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
        return { status: 'success', message: `Cập nhật quyền cho nhóm ${roleName} (${roleCode}) thành công!` };
      }
    }
  }

  roleSheet.appendRow([roleCode, roleName, permissions, description, nowStr]);
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
      createdAt: r[6],
      lastLogin: r[7]
    };
  });

  return { status: 'success', data: users };
}

function handleSaveUser(userData) {
  const ss = getSpreadsheet();
  const userSheet = ss.getSheetByName('USERS');
  if (!userSheet) throw new Error("Không tìm thấy sheet USERS");

  const username = String(userData.username || '').trim();
  const passwordHash = userData.passwordHash || '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'; // default: 123456
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
// 4. CÁC HÀM XỬ LÝ NGHIỆP VỤ KHÁC (DASHBOARD, 360, THẨM ĐỊNH, TRÍCH NỢ, ĐỐI SOÁT)
// ========================================================================================

function handleGetDashboardStats() {
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
      ngayTao: r[6],
      trangThai: r[7]
    })).slice(-5).reverse();
  }

  return {
    status: 'success',
    data: {
      totalDuNo: Math.round(totalDuNo),
      totalHopDong,
      totalDuThuLai: Math.round(totalDuThuLai),
      totalKhachHangTrichNo,
      totalNoTon: Math.round(totalNoTon),
      recentBatches
    }
  };
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
        ngayVay: hdRow[5],
        denHan: hdRow[6],
        traLaiDenNgay: hdRow[7],
        maLoaiVay: hdRow[8],
        soThangVay: hdRow[9],
        moTaVay: hdRow[10]
      }));

      matchedCustomers.push({
        maKH: khRow[0],
        hoTen: khRow[1],
        diaChi: khRow[2],
        ngaySinh: khRow[3],
        cccd: khRow[4],
        ngayCap: khRow[5],
        noiCap: khRow[6],
        dienThoai: khRow[7],
        dienThoaiDD: khRow[8],
        soTK: khRow[9],
        khuVuc: khRow[10],
        soTV: khRow[11],
        soSoCP: khRow[12],
        ngayVaoTV: khRow[13],
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
    ngayLap: r[18],
    canBoThamDinh: r[19]
  }));

  return { status: 'success', data: result };
}

function handleSaveAppraisalReport(data) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('BAO_CAO_THAM_DINH');
  if (!sheet) throw new Error("Không tìm thấy sheet BAO_CAO_THAM_DINH");

  const maBCTD = data.maBCTD || ("BCTD-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss"));
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
    data.ngayLap || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy"),
    data.canBoThamDinh || 'Lê Văn Tín'
  ];

  sheet.appendRow(rowValues);
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
    ngayKiemTra: r[4],
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
  const rowValues = [
    maBBKT,
    data.soHDTD || '',
    data.maKH || '',
    data.hoTen || '',
    data.ngayKiemTra || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy"),
    data.hinhThuc || 'Thực địa',
    data.danhGiaMucDich || 'Đúng mục đích',
    data.mucDoRuiRo || 'Thấp',
    data.moTaThucTe || '',
    data.hinhAnhKiemTra || '',
    data.canBoKiemTra || 'Lê Văn Tín'
  ];

  sheet.appendRow(rowValues);
  return { status: 'success', message: 'Lưu biên bản kiểm tra vốn thành công!', maBBKT: maBBKT };
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
    kyTrich: r[5],
    trangThai: r[6],
    ghiChu: r[7]
  }));

  return { status: 'success', data: result };
}

function handleSaveDebitRegister(data) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('DS_TRICH_NO');
  if (!sheet) throw new Error("Không tìm thấy sheet DS_TRICH_NO");

  const rowValues = [
    data.maKH || '',
    data.hoTen || '',
    data.gttt || '',
    data.diaChi || '',
    data.soTK || '',
    Number(data.kyTrich) || 1,
    data.trangThai || 'Hieu luc',
    data.ghiChu || ''
  ];

  sheet.appendRow(rowValues);
  return { status: 'success', message: 'Đăng ký dịch vụ trích nợ thành công!' };
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
    ngayTao: r[6],
    trangThai: r[7]
  }));

  return { status: 'success', data: result };
}

function handleCreateDebitBatch(data) {
  const ss = getSpreadsheet();
  const dotSheet = ss.getSheetByName('DOT_TRICH_NO');
  const lsSheet = ss.getSheetByName('LICH_SU_GIAO_DICH');
  const dsTrichSheet = ss.getSheetByName('DS_TRICH_NO');
  const hdtdSheet = ss.getSheetByName('HDTD_CORE');

  const thangNam = data.thangNam || Utilities.formatDate(new Date(), "GMT+7", "yyyyMM");
  const kyTrich = Number(data.kyTrich) || 1;
  const maDot = "DOT-" + thangNam + "-K" + kyTrich;

  const dsTrich = dsTrichSheet.getLastRow() > 1 
    ? dsTrichSheet.getRange(2, 1, dsTrichSheet.getLastRow() - 1, 8).getValues() 
    : [];
  
  const eligibleKH = dsTrich.filter(r => Number(r[5]) === kyTrich && r[6] === 'Hieu luc');

  const hdData = hdtdSheet.getLastRow() > 1
    ? hdtdSheet.getRange(2, 1, hdtdSheet.getLastRow() - 1, 11).getValues()
    : [];

  let batchTotalPhaiThu = 0;
  const newTransactions = [];

  eligibleKH.forEach(kh => {
    const maKH = kh[0];
    const soTK = kh[4];
    const customerContracts = hdData.filter(h => String(h[1]) === String(maKH));

    customerContracts.forEach(c => {
      const soHDTD = c[0];
      const duNo = Number(c[3]) || 0;
      const laiSuat = Number(c[4]) || 0;
      const phaiThuLai = Math.round(duNo * (laiSuat / 100 / 12));
      const phaiThuGoc = 0;
      const noTonTruoc = 0;
      const tongPhaiThu = phaiThuLai + phaiThuGoc + noTonTruoc;

      batchTotalPhaiThu += tongPhaiThu;

      newTransactions.push([
        "GD-" + maDot + "-" + soHDTD,
        maDot,
        maKH,
        soHDTD,
        soTK,
        phaiThuGoc,
        phaiThuLai,
        noTonTruoc,
        tongPhaiThu,
        0,
        tongPhaiThu,
        "CHO_TRICH",
        "",
        Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm")
      ]);
    });
  });

  dotSheet.appendRow([
    maDot,
    thangNam,
    kyTrich,
    batchTotalPhaiThu,
    0,
    batchTotalPhaiThu,
    Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm"),
    "KHOI_TAO"
  ]);

  if (newTransactions.length > 0) {
    lsSheet.getRange(lsSheet.getLastRow() + 1, 1, newTransactions.length, 14).setValues(newTransactions);
  }

  return {
    status: 'success',
    message: 'Khởi tạo đợt trích nợ ' + maDot + ' thành công với ' + newTransactions.length + ' lệnh trích!',
    maDot: maDot,
    totalItems: newTransactions.length,
    tongPhaiThu: batchTotalPhaiThu
  };
}

function handleReconcileUpload(data) {
  const ss = getSpreadsheet();
  const lsSheet = ss.getSheetByName('LICH_SU_GIAO_DICH');
  const noTonSheet = ss.getSheetByName('NO_TON_DONG');

  const maDot = data.maDot;
  const items = data.items || [];

  if (!lsSheet || lsSheet.getLastRow() <= 1) throw new Error("Chưa có giao dịch để đối soát.");

  const lsData = lsSheet.getRange(2, 1, lsSheet.getLastRow() - 1, 14).getValues();
  let updatedCount = 0;
  let batchDaTrich = 0;
  let batchConNo = 0;

  for (let i = 0; i < lsData.length; i++) {
    if (String(lsData[i][1]) === String(maDot)) {
      const soHDTD = String(lsData[i][3]);
      const match = items.find(it => String(it.soHDTD) === soHDTD);

      if (match) {
        const phaiThu = Number(lsData[i][8]) || 0;
        const daTrich = Number(match.daTrich) || 0;
        const conNo = Math.max(0, phaiThu - daTrich);
        const ketQua = match.ketQua || (conNo === 0 ? 'THANH_CONG' : (daTrich > 0 ? 'TRICH_MOT_PHAN' : 'THAT_BAI'));
        const lyDoLoi = match.lyDoLoi || (conNo > 0 ? 'Khong du so du' : '');

        lsData[i][9] = daTrich;
        lsData[i][10] = conNo;
        lsData[i][11] = ketQua;
        lsData[i][12] = lyDoLoi;
        lsData[i][13] = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm");

        batchDaTrich += daTrich;
        batchConNo += conNo;
        updatedCount++;

        if (conNo > 0 && noTonSheet) {
          noTonSheet.appendRow([
            lsData[i][2],
            soHDTD,
            0,
            conNo,
            conNo,
            maDot,
            "CHUA_THU",
            Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm")
          ]);
        }
      }
    }
  }

  lsSheet.getRange(2, 1, lsData.length, 14).setValues(lsData);

  return {
    status: 'success',
    message: 'Đối soát hoàn tất ' + updatedCount + ' giao dịch!',
    updatedCount: updatedCount,
    batchDaTrich: batchDaTrich,
    batchConNo: batchConNo
  };
}

function handleGetDebtWarnings() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('NO_TON_DONG');
  if (!sheet || sheet.getLastRow() <= 1) return { status: 'success', data: [] };

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  const result = data.map(r => ({
    maKH: r[0],
    soHDTD: r[1],
    gocTon: Number(r[2]) || 0,
    laiTon: Number(r[3]) || 0,
    tongNoTon: Number(r[4]) || 0,
    kyPhatSinh: r[5],
    trangThai: r[6],
    ngayCapNhat: r[7]
  }));

  return { status: 'success', data: result };
}

function handleGetReportData(type, filter) {
  const ss = getSpreadsheet();
  const hdtdSheet = ss.getSheetByName('HDTD_CORE');
  const khSheet = ss.getSheetByName('KH_CORE');

  const khData = khSheet && khSheet.getLastRow() > 1 ? khSheet.getRange(2, 1, khSheet.getLastRow() - 1, 15).getValues() : [];
  const hdData = hdtdSheet && hdtdSheet.getLastRow() > 1 ? hdtdSheet.getRange(2, 1, hdtdSheet.getLastRow() - 1, 11).getValues() : [];

  const areaSummary = {};
  khData.forEach(kh => {
    const maKH = kh[0];
    const khuVuc = kh[10] || 'Khác';
    if (!areaSummary[khuVuc]) areaSummary[khuVuc] = { khuVuc: khuVuc, countKH: 0, totalDuNo: 0 };
    areaSummary[khuVuc].countKH += 1;

    const myContracts = hdData.filter(h => String(h[1]) === String(maKH));
    myContracts.forEach(c => {
      areaSummary[khuVuc].totalDuNo += Number(c[3]) || 0;
    });
  });

  return {
    status: 'success',
    data: {
      byArea: Object.values(areaSummary),
      totalRecords: hdData.length
    }
  };
}

function handleTriggerSqlSync() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('SETTING');
  if (!sheet) throw new Error("Không tìm thấy sheet SETTING");

  sheet.getRange("A2:B2").setValues([["SYNC_DATA", "PENDING"]]);
  sheet.getRange("C2").setValue(Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss"));
  sheet.getRange("G2").setValue("Đã gửi cờ yêu cầu đồng bộ. Đang chờ Python Daemon phản hồi...");

  return { status: 'success', message: 'Đã gửi cờ yêu cầu đồng bộ dữ liệu tới SQL Server Core!' };
}

function handleGetSyncStatus() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('SETTING');
  if (!sheet || sheet.getLastRow() < 2) {
    return { status: 'success', data: { command: 'IDLE', status: 'IDLE' } };
  }

  const row = sheet.getRange("A2:G2").getValues()[0];
  return {
    status: 'success',
    data: {
      command: row[0],
      status: row[1],
      requestTime: row[2],
      startTime: row[3],
      finishTime: row[4],
      totalRows: row[5],
      message: row[6]
    }
  };
}
