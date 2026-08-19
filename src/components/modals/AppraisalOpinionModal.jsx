import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { formatDateTimeVN } from '../../utils/dateUtils';

export default function AppraisalOpinionModal({ appraisal, onClose, onSubmit }) {
  const [opinionData, setOpinionData] = useState({
    nguoiDanhGia: 'Lê Văn Tín',
    chucVu: 'Cán Bộ Tín Dụng',
    yKien: 'Đồng ý',
    noiDung: 'Khách hàng có phương án vay vốn khả thi, nguồn trả nợ minh bạch và tài sản đảm bảo đầy đủ pháp lý.'
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
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-4">
          <div className="modal-header border-0 pb-0">
            <div>
              <span className="badge bg-primary-subtle text-primary mb-1">
                {appraisal.maBCTD} • {appraisal.hoTen}
              </span>
              <h5 className="modal-title fw-bold text-dark font-heading">
                Ý Kiến Đánh Giá & Phê Duyệt Cấp Tín Dụng
              </h5>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body py-3">
              {/* Lịch sử các ý kiến đã có */}
              {appraisal.danhSachYKien && appraisal.danhSachYKien.length > 0 && (
                <div className="mb-3">
                  <h6 className="fw-bold text-dark small mb-2">Lịch Sử Các Ý Kiến Đánh Giá Trước Đó:</h6>
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: 180, overflowY: 'auto' }}>
                    {appraisal.danhSachYKien.map((yk, idx) => (
                      <div key={idx} className="p-2 bg-light rounded-3 border small">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong className="text-dark">
                            {yk.nguoiDanhGia} ({yk.chucVu})
                          </strong>
                          <span className={`badge ${yk.yKien === 'Đồng ý' ? 'bg-success' : 'bg-danger'}`}>
                            {yk.yKien}
                          </span>
                        </div>
                        <p className="m-0 text-muted">{yk.noiDung}</p>
                        <span className="text-muted" style={{ fontSize: '0.68rem' }}>{yk.ngayDanhGia}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-light rounded-3 border">
                <h6 className="fw-bold text-primary small mb-3">Thêm Ý Kiến / Phê Duyệt Mới Của Bạn:</h6>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-dark">Họ Và Tên Người Đánh Giá (*)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm fw-bold"
                      value={opinionData.nguoiDanhGia}
                      onChange={(e) => setOpinionData({ ...opinionData, nguoiDanhGia: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-dark">Chức Vụ / Vai Trò</label>
                    <select
                      className="form-select form-select-sm"
                      value={opinionData.chucVu}
                      onChange={(e) => setOpinionData({ ...opinionData, chucVu: e.target.value })}
                    >
                      <option value="Cán Bộ Tín Dụng">Cán Bộ Tín Dụng</option>
                      <option value="Ban Kiểm Soát">Ban Kiểm Soát</option>
                      <option value="Ban Giám Đốc / HĐQT">Ban Giám Đốc / HĐQT</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-dark">Kết Luận Đánh Giá</label>
                    <select
                      className="form-select form-select-sm fw-bold"
                      value={opinionData.yKien}
                      onChange={(e) => setOpinionData({ ...opinionData, yKien: e.target.value })}
                    >
                      <option value="Đồng ý">✅ Đồng ý phê duyệt</option>
                      <option value="Có điều kiện">⚠️ Cần bổ sung điều kiện</option>
                      <option value="Không đồng ý">❌ Không đồng ý</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold text-dark">Nội Dung Ý Kiến & Ghi Chú (*)</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder="Nhập chi tiết đánh giá rủi ro, nhận xét về năng lực tài chính và kết luận..."
                      value={opinionData.noiDung}
                      onChange={(e) => setOpinionData({ ...opinionData, noiDung: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn btn-light" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn btn-brand fw-bold">
                Lưu Ý Kiến Đánh Giá
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
