/**
 * ========================================================================================
 * TIỆN ÍCH CHUẨN HÓA NGÀY THÁNG TIẾNG VIỆT & TIỀN TỆ (DATE & CURRENCY UTILITIES)
 * Đảm bảo 100% hiển thị chuẩn Việt Nam dd/MM/yyyy trên toàn bộ giao diện
 * và chuyển đổi chuẩn quốc tế yyyy-MM-dd khi ghi vào Google Sheets / Form Inputs
 * ========================================================================================
 */

/**
 * Định dạng bất kỳ giá trị ngày nào (Date object, ISO string, timestamp) thành chuỗi Việt Nam dd/MM/yyyy
 * @param {Date|string|number} input
 * @returns {string} Chuỗi ngày dd/MM/yyyy (ví dụ: 18/08/2026)
 */
export function formatDateVN(input) {
  if (!input) return '---';
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed || trimmed === '---') return '---';

    // Nếu đã là định dạng dd/MM/yyyy hoặc d/M/yyyy
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('/');
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${d}/${m}/${y}`;
    }

    // Nếu là định dạng yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parts = trimmed.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return String(input);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return String(input);
  }
}

/**
 * Định dạng ngày giờ đầy đủ chuẩn Việt Nam dd/MM/yyyy HH:mm:ss
 * @param {Date|string|number} input
 * @returns {string} Chuỗi dd/MM/yyyy HH:mm:ss
 */
export function formatDateTimeVN(input) {
  if (!input) return '---';
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed || trimmed === '---') return '---';
    if (/^\d{1,2}\/\d{1,2}\/\d{4}\s\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      return trimmed;
    }
  }

  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return String(input);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
  } catch (e) {
    return String(input);
  }
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
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('/');
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
  }

  try {
    const d = new Date(input);
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
 * Lấy ngày hôm nay định dạng dd/MM/yyyy
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
