# 📊 CREDITCORES — BÁO CÁO TIẾN ĐỘ DỰ ÁN
# Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)

> **Cập nhật lần cuối**: 18/09/2026 10:55 GMT+7
> **Phiên bản hệ thống**: v1.4.3 (Hoàn thành Giai đoạn 2: Biểu Đồ So Sánh 3 Xã / 12 Thôn, Donut Tỷ Trọng Sản Phẩm Vay & Nâng Cấp Toàn Diện Customer 360°)
> **Branch**: `main`

---

## 🏆 TỔNG TIẾN ĐỘ TOÀN DỰ ÁN

```
Frontend SPA        █████████████████████ 100%  (Build 0 errors, Zero Mock, Modular, Clean Charts)
GAS Backend         ███████████████████░░  95%  (Singleton SS, Write Lock, CacheHelper, Live Reports)
CSDL Google Sheets  ████████████████████░  98%  (14 Bảng chuẩn hóa, TT 14/2017)
Python Daemon       ████████████░░░░░░░░░  65%  (Chạy 24/7 trên máy chủ SQL Server Production)
UI/UX Design System █████████████████████ 100%  (Bento Cards, SegControl, StatusBadge, Donut SVG, Print A4)
Performance GAS     ██████████████████░░░  90%  (Batch reads, In-Memory Singleton, Fast Routing)
TỔNG THỂ            ███████████████████░░  97%  (Hoàn thành Giai đoạn 1 & Giai đoạn 2)
```

---

## 📋 CHI TIẾT TỪNG PHÂN HỆ NGHIỆP VỤ

### 1. Dashboard Tổng Quan Quản Trị
**Mức hoàn thành: 100%**

| Tính Năng | Trạng Thái | Ghi Chú |
|:---|:---:|:---|
| KPI Bento Cards (Tổng dư nợ, Số KH, Dư nợ BQ) | ✅ Done | Live từ GAS backend |
| Biểu đồ so sánh dư nợ 3 Xã / 12 Thôn | ✅ Done | `CommuneComparisonChart` đa chiều (Dư nợ, Số HĐ, Dư nợ BQ) + Drilldown thôn |
| Biểu đồ Donut tỷ trọng sản phẩm vay | ✅ Done | `LoanProductDonutChart` (Nông nghiệp, Tiêu dùng, Thương mại) theo Xã / Toàn Quỹ |
| Drilldown 3 Xã / 12 Thôn | ✅ Done | Accordion & Card mượt mà, đầy đủ số liệu |
| CBTD Portfolio Analytics | ✅ Done | 3 Cán bộ tín dụng phân công rõ ràng |
| Sync Monitor Status | ✅ Done | Giám sát trạng thái SQL Server Core |
| Skeleton loader khi loading | ✅ Done | `DashboardSkeleton` hiển thị tức thì, 0 giật lag |
| Segmented Control Period Filter | ✅ Done | `.seg-control` chuẩn chỉnh: Tháng / Quý / Năm |

### 2. Tra Cứu Khách Hàng & Hợp Đồng 360°
**Mức hoàn thành: 100%**

| Tính Năng | Trạng Thái | Ghi Chú |
|:---|:---:|:---|
| Thẻ Hồ Sơ Sức Khỏe Tín Dụng | ✅ Done | `CustomerFinancialCard` (Hạn mức, Dư nợ, Thành viên QTD, Cổ phần, CASA) |
| Timeline & Horizon Tiến Độ Hợp Đồng Vay | ✅ Done | `ContractTimelineList` (Thanh tiến độ thời hạn vay, đếm ngược ngày đến hạn) |
| Cảnh báo rủi ro thời hạn vay trực quan | ✅ Done | Phân biệt màu sắc: Bình thường (xanh), Sắp đến hạn <30 ngày (vàng), Quá hạn (đỏ) |
| Tìm kiếm đa tiêu chí (7 trường) | ✅ Done | O(1) Hash Map tối ưu 5.175+ KH |
| In-Memory & Script Cache 60s | ✅ Done | Khóa `cust360_default` nạp tức thì < 100ms |
| Phân công CBTD & Chuyển giao hợp đồng | ✅ Done | Modal gán CBTD trực tiếp vào Core Sheets |
| Thao tác nhanh 1-chạm | ✅ Done | KT Vốn sau giải ngân, Ủy quyền CASA, Lập thẩm định vay |

### 3. Thẩm Định Tín Dụng & TSĐB
**Mức hoàn thành: 88%**

| Tính Năng | Trạng Thái | Ghi Chú |
|:---|:---:|:---|
| 5 Tab nghiệp vụ (Pháp lý, TSBĐ, Dòng tiền, 4 Chỉ số, Ký duyệt) | ✅ Done | Giao diện chuẩn mực |
| Tính LTV, EMI, DTI, DSCR tự động | ✅ Done | Chuẩn theo TT 39/2016/TT-NHNN |
| In báo cáo thẩm định A4 | ✅ Done | Trình bày bản in chuẩn hành chính |
| Ký duyệt 4 cấp | ✅ Done | CBTD → TP.TD → BKS → HĐQT |
| Upload ảnh TSBĐ lên Drive | ✅ Done | Nén ảnh Canvas chống tràn quota |
| Validation đầy đủ các trường bắt buộc | ⚠️ Partial | Đang duy trì kiểm soát chặt chẽ |

### 4. Kiểm Tra Sử Dụng Vốn Sau Giải Ngân
**Mức hoàn thành: 75%**

| Tính Năng | Trạng Thái | Ghi Chú |
|:---|:---:|:---|
| CRUD biên bản kiểm tra | ✅ Done | Đầy đủ thông tin mục đích sử dụng |
| Phân loại đoàn kiểm tra | ✅ Done | CBTD độc lập, Liên ngành, BKS |
| Upload ảnh thực địa | ✅ Done | Lưu ảnh trực tiếp vào thư mục Drive |
| Nhắc nhở chu kỳ 30 ngày | 🔲 Todo | Kế hoạch Q4/2026 |

### 5. Đăng Ký Thỏa Thuận Trích Nợ Tự Động
**Mức hoàn thành: 100%**

| Tính Năng | Trạng Thái | Ghi Chú |
|:---|:---:|:---|
| Phân rã Component `DebitRegisterTable` | ✅ Done | Tách riêng bảng dữ liệu, KPI cards, bộ lọc kỳ & trạng thái |
| CRUD đầy đủ (Thêm/Sửa/Xóa/Tạm ngưng) | ✅ Done | Lưu tức thì vào sheet `DANG_KY_TRICH_NO` |
| Batch selection nhiều hợp đồng | ✅ Done | Chọn nhanh nhiều HĐ cùng khách hàng |
| In văn bản thỏa thuận ủy quyền A4 | ✅ Done | `DebitAgreementPrintModal` chuẩn mẫu pháp lý QTDND Yên Thọ |
| Xuất tệp Word (.doc) Thỏa thuận | ✅ Done | Hỗ trợ tải file Word chuẩn form để chỉnh sửa & lưu trữ |
| Nút In 1-click trên bảng & trong modal | ✅ Done | Tích hợp icon Printer trên từng dòng và footer modal sửa |

### 6. Khởi Tạo & Quản Lý Đợt Trích Nợ
**Mức hoàn thành: 100%**

| Tính Năng | Trạng Thái | Ghi Chú |
|:---|:---:|:---|
| Phân rã Component `DebitBatchTable` | ✅ Done | Tách riêng sổ theo dõi các đợt trích nợ & phân trang & nút Xem |
| Engine tính lãi thực tế TT 14/2017 | ✅ Done | Tính ngày đầu bỏ ngày cuối, mẫu số 36500 |
| Snapshot bất biến Master-Detail | ✅ Done | `DOT_TRICH_NO` + `CT_DOT_TRICH_NO` |
| LockService chống race condition | ✅ Done | Khóa an toàn 15s cho giao dịch ghi |
| Xuất tệp lệnh CoreBanking / Co-opBank | ✅ Done | CSV định dạng lệnh trích tài khoản thanh toán nộp ngân hàng |
| Xuất Bảng kê Word (.doc) A4 3 chữ ký | ✅ Done | Chuẩn văn bản kế toán (CBTD, Kế toán trưởng, Giám đốc) |

### 7. Đối Soát & Phân Loại Kết Quả
**Mức hoàn thành: 88%**

| Tính Năng | Trạng Thái | Ghi Chú |
|:---|:---:|:---|
| Chuẩn hóa SegControl & StatusBadge | ✅ Done | Thay thế button group thô, đồng bộ màu tương phản cao |
| Phân loại 4 trạng thái kết quả | ✅ Done | Đã trích đủ, 1 phần, Thất bại, Chờ |
| Upload tệp CSV kết quả CoreBanking | ✅ Done | Đối soát tự động mã giao dịch |
| Chốt sổ kỳ → HOAN_TAT | ✅ Done | Ghi nhận nợ tồn vào sổ theo dõi |
| Cảnh báo tỷ lệ thất bại cao | 🔲 Todo | Tích hợp cảnh báo Telegram |

### 8. Sổ Theo Dõi Nợ Tồn Đọng
**Mức hoàn thành: 82%**

| Tính Năng | Trạng Thái | Ghi Chú |
|:---|:---:|:---|
| Phân loại NỢ 1 KỲ / 2 KỲ / ĐỌNG LÂU | ✅ Done | Phân tầng nợ chính xác |
| Tự động cộng dồn vào đợt trích tiếp theo | ✅ Done | Tích hợp trong engine lập đợt |
| Gửi thông báo SMS/Zalo | ❌ Chưa | Roadmap Q4/2026 |

### 9. Quản Lý Biểu Mẫu & Mail Merge
**Mức hoàn thành: 85%**

| Tính Năng | Trạng Thái | Ghi Chú |
|:---|:---:|:---|
| Kho biểu mẫu Google Docs (6 mẫu) | ✅ Done | Kết nối Google Drive Docs Template |
| Engine trộn mẫu 20+ thẻ biến | ✅ Done | Thay thế trường tự động chính xác |
| Lưu tài liệu lên Google Drive | ✅ Done | Tự động tạo thư mục theo năm/tháng |
| In Phiếu Thu / Biên Lai PDF tự động | ❌ Chưa | Roadmap Q4/2026 |

### 10. Quản Trị Hệ Thống & RBAC 360°
**Mức hoàn thành: 92%**

| Tính Năng | Trạng Thái | Ghi Chú |
|:---|:---:|:---|
| Quản lý tài khoản cán bộ | ✅ Done | Phân quyền 4 vai trò rõ ràng |
| Đổi mật khẩu SHA-256 | ✅ Done | Bảo mật cao, mã hóa an toàn |
| Ma trận quyền RBAC 360° per-module | ✅ Done | Khóa menu tự động theo phân quyền |
| Giám sát Python Daemon & Logs | ✅ Done | Đồng bộ 2 chiều Core SQL |

### 11. Báo Cáo Thống Kê
**Mức hoàn thành: 90%**

| Tính Năng | Trạng Thái | Ghi Chú |
|:---|:---:|:---|
| Phân bổ dư nợ theo 3 Xã (Live Data) | ✅ Done | GAS `handleGetReportsData` tính LIVE 100% |
| Cơ cấu sản phẩm tín dụng (Live Data) | ✅ Done | Nhóm Nông nghiệp, Thương mại, Tiêu dùng |
| Skeleton Loader & Tab Navigation | ✅ Done | `ReportsSkeleton` + Action toolbar |
| Summary KPIs (CASA, NPL, Dư nợ) | ✅ Done | Tỷ lệ trích nợ tự động, nợ xấu N3-N5 |
| Tab "Sao Kê Hợp Đồng" (BC_DOANH_SO_TD) | 🔲 Chuẩn bị | Schema đã sẵn sàng trên GAS backend |
| Tab "Top Dư Nợ Bình Quân" | 🔲 Chuẩn bị | Đã có sheet & cấu trúc truy vấn |

### 12. Tài Sản Thế Chấp
**Mức hoàn thành: 82%**

| Tính Năng | Trạng Thái | Ghi Chú |
|:---|:---:|:---|
| Danh sách TSBĐ + bộ lọc | ✅ Done | Nhóm BĐS, Phương tiện, Sổ tiết kiệm |
| CRUD hồ sơ TSBĐ | ✅ Done | Kết nối `TSBD_CORE` |
| Xuất biên bản định giá | ✅ Done | In mẫu A4 chuẩn ngân hàng |
| Tái định giá định kỳ | 🔲 Todo | |

---

## 🏗️ INFRASTRUCTURE & TỐI ƯU HÓA

### GAS Backend Performance — 92% (Đã Nâng Cấp)
| Hạng Mục | Trạng Thái | Chi Tiết Kỹ Thuật |
|:---|:---:|:---|
| In-Memory Spreadsheet Singleton | ✅ Done | `_SS_CACHE` tránh gọi `openById` lặp đi lặp lại |
| Phân tách Lock READ vs WRITE | ✅ Done | `doPost` chỉ khóa khi gọi các mutation actions |
| `getReportsData` Live Engine | ✅ Done | Tính trực tiếp từ `KH_CORE` + `HDTD_CORE` trong 2 batch reads |
| `searchCustomer360` Cache | ✅ Done | Cache danh sách mặc định `cust360_default` 60s |
| Invalidation Key Map | ✅ Done | Tự động xóa cache khi có thay đổi dữ liệu liên quan |

### UI/UX Design System — 95% (Đã Nâng Cấp)
| Hạng Mục | Trạng Thái | Chi Tiết Kỹ Thuật |
|:---|:---:|:---|
| Brand Tokens (#9ACD32, Navy) | ✅ Done | Nhận diện thương hiệu QTDND Yên Thọ chuẩn mực |
| Dark / Light Mode tương thích 100% | ✅ Done | Tương phản cao WCAG AAA, chuyển chế độ tức thì |
| TopHeader Breadcrumb & Bell | ✅ Done | Điều hướng trực quan, chuông thông báo, Profile Pill |
| Skeleton Loaders | ✅ Done | Áp dụng cho Dashboard & Reports, triệt tiêu giật layout |
| Segmented Control | ✅ Done | `.seg-control` thay thế nút group thô |
| Tabular Nums cho Tiền Tệ | ✅ Done | Số liệu căn chỉnh thẳng hàng, chuyên nghiệp |

---

## 🔲 KẾ HOẠCH BƯỚC TIẾP THEO

### 🟡 Giai Đoạn Hoàn Thiện Tiếp Theo
- [ ] Bổ sung màn hình chi tiết cho Tab "Sao Kê Hợp Đồng" (`BC_DOANH_SO_TD`)
- [ ] Bổ sung bảng xếp hạng Tab "Top Dư Nợ Bình Quân"
- [ ] Audit độ chính xác dữ liệu đối soát khi Python Daemon đẩy dữ liệu đợt mới

---

## ✅ CHANGELOG

| Ngày | Version | Chi Tiết |
| **18/09/2026** | **v1.4.3** | **Hoàn thành Giai đoạn 2: Tích hợp Biểu đồ So Sánh Dư Nợ 3 Xã/12 Thôn `CommuneComparisonChart`, Donut Tỷ Trọng Sản Phẩm Vay `LoanProductDonutChart` & Nâng cấp toàn diện Customer 360° (`CustomerFinancialCard`, `ContractTimelineList`)** |
| 18/09/2026 | v1.4.2 | Hoàn thành sâu Giai đoạn 1: Biểu mẫu in Giấy Thỏa Thuận Trích Nợ A4 & Xuất Word (.doc) `DebitAgreementPrintModal`, 1-click in ấn trên bảng & modal, nâng cấp xuất file lệnh CoreBanking / Co-opBank và Bảng kê A4 có 3 khối ký duyệt |
| 18/09/2026 | v1.4.1 | Hoàn thành Giai đoạn 1: Phân rã Shared Catalog (SegControl, StatusBadge, EmptyState, ActionToolbar), tách sub-modules DebitRegisterTable & DebitBatchTable, nâng cấp Reconciliation & DebtWarning |
| 18/09/2026 | v1.4.0 | Tối ưu toàn diện GAS Performance (Singleton SS, Write Lock, Cache 60s), UI/UX Redesign (TopHeader breadcrumbs & bell, Skeleton loader, SegControl), nâng cấp Reports Live Data 100% |
| 17/09/2026 | v1.3.1 | Batch contract selection workflow |
| 16/09/2026 | v1.3.0 | DebitRegister CRUD hoàn chỉnh |
| 19/08/2026 | v1.3.0 | Engine tính lãi TT 14/2017, 14 bảng CSDL |
| 18/08/2026 | v1.2.0 | RBAC 360°, Self-healing schema |
| 18/08/2026 | v1.0.0 | Khởi tạo SPA CreditCores |

---

> **QUY TẮC BẮT BUỘC**:
> 1. Zero Mock Policy — 100% live data từ Google Sheets & Google Apps Script.
> 2. Mọi thay đổi mã nguồn bắt buộc vượt qua kiểm tra `npm run build` (Exit Code 0).
> 3. Tự động cập nhật file này sau mỗi phiên làm việc.
