"""
========================================================================================
HỆ THỐNG QUẢN LÝ TÍN DỤNG & TRÍCH NỢ AUTOMATION - LOCAL PYTHON DAEMON
File: sync_daemon.py
Môi trường: Windows Server 2025 / Windows 10/11 (Chạy trực tiếp trên máy chủ SQL Server)
Bảo mật: Kết nối SQL Server nội bộ (Windows Trusted Auth / SQL Auth), 
         Mã hóa một chiều TLS 1.3 đẩy lên Google Sheets qua Service Account.

Tính năng:
1. Lắng nghe liên tục hàng đợi từ Google Sheets (Sheet SETTING).
2. Khi có yêu cầu (COMMAND = 'SYNC_DATA'), tự động truy vấn dữ liệu từ SQL Server Core.
3. Tự động đóng dấu thời gian (NgayCapNhat) trên từng dòng dữ liệu khách hàng và hợp đồng.
4. Batch update ghi đè an toàn lên Google Sheets (KH_CORE, HDTD_CORE) trong 3-5 giây.
5. Cập nhật trạng thái, ngày giờ và số lượng bản ghi vào SETTING để WebApp hiển thị tức thì.
6. Hỗ trợ cờ `--now` để đồng bộ ngay lập tức từ dòng lệnh hoặc Windows Task Scheduler.
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

# --- 1. CẤU HÌNH LOGGING CHUẨN DOANH NGHIỆP ---
LOG_FILE = "sync_daemon.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE, encoding="utf-8")
    ]
)
logger = logging.getLogger("CreditCoreSyncDaemon")

# --- 2. QUẢN LÝ CẤU HÌNH & BẢO MẬT ---
CONFIG_FILE = "config.json"

def load_config():
    if not os.path.exists(CONFIG_FILE):
        logger.error(f"❌ Không tìm thấy file cấu hình {CONFIG_FILE}. Vui lòng tạo file từ config.example.json.")
        sys.exit(1)
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

# --- 3. KẾT NỐI GOOGLE SHEETS BẢO MẬT QUA SERVICE ACCOUNT ---
def get_gspread_client(credentials_path):
    if not os.path.exists(credentials_path):
        logger.error(f"❌ Không tìm thấy file Google Service Account key: {credentials_path}")
        sys.exit(1)

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]
    creds = Credentials.from_service_account_file(credentials_path, scopes=scopes)
    return gspread.authorize(creds)

# --- 4. KẾT NỐI NỘI BỘ SQL SERVER TRÊN WINDOWS SERVER 2025 ---
def get_sql_connection(sql_cfg):
    """
    Tạo kết nối an toàn tới SQL Server cục bộ.
    Hỗ trợ cả Windows Integrated Authentication (Trusted_Connection=yes) và SQL Authentication.
    """
    driver = sql_cfg.get('driver', 'ODBC Driver 17 for SQL Server')
    server = sql_cfg.get('server', 'localhost')
    database = sql_cfg.get('database', 'CORE_BANKING_YENTHO')
    use_trusted = sql_cfg.get('use_windows_auth', False)

    if use_trusted:
        conn_str = (
            f"DRIVER={{{driver}}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"Trusted_Connection=yes;"
            f"TrustServerCertificate={sql_cfg.get('trust_server_certificate', 'yes')};"
        )
    else:
        conn_str = (
            f"DRIVER={{{driver}}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"UID={sql_cfg['username']};"
            f"PWD={sql_cfg['password']};"
            f"TrustServerCertificate={sql_cfg.get('trust_server_certificate', 'yes')};"
        )
    return pyodbc.connect(conn_str, timeout=15)

# --- 5. TRUY VẤN DỮ LIỆU TỪ SQL SERVER CORE & ĐÓNG DẤU NGÀY GIỜ ---
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

# --- 6. GHI DỮ LIỆU BATCH LÊN GOOGLE SHEETS ---
def get_or_create_worksheet(spreadsheet, title, headers):
    """
    Tự động tìm hoặc tạo mới worksheet nếu chưa tồn tại trên Google Spreadsheet.
    """
    try:
        sheet = spreadsheet.worksheet(title)
        # Kiểm tra dòng header
        cur_headers = sheet.row_values(1)
        if not cur_headers or len(cur_headers) < len(headers):
            sheet.update(range_name=f"A1:{gspread.utils.rowcol_to_a1(1, len(headers))}", values=[headers])
        return sheet
    except gspread.exceptions.WorksheetNotFound:
        logger.info(f"⚡ Sheet '{title}' chưa có, tự động tạo mới...")
        sheet = spreadsheet.add_worksheet(title=title, rows=100, cols=len(headers) + 5)
        sheet.update(range_name=f"A1:{gspread.utils.rowcol_to_a1(1, len(headers))}", values=[headers])
        return sheet

def sync_dataframe_to_sheet(sheet, df, start_row=2):
    """
    Xóa dữ liệu cũ và ghi toàn bộ dữ liệu mới vào sheet chỉ bằng 1 lệnh batch duy nhất.
    """
    if df.empty:
        logger.warning(f"⚠️ DataFrame rỗng, không có dữ liệu để ghi vào sheet {sheet.title}.")
        return 0

    values = df.fillna("").values.tolist()
    num_rows = len(values)
    num_cols = len(df.columns)

    max_rows = sheet.row_count
    if max_rows >= start_row:
        clear_range = f"A{start_row}:{gspread.utils.rowcol_to_a1(max_rows, num_cols)}"
        sheet.batch_clear([clear_range])

    end_col_letter = gspread.utils.rowcol_to_a1(1, num_cols).replace("1", "")
    target_range = f"A{start_row}:{end_col_letter}{start_row + num_rows - 1}"

    if sheet.row_count < (start_row + num_rows):
        sheet.add_rows(start_row + num_rows - sheet.row_count + 50)

    sheet.update(range_name=target_range, values=values, value_input_option="USER_ENTERED")
    logger.info(f"✅ Đã ghi {num_rows} bản ghi kèm nhãn ngày giờ vào sheet '{sheet.title}'.")
    return num_rows

# --- 7. QUY TRÌNH THỰC THI ĐỒNG BỘ TOÀN DIỆN ---
def process_sync_request(spreadsheet, sql_cfg):
    start_time = datetime.now()
    sync_timestamp_str = start_time.strftime("%d/%m/%Y %H:%M:%S")
    
    # Đảm bảo bảng SETTING tồn tại
    setting_headers = ["COMMAND", "STATUS", "REQUEST_TIME", "START_TIME", "FINISH_TIME", "TOTAL_ROWS", "MESSAGE"]
    setting_sheet = get_or_create_worksheet(spreadsheet, "SETTING", setting_headers)
    
    # Cập nhật trạng thái SETTING -> PROCESSING
    setting_sheet.update(
        range_name="B2:D2",
        values=[["PROCESSING", sync_timestamp_str, sync_timestamp_str]],
        value_input_option="USER_ENTERED"
    )
    logger.info(f"⚡ BẮT ĐẦU ĐỒNG BỘ DỮ LIỆU TỪ SQL SERVER CORE LÚC {sync_timestamp_str}...")

    try:
        with get_sql_connection(sql_cfg) as sql_conn:
            # 1. Đồng bộ Khách hàng & Thành viên
            df_kh = fetch_customer_core_data(sql_conn, sync_timestamp_str)
            kh_headers = ["MaKH", "HoTen", "DiaChi", "NgaySinh", "CCCD", "NgayCap", "NoiCap", "DienThoai", "DienThoaiDD", "SoTK", "KhuVuc", "SoTV", "SoSoCP", "NgayVaoTV", "TongTienCP", "NgayCapNhat"]
            kh_sheet = get_or_create_worksheet(spreadsheet, "KH_CORE", kh_headers)
            rows_kh = sync_dataframe_to_sheet(kh_sheet, df_kh, start_row=2)

            # 2. Đồng bộ Khế ước & Dư nợ Tín dụng
            df_hdtd = fetch_loan_contract_core_data(sql_conn, sync_timestamp_str)
            hdtd_headers = ["SoHDTD", "MaKH", "TienVay", "DuNo", "LaiSuat", "NgayVay", "DenHan", "TraLaiDenNgay", "MaLoaiVay", "SoThangVay", "MoTaVay", "NgayCapNhat"]
            hdtd_sheet = get_or_create_worksheet(spreadsheet, "HDTD_CORE", hdtd_headers)
            rows_hdtd = sync_dataframe_to_sheet(hdtd_sheet, df_hdtd, start_row=2)

        finish_time = datetime.now()
        total_rows = rows_kh + rows_hdtd
        elapsed = (finish_time - start_time).total_seconds()
        message = f"Đồng bộ thành công {rows_kh} Khách hàng và {rows_hdtd} Hợp đồng lúc {finish_time.strftime('%d/%m/%Y %H:%M:%S')} (Thời gian xử lý: {elapsed:.1f}s)."

        # Cập nhật trạng thái SETTING -> SUCCESS
        setting_sheet.update(
            range_name="A2:G2",
            values=[[
                "IDLE",
                "SUCCESS",
                sync_timestamp_str,
                sync_timestamp_str,
                finish_time.strftime("%d/%m/%Y %H:%M:%S"),
                total_rows,
                message
            ]],
            value_input_option="USER_ENTERED"
        )
        logger.info(f"🏆 === {message} ===")
        return True

    except Exception as e:
        finish_time = datetime.now()
        err_msg = f"Lỗi đồng bộ: {str(e)}"
        logger.error(err_msg, exc_info=True)
        setting_sheet.update(
            range_name="A2:G2",
            values=[[
                "IDLE",
                "ERROR",
                sync_timestamp_str,
                sync_timestamp_str,
                finish_time.strftime("%d/%m/%Y %H:%M:%S"),
                0,
                err_msg[:250]
            ]],
            value_input_option="USER_ENTERED"
        )
        return False

# --- 8. VÒNG LẶP LẮNG NGHE (DAEMON LOOP & CLI MODE) ---
def main():
    parser = argparse.ArgumentParser(description="CreditCore SQL to Google Sheets Sync Daemon")
    parser.add_argument("--now", action="store_true", help="Thực hiện đồng bộ ngay lập tức và thoát (không cần chờ cờ WebApp)")
    args = parser.parse_args()

    config = load_config()
    poll_interval = config.get("poll_interval_seconds", 5)
    sheet_id = config["google_sheet_id"]
    cred_file = config["credentials_file"]
    sql_cfg = config["sql_server"]

    gc = get_gspread_client(cred_file)
    spreadsheet = gc.open_by_key(sheet_id)

    if args.now:
        logger.info("Chế độ chạy thủ công tức thì (--now)...")
        process_sync_request(spreadsheet, sql_cfg)
        sys.exit(0)

    logger.info("=================================================================")
    logger.info("🚀 CREDIT CORE PYTHON SYNC DAEMON - ĐANG LẮNG NGHE LỆNH TỪ WEBAPP")
    logger.info(f"📍 Google Sheet ID: {sheet_id}")
    logger.info(f"🏢 SQL Server Host: {sql_cfg.get('server', 'localhost')} | DB: {sql_cfg.get('database', '')}")
    logger.info(f"⏱️  Chu kỳ quét: {poll_interval} giây/lần")
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
