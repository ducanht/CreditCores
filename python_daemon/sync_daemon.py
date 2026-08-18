"""
========================================================================================
HỆ THỐNG QUẢN LÝ TÍN DỤNG & TRÍCH NỢ AUTOMATION - LOCAL PYTHON DAEMON
File: sync_daemon.py
Mô tả: Tiến trình chạy nền 24/7 trên Máy chủ SQL Server nội bộ.
       Lắng nghe hàng đợi từ Google Sheets (sheet SETTING).
       Khi có cờ COMMAND = 'SYNC_DATA' & STATUS = 'PENDING', daemon sẽ tự động:
       1. Kết nối SQL Server Core qua pyodbc và truy vấn các bảng dữ liệu Tín dụng & Khách hàng.
       2. Chuẩn hóa dữ liệu sang định dạng chuẩn ngân hàng.
       3. Batch update trực tiếp lên Google Sheets (KH_CORE và HDTD_CORE).
       4. Ghi nhận trạng thái hoàn tất, thời gian và số dòng đồng bộ vào sheet SETTING.
========================================================================================
"""

import os
import sys
import time
import json
import logging
from datetime import datetime
import pyodbc
import pandas as pd
import gspread
from google.oauth2.service_account import Credentials

# --- 1. CẤU HÌNH LOGGING ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("sync_daemon.log", encoding="utf-8")
    ]
)
logger = logging.getLogger("CreditCoreDaemon")

# --- 2. TẢI FILE CẤU HÌNH ---
CONFIG_FILE = "config.json"

def load_config():
    if not os.path.exists(CONFIG_FILE):
        logger.error(f"Không tìm thấy file cấu hình {CONFIG_FILE}. Vui lòng tạo file từ config.example.json.")
        sys.exit(1)
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

# --- 3. KẾT NỐI GOOGLE SHEETS QUA GSPREAD ---
def get_gspread_client(credentials_path):
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]
    creds = Credentials.from_service_account_file(credentials_path, scopes=scopes)
    return gspread.authorize(creds)

# --- 4. KẾT NỐI SQL SERVER ---
def get_sql_connection(sql_cfg):
    conn_str = (
        f"DRIVER={{{sql_cfg.get('driver', 'ODBC Driver 17 for SQL Server')}}};"
        f"SERVER={sql_cfg['server']};"
        f"DATABASE={sql_cfg['database']};"
        f"UID={sql_cfg['username']};"
        f"PWD={sql_cfg['password']};"
        f"TrustServerCertificate={sql_cfg.get('trust_server_certificate', 'yes')};"
    )
    return pyodbc.connect(conn_str, timeout=15)

# --- 5. TRUY VẤN DỮ LIỆU TỪ SQL SERVER CORE ---
def fetch_customer_core_data(sql_conn):
    """
    Truy vấn bảng Khách hàng, Tài khoản và Thành viên
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
        ISNULL(kh.TongTienCP, 0) AS TongTienCP
    FROM DC_KHACH_HANG kh WITH (NOLOCK)
    LEFT JOIN KT_TAI_KHOAN tk WITH (NOLOCK) ON kh.MaKH = tk.MaKH AND tk.LoaiTK = 'CASA' AND tk.TrangThai = 'A'
    LEFT JOIN DC_KHU_VUC kv WITH (NOLOCK) ON kh.MaKhuVuc = kv.MaKhuVuc
    WHERE kh.TrangThai = 'A'
    ORDER BY kh.MaKH ASC;
    """
    logger.info("Đang thực thi SQL truy vấn dữ liệu Khách hàng & Thành viên (DC_KHACH_HANG)...")
    df = pd.read_sql_query(query, sql_conn)
    return df

def fetch_loan_contract_core_data(sql_conn):
    """
    Truy vấn bảng Khế ước / Hợp đồng Tín dụng (TD_KHE_UOC, TD_HOP_DONG_TD)
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
        ISNULL(lv.TenLoaiVay, ku.MucDichVay) AS MoTaVay
    FROM TD_KHE_UOC ku WITH (NOLOCK)
    INNER JOIN TD_HOP_DONG_TD hd WITH (NOLOCK) ON ku.SoHDTD_Goc = hd.SoHDTD
    LEFT JOIN DC_LOAI_VAY lv WITH (NOLOCK) ON ku.MaLoaiVay = lv.MaLoaiVay
    WHERE ku.DuNo > 0 AND ku.TrangThai = 'A'
    ORDER BY ku.SoHDTD ASC;
    """
    logger.info("Đang thực thi SQL truy vấn dữ liệu Khế ước & Dư nợ Tín dụng (TD_KHE_UOC)...")
    df = pd.read_sql_query(query, sql_conn)
    return df

# --- 6. GHI DỮ LIỆU HÀNG LOẠT VÀO GOOGLE SHEETS ---
def sync_dataframe_to_sheet(sheet, df, start_row=2):
    """
    Xóa dữ liệu cũ từ start_row và nạp toàn bộ DataFrame vào Google Sheet bằng 1 lệnh duy nhất.
    """
    if df.empty:
        logger.warning(f"DataFrame rỗng, không có dữ liệu để ghi vào sheet {sheet.title}.")
        return 0

    values = df.fillna("").values.tolist()
    num_rows = len(values)
    num_cols = len(df.columns)

    # Xóa dữ liệu cũ từ hàng 2
    max_rows = sheet.row_count
    if max_rows >= start_row:
        clear_range = f"A{start_row}:{gspread.utils.rowcol_to_a1(max_rows, num_cols)}"
        sheet.batch_clear([clear_range])

    # Ghi dữ liệu mới
    end_col_letter = gspread.utils.rowcol_to_a1(1, num_cols).replace("1", "")
    target_range = f"A{start_row}:{end_col_letter}{start_row + num_rows - 1}"
    
    # Kiểm tra kích thước sheet, mở rộng nếu thiếu
    if sheet.row_count < (start_row + num_rows):
        sheet.add_rows(start_row + num_rows - sheet.row_count + 50)

    sheet.update(range_name=target_range, values=values, value_input_option="USER_ENTERED")
    logger.info(f"Đã cập nhật {num_rows} dòng vào sheet '{sheet.title}'.")
    return num_rows

# --- 7. QUY TRÌNH XỬ LÝ LỆNH ĐỒNG BỘ (SYNC PIPELINE) ---
def process_sync_request(spreadsheet, sql_cfg):
    start_time = datetime.now()
    setting_sheet = spreadsheet.worksheet("SETTING")
    
    # Cập nhật trạng thái SETTING -> PROCESSING
    setting_sheet.update(
        range_name="B2:D2",
        values=[["PROCESSING", datetime.now().strftime("%d/%m/%Y %H:%M:%S"), start_time.strftime("%d/%m/%Y %H:%M:%S")]],
        value_input_option="USER_ENTERED"
    )
    logger.info(">>> Đã nhận lệnh SYNC_DATA. Bắt đầu tiến trình đồng bộ dữ liệu từ SQL Server Core...")

    try:
        # Kết nối SQL Server
        with get_sql_connection(sql_cfg) as sql_conn:
            # 1. Truy vấn và đồng bộ Khách hàng
            df_kh = fetch_customer_core_data(sql_conn)
            kh_sheet = spreadsheet.worksheet("KH_CORE")
            rows_kh = sync_dataframe_to_sheet(kh_sheet, df_kh, start_row=2)

            # 2. Truy vấn và đồng bộ Khế ước / Hợp đồng tín dụng
            df_hdtd = fetch_loan_contract_core_data(sql_conn)
            hdtd_sheet = spreadsheet.worksheet("HDTD_CORE")
            rows_hdtd = sync_dataframe_to_sheet(hdtd_sheet, df_hdtd, start_row=2)

        finish_time = datetime.now()
        total_rows = rows_kh + rows_hdtd
        elapsed = (finish_time - start_time).total_seconds()
        message = f"Đồng bộ thành công {rows_kh} KH và {rows_hdtd} HĐTD trong {elapsed:.1f} giây."

        # Cập nhật trạng thái SETTING -> SUCCESS
        setting_sheet.update(
            range_name="A2:G2",
            values=[[
                "IDLE",
                "SUCCESS",
                start_time.strftime("%d/%m/%Y %H:%M:%S"),
                start_time.strftime("%d/%m/%Y %H:%M:%S"),
                finish_time.strftime("%d/%m/%Y %H:%M:%S"),
                total_rows,
                message
            ]],
            value_input_option="USER_ENTERED"
        )
        logger.info(f"=== {message} ===")

    except Exception as e:
        finish_time = datetime.now()
        err_msg = f"Lỗi đồng bộ: {str(e)}"
        logger.error(err_msg, exc_info=True)
        setting_sheet.update(
            range_name="A2:G2",
            values=[[
                "IDLE",
                "ERROR",
                start_time.strftime("%d/%m/%Y %H:%M:%S"),
                start_time.strftime("%d/%m/%Y %H:%M:%S"),
                finish_time.strftime("%d/%m/%Y %H:%M:%S"),
                0,
                err_msg[:250]
            ]],
            value_input_option="USER_ENTERED"
        )

# --- 8. VÒNG LẶP DAEMON CHÍNH (MAIN EVENT LOOP) ---
def run_daemon():
    config = load_config()
    poll_interval = config.get("poll_interval_seconds", 5)
    sheet_id = config["google_sheet_id"]
    cred_file = config["credentials_file"]
    sql_cfg = config["sql_server"]

    logger.info("==========================================================")
    logger.info("🚀 KHỞI ĐỘNG CREDIT CORE PYTHON LOCAL SYNC DAEMON")
    logger.info(f"Google Sheet ID: {sheet_id}")
    logger.info(f"SQL Server Host: {sql_cfg['server']} | DB: {sql_cfg['database']}")
    logger.info(f"Chu kỳ kiểm tra: {poll_interval} giây/lần")
    logger.info("==========================================================")

    gc = get_gspread_client(cred_file)
    spreadsheet = gc.open_by_key(sheet_id)

    while True:
        try:
            setting_sheet = spreadsheet.worksheet("SETTING")
            row2 = setting_sheet.row_values(2)

            command = row2[0].strip() if len(row2) > 0 else "IDLE"
            status = row2[1].strip() if len(row2) > 1 else "IDLE"

            if command == "SYNC_DATA" and status in ["PENDING", "REQUESTED"]:
                logger.info(f"Phát hiện yêu cầu lệnh: COMMAND='{command}', STATUS='{status}'")
                process_sync_request(spreadsheet, sql_cfg)

        except gspread.exceptions.APIError as api_err:
            logger.warning(f"Google Sheets API rate limit hoặc lỗi tạm thời: {api_err}. Đang thử lại...")
        except Exception as e:
            logger.error(f"Lỗi trong vòng lặp Daemon: {e}", exc_info=False)

        time.sleep(poll_interval)

if __name__ == "__main__":
    run_daemon()
