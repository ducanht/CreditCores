import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Edit3,
  AlertCircle,
  Search,
  CheckCircle2,
  Calendar,
  FileText,
  CreditCard,
  Printer,
  X,
  Phone,
  MapPin,
  ShieldCheck,
  Layers,
  ArrowRight
} from 'lucide-react';
import { formatCurrencyVN, formatDateVN } from '../../utils/dateUtils';

export default function DebitRegisterModal({
  show,
  onClose,
  onSubmit,
  editingItem = null,
  prefilledCustomer = null,
  allCustomers = [],
  allContracts = [],
  registrations = [],
  onPrintAgreement
}) {
  if (!show) return null;

  const isEdit = Boolean(editingItem);

  // --- STATE FORM ĐĂNG KÝ ---
  const [formData, setFormData] = useState({
    maKH: '',
    hoTen: '',
    cccd: '',
    ngayCap: '',
    dienThoai: '',
    diaChi: '',
    soTK: '',
    kyTrichMacDinh: 0, // 0: Linh hoạt theo ngày vay của HĐTD
    trangThai: 'Hiệu lực',
    ghiChu: 'Ủy quyền trích nợ tự động tài khoản thanh toán CASA'
  });

  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map danh sách đăng ký hiện có theo cleanMaKH
  const existingRegMap = useMemo(() => {
    const map = {};
    (registrations || []).forEach(r => {
      const clean = String(r.maKH || '').replace(/^'/, '').trim();
      if (clean) map[clean] = r;
    });
    return map;
  }, [registrations]);

  // Danh sách khách hàng đang có dư nợ hoặc đang có hợp đồng vay
  const candidateCustomers = useMemo(() => {
    const term = customerSearchTerm.toLowerCase().trim();
    return (allCustomers || [])
      .filter(c => {
        if (!term) return true;
        const ma = String(c.maKH || '').toLowerCase();
        const ten = String(c.hoTen || '').toLowerCase();
        const cccd = String(c.cccd || c.gttt || '').toLowerCase();
        const sdt = String(c.dienThoai || c.dienThoaiDD || '').toLowerCase();
        return ma.includes(term) || ten.includes(term) || cccd.includes(term) || sdt.includes(term);
      })
      .slice(0, 30); // Giới hạn 30 kết quả cho nhanh
  }, [allCustomers, customerSearchTerm]);

  // Các hợp đồng vay của khách hàng đang chọn
  const selectedCustContracts = useMemo(() => {
    if (!formData.maKH) return [];
    const clean = String(formData.maKH).replace(/^'/, '').trim();
    return (allContracts || []).filter(c => {
      const cMa = String(c.maKH || '').replace(/^'/, '').trim();
      return cMa === clean && (Number(c.duNo) > 0 || c.trangThaiHD === 'DANG_VAY');
    });
  }, [formData.maKH, allContracts]);

  // Khởi tạo form khi mở modal
  useEffect(() => {
    if (editingItem) {
      setFormData({
        maKH: String(editingItem.maKH || '').replace(/^'/, ''),
        hoTen: editingItem.hoTen || editingItem.tenKH || '',
        cccd: String(editingItem.cccd || editingItem.gttt || '').replace(/^'/, ''),
        ngayCap: editingItem.ngayCap || '',
        dienThoai: String(editingItem.dienThoai || '').replace(/^'/, ''),
        diaChi: editingItem.diaChi || '',
        soTK: String(editingItem.soTK || '').replace(/^'/, ''),
        kyTrichMacDinh: Number(editingItem.kyTrichMacDinh || editingItem.kyTrich || 0),
        trangThai: editingItem.trangThai || 'Hiệu lực',
        ghiChu: editingItem.ghiChu || 'Ủy quyền trích nợ tự động tài khoản thanh toán CASA'
      });
      setFormError('');
    } else if (prefilledCustomer) {
      handleSelectCustomer(prefilledCustomer);
    } else {
      setFormData({
        maKH: '',
        hoTen: '',
        cccd: '',
        ngayCap: '',
        dienThoai: '',
        diaChi: '',
        soTK: '',
        kyTrichMacDinh: 0,
        trangThai: 'Hiệu lực',
        ghiChu: 'Ủy quyền trích nợ tự động tài khoản thanh toán CASA'
      });
      setCustomerSearchTerm('');
      setFormError('');
    }
  }, [editingItem, prefilledCustomer, show]);

  const handleSelectCustomer = (cust) => {
    const cleanMa = String(cust.maKH || '').replace(/^'/, '').trim();
    const cleanCCCD = String(cust.cccd || cust.gttt || '').replace(/^'/, '').trim();
    const cleanSoTK = String(cust.soTK || '').replace(/^'/, '').trim();
    const cleanSDT = String(cust.dienThoai || cust.dienThoaiDD || '').replace(/^'/, '').trim();

    setFormData(prev => ({
      ...prev,
      maKH: cleanMa,
      hoTen: cust.hoTen || '',
      cccd: cleanCCCD,
      ngayCap: cust.ngayCap || '',
      dienThoai: cleanSDT,
      diaChi: cust.diaChi || cust.khuVuc || '',
      soTK: cleanSoTK || prev.soTK,
      ghiChu: prev.ghiChu || 'Ủy quyền trích nợ tự động tài khoản thanh toán CASA'
    }));

    setShowCustomerDropdown(false);
    setFormError('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = async (andPrint = false) => {
    if (!formData.maKH) {
      setFormError('Vui lòng chọn khách hàng cần đăng ký thỏa thuận trích nợ!');
      return;
    }
    if (!formData.soTK) {
      setFormError('Số tài khoản tiền gửi thanh toán (CASA) không được để trống!');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await onSubmit(formData);
      if (andPrint && onPrintAgreement) {
        onPrintAgreement(formData);
      }
    } catch (e) {
      setFormError(e.message || 'Lỗi lưu thỏa thuận trích nợ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0 rounded-3">
          {/* Header */}
          <div className="modal-header bg-gradient bg-primary text-white py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 bg-white bg-opacity-20 rounded-circle text-white">
                {isEdit ? <Edit3 size={20} /> : <UserCheck size={20} />}
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0">
                  {isEdit ? 'Cập Nhật Thỏa Thuận Trích Nợ' : 'Đăng Ký Trích Nợ Tự Động CASA'}
                </h5>
                <small className="text-white-50">
                  Ủy quyền trích nợ tự động tài khoản tiền gửi thanh toán phục vụ thu nợ vay
                </small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={isSubmitting}></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {formError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3 shadow-sm border-0">
                <AlertCircle size={18} className="text-danger flex-shrink-0" />
                <span className="small">{formError}</span>
              </div>
            )}

            {/* BƯỚC 1: TÌM KIẾM KHÁCH HÀNG (Nếu là thêm mới) */}
            {!isEdit && (
              <div className="mb-3 position-relative">
                <label className="form-label fw-bold small text-muted text-uppercase mb-1">
                  1. Tìm Kiếm Khách Hàng Đang Có Dư Nợ
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Nhập tên, số CCCD hoặc Mã KH để tìm nhanh..."
                    value={customerSearchTerm}
                    onChange={(e) => {
                      setCustomerSearchTerm(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                  />
                  {customerSearchTerm && (
                    <button
                      className="btn btn-outline-secondary border"
                      type="button"
                      onClick={() => {
                        setCustomerSearchTerm('');
                        setShowCustomerDropdown(false);
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Dropdown gợi ý khách hàng */}
                {showCustomerDropdown && candidateCustomers.length > 0 && (
                  <div
                    className="dropdown-menu show w-100 shadow border-0 mt-1 py-1 overflow-auto"
                    style={{ maxHeight: '240px', zIndex: 1060 }}
                  >
                    <div className="dropdown-header small text-uppercase fw-bold text-primary">
                      Gợi ý khách hàng ({candidateCustomers.length})
                    </div>
                    {candidateCustomers.map((cust) => {
                      const cMa = String(cust.maKH || '').replace(/^'/, '');
                      const isReg = Boolean(existingRegMap[cMa]);
                      return (
                        <button
                          key={cMa}
                          type="button"
                          className="dropdown-item py-2 px-3 d-flex justify-content-between align-items-center border-bottom border-light"
                          onClick={() => handleSelectCustomer(cust)}
                        >
                          <div>
                            <div className="fw-bold text-dark d-flex align-items-center gap-2">
                              <span>{cust.hoTen}</span>
                              <span className="badge bg-light text-secondary border font-monospace small">
                                {cMa}
                              </span>
                              {isReg && (
                                <span className="badge bg-success-subtle text-success border border-success-subtle small">
                                  Đã đăng ký
                                </span>
                              )}
                            </div>
                            <div className="small text-muted d-flex gap-3 mt-1">
                              <span>CCCD: {cust.cccd || cust.gttt || '---'}</span>
                              <span>SĐT: {cust.dienThoai || cust.dienThoaiDD || '---'}</span>
                              <span>STK CASA: <strong>{cust.soTK || 'Chưa có'}</strong></span>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="small fw-bold text-danger">
                              {Number(cust.tongDuNoHienTai || 0).toLocaleString('vi-VN')} đ
                            </div>
                            <small className="text-muted">{cust.soLuongHDVay || 0} món vay</small>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* BƯỚC 2: THÔNG TIN KHÁCH HÀNG & THỎA THUẬN */}
            <div className="card-modern p-3 mb-3 bg-light bg-opacity-50">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Mã Khách Hàng</label>
                  <input
                    type="text"
                    className="form-control font-monospace bg-white fw-bold"
                    value={formData.maKH}
                    readOnly
                    placeholder="Chưa chọn KH"
                  />
                </div>

                <div className="col-md-8">
                  <label className="form-label small fw-bold text-muted mb-1">Họ và Tên Khách Hàng *</label>
                  <input
                    type="text"
                    className="form-control fw-bold bg-white"
                    value={formData.hoTen}
                    onChange={(e) => handleInputChange('hoTen', e.target.value)}
                    placeholder="Họ và tên khách hàng"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Số CCCD / GTTT</label>
                  <input
                    type="text"
                    className="form-control font-monospace bg-white"
                    value={formData.cccd}
                    onChange={(e) => handleInputChange('cccd', e.target.value)}
                    placeholder="Số CCCD 12 số"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Ngày Cấp GTTT</label>
                  <input
                    type="text"
                    className="form-control bg-white"
                    value={formData.ngayCap}
                    onChange={(e) => handleInputChange('ngayCap', e.target.value)}
                    placeholder="dd/MM/yyyy"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    className="form-control bg-white"
                    value={formData.dienThoai}
                    onChange={(e) => handleInputChange('dienThoai', e.target.value)}
                    placeholder="Số điện thoại liên hệ"
                  />
                </div>

                <div className="col-md-8">
                  <label className="form-label small fw-bold text-muted mb-1">Địa Chỉ Thường Trú</label>
                  <input
                    type="text"
                    className="form-control bg-white"
                    value={formData.diaChi}
                    onChange={(e) => handleInputChange('diaChi', e.target.value)}
                    placeholder="Thôn, xã, huyện..."
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold text-primary mb-1">
                    <CreditCard size={14} className="me-1 inline" />
                    Số Tài Khoản CASA (Trích nợ) *
                  </label>
                  <input
                    type="text"
                    className="form-control font-monospace fw-bold text-primary border-primary bg-white"
                    value={formData.soTK}
                    onChange={(e) => handleInputChange('soTK', e.target.value)}
                    placeholder="Số TK tiền gửi thanh toán"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">
                    <Calendar size={14} className="me-1 inline" />
                    Kỳ Trích Nợ Định Kỳ
                  </label>
                  <select
                    className="form-select bg-white"
                    value={formData.kyTrichMacDinh}
                    onChange={(e) => handleInputChange('kyTrichMacDinh', Number(e.target.value))}
                  >
                    <option value={0}>✨ Linh hoạt theo Ngày vay của từng HĐTD (Khuyên dùng)</option>
                    <option value={1}>Đợt 1 (Ngày 05 hàng tháng - Cho HĐ vay ngày 26 đến 04)</option>
                    <option value={2}>Đợt 2 (Ngày 15 hàng tháng - Cho HĐ vay ngày 05 đến 15)</option>
                    <option value={3}>Đợt 3 (Ngày 25 hàng tháng - Cho HĐ vay ngày 16 đến 25)</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Trạng Thái Thỏa Thuận</label>
                  <select
                    className="form-select bg-white"
                    value={formData.trangThai}
                    onChange={(e) => handleInputChange('trangThai', e.target.value)}
                  >
                    <option value="Hiệu lực">Hiệu lực (Đang hoạt động trích nợ)</option>
                    <option value="Tạm ngưng">Tạm ngưng (Tạm dừng trích kỳ này)</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-muted mb-1">Ghi Chú Ủy Quyền</label>
                  <input
                    type="text"
                    className="form-control bg-white"
                    value={formData.ghiChu}
                    onChange={(e) => handleInputChange('ghiChu', e.target.value)}
                    placeholder="Nội dung ghi chú hoặc số thỏa thuận ủy quyền..."
                  />
                </div>
              </div>
            </div>

            {/* BƯỚC 3: XEM TRƯỚC CÁC HỢP ĐỒNG ĐANG VAY CỦA KHÁCH HÀNG NÀY */}
            {formData.maKH && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label fw-bold small text-muted text-uppercase mb-0">
                    Các Hợp Đồng Vay Của Khách Hàng Này ({selectedCustContracts.length})
                  </label>
                  <small className="text-muted">
                    Hệ thống sẽ tự động liên kết các HĐ này khi đến đợt trích nợ
                  </small>
                </div>

                {selectedCustContracts.length === 0 ? (
                  <div className="alert alert-warning py-2 small mb-0">
                    Khách hàng hiện không có hợp đồng vay nào đang có dư nợ. Bạn vẫn có thể lưu thỏa thuận để áp dụng khi giải ngân món mới.
                  </div>
                ) : (
                  <div className="table-responsive border rounded bg-white" style={{ maxHeight: '180px' }}>
                    <table className="table table-sm table-hover mb-0 align-middle">
                      <thead className="table-light small">
                        <tr>
                          <th>Số HĐTD</th>
                          <th>Ngày Vay</th>
                          <th>Đến Hạn</th>
                          <th>Trả Lãi Đến</th>
                          <th className="text-end">Dư Nợ</th>
                          <th className="text-end">Lãi Suất</th>
                          <th>Đợt Tương Ứng</th>
                        </tr>
                      </thead>
                      <tbody className="small">
                        {selectedCustContracts.map(ct => {
                          const dayVay = ct.ngayVay ? parseInt(String(ct.ngayVay).split('/')[0], 10) : 0;
                          let suggestedDot = 'Đợt 2 (15)';
                          if (dayVay >= 26 || (dayVay >= 1 && dayVay <= 4)) suggestedDot = 'Đợt 1 (05)';
                          else if (dayVay >= 5 && dayVay <= 15) suggestedDot = 'Đợt 2 (15)';
                          else if (dayVay >= 16 && dayVay <= 25) suggestedDot = 'Đợt 3 (25)';

                          return (
                            <tr key={ct.soHDTD}>
                              <td className="fw-bold font-monospace text-primary">{ct.soHDTD}</td>
                              <td>{ct.ngayVay || '---'}</td>
                              <td>{ct.denHan || '---'}</td>
                              <td>{ct.traLaiDenNgay || '---'}</td>
                              <td className="text-end fw-bold text-danger">
                                {Number(ct.duNo || 0).toLocaleString('vi-VN')} đ
                              </td>
                              <td className="text-end">{ct.laiSuat || 9.5}%</td>
                              <td>
                                <span className="badge bg-primary-subtle text-primary small">
                                  {suggestedDot}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light py-2 px-4 d-flex justify-content-between">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose} disabled={isSubmitting}>
              Đóng
            </button>
            <div className="d-flex gap-2">
              {formData.maKH && onPrintAgreement && (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                >
                  <Printer size={15} />
                  <span>Lưu & In Đơn Đề Nghị A4</span>
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm px-3"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
              >
                <CheckCircle2 size={15} />
                <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Thỏa Thuận'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
