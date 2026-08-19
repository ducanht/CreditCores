# CẤU TRÚC DỮ LIỆU TOÀN DIỆN (DATA SCHEMA) & QUẢN TRỊ CSDL
# 12 Bảng CSDL Chuẩn Hóa Trên Google Sheets

Tài liệu này định nghĩa chi tiết 12 bảng CSDL của hệ thống **CreditCores**, cơ chế lưu trữ đợt trích nợ 2 cấp (Master - Detail), xử lý snapshot hợp đồng và cơ chế tự động kiểm soát cấu trúc dữ liệu (**Schema Governance & Auto-Migration**).

---

## 📋 Danh Mục 12 Bảng CSDL Chuẩn

```
1. ROLES             - Quản lý Nhóm Vai Trò & Ma Trận Quyền 360°
2. USERS             - Tài Khoản Cán Bộ & Phân Quyền Cá Nhân Hóa
3. SETTING           - Cấu Hình & Hàng Đợi Lệnh Đồng Bộ Core 24/7
4. KH_CORE           - Dữ Liệu Khách Hàng & Thành Viên Góp Vốn (Kèm NgayCapNhat)
5. HDTD_CORE         - Hợp Đồng Tín Dụng & Khế Ước Dư Nợ Hiện Hữu (Active Snapshot)
6. DANG_KY_TRICH_NO  - Danh Sách Đăng Ký Thỏa Thuận Trích Nợ Tự Động CASA
7. DOT_TRICH_NO      - Bảng Master Quản Lý Các Đợt Trích Nợ Định Kỳ (Kỳ 1, 2, 3)
8. CHI_TIET_TRICH_NO - Bảng Detail Lưu Vĩnh Viễn Snapshot Từng Món Nợ Trong Đợt
9. NO_TON_DONG       - Sổ Theo Dõi Nợ Tồn Đọng Chuyển Kỳ Sau & Cảnh Báo
10. THAM_DINH_TD     - Hồ Sơ Thẩm Định Tín Dụng, CIC, TSĐB & Ý Kiến Đa Cấp
11. KIEM_TRA_VON     - Biên Bản Kiểm Tra Sử Dụng Vốn Sau Giải Ngân (CBTD, BKS, HĐQT)
12. CAU_HINH_BIEU_MAU- Kho Biểu Mẫu Google Docs/Word & Thẻ Biến Mail Merge
```

---

## 🏛️ 1. Cơ Chế Lưu Trữ Đợt Trích Nợ 2 Cấp (Master - Detail Snapshot)

Hàng tháng có 3 kỳ trích nợ (ngày 05, 15, 25) với 100 - 200 khách hàng/tháng (~1.200 - 2.400 dòng/năm). CSDL Google Sheets lưu trữ hoàn hảo 10-20 năm với hiệu năng cao:

### A. Bảng Master: `DOT_TRICH_NO`
| Cột | Tên Trường | Kiểu | Mô Tả |
| :--- | :--- | :---: | :--- |
| A | `MaDot` | String | **PK** (vd: `DOT-202608-K1`, `DOT-202608-K2`, `DOT-202608-K3`) |
| B | `ThangNam` | String | Tháng năm thu nợ (`202608`) |
| C | `KyTrich` | Number | Kỳ trích (`1`: Ngày 05, `2`: Ngày 15, `3`: Ngày 25) |
| D | `TongPhaiThu` | Number | Tổng tiền trích nợ dự kiến của cả đợt (VNĐ) |
| E | `TongDaTrich` | Number | Tổng số tiền cắt nợ thành công qua CoreBanking (VNĐ) |
| F | `TongConNo` | Number | Tổng nợ chưa thu được chuyển sang sổ nợ tồn (VNĐ) |
| G | `TongSoKH` | Number | Số lượng khách hàng tham gia đợt trích nợ |
| H | `TrangThai` | Enum | `CHO_TRICH_NO` $\to$ `DANG_TRICH` $\to$ `HOAN_TAT` |
| I | `NgayTao` | DateTime | Thời điểm khởi tạo đợt trích nợ |
| J | `NgayHoanTat` | DateTime | Thời điểm đối soát và chốt sổ đợt |

### B. Bảng Detail: `CHI_TIET_TRICH_NO` (Lưu trữ vĩnh viễn Snapshot hợp đồng)
| Cột | Tên Trường | Kiểu | Mô Tả |
| :--- | :--- | :---: | :--- |
| A | `MaDot` | String | **FK (DOT_TRICH_NO)** |
| B | `MaKH` | String | Mã khách hàng (vd: `KH008892`) |
| C | `HoTen` | String | Họ và tên khách hàng |
| D | `SoCCCD` | String | Số CCCD (12 số có số 0 đầu) |
| E | `SoTK_CASA` | String | Số tài khoản thanh toán CASA ủy quyền trích nợ |
| F | `SoHDTD` | String | Danh sách các số hợp đồng/khế ước đang vay tại thời điểm lập đợt |
| G | `DuNoGoc_Snap`| Number | **Dư nợ gốc của khách hàng tại thời điểm lập đợt** (Snapshot) |
| H | `LaiDuKien` | Number | Tiền lãi phát sinh tính toán tự động (VNĐ) |
| I | `GocDuKien` | Number | Tiền gốc đến hạn (nếu có) (VNĐ) |
| J | `SoTienTrichThucTe`| Number | **Số tiền trích nợ thực tế sau khi CBTD điều chỉnh** (VNĐ) |
| K | `DaTrich` | Number | Số tiền CoreBanking đã cắt thành công (VNĐ) |
| L | `ConNo` | Number | Số tiền trích thiếu / thất bại (VNĐ) |
| M | `TrangThai` | Enum | `CHO_XU_LY` $\to$ `DA_TRICH_DU` / `TRICH_MOT_PHAN` / `THAT_BAI` |
| N | `MaGiaoDichCore`| String | Mã bút toán ghi nhận từ CoreBanking |
| O | `NgayCapNhat`| DateTime | Thời điểm cập nhật trạng thái gần nhất |

---

## 🔄 2. Xử Lý Hợp Đồng Đã Tất Toán Khi Đồng Bộ SQL Server

1. **Trên SQL Server Core**: Câu lệnh query chỉ lấy các hợp đồng đang hoạt động và còn dư nợ:
   ```sql
   WHERE ku.DuNo > 0 AND ku.TrangThai = 'A'
   ```
2. **Trên Sheet `HDTD_CORE`**: Luôn là **Active Snapshot** (chỉ chứa các hợp đồng đang vay). Hợp đồng đã tất toán sẽ tự động không còn xuất hiện trong `HDTD_CORE`.
3. **Bảo Toàn Lịch Sử Tuyệt Đối**: Khi một đợt trích nợ được tạo, toàn bộ thông tin hợp đồng, số tiền vay và dư nợ lúc đó đã được ghi cứng vĩnh viễn vào **`CHI_TIET_TRICH_NO`**. Do đó, việc hợp đồng tất toán trên SQL Server hoàn toàn **không ảnh hưởng tới dữ liệu lịch sử các tháng trước**.

---

## 🛡️ 3. Cơ Chế Kiểm Soát Toàn Vẹn CSDL & Tự Động Nâng Cấp (Schema Governance)

Hệ thống được bảo vệ bởi 3 tầng kiểm soát:

1. **Auto-Migration Không Mất Dữ Liệu ([`gas_backend/Database/SchemaSetup.gs`](file:///d:/Antigravity%20Projects/CreditCores/gas_backend/Database/SchemaSetup.gs))**:
   * Khi cần bổ sung cột mới: Script tự động quét dòng tiêu đề hiện tại của Sheet. Nếu thiếu cột mới, script sẽ tự động bổ sung cột mà **giữ nguyên 100% dữ liệu cũ**, không bao giờ ghi đè hay làm hỏng dữ liệu.
2. **Kiểm Soát Kiểu Dữ Liệu (Data Integrity)**:
   * Các cột nhạy cảm như `CCCD`, `SoTK`, `SoHDTD` luôn được lưu dưới dạng Text chuỗi (`@` hoặc có dấu `'038...`) để chống mất số 0 đầu.
   * Các cột số tiền luôn được định dạng `#,#00` số nguyên để tránh lỗi tính toán `#VALUE!`.
3. **Quy Trình Quản Trị Tài Liệu Bắt Buộc (Living Documentation)**:
   * Bất kỳ khi nào mở rộng trường dữ liệu trong code frontend hoặc backend, lập tức đối chiếu và cập nhật vào file `docs/DATA_SCHEMA.md` này.
