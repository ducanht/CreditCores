# 📈 LỘ TRÌNH PHÁT TRIỂN & KẾ HOẠCH MỞ RỘNG (ROADMAP)
# CreditCores - Core Credit & Auto-Debit System (v3.0)

Tài liệu này theo dõi các mốc phát triển của dự án, các phiên bản đã hoàn thành và định hướng mở rộng trong tương lai.

---

## 📈 1. Lịch Sử Phát Triển Các Phiên Bản

| Phiên Bản | Ngày Hoàn Thành | Các Tính Năng Đã Triển Khai |
| :---: | :---: | :--- |
| **v1.0.0** | 18/08/2026 | • Phân tích & thiết kế hệ thống phân tán 3 tầng.<br>• Viết mã nguồn Python Daemon 24/7 kết nối SQL Server Core qua `pyodbc`.<br>• Khởi tạo CSDL 9 Sheets Google Sheets & REST API Google Apps Script (`Code.gs`).<br>• Xây dựng Frontend SPA 10 phân hệ nghiệp vụ hoàn chỉnh.<br>• Đẩy mã nguồn lên GitHub `ducanht/CreditCores`. |
| **v1.1.0** | 18/08/2026 | • Tích hợp phân hệ Xác thực Bảo mật & Mã hóa Mật khẩu SHA-256.<br>• Thêm màn hình Đăng nhập Banking chuyên nghiệp kèm 1-Click Demo Login.<br>• Thiết lập ma trận phân quyền 4 vai trò (Admin, CBTD, Kế toán, Lãnh đạo).<br>• Thêm tính năng Đổi mật khẩu và Quản lý tài khoản cán bộ. |
| **v1.2.0** | 18/08/2026 | • **Phân Quyền 360° Đa Chức Năng**: Cho phép tick chọn từng phân hệ riêng lẻ cho từng User và cấu hình ma trận Nhóm quyền.<br>• **Cơ chế Self-Healing Auto-Migration**: Tự động kiểm tra và nâng cấp cấu trúc 11 Sheets CSDL trên Google Sheets.<br>• Đổi tên dự án thành `qtdyentho-credit` hướng tới domain Vercel `https://qtdyentho-credit.vercel.app`.<br>• Xây dựng bộ tài liệu kiến trúc chuẩn theo phương pháp luận Superpowers. |
| **v1.3.0** | 19/08/2026 | • **Tính Lãi Chi Tiết Theo Ngày Thực Tế**: Áp dụng chuẩn Thông tư 14/2017/TT-NHNN ("Tính ngày đầu, bỏ ngày cuối", mẫu số $36500$, phân tách khế ước và cộng dồn nợ tồn).<br>• **Responsive Modal System Toàn Diện**: Chuẩn hóa 11 cửa sổ modal co giãn tự động trên mọi thiết bị (Mobile 375px, Tablet 768px, Desktop).<br>• **Quản Trị CSDL 12 Bảng Chuẩn Hóa**: Bổ sung `CAU_HINH_BIEU_MAU`, chuẩn hóa header auto-migration bảo toàn 100% dữ liệu cũ.<br>• **CBI-MCP Multi-Project Integration**: Tích hợp và lập chỉ mục đồ thị mã nguồn độc lập vào CBI Engine. |

---

## 🚀 2. Kế Hoạch Phát Triển Giai Đoạn Tiếp Theo (Next Phases)

### Giai Đoạn 2: Tự Động Hóa Thông Báo & Tương Tác Khách Hàng (Q4/2026)
- [ ] **Tích hợp Zalo ZNS / SMS Brandname**:
  - Tự động gửi tin nhắn thông báo trước ngày trích nợ 02 ngày: *"Kính gửi Quý khách, ngày dd/MM QTDND sẽ tiến hành trích nợ tự động số tiền... từ TK... Xin vui lòng duy trì đủ số dư."*
  - Gửi tin nhắn thông báo kết quả sau khi trích nợ thành công hoặc cảnh báo trích nợ thất bại.
- [ ] **Xuất Phiếu Thu / Báo Nợ PDF Tự Động**:
  - Tích hợp xuất phiếu thu tiền lãi, biên lai thu nợ điện tử dưới dạng PDF/A in trực tiếp.

### Giai Đoạn 3: Tích Hợp AI Chấm Điểm & Trích Xuất Chứng Từ (Q1/2027)
- [ ] **AI OCR Trích Xuất Giấy Tờ**:
  - Tự động đọc và trích xuất thông tin từ Giấy chứng nhận QSDĐ (Sổ đỏ) và CCCD gắn chip để tự động điền form Thẩm định và Khách hàng.
- [ ] **AI Credit Scoring**:
  - Chấm điểm tín dụng nội bộ dựa trên lịch sử trả nợ các kỳ trước, số dư CASA bình quân và thâm niên thành viên góp vốn.
