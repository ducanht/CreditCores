/**
 * ========================================================================================
 * TIỆN ÍCH CHUẨN HÓA NGÀY THÁNG TIẾNG VIỆT & TIỀN TỆ (DATE & CURRENCY UTILITIES)
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * Đảm bảo 100% hiển thị chuẩn Việt Nam dd/MM/yyyy GMT+7 trên toàn bộ giao diện
 * Xử lý mọi nguồn dữ liệu: SQL (YYYYMMDD), Google Sheets (Excel Serial / ISO), Form Input
 * ========================================================================================
 */

const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Định dạng bất kỳ giá trị ngày nào thành chuỗi Việt Nam dd/MM/yyyy (Múi giờ GMT+7)
 * Hỗ trợ: Date object, ISO string, SQL YYYYMMDD (20260817), Excel Serial Date, timestamp
 * @param {Date|string|number} input
 * @returns {string} Chuỗi ngày dd/MM/yyyy (ví dụ: 17/08/2026)
 */
export function formatDateVN(input) {
  if (input === null || input === undefined) return '---';
  
  // Nếu là chuỗi
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed || trimmed === '---' || trimmed === 'null' || trimmed === 'undefined') return '---';

    // 1. Nếu đã là định dạng dd/MM/yyyy hoặc d/M/yyyy (chuẩn hóa số 0 ở đầu)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('/');
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${d}/${m}/${y}`;
    }

    // 2. Nếu là định dạng SQL số YYYYMMDD (ví dụ: 20260817)
    if (/^\d{8}$/.test(trimmed)) {
      const y = trimmed.slice(0, 4);
      const m = trimmed.slice(4, 6);
      const d = trimmed.slice(6, 8);
      return `${d}/${m}/${y}`;
    }

    // 3. Nếu là định dạng yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parts = trimmed.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // 4. Nếu là số Excel Serial date dưới dạng chuỗi (ví dụ: "46251")
    const numVal = Number(trimmed);
    if (!isNaN(numVal) && numVal > 30000 && numVal < 65000) {
      const excelDate = new Date(Math.round((numVal - 25569) * 86400 * 1000));
      if (!isNaN(excelDate.getTime())) {
        return formatDateUsingIntl(excelDate);
      }
    }
  }

  // Nếu là số Excel serial (ví dụ: 46251 do Google Sheets trả về)
  if (typeof input === 'number') {
    if (input > 30000 && input < 65000) {
      const excelDate = new Date(Math.round((input - 25569) * 86400 * 1000));
      if (!isNaN(excelDate.getTime())) {
        return formatDateUsingIntl(excelDate);
      }
    }
  }

  // Fallback sang parse Date tổng quát với GMT+7
  try {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return String(input);
    return formatDateUsingIntl(d);
  } catch (e) {
    return String(input);
  }
}

/**
 * Helper format date bằng Intl chuẩn GMT+7
 */
function formatDateUsingIntl(dateObj) {
  try {
    const formatter = new Intl.DateTimeFormat('vi-VN', {
      timeZone: VIETNAM_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return formatter.format(dateObj);
  } catch (e) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

/**
 * Định dạng ngày giờ đầy đủ chuẩn Việt Nam dd/MM/yyyy HH:mm:ss (Múi giờ GMT+7)
 * @param {Date|string|number} input
 * @returns {string} Chuỗi dd/MM/yyyy HH:mm:ss
 */
export function formatDateTimeVN(input) {
  if (input === null || input === undefined) return '---';
  
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed || trimmed === '---') return '---';
    if (/^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      return trimmed;
    }
  }

  try {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return String(input);

    const formatter = new Intl.DateTimeFormat('vi-VN', {
      timeZone: VIETNAM_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    return formatter.format(d).replace(',', '');
  } catch (e) {
    return String(input);
  }
}

/**
 * Phân tích chuỗi ngày Việt Nam dd/MM/yyyy thành Date object an toàn
 * Cố định giờ lúc 12:00 trưa để chống lệch ngày khi chuyển đổi qua lại múi giờ
 * @param {string} dateStr Chuỗi dd/MM/yyyy hoặc yyyy-MM-dd
 * @returns {Date|null}
 */
export function parseDateVN(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();

  // Định dạng dd/MM/yyyy
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const dt = new Date(y, m, d, 12, 0, 0);
    return isNaN(dt.getTime()) ? null : dt;
  }

  // Định dạng SQL YYYYMMDD
  if (/^\d{8}$/.test(trimmed)) {
    const y = parseInt(trimmed.slice(0, 4), 10);
    const m = parseInt(trimmed.slice(4, 6), 10) - 1;
    const d = parseInt(trimmed.slice(6, 8), 10);
    const dt = new Date(y, m, d, 12, 0, 0);
    return isNaN(dt.getTime()) ? null : dt;
  }

  // Định dạng yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parts = trimmed.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dt = new Date(y, m, d, 12, 0, 0);
    return isNaN(dt.getTime()) ? null : dt;
  }

  const dt = new Date(trimmed);
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Kiểm tra xem chuỗi có phải ngày Việt Nam hợp lệ (dd/MM/yyyy)
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidDateVN(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return false;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;

  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

/**
 * Chuyển đổi ngày bất kỳ sang chuẩn ISO yyyy-MM-dd cho input[type="date"]
 * @param {Date|string} input
 * @returns {string} yyyy-MM-dd
 */
export function toISODateString(input) {
  if (!input) return '';
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{8}$/.test(trimmed)) {
      return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('/');
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
  }

  try {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return '';
  }
}

/**
 * Lấy ngày hôm nay định dạng dd/MM/yyyy (GMT+7)
 */
export function getTodayVN() {
  return formatDateVN(new Date());
}

/**
 * Lấy ngày hôm nay định dạng yyyy-MM-dd cho input date
 */
export function getTodayISO() {
  return toISODateString(new Date());
}

/**
 * Định dạng tiền tệ Việt Nam chuẩn kế toán ngân hàng
 * @param {number} amount
 * @returns {string} vd: 1.250.000 đ
 */
export function formatCurrencyVN(amount) {
  return (Number(amount) || 0).toLocaleString('vi-VN') + ' đ';
}

export const formatCurrency = formatCurrencyVN;

