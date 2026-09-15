# HƯỚNG DẪN TOÀN DIỆN VẬN HÀNH PYTHON DAEMON & ĐẨY DỮ LIỆU LÊN GOOGLE SHEETS
# Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ) - Dự án CreditCores

Tài liệu này hướng dẫn chi tiết từ A đến Z cách thiết lập, cấu hình và vận hành tiến trình Python để đẩy dữ liệu tín dụng, khách hàng từ **Máy chủ SQL Server CoreBanking (hoặc dữ liệu mẫu/Excel)** lên **Google Sheets** một cách tự động, bảo mật và an toàn tuyệt đối.

---

## 🏛️ 1. Mô Hình Kiến Trúc & Luồng Đẩy Dữ Liệu

```
┌─────────────────────────────────────────────────────────────┐
│             MÁY CHỦ NỘI BỘ (WINDOWS SERVER 2025)            │
│                                                             │
│   ┌──────────────────────┐        ┌──────────────────────┐  │
│   │ SQL Server 2019/2022 │        │  Python Sync Daemon  │  │
│   │ (CORE_BANKING_YENTHO)│ ──ODBC─│  (sync_daemon.py)    │  │
│   │ [Port 1433 ĐÓNG MẠNG]│        │  * Tự nhận diện ODBC │  │
│   └──────────────────────┘        │  * Anti-Formula Inj  │  │
│                                   │  * UTF-8 Terminal    │  │
│                                   └──────────┬───────────┘  │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                                      TLS 1.3  │ HTTPS Outbound
                                (Google Service Account)
                                               │
                                               ▼
                         ┌───────────────────────────────────────────┐
                         │      GOOGLE WORKSPACE CLOUD DATABASE      │
                         │                                           │
                         │   Spreadsheet: CreditCores CSDL 12 Bảng   │
                         │   ID: 1xZtr6fQJDHwKugIqebV9po00cNSpqh5... │
                         │                                           │
                         │   • SETTING    : Hàng đợi lệnh đồng bộ    │
                         │   • KH_CORE    : 800+ KH & Cổ phần, CASA  │
                         │   • HDTD_CORE  : Hợp đồng vay & Dư nợ     │
                         │   • TSBD_CORE  : Kho Tài sản bảo đảm      │
                         └─────────────────────┬─────────────────────┘
                                               │
                                         Google Apps Script
                                         REST API Engine
                                               │
                                               ▼
                                  Frontend React WebApp (Vercel)
                                  https://qtdyentho-credit.vercel.app
```

---

## 🔑 2. Hướng Dẫn Chi Tiết: Tạo Google Service Account & Lấy `credentials.json`

Để Python có quyền ghi dữ liệu lên Google Sheets của cơ quan mà không cần đăng nhập tài khoản cá nhân mỗi lần chạy:

### Bước 2.1: Tạo Project trên Google Cloud Console
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/) bằng tài khoản Google quản trị của Quỹ (hoặc Gmail cá nhân phụ trách).
2. Nhấn vào mục chọn dự án ở góc trên bên trái $	o$ Chọn **New Project (Dự án mới)**.
3. Đặt tên dự án: `CreditCores-QtdYenTho` $	o$ Nhấn **Create (Tạo)**.

### Bước 2.2: Kích hoạt Google Sheets API & Google Drive API
1. Tại thanh tìm kiếm trên cùng của Google Cloud Console, gõ **Google Sheets API** $	o$ Chọn kết quả $	o$ Nhấn nút **Enable (Bật)**.
2. Tiếp tục tìm kiếm **Google Drive API** $	o$ Chọn kết quả $	o$ Nhấn nút **Enable (Bật)**.

### Bước 2.3: Tạo Service Account (Tài khoản dịch vụ)
1. Vào mục menu bên trái $	o$ **APIs & Services (API & Dịch vụ)** $	o$ **Credentials (Thông tin xác thực)**.
2. Nhấn **+ Create Credentials (+ Tạo thông tin xác thực)** $	o$ Chọn **Service Account**.
3. Điền thông tin:
   - **Service account name**: `creditcore-daemon`
   - **Service account ID**: `creditcore-daemon` (hệ thống tự tạo email dạng `creditcore-daemon@creditcores-yentho.iam.gserviceaccount.com`).
   - Nhấn **Create and Continue (Tạo và tiếp tục)** $	o$ Mục Role chọn **Editor** (hoặc để trống) $	o$ Nhấn **Done (Hoàn tất)**.

### Bước 2.4: Tải tệp khóa bí mật `credentials.json`
1. Tại danh sách Service Accounts vừa tạo, nhấn vào email của tài khoản vừa tạo.
2. Chuyển sang tab **Keys (Khóa)** $	o$ Nhấn **Add Key (Thêm khóa)** $	o$ **Create new key (Tạo khóa mới)**.
3. Chọn loại khóa: **JSON** $	o$ Nhấn **Create (Tạo)**.
4. Trình duyệt sẽ tải về một file `.json`.
5. Đổi tên file này thành **`credentials.json`** và copy tệp này vào thư mục:
   `d:\Antigravity Projects\CreditCores\python_daemon\credentials.json`

### Bước 2.5: Chia sẻ Google Sheet cho Email Service Account (BẮT BUỘC)
1. Mở tệp `credentials.json` bằng Notepad, tìm dòng `"client_email"` (ví dụ: `creditcore-daemon@creditcores-yentho.iam.gserviceaccount.com`) và copy địa chỉ email này.
2. Mở Google Sheet CSDL CreditCores trên trình duyệt:
   [https://docs.google.com/spreadsheets/d/1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw/edit](https://docs.google.com/spreadsheets/d/1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw/edit)
3. Nhấn nút **Chia sẻ (Share)** ở góc trên bên phải.
4. Dán địa chỉ email Service Account vào ô mời $	o$ Chọn quyền: **Người chỉnh sửa (Editor)** $	o$ Bỏ tick ô "Thông báo cho người dùng" $	o$ Nhấn **Chia sẻ (Share)**.

---

## ⚙️ 3. Cài Đặt Môi Trường Python & Thư Viện Trên Windows

Mở PowerShell tại máy chủ:
```powershell
cd "d:\Antigravity Projects\CreditCores\python_daemon"

# 1. Cài đặt các thư viện phụ thuộc
pip install -r requirements.txt
```
Các thư viện gồm:
- `gspread>=6.2.1`: Giao tiếp Google Sheets API v4 tốc độ cao qua batch update.
- `google-auth>=2.27.0`: Xác thực mã hóa khóa Service Account.
- `pyodbc>=5.3.0`: Kết nối native ODBC tới SQL Server trên Windows Server 2025.
- `pandas>=2.1.0`: Xử lý bảng dữ liệu, reindex và lọc DataFrame.
- `python-dotenv`: Nạp biến môi trường.

---

## 📝 4. Cấu Hình Tệp `config.json`

Tạo file `config.json` tại thư mục `python_daemon` (sao chép từ `config.example.json`):
```powershell
copy config.example.json config.json
```

Nội dung tệp `config.json`:
```json
{
  "google_sheet_id": "1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw",
  "credentials_file": "credentials.json",
  "poll_interval_seconds": 5,
  "sql_server": {
    "driver": "auto",
    "server": "localhost\\SQLEXPRESS",
    "database": "CORE_BANKING_YENTHO",
    "use_windows_auth": false,
    "username": "sa",
    "password": "YourSecurePassword@2026",
    "trust_server_certificate": "yes"
  }
}
```

> **Ghi chú về Driver SQL Server**:
> Script tự động nhận diện driver tốt nhất (`ODBC Driver 18 for SQL Server`, `ODBC Driver 17`, hoặc `SQL Server`).
> Với `ODBC Driver 18`, script tự động thêm cờ `TrustServerCertificate=yes` và `Encrypt=Optional` để kết nối mượt mà nội bộ.
> Nếu SQL Server dùng Windows Authentication, đặt `"use_windows_auth": true` (không cần username/password).

---

## 🚀 5. Các Chế Độ Vận Hành & Đẩy Dữ Liệu (Đầy Đủ Lệnh)

### Chế độ 1: Kiểm tra kết nối hệ thống (Diagnostics)
Kiểm tra xem Google Sheets API và SQL Server có kết nối thành công hay không:
```powershell
python sync_daemon.py --test-connection
```

### Chế độ 2: Tự động khởi tạo chuẩn hóa 12 Sheet (Self-Healing Schema)
Tự động tạo mới các Sheet còn thiếu, định dạng màu sắc tiêu đề và cấu trúc cột theo đúng nghiệp vụ tín dụng:
```powershell
python sync_daemon.py --init-schema
```

### Chế độ 3: Đẩy dữ liệu mẫu nghiệp vụ QTDND Yên Thọ lên Google Sheets ngay lập tức (Mock Mode)
Dùng để kiểm thử kết nối Google Sheets và WebApp ngay cả khi chưa nối vào máy chủ SQL Server:
```powershell
python sync_daemon.py --mock
```
*Lệnh này sẽ tạo các khách hàng chuẩn (Nguyễn Văn An, Lê Thị Bích, Trần Văn Cường...), hợp đồng vay và đẩy lên Google Sheets trong 2-3 giây.*

### Chế độ 4: Đồng bộ trực tiếp từ SQL Server CoreBanking tức thì (On-Demand Mode)
Truy vấn SQL Server cục bộ và đẩy ngay lập tức lên Google Sheets mà không cần WebApp gửi lệnh:
```powershell
python sync_daemon.py --now
```

### Chế độ 5: Khởi chạy Daemon 24/7 lắng nghe lệnh từ WebApp (Daemon Mode)
Tiến trình chạy nền liên tục kiểm tra sheet `SETTING` mỗi 5 giây. Khi cán bộ nhấn nút **"Gửi Lệnh SYNC_DATA Ngay"** trên giao diện WebApp, Python sẽ tự động kéo dữ liệu và đẩy lên trong 3-5 giây:
```powershell
python sync_daemon.py
```

---

## 🛡️ 6. Thiết Lập Chạy Tự Động 24/7 Trên Windows Server 2025

### Cách 1: Đăng ký Windows Service bằng NSSM (Khuyên Dùng Cho Máy Chủ)
1. Tải công cụ miễn phí **NSSM (Non-Sucking Service Manager)**: [nssm.cc](https://nssm.cc/).
2. Mở PowerShell với quyền **Administrator**:
```powershell
# Cài đặt dịch vụ
nssm install CreditCoreSyncDaemon "C:\Users\Administrator\AppData\Local\Programs\Python\Python311\python.exe" "d:\Antigravity Projects\CreditCores\python_daemon\sync_daemon.py"

# Đặt thư mục làm việc
nssm set CreditCoreSyncDaemon AppDirectory "d:\Antigravity Projects\CreditCores\python_daemon"

# Khởi động dịch vụ
nssm start CreditCoreSyncDaemon
```
*Dịch vụ sẽ tự động khởi động cùng Windows Server, tự phục hồi khi có sự cố mạng và ghi log đầy đủ vào `sync_daemon.log`.*

### Cách 2: Lập lịch Windows Task Scheduler (Chạy định kỳ mỗi 15 hoặc 30 phút)
```powershell
schtasks /create /tn "CreditCore_AutoSync" /tr "python "d:\Antigravity Projects\CreditCores\python_daemon\sync_daemon.py" --now" /sc minute /mo 30 /ru SYSTEM
```

---

## 📊 7. Đối Soát & Kiểm Tra Kết Quả

1. **Trên Google Sheets**:
   - Sheet `KH_CORE`: Kiểm tra danh sách khách hàng, số tài khoản CASA, số thẻ thành viên và cột `NgayCapNhat`.
   - Sheet `HDTD_CORE`: Kiểm tra các khế ước nhận nợ, số tiền vay, dư nợ hiện tại, lãi suất, cán bộ tín dụng phụ trách và trạng thái (`DANG_VAY` hoặc `DA_TAT_TOAN`).
   - Sheet `SETTING`: Cột `STATUS` sẽ hiển thị `SUCCESS`, `FINISH_TIME` ghi nhận thời gian hoàn tất, `TOTAL_ROWS` đếm tổng số bản ghi đã đẩy.
2. **Trên WebApp React (Vercel)**:
   - Vào phân hệ **Cấu hình & Đồng bộ Core** $	o$ Nhấn **Kiểm Tra Trạng Thái** để thấy báo cáo đồng bộ mới nhất.
   - Dữ liệu khách hàng và hợp đồng tín dụng sẽ tự động sẵn sàng trong toàn bộ 10 phân hệ nghiệp vụ của hệ thống CreditCores!
