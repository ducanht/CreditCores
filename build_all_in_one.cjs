/**
 * Script tự động ghép các module của gas_backend thành CreditCores_GAS_ALL_IN_ONE.gs
 */
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const gasBackendDir = path.join(rootDir, 'gas_backend');
const outputFile = path.join(gasBackendDir, 'CreditCores_GAS_ALL_IN_ONE.gs');

const modules = [
  'Utils/DateUtils.gs',
  'Utils/HeaderUtils.gs',
  'Database/Cache.gs',
  'Database/SchemaSetup.gs',
  'Dashboard/DashboardController.gs',
  'Auth/AuthController.gs',
  'Auth/RoleController.gs',
  'Customer/Customer360Controller.gs',
  'Collateral/CollateralController.gs',
  'Appraisal/AppraisalController.gs',
  'Inspection/InspectionController.gs',
  'Debit/DebitController.gs',
  'Reconciliation/ReconciliationController.gs',
  'Debt/DebtWarningController.gs',
  'Reports/ReportController.gs',
  'Sync/SyncController.gs',
  'Modules/DocumentController.gs',
  'Modules/ConfigController.gs',
  'Modules/ModuleRegistryController.gs',
  'AutoGeneratGoogleSheets.gs',
  'Code.gs'
];

let banner = `/**
 * ========================================================================================
 * CREDITCORES - ALL-IN-ONE GOOGLE APPS SCRIPT BACKEND ENGINE
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Trọn bộ Backend Google Apps Script All-In-One:
 *              - Header-Name Based Mapping (chống lệch cột, an toàn khi thêm/bớt cột)
 *              - Tối ưu tra cứu O(1) Hash Map cho 5.175+ khách hàng & 549+ hợp đồng
 *              - Thẩm định, Trích nợ Auto-Debit, Kiểm tra vốn, In hợp đồng Mail Merge
 *              - Độc lập hoàn toàn, không nghẽn Timeout, Zero Mock Data
 * @updated     ${new Date().toLocaleDateString('vi-VN')}
 * @version     3.1 Header-Based Resilient Engine
 * ========================================================================================
 */

`;

let combinedContent = banner;

modules.forEach(modPath => {
  const fullPath = path.join(gasBackendDir, modPath);
  if (fs.existsSync(fullPath)) {
    console.log(`Đang ghép: ${modPath}`);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Chống lỗi "Identifier 'DB_SPREADSHEET_ID' has already been declared" nếu có
    if (modPath === 'AutoGeneratGoogleSheets.gs') {
      content = content.replace(
        /var\s+DB_SPREADSHEET_ID\s*=/,
        '// var DB_SPREADSHEET_ID ='
      );
    }

    combinedContent += `\n// ==========================================\n`;
    combinedContent += `// MODULE FILE: gas_backend/${modPath}\n`;
    combinedContent += `// ==========================================\n\n`;
    combinedContent += content + `\n\n`;
  } else {
    console.warn(`⚠️ Không tìm thấy file: ${fullPath}`);
  }
});

fs.writeFileSync(outputFile, combinedContent, 'utf8');
console.log(`✅ Đã xuất thành công bundle all-in-one tới: ${outputFile} (${combinedContent.length} bytes)`);
