import React, { useState, useEffect } from 'react';
import {
  Zap,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  ArrowLeft,
  Search,
  Calendar,
  Info,
  Layers,
  HelpCircle
} from 'lucide-react';
import ThousandInput from '../ThousandInput';
import { formatCurrencyVN } from '../../utils/dateUtils';
import { calculateCustomerBatchInterest, getDebitCyclePeriod } from '../../utils/interestUtils';

export default function DebitBatchCreateModal({
  show,
  onClose,
  onSubmit,
  registrations = [],
  contracts = [],
  debtWarnings = []
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    thangNam: new Date().toISOString().slice(0, 7).replace('-', ''),
    kyTrich: 1
  });

  const [eligibleList, setEligibleList] = useState([]);
  const [selectedKHMaps, setSelectedKHMaps] = useState({});
  const [adjustedAmounts, setAdjustedAmounts] = useState({});
  const [selectAll, setSelectAll] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedKH, setExpandedKH] = useState(null);
  const [cycleInfo, setCycleInfo] = useState(null);

  if (!show) return null;

  const handleNextToStep2 = (e) => {
    e.preventDefault();
    const ky = Number(formData.kyTrich);
    const cycle = getDebitCyclePeriod(formData.thangNam, ky);
    setCycleInfo(cycle);

    const activeRegs = registrations.filter(
      (r) => Number(r.kyTrich) === ky && (r.trangThai === 'Hiệu lực' || r.trangThai === 'Hieu luc')
    );

    const list = activeRegs.map((reg) => {
      const custContracts = contracts.filter((c) => c.maKH === reg.maKH);
      const tongDuNo = custContracts.reduce((sum, c) => sum + (c.duNo || c.soTien || 0), 0);

      // Tính lãi chi tiết theo ngày thực tế (tính ngày đầu, bỏ ngày cuối / 365)
      const interestCalc = calculateCustomerBatchInterest(custContracts, formData.thangNam, ky);
      const laiPhatSinh = interestCalc.totalInterest;

      const custWarnings = debtWarnings.filter((w) => w.maKH === reg.maKH);
      const noTon = custWarnings.reduce((sum, w) => sum + (w.tongNoTon || 0), 0);
      const gocDenHan = 0;
      const tongDuKien = laiPhatSinh + gocDenHan + noTon;

      return {
        maKH: reg.maKH,
        hoTen: reg.hoTen,
        gttt: reg.gttt,
        soTK: reg.soTK,
        soHDTD: custContracts.map((c) => c.soHDTD).join(', ') || 'HD-TIN-DUNG',
        tongDuNo,
        laiPhatSinh,
        gocDenHan,
        noTon,
        tongDuKien,
        soNgayTinhLai: interestCalc.totalDays,
        cyclePeriodStr: interestCalc.cyclePeriodStr,
        contractsDetail: interestCalc.contractsDetail
      };
    });

    setEligibleList(list);

    const initialSelected = {};
    const initialAmounts = {};
    list.forEach((item) => {
      initialSelected[item.maKH] = true;
      initialAmounts[item.maKH] = item.tongDuKien;
    });

    setSelectedKHMaps(initialSelected);
    setAdjustedAmounts(initialAmounts);
    setSelectAll(true);
    setSearchTerm('');
    setStep(2);
  };

  const handleToggleSelectAll = (checked) => {
    setSelectAll(checked);
    const updated = {};
    eligibleList.forEach((item) => {
      updated[item.maKH] = checked;
    });
    setSelectedKHMaps(updated);
  };

  const handleToggleSingle = (maKH, checked) => {
    const updated = { ...selectedKHMaps, [maKH]: checked };
    setSelectedKHMaps(updated);
    const allChecked = eligibleList.every((item) => updated[item.maKH]);
    setSelectAll(allChecked);
  };

  const handleAmountChange = (maKH, newAmount) => {
    setAdjustedAmounts((prev) => ({
      ...prev,
      [maKH]: Number(newAmount) || 0
    }));
  };

  // Filtered list for Search
  const filteredList = eligibleList.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.hoTen.toLowerCase().includes(term) ||
      item.maKH.toLowerCase().includes(term) ||
      (item.gttt && item.gttt.includes(term)) ||
      (item.soTK && item.soTK.includes(term)) ||
      item.soHDTD.toLowerCase().includes(term)
    );
  });

  const selectedCount = eligibleList.filter((item) => selectedKHMaps[item.maKH]).length;
  const totalSelectedAmount = eligibleList.reduce((sum, item) => {
    if (selectedKHMaps[item.maKH]) {
      return sum + (adjustedAmounts[item.maKH] !== undefined ? adjustedAmounts[item.maKH] : item.tongDuKien);
    }
    return sum;
  }, 0);

  const handleFinalSubmit = () => {
    const finalItems = eligibleList
      .filter((item) => selectedKHMaps[item.maKH])
      .map((item) => ({
        ...item,
        soTienTrich: adjustedAmounts[item.maKH] !== undefined ? adjustedAmounts[item.maKH] : item.tongDuKien
      }));

    if (finalItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 khách hàng để khởi tạo đợt trích nợ.');
      return;
    }

    onSubmit({
      thangNam: formData.thangNam,
      kyTrich: formData.kyTrich,
      chiTietDanhSach: finalItems,
      totalPhaiThu: totalSelectedAmount,
      cyclePeriod: cycleInfo
    });
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className={`modal-dialog ${step === 2 ? 'modal-xl' : 'modal-md'} modal-dialog-centered modal-dialog-scrollable`}>
        <div className="modal-content card-modern p-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold text-dark font-heading d-flex align-items-center gap-2">
              <Zap size={20} className="text-warning" />
              {step === 1 ? 'Bước 1: Chọn Kỳ & Tháng Trích Nợ' : 'Bước 2: Duyệt & Điều Chỉnh Số Tiền Trích Nợ (Tính Lãi Theo Ngày Thực Tế)'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          {step === 1 ? (
            <form onSubmit={handleNextToStep2}>
              <div className="modal-body py-3">
                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">Tháng / Năm Thu Nợ (yyyyMM)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace fw-bold"
                    placeholder="202608"
                    value={formData.thangNam}
                    onChange={(e) => setFormData({ ...formData, thangNam: e.target.value })}
                    required
                  />
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Ví dụ: 202608 cho Tháng 08/2026
                  </span>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">Kỳ Trích Nợ Định Kỳ</label>
                  <select
                    className="form-select form-select-sm fw-bold"
                    value={formData.kyTrich}
                    onChange={(e) => setFormData({ ...formData, kyTrich: Number(e.target.value) })}
                  >
                    <option value={1}>Kỳ 1 (Ngày 05 hàng tháng - Tính từ 05 tháng trước)</option>
                    <option value={2}>Kỳ 2 (Ngày 15 hàng tháng - Tính từ 15 tháng trước)</option>
                    <option value={3}>Kỳ 3 (Ngày 25 hàng tháng - Tính từ 25 tháng trước)</option>
                  </select>
                </div>

                <div className="p-3 bg-light rounded-3 border small text-slate-700">
                  <div className="fw-bold text-primary mb-1 d-flex align-items-center gap-1">
                    <Info size={16} /> Quy Tắc Tính Lãi Chuẩn TT14/2017/TT-NHNN:
                  </div>
                  <ul className="m-0 ps-3">
                    <li><strong>Tính ngày đầu, bỏ ngày cuối:</strong> Số ngày = Ngày chốt kỳ - Ngày tính lãi trước.</li>
                    <li><strong>Cơ sở tính lãi:</strong> Năm tài chính 365 ngày (Lãi = Dư nợ × Lãi suất% × Số ngày / 365).</li>
                    <li>Tự động cộng dồn <strong>Lãi phát sinh + Gốc đến hạn + Nợ tồn kỳ trước</strong>.</li>
                  </ul>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-light" onClick={onClose}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-brand fw-bold d-flex align-items-center gap-1">
                  Tiếp Tục: Lọc & Duyệt Danh Sách <ChevronRight size={16} />
                </button>
              </div>
            </form>
          ) : (
            <div className="modal-body py-3">
              {/* Header summary & Search bar */}
              <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded-3 border flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="badge bg-primary">
                    Kỳ {formData.kyTrich} • Tháng {formData.thangNam}
                  </span>
                  {cycleInfo && (
                    <span className="badge bg-info text-dark d-flex align-items-center gap-1">
                      <Calendar size={12} /> Chu kỳ: {cycleInfo.fromDateStr} → {cycleInfo.toDateStr} ({cycleInfo.standardDays} ngày)
                    </span>
                  )}
                  <span className="text-dark small fw-semibold">
                    Đã chọn: <strong className="text-primary">{selectedCount}</strong> / {eligibleList.length} khách hàng
                  </span>
                </div>
                <div className="fs-6 fw-bold text-dark">
                  Tổng Tiền Trích: <span className="text-danger num-tabular">{formatCurrencyVN(totalSelectedAmount)}</span>
                </div>
              </div>

              {/* Quick Search inside Table */}
              <div className="mb-3 position-relative">
                <Search size={16} className="position-absolute text-muted" style={{ top: 10, left: 12 }} />
                <input
                  type="text"
                  className="form-control form-control-sm ps-5"
                  placeholder="Tìm nhanh theo Tên khách hàng, Số CCCD, Mã KH hoặc Số TK CASA..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="table-responsive border rounded-3 bg-white mb-3" style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table className="table table-custom align-middle m-0 small">
                  <thead className="bg-light sticky-top" style={{ zIndex: 2 }}>
                    <tr>
                      <th style={{ width: 40 }} className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectAll}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          title="Chọn tất cả / Bỏ chọn tất cả"
                        />
                      </th>
                      <th>Khách Hàng</th>
                      <th>Số TK CASA</th>
                      <th>Khế Ước / HĐTD</th>
                      <th className="text-end">Dư Nợ Gốc</th>
                      <th className="text-center" title="Số ngày thực tế tính lãi (tính ngày đầu, bỏ ngày cuối)">Số Ngày</th>
                      <th className="text-end">Lãi Phát Sinh (Ngày TT)</th>
                      <th className="text-end">Nợ Tồn</th>
                      <th className="text-end" style={{ minWidth: 160 }}>
                        Số Tiền Trích Thực Tế (VNĐ)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.length > 0 ? (
                      filteredList.map((item) => {
                        const isChecked = Boolean(selectedKHMaps[item.maKH]);
                        const currentAmount = adjustedAmounts[item.maKH] !== undefined ? adjustedAmounts[item.maKH] : item.tongDuKien;
                        const isExpanded = expandedKH === item.maKH;

                        return (
                          <React.Fragment key={item.maKH}>
                            <tr className={isChecked ? '' : 'table-light text-muted'}>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isChecked}
                                  onChange={(e) => handleToggleSingle(item.maKH, e.target.checked)}
                                />
                              </td>
                              <td>
                                <div className="fw-bold text-dark">{item.hoTen}</div>
                                <div className="d-flex align-items-center gap-1">
                                  <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '0.68rem' }}>
                                    {item.maKH}
                                  </span>
                                  {item.contractsDetail && item.contractsDetail.length > 1 && (
                                    <button
                                      type="button"
                                      className="btn btn-link p-0 text-primary small"
                                      style={{ fontSize: '0.7rem' }}
                                      onClick={() => setExpandedKH(isExpanded ? null : item.maKH)}
                                    >
                                      {isExpanded ? 'Ẩn HĐ' : `(${item.contractsDetail.length} HĐ)`}
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="font-monospace fw-semibold text-success">{item.soTK}</td>
                              <td className="font-monospace text-primary">{item.soHDTD}</td>
                              <td className="text-end num-tabular fw-semibold">{formatCurrencyVN(item.tongDuNo)}</td>
                              <td className="text-center">
                                <span className="badge bg-secondary-subtle text-dark border font-monospace">
                                  {item.soNgayTinhLai} ngày
                                </span>
                              </td>
                              <td className="text-end text-danger num-tabular fw-bold">
                                {formatCurrencyVN(item.laiPhatSinh)}
                              </td>
                              <td className="text-end text-warning num-tabular">{formatCurrencyVN(item.noTon)}</td>
                              <td className="text-end">
                                <div style={{ maxWidth: 150 }} className="ms-auto">
                                  <ThousandInput
                                    value={currentAmount}
                                    onChange={(val) => handleAmountChange(item.maKH, val)}
                                    disabled={!isChecked}
                                    placeholder="0"
                                    className="form-control form-control-sm text-end fw-bold text-danger"
                                  />
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Detail per Contract if Multiple Loans */}
                            {isExpanded && item.contractsDetail && (
                              <tr className="table-light">
                                <td colSpan="9" className="p-2 ps-5">
                                  <div className="bg-white p-2 rounded border small">
                                    <div className="fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                                      <Layers size={14} /> Chi tiết tính lãi từng khế ước (Công thức: Dư nợ × Lãi suất × Ngày / 365):
                                    </div>
                                    {item.contractsDetail.map((cd, idx) => (
                                      <div key={idx} className="d-flex justify-content-between py-1 border-bottom border-light">
                                        <span className="font-monospace text-primary fw-semibold">{cd.soHDTD}</span>
                                        <span>Dư nợ: <strong className="num-tabular">{formatCurrencyVN(cd.duNo)}</strong></span>
                                        <span>Lãi suất: <strong>{cd.laiSuat}%/năm</strong></span>
                                        <span>Kỳ: <strong>{cd.tuNgayStr} → {cd.denNgayStr} ({cd.actualDays} ngày)</strong></span>
                                        <span className="text-danger fw-bold num-tabular">{formatCurrencyVN(cd.interestAmount)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center text-muted py-4">
                          Không tìm thấy khách hàng nào phù hợp với điều kiện tìm kiếm.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft size={14} /> Quay lại cấu hình
                </button>

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-light btn-sm" onClick={onClose}>
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
                    onClick={handleFinalSubmit}
                    disabled={selectedCount === 0}
                  >
                    <CheckCircle2 size={16} /> Xác Nhận Khởi Tạo ({selectedCount} KH)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
