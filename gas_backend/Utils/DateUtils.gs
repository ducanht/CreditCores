/**
 * ========================================================================================
 * CREDITCORES - DATEUTILS
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module DateUtils xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

function formatGasDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, "GMT+7", "dd/MM/yyyy");
  }
  if (typeof val === 'number') {
    var d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, "GMT+7", "dd/MM/yyyy");
  }
  var str = String(val).trim();
  if (!str) return '';
  if (!isNaN(Number(str)) && Number(str) > 30000 && Number(str) < 60000) {
    var d = new Date(Math.round((Number(str) - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, "GMT+7", "dd/MM/yyyy");
  }
  if (str.indexOf('T') > -1 || str.indexOf('-') > -1) {
    var d = new Date(str);
    if (!isNaN(d.getTime())) {
      return Utilities.formatDate(d, "GMT+7", "dd/MM/yyyy");
    }
  }
  return str;
}

function formatGasDateTime(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, "GMT+7", "dd/MM/yyyy HH:mm:ss");
  }
  if (typeof val === 'number') {
    var d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, "GMT+7", "dd/MM/yyyy HH:mm:ss");
  }
  var str = String(val).trim();
  if (!str) return '';
  if (!isNaN(Number(str)) && Number(str) > 30000 && Number(str) < 60000) {
    var d = new Date(Math.round((Number(str) - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, "GMT+7", "dd/MM/yyyy HH:mm:ss");
  }
  if (str.indexOf('T') > -1 || str.indexOf('-') > -1) {
    var d = new Date(str);
    if (!isNaN(d.getTime())) {
      return Utilities.formatDate(d, "GMT+7", "dd/MM/yyyy HH:mm:ss");
    }
  }
  return str;
}

function parseGasDateToSheet(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  var str = String(val).trim();
  if (!str) return null;
  if (str.indexOf('/') > -1) {
    var parts = str.split('/');
    if (parts.length === 3) {
      var d = parseInt(parts[0], 10);
      var m = parseInt(parts[1], 10) - 1;
      var y = parseInt(parts[2], 10);
      var dt = new Date(y, m, d);
      if (!isNaN(dt.getTime())) return dt;
    }
  }
  var parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
}

/**
 * Tính số ngày thực tế giữa 2 ngày theo nguyên tắc "Tính ngày đầu, bỏ ngày cuối"
 */
function calculateGasActualDays(startDate, endDate) {
  var dStart = parseGasDateToSheet(startDate);
  var dEnd = parseGasDateToSheet(endDate);
  if (!dStart || !dEnd) return 0;

  var msPerDay = 1000 * 60 * 60 * 24;
  var diff = dEnd.getTime() - dStart.getTime();
  var days = Math.round(diff / msPerDay);
  return Math.max(0, days);
}

/**
 * Tính tiền lãi theo số ngày thực tế: (Dư nợ * Lãi suất %/năm * Số ngày) / 36500
 */
function calculateGasInterest(duNo, laiSuat, actualDays) {
  var d = Number(duNo) || 0;
  var r = Number(laiSuat) || 9.5;
  var days = Number(actualDays) || 0;
  return Math.round((d * r * days) / 36500);
}
