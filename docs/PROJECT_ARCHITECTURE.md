# 🏛️ KIẾN TRÚC TỔNG THỂ HỆ THỐNG CREDITCORES
# Core Credit & Auto-Debit Automation System (v3.0)

Tài liệu này mô tả chi tiết kiến trúc kỹ thuật 3 tầng phân tán (**3-Tier Distributed Resilient Architecture**) của Hệ thống Quản lý Tín dụng & Trích nợ Tự động **CreditCores** phục vụ cho Quỹ Tín Dụng Nhân Dân / Ngân hàng Hợp tác xã.

---

## 🏛️ 1. Sơ Đồ Kiến Trúc Hệ Thống (System Topology)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TẦNG 1: MÁY CHỦ NỘI BỘ (ON-PREMISE CORE BANKING)                            │
│                                                                             │
│   ┌─────────────────────┐                 ┌─────────────────────────────┐   │
│   │   SQL SERVER CORE   │ ◄──(pyodbc)──── │   PYTHON DAEMON 24/7        │   │
│   │   (CSDL Tín dụng)   │                 │   (sync_daemon.py)          │   │
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
│   │   (12 Bảng chuẩn hóa)           │ ◄─┤   (Code.gs - REST Engine)     │   │
│   │   • ROLES, USERS, SETTING       │   │   • LockService (Chống Race)  │   │
│   │   • KH_CORE, HDTD_CORE...       │   │   • Auth & RBAC 360 Engine    │   │
│   │   • DOT_TRICH_NO, THAM_DINH...  │   │   • Schema Auto-Migration    │   │
│   │   • CAU_HINH_BIEU_MAU           │   │   • DateUtils Actual Days     │   │
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
│   │   • Dual-Mode Client (Live GAS API + Resilient Auto-Fallback)       │   │
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

### Tầng 1: Local Python Daemon (Máy chủ SQL Server Core)
- **Vị trí**: Chạy thường trực 24/7 dưới dạng Windows Service hoặc background process trên máy chủ cài đặt SQL Server CoreBanking.
- **Nhiệm vụ cốt lõi**:
  1. Polling hàng đợi tại bảng `SETTING` mỗi 5 giây (`COMMAND='SYNC_DATA'` và `STATUS='PENDING'`).
  2. Kết nối SQL Server qua driver `pyodbc` nội bộ với tốc độ cao.
  3. Thực thi query tích hợp thông tin Khách hàng, Số tài khoản CASA, Thành viên góp vốn và Khế ước dư nợ còn hiệu lực (`DuNo > 0`).
  4. Batch update dữ liệu vào `KH_CORE` và `HDTD_CORE` trên Google Sheets qua `gspread`.
  5. Cập nhật `STATUS='SUCCESS'`, ghi nhận số dòng và thời gian hoàn tất.

### Tầng 2: Cloud Backend & Google Sheets (Google Workspace)
- **CSDL Cloud**: Google Sheets 12 bảng chuẩn hóa đóng vai trò Staging DB và CSDL vận hành thời gian thực.
- **REST API (`gas_backend/Code.gs`)**:
  - Xử lý các request `doGet` (truy vấn) và `doPost` (ghi nhận dữ liệu).
  - Tích hợp `LockService` chống xung đột dữ liệu (Race condition) khi nhiều giao dịch phát sinh đồng thời.
  - Tích hợp cơ chế **Self-Healing Auto-Migration**: Tự động kiểm tra và nâng cấp cấu trúc bảng nếu phát hiện thiếu sheet/cột mà người dùng không cần can thiệp thủ công.
  - Hỗ trợ tính lãi ngày thực tế đồng bộ với Frontend qua `gas_backend/Utils/DateUtils.gs`.

### Tầng 3: Frontend Single Page Application (React + Vite)
- **Công nghệ**: React 18, Vite 5, Bootstrap 5 + FontAwesome 6 + Lucide React.
- **Dual-Mode API Engine**:
  - Ưu tiên gọi trực tiếp Google Apps Script Live API.
  - Tự động fallback sang Mock Data / Local Auth khi mạng mất kết nối hoặc khi GAS đang deploy, đảm bảo nghiệp vụ không bao giờ bị gián đoạn.
- **Thuật Toán Tính Lãi Ngày Thực Tế (`interestUtils.js`)**:
  - Chuẩn hóa theo Thông tư 14/2017/TT-NHNN: "Tính ngày đầu, bỏ ngày cuối", mẫu số $36500$, tự động cộng dồn nợ tồn đọng và phân tách chi tiết từng khế ước.
- **Responsive Modal System (`src/index.css`)**:
  - Tối ưu 100% cho mọi thiết bị: Mobile (375px - 430px), Tablet (768px), Desktop (1024px+).
  - Khóa chiều cao linh hoạt `max-height: calc(85vh - 130px)` kết hợp touch scrolling `-webkit-overflow-scrolling: touch`.
- **Mail Merge Template Engine (`TemplateManager.jsx`)**:
  - Hỗ trợ soạn thảo, ánh xạ thẻ biến động `{{HoTen}}`, `{{DuNo}}`, `{{LaiDuKien}}` và xuất mẫu Google Docs/Word/Excel.
- **Phân Hệ Thẩm Định Tín Dụng 5 Nhóm Nghiệp Vụ (`Appraisal.jsx`)**:
  - Cấu trúc 5 Tab Wizard & Detail Modal: Pháp lý/Nhu cầu $\to$ TSBĐ $\to$ Dòng tiền/CIC/Thực địa $\to$ Đề xuất CBTD & Chỉ số ($LTV$, $DSR$, $Coverage$, $EMI$) $\to$ Phê duyệt đa cấp 4 tầng.

---

## 🔒 3. Quy Chuẩn Đồng Bộ & Kiểm Toán Dữ Liệu Bắt Buộc (Data Integrity & End-to-End Audit)

Mọi thay đổi cấu trúc dữ liệu trên Google Sheets hoặc nghiệp vụ đọc/ghi đều phải tuân thủ nghiêm ngặt chu trình kiểm toán **5 điểm chốt (5 Checkpoints)**:
1. **Schema Definition**: Khai báo đầy đủ trong `gas_backend/Database/SchemaSetup.gs` với cơ chế Smart Remap theo tên cột.
2. **Backend Controller**: Ánh xạ động `colMap[headerName]`, fallback dữ liệu an toàn và hủy cache tương ứng khi ghi.
3. **Frontend API & Mocks**: Đồng bộ chữ ký hàm `api.js`, xử lý cả live request lẫn mock switch case trong `api.js` và `mockData.js`.
4. **Validation & Dual-Deployment**: Build Vite sạch 0 lỗi, push Clasp dual-script (`gas_sync_dual.ps1`) và kiểm tra live API.
5. **Documentation & Memory**: Cập nhật `DATA_SCHEMA.md`, `AGENTS.md`, `GEMINI.md` và chạy Re-index CBI Graph.
