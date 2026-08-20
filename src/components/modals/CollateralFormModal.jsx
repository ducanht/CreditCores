import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  Search,
  Plus,
  Trash2,
  FileText,
  Building2,
  Calendar,
  Lock,
  DollarSign,
  Percent,
  CheckCircle2,
  Upload
} from 'lucide-react';
import ThousandInput from '../ThousandInput';
import { formatCurrencyVN, getTodayVN } from '../../utils/dateUtils';

export default function CollateralFormModal({
  show,
  onClose,
  onSubmit,
  selectedCollateral = null,
  allCustomers = [],
  allContracts = []
}) {
  const [formData, setFormData] = useState({
    maTSBD: '',
    soGCN: '',
    soVaoSoCapGCN: '',
    ngayCapGCN: '',
    noiCapGCN: 'Sở Tài Nguyên & Môi Trường tỉnh Thanh Hóa',
    maKH: '',
    chuSoHuu: '',
    cccdChuTS: '',
    quanHeChuTS: 'Chính chủ',
    nguoiDongSoHuu: '',
    thuaDatSo: '',
    toBanDoSo: '',
    diaChiThuaDat: '',
    dienTich: 200,
    hinhThucSuDung: 'Sử dụng riêng',
    chiTietPhanLoaiDat: [
      { id: '1', loaiDat: 'Đất ở tại nông thôn (ONT)', dienTich: 100, donGia: 3000000, thanhTien: 300000000 },
      { id: '2', loaiDat: 'Đất trồng cây lâu năm (CLN)', dienTich: 100, donGia: 1000000, thanhTien: 100000000 }
    ],
    giaTriCongTrinh: 150000000,
    nguonGocSuDung: 'Nhận chuyển nhượng quyền sử dụng đất',
    giaTriDinhGiaQTD: 550000000,
    giaTriThiTruong: 650000000,
    tyLeChoVayToiDa: 70,
    soTienDamBaoToiDa: 385000000,
    trangThaiTheChap: 'DANG_THE_CHAP',
    soHDTD_LienKet: '',
    soCongChung: '',
    ngayCongChung: '',
    vanPhongCongChung: 'Văn phòng Công chứng Yên Định',
    soDangKyGDBD: '',
    ngayDangKyGDBD: '',
    hinhAnhGCN: '',
    hinhAnhThucDia: ''
  });

  const [formError, setFormError] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => {
    if (selectedCollateral) {
      setFormData({
        ...selectedCollateral,
        chiTietPhanLoaiDat: Array.isArray(selectedCollateral.chiTietPhanLoaiDat)
          ? selectedCollateral.chiTietPhanLoaiDat
          : (typeof selectedCollateral.chiTietPhanLoaiDat === 'string' && selectedCollateral.chiTietPhanLoaiDat
              ? JSON.parse(selectedCollateral.chiTietPhanLoaiDat)
              : [
                  { id: '1', loaiDat: 'Đất ở tại nông thôn (ONT)', dienTich: 100, donGia: 3000000, thanhTien: 300000000 }
                ])
      });
    } else {
      setFormData({
        maTSBD: 'TSBD-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000)),
        soGCN: '',
        soVaoSoCapGCN: '',
        ngayCapGCN: getTodayVN(),
        noiCapGCN: 'Sở Tài Nguyên & Môi Trường tỉnh Thanh Hóa',
        maKH: '',
        chuSoHuu: '',
        cccdChuTS: '',
        quanHeChuTS: 'Chính chủ',
        nguoiDongSoHuu: '',
        thuaDatSo: '',
        toBanDoSo: '',
        diaChiThuaDat: '',
        dienTich: 200,
        hinhThucSuDung: 'Sử dụng riêng',
        chiTietPhanLoaiDat: [
          { id: '1', loaiDat: 'Đất ở tại nông thôn (ONT)', dienTich: 100, donGia: 3000000, thanhTien: 300000000 },
          { id: '2', loaiDat: 'Đất trồng cây lâu năm (CLN)', dienTich: 100, donGia: 1000000, thanhTien: 100000000 }
        ],
        giaTriCongTrinh: 150000000,
        nguonGocSuDung: 'Nhận chuyển nhượng quyền sử dụng đất',
        giaTriDinhGiaQTD: 550000000,
        giaTriThiTruong: 650000000,
        tyLeChoVayToiDa: 70,
        soTienDamBaoToiDa: 385000000,
        trangThaiTheChap: 'DANG_THE_CHAP',
        soHDTD_LienKet: '',
        soCongChung: '',
        ngayCongChung: '',
        vanPhongCongChung: 'Văn phòng Công chứng Yên Định',
        soDangKyGDBD: '',
        ngayDangKyGDBD: '',
        hinhAnhGCN: '',
        hinhAnhThucDia: ''
      });
    }
  }, [selectedCollateral]);

  if (!show) return null;

  const handleSelectCustomer = (maKH) => {
    const cust = allCustomers.find((c) => c.maKH === maKH);
    if (cust) {
      setFormData((prev) => ({
        ...prev,
        maKH: cust.maKH,
        chuSoHuu: cust.hoTen,
        cccdChuTS: cust.cccd || cust.gttt || '',
        diaChiThuaDat: prev.diaChiThuaDat || cust.diaChi || ''
      }));
      setFormError('');
    }
  };

  // Tính toán diện tích & giá trị đất
  const chiTietDat = formData.chiTietPhanLoaiDat || [];
  const tongDienTichDat = chiTietDat.reduce((sum, item) => sum + (Number(item.dienTich) || 0), 0);
  const tongGiaTriDat = chiTietDat.reduce((sum, item) => sum + (Number(item.thanhTien) || 0), 0);
  const giaTriCongTrinh = Number(formData.giaTriCongTrinh) || 0;
  const tongGiaTriDinhGia = tongGiaTriDat + giaTriCongTrinh;
  const hanMucDamBao = Math.round(tongGiaTriDinhGia * (Number(formData.tyLeChoVayToiDa || 70) / 100));

  const handleAddLandRow = () => {
    const newRow = {
      id: Date.now().toString(),
      loaiDat: 'Đất ở tại nông thôn (ONT)',
      dienTich: 50,
      donGia: 2000000,
      thanhTien: 100000000
    };
    setFormData((prev) => ({
      ...prev,
      chiTietPhanLoaiDat: [...(prev.chiTietPhanLoaiDat || []), newRow]
    }));
  };

  const handleUpdateLandRow = (index, field, val) => {
    setFormData((prev) => {
      const list = [...(prev.chiTietPhanLoaiDat || [])];
      const item = { ...list[index], [field]: val };
      if (field === 'dienTich' || field === 'donGia') {
        const dt = field === 'dienTich' ? Number(val) : Number(item.dienTich);
        const dg = field === 'donGia' ? Number(val) : Number(item.donGia);
        item.thanhTien = (dt || 0) * (dg || 0);
      }
      list[index] = item;
      return { ...prev, chiTietPhanLoaiDat: list };
    });
  };

  const handleRemoveLandRow = (index) => {
    setFormData((prev) => {
      const list = (prev.chiTietPhanLoaiDat || []).filter((_, i) => i !== index);
      return { ...prev, chiTietPhanLoaiDat: list };
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.soGCN) {
      setFormError('BẮT BUỘC: Số Giấy chứng nhận QSDĐ (Sổ đỏ) là khóa chính, không được để trống!');
      return;
    }
    if (!formData.maKH) {
      setFormError('BẮT BUỘC: Vui lòng chọn Chủ sở hữu / Khách hàng từ CSDL KH_CORE!');
      return;
    }

    const payload = {
      ...formData,
      dienTich: tongDienTichDat || formData.dienTich,
      giaTriDinhGiaQTD: tongGiaTriDinhGia,
      soTienDamBaoToiDa: hanMucDamBao
    };

    onSubmit(payload);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1055 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-4">
          {/* Header */}
          <div className="modal-header border-0 pb-0">
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded-2 bg-success-subtle text-success">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-slate-900 font-heading m-0">
                  {selectedCollateral ? 'Cập Nhật Tài Sản Thế Chấp (TSBD_CORE)' : 'Thêm Mới Tài Sản Bảo Đảm / Sổ Đỏ (TSBD_CORE)'}
                </h5>
                <span className="small text-muted">Khóa chính định danh: Số GCN QSDĐ • Liên kết Master KH_CORE</span>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleFormSubmit}>
            <div className="modal-body py-3 d-flex flex-column gap-3">
              {formError && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small">
                  <AlertCircle size={16} />
                  <div>{formError}</div>
                </div>
              )}

              {/* 1. Khối Chọn Khách Hàng Từ KH_CORE */}
              <div className="p-3 bg-primary-subtle rounded-3 border border-primary-subtle">
                <label className="form-label small fw-bold text-primary mb-1.5 d-flex justify-content-between">
                  <span>1. Chọn Chủ Sở Hữu / Thành Viên Vay Vốn (từ CSDL KH_CORE) (*):</span>
                  <span className="badge bg-white text-primary border border-primary-subtle small">Master KH_CORE Linked</span>
                </label>
                <select
                  className="form-select form-select-sm fw-bold border-primary"
                  value={formData.maKH}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  required
                >
                  <option value="">-- Bấm để chọn Khách hàng từ KH_CORE ({allCustomers.length} KH) --</option>
                  {allCustomers.map((c) => (
                    <option key={c.maKH} value={c.maKH}>
                      {c.hoTen} • Mã: {c.maKH} • CCCD: {c.cccd || c.gttt} • {c.diaChi}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Thông tin pháp lý GCN QSDĐ (Sổ Đỏ) */}
              <div className="card p-3 border rounded-3 bg-white">
                <h6 className="fw-bold text-dark font-heading mb-3 d-flex align-items-center gap-1.5">
                  <FileText size={16} className="text-success" /> 2. Thông Tin Giấy Chứng Nhận QSDĐ (Khóa Chính Nghiệp Vụ)
                </h6>

                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-danger">Số Giấy Chứng Nhận (Sổ đỏ) (*)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace fw-bold border-danger"
                      placeholder="CH 892341"
                      value={formData.soGCN}
                      onChange={(e) => setFormData({ ...formData, soGCN: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-dark">Số Vào Sổ Cấp GCN</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      placeholder="CS-01234"
                      value={formData.soVaoSoCapGCN}
                      onChange={(e) => setFormData({ ...formData, soVaoSoCapGCN: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-dark">Ngày Cấp GCN</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="dd/MM/yyyy"
                      value={formData.ngayCapGCN}
                      onChange={(e) => setFormData({ ...formData, ngayCapGCN: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-dark">Cơ Quan Cấp GCN</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Sở TN&MT tỉnh Thanh Hóa / UBND huyện Yên Định"
                      value={formData.noiCapGCN}
                      onChange={(e) => setFormData({ ...formData, noiCapGCN: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-dark">Họ Tên Chủ Sở Hữu Đứng Tên</label>
                    <input
                      type="text"
                      className="form-control form-control-sm fw-bold bg-light"
                      value={formData.chuSoHuu}
                      readOnly
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-dark">Quan Hệ Với Người Vay</label>
                    <select
                      className="form-select form-select-sm fw-medium"
                      value={formData.quanHeChuTS}
                      onChange={(e) => setFormData({ ...formData, quanHeChuTS: e.target.value })}
                    >
                      <option value="Chính chủ">Chính chủ người vay đứng tên</option>
                      <option value="Vợ chồng">Tài sản chung vợ chồng</option>
                      <option value="Bố mẹ">Bố mẹ bảo lãnh</option>
                      <option value="Người thứ 3">Người thứ 3 bảo lãnh thế chấp</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-dark">Người Đồng Sở Hữu (Vợ/Chồng)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Họ tên vợ/chồng..."
                      value={formData.nguoiDongSoHuu}
                      onChange={(e) => setFormData({ ...formData, nguoiDongSoHuu: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-dark">Nguồn Gốc Sử Dụng Đất</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Nhận chuyển nhượng QSDĐ..."
                      value={formData.nguonGocSuDung}
                      onChange={(e) => setFormData({ ...formData, nguonGocSuDung: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Chi tiết thửa đất & Bảng định giá tài sản */}
              <div className="card p-3 border rounded-3 bg-white">
                <h6 className="fw-bold text-dark font-heading mb-3 d-flex align-items-center gap-1.5">
                  <Building2 size={16} className="text-primary" /> 3. Chi Tiết Thửa Đất & Định Giá Tài Sản Thế Chấp
                </h6>

                <div className="row g-3">
                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-bold text-dark">Thửa Đất Số (*)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace fw-bold"
                      placeholder="112"
                      value={formData.thuaDatSo}
                      onChange={(e) => setFormData({ ...formData, thuaDatSo: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-bold text-dark">Tờ Bản Đồ Số (*)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace fw-bold"
                      placeholder="08"
                      value={formData.toBanDoSo}
                      onChange={(e) => setFormData({ ...formData, toBanDoSo: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-dark">Địa Chỉ Thửa Đất</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Thôn Tân Lộc, xã Quý Lộc, huyện Yên Định, tỉnh Thanh Hóa"
                      value={formData.diaChiThuaDat}
                      onChange={(e) => setFormData({ ...formData, diaChiThuaDat: e.target.value })}
                    />
                  </div>

                  {/* Bảng phân loại đất chi tiết */}
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small fw-bold text-slate-700">Phân loại đất theo GCN:</span>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm py-0 px-2"
                        onClick={handleAddLandRow}
                      >
                        <Plus size={13} className="me-1" /> Thêm loại đất
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-sm table-bordered align-middle small">
                        <thead className="table-light">
                          <tr>
                            <th>Loại Đất</th>
                            <th style={{ width: 120 }}>Diện Tích ($m^2$)</th>
                            <th style={{ width: 150 }}>Đơn Giá QTD ($đ/m^2$)</th>
                            <th style={{ width: 180 }} className="text-end">Thành Tiền (VNĐ)</th>
                            <th style={{ width: 40 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {chiTietDat.map((row, idx) => (
                            <tr key={row.id || idx}>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={row.loaiDat}
                                  onChange={(e) => handleUpdateLandRow(idx, 'loaiDat', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm text-end"
                                  value={row.dienTich}
                                  onChange={(e) => handleUpdateLandRow(idx, 'dienTich', e.target.value)}
                                />
                              </td>
                              <td>
                                <ThousandInput
                                  value={row.donGia}
                                  onChange={(val) => handleUpdateLandRow(idx, 'donGia', val)}
                                  className="form-control form-control-sm text-end"
                                />
                              </td>
                              <td className="text-end fw-bold num-tabular text-primary">
                                {formatCurrencyVN(row.thanhTien)}
                              </td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  className="btn btn-link text-danger p-0"
                                  onClick={() => handleRemoveLandRow(idx)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="table-light fw-bold">
                            <td>TỔNG DIỆN TÍCH ĐẤT</td>
                            <td className="text-end text-success">{tongDienTichDat} $m^2$</td>
                            <td>TỔNG TIỀN ĐẤT:</td>
                            <td className="text-end text-success">{formatCurrencyVN(tongGiaTriDat)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-dark">Giá Trị Công Trình / Nhà Ở (đ)</label>
                    <ThousandInput
                      value={formData.giaTriCongTrinh}
                      onChange={(val) => setFormData({ ...formData, giaTriCongTrinh: val })}
                      className="form-control form-control-sm fw-bold"
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-dark">Tổng Giá Trị Định Giá QTD (đ)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm fw-bold text-success bg-light"
                      value={formatCurrencyVN(tongGiaTriDinhGia)}
                      readOnly
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-dark">Hạn Mức Đảm Bảo Tối Đa (LTV {formData.tyLeChoVayToiDa}%)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm fw-bold text-primary bg-light"
                      value={formatCurrencyVN(hanMucDamBao)}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* 4. Thông tin Công chứng & Đăng ký Giao dịch bảo đảm */}
              <div className="card p-3 border rounded-3 bg-white">
                <h6 className="fw-bold text-dark font-heading mb-3 d-flex align-items-center gap-1.5">
                  <ShieldCheck size={16} className="text-warning" /> 4. Thông Tin Công Chứng & Đăng Ký Giao Dịch Bảo Đảm (ĐKGDBD)
                </h6>

                <div className="row g-3">
                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-bold text-dark">Trạng Thái Thế Chấp</label>
                    <select
                      className="form-select form-select-sm fw-bold"
                      value={formData.trangThaiTheChap}
                      onChange={(e) => setFormData({ ...formData, trangThaiTheChap: e.target.value })}
                    >
                      <option value="DANG_THE_CHAP">Đang thế chấp</option>
                      <option value="CHO_CONG_CHUNG">Chờ công chứng</option>
                      <option value="DA_GIAI_CHAP">Đã giải chấp (Rút sổ)</option>
                      <option value="CHUA_THE_CHAP">Chưa thế chấp (Kho lưu trữ)</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-bold text-dark">Hợp Đồng Tín Dụng Bảo Đảm</label>
                    <select
                      className="form-select form-select-sm font-monospace"
                      value={formData.soHDTD_LienKet}
                      onChange={(e) => setFormData({ ...formData, soHDTD_LienKet: e.target.value })}
                    >
                      <option value="">-- Chưa gắn HĐTD --</option>
                      {allContracts.map((ct) => (
                        <option key={ct.soHDTD} value={ct.soHDTD}>
                          {ct.soHDTD} ({ct.hoTen})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-bold text-dark">Số Hợp Đồng Thế Chấp (CC)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      placeholder="1425/2026/HĐTC"
                      value={formData.soCongChung}
                      onChange={(e) => setFormData({ ...formData, soCongChung: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-bold text-dark">Ngày Công Chứng</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="dd/MM/yyyy"
                      value={formData.ngayCongChung}
                      onChange={(e) => setFormData({ ...formData, ngayCongChung: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-dark">Văn Phòng Công Chứng</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Văn phòng Công chứng Yên Định"
                      value={formData.vanPhongCongChung}
                      onChange={(e) => setFormData({ ...formData, vanPhongCongChung: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-dark">Số Đăng Ký GDBD</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      placeholder="GDBD-2026-8892"
                      value={formData.soDangKyGDBD}
                      onChange={(e) => setFormData({ ...formData, soDangKyGDBD: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-dark">Ngày Đăng Ký GDBD</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="dd/MM/yyyy"
                      value={formData.ngayDangKyGDBD}
                      onChange={(e) => setFormData({ ...formData, ngayDangKyGDBD: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
              <button type="button" className="btn btn-light btn-sm px-3" onClick={onClose}>
                Hủy Bỏ
              </button>
              <button type="submit" className="btn btn-brand btn-sm text-white fw-bold px-4 shadow-sm">
                <CheckCircle2 size={16} className="me-1" /> Lưu Tài Sản Bảo Đảm
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
