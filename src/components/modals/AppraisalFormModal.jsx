import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  AlertCircle,
  User,
  Building2,
  TrendingUp,
  Calculator,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  ShieldCheck,
  Percent,
  DollarSign
} from 'lucide-react';
import ThousandInput from '../ThousandInput';
import { isValidCCCD } from '../../utils/validators';
import { formatCurrencyVN } from '../../utils/dateUtils';

export default function AppraisalFormModal({
  show,
  onClose,
  onSubmit,
  prefilledCustomer = null,
  allCustomers = []
}) {
  const [activeTab, setActiveTab] = useState(1);

  const [formData, setFormData] = useState({
    // 1. Pháp lý & Nhu cầu vốn
    maBCTD: '',
    maKH: '',
    hoTen: '',
    soCCCD: '',
    ngaySinh: '15/08/1985',
    gioiTinh: 'Nam',
    dienThoai: '0912345678',
    diaChi: 'Xã Yên Thọ, Huyện Ý Yên, Tỉnh Nam Định',
    tinhTrangHonNhan: 'Đã kết hôn',
    nguoiDongVay: 'Nguyễn Thị Hoa (Vợ - CCCD: 036185002468)',
    deXuatVay: 200000000,
    mucDichVay: 'Đầu tư mở rộng xưởng cơ khí & mua thêm nguyên vật liệu',
    thoiHanVay: 12,
    phuongThucTraNo: 'Gốc đều hàng tháng, lãi tính trên dư nợ thực tế',
    laiSuatDeNghi: 9.5,

    // 2. Tài sản bảo đảm (TSBĐ)
    coTSBD: 'Có',
    hinhThucBaoDam: 'Thế chấp Quyền sử dụng đất (Sổ đỏ)',
    loaiTSBD: 'Quyền sử dụng đất ở nông thôn & Nhà cấp 3',
    soGCN: 'CH 892341',
    thuaDatSo: '112',
    toBanDoSo: '08',
    dienTich: 250,
    diaChiTSBD: 'Thôn Yên Lãng, Xã Yên Thọ, Huyện Ý Yên, Nam Định',
    chuSoHuuTSBD: 'Chính chủ (Nguyễn Văn An và vợ Nguyễn Thị Hoa)',
    quanHeVoiNguoiVay: 'Chính chủ',
    giaTriTSBD: 600000000,
    tinhTrangPhapLyTSBD: 'Đầy đủ sổ đỏ hợp pháp, không có tranh chấp hay quy hoạch',
    moTaTSBD: 'Thửa đất mặt đường liên thôn rộng 5m, xe tải vào tận nơi, hiện trạng nhà 2 tầng kiên cố.',

    // 3. Thực địa, Dòng tiền & CIC
    thuNhapChinh: 25000000,
    thuNhapPhu: 5000000,
    chiPhiSinhHoat: 8000000,
    chiPhiSXKD: 4000000,
    xepHangCIC: 'Nhóm 1 (Tốt)',
    soTCTDQuanHe: 1,
    duNoCICNgoai: 0,
    lichSuTraNo: 'Lịch sử trả nợ tốt, không có nợ quá hạn hay nợ xấu',
    ghiChuCIC: 'Tra cứu CIC ngày ' + new Date().toLocaleDateString('vi-VN') + ': Khách hàng có quan hệ tại 1 Ngân hàng, trả nợ đầy đủ.',
    diaDiemThamDinh: 'Tại nhà riêng và xưởng sản xuất của khách hàng',
    hienTrangSXKD: 'Xưởng hoạt động ổn định, máy móc vận hành bình thường, có đơn hàng thường xuyên',
    tuCachKhachHang: 'Đạo đức tốt, lối sống gương mẫu, uy tín cao tại địa phương',

    // 4. Đề xuất của CBTD & Các chỉ số tài chính
    duyetVay: 200000000,
    thoiHanThang: 12,
    laiSuatDuyet: 9.5,
    phuongThucGiaiNgan: 'Chuyển khoản qua tài khoản CASA',
    bienPhapBaoDam: 'Thế chấp quyền sử dụng đất, công chứng và đăng ký GDBĐ đầy đủ',
    mucDoRuiRo: 'Thấp',
    dieuKienGiaiNgan: 'Hoàn tất thủ tục công chứng HĐTC và nhận kết quả đăng ký thế chấp tại VP ĐKĐĐ.',

    // 5. Phê duyệt & Kết luận
    ketLuan: 'Đồng ý cấp tín dụng',
    canBoThamDinh: 'Lê Văn Tín',
    danhSachYKien: []
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
        dienThoai: cust.sdt || prev.dienThoai,
        diaChi: cust.diaChi || prev.diaChi,
        chuSoHuuTSBD: cust.hoTen || prev.chuSoHuuTSBD
      }));
      setFormError('');
    }
  };

  // --- TÍNH TOÁN CÁC CHỈ SỐ TÀI CHÍNH TỰ ĐỘNG ---
  const tongThuNhap = Number(formData.thuNhapChinh || 0) + Number(formData.thuNhapPhu || 0);
  const tongChiPhi = Number(formData.chiPhiSinhHoat || 0) + Number(formData.chiPhiSXKD || 0);
  const thangDuThang = tongThuNhap - tongChiPhi;

  const giaTriTS = Number(formData.giaTriTSBD || 0);
  const duyetVayNum = Number(formData.duyetVay || 0);
  const thoiHanNum = Number(formData.thoiHanThang || 12);
  const laiSuatNum = Number(formData.laiSuatDuyet || 0);

  // 1. Tỷ lệ LTV
  const tyLeLTV = giaTriTS > 0 ? ((duyetVayNum / giaTriTS) * 100).toFixed(1) : '0.0';

  // 2. Nghĩa vụ trả nợ/tháng (Gốc bình quân + Lãi tháng đầu)
  const gocThang = thoiHanNum > 0 ? duyetVayNum / thoiHanNum : 0;
  const laiThang = (duyetVayNum * (laiSuatNum / 100)) / 12;
  const nghiaVuTraNoThang = gocThang + laiThang;

  // 3. Tỷ lệ DSR (Debt Service Ratio)
  const tyLeDSR = tongThuNhap > 0 ? ((nghiaVuTraNoThang / tongThuNhap) * 100).toFixed(1) : '0.0';

  // 4. Hệ số bù đắp dòng tiền (Coverage Ratio)
  const heSoBuDap = nghiaVuTraNoThang > 0 ? (thangDuThang / nghiaVuTraNoThang).toFixed(2) : '0.00';

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.maKH || !formData.hoTen) {
      setFormError('Vui lòng nhập đầy đủ Mã khách hàng và Họ tên.');
      setActiveTab(1);
      return;
    }

    if (formData.soCCCD && !isValidCCCD(formData.soCCCD)) {
      setFormError('Số CCCD không hợp lệ (Phải đúng 12 chữ số bắt đầu bằng số 0).');
      setActiveTab(1);
      return;
    }

    if (Number(tyLeLTV) > 75 && formData.coTSBD === 'Có') {
      const confirmOverLTV = window.confirm(
        `Cảnh báo: Tỷ lệ LTV (${tyLeLTV}%) vượt quá mức trần quy định 75%. Bạn có chắc chắn muốn tiếp tục trình duyệt hồ sơ?`
      );
      if (!confirmOverLTV) return;
    }

    onSubmit({
      ...formData,
      tongThuNhapThang: tongThuNhap,
      tongChiPhiThang: tongChiPhi,
      thangDuThang: thangDuThang,
      tyLeLTV: Number(tyLeLTV),
      nghiaVuTraNoThang: Math.round(nghiaVuTraNoThang),
      tyLeDSR: Number(tyLeDSR),
      heSoBuDap: Number(heSoBuDap)
    });
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-3 p-md-4">
          {/* Header */}
          <div className="modal-header border-0 pb-2">
            <div>
              <span className="badge bg-primary-subtle text-primary font-monospace fs-6 px-2.5 py-1 rounded-pill mb-1">
                {formData.maBCTD || 'BCTD-2026-MỚI'}
              </span>
              <h4 className="modal-title fw-extrabold text-slate-900 font-heading">
                Lập Hồ Sơ Thẩm Định Tín Dụng & Định Giá TSĐB (5 Nhóm Nghiệp Vụ)
              </h4>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          {/* TAB NAVIGATION */}
          <div className="border-bottom pb-2 mb-3">
            <ul className="nav nav-pills gap-2 flex-nowrap overflow-auto py-1">
              <li className="nav-item">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill d-flex align-items-center gap-1.5 fw-bold ${
                    activeTab === 1 ? 'btn-primary shadow-sm' : 'btn-light text-secondary'
                  }`}
                  onClick={() => setActiveTab(1)}
                >
                  <User size={14} /> 1. Pháp Lý & Nhu Cầu
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill d-flex align-items-center gap-1.5 fw-bold ${
                    activeTab === 2 ? 'btn-primary shadow-sm' : 'btn-light text-secondary'
                  }`}
                  onClick={() => setActiveTab(2)}
                >
                  <Building2 size={14} /> 2. Tài Sản Bảo Đảm
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill d-flex align-items-center gap-1.5 fw-bold ${
                    activeTab === 3 ? 'btn-primary shadow-sm' : 'btn-light text-secondary'
                  }`}
                  onClick={() => setActiveTab(3)}
                >
                  <TrendingUp size={14} /> 3. Thực Địa & CIC
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill d-flex align-items-center gap-1.5 fw-bold ${
                    activeTab === 4 ? 'btn-primary shadow-sm' : 'btn-light text-secondary'
                  }`}
                  onClick={() => setActiveTab(4)}
                >
                  <Calculator size={14} /> 4. Đề Xuất & Chỉ Số
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill d-flex align-items-center gap-1.5 fw-bold ${
                    activeTab === 5 ? 'btn-primary shadow-sm' : 'btn-light text-secondary'
                  }`}
                  onClick={() => setActiveTab(5)}
                >
                  <MessageSquare size={14} /> 5. Phê Duyệt & Kết Luận
                </button>
              </li>
            </ul>
          </div>

          <form onSubmit={handleFormSubmit}>
            <div className="modal-body py-2">
              {formError && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small mb-3">
                  <AlertCircle size={16} />
                  <div>{formError}</div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 1: THÔNG TIN PHÁP LÝ & NHU CẦU VAY VỐN                                */}
              {/* ========================================================================= */}
              {activeTab === 1 && (
                <div className="d-flex flex-column gap-3">
                  <div className="p-3 bg-light rounded-3 border">
                    <h6 className="fw-bold text-primary small mb-3 border-bottom pb-2">
                      A. Thông Tin Định Danh Khách Hàng
                    </h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-3">
                        <label className="form-label small fw-bold text-dark">Mã Khách Hàng (*)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-monospace fw-bold"
                          placeholder="Ví dụ: KH001"
                          value={formData.maKH}
                          onChange={(e) => {
                            setFormData({ ...formData, maKH: e.target.value });
                            handleSelectCustomer(e.target.value);
                          }}
                          required
                        />
                      </div>

                      <div className="col-12 col-md-5">
                        <label className="form-label small fw-bold text-dark">Họ Và Tên Khách Hàng (*)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm fw-bold"
                          value={formData.hoTen}
                          onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-bold text-dark">Số CCCD / CMND (12 số) (*)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-monospace fw-bold"
                          value={formData.soCCCD}
                          onChange={(e) => setFormData({ ...formData, soCCCD: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-6 col-md-3">
                        <label className="form-label small fw-bold text-dark">Ngày Sinh</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.ngaySinh}
                          onChange={(e) => setFormData({ ...formData, ngaySinh: e.target.value })}
                        />
                      </div>

                      <div className="col-6 col-md-2">
                        <label className="form-label small fw-bold text-dark">Giới Tính</label>
                        <select
                          className="form-select form-select-sm"
                          value={formData.gioiTinh}
                          onChange={(e) => setFormData({ ...formData, gioiTinh: e.target.value })}
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                        </select>
                      </div>

                      <div className="col-12 col-md-3">
                        <label className="form-label small fw-bold text-dark">Số Điện Thoại</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.dienThoai}
                          onChange={(e) => setFormData({ ...formData, dienThoai: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-bold text-dark">Tình Trạng Hôn Nhân</label>
                        <select
                          className="form-select form-select-sm"
                          value={formData.tinhTrangHonNhan}
                          onChange={(e) => setFormData({ ...formData, tinhTrangHonNhan: e.target.value })}
                        >
                          <option value="Đã kết hôn">Đã kết hôn</option>
                          <option value="Độc thân">Độc thân</option>
                          <option value="Ly hôn / Góa">Ly hôn / Góa</option>
                        </select>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-dark">Địa Chỉ Thường Trú / Cư Trú</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.diaChi}
                          onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-dark">Người Đồng Vay / Vợ Chồng / Bảo Lãnh</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Họ tên, quan hệ, số CCCD..."
                          value={formData.nguoiDongVay}
                          onChange={(e) => setFormData({ ...formData, nguoiDongVay: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-light rounded-3 border">
                    <h6 className="fw-bold text-primary small mb-3 border-bottom pb-2">
                      B. Nhu Cầu Vay Vốn Của Khách Hàng
                    </h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-bold text-dark">Số Tiền Khách Hàng Xin Vay (VNĐ)</label>
                        <ThousandInput
                          className="form-control form-control-sm fw-bold text-primary fs-6"
                          value={formData.deXuatVay}
                          onChange={(val) => setFormData({ ...formData, deXuatVay: val })}
                        />
                      </div>

                      <div className="col-6 col-md-4">
                        <label className="form-label small fw-bold text-dark">Thời Hạn Vay Đề Nghị (Tháng)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm fw-bold"
                          value={formData.thoiHanVay}
                          onChange={(e) => setFormData({ ...formData, thoiHanVay: Number(e.target.value) })}
                        />
                      </div>

                      <div className="col-6 col-md-4">
                        <label className="form-label small fw-bold text-dark">Lãi Suất Đề Nghị (%/năm)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control form-control-sm"
                          value={formData.laiSuatDeNghi}
                          onChange={(e) => setFormData({ ...formData, laiSuatDeNghi: Number(e.target.value) })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-dark">Mục Đích Sử Dụng Vốn</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.mucDichVay}
                          onChange={(e) => setFormData({ ...formData, mucDichVay: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-dark">Phương Thức Trả Nợ Đề Xuất</label>
                        <select
                          className="form-select form-select-sm"
                          value={formData.phuongThucTraNo}
                          onChange={(e) => setFormData({ ...formData, phuongThucTraNo: e.target.value })}
                        >
                          <option value="Gốc đều hàng tháng, lãi tính trên dư nợ thực tế">Gốc đều hàng tháng, lãi giảm dần</option>
                          <option value="Gốc cuối kỳ, lãi trả định kỳ hàng tháng">Gốc cuối kỳ, lãi hàng tháng</option>
                          <option value="Niên kim cố định (Gốc + Lãi chia đều hàng tháng)">Niên kim cố định</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: THÔNG TIN VỀ TÀI SẢN BẢO ĐẢM (TSBĐ)                               */}
              {/* ========================================================================= */}
              {activeTab === 2 && (
                <div className="p-3 bg-light rounded-3 border">
                  <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                    <h6 className="fw-bold text-primary small m-0">2. Thông Tin Tài Sản Bảo Đảm (TSBĐ)</h6>
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted fw-bold">Có TSĐB?</span>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: 110 }}
                        value={formData.coTSBD}
                        onChange={(e) => setFormData({ ...formData, coTSBD: e.target.value })}
                      >
                        <option value="Có">Có TSĐB</option>
                        <option value="Không">Tín chấp</option>
                      </select>
                    </div>
                  </div>

                  {formData.coTSBD === 'Có' ? (
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-bold text-dark">Hình Thức Bảo Đảm</label>
                        <select
                          className="form-select form-select-sm fw-bold"
                          value={formData.hinhThucBaoDam}
                          onChange={(e) => setFormData({ ...formData, hinhThucBaoDam: e.target.value })}
                        >
                          <option value="Thế chấp Quyền sử dụng đất (Sổ đỏ)">Thế chấp QSDĐ (Sổ đỏ)</option>
                          <option value="Cầm cố Sổ tiết kiệm / Giấy tờ có giá">Cầm cố Sổ tiết kiệm</option>
                          <option value="Thế chấp Phương tiện vận tải (Ô tô, tàu cá)">Thế chấp Phương tiện vận tải</option>
                          <option value="Bảo lãnh của bên thứ ba">Bảo lãnh bên thứ ba</option>
                        </select>
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-bold text-dark">Loại Tài Sản Cụ Thể</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.loaiTSBD}
                          onChange={(e) => setFormData({ ...formData, loaiTSBD: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-bold text-dark">Số Seri GCN / Số Sổ Đỏ</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-monospace fw-bold"
                          value={formData.soGCN}
                          onChange={(e) => setFormData({ ...formData, soGCN: e.target.value })}
                        />
                      </div>

                      <div className="col-4 col-md-2">
                        <label className="form-label small fw-bold text-dark">Thửa Đất Số</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.thuaDatSo}
                          onChange={(e) => setFormData({ ...formData, thuaDatSo: e.target.value })}
                        />
                      </div>

                      <div className="col-4 col-md-2">
                        <label className="form-label small fw-bold text-dark">Tờ Bản Đồ Số</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.toBanDoSo}
                          onChange={(e) => setFormData({ ...formData, toBanDoSo: e.target.value })}
                        />
                      </div>

                      <div className="col-4 col-md-2">
                        <label className="form-label small fw-bold text-dark">Diện Tích (m²)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm fw-bold"
                          value={formData.dienTich}
                          onChange={(e) => setFormData({ ...formData, dienTich: Number(e.target.value) })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-dark">Địa Chỉ Nơi Có Tài Sản Thế Chấp</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.diaChiTSBD}
                          onChange={(e) => setFormData({ ...formData, diaChiTSBD: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-dark">Chủ Sở Hữu Đứng Tên Trên GCN</label>
                        <input
                          type="text"
                          className="form-control form-control-sm fw-bold"
                          value={formData.chuSoHuuTSBD}
                          onChange={(e) => setFormData({ ...formData, chuSoHuuTSBD: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-dark">Mối Quan Hệ Với Người Vay</label>
                        <select
                          className="form-select form-select-sm"
                          value={formData.quanHeVoiNguoiVay}
                          onChange={(e) => setFormData({ ...formData, quanHeVoiNguoiVay: e.target.value })}
                        >
                          <option value="Chính chủ">Chính chủ</option>
                          <option value="Vợ chồng cùng đứng tên">Vợ chồng cùng đứng tên</option>
                          <option value="Bố mẹ ruột bảo lãnh">Bố mẹ ruột bảo lãnh</option>
                          <option value="Bên thứ ba bảo lãnh">Bên thứ ba bảo lãnh</option>
                        </select>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-dark">Giá Trị Định Giá Nội Bộ QTDND (VNĐ) (*)</label>
                        <ThousandInput
                          className="form-control form-control-sm fw-bold text-success fs-6"
                          value={formData.giaTriTSBD}
                          onChange={(val) => setFormData({ ...formData, giaTriTSBD: val })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-dark">Tình Trạng Pháp Lý Của TSĐB</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.tinhTrangPhapLyTSBD}
                          onChange={(e) => setFormData({ ...formData, tinhTrangPhapLyTSBD: e.target.value })}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-bold text-dark">Mô Tả Hiện Trạng & Khả Năng Phát Mại TSĐB</label>
                        <textarea
                          rows={2}
                          className="form-control form-control-sm"
                          value={formData.moTaTSBD}
                          onChange={(e) => setFormData({ ...formData, moTaTSBD: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-white rounded border">
                      <ShieldCheck size={32} className="text-primary mb-2" />
                      <h6 className="fw-bold text-dark">Khoản Vay Tín Chấp Không Có Tài Sản Đảm Bảo</h6>
                      <p className="small text-muted m-0">
                        Khoản vay được thẩm định hoàn toàn dựa trên uy tín, năng lực tài chính và dòng tiền ròng của khách hàng.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: THU THẬP THỰC ĐỊA, DÒNG TIỀN & CIC                                 */}
              {/* ========================================================================= */}
              {activeTab === 3 && (
                <div className="d-flex flex-column gap-3">
                  {/* Năng lực tài chính & Dòng tiền */}
                  <div className="p-3 bg-light rounded-3 border">
                    <h6 className="fw-bold text-primary small mb-3 border-bottom pb-2 d-flex align-items-center justify-content-between">
                      <span>A. Năng Lực Tài Chính & Dòng Tiền Thực Tế Hàng Tháng</span>
                      <span className="badge bg-success-subtle text-success fs-6">
                        Thặng dư: {formatCurrencyVN(thangDuThang)}/tháng
                      </span>
                    </h6>

                    <div className="row g-3">
                      <div className="col-12 col-md-3">
                        <label className="form-label small fw-bold text-dark">Thu Nhập Chính/Tháng (VNĐ)</label>
                        <ThousandInput
                          className="form-control form-control-sm fw-bold text-success"
                          value={formData.thuNhapChinh}
                          onChange={(val) => setFormData({ ...formData, thuNhapChinh: val })}
                        />
                      </div>

                      <div className="col-12 col-md-3">
                        <label className="form-label small fw-bold text-dark">Thu Nhập Phụ/Tháng (VNĐ)</label>
                        <ThousandInput
                          className="form-control form-control-sm fw-bold text-success"
                          value={formData.thuNhapPhu}
                          onChange={(val) => setFormData({ ...formData, thuNhapPhu: val })}
                        />
                      </div>

                      <div className="col-12 col-md-3">
                        <label className="form-label small fw-bold text-dark">Chi Phí Sinh Hoạt/Tháng (VNĐ)</label>
                        <ThousandInput
                          className="form-control form-control-sm fw-bold text-danger"
                          value={formData.chiPhiSinhHoat}
                          onChange={(val) => setFormData({ ...formData, chiPhiSinhHoat: val })}
                        />
                      </div>

                      <div className="col-12 col-md-3">
                        <label className="form-label small fw-bold text-dark">Chi Phí SXKD/Tháng (VNĐ)</label>
                        <ThousandInput
                          className="form-control form-control-sm fw-bold text-danger"
                          value={formData.chiPhiSXKD}
                          onChange={(val) => setFormData({ ...formData, chiPhiSXKD: val })}
                        />
                      </div>

                      <div className="col-12">
                        <div className="p-2.5 bg-white rounded border d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <div className="small text-muted">
                            Tổng thu nhập: <strong className="text-success">{formatCurrencyVN(tongThuNhap)}</strong> • 
                            Tổng chi phí: <strong className="text-danger">{formatCurrencyVN(tongChiPhi)}</strong>
                          </div>
                          <div className="small fw-bold">
                            Tỷ lệ tiết lũy: <span className="text-primary">{tongThuNhap > 0 ? ((thangDuThang / tongThuNhap) * 100).toFixed(1) : 0}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lịch sử CIC & Khảo sát thực địa */}
                  <div className="p-3 bg-light rounded-3 border">
                    <h6 className="fw-bold text-primary small mb-3 border-bottom pb-2">
                      B. Lịch Sử Tín Dụng CIC & Đánh Giá Thực Địa CBTD
                    </h6>

                    <div className="row g-3">
                      <div className="col-12 col-md-3">
                        <label className="form-label small fw-bold text-dark">Xếp Hạng CIC</label>
                        <select
                          className="form-select form-select-sm fw-bold"
                          value={formData.xepHangCIC}
                          onChange={(e) => setFormData({ ...formData, xepHangCIC: e.target.value })}
                        >
                          <option value="Nhóm 1 (Tốt)">Nhóm 1 (Nợ đủ tiêu chuẩn - Tốt)</option>
                          <option value="Nhóm 2 (Cần chú ý)">Nhóm 2 (Cần chú ý)</option>
                          <option value="Nhóm 3 (Dưới tiêu chuẩn)">Nhóm 3 (Nợ dưới tiêu chuẩn)</option>
                          <option value="Nhóm 4 (Nghi ngờ)">Nhóm 4 (Nợ nghi ngờ)</option>
                          <option value="Nhóm 5 (Mất vốn)">Nhóm 5 (Nợ có khả năng mất vốn)</option>
                        </select>
                      </div>

                      <div className="col-6 col-md-3">
                        <label className="form-label small fw-bold text-dark">Số TCTD Đang Quan Hệ</label>
                        <input
                          type="number"
                          className="form-control form-control-sm fw-bold"
                          value={formData.soTCTDQuanHe}
                          onChange={(e) => setFormData({ ...formData, soTCTDQuanHe: Number(e.target.value) })}
                        />
                      </div>

                      <div className="col-6 col-md-3">
                        <label className="form-label small fw-bold text-dark">Dư Nợ CIC Ngoài Quỹ (VNĐ)</label>
                        <ThousandInput
                          className="form-control form-control-sm"
                          value={formData.duNoCICNgoai}
                          onChange={(val) => setFormData({ ...formData, duNoCICNgoai: val })}
                        />
                      </div>

                      <div className="col-12 col-md-3">
                        <label className="form-label small fw-bold text-dark">Lịch Sử Trả Nợ</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.lichSuTraNo}
                          onChange={(e) => setFormData({ ...formData, lichSuTraNo: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-dark">Ghi Chú Tra Cứu CIC Quốc Gia</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.ghiChuCIC}
                          onChange={(e) => setFormData({ ...formData, ghiChuCIC: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-dark">Địa Điểm Thẩm Định Thực Địa</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.diaDiemThamDinh}
                          onChange={(e) => setFormData({ ...formData, diaDiemThamDinh: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-dark">Hiện Trạng Hoạt Động SXKD</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.hienTrangSXKD}
                          onChange={(e) => setFormData({ ...formData, hienTrangSXKD: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-dark">Đánh Giá Tư Cách & Uy Tín Khách Hàng</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.tuCachKhachHang}
                          onChange={(e) => setFormData({ ...formData, tuCachKhachHang: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 4: ĐỀ XUẤT CỦA CBTD & BẢNG CHỈ SỐ TÀI CHÍNH TỰ ĐỘNG                   */}
              {/* ========================================================================= */}
              {activeTab === 4 && (
                <div className="d-flex flex-column gap-3">
                  {/* BẢNG CHỈ SỐ TÀI CHÍNH TỰ ĐỘNG */}
                  <div className="row g-3">
                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="p-3 bg-white rounded-3 border shadow-sm h-100">
                        <span className="text-muted small">Tỷ lệ LTV (Vay / TSĐB):</span>
                        <div className="d-flex align-items-baseline gap-1 mt-1">
                          <h4 className={`fw-extrabold m-0 ${Number(tyLeLTV) > 75 ? 'text-danger' : Number(tyLeLTV) > 70 ? 'text-warning' : 'text-success'}`}>
                            {tyLeLTV}%
                          </h4>
                          <span className="small text-muted">/ Trần 75%</span>
                        </div>
                        <div className="small mt-1">
                          <span className={`badge ${Number(tyLeLTV) > 75 ? 'bg-danger' : Number(tyLeLTV) > 70 ? 'bg-warning text-dark' : 'bg-success'}`}>
                            {Number(tyLeLTV) <= 70 ? 'An toàn cao' : Number(tyLeLTV) <= 75 ? 'Hạn mức tối đa' : 'Vượt trần'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="p-3 bg-white rounded-3 border shadow-sm h-100">
                        <span className="text-muted small">Nghĩa vụ trả nợ/tháng:</span>
                        <div className="d-flex align-items-baseline gap-1 mt-1">
                          <h4 className="fw-extrabold text-danger m-0 num-tabular">
                            {formatCurrencyVN(Math.round(nghiaVuTraNoThang))}
                          </h4>
                        </div>
                        <div className="small text-muted mt-1">
                          Gốc: {formatCurrencyVN(Math.round(gocThang))} + Lãi: {formatCurrencyVN(Math.round(laiThang))}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="p-3 bg-white rounded-3 border shadow-sm h-100">
                        <span className="text-muted small">Tỷ lệ DSR (Nợ / Thu nhập):</span>
                        <div className="d-flex align-items-baseline gap-1 mt-1">
                          <h4 className={`fw-extrabold m-0 ${Number(tyLeDSR) > 60 ? 'text-danger' : 'text-success'}`}>
                            {tyLeDSR}%
                          </h4>
                          <span className="small text-muted">/ Trần 60%</span>
                        </div>
                        <div className="small mt-1">
                          <span className={`badge ${Number(tyLeDSR) <= 60 ? 'bg-success' : 'bg-danger'}`}>
                            {Number(tyLeDSR) <= 60 ? 'Đạt chuẩn dòng tiền' : 'Rủi ro dòng tiền'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="p-3 bg-white rounded-3 border shadow-sm h-100">
                        <span className="text-muted small">Hệ số bù đắp dòng tiền:</span>
                        <div className="d-flex align-items-baseline gap-1 mt-1">
                          <h4 className={`fw-extrabold m-0 ${Number(heSoBuDap) >= 1.2 ? 'text-success' : 'text-danger'}`}>
                            {heSoBuDap}x
                          </h4>
                          <span className="small text-muted">/ Chuẩn ≥ 1.2x</span>
                        </div>
                        <div className="small mt-1">
                          <span className={`badge ${Number(heSoBuDap) >= 1.2 ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {Number(heSoBuDap) >= 1.2 ? 'Dư nợ an toàn' : 'Cần theo dõi'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Đề Xuất Của CBTD */}
                  <div className="p-3 bg-light rounded-3 border">
                    <h6 className="fw-bold text-primary small mb-3 border-bottom pb-2">
                      Đề Xuất Cấp Tín Dụng Của Cán Bộ Thẩm Định
                    </h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-bold text-dark">Số Tiền Đề Xuất Cho Vay (VNĐ) (*)</label>
                        <ThousandInput
                          className="form-control form-control-sm fw-bold text-danger fs-6"
                          value={formData.duyetVay}
                          onChange={(val) => setFormData({ ...formData, duyetVay: val })}
                        />
                      </div>

                      <div className="col-6 col-md-2">
                        <label className="form-label small fw-bold text-dark">Thời Hạn Duyệt (Tháng)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm fw-bold"
                          value={formData.thoiHanThang}
                          onChange={(e) => setFormData({ ...formData, thoiHanThang: Number(e.target.value) })}
                        />
                      </div>

                      <div className="col-6 col-md-2">
                        <label className="form-label small fw-bold text-dark">Lãi Suất Duyệt (%/năm)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control form-control-sm fw-bold"
                          value={formData.laiSuatDuyet}
                          onChange={(e) => setFormData({ ...formData, laiSuatDuyet: Number(e.target.value) })}
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-bold text-dark">Phương Thức Giải Ngân</label>
                        <select
                          className="form-select form-select-sm"
                          value={formData.phuongThucGiaiNgan}
                          onChange={(e) => setFormData({ ...formData, phuongThucGiaiNgan: e.target.value })}
                        >
                          <option value="Chuyển khoản qua tài khoản CASA">Chuyển khoản qua tài khoản CASA</option>
                          <option value="Tiền mặt tại quầy">Tiền mặt tại quầy</option>
                          <option value="Chuyển khoản thanh toán cho bên thứ ba">Chuyển khoản bên thứ ba</option>
                        </select>
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-bold text-dark">Đánh Giá Mức Độ Rủi Ro</label>
                        <select
                          className="form-select form-select-sm fw-bold"
                          value={formData.mucDoRuiRo}
                          onChange={(e) => setFormData({ ...formData, mucDoRuiRo: e.target.value })}
                        >
                          <option value="Thấp">Mức độ rủi ro: Thấp (Ưu tiên)</option>
                          <option value="Trung bình">Mức độ rủi ro: Trung bình</option>
                          <option value="Cao">Mức độ rủi ro: Cao</option>
                        </select>
                      </div>

                      <div className="col-12 col-md-8">
                        <label className="form-label small fw-bold text-dark">Biện Pháp Bảo Đảm & Quản Lý Rủi Ro</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.bienPhapBaoDam}
                          onChange={(e) => setFormData({ ...formData, bienPhapBaoDam: e.target.value })}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-bold text-dark">Điều Kiện Tiên Quyết Trước Khi Giải Ngân</label>
                        <textarea
                          rows={2}
                          className="form-control form-control-sm"
                          placeholder="Ví dụ: Hoàn tất công chứng hợp đồng thế chấp và nộp phiếu hẹn đăng ký GDBĐ..."
                          value={formData.dieuKienGiaiNgan}
                          onChange={(e) => setFormData({ ...formData, dieuKienGiaiNgan: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 5: PHÊ DUYỆT ĐA CẤP & KẾT LUẬN CUỐI CÙNG                               */}
              {/* ========================================================================= */}
              {activeTab === 5 && (
                <div className="p-3 bg-light rounded-3 border">
                  <h6 className="fw-bold text-primary small mb-3 border-bottom pb-2">
                    5. Phê Duyệt & Kết Luận Cấp Tín Dụng
                  </h6>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-dark">Họ Và Tên Cán Bộ Tín Dụng Lập Báo Cáo (*)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fw-bold"
                        value={formData.canBoThamDinh}
                        onChange={(e) => setFormData({ ...formData, canBoThamDinh: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-dark">Kết Luận Cấp Tín Dụng (*)</label>
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

                    <div className="col-12">
                      <div className="p-3 bg-white rounded border">
                        <span className="fw-bold text-dark small d-block mb-1">Tóm Tắt Tờ Trình Thẩm Định:</span>
                        <p className="small text-secondary m-0">
                          Đề xuất cấp tín dụng cho khách hàng <strong>{formData.hoTen || '...'}</strong> (Mã KH: {formData.maKH || '...'}) 
                          với số tiền duyệt <strong>{formatCurrencyVN(duyetVayNum)}</strong>, thời hạn <strong>{formData.thoiHanThang} tháng</strong>, 
                          lãi suất <strong>{formData.laiSuatDuyet}%/năm</strong>. 
                          Tỷ lệ LTV <strong>{tyLeLTV}%</strong>, Tỷ lệ DSR <strong>{tyLeDSR}%</strong>, Hệ số bù đắp dòng tiền <strong>{heSoBuDap}x</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer border-0 pt-2 d-flex justify-content-between">
              <div className="d-flex gap-1">
                {activeTab > 1 && (
                  <button
                    type="button"
                    className="btn btn-light btn-sm fw-semibold"
                    onClick={() => setActiveTab(activeTab - 1)}
                  >
                    Quay Lại (Bước {activeTab - 1})
                  </button>
                )}
                {activeTab < 5 && (
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm fw-semibold"
                    onClick={() => setActiveTab(activeTab + 1)}
                  >
                    Tiếp Theo (Bước {activeTab + 1})
                  </button>
                )}
              </div>

              <div className="d-flex gap-2">
                <button type="button" className="btn btn-light btn-sm" onClick={onClose}>
                  Hủy Bỏ
                </button>
                <button type="submit" className="btn btn-brand btn-sm fw-bold px-4 shadow-sm">
                  <FileCheck2 size={14} className="me-1" /> Lưu Hồ Sơ Thẩm Định
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
