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
   * Bảng ánh xạ bí danh (Aliases) chuẩn hóa cho các trường dữ liệu tín dụng
   */
  _ALIASES: {
    "duno": ["duno", "sodu", "dunothucte", "conno", "du_no", "so_du", "tongduno", "duno_hientai", "tongdunohientai"],
    "tienvay": ["tienvay", "sotienvay", "sotiengiaingan", "sotiengn", "sotienchovay", "doanhsovay", "tien_vay", "so_tien_gn", "tongtienvay"],
    "sohdtd": ["sohdtd", "sohd", "makheuoc", "sohopdong", "so_hdtd", "so_khe_uoc"],
    "makh": ["makh", "makhachhang", "ma_kh", "ma_khach_hang"],
    "hoten": ["hoten", "tenkh", "tenkhachhang", "ho_ten", "ten_khach_hang"],
    "laisuat": ["laisuat", "lai_suat", "ls"],
    "ngayvay": ["ngayvay", "ngay_vay", "ngaygiaingan", "ngay_giai_ngan"],
    "denhan": ["denhan", "ngaydenhan", "ngaydaohan", "den_han", "ngay_dao_han"],
    "trangthaihd": ["trangthaihd", "trangthai", "trang_thai_hd", "trang_thai"],
    "maloaihd": ["maloaihd", "loaihd", "ma_loai_hd", "hinhthucbaodam"],
    "kvxa": ["kvxa", "xa", "diabanxa", "tenxa", "kv_xa"],
    "kvthon": ["kvthon", "thon", "diabanthon", "tenthon", "kv_thon"],
    "diachi": ["diachi", "dia_chi", "khuvuc", "khu_vuc"]
  },

  /**
   * Chuẩn hóa chuỗi: bỏ dấu tiếng Việt, loại bỏ ký tự đặc biệt, chuyển chữ thường
   */
  _norm: function(str) {
    if (!str) return "";
    var s = String(str).toLowerCase().trim();
    s = s.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
         .replace(/[èéẹẻẽêềếệểễ]/g, "e")
         .replace(/[ìíịỉĩ]/g, "i")
         .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
         .replace(/[ùúụủũưừứựửữ]/g, "u")
         .replace(/[ỳýỵỷỹ]/g, "y")
         .replace(/đ/g, "d")
         .replace(/[^a-z0-9]/g, "");
    return s;
  },

  /**
   * Lấy Map ánh xạ { TênCột: index (0-based) } từ dòng header của Sheet
   * Đồng thời lưu trữ bảng chuẩn hóa để tìm kiếm không phân biệt dấu / khoảng trắng
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
   * @param {number} headerRowIdx Dòng chứa header (1-based, mặc định là 1)
   * @return {Object} { [colName]: colIndex, _normMap: { [normKey]: colIndex } }
   */
  getHeaderMap: function(sheet, headerRowIdx) {
    if (!sheet) return {};
    var lastCol = sheet.getLastColumn();
    if (lastCol < 1) return {};
    var row = headerRowIdx || 1;
    var headers = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
    var map = {};
    var normMap = {};

    for (var i = 0; i < headers.length; i++) {
      var h = String(headers[i] || "").trim();
      if (h) {
        map[h] = i;
        var nKey = HeaderUtils._norm(h);
        if (nKey && normMap[nKey] === undefined) {
          normMap[nKey] = i;
        }
      }
    }
    map["_normMap"] = normMap;
    return map;
  },

  /**
   * Lấy giá trị ô an toàn từ mảng row dựa theo Tên Cột (Hỗ trợ Exact Match + Normalized Match + Aliases)
   * Đảm bảo Dư Nợ (DuNo) và Tiền Vay (TienVay) luôn được phân định độc lập tuyệt đối.
   * @param {Array} row Mảng dữ liệu của một hàng
   * @param {Object} headerMap Map { TênCột: index }
   * @param {string} colName Tên cột cần lấy
   * @param {*} defaultVal Giá trị mặc định nếu ô rỗng hoặc không tồn tại
   * @return {*}
   */
  getCell: function(row, headerMap, colName, defaultVal) {
    if (!row || !headerMap) return defaultVal !== undefined ? defaultVal : "";

    // 1. So khớp trực tiếp (Exact match)
    var idx = headerMap[colName];

    // 2. So khớp qua chuỗi chuẩn hóa (Bỏ dấu tiếng Việt, chữ thường, không khoảng trắng)
    if (idx === undefined && headerMap["_normMap"]) {
      var normTarget = HeaderUtils._norm(colName);
      idx = headerMap["_normMap"][normTarget];

      // 3. So khớp qua danh mục Aliases nếu vẫn chưa tìm thấy
      if (idx === undefined && HeaderUtils._ALIASES[normTarget]) {
        var aliasList = HeaderUtils._ALIASES[normTarget];
        for (var a = 0; a < aliasList.length; a++) {
          var aIdx = headerMap["_normMap"][aliasList[a]];
          if (aIdx !== undefined) {
            idx = aIdx;
            break;
          }
        }
      }
    }

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
