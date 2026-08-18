# HƯỚNG DẪN ĐẨY MÃ NGUỒN VÀO GOOGLE APPS SCRIPT & CẬP NHẬT DEPLOYMENT MỚI
# CSDL 11 Sheets + Phân Quyền 360° + Xác Thực Auth

## 🔗 Các Liên Kết Dự Án
- **Google Sheets CSDL (11 Sheets)**: [https://docs.google.com/spreadsheets/d/1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw/edit](https://docs.google.com/spreadsheets/d/1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw/edit)
- **Google Apps Script Project**: [https://script.google.com/d/1NI0PAQ56mfyrEALtn_MtaJ2EBwD0lS3TUOyHSOD72eiG8lEh9LlY_1vp/edit](https://script.google.com/d/1NI0PAQ56mfyrEALtn_MtaJ2EBwD0lS3TUOyHSOD72eiG8lEh9LlY_1vp/edit)

---

## 📋 CÁC BƯỚC CẬP NHẬT MÃ NGUỒN & PHIÊN BẢN WEB APP (DEPLOYMENT)

### Bước 1: Dán Toàn Bộ Mã Nguồn Mới vào Google Apps Script
1. Mở liên kết Apps Script: [https://script.google.com/d/1NI0PAQ56mfyrEALtn_MtaJ2EBwD0lS3TUOyHSOD72eiG8lEh9LlY_1vp/edit](https://script.google.com/d/1NI0PAQ56mfyrEALtn_MtaJ2EBwD0lS3TUOyHSOD72eiG8lEh9LlY_1vp/edit)
2. Chọn file `Code.gs`.
3. Xóa toàn bộ nội dung cũ trong editor và dán mã nguồn mới nhất từ file local:
   👉 [`d:\Antigravity Projects\CreditCores\gas_backend\Code.gs`](./Code.gs)
4. Nhấn biểu tượng **Save (Ctrl + S)**.

---

### Bước 2: Tự Động Khởi Tạo / Nâng Cấp 11 Sheets CSDL
1. Trên thanh công cụ Apps Script Editor, tại ô chọn hàm cần chạy:
   - Chọn hàm: **`runSetupDirectly`**
2. Nhấn nút **Run (Chạy)**.
3. **Kết quả**: Toàn bộ **11 Sheets CSDL** (`ROLES`, `USERS`, `SETTING`, `KH_CORE`, `HDTD_CORE`, `DS_TRICH_NO`, `DOT_TRICH_NO`, `LICH_SU_GIAO_DICH`, `NO_TON_DONG`, `BAO_CAO_THAM_DINH`, `KIEM_TRA_VON`) sẽ được tự động tạo và định dạng chuẩn ngân hàng.

---

### Bước 3: Cập Nhật Phiên Bản Web App Mới (Rất Quan Trọng!)
> [!IMPORTANT]
> Trong Google Apps Script, mỗi khi bạn sửa code, bạn **phải cập nhật Deployment lên Phiên Bản Mới (New Version)** thì Web App URL mới nhận code mới.

1. Ở góc trên bên phải màn hình Apps Script, nhấn **Deploy (Triển khai)** $\to$ Chọn **Manage deployments (Quản lý các bản triển khai)**.
2. Chọn bản triển khai Web App hiện tại của bạn $\to$ Nhấn vào biểu tượng **Chiếc Bút (Chỉnh sửa / Edit)**.
3. Tại dòng **Version (Phiên bản)**:
   - Nhấp vào menu thả xuống và chọn **New version (Phiên bản mới)**.
4. Nhấn **Deploy (Triển khai)**.
5. URL Web App của bạn vẫn được giữ nguyên và nhận 100% các tính năng mới (Đăng nhập, Phân quyền 360°, Tự động khởi tạo CSDL).
