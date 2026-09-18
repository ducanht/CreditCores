import React, { useState, useEffect } from 'react';
import { UserCheck, Edit3, AlertCircle } from 'lucide-react';
import { isValidCCCD } from '../../utils/validators';

export default function DebitRegisterModal({
  show,
  onClose,
  onSubmit,
  editingItem = null,
  prefilledCustomer = null,
  allCustomers = [],
  allContracts = []
}) {
  const isEdit = Boolean(editingItem);

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

  useEffect(() => {
    if (editingItem) {
      setFormData({
        maKH: editingItem.maKH || '',
        hoTen: editingItem.hoTen || '',
        gttt: editingItem.gttt || '',
        soTK: editingItem.soTK || '',
        diaChi: editingItem.diaChi || '',
        kyTrich: Number(editingItem.kyTrich) || 1,
        trangThai: editingItem.trangThai || 'Hiệu lực',
        ghiChu: editingItem.ghiChu || ''
      });
      const custContracts = allContracts.filter((c) => c.maKH === editingItem.maKH && (c.duNo > 0 || c.trangThai !== 'Đã tất toán'));
      setContractList(custContracts);
      setFormError('');
    } else if (prefilledCustomer) {
      handleSelectCustomer(prefilledCustomer.maKH, prefilledCustomer);
    } else {
      setFormData({
        maKH: '',
        hoTen: '',
        gttt: '',
        soTK: '',
        diaChi: '',
        kyTrich: 1,
        trangThai: 'Hiệu lực',
        ghiChu: ''
      });
      setContractList([]);
      setFormError('');
    }
  }, [editingItem, prefilledCustomer, show]);

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

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold text-dark font-heading d-flex align-items-center gap-2">
              {isEdit ? (
                <>
                  <Edit3 size={20} className="text-primary" /> Chỉnh Sửa Thỏa Thuận Trích Nợ Tự Động CASA
                </>
              ) : (
                <>
                  <UserCheck size={20} className="text-primary" /> Đăng Ký Thỏa Thuận Trích Nợ Tự Động CASA
                </>
              )}
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

              {/* Khối Chọn Khách Hàng (chỉ hiện khi Đăng ký mới) */}
              {!isEdit && (
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <label className="form-label small fw-bold text-primary mb-1.5 d-flex justify-content-between">
                    <span>Chọn Thành Viên / Khách Hàng:</span>
                    <span className="badge bg-primary-subtle text-primary small">Danh bạ {allCustomers.length} KH</span>
                  </label>
                  <select
                    className="form-select form-select-sm fw-bold border-primary"
                    value={formData.maKH}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    required
                  >
                    <option value="">-- Bấm để chọn Khách Hàng ({allCustomers.length} KH) --</option>
                    {allCustomers.map((c) => (
                      <option key={c.maKH} value={c.maKH}>
                        {c.hoTen} • Mã: {c.maKH} • CCCD: {c.cccd || c.gttt} • TK CASA: {c.soTK || 'Chưa có'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-bold text-dark">Mã Khách Hàng</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace fw-bold bg-light"
                    placeholder="KH008892"
                    value={formData.maKH}
                    readOnly
                  />
                </div>

                <div className="col-12 col-md-8">
                  <label className="form-label small fw-bold text-dark">Họ Và Tên Khách Hàng</label>
                  <input
                    type="text"
                    className="form-control form-control-sm fw-bold bg-light"
                    placeholder="NGUYỄN VĂN AN"
                    value={formData.hoTen}
                    readOnly
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-dark">Số CCCD (12 chữ số)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace bg-light"
                    placeholder="038088001234"
                    maxLength={12}
                    value={formData.gttt}
                    readOnly
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-dark">Số Tài Khoản CASA</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace fw-bold text-success"
                    placeholder="010000001888"
                    value={formData.soTK}
                    onChange={(e) => setFormData({ ...formData, soTK: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-dark">Địa Chỉ Thường Trú</label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-light"
                    placeholder="Thôn 3, Xã Yên Thọ..."
                    value={formData.diaChi}
                    readOnly
                  />
                </div>

                <div className="col-12 col-md-6">
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

                <div className="col-12 col-md-6">
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

                <div className="col-12">
                  <label className="form-label small fw-bold text-dark">Ghi Chú Nghiệp Vụ</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ghi chú chi tiết hoặc thỏa thuận riêng..."
                    value={formData.ghiChu}
                    onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
                  />
                </div>

                {/* Danh sách HĐTD đang vay */}
                {contractList.length > 0 && (
                  <div className="col-12 mt-2">
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
                Đóng
              </button>
              <button type="submit" className="btn btn-brand fw-bold">
                {isEdit ? 'Cập Nhật Thỏa Thuận' : 'Lưu Thỏa Thuận Trích Nợ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
