import React, { useState, useEffect } from 'react';
import { Search, User, CreditCard, Landmark, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function Customer360({ onNavigateToAppraisal, onNavigateToInspection, onNavigateToDebit }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async (q = '') => {
    setLoading(true);
    try {
      const res = await api.searchCustomer360(q);
      if (res.status === 'success' && res.data) {
        setCustomers(res.data);
        if (res.data.length > 0 && !selectedCustomer) {
          setSelectedCustomer(res.data[0]);
        } else if (res.data.length === 0) {
          setSelectedCustomer(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers('');
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers(searchTerm);
  };

  const formatCurrency = (val) => (val || 0).toLocaleString('vi-VN') + ' đ';

  return (
    <div className="d-flex flex-column gap-4">
      {/* Search Bar Header */}
      <div className="card-modern p-3">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-md-9">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <Search size={18} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Nhập Mã Khách Hàng, Họ Tên, CCCD (12 số), Số Điện Thoại hoặc Số Tài Khoản..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3 d-flex gap-2">
            <button type="submit" className="btn btn-primary fw-semibold w-100" disabled={loading}>
              {loading ? 'Đang tìm kiếm...' : 'Tra cứu 360°'}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setSearchTerm('');
                fetchCustomers('');
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Main 360 View: Left List + Right Detail */}
      <div className="row g-3">
        {/* Left Column: Customer List */}
        <div className="col-lg-4">
          <div className="card-modern p-3" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            <h6 className="fw-bold mb-3 text-slate-700">Kết Quả Tìm Kiếm ({customers.length})</h6>
            <div className="d-flex flex-column gap-2">
              {customers.map((c) => {
                const isSelected = selectedCustomer?.maKH === c.maKH;
                return (
                  <div
                    key={c.maKH}
                    onClick={() => setSelectedCustomer(c)}
                    className={`p-3 rounded-3 border cursor-pointer transition-all ${
                      isSelected ? 'border-primary bg-primary-subtle' : 'border-slate-200 bg-white hover-bg-light'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold text-dark">{c.hoTen}</span>
                      <span className="badge bg-secondary small">{c.maKH}</span>
                    </div>
                    <div className="text-muted small mb-1">
                      <i className="fa-regular fa-id-card me-1"></i> CCCD: {c.cccd}
                    </div>
                    <div className="text-muted small">
                      <i className="fa-solid fa-location-dot me-1"></i> {c.diaChi}
                    </div>
                  </div>
                );
              })}

              {customers.length === 0 && !loading && (
                <div className="text-center py-4 text-muted">Không tìm thấy khách hàng nào.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Detailed Profile */}
        <div className="col-lg-8">
          {selectedCustomer ? (
            <div className="d-flex flex-column gap-3">
              {/* Profile Card */}
              <div className="card-modern p-4">
                <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
                  <div>
                    <h4 className="fw-bold text-primary m-0 d-flex align-items-center gap-2">
                      <User size={24} /> {selectedCustomer.hoTen}
                    </h4>
                    <span className="text-muted small">
                      Mã KH: <strong>{selectedCustomer.maKH}</strong> | Khu vực: {selectedCustomer.khuVuc}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-success fw-semibold"
                      onClick={() => onNavigateToAppraisal(selectedCustomer)}
                    >
                      <FileText size={14} className="me-1" /> Lập Thẩm Định
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary fw-semibold"
                      onClick={() => onNavigateToDebit(selectedCustomer)}
                    >
                      <CreditCard size={14} className="me-1" /> Đăng Ký Trích Nợ
                    </button>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="p-3 bg-light rounded-3">
                      <span className="text-muted small d-block">Số CCCD / Ngày Cấp</span>
                      <span className="fw-bold text-dark">
                        {selectedCustomer.cccd} ({selectedCustomer.ngayCap || '---'})
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-light rounded-3">
                      <span className="text-muted small d-block">Số Điện Thoại</span>
                      <span className="fw-bold text-dark">{selectedCustomer.dienThoaiDD || selectedCustomer.dienThoai || '---'}</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-light rounded-3">
                      <span className="text-muted small d-block">Tài Khoản CASA Co-op</span>
                      <span className="fw-bold text-primary">{selectedCustomer.soTK || 'Chưa đăng ký'}</span>
                    </div>
                  </div>

                  {/* Member info */}
                  <div className="col-md-4">
                    <div className="p-3 bg-light rounded-3">
                      <span className="text-muted small d-block">Số Thành Viên (QTDND)</span>
                      <span className="fw-bold text-dark">{selectedCustomer.soTV || 'Chưa vào TV'}</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-light rounded-3">
                      <span className="text-muted small d-block">Số Sổ Cổ Phần / Ngày Vào</span>
                      <span className="fw-bold text-dark">{selectedCustomer.soSoCP || '---'} ({selectedCustomer.ngayVaoTV || '---'})</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-light rounded-3">
                      <span className="text-muted small d-block">Tổng Vốn Góp Cổ Phần</span>
                      <span className="fw-bold text-success">{formatCurrency(selectedCustomer.tongTienCP)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Loan Contracts Portfolio */}
              <div className="card-modern p-4">
                <h5 className="fw-bold mb-3 text-slate-800 d-flex align-items-center gap-2">
                  <Landmark size={20} className="text-primary" />
                  Danh Mục Khế Ước & Hợp Đồng Tín Dụng ({selectedCustomer.contracts?.length || 0})
                </h5>

                <div className="table-responsive">
                  <table className="table table-custom align-middle">
                    <thead>
                      <tr>
                        <th>Số Khế Ước</th>
                        <th className="text-end">Tiền Vay</th>
                        <th className="text-end">Dư Nợ Hiện Tại</th>
                        <th className="text-center">Lãi Suất</th>
                        <th className="text-center">Ngày Vay - Hạn</th>
                        <th className="text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.contracts && selectedCustomer.contracts.length > 0 ? (
                        selectedCustomer.contracts.map((c) => (
                          <tr key={c.soHDTD}>
                            <td>
                              <span className="fw-bold text-primary">{c.soHDTD}</span>
                              <div className="text-muted small">{c.moTaVay}</div>
                            </td>
                            <td className="text-end fw-semibold">{formatCurrency(c.tienVay)}</td>
                            <td className="text-end fw-bold text-danger">{formatCurrency(c.duNo)}</td>
                            <td className="text-center fw-semibold text-success">{c.laiSuat}% /năm</td>
                            <td className="text-center small">
                              {c.ngayVay} <br />
                              <span className="text-muted">đến {c.denHan}</span>
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-outline-warning fw-semibold"
                                onClick={() => onNavigateToInspection(selectedCustomer, c)}
                                title="Lập biên bản kiểm tra sử dụng vốn"
                              >
                                <ShieldCheck size={14} className="me-1" /> Kiểm Tra Vốn
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center text-muted py-3">
                            Khách hàng này hiện không có khế ước vay nào đang lưu hành.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-modern p-5 text-center text-muted">
              Vui lòng chọn hoặc tìm kiếm khách hàng để xem thông tin 360°.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
