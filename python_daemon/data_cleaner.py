"""
========================================================================================
HỆ THỐNG QUẢN LÝ TÍN DỤNG & TRÍCH NỢ AUTOMATION - CREDITCORES (QTDND YÊN THỌ)
File: data_cleaner.py
Mục đích: Module chuyên trách xử lý, làm sạch và chuẩn hóa dữ liệu trích xuất từ SQL Server
          đảm bảo 100% đúng định dạng Google Sheets trước khi ghi.

CÁC QUY TẮC CHUẨN HÓA BẮT BUỘC:
1. Số 0 ở đầu (CCCD, Mã KH, SĐT, Số TV, Số TK): Luôn bọc tiền tố ' để chống nuốt số 0 và
   ngăn Google Sheets tự động chuyển sang số khoa học (scientific notation).
2. Ngày tháng: Chuyển đổi mọi định dạng từ SQL Server (datetime, date, ISO, YYYYMMDD)
   sang chuẩn ngày Việt Nam dd/mm/yyyy (GMT+7). Giá trị NULL -> "".
3. Tiền tệ VNĐ: Ép kiểu số nguyên không phần thập phân (.00), NULL -> 0.
4. Lãi suất / Tỷ lệ: Làm tròn 2 chữ số thập phân, NULL -> 0.0.
5. Bảo vệ Formula Injection (CWE-1236): Thêm dấu ' ở đầu nếu chuỗi bắt đầu bằng =, +, -, @.
6. Địa chỉ & Khu vực: Làm sạch khoảng trắng thừa, xóa dấu phẩy lặp.
7. Địa bàn Thôn, Xã: Tự động phân tách chính xác theo địa bàn thực tế.
========================================================================================
"""

import re
from datetime import datetime, date
from decimal import Decimal

# Danh sách tiền tố các đơn vị hành chính xã/thị trấn
REGEX_XA = re.compile(r"(xã|thị trấn|phường|tt\.)\s+([^,]+)", re.IGNORECASE)
REGEX_THON = re.compile(r"(thôn|bản|khu phố|phố|kp|tổ|tiểu khu|làng|xóm|đội)\s+([^,]+)", re.IGNORECASE)

# Từ điển các địa bàn trọng điểm của Quỹ Tín Dụng Yên Thọ & lân cận
COMMUNE_MAP = [
    ("yên thọ", "Xã Yên Thọ"),
    ("yen tho", "Xã Yên Thọ"),
    ("quý lộc", "Xã Quý Lộc"),
    ("quy loc", "Xã Quý Lộc"),
    ("yên trường", "Xã Yên Trường"),
    ("yen truong", "Xã Yên Trường"),
    ("yên bái", "Xã Yên Bái"),
    ("yen bai", "Xã Yên Bái"),
    ("yên lâm", "Xã Yên Lâm"),
    ("yen lam", "Xã Yên Lâm"),
    ("yên phú", "Xã Yên Phú"),
    ("yen phu", "Xã Yên Phú"),
    ("định tân", "Xã Định Tân"),
    ("dinh tan", "Xã Định Tân"),
    ("vĩnh lộc", "Xã Vĩnh Lộc"),
    ("vinh loc", "Xã Vĩnh Lộc"),
]

def clean_number_code(val):
    """
    Bảo toàn số 0 ở đầu cho CCCD, SĐT, Số TV, Số TK CASA, Mã KH khi ghi vào Google Sheets.
    Ví dụ:
      - 038163029501 -> '038163029501
      - 0002 -> '0002
      - 0100002 -> '0100002
      - "0912345678" -> '0912345678
      - "123456" -> "123456"
    """
    if val is None or val == "":
        return ""
    s = str(val).strip()
    if s.startswith("'"):
        return s
    # Nếu là chuỗi số có số 0 ở đầu
    if s.isdigit() and s.startswith("0") and len(s) > 1:
        return "'" + s
    # Nếu là mã KH dạng 0002 hoặc CCCD có thể có ký tự đặc biệt
    if s.startswith("0") and len(s) > 1:
        return "'" + s
    return s

def clean_date(val):
    """
    Chuyển đổi mọi kiểu dữ liệu ngày tháng từ SQL Server sang chuẩn Việt Nam dd/MM/yyyy.
    Hỗ trợ:
      - datetime.date / datetime.datetime
      - '2026-08-17' (ISO) -> '17/08/2026'
      - '20260817' (YYYYMMDD) -> '17/08/2026'
      - '17/08/2026' (đã chuẩn) -> '17/08/2026'
      - '17/8/2026' -> '17/08/2026'
      - None / NULL / "" -> ""
    """
    if val is None or val == "":
        return ""

    if isinstance(val, (datetime, date)):
        return val.strftime("%d/%m/%Y")

    s = str(val).strip()
    if not s or s.lower() in ("null", "none"):
        return ""

    # 1. Đã là dạng dd/MM/yyyy hoặc d/M/yyyy
    if re.match(r"^\d{1,2}/\d{1,2}/\d{4}$", s):
        parts = s.split("/")
        return f"{int(parts[0]):02d}/{int(parts[1]):02d}/{parts[2]}"

    # 2. Dạng ISO YYYY-MM-DD hoặc YYYY-MM-DD HH:MM:SS
    if re.match(r"^\d{4}-\d{1,2}-\d{1,2}", s):
        date_part = s.split(" ")[0]
        parts = date_part.split("-")
        return f"{int(parts[2]):02d}/{int(parts[1]):02d}/{parts[0]}"

    # 3. Chuỗi số 8 ký tự YYYYMMDD
    clean_digits = re.sub(r"\D", "", s)
    if len(clean_digits) == 8:
        if clean_digits.startswith("19") or clean_digits.startswith("20"):
            return f"{clean_digits[6:8]}/{clean_digits[4:6]}/{clean_digits[0:4]}"
        else:
            return f"{clean_digits[0:2]}/{clean_digits[2:4]}/{clean_digits[4:8]}"

    return s

def clean_currency(val):
    """
    Chuẩn hóa số tiền VNĐ.
    - Ép kiểu về số nguyên int không có phần thập phân .00.
    - None / NULL / "" -> 0.
    """
    if val is None or val == "":
        return 0
    if isinstance(val, (int, )):
        return val
    if isinstance(val, (float, Decimal)):
        return int(round(float(val)))
    s = str(val).strip().replace(",", "").replace(" ", "")
    try:
        return int(round(float(s)))
    except Exception:
        return 0

def clean_rate(val):
    """
    Chuẩn hóa lãi suất hoặc tỷ lệ %:
    - Làm tròn 2 chữ số thập phân (float).
    - Thay thế dấu phẩy bằng dấu chấm nếu là chuỗi text.
    - None / NULL / "" -> 0.0.
    """
    if val is None or val == "":
        return 0.0
    if isinstance(val, (int, float)):
        return round(float(val), 2)
    s = str(val).strip().replace(",", ".").replace("%", "")
    try:
        return round(float(s), 2)
    except Exception:
        return 0.0

def clean_text(val):
    """
    Chuẩn hóa chuỗi văn bản:
    - Trim khoảng trắng đầu cuối, chuẩn hóa khoảng trắng giữa các từ.
    - Làm sạch dấu phẩy thừa trước dấu câu (ví dụ: 'Tu Mục , Quý Lộc' -> 'Tu Mục, Quý Lộc').
    - Phòng chống Formula Injection (CWE-1236): nếu ký tự đầu là =, +, -, @ thì thêm nháy đơn '.
    """
    if val is None:
        return ""
    s = str(val).strip()
    if not s:
        return ""
    # Làm sạch dấu phẩy thừa
    s = re.sub(r"\s+,", ",", s)
    s = re.sub(r"\s+", " ", s)

    # Chống Formula Injection
    if s and s[0] in ("=", "+", "-", "@"):
        return "'" + s
    return s

def extract_xa_thon(dia_chi, khu_vuc=""):
    """
    Tự động phân tách chính xác Xã và Thôn từ địa chỉ và khu vực.
    Ưu tiên nhận diện động từ địa chỉ thực tế, không bao giờ ép cố định về một xã nào.
    """
    kv_str = str(khu_vuc or "").strip()
    dia_str = str(dia_chi or "").strip()
    combined_text = (dia_str + " " + kv_str).lower()

    xa = ""
    # Kiểm tra theo từ điển địa bàn Quỹ
    for keyword, standardized_name in COMMUNE_MAP:
        if keyword in combined_text:
            xa = standardized_name
            break

    # Nếu không khớp từ điển, dùng Regex để tách Xã / Thị trấn / Phường
    if not xa:
        m_xa = REGEX_XA.search(combined_text)
        if m_xa:
            xa = m_xa.group(0).strip().title()
        elif kv_str and not kv_str.lower().startswith("thôn"):
            xa = kv_str
        else:
            xa = "Địa bàn khác"

    # Tách Thôn
    thon = ""
    m_thon = REGEX_THON.search(dia_str)
    if m_thon:
        thon = m_thon.group(0).strip()
    elif kv_str and kv_str.lower().startswith("thôn"):
        thon = kv_str

    return xa, thon

# Định nghĩa kiểu dữ liệu cho từng cột phổ biến trong CSDL CreditCores
FIELD_TYPE_RULES = {
    # Nhóm mã / ID / Số định danh (cần bảo toàn số 0 ở đầu)
    "makh": "code",
    "sohdtd": "text",
    "makheuoc": "text",
    "cccd": "code",
    "socmnd": "code",
    "dienthoai": "code",
    "dienthoaidd": "code",
    "sotk": "code",
    "sotk_casa": "code",
    "sotk_vay": "code",
    "sotv": "code",
    "sosocp": "text",
    "matokh": "code",
    "matsbd": "code",
    "sogcn": "code",
    "sovawsocapgcn": "code",
    "sodangkygdbd": "code",
    "socongchung": "code",

    # Nhóm ngày tháng
    "ngaycap": "date",
    "ngaysinh": "date",
    "ngayvaotv": "date",
    "ngayvay": "date",
    "denhan": "date",
    "tralaidenngay": "date",
    "ngaytattoan": "date",
    "ngaycapgcn": "date",
    "ngaycongchung": "date",
    "ngaydangkygdbd": "date",
    "ngaykiemtra": "date",
    "ngayktnext": "date",
    "ngaytrich": "date",
    "ngaydulieu": "date",
    "ngaycapnhat": "text",
    "ngaytao": "text",

    # Nhóm tiền tệ VNĐ (số nguyên)
    "tienvay": "currency",
    "duno": "currency",
    "tongtiencp": "currency",
    "tongdunohientai": "currency",
    "giatridinhgiaqtd": "currency",
    "giatrithitruong": "currency",
    "sotiendambaotoida": "currency",
    "tongtienphaithu": "currency",
    "datrich": "currency",
    "conno": "currency",
    "gocton": "currency",
    "laiton": "currency",
    "tongnoton": "currency",
    "dientich": "currency",
    "sothangvay": "currency",
    "soluonghdvay": "currency",

    # Nhóm lãi suất / Tỷ lệ %
    "laisuat": "rate",
    "laisuatduyet": "rate",
    "tylecho vaytoida": "rate",
    "tyleltv": "rate",
    "tyledsr": "rate",
    "tytrongduno": "rate",
}

def clean_record_by_schema(record_dict, schema_headers=None):
    """
    Tự động chuẩn hóa từng trường của bản ghi theo quy tắc CSDL CreditCores.
    Áp dụng triệt để các quy tắc:
      - Mã/ID -> clean_number_code
      - Ngày tháng -> clean_date
      - Tiền tệ -> clean_currency
      - Lãi suất -> clean_rate
      - Chuỗi văn bản -> clean_text
    """
    cleaned = {}
    for key, val in record_dict.items():
        norm_key = key.lower().replace("_", "").replace(" ", "")
        rule = FIELD_TYPE_RULES.get(norm_key, "text")

        if rule == "code":
            cleaned[key] = clean_number_code(val)
        elif rule == "date":
            cleaned[key] = clean_date(val)
        elif rule == "currency":
            cleaned[key] = clean_currency(val)
        elif rule == "rate":
            cleaned[key] = clean_rate(val)
        else:
            cleaned[key] = clean_text(val)

    # Nếu có địa chỉ mà chưa có KvXa hoặc KvThon, tự động tách
    if "DiaChi" in cleaned and (not cleaned.get("KvXa") or not cleaned.get("KvThon")):
        xa, thon = extract_xa_thon(cleaned.get("DiaChi", ""), cleaned.get("KhuVuc", ""))
        if not cleaned.get("KvXa"):
            cleaned["KvXa"] = xa
        if not cleaned.get("KvThon"):
            cleaned["KvThon"] = thon

    return cleaned
