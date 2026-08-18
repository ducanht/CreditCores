# HƯỚNG DẪN ĐẨY MÃ NGUỒN VÀO GOOGLE APPS SCRIPT & KHỞI TẠO CSDL 9 SHEETS

## 🔗 Các Liên Kết Đã Cấu Hình Sẵn
- **Google Sheets CSDL**: [https://docs.google.com/spreadsheets/d/1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw/edit](https://docs.google.com/spreadsheets/d/1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw/edit)
- **Google Apps Script Project**: [https://script.google.com/d/1NI0PAQ56mfyrEALtn_MtaJ2EBwD0lS3TUOyHSOD72eiG8lEh9LlY_1vp/edit](https://script.google.com/d/1NI0PAQ56mfyrEALtn_MtaJ2EBwD0lS3TUOyHSOD72eiG8lEh9LlY_1vp/edit)

---

## 📋 HƯỚNG DẪN 3 BƯỚC ĐẨY CODE VÀ KHỞI TẠO TỨC THÌ

### Bước 1: Dán Mã Nguồn vào Google Apps Script
1. Mở liên kết Apps Script: [https://script.google.com/d/1NI0PAQ56mfyrEALtn_MtaJ2EBwD0lS3TUOyHSOD72eiG8lEh9LlY_1vp/edit](https://script.google.com/d/1NI0PAQ56mfyrEALtn_MtaJ2EBwD0lS3TUOyHSOD72eiG8lEh9LlY_1vp/edit)
2. Mở file `Code.gs` (hoặc tạo file mới `Code.gs`).
3. Xóa nội dung cũ trong editor và dán toàn bộ nội dung từ file local:
   👉 [`d:\Antigravity Projects\CreditCores\gas_backend\Code.gs`](./Code.gs)
4. Nhấn biểu tượng **Save (Lưu / Ctrl + S)**.

---

### Bước 2: Bấm Chạy để Tự Động Khởi Tạo 9 Bảng CSDL
1. Trên thanh công cụ của Apps Script Editor, tại ô chọn hàm cần thực thi (cạnh nút Run):
   - Chọn hàm: **`runSetupDirectly`**
2. Nhấn nút **Run (Chạy)**.
3. Nếu là lần đầu chạy, Google sẽ yêu cầu cấp quyền:
   - Nhấn *Review Permissions (Xem lại quyền)* $\to$ Chọn tài khoản Google của bạn $\to$ Nhấn *Advanced (Nâng cao)* $\to$ Nhấn *Go to ... (unsafe) / Tiếp tục* $\to$ Nhấn *Allow (Cho phép)*.
4. **Kết quả**: 
   - Sau 3 - 5 giây, toàn bộ **9 Sheets CSDL** (`SETTING`, `KH_CORE`, `HDTD_CORE`, `DS_TRICH_NO`, `DOT_TRICH_NO`, `LICH_SU_GIAO_DICH`, `NO_TON_DONG`, `BAO_CAO_THAM_DINH`, `KIEM_TRA_VON`) trên Google Sheet sẽ được tạo tự động với đầy đủ màu sắc, định dạng số tiền, căn chỉnh và nạp dữ liệu mẫu ban đầu!

---

### Bước 3: Triển Khai Web App REST API (Deploy Web App)
1. Ở góc trên bên phải màn hình Apps Script, nhấn **Deploy (Triển khai)** $\to$ **New deployment (Triển khai mới)**.
2. Nhấp vào biểu tượng bánh răng (Cấu hình loại triển khai) $\to$ Chọn **Web app (Ứng dụng web)**.
3. Thiết lập:
   - **Description**: `CreditCores REST API v1.0`
   - **Execute as (Thực thi dưới dạng)**: `Me (Tôi - email của bạn)`
   - **Who has access (Ai có quyền truy cập)**: `Anyone (Bất kỳ ai)` *(Bắt buộc để Frontend WebApp kết nối được)*.
4. Nhấn **Deploy**.
5. Sao chép chuỗi **Web App URL** (Dạng `https://script.google.com/macros/s/.../exec`).

---

### Bước 4: Kết Nối vào WebApp Frontend
1. Mở giao diện Frontend của CreditCores.
2. Vào mục **Cấu hình & Đồng bộ Core** (`Settings`).
3. Dán chuỗi **Web App URL** vừa sao chép vào ô *Cấu Hình Kết Nối Google Apps Script Web App API* và nhấn **Lưu Cấu Hình**.
4. Hệ thống sẽ ngay lập tức chuyển sang chế độ **Live GAS API** và kết nối trực tiếp với Google Sheets của bạn!
