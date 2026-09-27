# 🏛️ ĐẶC TẢ TỔNG QUAN HỆ THỐNG, MENU & ĐIỀU HƯỚNG (NAVIGATION ARCHITECTURE)
# Hệ Thống Quản Lý Tín Dụng & Trích Nợ Tự Động CreditCores — QTDND Yên Thọ

---

## 1. TỔNG QUAN HỆ THỐNG & CÔNG NGHỆ (TECH STACK)

Hệ thống **CreditCores** được thiết kế chuyên biệt cho công tác quản lý tín dụng, thẩm định tài sản, kiểm tra sau vay và trích nợ tự động tài khoản tiền gửi không kỳ hạn (CASA) tại Quỹ tín dụng nhân dân Yên Thọ.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       KIẾN TRÚC TỔNG THỂ CREDITCORES                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  FRONTEND (React 18 + Vite 5 + Bootstrap 5 + Lucide React)                  │
│  ├── High-Speed SWR In-Memory Cache (< 1ms chuyển tab)                      │
│  ├── Responsive Layout: Sidebar Drawer (Mobile) + Collapsible (Desktop)     │
│  └── Self-Healing Dynamic Chunk Loading (Tự phục hồi khi cập nhật phiên bản) │
├─────────────────────────────────────────────────────────────────────────────┤
│  BACKEND (Google Apps Script REST API - 100% Serverless & 0 Phí)           │
│  ├── Rest API: Code.gs, Router.gs, LockService Atomicity (15s)              │
│  └── CSDL: Google Sheets Database (14 Bảng dữ liệu chuẩn hóa)               │
├─────────────────────────────────────────────────────────────────────────────┤
│  LOCAL DAEMON (Pure Python 3.10+ trên Máy chủ SQL Server)                   │
│  ├── pyodbc kết nối CoreBanking SQL Server nội bộ                           │
│  ├── gspread đồng bộ 2 chiều lên Google Sheets Database                     │
│  └── Preserve Assignment (Bảo toàn phân công cán bộ & trạng thái HĐ)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. KIẾN TRÚC MENU ĐIỀU HƯỚNG & DANH MỤC PHÂN HỆ

Toàn bộ hệ thống được tổ chức qua thanh điều hướng **Sidebar** bên trái, phân thành 7 nhóm nghiệp vụ với 13 phân hệ trực quan:

```
SIDEBAR NAVIGATION TREE:
├── TỔNG QUAN
│   └── [dashboard]         Tổng quan Điều hành & KPIs Tín dụng
├── KHÁCH HÀNG
│   └── [customer360]       Tra cứu Khách hàng & Hợp đồng 360°
├── TÍN DỤNG
│   ├── [credit_statement]  Sao kê tín dụng (Đến ngày, theo tháng, năm, Top 50, cơ cấu vay)
│   ├── [collateral]        Tài sản thế chấp & Hợp đồng (TSBD_CORE)
│   ├── [appraisal]         Thẩm định Tín dụng & TSĐB (5 nhóm TS)
│   └── [inspection]        Kiểm tra Sử dụng Vốn (Chu kỳ 30 ngày)
├── TRÍCH NỢ & THU HỒI
│   ├── [debit_register]    1. Thỏa thuận CASA
│   ├── [debit_batch]       2. Đợt Trích nợ Tự động (TT 14/2017)
│   ├── [reconciliation]    3. Đối soát Kết quả Core
│   └── [debt_warning]      4. Sổ Nợ tồn đọng & Cảnh báo thu hồi
├── BÁO CÁO
│   └── [reports]           Báo cáo Thống kê
└── HỆ THỐNG
    ├── [templates]         Quản lý Biểu mẫu Trộn Tài liệu
    ├── [user_management]   Phân quyền & Quản lý Tài khoản (RBAC)
    └── [settings]          Cấu hình Hệ thống
```

### 2.1. Bảng Chi Tiết Thuộc Tính & Phân Quyền Menu

| Tab ID | Tên Hiển Thị | Icon | Danh Mục | Vai Trò Cho Phép | Mục Tiêu Nghiệp Vụ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `dashboard` | **Tổng quan** | `LayoutDashboard` | TỔNG QUAN | All (Admin, CBTD, Kế toán, Lãnh đạo) | Theo dõi toàn diện số liệu dư nợ, cảnh báo và chỉ số tài chính. |
| `credit_statement` | **Sao kê tín dụng** | `FileSpreadsheet` | TÍN DỤNG | All (Admin, CBTD, Kế toán, BKS, Lãnh đạo) | Sao kê đến ngày, chuỗi theo tháng có biểu đồ so sánh, theo năm, Top 50 và cơ cấu vay. |
| `customer360` | **Tra cứu KH & HĐ** | `Users` | KHÁCH HÀNG | All | Tra cứu 360° thông tin khách hàng, số tài khoản CASA, lịch sử vay, phân công CBTD. |
| `collateral` | **Tài sản thế chấp** | `ShieldCheck` | TÍN DỤNG | Admin, CBTD, Lãnh đạo | Quản lý kho tài sản bảo đảm, số sổ đỏ, số khung số máy, liên kết hợp đồng. |
| `appraisal` | **Thẩm định Tín dụng** | `FileCheck2` | TÍN DỤNG | Admin, CBTD, Lãnh đạo | Lập phương án vay, định giá TSĐB, chấm điểm tài chính và phê duyệt 4 cấp. |
| `inspection` | **Kiểm tra Sử dụng Vốn** | `ClipboardList` | TÍN DỤNG | Admin, CBTD, Lãnh đạo | Lập lịch kiểm tra hiện trường sau giải ngân 30 ngày, chụp ảnh thực địa và lưu biên bản. |
| `debit_register` | **Đăng ký Trích nợ** | `UserCheck` | TRÍCH NỢ | Admin, CBTD, Kế toán, Lãnh đạo | Quản lý thỏa thuận ủy quyền trích nợ tự động từ tài khoản thanh toán CASA. |
| `debit_batch` | **Đợt Trích nợ** | `Zap` | TRÍCH NỢ | Admin, Kế toán, Lãnh đạo | Khởi tạo đợt thu nợ định kỳ (ngày 05, 15, 25), tính lãi ngày thực tế theo TT 14/2017. |
| `reconciliation` | **Đối soát & Kết quả** | `ArrowLeftRight` | KẾ TOÁN | Admin, Kế toán, Lãnh đạo | Nhập file sao kê kết quả CoreBanking, đối chiếu nợ đã trích, ghi nhận nợ thiếu. |
| `debt_warning` | **Cảnh báo Nợ tồn đọng** | `AlertTriangle` | QUẢN LÝ NỢ | Admin, CBTD, Kế toán, Lãnh đạo | Danh sách các món trích không thành công hoặc trích thiếu, giao CBTD xử lý. |
| `reports` | **Báo cáo Thống kê** | `FileBarChart2` | BÁO CÁO | All | Xuất báo cáo phân bổ dư nợ 3 xã, doanh số tín dụng, top khách hàng vay vốn. |
| `templates` | **Quản lý Biểu mẫu** | `Layers` | HỆ THỐNG | Admin, CBTD, Lãnh đạo | Quản lý kho mẫu biểu Docs, Mail-Merge xuất hợp đồng tín dụng, tờ trình, phiếu thu. |
| `user_management` | **Phân quyền Người dùng** | `UserCog` | HỆ THỐNG | Admin | Quản trị tài khoản đăng nhập, gán vai trò, reset mật khẩu cán bộ. |
| `settings` | **Cấu hình & Đồng bộ** | `Settings` | HỆ THỐNG | Admin, Lãnh đạo | Thiết lập tham số hệ thống, kích hoạt đồng bộ tức thì với SQL Server nội bộ. |

---

## 3. CƠ CHẾ PHÂN QUYỀN MA TRẬN 4 CẤP (RBAC MATRIX)

Hệ thống phân định rạch ròi trách nhiệm nghiệp vụ giữa các bộ phận:

| Vai Trò (`Role`) | Nhãn Giao Diện | Thẩm Quyền Tín Dụng & Vận Hành |
| :--- | :--- | :--- |
| **`ADMIN`** | **Quản Trị Hệ Thống** | Toàn quyền kiểm soát 100% các phân hệ, quản trị người dùng, cấu hình SQL Daemon, sửa đổi mọi biểu mẫu và dữ liệu. |
| **`LANH_DAO`** | **Ban Giám Đốc / HĐQT** | Xem toàn bộ báo cáo, hồ sơ khách hàng, phê duyệt tờ trình thẩm định cấp Ban Điều hành/HĐQT, kiểm soát đợt trích nợ và đối soát. |
| **`CBTD`** | **Cán Bộ Tín Dụng** | Quản lý khách hàng phụ trách, lập tờ trình thẩm định, lập biên bản kiểm tra sử dụng vốn, theo dõi danh sách đăng ký trích nợ và đôn đốc nợ tồn đọng. Không thao tác phân quyền hoặc cấu hình đợt trích nợ. |
| **`KE_TOAN`** | **Kế Toán / Thủ Quỹ** | Chuyên trách thực hiện: Khởi tạo đợt trích nợ tự động, xuất file lệnh trích nợ CoreBanking, đối soát file sao kê tài khoản CASA, chốt sổ đợt trích nợ và cập nhật sổ theo dõi nợ đọng. |

---

## 4. QUY CHUẨN GIAO DIỆN (UI/UX) & DESIGN TOKENS

### 4.1. Hệ Thống Màu Sắc Thương Hiệu
- **Màu Chủ Đạo (Primary Brand)**:
  - Gradient Xanh Thương Hiệu: `linear-gradient(135deg, #9acd32 0%, #047857 100%)` (Sự kết hợp giữa xanh lộc non tươi sáng và xanh ngọc bảo ngân hàng).
  - Màu Nền Sidebar: Nền tối sang trọng `#0b1329` kết hợp hiệu ứng kính Glassmorphism mờ nhẹ.
  - Viền Nhấn (Border Accent): `#9acd32` và `rgba(154, 205, 50, 0.25)`.
- **Màu Báo Trạng Thái Chuẩn Mực**:
  - `Thành công / Hiệu lực`: `#10b981` (Emerald Green) kèm badge xanh ngọc mềm.
  - `Cảnh báo / Tạm ngưng / Nợ 1 kỳ`: `#f59e0b` (Amber Yellow).
  - `Thất bại / Nợ xấu / Quá hạn`: `#ef4444` (Crimson Red).
  - `Thông tin / Kỳ trích`: `#3b82f6` (Royal Blue) & `#06b6d4` (Cyan).

### 4.2. Quy Chuẩn Typography & Hiển Thị Số Học
- Toàn bộ giao diện sử dụng font hiện đại, rõ ràng, không chân: `Inter`, `Be Vietnam Pro`, `system-ui`.
- **Bắt buộc dùng `tabular-nums`** cho tất cả bảng biểu số liệu, số dư, số tiền lãi, mã khách hàng, số hợp đồng tín dụng và số tài khoản để các con số thẳng hàng hoàn hảo theo chiều dọc.
- Mọi ngày tháng hiển thị theo định dạng Việt Nam **`dd/mm/yyyy`**. Bộ chọn lịch bắt buộc cấu hình `disableMobile: true` để đồng nhất giao diện và chống xung đột trên trình duyệt di động.

---

## 5. TỐI ƯU HIỆU NĂNG & CƠ CHẾ TỰ CHỮA LÀNH (SELF-HEALING ARCHITECTURE)

### 5.1. Dynamic Code-Splitting & Lazy Loading An Toàn
- Toàn bộ các phân hệ lớn (`Customer360`, `Appraisal`, `DebitManager`, `Reconciliation`, `Reports`, `TemplateManager`) đều được chia nhỏ thành các chunk động (Chunk Loading).
- **Hàm bọc `lazyWithRetry(componentImport)`**: Bắt lỗi `ChunkLoadError` hoặc `Failed to fetch dynamically imported module` khi máy chủ cập nhật phiên bản mới, tự động xóa cờ cache và làm mới trang mà không gây màn hình trắng.
- **Sự kiện `vite:preloadError`**: Lắng nghe cấp ứng dụng để phát hiện việc lệch phiên bản file bundle và tải lại tức thì.

### 5.2. Chuyển Đổi Tab Tức Thì (< 1ms) Với In-Memory Cache
- Triển khai mô hình Stale-While-Revalidate (SWR): Dữ liệu danh mục khách hàng, hợp đồng và đăng ký trích nợ được lưu tạm trong bộ nhớ RAM client.
- Khi cán bộ chuyển giữa các tab `customer360` $\leftrightarrow$ `debit_batch` $\leftrightarrow$ `appraisal`, giao diện render ngay lập tức mà không có độ trễ xoay vòng loading spinner.
- Nút **"Tải lại" (`RefreshCw`)** cho phép cán bộ chủ động xóa cache và ép nạp dữ liệu mới nhất từ CSDL máy chủ.
