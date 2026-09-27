# 📚 HỆ THỐNG TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ & KIẾN TRÚC FRONTEND CREDITCORES
# Quỹ Tín Dụng Nhân Dân Yên Thọ (Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hoá)

Thư mục `/docs/dacta` chứa toàn bộ các văn bản đặc tả kỹ thuật, kiến trúc giao diện (Frontend UI/UX), cấu trúc điều hướng (Navigation & Menu), lược đồ dữ liệu (Data Schema), và quy trình nghiệp vụ tín dụng chuyên sâu dành cho hệ thống **CreditCores**.

---

## 🗺️ BẢN ĐỒ DANH MỤC TÀI LIỆU ĐẶC TẢ

| STT | Mã Tài Liệu | Tên Module / Phân Hệ | Nội Dung Trọng Tâm |
| :---: | :--- | :--- | :--- |
| **00** | [`00_TONG_QUAN_HE_THONG_VA_MENU.md`](./00_TONG_QUAN_HE_THONG_VA_MENU.md) | **Tổng Quan Hệ Thống & Menu** | Kiến trúc tổng thể, Thanh điều hướng Sidebar, TopHeader, Layout Responsive, Design Tokens, Phân quyền RBAC 4 cấp, Lazy Loading & Chunk Recovery. |
| **01** | [`01_MODULE_DASHBOARD.md`](./01_MODULE_DASHBOARD.md) | **Tổng Quan Điều Hành (Dashboard)** | KPIs Tín dụng, Biểu đồ dòng tiền, Bản đồ phân bổ dư nợ 3 xã (Quý Lộc, Yên Thọ, Yên Lâm), Giám sát trạng thái Daemon đồng bộ SQL Core 24/7. |
| **02** | [`02_MODULE_CUSTOMER_360.md`](./02_MODULE_CUSTOMER_360.md) | **Tra Cứu Khách Hàng 360°** | Hồ sơ khách hàng & thành viên QTDND, Tiền gửi thanh toán CASA, Danh mục hợp đồng tín dụng, Phân công CBTD phụ trách, Quick View Modal. |
| **03** | [`03_MODULE_COLLATERAL.md`](./03_MODULE_COLLATERAL.md) | **Tài Sản Thế Chấp & Hợp Đồng Bảo Đảm** | Quản lý kho tài sản `TSBD_CORE`, Hợp đồng thế chấp `HDTC_CORE`, Phân loại tài sản, Định giá và liên kết đa hợp đồng. |
| **04** | [`04_MODULE_APPRAISAL.md`](./04_MODULE_APPRAISAL.md) | **Thẩm Định Tín Dụng & TSĐB** | Quy trình thẩm định 5 nhóm tài sản, Hệ số tài chính $LTV$, $EMI$, $DTI$, $DSCR$, Quy trình phê duyệt 4 cấp, In tờ trình thẩm định chuẩn A4. |
| **05** | [`05_MODULE_LOAN_INSPECTION.md`](./05_MODULE_LOAN_INSPECTION.md) | **Kiểm Tra Sử Dụng Vốn Sau Vay** | Giám sát chu kỳ 30 ngày, Thành phần đoàn kiểm tra (CBTD, BKS, HĐQT), Chụp và nén ảnh hiện trường trực tiếp trên Canvas, In biên bản A4. |
| **06** | [`06_MODULE_TRICH_NO_TU_DONG_AUTO_DEBIT.md`](./06_MODULE_TRICH_NO_TU_DONG_AUTO_DEBIT.md) | **Trích Nợ Tự Động (Auto-Debit)** ⭐ | **Đặc tả chuyên sâu toàn diện**: Đăng ký thỏa thuận CASA, Lập đợt tính lãi Thông tư 14/2017/TT-NHNN, Xuất lệnh Core, Đối soát kết quả, Sổ nợ tồn đọng & Tái cấu trúc Frontend. |
| **07** | [`07_MODULE_RECONCILIATION_DOI_SOAT.md`](./07_MODULE_RECONCILIATION_DOI_SOAT.md) | **Đối Soát & Kết Quả CoreBanking** | Xử lý file sao kê CoreBanking/Co-opBank (.csv, .xlsx), Khớp tự động tài khoản, Phân loại Thành công/Một phần/Thất bại, Chốt đợt và ghi nhận nợ đọng. |
| **08** | [`08_MODULE_DEBT_WARNING_NO_TON_DONG.md`](./08_MODULE_DEBT_WARNING_NO_TON_DONG.md) | **Cảnh Báo & Sổ Nợ Tồn Đọng** | Theo dõi nợ quá hạn trích, Phân loại nợ 1 kỳ, 2 kỳ, nợ đọng kéo dài, Phân công CBTD đôn đốc thu hồi và lịch sử xử lý nợ. |
| **09** | [`09_MODULE_REPORTS.md`](./09_MODULE_REPORTS.md) | **Báo Cáo Thống Kê & Phân Tích Dư Nợ** | Báo cáo cơ cấu nợ, Báo cáo doanh số tín dụng (`BC_DOANH_SO_TD`), Top dư nợ bình quân (`TOP_DU_NO_BINH_QUAN`), Xuất Excel & In ấn trực tiếp. |
| **10** | [`10_MODULE_TEMPLATE_MANAGER.md`](./10_MODULE_TEMPLATE_MANAGER.md) | **Quản Lý Biểu Mẫu Trộn Tài Liệu** | Quản lý mẫu Google Docs, Mail-Merge tự động, Đổ dữ liệu HĐTD, HĐTC, Tờ trình, Giấy đề nghị trích nợ, Xuất file Word/PDF. |
| **11** | [`11_MODULE_USER_AND_RBAC.md`](./11_MODULE_USER_AND_RBAC.md) | **Phân Quyền & Quản Trị Người Dùng** | Phân quyền ma trận 4 vai trò (`ADMIN`, `CBTD`, `KE_TOAN`, `LANH_DAO`), Bảo mật tài khoản, Đổi mật khẩu và Audit Trail. |
| **12** | [`12_MODULE_SETTINGS_AND_CORE_SYNC.md`](./12_MODULE_SETTINGS_AND_CORE_SYNC.md) | **Cấu Hình Hệ Thống & Giám Sát Đồng Bộ Core** | Giám sát Python Daemon 24/7 kết nối SQL Server, Lập lịch đồng bộ, Cơ chế Self-healing Schema và Xóa cache RAM tức thì. |
| **13** | [`13_MODULE_CREDIT_STATEMENT.md`](./13_MODULE_CREDIT_STATEMENT.md) | **Sao Kê Tín Dụng (Credit Statement)** ⭐ | **Phân hệ độc lập**: 5 Tab Đến ngày, Theo tháng (có biểu đồ so sánh chỉ số), Theo năm, Top 50, Cơ cấu vay 7 hình thức bảo đảm TSĐB. Bỏ 100% text kết nối CSDL, chỉ hiện icon nhấp nháy. |

---

## 🏛️ TIÊU CHUẨN THIẾT KẾ & ĐẶC TẢ CHUNG

1. **Chuẩn Mực Định Danh & Ngữ Cảnh**:
   - Đơn vị: **Quỹ Tín Dụng Nhân Dân Yên Thọ**.
   - Địa chỉ: **Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hoá**.
   - Địa bàn hoạt động tín dụng: **Xã Quý Lộc, Xã Yên Thọ, Xã Yên Lâm** (thuộc huyện Yên Định, tỉnh Thanh Hóa).
   - Múi giờ hệ thống: **GMT+7** (`Asia/Ho_Chi_Minh`), định dạng ngày tháng hiển thị **`dd/mm/yyyy`**.
2. **Quy Định Số Học & Tiền Tệ**:
   - Định dạng tiền tệ: `150.000.000 VNĐ` (phân cách hàng nghìn bằng dấu chấm `.`).
   - Kiểu chữ hiển thị số liệu: `tabular-nums` (font có độ rộng chữ số bằng nhau, không răng cưa).
3. **Nguyên Tắc Bất Biến Về Dữ Liệu**:
   - *Zero-Mock Policy*: Tuyệt đối không dùng dữ liệu giả định trong vận hành.
   - *Self-Healing Schema*: Tự động bổ sung cột mới trên Google Sheets mà không làm mất dữ liệu cũ.
   - *Preserve Assignment*: Giữ nguyên phân công CBTD trên WebApp khi Python Daemon đồng bộ từ SQL Server Core.
   - *Concurrency Locking*: Mọi giao dịch tài chính, tạo đợt, đối soát đều phải bọc qua `LockService.getScriptLock()` với thời gian chờ 15 giây.
