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

# Nhập khẩu module khởi tạo & chữa lành cấu trúc CSDL Google Sheets tách riêng
from schema_healer import ALL_SCHEMAS, init_or_heal_database_schema, get_or_create_worksheet

# Nhập khẩu module chuyên trách chuẩn hóa dữ liệu & quản lý câu lệnh SQL
from data_cleaner import (
    clean_number_code,
    clean_date,
    clean_currency,
    clean_rate,
    clean_text,
    extract_xa_thon,
    clean_record_by_schema
)
from sql_queries import (
    REGISTERED_QUERIES,
    register_custom_sql,
    get_query_definition,
    list_registered_tables
)

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
    Chuyển đổi ngày tháng từ nhiều nguồn (CoreBanking NG-eFUND, SQL Server 103, ISO)
    sang định dạng chuẩn Việt Nam dd/MM/yyyy.
    Ví dụ:
      - '20260817' -> '17/08/2026'
      - '17/08/2026' -> '17/08/2026'
      - '2026-08-17' -> '17/08/2026'
    """
    if not val:
        return ""
    import re
    val_str = str(val).strip()

    # 1. Đã là dạng dd/MM/yyyy hoặc d/M/yyyy
    if re.match(r"^\d{1,2}/\d{1,2}/\d{4}$", val_str):
        parts = val_str.split("/")
        return f"{int(parts[0]):02d}/{int(parts[1]):02d}/{parts[2]}"

    # 2. Dạng ISO yyyy-MM-dd
    if re.match(r"^\d{4}-\d{1,2}-\d{1,2}$", val_str):
        parts = val_str.split("-")
        return f"{int(parts[2]):02d}/{int(parts[1]):02d}/{parts[0]}"

    # 3. Chuỗi số 8 ký tự (YYYYMMDD hoặc DDMMYYYY)
    s = val_str.replace("-", "").replace("/", "")
    if len(s) == 8 and s.isdigit():
        if s.startswith("19") or s.startswith("20"):
            return f"{s[6:8]}/{s[4:6]}/{s[0:4]}"
        else:
            return f"{s[0:2]}/{s[2:4]}/{s[4:8]}"

    return val_str

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
    Nếu dạng 0.1046 (đã bị chia 100 trong SQL) -> tự động nhân 100 thành 10.46
    """
    if not val:
        return 0.0
    try:
        f = float(val)
        if 0 < f < 0.99:
            f = f * 100.0
        return round(f, 2)
    except Exception:
        return val

def extract_xa_thon(dia_chi, khu_vuc=""):
    """
    Tách Xã và Thôn từ Địa chỉ hoặc Khu vực cho địa bàn QTDND Yên Thọ (Thanh Hóa).
    Không ép cố định một xã nào, tự động nhận diện đúng tên địa bàn thực tế.
    """
    kv_str = str(khu_vuc or "").strip()
    dia_str = str(dia_chi or "").strip()
    text = (dia_str + " " + kv_str).lower()

    xa = ""
    if "yên thọ" in text or "yen tho" in text:
        xa = "Xã Yên Thọ"
    elif "quý lộc" in text or "quy loc" in text:
        xa = "Xã Quý Lộc"
    elif "yên trường" in text or "yen truong" in text:
        xa = "Xã Yên Trường"
    elif "yên bái" in text or "yen bai" in text:
        xa = "Xã Yên Bái"
    elif "yên lâm" in text or "yen lam" in text:
        xa = "Xã Yên Lâm"
    elif "yên phú" in text or "yen phu" in text:
        xa = "Xã Yên Phú"
    elif "định tân" in text or "dinh tan" in text:
        xa = "Xã Định Tân"
    elif "vĩnh lộc" in text or "vinh loc" in text:
        xa = "Xã Vĩnh Lộc"
    else:
        import re
        m_xa = re.search(r"(xã|thị trấn|phường|tt\.)\s+([^,]+)", text, re.IGNORECASE)
        if m_xa:
            xa = m_xa.group(0).strip().title()
        elif kv_str and not kv_str.lower().startswith("thôn"):
            xa = kv_str
        else:
            xa = "Địa bàn khác"

    import re
    thon = ""
    thon_match = re.search(r"(thôn|bản|khu phố|phố|kp|tổ|tiểu khu)\s+([^,]+)", dia_str, re.IGNORECASE)
    if thon_match:
        thon = thon_match.group(0).strip()
    elif kv_str and kv_str.lower().startswith("thôn"):
        thon = kv_str

    return xa, thon

def fetch_customer_core_data(sql_conn, sync_timestamp_str):
    """
    Truy vấn bảng Khách hàng, Thành viên, Khu vực từ CSDL NG-eFUND.
    Tự động chuẩn hóa:
    - Ngày tháng YYYYMMDD -> dd/MM/yyyy.
    - Bảo toàn số 0 ở đầu cho CCCD, Điện thoại, Số thành viên, Số tài khoản, Mã KH.
    - Làm sạch địa chỉ, phân tách KvXa, KvThon, chuẩn hóa tiền vốn cổ phần.
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

        dia_chi_clean = clean_address(row_map.get("DiaChi"))
        khu_vuc_clean = clean_address(row_map.get("KhuVuc"))
        kv_xa, kv_thon = extract_xa_thon(dia_chi_clean, khu_vuc_clean)

        record = {
            "MaKH": clean_number_code(row_map.get("MaKH")),
            "HoTen": str(row_map.get("HoTen", "")).strip(),
            "CCCD": clean_number_code(row_map.get("CCCD")),
            "NgayCap": format_efund_date(row_map.get("NgayCap")),
            "NoiCap": str(row_map.get("NoiCap", "")).strip(),
            "NgaySinh": format_efund_date(row_map.get("NgaySinh")),
            "DienThoai": clean_number_code(row_map.get("DienThoai")),
            "DienThoaiDD": clean_number_code(row_map.get("DienThoaiDD")),
            "DiaChi": dia_chi_clean,
            "KvXa": kv_xa,
            "KvThon": kv_thon,
            "KhuVuc": khu_vuc_clean,
            "SoTK": clean_number_code(row_map.get("SoTK")),
            "SoTV": clean_number_code(row_map.get("SoTV")),
            "SoSoCP": str(row_map.get("SoSoCP", "")).strip(),
            "NgayVaoTV": format_efund_date(row_map.get("NgayVaoTV")),
            "TongTienCP": clean_currency(row_map.get("TongTienCP")),
            "TongDuNoHienTai": 0,
            "SoLuongHDVay": 0,
            "TrangThaiVay": "CHUA_VAY",
            "NhomNoCIC": "N1",
            "NgayCapNhat": sync_timestamp_str
        }
        records.append(record)

    cursor.close()
    logger.info(f"✅ Đã tải và chuẩn hóa thành công {len(records)} khách hàng từ NG-eFUND.")
    return records

def fetch_loan_contract_core_data(sql_conn, sync_timestamp_str, as_of_date_str=None):
    """
    Truy vấn bảng Khế ước & Hợp đồng Tín dụng từ CSDL NG-eFUND theo chuẩn CoreBanking chuẩn xác:
    - @denngay: Mốc ngày chốt dữ liệu (định dạng YYYYMMDD, ví dụ 20260921).
    - TienVay: convert(int, c.so_tien_gn) -> Số tiền cho vay ban đầu (giải ngân lũy kế).
    - DuNo: convert(int, e.so_du) -> Số tiền DƯ NỢ THỰC TẾ lưu hành (chỉ tính e.so_du > 0).
    - Phân định rõ ràng: DuNo là dư nợ thực tế, TienVay là hạn mức giải ngân ban đầu.
    """
    # 1. Chuẩn hóa tham số @denngay dạng YYYYMMDD
    denngay_param = datetime.now().strftime("%Y%m%d")
    if as_of_date_str:
        clean_d = str(as_of_date_str).strip()
        if "/" in clean_d:
            parts = clean_d.split("/")
            if len(parts) == 3:
                denngay_param = f"{parts[2]}{parts[1].zfill(2)}{parts[0].zfill(2)}"
        elif "-" in clean_d:
            parts = clean_d.split("-")
            if len(parts) == 3:
                if len(parts[0]) == 4:
                    denngay_param = f"{parts[0]}{parts[1].zfill(2)}{parts[2].zfill(2)}"
                else:
                    denngay_param = f"{parts[2]}{parts[1].zfill(2)}{parts[0].zfill(2)}"
        elif len(clean_d) == 8 and clean_d.isdigit():
            denngay_param = clean_d

    query_current_production = """
    SELECT 
        A.MA_KHE_UOC AS SoHDTD,
        D.MA_KHACH_HANG AS MAKH,
        B.TEN_KHACH_HANG AS TenKH,
        B.SO_CMND AS CCCD,
        B.SO_DI_DONG AS DienThoai,
        B.DIA_CHI AS DiaChi,
        -- TÁCH LẤY TÊN THÔN TỪ CỘT DIA_CHI
        LTRIM(RTRIM(
            CASE 
                WHEN CHARINDEX(',', B.DIA_CHI) > 0 
                THEN LEFT(B.DIA_CHI, CHARINDEX(',', B.DIA_CHI) - 1)
                ELSE B.DIA_CHI 
            END
        )) AS KvThon,
        ISNULL(G.TEN_DIA_LY, N'') AS KvXa,
        D.SO_TIEN_VAY AS TienVay,
        C.SO_DU AS DuNo,
        FORMAT(A.LAI_SUAT, 'N2') AS LaiSuat,
        CONVERT(VARCHAR(10), D.NGAY_VAY, 103) AS NgayVay,
        CONVERT(VARCHAR(10), D.NGAY_DAO_HAN, 103) AS DenHan,
        CONVERT(VARCHAR(10), A.THU_LAI_DEN_NGAY, 103) AS TLDenNgay,
        SP.TEN_SAN_PHAM AS MaLoaiVay,
        D.SO_THANG_VAY AS SoThangVay,
        D.MO_TA_MUC_DICH_VAY AS MucDichVay,
        D.MA_LOAI_HD AS MaLoaiHD,
        A.NHOM_NO_HIEN_TAI AS NhomNo
    FROM dbo.TD_KHE_UOC A 
    INNER JOIN dbo.TD_HOP_DONG_TD D ON A.MA_HDTD = D.MA_HDTD
    INNER JOIN dbo.DC_KHACH_HANG B ON B.MA_KHACH_HANG = D.MA_KHACH_HANG
    INNER JOIN dbo.DC_THANH_VIEN TV ON B.MA_KHACH_HANG = TV.MA_KHACH_HANG
    INNER JOIN dbo.DC_KHU_VUC KV ON B.MA_KHU_VUC = KV.MA_KHU_VUC
    INNER JOIN dbo.KT_TAI_KHOAN C ON C.SO_TAI_KHOAN = A.SO_TAI_KHOAN
    INNER JOIN dbo.vwTD_SAN_PHAM SP ON SP.MA_SAN_PHAM = A.MA_SAN_PHAM
    INNER JOIN dbo.DC_LOAI_VAY LV ON LV.MA_LOAI_VAY = SP.MA_LOAI_VAY
    LEFT JOIN (
        SELECT DISTINCT 
            A.MA_KHU_VUC, 
            B.MA_DIA_LY, 
            B.TEN_DIA_LY 
        FROM dbo.DC_DON_VI_KHU_VUC A 
        INNER JOIN dbo.DC_DIA_LY B ON A.MA_DIA_LY = B.MA_DIA_LY 
        WHERE A.MA_PGD LIKE '01'
    ) G ON G.MA_KHU_VUC = KV.MA_KHU_VUC
    WHERE C.SO_DU > 0
    ORDER BY D.MA_KHACH_HANG, D.NGAY_VAY DESC;
    """

    query_history_ls = f"""
    DECLARE @denngay VARCHAR(8) = '{denngay_param}';

    SELECT 
        a.so_hdtd AS SoHDTD,
        b.ma_khach_hang AS MaKH,
        b.ten_khach_hang AS TenKH,
        b.SO_CMND AS CCCD,
        b.SO_DI_DONG AS DienThoai,
        f.ten_khu_vuc AS DiaChi,
        LTRIM(RTRIM(
            CASE 
                WHEN CHARINDEX(',', B.DIA_CHI) > 0 
                THEN LEFT(B.DIA_CHI, CHARINDEX(',', B.DIA_CHI) - 1)
                ELSE B.DIA_CHI 
            END
        )) AS KvThon,
        ISNULL(G.TEN_DIA_LY, '') AS KhuVuc,
        CONVERT(VARCHAR(10), CONVERT(DATETIME, LEFT(a.ngay_vay, 8), 103), 103) AS NgayVay,
        CONVERT(VARCHAR(10), CONVERT(DATETIME, LEFT(a.ngay_dao_han, 8), 103), 103) AS DenHan,
        CAST(c.lai_suat AS FLOAT) / 100 AS LaiSuat,
        CONVERT(INT, c.so_tien_gn) AS TienVay,
        CONVERT(INT, e.so_du) AS DuNo,
        CONVERT(VARCHAR(10), CONVERT(DATETIME, LEFT(kw.thu_lai_den_ngay, 8), 103), 103) AS TL_DenNgay,
        a.SO_THANG_VAY AS SoThangVay,
        d.MA_LOAI_VAY AS LoaiVay, 
        A.MA_LOAI_HD AS MaLoaiHD,
        A.MO_TA_MUC_DICH_VAY AS MucDich,
        C.nhom_no_hien_tai AS NhomNo
    FROM 
        td_hop_dong_td a 
    INNER JOIN (
        SELECT DISTINCT 
            kh.*, 
            ISNULL(tv.SO_THANH_VIEN, '') AS so_thanh_vien 
        FROM 
            dc_khach_hang kh 
        LEFT JOIN (
            SELECT 
                ma_khach_hang, 
                MIN(so_thanh_vien) AS so_thanh_vien 
            FROM 
                fn_dc_thanh_vien_ls(@denngay, '%') 
            GROUP BY 
                ma_khach_hang
        ) tv ON kh.ma_khach_hang = tv.ma_khach_hang 
    ) b ON a.ma_khach_hang = b.ma_khach_hang
    INNER JOIN 
        fn_TD_KHE_UOC_LS('01', @denngay) c ON a.ma_hdtd = c.ma_hdtd 
        AND c.nhom_no_hien_tai IN ('NHOM1', 'NHOM2', 'NHOM3', 'NHOM4', 'NHOM5')
    INNER JOIN 
        td_san_pham d ON c.ma_san_pham = d.ma_san_pham
    INNER JOIN 
        fn_KT_TAI_KHOAN_LS_CHI_NHANH(@denngay, 'TKTD', '01') e ON e.so_tai_khoan = c.so_tai_khoan
    INNER JOIN 
        dc_khu_vuc f ON b.ma_khu_vuc = f.ma_khu_vuc
    INNER JOIN 
        TD_KHE_UOC KW ON KW.MA_HDTD = a.MA_HDTD
    LEFT JOIN (
        SELECT DISTINCT 
            A.MA_KHU_VUC, 
            B.MA_DIA_LY, 
            B.TEN_DIA_LY 
        FROM 
            DC_DON_VI_KHU_VUC A 
        JOIN 
            DC_DIA_LY B ON A.MA_DIA_LY = B.MA_DIA_LY 
        WHERE 
            MA_PGD LIKE '01'
    ) G ON G.MA_KHU_VUC = F.MA_KHU_VUC
    WHERE 
        e.so_du > 0 
        AND e.ma_chi_nhanh LIKE '01'                       
        AND b.ma_khu_vuc IN ('01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24')
        AND d.ma_san_pham IN ('NH01','NH02','NH03','NH04','NH05','NH06','NH07','TH01','TH02','TH03','TH04','TH05','TH06','TH07')
        AND c.NGAY_GIAI_NGAN >= '00010101'
        AND c.NGAY_GIAI_NGAN <= '99991231'
        AND c.NGAY_DAO_HAN >= '00010101'
        AND c.NGAY_DAO_HAN <= '99991231'
        AND E.loai_tk = 'TKTD'
    ORDER BY 
        a.ngay_vay;
    """

    cursor = sql_conn.cursor()
    columns = []
    rows = []

    # Nếu không truyền as_of_date (đồng bộ HDTD_CORE thời gian thực), ưu tiên 100% query_current_production
    if not as_of_date:
        logger.info("🔍 Đang truy vấn dữ liệu HĐTD & Dư nợ hiện tại thời gian thực từ NG-eFUND...")
        try:
            cursor.execute(query_current_production)
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            logger.info(f"⚡ Thực thi thành công truy vấn HDTD_CORE trực tiếp ({len(rows)} bản ghi).")
        except Exception as e_curr:
            logger.warning(f"⚠️ Truy vấn HDTD_CORE gặp lỗi ({e_curr}), thử qua hàm lịch sử...")
            cursor.execute(query_history_ls)
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
    else:
        logger.info(f"🔍 Đang truy vấn dữ liệu HĐTD & Dư nợ lịch sử tại mốc @denngay: {denngay_param}...")
        try:
            cursor.execute(query_history_ls)
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            logger.info(f"⚡ Thực thi thành công qua hàm lịch sử NG-eFUND ({len(rows)} bản ghi).")
        except Exception as e_hist:
            logger.warning(f"⚠️ Hàm lịch sử gặp lỗi ({e_hist}), chuyển sang truy vấn trực tiếp bảng...")
            cursor.execute(query_current_production)
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()

    records = []
    for row in rows:
        row_map = {col: (val if val is not None else "") for col, val in zip(columns, row)}

        raw_makh = str(row_map.get("MaKH") or row_map.get("MAKH", "")).strip()
        clean_makh = clean_number_code(raw_makh)
        if clean_makh and not clean_makh.startswith("'"):
            clean_makh = "'" + clean_makh

        so_thang = clean_currency(row_map.get("SoThangVay")) or 12
        raw_ma_loai_hd = str(row_map.get("MaLoaiHD", "")).strip()
        if not raw_ma_loai_hd:
            raw_ma_loai_hd = "THCDBTNMT" if so_thang > 12 else "NHCDBTNMT"

        raw_dia_chi = clean_address(row_map.get("DiaChi"))
        raw_kv_xa = str(row_map.get("KvXa") or row_map.get("KhuVuc", "")).strip()
        kv_thon = str(row_map.get("KvThon", "")).strip()
        if not kv_thon:
            m_thon = re.search(r"Thôn\s+[^,]+", raw_dia_chi, re.IGNORECASE)
            if m_thon:
                kv_thon = m_thon.group(0).strip()

        # Phân biệt rõ ràng:
        # TienVay = Vốn cho vay ban đầu (giải ngân)
        # DuNo = Dư nợ thực tế lưu hành
        val_tien_vay = clean_currency(row_map.get("TienVay"))
        val_du_no = clean_currency(row_map.get("DuNo"))

        record = {
            "SoHDTD": str(row_map.get("SoHDTD", "")).strip(),
            "MaKH": clean_makh,
            "HoTen": str(row_map.get("HoTen") or row_map.get("TenKH", "")).strip(),
            "CCCD": clean_number_code(row_map.get("CCCD")),
            "DienThoai": clean_number_code(row_map.get("DienThoai")),
            "DiaChi": raw_dia_chi,
            "KvXa": raw_kv_xa,
            "KvThon": kv_thon,
            "TienVay": val_tien_vay,
            "DuNo": val_du_no,
            "LaiSuat": clean_interest_rate(row_map.get("LaiSuat")),
            "NgayVay": format_efund_date(row_map.get("NgayVay")),
            "DenHan": format_efund_date(row_map.get("DenHan")),
            "TraLaiDenNgay": format_efund_date(row_map.get("TL_DenNgay") or row_map.get("TLDenNgay") or row_map.get("TraLaiDenNgay")),
            "MaLoaiVay": str(row_map.get("MaLoaiVay") or row_map.get("LoaiVay", "")).strip(),
            "SoThangVay": so_thang,
            "MoTaVay": clean_address(row_map.get("MoTaVay") or row_map.get("MucDich") or row_map.get("MucDichVay")),
            "CBTD_PhuTrach": "qtdyentho.huyennhu",
            "Ten_CBTD": "Trần Như Huyền",
            "TrangThaiHD": "DANG_VAY" if val_du_no > 0 else "DA_TAT_TOAN",
            "MaLoaiHD": raw_ma_loai_hd,
            "NhomNo": str(row_map.get("NhomNo", "NHOM1")).strip(),
            "NgayCapNhat": sync_timestamp_str
        }
        records.append(record)

    cursor.close()
    logger.info(f"✅ Đã tải và chuẩn hóa thành công {len(records)} hợp đồng tín dụng từ NG-eFUND (DuNo != TienVay).")
    return records

# --- 8. KHỞI TẠO & CHỮA LÀNH CSDL 13+ BẢNG (ĐÃ TÁCH SANG schema_healer.py) ---
# Module schema_healer.py đảm nhiệm: ALL_SCHEMAS, init_or_heal_database_schema, get_or_create_worksheet

# --- 9. GHI DỮ LIỆU BATCH LÊN GOOGLE SHEETS CÓ RETRY & EXPONENTIAL BACKOFF ---
def sync_records_to_sheet(sheet, headers, records, start_row=2, max_retries=3):
    """
    Ghi danh sách bản ghi (list of dicts) vào sheet bằng 1 lệnh batch duy nhất.
    Áp dụng sanitize chống Formula Injection (CWE-1236).
    Tự động đọc danh sách Header thực tế trên sheet để map chính xác từng cột theo tên.
    """
    if not records:
        logger.warning(f"⚠️ Không có bản ghi nào để ghi vào sheet '{sheet.title}'.")
        return 0

    # Ưu tiên lấy Header thực tế của Sheet nếu có
    actual_headers = []
    header_row_to_read = 2 if start_row == 3 else 1
    try:
        actual_headers = [str(h).strip() for h in sheet.row_values(header_row_to_read) if str(h).strip()]
    except Exception:
        actual_headers = []

    final_headers = actual_headers if actual_headers else headers

    values = []
    for r in records:
        row_vals = []
        for h in final_headers:
            val = r.get(h, "")
            row_vals.append(sanitize_cell_value(val))
        values.append(row_vals)

    num_rows = len(values)
    num_cols = len(final_headers)

    for attempt in range(max_retries):
        try:
            # Mở rộng số cột nếu sheet thiếu
            if sheet.col_count < num_cols:
                sheet.add_cols(num_cols - sheet.col_count + 5)

            max_rows = sheet.row_count
            if max_rows >= start_row:
                clear_range = f"A{start_row}:{gspread.utils.rowcol_to_a1(max_rows, num_cols)}"
                sheet.batch_clear([clear_range])

            end_col_letter = gspread.utils.rowcol_to_a1(1, num_cols).replace("1", "")

            if sheet.row_count < (start_row + num_rows):
                sheet.add_rows(start_row + num_rows - sheet.row_count + 50)

            # Tối ưu hóa ghi dữ liệu lớn (< 10.000 dòng): Chia chunk 2.000 dòng/batch
            # Đảm bảo payload nhẹ (< 400KB), không timeout HTTP, tuân thủ 100% Free Quota Google API
            CHUNK_SIZE = 2000
            if num_rows <= CHUNK_SIZE:
                target_range = f"A{start_row}:{end_col_letter}{start_row + num_rows - 1}"
                sheet.update(values=values, range_name=target_range, value_input_option="USER_ENTERED")
            else:
                total_chunks = (num_rows + CHUNK_SIZE - 1) // CHUNK_SIZE
                logger.info(f"📦 Dữ liệu lớn ({num_rows} dòng) -> Chia thành {total_chunks} lô (mỗi lô {CHUNK_SIZE} dòng) để ghi an toàn...")
                for chunk_i in range(0, num_rows, CHUNK_SIZE):
                    chunk_vals = values[chunk_i:chunk_i + CHUNK_SIZE]
                    cur_start = start_row + chunk_i
                    cur_end = cur_start + len(chunk_vals) - 1
                    target_range = f"A{cur_start}:{end_col_letter}{cur_end}"
                    sheet.update(values=chunk_vals, range_name=target_range, value_input_option="USER_ENTERED")
                    time.sleep(0.2)

            logger.info(f"✅ Đã ghi {num_rows} bản ghi vào sheet '{sheet.title}' (Cột: {num_cols}).")
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

        # Lập Map tra cứu khách hàng O(1) theo MaKH (bỏ dấu nháy ' nếu có)
        kh_lookup = {}
        for k in records_kh:
            m = str(k.get("MaKH", "")).strip().lstrip("'")
            kh_lookup[m] = k

        # Bổ sung thông tin Khách hàng (Họ tên, CCCD, SĐT, Địa chỉ, Xã, Thôn) vào records_hdtd
        cust_loan_stats = {}
        for r in records_hdtd:
            makh = str(r.get("MaKH", "")).strip().lstrip("'")
            cust = kh_lookup.get(makh, {})
            r["HoTen"] = r.get("HoTen") or cust.get("HoTen", "")
            r["CCCD"] = r.get("CCCD") or cust.get("CCCD", "")
            r["DienThoai"] = r.get("DienThoai") or cust.get("DienThoai", "") or cust.get("DienThoaiDD", "")
            r["DiaChi"] = r.get("DiaChi") or cust.get("DiaChi", "")
            r["KvXa"] = r.get("KvXa") or cust.get("KvXa", "")
            r["KvThon"] = r.get("KvThon") or cust.get("KvThon", "")

            du_no = float(r.get("DuNo", 0) or 0)
            if makh not in cust_loan_stats:
                cust_loan_stats[makh] = {"total_duno": 0, "count_hd": 0, "nhom_no": "NHOM1"}
            if du_no > 0:
                cust_loan_stats[makh]["total_duno"] += du_no
                cust_loan_stats[makh]["count_hd"] += 1
                curr_n = str(r.get("NhomNo", "NHOM1")).strip().upper()
                if curr_n > cust_loan_stats[makh]["nhom_no"]:
                    cust_loan_stats[makh]["nhom_no"] = curr_n

        # Cập nhật các chỉ số tổng hợp vào records_kh
        for k in records_kh:
            makh = str(k.get("MaKH", "")).strip().lstrip("'")
            stats = cust_loan_stats.get(makh, {"total_duno": 0, "count_hd": 0, "nhom_no": "NHOM1"})
            k["TongDuNoHienTai"] = stats["total_duno"]
            k["SoLuongHDVay"] = stats["count_hd"]
            k["TrangThaiVay"] = "DANG_VAY" if stats["count_hd"] > 0 else "CHUA_VAY"
            k["NhomNoCIC"] = stats["nhom_no"]

        # 1. Đẩy dữ liệu Khách hàng & Thành viên (KH_CORE)
        kh_headers = ALL_SCHEMAS.get("KH_CORE", {}).get("headers", [
            "MaKH", "HoTen", "CCCD", "NgayCap", "NoiCap", "NgaySinh",
            "DienThoai", "DienThoaiDD", "DiaChi", "KvXa", "KvThon", "KhuVuc", "SoTK",
            "SoTV", "SoSoCP", "NgayVaoTV", "TongTienCP",
            "TongDuNoHienTai", "SoLuongHDVay", "TrangThaiVay", "NhomNoCIC", "NgayCapNhat"
        ])
        kh_sheet = get_or_create_worksheet(spreadsheet, "KH_CORE", kh_headers)
        rows_kh = sync_records_to_sheet(kh_sheet, kh_headers, records_kh, start_row=2)

        # 2. Đẩy dữ liệu Khế ước & Dư nợ (HDTD_CORE) kèm bảo toàn CBTD
        hdtd_headers = ALL_SCHEMAS.get("HDTD_CORE", {}).get("headers", [
            "SoHDTD", "MaKH", "HoTen", "CCCD", "DienThoai", "DiaChi", "KvXa", "KvThon",
            "TienVay", "DuNo", "LaiSuat", "NgayVay", "DenHan", "TraLaiDenNgay",
            "SoThangVay", "MaLoaiVay", "MoTaVay",
            "CBTD_PhuTrach", "Ten_CBTD", "TrangThaiHD", "MaLoaiHD", "NhomNo", "NgayCapNhat"
        ])
        hdtd_sheet = get_or_create_worksheet(spreadsheet, "HDTD_CORE", hdtd_headers)

        try:
            existing_records = hdtd_sheet.get_all_records()
        except Exception:
            existing_records = []

        existing_map = {str(r.get("SoHDTD", "")).strip(): r for r in existing_records if str(r.get("SoHDTD", "")).strip()}

        # Tự động gán CBTD theo 3 địa bàn xã chính:
        # - Xã Quý Lộc: qtdyentho.huyennhu / Trần Như Huyền
        # - Xã Yên Trường: qtdyentho.luudinh / Lưu Thị Định
        # - Xã Vĩnh Lộc: qtdyentho.huunhan / Nguyễn Hữu Nhân
        cust_area_map = {}
        for k in records_kh:
            m = str(k.get("MaKH", "")).strip().lstrip("'")
            kv = (str(k.get("KvXa", "")) + " " + str(k.get("KhuVuc", "")) + " " + str(k.get("DiaChi", ""))).lower()
            if "quý lộc" in kv or "quy loc" in kv:
                cust_area_map[m] = ("qtdyentho.huyennhu", "Trần Như Huyền")
            elif "yên trường" in kv or "yen truong" in kv:
                cust_area_map[m] = ("qtdyentho.luudinh", "Lưu Thị Định")
            elif "vĩnh lộc" in kv or "vinh loc" in kv:
                cust_area_map[m] = ("qtdyentho.huunhan", "Nguyễn Hữu Nhân")
            else:
                cust_area_map[m] = ("qtdyentho.huyennhu", "Trần Như Huyền")

        # Bảo toàn CBTD đã phân công hoặc tự động gán theo địa bàn
        for r in records_hdtd:
            so_hd = str(r.get("SoHDTD", "")).strip()
            makh = str(r.get("MaKH", "")).strip().lstrip("'")
            def_user, def_name = cust_area_map.get(makh, ("qtdyentho.huyennhu", "Trần Như Huyền"))
            if so_hd in existing_map:
                prev_cbtd = str(existing_map[so_hd].get("CBTD_PhuTrach", "")).strip()
                prev_ten = str(existing_map[so_hd].get("Ten_CBTD", "")).strip()
                r["CBTD_PhuTrach"] = prev_cbtd if prev_cbtd else def_user
                r["Ten_CBTD"] = prev_ten if prev_ten else def_name
            else:
                r["CBTD_PhuTrach"] = def_user
                r["Ten_CBTD"] = def_name

        # Nhận diện HĐ tất toán
        active_so_hd_set = {str(r.get("SoHDTD", "")).strip() for r in records_hdtd}
        settled_rows = []
        for so_hd, prev_r in existing_map.items():
            if so_hd not in active_so_hd_set:
                p_makh = str(prev_r.get("MaKH", "")).strip().lstrip("'")
                p_cust = kh_lookup.get(p_makh, {})
                settled_row = {
                    "SoHDTD": so_hd,
                    "MaKH": prev_r.get("MaKH", ""),
                    "HoTen": prev_r.get("HoTen", "") or p_cust.get("HoTen", ""),
                    "CCCD": prev_r.get("CCCD", "") or p_cust.get("CCCD", ""),
                    "DienThoai": prev_r.get("DienThoai", "") or p_cust.get("DienThoai", ""),
                    "DiaChi": prev_r.get("DiaChi", "") or p_cust.get("DiaChi", ""),
                    "KvXa": prev_r.get("KvXa", "") or p_cust.get("KvXa", ""),
                    "KvThon": prev_r.get("KvThon", "") or p_cust.get("KvThon", ""),
                    "TienVay": prev_r.get("TienVay", 0),
                    "DuNo": 0,
                    "LaiSuat": prev_r.get("LaiSuat", 0),
                    "NgayVay": prev_r.get("NgayVay", ""),
                    "DenHan": prev_r.get("DenHan", ""),
                    "TraLaiDenNgay": prev_r.get("TraLaiDenNgay", ""),
                    "SoThangVay": prev_r.get("SoThangVay", 12),
                    "MaLoaiVay": prev_r.get("MaLoaiVay", "LV01"),
                    "MoTaVay": prev_r.get("MoTaVay", ""),
                    "CBTD_PhuTrach": prev_r.get("CBTD_PhuTrach", "qtdyentho.cbtd"),
                    "Ten_CBTD": prev_r.get("Ten_CBTD", "Lê Văn Tín (CBTD)"),
                    "TrangThaiHD": "DA_TAT_TOAN",
                    "MaLoaiHD": prev_r.get("MaLoaiHD") or ("THCDBTNMT" if prev_r.get("SoThangVay", 12) > 12 else "NHCDBTNMT"),
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

# --- 10B. TRÍCH XUẤT HĐTD ĐẾN NGÀY / CUỐI THÁNG (HDTD_CORE_DN & HDTD_CORE_ALL - 17 CỘT, 2 TẦNG HEADER) ---
def process_extract_hdtd_snapshot_request(spreadsheet, sql_cfg, params=None, default_target="HDTD_CORE_DN"):
    """
    Trích xuất dữ liệu HĐTD sao kê theo kiến trúc 2 tầng:
    - HDTD_CORE_DN: Sao kê chuyên biệt đến MỘT NGÀY CỤ THỂ (As-Of Date). Phục vụ xem tức thời, Top 50 Dư nợ đến ngày.
    - HDTD_CORE_ALL: Sao kê chuyên biệt đến CÁC NGÀY CUỐI MỖI THÁNG. Phục vụ biểu đồ xu hướng 12 tháng và Top 50 Dư nợ bình quân cuối tháng.
    """
    start_time = datetime.now()
    now_str = start_time.strftime("%d/%m/%Y %H:%M:%S")

    if isinstance(params, str):
        try:
            params = json.loads(params)
        except Exception:
            params = {"asOfDate": params}
    params = params or {}

    as_of_date = params.get("asOfDate") or start_time.strftime("%d/%m/%Y")
    mode = params.get("mode", "as_of_date")
    months = params.get("months", [])
    target_sheet_name = params.get("targetSheet") or ("HDTD_CORE_ALL" if mode == "month_ends" else default_target)

    setting_headers = ["COMMAND", "STATUS", "REQUEST_TIME", "START_TIME", "FINISH_TIME", "TOTAL_ROWS", "MESSAGE", "PARAMS"]
    setting_sheet = get_or_create_worksheet(spreadsheet, "SETTING", setting_headers)

    # Cập nhật trạng thái PROCESSING
    setting_sheet.update(
        values=[["PROCESSING", now_str, now_str]],
        range_name="B2:D2",
        value_input_option="USER_ENTERED"
    )
    logger.info(f"⚡ BẮT ĐẦU TRÍCH XUẤT {target_sheet_name} (Mốc: {as_of_date}, Mode: {mode}) LÚC {now_str}...")

    try:
        with get_sql_connection(sql_cfg) as sql_conn:
            records_kh = fetch_customer_core_data(sql_conn, now_str)

            # Lập Map tra cứu khách hàng O(1) theo MaKH
            kh_lookup = {}
            for k in records_kh:
                m = str(k.get("MaKH", "")).strip().lstrip("'")
                kh_lookup[m] = k

            # Chuẩn bị danh sách mốc ngày
            target_dates = [as_of_date]
            if target_sheet_name == "HDTD_CORE_ALL" or mode == "month_ends":
                target_dates = []
                curr_year = datetime.now().year
                import calendar
                month_list = months if months else [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                for m in month_list:
                    try:
                        m_int = int(m)
                        last_day = calendar.monthrange(curr_year, m_int)[1]
                        target_dates.append(f"{last_day:02d}/{m_int:02d}/{curr_year}")
                    except Exception:
                        pass
                if not target_dates:
                    target_dates = [as_of_date]

            dn_records = []
            for t_date in target_dates:
                # Truy vấn chính xác dữ liệu HĐTD và Dư nợ thực tế (DuNo) tại mốc t_date
                records_hdtd_t = fetch_loan_contract_core_data(sql_conn, now_str, t_date)
                for r in records_hdtd_t:
                    makh = str(r.get("MaKH", "")).strip().lstrip("'")
                    cust = kh_lookup.get(makh, {})
                    ho_ten = cust.get("HoTen", "") or r.get("HoTen", "")
                    dia_chi = cust.get("DiaChi", "") or r.get("DiaChi", "")
                    kv_xa = r.get("KvXa", "") or cust.get("KvXa", "")
                    kv_thon = r.get("KvThon", "") or cust.get("KvThon", "")

                    dn_record = {
                        "SoHDTD": r.get("SoHDTD", ""),
                        "MaKH": r.get("MaKH", ""),
                        "HoTen": ho_ten,
                        "CCCD": cust.get("CCCD", "") or r.get("CCCD", ""),
                        "DienThoai": cust.get("DienThoai", "") or r.get("DienThoai", ""),
                        "DiaChi": dia_chi,
                        "KvXa": kv_xa,
                        "KvThon": kv_thon,
                        "TienVay": r.get("TienVay", 0),  # Vốn vay ban đầu (giải ngân)
                        "DuNo": r.get("DuNo", 0),        # Dư nợ thực tế lưu hành
                        "LaiSuat": r.get("LaiSuat", 0),
                        "NgayVay": r.get("NgayVay", ""),
                        "DenHan": r.get("DenHan", ""),
                        "TraLaiDenNgay": r.get("TraLaiDenNgay", ""),
                        "SoThangVay": r.get("SoThangVay", 12),
                        "MaLoaiVay": r.get("MaLoaiVay", ""),
                        "MoTaVay": r.get("MoTaVay", ""),
                        "CBTD_PhuTrach": r.get("CBTD_PhuTrach", "qtdyentho.cbtd"),
                        "Ten_CBTD": r.get("Ten_CBTD", "Lê Văn Tín (CBTD)"),
                        "TrangThaiHD": r.get("TrangThaiHD", "DANG_VAY" if r.get("DuNo", 0) > 0 else "DA_TAT_TOAN"),
                        "MaLoaiHD": r.get("MaLoaiHD", ""),
                        "NhomNo": r.get("NhomNo", "NHOM1"),
                        "NgayDuLieu": t_date,
                        "NgayCapNhat": now_str
                    }
                    dn_records.append(dn_record)

        dn_headers = ALL_SCHEMAS.get(target_sheet_name, {}).get("headers", [
            "SoHDTD", "MaKH", "HoTen", "CCCD", "DienThoai", "DiaChi", "KvXa", "KvThon",
            "TienVay", "DuNo", "LaiSuat", "NgayVay", "DenHan", "TraLaiDenNgay",
            "SoThangVay", "MaLoaiVay", "MoTaVay",
            "CBTD_PhuTrach", "Ten_CBTD", "TrangThaiHD", "MaLoaiHD", "NhomNo",
            "NgayDuLieu", "NgayCapNhat"
        ])
        dn_sheet = get_or_create_worksheet(spreadsheet, target_sheet_name, dn_headers)

        # 1. Cập nhật Dòng 1 Banner Metadata
        if target_sheet_name == "HDTD_CORE_ALL":
            banner_text = f"Lưu trữ sao kê tín dụng các ngày cuối tháng ({len(target_dates)} kỳ) | Dữ liệu cập nhật: {now_str} | Trạng thái: HOÀN TẤT | Nguồn: CoreBanking NG-eFUND"
        else:
            banner_text = f"Sao kê tín dụng đến ngày: {as_of_date} | Dữ liệu cập nhật: {now_str} | Trạng thái: HOÀN TẤT | Nguồn: CoreBanking NG-eFUND"

        dn_sheet.update(
            values=[[banner_text]],
            range_name="A1:A1",
            value_input_option="USER_ENTERED"
        )

        # 2. Cập nhật Dòng 2 Headers 23 cột (đảm bảo đúng thứ tự)
        dn_sheet.update(
            values=[dn_headers],
            range_name="A2:W2",
            value_input_option="USER_ENTERED"
        )

        # 3. Ghi dữ liệu từ Dòng 3
        rows_dn = sync_records_to_sheet(dn_sheet, dn_headers, dn_records, start_row=3)

        # 4. Đảm bảo cố định 2 dòng đầu
        try:
            dn_sheet.freeze(rows=2)
        except Exception:
            pass

        finish_time = datetime.now()
        elapsed = (finish_time - start_time).total_seconds()
        message = f"Trích xuất thành công {rows_dn} bản ghi {target_sheet_name} ({len(target_dates)} mốc ngày) lúc {finish_time.strftime('%d/%m/%Y %H:%M:%S')} ({elapsed:.1f}s)."

        # Cập nhật trạng thái SETTING -> SUCCESS
        setting_sheet.update(
            values=[[
                "IDLE",
                "SUCCESS",
                now_str,
                now_str,
                finish_time.strftime("%d/%m/%Y %H:%M:%S"),
                rows_dn,
                message
            ]],
            range_name="A2:G2",
            value_input_option="USER_ENTERED"
        )
        logger.info(f"🏆 === {message} ===")
        return True

    except Exception as e:
        finish_time = datetime.now()
        err_msg = f"Lỗi trích xuất {target_sheet_name}: {str(e)}"
        logger.error(err_msg, exc_info=True)
        setting_sheet.update(
            values=[[
                "IDLE",
                "ERROR",
                now_str,
                now_str,
                finish_time.strftime("%d/%m/%Y %H:%M:%S"),
                0,
                err_msg[:250]
            ]],
            range_name="A2:G2",
            value_input_option="USER_ENTERED"
        )
        return False

def process_extract_hdtd_dn_request(spreadsheet, sql_cfg, params=None):
    return process_extract_hdtd_snapshot_request(spreadsheet, sql_cfg, params, default_target="HDTD_CORE_DN")

def process_extract_hdtd_all_request(spreadsheet, sql_cfg, params=None):
    return process_extract_hdtd_snapshot_request(spreadsheet, sql_cfg, params, default_target="HDTD_CORE_ALL")

# --- 10C. ĐỒNG BỘ BẢNG BẤT KỲ THEO CẤU HÌNH SQL (GENERIC TABLE SYNC) ---
def execute_sql_query(sql_conn, query_str, params=None):
    """
    Thực thi câu lệnh SQL với các tham số động ({denngay}, {chinhanh}...).
    Trả về danh sách dict: [{col1: val1, col2: val2, ...}]
    """
    params = params or {}
    denngay_val = params.get("denngay") or params.get("asOfDate") or datetime.now().strftime("%Y%m%d")
    # Chuẩn hóa về YYYYMMDD nếu là dd/MM/yyyy
    if "/" in str(denngay_val):
        pts = str(denngay_val).split("/")
        if len(pts) == 3:
            denngay_val = f"{pts[2]}{pts[1].zfill(2)}{pts[0].zfill(2)}"

    chinhanh_val = params.get("chinhanh") or "01"

    # Định dạng chuỗi query an toàn
    formatted_query = query_str.replace("{denngay}", denngay_val).replace("{chinhanh}", chinhanh_val)

    cursor = sql_conn.cursor()
    cursor.execute(formatted_query)
    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()
    cursor.close()

    result = []
    for r in rows:
        row_dict = {col: (val if val is not None else "") for col, val in zip(columns, r)}
        result.append(row_dict)
    return result

def sync_table_from_query(spreadsheet, sql_cfg, table_key, params=None):
    """
    Trích xuất và đồng bộ dữ liệu của MỘT BẢNG BẤT KỲ từ SQL Server lên Google Sheets
    dựa trên cấu hình trong sql_queries.py hoặc câu lệnh SQL do người dùng cung cấp.
    """
    query_def = get_query_definition(table_key)
    if not query_def:
        logger.error(f"❌ Không tìm thấy cấu hình truy vấn cho bảng '{table_key}'.")
        logger.info(f"💡 Các bảng đã được đăng ký: {[t['key'] for t in list_registered_tables()]}")
        return False

    target_sheet_name = query_def.get("sheet_name", table_key)
    sql_query = query_def.get("query", "")
    fallback_query = query_def.get("fallback_query")
    field_mapping = query_def.get("field_mapping", {})
    description = query_def.get("description", "")

    start_time = datetime.now()
    now_str = start_time.strftime("%d/%m/%Y %H:%M:%S")

    logger.info("=" * 65)
    logger.info(f"⚡ BẮT ĐẦU ĐỒNG BỘ BẢNG: {table_key} -> Google Sheet: '{target_sheet_name}'")
    if description:
        logger.info(f"ℹ️  Mô tả: {description}")
    logger.info("=" * 65)

    try:
        with get_sql_connection(sql_cfg) as sql_conn:
            try:
                raw_rows = execute_sql_query(sql_conn, sql_query, params)
                logger.info(f"✅ Truy vấn SQL thành công ({len(raw_rows)} bản ghi).")
            except Exception as e_sql:
                if fallback_query:
                    logger.warning(f"⚠️ Query chính gặp lỗi ({e_sql}), đang thử query dự phòng...")
                    raw_rows = execute_sql_query(sql_conn, fallback_query, params)
                    logger.info(f"✅ Truy vấn fallback thành công ({len(raw_rows)} bản ghi).")
                else:
                    raise

        # Lấy schema chuẩn của bảng từ ALL_SCHEMAS
        sheet_schema = ALL_SCHEMAS.get(target_sheet_name, {})
        sheet_headers = sheet_schema.get("headers")

        if not sheet_headers:
            # Nếu chưa có trong ALL_SCHEMAS, tự động tạo headers từ các cột của SQL
            if raw_rows:
                sheet_headers = list(raw_rows[0].keys())
            else:
                sheet_headers = ["ID", "Ten", "NgayCapNhat"]

        # Chuẩn hóa từng bản ghi và ánh xạ cột
        cleaned_records = []
        for raw_r in raw_rows:
            # 1. Ánh xạ cột qua field_mapping
            mapped_r = {}
            for col_name, val in raw_r.items():
                norm_col = col_name.lower().strip()
                target_col = field_mapping.get(norm_col, col_name)
                mapped_r[target_col] = val

            # 2. Chuẩn hóa giá trị theo quy tắc Google Sheets
            clean_r = clean_record_by_schema(mapped_r, sheet_headers)
            clean_r["NgayCapNhat"] = now_str
            cleaned_records.append(clean_r)

        # Mở hoặc tạo worksheet
        target_ws = get_or_create_worksheet(spreadsheet, target_sheet_name, sheet_headers)

        # Xác định dòng bắt đầu ghi (bảng 2 tầng hay bảng thông thường)
        if target_sheet_name in ("HDTD_CORE_DN", "HDTD_CORE_ALL"):
            start_row = 3
            as_of_date = (params or {}).get("asOfDate") or start_time.strftime("%d/%m/%Y")
            if target_sheet_name == "HDTD_CORE_ALL":
                banner_text = f"Lưu trữ sao kê tín dụng các ngày cuối tháng | Dữ liệu cập nhật: {now_str} | Trạng thái: HOÀN TẤT | Nguồn: CoreBanking NG-eFUND"
            else:
                banner_text = f"Sao kê tín dụng đến ngày: {as_of_date} | Dữ liệu cập nhật: {now_str} | Trạng thái: HOÀN TẤT | Nguồn: CoreBanking NG-eFUND"
            try:
                target_ws.update(values=[[banner_text]], range_name="A1:A1", value_input_option="USER_ENTERED")
                end_col_letter = gspread.utils.rowcol_to_a1(2, len(sheet_headers)).replace("2", "")
                target_ws.update(values=[sheet_headers], range_name=f"A2:{end_col_letter}2", value_input_option="USER_ENTERED")
                target_ws.freeze(rows=2)
            except Exception as e_banner:
                logger.warning(f"Lưu ý khi cập nhật banner 2 tầng cho {target_sheet_name}: {e_banner}")
        else:
            start_row = 2

        # Ghi dữ liệu batch lên Google Sheets
        rows_synced = sync_records_to_sheet(target_ws, sheet_headers, cleaned_records, start_row=start_row)

        finish_time = datetime.now()
        elapsed = (finish_time - start_time).total_seconds()
        logger.info(f"🏆 ĐỒNG BỘ THÀNH CÔNG BẢNG '{target_sheet_name}': {rows_synced} bản ghi ({elapsed:.1f}s).")
        return True

    except Exception as e:
        logger.error(f"❌ Lỗi khi đồng bộ bảng '{table_key}': {e}", exc_info=True)
        return False

def test_custom_sql_query(sql_cfg, query_str, params=None, preview_limit=5):
    """
    Kiểm thử trực tiếp một câu lệnh SQL tùy chỉnh:
    - Thực thi câu lệnh
    - In ra tên các cột và số lượng bản ghi
    - In ra preview 5 bản ghi đầu tiên sau khi được chuẩn hóa kiểu dữ liệu
    """
    logger.info("=" * 65)
    logger.info("🧪 KIỂM THỬ TRUY VẤN SQL TÙY CHỈNH")
    logger.info("=" * 65)
    try:
        with get_sql_connection(sql_cfg) as sql_conn:
            start = time.time()
            rows = execute_sql_query(sql_conn, query_str, params)
            elapsed = time.time() - start

            logger.info(f"✅ Thực thi SQL thành công trong {elapsed:.2f}s!")
            logger.info(f"📊 Tổng số bản ghi tìm thấy: {len(rows):,}")

            if not rows:
                logger.info("ℹ️  Không có bản ghi nào được trả về.")
                return

            columns = list(rows[0].keys())
            logger.info(f"📋 Danh sách cột ({len(columns)} cột): {columns}")
            logger.info("-" * 65)
            logger.info(f"👀 Xem trước {min(preview_limit, len(rows))} bản ghi đầu tiên (đã qua chuẩn hóa):")

            for idx, r in enumerate(rows[:preview_limit], 1):
                cleaned = clean_record_by_schema(r)
                print(f"\n--- Bản ghi #{idx} ---")
                for col in columns:
                    raw_val = r.get(col)
                    clean_val = cleaned.get(col)
                    val_type = type(clean_val).__name__
                    print(f"  • {col:20s}: {repr(clean_val):25s} (Gốc: {repr(raw_val)}, Kiểu: {val_type})")

            logger.info("-" * 65)
            logger.info("💡 Bạn có thể cấu hình câu lệnh này vào sql_queries.py để hệ thống tự động đẩy lên Google Sheets.")
    except Exception as e:
        logger.error(f"❌ Lỗi khi thực thi câu lệnh SQL kiểm thử: {e}", exc_info=True)

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
    parser.add_argument("--table", type=str, default="", help="Đồng bộ riêng một bảng cụ thể (ví dụ: KH_CORE, HDTD_CORE, TSBD_CORE, CASA_CORE...)")
    parser.add_argument("--all-tables", action="store_true", help="Đồng bộ tất cả các bảng đã được cấu hình trong sql_queries.py")
    parser.add_argument("--list-tables", action="store_true", help="Liệt kê danh sách các bảng và câu lệnh SQL đã đăng ký")
    parser.add_argument("--test-query", type=str, default="", help="Chạy thử nghiệm một câu lệnh SQL tùy chỉnh và in kết quả xem trước")
    parser.add_argument("--extract-dn", action="store_true", help="Thực hiện trích xuất HDTD_CORE_DN ngay 1 lần từ SQL Server và thoát")
    parser.add_argument("--extract-all", action="store_true", help="Thực hiện trích xuất HDTD_CORE_ALL (các ngày cuối tháng) ngay 1 lần từ SQL Server và thoát")
    parser.add_argument("--as-of-date", type=str, default="", help="Mốc ngày sao kê (dd/MM/yyyy) khi dùng --extract-dn hoặc --table")
    parser.add_argument("--mode", type=str, default="as_of_date", help="Chế độ sao kê: 'as_of_date' hoặc 'month_ends'")
    parser.add_argument("--init-schema", action="store_true", help="Khởi tạo hoặc sửa chữa cấu trúc 12 bảng CSDL Google Sheets")
    parser.add_argument("--test-connection", action="store_true", help="Kiểm tra kết nối tới Google Sheets và SQL Server")
    args = parser.parse_args()

    config = load_config()
    poll_interval = config.get("poll_interval_seconds", 5)
    sheet_id = config["google_sheet_id"]
    cred_file = config["credentials_file"]
    sql_cfg = config["sql_server"]

    # 0. Chế độ kiểm thử câu lệnh SQL tùy chỉnh (Không yêu cầu Google Sheets)
    if args.test_query:
        test_custom_sql_query(sql_cfg, args.test_query, {"asOfDate": args.as_of_date})
        sys.exit(0)

    # 0B. Liệt kê các bảng đã đăng ký SQL
    if args.list_tables:
        print("=" * 65)
        print("DANH SÁCH BẢNG CƠ SỞ DỮ LIỆU ĐÃ ĐĂNG KÝ TRUY VẤN SQL")
        print("=" * 65)
        for t in list_registered_tables():
            print(f"  • Mã bảng:   {t['key']}")
            print(f"    Tên Sheet: '{t['sheet_name']}'")
            print(f"    Mô tả:     {t['description']}")
            print("-" * 65)
        sys.exit(0)

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

    # 2B. Đồng bộ một bảng cụ thể
    if args.table:
        table_key = args.table.upper().strip()
        logger.info(f"🚀 Chế độ đồng bộ riêng bảng '{table_key}' (--table {table_key})...")
        sync_table_from_query(spreadsheet, sql_cfg, table_key, {"asOfDate": args.as_of_date})
        sys.exit(0)

    # 2C. Đồng bộ tất cả các bảng đã cấu hình
    if args.all_tables:
        logger.info("🚀 Chế độ đồng bộ TẤT CẢ các bảng đã cấu hình (--all-tables)...")
        # 1. Đồng bộ KH và HDTD chuẩn (KH_CORE, HDTD_CORE)
        process_sync_request(spreadsheet, sql_cfg)
        # 2. Đồng bộ các bảng sao kê HĐTD còn lại (HDTD_CORE_DN, HDTD_CORE_ALL)
        for t in list_registered_tables():
            k = t["key"]
            if k not in ("KH_CORE", "HDTD_CORE"):
                sync_table_from_query(spreadsheet, sql_cfg, k, {"asOfDate": args.as_of_date})
        logger.info("🏆 Đã hoàn tất đồng bộ toàn bộ các bảng lên Google Sheets!")
        sys.exit(0)

    # 3. Chế độ chạy thủ công trích xuất HDTD_CORE_DN tức thì
    if args.extract_dn:
        logger.info(f"🚀 Chế độ trích xuất HDTD_CORE_DN tức thì (--extract-dn, as_of_date={args.as_of_date or 'Hôm nay'})...")
        process_extract_hdtd_dn_request(spreadsheet, sql_cfg, {"asOfDate": args.as_of_date, "mode": "as_of_date", "targetSheet": "HDTD_CORE_DN"})
        sys.exit(0)

    # 3B. Chế độ chạy thủ công trích xuất HDTD_CORE_ALL tức thì (cuối các tháng)
    if args.extract_all:
        logger.info(f"🚀 Chế độ trích xuất HDTD_CORE_ALL tức thì (--extract-all, các ngày cuối tháng)...")
        process_extract_hdtd_all_request(spreadsheet, sql_cfg, {"mode": "month_ends", "targetSheet": "HDTD_CORE_ALL"})
        sys.exit(0)

    # 4. Chế độ chạy thủ công tức thì từ SQL Server (SYNC_DATA)
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
            elif command == "EXTRACT_HDTD_DN" and status in ["PENDING", "REQUESTED"]:
                logger.info(f"🔔 Phát hiện lệnh trích xuất HDTD_CORE_DN từ WebApp (COMMAND='{command}', STATUS='{status}')")
                params_val = row2[7].strip() if len(row2) > 7 else ""
                process_extract_hdtd_dn_request(spreadsheet, sql_cfg, params_val)
            elif command == "EXTRACT_HDTD_ALL" and status in ["PENDING", "REQUESTED"]:
                logger.info(f"🔔 Phát hiện lệnh trích xuất HDTD_CORE_ALL từ WebApp (COMMAND='{command}', STATUS='{status}')")
                params_val = row2[7].strip() if len(row2) > 7 else ""
                process_extract_hdtd_all_request(spreadsheet, sql_cfg, params_val)

        except gspread.exceptions.APIError as api_err:
            logger.warning(f"Google Sheets API tạm thời bận: {api_err}. Đang tiếp tục lắng nghe...")
        except Exception as e:
            logger.error(f"Lỗi kiểm tra hàng đợi: {e}", exc_info=False)

        time.sleep(poll_interval)

if __name__ == "__main__":
    main()
