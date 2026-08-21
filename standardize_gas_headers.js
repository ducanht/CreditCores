import fs from 'fs';
import path from 'path';

const filesMeta = {
  'Code.gs': {
    module: 'REST API ROUTER & DISPATCHER',
    description: 'Xử lý định tuyến REST API (doGet, doPost), điều phối request đến các Controller nghiệp vụ, kiểm tra khởi tạo CSDL tự động và xử lý lỗi tập trung.',
    created: '15/08/2026'
  },
  'AutoGeneratGoogleSheets.gs': {
    module: 'DATABASE AUTO GENERATOR & SCHEMA MIGRATION',
    description: 'Tự động kiểm tra, khởi tạo và đồng bộ 12 bảng CSDL Google Sheets chuẩn hóa cho hệ thống CreditCores.',
    created: '15/08/2026'
  },
  'CreditCores_GAS_ALL_IN_ONE.gs': {
    module: 'ALL-IN-ONE STANDALONE BACKEND BUNDLE',
    description: 'Bản đóng gói toàn bộ backend Google Apps Script thành một tệp duy nhất phục vụ triển khai nhanh hoặc môi trường độc lập.',
    created: '19/08/2026'
  },
  'Appraisal/AppraisalController.gs': {
    module: 'THẨM ĐỊNH TÍN DỤNG & TSĐB (APPRAISAL CONTROLLER)',
    description: 'Quản lý hồ sơ thẩm định tín dụng, chấm điểm CIC, định giá tài sản bảo đảm, tính tỷ lệ LTV và luồng phê duyệt đa cấp 5 nhóm nghiệp vụ.',
    created: '15/08/2026'
  },
  'Auth/AuthController.gs': {
    module: 'XÁC THỰC NGƯỜI DÙNG & BẢO MẬT (AUTH CONTROLLER)',
    description: 'Xử lý đăng nhập, kiểm tra mật khẩu hash SHA-256, đổi mật khẩu và quản lý phiên làm việc người dùng.',
    created: '15/08/2026'
  },
  'Auth/RoleController.gs': {
    module: 'PHÂN QUYỀN VAI TRÒ & NGƯỜI DÙNG (ROLE CONTROLLER)',
    description: 'Quản lý danh sách vai trò (Roles), phân quyền chi tiết ma trận 360° theo phân hệ và quản lý tài khoản người dùng.',
    created: '15/08/2026'
  },
  'Collateral/CollateralController.gs': {
    module: 'TÀI SẢN BẢO ĐẢM & HỢP ĐỒNG THẾ CHẤP (COLLATERAL CONTROLLER)',
    description: 'Quản lý kho tài sản bảo đảm (TSBD_CORE), định giá, liên kết hợp đồng thế chấp và đồng bộ tài sản thế chấp.',
    created: '15/08/2026'
  },
  'Customer/Customer360Controller.gs': {
    module: 'TRA CỨU KHÁCH HÀNG 360° (CUSTOMER 360 CONTROLLER)',
    description: 'Tra cứu thông tin khách hàng 360°, thông tin thành viên QTDND, số dư tiền gửi thanh toán (CASA), hợp đồng tín dụng và lịch sử trích nợ.',
    created: '15/08/2026'
  },
  'Dashboard/DashboardController.gs': {
    module: 'BẢNG ĐIỀU KHIỂN QUẢN TRỊ TỔNG HỢP (DASHBOARD CONTROLLER)',
    description: 'Tổng hợp chỉ số KPI, dư nợ tín dụng, tỷ lệ trích nợ thành công, cảnh báo nợ quá hạn và biểu đồ xu hướng tín dụng.',
    created: '15/08/2026'
  },
  'Database/Cache.gs': {
    module: 'HỆ THỐNG CACHE BỘ NHỚ TẬP TRUNG (CACHE HELPER)',
    description: 'Tối ưu hiệu năng truy vấn Google Apps Script qua CacheService, quản lý thời gian sống TTL và cơ chế hủy cache thông minh theo phân hệ.',
    created: '15/08/2026'
  },
  'Database/SchemaSetup.gs': {
    module: 'QUẢN TRỊ CẤU TRÚC DỮ LIỆU CSDL (SCHEMA SETUP & MIGRATION)',
    description: 'Quản trị 12 bảng CSDL Google Sheets, tự động kiểm tra, khởi tạo và tự nâng cấp cấu trúc cột (Self-Healing Zero-Data-Loss Remapping).',
    created: '15/08/2026'
  },
  'Debit/DebitController.gs': {
    module: 'QUẢN LÝ TRÍCH NỢ TỰ ĐỘNG (AUTO-DEBIT CONTROLLER)',
    description: 'Quản lý đăng ký trích nợ, khởi tạo đợt trích nợ tự động theo 3 kỳ (05, 15, 25), tính lãi ngày thực tế theo TT 14/2017/TT-NHNN và ghi nhận kết quả trích nợ.',
    created: '15/08/2026'
  },
  'Debt/DebtWarningController.gs': {
    module: 'THEO DÕI NỢ TỒN ĐỌNG & CẢNH BÁO THU HỒI NỢ (DEBT WARNING CONTROLLER)',
    description: 'Quản lý sổ theo dõi nợ tồn đọng, phân loại nhóm nợ, theo dõi lịch sử đôn đốc nhắc nợ và cảnh báo rủi ro thu hồi nợ.',
    created: '15/08/2026'
  },
  'Inspection/InspectionController.gs': {
    module: 'KIỂM TRA SỬ DỤNG VỐN SAU GIẢI NGÂN (INSPECTION CONTROLLER)',
    description: 'Quản lý biên bản kiểm tra sử dụng vốn vay sau giải ngân, kiểm tra thực địa, hóa đơn chứng từ và đánh giá hiệu quả sử dụng vốn.',
    created: '15/08/2026'
  },
  'Modules/ConfigController.gs': {
    module: 'CẤU HÌNH THAM SỐ HỆ THỐNG (SYSTEM CONFIG CONTROLLER)',
    description: 'Quản lý tham số vận hành hệ thống, thông tin Quỹ tín dụng, tham số tính lãi, định mức tỷ lệ trích nợ và cấu hình chung.',
    created: '15/08/2026'
  },
  'Modules/DocumentController.gs': {
    module: 'QUẢN LÝ BIỂU MẪU & TRỘN MẪU GOOGLE DOCS (DOCUMENT MERGE CONTROLLER)',
    description: 'Quản lý kho biểu mẫu văn bản tín dụng, cấu hình trường trộn dữ liệu và tạo tự động tài liệu Word/Google Docs/PDF.',
    created: '15/08/2026'
  },
  'Modules/ModuleRegistryController.gs': {
    module: 'ĐĂNG KÝ PHÂN HỆ VÀ ĐIỀU HƯỚNG (MODULE REGISTRY CONTROLLER)',
    description: 'Quản lý danh mục 10 phân hệ nghiệp vụ tín dụng, trạng thái kích hoạt và ánh xạ quyền truy cập người dùng.',
    created: '15/08/2026'
  },
  'Reconciliation/ReconciliationController.gs': {
    module: 'ĐỐI SOÁT KẾT QUẢ TRÍCH NỢ & PHÂN LOẠI (RECONCILIATION CONTROLLER)',
    description: 'Đối soát dữ liệu trích nợ thực tế với sao kê tài khoản CASA, phân loại kết quả (Đã trích đủ, Trích 1 phần, Thất bại) và cập nhật số dư.',
    created: '15/08/2026'
  },
  'Reports/ReportController.gs': {
    module: 'BÁO CÁO QUẢN TRỊ ĐA CHIỀU & THỐNG KÊ (REPORT CONTROLLER)',
    description: 'Trích xuất báo cáo tăng trưởng tín dụng, phân tích hiệu quả trích nợ tự động, thống kê nợ quá hạn và xuất dữ liệu Excel/CSV.',
    created: '15/08/2026'
  },
  'Sync/SyncController.gs': {
    module: 'ĐỒNG BỘ DỮ LIỆU SQL SERVER & PYTHON DAEMON (SYNC CONTROLLER)',
    description: 'Tiếp nhận và xác thực đồng bộ dữ liệu 2 chiều giữa Google Sheets và Core SQL Server qua Python Daemon 24/7.',
    created: '15/08/2026'
  },
  'Utils/DateUtils.gs': {
    module: 'TIỆN ÍCH NGÀY THÁNG & TÍNH LÃI THỰC TẾ (DATE UTILS)',
    description: 'Tiện ích chuẩn hóa định dạng ngày tháng dd/MM/yyyy, tính số ngày thực tế theo Thông tư 14/2017/TT-NHNN và tính toán tiền lãi phát sinh.',
    created: '15/08/2026'
  }
};

const baseDir = 'd:/Antigravity Projects/CreditCores/gas_backend';

function generateHeader(info) {
  return `/**
 * ========================================================================================
 * CREDITCORES - ${info.module}
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description ${info.description}
 * @created     ${info.created}
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */
`;
}

let count = 0;
for (const [relPath, info] of Object.entries(filesMeta)) {
  const fullPath = path.join(baseDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[NOT FOUND] ${fullPath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Strip existing top comment block
  // Matches initial whitespace + /* ... */
  const cleanedContent = content.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '');

  const newContent = generateHeader(info) + '\n' + cleanedContent;
  fs.writeFileSync(fullPath, newContent, 'utf8');
  console.log(`[SUCCESS] Standardized: ${relPath}`);
  count++;
}

console.log(`\n=== HOÀN THÀNH: Đã chuẩn hóa ${count}/21 tệp .gs ===`);
