import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Printer,
  Download,
  Search,
  Filter,
  FileSpreadsheet,
  Calendar,
  Layers,
  Clock,
  UserCheck
} from 'lucide-react';
import { formatCurrencyVN, formatDateVN, getTodayVN } from '../../utils/dateUtils';
import Pagination from '../Pagination';

export default function DebitBatchDetailModal({
  show,
  onClose,
  batch = null,
  onOpenCustomerQuickView
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (!show || !batch) return null;

  const items = batch.items || batch.chiTietDanhSach || [
    {
      maKH: 'KH008892',
      hoTen: 'NGUYỄN VĂN AN',
      soTK: '0381000123456',
      soHDTD: 'KU-2026-0312',
      tongDuNo: 200000000,
      laiPhatSinh: 1643836,
      gocDenHan: 0,
      noTon: 0,
      soTienTrich: 1643836,
      daTrich: 1643836,
      trangThai: 'THANH_CONG'
    },
    {
      maKH: 'KH004512',
      hoTen: 'LÊ THỊ MAI',
      soTK: '0381000789123',
      soHDTD: 'KU-2026-0145',
      tongDuNo: 150000000,
      laiPhatSinh: 1232877,
      gocDenHan: 0,
      noTon: 500000,
      soTienTrich: 1732877,
      daTrich: 1732877,
      trangThai: 'THANH_CONG'
    },
    {
      maKH: 'KH001980',
      hoTen: 'TRẦN VĂN QUÂN',
      soTK: '0381000998877',
      soHDTD: 'KU-2025-0811',
      tongDuNo: 500000000,
      laiPhatSinh: 4109589,
      gocDenHan: 10000000,
      noTon: 0,
      soTienTrich: 14109589,
      daTrich: 0,
      trangThai: 'THAT_BAI',
      lyDo: 'Số dư tài khoản thanh toán không đủ'
    }
  ];

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      item.hoTen?.toLowerCase().includes(term) ||
      item.maKH?.toLowerCase().includes(term) ||
      item.soTK?.toLowerCase().includes(term) ||
      item.soHDTD?.toLowerCase().includes(term);

    const matchStatus = filterStatus === 'ALL' || item.trangThai === filterStatus;
    return matchSearch && matchStatus;
  });

  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const totalPhaiThu = items.reduce((sum, i) => sum + (i.soTienTrich || i.tongDuKien || 0), 0);
  const totalDaTrich = items.reduce((sum, i) => sum + (i.daTrich || 0), 0);
  const totalConNo = Math.max(0, totalPhaiThu - totalDaTrich);

  const handleExportCSV = () => {
    const headers = ['Mã KH', 'Họ Tên', 'Số TK CASA', 'Số HĐTD', 'Dư Nợ Gốc', 'Lãi Phải Thu', 'Gốc Đến Hạn', 'Nợ Tồn', 'Tổng Phải Thu', 'Đã Trích', 'Trạng Thái'];
    const rows = items.map((i) => [
      `"${i.maKH || ''}"`,
      `"${i.hoTen || ''}"`,
      `"\t${i.soTK || ''}"`,
      `"${i.soHDTD || ''}"`,
      i.tongDuNo || 0,
      i.laiPhatSinh || 0,
      i.gocDenHan || 0,
      i.noTon || 0,
      i.soTienTrich || i.tongDuKien || 0,
      i.daTrich || 0,
      `"${i.trangThai || 'CHUA_XU_LY'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BANG_KE_TRICH_NO_${batch.maDot || 'DOT'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1055 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-4">
          {/* Header */}
          <div className="modal-header border-0 pb-0 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="modal-title fw-bold text-slate-900 font-heading d-flex align-items-center gap-2">
                <Zap size={20} className="text-warning" />
                Chi Tiết Đợt Trích Nợ: <span className="text-primary font-monospace">{batch.maDot}</span>
              </h5>
              <div className="text-muted small mt-0.5">
                Kỳ {batch.kyTrich} • Tháng {batch.thangNam} • Ngày tạo: {batch.ngayTao || getTodayVN()}
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-success btn-sm fw-semibold d-flex align-items-center gap-1"
                onClick={handleExportCSV}
              >
                <Download size={14} /> Xuất CSV / Excel
              </button>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm fw-semibold d-flex align-items-center gap-1"
                onClick={handlePrint}
              >
                <Printer size={14} /> In Bảng Kê
              </button>
              <button type="button" className="btn-close ms-2" onClick={onClose} />
            </div>
          </div>

          <div className="modal-body py-3">
            {/* KPI Summary Cards */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6 col-md-3">
                <div className="p-3 bg-light rounded-3 border">
                  <span className="text-muted small d-block">Tổng Số Món Trích</span>
                  <h4 className="fw-bold text-dark m-0 num-tabular">{items.length} món</h4>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-md-3">
                <div className="p-3 bg-light rounded-3 border">
                  <span className="text-muted small d-block">Tổng Tiền Phải Thu</span>
                  <h4 className="fw-bold text-primary m-0 num-tabular">{formatCurrencyVN(totalPhaiThu)}</h4>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-md-3">
                <div className="p-3 bg-light rounded-3 border">
                  <span className="text-muted small d-block">Đã Trích Thành Công</span>
                  <h4 className="fw-bold text-success m-0 num-tabular">{formatCurrencyVN(totalDaTrich)}</h4>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-md-3">
                <div className="p-3 bg-light rounded-3 border">
                  <span className="text-muted small d-block">Còn Lại (Nợ Tồn)</span>
                  <h4 className="fw-bold text-danger m-0 num-tabular">{formatCurrencyVN(totalConNo)}</h4>
                </div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div className="input-group input-group-sm" style={{ maxWidth: 320 }}>
                <span className="input-group-text bg-light border-end-0">
                  <Search size={14} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Tìm khách hàng, số TK, hợp đồng..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="d-flex align-items-center gap-2">
                <select
                  className="form-select form-select-sm"
                  style={{ width: 160 }}
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="THANH_CONG">Đã trích đủ</option>
                  <option value="THAT_BAI">Trích thất bại</option>
                  <option value="CHUA_XU_LY">Chưa xử lý</option>
                </select>
              </div>
            </div>

            {/* Table Detail */}
            <div className="table-responsive">
              <table className="table table-custom align-middle small">
                <thead>
                  <tr>
                    <th>Mã KH</th>
                    <th>Họ và Tên</th>
                    <th>Số TK CASA</th>
                    <th>Số HĐTD</th>
                    <th className="text-end">Dư Nợ Gốc</th>
                    <th className="text-end">Lãi TT14</th>
                    <th className="text-end">Nợ Tồn</th>
                    <th className="text-end">Phải Thu</th>
                    <th className="text-end">Đã Trích</th>
                    <th className="text-center">Kết Quả</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length > 0 ? (
                    paginatedItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="fw-bold font-monospace">
                          <button
                            type="button"
                            className="btn btn-link p-0 fw-bold font-monospace text-decoration-none text-primary"
                            onClick={() => onOpenCustomerQuickView && onOpenCustomerQuickView({ maKH: item.maKH, hoTen: item.hoTen })}
                          >
                            {item.maKH}
                          </button>
                        </td>
                        <td className="fw-semibold text-slate-900">{item.hoTen}</td>
                        <td className="font-monospace text-muted">{item.soTK}</td>
                        <td className="font-monospace text-muted">{item.soHDTD}</td>
                        <td className="text-end num-tabular">{formatCurrencyVN(item.tongDuNo)}</td>
                        <td className="text-end num-tabular text-primary">{formatCurrencyVN(item.laiPhatSinh)}</td>
                        <td className="text-end num-tabular text-danger">{formatCurrencyVN(item.noTon)}</td>
                        <td className="text-end fw-bold num-tabular">{formatCurrencyVN(item.soTienTrich || item.tongDuKien)}</td>
                        <td className="text-end fw-bold text-success num-tabular">{formatCurrencyVN(item.daTrich || 0)}</td>
                        <td className="text-center">
                          {item.trangThai === 'THANH_CONG' ? (
                            <span className="badge bg-success-subtle text-success">Đã trích</span>
                          ) : item.trangThai === 'THAT_BAI' ? (
                            <span className="badge bg-danger-subtle text-danger" title={item.lyDo || 'Không đủ số dư'}>
                              Thất bại
                            </span>
                          ) : (
                            <span className="badge bg-secondary-subtle text-secondary">Chờ trích</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-center text-muted py-3">
                        Không có bản ghi phù hợp với điều kiện tìm kiếm.
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

          <div className="modal-footer border-0 pt-0">
            <button type="button" className="btn btn-light btn-sm px-4 fw-semibold" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
