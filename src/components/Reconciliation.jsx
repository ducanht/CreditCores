import React, { useState } from 'react';
import { ArrowLeftRight, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { api } from '../services/api';
import { formatCurrencyVN } from '../utils/dateUtils';

export default function Reconciliation() {
  const [selectedBatch, setSelectedBatch] = useState('DOT-202608-K1');
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);

  // Sample Reconcile Results List
  const [items, setItems] = useState([
    { soHDTD: 'KU-2025-0982', hoTen: 'NGUYỄN VĂN AN', phaiThu: 6500000, daTrich: 0, ketQua: 'THAT_BAI', lyDoLoi: 'Số dư không đủ' },
    { soHDTD: 'KU-2026-0145', hoTen: 'NGUYỄN VĂN AN', phaiThu: 5100000, daTrich: 5100000, ketQua: 'THANH_CONG', lyDoLoi: '' },
    { soHDTD: 'KU-2026-0312', hoTen: 'LÊ THỊ MAI', phaiThu: 6000000, daTrich: 0, ketQua: 'THAT_BAI', lyDoLoi: 'Tài khoản tạm khóa' },
    { soHDTD: 'KU-2025-0811', hoTen: 'TRẦN VĂN QUÂN', phaiThu: 12500000, daTrich: 12500000, ketQua: 'THANH_CONG', lyDoLoi: '' }
  ]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      alert(`Đã nạp file kết quả: ${file.name}. Hệ thống đang tự động bóc tách dữ liệu...`);
    }
  };

  const handleProcessReconcile = async () => {
    setReconciling(true);
    try {
      const res = await api.reconcileUpload({
        maDot: selectedBatch,
        items: items
      });
      if (res.status === 'success') {
        setReconcileResult(res);
        alert(res.message || 'Đối soát hoàn tất!');
      }
    } catch (e) {
      alert('Lỗi đối soát: ' + e.message);
    } finally {
      setReconciling(false);
    }
  };

  const formatCurrency = (val) => (val || 0).toLocaleString('vi-VN') + ' đ';

  const successCount = items.filter(i => i.ketQua === 'THANH_CONG').length;
  const partialCount = items.filter(i => i.ketQua === 'TRICH_MOT_PHAN').length;
  const failedCount = items.filter(i => i.ketQua === 'THAT_BAI').length;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Upload Box Card */}
      <div className="card-modern p-4">
        <h5 className="fw-bold mb-3 text-slate-800 d-flex align-items-center gap-2">
          <ArrowLeftRight size={20} className="text-primary" />
          Đối Soát Kết Quả Trích Nợ Từ CoreBanking
        </h5>

        <div className="row g-3 align-items-center mb-3">
          <div className="col-md-4">
            <label className="form-label small fw-semibold text-muted">Chọn Đợt Trích Nợ Cần Đối Soát</label>
            <select
              className="form-select fw-bold"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="DOT-202608-K1">DOT-202608-K1 (Kỳ 1 - Ngày 05/08/2026)</option>
              <option value="DOT-202608-K2">DOT-202608-K2 (Kỳ 2 - Ngày 15/08/2026)</option>
              <option value="DOT-202608-K3">DOT-202608-K3 (Kỳ 3 - Ngày 25/08/2026)</option>
            </select>
          </div>

          <div className="col-md-5">
            <label className="form-label small fw-semibold text-muted">Upload File Kết Quả (Excel / CSV từ Core)</label>
            <input type="file" className="form-control" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
          </div>

          <div className="col-md-3 d-flex align-items-end">
            <button
              className="btn btn-success fw-bold w-100 py-2 d-flex align-items-center justify-content-center gap-2"
              onClick={handleProcessReconcile}
              disabled={reconciling}
            >
              <CheckCircle2 size={18} />
              {reconciling ? 'Đang đối soát...' : 'Thực Hiện Đối Soát'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Classification KPI */}
      <div className="row g-3">
        <div className="col-md-4">
          <div className="card-modern p-3 border-start border-success border-4 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-muted small fw-semibold">TRÍCH ĐỦ (THÀNH CÔNG)</span>
              <h3 className="fw-bold text-success m-0">{successCount} món</h3>
            </div>
            <CheckCircle2 size={32} className="text-success opacity-75" />
          </div>
        </div>

        <div className="col-md-4">
          <div className="card-modern p-3 border-start border-warning border-4 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-muted small fw-semibold">TRÍCH MỘT PHẦN</span>
              <h3 className="fw-bold text-warning m-0">{partialCount} món</h3>
            </div>
            <AlertCircle size={32} className="text-warning opacity-75" />
          </div>
        </div>

        <div className="col-md-4">
          <div className="card-modern p-3 border-start border-danger border-4 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-muted small fw-semibold">CHƯA TRÍCH ĐƯỢC (THẤT BẠI)</span>
              <h3 className="fw-bold text-danger m-0">{failedCount} món</h3>
            </div>
            <XCircle size={32} className="text-danger opacity-75" />
          </div>
        </div>
      </div>

      {/* Reconcile Detail Table */}
      <div className="card-modern p-4">
        <h6 className="fw-bold mb-3 text-slate-800">Chi Tiết Kết Quả Đối Soát Đợt: {selectedBatch}</h6>

        <div className="table-responsive">
          <table className="table table-custom align-middle">
            <thead>
              <tr>
                <th>Số Khế Ước</th>
                <th>Khách Hàng</th>
                <th className="text-end">Phải Thu</th>
                <th className="text-end">Đã Trích</th>
                <th className="text-end">Còn Nợ (Tồn)</th>
                <th className="text-center">Kết Quả</th>
                <th>Lý Do Lỗi / Ghi Chú</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const conNo = Math.max(0, it.phaiThu - it.daTrich);
                return (
                  <tr key={idx}>
                    <td className="fw-bold text-primary font-monospace">{it.soHDTD}</td>
                    <td className="fw-semibold text-dark">{it.hoTen}</td>
                    <td className="text-end fw-bold num-tabular">{formatCurrencyVN(it.phaiThu)}</td>
                    <td className="text-end fw-bold text-success num-tabular">{formatCurrencyVN(it.daTrich)}</td>
                    <td className="text-end fw-bold text-danger num-tabular">{formatCurrencyVN(conNo)}</td>
                    <td className="text-center">
                      <span
                        className={`badge-status ${
                          it.ketQua === 'THANH_CONG'
                            ? 'badge-success-soft'
                            : it.ketQua === 'TRICH_MOT_PHAN'
                            ? 'badge-warning-soft'
                            : 'badge-danger-soft'
                        }`}
                      >
                        {it.ketQua}
                      </span>
                    </td>
                    <td className="text-muted small">{it.lyDoLoi || 'Hoàn tất'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
