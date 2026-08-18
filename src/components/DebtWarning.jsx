import React, { useState, useEffect } from 'react';
import { AlertTriangle, PhoneCall, CheckCircle2, Search, ArrowRight, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export default function DebtWarning() {
  const [warnings, setWarnings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchWarnings = async () => {
    try {
      const res = await api.getDebtWarnings();
      if (res.status === 'success' && res.data) {
        setWarnings(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, []);

  const formatCurrency = (val) => (val || 0).toLocaleString('vi-VN') + ' đ';

  const totalOverdue = warnings.reduce((acc, w) => acc + (w.tongNoTon || 0), 0);

  const filtered = warnings.filter(w =>
    !searchTerm ||
    w.soHDTD?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.maKH?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.kyPhatSinh?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h5 className="fw-bold text-danger m-0">Sổ Theo Dõi Nợ Tồn Đọng & Cảnh Báo Thu Nợ</h5>
              <p className="text-danger-emphasis small m-0">
                Tổng số tiền nợ tồn chưa thu được: <strong>{formatCurrency(totalOverdue)}</strong> ({warnings.length} món)
              </p>
            </div>
          </div>

          <div className="input-group" style={{ maxWidth: 300 }}>
            <span className="input-group-text bg-white border-end-0">
              <Search size={16} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Tìm kiếm nợ tồn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Debt Table */}
      <div className="card-modern p-4">
        <h6 className="fw-bold mb-3 text-slate-800">Danh Sách Khoản Nợ Tồn Đọng Cần Đôn Đốc Thu Hồi</h6>

        <div className="table-responsive">
          <table className="table table-custom align-middle">
            <thead>
              <tr>
                <th>Mã Khách Hàng</th>
                <th>Số Khế Ước</th>
                <th className="text-end">Gốc Tồn</th>
                <th className="text-end">Lãi Tồn</th>
                <th className="text-end">Tổng Nợ Tồn</th>
                <th className="text-center">Kỳ Phát Sinh</th>
                <th className="text-center">Trạng Thái</th>
                <th className="text-center">Đôn Đốc</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((w, idx) => (
                  <tr key={idx}>
                    <td className="fw-bold text-primary">{w.maKH}</td>
                    <td className="fw-semibold text-dark">{w.soHDTD}</td>
                    <td className="text-end">{formatCurrency(w.gocTon)}</td>
                    <td className="text-end text-danger">{formatCurrency(w.laiTon)}</td>
                    <td className="text-end fw-bold text-danger">{formatCurrency(w.tongNoTon)}</td>
                    <td className="text-center">
                      <span className="badge bg-secondary-subtle text-secondary">{w.kyPhatSinh}</span>
                    </td>
                    <td className="text-center">
                      <span className="badge-status badge-danger-soft">{w.trangThai}</span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-outline-danger fw-semibold d-inline-flex align-items-center gap-1"
                        onClick={() => alert(`Gọi điện đôn đốc khách hàng ${w.maKH} thanh toán nợ tồn ${formatCurrency(w.tongNoTon)}...`)}
                      >
                        <PhoneCall size={13} /> Đôn Đốc
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    Hiện tại không có khoản nợ tồn đọng nào cần xử lý.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
