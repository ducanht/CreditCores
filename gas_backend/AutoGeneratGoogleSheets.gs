/**
 * ========================================================================================
 * CREDITCORES - AUTOGENERATGOOGLESHEETS
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module AutoGeneratGoogleSheets xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var DB_SPREADSHEET_ID = typeof DB_SPREADSHEET_ID !== 'undefined' ? DB_SPREADSHEET_ID : "1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw";

function runSetupDirectly() {
  Logger.log(">>> Bắt đầu rà soát và chuẩn hóa tự động 20 bảng CSDL CreditCores...");
  var ss;
  if (DB_SPREADSHEET_ID && DB_SPREADSHEET_ID.length > 10) {
    try {
      ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID);
    } catch(e) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  var res = SchemaSetup.ensureDatabaseSchema(ss, false);
  Logger.log(">>> Kết quả: " + JSON.stringify(res));

  var ui;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { ui = null; }
  if (ui && res) {
    ui.alert("✅ Chuẩn Hóa CSDL", res.message, ui.ButtonSet.OK);
  }
  return res;
}

function runForceStandardize() {
  Logger.log(">>> Bắt đầu ép buộc chuẩn hóa (Force Standardize) 20 bảng CSDL CreditCores...");
  var ss;
  if (DB_SPREADSHEET_ID && DB_SPREADSHEET_ID.length > 10) {
    try {
      ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID);
    } catch(e) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  var res = SchemaSetup.ensureDatabaseSchema(ss, true);
  Logger.log(">>> Kết quả Force: " + JSON.stringify(res));

  var ui;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { ui = null; }
  if (ui && res) {
    ui.alert("⚡ Ép Buộc Chuẩn Hóa CSDL", res.message, ui.ButtonSet.OK);
  }
  return res;
}

function onOpen() {
  var ui;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { ui = null; }
  if (ui) {
    ui.createMenu('⚙️ Quản Trị CSDL CreditCores')
      .addItem('⚡ Tự Động Kiểm Tra & Nâng Cấp CSDL (Self-Healing)', 'runSetupDirectly')
      .addItem('🔄 Ép Buộc Chuẩn Hóa 20 Bảng CSDL (Force Standardize)', 'runForceStandardize')
      .addToUi();
  }
}
