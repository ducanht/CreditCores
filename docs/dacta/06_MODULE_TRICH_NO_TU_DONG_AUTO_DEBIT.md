# ⚡ ĐẶC TẢ TOÀN DIỆN MODULE TRÍCH NỢ TỰ ĐỘNG (AUTO-DEBIT)
# Chuẩn Hóa Nghiệp Vụ Tín Dụng & Tiền Gửi Thanh Toán CASA — QTDND Yên Thọ

Tài liệu này là **đặc tả kỹ thuật và nghiệp vụ chi tiết nhất** về Phân hệ Trích Nợ Tự Động (Auto-Debit) của hệ thống **CreditCores**, phục vụ cho việc vận hành thực tế tại Quỹ tín dụng nhân dân Yên Thọ và làm căn cứ tái cấu trúc toàn diện Frontend.

---

## 1. MỤC TIÊU NGHIỆP VỤ & BỐI CẢNH VẬN HÀNH

### 1.1. Bối Cảnh Thực Tế Tại QTDND Yên Thọ
- Khách hàng vay vốn có tài khoản tiền gửi thanh toán (CASA) tại Quỹ hoặc hệ thống Co-opBank.
- Hàng tháng, thay vì khách hàng phải trực tiếp mang tiền mặt đến quầy giao dịch tại Thôn Tân Lộc, Quý Lộc hoặc cán bộ tín dụng phải đi thu nợ từng nhà, hệ thống thực hiện trích nợ tự động số tiền gốc và lãi từ tài khoản CASA của khách hàng.
- **Mục tiêu cốt lõi**:
  1. Tự động hóa 100% việc tính tiền lãi vay theo số ngày thực tế chuẩn **Thông tư 14/2017/TT-NHNN**.
  2. Gom nợ gốc đến hạn và nợ tồn đọng kỳ trước vào một đợt thu duy nhất.
  3. Xuất file lệnh chuyển khoản tự động tương thích với CoreBanking / Co-opBank.
  4. Đối soát chính xác kết quả trích nợ, tự động chuyển các khoản trích thiếu vào Sổ nợ tồn đọng để đôn đốc.
  5. Giảm tỷ lệ nợ xấu, nợ quá hạn và giải phóng 80% thời gian xử lý giấy tờ cho Kế toán và CBTD.

---

## 2. QUY TRÌNH NGHIỆP VỤ KHÉP KÍN 5 GIAI ĐOẠN (END-TO-END WORKFLOW)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                    CHU TRÌNH VẬN HÀNH TRÍCH NỢ TỰ ĐỘNG 5 GIAI ĐOẠN                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  [GIAI ĐOẠN 1]  ĐĂNG KÝ & QUẢN LÝ THỎA THUẬN                                           │
│                 ► Khách hàng ký "Văn bản thỏa thuận trích nợ tự động"                   │
│                 ► Ghi nhận Số TK CASA, Kỳ trích mặc định (05, 15, 25), Hạn mức          │
│                 ► Trạng thái: Hiệu lực (ACTIVE) hoặc Tạm ngưng (PAUSED)                 │
│                                           │                                             │
│                                           ▼                                             │
│  [GIAI ĐOẠN 2]  KHỞI TẠO ĐỢT & TÍNH LÃI THỰC TẾ (TT 14/2017/TT-NHNN)                   │
│                 ► Chọn Tháng thu (YYYYMM) và Đợt trích (Kỳ 1, 2, 3)                     │
│                 ► Tự động quét HĐTD thuộc chu kỳ giải ngân & còn dư nợ > 0              │
│                 ► Thuật toán tính lãi: (Dư nợ × Lãi suất × Số ngày thực tế) / 36500     │
│                 ► Cộng Gốc đến hạn + Dồn Nợ tồn đọng kỳ trước                           │
│                 ► Tạo Snapshot bất biến: Master (DOT_TRICH_NO), Detail (LICH_SU_TRICH)  │
│                                           │                                             │
│                                           ▼                                             │
│  [GIAI ĐOẠN 3]  XUẤT LỆNH & PHÊ DUYỆT TRÍCH NỢ                                          │
│                 ► Xuất File CSV/Excel lệnh cắt nợ nạp vào CoreBanking / Co-opBank       │
│                 ► Xuất Bảng kê danh sách trích nợ A4 kèm khối ký kiểm soát, phê duyệt   │
│                                           │                                             │
│                                           ▼                                             │
│  [GIAI ĐOẠN 4]  ĐỐI SOÁT & XỬ LÝ KẾT QUẢ TỪ COREBANKING                                 │
│                 ► Nạp file kết quả sao kê tài khoản CASA từ CoreBanking                 │
│                 ► Khớp tự động theo Số TK & HĐTD, phân loại:                            │
│                   - THANH_CONG: Trích đủ 100% số tiền                                   │
│                   - TRICH_MOT_PHAN: Tài khoản không đủ số dư, trích được một phần       │
│                   - THAT_BAI: Số dư = 0, tài khoản bị phong tỏa hoặc sai thông tin      │
│                 ► Khóa đợt trích nợ (Trạng thái DA_CHOT)                                │
│                                           │                                             │
│                                           ▼                                             │
│  [GIAI ĐOẠN 5]  SỔ THEO DÕI NỢ TỒN ĐỌNG & ĐÔN ĐỐC THU HỒI                               │
│                 ► Các khoản trích thiếu tự động đổ về bảng NO_TON_DONG                  │
│                 ► Phân loại nợ: Nợ 1 kỳ (Vừa phát sinh), Nợ 2 kỳ, Nợ tồn đọng lâu       │
│                 ► Tự động gắn CBTD theo dõi theo địa bàn thực tế từ CSDL (diaChi)       │
│                 ► Cán bộ thực hiện gọi điện, lập phương án đôn đốc thu hồi nợ           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. ĐẶC TẢ THUẬT TOÁN TÍNH TOÁN & CÔNG THỨC NGHIỆP VỤ

### 3.1. Thuật Toán Tính Lãi Ngày Thực Tế Theo TT 14/2017/TT-NHNN
1. **Nguyên tắc "Tính ngày đầu, bỏ ngày cuối"**:
   - Khoảng tính lãi: $[D_{\text{start}}, D_{\text{end}})$.
   - $D_{\text{start}}$: Lấy từ trường `TraLaiDenNgay` trên Hợp đồng tín dụng (`HDTD_CORE`). Nếu là hợp đồng mới giải ngân lần đầu, lấy `NgayVay`.
   - $D_{\text{end}}$: Ngày chốt trích nợ của đợt (Ví dụ: Ngày 05, 15, hoặc 25 của tháng hiện tại).
   - Số ngày tính lãi thực tế $N$:
     $$N = \text{DateDiff}(D_{\text{end}}, D_{\text{start}}) \quad (\text{ngày})$$
2. **Mẫu số năm chuẩn hóa 365 ngày**:
   - Bất kể năm nhuận hay năm thường, mẫu số lãi suất năm luôn chia cho $365 \times 100 = 36500$.
   - **Số tiền lãi phát sinh**:
     $$\text{TienLai} = \text{Round}\left(\frac{\text{DuNoThucTe} \times \text{LaiSuatNam} \times N}{36500}\right)$$
3. **Tổng Số Tiền Đề Xuất Trích Nợ**:
   $$\text{TongPhaiThu} = \text{TienLai} + \text{GocDenHan} + \text{NoTonKyTruoc}$$

### 3.2. Cấu Hình 3 Chu Kỳ Đợt Trích Nợ Trong Tháng
Nhằm cân đối dòng tiền và giảm tải cho giao dịch viên, hệ thống chia làm 3 đợt trích tương ứng với ngày giải ngân ban đầu của khách hàng:

| Mã Đợt | Tên Đợt | Khung Ngày Vay HĐTD | Ngày Trích Nợ | Chu Kỳ Tính Lãi Mặc Định |
| :---: | :--- | :---: | :---: | :--- |
| **`DOT_1`** | **Đợt 1 (Đầu tháng)** | Ngày **26 $\rightarrow$ 04** | **Ngày 05** | Từ ngày 05 tháng $T-1$ đến ngày 05 tháng $T$ |
| **`DOT_2`** | **Đợt 2 (Giữa tháng)** | Ngày **05 $\rightarrow$ 15** | **Ngày 15** | Từ ngày 15 tháng $T-1$ đến ngày 15 tháng $T$ |
| **`DOT_3`** | **Đợt 3 (Cuối tháng)** | Ngày **16 $\rightarrow$ 25** | **Ngày 25** | Từ ngày 25 tháng $T-1$ đến ngày 25 tháng $T$ |

---

## 4. ĐẶC TẢ LƯỢC ĐỒ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Dữ liệu module Trích nợ được tổ chức trên các bảng tính Google Sheets Database với cấu trúc chuẩn hóa:

### 4.1. Bảng `THOA_THUAN_TRICH_NO` (Danh Sách Đăng Ký Thỏa Thuận)
| Cột | Tên Thuộc Tính | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :---: | :--- | :---: | :---: | :--- |
| A | `MaKH` | Text | Primary Key, `'` | Mã định danh khách hàng (Ví dụ: `'KH008892'`) |
| B | `HoTen` | Text | Not Null | Họ và tên khách hàng |
| C | `CCCD` | Text | `'` | Số CCCD/CMND (12 chữ số, có nháy đơn chống mất số 0) |
| D | `DienThoai` | Text | | Số điện thoại di động liên hệ |
| E | `DiaChi` | Text | | Thôn, xã cư trú (Quý Lộc / Yên Thọ / Yên Lâm) |
| F | `SoTK` | Text | Not Null, `'` | Số tài khoản tiền gửi thanh toán CASA tại Quỹ |
| G | `KyTrichMacDinh` | Number | 1, 2 hoặc 3 | Kỳ trích nợ mặc định (1: Ngày 05, 2: Ngày 15, 3: Ngày 25) |
| H | `NgayDangKy` | Date | `dd/mm/yyyy` | Ngày khách hàng ký văn bản thỏa thuận ủy quyền |
| I | `TrangThai` | Enum | `Hiệu lực` / `Tạm ngưng` | Trạng thái hiệu lực của thỏa thuận |
| J | `HanMucToiDa` | Number | | Hạn mức trích tối đa mỗi kỳ (0 = Không giới hạn) |
| K | `GhiChu` | Text | | Ghi chú điều kiện đặc biệt |

### 4.2. Bảng Master `DOT_TRICH_NO` (Danh Mục Đợt Trích Nợ)
| Cột | Tên Thuộc Tính | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :---: | :--- | :---: | :---: | :--- |
| A | `MaDot` | Text | Primary Key | Mã đợt trích nợ (Ví dụ: `DOT_202609_K2`) |
| B | `TenDot` | Text | Not Null | Tên đợt trích nợ hiển thị |
| C | `ThangNam` | Text | `YYYYMM` | Tháng năm thực hiện (Ví dụ: `202609`) |
| D | `KyTrich` | Number | 1, 2, 3 | Kỳ trích nợ trong tháng |
| E | `NgayTrich` | Date | `dd/mm/yyyy` | Ngày thực hiện trích tiền |
| F | `TongSoMon` | Number | $\ge 0$ | Tổng số hợp đồng tín dụng đưa vào đợt trích |
| G | `TongTienPhaiThu` | Number | $\ge 0$ | Tổng số tiền phải thu (Lãi + Gốc + Nợ tồn) |
| H | `DaTrich` | Number | $\ge 0$ | Tổng số tiền đã trích thu thành công |
| I | `ConLai` | Number | $\ge 0$ | Tổng số tiền chưa trích được |
| J | `TrangThai` | Enum | `MOI_TAO`, `DANG_XU_LY`, `DA_CHOT` | Trạng thái vòng đời của đợt |
| K | `NgayTao` | Timestamp | GMT+7 | Thời gian tạo đợt |
| L | `NguoiTao` | Text | | Username cán bộ khởi tạo |

### 4.3. Bảng Detail `LICH_SU_TRICH_NO` (Chi Tiết Từng Hợp Đồng Trong Đợt)
| Cột | Tên Thuộc Tính | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :---: | :--- | :---: | :---: | :--- |
| A | `MaGiaoDich` | Text | Primary Key | Mã giao dịch duy nhất (`MaDot_SoHDTD`) |
| B | `MaDot` | Text | Foreign Key | Liên kết với `DOT_TRICH_NO.MaDot` |
| C | `MaKH` | Text | `'` | Mã khách hàng |
| D | `HoTen` | Text | | Họ tên khách hàng |
| E | `SoHDTD` | Text | `'` | Số Hợp đồng tín dụng trích thu |
| F | `SoTK` | Text | `'` | Số tài khoản CASA thực hiện cắt nợ |
| G | `DuNoGoc` | Number | | Dư nợ gốc hiện tại của món vay |
| H | `LaiPhatSinh` | Number | | Tiền lãi tính theo ngày thực tế TT14 |
| I | `GocDenHan` | Number | | Tiền gốc đến hạn phải thu trong kỳ |
| J | `NoTonKyTruoc` | Number | | Nợ kỳ trước chưa thanh toán dồn sang |
| K | `TongPhaiThu` | Number | | Tổng tiền phải trích thu đợt này |
| L | `DaTrich` | Number | | Số tiền CoreBanking đã cắt nợ thực tế |
| M | `ConLai` | Number | | Số tiền còn thiếu sau trích nợ |
| N | `TrangThai` | Enum | `CHUA_XU_LY`, `THANH_CONG`, `TRICH_MOT_PHAN`, `THAT_BAI` | Kết quả đối soát |
| O | `LyDoLoi` | Text | | Lý do trích không thành công |
| P | `MaGiaoDichCore` | Text | | Mã bút toán ghi nhận từ CoreBanking |

### 4.4. Bảng `CAU_HINH_TRICH_NO` (Cấu Hình Tham Số Chu Kỳ Đợt)
- Quản lý ánh xạ khoảng ngày vay sang ngày trích và ngày tính lãi.
- Cho phép điều chỉnh linh hoạt khi có kỳ nghỉ Lễ/Tết hoặc thay đổi chính sách từ Ban Điều hành.

### 4.5. Bảng `NO_TON_DONG` (Sổ Theo Dõi Nợ Tồn Đọng)
- Tự động tiếp nhận các bản ghi có trạng thái `TRICH_MOT_PHAN` hoặc `THAT_BAI`.
- Lưu trữ số kỳ nợ tồn, nhật ký đôn đốc và phân công cán bộ tín dụng địa bàn.

---

## 5. PHÂN TÍCH HIỆN TRẠNG FRONTEND & ĐỀ XUẤT TÁI CẤU TRÚC

### 5.1. Những Điểm Bất Cập Trong Giao Diện Hiện Tại
1. **Phân Mảnh & Đứt Gãy Luồng Thao Tác (Cognitive Disjoint)**:
   - Trên Sidebar đang bố trí **4 menu rời rạc**:
     - `debit_register` (Đăng ký Trích nợ) $\rightarrow$ Menu TRÍCH NỢ
     - `debit_batch` (Đợt Trích nợ) $\rightarrow$ Menu TRÍCH NỢ
     - `reconciliation` (Đối soát & Kết quả) $\rightarrow$ Menu KẾ TOÁN
     - `debt_warning` (Cảnh báo Nợ tồn đọng) $\rightarrow$ Menu QUẢN LÝ NỢ
   - Thực tế nghiệp vụ: Đây là **một quy trình liên tục của duy nhất một nghiệp vụ Trích Nợ Tự Động**. Việc chia thành 4 màn hình riêng biệt khiến cán bộ phải nhảy qua lại giữa nhiều tab, dễ nhầm lẫn và không thấy được bức tranh toàn cảnh dòng tiền thu nợ.
2. **Thiếu Bảng Điều Khiển Tiến Trình (Pipeline Status Board)**:
   - Cán bộ không thấy được đợt trích nợ hiện tại đang ở bước nào (Mới lập $\rightarrow$ Đã xuất lệnh $\rightarrow$ Đang đối soát $\rightarrow$ Đã chốt sổ $\rightarrow$ Đang đôn đốc nợ).
3. **Trải Nghiệm Modal Lập Đợt Trích Nợ Chưa Tối Ưu**:
   - Modal `DebitBatchCreateModal.jsx` chứa nhiều logic phức tạp nhưng trình bày dạng danh sách dài, chưa có thanh Wizard rõ ràng và thiếu bộ lọc thông minh theo địa bàn xã/thôn để phân loại đối tượng trích.
4. **Hiển Thị Bảng Biểu Số Liệu**:
   - Chưa tận dụng tối đa `tabular-nums` và hệ màu status badge ngân hàng (Xanh ngọc - Vàng hổ phách - Đỏ thắm) để nhận diện nhanh các món trích thành công hay thất bại.

---

## 6. MÔ HÌNH THIẾT KẾ MỤC TIÊU: UNIFIED AUTO-DEBIT COMMAND CENTER

Hợp nhất toàn bộ phân hệ Trích nợ thành một **Trung Tâm Điều Hành Trích Nợ Tự Động Hợp Nhất** (`DebitHub`):

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                    TRUNG TÂM ĐIỀU HÀNH TRÍCH NỢ TỰ ĐỘNG (DEBIT HUB)                     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  [KPIs THÁNG]: TỔNG PHẢI THU  │  ĐÃ THU THÀNH CÔNG  │  TỶ LỆ THU ĐẠT  │  NỢ CẦN ĐÔN ĐỐC │
│                2.450.000.000đ │  2.320.000.000đ     │  94.69%         │  130.000.000đ   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  [THANH TIẾN TRÌNH PIPELINE 5 TẦNG]:                                                    │
│  [1. Thỏa Thuận CASA] ➔ [2. Đợt Trích Nợ] ➔ [3. Đối Soát Kết Quả] ➔ [4. Sổ Nợ Tồn] ➔ [5. Cấu Hình] │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  NỘI DUNG PHÂN HỆ THEO TAB ĐANG CHỌN (Tích hợp bộ lọc Địa bàn động CSDL, Tải lại, QuickView)│
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.1. Chi Tiết 5 Tab Thành Phần Hợp Nhất
1. **Tab 1: Thỏa Thuận & Đăng Ký Trích Nợ (`DebitRegisterTable`)**:
   - Quản lý danh sách ủy quyền, thêm mới khách hàng, sửa thông tin tài khoản CASA, chuyển trạng thái Hiệu lực/Tạm ngưng, in Mẫu thỏa thuận A4 chuẩn QTDND.
2. **Tab 2: Đợt Trích Nợ Định Kỳ (`DebitBatchTable` + `DebitBatchCreateModal` + `DebitBatchDetailModal`)**:
   - Lập đợt mới với Wizard 3 bước thông minh, tự động tính lãi TT14, xem chi tiết đợt, xuất file lệnh CoreBanking CSV và in Bảng kê A4 có chữ ký kiểm soát.
3. **Tab 3: Đối Soát Kết Quả CoreBanking (`DebitReconciliationView`)**:
   - Kế thừa và nâng cấp từ `Reconciliation.jsx`: Nạp file sao kê kết quả, tự động khớp tài khoản, hiển thị tiến độ thanh toán trực quan, cho phép chỉnh sửa trực tiếp từng món trước khi Chốt đợt (`DA_CHOT`).
4. **Tab 4: Sổ Nợ Tồn Đọng & Đôn Đốc (`DebtWarningView`)**:
   - Kế thừa từ `DebtWarning.jsx`: Tự động tiếp nhận các món chưa thu đủ từ Tab Đối soát, phân loại nợ 1 kỳ / 2 kỳ / quá hạn, gán cán bộ phụ trách đôn đốc, tích hợp nút gọi điện thoại nhanh trên di động.
5. **Tab 5: Cấu Hình Chu Kỳ Đợt (`DebitConfigTable`)**:
   - Tinh chỉnh ngày vay, ngày trích hàng tháng và các tham số mẫu số tính lãi.

### 6.2. Cơ Chế Điều Hướng Mềm & Đồng Bộ Sidebar
- Trên **Sidebar**, giữ nguyên 2 lối vào chính quen thuộc hoặc gom nhóm thông minh:
  - `debit_register` $\rightarrow$ Mở thẳng Tab 1
  - `debit_batch` $\rightarrow$ Mở thẳng Tab 2
  - `reconciliation` $\rightarrow$ Mở thẳng Tab 3
  - `debt_warning` $\rightarrow$ Mở thẳng Tab 4
- Dù bấm từ bất kỳ mục nào trên Sidebar, giao diện sẽ nạp vào cùng một **Command Center** thống nhất, chuyển đổi tab mượt mà bằng thanh Segmented Control / Pipeline Tab mà không làm mất trạng thái bộ lọc và dữ liệu đã nạp.
