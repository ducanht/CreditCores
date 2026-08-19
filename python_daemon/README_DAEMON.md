# HƯỚNG DẪN TRIỂN KHAI LOCAL PYTHON DAEMON TRÊN MÁY CHỦ SQL SERVER (WINDOWS SERVER 2025)

Tài liệu này hướng dẫn chi tiết cách thiết lập tiến trình Python chạy nền an toàn ngay tại **Máy chủ SQL Server nội bộ (Windows Server 2025)** để đồng bộ dữ liệu lên Google Sheets khi có chỉ thị từ WebApp.

---

## 🔒 1. Nguyên Tắc An Toàn & Bảo Mật Dữ Liệu Tín Dụng

1. **Không mở cổng SQL Server ra Internet**: Toàn bộ kết nối SQL Server được thực hiện nội bộ cục bộ (`localhost` hoặc dải IP nội bộ LAN `192.168.x.x`). Cổng 1433 của SQL Server hoàn toàn đóng với mạng bên ngoài.
2. **Kênh đẩy dữ liệu một chiều TLS 1.3**: Python Daemon chủ động thiết lập kết nối ra ngoài qua giao thức bảo mật HTTPS/gRPC tới Google Sheets API bằng tệp khóa `credentials.json` của Service Account.
3. **Đóng dấu thời gian (Timestamp) chống sai lệch**: Mỗi dòng dữ liệu Khách hàng (`KH_CORE`) và Hợp đồng (`HDTD_CORE`) khi đẩy lên đều được tự động đóng nhãn `NgayCapNhat` (ví dụ: `19/08/2026 09:15:30`) để cán bộ biết chính xác độ mới của số liệu.

---

## ⚙️ 2. Chuẩn Bị & Cài Đặt Môi Trường Trên Windows Server 2025

### Bước 1: Cài đặt Python 3.10+
- Tải bản cài đặt Python chính thức: [python.org/downloads](https://www.python.org/downloads/).
- Khi cài đặt, **bắt buộc tick chọn** ô `"Add Python to PATH"`.

### Bước 2: Cài đặt Driver ODBC SQL Server
- Cài đặt: [Microsoft ODBC Driver 17 for SQL Server (x64)](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server).

### Bước 3: Cài đặt các thư viện phụ thuộc
Mở PowerShell tại thư mục `python_daemon`:
```powershell
cd "d:\Antigravity Projects\CreditCores\python_daemon"
pip install -r requirements.txt
```

---

## 🔑 3. Thiết Lập Google Service Account & Cấu Hình `config.json`

1. Đặt tệp JSON khóa của Service Account vào thư mục `python_daemon` với tên **`credentials.json`**.
2. Mở Google Sheet CSDL trên trình duyệt $\to$ Nhấn **Share (Chia sẻ)** $\to$ Thêm email Service Account với quyền **Editor (Người chỉnh sửa)**.
3. Tạo file `config.json` từ mẫu:
```powershell
copy config.example.json config.json
```
Nội dung file `config.json`:
```json
{
  "google_sheet_id": "1E2zPUuYHkhXMDS5ZM7jxI-FY4JrD17O66ruN5uK15U0",
  "credentials_file": "credentials.json",
  "poll_interval_seconds": 5,
  "sql_server": {
    "driver": "ODBC Driver 17 for SQL Server",
    "server": "localhost\\SQLEXPRESS",
    "database": "CORE_BANKING_YENTHO",
    "use_windows_auth": false,
    "username": "sa",
    "password": "YourPassword@2026",
    "trust_server_certificate": "yes"
  }
}
```
*(Nếu sử dụng Windows Authentication, đặt `"use_windows_auth": true` và không cần nhập user/password).*

---

## 🚀 4. Vận Hành & Khởi Chạy Daemon

### Cách 1: Chạy thử nghiệm trực tiếp (Console Mode)
```powershell
python sync_daemon.py
```
*(Tiến trình sẽ liên tục lắng nghe hàng đợi mỗi 5 giây. Khi WebApp bấm Đồng bộ, dữ liệu sẽ được kéo và đẩy lên trong 3-5 giây).*

### Cách 2: Chạy tức thì 1 lần (Manual / Task Scheduler Mode)
```powershell
python sync_daemon.py --now
```

### Cách 3: Đăng ký Windows Service chạy ngầm 24/7 (Khuyên Dùng)
Sử dụng công cụ **NSSM (Non-Sucking Service Manager)**:
1. Mở PowerShell với quyền **Administrator**:
```powershell
# Đăng ký dịch vụ
nssm install CreditCoreSyncDaemon "C:\Users\Administrator\AppData\Local\Programs\Python\Python310\python.exe" "d:\Antigravity Projects\CreditCores\python_daemon\sync_daemon.py"

# Đặt thư mục làm việc
nssm set CreditCoreSyncDaemon AppDirectory "d:\Antigravity Projects\CreditCores\python_daemon"

# Khởi động dịch vụ
nssm start CreditCoreSyncDaemon
```
Dịch vụ sẽ tự động khởi động cùng Windows Server 2025, tự phục hồi khi có lỗi mạng và ghi log đầy đủ vào `sync_daemon.log`.
