# 📊 ĐẶC TẢ PHÂN HỆ: SAO KÊ TÍN DỤNG (CREDIT STATEMENT)
# Hệ Thống Quản Lý Tín Dụng & Trích Nợ CreditCores — QTDND Yên Thọ

---

## 1. TỔNG QUAN PHÂN HỆ & VỊ TRÍ TRONG HỆ THỐNG

Phân hệ **Sao Kê Tín Dụng** (`credit_statement`) là trung tâm dữ liệu và phân tích đa chiều độc lập, được tách riêng từ màn hình Tổng quan nhằm phục vụ công tác kiểm toán, sao kê lịch sử, theo dõi tăng trưởng và quản trị an toàn vốn.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    KIẾN TRÚC PHÂN HỆ SAO KÊ TÍN DỤNG                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  5 TAB CHỨC NĂNG CHUẨN NGÂN HÀNG:                                           │
│  1. [as_of]     Đến ngày   : Snapshot tại mốc @denngay (HDTD_CORE_DN)       │
│  2. [monthly]   Theo tháng : Chuỗi sao kê cuối kỳ & Biểu đồ so sánh MoM     │
│  3. [yearly]    Theo năm   : Tổng hợp chuỗi năm tài chính & So sánh YoY     │
│  4. [top_50]    Top 50     : Quản trị tập trung vốn (Đến ngày & Bình quân)  │
│  5. [structure] Cơ cấu vay : 7 Hình thức bảo đảm TSĐB & Sản phẩm vay        │
├─────────────────────────────────────────────────────────────────────────────┤
│  QUY TẮC THỜI GIAN PHỔ QUÁT (UNIVERSAL TIME SCOPE):                         │
│  Mọi báo cáo đều hỗ trợ lựa chọn: Đến ngày | Theo tháng | Theo năm          │
├─────────────────────────────────────────────────────────────────────────────┤
│  TIÊU CHUẨN HIỂN THỊ:                                                       │
│  - Bỏ 100% text kết nối CSDL, IP máy chủ khỏi Frontend                      │
│  - Chỉ hiển thị icon nhấp nháy tình trạng trực tuyến (pulse-online)         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. ĐẶC TẢ CHI TIẾT 5 TAB CHỨC NĂNG

### 2.1. Tab "Đến ngày" (`as_of`)
- **Mục đích**: Tra cứu và xuất danh sách toàn bộ dư nợ tín dụng chốt đến một ngày cụ thể bất kỳ thông qua tham số `@denngay` (từ sheet `HDTD_CORE_DN` hoặc lệnh SQL trực tiếp).
- **Thành phần giao diện**:
  - **Bộ chọn ngày Datepicker**: Chuẩn múi giờ Việt Nam GMT+7 (`dd/mm/yyyy`).
  - **Bộ lọc đa tiêu chí**:
    - Lọc theo Địa bàn xã (tự động trích xuất danh sách xã động từ CSDL, không cố định).
    - Lọc theo Cán bộ tín dụng phụ trách.
    - Tìm kiếm tức thì: Họ tên, Số HĐTD, Số CCCD, Địa chỉ.
  - **4 Thẻ tóm tắt nhanh**:
    - Tổng Dư Nợ Đến Ngày (VNĐ).
    - Tổng Tiền Vay Ban Đầu (VNĐ).
    - Số Lượng Hợp Đồng (HĐ).
    - Số Thành Viên Vay Vốn (TV).
  - **Bảng chi tiết hợp đồng tín dụng**:
    - STT, Số HĐTD, Mã KH, Họ tên, Địa bàn, Tiền vay, Dư nợ hiện tại, Lãi suất, Ngày vay, Đến hạn, CBTD phụ trách.
    - Hỗ trợ phân trang 15 dòng/trang, nhấp chuột để mở nhanh hồ sơ khách hàng 360°.
  - **Thao tác dữ liệu**:
    - Nút **Xuất CSV** (hỗ trợ tiếng Việt UTF-8 có BOM mở trực tiếp trên Excel).
    - Nút **Trích xuất Core SQL** (mở modal kích hoạt daemon nếu cần chốt mốc ngày mới).

### 2.2. Tab "Theo tháng" (`monthly`)
- **Mục đích**: Phân tích diễn biến dư nợ và so sánh đa chỉ số qua chuỗi các tháng cuối kỳ trong năm từ kho lưu trữ `HDTD_CORE_ALL`.
- **Biểu đồ so sánh các chỉ số theo tháng**:
  - **Biểu đồ Cột/Đường Tăng Trưởng**: Trực quan hóa dư nợ từ Tháng 1 đến Tháng 12, tự động highlight tháng có dư nợ cao nhất và thấp nhất.
  - **Thẻ Đối Soát Tăng Trưởng Liên Tháng (MoM)**:
    - Chênh lệch Dư nợ ($\Delta$ DuNo) và % Tăng trưởng MoM.
    - Biến động số lượng Hợp đồng ($\Delta$ HĐ).
    - Biến động số lượng Thành viên vay ($\Delta$ TV).
    - Dư nợ bình quân trên từng hợp đồng và khách hàng.
  - **Bảng số liệu tổng hợp các mốc tháng**: Mốc ngày, Tổng dư nợ, Số HĐ, Số KH, Dư nợ BQ/TV, % Tăng trưởng.

### 2.3. Tab "Theo năm" (`yearly`)
- **Mục đích**: Tổng hợp số liệu tín dụng theo năm tài chính (2024, 2025, 2026...).
- **Chỉ số so sánh năm (YoY)**:
  - Tăng trưởng quy mô dư nợ qua các năm so với chỉ tiêu NHNN giao.
  - Biến động quy mô khách hàng vay và quy mô hợp đồng.
  - Tỷ lệ bao phủ ủy quyền trích nợ tự động CASA qua từng năm.

### 2.4. Tab "Top 50" (`top_50`)
- **Mục đích**: Quản trị tập trung tín dụng và giám sát 50 khách hàng có dư nợ lớn nhất toàn Quỹ.
- **Tùy chọn thời gian**:
  - **Đến ngày**: 50 khách hàng có dư nợ lớn nhất tại mốc ngày chốt (`HDTD_CORE_DN`).
  - **Theo tháng (Bình quân)**: Top 50 khách hàng theo dư nợ bình quân các tháng cuối kỳ (`HDTD_CORE_ALL`).
  - **Theo năm**: Top 50 lũy kế năm tài chính.
- **Chỉ số an toàn**:
  - Tổng dư nợ nhóm Top 50.
  - Tỷ trọng tập trung dư nợ (% Top 50 / Tổng dư nợ toàn Quỹ).
  - Khách hàng có dư nợ cao nhất (Top 1).
  - Cảnh báo vượt ngưỡng tập trung rủi ro theo quy định của NHNN.
  - Tìm kiếm nhanh theo tên/CCCD và nút xuất file CSV riêng cho nhóm Top 50.

### 2.5. Tab "Cơ cấu vay" (`structure`)
- **Mục đích**: Phân tích cơ cấu hình thức bảo đảm tiền vay và cơ cấu theo sản phẩm/mục đích vay vốn.
- **Tùy chọn thời gian**: Hỗ trợ xem Đến ngày, Theo tháng hoặc Theo năm.
- **Nội dung phân tích**:
  - **7 Hình thức bảo đảm TSĐB** (`MaLoaiHD`):
    1. Vay thế chấp Bất động sản đã đăng ký giao dịch bảo đảm (TNMT / GĐBĐ).
    2. Vay cầm cố Sổ tiết kiệm / Giấy tờ có giá.
    3. Vay có bên thứ ba bảo lãnh.
    4. Vay tín chấp theo lương / không tài sản bảo đảm.
    5. Vay bằng phương tiện vận tải / tài sản hình thành từ vốn vay.
    6. Vay bảo đảm bằng tài sản khác.
    7. Khoản vay hỗn hợp nhiều hình thức.
  - **Cơ cấu theo Sản phẩm / Mục đích vay**: Nông nghiệp nông thôn, Sản xuất kinh doanh, Tiêu dùng đời sống.
  - Tỷ lệ TSĐB có công chứng/đăng ký GĐBĐ so với tổng dư nợ.

---

## 3. TIÊU CHUẨN AN TOÀN & BẢO MẬT GIAO DIỆN (ZERO DATA LEAKAGE)

1. **Triệt tiêu thông tin kết nối CSDL**:
   - Toàn bộ chuỗi kết nối, địa chỉ IP máy chủ SQL Server, đường dẫn daemon và tên các bảng CSDL nội bộ được gỡ bỏ 100% khỏi giao diện người dùng.
   - Trạng thái kết nối được biểu thị duy nhất bằng một biểu tượng chấm xanh nhấp nháy (`pulse-online`) với tooltip `"Hệ thống trực tuyến"`.
2. **Quyền truy cập (RBAC 360°)**:
   - Module `credit_statement` được mở mặc định cho các vai trò: `ADMIN`, `CBTD`, `KETOAN`, `BKS`, `LANHDAO`.
3. **Hiệu năng & Dynamic Import**:
   - Component được nạp qua `lazyWithRetry` và đóng gói thành bundle riêng (`CreditStatement-BL3o5En_.js`, dung lượng chỉ 55.2 kB / 13.6 kB gzip).
