import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Zap,
  Plus,
  Play,
  FileSpreadsheet,
  Search,
  FileText,
  Calendar,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  CheckSquare,
  Square,
  Edit3,
  Filter,
  DollarSign,
  Users
} from 'lucide-react';
import { api } from '../services/api';
import { formatDateVN, formatDateTimeVN, formatCurrencyVN } from '../utils/dateUtils';
import ThousandInput from './ThousandInput';
import Pagination from './Pagination';

export default function DebitManager({ prefilledCustomer, onOpenCustomerQuickView }) {
  const [activeSubTab, setActiveSubTab] = useState('register'); // 'register' | 'batch'
  const [registrations, setRegistrations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [saving, setSaving] = useState(false);
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

  // Form Registration State
  const [regForm, setRegForm] = useState({
    maKH: '',
    hoTen: '',
    gttt: '',
    diaChi: '',
    soTK: '',
    kyTrich: 1,
    trangThai: 'Hiệu lực',
    ghiChu: 'Ủy quyền trích nợ tự động tài khoản CASA'
  });

  // Matched Customer & Active Contracts State
  const [matchedCustomer, setMatchedCustomer] = useState(null);
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  // --- ADVANCED BATCH CREATION WORKFLOW STATE ---
  const [batchForm, setBatchForm] = useState({
    thangNam: '202608',
    kyTrich: 1
  });
  const [batchStep, setBatchStep] = useState(1); // 1: Setup Period -> 2: Select & Edit Amounts
  const [batchCandidateList, setBatchCandidateList] = useState([]);
  const [batchLoadingCandidates, setBatchLoadingCandidates] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resReg, resBatch] = await Promise.all([
        api.getDebitRegistrations(),
        api.getDebitBatches()
      ]);
      if (resReg.status === 'success' && resReg.data) setRegistrations(resReg.data);
      if (resBatch.status === 'success' && resBatch.data) setBatches(resBatch.data);
    } catch (e) {
      console.error('Lỗi nạp dữ liệu trích nợ:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý khi có khách hàng được truyền sẵn từ 360°
  useEffect(() => {
    if (prefilledCustomer) {
      setMatchedCustomer(prefilledCustomer);
      setRegForm({
        maKH: prefilledCustomer.maKH || '',
        hoTen: prefilledCustomer.hoTen || '',
        gttt: prefilledCustomer.cccd || '',
        diaChi: prefilledCustomer.diaChi || '',
        soTK: prefilledCustomer.soTK || '3500205556677',
        kyTrich: 1,
        trangThai: 'Hiệu lực',
        ghiChu: 'Ủy quyền trích nợ tự động tài khoản CASA'
      });
      setActiveSubTab('register');
      setShowRegModal(true);
    }
  }, [prefilledCustomer]);

  // Tra cứu thời gian thực khi nhập Mã KH
  const handleMaKHChange = async (val) => {
    const inputVal = val.trim();
    setRegForm(prev => ({ ...prev, maKH: val }));

    if (inputVal.length >= 4) {
      setSearchingCustomer(true);
      try {
        const res = await api.searchCustomer360(inputVal);
        if (res.status === 'success' && res.data && res.data.length > 0) {
          const cust = res.data[0];
          setMatchedCustomer(cust);
          setRegForm(prev => ({
            ...prev,
            hoTen: cust.hoTen || prev.hoTen,
            gttt: cust.cccd || prev.gttt,
            diaChi: cust.diaChi || prev.diaChi,
            soTK: cust.soTK || prev.soTK || '3500205123456'
          }));
        } else {
          setMatchedCustomer(null);
        }
      } catch (e) {
        console.error('Lỗi tra cứu khách hàng:', e);
      } finally {
        setSearchingCustomer(false);
      }
    } else {
      setMatchedCustomer(null);
    }
  };

  const handleSaveRegister = async (e) => {
    if (e) e.preventDefault();
    if (!regForm.maKH || !regForm.hoTen || !regForm.soTK) {
      alert('Vui lòng nhập đầy đủ Mã KH, Họ tên và Số tài khoản trích nợ.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.saveDebitRegister(regForm);
      if (res.status === 'success') {
        alert(res.message || 'Đăng ký trích nợ thành công!');
        setShowRegModal(false);
        fetchData();
      } else {
        alert(res.message || 'Lỗi đăng ký trích nợ.');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- LOGIC BATCH CREATION NÂNG CAO ---
  // Bước 1: Nạp danh sách khách hàng đã đăng ký cho kỳ được chọn
  const handleLoadCandidatesForBatch = async () => {
    setBatchLoadingCandidates(true);
    try {
      // Lọc các khách hàng đã đăng ký đúng kỳ trích này và đang có hiệu lực
      const targetKy = Number(batchForm.kyTrich);
      const eligibleRegs = registrations.filter(
        r => Number(r.kyTrich) === targetKy && (r.trangThai === 'Hiệu lực' || !r.trangThai)
      );

      // Lấy thêm thông tin hợp đồng và số tiền nợ dự tính
      const statsRes = await api.getDashboardStats();
      const allContracts = statsRes?.data?.activeContracts || [];

      const candidates = eligibleRegs.map(reg => {
        // Tìm hợp đồng của KH
        const custContracts = allContracts.filter(c => c.maKH === reg.maKH);
        const totalDuNo = custContracts.reduce((sum, c) => sum + (c.duNo || 0), 0);
        
        // Tính toán mẫu tiền lãi và gốc dự kiến
        const noTon = 0; // Nợ tồn kỳ trước
        const laiPhatSinh = Math.round((totalDuNo * 0.095) / 12); // Lãi 1 tháng (ước tính 9.5%/năm)
        const gocDenHan = 0; // Gốc đến hạn kỳ này
        const tongDuKien = noTon + laiPhatSinh + gocDenHan;

        return {
          selected: true, // Mặc định chọn tất cả
          maKH: reg.maKH,
          hoTen: reg.hoTen,
          gttt: reg.gttt,
          soTK: reg.soTK,
          diaChi: reg.diaChi,
          soHDTD: custContracts.map(c => c.soHDTD).join(', ') || 'HD-TD-AUTO',
          tongDuNo: totalDuNo,
          noTon: noTon,
          laiPhatSinh: laiPhatSinh,
          gocDenHan: gocDenHan,
          soTienTrich: tongDuKien > 0 ? tongDuKien : 500000, // Số tiền trích nợ (CHO PHÉP CHỈNH SỬA)
          ghiChu: `Trích lãi & gốc kỳ ${targetKy} tháng ${batchForm.thangNam}`
        };
      });

      setBatchCandidateList(candidates);
      setBatchStep(2);
    } catch (e) {
      console.error('Lỗi nạp danh sách khách hàng trích nợ:', e);
      alert('Không thể nạp danh sách khách hàng: ' + e.message);
    } finally {
      setBatchLoadingCandidates(false);
    }
  };

  // Toggle chọn / bỏ chọn tất cả
  const handleToggleSelectAll = (checked) => {
    setBatchCandidateList(prev => prev.map(item => ({ ...item, selected: checked })));
  };

  // Toggle chọn từng người
  const handleToggleCandidate = (index, checked) => {
    setBatchCandidateList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], selected: checked };
      return copy;
    });
  };

  // Chỉnh sửa số tiền trích nợ trực tiếp của từng người
  const handleCandidateAmountChange = (index, newAmount) => {
    setBatchCandidateList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], soTienTrich: newAmount };
      return copy;
    });
  };

  // Xác nhận tạo đợt trích nợ
  const handleConfirmCreateBatch = async () => {
    const selectedList = batchCandidateList.filter(c => c.selected);
    if (selectedList.length === 0) {
      alert('Vui lòng chọn ít nhất 1 khách hàng để khởi tạo đợt trích nợ.');
      return;
    }

    const tongTien = selectedList.reduce((sum, c) => sum + (c.soTienTrich || 0), 0);

    setSaving(true);
    try {
      const payload = {
        thangNam: batchForm.thangNam,
        kyTrich: Number(batchForm.kyTrich),
        tongPhaiThu: tongTien,
        chiTietDanhSach: selectedList
      };

      const res = await api.createDebitBatch(payload);
      if (res.status === 'success') {
        alert(res.message || `Khởi tạo đợt trích nợ thành công cho ${selectedList.length} khách hàng!`);
        setShowBatchModal(false);
        setBatchStep(1);
        fetchData();
      } else {
        alert(res.message || 'Lỗi khởi tạo đợt.');
      }
    } catch (err) {
      alert('Lỗi khởi tạo đợt: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCoreFile = (batch) => {
    alert(`Đang kết xuất tệp lệnh trích nợ Excel cho đợt ${batch.maDot} (Định dạng CoreBanking)...`);
  };

  // --- LỌC VÀ PHÂN TRANG DANH SÁCH ĐĂNG KÝ ---
  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = !searchTerm ||
      r.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.maKH?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.soTK?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.gttt?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesKy = filterKyTrich === 'ALL' || Number(r.kyTrich) === Number(filterKyTrich);
    const matchesTrangThai = filterTrangThai === 'ALL' || r.trangThai === filterTrangThai;

    return matchesSearch && matchesKy && matchesTrangThai;
  });

  const paginatedRegistrations = filteredRegistrations.slice(
    (regPage - 1) * regPageSize,
    regPage * regPageSize
  );

  // Phân trang danh sách Đợt trích nợ
  const paginatedBatches = batches.slice(
    (batchPage - 1) * batchPageSize,
    batchPage * batchPageSize
  );

  // Thống kê danh sách được chọn trong modal batch
  const selectedCount = batchCandidateList.filter(c => c.selected).length;
  const selectedTotalAmount = batchCandidateList
    .filter(c => c.selected)
    .reduce((sum, c) => sum + (c.soTienTrich || 0), 0);
  const isAllSelected = batchCandidateList.length > 0 && selectedCount === batchCandidateList.length;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Sub Tabs Navigation */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="btn-group p-1 bg-light rounded-3 border">
          <button
            className={`btn btn-sm fw-bold d-flex align-items-center gap-2 ${
              activeSubTab === 'register' ? 'btn-brand shadow-sm' : 'btn-light text-muted'
            }`}
            onClick={() => setActiveSubTab('register')}
          >
            <UserCheck size={16} /> Danh Sách Đăng Ký Trích Nợ ({registrations.length})
          </button>
          <button
            className={`btn btn-sm fw-bold d-flex align-items-center gap-2 ${
              activeSubTab === 'batch' ? 'btn-brand shadow-sm' : 'btn-light text-muted'
            }`}
            onClick={() => setActiveSubTab('batch')}
          >
            <Zap size={16} /> Quản Lý & Khởi Tạo Đợt Trích Nợ ({batches.length})
          </button>
        </div>

        {activeSubTab === 'register' && (
          <div className="d-flex align-items-center flex-wrap gap-2">
            {/* Bộ lọc theo Kỳ */}
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

            {/* Bộ lọc theo Trạng thái */}
            <select
              className="form-select form-select-sm"
              style={{ width: 130 }}
              value={filterTrangThai}
              onChange={(e) => {
                setFilterTrangThai(e.target.value);
                setRegPage(1);
              }}
            >
              <option value="ALL">Tất cả Trạng thái</option>
              <option value="Hiệu lực">Hiệu lực</option>
              <option value="Tạm dừng">Tạm dừng</option>
              <option value="Hủy bỏ">Hủy bỏ</option>
            </select>

            {/* Ô tìm kiếm nhanh */}
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

            <button
              className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
              onClick={() => {
                setMatchedCustomer(null);
                setRegForm({
                  maKH: '',
                  hoTen: '',
                  gttt: '',
                  diaChi: '',
                  soTK: '',
                  kyTrich: 1,
                  trangThai: 'Hiệu lực',
                  ghiChu: 'Ủy quyền trích nợ tự động tài khoản CASA'
                });
                setShowRegModal(true);
              }}
            >
              <Plus size={16} /> Đăng Ký Mới
            </button>
          </div>
        )}

        {activeSubTab === 'batch' && (
          <button
            className="btn btn-warning text-dark btn-sm fw-bold d-flex align-items-center gap-2 shadow-sm"
            onClick={() => {
              setBatchStep(1);
              setShowBatchModal(true);
            }}
          >
            <Play size={16} /> Khởi Tạo Đợt Trích Nợ Mới
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: DANH SÁCH ĐĂNG KÝ TRÍCH NỢ */}
      {/* ========================================================================= */}
      {activeSubTab === 'register' && (
        <div className="card-modern p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold m-0 text-slate-800 font-heading d-flex align-items-center gap-2">
              <UserCheck size={20} className="text-success" /> Thỏa Thuận Ủy Quyền Trích Nợ Tự Động (Auto-Debit)
            </h5>
            <span className="badge bg-light text-muted border">
              Tổng cộng: {filteredRegistrations.length} khách hàng
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-custom align-middle">
              <thead>
                <tr>
                  <th>Mã Khách Hàng</th>
                  <th>Họ và Tên</th>
                  <th>Số CCCD / GTTT</th>
                  <th>Số Tài Khoản CASA</th>
                  <th>Địa Chỉ</th>
                  <th className="text-center">Kỳ Trích</th>
                  <th className="text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRegistrations.length > 0 ? (
                  paginatedRegistrations.map((r, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="fw-bold font-monospace text-primary">{r.maKH}</span>
                      </td>
                      <td>
                        <div
                          className="customer-click-link"
                          onClick={() => {
                            if (onOpenCustomerQuickView) {
                              onOpenCustomerQuickView({
                                maKH: r.maKH,
                                hoTen: r.hoTen,
                                cccd: r.gttt,
                                diaChi: r.diaChi,
                                soTK: r.soTK
                              });
                            }
                          }}
                          title="Xem nhanh thông tin 360° khách hàng này"
                        >
                          {r.hoTen}
                        </div>
                      </td>
                      <td className="font-monospace small">{r.gttt}</td>
                      <td>
                        <span className="fw-bold text-success font-monospace">{r.soTK}</span>
                      </td>
                      <td className="text-muted small">{r.diaChi}</td>
                      <td className="text-center">
                        <span className="badge bg-primary-subtle text-primary fw-bold">
                          Kỳ {r.kyTrich} (Ngày {r.kyTrich === 1 ? '05' : r.kyTrich === 2 ? '15' : '25'})
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge-status badge-success-soft">{r.trangThai || 'Hiệu lực'}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      {loading ? 'Đang tải danh sách đăng ký trích nợ...' : 'Không tìm thấy khách hàng nào phù hợp.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang chuẩn 15 dòng */}
          <Pagination
            currentPage={regPage}
            totalItems={filteredRegistrations.length}
            pageSize={regPageSize}
            onPageChange={setRegPage}
            onPageSizeChange={setRegPageSize}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: QUẢN LÝ ĐỢT TRÍCH NỢ */}
      {/* ========================================================================= */}
      {activeSubTab === 'batch' && (
        <div className="card-modern p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold m-0 text-slate-800 font-heading d-flex align-items-center gap-2">
                <Zap size={20} className="text-warning" /> Các Đợt Thu Nợ & Trích Nợ Tự Động Định Kỳ
              </h5>
              <span className="text-muted small">
                Tự động tính toán tổng số tiền: Nợ tồn kỳ trước + Lãi phát sinh + Gốc đến hạn
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-custom align-middle">
              <thead>
                <tr>
                  <th>Mã Đợt Trích</th>
                  <th>Kỳ Trích / Tháng</th>
                  <th className="text-end">Tổng Phải Thu</th>
                  <th className="text-end">Đã Trích Thành Công</th>
                  <th className="text-end">Nợ Tồn Còn Lại</th>
                  <th className="text-center">Trạng Thái</th>
                  <th className="text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBatches.length > 0 ? (
                  paginatedBatches.map((b) => (
                    <tr key={b.maDot}>
                      <td>
                        <span className="fw-bold text-primary font-monospace">{b.maDot}</span>
                        <div className="text-muted small">{formatDateTimeVN(b.ngayTao)}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border fw-semibold">Kỳ {b.kyTrich}</span> (Tháng {b.thangNam})
                      </td>
                      <td className="text-end fw-bold num-tabular">{formatCurrencyVN(b.tongPhaiThu)}</td>
                      <td className="text-end fw-bold text-success num-tabular">{formatCurrencyVN(b.tongDaTrich)}</td>
                      <td className="text-end fw-bold text-danger num-tabular">{formatCurrencyVN(b.tongConNo)}</td>
                      <td className="text-center">
                        <span
                          className={`badge-status ${
                            b.trangThai === 'HOAN_TAT' ? 'badge-success-soft' : 'badge-warning-soft'
                          }`}
                        >
                          {b.trangThai}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-success fw-semibold d-inline-flex align-items-center gap-1"
                          onClick={() => handleExportCoreFile(b)}
                          title="Kết xuất file lệnh CoreBanking"
                        >
                          <FileSpreadsheet size={14} /> Xuất File Core
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      {loading ? 'Đang tải danh sách đợt trích nợ...' : 'Chưa có đợt trích nợ nào được lập.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang danh sách Đợt */}
          <Pagination
            currentPage={batchPage}
            totalItems={batches.length}
            pageSize={batchPageSize}
            onPageChange={setBatchPage}
            onPageSizeChange={setBatchPageSize}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ĐĂNG KÝ TRÍCH NỢ VÀ HIỆN DANH SÁCH HỢP ĐỒNG ĐANG VAY */}
      {/* ========================================================================= */}
      {showRegModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <div>
                  <h5 className="modal-title fw-bold text-dark font-heading d-flex align-items-center gap-2">
                    <UserCheck size={22} className="text-success" /> Đăng Ký Thỏa Thuận Trích Nợ Tự Động (Auto-Debit)
                  </h5>
                  <span className="text-muted small">
                    Nhập mã khách hàng để hệ thống tự động kiểm tra số tài khoản CASA và toàn bộ các hợp đồng đang vay
                  </span>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowRegModal(false)} />
              </div>

              <form onSubmit={handleSaveRegister}>
                <div className="modal-body py-3">
                  {/* Khối Thông Tin Khách Hàng */}
                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <div className="row g-3">
                      <div className="col-md-3">
                        <label className="form-label small fw-bold text-dark">
                          Mã Khách Hàng (*)
                        </label>
                        <div className="input-group input-group-sm">
                          <input
                            type="text"
                            className="form-control font-monospace fw-bold"
                            placeholder="vd: KH008892"
                            value={regForm.maKH}
                            onChange={(e) => handleMaKHChange(e.target.value)}
                            required
                          />
                          {searchingCustomer && (
                            <span className="input-group-text bg-white">
                              <Search size={14} className="fa-spin text-primary" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="col-md-3">
                        <label className="form-label small fw-bold text-dark">Họ Và Tên Khách Hàng (*)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm fw-bold"
                          placeholder="vd: NGUYỄN VĂN AN"
                          value={regForm.hoTen}
                          onChange={(e) => setRegForm({ ...regForm, hoTen: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label small fw-bold text-dark">Số CCCD / GTTT</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-monospace"
                          placeholder="vd: 038088001234"
                          value={regForm.gttt}
                          onChange={(e) => setRegForm({ ...regForm, gttt: e.target.value })}
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label small fw-bold text-dark">Số Tài Khoản CASA Trích Nợ (*)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-monospace fw-bold text-success"
                          placeholder="vd: 3500205123456"
                          value={regForm.soTK}
                          onChange={(e) => setRegForm({ ...regForm, soTK: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark">Địa Chỉ Thường Trú</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="vd: Thôn 3, Xã Yên Thọ, Yên Định, Thanh Hóa"
                          value={regForm.diaChi}
                          onChange={(e) => setRegForm({ ...regForm, diaChi: e.target.value })}
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label small fw-bold text-dark">Kỳ Trích Cố Định Hàng Tháng (*)</label>
                        <select
                          className="form-select form-select-sm fw-bold text-primary"
                          value={regForm.kyTrich}
                          onChange={(e) => setRegForm({ ...regForm, kyTrich: Number(e.target.value) })}
                        >
                          <option value="1">Kỳ 1 (Ngày 05 hàng tháng)</option>
                          <option value="2">Kỳ 2 (Ngày 15 hàng tháng)</option>
                          <option value="3">Kỳ 3 (Ngày 25 hàng tháng)</option>
                        </select>
                      </div>

                      <div className="col-md-3">
                        <label className="form-label small fw-bold text-dark">Trạng Thái Thỏa Thuận</label>
                        <select
                          className="form-select form-select-sm"
                          value={regForm.trangThai}
                          onChange={(e) => setRegForm({ ...regForm, trangThai: e.target.value })}
                        >
                          <option value="Hiệu lực">Hiệu lực (Đang hoạt động)</option>
                          <option value="Tạm dừng">Tạm dừng</option>
                          <option value="Hủy bỏ">Hủy bỏ</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* KHỐI QUAN TRỌNG: DANH SÁCH CÁC HỢP ĐỒNG ĐANG CÒN VAY CỦA KHÁCH HÀNG */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold text-dark m-0 font-heading d-flex align-items-center gap-2">
                        <FileText size={18} className="text-primary" /> Danh Sách Hợp Đồng Đang Còn Vay Của Khách Hàng
                      </h6>

                      {matchedCustomer?.contracts && matchedCustomer.contracts.length > 0 && (
                        <span className="badge bg-danger-subtle text-danger fw-bold">
                          {matchedCustomer.contracts.length} Hợp đồng • Tổng dư nợ:{' '}
                          {formatCurrencyVN(
                            matchedCustomer.contracts.reduce((sum, c) => sum + (c.duNo || 0), 0)
                          )}
                        </span>
                      )}
                    </div>

                    {matchedCustomer?.contracts && matchedCustomer.contracts.length > 0 ? (
                      <div className="table-responsive border rounded-3 bg-white">
                        <table className="table table-custom align-middle m-0">
                          <thead className="bg-light">
                            <tr>
                              <th>Số HĐTD / Khế Ước</th>
                              <th>Ngày Vay</th>
                              <th className="text-end">Tiền Vay Ban Đầu</th>
                              <th className="text-end">Dư Nợ Gốc Hiện Tại</th>
                              <th>Lãi Suất</th>
                              <th>Trả Lãi Đến Ngày</th>
                              <th>Ngày Đáo Hạn</th>
                              <th>Mục Đích Vay Vốn</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matchedCustomer.contracts.map((c) => (
                              <tr key={c.soHDTD}>
                                <td>
                                  <span className="fw-bold font-monospace text-primary">{c.soHDTD}</span>
                                  <div className="small text-muted">{c.maLoaiVay || 'LV01'}</div>
                                </td>
                                <td>
                                  <span className="fw-medium text-dark num-tabular d-flex align-items-center gap-1">
                                    <Calendar size={13} className="text-muted" />
                                    {c.ngayVay || '---'}
                                  </span>
                                </td>
                                <td className="text-end fw-semibold num-tabular text-dark">
                                  {formatCurrencyVN(c.tienVay)}
                                </td>
                                <td className="text-end fw-bold num-tabular text-danger">
                                  {formatCurrencyVN(c.duNo)}
                                </td>
                                <td>
                                  <span className="badge bg-light text-dark border font-monospace fw-bold">
                                    {c.laiSuat}%/năm
                                  </span>
                                </td>
                                <td>
                                  <span className="fw-bold text-success num-tabular d-flex align-items-center gap-1">
                                    <Clock size={13} />
                                    {c.traLaiDenNgay || '---'}
                                  </span>
                                </td>
                                <td className="small text-dark num-tabular">
                                  {c.denHan || '---'}
                                </td>
                                <td className="small text-muted text-truncate" style={{ maxWidth: 160 }} title={c.moTaVay}>
                                  {c.moTaVay || 'Cho vay phục vụ sản xuất'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : regForm.maKH ? (
                      <div className="p-3 bg-light rounded-3 text-center border text-muted small">
                        {searchingCustomer
                          ? 'Đang tra cứu danh sách hợp đồng vay từ CSDL Core...'
                          : 'Khách hàng này hiện không có hợp đồng tín dụng nào đang có dư nợ tại Quỹ.'}
                      </div>
                    ) : (
                      <div className="p-3 bg-light rounded-3 text-center border text-muted small">
                        Vui lòng nhập <strong>Mã khách hàng</strong> (ví dụ: `KH008892`, `KH007415`...) để hiển thị danh sách các hợp đồng đang vay.
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">Ghi Chú Điều Khoản Thỏa Thuận</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Ghi chú điều khoản ủy quyền trích nợ tự động..."
                      value={regForm.ghiChu}
                      onChange={(e) => setRegForm({ ...regForm, ghiChu: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowRegModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-brand fw-bold d-flex align-items-center gap-2" disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Xác Nhận Đăng Ký Trích Nợ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL NÂNG CAO: KHỞI TẠO ĐỢT TRÍCH NỢ (CHỌN ALL / TỪNG NGƯỜI & SỬA SỐ TIỀN) */}
      {/* ========================================================================= */}
      {showBatchModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className={`modal-dialog ${batchStep === 2 ? 'modal-xl' : 'modal-dialog-centered'} modal-dialog-scrollable`}>
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <div>
                  <h5 className="modal-title fw-bold text-dark font-heading d-flex align-items-center gap-2">
                    <Play size={20} className="text-warning" /> Khởi Tạo Đợt Trích Nợ Tự Động Định Kỳ
                  </h5>
                  <span className="text-muted small">
                    {batchStep === 1
                      ? 'Bước 1: Chọn kỳ trích và tháng năm thu nợ'
                      : 'Bước 2: Chọn danh sách khách hàng và điều chỉnh số tiền trích nợ thực tế'}
                  </span>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowBatchModal(false)} />
              </div>

              {/* BƯỚC 1: CHỌN KỲ TRÍCH VÀ THÁNG NĂM */}
              {batchStep === 1 && (
                <div className="modal-body py-3">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">Tháng Năm Thu Nợ (yyyyMM) (*)</label>
                    <input
                      type="text"
                      className="form-control font-monospace fw-bold"
                      placeholder="vd: 202608"
                      value={batchForm.thangNam}
                      onChange={(e) => setBatchForm({ ...batchForm, thangNam: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">Kỳ Trích Thu Nợ (*)</label>
                    <select
                      className="form-select fw-semibold text-primary"
                      value={batchForm.kyTrich}
                      onChange={(e) => setBatchForm({ ...batchForm, kyTrich: Number(e.target.value) })}
                    >
                      <option value="1">Kỳ 1 (Ngày 05 hàng tháng)</option>
                      <option value="2">Kỳ 2 (Ngày 15 hàng tháng)</option>
                      <option value="3">Kỳ 3 (Ngày 25 hàng tháng)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-light rounded-3 border small text-muted">
                    Hệ thống sẽ lấy toàn bộ khách hàng đã đăng ký ủy quyền cho <strong>Kỳ {batchForm.kyTrich}</strong> và tự động tính toán số tiền (Nợ tồn + Lãi phát sinh + Gốc đến hạn). Bạn có thể chọn lọc danh sách và sửa số tiền ở bước tiếp theo.
                  </div>

                  <div className="modal-footer border-0 pt-3 px-0 pb-0">
                    <button type="button" className="btn btn-light" onClick={() => setShowBatchModal(false)}>
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="btn btn-brand fw-bold d-flex align-items-center gap-2"
                      onClick={handleLoadCandidatesForBatch}
                      disabled={batchLoadingCandidates}
                    >
                      {batchLoadingCandidates ? 'Đang nạp danh sách...' : 'Tiếp Tục: Lọc & Duyệt Danh Sách'}
                    </button>
                  </div>
                </div>
              )}

              {/* BƯỚC 2: CHỌN ALL / TỪNG NGƯỜI VÀ CHỈNH SỬA SỐ TIỀN TRÍCH NỢ TRỰC TIẾP */}
              {batchStep === 2 && (
                <div className="modal-body py-3">
                  {/* Thanh Thống Kê & Nút Chọn Tất Cả */}
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 bg-light rounded-3 border mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary fw-bold d-flex align-items-center gap-1"
                        onClick={() => handleToggleSelectAll(!isAllSelected)}
                      >
                        {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        {isAllSelected ? 'Bỏ Chọn Tất Cả' : 'Chọn Tất Cả Khách Hàng'}
                      </button>

                      <span className="text-dark small">
                        Đã chọn: <strong className="text-primary">{selectedCount}</strong> / {batchCandidateList.length} khách hàng
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted">Tổng tiền trích nợ đợt này:</span>
                      <span className="badge bg-danger fs-6 fw-bold num-tabular">
                        {formatCurrencyVN(selectedTotalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Bảng Danh Sách Khách Hàng & Chỉnh Sửa Số Tiền */}
                  <div className="table-responsive border rounded-3 bg-white" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                    <table className="table table-custom align-middle m-0">
                      <thead className="bg-light sticky-top">
                        <tr>
                          <th style={{ width: 40 }} className="text-center">Chọn</th>
                          <th>Mã KH / Tên Khách Hàng</th>
                          <th>Số TK CASA</th>
                          <th>Số HĐTD / Khế Ước</th>
                          <th className="text-end">Dư Nợ Gốc</th>
                          <th className="text-end">Lãi Ước Tính</th>
                          <th className="text-end" style={{ minWidth: 160 }}>
                            <span className="d-flex align-items-center justify-content-end gap-1 text-danger fw-bold">
                              <Edit3 size={13} /> Số Tiền Trích Nợ (Sửa)
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchCandidateList.length > 0 ? (
                          batchCandidateList.map((c, idx) => (
                            <tr key={idx} className={c.selected ? 'table-primary-subtle' : 'opacity-75'}>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={c.selected}
                                  onChange={(e) => handleToggleCandidate(idx, e.target.checked)}
                                  style={{ cursor: 'pointer', width: 18, height: 18 }}
                                />
                              </td>
                              <td>
                                <div className="fw-bold text-dark">{c.hoTen}</div>
                                <div className="small text-muted font-monospace">{c.maKH} • {c.gttt}</div>
                              </td>
                              <td>
                                <span className="font-monospace fw-bold text-success small">{c.soTK}</span>
                              </td>
                              <td className="small text-muted">
                                {c.soHDTD || '---'}
                              </td>
                              <td className="text-end font-monospace small num-tabular">
                                {formatCurrencyVN(c.tongDuNo)}
                              </td>
                              <td className="text-end font-monospace small text-primary num-tabular">
                                {formatCurrencyVN(c.laiPhatSinh)}
                              </td>
                              <td className="text-end">
                                <ThousandInput
                                  value={c.soTienTrich}
                                  onChange={(newAmt) => handleCandidateAmountChange(idx, newAmt)}
                                  disabled={!c.selected}
                                  placeholder="Nhập số tiền..."
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center text-muted py-4">
                              Không có khách hàng nào đăng ký trích nợ cho Kỳ {batchForm.kyTrich}.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="modal-footer border-0 pt-3 px-0 pb-0 d-flex justify-content-between">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setBatchStep(1)}>
                      Quay Lại Bước 1
                    </button>
                    <button
                      type="button"
                      className="btn btn-brand fw-bold d-flex align-items-center gap-2 shadow-sm"
                      onClick={handleConfirmCreateBatch}
                      disabled={saving || selectedCount === 0}
                    >
                      {saving ? 'Đang khởi tạo...' : `Xác Nhận Khởi Tạo Đợt (${selectedCount} KH)`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
