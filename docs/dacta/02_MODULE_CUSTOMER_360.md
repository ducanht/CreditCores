# 👥 ĐẶC TẢ PHÂN HỆ TRA CỨU KHÁCH HÀNG 360° (CUSTOMER 360)
# Hồ Sơ Thành Viên, Tiền Gửi CASA & Lịch Sử Tín Dụng — QTDND Yên Thọ

---

## 1. MỤC TIÊU VÀ PHẠM VI NGHIỆP VỤ

Phân hệ **Customer 360** là kho dữ liệu tập trung toàn diện về toàn bộ khách hàng và thành viên của Quỹ tín dụng nhân dân Yên Thọ:
- Tra cứu nhanh theo Mã khách hàng, Họ tên, Số CCCD (12 số), Số điện thoại hoặc Số tài khoản thanh toán CASA.
- Hiển thị góc nhìn 360 độ: Thông tin tư cách thành viên QTDND, địa chỉ cư trú chi tiết theo Thôn/Xã, số tài khoản CASA, toàn bộ danh sách hợp đồng vay đã/đang lưu hành và tài sản thế chấp tương ứng.
- Cho phép gán và chuyển giao **Cán bộ tín dụng phụ trách (`CBTD_PhuTrach`)** trực tiếp trên WebApp (hệ thống tự động bảo toàn khi Python Daemon đồng bộ từ SQL Core).

---

## 2. KIẾN TRÚC GIAO DIỆN & LUỒNG THAO TÁC (UI/UX WORKFLOW)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CUSTOMER 360 WORKFLOW DIAGRAM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. THANH TÌM KIẾM ĐA NĂNG (Smart Search Bar):                               │
│    Hỗ trợ tìm kiếm thời gian thực theo Tên, CCCD, SĐT, Số HĐTD, Số TK CASA  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. DANH SÁCH KHÁCH HÀNG (Master Customer Table):                            │
│    - Thông tin định danh: Mã KH, Họ tên, CCCD, Ngày cấp, Địa chỉ            │
│    - Trạng thái thành viên: Thành viên sáng lập / Thường xuyên / Đã chuyển nhượng │
│    - CBTD Phụ trách: Cho phép chọn nhanh CBTD quản lý địa bàn               │
│    - Nút Quick Action: Mở Hồ sơ chi tiết, Đăng ký trích nợ, Lập thẩm định  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. MODAL HỒ SƠ 360° CHI TIẾT (Customer Dossier Modal):                      │
│    - Tab 1: Thông tin nhân thân & Thông tin thành viên QTDND                │
│    - Tab 2: Danh sách Hợp đồng tín dụng (`HDTD_CORE`) & Dư nợ hiện tại      │
│    - Tab 3: Danh sách Tài sản thế chấp (`TSBD_CORE`)                        │
│    - Tab 4: Thỏa thuận trích nợ CASA & Lịch sử trả nợ qua tài khoản         │
│    - In "Hồ sơ thông tin khách hàng tổng hợp" khổ A4                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. CƠ CHẾ BẢO TOÀN PHÂN CÔNG CÁN BỘ (PRESERVE ASSIGNMENT)

- Trong CSDL CoreBanking SQL Server, trường phân công cán bộ phụ trách có thể không đầy đủ hoặc bị ghi đè.
- **CreditCores áp dụng cơ chế đặc thù**:
  - Cột `CBTD_PhuTrach` và `Ten_CBTD` trên Google Sheets `KH_CORE` được bảo toàn nguyên vẹn 100%.
  - Khi Python Sync Daemon đẩy dữ liệu từ SQL Server lên, script luôn tải `existing_map` để gán lại phân công cán bộ trước khi ghi, chống việc xóa nhầm phân công của Ban Điều hành.

---

## 4. TÍCH HỢP POPUP TRA CỨU NHANH (CUSTOMER QUICK MODAL)

- Thành phần `CustomerQuickModal` được tái sử dụng xuyên suốt toàn bộ ứng dụng (từ Dashboard, Danh sách trích nợ, Đối soát, Cảnh báo nợ đến Thẩm định).
- Người dùng chỉ cần nhấp vào tên khách hàng ở bất kỳ đâu trên màn hình, popup sẽ lập tức hiển thị thông tin liên lạc và các hợp đồng đang vay mà không cần rời khỏi màn hình làm việc hiện tại.
