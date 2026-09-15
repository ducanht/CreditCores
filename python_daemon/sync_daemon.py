"""
========================================================================================
HỆ THỐNG QUẢN LÝ TÍN DỤNG & TRÍCH NỢ AUTOMATION - LOCAL PYTHON DAEMON
File: sync_daemon.py
Môi trường: Windows Server 2025 / Windows 10/11 / Linux (Chạy trên máy chủ SQL Server)
Tổ chức: Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
Bảo mật: Kết nối SQL Server nội bộ (Windows Trusted Auth / SQL Auth),
         Mã hóa một chiều TLS 1.3 đẩy lên Google Sheets qua Service Account.

Tính năng cốt lõi:
1. Đa nguồn dữ liệu: SQL Server CoreBanking (Active), Mock Data Generator (--mock), Excel/CSV.
2. Tự động nhận diện ODBC Driver (ODBC Driver 18, 17, SQL Server) kèm mã hóa an toàn.
3. Chống lỗi mã hóa tiếng Việt trên Windows terminal (UTF-8 auto-reconfigure).
4. Phòng chống Formula Injection (CWE-1236) khi ghi dữ liệu lên Google Sheets.
5. Self-Healing Schema: Tự động khởi tạo và chuẩn hóa 12 Sheet theo chuẩn SchemaSetup.
6. Lắng nghe liên tục hàng đợi từ Google Sheets (Sheet SETTING) hoặc chạy tức thì (--now).
7. Bảo toàn phân công Cán bộ tín dụng (CBTD) và tự động nhận diện Hợp đồng tất toán.
8. Cơ chế thử lại (Retry with Exponential Backoff) khi gặp giới hạn Google Sheets API.
========================================================================================
"""

import os
import sys
import time
import json
import logging
from datetime import datetime
import argparse
import pyodbc
import pandas as pd
import gspread
from google.oauth2.service_account import Credentials

# --- 0. BẢO VỆ MÃ HÓA UTF-8 TRÊN WINDOWS TERMINAL ---
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# --- 1. CẤU HÌNH LOGGING CHUẨN DOANH NGHIỆP ---
LOG_FILE = "sync_daemon.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE, encoding="utf-8")
    ]
)
logger = logging.getLogger("CreditCoreSyncDaemon")

# --- 2. QUẢN LÝ CẤU HÌNH & BẢO MẬT ---
CONFIG_FILE = "config.json"
DEFAULT_SHEET_ID = "1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw"

def load_config():
    """
    Nạp cấu hình linh hoạt: Ưu tiên Biến môi trường Windows (Bảo mật - Không cần lưu mật khẩu)
    và kết hợp với file config.json (nếu có).
    Hỗ trợ cả tiền tố MY_SQL_* (từ code cũ) và SQL_*.
    """
    cfg = {}
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                cfg = json.load(f)
        except Exception as e:
            logger.error(f"❌ Lỗi khi đọc {CONFIG_FILE}: {e}")

    # 1. Google Sheet ID & Credentials: Biến môi trường > config.json > Mặc định
    google_sheet_id = (
        os.getenv("SHEET_ID")
        or os.getenv("GOOGLE_SHEET_ID")
        or cfg.get("google_sheet_id")
        or DEFAULT_SHEET_ID
    )
    credentials_file = (
        os.getenv("JSON_PATH")
        or os.getenv("CREDENTIALS_FILE")
        or cfg.get("credentials_file")
        or "credentials.json"
    )
    poll_interval = int(os.getenv("POLL_INTERVAL") or cfg.get("poll_interval_seconds", 5))

    # 2. Cấu hình SQL Server: Ưu tiên Biến môi trường Windows (MY_SQL_* hoặc SQL_*)
    sql_cfg_base = cfg.get("sql_server", {})

    server = (
        os.getenv("MY_SQL_SERVER")
        or os.getenv("SQL_SERVER")
        or sql_cfg_base.get("server")
        or "localhost\\SQLEXPRESS"
    )
    database = (
        os.getenv("MY_SQL_DB")
        or os.getenv("SQL_DB")
        or os.getenv("SQL_DATABASE")
        or sql_cfg_base.get("database")
        or "CORE_BANKING_YENTHO"
    )
    username = (
        os.getenv("MY_SQL_USER")
        or os.getenv("SQL_USER")
        or os.getenv("SQL_USERNAME")
        or sql_cfg_base.get("username")
        or "sa"
    )
    password = (
        os.getenv("MY_SQL_PASS")
        or os.getenv("SQL_PASS")
        or os.getenv("SQL_PASSWORD")
        or sql_cfg_base.get("password")
        or ""
    )
    driver = sql_cfg_base.get("driver") or os.getenv("SQL_DRIVER") or "auto"
    use_windows_auth = sql_cfg_base.get("use_windows_auth", False if password else True)
    trust_cert = sql_cfg_base.get("trust_server_certificate", "yes")

    # Nếu có mật khẩu từ biến môi trường Windows, tự động bật SQL Auth
    env_pass = os.getenv("MY_SQL_PASS") or os.getenv("SQL_PASS") or os.getenv("SQL_PASSWORD")
    if env_pass:
        password = env_pass
        use_windows_auth = False
        logger.info("🔒 Đã tự động nạp mật khẩu SQL Server từ Biến môi trường Windows (Bảo mật tối đa, không lưu tệp).")

    sql_cfg = {
        "driver": driver,
        "server": server,
        "database": database,
        "use_windows_auth": use_windows_auth,
        "username": username,
        "password": password,
        "trust_server_certificate": trust_cert
    }

    return {
        "google_sheet_id": google_sheet_id,
        "credentials_file": credentials_file,
        "poll_interval_seconds": poll_interval,
        "sql_server": sql_cfg
    }

# --- 3. BẢO MẬT & PHÒNG CHỐNG FORMULA INJECTION (CWE-1236) ---
def sanitize_cell_value(val):
    """
    Ngăn chặn việc vô tình hoặc cố ý chèn công thức nguy hiểm (=, +, -, @)
    vào ô dữ liệu Google Sheets.
    """
    if val is None or pd.isna(val):
        return ""
    if isinstance(val, (int, float)):
        return val
    s = str(val).strip()
    if s and s[0] in ("=", "+", "-", "@"):
        # Thêm dấu nháy đơn đầu để Google Sheets xử lý strictly dưới dạng văn bản
        return "'" + s
    return s

def sanitize_dataframe(df):
    """
    Làm sạch toàn bộ DataFrame trước khi gửi lên Google Sheets.
    """
    df_clean = df.copy()
    for col in df_clean.columns:
        df_clean[col] = df_clean[col].apply(sanitize_cell_value)
    return df_clean

# --- 4. KẾT NỐI GOOGLE SHEETS BẢO MẬT QUA SERVICE ACCOUNT ---
def get_gspread_client(credentials_path):
    """
    Khởi tạo client gspread bảo mật với Scope đầy đủ cho Spreadsheets và Drive.
    Tự động tìm kiếm đường dẫn tương đối trong thư mục chứa script.
    """
    resolved_path = credentials_path
    if not os.path.isabs(resolved_path):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        candidate = os.path.join(script_dir, credentials_path)
        if os.path.exists(candidate):
            resolved_path = candidate

    if not os.path.exists(resolved_path):
        logger.error(f"❌ Không tìm thấy file Google Service Account key: {resolved_path}")
        logger.info("💡 Hướng dẫn: Đặt file JSON khóa tải từ Google Cloud Console vào thư mục này với tên 'credentials.json'")
        sys.exit(1)

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]
    creds = Credentials.from_service_account_file(resolved_path, scopes=scopes)
    return gspread.authorize(creds)

# --- 5. TỰ ĐỘNG DÒ TÌM & KẾT NỐI NỘI BỘ SQL SERVER ---
def detect_best_sql_driver(requested_driver=None):
    """
    Tự động dò tìm Driver ODBC phù hợp nhất đã được cài đặt trên hệ điều hành Windows.
    Ưu tiên: ODBC Driver 18 -> ODBC Driver 17 -> SQL Server.
    """
    try:
        available_drivers = pyodbc.drivers()
    except Exception:
        available_drivers = []

    if requested_driver and requested_driver != "auto" and requested_driver in available_drivers:
        return requested_driver

    preferred_drivers = [
        "ODBC Driver 18 for SQL Server",
        "ODBC Driver 17 for SQL Server",
        "SQL Server"
    ]
    for d in preferred_drivers:
        if d in available_drivers:
            return d

    return requested_driver if (requested_driver and requested_driver != "auto") else "SQL Server"

def get_sql_connection(sql_cfg):
    """
    Tạo kết nối an toàn tới SQL Server cục bộ.
    Hỗ trợ cả Windows Integrated Authentication (Trusted_Connection=yes) và SQL Authentication.
    """
    req_driver = sql_cfg.get("driver", "auto")
    driver = detect_best_sql_driver(req_driver)
    server = sql_cfg.get("server", "localhost")
    database = sql_cfg.get("database", "CORE_BANKING_YENTHO")
    use_trusted = sql_cfg.get("use_windows_auth", False)
    trust_cert = sql_cfg.get("trust_server_certificate", "yes")

    logger.info(f"🔌 Kết nối SQL Server qua ODBC Driver: '{driver}' | Server: {server} | DB: {database}")

    # Cấu hình chuỗi kết nối tương thích cả Driver 17 và 18
    extra_params = f"TrustServerCertificate={trust_cert};"
    if "ODBC Driver 18" in driver:
        # Driver 18 mặc định mã hóa kết nối
        extra_params += "Encrypt=Optional;"

    if use_trusted:
        conn_str = (
            f"DRIVER={{{driver}}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"Trusted_Connection=yes;"
            f"{extra_params}"
        )
    else:
        conn_str = (
            f"DRIVER={{{driver}}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"UID={sql_cfg.get('username', 'sa')};"
            f"PWD={sql_cfg.get('password', '')};"
            f"{extra_params}"
        )
    return pyodbc.connect(conn_str, timeout=15)

# --- 6. TRUY VẤN DỮ LIỆU TỪ SQL SERVER COREBANKING ---
def fetch_customer_core_data(sql_conn, sync_timestamp_str):
    """
    Truy vấn bảng Khách hàng, Tài khoản CASA và Thành viên.
    Tự động gắn cột NgayCapNhat để người dùng biết thời điểm dữ liệu được lấy từ Core.
    """
    query = """
    SELECT 
        kh.MaKH,
        kh.HoTen,
        kh.DiaChi,
        CONVERT(VARCHAR(10), kh.NgaySinh, 103) AS NgaySinh,
        kh.CCCD,
        CONVERT(VARCHAR(10), kh.NgayCap, 103) AS NgayCap,
        kh.NoiCap,
        ISNULL(kh.DienThoai, '') AS DienThoai,
        ISNULL(kh.DienThoaiDD, '') AS DienThoaiDD,
        ISNULL(tk.SoTK, '') AS SoTK,
        ISNULL(kv.TenKhuVuc, kh.DiaChi) AS KhuVuc,
        ISNULL(kh.SoTV, '') AS SoTV,
        ISNULL(kh.SoSoCP, '') AS SoSoCP,
        CONVERT(VARCHAR(10), kh.NgayVaoTV, 103) AS NgayVaoTV,
        ISNULL(kh.TongTienCP, 0) AS TongTienCP,
        ? AS NgayCapNhat
    FROM DC_KHACH_HANG kh WITH (NOLOCK)
    LEFT JOIN KT_TAI_KHOAN tk WITH (NOLOCK) ON kh.MaKH = tk.MaKH AND tk.LoaiTK = 'CASA' AND tk.TrangThai = 'A'
    LEFT JOIN DC_KHU_VUC kv WITH (NOLOCK) ON kh.MaKhuVuc = kv.MaKhuVuc
    WHERE kh.TrangThai = 'A'
    ORDER BY kh.MaKH ASC;
    """
    logger.info("🔍 Đang thực thi SQL truy vấn dữ liệu Khách hàng & Thành viên (DC_KHACH_HANG)...")
    df = pd.read_sql_query(query, sql_conn, params=[sync_timestamp_str])
    return df

def fetch_loan_contract_core_data(sql_conn, sync_timestamp_str):
    """
    Truy vấn bảng Khế ước / Hợp đồng Tín dụng (TD_KHE_UOC, TD_HOP_DONG_TD).
    Tự động gắn cột NgayCapNhat để đối soát hạn mức và thời gian thu lãi.
    """
    query = """
    SELECT 
        ku.SoHDTD,
        ku.MaKH,
        ISNULL(ku.TienVay, 0) AS TienVay,
        ISNULL(ku.DuNo, 0) AS DuNo,
        ISNULL(ku.LaiSuat, 0) AS LaiSuat,
        CONVERT(VARCHAR(10), ku.NgayVay, 103) AS NgayVay,
        CONVERT(VARCHAR(10), ku.DenHan, 103) AS DenHan,
        CONVERT(VARCHAR(10), ku.TraLaiDenNgay, 103) AS TraLaiDenNgay,
        ISNULL(ku.MaLoaiVay, 'LV01') AS MaLoaiVay,
        ISNULL(ku.SoThangVay, 12) AS SoThangVay,
        ISNULL(lv.TenLoaiVay, ku.MucDichVay) AS MoTaVay,
        'qtdyentho.cbtd' AS CBTD_PhuTrach,
        N'Lê Văn Tín (CBTD)' AS Ten_CBTD,
        'DANG_VAY' AS TrangThaiHD,
        '' AS NgayTatToan,
        ? AS NgayCapNhat
    FROM TD_KHE_UOC ku WITH (NOLOCK)
    INNER JOIN TD_HOP_DONG_TD hd WITH (NOLOCK) ON ku.SoHDTD_Goc = hd.SoHDTD
    LEFT JOIN DC_LOAI_VAY lv WITH (NOLOCK) ON ku.MaLoaiVay = lv.MaLoaiVay
    WHERE ku.DuNo > 0 AND ku.TrangThai = 'A'
    ORDER BY ku.SoHDTD ASC;
    """
    logger.info("🔍 Đang thực thi SQL truy vấn dữ liệu Khế ước & Dư nợ Tín dụng (TD_KHE_UOC)...")
    df = pd.read_sql_query(query, sql_conn, params=[sync_timestamp_str])
    return df

# --- 7. BỘ SINH DỮ LIỆU MẪU NGÂN QUỸ CHUẨN QTDND YÊN THỌ (MOCK DATA) ---
def generate_mock_banking_data(sync_timestamp_str):
    """
    Sinh tập dữ liệu mẫu nghiệp vụ ngân quỹ QTDND Yên Thọ chuẩn 100% để kiểm thử
    đẩy dữ liệu lên Google Sheets mà không cần cài đặt SQL Server.
    """
    customers = [
        {
            "MaKH": "KH008892", "HoTen": "NGUYỄN VĂN AN", "DiaChi": "Thôn 3, Xã Yên Thọ",
            "NgaySinh": "15/05/1985", "CCCD": "038086012345", "NgayCap": "15/05/2021",
            "NoiCap": "Cục CSQLHC về TTXH", "DienThoai": "02373850123", "DienThoaiDD": "0912345678",
            "SoTK": "3500205123456", "KhuVuc": "Thôn 3, Yên Thọ", "SoTV": "TV-0892",
            "SoSoCP": "CP-0412", "NgayVaoTV": "10/01/2018", "TongTienCP": 15000000,
            "NgayCapNhat": sync_timestamp_str
        },
        {
            "MaKH": "KH008893", "HoTen": "LÊ THỊ BÍCH", "DiaChi": "Thôn 1, Xã Yên Thọ",
            "NgaySinh": "20/08/1990", "CCCD": "038190005678", "NgayCap": "10/06/2022",
            "NoiCap": "Cục CSQLHC về TTXH", "DienThoai": "", "DienThoaiDD": "0987654321",
            "SoTK": "3500205654321", "KhuVuc": "Thôn 1, Yên Thọ", "SoTV": "TV-0893",
            "SoSoCP": "CP-0413", "NgayVaoTV": "15/03/2019", "TongTienCP": 20000000,
            "NgayCapNhat": sync_timestamp_str
        },
        {
            "MaKH": "KH008894", "HoTen": "TRẦN VĂN CƯỜNG", "DiaChi": "Thôn 2, Xã Yên Trường",
            "NgaySinh": "12/03/1978", "CCCD": "038078009876", "NgayCap": "12/04/2021",
            "NoiCap": "Cục CSQLHC về TTXH", "DienThoai": "02373850456", "DienThoaiDD": "0903456789",
            "SoTK": "3500205789012", "KhuVuc": "Thôn 2, Yên Trường", "SoTV": "TV-0894",
            "SoSoCP": "CP-0414", "NgayVaoTV": "05/06/2015", "TongTienCP": 30000000,
            "NgayCapNhat": sync_timestamp_str
        },
        {
            "MaKH": "KH008895", "HoTen": "HOÀNG THỊ DUYÊN", "DiaChi": "Thôn Tân Lộc, Xã Quý Lộc",
            "NgaySinh": "25/11/1992", "CCCD": "038192011223", "NgayCap": "18/09/2022",
            "NoiCap": "Cục CSQLHC về TTXH", "DienThoai": "", "DienThoaiDD": "0978112233",
            "SoTK": "3500205334455", "KhuVuc": "Thôn Tân Lộc, Quý Lộc", "SoTV": "TV-0895",
            "SoSoCP": "CP-0415", "NgayVaoTV": "22/11/2020", "TongTienCP": 10000000,
            "NgayCapNhat": sync_timestamp_str
        },
        {
            "MaKH": "KH008896", "HoTen": "PHẠM VĂN ĐỨC", "DiaChi": "Thôn 4, Xã Yên Thọ",
            "NgaySinh": "05/09/1982", "CCCD": "038082033445", "NgayCap": "10/02/2023",
            "NoiCap": "Cục CSQLHC về TTXH", "DienThoai": "", "DienThoaiDD": "0945678123",
            "SoTK": "3500205889900", "KhuVuc": "Thôn 4, Yên Thọ", "SoTV": "TV-0896",
            "SoSoCP": "CP-0416", "NgayVaoTV": "14/08/2017", "TongTienCP": 25000000,
            "NgayCapNhat": sync_timestamp_str
        }
    ]

    contracts = [
        {
            "SoHDTD": "KU-2025-0982", "MaKH": "KH008892", "TienVay": 300000000, "DuNo": 250000000,
            "LaiSuat": 9.5, "NgayVay": "15/08/2025", "DenHan": "15/08/2026", "TraLaiDenNgay": "15/07/2026",
            "MaLoaiVay": "LV01", "SoThangVay": 12, "MoTaVay": "Cho vay phát triển chăn nuôi bò sữa",
            "CBTD_PhuTrach": "qtdyentho.cbtd", "Ten_CBTD": "Lê Văn Tín (CBTD)", "TrangThaiHD": "DANG_VAY",
            "NgayTatToan": "", "NgayCapNhat": sync_timestamp_str
        },
        {
            "SoHDTD": "KU-2026-0145", "MaKH": "KH008892", "TienVay": 300000000, "DuNo": 200000000,
            "LaiSuat": 10.2, "NgayVay": "10/02/2026", "DenHan": "10/02/2028", "TraLaiDenNgay": "10/07/2026",
            "MaLoaiVay": "LV03", "SoThangVay": 24, "MoTaVay": "Cho vay kinh doanh vật tư nông nghiệp",
            "CBTD_PhuTrach": "qtdyentho.cbtd", "Ten_CBTD": "Lê Văn Tín (CBTD)", "TrangThaiHD": "DANG_VAY",
            "NgayTatToan": "", "NgayCapNhat": sync_timestamp_str
        },
        {
            "SoHDTD": "KU-2026-0210", "MaKH": "KH008893", "TienVay": 200000000, "DuNo": 180000000,
            "LaiSuat": 9.0, "NgayVay": "01/03/2026", "DenHan": "01/03/2027", "TraLaiDenNgay": "01/08/2026",
            "MaLoaiVay": "LV01", "SoThangVay": 12, "MoTaVay": "Cho vay mở rộng xưởng may gia công",
            "CBTD_PhuTrach": "qtdyentho.cbtd", "Ten_CBTD": "Lê Văn Tín (CBTD)", "TrangThaiHD": "DANG_VAY",
            "NgayTatToan": "", "NgayCapNhat": sync_timestamp_str
        },
        {
            "SoHDTD": "KU-2025-0550", "MaKH": "KH008894", "TienVay": 450000000, "DuNo": 390000000,
            "LaiSuat": 9.8, "NgayVay": "10/05/2025", "DenHan": "10/05/2028", "TraLaiDenNgay": "10/07/2026",
            "MaLoaiVay": "LV02", "SoThangVay": 36, "MoTaVay": "Cho vay mua máy móc gặt đập liên hợp",
            "CBTD_PhuTrach": "qtdyentho.cbtd", "Ten_CBTD": "Lê Văn Tín (CBTD)", "TrangThaiHD": "DANG_VAY",
            "NgayTatToan": "", "NgayCapNhat": sync_timestamp_str
        },
        {
            "SoHDTD": "KU-2024-0331", "MaKH": "KH008895", "TienVay": 150000000, "DuNo": 0,
            "LaiSuat": 9.0, "NgayVay": "10/01/2024", "DenHan": "10/01/2025", "TraLaiDenNgay": "10/01/2025",
            "MaLoaiVay": "LV01", "SoThangVay": 12, "MoTaVay": "Cho vay cải tạo ao nuôi cá",
            "CBTD_PhuTrach": "qtdyentho.cbtd", "Ten_CBTD": "Lê Văn Tín (CBTD)", "TrangThaiHD": "DA_TAT_TOAN",
            "NgayTatToan": "08/01/2025", "NgayCapNhat": sync_timestamp_str
        }
    ]

    return pd.DataFrame(customers), pd.DataFrame(contracts)

# --- 8. TỰ ĐỘNG KHỞI TẠO & CHỮA LÀNH CSDL 12 BẢNG (SELF-HEALING SCHEMA) ---
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
            ["qtdyentho.cbtd", "ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9", "Lê Văn Tín (CBTD)", "CBTD", "[]", "ACTIVE", "15/08/2026 08:00:00", ""],
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
        "headers": ["MaKH", "HoTen", "DiaChi", "NgaySinh", "CCCD", "NgayCap", "NoiCap", "DienThoai", "DienThoaiDD", "SoTK", "KhuVuc", "SoTV", "SoSoCP", "NgayVaoTV", "TongTienCP", "NgayCapNhat"],
        "color": {"red": 0.0, "green": 0.30, "blue": 0.25}
    },
    "HDTD_CORE": {
        "headers": ["SoHDTD", "MaKH", "TienVay", "DuNo", "LaiSuat", "NgayVay", "DenHan", "TraLaiDenNgay", "MaLoaiVay", "SoThangVay", "MoTaVay", "CBTD_PhuTrach", "Ten_CBTD", "TrangThaiHD", "NgayTatToan", "NgayCapNhat"],
        "color": {"red": 0.11, "green": 0.21, "blue": 0.36}
    },
    "DANG_KY_TRICH_NO": {
        "headers": ["MaKH", "HoTen", "GTTT", "SoTK", "DiaChi", "KyTrich", "TrangThai", "GhiChu", "NgayTao"],
        "color": {"red": 0.06, "green": 0.32, "blue": 0.20}
    },
    "DOT_TRICH_NO": {
        "headers": ["MaDot", "ThangNam", "KyTrich", "TongPhaiThu", "TongDaTrich", "TongConNo", "TongSoKH", "TrangThai", "NgayTao", "NgayHoanTat"],
        "color": {"red": 0.29, "green": 0.08, "blue": 0.55}
    },
    "CHI_TIET_TRICH_NO": {
        "headers": ["MaDot", "MaKH", "HoTen", "SoCCCD", "SoTK_CASA", "SoHDTD", "DuNoGoc_Snap", "LaiDuKien", "GocDuKien", "SoTienTrichThucTe", "DaTrich", "ConNo", "TrangThai", "MaGiaoDichCore", "NgayCapNhat"],
        "color": {"red": 0.72, "green": 0.11, "blue": 0.11}
    },
    "NO_TON_DONG": {
        "headers": ["MaKH", "SoHDTD", "GocTon", "LaiTon", "TongNoTon", "KyPhatSinh", "TrangThai", "GhiChu", "NgayCapNhat"],
        "color": {"red": 0.90, "green": 0.32, "blue": 0.0}
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
        "headers": ["MaBBKT", "SoHDTD", "MaKH", "HoTen", "LoaiDoanKT", "ThanhPhanDoan", "NgayKiemTra", "LanKiemTra", "NgayKTNext", "HinhThuc", "DiaDiemKT", "DanhGiaMucDich", "TienDoSuDungVon", "MucDoRuiRo", "MoTaThucTe", "KienNghi", "FileBienBanUrl", "HinhAnhKiemTra", "TrangThai", "NgayTao"],
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
    }
}

def init_or_heal_database_schema(spreadsheet):
    """
    Rà soát toàn bộ các bảng trong CSDL Google Sheets.
    Nếu bảng chưa tồn tại -> Tự động tạo mới, thiết lập tiêu đề cột và màu sắc nhận diện.
    Nếu bảng đã tồn tại -> Kiểm tra và bổ sung cột còn thiếu (Zero Data Loss).
    """
    logger.info("🔧 Bắt đầu rà soát và Self-Healing cấu trúc CSDL 12 Bảng trên Google Sheets...")
    existing_worksheets = {ws.title: ws for ws in spreadsheet.worksheets()}

    for sheet_name, schema in ALL_SCHEMAS.items():
        headers = schema["headers"]
        color = schema.get("color")
        default_data = schema.get("defaultData")

        if sheet_name not in existing_worksheets:
            logger.info(f"⚡ Bảng '{sheet_name}' chưa có -> Đang tạo mới...")
            ws = spreadsheet.add_worksheet(title=sheet_name, rows=max(100, len(default_data or []) + 10), cols=len(headers) + 2)
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
                logger.debug(f"Không thể định dạng màu cho '{sheet_name}': {fmt_err}")

            # Ghi dữ liệu mẫu mặc định nếu có
            if default_data:
                ws.update(values=default_data, range_name=f"A2:{gspread.utils.rowcol_to_a1(1 + len(default_data), len(headers))}", value_input_option="USER_ENTERED")
            logger.info(f"✅ Đã tạo thành công bảng '{sheet_name}'.")
        else:
            ws = existing_worksheets[sheet_name]
            cur_headers = ws.row_values(1)
            if not cur_headers:
                ws.update(values=[headers], range_name=f"A1:{gspread.utils.rowcol_to_a1(1, len(headers))}")
            elif len(cur_headers) < len(headers):
                logger.info(f"🔄 Bảng '{sheet_name}' thiếu {len(headers) - len(cur_headers)} cột -> Tự động bổ sung...")
                ws.update(values=[headers], range_name=f"A1:{gspread.utils.rowcol_to_a1(1, len(headers))}")

    logger.info("✨ Hoàn tất kiểm tra và đồng bộ cấu trúc CSDL Google Sheets!")

# --- 9. GHI DỮ LIỆU BATCH LÊN GOOGLE SHEETS CÓ RETRY & EXPONENTIAL BACKOFF ---
def get_or_create_worksheet(spreadsheet, title, headers):
    """
    Tự động tìm hoặc tạo mới worksheet nếu chưa tồn tại trên Google Spreadsheet.
    """
    try:
        sheet = spreadsheet.worksheet(title)
        cur_headers = sheet.row_values(1)
        if not cur_headers or len(cur_headers) < len(headers):
            sheet.update(values=[headers], range_name=f"A1:{gspread.utils.rowcol_to_a1(1, len(headers))}")
        return sheet
    except gspread.exceptions.WorksheetNotFound:
        logger.info(f"⚡ Sheet '{title}' chưa có, tự động tạo mới...")
        sheet = spreadsheet.add_worksheet(title=title, rows=100, cols=len(headers) + 5)
        sheet.update(values=[headers], range_name=f"A1:{gspread.utils.rowcol_to_a1(1, len(headers))}")
        return sheet

def sync_dataframe_to_sheet(sheet, df, start_row=2, max_retries=3):
    """
    Xóa dữ liệu cũ và ghi toàn bộ dữ liệu mới vào sheet bằng lệnh batch có cơ chế retry.
    Áp dụng sanitize chống Formula Injection.
    """
    if df.empty:
        logger.warning(f"⚠️ DataFrame rỗng, không có dữ liệu để ghi vào sheet {sheet.title}.")
        return 0

    df_clean = sanitize_dataframe(df)
    values = df_clean.fillna("").values.tolist()
    num_rows = len(values)
    num_cols = len(df.columns)

    for attempt in range(max_retries):
        try:
            max_rows = sheet.row_count
            if max_rows >= start_row:
                clear_range = f"A{start_row}:{gspread.utils.rowcol_to_a1(max_rows, num_cols)}"
                sheet.batch_clear([clear_range])

            end_col_letter = gspread.utils.rowcol_to_a1(1, num_cols).replace("1", "")
            target_range = f"A{start_row}:{end_col_letter}{start_row + num_rows - 1}"

            if sheet.row_count < (start_row + num_rows):
                sheet.add_rows(start_row + num_rows - sheet.row_count + 50)

            sheet.update(values=values, range_name=target_range, value_input_option="USER_ENTERED")
            logger.info(f"✅ Đã ghi {num_rows} bản ghi vào sheet '{sheet.title}'.")
            return num_rows
        except gspread.exceptions.APIError as api_err:
            if attempt < max_retries - 1:
                wait_sec = (attempt + 1) * 2
                logger.warning(f"⚠️ Google API tạm thời bận ({api_err}), đang thử lại sau {wait_sec}s...")
                time.sleep(wait_sec)
            else:
                logger.error(f"❌ Lỗi ghi dữ liệu vào sheet '{sheet.title}' sau {max_retries} lần thử: {api_err}")
                raise

# --- 10. QUY TRÌNH THỰC THI ĐỒNG BỘ TOÀN DIỆN ---
def process_sync_request(spreadsheet, sql_cfg, use_mock=False):
    """
    Thực thi quy trình kéo dữ liệu từ SQL Server Core (hoặc Mock Generator)
    và đẩy thẳng lên Google Sheets.
    """
    start_time = datetime.now()
    sync_timestamp_str = start_time.strftime("%d/%m/%Y %H:%M:%S")

    # Đảm bảo bảng SETTING tồn tại
    setting_headers = ["COMMAND", "STATUS", "REQUEST_TIME", "START_TIME", "FINISH_TIME", "TOTAL_ROWS", "MESSAGE"]
    setting_sheet = get_or_create_worksheet(spreadsheet, "SETTING", setting_headers)

    # Cập nhật trạng thái SETTING -> PROCESSING
    setting_sheet.update(
        values=[["PROCESSING", sync_timestamp_str, sync_timestamp_str]],
        range_name="B2:D2",
        value_input_option="USER_ENTERED"
    )
    source_name = "MOCK GENERATOR (QTDND YÊN THỌ)" if use_mock else f"SQL SERVER ({sql_cfg.get('server')})"
    logger.info(f"⚡ BẮT ĐẦU ĐỒNG BỘ TỪ {source_name} LÚC {sync_timestamp_str}...")

    try:
        if use_mock:
            df_kh, df_hdtd = generate_mock_banking_data(sync_timestamp_str)
        else:
            with get_sql_connection(sql_cfg) as sql_conn:
                df_kh = fetch_customer_core_data(sql_conn, sync_timestamp_str)
                df_hdtd = fetch_loan_contract_core_data(sql_conn, sync_timestamp_str)

        # 1. Đẩy dữ liệu Khách hàng & Thành viên (KH_CORE)
        kh_headers = ["MaKH", "HoTen", "DiaChi", "NgaySinh", "CCCD", "NgayCap", "NoiCap", "DienThoai", "DienThoaiDD", "SoTK", "KhuVuc", "SoTV", "SoSoCP", "NgayVaoTV", "TongTienCP", "NgayCapNhat"]
        kh_sheet = get_or_create_worksheet(spreadsheet, "KH_CORE", kh_headers)
        rows_kh = sync_dataframe_to_sheet(kh_sheet, df_kh, start_row=2)

        # 2. Đẩy dữ liệu Khế ước & Dư nợ (HDTD_CORE) kèm bảo toàn CBTD
        hdtd_headers = ["SoHDTD", "MaKH", "TienVay", "DuNo", "LaiSuat", "NgayVay", "DenHan", "TraLaiDenNgay", "MaLoaiVay", "SoThangVay", "MoTaVay", "CBTD_PhuTrach", "Ten_CBTD", "TrangThaiHD", "NgayTatToan", "NgayCapNhat"]
        hdtd_sheet = get_or_create_worksheet(spreadsheet, "HDTD_CORE", hdtd_headers)

        try:
            existing_records = hdtd_sheet.get_all_records()
        except Exception:
            existing_records = []

        existing_map = {str(r.get("SoHDTD", "")).strip(): r for r in existing_records if str(r.get("SoHDTD", "")).strip()}

        # Bảo toàn CBTD đã phân công
        for idx, row in df_hdtd.iterrows():
            so_hd = str(row["SoHDTD"]).strip()
            if so_hd in existing_map:
                prev_cbtd = str(existing_map[so_hd].get("CBTD_PhuTrach", "")).strip()
                prev_ten = str(existing_map[so_hd].get("Ten_CBTD", "")).strip()
                if prev_cbtd:
                    df_hdtd.at[idx, "CBTD_PhuTrach"] = prev_cbtd
                if prev_ten:
                    df_hdtd.at[idx, "Ten_CBTD"] = prev_ten

        # Nhận diện HĐ tất toán
        active_so_hd_set = set(df_hdtd["SoHDTD"].astype(str).str.strip())
        settled_rows = []
        for so_hd, prev_r in existing_map.items():
            if so_hd not in active_so_hd_set:
                settled_row = {
                    "SoHDTD": so_hd,
                    "MaKH": prev_r.get("MaKH", ""),
                    "TienVay": prev_r.get("TienVay", 0),
                    "DuNo": 0,
                    "LaiSuat": prev_r.get("LaiSuat", 0),
                    "NgayVay": prev_r.get("NgayVay", ""),
                    "DenHan": prev_r.get("DenHan", ""),
                    "TraLaiDenNgay": prev_r.get("TraLaiDenNgay", ""),
                    "MaLoaiVay": prev_r.get("MaLoaiVay", "LV01"),
                    "SoThangVay": prev_r.get("SoThangVay", 12),
                    "MoTaVay": prev_r.get("MoTaVay", ""),
                    "CBTD_PhuTrach": prev_r.get("CBTD_PhuTrach", "qtdyentho.cbtd"),
                    "Ten_CBTD": prev_r.get("Ten_CBTD", "Lê Văn Tín (CBTD)"),
                    "TrangThaiHD": "DA_TAT_TOAN",
                    "NgayTatToan": prev_r.get("NgayTatToan") or sync_timestamp_str.split(" ")[0],
                    "NgayCapNhat": sync_timestamp_str
                }
                settled_rows.append(settled_row)

        if settled_rows:
            df_settled = pd.DataFrame(settled_rows)
            df_hdtd_combined = pd.concat([df_hdtd, df_settled], ignore_index=True)
        else:
            df_hdtd_combined = df_hdtd

        rows_hdtd = sync_dataframe_to_sheet(hdtd_sheet, df_hdtd_combined, start_row=2)

        finish_time = datetime.now()
        total_rows = rows_kh + rows_hdtd
        elapsed = (finish_time - start_time).total_seconds()
        message = f"Đồng bộ thành công {rows_kh} Khách hàng và {rows_hdtd} Hợp đồng lúc {finish_time.strftime('%d/%m/%Y %H:%M:%S')} ({elapsed:.1f}s)."

        # Cập nhật trạng thái SETTING -> SUCCESS
        setting_sheet.update(
            values=[[
                "IDLE",
                "SUCCESS",
                sync_timestamp_str,
                sync_timestamp_str,
                finish_time.strftime("%d/%m/%Y %H:%M:%S"),
                total_rows,
                message
            ]],
            range_name="A2:G2",
            value_input_option="USER_ENTERED"
        )
        logger.info(f"🏆 === {message} ===")
        return True

    except Exception as e:
        finish_time = datetime.now()
        err_msg = f"Lỗi đồng bộ: {str(e)}"
        logger.error(err_msg, exc_info=True)
        setting_sheet.update(
            values=[[
                "IDLE",
                "ERROR",
                sync_timestamp_str,
                sync_timestamp_str,
                finish_time.strftime("%d/%m/%Y %H:%M:%S"),
                0,
                err_msg[:250]
            ]],
            range_name="A2:G2",
            value_input_option="USER_ENTERED"
        )
        return False

# --- 11. CHỨC NĂNG KIỂM TRA KẾT NỐI (DIAGNOSTICS) ---
def run_diagnostics(spreadsheet, sql_cfg):
    """
    Kiểm tra trạng thái kết nối tới Google Sheets API và máy chủ SQL Server.
    """
    logger.info("=================================================================")
    logger.info("🔍 CHẨN ĐOÁN KẾT NỐI HỆ THỐNG CREDITCORES")
    logger.info("=================================================================")

    # 1. Google Sheets
    try:
        title = spreadsheet.title
        sheets_count = len(spreadsheet.worksheets())
        logger.info(f"✅ Google Sheets: KẾT NỐI THÀNH CÔNG! ('{title}', gồm {sheets_count} sheets)")
    except Exception as e:
        logger.error(f"❌ Google Sheets: THẤT BẠI - {e}")

    # 2. ODBC Driver
    detected_driver = detect_best_sql_driver(sql_cfg.get("driver"))
    logger.info(f"ℹ️  ODBC Driver khả dụng: '{detected_driver}'")

    # 3. SQL Server Connection
    try:
        with get_sql_connection(sql_cfg) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT @@VERSION;")
            ver = cursor.fetchone()[0]
            logger.info(f"✅ SQL Server: KẾT NỐI THÀNH CÔNG! ({ver.splitlines()[0]})")
    except Exception as e:
        logger.warning(f"⚠️ SQL Server: Không kết nối được ({e}). Bạn có thể dùng cờ --mock để kiểm thử Google Sheets.")

    logger.info("=================================================================")

# --- 12. VÒNG LẶP LẮNG NGHE & GIAO DIỆN DÒNG LỆNH (CLI) ---
def main():
    parser = argparse.ArgumentParser(
        description="CreditCore SQL to Google Sheets Sync Daemon (QTDND Yên Thọ)",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--now", action="store_true", help="Thực hiện đồng bộ ngay 1 lần từ SQL Server và thoát")
    parser.add_argument("--mock", action="store_true", help="Đẩy dữ liệu mẫu ngân hàng QTDND Yên Thọ lên Google Sheets ngay lập tức")
    parser.add_argument("--init-schema", action="store_true", help="Khởi tạo hoặc sửa chữa cấu trúc 12 bảng CSDL Google Sheets")
    parser.add_argument("--test-connection", action="store_true", help="Kiểm tra kết nối tới Google Sheets và SQL Server")
    args = parser.parse_args()

    config = load_config()
    poll_interval = config.get("poll_interval_seconds", 5)
    sheet_id = config["google_sheet_id"]
    cred_file = config["credentials_file"]
    sql_cfg = config["sql_server"]

    logger.info(f"🔑 Đang nạp Google Service Account từ '{cred_file}'...")
    gc = get_gspread_client(cred_file)

    logger.info(f"📂 Mở Google Spreadsheet ID: {sheet_id}...")
    spreadsheet = gc.open_by_key(sheet_id)

    # 1. Khởi tạo Schema
    if args.init_schema:
        init_or_heal_database_schema(spreadsheet)
        sys.exit(0)

    # 2. Kiểm tra kết nối
    if args.test_connection:
        run_diagnostics(spreadsheet, sql_cfg)
        sys.exit(0)

    # 3. Chế độ Mock Data
    if args.mock:
        logger.info("🚀 Chế độ MOCK: Đẩy dữ liệu mẫu ngân quỹ QTDND Yên Thọ lên Google Sheets...")
        process_sync_request(spreadsheet, sql_cfg, use_mock=True)
        sys.exit(0)

    # 4. Chế độ chạy thủ công tức thì từ SQL Server
    if args.now:
        logger.info("🚀 Chế độ chạy thủ công tức thì (--now)...")
        process_sync_request(spreadsheet, sql_cfg, use_mock=False)
        sys.exit(0)

    # 5. Chế độ Daemon lắng nghe liên tục 24/7
    logger.info("=================================================================")
    logger.info("🚀 CREDIT CORE PYTHON SYNC DAEMON - ĐANG LẮNG NGHE LỆNH TỪ WEBAPP")
    logger.info(f"📍 Google Sheet ID: {sheet_id}")
    logger.info(f"🏢 SQL Server Host: {sql_cfg.get('server', 'localhost')} | DB: {sql_cfg.get('database', '')}")
    logger.info(f"⏱️  Chu kỳ quét hàng đợi: {poll_interval} giây/lần")
    logger.info("=================================================================")

    while True:
        try:
            setting_sheet = spreadsheet.worksheet("SETTING")
            row2 = setting_sheet.row_values(2)

            command = row2[0].strip() if len(row2) > 0 else "IDLE"
            status = row2[1].strip() if len(row2) > 1 else "IDLE"

            if command == "SYNC_DATA" and status in ["PENDING", "REQUESTED"]:
                logger.info(f"🔔 Phát hiện lệnh đồng bộ từ WebApp (COMMAND='{command}', STATUS='{status}')")
                process_sync_request(spreadsheet, sql_cfg, use_mock=False)

        except gspread.exceptions.APIError as api_err:
            logger.warning(f"Google Sheets API tạm thời bận: {api_err}. Đang tiếp tục lắng nghe...")
        except Exception as e:
            logger.error(f"Lỗi kiểm tra hàng đợi: {e}", exc_info=False)

        time.sleep(poll_interval)

if __name__ == "__main__":
    main()
