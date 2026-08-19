import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateActualDays,
  getDebitCyclePeriod,
  calculateContractActualInterest,
  calculateCustomerBatchInterest,
  parseDateSafe
} from './interestUtils.js';

describe('CreditCores Actual-Day Interest Calculation (TT 14/2017/TT-NHNN)', () => {
  it('should accurately calculate actual days: include start date, exclude end date', () => {
    // 15/07/2026 -> 15/08/2026 (Tháng 7 có 31 ngày -> 31 ngày)
    const daysJulyAugust = calculateActualDays('15/07/2026', '15/08/2026');
    assert.strictEqual(daysJulyAugust, 31);

    // 20/07/2026 -> 05/08/2026 (11 ngày tháng 7 + 5 ngày tháng 8 = 16 ngày)
    const daysMidMonth = calculateActualDays('20/07/2026', '05/08/2026');
    assert.strictEqual(daysMidMonth, 16);

    // 15/02/2026 -> 15/03/2026 (Năm 2026 không nhuận, tháng 2 có 28 ngày -> 28 ngày)
    const daysFebNonLeap = calculateActualDays('15/02/2026', '15/03/2026');
    assert.strictEqual(daysFebNonLeap, 28);

    // 15/02/2024 -> 15/03/2024 (Năm 2024 nhuận, tháng 2 có 29 ngày -> 29 ngày)
    const daysFebLeap = calculateActualDays('15/02/2024', '15/03/2024');
    assert.strictEqual(daysFebLeap, 29);
  });

  it('should generate correct cycle period for Ky 1, Ky 2, Ky 3', () => {
    const k1 = getDebitCyclePeriod('202608', 1); // 05/07/2026 -> 05/08/2026
    assert.strictEqual(k1.fromDateStr, '05/07/2026');
    assert.strictEqual(k1.toDateStr, '05/08/2026');
    assert.strictEqual(k1.standardDays, 31);

    const k2 = getDebitCyclePeriod('202608', 2); // 15/07/2026 -> 15/08/2026
    assert.strictEqual(k2.fromDateStr, '15/07/2026');
    assert.strictEqual(k2.toDateStr, '15/08/2026');
    assert.strictEqual(k2.standardDays, 31);

    const k3 = getDebitCyclePeriod('202608', 3); // 25/07/2026 -> 25/08/2026
    assert.strictEqual(k3.fromDateStr, '25/07/2026');
    assert.strictEqual(k3.toDateStr, '25/08/2026');
    assert.strictEqual(k3.standardDays, 31);
  });

  it('should calculate contract interest correctly with 365-day base', () => {
    const contract = {
      soHDTD: 'KU-2025-0982',
      duNo: 250000000,
      laiSuat: 9.5,
      traLaiDenNgay: '15/07/2026'
    };

    const res = calculateContractActualInterest(contract, '15/08/2026', '15/07/2026');
    assert.strictEqual(res.actualDays, 31);
    // (250,000,000 * 9.5 * 31) / 36500 = 2,017,123.287... -> Math.round = 2017123
    assert.strictEqual(res.interestAmount, 2017123);
  });

  it('should handle customer with multiple loan contracts', () => {
    const contracts = [
      {
        soHDTD: 'KU-2025-0982',
        duNo: 250000000,
        laiSuat: 9.5,
        traLaiDenNgay: '15/07/2026'
      },
      {
        soHDTD: 'KU-2026-0145',
        duNo: 200000000,
        laiSuat: 10.2,
        traLaiDenNgay: '10/07/2026'
      }
    ];

    const result = calculateCustomerBatchInterest(contracts, '202608', 2);
    assert.strictEqual(result.contractsDetail.length, 2);
    assert.ok(result.totalInterest > 0);
  });
});
