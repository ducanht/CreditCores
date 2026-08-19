/**
 * ========================================================================================
 * TIỆN ÍCH TÍNH LÃI TÍN DỤNG THEO NGÀY THỰC TẾ (ACTUAL-DAY INTEREST UTILITIES)
 * Chuẩn Thông tư 14/2017/TT-NHNN:
 * - Nguyên tắc: "Tính ngày đầu, bỏ ngày cuối" (Số ngày = Ngày cuối - Ngày đầu)
 * - Cơ sở năm tài chính: 365 ngày
 * - Công thức: Tiền lãi = (Dư nợ * Lãi suất %/năm * Số ngày thực tế) / (365 * 100)
 * ========================================================================================
 */

/**
 * Chuyển đổi chuỗi ngày bất kỳ (dd/MM/yyyy, yyyy-MM-dd, Date, ISO) thành Date object chuẩn (00:00:00 UTC/Local)
 * @param {Date|string|number} input
 * @returns {Date|null}
 */
export function parseDateSafe(input) {
  if (!input) return null;
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return null;
    return new Date(input.getFullYear(), input.getMonth(), input.getDate());
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed || trimmed === '---') return null;

    // Định dạng dd/MM/yyyy hoặc d/M/yyyy
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('/');
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }

    // Định dạng yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parts = trimmed.substring(0, 10).split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
  }

  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  } catch {
    return null;
  }
}

/**
 * Tính số ngày thực tế giữa 2 mốc thời gian theo nguyên tắc "tính ngày đầu, bỏ ngày cuối"
 * @param {Date|string} startDate Ngày bắt đầu tính lãi
 * @param {Date|string} endDate Ngày kết thúc tính lãi (ngày đến hạn/trích nợ)
 * @returns {number} Số ngày thực tế (ít nhất là 0)
 */
export function calculateActualDays(startDate, endDate) {
  const dStart = parseDateSafe(startDate);
  const dEnd = parseDateSafe(endDate);

  if (!dStart || !dEnd) return 0;

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffTime = dEnd.getTime() - dStart.getTime();
  const days = Math.round(diffTime / msPerDay);

  return Math.max(0, days);
}

/**
 * Lấy mốc ngày bắt đầu và kết thúc của một kỳ trích nợ chuẩn
 * - Kỳ 1: Ngày 05 (tính từ ngày 05 tháng trước đến ngày 05 tháng này)
 * - Kỳ 2: Ngày 15 (tính từ ngày 15 tháng trước đến ngày 15 tháng này)
 * - Kỳ 3: Ngày 25 (tính từ ngày 25 tháng trước đến ngày 25 tháng này)
 * 
 * @param {string} thangNamStr Chuỗi yyyyMM (ví dụ "202608")
 * @param {number} kyTrich Kỳ 1, 2, hoặc 3
 * @returns {{ fromDate: Date, toDate: Date, fromDateStr: string, toDateStr: string, standardDays: number }}
 */
export function getDebitCyclePeriod(thangNamStr, kyTrich) {
  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1; // 1 - 12

  if (thangNamStr && typeof thangNamStr === 'string' && thangNamStr.length >= 6) {
    year = parseInt(thangNamStr.substring(0, 4), 10);
    month = parseInt(thangNamStr.substring(4, 6), 10);
  }

  const ky = Number(kyTrich) || 1;
  const dayOfMonth = ky === 1 ? 5 : (ky === 2 ? 15 : 25);

  // Ngày kết thúc kỳ này (To Date)
  const toDate = new Date(year, month - 1, dayOfMonth);

  // Ngày bắt đầu từ kỳ trước (From Date)
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }
  const fromDate = new Date(prevYear, prevMonth - 1, dayOfMonth);

  const standardDays = calculateActualDays(fromDate, toDate);

  const pad = (n) => String(n).padStart(2, '0');
  const formatVN = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

  return {
    fromDate,
    toDate,
    fromDateStr: formatVN(fromDate),
    toDateStr: formatVN(toDate),
    standardDays
  };
}

/**
 * Tính số tiền lãi chi tiết cho một Hợp đồng / Khế ước nhận nợ
 * 
 * @param {object} contract Hợp đồng tín dụng (chứa duNo, laiSuat, traLaiDenNgay, ngayVay)
 * @param {Date|string} cycleToDate Ngày chốt kỳ tính lãi (toDate của kỳ trích nợ)
 * @param {Date|string} cycleFromDate Ngày bắt đầu mặc định của kỳ
 * @returns {object} Chi tiết tính lãi
 */
export function calculateContractActualInterest(contract, cycleToDate, cycleFromDate) {
  const duNo = Number(contract.duNo || contract.soTien || 0);
  const laiSuat = Number(contract.laiSuat || 9.5); // %/năm

  const toDate = parseDateSafe(cycleToDate) || new Date();
  const defaultFromDate = parseDateSafe(cycleFromDate) || new Date(toDate.getFullYear(), toDate.getMonth() - 1, toDate.getDate());

  // Xác định ngày bắt đầu tính lãi thực tế:
  // 1. Ưu tiên traLaiDenNgay (nếu đã có mốc trả lãi trước)
  // 2. Nếu không, kiểm tra ngayVay (nếu giải ngân sau defaultFromDate)
  // 3. Mặc định là defaultFromDate
  let effectiveFromDate = defaultFromDate;

  if (contract.traLaiDenNgay) {
    const dPaid = parseDateSafe(contract.traLaiDenNgay);
    if (dPaid && dPaid.getTime() < toDate.getTime()) {
      effectiveFromDate = dPaid;
    }
  } else if (contract.ngayVay) {
    const dLoan = parseDateSafe(contract.ngayVay);
    if (dLoan && dLoan.getTime() > defaultFromDate.getTime() && dLoan.getTime() < toDate.getTime()) {
      effectiveFromDate = dLoan;
    }
  }

  const actualDays = calculateActualDays(effectiveFromDate, toDate);

  // Công thức: (Dư nợ * Lãi suất * Số ngày thực tế) / 36500
  const interestAmount = Math.round((duNo * laiSuat * actualDays) / 36500);

  const pad = (n) => String(n).padStart(2, '0');
  const formatVN = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

  return {
    soHDTD: contract.soHDTD || 'HD-TIN-DUNG',
    duNo,
    laiSuat,
    tuNgayStr: formatVN(effectiveFromDate),
    denNgayStr: formatVN(toDate),
    actualDays,
    interestAmount,
    formula: `${duNo.toLocaleString('vi-VN')} đ × ${laiSuat}% × ${actualDays} ngày / 365`
  };
}

/**
 * Tính tổng tiền lãi cho tất cả hợp đồng của một khách hàng trong kỳ trích nợ
 * 
 * @param {Array} custContracts Danh sách hợp đồng của khách hàng
 * @param {string} thangNamStr Chuỗi yyyyMM
 * @param {number} kyTrich Kỳ 1, 2, 3
 * @returns {{ totalInterest: number, contractsDetail: Array, totalDays: number }}
 */
export function calculateCustomerBatchInterest(custContracts, thangNamStr, kyTrich) {
  if (!custContracts || custContracts.length === 0) {
    return {
      totalInterest: 0,
      contractsDetail: [],
      totalDays: 0
    };
  }

  const cycle = getDebitCyclePeriod(thangNamStr, kyTrich);
  let totalInterest = 0;
  const contractsDetail = [];

  for (const c of custContracts) {
    if ((c.duNo || 0) <= 0 && (c.soTien || 0) <= 0) continue;

    const calc = calculateContractActualInterest(c, cycle.toDate, cycle.fromDate);
    totalInterest += calc.interestAmount;
    contractsDetail.push(calc);
  }

  return {
    totalInterest,
    contractsDetail,
    totalDays: cycle.standardDays,
    cyclePeriodStr: `${cycle.fromDateStr} - ${cycle.toDateStr}`
  };
}
