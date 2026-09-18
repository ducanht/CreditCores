# 🏛️ KIẾN TRÚC TỔNG THỂ HỆ THỐNG CREDITCORES
# Core Credit & Auto-Debit Automation System (v3.2)
# Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)

Tài liệu này mô tả chi tiết kiến trúc kỹ thuật 3 tầng phân tán (**3-Tier Distributed Resilient Architecture**) của Hệ thống Quản lý Tín dụng & Trích nợ Tự động **CreditCores** phục vụ cho Quỹ Tín Dụng Nhân Dân.

> [!IMPORTANT]
> **Tài Liệu Đặc Tả Chi Tiết & Bài Học Xương Máu**:
> Vui lòng tham chiếu [docs/SPECIFICATIONS_AND_LESSONS_LEARNED.md](file:///d:/Antigravity%20Projects/CreditCores/docs/SPECIFICATIONS_AND_LESSONS_LEARNED.md) để xem chi tiết đặc tả 10 phân hệ nghiệp vụ, sơ đồ CodeGraph toàn diện, danh mục các hàm dùng chung (Shared Catalog) và Bảng 13 bài học xương máu chống tái phạm lỗi.

---

## 🏛️ 1. Sơ Đồ Kiến Trúc Hệ Thống (System Topology)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TẦNG 1: MÁY CHỦ NỘI BỘ (ON-PREMISE CORE BANKING)                            │
│                                                                             │
│   ┌─────────────────────┐                 ┌─────────────────────────────┐   │
│   │   SQL SERVER CORE   │ ◄──(pyodbc)──── │   PYTHON DAEMON 24/7        │   │
│   │   [NG-eFUND]        │                 │   (sync_daemon.py - Pure)   │   │
│   └─────────────────────┘                 └──────────────┬──────────────┘   │
└──────────────────────────────────────────────────────────┼──────────────────┘
                                                           │
                                             (gspread REST API / Polling 5s)
                                                           │
┌──────────────────────────────────────────────────────────▼──────────────────┐
│ TẦNG 2: GOOGLE WORKSPACE CLOUD BACKEND & STAGING DATABASE                   │
│                                                                             │
│   ┌─────────────────────────────────┐   ┌───────────────────────────────┐   │
│   │   GOOGLE SHEETS CSDL            │   │   GOOGLE APPS SCRIPT API      │   │
│   │   (14 Bảng chuẩn hóa)           │ ◄─┤   (Code.gs - REST Engine)     │   │
│   │   • ROLES, USERS, SETTING       │   │   • LockService (Chống Race)  │   │
│   │   • KH_CORE, HDTD_CORE...       │   │   • Auth & RBAC 360 Engine    │   │
│   │   • DOT_TRICH_NO, THAM_DINH...  │   │   • Schema Auto-Migration    │   │
│   │   • TSBD_CORE, CAU_HINH_BIEU_MAU│   │   • DateUtils Actual Days     │   │
│   │   • DOCUMENT_STORAGE            │   │   • In-Memory Cache (SWR)     │   │
│   └─────────────────────────────────┘   └───────────────▲───────────────┘   │
└─────────────────────────────────────────────────────────┼───────────────────┘
                                                          │
                                            (HTTPS REST API / JSON CORS)
                                                          │
┌─────────────────────────────────────────────────────────┴───────────────────┐
│ TẦNG 3: FRONTEND SINGLE PAGE APPLICATION (VERCEL HOSTING)                   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │   REACT 18 + VITE 5 MODERN RESPONSIVE SPA                           │   │
│   │   • URL: https://qtdyentho-credit.vercel.app                        │   │
│   │   • 100% Live Google Sheets API (Zero Mock Policy)                  │   │
│   │   • High-Speed SWR In-Memory Caching & Circuit Breaker              │   │
│   │   • 10 Phân hệ Nghiệp vụ Tín dụng & Quản trị Báo cáo Đa chiều      │   │
│   │   • Engine Tính Lãi Ngày Thực Tế Chuẩn TT 14/2017/TT-NHNN           │   │
│   │   • Responsive Modal & Touch-Optimized Layout Toàn Diện             │   │
│   │   • Mail Merge Template Engine Kết Nối Google Docs / Word           │   │
│   │   • Client-side SHA-256 Web Crypto Hashing                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ 2. Chi Tiết 3 Tầng Kiến Trúc

### Tầng 1: Local Python Daemon (Máy chủ SQL Server CoreBanking)
- **Vị trí**: Chạy thường trực 24/7 dưới dạng Windows Service hoặc background process trên máy chủ cài đặt SQL Server CoreBanking `[NG-eFUND]`.
- **Kiến trúc Pure Python siêu nhẹ**: Loại bỏ hoàn toàn Pandas/Numpy cồng kềnh, chỉ sử dụng `pyodbc` + `gspread` nguyên bản, tiêu thụ RAM < 30 MB, tương thích mọi phiên bản Windows Server cũ.
- **Nhiệm vụ cốt lõi**:
  1. Polling hàng đợi tại bảng `SETTING` mỗi 5 giây (`COMMAND='SYNC_DATA'` và `STATUS='PENDING'`).
  2. Kết nối SQL Server `[NG-eFUND]` qua driver `pyodbc` nội bộ với tốc độ cao.
  3. Thực thi query tích hợp thông tin Khách hàng (`DC_KHACH_HANG`), Số tài khoản CASA (`KT_TAI_KHOAN`), Thành viên góp vốn và Khế ước dư nợ còn hiệu lực (`WHERE C.SO_DU > 0`).
  4. Cơ chế **Bảo toàn phân công cán bộ (Preserve Assignment)**: Đọc `existing_map` trước khi ghi, bảo toàn 100% hai cột `CBTD_PhuTrach` và `Ten_CBTD` đã được phân công trên WebApp.
  5. Cơ chế **Bảo toàn lịch sử tất toán (Zero-Record-Loss)**: Hợp đồng khi khách hàng trả hết nợ không bị xóa mà cập nhật `DuNo = 0`, `TrangThaiHD = 'DA_TAT_TOAN'`.
  6. Batch update dữ liệu vào `KH_CORE` và `HDTD_CORE` trên Google Sheets qua `gspread` kèm Retry Exponential Backoff (2s, 4s, 6s).
  7. Cập nhật `STATUS='SUCCESS'`, ghi nhận số dòng và thời gian hoàn tất.

### Tầng 2: Cloud Backend & Google Sheets (Google Workspace)
- **CSDL Cloud**: Google Sheets 14 bảng chuẩn hóa đóng vai trò Staging DB và CSDL vận hành thời gian thực.
- **REST API (`gas_backend/Code.gs`)**:
  - Xử lý các request `doGet` (truy vấn dữ liệu với Cache Service) và `doPost` (ghi nhận dữ liệu).
  - Tích hợp `LockService.getScriptLock()` với thời gian chờ 15s chống xung đột dữ liệu (Race condition) khi lập đợt trích nợ hoặc ghi nhận hồ sơ.
  - Tích hợp cơ chế **Self-Healing Auto-Migration**: Tự động kiểm tra và nâng cấp cấu trúc bảng nếu phát hiện thiếu sheet/cột mà bảo toàn 100% dữ liệu cũ (**Zero-Data-Loss**).
  - Hỗ trợ tính lãi ngày thực tế đồng bộ với Frontend qua `gas_backend/Utils/DateUtils.gs`.

### Tầng 3: Frontend Single Page Application (React + Vite)
- **Công nghệ**: React 18, Vite 5, Bootstrap 5 + FontAwesome 6 + Lucide React.
- **Triết Lý 100% Live API (Zero Mock Policy)**:
  - Loại bỏ hoàn toàn mock data khỏi toàn bộ dự án.
  - Tích hợp **High-Speed In-Memory Cache (SWR)** trong `api.js`: Đệm các truy vấn GET trong 60 giây, thời gian phản hồi tức thì < 1ms khi chuyển đổi giữa các tab.
  - Tự động xóa cache (`clearApiCache`) ngay khi có bất kỳ thao tác ghi dữ liệu (Mutation POST).
  - Tích hợp **Circuit Breaker**: Đánh dấu và cách ly tạm thời endpoint lỗi trong 3s, chuyển tiếp sang endpoint thay thế mà không gây đơ ứng dụng.
- **Thuật Toán Tính Lãi Ngày Thực Tế (`interestUtils.js`)**:
  - Chuẩn hóa theo Thông tư 14/2017/TT-NHNN: "Tính ngày đầu, bỏ ngày cuối", mẫu số $36500$, tự động cộng dồn nợ tồn đọng và phân tách chi tiết từng khế ước.
- **Responsive Modal System (`src/index.css`)**:
  - Tối ưu 100% cho mọi thiết bị: Mobile (375px - 430px), Tablet (768px), Desktop (1024px+).
  - Khóa chiều cao linh hoạt `max-height: calc(85vh - 130px)` kết hợp touch scrolling `-webkit-overflow-scrolling: touch`.
- **Bộ Tiện Ích Dùng Chung (Shared Catalog)**:
  - Tái sử dụng đồng bộ `DatePickerVN` (Flatpickr GMT+7 `disableMobile: true`), `ThousandInput` (phân cách hàng nghìn tự động), `ImageUploader` (nén ảnh Canvas), `formatDateVN`, `formatCurrencyVN`.

---

## 🔒 3. Quy Chuẩn Đồng Bộ & Kiểm Toán Dữ Liệu Bắt Buộc (Data Integrity & End-to-End Audit)

Mọi thay đổi cấu trúc dữ liệu trên Google Sheets hoặc nghiệp vụ đọc/ghi đều phải tuân thủ nghiêm ngặt chu trình kiểm toán **5 điểm chốt (5 Checkpoints)**:
1. **Schema Definition**: Khai báo đầy đủ trong `gas_backend/Database/SchemaSetup.gs` với cơ chế Smart Remap theo tên cột.
2. **Backend Controller**: Ánh xạ động `colMap[headerName]`, fallback dữ liệu an toàn và hủy cache tương ứng khi ghi.
3. **Frontend API Client**: Khai báo phương thức rõ ràng trong `src/services/api.js`, xử lý lỗi mạng minh bạch (Zero Mock).
4. **Validation & Dual-Deployment**: Build Vite sạch 0 lỗi (`npm run build`), push Clasp dual-script (`gas_sync_dual.ps1`) và kiểm tra live API.
5. **Documentation & Memory**: Cập nhật `DATA_SCHEMA.md`, `SPECIFICATIONS_AND_LESSONS_LEARNED.md`, `AGENTS.md`, `GEMINI.md`.

---

## ⚡ 4. Chiến Lược Tiền Xử Lý Bằng Python & Kiến Trúc CSDL Tối Ưu Đọc (Data Mart)

Nhằm triệt tiêu gánh nặng tính toán trên Google Apps Script và tối ưu hóa tốc độ tải trang về mức **dưới 150ms**, kiến trúc hệ thống áp dụng mô hình **Read-Optimized Data Store**:
- **Chi tiết đặc tả**: Xem tài liệu chuyên sâu tại [docs/DATABASE_SCHEMA_AND_OPTIMIZATION.md](file:///d:/Antigravity%20Projects/CreditCores/docs/DATABASE_SCHEMA_AND_OPTIMIZATION.md).
- **8 Nội dung Python Daemon xử lý trước khi đẩy lên Google Sheets**:
  1. *Chuẩn hóa Địa bàn 3 Xã & 12 Thôn*: Tách chuỗi địa chỉ thành 2 trường chuẩn hóa `KvXa` và `KvThon`.
  2. *Phân loại Nhóm Sản Phẩm*: Ánh xạ tự động tên sản phẩm Core sang `Nông nghiệp`, `Tiêu dùng - Đời sống`, `Thương mại - Dịch vụ`.
  3. *Tính sẵn Chỉ số Khách hàng 360*: Tính `TongDuNoHienTai`, `SoLuongHDVay`, `TrangThaiVay` ghi trực tiếp vào `KH_CORE`.
  4. *Sinh Bảng Snapshot Điều Hành (`DASHBOARD_SNAPSHOT`)*: Bảng siêu nhẹ **16 dòng** tổng hợp sẵn số liệu toàn Quỹ, 3 Xã và 12 Thôn. Dashboard chỉ cần đọc bảng này (<4KB) trong 30ms.
  5. *Sinh Sẵn 2 Bảng Báo Cáo*: `BC_DOANH_SO_TD` và `TOP_DU_NO_BINH_QUAN` (Top 20 KH, tỷ trọng %, huy hiệu xếp hạng).
  6. *Bảo toàn phân công CBTD*: Đọc `existing_map` bảo toàn 100% cột `CBTD_PhuTrach` và `Ten_CBTD` đã gán trên WebApp.
  7. *Bảo toàn lịch sử tất toán*: Cập nhật `DuNo = 0`, `TrangThaiHD = 'DA_TAT_TOAN'` khi khách hàng trả hết nợ (Zero-Record-Loss).
  8. *Chuẩn hóa kiểu dữ liệu & Bảo mật*: Thêm nháy đơn `'` chống nuốt số 0, chống Formula Injection (CWE-1236), định dạng ngày GMT+7.

---

## 🏛️ 5. Chuẩn Mực Ánh Xạ Dữ Liệu Theo Tên Cột (Header-Name Based Mapping & Self-Healing Remap)

Hệ thống đã loại bỏ hoàn toàn việc truy xuất cột theo chỉ số mảng cố định (`row[0]`, `row[11]`, `col 5`...) để chuyển sang **Header-Name Based Mapping**:

### 1. Ở Tầng Backend Google Apps Script (`HeaderUtils.gs`):
- `HeaderUtils.getHeaderMap(sheet)`: Quét dòng 1 để lập bản đồ vị trí các cột động `{ [headerName]: colIndex }`.
- `HeaderUtils.getCell(row, colMap, "TenCot", defaultVal)`: Lấy giá trị ô theo tên cột, an toàn khi cột bị dịch chuyển vị trí.
- `HeaderUtils.setCell(sheet, rowIndex, colMap, "TenCot", value)`: Ghi giá trị ô đơn chính xác vào cột tương ứng.
- `HeaderUtils.dictToRow(dict, colMap, defaultHeaders)`: Chuyển đổi đối tượng dữ liệu thành mảng dòng theo đúng thứ tự cột thực tế của Sheet.

### 2. Ở Tầng Python Daemon (`sync_daemon.py` & `schema_healer.py`):
- `sync_records_to_sheet`: Đọc danh sách header thực tế `sheet.row_values(1)`. Duyệt từng cột theo tên `r.get(h, "")` trước khi ghi batch.
- `init_or_heal_database_schema`: Khi phát hiện sheet thay đổi thứ tự hoặc số lượng cột, script tự động:
  1. Đọc toàn bộ dữ liệu hiện có kèm header cũ.
  2. Tạo bản đồ tra cứu theo tên cột.
  3. Ánh xạ lại từng dòng dữ liệu theo thứ tự cột chuẩn mới.
  4. Cập nhật header và ghi lại toàn bộ dữ liệu (**Bảo toàn 100% dữ liệu cũ, không mất mát dù chỉ 1 cell**).

### 3. Trình Tự Cột Chuẩn Logic Nghiệp Vụ:
- **`HDTD_CORE` (22 cột)**: `SoHDTD`, `MaKH`, `HoTen`, `CCCD`, `DienThoai`, `DiaChi`, `KvXa`, `KvThon`, `TienVay`, `DuNo`, `LaiSuat`, `NgayVay`, `DenHan`, `TraLaiDenNgay`, `SoThangVay`, `MaLoaiVay`, `MoTaVay`, `CBTD_PhuTrach`, `Ten_CBTD`, `TrangThaiHD`, `MaLoaiHD`, `NgayCapNhat`.
- **`KH_CORE` (22 cột)**: `MaKH`, `HoTen`, `CCCD`, `NgayCap`, `NoiCap`, `NgaySinh`, `DienThoai`, `DienThoaiDD`, `DiaChi`, `KvXa`, `KvThon`, `KhuVuc`, `SoTK`, `SoTV`, `SoSoCP`, `NgayVaoTV`, `TongTienCP`, `TongDuNoHienTai`, `SoLuongHDVay`, `TrangThaiVay`, `NhomNoCIC`, `NgayCapNhat`.
- **`DANG_KY_TRICH_NO` (15 cột)**: `SoHDTD`, `MaKH`, `TenKH`, `SoTK`, `NgayVay`, `TraLaiDenNgay`, `LaiSuat`, `SoTienLai`, `SoTienNo`, `SoGoc`, `TongTien`, `KyTrichNo`, `TrangThai`, `GhiChu`, `NgayTao`.
- **`LICH_SU_TRICH_NO` (11 cột)**: `MaDot`, `SoHDTD`, `MaKH`, `TenKH`, `SoTK`, `TongTienPhaiThu`, `DaTrich`, `ConNo`, `TrangThaiCore`, `MaGiaoDichCore`, `NgayTrich`.
- **`DOT_TRICH_NO` (10 cột)**: `MaDot`, `ThangNam`, `KyTrichNo`, `TongSoHD`, `TongSoKH`, `TongPhaiThu`, `TongDaTrich`, `TongConNo`, `TrangThai`, `NgayTao`.
- **`NO_TON_DONG` (10 cột)**: `SoHDTD`, `MaKH`, `TenKH`, `GocTon`, `LaiTon`, `TongNoTon`, `KyPhatSinh`, `TrangThai`, `GhiChu`, `NgayCapNhat`.

