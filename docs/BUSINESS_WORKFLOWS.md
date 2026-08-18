# QUY TRÌNH & LUỒNG NGHIỆP VỤ HỆ THỐNG (BUSINESS WORKFLOWS)
# CreditCores - Core Credit & Auto-Debit Automation

Tài liệu này mô tả chi tiết các luồng quy trình nghiệp vụ cốt lõi trong hoạt động Tín dụng và Trích nợ tự động của Quỹ Tín Dụng Nhân Dân.

---

## 🧭 1. Tổng Quan Các Luồng Nghiệp Vụ

```
[ 1. ĐỒNG BỘ CORE ] ──► [ 2. TRA CỨU KH 360° ] ──► [ 3. THẨM ĐỊNH TÍN DỤNG & LTV ]
                               │                               │
                               ▼                               ▼
                      [ 4. ĐĂNG KÝ TRÍCH NỢ ]        [ 5. KIỂM TRA SỬ DỤNG VỐN ]
                               │
                               ▼
                      [ 6. LẬP ĐỢT TRÍCH NỢ ] (Kỳ 05, 15, 25)
                               │
                               ▼
                      [ 7. ĐỐI SOÁT KẾT QUẢ ]
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
       (Trích nợ Đủ 100%)            (Trích 1 phần / Thất bại)
                │                             │
                ▼                             ▼
       [ HẠCH TOÁN THU NỢ ]          [ 8. SỔ NỢ TỒN ĐỌNG ]
                                              │
                                              ▼
                                     (Cộng dồn vào đợt sau)
```

---

## 🔄 2. Chi Tiết Từng Luồng Nghiệp Vụ

### Luồng 1: Đồng Bộ Dữ Liệu SQL Server Nội Bộ 2 Chiều
1. **Khởi tạo**: Cán bộ bấm nút **"Đồng bộ SQL"** trên thanh Header hoặc hệ thống kích hoạt theo lịch định kỳ.
2. **Ghi hàng đợi**: WebApp gửi request `triggerSqlSync` $\to$ Ghi nhận `COMMAND='SYNC_DATA'` và `STATUS='PENDING'` tại bảng `SETTING`.
3. **Thực thi Daemon**: `python_daemon/sync_daemon.py` phát hiện cờ $\to$ Đổi `STATUS='PROCESSING'` $\to$ Truy vấn SQL Server CoreBanking $\to$ Đẩy dữ liệu vào `KH_CORE` và `HDTD_CORE` $\to$ Cập nhật `STATUS='SUCCESS'`.
4. **Phản hồi**: WebApp tự động hiển thị trạng thái xanh `Daemon: SUCCESS` kèm tổng số dòng đã đồng bộ.

---

### Luồng 2: Tra Cứu Khách Hàng & Hợp Đồng 360°
1. **Tìm kiếm**: Cán bộ nhập Mã KH, Tên, CCCD hoặc Số tài khoản.
2. **Hợp nhất dữ liệu**: Hệ thống truy xuất đồng thời:
   - Thông tin cá nhân & Số điện thoại.
   - Tư cách thành viên QTDND (Mã TV, Sổ cổ phần, Tổng vốn góp).
   - Danh sách toàn bộ các khế ước dư nợ, ngày vay, ngày đáo hạn, lãi suất và lịch sử trả nợ.
3. **Liên kết nghiệp vụ**: Từ màn hình 360°, cán bộ có thể chuyển nhanh sang:
   - *Lập hồ sơ thẩm định mới*.
   - *Lập biên bản kiểm tra sử dụng vốn*.
   - *Đăng ký dịch vụ trích nợ tự động*.

---

### Luồng 3: Thẩm Định Tín Dụng & Định Giá Tài Sản Đảm Bảo (TSĐB)
1. **Nhập liệu hồ sơ**: Cán bộ tín dụng nhập:
   - Số tiền đề xuất vay, thời hạn, thu nhập bình quân và xếp hạng tín dụng CIC.
   - Thông tin TSĐB: Loại tài sản (Sổ đỏ, Nhà ở...), Chủ sở hữu, Mô tả số thửa/tờ bản đồ, Giá trị định giá.
2. **Tính toán tự động**:
   - Tỷ lệ LTV: $\text{LTV} = \frac{\text{Số tiền duyệt vay}}{\text{Giá trị TSĐB}} \times 100\%$.
   - Cảnh báo an toàn: Nếu $\text{LTV} > 75\%$, hệ thống cảnh báo vượt ngưỡng rủi ro cho vay.
3. **Đính kèm tài liệu**: Dán link thư mục Google Drive chứa ảnh chụp giấy chứng nhận QSDĐ và ảnh thực địa.
4. **Lưu trữ**: Ghi nhận vào bảng `BAO_CAO_THAM_DINH`.

---

### Luồng 4: Kiểm Tra Sử Dụng Vốn Sau Giải Ngân
1. **Thời điểm thực hiện**: Trong vòng 30 ngày kể từ ngày giải ngân (hoặc định kỳ 6 tháng/lần).
2. **Nội dung kiểm tra**:
   - Hình thức kiểm tra: Thực địa tại nơi kinh doanh/nhà ở hoặc Kiểm tra hóa đơn chứng từ mua bán.
   - Đánh giá: *Đúng mục đích* / *Sai mục đích một phần* / *Sai mục đích*.
   - Mức độ rủi ro: *Thấp* / *Trung bình* / *Cao*.
3. **Lưu trữ**: Ghi vào bảng `KIEM_TRA_VON` để phục vụ công tác thanh tra, kiểm soát nội bộ.

---

### Luồng 5: Đăng Ký & Quản Lý Dịch Vụ Trích Nợ Tự Động
1. **Thỏa thuận ủy quyền**: Khách hàng ký Giấy ủy quyền trích nợ tự động từ tài khoản tiền gửi thanh toán (CASA).
2. **Phân loại kỳ trích**: Khách hàng được phân vào 1 trong 3 kỳ trích cố định hàng tháng:
   - **Kỳ 1**: Thu nợ vào **ngày 05** hàng tháng.
   - **Kỳ 2**: Thu nợ vào **ngày 15** hàng tháng.
   - **Kỳ 3**: Thu nợ vào **ngày 25** hàng tháng.
3. **Lưu trữ**: Ghi nhận trạng thái `Hieu luc` vào bảng `DS_TRICH_NO`.

---

### Luồng 6: Khởi Tạo & Chạy Đợt Trích Nợ
1. **Chọn kỳ**: Kế toán viên chọn Tháng (`202608`) và Kỳ trích (`Kỳ 1` / `Kỳ 2` / `Kỳ 3`).
2. **Thuật toán tổng hợp số tiền phải thu**:
   - Lọc tất cả khách hàng có `DS_TRICH_NO.KyTrich == Kỳ đã chọn` và `TrangThai == 'Hieu luc'`.
   - Với mỗi khế ước của khách hàng:
     $$\text{Phải Thu Lãi} = \text{Dư Nợ} \times \left(\frac{\text{Lãi Suất}}{100 \times 12}\right)$$
     $$\text{Tổng Phải Thu} = \text{Phải Thu Lãi} + \text{Gốc Đến Hạn} + \text{Nợ Tồn Kỳ Trước}$$
3. **Xuất lệnh**:
   - Ghi nhận đợt trích vào `DOT_TRICH_NO`.
   - Sinh chi tiết các lệnh trích vào `LICH_SU_GIAO_DICH` với trạng thái `CHO_TRICH`.
   - Xuất file danh sách gửi CoreBanking xử lý cắt nợ tự động.

---

### Luồng 7: Đối Soát Kết Quả & Xử Lý Nợ Tồn Đọng
1. **Nạp kết quả**: Kế toán nạp kết quả thực hiện từ CoreBanking vào hệ thống.
2. **Phân loại 3 trạng thái**:
   - 🟢 **`THANH_CONG`** (Đã trích đủ 100%): `ConNo = 0`.
   - 🟡 **`TRICH_MOT_PHAN`** (Tài khoản chỉ đủ trừ một phần): `0 < DaTrich < TongPhaiThu`.
   - 🔴 **`THAT_BAI`** (Không có số dư / Tài khoản phong tỏa): `DaTrich = 0`.
3. **Tự động chuyển vào Sổ nợ tồn đọng**:
   - Mọi khoản `ConNo > 0` tự động được ghi nhận vào bảng `NO_TON_DONG` với trạng thái `CHUA_THU`.
   - Khi chạy đợt trích nợ của tháng tiếp theo, số nợ tồn này được **tự động cộng dồn vào `NoTonTruoc`** để ưu tiên thu hồi trước.

---

### Luồng 8: Phân Quyền 360° & Quản Lý Người Dùng
1. **Ma trận nhóm vai trò (`ROLES`)**: Admin tick/untick từng phân hệ cho từng nhóm (`ADMIN`, `CBTD`, `KETOAN`, `LANHDAO`...).
2. **Phân quyền cá nhân hóa (`USERS`)**: Khi cần cấp thêm quyền đặc thù cho một cán bộ mà không làm thay đổi nhóm chung, Admin có thể tick chọn bổ sung các quyền riêng lẻ (`CustomPermissions`).
3. **Hiệu lực tức thì**: Quyền hiệu lực $\text{EffectivePermissions} = \text{RolePermissions} \cup \text{CustomPermissions}$ được tính toán tự động ngay khi đăng nhập.
