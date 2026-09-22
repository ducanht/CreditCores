/**
 * ========================================================================================
 * CREDITCORES - SYNCCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module SyncController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var SyncController = {
  handleTriggerSqlSync: function(ss) {
    var sheet = ss.getSheetByName("SETTING");
    if (!sheet) return { status: "error", message: "Không tìm thấy Sheet SETTING." };

    sheet.getRange(2, 1).setValue("SYNC_DATA");
    sheet.getRange(2, 2).setValue("PENDING");
    sheet.getRange(2, 3).setValue(new Date());
    sheet.getRange(2, 7).setValue("Yêu cầu đồng bộ từ WebApp. Đang chờ Python Daemon nhận lệnh...");

    CacheHelper.invalidateModuleCache('dashboard');
    return { status: "success", message: "Đã gửi lệnh SYNC_DATA tới Hàng đợi Lệnh Core!" };
  },

  handleTriggerAsOfExtract: function(ss, params) {
    var sheet = ss.getSheetByName("SETTING");
    if (!sheet) return { status: "error", message: "Không tìm thấy Sheet SETTING." };

    params = params || {};
    var asOfDate = params.asOfDate || formatGasDate(new Date());
    var mode = params.mode || "as_of_date";
    var paramStr = JSON.stringify(params);

    sheet.getRange(2, 1).setValue("EXTRACT_HDTD_DN");
    sheet.getRange(2, 2).setValue("PENDING");
    sheet.getRange(2, 3).setValue(new Date());
    sheet.getRange(2, 7).setValue("Yêu cầu trích xuất HDTD_CORE_DN mốc " + asOfDate + ". Đang chờ Python Daemon...");
    sheet.getRange(2, 8).setValue(paramStr);

    CacheHelper.invalidateModuleCache('dashboard');
    return { 
      status: "success", 
      message: "Đã gửi lệnh trích xuất HDTD_CORE_DN (Mốc: " + asOfDate + ") tới Hàng đợi Lệnh Core!",
      data: { command: "EXTRACT_HDTD_DN", status: "PENDING", asOfDate: asOfDate, mode: mode }
    };
  },

  handleGetSyncStatus: function(ss) {
    var sheet = ss.getSheetByName("SETTING");
    if (!sheet || sheet.getLastRow() <= 1) {
      return {
        status: "success",
        data: {
          command: "IDLE",
          status: "SUCCESS",
          message: "Hệ thống sẵn sàng."
        }
      };
    }

    var row = sheet.getRange(2, 1, 1, 8).getValues()[0];
    return {
      status: "success",
      data: {
        command: row[0],
        status: row[1],
        requestTime: formatGasDateTime(row[2]),
        startTime: formatGasDateTime(row[3]),
        finishTime: formatGasDateTime(row[4]),
        totalRows: row[5],
        message: row[6],
        params: row[7] || ""
      }
    };
  }
};
