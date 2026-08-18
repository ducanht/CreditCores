/**
 * ========================================================================================
 * HỆ THỐNG QUẢN LÝ TÍN DỤNG & TRÍCH NỢ AUTOMATION (CREDITCORES)
 * SCRIPT TỰ ĐỘNG KHỞI TẠO 11 SHEETS CSDL & MẪU DỮ LIỆU ĐỊNH DẠNG VIỆT NAM CHUẨN
 * ========================================================================================
 */

const DB_SPREADSHEET_ID = "1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw";

function runSetupDirectly() {
  Logger.log(">>> Bắt đầu tạo 11 sheets CSDL cho: " + DB_SPREADSHEET_ID);
  setupAllSheets(DB_SPREADSHEET_ID);
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
  // 1. ROLES
  const roleSheet = ss.getSheetByName("ROLES");
  if (roleSheet && roleSheet.getLastRow() < 2) {
    roleSheet.getRange(2, 1, 4, 5).setValues([
      ["ADMIN", "Quản Trị Viên Hệ Thống", JSON.stringify(['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_register', 'debit_batch', 'reconciliation', 'debt_warning', 'reports', 'user_management', 'settings']), "Toàn quyền trên toàn bộ các phân hệ", "18/08/2026 08:00:00"],
      ["CBTD", "Cán Bộ Tín Dụng", JSON.stringify(['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_register', 'debt_warning', 'reports']), "Thẩm định, kiểm tra vốn và quản lý nợ", "18/08/2026 08:00:00"],
      ["KETOAN", "Kế Toán Viên", JSON.stringify(['dashboard', 'customer360', 'debit_register', 'debit_batch', 'reconciliation', 'debt_warning', 'reports']), "Trích nợ tự động và đối soát hạch toán", "18/08/2026 08:00:00"],
      ["LANHDAO", "Ban Giám Đốc / Lãnh Đạo", JSON.stringify(['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_batch', 'reconciliation', 'debt_warning', 'reports']), "Phê duyệt, đối soát và báo cáo thống kê", "18/08/2026 08:00:00"]
    ]);
  }

  // 2. USERS
  const userSheet = ss.getSheetByName("USERS");
  if (userSheet && userSheet.getLastRow() < 2) {
    userSheet.getRange(2, 1, 4, 8).setValues([
      ["admin", "7676aaafb027c825bd9abab78b234070e702752f625b752e55e55b48e607e358", "Quản Trị Viên Hệ Thống", "ADMIN", "[]", "ACTIVE", "18/08/2026 08:00:00", "18/08/2026 08:00:00"],
      ["cbtd", "3e00a18bcfd6744fee22728d750f00c48dfa75a3bde2002f9ce53480d72d2cc0", "Lê Văn Tín (Cán Bộ Tín Dụng)", "CBTD", "[]", "ACTIVE", "18/08/2026 08:00:00", "---"],
      ["ketoan", "fad6fda10dd6d54384c03532eb64b86b7ab3bfba4b258a83646ca8ef0d4be98e", "Nguyễn Thị Hằng (Kế Toán Viên)", "KETOAN", "[]", "ACTIVE", "18/08/2026 08:00:00", "---"],
      ["lanhdao", "cbe973fb461f4ab4007d2a1c2da904992d41db551702603c5f7a93e16da4750d", "Trần Đình Trọng (Giám Đốc)", "LANHDAO", "[]", "ACTIVE", "18/08/2026 08:00:00", "---"]
    ]);
  }

  // 3. SETTING
  const settingSheet = ss.getSheetByName("SETTING");
  if (settingSheet && settingSheet.getLastRow() < 2) {
    settingSheet.getRange("A2:G2").setValues([[
      "IDLE", "SUCCESS", "18/08/2026 08:00:00", "18/08/2026 08:00:01", "18/08/2026 08:00:05", 342, "Hệ thống vận hành bình thường. Sẵn sàng nhận lệnh."
    ]]);
  }

  // 4. KH_CORE
  const khSheet = ss.getSheetByName("KH_CORE");
  if (khSheet && khSheet.getLastRow() < 2) {
    khSheet.getRange(2, 1, 3, 15).setValues([
      ["KH008892", "NGUYỄN VĂN AN", "Thôn 3, Xã Yên Thọ", "15/05/1985", "038086012345", "15/05/2021", "Cục CSQLHC về TTXH", "02373850123", "0912345678", "3500205123456", "Thôn 3, Yên Thọ", "TV-0892", "CP-0412", "10/01/2018", 15000000],
      ["KH009102", "LÊ THỊ MAI", "Thôn 1, Xã Yên Trường", "20/10/1990", "038190098765", "10/08/2020", "CA Tỉnh Thanh Hóa", "02373850999", "0988123456", "3500205987654", "Thôn 1, Yên Trường", "TV-0910", "CP-0511", "15/03/2019", 20000000],
      ["KH007415", "TRẦN VĂN QUÂN", "Thôn 5, Xã Yên Bái", "08/12/1979", "038079001122", "12/04/2022", "Cục CSQLHC về TTXH", "02373850888", "0903456789", "3500205556677", "Thôn 5, Yên Bái", "TV-0741", "CP-0320", "20/11/2016", 30000000]
    ]);
  }

  // 5. HDTD_CORE
  const hdtdSheet = ss.getSheetByName("HDTD_CORE");
  if (hdtdSheet && hdtdSheet.getLastRow() < 2) {
    hdtdSheet.getRange(2, 1, 4, 11).setValues([
      ["KU-2025-0982", "KH008892", 300000000, 250000000, 9.50, "15/08/2025", "15/08/2026", "15/07/2026", "LV01", 12, "Cho vay phát triển chăn nuôi bò sữa"],
      ["KU-2026-0145", "KH008892", 300000000, 200000000, 10.20, "10/02/2026", "10/02/2028", "10/07/2026", "LV03", 24, "Cho vay kinh doanh vật tư nông nghiệp"],
      ["KU-2026-0312", "KH009102", 200000000, 150000000, 9.80, "05/03/2026", "05/03/2028", "05/07/2026", "LV02", 24, "Cho vay trồng trọt công nghệ cao"],
      ["KU-2025-0811", "KH007415", 500000000, 420000000, 9.50, "20/11/2025", "20/11/2027", "20/07/2026", "LV03", 24, "Cho vay mua xe tải vận chuyển nông sản"]
    ]);
  }

  // 6. DS_TRICH_NO
  const dsTrichSheet = ss.getSheetByName("DS_TRICH_NO");
  if (dsTrichSheet && dsTrichSheet.getLastRow() < 2) {
    dsTrichSheet.getRange(2, 1, 3, 8).setValues([
      ["KH008892", "NGUYỄN VĂN AN", "038086012345", "Thôn 3, Xã Yên Thọ", "3500205123456", 2, "Hieu luc", "Ủy quyền trích nợ tự động ngày 15"],
      ["KH009102", "LÊ THỊ MAI", "038190098765", "Thôn 1, Xã Yên Trường", "3500205987654", 1, "Hieu luc", "Ủy quyền trích nợ tự động ngày 05"],
      ["KH007415", "TRẦN VĂN QUÂN", "038079001122", "Thôn 5, Xã Yên Bái", "3500205556677", 3, "Hieu luc", "Ủy quyền trích nợ tự động ngày 25"]
    ]);
  }

  // 7. DOT_TRICH_NO
  const dotTrichSheet = ss.getSheetByName("DOT_TRICH_NO");
  if (dotTrichSheet && dotTrichSheet.getLastRow() < 2) {
    dotTrichSheet.getRange(2, 1, 2, 8).setValues([
      ["DOT-202608-K1", "202608", 1, 145000000, 138500000, 6500000, "05/08/2026 08:30", "HOAN_TAT"],
      ["DOT-202608-K2", "202608", 2, 120000000, 114000000, 6000000, "15/08/2026 08:30", "HOAN_TAT"]
    ]);
  }

  // 8. NO_TON_DONG
  const noTonSheet = ss.getSheetByName("NO_TON_DONG");
  if (noTonSheet && noTonSheet.getLastRow() < 2) {
    noTonSheet.getRange(2, 1, 2, 8).setValues([
      ["KH008892", "KU-2025-0982", 0, 6000000, 6000000, "DOT-202608-K2", "CHUA_THU", "15/08/2026 10:00"],
      ["KH009102", "KU-2026-0312", 0, 6500000, 6500000, "DOT-202608-K1", "CHUA_THU", "05/08/2026 10:00"]
    ]);
  }
}
