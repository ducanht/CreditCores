/**
 * CONTRACT UTILS - CREDITCORES
 * Quản lý danh mục loại hợp đồng tín dụng theo hình thức bảo đảm & đăng ký GDBĐ
 * Chuẩn hóa theo nghiệp vụ tín dụng CoreBanking NG-eFUND và quy chế QTDND Yên Thọ
 */

export const MA_LOAI_HD_MAP = {
  THCDBTNMT: {
    code: 'THCDBTNMT',
    label: 'Trung hạn có đảm bảo, đăng ký GDBĐ',
    shortLabel: 'TH Có ĐB (GDBĐ)',
    term: 'Trung hạn',
    hasCollateral: true,
    isRegisteredGDBD: true,
    badgeClass: 'bg-primary-subtle text-primary border border-primary-subtle'
  },
  THBLCDBTNMT: {
    code: 'THBLCDBTNMT',
    label: 'Trung hạn đăng ký GDBĐ uỷ quyền',
    shortLabel: 'TH Uỷ Quyền GDBĐ',
    term: 'Trung hạn',
    hasCollateral: true,
    isRegisteredGDBD: true,
    badgeClass: 'bg-info-subtle text-info border border-info-subtle'
  },
  NHCDBTNMT: {
    code: 'NHCDBTNMT',
    label: 'Ngắn hạn có đảm bảo, đăng ký GDBĐ',
    shortLabel: 'NH Có ĐB (GDBĐ)',
    term: 'Ngắn hạn',
    hasCollateral: true,
    isRegisteredGDBD: true,
    badgeClass: 'bg-success-subtle text-success border border-success-subtle'
  },
  THCDB: {
    code: 'THCDB',
    label: 'Trung hạn có TSBĐ không đăng ký GDBĐ',
    shortLabel: 'TH Có TSBĐ (K.GDBĐ)',
    term: 'Trung hạn',
    hasCollateral: true,
    isRegisteredGDBD: false,
    badgeClass: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
  },
  NHCDB: {
    code: 'NHCDB',
    label: 'Ngắn hạn có TSBĐ không đăng ký GDBĐ',
    shortLabel: 'NH Có TSBĐ (K.GDBĐ)',
    term: 'Ngắn hạn',
    hasCollateral: true,
    isRegisteredGDBD: false,
    badgeClass: 'bg-warning-subtle text-warning border border-warning-subtle'
  },
  NHKDB: {
    code: 'NHKDB',
    label: 'Ngắn hạn tín chấp',
    shortLabel: 'NH Tín Chấp',
    term: 'Ngắn hạn',
    hasCollateral: false,
    isRegisteredGDBD: false,
    badgeClass: 'bg-secondary-subtle text-secondary border'
  },
  THKDB: {
    code: 'THKDB',
    label: 'Trung hạn tín chấp',
    shortLabel: 'TH Tín Chấp',
    term: 'Trung hạn',
    hasCollateral: false,
    isRegisteredGDBD: false,
    badgeClass: 'bg-secondary-subtle text-dark border'
  }
};

/**
 * Lấy thông tin chi tiết loại hợp đồng
 * @param {string} code Mã loại hợp đồng (ví dụ: NHCDBTNMT)
 * @returns {object} Thông tin chi tiết loại hợp đồng
 */
export function getLoaiHDInfo(code) {
  if (!code) {
    return {
      code: 'UNKNOWN',
      label: 'Chưa phân loại',
      shortLabel: 'Chưa phân loại',
      term: 'Không xác định',
      hasCollateral: false,
      isRegisteredGDBD: false,
      badgeClass: 'bg-light text-muted border'
    };
  }

  const cleanCode = String(code).trim().toUpperCase();
  if (MA_LOAI_HD_MAP[cleanCode]) {
    return MA_LOAI_HD_MAP[cleanCode];
  }

  // Dự đoán mềm nếu mã lạ
  const isTH = cleanCode.startsWith('TH');
  const hasDB = cleanCode.includes('CDB');
  const hasTNMT = cleanCode.includes('TNMT') || cleanCode.includes('GDBD');

  return {
    code: cleanCode,
    label: `${isTH ? 'Trung hạn' : 'Ngắn hạn'} ${hasDB ? 'có TSBĐ' : 'tín chấp'}${hasTNMT ? ' (GDBĐ)' : ''}`,
    shortLabel: cleanCode,
    term: isTH ? 'Trung hạn' : 'Ngắn hạn',
    hasCollateral: hasDB,
    isRegisteredGDBD: hasTNMT,
    badgeClass: hasDB ? 'bg-primary-subtle text-primary border' : 'bg-secondary-subtle text-secondary border'
  };
}
