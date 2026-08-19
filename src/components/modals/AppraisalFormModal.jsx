import React, { useState, useEffect } from 'react';
import { FileCheck2, AlertCircle } from 'lucide-react';
import ThousandInput from '../ThousandInput';
import { isValidCCCD } from '../../utils/validators';

export default function AppraisalFormModal({
  show,
  onClose,
  onSubmit,
  prefilledCustomer = null,
  allCustomers = []
}) {
  const [formData, setFormData] = useState({
    maBCTD: '',
    maKH: '',
    hoTen: '',
    soCCCD: '',
    deXuatVay: 200000000,
    duyetVay: 200000000,
    thoiHanThang: 12,
    laiSuatDuyet: 9.5,
    thuNhapThang: 30000000,
    chiPhiThang: 12000000,
    xepHangCIC: 'Nhóm 1 (Tốt)',
    soTCTDQuanHe: 1,
    duNoCICNgoai: 0,
    ghiChuCIC: 'Lịch sử trả nợ đầy đủ, không có nợ quá hạn.',
    loaiTSBD: 'Quyền sử dụng đất (Sổ đỏ)',
    chuSoHuuTSBD: 'Chính chủ',
    moTaTSBD: 'Thửa đất số 112, tờ bản đồ số 08, diện tích 250m2 tại Xã Yên Thọ',
    giaTriTSBD: 600000000,
    canBoThamDinh: 'Lê Văn Tín',
    ketLuan: 'Đồng ý cấp tín dụng'
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (prefilledCustomer) {
      handleSelectCustomer(prefilledCustomer.maKH, prefilledCustomer);
    } else {
      setFormData((prev) => ({
        ...prev,
        maBCTD: 'BCTD-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000))
      }));
    }
  }, [prefilledCustomer]);

  if (!show) return null;

  const handleSelectCustomer = (maKH, customObj = null) => {
    const cust = customObj || allCustomers.find((c) => c.maKH === maKH);
    if (cust) {
      setFormData((prev) => ({
        ...prev,
        maKH: cust.maKH,
        hoTen: cust.hoTen || prev.hoTen,
        soCCCD: cust.cccd || cust.gttt || prev.soCCCD,
        chuSoHuuTSBD: cust.hoTen || prev.chuSoHuuTSBD
      }));
      setFormError('');
    }
  };

  const tyLeLTV = formData.giaTriTSBD > 0 ? ((formData.duyetVay / formData.giaTriTSBD) * 100).toFixed(1) : 0;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.maKH || !formData.hoTen) {
      setFormError('Vui lòng điền đầy đủ Mã KH và Họ tên.');
      return;
    }

    if (formData.soCCCD && !isValidCCCD(formData.soCCCD)) {
      setFormError('Số CCCD không hợp lệ (Phải đúng 12 chữ số bắt đầu bằng số 0).');
      return;
    }

    onSubmit({
      ...formData,
      tyLeLTV: Number(tyLeLTV)
    });
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold text-dark font-heading d-flex align-items-center gap-2">
              <FileCheck2 size={20} className="text-primary" /> Lập Hồ Sơ Thẩm Định Tín Dụng & Định Giá TSĐB
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleFormSubmit}>
            <div className="modal-body py-3">
              {formError && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small mb-3">
                  <AlertCircle size={16} />
                  <div>{formError}</div>
                </div>
              )}

              <div className="row g-3">
                {/* 1. Thông tin Khách hàng */}
                <div className="col-12">
                  <h6 className="fw-bold text-primary small m-0 border-bottom pb-1">1. Thông Tin Khách Hàng & Nhu Cầu Vốn</h6>
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-dark">Mã BCTD (*)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace fw-bold"
                    value={formData.maBCTD}
                    onChange={(e) => setFormData({ ...formData, maBCTD: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-dark">Mã Khách Hàng (*)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace fw-bold text-primary"
                    placeholder="KH008892"
                    value={formData.maKH}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setFormData({ ...formData, maKH: val });
                      handleSelectCustomer(val);
                    }}
                    required
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-dark">Họ Và Tên (*)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm fw-bold"
                    placeholder="NGUYỄN VĂN AN"
                    value={formData.hoTen}
                    onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-dark">Số CCCD (12 số)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace"
                    placeholder="038088001234"
                    maxLength={12}
                    value={formData.soCCCD}
                    onChange={(e) => setFormData({ ...formData, soCCCD: e.target.value })}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-dark">Số Tiền Đề Xuất Vay</label>
                  <ThousandInput
                    value={formData.deXuatVay}
                    onChange={(val) => setFormData({ ...formData, deXuatVay: val })}
                    className="form-control form-control-sm fw-bold"
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-dark">Số Tiền Duyệt Vay (*)</label>
                  <ThousandInput
                    value={formData.duyetVay}
                    onChange={(val) => setFormData({ ...formData, duyetVay: val })}
                    className="form-control form-control-sm fw-bold text-danger"
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-dark">Thời Hạn (Tháng)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm text-center fw-bold"
                    value={formData.thoiHanThang}
                    onChange={(e) => setFormData({ ...formData, thoiHanThang: Number(e.target.value) })}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-dark">Lãi Suất Duyệt (%/năm)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control form-control-sm text-center fw-bold text-success"
                    value={formData.laiSuatDuyet}
                    onChange={(e) => setFormData({ ...formData, laiSuatDuyet: Number(e.target.value) })}
                  />
                </div>

                {/* 2. Đánh giá CIC & Tài chính */}
                <div className="col-12 mt-3">
                  <h6 className="fw-bold text-primary small m-0 border-bottom pb-1">2. Đánh Giá CIC & Khả Năng Tài Chính</h6>
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-dark">Xếp Hạng CIC</label>
                  <select
                    className="form-select form-select-sm fw-bold"
                    value={formData.xepHangCIC}
                    onChange={(e) => setFormData({ ...formData, xepHangCIC: e.target.value })}
                  >
                    <option value="Nhóm 1 (Tốt)">Nhóm 1 (Nợ đủ tiêu chuẩn)</option>
                    <option value="Nhóm 2 (Cần chú ý)">Nhóm 2 (Nợ cần chú ý)</option>
                    <option value="Nhóm 3 (Dưới chuẩn)">Nhóm 3 (Nợ dưới tiêu chuẩn)</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-dark">Thu Nhập Hàng Tháng</label>
                  <ThousandInput
                    value={formData.thuNhapThang}
                    onChange={(val) => setFormData({ ...formData, thuNhapThang: val })}
                    className="form-control form-control-sm text-success fw-bold"
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-dark">Chi Phí Sinh Hoạt / Tháng</label>
                  <ThousandInput
                    value={formData.chiPhiThang}
                    onChange={(val) => setFormData({ ...formData, chiPhiThang: val })}
                    className="form-control form-control-sm text-danger"
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-dark">Dư Nợ CIC Ngoài</label>
                  <ThousandInput
                    value={formData.duNoCICNgoai}
                    onChange={(val) => setFormData({ ...formData, duNoCICNgoai: val })}
                    className="form-control form-control-sm"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-dark">Ghi Chú Đánh Giá CIC & Nguồn Thu</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.ghiChuCIC}
                    onChange={(e) => setFormData({ ...formData, ghiChuCIC: e.target.value })}
                  />
                </div>

                {/* 3. Tài sản bảo đảm & LTV */}
                <div className="col-12 mt-3">
                  <h6 className="fw-bold text-primary small m-0 border-bottom pb-1">3. Định Giá Tài Sản Bảo Đảm & Tỷ Lệ LTV</h6>
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold text-dark">Loại Tài Sản Thế Chấp</label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.loaiTSBD}
                    onChange={(e) => setFormData({ ...formData, loaiTSBD: e.target.value })}
                  >
                    <option value="Quyền sử dụng đất (Sổ đỏ)">Quyền sử dụng đất (Sổ đỏ / Sổ hồng)</option>
                    <option value="Phương tiện vận tải">Phương tiện vận tải (Ô tô, Xe máy)</option>
                    <option value="Sổ tiền gửi / Giấy tờ có giá">Sổ tiền gửi / Giấy tờ có giá</option>
                    <option value="Tín chấp hoàn toàn">Tín chấp (Không TSĐB)</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold text-dark">Giá Trị Định Giá TSĐB (VNĐ)</label>
                  <ThousandInput
                    value={formData.giaTriTSBD}
                    onChange={(val) => setFormData({ ...formData, giaTriTSBD: val })}
                    className="form-control form-control-sm text-primary fw-bold"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold text-dark">Tỷ Lệ Cho Vay / TSĐB (LTV)</label>
                  <div className="form-control form-control-sm bg-light fw-bold text-danger text-center">
                    {tyLeLTV}% {Number(tyLeLTV) > 75 ? '(⚠️ Vượt mức chuẩn 70%)' : '(✅ An toàn)'}
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-dark">Cán Bộ Lập Báo Cáo Thẩm Định</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.canBoThamDinh}
                    onChange={(e) => setFormData({ ...formData, canBoThamDinh: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-dark">Kết Luận Của CBTD</label>
                  <select
                    className="form-select form-select-sm fw-bold"
                    value={formData.ketLuan}
                    onChange={(e) => setFormData({ ...formData, ketLuan: e.target.value })}
                  >
                    <option value="Đồng ý cấp tín dụng">Đồng ý cấp tín dụng</option>
                    <option value="Có điều kiện bổ sung">Có điều kiện bổ sung</option>
                    <option value="Từ chối cấp tín dụng">Từ chối cấp tín dụng</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn btn-light" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn btn-brand fw-bold">
                Lưu Báo Cáo Thẩm Định
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
