# 🚀 HƯỚNG DẪN CẬP NHẬT MÃ NGUỒN GOOGLE APPS SCRIPT CHO PROJECT MỚI
# Script ID: `1-S-5ukEamyQeA3c6x5UrZLnWySPgqLhg4nawy21-AHZ5vjYdz8n3Ky2W`

## 🔗 Liên Kết Dự Án
- **Google Sheets CSDL (12 Bảng)**: [https://docs.google.com/spreadsheets/d/1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw/edit](https://docs.google.com/spreadsheets/d/1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw/edit)
- **Google Apps Script Project Mới**: [https://script.google.com/u/0/home/projects/1-S-5ukEamyQeA3c6x5UrZLnWySPgqLhg4nawy21-AHZ5vjYdz8n3Ky2W/edit](https://script.google.com/u/0/home/projects/1-S-5ukEamyQeA3c6x5UrZLnWySPgqLhg4nawy21-AHZ5vjYdz8n3Ky2W/edit)

---

## 📋 CÁC BƯỚC CẬP NHẬT NHANH (CHỈ MẤT 1 PHÚT)

### Cách 1: Sử Dụng File Bundle Tổng Hợp Duy Nhất (Khuyên Dùng - Siêu Nhanh)
Chúng tôi đã đóng gói toàn bộ 17 tệp mã nguồn backend vào **1 tệp duy nhất**:
👉 [`gas_backend/CreditCores_GAS_ALL_IN_ONE.gs`](./CreditCores_GAS_ALL_IN_ONE.gs)

1. Mở dự án Apps Script: [https://script.google.com/u/0/home/projects/1-S-5ukEamyQeA3c6x5UrZLnWySPgqLhg4nawy21-AHZ5vjYdz8n3Ky2W/edit](https://script.google.com/u/0/home/projects/1-S-5ukEamyQeA3c6x5UrZLnWySPgqLhg4nawy21-AHZ5vjYdz8n3Ky2W/edit)
2. Chọn file `Code.gs` (hoặc tạo 1 file bất kỳ trong script).
3. Copy toàn bộ nội dung file [`gas_backend/CreditCores_GAS_ALL_IN_ONE.gs`](./CreditCores_GAS_ALL_IN_ONE.gs) dán vào editor.
4. Bấm **Ctrl + S (Lưu)**.

---

### Bước 2: Kích Hoạt Tự Động Khởi Tạo 12 Bảng CSDL Trên Google Sheets
1. Trên thanh công cụ Apps Script Editor, tại ô chọn hàm cần chạy:
   - Chọn hàm: **`runSetupDirectly`**
2. Nhấn nút **▶ Run (Chạy)**.
3. Khi Google yêu cầu cấp quyền (*Review permissions*), bấm **Cho phép (Allow)**.
4. **Kết quả**: Toàn bộ **12 Bảng CSDL** (`ROLES`, `USERS`, `SETTING`, `KH_CORE`, `HDTD_CORE`, `DANG_KY_TRICH_NO`, `DOT_TRICH_NO`, `CHI_TIET_TRICH_NO`, `NO_TON_DONG`, `THAM_DINH_TD`, `KIEM_TRA_VON`, `CAU_HINH_BIEU_MAU`) sẽ lập tức được sinh ra trên Google Sheet.

---

### Bước 3: Triển Khai Web App (Deploy)
1. Ở góc trên bên phải màn hình Apps Script, nhấn nút xanh **Deploy (Triển khai)** $\to$ Chọn **New deployment (Triển khai mới)**.
2. Tại mục bánh răng (Select type), chọn **Web app**.
3. Điền thông tin:
   - **Description**: `CreditCores WebApp v1.3`
   - **Execute as**: `Me (Tôi)`
   - **Who has access**: `Anyone (Bất kỳ ai)`
4. Nhấn **Deploy**.
5. Copy **Web app URL** nhận được để kết nối vào ứng dụng!

---

### Cách 2: Tự Động Push Bằng Clasp CLI (Dành cho Lập trình viên)
Nếu muốn đồng bộ tự động từ Terminal bằng lệnh `clasp`:
1. Mở PowerShell tại `d:\Antigravity Projects\CreditCores`.
2. Chạy lệnh đăng nhập Google 1 lần:
   ```powershell
   npx clasp login
   ```
3. Sau khi đăng nhập, chạy lệnh đẩy mã nguồn:
   ```powershell
   npm run clasp-push
   ```
