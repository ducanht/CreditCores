import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Zap,
  Plus,
  Play,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertCircle,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { formatDateVN, formatDateTimeVN, formatCurrencyVN } from '../utils/dateUtils';
import Pagination from './Pagination';
import DebitBatchCreateModal from './modals/DebitBatchCreateModal';
import DebitRegisterModal from './modals/DebitRegisterModal';
import DebitBatchDetailModal from './modals/DebitBatchDetailModal';

export default function DebitManager({ prefilledCustomer, onOpenCustomerQuickView }) {
  const [activeSubTab, setActiveSubTab] = useState('register'); // 'register' | 'batch'
  const [registrations, setRegistrations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [allContracts, setAllContracts] = useState([]);
  const [debtWarnings, setDebtWarnings] = useState([]);

  const [showRegModal, setShowRegModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedBatchDetail, setSelectedBatchDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search for Registrations
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKyTrich, setFilterKyTrich] = useState('ALL');
  const [filterTrangThai, setFilterTrangThai] = useState('ALL');

  // Pagination states
  const [regPage, setRegPage] = useState(1);
  const [regPageSize, setRegPageSize] = useState(15);
  const [batchPage, setBatchPage] = useState(1);
  const [batchPageSize, setBatchPageSize] = useState(15);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resReg, resBatch, resCust, resWarn] = await Promise.all([
        api.getDebitRegistrations(),
        api.getDebitBatches(),
        api.searchCustomer360(''),
        api.getDebtWarnings()
      ]);

      if (resReg.status === 'success' && resReg.data) setRegistrations(resReg.data);
      if (resBatch.status === 'success' && resBatch.data) setBatches(resBatch.data);
      if (resCust.status === 'success' && resCust.data) {
        const custList = Array.isArray(resCust.data) ? resCust.data : (resCust.data.customers || []);
        const contractsList = [];
        custList.forEach(c => {
          (c.contracts || []).forEach(ct => {
            contractsList.push({
              ...ct,
              maKH: c.maKH,
              hoTen: c.hoTen,
              cccd: c.cccd,
              dienThoai: c.dienThoaiDD || c.dienThoai,
              soTK: c.soTK,
              diaChi: c.diaChi
            });
          });
        });
        setAllCustomers(custList);
        setAllContracts(contractsList);
      }
      if (resWarn.status === 'success' && resWarn.data) setDebtWarnings(resWarn.data);
    } catch (e) {
      console.error('Lỗi nạp dữ liệu trích nợ:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (prefilledCustomer) {
      setShowRegModal(true);
    }
  }, [prefilledCustomer]);

  const handleSaveRegisterSubmit = async (formData) => {
    try {
      const res = await api.saveDebitRegister(formData);
      if (res.status === 'success') {
        alert('Đăng ký dịch vụ trích nợ tự động thành công!');
        setShowRegModal(false);
        fetchData();
      } else {
        alert('Lỗi: ' + res.message);
      }
    } catch (err) {
      alert('Lỗi hệ thống: ' + err.message);
    }
  };

  const handleCreateBatchSubmit = async (batchPayload) => {
    try {
      const res = await api.createDebitBatch(batchPayload);
      if (res.status === 'success') {
        alert(res.message || 'Khởi tạo đợt trích nợ thành công!');
        setShowBatchModal(false);
        setActiveSubTab('batch');
        fetchData();
      } else {
        alert('Lỗi: ' + res.message);
      }
    } catch (err) {
      alert('Lỗi hệ thống: ' + err.message);
    }
  };

  // Filtered & Paginated Registrations
  const filteredRegs = registrations.filter((r) => {
    const matchSearch =
      !searchTerm ||
      r.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.maKH?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.soTK?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.gttt?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchKy = filterKyTrich === 'ALL' || Number(r.kyTrich) === Number(filterKyTrich);
    const matchStatus = filterTrangThai === 'ALL' || r.trangThai === filterTrangThai;
    return matchSearch && matchKy && matchStatus;
  });

  const paginatedRegs = filteredRegs.slice((regPage - 1) * regPageSize, regPage * regPageSize);

  // Paginated Batches
  const paginatedBatches = batches.slice((batchPage - 1) * batchPageSize, batchPage * batchPageSize);

  return (
    <div className="d-flex flex-column gap-4">
      {/* Sub-tab Switcher & Actions */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="btn-group p-1 bg-light rounded-3 border">
          <button
            type="button"
            className={`btn btn-sm ${activeSubTab === 'register' ? 'btn-brand fw-bold shadow-sm' : 'btn-light text-muted'}`}
            onClick={() => setActiveSubTab('register')}
          >
            <UserCheck size={14} className="me-1" /> Danh Sách Đăng Ký Trích Nợ ({registrations.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeSubTab === 'batch' ? 'btn-brand fw-bold shadow-sm' : 'btn-light text-muted'}`}
            onClick={() => setActiveSubTab('batch')}
          >
            <Zap size={14} className="me-1" /> Quản Lý Đợt Trích Nợ Định Kỳ ({batches.length})
          </button>
        </div>

        <div className="d-flex gap-2">
          {activeSubTab === 'register' ? (
            <button
              className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
              onClick={() => setShowRegModal(true)}
            >
              <Plus size={15} /> Đăng Ký Mới
            </button>
          ) : (
            <button
              className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
              onClick={() => setShowBatchModal(true)}
            >
              <Play size={15} /> Khởi Tạo Đợt Trích Nợ Mới
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: DANH SÁCH ĐĂNG KÝ TRÍCH NỢ */}
      {activeSubTab === 'register' && (
        <div className="card-modern p-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h6 className="fw-bold text-slate-800 m-0 font-heading">
              Danh Sách Khách Hàng Ủy Quyền Trích Nợ Tự Động ({filteredRegs.length})
            </h6>

            <div className="d-flex align-items-center flex-wrap gap-2">
              <select
                className="form-select form-select-sm"
                style={{ width: 140 }}
                value={filterKyTrich}
                onChange={(e) => {
                  setFilterKyTrich(e.target.value);
                  setRegPage(1);
                }}
              >
                <option value="ALL">Tất cả Kỳ</option>
                <option value="1">Kỳ 1 (Ngày 05)</option>
                <option value="2">Kỳ 2 (Ngày 15)</option>
                <option value="3">Kỳ 3 (Ngày 25)</option>
              </select>

              <select
                className="form-select form-select-sm"
                style={{ width: 150 }}
                value={filterTrangThai}
                onChange={(e) => {
                  setFilterTrangThai(e.target.value);
                  setRegPage(1);
                }}
              >
                <option value="ALL">Tất cả Trạng thái</option>
                <option value="Hiệu lực">Hiệu lực</option>
                <option value="Tạm ngưng">Tạm ngưng</option>
              </select>

              <div className="input-group input-group-sm" style={{ width: 220 }}>
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Tìm Tên, Mã KH, Số TK..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setRegPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-custom align-middle">
              <thead>
                <tr>
                  <th>Mã Khách Hàng</th>
                  <th>Họ Và Tên</th>
                  <th>Số CCCD</th>
                  <th>Số TK CASA</th>
                  <th>Địa Chỉ</th>
                  <th className="text-center">Kỳ Trích</th>
                  <th className="text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRegs.length > 0 ? (
                  paginatedRegs.map((r, idx) => (
                    <tr key={idx}>
                      <td>
                        <div
                          className="customer-click-link font-monospace fw-bold"
                          onClick={() => onOpenCustomerQuickView && onOpenCustomerQuickView(r)}
                          title="Xem chi tiết khách hàng"
                        >
                          {r.maKH}
                        </div>
                      </td>
                      <td className="fw-semibold text-dark">{r.hoTen}</td>
                      <td className="font-monospace text-muted">{r.gttt}</td>
                      <td className="font-monospace fw-semibold text-success">{r.soTK}</td>
                      <td className="small text-muted">{r.diaChi}</td>
                      <td className="text-center">
                        <span className="badge bg-primary-subtle text-primary">Kỳ {r.kyTrich}</span>
                      </td>
                      <td className="text-center">
                        <span className={`badge-status ${r.trangThai === 'Hiệu lực' || r.trangThai === 'Hieu luc' ? 'badge-success-soft' : 'badge-warning-soft'}`}>
                          {r.trangThai}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      {loading ? 'Đang tải dữ liệu...' : 'Không có dữ liệu đăng ký trích nợ phù hợp.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={regPage}
            totalItems={filteredRegs.length}
            pageSize={regPageSize}
            onPageChange={setRegPage}
            onPageSizeChange={setRegPageSize}
          />
        </div>
      )}

      {/* SUB-TAB 2: QUẢN LÝ ĐỢT TRÍCH NỢ ĐỊNH KỲ */}
      {activeSubTab === 'batch' && (
        <div className="card-modern p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold text-slate-800 m-0 font-heading">
              Sổ Theo Dõi Các Đợt Trích Nợ Định Kỳ ({batches.length})
            </h6>
          </div>

          <div className="table-responsive">
            <table className="table table-custom align-middle">
              <thead>
                <tr>
                  <th>Mã Đợt Trích Nợ</th>
                  <th>Tháng / Năm</th>
                  <th className="text-center">Kỳ Trích</th>
                  <th className="text-end">Phải Thu</th>
                  <th className="text-end">Đã Trích</th>
                  <th className="text-end">Còn Nợ</th>
                  <th className="text-center">Trạng Thái</th>
                  <th>Thời Gian Tạo</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBatches.length > 0 ? (
                  paginatedBatches.map((b, idx) => (
                    <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => setSelectedBatchDetail(b)}>
                      <td className="fw-bold font-monospace">
                        <button
                          type="button"
                          className="btn btn-link p-0 fw-bold font-monospace text-decoration-none text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBatchDetail(b);
                          }}
                        >
                          {b.maDot}
                        </button>
                      </td>
                      <td>{b.thangNam}</td>
                      <td className="text-center">
                        <span className="badge bg-secondary-subtle text-secondary">Kỳ {b.kyTrich}</span>
                      </td>
                      <td className="text-end fw-semibold num-tabular">{formatCurrencyVN(b.tongPhaiThu)}</td>
                      <td className="text-end text-success fw-bold num-tabular">{formatCurrencyVN(b.tongDaTrich)}</td>
                      <td className="text-end text-danger fw-bold num-tabular">{formatCurrencyVN(b.tongConNo)}</td>
                      <td className="text-center">
                        <span className="badge-status badge-success-soft">{b.trangThai}</span>
                      </td>
                      <td className="small text-muted">{b.ngayTao || '---'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      {loading ? 'Đang tải dữ liệu...' : 'Chưa có đợt trích nợ nào được khởi tạo.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={batchPage}
            totalItems={batches.length}
            pageSize={batchPageSize}
            onPageChange={setBatchPage}
            onPageSizeChange={setBatchPageSize}
          />
        </div>
      )}

      {/* EXTRACTED MODALS */}
      <DebitRegisterModal
        show={showRegModal}
        onClose={() => setShowRegModal(false)}
        onSubmit={handleSaveRegisterSubmit}
        prefilledCustomer={prefilledCustomer}
        allCustomers={allCustomers}
        allContracts={allContracts}
      />

      <DebitBatchCreateModal
        show={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onSubmit={handleCreateBatchSubmit}
        registrations={registrations}
        contracts={allContracts}
        debtWarnings={debtWarnings}
      />

      <DebitBatchDetailModal
        show={!!selectedBatchDetail}
        onClose={() => setSelectedBatchDetail(null)}
        batch={selectedBatchDetail}
        onOpenCustomerQuickView={onOpenCustomerQuickView}
      />
    </div>
  );
}
