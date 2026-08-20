import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  User,
  CreditCard,
  Landmark,
  FileText,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  RotateCcw,
  UserCog,
  AlertTriangle,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { formatDateVN, formatCurrencyVN } from '../utils/dateUtils';

export default function Customer360({
  currentUser,
  onNavigateToAppraisal,
  onNavigateToInspection,
  onNavigateToDebit,
  onOpenCustomerQuickView
}) {
  const isCBTD = currentUser?.role === 'CBTD';
  const defaultCBTD = isCBTD ? currentUser.username : 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCBTD, setSelectedCBTD] = useState(defaultCBTD);
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' | 'DANG_VAY' | 'DA_TAT_TOAN'

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Assign CBTD Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null); // { contract, customer }
  const [assignCBTDUser, setAssignCBTDUser] = useState('');
  const [assignAllForCust, setAssignAllForCust] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [cbtdOfficers, setCbtdOfficers] = useState([]);

  const searchTimeoutRef = useRef(null);

  // Fetch KPI Portfolio stats
  const fetchStats = async (cbtd = selectedCBTD) => {
    setStatsLoading(true);
    try {
      const res = await api.getCBTDPortfolioStats(cbtd === 'all' ? '' : cbtd);
      if (res.status === 'success' && res.data) {
        setStats(res.data);
        if (res.data.cbtdList && res.data.cbtdList.length > 0) {
          setCbtdOfficers(res.data.cbtdList);
        }
      }
    } catch (e) {
      console.error('Lỗi nạp thống kê CBTD:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Customers & Contracts
  const fetchCustomers = async (q = searchTerm, cbtd = selectedCBTD, status = selectedStatus) => {
    setLoading(true);
    try {
      const res = await api.searchCustomer360({
        query: q,
        cbtdUsername: cbtd,
        status: status
      });
      if (res.status === 'success' && res.data) {
        setCustomers(res.data);
        if (res.data.length > 0) {
          // Giữ lại customer đang chọn nếu còn trong danh sách
          const stillSelected = selectedCustomer ? res.data.find(c => c.maKH === selectedCustomer.maKH) : null;
          setSelectedCustomer(stillSelected || res.data[0]);
        } else {
          setSelectedCustomer(null);
        }
      }
    } catch (e) {
      console.error('Lỗi tra cứu khách hàng:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedCBTD);
    fetchCustomers(searchTerm, selectedCBTD, selectedStatus);
  }, [selectedCBTD, selectedStatus]);

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchCustomers(val, selectedCBTD, selectedStatus);
    }, 350);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    fetchCustomers(searchTerm, selectedCBTD, selectedStatus);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCBTD(defaultCBTD);
    setSelectedStatus('ALL');
    fetchCustomers('', defaultCBTD, 'ALL');
    fetchStats(defaultCBTD);
  };

  // Mở modal phân công CBTD
  const handleOpenAssignModal = (contract, customer) => {
    setAssignTarget({ contract, customer });
    setAssignCBTDUser(contract?.cbtdPhuTrach || customer?.cbtdPhuTrach || currentUser?.username || 'qtdyentho.cbtd');
    setAssignAllForCust(true);
    setShowAssignModal(true);
  };

  // Lưu phân công CBTD
  const handleSaveAssignment = async () => {
    if (!assignCBTDUser) {
      alert('Vui lòng chọn Cán bộ Tín dụng phụ trách!');
      return;
    }

    const selectedOfficer = cbtdOfficers.find(o => o.username === assignCBTDUser);
    const tenCBTD = selectedOfficer ? selectedOfficer.fullName : assignCBTDUser;

    setAssignLoading(true);
    try {
      const payload = {
        soHDTD: assignTarget?.contract?.soHDTD || '',
        maKH: assignTarget?.customer?.maKH || '',
        cbtdUsername: assignCBTDUser,
        tenCBTD: tenCBTD,
        assignAllForCustomer: assignAllForCust
      };

      const res = await api.assignContractCBTD(payload);
      if (res.status === 'success') {
        alert(res.message || 'Đã phân công cán bộ quản lý hợp đồng thành công!');
        setShowAssignModal(false);
        fetchCustomers(searchTerm, selectedCBTD, selectedStatus);
        fetchStats(selectedCBTD);
      } else {
        alert(res.message || 'Lỗi khi phân công cán bộ!');
      }
    } catch (e) {
      alert('Lỗi hệ thống: ' + e.message);
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. TOP STATS CARDS: DANH MỤC QUẢN LÝ CBTD */}
      <div className="row g-3">
        {/* Tổng Hợp Đồng */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card-modern p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>Tổng Hợp Đồng</span>
                <h3 className="fw-semibold text-primary m-0 mt-1 num-tabular font-heading fs-4">
                  {stats?.totalContracts ?? (loading ? '...' : 0)}
                </h3>
              </div>
              <div className="p-2 rounded-2 bg-primary-subtle text-primary">
                <Briefcase size={18} />
              </div>
            </div>
            <div className="d-flex gap-2 mt-2 pt-2 border-top small text-muted" style={{ fontSize: '0.75rem' }}>
              <span>Đang vay: <strong className="text-success">{stats?.activeContracts ?? 0}</strong></span>
              <span>•</span>
              <span>Tất toán: <strong className="text-secondary">{stats?.settledContracts ?? 0}</strong></span>
            </div>
          </div>
        </div>

        {/* Dư Nợ Đang Quản Lý */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card-modern p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>Dư Nợ Quản Lý</span>
                <h3 className="fw-semibold text-success m-0 mt-1 num-tabular font-heading fs-4">
                  {formatCurrencyVN(stats?.totalActivePrincipal ?? 0)}
                </h3>
              </div>
              <div className="p-2 rounded-2 bg-success-subtle text-success">
                <Landmark size={18} />
              </div>
            </div>
            <div className="small text-muted mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span>Doanh số vay: {formatCurrencyVN(stats?.totalOriginalLoan ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* Khách Hàng Phụ Trách */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card-modern p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>Thành Viên Quản Lý</span>
                <h3 className="fw-semibold text-info m-0 mt-1 num-tabular font-heading fs-4">
                  {stats?.totalCustomers ?? (loading ? '...' : 0)}
                </h3>
              </div>
              <div className="p-2 rounded-2 bg-info-subtle text-info">
                <UserCheck size={18} />
              </div>
            </div>
            <div className="small text-muted mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span>Thành viên hoạt động</span>
            </div>
          </div>
        </div>

        {/* HĐ Đã Tất Toán */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card-modern p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>Đã Tất Toán</span>
                <h3 className="fw-semibold text-secondary m-0 mt-1 num-tabular font-heading fs-4">
                  {stats?.settledContracts ?? (loading ? '...' : 0)}
                </h3>
              </div>
              <div className="p-2 rounded-2 bg-secondary-subtle text-secondary">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="small text-muted mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span>Sạch dư nợ Core</span>
            </div>
          </div>
        </div>

        {/* HĐ Sắp Đến Hạn */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card-modern p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>Đến Hạn (30 Ngày)</span>
                <h3 className="fw-semibold text-warning m-0 mt-1 num-tabular font-heading fs-4">
                  {stats?.dueIn30Days ?? 0}
                </h3>
              </div>
              <div className="p-2 rounded-2 bg-warning-subtle text-warning">
                <Clock size={18} />
              </div>
            </div>
            <div className="small text-muted mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span>Quá hạn: <strong className="text-danger">{stats?.pastDueContracts ?? 0} HĐ</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="card-modern p-3">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          {/* Ô tìm kiếm thông tin */}
          <div className="col-lg-5 col-md-12">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <Search size={18} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Nhập Mã KH, Họ Tên, CCCD (12 số), Số ĐT, Số HĐTD hoặc Thôn/Xã..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Bộ lọc CBTD Quản Lý */}
          <div className="col-lg-3 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light small fw-bold text-muted">
                <User size={14} className="me-1" /> CBTD
              </span>
              <select
                className="form-select fw-semibold"
                value={selectedCBTD}
                onChange={(e) => setSelectedCBTD(e.target.value)}
              >
                {!isCBTD && <option value="all">-- Toàn Bộ Cán Bộ --</option>}
                <option value="qtdyentho.cbtd">Lê Văn Tín (CBTD)</option>
                {cbtdOfficers
                  .filter(o => o.username !== 'qtdyentho.cbtd' && o.username !== 'admin')
                  .map(o => (
                    <option key={o.username} value={o.username}>
                      {o.fullName || o.username}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Bộ lọc Trạng Thái Hợp Đồng */}
          <div className="col-lg-2 col-md-3">
            <select
              className="form-select fw-semibold"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">Tất cả HĐ</option>
              <option value="DANG_VAY">Đang Vay (Active)</option>
              <option value="DA_TAT_TOAN">Đã Tất Toán (Settled)</option>
            </select>
          </div>

          {/* Nút bấm */}
          <div className="col-lg-2 col-md-3 d-flex gap-2">
            <button type="submit" className="btn btn-brand fw-semibold w-100" disabled={loading}>
              {loading ? 'Đang lọc...' : 'Tìm Kiếm'}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleResetFilters}
              title="Đặt lại bộ lọc"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* 3. MAIN 360 VIEW: DANH SÁCH BÊN TRÁI + HỒ SƠ & HỢP ĐỒNG BÊN PHẢI */}
      <div className="row g-3">
        {/* CỘT TRÁI: DANH SÁCH KHÁCH HÀNG */}
        <div className="col-lg-4">
          <div className="card-modern p-3" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold m-0 text-slate-700">
                Danh Sách Khách Hàng ({customers.length})
              </h6>
              {loading && <span className="spinner-border spinner-border-sm text-primary"></span>}
            </div>

            <div className="d-flex flex-column gap-2">
              {customers.map((c) => {
                const isSelected = selectedCustomer?.maKH === c.maKH;
                const activeContractCount = (c.contracts || []).filter(ct => ct.trangThaiHD === 'DANG_VAY' || ct.duNo > 0).length;
                const settledContractCount = (c.contracts || []).filter(ct => ct.trangThaiHD === 'DA_TAT_TOAN' || ct.duNo === 0).length;

                return (
                  <div
                    key={c.maKH}
                    onClick={() => setSelectedCustomer(c)}
                    className={`p-3 rounded-3 border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary-subtle shadow-sm'
                        : 'border-slate-200 bg-white hover-bg-light'
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
                    <div className="text-muted small mb-2 text-truncate">
                      <i className="fa-solid fa-location-dot me-1"></i> {c.diaChi}
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top border-slate-100 small">
                      <span className="text-primary fw-semibold" style={{ fontSize: '0.75rem' }}>
                        <i className="fa-solid fa-user-tie me-1"></i> {c.tenCBTD || 'Lê Văn Tín (CBTD)'}
                      </span>
                      <div className="d-flex gap-1">
                        {activeContractCount > 0 && (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            {activeContractCount} HĐ vay
                          </span>
                        )}
                        {settledContractCount > 0 && (
                          <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                            {settledContractCount} tất toán
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {customers.length === 0 && !loading && (
                <div className="text-center py-5 text-muted">
                  <User size={36} className="mb-2 opacity-50" />
                  <div>Không tìm thấy khách hàng nào phù hợp với bộ lọc.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: CHI TIẾT 360° & BẢNG HỢP ĐỒNG TÍN DỤNG */}
        <div className="col-lg-8">
          {selectedCustomer ? (
            <div className="d-flex flex-column gap-3">
              {/* Profile Card */}
              <div className="card-modern p-4">
                <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3 flex-wrap gap-2">
                  <div>
                    <h4 className="fw-bold text-primary m-0 d-flex align-items-center gap-2">
                      <User size={24} /> {selectedCustomer.hoTen}
                    </h4>
                    <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                      <span className="text-muted small">
                        Mã KH: <strong>{selectedCustomer.maKH}</strong> | Khu vực: {selectedCustomer.khuVuc}
                      </span>
                      <span className="badge bg-info-soft text-dark small">
                        <i className="fa-solid fa-user-tie me-1 text-primary"></i> CBTD: {selectedCustomer.tenCBTD || 'Lê Văn Tín (CBTD)'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      className="btn btn-sm btn-outline-info fw-semibold"
                      onClick={() => handleOpenAssignModal(null, selectedCustomer)}
                      title="Gán hoặc đổi Cán bộ Tín dụng quản lý khách hàng này"
                    >
                      <UserCog size={14} className="me-1" /> Phân Công CBTD
                    </button>
                    <button
                      className="btn btn-sm btn-outline-success fw-semibold"
                      onClick={() => onNavigateToAppraisal && onNavigateToAppraisal(selectedCustomer)}
                    >
                      <FileText size={14} className="me-1" /> Lập Thẩm Định
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary fw-semibold"
                      onClick={() => onNavigateToDebit && onNavigateToDebit(selectedCustomer)}
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
                        {selectedCustomer.cccd} ({formatDateVN(selectedCustomer.ngayCap)})
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-light rounded-3">
                      <span className="text-muted small d-block">Số Điện Thoại</span>
                      <span className="fw-bold text-dark">
                        {selectedCustomer.dienThoaiDD || selectedCustomer.dienThoai || '---'}
                      </span>
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
                      <span className="fw-bold text-dark">
                        {selectedCustomer.soSoCP || '---'} ({formatDateVN(selectedCustomer.ngayVaoTV)})
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-light rounded-3">
                      <span className="text-muted small d-block">Tổng Vốn Góp Cổ Phần</span>
                      <span className="fw-bold text-success num-tabular">
                        {formatCurrencyVN(selectedCustomer.tongTienCP)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Contracts Portfolio Table */}
              <div className="card-modern p-4">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <h5 className="fw-bold m-0 text-slate-800 d-flex align-items-center gap-2">
                    <Landmark size={20} className="text-primary" />
                    Danh Mục Hợp Đồng & Khế Ước Tín Dụng ({selectedCustomer.contracts?.length || 0})
                  </h5>
                  <span className="small text-muted">
                    Tự động đối soát tất toán với dữ liệu Core SQL Server
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="table table-custom align-middle">
                    <thead>
                      <tr>
                        <th>Số Khế Ước</th>
                        <th>Trạng Thái</th>
                        <th>CBTD Phụ Trách</th>
                        <th className="text-end">Tiền Vay</th>
                        <th className="text-end">Dư Nợ Hiện Tại</th>
                        <th className="text-center">Lãi Suất & Hạn Vay</th>
                        <th className="text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.contracts && selectedCustomer.contracts.length > 0 ? (
                        selectedCustomer.contracts.map((c) => {
                          const isSettled = c.trangThaiHD === 'DA_TAT_TOAN' || Number(c.duNo || 0) === 0;

                          return (
                            <tr key={c.soHDTD} className={isSettled ? 'table-light opacity-75' : ''}>
                              <td>
                                <span className="fw-bold text-primary font-monospace">{c.soHDTD}</span>
                                <div className="text-muted small">{c.moTaVay}</div>
                              </td>
                              <td>
                                {isSettled ? (
                                  <div>
                                    <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle fw-semibold">
                                      <CheckCircle2 size={12} className="me-1 inline" /> ĐÃ TẤT TOÁN
                                    </span>
                                    {c.ngayTatToan && (
                                      <div className="text-muted small mt-1" style={{ fontSize: '0.7rem' }}>
                                        Ngày: {formatDateVN(c.ngayTatToan)}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="badge bg-success-subtle text-success border border-success-subtle fw-semibold">
                                    <Clock size={12} className="me-1 inline" /> ĐANG VAY
                                  </span>
                                )}
                              </td>
                              <td>
                                <span className="small fw-semibold text-dark d-block">
                                  {c.tenCBTD || 'Lê Văn Tín (CBTD)'}
                                </span>
                                <span className="text-muted small" style={{ fontSize: '0.7rem' }}>
                                  ({c.cbtdPhuTrach || 'qtdyentho.cbtd'})
                                </span>
                              </td>
                              <td className="text-end fw-semibold num-tabular">{formatCurrencyVN(c.tienVay)}</td>
                              <td className="text-end fw-bold num-tabular">
                                {isSettled ? (
                                  <span className="text-secondary">0 ₫</span>
                                ) : (
                                  <span className="text-danger">{formatCurrencyVN(c.duNo)}</span>
                                )}
                              </td>
                              <td className="text-center small">
                                <span className="fw-semibold text-success">{c.laiSuat}%/năm</span> <br />
                                <span className="text-muted">
                                  {formatDateVN(c.ngayVay)} - {formatDateVN(c.denHan)}
                                </span>
                              </td>
                              <td className="text-center">
                                <div className="d-flex justify-content-center gap-1">
                                  {!isSettled && (
                                    <button
                                      className="btn btn-xs btn-outline-warning fw-semibold p-1 px-2"
                                      onClick={() => onNavigateToInspection && onNavigateToInspection(selectedCustomer, c)}
                                      title="Lập biên bản kiểm tra sử dụng vốn"
                                    >
                                      <ShieldCheck size={14} className="me-1 inline" /> KT Vốn
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-xs btn-outline-secondary p-1 px-2"
                                    onClick={() => handleOpenAssignModal(c, selectedCustomer)}
                                    title="Chuyển giao CBTD quản lý hợp đồng"
                                  >
                                    <UserCog size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center text-muted py-4">
                            Khách hàng này hiện không có khế ước vay nào phù hợp với bộ lọc.
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
              <User size={48} className="mb-3 opacity-25" />
              <h5 className="fw-semibold">Chưa Chọn Khách Hàng</h5>
              <p className="small mb-0">Vui lòng chọn hoặc tìm kiếm khách hàng ở cột bên trái để xem hồ sơ và hợp đồng tín dụng.</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL PHÂN CÔNG / CHUYỂN GIAO CÁN BỘ TÍN DỤNG */}
      {showAssignModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-brand text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <UserCog size={20} /> Phân Công Cán Bộ Tín Dụng Quản Lý
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAssignModal(false)}
                />
              </div>

              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">Khách Hàng</label>
                  <div className="p-2 bg-light rounded-3 fw-bold text-dark">
                    {assignTarget?.customer?.hoTen} ({assignTarget?.customer?.maKH})
                  </div>
                </div>

                {assignTarget?.contract && (
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Số Hợp Đồng / Khế Ước</label>
                    <div className="p-2 bg-light rounded-3 font-monospace fw-bold text-primary">
                      {assignTarget.contract.soHDTD} - {formatCurrencyVN(assignTarget.contract.duNo || assignTarget.contract.tienVay)}
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">
                    Chọn Cán Bộ Tín Dụng Phụ Trách <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select fw-semibold"
                    value={assignCBTDUser}
                    onChange={(e) => setAssignCBTDUser(e.target.value)}
                  >
                    <option value="qtdyentho.cbtd">Lê Văn Tín (CBTD)</option>
                    {cbtdOfficers
                      .filter(o => o.username !== 'qtdyentho.cbtd' && o.username !== 'admin')
                      .map(o => (
                        <option key={o.username} value={o.username}>
                          {o.fullName || o.username}
                        </option>
                      ))}
                  </select>
                  <div className="form-text small text-muted mt-1">
                    Cán bộ được phân công sẽ phụ trách theo dõi hợp đồng, thẩm định và đôn đốc thu hồi nợ.
                  </div>
                </div>

                <div className="form-check p-3 bg-light rounded-3 mb-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="assignAllCheck"
                    checked={assignAllForCust}
                    onChange={(e) => setAssignAllForCust(e.target.checked)}
                  />
                  <label className="form-check-label small fw-semibold text-dark" htmlFor="assignAllCheck">
                    Áp dụng cho toàn bộ Hợp đồng của khách hàng này
                  </label>
                </div>
              </div>

              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAssignModal(false)}
                  disabled={assignLoading}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  className="btn btn-brand fw-semibold"
                  onClick={handleSaveAssignment}
                  disabled={assignLoading}
                >
                  {assignLoading ? 'Đang lưu...' : 'Xác Nhận Phân Công'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
