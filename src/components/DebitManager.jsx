import React, { useState, useEffect } from 'react';
import { UserCheck, Zap, Plus, Download, Play, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { api } from '../services/api';

export default function DebitManager({ prefilledCustomer }) {
  const [activeSubTab, setActiveSubTab] = useState('register'); // 'register' | 'batch'
  const [registrations, setRegistrations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Registration
  const [regForm, setRegForm] = useState({
    maKH: '',
    hoTen: '',
    gttt: '',
    diaChi: '',
    soTK: '',
    kyTrich: 1,
    trangThai: 'Hieu luc',
    ghiChu: 'Ủy quyền trích nợ tự động tài khoản CASA'
  });

  // Form Batch Run
  const [batchForm, setBatchForm] = useState({
    thangNam: '202608',
    kyTrich: 1
  });

  const fetchData = async () => {
    try {
      const [resReg, resBatch] = await Promise.all([
        api.getDebitRegistrations(),
        api.getDebitBatches()
      ]);
      if (resReg.status === 'success' && resReg.data) setRegistrations(resReg.data);
      if (resBatch.status === 'success' && resBatch.data) setBatches(resBatch.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (prefilledCustomer) {
      setRegForm({
        maKH: prefilledCustomer.maKH,
        hoTen: prefilledCustomer.hoTen,
        gttt: prefilledCustomer.cccd || '',
        diaChi: prefilledCustomer.diaChi || '',
        soTK: prefilledCustomer.soTK || '',
        kyTrich: 1,
        trangThai: 'Hieu luc',
        ghiChu: 'Đăng ký ủy quyền trích nợ'
      });
      setActiveSubTab('register');
      setShowRegModal(true);
    }
  }, [prefilledCustomer]);

  const handleSaveRegister = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.saveDebitRegister(regForm);
      if (res.status === 'success') {
        alert(res.message || 'Đăng ký trích nợ thành công!');
        setShowRegModal(false);
        fetchData();
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.createDebitBatch(batchForm);
      if (res.status === 'success') {
        alert(res.message || 'Khởi tạo đợt trích nợ thành công!');
        setShowBatchModal(false);
        fetchData();
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

  const formatCurrency = (val) => (val || 0).toLocaleString('vi-VN') + ' đ';

  return (
    <div className="d-flex flex-column gap-4">
      {/* Sub Tabs Navigation */}
      <div className="d-flex gap-2 border-bottom pb-2">
        <button
          className={`btn fw-semibold d-flex align-items-center gap-2 ${
            activeSubTab === 'register' ? 'btn-primary' : 'btn-light text-muted'
          }`}
          onClick={() => setActiveSubTab('register')}
        >
          <UserCheck size={18} /> Danh Sách Đăng Ký Trích Nợ ({registrations.length})
        </button>
        <button
          className={`btn fw-semibold d-flex align-items-center gap-2 ${
            activeSubTab === 'batch' ? 'btn-primary' : 'btn-light text-muted'
          }`}
          onClick={() => setActiveSubTab('batch')}
        >
          <Zap size={18} /> Quản Lý & Khởi Tạo Đợt Trích Nợ ({batches.length})
        </button>
      </div>

      {/* SUB-TAB 1: REGISTRATIONS */}
      {activeSubTab === 'register' && (
        <div className="card-modern p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold m-0 text-slate-800">Danh Sách Khách Hàng Đăng Ký Auto-Debit</h5>
            <button
              className="btn btn-primary fw-semibold d-flex align-items-center gap-2"
              onClick={() => setShowRegModal(true)}
            >
              <Plus size={18} /> Đăng Ký Trích Nợ Mới
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-custom align-middle">
              <thead>
                <tr>
                  <th>Mã Khách Hàng</th>
                  <th>Họ và Tên</th>
                  <th>Số CCCD / GTTT</th>
                  <th>Số Tài Khoản Trích Nợ</th>
                  <th>Địa Chỉ</th>
                  <th className="text-center">Kỳ Trích</th>
                  <th className="text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length > 0 ? (
                  registrations.map((r, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold text-primary">{r.maKH}</td>
                      <td className="fw-semibold text-dark">{r.hoTen}</td>
                      <td>{r.gttt}</td>
                      <td className="fw-bold text-success">{r.soTK}</td>
                      <td className="text-muted small">{r.diaChi}</td>
                      <td className="text-center">
                        <span className="badge bg-primary-subtle text-primary fw-bold">
                          Kỳ {r.kyTrich} (Ngày {r.kyTrich === 1 ? '05' : r.kyTrich === 2 ? '15' : '25'})
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge-status badge-success-soft">{r.trangThai}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      Chưa có khách hàng nào đăng ký trích nợ.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DEBIT BATCHES */}
      {activeSubTab === 'batch' && (
        <div className="card-modern p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold m-0 text-slate-800">Các Đợt Thu Nợ & Trích Nợ Tự Động</h5>
              <span className="text-muted small">Tự động cộng dồn: Nợ tồn kỳ trước + Lãi phát sinh + Gốc đến hạn</span>
            </div>
            <button
              className="btn btn-warning text-dark fw-bold d-flex align-items-center gap-2"
              onClick={() => setShowBatchModal(true)}
            >
              <Play size={18} /> Khởi Tạo Đợt Trích Nợ Mới
            </button>
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
                {batches.length > 0 ? (
                  batches.map((b) => (
                    <tr key={b.maDot}>
                      <td>
                        <span className="fw-bold text-primary">{b.maDot}</span>
                        <div className="text-muted small">{b.ngayTao}</div>
                      </td>
                      <td>
                        <span className="fw-semibold">Kỳ {b.kyTrich}</span> (Tháng {b.thangNam})
                      </td>
                      <td className="text-end fw-bold">{formatCurrency(b.tongPhaiThu)}</td>
                      <td className="text-end fw-bold text-success">{formatCurrency(b.tongDaTrich)}</td>
                      <td className="text-end fw-bold text-danger">{formatCurrency(b.tongConNo)}</td>
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
                          className="btn btn-sm btn-outline-success fw-semibold"
                          onClick={() => handleExportCoreFile(b)}
                          title="Kết xuất file lệnh CoreBanking"
                        >
                          <FileSpreadsheet size={14} className="me-1" /> Xuất File Core
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      Chưa có đợt trích nợ nào được lập.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ĐĂNG KÝ TRÍCH NỢ */}
      {showRegModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <UserCheck size={20} className="me-2" /> Đăng Ký Thỏa Thuận Trích Nợ Tự Động
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRegModal(false)}></button>
              </div>

              <form onSubmit={handleSaveRegister}>
                <div className="modal-body p-4">
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-muted">Mã Khách Hàng</label>
                      <input
                        type="text"
                        className="form-control fw-bold"
                        value={regForm.maKH}
                        onChange={(e) => setRegForm({ ...regForm, maKH: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-muted">Họ và Tên Khách Hàng</label>
                      <input
                        type="text"
                        className="form-control fw-bold"
                        value={regForm.hoTen}
                        onChange={(e) => setRegForm({ ...regForm, hoTen: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-muted">Số CCCD / GTTT</label>
                      <input
                        type="text"
                        className="form-control"
                        value={regForm.gttt}
                        onChange={(e) => setRegForm({ ...regForm, gttt: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-muted">Số Tài Khoản Trích Nợ (CASA Co-op)</label>
                      <input
                        type="text"
                        className="form-control fw-bold text-success"
                        value={regForm.soTK}
                        onChange={(e) => setRegForm({ ...regForm, soTK: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-muted">Kỳ Trích Hàng Tháng</label>
                      <select
                        className="form-select fw-semibold"
                        value={regForm.kyTrich}
                        onChange={(e) => setRegForm({ ...regForm, kyTrich: Number(e.target.value) })}
                      >
                        <option value={1}>Kỳ 1 (Ngày 05 hàng tháng)</option>
                        <option value={2}>Kỳ 2 (Ngày 15 hàng tháng)</option>
                        <option value={3}>Kỳ 3 (Ngày 25 hàng tháng)</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-muted">Trạng Thái Thỏa Thuận</label>
                      <select
                        className="form-select fw-semibold"
                        value={regForm.trangThai}
                        onChange={(e) => setRegForm({ ...regForm, trangThai: e.target.value })}
                      >
                        <option value="Hieu luc">Hiệu lực (Đang hoạt động)</option>
                        <option value="Tam dung">Tạm dừng</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted">Địa Chỉ Thường Trú</label>
                      <input
                        type="text"
                        className="form-control"
                        value={regForm.diaChi}
                        onChange={(e) => setRegForm({ ...regForm, diaChi: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary fw-semibold" onClick={() => setShowRegModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary fw-semibold px-4" disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Lưu Đăng Ký'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KHỞI TẠO ĐỢT TRÍCH NỢ */}
      {showBatchModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title fw-bold">
                  <Zap size={20} className="me-2" /> Khởi Tạo Đợt Trích Nợ Tự Động
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowBatchModal(false)}></button>
              </div>

              <form onSubmit={handleCreateBatch}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Tháng / Năm Trích Nợ (YYYYMM)</label>
                    <input
                      type="text"
                      className="form-control fw-bold"
                      value={batchForm.thangNam}
                      onChange={(e) => setBatchForm({ ...batchForm, thangNam: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Kỳ Trích Thu Nợ</label>
                    <select
                      className="form-select fw-bold"
                      value={batchForm.kyTrich}
                      onChange={(e) => setBatchForm({ ...batchForm, kyTrich: Number(e.target.value) })}
                    >
                      <option value={1}>Kỳ 1 (Ngày 05 hàng tháng)</option>
                      <option value={2}>Kỳ 2 (Ngày 15 hàng tháng)</option>
                      <option value={3}>Kỳ 3 (Ngày 25 hàng tháng)</option>
                    </select>
                  </div>
                  <div className="p-3 bg-light rounded-3 text-muted small">
                    <i className="fa-solid fa-circle-info text-info me-1"></i>
                    Hệ thống sẽ tự động quét tất cả khách hàng đã đăng ký kỳ này, tính dự thu lãi đến ngày trích và cộng nợ tồn đọng (nếu có).
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary fw-semibold" onClick={() => setShowBatchModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-warning text-dark fw-bold px-4" disabled={saving}>
                    {saving ? 'Đang khởi tạo...' : 'Xác Nhận Tạo Đợt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
