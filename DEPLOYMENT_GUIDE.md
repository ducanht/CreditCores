# HƯỚNG DẪN TRIỂN KHAI TOÀN DIỆN HỆ THỐNG CREDITCORES

## 🏛️ Kiến Trúc Hệ Thống

1. **Local Server (Nội bộ)**: `python_daemon/sync_daemon.py` chạy thường trực trên máy chủ SQL Server local để đồng bộ 2 chiều dữ liệu khách hàng và dư nợ lên Google Sheets.
2. **Cloud Database & API (Google Workspace)**: Google Sheets 9 bảng + Google Apps Script `gas_backend/Code.gs` đóng vai trò REST API xử lý logic nghiệp vụ.
3. **Frontend WebApp (Vercel Hosting)**: Ứng dụng Single Page Application xây dựng bằng React 18 + Vite, tự động triển khai (CI/CD) từ GitHub Repository.

---

## 🚀 1. Triển Khai Backend Google Apps Script

1. Tạo một Google Sheet mới hoặc sử dụng file Google Sheet hiện có.
2. Mở **Tiện ích mở rộng** $\to$ **Apps Script**.
3. Dán toàn bộ mã nguồn từ file [`AutoGeneratGoogleSheets.gs`](./AutoGeneratGoogleSheets.gs) vào editor và chạy hàm `runSetupDirectly` để khởi tạo tự động 9 Sheets.
4. Tạo thêm file script mới `Code.gs` và dán toàn bộ mã nguồn từ [`gas_backend/Code.gs`](./gas_backend/Code.gs).
5. Nhấn **Deploy (Triển khai)** $\to$ **New Deployment (Triển khai mới)**:
   - Loại triển khai: **Web App**.
   - Execute as: **Me (Tôi)**.
   - Who has access: **Anyone (Bất kỳ ai)**.
6. Sao chép đường dẫn **Web App URL** (Dạng `https://script.google.com/macros/s/.../exec`).

---

## 💻 2. Khởi Động Local Python Daemon

1. Di chuyển vào thư mục `python_daemon`:
   ```powershell
   cd "d:\Antigravity Projects\CreditCores\python_daemon"
   pip install -r requirements.txt
   ```
2. Đặt file Service Account `credentials.json` vào thư mục này.
3. Cấu hình `config.json` với thông tin kết nối SQL Server và ID Google Sheet.
4. Chạy Daemon:
   ```powershell
   python sync_daemon.py
   ```

---

## 🌐 3. Đẩy Mã Nguồn Lên GitHub & Auto-Deploy Vercel

### Bước 1: Khởi tạo Git & Đẩy lên GitHub
Mở PowerShell tại thư mục `CreditCores`:
```powershell
cd "d:\Antigravity Projects\CreditCores"
git add .
git commit -m "update: deployment guide and links"
git push
```

Repository GitHub chính thức: **[https://github.com/ducanht/CreditCores](https://github.com/ducanht/CreditCores)**

### Bước 2: Tự động Triển khai trên Vercel
1. Đăng nhập vào [Vercel Dashboard](https://vercel.com).
2. Nhấn **Add New Project** $\to$ Chọn Repository **`ducanht/CreditCores`**.
3. Project Name: **`qtdyentho-credit`** (Tự động cấp domain: **`https://qtdyentho-credit.vercel.app`**).
4. Framework Preset: **Vite**.
5. Root Directory: `./`.
6. *(Tùy chọn)* Trong phần **Environment Variables**, thêm biến:
   - `VITE_GAS_API_URL`: Dán đường dẫn Web App URL của Google Apps Script từ Bước 1.
7. Nhấn **Deploy**.
8. Trong **Project Settings $\to$ Domains**, bạn có thể cấu hình hoặc kiểm tra domain chính thức **`qtdyentho-credit.vercel.app`**.

---

## ⚙️ 4. Kiểm Thử & Vận Hành Trực Tiếp Tại Quầy

1. Khi mở WebApp trên Vercel, vào phân hệ **Cấu hình & Đồng bộ Core** (`Settings`).
2. Dán link GAS Web App URL nếu chưa thiết lập Environment Variable.
3. Nhấn **Gửi Lệnh SYNC_DATA Ngay**.
4. Quan sát Python Daemon tại máy chủ local sẽ tự động truy vấn dữ liệu từ SQL Server và đẩy trực tiếp vào Google Sheets, hệ thống WebApp sẽ cập nhật số liệu ngay lập tức!
