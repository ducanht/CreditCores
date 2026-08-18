// =========================================================================================
// THIẾT LẬP GOOGLE SHEET ID TRỰC TIẾP TRONG CODE TẠI ĐÂY
// Bạn chỉ cần thay đổi chuỗi ID bên dưới và chọn hàm "runSetupDirectly" rồi nhấn "Run" / "Chạy"
// (Ví dụ: "1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw")
// =========================================================================================
const DIRECT_SHEET_ID = "1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw";

/**
 * HÀM CHÍNH ĐỂ BẤM "RUN" (CHẠY) TRỰC TIẾP TỪ EDITOR APPS SCRIPT
 */
function runSetupDirectly() {
  Logger.log(">>> Bắt đầu khởi tạo CSDL với Google Sheet ID cấu hình trong Code: " + DIRECT_SHEET_ID);
  setupAllSheets(DIRECT_SHEET_ID);
}

/**
 * HÀM TỰ ĐỘNG TẠO MENU TRÊN GOOGLE SHEETS
 */
function onOpen() {
  let ui;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    ui = null;
  }
  if (ui) {
    ui.createMenu('Hệ thống Tín dụng')
      .addItem('Khởi tạo CSDL (Nhập Sheet ID)', 'promptAndSetupSheets')
      .addItem('Khởi tạo CSDL với Sheet ID mặc định', 'runSetupDirectly')
      .addToUi();
  }
}

/**
 * HÀM HIỂN THỊ HỘP THOẠI NHẬP SHEET ID DÀNH CHO DỰ ÁN STANDALONE
 */
function promptAndSetupSheets() {
  let ui;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    ui = null;
  }

  if (ui) {
    const response = ui.prompt(
      'Khởi tạo Cơ sở Dữ liệu Tín dụng & Trích nợ',
      'Nhập Google Sheet ID (Để trống nếu muốn sử dụng Sheet ID trong Code: ' + DIRECT_SHEET_ID + '):',
      ui.ButtonSet.OK_CANCEL
    );

    if (response.getSelectedButton() === ui.Button.OK) {
      let sheetId = response.getResponseText().trim();
      if (!sheetId) sheetId = DIRECT_SHEET_ID;
      setupAllSheets(sheetId);
      ui.alert('Thành công', 'Đã khởi tạo và định dạng hoàn tất toàn bộ CSDL!', ui.ButtonSet.OK);
    }
  } else {
    runSetupDirectly();
  }
}

/**
 * HÀM THỰC THI TRỰC TIẾP TỪ EDITOR VỚI SHEET ID TÙY CHỌN
 * @param {string} [sheetId] - Google Sheet ID
 */
function executeSetupWithSheetID(sheetId) {
  const targetId = sheetId || DIRECT_SHEET_ID;
  setupAllSheets(targetId);
}

/**
 * KHỞI TẠO TOÀN BỘ CƠ SỞ DỮ LIỆU HỆ THỐNG TRÍCH NỢ & QUẢN LÝ TÍN DỤNG
 * @param {string} [targetSheetId] - Google Sheet ID tùy chọn
 */
function setupAllSheets(targetSheetId) {
  let ss;
  const finalSheetId = targetSheetId || DIRECT_SHEET_ID;

  if (finalSheetId) {
    try {
      ss = SpreadsheetApp.openById(finalSheetId);
    } catch (e) {
      Logger.log("Lỗi không tìm thấy hoặc không có quyền truy cập Sheet ID: " + finalSheetId);
      throw new Error("Không thể mở Google Sheet với ID: " + finalSheetId + ". Vui lòng kiểm tra lại ID và quyền chia sẻ.");
    }
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  
  Logger.log("Đang khởi tạo toàn bộ CSDL trên file Google Sheet: " + ss.getName() + " [ID: " + ss.getId() + "]");

  // 1. Cấu hình bảng SETTING (Cấu hình & Hàng đợi lệnh)
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

  // 2. Cấu hình bảng KH_CORE (Thông tin Khách hàng & Thành viên)
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

  // 3. Cấu hình bảng HDTD_CORE (Hợp đồng Tín dụng / Khế ước từ Core SQL)
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

  // 4. Cấu hình bảng DS_TRICH_NO (Danh sách đăng ký trích nợ tự động)
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

  // 5. Cấu hình bảng DOT_TRICH_NO (Quản lý các đợt/kỳ trích nợ)
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

  // 6. Cấu hình bảng LICH_SU_GIAO_DICH (Chi tiết kết quả từng hợp đồng trong đợt)
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

  // 7. Cấu hình bảng NO_TON_DONG (Sổ theo dõi nợ tồn chuyển kỳ sau)
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

  // 8. Cấu hình bảng BAO_CAO_THAM_DINH (Hồ sơ Thẩm định & Tài sản đảm bảo chi tiết)
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

  // 9. Cấu hình bảng KIEM_TRA_VON (Biên bản Kiểm tra Sử dụng Vốn vay)
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

  // Populating sample data
  seedSampleData(ss);

  SpreadsheetApp.flush();
  Logger.log("--- ĐÃ KHỞI TẠO VÀ NẠP DỮ LIỆU MẪU HOÀN TẤT CHO CSDL GOOGLE SHEETS ---");
}

/**
 * HÀM PHỤ TRỢ TẠO, TÔ MÀU, ĐỊNH DẠNG VÀ CỐ ĐỊNH TỪNG SHEET
 */
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

/**
 * NẠP DỮ LIỆU MẪU BAN ĐẦU ĐỂ KIỂM THỬ HỆ THỐNG
 */
function seedSampleData(ss) {
  // KH_CORE sample data
  const khSheet = ss.getSheetByName("KH_CORE");
  if (khSheet.getLastRow() < 2) {
    khSheet.getRange(2, 1, 2, 15).setValues([
      ["KH008892", "NGUYỄN VĂN AN", "Thôn 3, Xã Yên Thọ", "15/05/1985", "038086012345", "15/05/2021", "CA Tỉnh Thanh Hóa", "02373850123", "0912345678", "3500205123456", "Thôn 3, Xã Yên Thọ", "TV-0892", "CP-0412", "10/01/2018", 15000000],
      ["KH009102", "LÊ THỊ MAI", "Thôn 1, Xã Yên Trường", "20/10/1990", "038190098765", "10/08/2020", "CA Tỉnh Thanh Hóa", "02373850999", "0988123456", "3500205987654", "Thôn 1, Xã Yên Trường", "TV-0910", "CP-0511", "15/03/2019", 20000000]
    ]);
  }

  // HDTD_CORE sample data
  const hdtdSheet = ss.getSheetByName("HDTD_CORE");
  if (hdtdSheet.getLastRow() < 2) {
    hdtdSheet.getRange(2, 1, 2, 11).setValues([
      ["KU-2025-0982", "KH008892", 300000000, 250000000, 9.50, "15/08/2025", "15/08/2026", "15/07/2026", "LV01", 12, "Cho vay sản xuất Nông nghiệp"],
      ["KU-2026-0145", "KH008892", 300000000, 200000000, 10.20, "10/02/2026", "10/02/2028", "10/07/2026", "LV03", 24, "Cho vay Kinh doanh Thương mại"]
    ]);
  }

  // BAO_CAO_THAM_DINH sample data
  const tdSheet = ss.getSheetByName("BAO_CAO_THAM_DINH");
  if (tdSheet.getLastRow() < 2) {
    tdSheet.getRange(2, 1, 2, 20).setValues([
      [
        "BCTD-2026-081", "KH008892", "NGUYỄN VĂN AN", 300000000, 300000000, 12, 9.50, 25000000, "Hang A (Tot)",
        "Quyền sử dụng đất ở", "Nguyễn Văn An (Chính chủ)", "QSD đất ở số GCN: DT 123456, Thửa 42, TBĐ 08. DT: 150m2 tại Thôn 3, Yên Thọ.",
        600000000, 0.50, "https://drive.google.com/drive/folders/tsbd_kh008892", "https://drive.google.com/drive/folders/thamdinh_kh008892",
        "Thap", "Dong y cap tin dung", "10/08/2025", "Lê Văn Tín"
      ],
      [
        "BCTD-2026-112", "KH009102", "LÊ THỊ MAI", 200000000, 150000000, 24, 10.20, 18000000, "Hang B (Trung binh)",
        "Quyền sử dụng đất trồng cây", "Lê Thị Mai", "QSD đất số GCN: BK 987654. DT: 500m2 tại Thôn 1, Yên Trường.",
        300000000, 0.50, "https://drive.google.com/drive/folders/tsbd_kh009102", "https://drive.google.com/drive/folders/thamdinh_kh009102",
        "Binh thuong", "Dong y cap tin dung", "05/02/2026", "Nguyễn Thị Mai"
      ]
    ]);
  }
}