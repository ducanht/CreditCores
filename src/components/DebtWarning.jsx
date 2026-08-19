import React, { useState, useEffect } from 'react';
import { AlertTriangle, PhoneCall, CheckCircle2, Search, ArrowRight, ShieldAlert, Filter } from 'lucide-react';
import { api } from '../services/api';
import { formatCurrencyVN } from '../utils/dateUtils';
import Pagination from './Pagination';

export default function DebtWarning({ onOpenCustomerQuickView }) {
  const [warnings, setWarnings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKy, setFilterKy] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [loading, setLoading] = useState(true);

  const fetchWarnings = async () => {
    setLoading(true);
    try {
      const res = await api.getDebtWarnings();
      if (res.status === 'success' && res.data) {
        setWarnings(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, []);

  const totalOverdue = warnings.reduce((acc, w) => acc + (w.tongNoTon || 0), 0);

  const filtered = warnings.filter(w => {
    const matchSearch = !searchTerm ||
      w.soHDTD?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.maKH?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.kyPhatSinh?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchKy = filterKy === 'ALL' || w.kyPhatSinh === filterKy;
    return matchSearch && matchKy;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Danh sách các kỳ phát sinh có trong dữ liệu
  const uniqueKys = [...new Set(warnings.map(w => w.kyPhatSinh).filter(Boolean))];

  return (
    <div className="d-flex flex-column gap-4">
      {/* Alert Header Banner */}
      <div className="card-modern p-4 bg-danger-subtle border-danger border-2">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            <div className="p-3 bg-danger text-white rounded-circle">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h5 className="fw-bold text-danger m-0 font-heading">Sổ Theo Dõi Nợ Tồn Đọng & Cảnh Báo Thu Nợ</h5>
              <p className="text-danger-emphasis small m-0">
                Tổng số tiền nợ tồn chưa thu được: <strong className="num-tabular">{formatCurrencyVN(totalOverdue)}</strong> ({warnings.length} món nợ)
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center flex-wrap gap-2">
            {/* Bộ lọc theo kỳ */}
            <select
              className="form-select form-select-sm"
              style={{ width: 150 }}
              value={filterKy}
              onChange={(e) => {
                setFilterKy(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">Tất cả Kỳ</option>
              {uniqueKys.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>

            <div className="input-group input-group-sm" style={{ width: 220 }}>
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Tìm Mã KH, HĐTD..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Debt Table */}
      <div className="card-modern p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold m-0 text-slate-800 font-heading">
            Danh Sách Khoản Nợ Tồn Đọng Cần Đôn Đốc Thu Hồi ({filtered.length} món)
          </h6>
        </div>

        <div className="table-responsive">
          <table className="table table-custom align-middle">
            <thead>
              <tr>
                <th>Mã Khách Hàng</th>
                <th>Số Khế Ước / HĐTD</th>
                <th className="text-end">Gốc Tồn</th>
                <th className="text-end">Lãi Tồn</th>
                <th className="text-end">Tổng Nợ Tồn</th>
                <th className="text-center">Kỳ Phát Sinh</th>
                <th className="text-center">Trạng Thái</th>
                <th className="text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((w, idx) => (
                  <tr key={idx}>
                    <td>
                      <div
                        className="customer-click-link"
                        onClick={() => {
                          if (onOpenCustomerQuickView) {
                            onOpenCustomerQuickView({ maKH: w.maKH, hoTen: w.maKH });
                          }
                        }}
                        title="Xem nhanh thông tin 360° khách hàng"
                      >
                        {w.maKH}
                      </div>
                    </td>
                    <td className="fw-semibold text-dark font-monospace">{w.soHDTD}</td>
                    <td className="text-end num-tabular">{formatCurrencyVN(w.gocTon)}</td>
                    <td className="text-end text-danger num-tabular">{formatCurrencyVN(w.laiTon)}</td>
                    <td className="text-end fw-bold text-danger num-tabular">{formatCurrencyVN(w.tongNoTon)}</td>
                    <td className="text-center">
                      <span className="badge bg-secondary-subtle text-secondary">{w.kyPhatSinh}</span>
                    </td>
                    <td className="text-center">
                      <span className="badge-status badge-danger-soft">{w.trangThai}</span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 py-1 px-2"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => alert(`Gửi thông báo đôn đốc thu nợ tới khách hàng ${w.maKH} cho khoản nợ ${w.soHDTD}`)}
                      >
                        <PhoneCall size={12} /> Đôn Đốc
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    {loading ? 'Đang tải danh sách nợ tồn đọng...' : 'Không có khoản nợ tồn đọng nào phù hợp.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang chuẩn 15 dòng */}
        <Pagination
          currentPage={page}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
