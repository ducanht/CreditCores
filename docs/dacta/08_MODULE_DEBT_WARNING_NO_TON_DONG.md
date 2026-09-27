# ⚠️ ĐẶC TẢ PHÂN HỆ CẢNH BÁO NỢ TỒN ĐỌNG (DEBT WARNING)
# Sổ Theo Dõi Nợ Chưa Thu Đủ, Phân Loại Kỳ & Đôn Đốc Thu Hồi — QTDND Yên Thọ

---

## 1. MỤC TIÊU VÀ PHẠM VI NGHIỆP VỤ

Phân hệ **Debt Warning (Sổ Theo Dõi Nợ Tồn Đọng)** quản lý toàn bộ các nghĩa vụ nợ (lãi vay hoặc nợ gốc) chưa được thanh toán đầy đủ sau các kỳ trích nợ tự động hoặc thu nợ định kỳ:
- **Tập trung nợ đọng tự động**: Tự động tiếp nhận các món nợ từ phân hệ Đối soát khi đợt trích nợ bị thất bại hoặc chỉ trích được một phần do tài khoản CASA thiếu số dư.
- **Phân loại mức độ rủi ro**:
  1. *Nợ 1 kỳ (Kỳ gần nhất)*: Khách hàng tạm thời quên nộp tiền vào tài khoản hoặc chậm lương, rủi ro thấp.
  2. *Nợ 2 kỳ liên tiếp*: Cảnh báo rủi ro tăng cao, cần can thiệp trực tiếp từ Cán bộ tín dụng.
  3. *Nợ tồn đọng kéo dài (> 2 kỳ)*: Nguy cơ chuyển nhóm nợ xấu (Nhóm 2 hoặc Nhóm 3 theo TT 11/2021/TT-NHNN), kích hoạt quy trình xử lý tài sản bảo đảm.
- **Tự động gắn cán bộ phụ trách**: Phân công rõ ràng CBTD quản lý địa bàn (Quý Lộc, Yên Thọ, Yên Lâm) chịu trách nhiệm đôn đốc thu hồi.
- **Dồn nợ vào đợt trích kế tiếp**: Khi lập đợt trích nợ mới, số tiền nợ tồn này sẽ tự động được cộng vào tổng số tiền phải thu để trích bù.

---

## 2. KIẾN TRÚC GIAO DIỆN & CÁC THÀNH PHẦN (UI COMPONENTS)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEBT WARNING UI ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. HEADER CẢNH BÁO KHẨN CẤP (Urgent Alert Banner):                          │
│    - Tổng số tiền nợ tồn đọng cần đôn đốc (Ví dụ: 135.450.000 VNĐ)          │
│    - Tổng số món vay và tỷ lệ hoàn thành thu nợ                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. THANH BỘ LỌC THÔNG MINH (Smart Debt Filters):                            │
│    - Lọc theo Kỳ phát sinh (Tất cả / Kỳ 1 / Kỳ 2 / Kỳ 3)                    │
│    - Lọc theo Cán bộ tín dụng phụ trách                                     │
│    - Lọc theo Địa bàn Xã/Thôn cư trú                                        │
│    - Ô tìm kiếm nhanh: Tên khách hàng, Mã KH, Số HĐTD                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. BẢNG SỔ THEO DÕI NỢ TỒN ĐỌNG (Debt Monitoring Table):                    │
│    - Cột: Mã KH, Họ tên, Số HĐTD, Số TK CASA, Kỳ phát sinh, Gốc tồn, Lãi tồn,│
│      Tổng nợ tồn, Số kỳ nợ, CBTD phụ trách, Trạng thái đôn đốc               │
│    - Nút Gọi điện thoại nhanh (One-tap call trên mobile)                    │
│    - Nút Xem chi tiết 360° khách hàng                                       │
│    - Nút Ghi nhật ký đôn đốc thu nợ                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. MODAL GHI NHẬT KÝ ĐÔN ĐỐC THU NỢ:                                        │
│    - Ngày liên hệ, Hình thức đôn đốc (Gọi điện / Đến nhà / Gửi thông báo)   │
│    - Lời hứa của khách hàng (Ngày hẹn nộp tiền)                             │
│    - Kết quả xử lý                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. CƠ CHẾ KẾT NỐI VỚI LẬP ĐỢT TRÍCH NỢ TIẾP THEO

- Bảng `NO_TON_DONG` đóng vai trò là kho dữ liệu đầu vào cho bước Lập đợt trích nợ mới (`DebitBatchCreateModal`).
- Khi modal quét khách hàng đến hạn, hàm `calculateCustomerBatchInterest` tự động tra cứu xem khách hàng có nợ tồn tại `debtWarnings` hay không.
- Nếu có, số tiền nợ tồn sẽ hiển thị rõ ràng ở cột **"Nợ Tồn Kỳ Trước"** và được tính gộp vào **"Tổng Phải Thu"**, đảm bảo Quỹ không bị thất thoát tiền lãi và gốc của các kỳ trước.
