# 🔄 ĐẶC TẢ PHÂN HỆ ĐỐI SOÁT & KẾT QUẢ TRÍCH NỢ (RECONCILIATION)
# Xử Lý File Sao Kê CoreBanking, Phân Loại Trạng Thái & Khóa Đợt — QTDND Yên Thọ

---

## 1. MỤC TIÊU VÀ PHẠM VI NGHIỆP VỤ

Phân hệ **Đối Soát & Kết Quả** (`Reconciliation`) là mắt xích quyết định tính chính xác của dữ liệu tài chính sau khi lệnh trích nợ được đẩy vào hệ thống CoreBanking hoặc Ngân hàng Hợp tác xã (Co-opBank):
- **Tiếp nhận kết quả trích nợ**: Nhập file sao kê kết quả (.csv, .xlsx) hoặc cập nhật trực tiếp trạng thái từng món vay.
- **Khớp dữ liệu tự động (Auto-Reconcile)**: Đối chiếu Số tài khoản CASA, Mã hợp đồng tín dụng và Số tiền trích nợ giữa kế hoạch trích nợ và thực tế đã ghi có/ghi nợ trên CoreBanking.
- **Phân loại 3 trạng thái giao dịch**:
  1. `THANH_CONG`: Trích đủ 100% số tiền gốc và lãi dự kiến.
  2. `TRICH_MOT_PHAN`: Khách hàng không đủ số dư trong tài khoản, hệ thống chỉ cắt nợ được một phần (ưu tiên thu nợ lãi trước, nợ gốc sau).
  3. `THAT_BAI`: Số dư bằng 0, tài khoản đóng/tạm khóa hoặc giao dịch bị từ chối.
- **Chốt sổ đợt trích nợ (`DA_CHOT`)**: Khóa bất biến đợt trích nợ, tự động chuyển số tiền còn thiếu vào Sổ nợ tồn đọng (`NO_TON_DONG`).

---

## 2. KIẾN TRÚC GIAO DIỆN & CÁC THÀNH PHẦN (UI ARCHITECTURE)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       RECONCILIATION UI ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. THANH CHỌN ĐỢT TRÍCH NỢ & TIẾN TRÌNH:                                    │
│    - Chọn Đợt trích nợ (Ví dụ: `DOT_202609_K2`)                             │
│    - Hiển thị ngày trích, tổng số món và tổng tiền phải thu                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. KHỐI THỐNG KÊ KẾT QUẢ ĐỐI SOÁT (Reconcile Summary Cards):                │
│    [Tổng Phải Thu]     [Đã Trích Thành Công]  [Trích Một Phần] [Thất Bại]   │
│    2.450.000.000đ      2.320.000.000đ (94.7%) 80.000.000đ      50.000.000đ  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. THANH CÔNG CỤ TẢI FILE SAO KÊ & BỘ LỌC KẾT QUẢ:                          │
│    - Nút "Tải file sao kê CoreBanking" (kéo thả file .csv, .xlsx)           │
│    - Bộ lọc nhanh: Tất cả / Thành công / Trích một phần / Thất bại          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. BẢNG CHI TIẾT ĐỐI SOÁT TỪNG MÓN VAY (Editable Data Table):               │
│    - Cột: Mã KH, Tên KH, Số HĐTD, Số TK CASA, Phải thu, Đã trích, Còn lại,  │
│      Kết quả, Lý do lỗi, Mã giao dịch Core                                  │
│    - Cho phép Kế toán viên chỉnh sửa thủ công số tiền thực trích nếu có     │
│      sai lệch do giao dịch tiền mặt tại quầy                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. NÚT HÀNH ĐỘNG "CHỐT SỔ ĐỢT TRÍCH NỢ":                                    │
│    - Bọc LockService an toàn atomicity                                      │
│    - Chuyển toàn bộ các món còn thiếu sang Sổ nợ tồn đọng                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. THUẬT TOÁN ĐỐI SOÁT TỰ ĐỘNG (AUTO-RECONCILE LOGIC)

1. Khi người dùng tải lên file sao kê từ CoreBanking, hệ thống đọc dữ liệu và tạo Map tra cứu theo `soTK` hoặc `soHDTD`.
2. Duyệt qua từng bản ghi trong đợt trích nợ hiện tại:
   - Nếu `soTienCore >= phaiThu`: Đánh dấu `ketQua = 'THANH_CONG'`, `daTrich = phaiThu`, `conLai = 0`.
   - Nếu `0 < soTienCore < phaiThu`: Đánh dấu `ketQua = 'TRICH_MOT_PHAN'`, `daTrich = soTienCore`, `conLai = phaiThu - soTienCore`, `lyDoLoi = 'Không đủ số dư'`.
   - Nếu `soTienCore == 0` hoặc không có giao dịch: Đánh dấu `ketQua = 'THAT_BAI'`, `daTrich = 0`, `conLai = phaiThu`, `lyDoLoi = 'Tài khoản không đủ số dư'`.
3. Hiển thị bảng so sánh đối soát trước khi người dùng nhấn nút Xác nhận lưu kết quả.
