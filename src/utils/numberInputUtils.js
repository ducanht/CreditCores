/**
 * UTILITIES CHUẨN HÓA & TỰ ĐỘNG THÊM DẤU PHÂN CÁCH HÀNG NGHÌN KHI NHẬP SỐ
 */

/**
 * Định dạng chuỗi số thành dạng có phân cách hàng nghìn (vd: 300000000 -> "300.000.000")
 * @param {number|string} val
 * @param {string} separator Mặc định là dấu chấm '.' chuẩn VNĐ
 * @returns {string}
 */
export function formatThousand(val, separator = '.') {
  if (val === null || val === undefined || val === '') return '';
  const cleanStr = String(val).replace(/[^\d]/g, '');
  if (!cleanStr) return '';
  return cleanStr.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/**
 * Lấy giá trị số nguyên từ chuỗi có dấu phân cách
 * @param {string|number} formattedVal
 * @returns {number}
 */
export function parseThousand(formattedVal) {
  if (!formattedVal) return 0;
  const cleanStr = String(formattedVal).replace(/[^\d]/g, '');
  return cleanStr ? parseInt(cleanStr, 10) : 0;
}
