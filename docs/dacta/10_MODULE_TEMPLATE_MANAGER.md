# 📑 ĐẶC TẢ PHÂN HỆ QUẢN LÝ BIỂU MẪU & TRỘN TÀI LIỆU (TEMPLATE MANAGER)
# Google Docs Mail-Merge Engine, Thẻ Biến Tự Động & Xuất Hồ Sơ — QTDND Yên Thọ

---

## 1. MỤC TIÊU VÀ PHẠM VI NGHIỆP VỤ

Phân hệ **Template Manager** giải quyết bài toán tự động hóa soạn thảo hồ sơ tín dụng, hợp đồng thế chấp và văn bản giao dịch:
- **Quản lý kho biểu mẫu Google Docs**: Lưu trữ các file mẫu Google Docs chuẩn mực (Hợp đồng cho vay, Hợp đồng thế chấp quyền sử dụng đất, Hợp đồng thế chấp xe, Tờ trình thẩm định tín dụng, Giấy đăng ký thỏa thuận trích nợ tự động CASA, Biên bản kiểm tra sử dụng vốn, Bảng kê trích nợ).
- **Động cơ Mail-Merge thời gian thực (Docs Mail-Merge Engine)**: Tự động trích xuất thông tin khách hàng, số tài khoản CASA, số tiền vay, lãi suất, danh mục tài sản thế chấp và ngày giải ngân từ CSDL để thay thế các thẻ biến `{{THE_BIEN}}` trên Google Docs.
- **Xuất tệp đa định dạng**: Tạo file Microsoft Word (.docx) hoặc file PDF đóng dấu điện tử tải về máy tính của cán bộ tín dụng chỉ trong 2-3 giây.

---

## 2. BẢNG DANH MỤC THẺ BIẾN CHUẨN HÓA (PLACEHOLDER MAPPING)

Hệ thống định nghĩa danh mục thẻ biến tự động chuẩn mực:

| Thẻ Biến | Ý Nghĩa Nghiệp Vụ | Nguồn Dữ Liệu | Ví Dụ Giá Trị |
| :--- | :--- | :--- | :--- |
| `{{HO_TEN}}` | Họ và tên khách hàng | `KH_CORE.HoTen` | NGUYỄN VĂN AN |
| `{{CCCD}}` | Số CCCD/CMND | `KH_CORE.CCCD` | 038092001234 |
| `{{NGAY_CAP_CCCD}}` | Ngày cấp CCCD | `KH_CORE.NgayCap` | 15/04/2021 |
| `{{NOI_CAP_CCCD}}` | Nơi cấp CCCD | `KH_CORE.NoiCap` | Cục CSQLHC về TTXH |
| `{{DIA_CHI}}` | Địa chỉ cư trú | `KH_CORE.DiaChi` | Thôn Tân Lộc, xã Quý Lộc |
| `{{SO_HDTD}}` | Số Hợp đồng tín dụng | `HDTD_CORE.SoHDTD` | 2026/088/HĐTD |
| `{{SO_TIEN_VAY}}` | Số tiền vay bằng số | `HDTD_CORE.SoTienVay` | 200.000.000 VNĐ |
| `{{SO_TIEN_CHU}}` | Số tiền vay bằng chữ | Hàm đọc số tiếng Việt | Hai trăm triệu đồng |
| `{{LAI_SUAT}}` | Lãi suất cho vay (%/năm) | `HDTD_CORE.LaiSuat` | 10.5%/năm |
| `{{THOI_HAN_VAY}}` | Thời hạn cho vay (tháng) | `HDTD_CORE.ThoiHan` | 12 tháng |
| `{{SO_TK_CASA}}` | Số tài khoản CASA trích nợ | `THOA_THUAN.SoTK` | 0401000123456 |
| `{{KY_TRICH_NO}}` | Ngày trích nợ định kỳ | `THOA_THUAN.KyTrich` | Ngày 15 hàng tháng |
| `{{TEN_CBTD}}` | Tên Cán bộ tín dụng phụ trách| `KH_CORE.Ten_CBTD` | Lê Văn Hùng |

---

## 3. QUY TRÌNH TRỘN VÀ XUẤT HỒ SƠ 1-CHẠM (ONE-CLICK PACKAGE)

- Tính năng **"Gói Hồ Sơ Tín Dụng Hoàn Chỉnh" (`ContractPackageModal.jsx`)**:
  - Cán bộ tín dụng chỉ cần chọn một Hợp đồng tín dụng.
  - Hệ thống tự động kích hoạt trộn toàn bộ 5 biểu mẫu cùng một lúc:
    1. Đơn đề nghị vay vốn kiêm phương án trả nợ.
    2. Hợp đồng tín dụng.
    3. Hợp đồng thế chấp tài sản bảo đảm.
    4. Thỏa thuận ủy quyền trích nợ tự động tài khoản CASA.
    5. Giấy nhận nợ và khế ước nhận nợ.
  - Tải về một tệp nén duy nhất sẵn sàng in ấn cho khách hàng ký kết.
