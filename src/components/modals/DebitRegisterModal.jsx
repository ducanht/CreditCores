import React, { useState, useEffect } from 'react';
import { UserCheck, AlertCircle } from 'lucide-react';
import { isValidCCCD } from '../../utils/validators';

export default function DebitRegisterModal({
  show,
  onClose,
  onSubmit,
  prefilledCustomer = null,
  allCustomers = [],
  allContracts = []
}) {
  const [formData, setFormData] = useState({
    maKH: '',
    hoTen: '',
    gttt: '',
    soTK: '',
    diaChi: '',
    kyTrich: 1,
    trangThai: 'Hiệu lực',
    ghiChu: ''
  });

  const [contractList, setContractList] = useState([]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (prefilledCustomer) {
      handleSelectCustomer(prefilledCustomer.maKH, prefilledCustomer);
    }
  }, [prefilledCustomer]);

  if (!show) return null;

  const handleSelectCustomer = (maKH, customObj = null) => {
    const cust = customObj || allCustomers.find((c) => c.maKH === maKH);
    if (cust) {
      setFormData((prev) => ({
        ...prev,
        maKH: cust.maKH,
        hoTen: cust.hoTen || '',
        gttt: cust.cccd || cust.gttt || '',
        soTK: cust.soTK || '',
        diaChi: cust.diaChi || ''
      }));

      const custContracts = allContracts.filter((c) => c.maKH === cust.maKH && (c.duNo > 0 || c.trangThai !== 'Đã tất toán'));
      setContractList(custContracts);
      setFormError('');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.maKH || !formData.hoTen || !formData.soTK) {
      setFormError('Vui lòng điền đầy đủ Mã KH, Họ tên và Số tài khoản CASA.');
      return;
    }

    if (formData.gttt && !isValidCCCD(formData.gttt)) {
      setFormError('Số CCCD không hợp lệ (Phải đúng 12 chữ số bắt đầu bằng số 0).');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold text-dark font-heading d-flex align-items-center gap-2">
              <UserCheck size={20} className="text-primary" /> Đăng Ký Thỏa Thuận Trích Nợ Tự Động CASA
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
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-dark">Mã Khách Hàng (*)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace fw-bold"
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

                <div className="col-md-8">
                  <label className="form-label small fw-bold text-dark">Họ Và Tên Khách Hàng (*)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm fw-bold"
                    placeholder="NGUYỄN VĂN AN"
                    value={formData.hoTen}
                    onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-dark">Số CCCD (12 chữ số)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace"
                    placeholder="038088001234"
                    maxLength={12}
                    value={formData.gttt}
                    onChange={(e) => setFormData({ ...formData, gttt: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-dark">Số Tài Khoản Thanh Toán CASA (*)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace fw-bold text-success"
                    placeholder="3500205123456"
                    value={formData.soTK}
                    onChange={(e) => setFormData({ ...formData, soTK: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-dark">Địa Chỉ Thường Trú</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Thôn 3, Xã Yên Thọ..."
                    value={formData.diaChi}
                    onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-dark">Kỳ Trích Nợ Đăng Ký</label>
                  <select
                    className="form-select form-select-sm fw-bold"
                    value={formData.kyTrich}
                    onChange={(e) => setFormData({ ...formData, kyTrich: Number(e.target.value) })}
                  >
                    <option value={1}>Kỳ 1 (Ngày 05 hàng tháng)</option>
                    <option value={2}>Kỳ 2 (Ngày 15 hàng tháng)</option>
                    <option value={3}>Kỳ 3 (Ngày 25 hàng tháng)</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-dark">Trạng Thái Thỏa Thuận</label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.trangThai}
                    onChange={(e) => setFormData({ ...formData, trangThai: e.target.value })}
                  >
                    <option value="Hiệu lực">Hiệu lực</option>
                    <option value="Tạm ngưng">Tạm ngưng</option>
                    <option value="Hủy">Hủy đăng ký</option>
                  </select>
                </div>

                {/* Danh sách HĐTD đang vay */}
                {contractList.length > 0 && (
                  <div className="col-12 mt-3">
                    <div className="p-3 bg-light rounded-3 border">
                      <strong className="text-dark small mb-2 d-block">
                        Các Hợp Đồng Tín Dụng Hiện Hữu Của Khách Hàng:
                      </strong>
                      <ul className="list-unstyled m-0 small d-flex flex-column gap-1">
                        {contractList.map((c, i) => (
                          <li key={i} className="d-flex justify-content-between text-muted">
                            <span>
                              • <strong className="text-primary">{c.soHDTD}</strong> ({c.ngayVay || '---'})
                            </span>
                            <span>
                              Dư nợ: <strong className="text-danger">{Number(c.duNo || 0).toLocaleString('vi-VN')} đ</strong> (LS: {c.laiSuat || 9.5}%)
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn btn-light" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn btn-brand fw-bold">
                Lưu Thỏa Thuận Trích Nợ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
