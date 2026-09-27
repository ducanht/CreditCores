# ⚙️ ĐẶC TẢ PHÂN HỆ CẤU HÌNH & ĐỒNG BỘ CORE (SETTINGS & CORE SYNC)
# Python Daemon 24/7, SQL Server CoreBanking & Self-Healing Schema — QTDND Yên Thọ

---

## 1. MỤC TIÊU VÀ PHẠM VI NGHIỆP VỤ

Phân hệ **Settings & Core Sync** là cầu nối hạ tầng dữ liệu giữa hệ thống phần mềm CoreBanking ngân hàng truyền thống (chạy trên Microsoft SQL Server tại phòng máy chủ QTDND Yên Thọ) và nền tảng WebApp điều hành trực tuyến:
- **Giám sát trạng thái Python Daemon 24/7**: Kiểm tra trạng thái "nhịp tim" (Heartbeat / Ping), thời điểm đồng bộ gần nhất, số dòng dữ liệu đã đẩy lên Google Sheets và cảnh báo khi mất kết nối mạng.
- **Kích hoạt đồng bộ thủ công tức thì (Manual Trigger Sync)**: Khi có giao dịch giải ngân lớn hoặc trả nợ đột xuất trong ngày, cán bộ có thể bấm nút kích hoạt để Daemon quét và đồng bộ số liệu mới nhất ngay lập tức mà không cần đợi đến chu kỳ tự động.
- **Cơ chế Tự Chữa Lành Lược Đồ (Self-Healing Schema)**: Backend Google Apps Script tự động rà soát, tạo bảng hoặc bổ sung các cột dữ liệu mới mà bảo toàn 100% dữ liệu cũ (Zero-data-loss).
- **Quản lý Cache & Xóa Bộ Nhớ Đệm**: Cho phép giải phóng cache RAM Client và Google Apps Script CacheService để đảm bảo dữ liệu hiển thị luôn khớp với số liệu kế toán thời gian thực.

---

## 2. KIẾN TRÚC ĐỒNG BỘ DỮ LIỆU ĐA TẦNG (MULTI-TIER SYNC ARCHITECTURE)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CORE SYNC ARCHITECTURE & PIPELINE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. MÁY CHỦ NỘI BỘ (ON-PREMISE SERVER):                                      │
│    - Microsoft SQL Server chứa CSDL CoreBanking (Khách hàng, Tiền gửi, Vay)  │
│    - Python 3.10+ Daemon (`sync_daemon.py`) chạy ngầm dạng Service 24/7     │
│    - Truy vấn SQL thông qua thư viện `pyodbc` chuẩn                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. CƠ CHẾ BẢO TOÀN DỮ LIỆU TRÊN GOOGLE SHEETS:                             │
│    - Python Daemon đọc `existing_map` trước khi ghi đè dữ liệu              │
│    - Bảo toàn 100% cột phân công cán bộ: `CBTD_PhuTrach` và `Ten_CBTD`      │
│    - Bảo toàn hồ sơ tất toán: Không xóa HĐTD khi dư nợ = 0 mà cập nhật      │
│      `DuNo = 0`, `TrangThaiHD = 'DA_TAT_TOAN'`, `NgayTatToan = Ngày chốt`   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. TRÌNH QUẢN LÝ WEBAPP & ĐIỀU KHIỂN:                                       │
│    - Nút "Kích hoạt đồng bộ SQL Core" trên TopHeader và trang Settings      │
│    - Hiển thị badge trạng thái kết nối: Xanh (Đã đồng bộ) / Vàng (Đang chạy)│
│    - Tự động xóa bộ nhớ đệm SWR Cache và cập nhật KPIs Dashboard            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. CÁC THAM SỐ CẤU HÌNH HỆ THỐNG CỐT LÕI

| Tham Số | Ý Nghĩa Nghiệp Vụ | Giá Trị Mặc Định | Cơ Chế Tác Động |
| :--- | :--- | :---: | :--- |
| `CYCLE_1_DEBIT_DAY` | Ngày trích nợ đợt 1 | Ngày 05 | Áp dụng cho các khoản vay giải ngân từ 26 đến 04 |
| `CYCLE_2_DEBIT_DAY` | Ngày trích nợ đợt 2 | Ngày 15 | Áp dụng cho các khoản vay giải ngân từ 05 đến 15 |
| `CYCLE_3_DEBIT_DAY` | Ngày trích nợ đợt 3 | Ngày 25 | Áp dụng cho các khoản vay giải ngân từ 16 đến 25 |
| `YEAR_BASE_DAYS` | Mẫu số ngày tính lãi năm | 365 ngày | Chuẩn Thông tư 14/2017/TT-NHNN ($36500$) |
| `SCRIPT_LOCK_TIMEOUT`| Thời gian chờ khóa giao dịch | 15 giây | Ngăn ngừa xung đột race-condition ghi đồng thời |
| `CLIENT_CACHE_TTL` | Thời gian sống của RAM Cache | 60 giây | Tối ưu tốc độ mở tab < 1ms, hỗ trợ bấm Tải lại |
