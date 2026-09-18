import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Zap,
  Plus,
  Play,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { SegControl } from './shared';
import { DebitRegisterTable, DebitBatchTable } from './debit';
import DebitBatchCreateModal from './modals/DebitBatchCreateModal';
import DebitRegisterModal from './modals/DebitRegisterModal';
import DebitBatchDetailModal from './modals/DebitBatchDetailModal';

export default function DebitManager({ initialSubTab = 'register', prefilledCustomer, onOpenCustomerQuickView }) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || 'register');
  const [registrations, setRegistrations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [allContracts, setAllContracts] = useState([]);
  const [debtWarnings, setDebtWarnings] = useState([]);

  const [showRegModal, setShowRegModal] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resReg, resBatch, resCust, resWarn] = await Promise.all([
        api.getDebitRegistrations(true),
        api.getDebitBatches(true),
        api.searchCustomer360({ query: '', limit: 1000 }),
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
              cccd: c.cccd || c.gttt,
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
      setEditingRegistration(null);
      setShowRegModal(true);
    }
  }, [prefilledCustomer]);

  const handleSaveRegisterSubmit = async (formData) => {
    try {
      let res;
      if (editingRegistration) {
        res = await api.updateDebitRegister(formData);
      } else {
        res = await api.saveDebitRegister(formData);
      }
      if (res.status === 'success') {
        alert(res.message || 'Lưu thỏa thuận trích nợ tự động thành công!');
        setShowRegModal(false);
        setEditingRegistration(null);
        fetchData();
      } else {
        alert('Lỗi: ' + res.message);
      }
    } catch (err) {
      alert('Lỗi hệ thống: ' + err.message);
    }
  };

  const handleBatchRegisterSubmit = async (batchPayload) => {
    try {
      const res = await api.saveBatchDebitRegister(batchPayload);
      if (res.status === 'success') {
        alert(res.message || 'Đăng ký thỏa thuận trích nợ tự động hàng loạt thành công!');
        setShowRegModal(false);
        setEditingRegistration(null);
        fetchData();
      } else {
        alert('Lỗi: ' + res.message);
      }
    } catch (err) {
      alert('Lỗi hệ thống: ' + err.message);
    }
  };

  const handleToggleStatus = async (r) => {
    const isCurrentActive = r.trangThai === 'Hiệu lực' || r.trangThai === 'Hieu luc';
    const nextStatus = isCurrentActive ? 'Tạm ngưng' : 'Hiệu lực';
    if (!window.confirm(`Xác nhận chuyển trạng thái thỏa thuận của khách hàng "${r.hoTen}" sang "${nextStatus}"?`)) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.toggleDebitRegisterStatus({ maKH: r.maKH, newStatus: nextStatus });
      if (res.status === 'success') {
        fetchData();
      } else {
        alert('Lỗi: ' + res.message);
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRegister = async (r) => {
    if (!window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA thỏa thuận trích nợ của khách hàng "${r.hoTen}" (Mã: ${r.maKH}) khỏi hệ thống?`)) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.deleteDebitRegister({ maKH: r.maKH });
      if (res.status === 'success') {
        fetchData();
      } else {
        alert('Lỗi: ' + res.message);
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      setActionLoading(false);
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
  const paginatedBatches = batches.slice((batchPage - 1) * batchPageSize, batchPage * batchPageSize);

  const subTabOptions = [
    { id: 'register', label: 'Danh Sách Đăng Ký Trích Nợ', icon: UserCheck, count: registrations.length },
    { id: 'batch', label: 'Quản Lý Đợt Trích Nợ Định Kỳ', icon: Zap, count: batches.length }
  ];

  return (
    <div className="d-flex flex-column gap-3">
      {/* Sub-tab Switcher & Actions Header */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <SegControl
          options={subTabOptions}
          value={activeSubTab}
          onChange={setActiveSubTab}
        />

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={fetchData}
            disabled={loading}
            title="Tải lại dữ liệu từ Google Sheets"
          >
            <RefreshCw size={13} className={loading ? 'fa-spin' : ''} />
            <span className="d-none d-sm-inline">Tải lại</span>
          </button>

          {activeSubTab === 'register' ? (
            <button
              className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
              onClick={() => {
                setEditingRegistration(null);
                setShowRegModal(true);
              }}
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
        <DebitRegisterTable
          registrations={registrations}
          filteredRegs={filteredRegs}
          paginatedRegs={paginatedRegs}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterKyTrich={filterKyTrich}
          setFilterKyTrich={setFilterKyTrich}
          filterTrangThai={filterTrangThai}
          setFilterTrangThai={setFilterTrangThai}
          regPage={regPage}
          setRegPage={setRegPage}
          regPageSize={regPageSize}
          setRegPageSize={setRegPageSize}
          actionLoading={actionLoading}
          loading={loading}
          onOpenCustomerQuickView={onOpenCustomerQuickView}
          onEditRegistration={(r) => {
            setEditingRegistration(r);
            setShowRegModal(true);
          }}
          onToggleStatus={handleToggleStatus}
          onDeleteRegistration={handleDeleteRegister}
        />
      )}

      {/* SUB-TAB 2: QUẢN LÝ ĐỢT TRÍCH NỢ ĐỊNH KỲ */}
      {activeSubTab === 'batch' && (
        <DebitBatchTable
          batches={batches}
          paginatedBatches={paginatedBatches}
          batchPage={batchPage}
          setBatchPage={setBatchPage}
          batchPageSize={batchPageSize}
          setBatchPageSize={setBatchPageSize}
          loading={loading}
          onSelectBatchDetail={setSelectedBatchDetail}
          onOpenCreateBatch={() => setShowBatchModal(true)}
        />
      )}

      {/* EXTRACTED MODALS */}
      <DebitRegisterModal
        show={showRegModal}
        onClose={() => {
          setShowRegModal(false);
          setEditingRegistration(null);
        }}
        onSubmit={handleSaveRegisterSubmit}
        onBatchSubmit={handleBatchRegisterSubmit}
        editingItem={editingRegistration}
        prefilledCustomer={prefilledCustomer}
        allCustomers={allCustomers}
        allContracts={allContracts}
        registrations={registrations}
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
