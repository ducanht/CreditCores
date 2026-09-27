# 📊 ĐẶC TẢ PHÂN HỆ TỔNG QUAN ĐIỀU HÀNH (DASHBOARD)
# Bảng Điều Khiển Tín Dụng & Giám Sát Hoạt Động QTDND Yên Thọ

---

## 1. MỤC TIÊU VÀ PHẠM VI NGHIỆP VỤ

Phân hệ **Tổng Quan (Dashboard)** là trung tâm theo dõi và điều hành hoạt động tín dụng dành cho Ban Giám đốc, Hội đồng quản trị và các Cán bộ tín dụng tại QTDND Yên Thọ:
- **Theo dõi số liệu thời gian thực**: Quy mô tổng dư nợ, số lượng hợp đồng vay, số khách vay, lãi suất bình quân gia quyền và dự thu lãi theo Thông tư 14/2017/TT-NHNN.
- **Sao kê linh hoạt theo mốc ngày chốt (`@denngay`)**: Hỗ trợ xem tức thời tình hình tín dụng tại bất kỳ ngày nào trong lịch sử (`HDTD_CORE_DN`) hoặc chuỗi các ngày cuối mỗi tháng (`HDTD_CORE_ALL`) phục vụ kiểm toán và phân tích xu hướng tăng trưởng.
- **Phân bổ tín dụng theo địa bàn thực tế**: Tự động bóc tách và phân loại theo đơn vị hành chính xã và thôn thực tế từ trường `DiaChi` trong CSDL CoreBanking, hoàn toàn linh hoạt và không bị giới hạn cố định.
- **Cơ cấu hình thức bảo đảm tài sản (TSĐB)**: Thống kê chi tiết 7 hình thức bảo đảm tiền vay từ mã `MaLoaiHD` (đăng ký GDBĐ tại TN&MT, cầm cố TSBĐ khác, tín chấp).
- **Giám sát kết nối CoreBanking**: Theo dõi trạng thái hoạt động 24/7 của Python Daemon kết nối với máy chủ SQL Server CoreBanking NG-eFUND.

---

## 2. KIẾN TRÚC GIAO DIỆN & CÁC KHỐI THÀNH PHẦN (UI COMPONENTS)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DASHBOARD ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. THANH ĐIỀU HÀNH TỔNG QUAN (Header Bar):                                  │
│    - Cán bộ làm việc, vai trò, ngày làm việc GMT+7                          │
│    - Trạng thái kết nối Core SQL, bộ chọn chu kỳ (Tháng, Quý, Năm)          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. CHẾ ĐỘ SỐ LIỆU (Data Mode Switcher):                                     │
│    [Số Liệu Hiện Tại] | [Sao Kê Đến Ngày (@denngay)] | [Đối Sánh Tăng Trưởng]│
│    - Công cụ nhập mốc ngày sao kê (dd/MM/yyyy) & nút trích xuất Core SQL     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. DÃY 4 CHỈ SỐ TÍN DỤNG CỐT LÕI (Metric KPI Cards):                        │
│    [Tổng Dư Nợ Tín Dụng]   [Dư Nợ BQ & Lãi Suất BQ]                         │
│    [Dự Thu Lãi Kỳ Này]     [Ủy Quyền CASA & Nợ Tồn]                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. THANH ĐIỀU HƯỚNG 5 PHÂN HỆ THỐNG KÊ (1-Tap Tabs):                        │
│    [Địa Bàn] [CBTD] [Cơ Cấu Vay & TSĐB] [Top 50 Dư Nợ] [Diễn Biến Tháng]    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. NỘI DUNG PHÂN HỆ CHI TIẾT:                                               │
│    - Tab 1: Biểu đồ so sánh dư nợ các địa bàn + Donut cơ cấu sản phẩm vay   │
│             Danh sách xã & thôn (dạng thẻ hoặc bảng đối soát)               │
│    - Tab 2: Danh mục quản lý của từng Cán bộ tín dụng (CBTD Portfolio)      │
│    - Tab 3: Cơ cấu mục đích vay + Cơ cấu hình thức bảo đảm TSĐB (MaLoaiHD)   │
│             Tiến độ đợt trích nợ gần nhất + Lối tắt tác vụ                  │
│    - Tab 4: Top 50 Dư nợ đến ngày & Top 50 Dư nợ bình quân cuối tháng        │
│    - Tab 5: Biểu đồ chuỗi thời gian diễn biến dư nợ qua các mốc cuối tháng  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. CÁC CHỈ SỐ TÀI CHÍNH CỐT LÕI (FINANCIAL KPIS)

1. **Tổng Dư Nợ Tín Dụng Thực Tế**:
   $$\text{TongDuNo} = \sum \text{DuNo của các HĐTD có TrangThaiHD} \neq \text{'DA\_TAT\_TOAN'}$$
2. **Dư Nợ Bình Quân Hợp Đồng & Thành Viên**:
   $$\text{DuNoBinhQuanHD} = \frac{\text{TongDuNo}}{\text{TongSoHD}}, \quad \text{DuNoBinhQuanTV} = \frac{\text{TongDuNo}}{\text{TongThanhVienVay}}$$
3. **Lãi Suất Bình Quân Gia Quyền**:
   $$\text{LaiSuatBinhQuan} = \frac{\sum (\text{DuNo}_i \times \text{LaiSuat}_i)}{\sum \text{DuNo}_i} \quad (\%/\text{năm})$$
4. **Dự Thu Lãi Kỳ Này (Theo TT 14/2017/TT-NHNN)**:
   $$\text{DuThuLaiThang} = \sum \left( \frac{\text{DuNo}_i \times \text{LaiSuat}_i}{36500} \times \text{SoNgayThucTe} \right)$$
5. **Cơ Cấu Hình Thức Bảo Đảm (TSĐB)**:
   - Nhóm 1: Có bảo đảm bằng BĐS, đăng ký GDBĐ (`THCDBTNMT`, `THBLCDBTNMT`, `NHCDBTNMT`).
   - Nhóm 2: Có TSBĐ khác nhưng không đăng ký GDBĐ (`THCDB`, `NHCDB`).
   - Nhóm 3: Cho vay tín chấp (`THKDB`, `NHKDB`).

---

## 4. TÍCH HỢP LIÊN PHÂN HỆ (CROSS-MODULE INTEGRATION)

- Từ Top 50 Dư nợ và bảng tra cứu trên Dashboard, cán bộ có thể bấm vào khách hàng để mở `CustomerQuickModal` tra cứu ngay hồ sơ thành viên và khế ước.
- Nút lối tắt chuyển thẳng sang các phân hệ: **Khách Hàng 360°**, **Thẩm Định & Định Giá TSĐB**, **Khởi Tạo Đợt Trích Nợ**, **Đối Soát Kết Quả Core**, và **Kho Biểu Mẫu Tín Dụng**.
- Tích hợp modal **Trích Xuất Từ Core SQL** (`ExtractAsOfModal`) cho phép đẩy lệnh trích xuất với mốc `@denngay` vào hàng đợi `SETTING` để máy chủ Python Daemon xử lý tự động 24/7.
