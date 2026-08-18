// =========================================================================================
// THIẾT LẬP GOOGLE SHEET ID TRỰC TIẾP TRONG CODE TẠI ĐÂY
// Google Sheet ID: 1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw
// =========================================================================================
const DIRECT_SHEET_ID = "1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw";

const DEFAULT_SYSTEM_MODULES = [
  { id: 'dashboard', label: 'Dashboard Quản trị' },
  { id: 'customer360', label: 'Tra cứu KH & HĐ 360°' },
  { id: 'appraisal', label: 'Thẩm định Tín dụng & TSĐB' },
  { id: 'inspection', label: 'Kiểm tra Sử dụng Vốn' },
  { id: 'debit_register', label: 'Đăng ký Dịch vụ Trích nợ' },
  { id: 'debit_batch', label: 'Khởi tạo & Chạy đợt Trích nợ' },
  { id: 'reconciliation', label: 'Đối soát Kết quả Core' },
  { id: 'debt_warning', label: 'Sổ Theo dõi Nợ tồn đọng' },
  { id: 'reports', label: 'Báo cáo Thống kê & Phân tích' },
  { id: 'user_management', label: 'Phân quyền 360° & Tài khoản' },
  { id: 'settings', label: 'Cấu hình & Đồng bộ Core' }
];

function runSetupDirectly() {
  Logger.log(">>> Bắt đầu khởi tạo CSDL với Google Sheet ID: " + DIRECT_SHEET_ID);
  setupAllSheets(DIRECT_SHEET_ID);
}

function onOpen() {
  let ui;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { ui = null; }
  if (ui) {
    ui.createMenu('Hệ thống Tín dụng')
      .addItem('Khởi tạo / Nâng cấp 11 Sheets CSDL', 'runSetupDirectly')
      .addToUi();
  }
}

function setupAllSheets(targetSheetId) {
  let ss;
  const finalSheetId = targetSheetId || DIRECT_SHEET_ID;

  if (finalSheetId) {
    try {
      ss = SpreadsheetApp.openById(finalSheetId);
    } catch (e) {
      Logger.log("Lỗi không tìm thấy hoặc không có quyền truy cập Sheet ID: " + finalSheetId);
      throw new Error("Không thể mở Google Sheet với ID: " + finalSheetId);
    }
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  
  Logger.log("Đang khởi tạo toàn bộ 11 Bảng CSDL trên file: " + ss.getName() + " [ID: " + ss.getId() + "]");

  // 1. ROLES (Nhóm Quyền & Ma Trận Phân Quyền 360°)
  setupSheet(ss, "ROLES", [
    { name: "RoleCode", width: 120, align: "center", format: "@" },
    { name: "RoleName", width: 180, align: "left", format: "@" },
    { name: "Permissions", width: 350, align: "left", format: "@" },
    { name: "Description", width: 250, align: "left", format: "@" },
    { name: "UpdatedAt", width: 160, align: "center", format: "dd/MM/yyyy HH:mm:ss" }
  ], 1, 0, "#4a148c");

  // 2. USERS (Tài Khoản & Quyền Chi Tiết)
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

  // 3. SETTING (Cấu hình & Hàng đợi lệnh)
  setupSheet(ss, "SETTING", [
    { name: "COMMAND", width: 130, align: "center", format: "@" },
    { name: "STATUS", width: 130, align: "center", format: "@" },
    { name: "REQUEST_TIME", width: 160, align: "center", format: "dd/MM/yyyy HH:mm:ss" },
    { name: "START_TIME", width: 160, align: "center", format: "dd/MM/yyyy HH:mm:ss" },
    { name: "FINISH_TIME", width: 160, align: "center", format: "dd/MM/yyyy HH:mm:ss" },
    { name: "TOTAL_ROWS", width: 120, align: "right", format: "#,##0" },
    { name: "MESSAGE", width: 250, align: "left", format: "@" }
  ], 1, 0, "#2c3e50");

  const settingSheet = ss.getSheetByName("SETTING");
  if (settingSheet.getLastRow() < 2) {
    settingSheet.getRange("A2:G2").setValues([[
      "IDLE", "SUCCESS", "18/08/2026 08:00:00", "18/08/2026 08:00:01", "18/08/2026 08:00:05", 342, "Hệ thống vận hành bình thường"
    ]]);
  }

  // 4. KH_CORE (Thông tin Khách hàng & Thành viên)
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

  // 5. HDTD_CORE (Hợp đồng Tín dụng / Khế ước từ Core SQL)
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

  // 6. DS_TRICH_NO (Danh sách đăng ký trích nợ tự động)
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

  // 7. DOT_TRICH_NO (Quản lý các đợt/kỳ trích nợ)
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

  // 8. LICH_SU_GIAO_DICH (Chi tiết kết quả từng hợp đồng trong đợt)
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

  // 9. NO_TON_DONG (Sổ theo dõi nợ tồn chuyển kỳ sau)
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

  // 10. BAO_CAO_THAM_DINH (Hồ sơ Thẩm định & Tài sản đảm bảo chi tiết)
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

  // 11. KIEM_TRA_VON (Biên bản Kiểm tra Sử dụng Vốn vay)
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
}
