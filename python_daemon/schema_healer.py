"""
========================================================================================
HỆ THỐNG QUẢN LÝ TÍN DỤNG & TRÍCH NỢ AUTOMATION - QTDND YÊN THỌ
File: schema_healer.py
Mục đích: Module chuyên trách khởi tạo & tự động chữa lành cấu trúc CSDL 13+ Bảng
          trên Google Sheets (Self-Healing Schema - Zero Data Loss).
========================================================================================
"""

import logging
import gspread

# Cấu hình logger mặc định
logger = logging.getLogger("CreditCoreSchemaHealer")

# ========================================================================================
# CẤU TRÚC 13+ BẢNG CHUẨN MỰC HỆ THỐNG CREDITCORES
# ========================================================================================
ALL_SCHEMAS = {
    "ROLES": {
        "headers": ["RoleCode", "RoleName", "Permissions", "Description", "UpdatedAt"],
        "color": {"red": 0.12, "green": 0.24, "blue": 0.38},
        "defaultData": [
            ["ADMIN", "Quản Trị Viên Toàn Quyền", '["dashboard","customer360","appraisal","inspection","debit_register","debit_batch","reconciliation","debt_warning","reports","templates","user_management","settings"]', "Toàn quyền quản trị hệ thống và người dùng", "15/08/2026 08:00:00"],
            ["CBTD", "Cán Bộ Tín Dụng", '["dashboard","customer360","appraisal","inspection","debit_register","debt_warning","reports","templates"]', "Thẩm định, kiểm tra vốn và theo dõi khách hàng", "15/08/2026 08:00:00"],
            ["KETOAN", "Kế Toán Viên / Thủ Quỹ", '["dashboard","customer360","debit_register","debit_batch","reconciliation","debt_warning","reports","templates"]', "Quản lý trích nợ, đối soát và sổ theo dõi nợ", "15/08/2026 08:00:00"],
            ["BKS", "Ban Kiểm Soát", '["dashboard","customer360","appraisal","inspection","debt_warning","reports","templates"]', "Kiểm soát, giám sát rủi ro và báo cáo", "15/08/2026 08:00:00"],
            ["LANHDAO", "Ban Giám Đốc / HĐQT", '["dashboard","customer360","appraisal","inspection","debit_batch","reconciliation","debt_warning","reports","templates"]', "Giám sát tổng quan báo cáo và phê duyệt rủi ro", "15/08/2026 08:00:00"]
        ]
    },
    "USERS": {
        "headers": ["Username", "PasswordHash", "FullName", "Role", "CustomPermissions", "Status", "CreatedAt", "LastLogin"],
        "color": {"red": 0.04, "green": 0.10, "blue": 0.17},
        "defaultData": [
            ["qtdyentho.admin", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Quản Trị Viên Hệ Thống", "ADMIN", "[]", "ACTIVE", "15/08/2026 08:00:00", ""],
            ["qtdyentho.huyennhu", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Trần Như Huyền (CBTD Quý Lộc)", "CBTD", "[]", "ACTIVE", "15/08/2026 08:00:00", ""],
            ["qtdyentho.luudinh", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Lưu Thị Định (CBTD Yên Trường)", "CBTD", "[]", "ACTIVE", "15/08/2026 08:00:00", ""],
            ["qtdyentho.huunhan", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Nguyễn Hữu Nhân (CBTD Vĩnh Lộc)", "CBTD", "[]", "ACTIVE", "15/08/2026 08:00:00", ""],
            ["qtdyentho.ketoan", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Nguyễn Thị Hương (Kế toán)", "KETOAN", "[]", "ACTIVE", "15/08/2026 08:00:00", ""],
            ["qtdyentho.bks", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Ban Kiểm Soát", "BKS", "[]", "ACTIVE", "15/08/2026 08:00:00", ""]
        ]
    },
    "SETTING": {
        "headers": ["COMMAND", "STATUS", "REQUEST_TIME", "START_TIME", "FINISH_TIME", "TOTAL_ROWS", "MESSAGE"],
        "color": {"red": 0.12, "green": 0.16, "blue": 0.23},
        "defaultData": [["IDLE", "SUCCESS", "15/08/2026 08:00:00", "15/08/2026 08:00:00", "15/08/2026 08:00:00", 0, "Hệ thống sẵn sàng đồng bộ."]]
    },
    "KH_CORE": {
        "headers": [
            "MaKH", "HoTen", "DiaChi", "NgaySinh", "CCCD", "NgayCap", "NoiCap",
            "DienThoai", "DienThoaiDD", "SoTK", "KhuVuc", "SoTV", "SoSoCP",
            "NgayVaoTV", "TongTienCP", "NgayCapNhat",
            "TongDuNoHienTai", "SoLuongHDVay", "TrangThaiVay", "NhomNoCIC", "KvXa", "KvThon"
        ],
        "color": {"red": 0.0, "green": 0.30, "blue": 0.25}
    },
    "HDTD_CORE": {
        "headers": [
            "SoHDTD", "MaKH", "TienVay", "DuNo", "LaiSuat", "NgayVay", "DenHan",
            "TraLaiDenNgay", "MaLoaiVay", "SoThangVay", "MoTaVay", "CBTD_PhuTrach",
            "Ten_CBTD", "TrangThaiHD", "NgayTatToan", "NgayCapNhat",
            "HoTen", "CCCD", "DienThoai", "DiaChi", "KvXa", "KvThon"
        ],
        "color": {"red": 0.11, "green": 0.21, "blue": 0.36}
    },
    "DANG_KY_TRICH_NO": {
        "headers": [
            "SoHDTD", "NgayVay", "TraLaiDenNgay", "LaiSuat", "MaKH", "TenKH", "SoTK",
            "SoTienLai", "SoTienNo", "SoGoc", "TongTien", "KyTrichNo", "TrangThai", "GhiChu", "NgayTao"
        ],
        "color": {"red": 0.06, "green": 0.32, "blue": 0.20}
    },
    "LICH_SU_TRICH_NO": {
        "headers": [
            "MaDot", "SoHDTD", "MaKH", "TenKH", "SoTK", "TongTienPhaiThu", "DaTrich",
            "ConNo", "TrangThaiCore", "MaGiaoDichCore", "NgayTrich"
        ],
        "color": {"red": 0.72, "green": 0.11, "blue": 0.11}
    },
    "DOT_TRICH_NO": {
        "headers": [
            "MaDot", "ThangNam", "KyTrichNo", "TongSoHD", "TongSoKH", "TongPhaiThu",
            "TongDaTrich", "TongConNo", "TrangThai", "NgayTao"
        ],
        "color": {"red": 0.29, "green": 0.08, "blue": 0.55}
    },
    "NO_TON_DONG": {
        "headers": [
            "SoHDTD", "MaKH", "TenKH", "GocTon", "LaiTon", "TongNoTon", "KyPhatSinh",
            "TrangThai", "GhiChu", "NgayCapNhat"
        ],
        "color": {"red": 0.90, "green": 0.32, "blue": 0.0}
    },
    "DASHBOARD_SNAPSHOT": {
        "headers": [
            "MaKhuVuc", "TenKhuVuc", "CapKhuVuc", "TongDuNo", "TongTienVay", "SoLuongHD",
            "SoLuongKH", "DuNoBinhQuan", "DuNo_NongNghiep", "DuNo_TieuDung", "DuNo_ThuongMai",
            "DuNo_CBTD_Huyen", "DuNo_CBTD_Dinh", "DuNo_CBTD_Nhan", "DuNo_QuaHan", "NgayCapNhat"
        ],
        "color": {"red": 0.02, "green": 0.59, "blue": 0.41}
    },
    "THAM_DINH_TD": {
        "headers": [
            "MaBCTD", "MaKH", "HoTen", "SoCCCD", "NgaySinh", "GioiTinh", "DienThoai", "DiaChi", "TinhTrangHonNhan", "NguoiDongVay",
            "HinhAnhKH", "NganhNghe", "TrinhDo", "ThuNhapNguoiVay", "NguonThuNguoiVay", "ThuNhapDongVay", "NguonThuDongVay", "ChungMinhThuNhap", "ThuNhapRong",
            "DeXuatVay", "MucDichVay", "ThoiHanVay", "PhuongThucTraNo", "CoTSBD", "HinhThucBaoDam", "LoaiTSBD", "SoGCN", "ThuaDatSo", "ToBanDoSo",
            "DienTich", "DiaChiTSBD", "ChuSoHuuTSBD", "QuanHeVoiNguoiVay", "GiaTriTSBD", "NguonGocTSBD", "GiaTriThiTruong", "HinhAnhTSBD", "ChiTietLoaiDat", "GiaTriCongTrinh", "TinhTrangPhapLyTSBD", "MoTaTSBD",
            "ThuNhapChinh", "ThuNhapPhu", "TongThuNhapThang", "ChiPhiSinhHoat", "ChiPhiSXKD", "TongChiPhiThang", "ThangDuThang",
            "XepHangCIC", "SoTCTDQuanHe", "DuNoCICNgoai", "LichSuTraNo", "GhiChuCIC", "DiaDiemThamDinh", "HienTrangSXKD", "TuCachKhachHang",
            "DuyetVay", "ThoiHanThang", "LaiSuatDuyet", "PhuongThucGiaiNgan", "PhuongThucTraGoc", "PhuongAnToiUu", "BienPhapBaoDam", "TyLeLTV", "NghiaVuTraNoThang", "TyLeDSR",
            "HeSoBuDap", "DieuKienGiaiNgan", "MucDoRuiRo", "KetLuan", "CanBoThamDinh", "CanBoLapUsername", "DanhSachYKien", "NgayLap"
        ],
        "color": {"red": 0.10, "green": 0.14, "blue": 0.49}
    },
    "KIEM_TRA_VON": {
        "headers": [
            "MaBBKT", "SoHDTD", "MaKH", "HoTen", "LoaiDoanKT", "ThanhPhanDoan", "NgayKiemTra",
            "LanKiemTra", "NgayKTNext", "HinhThuc", "DiaDiemKT", "DanhGiaMucDich",
            "TienDoSuDungVon", "MucDoRuiRo", "MoTaThucTe", "KienNghi", "FileBienBanUrl",
            "HinhAnhKiemTra", "TrangThai", "NgayTao"
        ],
        "color": {"red": 0.22, "green": 0.28, "blue": 0.31}
    },
    "TSBD_CORE": {
        "headers": [
            "MaTSBD", "SoGCN", "SoVaoSoCapGCN", "NgayCapGCN", "NoiCapGCN", "MaKH", "ChuSoHuu", "CCCD_ChuTS",
            "QuanHeChuTS", "NguoiDongSoHuu", "ThuaDatSo", "ToBanDoSo", "DiaChiThuaDat", "DienTich", "HinhThucSuDung",
            "ChiTietPhanLoaiDat", "NguonGocSuDung", "GiaTriDinhGiaQTD", "GiaTriThiTruong", "TyLeChoVayToiDa",
            "SoTienDamBaoToiDa", "TrangThaiTheChap", "SoHDTD_LienKet", "SoCongChung", "NgayCongChung",
            "VanPhongCongChung", "SoDangKyGDBD", "NgayDangKyGDBD", "HinhAnhGCN", "HinhAnhThucDia", "NgayCapNhat"
        ],
        "color": {"red": 0.0, "green": 0.41, "blue": 0.36}
    },
    "CAU_HINH_BIEU_MAU": {
        "headers": ["Id", "MaBM", "TenBM", "PhanHe", "LoaiNguon", "LinkNguon", "MoTa", "TruongTron", "TrangThai", "NgayCapNhat"],
        "color": {"red": 0.26, "green": 0.22, "blue": 0.79}
    },
    "DOCUMENT_STORAGE": {
        "headers": ["ID_HOP_DONG", "MA_KH", "TEN_KHACH_HANG", "LOAI_BIEU_MAU", "NGUOI_LAP", "NGAY_LAP", "LINK_GOOGLE_DOC", "LINK_PDF", "TRANG_THAI"],
        "color": {"red": 0.15, "green": 0.68, "blue": 0.38}
    },
    "BC_DOANH_SO_TD": {
        "headers": [
            "SoHDTD", "MaKH", "SoTV", "TienVay", "DuNo", "LaiSuat", "NgayVay", "DenHan",
            "MaLoaiVay", "SoThangVay", "MoTaVay", "KhuVuc"
        ],
        "color": {"red": 0.01, "green": 0.52, "blue": 0.78}
    },
    "TOP_DU_NO_BINH_QUAN": {
        "headers": [
            "NamBaoCao", "XepHang", "MaKH", "HoTen", "SoTV", "KhuVuc",
            "DuNoThang01", "DuNoThang02", "DuNoThang03", "DuNoThang04", "DuNoThang05", "DuNoThang06",
            "DuNoThang07", "DuNoThang08", "DuNoThang09", "DuNoThang10", "DuNoThang11", "DuNoThang12",
            "DuNoBinhQuan", "TongTienVay", "TyTrongDuNo"
        ],
        "color": {"red": 0.71, "green": 0.33, "blue": 0.04}
    }
}

# ========================================================================================
# HÀM KHỞI TẠO VÀ TỰ ĐỘNG CHỮA LÀNH CẤU TRÚC CSDL (SELF-HEALING)
# ========================================================================================
def init_or_heal_database_schema(spreadsheet, log=None):
    """
    Rà soát toàn bộ các bảng trong CSDL Google Sheets:
    - Nếu bảng chưa tồn tại -> Tạo mới, thiết lập tiêu đề cột và màu sắc nhận diện.
    - Nếu bảng đã tồn tại -> Kiểm tra và bổ sung cột còn thiếu (Zero Data Loss).
    """
    active_log = log or logger
    active_log.info("🔧 Bắt đầu rà soát và Self-Healing cấu trúc CSDL 13+ Bảng trên Google Sheets...")
    existing_worksheets = {ws.title: ws for ws in spreadsheet.worksheets()}

    for sheet_name, schema in ALL_SCHEMAS.items():
        headers = schema["headers"]
        color = schema.get("color")
        default_data = schema.get("defaultData")

        if sheet_name not in existing_worksheets:
            active_log.info(f"⚡ Bảng '{sheet_name}' chưa có -> Đang tạo mới...")
            ws = spreadsheet.add_worksheet(
                title=sheet_name,
                rows=max(100, len(default_data or []) + 10),
                cols=len(headers) + 2
            )
            # Ghi tiêu đề
            ws.update(values=[headers], range_name=f"A1:{gspread.utils.rowcol_to_a1(1, len(headers))}")

            # Định dạng hàng tiêu đề (Tô màu nền, chữ trắng đậm)
            try:
                if color:
                    ws.format(f"A1:{gspread.utils.rowcol_to_a1(1, len(headers))}", {
                        "backgroundColor": color,
                        "horizontalAlignment": "CENTER",
                        "textFormat": {"foregroundColor": {"red": 1, "green": 1, "blue": 1}, "bold": True}
                    })
            except Exception as fmt_err:
                active_log.debug(f"Không thể định dạng màu cho '{sheet_name}': {fmt_err}")

            # Ghi dữ liệu mẫu mặc định nếu có
            if default_data:
                ws.update(
                    values=default_data,
                    range_name=f"A2:{gspread.utils.rowcol_to_a1(1 + len(default_data), len(headers))}",
                    value_input_option="USER_ENTERED"
                )
            active_log.info(f"✅ Đã tạo thành công bảng '{sheet_name}'.")
        else:
            ws = existing_worksheets[sheet_name]
            cur_headers = ws.row_values(1)
            if not cur_headers:
                ws.update(values=[headers], range_name=f"A1:{gspread.utils.rowcol_to_a1(1, len(headers))}")
            elif len(cur_headers) < len(headers):
                active_log.info(f"🔄 Bảng '{sheet_name}' thiếu {len(headers) - len(cur_headers)} cột -> Tự động bổ sung...")
                ws.update(values=[headers], range_name=f"A1:{gspread.utils.rowcol_to_a1(1, len(headers))}")

    active_log.info("✨ Hoàn tất kiểm tra và đồng bộ cấu trúc CSDL Google Sheets!")

def get_or_create_worksheet(spreadsheet, title, headers, log=None):
    """
    Tự động tìm hoặc tạo mới worksheet nếu chưa tồn tại trên Google Spreadsheet.
    """
    active_log = log or logger
    try:
        sheet = spreadsheet.worksheet(title)
        cur_headers = sheet.row_values(1)
        if not cur_headers or len(cur_headers) < len(headers):
            sheet.update(values=[headers], range_name=f"A1:{gspread.utils.rowcol_to_a1(1, len(headers))}")
        return sheet
    except gspread.exceptions.WorksheetNotFound:
        active_log.info(f"⚡ Sheet '{title}' chưa có, tự động tạo mới...")
        sheet = spreadsheet.add_worksheet(title=title, rows=100, cols=len(headers) + 5)
        sheet.update(values=[headers], range_name=f"A1:{gspread.utils.rowcol_to_a1(1, len(headers))}")
        return sheet


if __name__ == "__main__":
    import sys
    print("=" * 70)
    print("🚀 CREDITCORES - CHƯƠNG TRÌNH TỰ ĐỘNG KHỞI TẠO & NÂNG CẤP CSDL GOOGLE SHEETS")
    print("   (Self-Healing Schema - Bảo toàn 100% dữ liệu cũ)")
    print("=" * 70)
    try:
        init_or_heal_database_schema()
        print("\n✅ THÀNH CÔNG: Toàn bộ cấu trúc CSDL đã được đồng bộ chuẩn xác!")
    except Exception as e:
        print(f"\n❌ LỖI KHỞI TẠO: {e}", file=sys.stderr)
        sys.exit(1)

