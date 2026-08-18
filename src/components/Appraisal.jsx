import React, { useState, useEffect } from 'react';
import { FileCheck2, Plus, Search } from 'lucide-react';
import { api } from '../services/api';
import { formatDateVN, formatCurrencyVN, getTodayVN } from '../utils/dateUtils';

export default function Appraisal({ prefilledCustomer }) {
  const [appraisals, setAppraisals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    maKH: '',
    hoTen: '',
    deXuatVay: 300000000,
    duyetVay: 300000000,
    thoiHanThang: 12,
    laiSuatDuyet: 9.5,
    thuNhapThang: 25000000,
    chiPhiThang: 10000000,
    xepHangCIC: 'Hang A (Tot)',
    loaiTSBD: 'QSDĐ (Sổ đỏ / Sổ hồng)',
    chuSoHuuTSBD: '',
    moTaTSBD: '',
    giaTriTSBD: 600000000,
    hinhAnhTSBD: '',
    hinhAnhThamDinh: '',
    mucDoRuiRo: 'Thap',
    ketLuan: 'Dong y cap tin dung',
    canBoThamDinh: 'Lê Văn Tín'
  });

  const fetchAppraisals = async () => {
    try {
      const res = await api.getAppraisals();
      if (res.status === 'success' && res.data) {
        setAppraisals(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAppraisals();
  }, []);

  useEffect(() => {
    if (prefilledCustomer) {
      setFormData(prev => ({
        ...prev,
        maKH: prefilledCustomer.maKH,
        hoTen: prefilledCustomer.hoTen,
        chuSoHuuTSBD: prefilledCustomer.hoTen + ' (Chính chủ)'
      }));
      setShowModal(true);
    }
  }, [prefilledCustomer]);

  // Calculate auto values
  const thangDu = Math.max(0, formData.thuNhapThang - formData.chiPhiThang);
  const ltvPercent = formData.giaTriTSBD > 0 ? ((formData.duyetVay / formData.giaTriTSBD) * 100).toFixed(1) + '%' : '0%';

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        tyLeLTV: ltvPercent
      };
      const res = await api.saveAppraisalReport(payload);
      if (res.status === 'success') {
        alert(res.message || 'Đã lưu báo cáo thẩm định thành công!');
        setShowModal(false);
        fetchAppraisals();
      }
    } catch (err) {
      alert('Lỗi lưu báo cáo: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val) => (val || 0).toLocaleString('vi-VN') + ' đ';

  const filteredAppraisals = appraisals.filter(a =>
    !searchTerm ||
    a.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.maKH?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.maBCTD?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header & Controls */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div className="input-group" style={{ maxWidth: 350 }}>
            <span className="input-group-text bg-light border-end-0">
              <Search size={16} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Tìm kiếm hồ sơ thẩm định..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <button className="btn btn-primary fw-semibold d-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Lập Báo Cáo Thẩm Định Mới
        </button>
      </div>

      {/* Appraisal List */}
      <div className="card-modern p-4">
        <h5 className="fw-bold mb-3 text-slate-800 d-flex align-items-center gap-2">
          <FileCheck2 size={20} className="text-primary" />
          Danh Sách Hồ Sơ Thẩm Định & Phê Duyệt Tín Dụng ({filteredAppraisals.length})
        </h5>

        <div className="table-responsive">
          <table className="table table-custom align-middle">
            <thead>
              <tr>
                <th>Mã BCTD / Ngày</th>
                <th>Khách Hàng</th>
                <th className="text-end">Đề Xuất / Duyệt</th>
                <th>Tài Sản Bảo Đảm</th>
                <th className="text-center">Định Giá / LTV</th>
                <th className="text-center">Xếp Hạng CIC</th>
                <th className="text-center">Kết Luận</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppraisals.length > 0 ? (
                filteredAppraisals.map((a) => (
                  <tr key={a.maBCTD}>
                    <td>
                      <span className="fw-bold text-primary font-monospace">{a.maBCTD}</span>
                      <div className="text-muted small">{formatDateVN(a.ngayLap)}</div>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{a.hoTen}</div>
                      <span className="text-muted small">Mã: {a.maKH}</span>
                    </td>
                    <td className="text-end">
                      <div className="fw-bold text-success num-tabular">{formatCurrencyVN(a.duyetVay)}</div>
                      <span className="text-muted small">{a.thoiHanThang} tháng @ {a.laiSuatDuyet}%</span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{a.loaiTSBD}</div>
                      <div className="text-muted small text-truncate" style={{ maxWidth: 200 }}>
                        {a.moTaTSBD}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="fw-semibold num-tabular">{formatCurrencyVN(a.giaTriTSBD)}</div>
                      <span className="badge bg-info-subtle text-info fw-bold">{a.tyLeLTV}</span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-secondary-subtle text-secondary">{a.xepHangCIC}</span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge-status ${
                          a.ketLuan?.includes('Dong y') || a.ketLuan?.includes('Đồng ý')
                            ? 'badge-success-soft'
                            : 'badge-danger-soft'
                        }`}
                      >
                        {a.ketLuan}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    Chưa có hồ sơ thẩm định nào. Nhấn "Lập Báo Cáo Thẩm Định Mới" để tạo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: LẬP BÁO CÁO THẨM ĐỊNH */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <FileCheck2 size={20} className="me-2" /> Lập Báo Cáo Thẩm Định Khách Hàng & Phê Duyệt Tín Dụng
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body p-4">
                  {/* Part 1: Basic info */}
                  <h6 className="fw-bold text-primary mb-3">I. THÔNG TIN KHÁCH HÀNG & NHU CẦU</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold text-muted">Mã Khách Hàng</label>
                      <input
                        type="text"
                        className="form-control fw-bold"
                        value={formData.maKH}
                        onChange={(e) => setFormData({ ...formData, maKH: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label small fw-semibold text-muted">Họ và Tên Khách Hàng</label>
                      <input
                        type="text"
                        className="form-control fw-bold"
                        value={formData.hoTen}
                        onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Số Tiền Đề Xuất Vay</label>
                      <input
                        type="number"
                        className="form-control fw-bold text-primary"
                        value={formData.deXuatVay}
                        onChange={(e) => setFormData({ ...formData, deXuatVay: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* Part 2: Financial & Collateral */}
                  <h6 className="fw-bold text-primary mb-3">II. ĐÁNH GIÁ TÀI CHÍNH & TÀI SẢN ĐẢM BẢO</h6>
                  <div className="row g-3 mb-3">
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold text-muted">Thu Nhập Bình Quân / Tháng</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.thuNhapThang}
                        onChange={(e) => setFormData({ ...formData, thuNhapThang: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold text-muted">Chi Phí Sinh Hoạt & Nợ Khác</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.chiPhiThang}
                        onChange={(e) => setFormData({ ...formData, chiPhiThang: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold text-muted">Dòng Tiền Thặng Dư</label>
                      <input
                        type="text"
                        className="form-control fw-bold text-success bg-light"
                        value={formatCurrencyVN(thangDu)}
                        readOnly
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold text-muted">Xếp Hạng CIC</label>
                      <select
                        className="form-select fw-semibold"
                        value={formData.xepHangCIC}
                        onChange={(e) => setFormData({ ...formData, xepHangCIC: e.target.value })}
                      >
                        <option value="Hang A (Tot)">Hạng A (Tốt - Không nợ xấu)</option>
                        <option value="Hang B (Trung binh)">Hạng B (Bình thường)</option>
                        <option value="Hang C (Luu y)">Hạng C (Có nợ nhóm 2 trong 12 tháng)</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Loại Tài Sản Đảm Bảo (TSĐB)</label>
                      <select
                        className="form-select"
                        value={formData.loaiTSBD}
                        onChange={(e) => setFormData({ ...formData, loaiTSBD: e.target.value })}
                      >
                        <option value="QSDĐ (Sổ đỏ / Sổ hồng)">Quyền sử dụng đất (Sổ đỏ / Sổ hồng)</option>
                        <option value="Phương tiện vận tải">Đăng ký Ô tô / Xe máy</option>
                        <option value="Sổ tiết kiệm / Giấy tờ có giá">Sổ tiết kiệm / Giấy tờ có giá</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Giá Trị Định Giá TSĐB</label>
                      <input
                        type="number"
                        className="form-control fw-bold"
                        value={formData.giaTriTSBD}
                        onChange={(e) => setFormData({ ...formData, giaTriTSBD: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Tỷ Lệ Tài Trợ (LTV = Vay / TSĐB)</label>
                      <input
                        type="text"
                        className="form-control fw-bold text-info bg-light"
                        value={ltvPercent}
                        readOnly
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted">Mô Tả Chi Tiết TSĐB & Chủ Sở Hữu</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Số GCN, Thửa đất, Tờ bản đồ, Diện tích, Tình trạng pháp lý..."
                        value={formData.moTaTSBD}
                        onChange={(e) => setFormData({ ...formData, moTaTSBD: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Part 3: Approval & Decision */}
                  <h6 className="fw-bold text-primary mb-3">III. KẾT LUẬN THẨM ĐỊNH & PHÊ DUYỆT HẠN MỨC</h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Hạn Mức Phê Duyệt (VNĐ)</label>
                      <input
                        type="number"
                        className="form-control fw-bold text-success border-success"
                        value={formData.duyetVay}
                        onChange={(e) => setFormData({ ...formData, duyetVay: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Thời Hạn Vay (Tháng)</label>
                      <select
                        className="form-select fw-semibold"
                        value={formData.thoiHanThang}
                        onChange={(e) => setFormData({ ...formData, thoiHanThang: Number(e.target.value) })}
                      >
                        <option value={12}>12 Tháng</option>
                        <option value={24}>24 Tháng</option>
                        <option value={36}>36 Tháng</option>
                        <option value={60}>60 Tháng</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Lãi Suất Cho Vay (% /năm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control fw-bold"
                        value={formData.laiSuatDuyet}
                        onChange={(e) => setFormData({ ...formData, laiSuatDuyet: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-muted">Mức Độ Rủi Ro</label>
                      <select
                        className="form-select fw-bold"
                        value={formData.mucDoRuiRo}
                        onChange={(e) => setFormData({ ...formData, mucDoRuiRo: e.target.value })}
                      >
                        <option value="Thap">✔ RỦI RO THẤP</option>
                        <option value="Trung binh">⚠ RỦI RO TRUNG BÌNH</option>
                        <option value="Cao">✖ RỦI RO CAO</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-muted">Kết Luận Phê Duyệt</label>
                      <select
                        className="form-select fw-bold"
                        value={formData.ketLuan}
                        onChange={(e) => setFormData({ ...formData, ketLuan: e.target.value })}
                      >
                        <option value="Dong y cap tin dung">✔ ĐỒNG Ý CẤP TÍN DỤNG</option>
                        <option value="Tu choi cap tin dung">✖ TỪ CHỐI CẤP TÍN DỤNG</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary fw-semibold" onClick={() => setShowModal(false)}>
                    Đóng
                  </button>
                  <button type="submit" className="btn btn-success fw-semibold px-4" disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Lưu & Trình Phê Duyệt'}
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
