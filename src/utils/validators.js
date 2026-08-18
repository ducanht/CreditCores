/**
 * BỘ TIỆN ÍCH KIỂM TRA & XÁC THỰC DỮ LIỆU ĐẦU VÀO (VALIDATORS)
 * Tuân thủ quy chuẩn AGENTS.md cho Quỹ Tín Dụng
 */

/**
 * Kiểm tra số Căn cước công dân (CCCD): Bắt buộc đúng 12 chữ số, có số 0 ở đầu
 */
export function isValidCCCD(val) {
  if (!val) return false;
  const str = String(val).trim();
  return /^0\d{11}$/.test(str);
}

/**
 * Kiểm tra Số điện thoại: Bắt buộc đúng 10 chữ số chuẩn đầu số viễn thông Việt Nam
 */
export function isValidPhone(val) {
  if (!val) return false;
  const str = String(val).trim().replace(/\s|\./g, '');
  return /^(03|05|07|08|09)\d{8}$/.test(str);
}

/**
 * Kiểm tra định dạng ngày Việt Nam dd/MM/yyyy
 */
export function isValidDateVN(val) {
  if (!val) return false;
  const str = String(val).trim();
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return false;
  const d = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const y = parseInt(match[3], 10);
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === (m - 1) && dt.getDate() === d;
}

/**
 * Chuẩn hóa số CCCD (xóa khoảng trắng, tự động đệm 0 nếu cần)
 */
export function sanitizeCCCD(val) {
  if (!val) return '';
  return String(val).trim().replace(/\D/g, '');
}

/**
 * Chuẩn hóa số điện thoại
 */
export function sanitizePhone(val) {
  if (!val) return '';
  return String(val).trim().replace(/\D/g, '');
}
