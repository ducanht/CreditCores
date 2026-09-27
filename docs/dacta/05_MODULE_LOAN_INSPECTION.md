# 📋 ĐẶC TẢ PHÂN HỆ KIỂM TRA SỬ DỤNG VỐN SAU VAY (LOAN INSPECTION)
# Giám Sát Chu Kỳ 30 Ngày, Đoàn Kiểm Tra & Nén Ảnh Thực Địa — QTDND Yên Thọ

---

## 1. MỤC TIÊU VÀ PHẠM VI NGHIỆP VỤ

Phân hệ **Loan Inspection** phục vụ công tác kiểm tra, giám sát sau cho vay theo quy định của Ngân hàng Nhà nước và Quy chế cho vay của QTDND Yên Thọ:
- **Chu kỳ kiểm tra lần đầu**: Bắt buộc thực hiện trong vòng **30 ngày** kể từ ngày giải ngân vốn vay.
- **Chu kỳ kiểm tra định kỳ/đột xuất**: Thực hiện 3 - 6 tháng một lần đối với các món vay trung dài hạn hoặc các món vay có rủi ro tiềm ẩn.
- **Thành phần đoàn kiểm tra**: Cán bộ tín dụng phụ trách, Cán bộ Ban Kiểm soát hoặc Thành viên HĐQT trực tiếp xuống hiện trường tại địa bàn (Quý Lộc, Yên Thọ, Yên Lâm).
- **Mục tiêu đánh giá**: Kiểm tra khách hàng có sử dụng vốn đúng mục đích ghi trên HĐTD hay không; kiểm tra hiện trạng tài sản thế chấp (nhà, đất, xe cơ giới); đánh giá tiến độ phương án kinh doanh.

---

## 2. KIẾN TRÚC GIAO DIỆN & QUY TRÌNH KIỂM TRA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LOAN INSPECTION WORKFLOW & COMPONENTS                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. BẢNG THEO DÕI HỢP ĐỒNG CẦN KIỂM TRA (Inspection Due Table):             │
│    - Cảnh báo các hợp đồng giải ngân quá 20 ngày chưa kiểm tra              │
│    - Lọc theo Xã/Thôn và Cán bộ tín dụng quản lý                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. FORM LẬP BIÊN BẢN KIỂM TRA (`InspectionFormModal.jsx`):                  │
│    - Thành phần đoàn kiểm tra (CBTD, Đại diện Ban Kiểm soát, HĐQT)          │
│    - Kết quả kiểm tra mục đích sử dụng vốn (Đúng mục đích / Sai mục đích)    │
│    - Hiện trạng tài sản bảo đảm (Nguyên vẹn / Có biến động / Giảm sút)      │
│    - Kết luận và kiến nghị của đoàn kiểm tra                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. CÔNG NGHỆ NÉN ẢNH THỰC ĐỊA CANVAS (`ImageUploader.jsx`):                 │
│    - Cán bộ chụp ảnh thực địa trực tiếp bằng điện thoại tại cơ sở khách hàng│
│    - Tự động nén ảnh qua HTML5 Canvas xuống dưới 300KB                      │
│    - Đóng dấu thời gian (Timestamp) và tọa độ thực địa                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. IN BIÊN BẢN KIỂM TRA SAU CHO VAY CHUẨN A4:                               │
│    - Xuất biên bản hoàn chỉnh có chữ ký của Khách hàng vay và Đoàn kiểm tra │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. CÔNG NGHỆ NÉN ẢNH THỰC ĐỊA TRÊN TRÌNH DUYỆT (CANVAS IMAGE COMPRESSION)

- Khi cán bộ đi thực địa tại các thôn xã, mạng 4G có thể không ổn định và ảnh chụp từ camera điện thoại thường có dung lượng từ 5MB - 12MB.
- `ImageUploader.jsx` tích hợp thuật toán nén ảnh Canvas:
  - Tự động điều chỉnh kích thước ảnh về tối đa $1280 \times 1280$ pixel.
  - Tối ưu hóa chất lượng JPEG ở mức 0.75.
  - Chuyển thành Base64 để lưu trữ an toàn hoặc đẩy lên Google Drive mà không làm quá tải băng thông mạng.
