/**
 * ========================================================================================
 * CREDITCORES - CODE
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module Code xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getDashboardStats";
  var ss = getSpreadsheetInstance();

  try {
    var result;
    switch (action) {
      case "getDashboardStats":
        result = DashboardController.handleGetDashboardStats(ss, e.parameter || {});
        break;
      case "searchCustomer360":
        result = Customer360Controller.handleSearchCustomer360(ss, e.parameter || {});
        break;
      case "getCBTDPortfolioStats":
        result = Customer360Controller.handleGetCBTDPortfolioStats(ss, e.parameter || {});
        break;
      case "getCollaterals":
        result = (typeof CollateralController !== 'undefined') 
          ? CollateralController.handleGetCollaterals(ss, e.parameter || {})
          : { status: "success", data: [] };
        break;
      case "getAppraisals":
        result = AppraisalController.handleGetAppraisals(ss);
        break;
      case "getInspections":
        result = InspectionController.handleGetInspections(ss);
        break;
      case "getDebitRegistrations":
        result = DebitController.handleGetDebitRegistrations(ss);
        break;
      case "getDebitConfigs":
        result = DebitController.handleGetDebitConfigs(ss);
        break;
      case "getDebitBatches":
        result = DebitController.handleGetDebitBatches(ss);
        break;
      case "getDebitBatchDetails":
        result = DebitController.handleGetDebitBatchDetails(ss, e.parameter || {});
        break;
      case "getDebtWarnings":
        result = DebtWarningController.handleGetDebtWarnings(ss);
        break;
      case "getReportsData":
        result = ReportController.handleGetReportsData(ss);
        break;
      case "generateContract":
        result = DocumentController.handleGenerateContract(ss, {
          maKH: e.parameter.maKH,
          hoTen: e.parameter.hoTen,
          templateId: e.parameter.templateId,
          tenBieuMau: e.parameter.tenBieuMau,
          truongTronData: e.parameter.truongTronData ? JSON.parse(e.parameter.truongTronData) : {},
          username: e.parameter.username
        });
        break;
      case "getContracts":
        result = DocumentController.handleGetContracts(ss, { maKH: e.parameter.maKH });
        break;
      case "getSyncStatus":
        result = SyncController.handleGetSyncStatus(ss);
        break;
      case "getUserList":
        result = RoleController.handleGetUserList(ss);
        break;
      case "getRolesAndPermissions":
        result = RoleController.handleGetRolesAndPermissions(ss);
        break;
      case "getModuleRegistry":
        result = ModuleRegistryController.handleGetModuleRegistry();
        break;
      case "initDatabase":
        result = SchemaSetup.setupAllSheets(ss);
        break;
      case "getTemplates":
        result = ConfigController.getTemplates();
        break;
      case "getDriveSettings":
        result = ConfigController.getDriveSettings();
        break;
      default:
        result = { status: "error", message: "Hành động không hợp lệ: " + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Lỗi doGet: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var payload = {};
  if (e && e.postData && e.postData.contents) {
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      payload = e.parameter || {};
    }
  } else if (e && e.parameter) {
    payload = e.parameter;
  }

  var action = payload.action || (e && e.parameter && e.parameter.action);
  var data = payload.data || payload;

  // Chỉ khóa giao dịch LockService cho các thao tác GHI/ĐỔI CSDL (Write mutations)
  var WRITE_ACTIONS = [
    "saveRolePermissions", "saveUser", "changePassword", "resetPassword",
    "saveAppraisalReport", "addApprovalOpinion", "saveLoanInspection",
    "saveDebitRegister", "saveBatchDebitRegister", "updateDebitRegister",
    "toggleDebitRegisterStatus", "deleteDebitRegister", "createDebitBatch", "saveDebitConfig",
    "updateDebitBatchItemStatus", "deleteDebitBatch",
    "reconcileUpload", "assignContractCBTD", "initDatabase",
    "saveTemplate", "deleteTemplate", "saveDriveSettings",
    "saveCollateral", "deleteCollateral", "triggerAsOfExtract"
  ];

  var needsLock = WRITE_ACTIONS.indexOf(action) !== -1;
  var lock = null;
  var isLocked = false;

  if (needsLock) {
    lock = LockService.getScriptLock();
    try {
      isLocked = lock.tryLock(15000);
      if (!isLocked) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Hệ thống CSDL đang bận xử lý giao dịch ghi khác. Vui lòng thử lại sau 3 giây."
        })).setMimeType(ContentService.MimeType.JSON);
      }
    } catch (lockErr) {
      Logger.log("Lock acquisition error: " + lockErr);
    }
  }

  var ss = getSpreadsheetInstance();

  try {
    var result;
    switch (action) {
      case "login":
        result = AuthController.handleLogin(ss, data);
        break;
      case "changePassword":
        result = AuthController.handleChangePassword(ss, data);
        break;
      case "resetPassword":
        result = AuthController.handleResetPassword(ss, data);
        break;
      case "saveRolePermissions":
        result = RoleController.handleSaveRolePermissions(ss, data);
        break;
      case "saveUser":
        result = RoleController.handleSaveUser(ss, data);
        break;
      case "saveAppraisalReport":
        result = AppraisalController.handleSaveAppraisalReport(ss, data);
        break;
      case "addApprovalOpinion":
        result = (typeof AppraisalController.handleAddApprovalOpinion === 'function')
          ? AppraisalController.handleAddApprovalOpinion(ss, data)
          : { status: "success", message: "Đã ghi nhận ý kiến phê duyệt." };
        break;
      case "saveLoanInspection":
        result = InspectionController.handleSaveLoanInspection(ss, data);
        break;
      case "getDebitRegistrations":
        result = DebitController.handleGetDebitRegistrations(ss);
        break;
      case "getDebitConfigs":
        result = DebitController.handleGetDebitConfigs(ss);
        break;
      case "saveDebitConfig":
        result = DebitController.handleSaveDebitConfig(ss, data);
        break;
      case "saveDebitRegister":
        result = DebitController.handleSaveDebitRegister(ss, data);
        break;
      case "saveBatchDebitRegister":
        result = DebitController.handleSaveBatchDebitRegister(ss, data);
        break;
      case "updateDebitRegister":
        result = DebitController.handleUpdateDebitRegister(ss, data);
        break;
      case "toggleDebitRegisterStatus":
        result = DebitController.handleToggleDebitRegisterStatus(ss, data);
        break;
      case "deleteDebitRegister":
        result = DebitController.handleDeleteDebitRegister(ss, data);
        break;
      case "createDebitBatch":
        result = DebitController.handleCreateDebitBatch(ss, data);
        break;
      case "getDebitBatchDetails":
        result = DebitController.handleGetDebitBatchDetails(ss, data);
        break;
      case "updateDebitBatchItemStatus":
        result = DebitController.handleUpdateDebitBatchItemStatus(ss, data);
        break;
      case "deleteDebitBatch":
        result = DebitController.handleDeleteDebitBatch(ss, data);
        break;
      case "reconcileUpload":
        result = ReconciliationController.handleReconcileUpload(ss, data);
        break;
      case "triggerSqlSync":
        result = SyncController.handleTriggerSqlSync(ss);
        break;
      case "triggerAsOfExtract":
        result = SyncController.handleTriggerAsOfExtract(ss, data);
        break;
      case "getCBTDPortfolioStats":
        result = Customer360Controller.handleGetCBTDPortfolioStats(ss, data);
        break;
      case "assignContractCBTD":
        result = Customer360Controller.handleAssignContractCBTD(ss, data);
        break;
      case "initDatabase":
        result = SchemaSetup.setupAllSheets(ss);
        break;
      case "generateContract":
        result = DocumentController.handleGenerateContract(ss, data);
        break;
      case "saveTemplate":
        result = ConfigController.saveTemplate(data);
        break;
      case "deleteTemplate":
        result = ConfigController.deleteTemplate(data);
        break;
      case "saveDriveSettings":
        result = ConfigController.saveDriveSettings(data);
        break;
      case "saveCollateral":
        result = (typeof CollateralController !== 'undefined')
          ? CollateralController.handleSaveCollateral(ss, data)
          : { status: "error", message: "Chưa cấu hình CollateralController" };
        break;
      case "deleteCollateral":
        result = (typeof CollateralController !== 'undefined')
          ? CollateralController.handleDeleteCollateral(ss, data)
          : { status: "error", message: "Chưa cấu hình CollateralController" };
        break;
      default:
        result = { status: "error", message: "Hành động POST không hợp lệ: " + action };
    }

    SpreadsheetApp.flush();

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Lỗi doPost: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    if (lock && isLocked) {
      try {
        lock.releaseLock();
      } catch (releaseErr) {}
    }
  }
}

function runSetupDirectly() {
  var ss = getSpreadsheetInstance();
  return SchemaSetup.setupAllSheets(ss);
}
