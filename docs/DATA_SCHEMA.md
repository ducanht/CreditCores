# 🏛️ CẤU TRÚC DỮ LIỆU TOÀN DIỆN (DATA SCHEMA) & QUẢN TRỊ CSDL
# 14 Bảng CSDL Chuẩn Hóa Trên Google Sheets + 2 Bảng Báo Cáo Mở Rộng — CreditCores
# Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)

Tài liệu này định nghĩa chi tiết **14 bảng CSDL chuẩn** và **2 bảng báo cáo phân tích mở rộng** của hệ thống **CreditCores**, cơ chế lưu trữ đợt trích nợ 2 cấp (Master - Detail), snapshot hợp đồng bất biến, chuẩn hóa định dạng kiểu dữ liệu và cơ chế tự động kiểm soát cấu trúc dữ liệu (**Schema Governance & Auto-Migration**).

---

## 📋 Danh Mục 14 Bảng CSDL Chuẩn + 2 Bảng Mở Rộng

```
=== DANH MỤC 14 BẢNG VẬN HÀNH CHUẨN HÓA ===
1.  ROLES              - Quản lý Nhóm Vai Trò & Ma Trận Quyền 360° (5 cột)
2.  USERS              - Tài Khoản Cán Bộ & Phân Quyền Cá Nhân Hóa (8 cột)
3.  SETTING            - Cấu Hình & Hàng Đợi Lệnh Đồng Bộ Core 24/7 (7 cột)
4.  KH_CORE            - Dữ Liệu Khách Hàng & Thành Viên Góp Vốn (16 cột)
5.  HDTD_CORE          - Hợp Đồng Tín Dụng & Khế Ước Dư Nợ Hiện Hữu (16 cột)
6.  DANG_KY_TRICH_NO   - Danh Sách Đăng Ký Thỏa Thuận Trích Nợ Tự Động CASA (9 cột)
7.  DOT_TRICH_NO       - Bảng Master Quản Lý Các Đợt Trích Nợ Định Kỳ (10 cột)
8.  CHI_TIET_TRICH_NO  - Bảng Detail Lưu Vĩnh Viễn Snapshot Từng Món Nợ Trong Đợt (15 cột)
9.  NO_TON_DONG        - Sổ Theo Dõi Nợ Tồn Đọng Chuyển Kỳ Sau & Cảnh Báo (9 cột)
10. THAM_DINH_TD       - Hồ Sơ Thẩm Định Tín Dụng, CIC, TSĐB & Ý Kiến Đa Cấp (74 cột)
11. KIEM_TRA_VON       - Biên Bản Kiểm Tra Sử Dụng Vốn Sau Giải Ngân (20 cột)
12. TSBD_CORE          - Kho Danh Mục Tài Sản Bảo Đảm, Sổ Đỏ, Định Giá & Pháp Lý (31 cột)
13. CAU_HINH_BIEU_MAU - Kho Biểu Mẫu Google Docs/Word & Thẻ Biến Mail Merge (10 cột)
14. DOCUMENT_STORAGE   - Nhật Ký Lưu Trữ Tài Liệu Đã Xuất Bản Trên Google Drive (9 cột)

=== DANH MỤC 2 BẢNG BÁO CÁO PHÂN TÍCH MỞ RỘNG ===
15. BC_DOANH_SO_TD     - Sao Kê Hợp Đồng Tín Dụng & Doanh Số Theo Khoảng Thời Gian (12 cột)
16. TOP_DU_NO_BINH_QUAN- Bảng Xếp Hạng Khách Hàng Có Dư Nợ Bình Quân Năm Cao Nhất (21 cột)
```

---

## 📑 1. Từ Điển Dữ Liệu Chi Tiết 14 Bảng Vận Hành (Data Dictionary)

### 1. `ROLES` (Quản Lý Nhóm Vai Trò)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `RoleCode` | String | `@` | Mã vai trò (PK: `ADMIN`, `CBTD`, `KETOAN`, `BKS`, `LANHDAO`) |
| B | `RoleName` | String | `@` | Tên vai trò hiển thị đầy đủ |
| C | `Permissions` | String (JSON) | `@` | Danh sách mã module được cấp quyền `["dashboard", "appraisal", ...]` |
| D | `Description` | String | `@` | Mô tả trách nhiệm và quyền hạn |
| E | `UpdatedAt` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm cập nhật vai trò gần nhất |

### 2. `USERS` (Tài Khoản Cán Bộ & Phân Quyền)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `Username` | String | `@` | Tên đăng nhập (PK: `qtdyentho.admin`, `qtdyentho.cbtd`...) |
| B | `PasswordHash` | String | `@` | Mật khẩu băm SHA-256 an toàn |
| C | `FullName` | String | `@` | Họ và tên cán bộ |
| D | `Role` | String | `@` | Mã vai trò chính (`ADMIN`, `CBTD`, `KETOAN`, `BKS`, `LANHDAO`) |
| E | `CustomPermissions` | String (JSON) | `@` | Quyền tùy biến bổ sung ngoài nhóm |
| F | `Status` | Enum | `@` | Trạng thái tài khoản (`ACTIVE`, `LOCKED`) |
| G | `CreatedAt` | DateTime | `dd/MM/yyyy HH:mm:ss` | Ngày tạo tài khoản |
| H | `LastLogin` | DateTime | `dd/MM/yyyy HH:mm:ss` | Lần đăng nhập gần nhất |

### 3. `SETTING` (Hàng Đợi Lệnh & Cấu Hình Đồng Bộ)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `COMMAND` | String | `@` | Lệnh đồng bộ (`IDLE`, `SYNC_DATA`, `EXPORT_LOAN_STATEMENT`) |
| B | `STATUS` | Enum | `@` | Trạng thái thực thi (`SUCCESS`, `PENDING`, `RUNNING`, `ERROR`) |
| C | `REQUEST_TIME` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm WebApp gửi lệnh |
| D | `START_TIME` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm Python Daemon nhận lệnh |
| E | `FINISH_TIME` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm Python Daemon hoàn thành |
| F | `TOTAL_ROWS` | Number | `#,##0` | Số dòng dữ liệu đã xử lý |
| G | `MESSAGE` | String | `@` | Thông điệp phản hồi hoặc chi tiết lỗi |

### 4. `KH_CORE` (Dữ Liệu Khách Hàng & Thành Viên)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `MaKH` | String | `@` | Mã khách hàng (PK: `KH008892` - luôn có số 0 đầu) |
| B | `HoTen` | String | `@` | Họ và tên khách hàng |
| C | `DiaChi` | String | `@` | Địa chỉ thường trú |
| D | `NgaySinh` | Date | `dd/MM/yyyy` | Ngày tháng năm sinh |
| E | `CCCD` | String | `@` | Số CCCD 12 chữ số (có số 0 đầu) |
| F | `NgayCap` | Date | `dd/MM/yyyy` | Ngày cấp CCCD |
| G | `NoiCap` | String | `@` | Nơi cấp CCCD |
| H | `DienThoai` | String | `@` | Số điện thoại bàn |
| I | `DienThoaiDD` | String | `@` | Số điện thoại di động |
| J | `SoTK` | String | `@` | Số tài khoản tiền gửi thanh toán CASA (luôn có số 0 đầu) |
| K | `KhuVuc` | String | `@` | Địa bàn (Thôn, Xã Yên Thọ, Yên Trường, Quý Lộc) |
| L | `SoTV` | String | `@` | Số thẻ thành viên QTDND |
| M | `SoSoCP` | String | `@` | Số sổ cổ phần góp vốn |
| N | `NgayVaoTV` | Date | `dd/MM/yyyy` | Ngày kết nạp thành viên |
| O | `TongTienCP` | Number | `#,##0` | Tổng giá trị vốn góp cổ phần (VNĐ) |
| P | `NgayCapNhat` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm cập nhật dữ liệu từ SQL Server |

### 5. `HDTD_CORE` (Hợp Đồng Vay & Dư Nợ Hiện Hữu)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `SoHDTD` | String | `@` | Số hợp đồng / khế ước tín dụng (PK) |
| B | `MaKH` | String | `@` | Mã khách hàng (FK `KH_CORE`) |
| C | `TienVay` | Number | `#,##0` | Số tiền giải ngân ban đầu (VNĐ) |
| D | `DuNo` | Number | `#,##0` | Dư nợ gốc hiện tại (VNĐ, = 0 nếu đã tất toán) |
| E | `LaiSuat` | Number | `0.00` | Lãi suất cho vay (%/năm) |
| F | `NgayVay` | Date | `dd/MM/yyyy` | Ngày giải ngân nhận nợ |
| G | `DenHan` | Date | `dd/MM/yyyy` | Ngày đáo hạn hợp đồng |
| H | `TraLaiDenNgay` | Date | `dd/MM/yyyy` | Ngày đã thanh toán lãi gần nhất |
| I | `MaLoaiVay` | String | `@` | Mã/Tên sản phẩm cho vay (`LV01`, `Nông nghiệp`...) |
| J | `SoThangVay` | Number | `#,##0` | Thời hạn vay (tháng) |
| K | `MoTaVay` | String | `@` | Phương án sản xuất kinh doanh |
| L | `CBTD_PhuTrach` | String | `@` | Username Cán bộ Tín dụng quản lý HĐ (Bảo toàn khi sync) |
| M | `Ten_CBTD` | String | `@` | Họ tên đầy đủ CBTD phụ trách (Bảo toàn khi sync) |
| N | `TrangThaiHD` | Enum | `@` | Trạng thái hợp đồng (`DANG_VAY`, `DA_TAT_TOAN`) |
| O | `NgayTatToan` | String | `dd/MM/yyyy` | Ngày ghi nhận tất toán (khi dư nợ Core về 0) |
| P | `NgayCapNhat` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm đồng bộ từ SQL Server hoặc phân công |

### 6. `DANG_KY_TRICH_NO` (Ủy Quyền Trích Nợ CASA)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `MaKH` | String | `@` | Mã khách hàng đăng ký |
| B | `HoTen` | String | `@` | Họ tên khách hàng |
| C | `GTTT` | String | `@` | Số CCCD / Giấy tờ tùy thân |
| D | `SoTK` | String | `@` | Số tài khoản CASA được ủy quyền trích nợ |
| E | `DiaChi` | String | `@` | Địa chỉ khách hàng |
| F | `KyTrich` | Number | `#,##0` | Kỳ trích nợ đăng ký (`1`: Ngày 05, `2`: Ngày 15, `3`: Ngày 25) |
| G | `TrangThai` | Enum | `@` | Trạng thái (`Hiệu lực`, `Tạm ngưng`) |
| H | `GhiChu` | String | `@` | Ghi chú thêm |
| I | `NgayTao` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm đăng ký thỏa thuận |

### 7. `DOT_TRICH_NO` (Bảng Master Quản Lý Đợt Trích Nợ)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `MaDot` | String | `@` | Mã đợt trích nợ (PK: `DOT-202608-K1`, `DOT-202608-K2`) |
| B | `ThangNam` | String | `@` | Tháng năm thu nợ (`202608`) |
| C | `KyTrich` | Number | `#,##0` | Kỳ trích nợ (`1`, `2`, `3`) |
| D | `TongPhaiThu` | Number | `#,##0` | Tổng tiền trích nợ dự kiến của cả đợt (VNĐ) |
| E | `TongDaTrich` | Number | `#,##0` | Tổng tiền CoreBanking đã cắt thành công (VNĐ) |
| F | `TongConNo` | Number | `#,##0` | Tổng tiền nợ chưa thu được (VNĐ) |
| G | `TongSoKH` | Number | `#,##0` | Tổng số lượng khách hàng tham gia đợt |
| H | `TrangThai` | Enum | `@` | Trạng thái (`CHO_TRICH_NO`, `DANG_TRICH`, `HOAN_TAT`) |
| I | `NgayTao` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm khởi tạo đợt |
| J | `NgayHoanTat` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm đối soát hoàn tất |

### 8. `CHI_TIET_TRICH_NO` (Bảng Detail Snapshot Món Nợ)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `MaDot` | String | `@` | Mã đợt trích nợ (FK `DOT_TRICH_NO`) |
| B | `MaKH` | String | `@` | Mã khách hàng |
| C | `HoTen` | String | `@` | Họ và tên khách hàng |
| D | `SoCCCD` | String | `@` | Số CCCD (12 chữ số) |
| E | `SoTK_CASA` | String | `@` | Số tài khoản CASA |
| F | `SoHDTD` | String | `@` | Danh sách các số HĐTD liên quan |
| G | `DuNoGoc_Snap`| Number | `#,##0` | **Dư nợ gốc tại thời điểm lập đợt** (Snapshot vĩnh viễn) |
| H | `LaiDuKien` | Number | `#,##0` | Tiền lãi phát sinh theo ngày thực tế (VNĐ) |
| I | `GocDuKien` | Number | `#,##0` | Tiền gốc đến hạn (nếu có) (VNĐ) |
| J | `SoTienTrichThucTe`| Number | `#,##0` | **Số tiền trích nợ sau khi CBTD điều chỉnh** (VNĐ) |
| K | `DaTrich` | Number | `#,##0` | Số tiền CoreBanking đã cắt thành công (VNĐ) |
| L | `ConNo` | Number | `#,##0` | Số tiền trích thiếu / thất bại (VNĐ) |
| M | `TrangThai` | Enum | `@` | `CHO_XU_LY`, `DA_TRICH_DU`, `TRICH_MOT_PHAN`, `THAT_BAI` |
| N | `MaGiaoDichCore`| String | `@` | Mã bút toán ghi nhận từ CoreBanking |
| O | `NgayCapNhat` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm cập nhật trạng thái |

### 9. `NO_TON_DONG` (Sổ Theo Dõi Nợ Tồn & Cảnh Báo)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `MaKH` | String | `@` | Mã khách hàng |
| B | `SoHDTD` | String | `@` | Số hợp đồng / khế ước |
| C | `GocTon` | Number | `#,##0` | Nợ gốc tồn đọng chưa thu được (VNĐ) |
| D | `LaiTon` | Number | `#,##0` | Lãi tồn đọng chưa thu được (VNĐ) |
| E | `TongNoTon` | Number | `#,##0` | Tổng nợ tồn đọng (VNĐ) |
| F | `KyPhatSinh` | String | `@` | Kỳ phát sinh nợ tồn (vd: `202608-K1`) |
| G | `TrangThai` | Enum | `@` | Trạng thái nợ (`NỢ 1 KỲ`, `NỢ 2 KỲ`, `NỢ ĐỌNG LÂU`) |
| H | `GhiChu` | String | `@` | Ghi chú biện pháp xử lý |
| I | `NgayCapNhat` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm cập nhật |

### 10. `THAM_DINH_TD` (Hồ Sơ Thẩm Định 5 Nhóm Nghiệp Vụ - 74 Cột)
- Gồm 74 cột chi tiết thuộc 5 nhóm: Pháp lý & Kê khai thu nhập (Cột A-W), Tài sản bảo đảm (Cột X-AO), Thực địa & Dòng tiền & CIC (Cột AP-BD), Đề xuất CBTD & Chỉ số LTV/EMI/DSR/DSCR (Cột BE-BQ), Phê duyệt đa cấp 4 tầng & Ký duyệt (Cột BR-BV).

### 11. `KIEM_TRA_VON` (Biên Bản Kiểm Tra Sử Dụng Vốn - 20 Cột)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `MaBBKT` | String | `@` | Mã biên bản kiểm tra (PK: `BBKT-20260818-01`) |
| B | `SoHDTD` | String | `@` | Số hợp đồng / khế ước được kiểm tra |
| C | `MaKH` | String | `@` | Mã khách hàng |
| D | `HoTen` | String | `@` | Họ và tên khách hàng |
| E | `LoaiDoanKT` | Enum | `@` | Đoàn kiểm tra (`CBTD`, `BKS`, `HDQT`, `LIEN_NGANH`) |
| F | `ThanhPhanDoan`| String | `@` | Thành phần cán bộ tham gia đoàn |
| G | `NgayKiemTra` | Date | `dd/MM/yyyy` | Ngày tiến hành kiểm tra |
| H | `LanKiemTra` | Number | `#,##0` | Lần kiểm tra thứ mấy (Lần 1, 2, 3) |
| I | `NgayKTNext` | Date | `dd/MM/yyyy` | Ngày dự kiến kiểm tra lần tới |
| J | `HinhThuc` | Enum | `@` | Hình thức (`Thực địa`, `Hồ sơ chứng từ`, `Kết hợp`) |
| K | `DiaDiemKT` | String | `@` | Địa điểm thực hiện kiểm tra |
| L | `DanhGiaMucDich`| String | `@` | Đánh giá (`Đúng mục đích 100%`, `Đúng một phần`...) |
| M | `TienDoSuDungVon`| String | `@` | Tiến độ giải ngân và đưa vốn vào sản xuất |
| N | `MucDoRuiRo` | Enum | `@` | Mức độ rủi ro (`Bình thường`, `Cần theo dõi`, `Rủi ro cao`) |
| O | `MoTaThucTe` | String | `@` | Hiện trạng tài sản, hoạt động kinh doanh thực tế |
| P | `KienNghi` | String | `@` | Ý kiến và kiến nghị của đoàn kiểm tra |
| Q | `FileBienBanUrl`| String | `@` | Đường dẫn file scan biên bản ký tay trên Drive |
| R | `HinhAnhKiemTra`| String | `@` | Danh sách link ảnh chụp hiện trường thực địa |
| S | `TrangThai` | Enum | `@` | Trạng thái (`ĐÃ_DUYỆT`, `CHỜ_XỬ_LÝ`) |
| T | `NgayTao` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm tạo biên bản |

### 12. `TSBD_CORE` (Kho Danh Mục Tài Sản Bảo Đảm - 31 Cột)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `MaTSBD` | String | `@` | Mã tài sản bảo đảm (PK: `TSBD00123`) |
| B | `SoGCN` | String | `@` | Số seri Giấy chứng nhận QSDĐ / Sổ đỏ |
| C | `SoVaoSoCapGCN` | String | `@` | Số vào sổ cấp GCN của UBND huyện |
| D | `NgayCapGCN` | Date | `dd/MM/yyyy` | Ngày cấp Giấy chứng nhận |
| E | `NoiCapGCN` | String | `@` | Nơi cấp (Sở TN&MT / UBND Huyện) |
| F | `MaKH` | String | `@` | Mã khách hàng vay (FK `KH_CORE`) |
| G | `ChuSoHuu` | String | `@` | Họ tên người đứng tên trên GCN |
| H | `CCCD_ChuTS` | String | `@` | Số CCCD chủ tài sản (12 số có số 0 đầu) |
| I | `QuanHeChuTS` | String | `@` | Quan hệ với người vay (Chính chủ, Bố mẹ, Bảo lãnh) |
| J | `NguoiDongSoHuu`| String | `@` | Thông tin vợ/chồng cùng đứng tên |
| K | `ThuaDatSo` | String | `@` | Thửa đất số |
| L | `ToBanDoSo` | String | `@` | Tờ bản đồ số |
| M | `DiaChiThuaDat` | String | `@` | Địa chỉ nơi có tài sản bảo đảm |
| N | `DienTich` | Number | `#,##0.0` | Tổng diện tích thửa đất (m2) |
| O | `HinhThucSuDung`| String | `@` | Hình thức sử dụng (Sử dụng riêng, Chung) |
| P | `ChiTietPhanLoaiDat`| String (JSON)| `@` | Chi tiết phân loại đất (ONT, CLN, NTS) kèm diện tích & đơn giá |
| Q | `NguonGocSuDung`| String | `@` | Nguồn gốc sử dụng (Nhà nước công nhận, Chuyển nhượng...) |
| R | `GiaTriDinhGiaQTD`| Number | `#,##0` | Giá trị định giá của Hội đồng định giá QTDND (VNĐ) |
| S | `GiaTriThiTruong`| Number | `#,##0` | Giá trị thị trường tham khảo (VNĐ) |
| T | `TyLeChoVayToiDa`| Number | `0.00` | Tỷ lệ cho vay tối đa theo quy chế (vd: 70%) |
| U | `SoTienDamBaoToiDa`| Number | `#,##0` | Số tiền đảm bảo tối đa được phép cấp tín dụng (VNĐ) |
| V | `TrangThaiTheChap`| Enum | `@` | `DANG_THE_CHAP`, `DA_GIAI_CHAP`, `CHUA_THE_CHAP` |
| W | `SoHDTD_LienKet`| String | `@` | Số HĐTD đang thế chấp tài sản này |
| X | `SoCongChung` | String | `@` | Số công chứng Hợp đồng thế chấp |
| Y | `NgayCongChung` | Date | `dd/MM/yyyy` | Ngày thực hiện công chứng thế chấp |
| Z | `VanPhongCongChung`| String| `@` | Tên Văn phòng công chứng |
| AA | `SoDangKyGDBD` | String | `@` | Số đơn đăng ký biện pháp bảo đảm tại VP ĐKĐĐ |
| AB | `NgayDangKyGDBD`| Date | `dd/MM/yyyy` | Ngày Văn phòng ĐKĐĐ chứng nhận thế chấp |
| AC | `HinhAnhGCN` | String (URL)| `@` | Link ảnh chụp Giấy chứng nhận QSDĐ / Sổ đỏ |
| AD | `HinhAnhThucDia`| String (URL)| `@` | Link ảnh chụp hiện trạng thửa đất thực tế |
| AE | `NgayCapNhat` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm cập nhật hồ sơ tài sản |

### 13. `CAU_HINH_BIEU_MAU` (Kho Mẫu Mail Merge - 10 Cột)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `Id` | Number | `#,##0` | Số thứ tự định danh (PK) |
| B | `MaBM` | String | `@` | Mã biểu mẫu (vd: `BM_KT_01`, `BM_TD_01`, `BM_TN_01`) |
| C | `TenBM` | String | `@` | Tên gọi biểu mẫu |
| D | `PhanHe` | String | `@` | Phân hệ (`Kiểm Tra Vốn`, `Thẩm Định`, `Trích Nợ`, `Tín Dụng`) |
| E | `LoaiNguon` | Enum | `@` | Nguồn mẫu (`GOOGLE_DOCS`, `GOOGLE_SHEETS`, `FILE_UPLOAD`) |
| F | `LinkNguon` | String | `@` | URL Google Docs/Drive mẫu |
| G | `MoTa` | String | `@` | Mục đích sử dụng biểu mẫu |
| H | `TruongTron` | String (JSON) | `@` | Danh sách thẻ biến mail merge `["{{HoTen}}", "{{DuNo}}"]` |
| I | `TrangThai` | Enum | `@` | `Hoạt động`, `Tạm ngưng` |
| J | `NgayCapNhat` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm cập nhật biểu mẫu |

### 14. `DOCUMENT_STORAGE` (Nhật Ký Lưu Trữ Tài Liệu Xuất Bản - 9 Cột)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `ID_HOP_DONG` | String | `@` | Mã hồ sơ / Số HĐTD liên kết |
| B | `MA_KH` | String | `@` | Mã khách hàng |
| C | `TEN_KHACH_HANG`| String | `@` | Họ và tên khách hàng |
| D | `LOAI_BIEU_MAU` | String | `@` | Loại biểu mẫu đã xuất (vd: `BM_HDTD_01`) |
| E | `NGUOI_LAP` | String | `@` | Họ tên cán bộ thực hiện xuất tài liệu |
| F | `NGAY_LAP` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm xuất bản tài liệu |
| G | `LINK_GOOGLE_DOC`| String (URL)| `@` | Đường dẫn tệp Google Docs đã trộn dữ liệu |
| H | `LINK_PDF` | String (URL)| `@` | Đường dẫn tệp PDF xuất bản lưu trên Google Drive |
| I | `TRANG_THAI` | Enum | `@` | Trạng thái tài liệu (`DA_KY`, `CHO_KY`, `HUY`) |

---

## 📊 2. Cấu Trúc 2 Bảng Báo Cáo Phân Tích Mở Rộng

### 15. `BC_DOANH_SO_TD` (Sao Kê Hợp Đồng Tín Dụng & Doanh Số Theo Khoảng Thời Gian - 12 Cột)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `SoHDTD` | String | `@` | Số hợp đồng / khế ước tín dụng |
| B | `MaKH` | String | `@` | Mã khách hàng (có số 0 đầu) |
| C | `SoTV` | String | `@` | Số thẻ thành viên QTDND |
| D | `TienVay` | Number | `#,##0` | Số tiền giải ngân ban đầu (VNĐ) |
| E | `DuNo` | Number | `#,##0` | Dư nợ hiện tại (VNĐ) |
| F | `LaiSuat` | Number | `0.00` | Lãi suất cho vay (%/năm) |
| G | `NgayVay` | Date | `dd/MM/yyyy` | Ngày giải ngân nhận nợ |
| H | `DenHan` | Date | `dd/MM/yyyy` | Ngày đáo hạn hợp đồng |
| I | `MaLoaiVay` | String | `@` | Mã/Tên sản phẩm cho vay |
| J | `SoThangVay` | Number | `#,##0` | Thời hạn cho vay (tháng) |
| K | `MoTaVay` | String | `@` | Mục đích / Phương án sản xuất kinh doanh |
| L | `KhuVuc` | String | `@` | Địa bàn (Thôn, Xã) |

### 16. `TOP_DU_NO_BINH_QUAN` (Xếp Hạng Top Khách Hàng Dư Nợ Bình Quân Năm Cao Nhất - 21 Cột)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `NamBaoCao` | Number | `#,##0` | Năm thống kê báo cáo (vd: 2026) |
| B | `XepHang` | Number | `#,##0` | Thứ hạng từ 1 đến Top N |
| C | `MaKH` | String | `@` | Mã khách hàng (PK) |
| D | `HoTen` | String | `@` | Họ và tên khách hàng |
| E | `SoTV` | String | `@` | Số thẻ thành viên QTDND |
| F | `KhuVuc` | String | `@` | Địa bàn cư trú (Thôn, Xã) |
| G - R | `DuNoThang01`..`12`| Number x 12 | `#,##0` | Dư nợ của khách hàng tại các ngày chốt cuối mỗi tháng (Tháng 1 đến Tháng 12) |
| S | `DuNoBinhQuan` | Number | `#,##0` | **Dư nợ bình quân cả năm** = (Tổng dư nợ 12 tháng) / 12 (VNĐ) |
| T | `TongTienVay` | Number | `#,##0` | Tổng doanh số cho vay lũy kế trong năm (VNĐ) |
| U | `TyTrongDuNo` | Number | `0.00%` | Tỷ trọng % trên tổng dư nợ toàn Quỹ |

---

## 🛡️ 3. Cơ Chế Auto-Migration & Bảo Vệ Toàn Vẹn CSDL

Hệ thống được bảo vệ bởi 3 tầng kiểm soát tại [`gas_backend/Database/SchemaSetup.gs`](file:///d:/Antigravity%20Projects/CreditCores/gas_backend/Database/SchemaSetup.gs):

1. **Auto-Migration Không Mất Dữ Liệu (Zero Data Loss)**:
   * Khi mở rộng trường dữ liệu: Script quét dòng Header số 1. Nếu thiếu cột, tự động mở rộng và ghi nhãn cột mới mà **bảo toàn nguyên vẹn 100% dữ liệu cũ**, tuyệt đối không ghi đè dữ liệu.
2. **Tự Động Chuẩn Hóa Tên Sheet Cũ (Legacy Sheet Alias)**:
   * Nhận diện và đổi tên an toàn các sheet cũ về tên chuẩn:
     - `DS_TRICH_NO` -> `DANG_KY_TRICH_NO`
     - `LICH_SU_GIAO_DICH` -> `CHI_TIET_TRICH_NO`
     - `BAO_CAO_THAM_DINH` -> `THAM_DINH_TD`
     - `TAI_SAN_BAO_DAM`, `DS_TSBD` -> `TSBD_CORE`
3. **Bảo Toàn Kiểu Dữ Liệu An Toàn**:
   * CCCD, Số TK CASA luôn được gán định dạng `@` Text có dấu nháy đơn `'` ở đầu để chống mất số `0` dẫn đầu.
   * Số tiền luôn gán định dạng `#,##0` số nguyên để tránh lỗi `#VALUE!` khi tính toán.
