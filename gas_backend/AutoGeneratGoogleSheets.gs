/**
 * ========================================================================================
 * HỆ THỐNG QUẢN LÝ TÍN DỤNG & TRÍCH NỢ AUTOMATION (CREDITCORES)
 * SCRIPT TỰ ĐỘNG KHỞI TẠO & ĐỒNG BỘ 12 BẢNG CSDL GOOGLE SHEETS
 * ========================================================================================
 */

var DB_SPREADSHEET_ID = typeof DB_SPREADSHEET_ID !== 'undefined' ? DB_SPREADSHEET_ID : "1xZtr6fQJDHwKugIqebV9po00cNSpqh5IvcvbEEVb5Fw";

function runSetupDirectly() {
  Logger.log(">>> Bắt đầu rà soát và khởi tạo 12 sheets CSDL...");
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

  var res = SchemaSetup.ensureDatabaseSchema(ss);
  Logger.log(">>> Kết quả: " + JSON.stringify(res));
  return res;
}

function onOpen() {
  var ui;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { ui = null; }
  if (ui) {
    ui.createMenu('⚙️ Quản Trị CSDL CreditCores')
      .addItem('Khởi tạo / Tự động Nâng cấp 12 Bảng CSDL', 'runSetupDirectly')
      .addToUi();
  }
}
