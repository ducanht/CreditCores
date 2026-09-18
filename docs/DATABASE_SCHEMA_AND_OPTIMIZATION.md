# 🏛️ ĐẶC TẢ THIẾT KẾ LẠI KIẾN TRÚC CƠ SỞ DỮ LIỆU TỐI ƯU HIỆU NĂNG
# Read-Optimized Data Architecture & Python Pre-Processing Strategy
# Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ) — CreditCores v4.0

> **Mục tiêu cốt lõi**: Chuyển đổi mô hình lưu trữ trên Google Sheets từ **Dạng Chuẩn Hóa RDBMS (Normalized 3NF)** sang **Mô Hình Kho Dữ Liệu Tối Ưu Đọc (Read-Optimized Data Mart)**. 
> Triệt tiêu hoàn toàn các thao tác đọc chéo nhiều bảng (Cross-Sheet Reads), loại bỏ các phép kết nối bảng trong bộ nhớ (In-Memory Joins) và các đoạn Regex phân tích chuỗi trên Google Apps Script (GAS), tận dụng tối đa năng lực xử lý mạnh mẽ của **SQL Server CoreBanking On-Premise** và **Python Daemon** trước khi ghi vào Google Sheets.

---

## 📑 MỤC LỤC
1. [Bản Chất Vấn Đề & Triết Lý Kiến Trúc Mới](#1-bản-chất-vấn-đề--triết-lý-kiến-trúc-mới)
2. [Các Nội Dung Xử Lý Bằng Python Trước Khi Đẩy Lên Google Sheets](#2-các-nội-dung-xử-lý-bằng-python-trước-khi-đẩy-lên-google-sheets)
3. [Đặc Tả Cấu Trúc Chi Tiết Các Bảng CSDL Tối Ưu](#3-đặc-tả-cấu-trúc-chi-tiết-các-bảng-csdl-tối-ưu)
   - [3.1. Bảng `HDTD_CORE` (Mở rộng thành Self-Contained Loan Record)](#31-bảng-hdtd_core-mở-rộng-thành-self-contained-loan-record)
   - [3.2. Bảng `KH_CORE` (Mở rộng thành Customer 360 Unified Profile)](#32-bảng-kh_core-mở-rộng-thành-customer-360-unified-profile)
   - [3.3. Bảng Mới `DASHBOARD_SNAPSHOT` (Bảng Tổng Hợp Điều Hành 16 Dòng)](#33-bảng-mới-dashboard_snapshot-bảng-tổng-hợp-điều-hành-16-dòng)
   - [3.4. Bảng `BC_DOANH_SO_TD` & `TOP_DU_NO_BINH_QUAN`](#34-bảng-bc_doanh_so_td--top_du_no_binh_quan)
4. [Ma Trận Ma Sát I/O: Đo Lường Trước & Sau Khi Tối Ưu](#4-ma-trận-ma-sát-io-đo-lường-trước--sau-khi-tối-ưu)
5. [Lộ Trình Triển Khai An Toàn Tuyệt Đối (Zero-Breakage)](#5-lộ-trình-triển-khai-an-toàn-tuyệt-đối-zero-breakage)

---

## 1. BẢN CHẤT VẤN ĐỀ & TRIẾT LÝ KIẾN TRÚC MỚI

### 1.1. Cổ chai nghiêm trọng của kiến trúc cũ
- **Google Sheets không phải là RDBMS**: Google Sheets không có chỉ mục $B$-Tree để tìm kiếm nhanh, không có bộ tối ưu truy vấn phần cứng. Mỗi lần đọc 1 Sheet là một lượt gọi I/O mạng tốn 100ms – 500ms.
- **Hiện tượng "Thắt nút cổ chai tại GAS"**:
  - Khi người dùng mở **Dashboard**: GAS phải mở và đọc đồng thời **7 Sheets** (`HDTD_CORE`, `KH_CORE`, `NO_TON_DONG`, `DOT_TRICH_NO`, `DANG_KY_TRICH_NO`, `THAM_DINH_TD`, `KIEM_TRA_VON`).
  - Riêng bảng `KH_CORE` chứa hơn **5.175 khách hàng/thành viên** toàn Quỹ (~82.800 ô dữ liệu).
  - GAS phải dùng CPU yếu ớt để chạy vòng lặp 5.175 lần nhằm parse Regex chuỗi địa chỉ để tìm xem khách hàng thuộc Thôn nào, Xã nào, rồi JOIN ngược lại với vài trăm dòng của `HDTD_CORE`.
  - **Hậu quả**: Thời gian tải Dashboard kéo dài **4.5s – 8.0s**, ngốn sạch RAM và dễ chạm quota đọc của Google Sheets API.

### 1.2. Triết lý thiết kế mới: "Data Mart / Read-Optimized Architecture"
> **"Dồn tối đa năng lực xử lý vào mắt xích mạnh nhất (SQL Server + Python Daemon) và biến Google Sheets thành một kho dữ liệu chuyên dụng để đọc (Read-Optimized Data Store) với các bản ghi Tự Chứa Đủ Thông Tin (Self-Contained) và các bảng Snapshot Tổng Hợp Sẵn (Pre-Aggregated)."**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 KIẾN TRÚC CHUYỂN DỊCH TẢI TRỌNG DỮ LIỆU                     │
├──────────────────────────────────────┬──────────────────────────────────────┤
│          MÔ HÌNH HIỆN TẠI            │          MÔ HÌNH THIẾT KẾ MỚI        │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • SQL Server: Trích xuất thô         │ • SQL Server: JOIN + Nhóm + Tổng hợp │
│ • Python: Đẩy thô lên Sheets         │ • Python: Tính sẵn Snapshot 3 Xã/Thôn│
│ • Google Sheets: Lưu dạng rời rạc    │ • Google Sheets: Lưu dạng Self-Contain│
│ • GAS: Phải mở 7 sheets, JOIN, Regex │ • GAS: Chỉ đọc 1 sheet duy nhất!     │
│ ⏱️ Thời gian: 4.5s – 8.0s           │ ⚡ Thời gian: < 150ms                │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 2. CÁC NỘI DUNG XỬ LÝ BẰNG PYTHON TRƯỚC KHI ĐẨY LÊN GOOGLE SHEETS

Python Daemon chạy trực tiếp trên máy chủ SQL Server CoreBanking On-Premise với tài nguyên CPU và RAM dồi dào. Dưới đây là **8 nội dung nghiệp vụ & tính toán mà Python Daemon sẽ xử lý triệt để trước khi ghi vào Google Sheets**:

| STT | Nội Dung Xử Lý Bằng Python | Cơ Chế Kỹ Thuật Phía Python | Lợi Ích Hiệu Năng Đạt Được |
|:---:|:---|:---|:---|
| **1** | **Chuẩn hóa Địa bàn 3 Xã & 12 Thôn** | Dùng từ điển danh mục địa bàn QTDND Yên Thọ (Tu Mục, Tân Lộc, Đan Nê, Phố Kiểu, Lựu Khê, Thạc Quả, Yên Lạc, Thọ Vực, Phi Bình, Kỳ Ngãi, Vĩnh Khang 1, 2...) để bóc tách chuỗi địa chỉ thành 2 trường chuẩn `KvXa` và `KvThon`. | Triệt tiêu 100% các đoạn Regex/Substring nặng nề trên GAS. Dữ liệu địa bàn chính xác 100%. |
| **2** | **Phân loại Nhóm Sản Phẩm Vay** | Ánh xạ danh mục sản phẩm CoreBanking (`SP.TEN_SAN_PHAM`) thành 3 nhóm lớn: `Nông nghiệp`, `Tiêu dùng - Đời sống`, `Thương mại - Dịch vụ` và ghi vào cột `NhomSanPham`. | Frontend & GAS vẽ biểu đồ Donut và tính cơ cấu dư nợ tức thì $O(1)$, không cần đối chiếu chuỗi. |
| **3** | **Tính sẵn Chỉ Số Sức Khỏe Khách Hàng 360°** | Sau khi query Hợp đồng và Khách hàng, Python dùng `defaultdict` tính ngay theo từng `MaKH`: `TongDuNoHienTai`, `SoLuongHDVay`, `TrangThaiVay` (`DANG_VAY` / `DA_TAT_TOAN` / `CHUA_VAY`). Ghi trực tiếp vào bảng `KH_CORE`. | Màn hình Tra Cứu KH 360° có sẵn Badge dư nợ và bộ lọc trạng thái mà **không cần quét qua `HDTD_CORE`**. |
| **4** | **Tự Động Sinh Bảng Snapshot Điều Hành (`DASHBOARD_SNAPSHOT`)** | Python tự động gom nhóm `records_hdtd` theo 3 Xã và 12 Thôn, tính sẵn: `TongDuNo`, `TongTienVay`, `SoLuongHD`, `SoLuongKH`, `DuNoBinhQuan`, cơ cấu sản phẩm và phân bổ theo 3 CBTD. Ghi đè vào sheet 16 dòng. | **Dashboard chỉ cần đọc 1 sheet 16 dòng (< 4KB)**, thời gian nạp giảm từ 6s xuống < 100ms! |
| **5** | **Sinh Sẵn 2 Bảng Báo Cáo Chuyên Sâu** | Python sắp xếp và xếp hạng Top 20 khách hàng dư nợ bình quân lớn nhất, tính tỷ trọng % trên tổng dư nợ toàn quỹ, gắn mức độ cảnh báo rủi ro (An toàn, Cần theo dõi, Giám sát chặt) rồi ghi vào `TOP_DU_NO_BINH_QUAN` và `BC_DOANH_SO_TD`. | Phân hệ Báo Cáo không cần tính toán động khi người dùng mở tab. |
| **6** | **Bảo Toàn Phân Công CBTD (Preserve Assignment)** | Python đọc `existing_map` của `HDTD_CORE` trên Sheets để bảo toàn 100% hai cột `CBTD_PhuTrach` và `Ten_CBTD` đã được phân công trên WebApp, chỉ tự động gán theo địa bàn cho các hợp đồng mới. | Không bao giờ bị mất phân công cán bộ khi đồng bộ dữ liệu mới từ CoreBanking. |
| **7** | **Bảo Toàn Hợp Đồng Đã Tất Toán (Zero-Record-Loss)** | Nhận diện các hợp đồng không còn xuất hiện trong query dư nợ của SQL Server (`WHERE C.SO_DU > 0`). Giữ nguyên dòng trên Sheets và cập nhật `DuNo = 0`, `TrangThaiHD = 'DA_TAT_TOAN'`. | Bảo toàn lịch sử tín dụng phục vụ tra cứu 360° và báo cáo doanh số giải ngân. |
| **8** | **Làm Sạch Dữ Liệu & Chống Lỗi Formatting** | - Thêm nháy đơn `'` ở đầu `CCCD`, `MaKH`, `SoTK`, `SoTV` chống nuốt số 0.<br>- Ép kiểu tiền tệ thành số nguyên không phần thập phân.<br>- Chuẩn hóa ngày tháng `dd/MM/yyyy` GMT+7.<br>- Thêm `'` vào ô bắt đầu bằng `=`, `+`, `-`, `@` chống Formula Injection (CWE-1236). | Loại bỏ 100% lỗi sai lệch định dạng khi hiển thị trên giao diện WebApp. |

---

## 3. ĐẶC TẢ CẤU TRÚC CHI TIẾT CÁC BẢNG CSDL TỐI ƯU

### 3.1. Bảng `HDTD_CORE` (Mở rộng thành Self-Contained Loan Record)
- **Mục đích**: Chứa toàn bộ thông tin hợp đồng tín dụng và thông tin khách hàng vay vốn. Bất kỳ màn hình nào cần hiển thị hoặc xử lý hợp đồng (Báo cáo sao kê, Thẩm định, Kiểm tra vốn, Lập đợt trích nợ) **chỉ cần đọc bảng này**.
- **Số lượng cột**: 22 cột (Giữ nguyên 16 cột đầu, bổ sung 6 cột mới vào sau).

| STT | Tên Cột (Header) | Kiểu Dữ Liệu | Nguồn Trích Xuất / Quy Tắc Xử Lý Bằng Python |
|:---:|:---|:---:|:---|
| 1 | `SoHDTD` | String | `A.MA_KHE_UOC` (Khóa chính hợp đồng/khế ước) |
| 2 | `MaKH` | String | `D.MA_KHACH_HANG` (Bọc nháy đơn `'` ở đầu) |
| 3 | `TienVay` | Number | `D.SO_TIEN_VAY` (Số tiền giải ngân ban đầu) |
| 4 | `DuNo` | Number | `C.SO_DU` (Dư nợ gốc hiện tại) |
| 5 | `LaiSuat` | Number | `A.LAI_SUAT` (Lãi suất %/năm, làm tròn 2 số thập phân) |
| 6 | `NgayVay` | Date | `D.NGAY_VAY` (Định dạng dd/MM/yyyy) |
| 7 | `DenHan` | Date | `D.NGAY_DAO_HAN` (Định dạng dd/MM/yyyy) |
| 8 | `TraLaiDenNgay` | Date | `A.THU_LAI_DEN_NGAY` (Định dạng dd/MM/yyyy) |
| 9 | `MaLoaiVay` | String | `SP.TEN_SAN_PHAM` (Tên sản phẩm gốc CoreBanking) |
| 10 | `SoThangVay` | Number | `D.SO_THANG_VAY` (Thời hạn vay tính theo tháng) |
| 11 | `MoTaVay` | String | `D.MO_TA_MUC_DICH_VAY` (Mục đích vay vốn) |
| 12 | `CBTD_PhuTrach` | String | Username CBTD (Bảo toàn từ existing_map hoặc gán theo xã) |
| 13 | `Ten_CBTD` | String | Họ tên CBTD (Bảo toàn từ existing_map hoặc gán theo xã) |
| 14 | `TrangThaiHD` | String | `DANG_VAY` (hoặc `DA_TAT_TOAN` nếu DuNo = 0) |
| 15 | `MaLoaiHD` | String | Mã loại HĐ theo hình thức bảo đảm (`THCDBTNMT`, `THBLCDBTNMT`, `NHCDBTNMT`, `THCDB`, `NHCDB`, `NHKDB`, `THKDB`) |
| 16 | `NgayCapNhat` | DateTime | Thời điểm đồng bộ từ Core (dd/MM/yyyy HH:mm:ss) |
| **17** | **`HoTen`** | String | `B.TEN_KHACH_HANG` (Họ và tên khách hàng vay vốn) |
| **18** | **`CCCD`** | String | `B.SO_CMND` (Số CCCD/CMND có nháy đơn `'`) |
| **19** | **`DienThoai`** | String | `B.SO_DI_DONG` (Số điện thoại liên hệ) |
| **20** | **`DiaChi`** | String | `B.DIA_CHI` (Địa chỉ thường trú đầy đủ) |
| **21** | **`KvXa`** | String | **Xã chuẩn hóa**: `Xã Quý Lộc` / `Xã Yên Trường` / `Xã Vĩnh Lộc` |
| **22** | **`KvThon`** | String | **Thôn chuẩn hóa**: `Thôn Tân Lộc`, `Thôn Đan Nê`, `Thôn Tu Mục`... |

---

### 3.2. Bảng `KH_CORE` (Mở rộng thành Customer 360 Unified Profile)
- **Mục đích**: Lưu trữ hồ sơ định danh thành viên và sức khỏe tài chính tổng thể. Không cần quét `HDTD_CORE` để biết khách hàng đang có bao nhiêu hợp đồng hay nợ bao nhiêu tiền.
- **Số lượng cột**: 22 cột (Giữ nguyên 16 cột đầu, bổ sung 6 cột mới vào sau).

| STT | Tên Cột (Header) | Kiểu Dữ Liệu | Nguồn Trích Xuất / Quy Tắc Xử Lý Bằng Python |
|:---:|:---|:---:|:---|
| 1 - 16 | `MaKH` ... `NgayCapNhat` | — | Giữ nguyên 100% cấu trúc hiện tại (MaKH, HoTen, DiaChi, NgaySinh, CCCD, NgayCap, NoiCap, DienThoai, DienThoaiDD, SoTK, KhuVuc, SoTV, SoSoCP, NgayVaoTV, TongTienCP, NgayCapNhat) |
| **17** | **`TongDuNoHienTai`** | Number | Tổng dư nợ vay hiện hữu của KH (`SUM(DuNo)` tính sẵn từ Python) |
| **18** | **`SoLuongHDVay`** | Number | Số lượng hợp đồng đang còn dư nợ (`COUNT(SoHDTD)`) |
| **19** | **`TrangThaiVay`** | String | `DANG_VAY` / `DA_TAT_TOAN` / `CHUA_TUNG_VAY` |
| **20** | **`NhomNoCIC`** | String | Nhóm nợ hiện tại: `Nhóm 1 (Đủ tiêu chuẩn)` / `Nhóm 2`... |
| **21** | **`KvXa`** | String | **Xã chuẩn hóa** phục vụ lọc nhanh danh bạ thành viên |
| **22** | **`KvThon`** | String | **Thôn chuẩn hóa** phục vụ lọc nhanh danh bạ thành viên |

---

### 3.3. Bảng Mới `DASHBOARD_SNAPSHOT` (Bảng Tổng Hợp Điều Hành 16 Dòng)
- **Mục đích**: Phục vụ **DUY NHẤT** màn hình Dashboard Tổng quan. Khi người dùng truy cập trang chủ, GAS **chỉ đọc đúng 1 bảng này với 16 dòng (kích thước < 4 KB)**.
- **Cấu trúc bảng (16 cột)**:

```
Headers: [
  "MaKhuVuc", "TenKhuVuc", "CapKhuVuc", "TongDuNo", "TongTienVay", 
  "SoLuongHD", "SoLuongKH", "DuNoBinhQuan", "DuNo_NongNghiep", "DuNo_TieuDung", 
  "DuNo_ThuongMai", "DuNo_CBTD_Huyen", "DuNo_CBTD_Dinh", "DuNo_CBTD_Nhan", 
  "DuNo_QuaHan", "NgayCapNhat"
]
```

*Danh sách 16 bản ghi cố định trong Sheet:*
1. `TOAN_QUY`: Toàn bộ Quỹ Tín Dụng Nhân Dân Yên Thọ
2. `XA_QUY_LOC`: Xã Quý Lộc (Địa bàn trọng điểm)
3. `XA_YEN_TRUONG`: Xã Yên Trường (Địa bàn mở rộng)
4. `XA_VINH_LOC`: Xã Vĩnh Lộc (Địa bàn liên kết)
5. `THON_TU_MUC`: Thôn Tu Mục (Xã Quý Lộc)
6. `THON_TAN_LOC`: Thôn Tân Lộc (Xã Quý Lộc)
7. `THON_DAN_NE`: Thôn Đan Nê (Xã Quý Lộc)
8. `THON_PHO_KIEU`: Thôn Phố Kiểu (Xã Yên Trường)
9. `THON_LUU_KHE`: Thôn Lựu Khê (Xã Yên Trường)
10. `THON_THAC_QUA`: Thôn Thạc Quả (Xã Yên Trường)
11. `THON_YEN_LAC`: Thôn Yên Lạc (Xã Vĩnh Lộc)
12. `THON_THO_VUC`: Thôn Thọ Vực (Xã Vĩnh Lộc)
13. `THON_PHI_BINH`: Thôn Phi Bình (Xã Vĩnh Lộc)
14. `THON_KY_NGAI`: Thôn Kỳ Ngãi (Xã Vĩnh Lộc)
15. `THON_VINH_KHANG_1`: Thôn Vĩnh Khang 1
16. `THON_VINH_KHANG_2`: Thôn Vĩnh Khang 2

---

### 3.4. Bảng `BC_DOANH_SO_TD` & `TOP_DU_NO_BINH_QUAN`
- **`BC_DOANH_SO_TD` (12 cột)**: Lưu trữ dữ liệu sao kê hợp đồng tín dụng đã được Python gom sẵn thông tin Họ tên, Địa chỉ, Khu vực, Doanh số, Dư nợ.
- **`TOP_DU_NO_BINH_QUAN` (21 cột)**: Lưu trữ danh sách Top 20 khách hàng vay vốn lớn nhất, tính sẵn Dư nợ bình quân, Tỷ trọng % nợ trên toàn quỹ, Xếp hạng huy hiệu (🥇, 🥈, 🥉) và Nhóm cảnh báo mức độ tập trung rủi ro.

---

### 3.5. Cụm CSDL & Quy Trình Lập Đợt Trích Nợ Thực Tế (Lean Auto-Debit Workflow & Schema)

#### A. Định Lượng Quy Mô Nghiệp Vụ Tại QTDND Yên Thọ
- **Quy mô thực tế**: Tối đa khoảng **~300 hợp đồng đăng ký trích nợ trong một tháng** (chia đều làm 3 đợt: kỳ ngày 05 ~ 100 HĐ, kỳ ngày 15 ~ 100 HĐ, kỳ ngày 25 ~ 100 HĐ).
- **Khối lượng lưu trữ cả năm**: $300 \times 12 = \mathbf{3.600\text{ dòng giao dịch/năm}}$ trên Google Sheets.
- **Đánh giá kiến trúc**: Quy mô 3.600 dòng/năm (~350 KB) là **rất nhẹ**, chạy siêu mượt trực tiếp trên Google Sheets. Không cần tách sang Spreadsheet riêng phức tạp, mà chỉ cần chuẩn hóa cấu trúc bảng tinh gọn và quy trình rà soát tự động 2 cấp.

#### B. Đặc Tả Chuẩn 15 Cột Bảng `DANG_KY_TRICH_NO` (Gắn Liền Từng Hợp Đồng)
*Mỗi bản ghi đại diện cho một hợp đồng vay có thỏa thuận trích nợ tự động qua tài khoản CASA (TUYỆT ĐỐI KHÔNG CÓ CỘT SỐ DƯ CASA DO TÍNH CHẤT BẢO MẬT).*

| STT | Tên Cột | Kiểu Dữ Liệu | Ý Nghĩa Nghiệp Vụ | Nguồn Dữ Liệu |
|:---:|:---|:---:|:---|:---|
| 1 | **`SoHDTD`** | String | Số hợp đồng / khế ước tín dụng (Khóa chính) | Từ `HDTD_CORE` |
| 2 | **`NgayVay`** | Date | Ngày giải ngân hợp đồng vay (dd/MM/yyyy) | Từ `HDTD_CORE` |
| 3 | **`TraLaiDenNgay`**| Date | Ngày đã thu lãi gần nhất (dd/MM/yyyy) | Từ `HDTD_CORE` |
| 4 | **`LaiSuat`** | Number | Lãi suất cho vay (%/năm) | Từ `HDTD_CORE` |
| 5 | **`MaKH`** | String | Mã khách hàng (`'0100012`) | Từ `HDTD_CORE` |
| 6 | **`TenKH`** | String | Họ và tên khách hàng vay vốn | Từ `HDTD_CORE` |
| 7 | **`SoTK`** | String | Số tài khoản CASA để trích nợ (`'1028394827`) | Khách hàng đăng ký |
| 8 | **`SoTienLai`** | Number | Tiền lãi tính đến kỳ trích (Tính theo TT 14/2017) | Engine tính toán tự động |
| 9 | **`SoTienNo`** | Number | Tiền nợ tồn đọng kỳ trước chuyển sang (nếu có) | Từ sổ nợ tồn |
| 10 | **`SoGoc`** | Number | Tiền gốc đến hạn phải thu kỳ này (nếu có) | Kế hoạch trả nợ gốc |
| 11 | **`TongTien`** | Number | **`SoTienLai + SoTienNo + SoGoc`** (Số tiền riêng của HĐ) | Tự động cập nhật |
| 12 | **`KyTrichNo`** | Number | Kỳ trích: `1` (Ngày 05), `2` (Ngày 15), `3` (Ngày 25) | Cán bộ/KH chọn |
| 13 | **`TrangThai`** | String | `Hiệu lực` / `Tạm ngưng` / `Đã tất toán` | Tự động đồng bộ |
| 14 | **`GhiChu`** | String | Ghi chú điều khoản ủy quyền trích nợ | Tùy chọn |
| 15 | **`NgayTao`** | DateTime | Ngày đăng ký thỏa thuận trích nợ | Timestamp tạo |

#### C. Quy Trình 4 Bước Tác Nghiệp Lập Đợt Trích Nợ Thực Tế
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 QUY TRÌNH 4 BƯỚC LẬP ĐỢT TRÍCH NỢ THỰC TẾ                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ BƯỚC 1: CHỌN ĐỢT & NẠP DANH SÁCH HỢP ĐỒNG ĐĂNG KÝ TRÍCH NỢ                  │
│ • Chọn Kỳ trích (Kỳ 1 ngày 05, Kỳ 2 ngày 15, Kỳ 3 ngày 25) và Tháng/Năm.     │
│ • Hệ thống nạp các HĐ thuộc kỳ đó từ DANG_KY_TRICH_NO (TrangThai = Hiệu lực)│
├─────────────────────────────────────────────────────────────────────────────┤
│ BƯỚC 2: RÀ SOÁT TỰ ĐỘNG VỚI HDTD_CORE & TÍNH TIỀN LÃI                       │
│ • So khớp SoHDTD với dữ liệu HDTD_CORE mới nhất:                            │
│   - Nếu HĐ đã tất toán (DuNo = 0 hoặc hết nợ): Tự động LOẠI BỎ khỏi đợt.    │
│   - Nếu HĐ còn nợ (DuNo > 0): Lấy ngày TraLaiDenNgay, tính số ngày thực tế. │
│   - Áp dụng công thức chuẩn TT 14/2017: (Dư nợ × Lãi suất × Số ngày) / 36500│
│   - Tự động điền SoTienLai + SoTienNo (nợ tồn) + SoGoc -> TongTien gợi ý.   │
├─────────────────────────────────────────────────────────────────────────────┤
│ BƯỚC 3: CHO PHÉP CÁN BỘ KIỂM TRA & TRỰC TIẾP SỬA SỐ TIỀN (INLINE EDITABLE)  │
│ • Cán bộ có quyền:                                                          │
│   - Tích chọn / bỏ chọn từng hợp đồng đưa vào đợt trích.                    │
│   - SỬA TRỰC TIẾP số tiền trích trên từng hợp đồng (ví dụ: làm tròn tiền,   │
│     thêm tiền gốc, điều chỉnh lãi theo thỏa thuận đột xuất của khách hàng). │
│ • Tổng tiền cả đợt tự động nhảy theo thời gian thực (Live Real-time Total).  │
├─────────────────────────────────────────────────────────────────────────────┤
│ BƯỚC 4: BẤM "LẬP ĐỢT TRÍCH NỢ" -> LƯU TRỮ VÀ XUẤT LỆNH                      │
│ • Ghi nhận Snapshot bất biến vào LICH_SU_TRICH_NO và DOT_TRICH_NO.          │
│ • GỘP THEO KHÁCH HÀNG / SỐ TK CASA:                                         │
│   Tổng tiền gửi CoreBanking trích = Tổng tiền các HĐ của khách hàng đó.    │
│ • Sẵn sàng: Xuất file lệnh CoreBanking/Co-opBank & In Bảng kê A4 3 chữ ký. │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### D. Cơ Chế Gộp Số Tiền Khi Gửi Lệnh Trừ Tiền CoreBanking
- Nếu một khách hàng có **2 hoặc nhiều hợp đồng vay** trong cùng 1 kỳ:
  - *Cấp Hợp Đồng (`Contract Level`)*:
    - HĐ 1 (`2026-1-00294`): Cần trích lãi `1.200.000đ`
    - HĐ 2 (`2026-1-00310`): Cần trích lãi `800.000đ`
  - *Cấp Khách Hàng / Tài Khoản (`Account Level`)*:
    - File lệnh gửi sang CoreBanking / Co-opBank trừ tiền trên tài khoản CASA `SoTK`:
      $$\text{Số tiền gửi Core} = 1.200.000 + 800.000 = \mathbf{2.000.000\text{ VNĐ}}$$
  - *Khi CoreBanking trả kết quả đối soát*:
    - Nếu trừ đủ 2.000.000đ: Cả 2 hợp đồng đều thành công.
    - Nếu trừ thiếu (ví dụ chỉ trừ được 1.200.000đ): Phân bổ đủ 1.200.000đ cho HĐ 1, HĐ 2 bị thiếu 800.000đ $\rightarrow$ Tự động ghi nhận nợ tồn 800.000đ vào `NO_TON_DONG` của HĐ 2 để kỳ sau thu tiếp.


---

## 4. MA TRẬN MA SÁT I/O: ĐO LƯỜNG TRƯỚC & SAU KHI TỐI ƯU

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   SO SÁNH HIỆU NĂNG ĐỌC CỦA HỆ THỐNG                        │
├────────────────────────┬──────────────────────┬─────────────────────────────┤
│ TIÊU CHÍ               │ MÔ HÌNH CŨ (3NF)     │ MÔ HÌNH MỚI (READ-OPTIMIZED)│
├────────────────────────┼──────────────────────┼─────────────────────────────┤
│ Số Sheet đọc cho Dash  │ 7 Sheets             │ 1 Sheet (DASHBOARD_SNAPSHOT)│
│ Số ô dữ liệu quét      │ 85.000+ cells        │ ~250 cells (Giảm 99.7%)     │
│ Vòng lặp Regex địa chỉ │ 5.175 lần (trên GAS) │ 0 lần (Python xử lý trước)  │
│ Thời gian nạp Dash     │ 4.5s – 8.0s          │ < 120ms (Gấp 40 lần) ⚡     │
│ Thời gian nạp Báo cáo  │ 3.5s – 6.0s          │ < 200ms (Gấp 20 lần) ⚡     │
│ Nguy cơ lỗi Quota 429  │ Cao khi nhiều user   │ Triệt tiêu hoàn toàn (0%)   │
└────────────────────────┴──────────────────────┴─────────────────────────────┘
```

---

## 5. LỘ TRÌNH TRIỂN KHAI AN TOÀN TUYỆT ĐỐI (ZERO-BREAKAGE)

Để đảm bảo quá trình nâng cấp không làm gián đoạn bất kỳ hoạt động nào của người dùng trên WebApp:

1. **Giai đoạn 1: Chuẩn bị Script & Python Daemon**:
   - Cập nhật câu lệnh SQL và logic chuẩn hóa trong `python_daemon/queries.sql` và `python_daemon/sync_daemon.py`.
   - Bổ sung định nghĩa schema mới trong `python_daemon/schema_healer.py`.
2. **Giai đoạn 2: Tự động thêm cột trên Google Sheets (Self-Healing)**:
   - Khi Python Daemon hoặc Backend GAS chạy, hệ thống kiểm tra và tự động thêm các cột mới vào cuối sheet `HDTD_CORE` và `KH_CORE` mà **bảo toàn 100% dữ liệu cũ**.
   - Tự động tạo mới sheet `DASHBOARD_SNAPSHOT` (16 dòng).
3. **Giai đoạn 3: Nâng cấp Controller Backend GAS**:
   - Nâng cấp `DashboardController.gs`: Ưu tiên đọc từ `DASHBOARD_SNAPSHOT`. Nếu sheet này chưa có dữ liệu $\rightarrow$ Tự động fallback tính theo cách cũ.
   - Nâng cấp `ReportController.gs`: Đọc trực tiếp `HDTD_CORE` có sẵn Họ tên và Xã/Thôn, bỏ qua việc đọc `KH_CORE`.
4. **Giai đoạn 4: Kiểm chứng toàn diện**:
   - Kiểm tra `npm run build` trên Frontend.
   - Kiểm tra tính nhất quán số liệu giữa SQL Server Core, Google Sheets và WebApp.
