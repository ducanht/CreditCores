/**
 * ========================================================================================
 * CREDITCORES - HEADER UTILITIES
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Các hàm tiện ích truy xuất & ghi dữ liệu Google Sheets THEO TÊN CỘT
 *              Đảm bảo 100% không bị ảnh hưởng khi thêm, bớt hoặc thay đổi thứ tự cột.
 * ========================================================================================
 */

var HeaderUtils = {
  /**
   * Lấy Map ánh xạ { TênCột: index (0-based) } từ dòng 1 của Sheet
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
   * @return {Object} { [colName]: colIndex }
   */
  getHeaderMap: function(sheet) {
    if (!sheet) return {};
    var lastCol = sheet.getLastColumn();
    if (lastCol < 1) return {};
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var map = {};
    for (var i = 0; i < headers.length; i++) {
      var h = String(headers[i] || "").trim();
      if (h) {
        map[h] = i;
      }
    }
    return map;
  },

  /**
   * Lấy giá trị ô an toàn từ mảng row dựa theo Tên Cột
   * @param {Array} row Mảng dữ liệu của một hàng
   * @param {Object} headerMap Map { TênCột: index }
   * @param {string} colName Tên cột cần lấy
   * @param {*} defaultVal Giá trị mặc định nếu ô rỗng hoặc không tồn tại
   * @return {*}
   */
  getCell: function(row, headerMap, colName, defaultVal) {
    if (!row || !headerMap) return defaultVal !== undefined ? defaultVal : "";
    var idx = headerMap[colName];
    if (idx !== undefined && idx < row.length) {
      var val = row[idx];
      if (val !== undefined && val !== null && val !== "") {
        return val;
      }
    }
    return defaultVal !== undefined ? defaultVal : "";
  },

  /**
   * Chuyển đổi 1 mảng dòng row thành đối tượng key-value theo Tên Cột
   * @param {Array} row Mảng dữ liệu hàng
   * @param {Object} headerMap Map { TênCột: index }
   * @return {Object}
   */
  rowToDict: function(row, headerMap) {
    var dict = {};
    if (!row || !headerMap) return dict;
    for (var colName in headerMap) {
      var idx = headerMap[colName];
      dict[colName] = (idx < row.length && row[idx] !== undefined && row[idx] !== null) ? row[idx] : "";
    }
    return dict;
  },

  /**
   * Cập nhật 1 ô trên Sheet dựa theo Tên Cột
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
   * @param {number} rowIdx Vị trí dòng trên Google Sheet (1-based, ví dụ: 2, 3...)
   * @param {Object} headerMap Map { TênCột: index }
   * @param {string} colName Tên cột cần ghi
   * @param {*} value Giá trị cần ghi
   */
  setCell: function(sheet, rowIdx, headerMap, colName, value) {
    if (!sheet || !headerMap) return;
    var idx = headerMap[colName];
    if (idx !== undefined) {
      sheet.getRange(rowIdx, idx + 1).setValue(value);
    }
  },

  /**
   * Tạo mảng dữ liệu row từ dict theo đúng thứ tự mảng headers
   * @param {Object} dict Dữ liệu key-value
   * @param {Array} headers Mảng tên cột
   * @return {Array}
   */
  dictToRow: function(dict, headers) {
    var row = [];
    for (var i = 0; i < headers.length; i++) {
      var colName = headers[i];
      var val = dict[colName];
      row.push(val !== undefined && val !== null ? val : "");
    }
    return row;
  }
};
