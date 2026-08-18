# KIẾN TRÚC TỔNG THỂ HỆ THỐNG CREDITCORES
# Core Credit & Auto-Debit Automation System

Tài liệu này mô tả chi tiết kiến trúc kỹ thuật 3 tầng (3-Tier Distributed Architecture) của Hệ thống Quản lý Tín dụng & Trích nợ Tự động **CreditCores** phục vụ cho Quỹ Tín Dụng Nhân Dân / Ngân hàng Hợp tác xã.

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
│   │   (11 Sheets chuẩn hóa)         │ ◄─┤   (Code.gs - REST Engine)     │   │
│   │   • ROLES, USERS, SETTING       │   │   • LockService (Chống Race)  │   │
│   │   • KH_CORE, HDTD_CORE...       │   │   • Auth & RBAC 360 Engine    │   │
│   └─────────────────────────────────┘   │   • Self-Healing Migration    │   │
│                                         └───────────────▲───────────────┘   │
└─────────────────────────────────────────────────────────┼───────────────────┘
                                                          │
                                            (HTTPS REST API / JSON CORS)
                                                          │
┌─────────────────────────────────────────────────────────┴───────────────────┐
│ TẦNG 3: FRONTEND SINGLE PAGE APPLICATION (VERCEL HOSTING)                   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │   REACT 18 + VITE SINGLE PAGE APPLICATION                           │   │
│   │   • URL: https://qtdyentho-credit.vercel.app                        │   │
│   │   • Dual-Mode Client (Live GAS API + Resilient Auto-Fallback)       │   │
│   │   • 10 Phân hệ Nghiệp vụ + Phân quyền 360° Tick chọn chi tiết       │   │
│   │   • SHA-256 Client-side Security Hashing                            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ 2. Chi Tiết Các Tầng Kiến Trúc

### Tầng 1: Local Python Daemon (Máy chủ SQL Server)
- **Vị trí**: Chạy thường trực 24/7 dưới dạng Windows Service hoặc background process trên máy chủ cài đặt SQL Server CoreBanking.
- **Nhiệm vụ**:
  1. Polling hàng đợi tại bảng `SETTING` mỗi 5 giây.
  2. Khi phát hiện lệnh `COMMAND='SYNC_DATA'` và `STATUS='PENDING'`:
     - Kết nối SQL Server qua driver `pyodbc`.
     - Thực thi câu lệnh `SELECT` kết hợp dữ liệu Khách hàng, Số tài khoản CASA, Thành viên góp vốn và Khế ước dư nợ.
     - Batch update dữ liệu vào `KH_CORE` và `HDTD_CORE` trên Google Sheets.
     - Cập nhật trạng thái `STATUS='SUCCESS'`, ghi nhận số dòng và thời gian hoàn tất.

### Tầng 2: Cloud Backend & Google Sheets (Google Workspace)
- **CSDL Cloud**: Google Sheets 11 bảng chuẩn hóa đóng vai trò Staging DB và CSDL vận hành thời gian thực.
- **REST API (`gas_backend/Code.gs`)**:
  - Xử lý các request `doGet` (truy vấn) và `doPost` (ghi nhận dữ liệu).
  - Tích hợp `LockService` chống xung đột dữ liệu (Race condition) khi nhiều giao dịch phát sinh đồng thời.
  - Tích hợp cơ chế **Self-Healing Auto-Migration**: Tự động kiểm tra và nâng cấp cấu trúc bảng nếu phát hiện thiếu sheet/cột mà người dùng không cần can thiệp thủ công.

### Tầng 3: Frontend Single Page Application (React + Vite)
- **Công nghệ**: React 18, Vite 5, Bootstrap 5 + FontAwesome 6 + Lucide React.
- **Dual-Mode API Engine**:
  - Ưu tiên gọi trực tiếp Google Apps Script Live API.
  - Tự động fallback sang Mock Data / Local Auth khi mạng mất kết nối hoặc khi GAS đang trong quá trình deploy phiên bản mới, đảm bảo trải nghiệm người dùng không bao giờ bị gián đoạn.
- **Bảo mật**: Mã hóa mật khẩu một chiều SHA-256 bằng Web Crypto API ngay tại Client.
