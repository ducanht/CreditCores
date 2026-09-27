# 📈 ĐẶC TẢ PHÂN HỆ BÁO CÁO THỐNG KÊ TÍN DỤNG (REPORTS)
# Báo Cáo Doanh Số, Cơ Cấu Nhóm Nợ & Top Dư Nợ Bình Quân — QTDND Yên Thọ

---

## 1. MỤC TIÊU VÀ PHẠM VI NGHIỆP VỤ

Phân hệ **Reports** cung cấp hệ thống báo cáo quản trị đa chiều phục vụ công tác điều hành tín dụng và báo cáo định kỳ gửi Ngân hàng Nhà nước Chi nhánh tỉnh Thanh Hóa:
- **Báo cáo Dư nợ Tín dụng**: Phân tích quy mô dư nợ theo địa bàn 3 xã (Quý Lộc, Yên Thọ, Yên Lâm), theo kỳ hạn vay (Ngắn hạn, Trung hạn, Dài hạn) và theo đối tượng ngành nghề.
- **Báo cáo Phân loại Nợ & Trích lập Dự phòng**: Phân loại 5 nhóm nợ theo Thông tư 11/2021/TT-NHNN, tính tỷ lệ nợ xấu và dự phòng rủi ro cần trích lập.
- **Báo cáo Doanh số Cho vay & Thu nợ (`BC_DOANH_SO_TD`)**: Thống kê doanh số giải ngân mới và doanh số thu nợ gốc/lãi theo từng tháng hoặc giai đoạn.
- **Báo cáo Top Khách hàng Dư nợ Lớn (`TOP_DU_NO_BINH_QUAN`)**: Danh sách các khách hàng có dư nợ bình quân cao nhất để giám sát rủi ro tập trung tín dụng.

---

## 2. KIẾN TRÚC GIAO DIỆN & TÍNH NĂNG XUẤT DỮ LIỆU

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          REPORTS UI ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. THANH CHỌN LOẠI BÁO CÁO & KỲ BÁO CÁO:                                    │
│    - Loại báo cáo: Dư nợ / Doanh số / Phân loại nợ / Top khách hàng         │
│    - Kỳ báo cáo: Theo ngày chốt, Theo tháng, Theo quý hoặc khoảng ngày tùy chọn│
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. KHỐI THỐNG KÊ TỔNG HỢP & BIỂU ĐỒ TRỰC QUAN:                              │
│    - Tỷ trọng dư nợ giữa 3 xã                                               │
│    - Tỷ lệ hoàn thành kế hoạch tăng trưởng tín dụng năm                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. BẢNG DỮ LIỆU BÁO CÁO CHI TIẾT (Report Data Grid):                        │
│    - Hiển thị đầy đủ số liệu theo chuẩn mực báo cáo tài chính               │
│    - Định dạng số `tabular-nums`, phân cách hàng nghìn rõ ràng              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. CÔNG CỤ XUẤT DỮ LIỆU (Export Tools):                                     │
│    - Xuất tệp Microsoft Excel (.xlsx) chuẩn mẫu bảng biểu                   │
│    - In trực tiếp ra giấy khổ A4 ngang (Landscape) kèm khối chữ ký kiểm soát│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. NGUYÊN TẮC BẢO TOÀN DỮ LIỆU LỊCH SỬ

- Hệ thống hỗ trợ xem báo cáo theo cả 2 chế độ:
  - **Dữ liệu thời gian thực (Real-time snapshot)**: Phản ánh chính xác số dư hiện tại trên CSDL.
  - **Dữ liệu chốt cuối tháng (`HDTD_CORE_ALL`)**: Phục vụ việc so sánh số liệu tăng trưởng giữa các tháng mà không bị ảnh hưởng bởi các giao dịch tất toán phát sinh sau ngày chốt.
