import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Search, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function LoanInspection({ prefilledContract }) {
  const [inspections, setInspections] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    soHDTD: '',
    maKH: '',
    hoTen: '',
    ngayKiemTra: new Date().toISOString().split('T')[0],
    hinhThuc: 'Thực địa',
    danhGiaMucDich: 'Đúng mục đích',
    mucDoRuiRo: 'Thấp',
    moTaThucTe: '',
    hinhAnhKiemTra: '',
    canBoKiemTra: 'Lê Văn Tín'
  });

  const fetchInspections = async () => {
    try {
      const res = await api.getInspections();
      if (res.status === 'success' && res.data) {
        setInspections(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  useEffect(() => {
    if (prefilledContract) {
      setFormData(prev => ({
        ...prev,
        soHDTD: prefilledContract.soHDTD,
        maKH: prefilledContract.maKH,
        hoTen: prefilledContract.hoTen || ''
      }));
      setShowModal(true);
    }
  }, [prefilledContract]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.saveLoanInspection(formData);
      if (res.status === 'success') {
        alert(res.message || 'Đã lưu biên bản kiểm tra sử dụng vốn thành công!');
        setShowModal(false);
        fetchInspections();
      }
    } catch (err) {
      alert('Lỗi lưu biên bản: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredInspections = inspections.filter(i =>
    !searchTerm ||
    i.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.soHDTD?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.maBBKT?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="d-flex flex-column gap-4">
      {/* Controls */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="input-group" style={{ maxWidth: 350 }}>
          <span className="input-group-text bg-light border-end-0">
            <Search size={16} className="text-muted" />
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Tìm kiếm biên bản kiểm tra vốn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="btn btn-primary fw-semibold d-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Lập Biên Bản Kiểm Tra Mới
        </button>
      </div>

      {/* Table */}
      <div className="card-modern p-4">
        <h5 className="fw-bold mb-3 text-slate-800 d-flex align-items-center gap-2">
          <ClipboardList size={20} className="text-primary" />
          Danh Sách Biên Bản Kiểm Tra Sử Dụng Vốn Sau Giải Ngân ({filteredInspections.length})
        </h5>

        <div className="table-responsive">
          <table className="table table-custom align-middle">
            <thead>
              <tr>
                <th>Mã BBKT / Ngày</th>
                <th>Số Hợp Đồng / Khách Hàng</th>
                <th className="text-center">Hình Thức</th>
                <th className="text-center">Đánh Giá Mục Đích</th>
                <th className="text-center">Mức Rủi Ro</th>
                <th>Hiện Trạng Thực Tế</th>
                <th>Cán Bộ Kiểm Tra</th>
              </tr>
            </thead>
            <tbody>
              {filteredInspections.length > 0 ? (
                filteredInspections.map((item) => (
                  <tr key={item.maBBKT}>
                    <td>
                      <span className="fw-bold text-primary">{item.maBBKT}</span>
                      <div className="text-muted small">{item.ngayKiemTra}</div>
                    </td>
                    <td>
                      <span className="fw-bold text-dark">{item.soHDTD}</span>
                      <div className="text-muted small">
                        {item.hoTen} ({item.maKH})
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border">{item.hinhThuc}</span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge-status ${
                          item.danhGiaMucDich === 'Đúng mục đích' ? 'badge-success-soft' : 'badge-danger-soft'
                        }`}
                      >
                        {item.danhGiaMucDich}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge-status ${
                          item.mucDoRuiRo === 'Thấp' ? 'badge-success-soft' : 'badge-warning-soft'
                        }`}
                      >
                        {item.mucDoRuiRo}
                      </span>
                    </td>
                    <td>
                      <div className="text-muted small text-truncate" style={{ maxWidth: 280 }}>
                        {item.moTaThucTe}
                      </div>
                    </td>
                    <td>
                      <span className="fw-semibold text-slate-700">{item.canBoKiemTra}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    Chưa có biên bản kiểm tra sử dụng vốn nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <ClipboardList size={20} className="me-2" /> Lập Biên Bản Kiểm Tra Sử Dụng Vốn Vay
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body p-4">
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Số Khế Ước / HĐTD</label>
                      <input
                        type="text"
                        className="form-control fw-bold"
                        value={formData.soHDTD}
                        onChange={(e) => setFormData({ ...formData, soHDTD: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Mã Khách Hàng</label>
                      <input
                        type="text"
                        className="form-control fw-bold"
                        value={formData.maKH}
                        onChange={(e) => setFormData({ ...formData, maKH: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Họ và Tên Khách Hàng</label>
                      <input
                        type="text"
                        className="form-control fw-bold"
                        value={formData.hoTen}
                        onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-muted">Ngày Thực Hiện Kiểm Tra</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.ngayKiemTra}
                        onChange={(e) => setFormData({ ...formData, ngayKiemTra: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-muted">Hình Thức Kiểm Tra</label>
                      <select
                        className="form-select fw-semibold"
                        value={formData.hinhThuc}
                        onChange={(e) => setFormData({ ...formData, hinhThuc: e.target.value })}
                      >
                        <option value="Thực địa">Kiểm tra thực địa tận nơi</option>
                        <option value="Chứng từ">Kiểm tra qua Hóa đơn / Chứng từ</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-muted">Đánh Giá Mục Đích Vay Vốn</label>
                      <select
                        className="form-select fw-bold"
                        value={formData.danhGiaMucDich}
                        onChange={(e) => setFormData({ ...formData, danhGiaMucDich: e.target.value })}
                      >
                        <option value="Đúng mục đích">✔ ĐÚNG MỤC ĐÍCH VAY TRONG HỢP ĐỒNG</option>
                        <option value="Sai mục đích">✖ SAI MỤC ĐÍCH VAY VỐN</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-muted">Mức Độ Rủi Ro Hiện Tại</label>
                      <select
                        className="form-select fw-bold"
                        value={formData.mucDoRuiRo}
                        onChange={(e) => setFormData({ ...formData, mucDoRuiRo: e.target.value })}
                      >
                        <option value="Thấp">✔ RỦI RO THẤP</option>
                        <option value="Trung bình">⚠ RỦI RO TRUNG BÌNH</option>
                        <option value="Cao">✖ RỦI RO CAO</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Mô Tả Thực Tế & Hiện Trạng Tài Sản / Dự Án</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Ghi nhận cụ thể tình hình sản xuất, kinh doanh, máy móc, chuồng trại hoặc hàng hóa..."
                      value={formData.moTaThucTe}
                      onChange={(e) => setFormData({ ...formData, moTaThucTe: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary fw-semibold" onClick={() => setShowModal(false)}>
                    Hủy Bỏ
                  </button>
                  <button type="submit" className="btn btn-primary fw-semibold px-4" disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Lưu Biên Bản Kiểm Tra'}
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
