/**
 * UTILITY XỬ LÝ NGÀY THÁNG VÀ ĐỊNH DẠNG GOOGLE APPS SCRIPT
 */

function formatGasDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, "GMT+7", "dd/MM/yyyy");
  }
  var str = String(val).trim();
  if (!str) return '';
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
  var str = String(val).trim();
  if (!str) return '';
  if (str.indexOf('T') > -1 || str.indexOf('-') > -1) {
    var d = new Date(str);
    if (!isNaN(d.getTime())) {
      return Utilities.formatDate(d, "GMT+7", "dd/MM/yyyy HH:mm:ss");
    }
  }
  return str;
}

function parseGasDateToSheet(val) {
  if (!val) return '';
  if (val instanceof Date) return val;
  var str = String(val).trim();
  if (!str) return '';
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
  return str;
}
