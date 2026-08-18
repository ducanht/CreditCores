/**
 * ========================================================================================
 * CREDITCORES - GOOGLE APPS SCRIPT REST API ROUTER & DISPATCHER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * Kiến Trúc Domain-Driven Controllers & LockService
 * ========================================================================================
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getDashboardStats";
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    var result;
    switch (action) {
      case "getDashboardStats":
        result = DashboardController.handleGetDashboardStats(ss);
        break;
      case "searchCustomer360":
        result = Customer360Controller.handleSearchCustomer360(ss, { query: e.parameter.query || "" });
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
      case "getDebitBatches":
        result = DebitController.handleGetDebitBatches(ss);
        break;
      case "getDebtWarnings":
        result = DebtWarningController.handleGetDebtWarnings(ss);
        break;
      case "getReportsData":
        result = ReportController.handleGetReportsData(ss);
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
  var lock = LockService.getScriptLock();
  var isLocked = false;
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    isLocked = lock.tryLock(10000);
    if (!isLocked) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Hệ thống CSDL đang bận xử lý giao dịch khác. Vui lòng thử lại sau 3 giây."
      })).setMimeType(ContentService.MimeType.JSON);
    }

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
      case "saveLoanInspection":
        result = InspectionController.handleSaveLoanInspection(ss, data);
        break;
      case "saveDebitRegister":
        result = DebitController.handleSaveDebitRegister(ss, data);
        break;
      case "createDebitBatch":
        result = DebitController.handleCreateDebitBatch(ss, data);
        break;
      case "reconcileUpload":
        result = ReconciliationController.handleReconcileUpload(ss, data);
        break;
      case "triggerSqlSync":
        result = SyncController.handleTriggerSqlSync(ss);
        break;
      case "initDatabase":
        result = SchemaSetup.setupAllSheets(ss);
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
    if (isLocked) {
      try {
        lock.releaseLock();
      } catch (releaseErr) {}
    }
  }
}

function runSetupDirectly() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return SchemaSetup.setupAllSheets(ss);
}
