# 📝 ĐẶC TẢ PHÂN HỆ THẨM ĐỊNH TÍN DỤNG & TSĐB (APPRAISAL)
# Quy Trình Thẩm Định 5 Nhóm TS, Chỉ Số Tài Chính & Phê Duyệt 4 Cấp — QTDND Yên Thọ

---

## 1. MỤC TIÊU VÀ PHẠM VI NGHIỆP VỤ

Phân hệ **Appraisal** số hóa toàn diện quy trình thẩm định phương án vay vốn và định giá tài sản bảo đảm tiền vay:
- Đánh giá khách hàng: Năng lực pháp lý, uy tín tín dụng, lịch sử quan hệ với QTDND Yên Thọ và các TCTD khác.
- Thẩm định phương án vay: Mục đích sử dụng vốn (Nông nghiệp, kinh doanh dịch vụ, xây sửa nhà, mua sắm tiêu dùng), dòng tiền trả nợ từ thu nhập sản xuất kinh doanh hoặc lương.
- Định giá tài sản bảo đảm theo **5 nhóm tài sản** chuẩn hóa:
  1. Đất ở đô thị / Nông thôn
  2. Đất nông nghiệp / Nuôi trồng thủy sản
  3. Nhà ở và công trình xây dựng trên đất
  4. Phương tiện vận tải (Ô tô, xe tải)
  5. Sổ tiền gửi tiết kiệm tại Quỹ
- Tính toán tự động các chỉ số an toàn tín dụng:
  - **$LTV$ (Loan-to-Value)**: Tỷ lệ cho vay trên giá trị TSĐB.
  - **$EMI$ (Equated Monthly Installment)**: Số tiền gốc + lãi phải trả hàng tháng.
  - **$DTI$ (Debt-to-Income)**: Tỷ lệ nghĩa vụ nợ trên tổng thu nhập hàng tháng.
  - **$DSCR$ (Debt Service Coverage Ratio)**: Hệ số khả năng trả nợ.
- Quy trình phê duyệt tín dụng qua **4 cấp**: Cán bộ tín dụng lập $\rightarrow$ Trưởng phòng Tín dụng kiểm soát $\rightarrow$ Ban Giám đốc phê duyệt $\rightarrow$ Hội đồng Quản trị phê chuẩn (đối với món vay lớn vượt hạn mức Giám đốc).

---

## 2. KIẾN TRÚC FORM THẨM ĐỊNH & CÔNG THỨC TÍNH TOÁN

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       APPRAISAL WORKFLOW & FORM STRUCTURE                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. BƯỚC 1: THÔNG TIN KHÁCH HÀNG & PHƯƠNG ÁN VAY                            │
│    - Chọn khách hàng (hỗ trợ Prefill từ Customer 360)                       │
│    - Số tiền đề nghị vay, Thời hạn vay (tháng), Lãi suất (%/năm), Mục đích │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. BƯỚC 2: ĐÁNH GIÁ NGUỒN THU & KHẢ NĂNG TRẢ NỢ                             │
│    - Thu nhập chính (Nông nghiệp / Tiền lương / Kinh doanh)                 │
│    - Chi phí sinh hoạt & Nghĩa vụ trả nợ tại các nơi khác                   │
│    - Tự động tính DTI = (Tổng nghĩa vụ trả nợ / Tổng thu nhập) × 100%       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. BƯỚC 3: ĐỊNH GIÁ TÀI SẢN BẢO ĐẢM & TÍNH LTV                             │
│    - Thêm một hoặc nhiều tài sản bảo đảm                                    │
│    - Nhập diện tích, đơn giá thị trường, tỷ lệ khấu trừ an toàn             │
│    - Tự động tính: Giá trị định giá & LTV = (Số tiền vay / Giá trị TS) × 100% │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. BƯỚC 4: Ý KIẾN THẨM ĐỊNH & PHÊ DUYỆT 4 CẤP                               │
│    - Ý kiến CBTD đề xuất -> Ý kiến Kiểm soát -> Quyết định Phê duyệt        │
│    - Xem trước và In "Tờ Trình Thẩm Định Tín Dụng" chuẩn A4                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. IN ẤN TỜ TRÌNH THẨM ĐỊNH CHUẨN A4

- Tích hợp thành phần `AppraisalPrintPreviewModal`: Cho phép xem trực quan bản in Tờ trình thẩm định tín dụng khổ A4 theo đúng mẫu quy chuẩn của QTDND Yên Thọ.
- Đầy đủ tiêu đề Quốc hiệu, thông tin Hội đồng tín dụng, bảng phân tích tài chính, khối chữ ký của Cán bộ thẩm định, Cán bộ kiểm soát và Chủ tịch HĐQT/Giám đốc Quỹ.
