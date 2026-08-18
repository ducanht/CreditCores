# PHƯƠNG PHÁP LUẬN SUPERPOWERS & NGUYÊN TẮC DUY TRÌ TÀI LIỆU
# Superpowers Methodology & Automated Documentation Protocol

Tài liệu này hướng dẫn cách áp dụng phương pháp luận **Superpowers** (dựa trên framework [obra/superpowers](https://github.com/obra/superpowers)) vào quản lý, phát triển và cập nhật dự án **CreditCores**.

---

## 🎯 1. Triết Lý Cốt Lõi Của Superpowers

Superpowers biến đổi quy trình làm việc của AI Agent và Lập trình viên theo 4 nguyên tắc kỷ luật:

1. **Mandatory Workflow (Quy Trình Bắt Buộc)**:
   - Mọi thay đổi lớn đều phải đi qua 4 bước: **Khám phá (Brainstorm)** $\to$ **Lập Kế Hoạch (Plan)** $\to$ **Kiểm Thử Trước (TDD)** $\to$ **Thực Thi & Kiểm Tra (Verify)**.
2. **Test-Driven Development (TDD Trong Tài Chính)**:
   - Các thuật toán tính toán tài chính (Tính LTV, tính lãi suất vay theo tháng, cộng dồn nợ tồn đọng) đều được kiểm thử với các ca thử nghiệm biên (Edge Cases: Số dư bằng 0, Dư nợ lẻ, Khách hàng nhiều hợp đồng).
3. **Systematic Debugging (Gỡ Lỗi Dựa Trên Bằng Chứng)**:
   - Tuyệt đối không đoán mò nguyên nhân lỗi.
   - Khi xảy ra sự cố (ví dụ: Google Apps Script báo lỗi "Hành động không hợp lệ"), Agent thu thập mã phản hồi, cô lập phiên bản deployment, và thiết lập cơ chế **Resilient Fallback** để bảo vệ trải nghiệm người dùng.
4. **Living Documentation Protocol (Quy Tắc Tài Liệu Động Tự Cập Nhật)**:
   - Toàn bộ tài liệu kỹ thuật trong thư mục `docs/` (`PROJECT_ARCHITECTURE.md`, `DATA_SCHEMA.md`, `BUSINESS_WORKFLOWS.md`, `DEVELOPMENT_ROADMAP.md`) **phải được cập nhật đồng bộ mỗi khi mã nguồn hoặc CSDL có sự thay đổi**.

---

## 📂 2. Hệ Thống Tài Liệu Kỹ Thuật Dự Án (Living Docs Map)

```
CreditCores/
├── docs/
│   ├── PROJECT_ARCHITECTURE.md   # Kiến trúc 3 tầng & Sơ đồ luồng dữ liệu
│   ├── DATA_SCHEMA.md            # Cấu trúc chi tiết 11 bảng CSDL Google Sheets
│   ├── BUSINESS_WORKFLOWS.md     # 9 Luồng quy trình nghiệp vụ Quỹ Tín Dụng
│   ├── DEVELOPMENT_ROADMAP.md    # Lịch sử phiên bản & Kế hoạch mở rộng
│   └── SUPERPOWERS_METHODOLOGY.md# Phương pháp luận Superpowers & Quy tắc cập nhật
├── gas_backend/
│   ├── Code.gs                   # Mã nguồn Google Apps Script REST API
│   ├── AutoGeneratGoogleSheets.gs# Script khởi tạo CSDL 11 Sheets
│   └── HUONG_DAN_DAY_CODE_GAS.md # Hướng dẫn triển khai Web App
├── python_daemon/
│   ├── sync_daemon.py            # Local Daemon đồng bộ SQL Server 24/7
│   └── README_DAEMON.md          # Hướng dẫn cài đặt Service trên máy chủ
└── DEPLOYMENT_GUIDE.md           # Hướng dẫn triển khai Vercel & GitHub
```

---

## 🔄 3. Quy Trình Cập Nhật Tài Liệu Tự Động Khi Thay Đổi Code

Bất kỳ khi nào AI Agent hoặc Lập trình viên thực hiện một thay đổi:

| Sự Thay Đổi | Tài Liệu Bắt Buộc Cập Nhật |
| :--- | :--- |
| **Thêm / Đổi cấu trúc Bảng Google Sheets** | Cập nhật `docs/DATA_SCHEMA.md` & `gas_backend/Code.gs` |
| **Thêm / Đổi Phân hệ hoặc Luồng Nghiệp vụ** | Cập nhật `docs/BUSINESS_WORKFLOWS.md` & `src/services/auth.js` |
| **Phát hành Phiên bản mới / Cập nhật Kiến trúc** | Cập nhật `docs/DEVELOPMENT_ROADMAP.md` & `docs/PROJECT_ARCHITECTURE.md` |
| **Cập nhật Cấu hình Triển khai (Vercel, Git)** | Cập nhật `DEPLOYMENT_GUIDE.md` & `package.json` |
