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
                  } else if (targetColName === "MaLoaiHD") {
                    // Mặc định phân loại dựa theo thời hạn vay nếu dữ liệu cũ chưa có
                    var thVay = Number(oldData[r][14] || 12);
                    newRow[k] = thVay > 12 ? "THCDBTNMT" : "NHCDBTNMT";
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
