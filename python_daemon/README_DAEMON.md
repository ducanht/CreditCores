# HƯỚNG DẪN TRIỂN KHAI LOCAL PYTHON DAEMON TRÊN MÁY CHỦ SQL SERVER

## 1. Yêu Cầu Môi Trường
- **Hệ điều hành**: Windows Server 2016 / 2019 / 2022 hoặc Windows 10/11 Pro (Chạy trực tiếp trên máy chủ có kết nối mạng tới SQL Server nội bộ).
- **Python**: Python 3.10 trở lên.
- **SQL Server Driver**: Cài đặt [Microsoft ODBC Driver 17 for SQL Server](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server).

---

## 2. Cài Đặt & Cấu Hình

### Bước 1: Cài đặt thư viện Python
Mở PowerShell tại thư mục `python_daemon`:
```powershell
pip install -r requirements.txt
```

### Bước 2: Chuẩn bị Service Account Google Cloud
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo Service Account và tải file key JSON về, đặt tên là `credentials.json` trong thư mục `python_daemon`.
3. Mở Google Sheet CSDL của bạn, nhấn **Share (Chia sẻ)** và thêm email của Service Account (dạng `...@...iam.gserviceaccount.com`) với quyền **Editor**.

### Bước 3: Cấu hình `config.json`
Sao chép từ file mẫu:
```powershell
copy config.example.json config.json
```
Mở `config.json` và điền:
- `google_sheet_id`: ID của Google Sheet CSDL.
- `sql_server`: Địa chỉ IP, Tên Database, Username và Password của SQL Server Core.

---

## 3. Khởi Chạy Daemon

Chạy trực tiếp trong PowerShell:
```powershell
python sync_daemon.py
```

### Thiết lập chạy nền tự động 24/7 bằng NSSM (Non-Sucking Service Manager):
1. Tải [nssm.exe](https://nssm.cc/).
2. Đăng ký dịch vụ Windows:
```powershell
nssm install CreditCoreSyncDaemon "C:\Python310\python.exe" "d:\Antigravity Projects\CreditCores\python_daemon\sync_daemon.py"
nssm set CreditCoreSyncDaemon AppDirectory "d:\Antigravity Projects\CreditCores\python_daemon"
nssm start CreditCoreSyncDaemon
```
Dịch vụ sẽ tự động chạy ngầm, tự khởi động cùng Windows và tự phục hồi khi gặp sự cố mạng.
