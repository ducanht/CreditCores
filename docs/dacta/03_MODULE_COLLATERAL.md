# 🛡️ ĐẶC TẢ PHÂN HỆ TÀI SẢN THẾ CHẤP & HỢP ĐỒNG BẢO ĐẢM (COLLATERAL)
# Quản Lý Kho Tài Sản Bảo Đảm `TSBD_CORE` & `HDTC_CORE` — QTDND Yên Thọ

---

## 1. MỤC TIÊU VÀ PHẠM VI NGHIỆP VỤ

Phân hệ **Collateral Manager** quản lý toàn bộ tài sản bảo đảm tiền vay của các hợp đồng tín dụng tại QTDND Yên Thọ:
- Quản lý danh mục tài sản thế chấp (`TSBD_CORE`): Bất động sản (Quyền sử dụng đất và tài sản gắn liền với đất), Phương tiện vận tải (Xe ô tô, máy múc), Máy móc thiết bị và Giấy tờ có giá (Sổ tiền gửi tiết kiệm).
- Quản lý danh mục hợp đồng thế chấp (`HDTC_CORE`): Số hợp đồng thế chấp, ngày công chứng, cơ quan công chứng/chứng thực (UBND xã Quý Lộc, UBND xã Yên Thọ, Văn phòng công chứng), tình trạng đăng ký giao dịch bảo đảm (ĐKGDBĐ tại Chi nhánh Văn phòng đăng ký đất đai).
- Liên kết linh hoạt: Một tài sản thế chấp có thể bảo đảm cho một hoặc nhiều Hợp đồng tín dụng (`1 - N`).

---

## 2. KIẾN TRÚC DỮ LIỆU & QUY TRÌNH THẨM ĐỊNH TÀI SẢN

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       COLLATERAL ARCHITECTURE DIAGRAM                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. KHO TÀI SẢN BẢO ĐẢM (`TSBD_CORE`):                                       │
│    - Loại tài sản: Bất động sản / Phương tiện vận tải / Tiền gửi            │
│    - Giấy tờ pháp lý: Số Giấy chứng nhận (Sổ đỏ), Thửa đất, Tờ bản đồ       │
│    - Chủ sở hữu: Chính chủ vay vốn hoặc Bên thứ ba bảo lãnh                 │
│    - Giá trị định giá: Giá thị trường & Giá trị định giá chấp nhận cho vay   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. HỢP ĐỒNG THẾ CHẤP (`HDTC_CORE`):                                         │
│    - Số HĐTC, Ngày ký, Giá trị bảo đảm tối đa                               │
│    - Tình trạng công chứng & Đăng ký Giao dịch bảo đảm                      │
│    - Tình trạng lưu kho hồ sơ gốc: Đang trong két Quỹ / Đang mượn / Đã giải chấp│
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. LIÊN KẾT HỢP ĐỒNG TÍN DỤNG (`HDTD_CORE`):                                │
│    - Tính toán Tỷ lệ Bảo đảm / Dư nợ: LTV (Loan-To-Value)                   │
│    - Cảnh báo khi LTV vượt ngưỡng quy định (> 70% đối với Bất động sản)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. CÁC TÍNH NĂNG CHÍNH CỦA GIAO DIỆN FRONTEND

1. **Bộ Lọc Đa Tiêu Chí**: Lọc theo Loại tài sản, Tình trạng công chứng, Tình trạng ĐKGDBĐ, Xã/Thôn nơi có tài sản.
2. **Modal Chi Tiết Tài Sản**: Cho phép xem nhanh toàn bộ thông tin thửa đất, diện tích, mục đích sử dụng, chủ sở hữu và ảnh chụp hiện trạng.
3. **In Phiếu Nhập/Xuất Kho Giấy Tờ Thế Chấp**: Xuất phiếu bàn giao giấy tờ gốc phục vụ công tác kiểm kê định kỳ của Ban Kiểm soát.
