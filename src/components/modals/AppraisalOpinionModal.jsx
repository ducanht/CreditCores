import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, MessageSquare, ShieldCheck, UserCheck } from 'lucide-react';
import { formatDateTimeVN } from '../../utils/dateUtils';

export default function AppraisalOpinionModal({ appraisal, onClose, onSubmit, currentUser }) {
  const defaultChucVu = currentUser?.role === 'LANHDAO' 
    ? 'Ban Giám Đốc / HĐQT' 
    : currentUser?.role === 'BKS' 
    ? 'Ban Kiểm Soát' 
    : currentUser?.role === 'KETOAN'
    ? 'Kế Toán Trưởng / Kế Toán Viên'
    : 'Cán Bộ Tín Dụng';

  const [opinionData, setOpinionData] = useState({
    nguoiDanhGia: currentUser?.fullName || 'Lê Văn Tín (CBTD)',
    chucVu: defaultChucVu,
    yKien: 'Đồng ý',
    noiDung: 'Hồ sơ pháp lý đầy đủ, khách hàng có phương án vay vốn khả thi, nguồn trả nợ minh bạch và tài sản đảm bảo đủ điều kiện thế chấp.'
  });

  if (!appraisal) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!opinionData.nguoiDanhGia || !opinionData.noiDung) {
      alert('Vui lòng nhập họ tên người đánh giá và nội dung ý kiến.');
      return;
    }

    onSubmit(appraisal.maBCTD, {
      ...opinionData,
      ngayDanhGia: new Date().toLocaleString('vi-VN')
    });
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1070 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-3 p-md-4">
          <div className="modal-header border-0 pb-1">
            <div>
              <span className="badge bg-primary-subtle text-primary font-monospace mb-1">
                {appraisal.maBCTD} • {appraisal.hoTen}
              </span>
              <h5 className="modal-title fw-bold text-dark font-heading">
                Ghi Nhận Ý Kiến Đánh Giá & Phê Duyệt Cấp Tín Dụng
              </h5>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body py-3">
              {/* Lịch sử các ý kiến đã có */}
              {appraisal.danhSachYKien && appraisal.danhSachYKien.length > 0 && (
                <div className="mb-3">
                  <h6 className="fw-bold text-dark small mb-2">Lịch Sử Các Ý Kiến Đã Ghi Nhận:</h6>
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: 180, overflowY: 'auto' }}>
                    {appraisal.danhSachYKien.map((yk, idx) => (
                      <div key={idx} className="p-2.5 bg-light rounded-3 border small">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong className="text-dark">
                            {yk.nguoiDanhGia} <span className="text-muted fw-normal">({yk.chucVu})</span>
                          </strong>
                          <span className={`badge ${yk.yKien === 'Đồng ý' ? 'bg-success' : 'bg-danger'}`}>
                            {yk.yKien}
                          </span>
                        </div>
                        <p className="m-0 text-secondary">{yk.noiDung}</p>
                        <span className="text-muted" style={{ fontSize: '0.68rem' }}>{yk.ngayDanhGia}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form bổ sung ý kiến mới */}
              <div className="p-3 bg-light rounded-3 border">
                <h6 className="fw-bold text-primary small mb-3">Thêm Ý Kiến / Quyết Định Của Bạn:</h6>

                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-dark">Họ Và Tên Người Đánh Giá (*)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm fw-bold"
                      value={opinionData.nguoiDanhGia}
                      onChange={(e) => setOpinionData({ ...opinionData, nguoiDanhGia: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-dark">Chức Vụ / Bộ Phận Đánh Giá</label>
                    <select
                      className="form-select form-select-sm fw-bold"
                      value={opinionData.chucVu}
                      onChange={(e) => setOpinionData({ ...opinionData, chucVu: e.target.value })}
                    >
                      <option value="Cán Bộ Tín Dụng">1. Cán Bộ Tín Dụng</option>
                      <option value="Tổ Trưởng / Trưởng Phòng Tín Dụng">2. Tổ Trưởng / Trưởng Phòng Tín Dụng</option>
                      <option value="Ban Kiểm Soát">3. Ban Kiểm Soát</option>
                      <option value="Ban Giám Đốc / HĐQT">4. Ban Giám Đốc / HĐQT</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-dark">Ý Kiến / Quyết Định</label>
                    <select
                      className="form-select form-select-sm fw-bold"
                      value={opinionData.yKien}
                      onChange={(e) => setOpinionData({ ...opinionData, yKien: e.target.value })}
                    >
                      <option value="Đồng ý">Đồng ý cấp tín dụng</option>
                      <option value="Đồng ý có điều kiện">Đồng ý có điều kiện bổ sung</option>
                      <option value="Từ chối">Từ chối cấp tín dụng</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold text-dark">Nội Dung Ý Kiến Đánh Giá & Nhận Xét (*)</label>
                    <textarea
                      rows={3}
                      className="form-control form-control-sm"
                      placeholder="Ghi rõ nhận xét về tính khả thi của phương án, năng lực tài chính, tài sản thế chấp và điều kiện phê duyệt..."
                      value={opinionData.noiDung}
                      onChange={(e) => setOpinionData({ ...opinionData, noiDung: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
              <button type="button" className="btn btn-light btn-sm" onClick={onClose}>
                Đóng
              </button>
              <button type="submit" className="btn btn-brand btn-sm fw-bold px-4 shadow-sm">
                <UserCheck size={14} className="me-1" /> Lưu Ý Kiến Phê Duyệt
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
