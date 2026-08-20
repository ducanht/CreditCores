import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Upload,
  Download,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrencyVN, formatDateVN, getTodayVN } from '../utils/dateUtils';
import Pagination from './Pagination';

export default function Reconciliation({ onOpenCustomerQuickView }) {
  const [selectedBatch, setSelectedBatch] = useState('DOT-202608-K1');
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'THANH_CONG' | 'TRICH_MOT_PHAN' | 'THAT_BAI'
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Sample Reconcile Results List
  const [items, setItems] = useState([
    { maKH: 'KH008892', soHDTD: 'KU-2026-0312', hoTen: 'NGUYỄN VĂN AN', soTK: '0381000123456', phaiThu: 1643836, daTrich: 1643836, ketQua: 'THANH_CONG', lyDoLoi: '' },
    { maKH: 'KH004512', soHDTD: 'KU-2026-0145', hoTen: 'LÊ THỊ MAI', soTK: '0381000789123', phaiThu: 1732877, daTrich: 1732877, ketQua: 'THANH_CONG', lyDoLoi: '' },
    { maKH: 'KH001980', soHDTD: 'KU-2025-0811', hoTen: 'TRẦN VĂN QUÂN', soTK: '0381000998877', phaiThu: 14109589, daTrich: 4000000, ketQua: 'TRICH_MOT_PHAN', lyDoLoi: 'Số dư khả dụng chỉ còn 4,000,000 đ' },
    { maKH: 'KH007621', soHDTD: 'KU-2025-0982', hoTen: 'PHẠM VĂN ĐỨC', soTK: '0381000554433', phaiThu: 2850000, daTrich: 0, ketQua: 'THAT_BAI', lyDoLoi: 'Số dư tài khoản không đủ (dưới hạn mức tối thiểu)' },
    { maKH: 'KH003319', soHDTD: 'KU-2026-0219', hoTen: 'HOÀNG THỊ THU', soTK: '0381000221144', phaiThu: 3420000, daTrich: 3420000, ketQua: 'THANH_CONG', lyDoLoi: '' },
    { maKH: 'KH005820', soHDTD: 'KU-2026-0402', hoTen: 'VŨ ĐÌNH LONG', soTK: '0381000667788', phaiThu: 5120000, daTrich: 0, ketQua: 'THAT_BAI', lyDoLoi: 'Tài khoản thanh toán đang tạm khóa' }
  ]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
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
        alert(res.message || 'Đối soát số liệu thành công!');
      }
    } catch (e) {
      alert('Lỗi đối soát: ' + e.message);
    } finally {
      setReconciling(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Mã KH', 'Họ Tên', 'Số TK CASA', 'Số HĐTD', 'Phải Thu', 'Đã Trích', 'Còn Nợ', 'Kết Quả', 'Lý Do Lỗi'];
    const rows = items.map((i) => [
      `"${i.maKH}"`,
      `"${i.hoTen}"`,
      `"\t${i.soTK}"`,
      `"${i.soHDTD}"`,
      i.phaiThu,
      i.daTrich,
      Math.max(0, i.phaiThu - i.daTrich),
      `"${i.ketQua}"`,
      `"${i.lyDoLoi || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DOI_SOAT_TRICH_NO_${selectedBatch}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const successCount = items.filter((i) => i.ketQua === 'THANH_CONG').length;
  const partialCount = items.filter((i) => i.ketQua === 'TRICH_MOT_PHAN').length;
  const failedCount = items.filter((i) => i.ketQua === 'THAT_BAI').length;
  const totalCount = items.length;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

  const totalPhaiThu = items.reduce((sum, i) => sum + i.phaiThu, 0);
  const totalDaTrich = items.reduce((sum, i) => sum + i.daTrich, 0);
  const totalConNo = Math.max(0, totalPhaiThu - totalDaTrich);

  // Filtering
  const filteredItems = items.filter((i) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      i.hoTen?.toLowerCase().includes(term) ||
      i.maKH?.toLowerCase().includes(term) ||
      i.soTK?.toLowerCase().includes(term) ||
      i.soHDTD?.toLowerCase().includes(term);

    const matchFilter = activeFilter === 'ALL' || i.ketQua === activeFilter;
    return matchSearch && matchFilter;
  });

  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. Header & File Upload Dropzone */}
      <div className="card-modern p-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <span className="small fw-semibold text-slate-900 d-flex align-items-center gap-1.5">
            <ArrowLeftRight size={16} className="text-primary" /> So Khớp Tự Động Kết Quả Hạch Toán
          </span>
          <button
            type="button"
            className="btn btn-outline-success btn-sm fw-medium d-flex align-items-center gap-1.5"
            onClick={handleExportCSV}
          >
            <Download size={14} /> Xuất Báo Cáo Đối Soát (.csv)
          </button>
        </div>

        <div className="row g-3 align-items-stretch">
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-slate-700">Đợt Trích Nợ Cần Đối Soát</label>
            <select
              className="form-select form-select-sm"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="DOT-202608-K1">DOT-202608-K1 (Kỳ 1 • 05/08/2026)</option>
              <option value="DOT-202608-K2">DOT-202608-K2 (Kỳ 2 • 15/08/2026)</option>
              <option value="DOT-202608-K3">DOT-202608-K3 (Kỳ 3 • 25/08/2026)</option>
            </select>
            <div className="text-muted mt-2 small" style={{ fontSize: '0.75rem' }}>
              Phải thu: <strong className="text-dark num-tabular">{formatCurrencyVN(totalPhaiThu)}</strong> • Thu được: <strong className="text-success num-tabular">{formatCurrencyVN(totalDaTrich)}</strong>
            </div>
          </div>

          <div className="col-12 col-md-5">
            <label className="form-label small fw-semibold text-slate-700">Tệp Kết Quả Hạch Toán (Excel / CSV)</label>
            <div
              className={`p-2.5 rounded-3 border border-2 text-center transition-all ${
                isDragOver ? 'border-primary bg-primary-subtle' : 'border-dashed bg-light'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="d-flex align-items-center justify-content-center gap-2">
                <Upload size={16} className="text-muted" />
                <span className="small text-muted">
                  {uploadedFileName ? (
                    <strong className="text-success">{uploadedFileName}</strong>
                  ) : (
                    'Kéo thả tệp hoặc bấm để chọn tệp kết quả'
                  )}
                </span>
                <input
                  type="file"
                  className="d-none"
                  id="reconcileFileInput"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                />
                <label htmlFor="reconcileFileInput" className="btn btn-outline-secondary btn-sm py-0.5 px-2 ms-2 small" style={{ cursor: 'pointer' }}>
                  Chọn
                </label>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-3 d-flex align-items-end">
            <button
              className="btn btn-brand btn-sm fw-semibold w-100 py-2 d-flex align-items-center justify-content-center gap-1.5 text-white shadow-sm"
              onClick={handleProcessReconcile}
              disabled={reconciling}
            >
              <CheckCircle2 size={16} />
              {reconciling ? 'Đang đối soát...' : 'Chạy Đối Soát'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Sleek KPI Metrics Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card-modern p-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small">Tỷ Lệ Thu Hồi</span>
              <span className="badge bg-success-subtle text-success small">{successRate}%</span>
            </div>
            <h4 className="fw-bold text-dark m-0 num-tabular">{totalDaTrich > 0 ? ((totalDaTrich / totalPhaiThu) * 100).toFixed(1) : 0}%</h4>
            <div className="progress mt-2" style={{ height: 4 }}>
              <div className="progress-bar bg-success" style={{ width: `${successRate}%` }}></div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div
            className={`card-modern p-3 cursor-pointer ${activeFilter === 'THANH_CONG' ? 'border-success' : ''}`}
            onClick={() => { setActiveFilter('THANH_CONG'); setPage(1); }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small">Trích Đủ (Thành Công)</span>
              <CheckCircle2 size={16} className="text-success" />
            </div>
            <h4 className="fw-bold text-success m-0 num-tabular">{successCount} món</h4>
            <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
              Thu đủ: <span className="text-dark num-tabular">{formatCurrencyVN(items.filter(i => i.ketQua === 'THANH_CONG').reduce((s, i) => s + i.daTrich, 0))}</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div
            className={`card-modern p-3 cursor-pointer ${activeFilter === 'TRICH_MOT_PHAN' ? 'border-warning' : ''}`}
            onClick={() => { setActiveFilter('TRICH_MOT_PHAN'); setPage(1); }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small">Trích Một Phần</span>
              <AlertCircle size={16} className="text-warning" />
            </div>
            <h4 className="fw-bold text-warning m-0 num-tabular">{partialCount} món</h4>
            <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
              Còn thiếu: <span className="text-danger num-tabular">{formatCurrencyVN(items.filter(i => i.ketQua === 'TRICH_MOT_PHAN').reduce((s, i) => s + (i.phaiThu - i.daTrich), 0))}</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div
            className={`card-modern p-3 cursor-pointer ${activeFilter === 'THAT_BAI' ? 'border-danger' : ''}`}
            onClick={() => { setActiveFilter('THAT_BAI'); setPage(1); }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small">Chưa Trích Được</span>
              <XCircle size={16} className="text-danger" />
            </div>
            <h4 className="fw-bold text-danger m-0 num-tabular">{failedCount} món</h4>
            <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
              Nợ tồn: <span className="text-danger num-tabular">{formatCurrencyVN(items.filter(i => i.ketQua === 'THAT_BAI').reduce((s, i) => s + i.phaiThu, 0))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Reconcile Table & Filter Tabs */}
      <div className="card-modern p-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          {/* Sub-tabs */}
          <div className="btn-group btn-group-sm p-0.5 bg-light rounded-2 border" role="group">
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === 'ALL' ? 'btn-brand fw-semibold text-white' : 'btn-light text-muted'}`}
              onClick={() => { setActiveFilter('ALL'); setPage(1); }}
            >
              Tất Cả ({items.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === 'THANH_CONG' ? 'btn-brand fw-semibold text-white' : 'btn-light text-muted'}`}
              onClick={() => { setActiveFilter('THANH_CONG'); setPage(1); }}
            >
              Đã Trích Đủ ({successCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === 'TRICH_MOT_PHAN' ? 'btn-brand fw-semibold text-white' : 'btn-light text-muted'}`}
              onClick={() => { setActiveFilter('TRICH_MOT_PHAN'); setPage(1); }}
            >
              Trích 1 Phần ({partialCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === 'THAT_BAI' ? 'btn-brand fw-semibold text-white' : 'btn-light text-muted'}`}
              onClick={() => { setActiveFilter('THAT_BAI'); setPage(1); }}
            >
              Thất Bại ({failedCount})
            </button>
          </div>

          {/* Search bar */}
          <div className="input-group input-group-sm" style={{ maxWidth: 280 }}>
            <span className="input-group-text bg-light border-end-0">
              <Search size={13} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Tìm khách hàng, số HĐTD..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-custom align-middle small">
            <thead>
              <tr>
                <th>Mã KH</th>
                <th>Số Khế Ước</th>
                <th>Khách Hàng</th>
                <th>Số TK CASA</th>
                <th className="text-end">Phải Thu</th>
                <th className="text-end">Đã Trích</th>
                <th className="text-end">Còn Nợ (Tồn)</th>
                <th className="text-center">Kết Quả</th>
                <th>Lý Do / Ghi Chú</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map((it, idx) => {
                  const conNo = Math.max(0, it.phaiThu - it.daTrich);
                  return (
                    <tr key={idx}>
                      <td className="fw-medium font-monospace">
                        <button
                          type="button"
                          className="btn btn-link p-0 fw-medium font-monospace text-decoration-none text-primary"
                          onClick={() => onOpenCustomerQuickView && onOpenCustomerQuickView({ maKH: it.maKH, hoTen: it.hoTen })}
                        >
                          {it.maKH}
                        </button>
                      </td>
                      <td className="font-monospace text-muted">{it.soHDTD}</td>
                      <td className="fw-medium text-slate-900">{it.hoTen}</td>
                      <td className="font-monospace text-muted">{it.soTK}</td>
                      <td className="text-end num-tabular fw-medium">{formatCurrencyVN(it.phaiThu)}</td>
                      <td className="text-end num-tabular text-success fw-medium">{formatCurrencyVN(it.daTrich)}</td>
                      <td className="text-end num-tabular text-danger fw-medium">{formatCurrencyVN(conNo)}</td>
                      <td className="text-center">
                        {it.ketQua === 'THANH_CONG' ? (
                          <span className="badge bg-success-subtle text-success">Đã trích đủ</span>
                        ) : it.ketQua === 'TRICH_MOT_PHAN' ? (
                          <span className="badge bg-warning-subtle text-warning">Trích 1 phần</span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger">Thất bại</span>
                        )}
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {it.lyDoLoi || 'Hoàn tất'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-4">
                    Không có kết quả đối soát phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalItems={filteredItems.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
