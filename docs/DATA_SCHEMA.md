# CẤU TRÚC DỮ LIỆU TOÀN DIỆN (DATA SCHEMA)
# 11 Bảng CSDL Chuẩn Hóa Trên Google Sheets

Tài liệu này định nghĩa chi tiết 11 bảng CSDL của hệ thống **CreditCores**, các trường thông tin, kiểu dữ liệu, khóa chính và định dạng chuẩn.

---

## 📋 Danh Mục 11 Bảng CSDL

```
1. ROLES             - Quản lý Nhóm Vai Trò & Ma Trận Quyền 360°
2. USERS             - Tài Khoản Cán Bộ & Phân Quyền Cá Nhân Hóa
3. SETTING           - Cấu Hình & Hàng Đợi Lệnh Đồng Bộ Core
4. KH_CORE           - Dữ Liệu Khách Hàng & Thành Viên Góp Vốn
5. HDTD_CORE         - Hợp Đồng Tín Dụng & Khế Ước Dư Nợ
6. DS_TRICH_NO       - Danh Sách Đăng Ký Thỏa Thuận Trích Nợ Tự Động
7. DOT_TRICH_NO      - Quản Lý Các Đợt / Kỳ Trích Nợ Theo Tháng
8. LICH_SU_GIAO_DICH - Chi Tiết Kết Quả Từng Món Vay Trong Đợt
9. NO_TON_DONG       - Sổ Theo Dõi Nợ Tồn Đọng Chuyển Kỳ Sau
10. BAO_CAO_THAM_DINH- Hồ Sơ Thẩm Định Tín Dụng & Định Giá TSĐB
11. KIEM_TRA_VON     - Biên Bản Kiểm Tra Sử Dụng Vốn Sau Giải Ngân
```

---

## 🔍 Chi Tiết Cấu Trúc Từng Bảng

### 1. Bảng `ROLES` (Nhóm Vai Trò & Ma Trận Quyền)
| Cột | Tên Trường | Kiểu Dữ Liệu | Khóa / Ràng Buộc | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `RoleCode` | String | **PK** | Mã nhóm vai trò (`ADMIN`, `CBTD`, `KETOAN`, `LANHDAO`...) |
| B | `RoleName` | String | Required | Tên hiển thị của nhóm |
| C | `Permissions`| JSON String| Required | Mảng JSON chứa danh sách `moduleId` được phép truy cập |
| D | `Description`| String | Optional | Mô tả phạm vi trách nhiệm |
| E | `UpdatedAt` | DateTime | Auto | Ngày giờ cập nhật gần nhất (`dd/MM/yyyy HH:mm:ss`) |

### 2. Bảng `USERS` (Tài Khoản & Phân Quyền Cá Nhân Hóa)
| Cột | Tên Trường | Kiểu Dữ Liệu | Khóa / Ràng Buộc | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `Username` | String | **PK** | Tên đăng nhập duy nhất (vd: `admin`, `cbtd_yentho`) |
| B | `PasswordHash` | String | SHA-256 | Mã băm mật khẩu 64 ký tự hex |
| C | `FullName` | String | Required | Họ và tên đầy đủ của cán bộ |
| D | `Role` | String | **FK (ROLES)**| Nhóm vai trò chính |
| E | `CustomPermissions` | JSON String | Optional | Mảng JSON các quyền riêng lẻ bổ sung ngoài nhóm |
| F | `Status` | String | Enum | `ACTIVE` (Hoạt động) / `LOCKED` (Tạm khóa) |
| G | `CreatedAt` | DateTime | Auto | Ngày tạo tài khoản |
| H | `LastLogin` | DateTime | Auto | Thời điểm đăng nhập gần nhất |

### 3. Bảng `SETTING` (Hàng Đợi Lệnh & Trạng Thái Đồng Bộ)
| Cột | Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| :--- | :--- | :---: | :--- |
| A | `COMMAND` | String | Lệnh điều khiển (`SYNC_DATA` / `IDLE`) |
| B | `STATUS` | String | Trạng thái (`PENDING` / `PROCESSING` / `SUCCESS` / `ERROR`) |
| C | `REQUEST_TIME` | DateTime | Thời gian phát lệnh từ WebApp |
| D | `START_TIME` | DateTime | Thời gian Daemon bắt đầu xử lý |
| E | `FINISH_TIME` | DateTime | Thời gian hoàn tất đồng bộ |
| F | `TOTAL_ROWS` | Number | Tổng số dòng dữ liệu đã đẩy lên Google Sheets |
| G | `MESSAGE` | String | Thông báo chi tiết hoặc lỗi (nếu có) |

### 4. Bảng `KH_CORE` (Thông Tin Khách Hàng & Thành Viên)
| Cột | Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| :--- | :--- | :---: | :--- |
| A | `MaKH` | String (**PK**) | Mã định danh khách hàng trên CoreBanking |
| B | `HoTen` | String | Họ và tên khách hàng (In hoa) |
| C | `DiaChi` | String | Địa chỉ cư trú (Thôn/Xã) |
| D | `NgaySinh` | Date (`dd/MM/yyyy`) | Ngày tháng năm sinh |
| E | `CCCD` | String (12 số) | Số Căn cước công dân / CMND |
| F | `NgayCap` | Date | Ngày cấp CCCD |
| G | `NoiCap` | String | Cơ quan cấp (Cục CSQLHC về TTXH...) |
| H | `DienThoai` | String | Điện thoại bàn cố định |
| I | `DienThoaiDD`| String (10 số) | Số điện thoại di động chính |
| J | `SoTK` | String | Số tài khoản thanh toán tiền gửi (CASA) trích nợ |
| K | `KhuVuc` | String | Địa bàn (Thôn 1, Thôn 2, Xã Yên Thọ, Yên Bái...) |
| L | `SoTV` | String | Mã số thành viên Quỹ Tín Dụng |
| M | `SoSoCP` | String | Số sổ chứng nhận cổ phần xác lập |
| N | `NgayVaoTV` | Date | Ngày chính thức gia nhập thành viên |
| O | `TongTienCP` | Number (VNĐ) | Tổng giá trị vốn góp cổ phần đã đóng |

### 5. Bảng `HDTD_CORE` (Hợp Đồng Tín Dụng & Khế Ước Dư Nợ)
| Cột | Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| :--- | :--- | :---: | :--- |
| A | `SoHDTD` | String (**PK**) | Số hợp đồng tín dụng / Mã khế ước nhận nợ |
| B | `MaKH` | String (**FK**) | Mã khách hàng vay vốn |
| C | `TienVay` | Number (VNĐ) | Số tiền giải ngân ban đầu theo hợp đồng |
| D | `DuNo` | Number (VNĐ) | Dư nợ gốc thực tế hiện tại |
| E | `LaiSuat` | Number (%/năm)| Lãi suất cho vay theo hợp đồng |
| F | `NgayVay` | Date | Ngày bắt đầu giải ngân |
| G | `DenHan` | Date | Ngày đáo hạn hợp đồng |
| H | `TraLaiDenNgay`| Date | Ngày đã thu lãi đến hạn gần nhất |
| I | `MaLoaiVay` | String | Mã sản phẩm tín dụng (LV01: Chăn nuôi, LV02: Trồng trọt...) |
| J | `SoThangVay` | Number | Thời hạn vay tính theo tháng |
| K | `MoTaVay` | String | Mục đích vay vốn chi tiết |

### 6. Bảng `DS_TRICH_NO` (Đăng Ký Dịch Vụ Trích Nợ Tự Động)
| Cột | Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| :--- | :--- | :---: | :--- |
| A | `MaKH` | String (**PK**) | Mã khách hàng đăng ký dịch vụ |
| B | `HoTen` | String | Tên khách hàng |
| C | `GTTT` | String | Số CCCD/CMND |
| D | `DiaChi` | String | Địa chỉ |
| E | `SoTK` | String | Số tài khoản CASA ủy quyền trích nợ |
| F | `KyTrich` | Number (1/2/3) | Kỳ trích cố định: **Kỳ 1 (ngày 05)**, **Kỳ 2 (ngày 15)**, **Kỳ 3 (ngày 25)** |
| G | `TrangThai` | String | `Hieu luc` (Đang hoạt động) / `Tam dung` / `Huy bo` |
| H | `GhiChu` | String | Ghi chú điều khoản ủy quyền |

### 7. Bảng `DOT_TRICH_NO` (Quản Lý Các Đợt Trích Nợ Theo Tháng)
| Cột | Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| :--- | :--- | :---: | :--- |
| A | `MaDot` | String (**PK**) | Mã đợt trích (vd: `DOT-202608-K1`) |
| B | `ThangNam` | String (`yyyyMM`) | Tháng năm thực hiện (vd: `202608`) |
| C | `KyTrich` | Number (1/2/3) | Kỳ trích |
| D | `TongPhaiThu` | Number (VNĐ) | Tổng số tiền phải thu trong đợt (Gốc + Lãi + Nợ tồn) |
| E | `TongDaTrich` | Number (VNĐ) | Tổng số tiền đã trích thành công từ Core |
| F | `TongConNo` | Number (VNĐ) | Tổng số tiền trích không thành công |
| G | `NgayTao` | DateTime | Thời điểm lập đợt trích |
| H | `TrangThai` | String | `KHOI_TAO` $\to$ `CHO_DUYET` $\to$ `DANG_TRICH` $\to$ `HOAN_TAT` |

### 8. Bảng `LICH_SU_GIAO_DICH` (Chi Tiết Kết Quả Từng Món Vay Trong Đợt)
| Cột | Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| :--- | :--- | :---: | :--- |
| A | `IDGiaoDich` | String (**PK**) | Mã giao dịch (`GD-DOT-202608-K1-KU-0982`) |
| B | `MaDot` | String (**FK**) | Mã đợt trích |
| C | `MaKH` | String | Mã khách hàng |
| D | `SoHDTD` | String | Số khế ước |
| E | `SoTK` | String | Số tài khoản CASA trích tiền |
| F | `PhaiThuGoc` | Number (VNĐ) | Gốc đến hạn phải thu trong kỳ |
| G | `PhaiThuLai` | Number (VNĐ) | Lãi phát sinh phải thu trong kỳ |
| H | `NoTonTruoc` | Number (VNĐ) | Nợ tồn đọng từ kỳ trước chuyển sang |
| I | `TongPhaiThu` | Number (VNĐ) | Tổng cộng phải thu ($F + G + H$) |
| J | `DaTrich` | Number (VNĐ) | Số tiền Core đã cắt nợ thực tế |
| K | `ConNo` | Number (VNĐ) | Số tiền còn nợ ($I - J$) |
| L | `KetQua` | String | `THANH_CONG` / `TRICH_MOT_PHAN` / `THAT_BAI` |
| M | `LyDoLoi` | String | Nguyên nhân (vd: *Không đủ số dư*, *Tài khoản phong tỏa*) |
| N | `NgayCapNhat` | DateTime | Thời điểm đối soát hạch toán |

### 9. Bảng `NO_TON_DONG` (Sổ Theo Dõi Nợ Tồn Đọng Chuyển Kỳ Sau)
| Cột | Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| :--- | :--- | :---: | :--- |
| A | `MaKH` | String | Mã khách hàng |
| B | `SoHDTD` | String | Số khế ước còn nợ |
| C | `GocTon` | Number (VNĐ) | Tiền gốc chưa thu được |
| D | `LaiTon` | Number (VNĐ) | Tiền lãi chưa thu được |
| E | `TongNoTon` | Number (VNĐ) | Tổng nợ tồn đọng |
| F | `KyPhatSinh` | String | Đợt trích phát sinh nợ tồn |
| G | `TrangThai` | String | `CHUA_THU` / `DANG_DON_DOC` / `DA_THU_HOI` |
| H | `NgayCapNhat` | DateTime | Ngày cập nhật |

### 10. Bảng `BAO_CAO_THAM_DINH` (Hồ Sơ Thẩm Định & TSĐB)
| Cột | Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| :--- | :--- | :---: | :--- |
| A | `MaBCTD` | String (**PK**) | Mã biên bản thẩm định (`BCTD-2026-081`) |
| B | `MaKH` | String | Mã khách hàng |
| C | `HoTen` | String | Tên khách hàng |
| D | `DeXuatVay` | Number (VNĐ) | Số tiền khách hàng đề nghị vay |
| E | `DuyetVay` | Number (VNĐ) | Số tiền cán bộ thẩm định đề xuất phê duyệt |
| F | `ThoiHanThang` | Number | Thời hạn vay đề xuất (tháng) |
| G | `LaiSuatDuyet` | Number (%/năm)| Lãi suất đề xuất |
| H | `ThuNhapThang` | Number (VNĐ) | Thu nhập bình quân hàng tháng |
| I | `XepHangCIC` | String | Xếp hạng tín dụng CIC (`Hang A`, `Hang B`, `Hang C`) |
| J | `LoaiTSBD` | String | Loại tài sản (QSDĐ, Nhà ở, Xe ô tô, Giấy tờ có giá...) |
| K | `ChuSoHuuTSBD`| String | Chủ sở hữu hợp pháp tài sản |
| L | `MoTaTSBD` | String | Chi tiết số thửa, tờ bản đồ, diện tích |
| M | `GiaTriTSBD` | Number (VNĐ) | Giá trị định giá tài sản bảo đảm |
| N | `TyLeLTV` | String (%) | Tỷ lệ cho vay trên giá trị TSĐB ($\frac{\text{DuyetVay}}{\text{GiaTriTSBD}}$) |
| O | `HinhAnhTSBD` | String (URL) | Link thư mục hình ảnh giấy tờ TSĐB trên Google Drive |
| P | `HinhAnhThamDinh`| String (URL) | Link ảnh thực địa cơ sở kinh doanh / nhà ở |
| Q | `MucDoRuiRo` | String | `Thap` / `Trung binh` / `Cao` |
| R | `KetLuan` | String | Kết luận thẩm định (`Dong y cap tin dung` / `Tu choi`) |
| S | `NgayLap` | Date | Ngày lập báo cáo |
| T | `CanBoThamDinh` | String | Cán bộ tín dụng phụ trách |

### 11. Bảng `KIEM_TRA_VON` (Biên Bản Kiểm Tra Sử Dụng Vốn Sau Giải Ngân)
| Cột | Tên Trường | Kiểu Dữ Liệu | Mô Tả |
| :--- | :--- | :---: | :--- |
| A | `MaBBKT` | String (**PK**) | Mã biên bản kiểm tra (`BBKT-2026-0045`) |
| B | `SoHDTD` | String | Số hợp đồng tín dụng được kiểm tra |
| C | `MaKH` | String | Mã khách hàng |
| D | `HoTen` | String | Tên khách hàng |
| E | `LoaiDoanKT` | String | Đoàn kiểm tra: `CBTD` (Cán bộ tín dụng), `BKS` (Ban kiểm soát), `HDQT` (Hội đồng quản trị) |
| F | `ThanhPhanDoan` | String | Danh sách các thành viên tham gia đoàn kiểm tra |
| G | `NgayKiemTra` | Date (`dd/MM/yyyy`)| Ngày tiến hành kiểm tra thực tế |
| H | `LanKiemTra` | String | Lần kiểm tra: `Lần 1 (Sau giải ngân 30 ngày)` / `Lần 2 (Định kỳ 6 tháng)` / `Đột xuất` |
| I | `NgayKTNext` | Date (`dd/MM/yyyy`)| Ngày dự kiến kiểm tra tiếp theo (định kỳ +3T, +6T, +12T) |
| J | `HinhThuc` | String | Hình thức: `Thực địa tại cơ sở` / `Kiểm tra hóa đơn chứng từ` / `Kết hợp` |
| K | `DiaDiemKT` | String | Địa điểm kiểm tra thực tế (Thôn/Xã/Nơi SXKD) |
| L | `DanhGiaMucDich` | String | Đánh giá mục đích: `Đúng mục đích 100%` / `Sai mục đích một phần` / `Chưa đưa vào sử dụng` |
| M | `TienDoSuDungVon`| String | Tiến độ giải ngân và đưa vốn vào SXKD thực tế |
| N | `MucDoRuiRo` | String | Mức độ rủi ro: `Thấp` / `Trung bình` / `Cao` |
| O | `MoTaThucTe` | String | Ghi nhận chi tiết hiện trạng hiện trường, chuồng trại, máy móc, hóa đơn |
| P | `KienNghi` | String | Kết luận & Kiến nghị của đoàn kiểm tra (Duy trì / Nâng hạn mức / Thu hồi trước hạn) |
| Q | `FileBienBanUrl` | String (URL) | Link tải / xem tệp Biên bản kiểm tra đã ký (Google Drive PDF / DOC) |
| R | `HinhAnhKiemTra` | String (URL) | Link thư mục hình ảnh hiện trường thực địa trên Google Drive |
| S | `TrangThai` | String | `ĐÃ_DUYỆT` / `CHỜ_DUYỆT` |
| T | `NgayTao` | DateTime | Ngày giờ lập biên bản trên hệ thống |

---

## 🕒 3. Quy Tắc Định Dạng Ngày Tháng (Date Normalization Protocol)

1. **Hiển thị trên Giao diện Người dùng (Frontend Display)**:
   - **Bắt buộc**: 100% các trường ngày hiển thị chuẩn Việt Nam **`dd/MM/yyyy`** (ví dụ: `18/08/2026`).
   - Các trường có thời gian hiển thị **`dd/MM/yyyy HH:mm:ss`** (ví dụ: `18/08/2026 14:30:00`).
   - Sử dụng thư viện tiện ích [`src/utils/dateUtils.js`](../src/utils/dateUtils.js) (`formatDateVN`, `formatDateTimeVN`).
2. **Ghi nhận vào Google Sheets & API (Database Storage)**:
   - Google Apps Script chuyển đổi sang đối tượng `Date` hoặc chuẩn quốc tế ISO `yyyy-MM-dd` kết hợp thiết lập `setNumberFormat("dd/MM/yyyy")` trên toàn bộ cột để Google Sheets lưu trữ chính xác mà không bị đảo lộn ngày/tháng do cài đặt vùng miền (Locale).

---

## ⚡ 4. Cơ Chế Tối Ưu Hóa & Bảo Vệ Hạn Ngạch Tài Khoản Google Miễn Phí (Google Free Quota Protection)

Nhằm đảm bảo hệ thống vận hành 24/7 liên tục mà không bao giờ chạm ngưỡng giới hạn (Rate Limits / API Quotas) của tài khoản Google Free:

1. **Tầng Caching ScriptCache trên Backend (`gas_backend/Code.gs`)**:
   - Sử dụng `CacheService.getScriptCache()` lưu tạm kết quả của các hàm đọc nhiều (`getDashboardStats`, `getRolesAndPermissions`, `getDebtWarnings`) với TTL 20 - 60 giây.
   - Giảm tải **hơn 90% số lượng request đọc Google Sheets API**, giúp Web App phản hồi tức thì dưới 100ms.
   - Tự động xóa Cache (Cache Invalidation) khi phát sinh thao tác ghi mới (`saveAppraisalReport`, `reconcileUpload`, `saveUser`...).
2. **Thao Tác Dữ Liệu Theo Lô (Batch Operations)**:
   - Tuyệt đối không gọi `getValue()` hoặc `setValue()` trong vòng lặp. Toàn bộ thao tác đọc/ghi đều sử dụng mảng 2 chiều (`getRange().getValues()` và `setValues()`).
   - Chỉ gọi `SpreadsheetApp.flush()` đúng 1 lần khi kết thúc phiên xử lý.
3. **Chống Race Condition & Khóa Giao Dịch An Toàn**:
   - Sử dụng `LockService.getScriptLock()` với thời gian chờ 10 giây và khối lệnh `try ... finally { lock.releaseLock() }` đảm bảo an toàn tuyệt đối cho số liệu.
4. **Debounce 350ms trên Giao Diện Tìm Kiếm**:
   - Mọi ô tìm kiếm (Tra cứu 360°, Thẩm định, Sổ nợ) đều được trang bị bộ đệm thời gian 350ms, tránh việc người dùng gõ từng ký tự làm kích hoạt hàng loạt request không cần thiết.

