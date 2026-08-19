# 🧭 QUY TRÌNH & LUỒNG NGHIỆP VỤ TOÀN DIỆN (BUSINESS WORKFLOWS)
# CreditCores - Hệ Thống Quản Lý Tín Dụng & Trích Nợ Tự Động (v3.0)

Tài liệu này mô tả chi tiết 10 luồng quy trình nghiệp vụ cốt lõi trong hoạt động Tín dụng, Kiểm tra sử dụng vốn, Trích nợ tự động CASA theo ngày thực tế và Quản trị biểu mẫu của Quỹ Tín Dụng Nhân Dân Yên Thọ.

---

## 🧭 1. Sơ Đồ Tổng Quan 10 Luồng Nghiệp Vụ

```
[ 1. ĐỒNG BỘ CORE ] ──► [ 2. TRA CỨU KH 360° ] ──► [ 3. THẨM ĐỊNH TÍN DỤNG & LTV ]
                               │                               │
                               ▼                               ▼
                       [ 4. ĐĂNG KÝ TRÍCH NỢ ]        [ 5. KIỂM TRA SỬ DỤNG VỐN ]
                               │                               │
                               ▼                               ▼
                       [ 6. LẬP ĐỢT TRÍCH NỢ ]        [ 9. TRỘN BIỂU MẪU DOCS ]
                       (Chuẩn Lãi TT 14 NHNN)                  │
                               │                               ▼
                               ▼                     [ 10. BÁO CÁO & PHÂN QUYỀN ]
                       [ 7. ĐỐI SOÁT KẾT QUẢ ]
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
        (Trích nợ Đủ 100%)          (Trích 1 phần / Thất bại)
                 │                           │
                 ▼                           ▼
        [ HẠCH TOÁN THU NỢ ]        [ 8. SỔ NỢ TỒN ĐỌNG ]
                                             │
                                             ▼
                                    (Cộng dồn vào đợt sau)
```

---

## 🔄 2. Chi Tiết Từng Luồng Nghiệp Vụ

### Luồng 1: Đồng Bộ Dữ Liệu SQL Server Nội Bộ 2 Chiều
1. **Khởi tạo**: Cán bộ bấm nút **"Đồng bộ SQL"** trên thanh Header hoặc hệ thống kích hoạt tự động.
2. **Ghi hàng đợi**: WebApp gửi request `triggerSqlSync` $\to$ Ghi nhận `COMMAND='SYNC_DATA'` và `STATUS='PENDING'` tại bảng `SETTING`.
3. **Thực thi Daemon**: `python_daemon/sync_daemon.py` phát hiện cờ $\to$ Đổi `STATUS='PROCESSING'` $\to$ Truy vấn SQL Server CoreBanking $\to$ Đẩy dữ liệu vào `KH_CORE` và `HDTD_CORE` $\to$ Cập nhật `STATUS='SUCCESS'`.
4. **Phản hồi**: WebApp tự động hiển thị trạng thái xanh `Daemon: SUCCESS` kèm tổng số dòng đã đồng bộ.

---

### Luồng 2: Tra Cứu Khách Hàng & Hợp Đồng 360°
1. **Tìm kiếm**: Cán bộ nhập Mã KH, Tên, CCCD hoặc Số tài khoản CASA.
2. **Hợp nhất dữ liệu**: Hệ thống hiển thị đồng thời:
   - Thông tin cá nhân & Số điện thoại liên hệ.
   - Tư cách thành viên QTDND (Mã TV, Sổ cổ phần, Tổng vốn góp).
   - Danh sách toàn bộ các khế ước dư nợ, ngày vay, ngày đáo hạn, lãi suất và lịch sử trả nợ.
3. **Liên kết nghiệp vụ nhanh**:
   - *Lập hồ sơ thẩm định mới*.
   - *Lập biên bản kiểm tra sử dụng vốn*.
   - *Đăng ký / Xem trích nợ tự động*.

---

### Luồng 3: Thẩm Định Tín Dụng & Định Giá Tài Sản Đảm Bảo (5 Nhóm Nghiệp Vụ)
1. **Nhóm 1 - Pháp lý & Nhu cầu vốn**:
   - Định danh khách hàng (Mã KH, Họ tên, CCCD 12 số, Điện thoại, Địa chỉ, Hôn nhân).
   - Thông tin người đồng vay / Vợ / Chồng / Người bảo lãnh.
   - Nhu cầu vay vốn: Số tiền đề xuất, mục đích sử dụng vốn chi tiết, thời hạn vay, phương thức trả nợ.
2. **Nhóm 2 - Tài sản bảo đảm (TSBĐ)**:
   - Hỗ trợ vay Thế chấp và Tín chấp.
   - Chi tiết TSĐB: Số seri GCN/Sổ đỏ, Thửa đất, Tờ bản đồ, Diện tích ($m^2$), Chủ sở hữu, Quan hệ với người vay, Giá trị định giá nội bộ QTDND, Tình trạng pháp lý.
3. **Nhóm 3 - Thực địa, Dòng tiền & CIC**:
   - Dòng tiền hàng tháng: Thu nhập chính/phụ $\to$ Tổng thu nhập; Chi phí sinh hoạt/SXKD $\to$ Tổng chi phí; **Thặng dư tích lũy tháng**.
   - Tra cứu CIC: Nhóm nợ CIC, Số TCTD quan hệ, Dư nợ ngoài, Lịch sử trả nợ.
   - Đánh giá thực tế: Hiện trạng cơ sở SXKD, tư cách đạo đức và uy tín khách hàng tại địa phương.
4. **Nhóm 4 - Đề xuất CBTD & Các chỉ số tài chính tự động**:
   - Hạn mức duyệt vay, thời hạn, lãi suất duyệt, phương thức giải ngân (CASA / Tiền mặt), điều kiện giải ngân.
   - Tính toán realtime:
     + Tỷ lệ LTV: $\text{LTV} = \frac{\text{Duyệt vay}}{\text{Giá trị TSĐB}} \times 100\%$ ($\le 70\%$ an toàn, $>75\%$ cảnh báo).
     + Nghĩa vụ trả nợ/tháng ước tính: $\text{EMI} = \frac{\text{Duyệt vay}}{\text{Thời hạn}} + \frac{\text{Duyệt vay} \times \text{Lãi suất}}{12 \times 100}$.
     + Tỷ lệ DSR/DTI: $\text{DSR} = \frac{\text{EMI}}{\text{Tổng thu nhập}} \times 100\%$ ($\le 60\%$).
     + Hệ số bù đắp dòng tiền: $\text{Coverage} = \frac{\text{Thặng dư tháng}}{\text{EMI}}$ ($\ge 1.20\text{x}$).
5. **Nhóm 5 - Phê duyệt đa cấp 4 tầng & Kết luận**:
   - 4 Tầng chức danh: *Cán Bộ Tín Dụng* $\to$ *Tổ Trưởng Tín Dụng* $\to$ *Ban Kiểm Soát* $\to$ *Ban Giám Đốc / HĐQT*.
   - Kết luận: `Đồng ý cấp tín dụng` / `Có điều kiện` / `Từ chối`.
6. **Lưu trữ & In ấn**:
   - Ghi nhận vào bảng `BAO_CAO_THAM_DINH` 57 cột chuẩn.
   - Hỗ trợ in Báo Cáo Thẩm Định ngân hàng trực tiếp từ giao diện.

---

### Luồng 4: Kiểm Tra Sử Dụng Vốn Sau Giải Ngân
1. **Thời điểm thực hiện**: Trong vòng 30 ngày kể từ ngày giải ngân (hoặc định kỳ 3-6 tháng/lần).
2. **Đoàn kiểm tra**: CBTD, Ban Kiểm Soát, Ban Lãnh Đạo hoặc Đoàn liên ngành nội bộ.
3. **Nội dung kiểm tra**:
   - Hình thức: Trực tiếp tại thực địa hoặc Kiểm tra hóa đơn chứng từ mua bán.
   - Đánh giá: *Đúng mục đích 100%* / *Đúng một phần* / *Sai mục đích vay vốn*.
   - Mức độ rủi ro: *Bình thường* / *Cần theo dõi* / *Rủi ro cao*.
4. **Lưu trữ**: Ghi vào bảng `KIEM_TRA_VON` kèm link ảnh chụp hiện trường và file scan biên bản.

---

### Luồng 5: Đăng Ký & Quản Lý Dịch Vụ Trích Nợ Tự Động
1. **Thỏa thuận ủy quyền**: Khách hàng ký Giấy ủy quyền trích nợ tự động từ tài khoản thanh toán CASA.
2. **Phân kỳ trích nợ**:
   - **Kỳ 1**: Thu nợ vào **ngày 05** hàng tháng.
   - **Kỳ 2**: Thu nợ vào **ngày 15** hàng tháng.
   - **Kỳ 3**: Thu nợ vào **ngày 25** hàng tháng.
3. **Lưu trữ**: Ghi nhận trạng thái `Hiệu lực` vào bảng `DANG_KY_TRICH_NO`.

---

### Luồng 6: Khởi Tạo Đợt Trích Nợ Theo Ngày Thực Tế (TT 14/2017/TT-NHNN)
1. **Chọn kỳ**: Kế toán viên chọn Tháng (`202608`) và Kỳ trích (`Kỳ 1` / `Kỳ 2` / `Kỳ 3`).
2. **Tính toán số ngày thực tế & Tiền lãi**:
   - Xác định ngày bắt đầu tính lãi $D_{\text{start}}$ (từ `TraLaiDenNgay` hoặc kỳ trước) và ngày kết thúc $D_{\text{end}}$.
   - Số ngày tính lãi: $N = D_{\text{end}} - D_{\text{start}}$ (Quy tắc tính ngày đầu, bỏ ngày cuối).
   - Công thức tiền lãi:
     $$\text{Lãi Dự Kiến} = \frac{\text{Dư Nợ} \times \text{Lãi Suất (\%)} \times N}{36500}$$
   - Tổng hợp: $\text{Tổng Phải Thu} = \text{Lãi Dự Kiến} + \text{Gốc Đến Hạn} + \text{Nợ Tồn Đọng}$.
3. **Lưu trữ Snapshot**:
   - Ghi nhận đợt trích vào `DOT_TRICH_NO`.
   - Snapshot toàn bộ món vay vào `CHI_TIET_TRICH_NO` với trạng thái `CHO_XU_LY`.

---

### Luồng 7: Đối Soát Kết Quả Cắt Nợ Tự Động
1. **Nhập kết quả**: Upload tệp đối soát Excel từ CoreBanking hoặc nhập tay.
2. **Phân loại tự động**:
   - `ĐÃ_TRÍCH_ĐỦ`: Cắt thành công $100\%$ số tiền phải thu.
   - `TRÍCH_MỘT_PHẦN`: Tài khoản CASA không đủ số dư, đã cắt số dư khả dụng còn lại.
   - `THẤT_BẠI`: Tài khoản không đủ số dư hoặc tài khoản bị phong tỏa/tạm khóa.
3. **Cập nhật CSDL**: Cập nhật `DaTrich`, `ConNo` và mã giao dịch CoreBanking.

---

### Luồng 8: Sổ Theo Dõi Nợ Tồn Đọng & Cảnh Báo Thu Hồi Nợ
1. **Tự động chuyển sổ**: Mọi khoản nợ trích thiếu hoặc thất bại từ Luồng 7 lập tức được ghi vào `NO_TON_DONG`.
2. **Phân loại cảnh báo**:
   - *Nợ 1 kỳ*: Cảnh báo nhắc nhở qua SMS/Điện thoại.
   - *Nợ 2 kỳ*: CBTD liên hệ trực tiếp đôn đốc.
   - *Nợ quá 3 kỳ*: Lập biên bản cảnh báo chuyển nhóm nợ xấu.
3. **Cộng dồn tự động**: Khi lập đợt trích nợ tháng tiếp theo, số nợ tồn này tự động được cộng dồn vào `TongPhaiThu`.

---

### Luồng 9: Quản Lý Biểu Mẫu & Trộn Mẫu Google Docs (Mail Merge)
1. **Kho mẫu chuẩn**: Quản lý mẫu biên bản kiểm tra, báo cáo thẩm định, thỏa thuận trích nợ tại `CAU_HINH_BIEU_MAU`.
2. **Ánh xạ thẻ biến**: Thay thế động các biến `{{HoTen}}`, `{{MaKH}}`, `{{SoHDTD}}`, `{{DuNo}}`, `{{LaiDuKien}}` từ dữ liệu thực tế.
3. **Xuất file**: Xuất trực tiếp file Word, Google Docs hoặc in PDF phục vụ ký duyệt.

---

### Luồng 10: Quản Trị Người Dùng & Báo Cáo Đa Chiều
1. **Phân quyền Ma trận 360°**: Cấp quyền granular theo 12 phân hệ nghiệp vụ (`ADMIN`, `CBTD`, `KETOAN`, `BKS`, `LANHDAO`).
2. **Báo cáo đa chiều**:
   - Phân tích dư nợ theo 3 Xã (Yên Thọ, Yên Trường, Yên Thịnh).
   - Phân tích theo sản phẩm cho vay (Nông nghiệp, Sản xuất kinh doanh, Tiêu dùng).
   - Biểu đồ tăng trưởng tỷ lệ trích nợ tự động CASA thành công theo tháng.
