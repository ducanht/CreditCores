import React, { useState } from 'react';
import {
  Settings,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Save,
  X,
  Info
} from 'lucide-react';

export default function DebitConfigTable({
  configs = [],
  onSaveConfig,
  loading = false
}) {
  const [editingConfig, setEditingConfig] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    maDotConfig: '',
    tenDot: '',
    tuNgayVay: 5,
    denNgayVay: 15,
    ngayTrichHangThang: 15,
    trangThai: 'ACTIVE',
    ghiChu: ''
  });

  const handleOpenAdd = () => {
    setEditingConfig(null);
    setFormData({
      maDotConfig: 'DOT_' + Date.now().toString().slice(-6),
      tenDot: 'Đợt Mới - Kỳ Ngày ...',
      tuNgayVay: 1,
      denNgayVay: 10,
      ngayTrichHangThang: 10,
      trangThai: 'ACTIVE',
      ghiChu: 'Cấu hình đợt trích nợ linh hoạt'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cfg) => {
    setEditingConfig(cfg);
    setFormData({
      maDotConfig: cfg.maDotConfig,
      tenDot: cfg.tenDot,
      tuNgayVay: cfg.tuNgayVay,
      denNgayVay: cfg.denNgayVay,
      ngayTrichHangThang: cfg.ngayTrichHangThang,
      trangThai: cfg.trangThai || 'ACTIVE',
      ghiChu: cfg.ghiChu || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveConfig(formData);
    setShowModal(false);
  };

  return (
    <div className="card-modern p-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom">
        <div>
          <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <Settings size={18} className="text-primary" />
            Cấu Hình Các Đợt Trích Nợ Định Kỳ Theo Ngày Vay Trong Tháng
          </h6>
          <small className="text-muted">
            Quy tắc: Hệ thống tự động phân loại HĐTD vào từng đợt dựa trên phần ngày của ngày giải ngân <code>day(NgayVay)</code>
          </small>
        </div>

        <button
          type="button"
          className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
          onClick={handleOpenAdd}
        >
          <Plus size={15} /> Thêm Đợt Trích Nợ Mới
        </button>
      </div>

      {/* Bảng cấu hình */}
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light small text-uppercase">
            <tr>
              <th style={{ width: '120px' }}>Mã Đợt</th>
              <th>Tên Đợt Trích Nợ</th>
              <th className="text-center">Khoảng Ngày Vay</th>
              <th className="text-center">Ngày Trích Hàng Tháng</th>
              <th>Trạng Thái</th>
              <th>Ghi Chú / Phạm Vi Áp Dụng</th>
              <th className="text-center" style={{ width: '90px' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody className="small">
            {configs.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">
                  Chưa có cấu hình đợt trích nợ nào.
                </td>
              </tr>
            ) : (
              configs.map((cfg) => {
                const isActive = cfg.trangThai === 'ACTIVE';
                const fromDayStr = String(cfg.tuNgayVay).padStart(2, '0');
                const toDayStr = String(cfg.denNgayVay).padStart(2, '0');
                const debitDayStr = String(cfg.ngayTrichHangThang).padStart(2, '0');

                return (
                  <tr key={cfg.maDotConfig}>
                    <td className="font-monospace fw-bold text-secondary">{cfg.maDotConfig}</td>
                    <td className="fw-bold text-primary">{cfg.tenDot}</td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border px-2 py-1 font-monospace">
                        Từ ngày {fromDayStr} đến ngày {toDayStr}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-primary text-white px-2 py-1 fw-bold">
                        Ngày {debitDayStr} hàng tháng
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${isActive ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary'}`}>
                        {isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className="text-muted">{cfg.ghiChu || '---'}</td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm p-1 px-2 d-flex align-items-center gap-1 mx-auto"
                        onClick={() => handleOpenEdit(cfg)}
                        title="Chỉnh sửa cấu hình đợt này"
                      >
                        <Edit2 size={13} /> Sửa
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Ghi chú giải thích */}
      <div className="alert alert-info mt-3 py-2 px-3 small d-flex align-items-center gap-2 mb-0">
        <Info size={16} className="text-info flex-shrink-0" />
        <div>
          <strong>Cơ chế tự động:</strong> Khi cán bộ chọn đợt (ví dụ <em>Đợt 2 - Ngày 15</em>), hệ thống sẽ tự động quét toàn bộ khách hàng đã ký thỏa thuận trích nợ và lọc các hợp đồng vay có ngày giải ngân từ ngày 05 đến 15 hàng tháng để đưa vào danh sách tính lãi và xuất bảng kê.
        </div>
      </div>

      {/* MODAL THÊM / SỬA CẤU HÌNH ĐỢT */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0 rounded-3">
              <div className="modal-header bg-primary text-white py-3 px-4">
                <h6 className="modal-title fw-bold mb-0">
                  {editingConfig ? 'Chỉnh Sửa Cấu Hình Đợt Trích Nợ' : 'Thêm Cấu Hình Đợt Trích Nợ Mới'}
                </h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted mb-1">Mã Đợt (Duy nhất)</label>
                      <input
                        type="text"
                        className="form-control font-monospace bg-light"
                        value={formData.maDotConfig}
                        readOnly={Boolean(editingConfig)}
                        onChange={(e) => setFormData({ ...formData, maDotConfig: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted mb-1">Tên Đợt Trích Nợ *</label>
                      <input
                        type="text"
                        className="form-control fw-bold"
                        value={formData.tenDot}
                        onChange={(e) => setFormData({ ...formData, tenDot: e.target.value })}
                        placeholder="Ví dụ: Đợt 2 - Kỳ ngày 15"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted mb-1">Ngày Vay Bắt Đầu (Trong tháng)</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        className="form-control"
                        value={formData.tuNgayVay}
                        onChange={(e) => setFormData({ ...formData, tuNgayVay: Number(e.target.value) })}
                        required
                      />
                      <small className="text-muted">Từ ngày 1 đến 31</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted mb-1">Ngày Vay Kết Thúc (Trong tháng)</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        className="form-control"
                        value={formData.denNgayVay}
                        onChange={(e) => setFormData({ ...formData, denNgayVay: Number(e.target.value) })}
                        required
                      />
                      <small className="text-muted">Từ ngày 1 đến 31</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-primary mb-1">Ngày Trích Hàng Tháng *</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        className="form-control border-primary fw-bold text-primary"
                        value={formData.ngayTrichHangThang}
                        onChange={(e) => setFormData({ ...formData, ngayTrichHangThang: Number(e.target.value) })}
                        required
                      />
                      <small className="text-muted">Ngày thực hiện gửi trích nợ</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted mb-1">Trạng Thái</label>
                      <select
                        className="form-select"
                        value={formData.trangThai}
                        onChange={(e) => setFormData({ ...formData, trangThai: e.target.value })}
                      >
                        <option value="ACTIVE">Hoạt động (Áp dụng)</option>
                        <option value="INACTIVE">Tạm dừng (Không chọn)</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted mb-1">Ghi Chú Phạm Vi Áp Dụng</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.ghiChu}
                        onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
                        placeholder="Mô tả các đối tượng khoản vay áp dụng..."
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2 px-4">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm fw-bold d-flex align-items-center gap-1">
                    <Save size={14} /> Lưu Cấu Hình
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
