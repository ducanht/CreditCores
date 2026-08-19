# 🏛️ CẤU TRÚC DỮ LIỆU TOÀN DIỆN (DATA SCHEMA) & QUẢN TRỊ CSDL
# 12 Bảng CSDL Chuẩn Hóa Trên Google Sheets — CreditCores

Tài liệu này định nghĩa chi tiết **12 bảng CSDL chuẩn** của hệ thống **CreditCores** (QTDND Yên Thọ), cơ chế lưu trữ đợt trích nợ 2 cấp (Master - Detail), xử lý snapshot hợp đồng, chuẩn hóa định dạng kiểu dữ liệu và cơ chế tự động kiểm soát cấu trúc dữ liệu (**Schema Governance & Auto-Migration**).

---

## 📋 Danh Mục 12 Bảng CSDL Chuẩn

```
1.  ROLES              - Quản lý Nhóm Vai Trò & Ma Trận Quyền 360°
2.  USERS              - Tài Khoản Cán Bộ & Phân Quyền Cá Nhân Hóa
3.  SETTING            - Cấu Hình & Hàng Đợi Lệnh Đồng Bộ Core 24/7 (Commands Queue)
4.  KH_CORE            - Dữ Liệu Khách Hàng & Thành Viên Góp Vốn (Kèm NgayCapNhat)
5.  HDTD_CORE          - Hợp Đồng Tín Dụng & Khế Ước Dư Nợ Hiện Hữu (Active Snapshot)
6.  DANG_KY_TRICH_NO   - Danh Sách Đăng Ký Thỏa Thuận Trích Nợ Tự Động CASA
7.  DOT_TRICH_NO       - Bảng Master Quản Lý Các Đợt Trích Nợ Định Kỳ (Kỳ 1, 2, 3)
8.  CHI_TIET_TRICH_NO  - Bảng Detail Lưu Vĩnh Viễn Snapshot Từng Món Nợ Trong Đợt
9.  NO_TON_DONG        - Sổ Theo Dõi Nợ Tồn Đọng Chuyển Kỳ Sau & Cảnh Báo
10. THAM_DINH_TD       - Hồ Sơ Thẩm Định Tín Dụng, CIC, TSĐB & Ý Kiến Đa Cấp
11. KIEM_TRA_VON       - Biên Bản Kiểm Tra Sử Dụng Vốn Sau Giải Ngân (CBTD, BKS, HĐQT)
12. CAU_HINH_BIEU_MAU - Kho Biểu Mẫu Google Docs/Word & Thẻ Biến Mail Merge
```

---

## 📑 1. Từ Điển Dữ Liệu Chi Tiết 12 Bảng (Data Dictionary)

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
| A | `COMMAND` | String | `@` | Lệnh đồng bộ (`IDLE`, `SYNC_DATA`, `EXPORT_DEBIT_BATCH`) |
| B | `STATUS` | Enum | `@` | Trạng thái thực thi (`SUCCESS`, `RUNNING`, `ERROR`) |
| C | `REQUEST_TIME` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm WebApp gửi lệnh |
| D | `START_TIME` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm Python Daemon nhận lệnh |
| E | `FINISH_TIME` | DateTime | `dd/MM/yyyy HH:mm:ss` | Thời điểm Python Daemon hoàn thành |
| F | `TOTAL_ROWS` | Number | `#,##0` | Số dòng dữ liệu đã xử lý |
| G | `MESSAGE` | String | `@` | Thông điệp phản hồi hoặc chi tiết lỗi |

### 4. `KH_CORE` (Dữ Liệu Khách Hàng & Thành Viên)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `MaKH` | String | `@` | Mã khách hàng (PK: `KH008892`) |
| B | `HoTen` | String | `@` | Họ và tên khách hàng |
| C | `DiaChi` | String | `@` | Địa chỉ thường trú |
| D | `NgaySinh` | Date | `dd/MM/yyyy` | Ngày tháng năm sinh |
| E | `CCCD` | String | `@` | Số CCCD 12 chữ số (có số 0 đầu) |
| F | `NgayCap` | Date | `dd/MM/yyyy` | Ngày cấp CCCD |
| G | `NoiCap` | String | `@` | Nơi cấp CCCD |
| H | `DienThoai` | String | `@` | Số điện thoại bàn |
| I | `DienThoaiDD` | String | `@` | Số điện thoại di động |
| J | `SoTK` | String | `@` | Số tài khoản tiền gửi thanh toán CASA |
| K | `KhuVuc` | String | `@` | Địa bàn (Thôn, Xã Yên Thọ, Yên Trường, Yên Thịnh) |
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
| D | `DuNo` | Number | `#,##0` | Dư nợ gốc hiện tại (VNĐ) |
| E | `LaiSuat` | Number | `0.00` | Lãi suất cho vay (%/năm) |
| F | `NgayVay` | Date | `dd/MM/yyyy` | Ngày giải ngân nhận nợ |
| G | `DenHan` | Date | `dd/MM/yyyy` | Ngày đáo hạn hợp đồng |
| H | `TraLaiDenNgay` | Date | `dd/MM/yyyy` | Ngày đã thanh toán lãi gần nhất |
| I | `MaLoaiVay` | String | `@` | Mã sản phẩm cho vay (`LV01`, `LV02`...) |
| J | `SoThangVay` | Number | `#,##0` | Thời hạn vay (tháng) |
| K | `MoTaVay` | String | `@` | Phương án sản xuất kinh doanh |
| L | `CBTD_PhuTrach` | String | `@` | Username Cán bộ Tín dụng quản lý HĐ (`qtdyentho.cbtd`) |
| M | `Ten_CBTD` | String | `@` | Họ tên đầy đủ CBTD phụ trách (`Lê Văn Tín (CBTD)`) |
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

### 10. `THAM_DINH_TD` / `BAO_CAO_THAM_DINH` (Hồ Sơ Thẩm Định 5 Nhóm Nghiệp Vụ)

Bảng CSDL `BAO_CAO_THAM_DINH` gồm **57 cột** chuẩn hóa, phân chia chặt chẽ theo 5 nhóm thông tin:

#### 🔹 Nhóm 1: Thông Tin Pháp Lý & Nhu Cầu Vay Vốn
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `MaBCTD` | String | `@` | Mã báo cáo thẩm định (PK: `BCTD-2026-081`) |
| B | `MaKH` | String | `@` | Mã khách hàng (FK `KH_CORE`) |
| C | `HoTen` | String | `@` | Họ và tên khách hàng |
| D | `SoCCCD` | String | `@` | Số CCCD 12 chữ số (có số 0 đầu) |
| E | `NgaySinh` | Date / String | `dd/MM/yyyy` | Ngày tháng năm sinh |
| F | `GioiTinh` | Enum | `@` | Giới tính (`Nam`, `Nữ`) |
| G | `DienThoai` | String | `@` | Số điện thoại liên lạc |
| H | `DiaChi` | String | `@` | Địa chỉ cư trú thường trú |
| I | `TinhTrangHonNhan` | Enum | `@` | Tình trạng hôn nhân (`Đã kết hôn`, `Độc thân`...) |
| J | `NguoiDongVay` | String | `@` | Thông tin người đồng vay / Vợ / Chồng / Bảo lãnh |
| K | `DeXuatVay` | Number | `#,##0` | Số tiền khách hàng xin vay (VNĐ) |
| L | `MucDichVay` | String | `@` | Mục đích sử dụng vốn chi tiết |
| M | `ThoiHanVay` | Number | `#,##0` | Thời hạn vay đề nghị (tháng) |
| N | `PhuongThucTraNo` | String | `@` | Phương thức trả nợ (Gốc đều/Kỳ hạn, Lãi dư nợ) |

#### 🔹 Nhóm 2: Thông Tin Tài Sản Bảo Đảm (TSBĐ)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| O | `CoTSBD` | Enum | `@` | Có TSBĐ hay Tín chấp (`Có`, `Không`) |
| P | `HinhThucBaoDam` | String | `@` | Hình thức bảo đảm (Thế chấp QSDĐ, Sổ tiết kiệm...) |
| Q | `LoaiTSBD` | String | `@` | Loại tài sản (Đất ở, Đất SXKD, Nhà xưởng, Xe...) |
| R | `SoGCN` | String | `@` | Số seri Giấy chứng nhận QSDĐ / Đăng ký xe |
| S | `ThuaDatSo` | String | `@` | Thửa đất số |
| T | `ToBanDoSo` | String | `@` | Tờ bản đồ số |
| U | `DienTich` | Number | `#,##0.0` | Diện tích tài sản ($m^2$) |
| V | `DiaChiTSBD` | String | `@` | Địa chỉ nơi có tài sản bảo đảm |
| W | `ChuSoHuuTSBD` | String | `@` | Họ tên chủ sở hữu đứng tên trên GCN |
| X | `QuanHeVoiNguoiVay` | String | `@` | Quan hệ với người vay (Chính chủ, Bố mẹ...) |
| Y | `GiaTriTSBD` | Number | `#,##0` | Giá trị định giá nội bộ QTDND (VNĐ) |
| Z | `TinhTrangPhapLyTSBD` | String | `@` | Tình trạng pháp lý (Hợp pháp, không tranh chấp) |
| AA | `MoTaTSBD` | String | `@` | Mô tả chi tiết hiện trạng tài sản thực tế |

#### 🔹 Nhóm 3: Thông Tin Thực Địa, Dòng Tiền & Lịch Sử Tín Dụng CIC
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| AB | `ThuNhapChinh` | Number | `#,##0` | Thu nhập chính hàng tháng từ SXKD/Lương (VNĐ) |
| AC | `ThuNhapPhu` | Number | `#,##0` | Thu nhập phụ (Cho thuê, chăn nuôi thêm...) (VNĐ) |
| AD | `TongThuNhapThang` | Number | `#,##0` | Tổng thu nhập hàng tháng = Chính + Phụ (VNĐ) |
| AE | `ChiPhiSinhHoat` | Number | `#,##0` | Chi phí sinh hoạt gia đình / tháng (VNĐ) |
| AF | `ChiPhiSXKD` | Number | `#,##0` | Chi phí hoạt động sản xuất kinh doanh / tháng (VNĐ) |
| AG | `TongChiPhiThang` | Number | `#,##0` | Tổng chi phí / tháng = Sinh hoạt + SXKD (VNĐ) |
| AH | `ThangDuThang` | Number | `#,##0` | Thặng dư tích lũy hàng tháng = Thu - Chi (VNĐ) |
| AI | `XepHangCIC` | String | `@` | Xếp hạng tín dụng CIC (`Nhóm 1 (Tốt)`, `Nhóm 2`...) |
| AJ | `SoTCTDQuanHe` | Number | `#,##0` | Số lượng TCTD đang có quan hệ tín dụng |
| AK | `DuNoCICNgoai` | Number | `#,##0` | Tổng dư nợ tại các TCTD khác ngoài QTD (VNĐ) |
| AL | `LichSuTraNo` | String | `@` | Lịch sử trả nợ (Tốt, không quá hạn) |
| AM | `GhiChuCIC` | String | `@` | Ghi chú chi tiết kết quả tra cứu CIC |
| AN | `DiaDiemThamDinh` | String | `@` | Địa điểm thực hiện thẩm định thực tế |
| AO | `HienTrangSXKD` | String | `@` | Đánh giá hiện trạng cơ sở SXKD / việc làm |
| AP | `TuCachKhachHang` | String | `@` | Đánh giá tư cách đạo đức, uy tín tại địa phương |

#### 🔹 Nhóm 4: Đề Xuất CBTD & Các Chỉ Số Tài Chính
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| AQ | `DuyetVay` | Number | `#,##0` | Số tiền CBTD đề xuất duyệt cho vay (VNĐ) |
| AR | `ThoiHanThang` | Number | `#,##0` | Thời hạn vay đề xuất (tháng) |
| AS | `LaiSuatDuyet` | Number | `0.00` | Lãi suất cho vay đề xuất (%/năm) |
| AT | `PhuongThucGiaiNgan` | String | `@` | Phương thức giải ngân (Tài khoản CASA / Tiền mặt) |
| AU | `BienPhapBaoDam` | String | `@` | Biện pháp bảo đảm & thủ tục công chứng GDBĐ |
| AV | `TyLeLTV` | Number | `0.0` | Tỷ lệ Vay/TSĐB $LTV = \frac{Duyệt Vay}{Giá Trị TS} \times 100\%$ |
| AW | `NghiaVuTraNoThang` | Number | `#,##0` | Nghĩa vụ nợ tháng $EMI = Gốc + Lãi$ ước tính (VNĐ) |
| AX | `TyLeDSR` | Number | `0.0` | Tỷ lệ Nghĩa vụ nợ / Thu nhập $DSR = \frac{EMI}{Thu Nhập} \times 100\%$ |
| AY | `HeSoBuDap` | Number | `0.00` | Hệ số bù đắp dòng tiền $Coverage = \frac{Thặng Dư}{EMI}$ |
| AZ | `DieuKienGiaiNgan` | String | `@` | Các điều kiện tiên quyết trước khi giải ngân vốn |
| BA | `MucDoRuiRo` | Enum | `@` | Đánh giá mức độ rủi ro (`Thấp`, `Trung bình`, `Cao`) |

#### 🔹 Nhóm 5: Ý Kiến Phê Duyệt Đa Cấp & Kết Luận
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| BB | `KetLuan` | Enum | `@` | Kết luận (`Đồng ý cấp tín dụng`, `Có điều kiện`, `Từ chối`) |
| BC | `CanBoThamDinh` | String | `@` | Họ tên Cán bộ tín dụng thực hiện |
| BD | `DanhSachYKien` | String (JSON) | `@` | Mảng JSON lưu ý kiến phê duyệt 4 tầng chức danh |
| BE | `NgayLap` | DateTime | `dd/MM/yyyy HH:mm:ss` | Ngày giờ lập báo cáo thẩm định |

### 11. `KIEM_TRA_VON` (Biên Bản Kiểm Tra Sử Dụng Vốn)
| Cột | Tên Trường | Kiểu | Định Dạng | Mô Tả |
| :--- | :--- | :---: | :---: | :--- |
| A | `MaBBKT` | String | `@` | Mã biên bản kiểm tra (PK: `BBKT-20260818-01`) |
| B | `SoHDTD` | String | `@` | Số hợp đồng / khế ước được kiểm tra |
| C | `MaKH` | String | `@` | Mã khách hàng |
| D | `HoTen` | String | `@` | Họ và tên khách hàng |
| E | `LoaiDoanKT` | Enum | `@` | Đoàn kiểm tra (`CBTD`, `BKS`, `HDQT`, `LIEN_NGANH`) |
| F | `ThanhPhanDoan`| String | `@` | Thành phần cán bộ tham gia đoàn |
| G | `NgayKiemTra` | Date | `dd/MM/yyyy` | Ngày tiến hành kiểm tra |
| H | `LanKiemTra` | Number | `#,##0` | Lần kiểm tra thứ mấy |
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

### 12. `CAU_HINH_BIEU_MAU` (Kho Mẫu Mail Merge)
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

---

## 🛡️ 2. Cơ Chế Auto-Migration & Bảo Vệ Toàn Vẹn CSDL

Hệ thống được bảo vệ bởi 3 tầng kiểm soát tại [`gas_backend/Database/SchemaSetup.gs`](file:///d:/Antigravity%20Projects/CreditCores/gas_backend/Database/SchemaSetup.gs):

1. **Auto-Migration Không Mất Dữ Liệu (Zero Data Loss)**:
   * Khi mở rộng trường dữ liệu (ví dụ thêm cột `LaiDuKien`, `SoNgayTinhLai`): Script quét dòng Header số 1. Nếu thiếu cột, tự động mở rộng và ghi nhãn cột mới mà **bảo toàn nguyên vẹn 100% dữ liệu cũ**, tuyệt đối không ghi đè dữ liệu.
2. **Tự Động Chuẩn Hóa Tên Sheet Cũ (Legacy Sheet Alias)**:
   * Nhận diện và đổi tên an toàn các sheet cũ về tên chuẩn:
     - `DS_TRICH_NO` $\to$ `DANG_KY_TRICH_NO`
     - `LICH_SU_GIAO_DICH` $\to$ `CHI_TIET_TRICH_NO`
     - `BAO_CAO_THAM_DINH` $\to$ `THAM_DINH_TD`
3. **Bảo Toàn Kiểu Dữ Liệu An Toàn**:
   * CCCD, Số TK CASA luôn được gán định dạng `@` Text có dấu nháy đơn `'` ở đầu để chống mất số `0` dẫn đầu.
   * Số tiền luôn gán định dạng `#,##0` số nguyên để tránh lỗi `#VALUE!` khi tính toán.

---

## 🔄 3. Quy Trình Bắt Buộc Khi Thay Đổi Cấu Trúc Dữ Liệu (Mandatory Schema Change Protocol)

Mỗi khi phát sinh yêu cầu thay đổi trường dữ liệu, thêm cột, hoặc điều chỉnh mô hình dữ liệu đọc/ghi lên Google Sheets, AI Agent và Lập trình viên **BẮT BUỘC** phải tuân thủ nghiêm ngặt quy trình 5 bước khép kín sau:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│              QUY TRÌNH 5 BƯỚC BẮT BUỘC KHI THAY ĐỔI CẤU TRÚC DỮ LIỆU (END-TO-END AUDIT)          │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. CẬP NHẬT CSDL BACKEND (SchemaSetup.gs)                                                        │
│    • Bổ sung mảng `headers`, `formats`, `colWidths` trong `SchemaSetup.SCHEMAS`.                 │
│    • Đảm bảo hàm `ensureDatabaseSchema` sử dụng Smart Column Remapping (khớp tên cột cũ -> mới). │
│                                                                                                  │
│ 2. CẬP NHẬT CONTROLLER & ROUTER GAS (gas_backend/)                                               │
│    • Map động theo tên cột `colMap[headerName]` thay vì chỉ số cột cứng.                        │
│    • Xử lý fallback giá trị mặc định cho toàn bộ trường dữ liệu mới.                            │
│    • Invalidate Cache khi có thao tác ghi dữ liệu (`CacheHelper.invalidateModuleCache`).          │
│                                                                                                  │
│ 3. ĐỒNG BỘ FRONTEND DATA SERVICES & UI (src/)                                                    │
│    • Cập nhật `api.js`: Phương thức gọi API, payload POST, và Mock Handler fallback đồng nhất.  │
│    • Cập nhật `mockData.js`: Cập nhật bộ dữ liệu mẫu đầy đủ các trường mới.                     │
│    • Cập nhật UI Components & Modals: Form nhập liệu, Validation, Thẻ hiển thị, In ấn.           │
│                                                                                                  │
│ 4. BIÊN DỊCH, DEPLOY DUAL GAS & KIỂM THỬ LIVE API                                                │
│    • Chạy `npm run build` để xác nhận 0 lỗi cú pháp Vite.                                        │
│    • Chạy script `gas_sync_dual.ps1` để đẩy code lên cả 2 Script ID và deploy WebApp mới.       │
│    • Gửi request live API kiểm tra dữ liệu trả về từ Google Sheets thực tế.                      │
│                                                                                                  │
│ 5. ĐỒNG BỘ TÀI LIỆU DỰ ÁN & RE-INDEX CBI GRAPH                                                   │
│    • Cập nhật `DATA_SCHEMA.md`, `PROJECT_ARCHITECTURE.md`, `BUSINESS_WORKFLOWS.md`.              │
│    • Cập nhật `AGENTS.md` và `GEMINI.md`.                                                        │
│    • Chạy lệnh Re-index CBI Graph (`cbi index`) và chạy test suite (`npm test`).                 │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```
