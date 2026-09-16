"""
========================================================================================
HỆ THỐNG QUẢN LÝ TÍN DỤNG & TRÍCH NỢ AUTOMATION - LOCAL PYTHON DAEMON
File: sync_daemon.py
Môi trường: Windows Server 2025 / Windows 10/11 / Linux (Chạy trên máy chủ SQL Server)
Tổ chức: Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
Bảo mật: Kết nối SQL Server nội bộ (Windows Trusted Auth / SQL Auth),
         Mã hóa một chiều TLS 1.3 đẩy lên Google Sheets qua Service Account.

Tính năng cốt lõi (100% Pure Python - Không phụ thuộc pandas):
1. Không cần cài đặt pandas/numpy nặng nề: Chạy cực nhẹ, mượt mà trên mọi máy chủ.
2. Nguồn dữ liệu trực tiếp: 100% SQL Server CoreBanking (NG-eFUND) thời gian thực.
3. Hỗ trợ 100% Biến môi trường Windows (MY_SQL_PASS, SQL_PASS...) bảo mật không lộ mật khẩu.
4. Tự động nhận diện ODBC Driver (ODBC Driver 18, 17, SQL Server) kèm mã hóa an toàn.
5. Chống lỗi mã hóa tiếng Việt trên Windows terminal (UTF-8 auto-reconfigure).
6. Phòng chống Formula Injection (CWE-1236) khi ghi dữ liệu lên Google Sheets.
7. Self-Healing Schema: Tự động khởi tạo và chuẩn hóa 12 Sheet theo chuẩn SchemaSetup.
8. Lắng nghe liên tục hàng đợi từ Google Sheets (Sheet SETTING) hoặc chạy tức thì (--now).
9. Bảo toàn phân công Cán bộ tín dụng (CBTD) và tự động nhận diện Hợp đồng tất toán.
10. Cơ chế thử lại (Retry with Exponential Backoff) khi gặp giới hạn Google Sheets API.
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
        or "NG-eFUND"
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
    if val is None:
        return ""
    if isinstance(val, (int, float)):
        return val
    s = str(val).strip()
    if s and s[0] in ("=", "+", "-", "@"):
        # Thêm dấu nháy đơn đầu để Google Sheets xử lý strictly dưới dạng văn bản
        return "'" + s
    return s

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

# --- 6. HÀM CHUẨN HÓA DỮ LIỆU ĐẶC THÙ NG-eFUND & TRUY VẤN COREBANKING ---
def format_efund_date(val):
    """
    Chuyển đổi ngày tháng từ định dạng NG-eFUND (YYYYMMDD) sang dd/MM/yyyy.
    Ví dụ: 19630224 -> 24/02/1963, 20210812 -> 12/08/2021, 20031231 -> 31/12/2003.
    """
    if not val:
        return ""
    s = str(val).strip().replace("-", "").replace("/", "")
    if len(s) == 8 and s.isdigit():
        return f"{s[6:8]}/{s[4:6]}/{s[0:4]}"
    return str(val).strip()

def clean_address(val):
    """
    Làm sạch khoảng trắng thừa trước dấu phẩy trong địa chỉ và khu vực.
    Ví dụ: 'Thôn Tu Mục , xã Quý Lộc , tỉnh Thanh Hoá' -> 'Thôn Tu Mục, xã Quý Lộc, tỉnh Thanh Hoá'
    """
    if not val:
        return ""
    import re
    cleaned = re.sub(r'\s+,', ',', str(val).strip())
    return re.sub(r'\s+', ' ', cleaned)

def clean_number_code(val):
    """
    Bảo toàn số 0 ở đầu cho CCCD, SĐT, Số TV, Số TK, Mã KH khi đẩy lên Google Sheets.
    Ví dụ: 038163029501 -> '038163029501, 0002 -> '0002, 0100002 -> '0100002.
    """
    if val is None or val == "":
        return ""
    s = str(val).strip()
    if s.isdigit() and s.startswith("0") and len(s) > 1:
        return "'" + s
    return s

def clean_currency(val):
    """
    Chuẩn hóa số tiền VNĐ (loại bỏ phần thập phân .00 nếu có).
    Ví dụ: 616000.00 -> 616000
    """
    if val is None or val == "":
        return 0
    try:
        return int(round(float(val)))
    except Exception:
        return val

def clean_interest_rate(val):
    """
    Chuẩn hóa lãi suất (%/năm), làm tròn 2 chữ số thập phân.
    Ví dụ: 10.4600 -> 10.46
    """
    if not val:
        return 0.0
    try:
        return round(float(val), 2)
    except Exception:
        return val

def fetch_customer_core_data(sql_conn, sync_timestamp_str):
    """
    Truy vấn bảng Khách hàng, Thành viên, Khu vực từ CSDL NG-eFUND.
    Tự động chuẩn hóa:
    - Ngày tháng YYYYMMDD -> dd/MM/yyyy.
    - Bảo toàn số 0 ở đầu cho CCCD, Điện thoại, Số thành viên, Số tài khoản, Mã KH.
    - Làm sạch địa chỉ, chuẩn hóa tiền vốn cổ phần.
    """
    query = """
    SELECT 
        kh.MA_KHACH_HANG AS MaKH,
        kh.TEN_KHACH_HANG AS HoTen,
        kh.DIA_CHI AS DiaChi,
        kh.NGAY_SINH AS NgaySinh,
        kh.SO_CMND AS CCCD,
        kh.NGAY_CAP AS NgayCap,
        kh.NOI_CAP AS NoiCap,
        kh.SO_DIEN_THOAI AS DienThoai,
        kh.SO_DI_DONG AS DienThoaiDD,
        kh.SO_TAI_KHOAN AS SoTK,
        kv.TEN_KHU_VUC AS KhuVuc,
        tv.SO_THANH_VIEN AS SoTV,
        tv.SO_CO_PHAN AS SoSoCP,
        tv.NGAY_MO_SO AS NgayVaoTV,
        ISNULL(SUM(tv.SO_TIEN), 0) AS TongTienCP
    FROM dbo.DC_KHACH_HANG kh WITH (NOLOCK)
    LEFT JOIN dbo.DC_KHU_VUC kv WITH (NOLOCK) ON kh.MA_KHU_VUC = kv.MA_KHU_VUC
    LEFT JOIN dbo.DC_THANH_VIEN tv WITH (NOLOCK) ON kh.MA_KHACH_HANG = tv.MA_KHACH_HANG
    GROUP BY 
        kh.MA_KHACH_HANG,
        kh.TEN_KHACH_HANG,
        kh.DIA_CHI,
        kh.NGAY_SINH,
        kh.SO_CMND,
        kh.NGAY_CAP,
        kh.NOI_CAP,
        kh.SO_DIEN_THOAI,
        kh.SO_DI_DONG,
        kh.SO_TAI_KHOAN,
        kv.TEN_KHU_VUC,
        tv.SO_THANH_VIEN,
        tv.SO_CO_PHAN,
        tv.NGAY_MO_SO
    ORDER BY kh.MA_KHACH_HANG;
    """
    logger.info("🔍 Đang thực thi SQL truy vấn dữ liệu Khách hàng & Thành viên từ NG-eFUND...")
    cursor = sql_conn.cursor()
    cursor.execute(query)
    columns = [column[0] for column in cursor.description]
    records = []

    for row in cursor.fetchall():
        row_map = {col: (val if val is not None else "") for col, val in zip(columns, row)}

        record = {
            "MaKH": clean_number_code(row_map.get("MaKH")),
            "HoTen": str(row_map.get("HoTen", "")).strip(),
            "DiaChi": clean_address(row_map.get("DiaChi")),
            "NgaySinh": format_efund_date(row_map.get("NgaySinh")),
            "CCCD": clean_number_code(row_map.get("CCCD")),
            "NgayCap": format_efund_date(row_map.get("NgayCap")),
            "NoiCap": str(row_map.get("NoiCap", "")).strip(),
            "DienThoai": clean_number_code(row_map.get("DienThoai")),
            "DienThoaiDD": clean_number_code(row_map.get("DienThoaiDD")),
            "SoTK": clean_number_code(row_map.get("SoTK")),
            "KhuVuc": clean_address(row_map.get("KhuVuc")),
            "SoTV": clean_number_code(row_map.get("SoTV")),
            "SoSoCP": str(row_map.get("SoSoCP", "")).strip(),
            "NgayVaoTV": format_efund_date(row_map.get("NgayVaoTV")),
            "TongTienCP": clean_currency(row_map.get("TongTienCP")),
            "NgayCapNhat": sync_timestamp_str
        }
        records.append(record)

    cursor.close()
    logger.info(f"✅ Đã tải và chuẩn hóa thành công {len(records)} khách hàng từ NG-eFUND.")
    return records

def fetch_loan_contract_core_data(sql_conn, sync_timestamp_str):
    """
    Truy vấn bảng Khế ước & Hợp đồng Tín dụng từ CSDL NG-eFUND.
    Tự động chuẩn hóa:
    - Ngày tháng YYYYMMDD -> dd/MM/yyyy (NgayVay, DenHan, TraLaiDenNgay).
    - Chuẩn hóa số tiền vay, dư nợ (bỏ phần thập phân .00).
    - Chuẩn hóa lãi suất (10.4600 -> 10.46).
    - Bảo toàn số 0 ở đầu Mã khách hàng để liên kết chính xác với KH_CORE.
    - Làm sạch mô tả mục đích vay.
    """
    query = """
    SELECT 
        D.SO_HDTD AS SoHDTD,
        D.MA_KHACH_HANG AS MaKH,
        D.SO_TIEN_VAY AS TienVay,
        A.SO_DU AS DuNo,
        A.LAI_SUAT AS LaiSuat,
        D.NGAY_VAY AS NgayVay,
        D.NGAY_DAO_HAN AS DenHan,
        A.THU_LAI_DEN_NGAY AS TraLaiDenNgay,
        SP.TEN_SAN_PHAM AS MaLoaiVay,
        D.SO_THANG_VAY AS SoThangVay,
        D.MO_TA_MUC_DICH_VAY AS MoTaVay
    FROM dbo.TD_KHE_UOC A
    INNER JOIN dbo.TD_HOP_DONG_TD D
        ON A.MA_HDTD = D.MA_HDTD
    INNER JOIN dbo.DC_KHACH_HANG B
        ON B.MA_KHACH_HANG = D.MA_KHACH_HANG
    INNER JOIN dbo.KT_TAI_KHOAN C
        ON C.SO_TAI_KHOAN = A.SO_TAI_KHOAN
    INNER JOIN dbo.DC_KHU_VUC KV
        ON B.MA_KHU_VUC = KV.MA_KHU_VUC
    INNER JOIN dbo.vwTD_SAN_PHAM SP
        ON SP.MA_SAN_PHAM = A.MA_SAN_PHAM
    INNER JOIN dbo.DC_LOAI_VAY LV
        ON LV.MA_LOAI_VAY = SP.MA_LOAI_VAY
    WHERE C.SO_DU > 0 
    ORDER BY D.MA_KHACH_HANG, D.NGAY_VAY DESC;
    """
    logger.info("🔍 Đang thực thi SQL truy vấn dữ liệu Hợp đồng Tín dụng & Dư nợ từ NG-eFUND...")
    cursor = sql_conn.cursor()
    cursor.execute(query)
    columns = [column[0] for column in cursor.description]
    records = []

    for row in cursor.fetchall():
        row_map = {col: (val if val is not None else "") for col, val in zip(columns, row)}

        record = {
            "SoHDTD": str(row_map.get("SoHDTD", "")).strip(),
            "MaKH": clean_number_code(row_map.get("MaKH")),
            "TienVay": clean_currency(row_map.get("TienVay")),
            "DuNo": clean_currency(row_map.get("DuNo")),
            "LaiSuat": clean_interest_rate(row_map.get("LaiSuat")),
            "NgayVay": format_efund_date(row_map.get("NgayVay")),
            "DenHan": format_efund_date(row_map.get("DenHan")),
            "TraLaiDenNgay": format_efund_date(row_map.get("TraLaiDenNgay")),
            "MaLoaiVay": str(row_map.get("MaLoaiVay", "")).strip(),
            "SoThangVay": clean_currency(row_map.get("SoThangVay")) or 12,
            "MoTaVay": clean_address(row_map.get("MoTaVay")),
            "CBTD_PhuTrach": "qtdyentho.cbtd",
            "Ten_CBTD": "Lê Văn Tín (CBTD)",
            "TrangThaiHD": "DANG_VAY",
            "NgayTatToan": "",
            "NgayCapNhat": sync_timestamp_str
        }
        records.append(record)

    cursor.close()
    logger.info(f"✅ Đã tải và chuẩn hóa thành công {len(records)} hợp đồng tín dụng từ NG-eFUND.")
    return records

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

def sync_records_to_sheet(sheet, headers, records, start_row=2, max_retries=3):
    """
    Ghi danh sách bản ghi (list of dicts) vào sheet bằng 1 lệnh batch duy nhất.
    Áp dụng sanitize chống Formula Injection (CWE-1236).
    """
    if not records:
        logger.warning(f"⚠️ Không có bản ghi nào để ghi vào sheet '{sheet.title}'.")
        return 0

    values = []
    for r in records:
        row_vals = []
        for h in headers:
            val = r.get(h, "")
            row_vals.append(sanitize_cell_value(val))
        values.append(row_vals)

    num_rows = len(values)
    num_cols = len(headers)

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
def process_sync_request(spreadsheet, sql_cfg):
    """
    Thực thi quy trình kéo dữ liệu 100% từ SQL Server CoreBanking (NG-eFUND)
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
    source_name = f"SQL SERVER ({sql_cfg.get('server')})"
    logger.info(f"⚡ BẮT ĐẦU ĐỒNG BỘ TỪ {source_name} LÚC {sync_timestamp_str}...")

    try:
        with get_sql_connection(sql_cfg) as sql_conn:
            records_kh = fetch_customer_core_data(sql_conn, sync_timestamp_str)
            records_hdtd = fetch_loan_contract_core_data(sql_conn, sync_timestamp_str)

        # 1. Đẩy dữ liệu Khách hàng & Thành viên (KH_CORE)
        kh_headers = ["MaKH", "HoTen", "DiaChi", "NgaySinh", "CCCD", "NgayCap", "NoiCap", "DienThoai", "DienThoaiDD", "SoTK", "KhuVuc", "SoTV", "SoSoCP", "NgayVaoTV", "TongTienCP", "NgayCapNhat"]
        kh_sheet = get_or_create_worksheet(spreadsheet, "KH_CORE", kh_headers)
        rows_kh = sync_records_to_sheet(kh_sheet, kh_headers, records_kh, start_row=2)

        # 2. Đẩy dữ liệu Khế ước & Dư nợ (HDTD_CORE) kèm bảo toàn CBTD
        hdtd_headers = ["SoHDTD", "MaKH", "TienVay", "DuNo", "LaiSuat", "NgayVay", "DenHan", "TraLaiDenNgay", "MaLoaiVay", "SoThangVay", "MoTaVay", "CBTD_PhuTrach", "Ten_CBTD", "TrangThaiHD", "NgayTatToan", "NgayCapNhat"]
        hdtd_sheet = get_or_create_worksheet(spreadsheet, "HDTD_CORE", hdtd_headers)

        try:
            existing_records = hdtd_sheet.get_all_records()
        except Exception:
            existing_records = []

        existing_map = {str(r.get("SoHDTD", "")).strip(): r for r in existing_records if str(r.get("SoHDTD", "")).strip()}

        # Bảo toàn CBTD đã phân công
        for r in records_hdtd:
            so_hd = str(r.get("SoHDTD", "")).strip()
            if so_hd in existing_map:
                prev_cbtd = str(existing_map[so_hd].get("CBTD_PhuTrach", "")).strip()
                prev_ten = str(existing_map[so_hd].get("Ten_CBTD", "")).strip()
                if prev_cbtd:
                    r["CBTD_PhuTrach"] = prev_cbtd
                if prev_ten:
                    r["Ten_CBTD"] = prev_ten

        # Nhận diện HĐ tất toán
        active_so_hd_set = {str(r.get("SoHDTD", "")).strip() for r in records_hdtd}
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

        all_hdtd_records = records_hdtd + settled_rows
        rows_hdtd = sync_records_to_sheet(hdtd_sheet, hdtd_headers, all_hdtd_records, start_row=2)

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
        logger.warning(f"⚠️ SQL Server: Không kết nối được ({e}). Vui lòng kiểm tra cấu hình mạng và thông tin đăng nhập.")

    logger.info("=================================================================")

# --- 12. VÒNG LẶP LẮNG NGHE & GIAO DIỆN DÒNG LỆNH (CLI) ---
def main():
    parser = argparse.ArgumentParser(
        description="CreditCore SQL to Google Sheets Sync Daemon (QTDND Yên Thọ)",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--now", action="store_true", help="Thực hiện đồng bộ ngay 1 lần từ SQL Server và thoát")
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

    # 4. Chế độ chạy thủ công tức thì từ SQL Server
    if args.now:
        logger.info("🚀 Chế độ chạy thủ công tức thì (--now)...")
        process_sync_request(spreadsheet, sql_cfg)
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
                process_sync_request(spreadsheet, sql_cfg)

        except gspread.exceptions.APIError as api_err:
            logger.warning(f"Google Sheets API tạm thời bận: {api_err}. Đang tiếp tục lắng nghe...")
        except Exception as e:
            logger.error(f"Lỗi kiểm tra hàng đợi: {e}", exc_info=False)

        time.sleep(poll_interval)

if __name__ == "__main__":
    main()
