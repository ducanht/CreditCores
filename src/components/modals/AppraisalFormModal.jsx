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
  DollarSign,
  Plus,
  Trash2,
  Camera,
  FileText,
  Upload,
  Calendar,
  Sparkles,
  Search,
  Lock
} from 'lucide-react';
import ThousandInput from '../ThousandInput';
import { isValidCCCD } from '../../utils/validators';
import { formatCurrencyVN, formatDateVN } from '../../utils/dateUtils';

export default function AppraisalFormModal({
  show,
  onClose,
  onSubmit,
  prefilledCustomer = null,
  allCustomers = [],
  currentUser = null
}) {
  const [activeTab, setActiveTab] = useState(1);
  const [customerSearch, setCustomerSearch] = useState('');

  const [formData, setFormData] = useState({
    // 1. Pháp lý & Nhu cầu vốn (Ràng buộc chặt với KH_CORE)
    maBCTD: '',
    maKH: '',
    hoTen: '',
    soCCCD: '',
    ngayCap: '',
    noiCap: '',
    ngaySinh: '',
    gioiTinh: 'Nam',
    dienThoai: '',
    diaChi: '',
    soTV: '',
    tinhTrangHonNhan: 'Đã kết hôn',
    nguoiDongVay: '',
    hinhAnhKH: '',
    nganhNghe: 'Kinh doanh tự do & Nông nghiệp',
    trinhDo: 'Đại học / Cao đẳng',
    thuNhapNguoiVay: 25000000,
    nguonThuNguoiVay: 'Thu nhập từ hoạt động sản xuất kinh doanh và cung ứng dịch vụ',
    thuNhapDongVay: 10000000,
    nguonThuDongVay: 'Kinh doanh thương mại và bán lẻ tại địa phương',
    chungMinhThuNhap: 'Hóa đơn xuất bán hàng, sổ theo dõi doanh thu và sao kê tài khoản ngân hàng 6 tháng gần nhất',
    thuNhapPhu: 0,
    chiPhiSinhHoat: 10000000,
    chiPhiSXKD: 5000000,
    chiPhiKhac: 0,
    thuNhapRong: 20000000,
    deXuatVay: 200000000,
    mucDichVay: 'Đầu tư mở rộng sản xuất kinh doanh và bổ sung vốn lưu động',
    thoiHanVay: 24,
    phuongThucTraNo: 'Gốc đều hàng tháng, lãi tính trên dư nợ thực tế',
    laiSuatDeNghi: 9.5,

    // 2. Tài sản bảo đảm (TSBĐ)
    coTSBD: 'Có',
    hinhThucBaoDam: 'Thế chấp Quyền sử dụng đất (Sổ đỏ)',
    loaiTSBD: 'QSDĐ ở nông thôn, đất trồng cây lâu năm & Nhà ở kiên cố',
    soGCN: 'CH 892341',
    thuaDatSo: '112',
    toBanDoSo: '08',
    dienTich: 250,
    diaChiTSBD: '',
    chuSoHuuTSBD: '',
    quanHeVoiNguoiVay: 'Chính chủ',
    nguonGocTSBD: 'Nhận chuyển nhượng quyền sử dụng đất',
    giaTriThiTruong: 700000000,
    hinhAnhTSBD: '',
    chiTietLoaiDat: [
      { id: '1', loaiDat: 'Đất ở tại nông thôn (ONT)', dienTich: 100, donGia: 3000000, thanhTien: 300000000 },
      { id: '2', loaiDat: 'Đất trồng cây lâu năm (CLN)', dienTich: 150, donGia: 1000000, thanhTien: 150000000 }
    ],
    giaTriCongTrinh: 150000000,
    giaTriTSBD: 600000000,
    tinhTrangPhapLyTSBD: 'Đầy đủ sổ đỏ hợp pháp, không có tranh chấp hay quy hoạch',
    moTaTSBD: 'Thửa đất mặt đường liên thôn rộng 5m, xe tải vào tận nơi, hiện trạng nhà 2 tầng kiên cố 80m2 sàn.',

    // 3. Thực địa, Dòng tiền & CIC
    thuNhapChinh: 35000000,
    tongThuNhapThang: 35000000,
    tongChiPhiThang: 15000000,
    thangDuThang: 20000000,
    xepHangCIC: 'Nhóm 1 (Tốt)',
    soTCTDQuanHe: 1,
    duNoCICNgoai: 0,
    lichSuTraNo: 'Lịch sử trả nợ tốt, không có nợ quá hạn hay nợ xấu',
    ghiChuCIC: 'Tra cứu CIC: Khách hàng có quan hệ tại 1 Ngân hàng, trả nợ đầy đủ.',
    diaDiemThamDinh: 'Tại nhà riêng và cơ sở sản xuất kinh doanh của khách hàng',
    hienTrangSXKD: 'Cơ sở hoạt động ổn định, máy móc vận hành bình thường, đơn hàng đều đặn',
    tuCachKhachHang: 'Đạo đức tốt, lối sống gương mẫu, uy tín cao tại địa phương',

    // 4. Đề xuất của CBTD & Các chỉ số tài chính
    duyetVay: 200000000,
    thoiHanThang: 24,
    laiSuatDuyet: 9.5,
    phuongThucGiaiNgan: 'Chuyển khoản qua tài khoản CASA',
    phuongThucTraGoc: 'HANG_THANG',
    phuongAnToiUu: '',
    bienPhapBaoDam: 'Thế chấp quyền sử dụng đất, công chứng và đăng ký GDBĐ đầy đủ',
    mucDoRuiRo: 'Thấp',
    dieuKienGiaiNgan: 'Hoàn tất thủ tục công chứng HĐTC và nhận kết quả đăng ký thế chấp tại VP ĐKĐĐ.',

    // 5. Phê duyệt & Kết luận
    ketLuan: 'Đồng ý cấp tín dụng',
    canBoThamDinh: currentUser?.fullName || 'Lê Văn Tín (CBTD)',
    canBoLapUsername: currentUser?.username || 'qtdyentho.cbtd',
    danhSachYKien: []
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (prefilledCustomer) {
      handleSelectCustomer(prefilledCustomer.maKH, prefilledCustomer);
    } else {
      setFormData((prev) => ({
        ...prev,
        maBCTD: 'BCTD-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000)),
        canBoThamDinh: currentUser?.fullName || prev.canBoThamDinh,
        canBoLapUsername: currentUser?.username || prev.canBoLapUsername
      }));
    }
  }, [prefilledCustomer, currentUser]);

  if (!show) return null;

  // Lựa chọn khách hàng từ CoreBanking
  const handleSelectCustomer = (maKH, customObj = null) => {
    const cust = customObj || allCustomers.find((c) => c.maKH === maKH);
    if (cust) {
      setFormData((prev) => ({
        ...prev,
        maKH: cust.maKH,
        hoTen: cust.hoTen || '',
        soCCCD: cust.cccd || cust.gttt || '',
        ngayCap: cust.ngayCap || '',
        noiCap: cust.noiCap || '',
        ngaySinh: cust.ngaySinh || prev.ngaySinh || '15/08/1985',
        gioiTinh: cust.gioiTinh || prev.gioiTinh || 'Nam',
        dienThoai: cust.dienThoaiDD || cust.dienThoai || '',
        diaChi: cust.diaChi || '',
        diaChiTSBD: cust.diaChi || prev.diaChiTSBD,
        chuSoHuuTSBD: cust.hoTen || prev.chuSoHuuTSBD,
        soTV: cust.soTV || cust.maThanhVien || '',
        canBoThamDinh: currentUser?.fullName || prev.canBoThamDinh,
        canBoLapUsername: currentUser?.username || prev.canBoLapUsername
      }));
      setFormError('');
    }
  };

  // Danh sách khách hàng lọc theo ô tìm kiếm
  const filteredCustomers = allCustomers.filter((c) => {
    if (!customerSearch) return true;
    const q = customerSearch.toLowerCase();
    return (
      (c.maKH && c.maKH.toLowerCase().includes(q)) ||
      (c.hoTen && c.hoTen.toLowerCase().includes(q)) ||
      (c.cccd && c.cccd.includes(q)) ||
      (c.dienThoaiDD && c.dienThoaiDD.includes(q)) ||
      (c.diaChi && c.diaChi.toLowerCase().includes(q))
    );
  });

  // Tính toán Tài chính & Thu nhập ròng
  const thuNhapVay = Number(formData.thuNhapNguoiVay) || 0;
  const thuNhapDong = Number(formData.thuNhapDongVay) || 0;
  const thuNhapKhac = Number(formData.thuNhapPhu) || 0;
  const tongThuNhap = thuNhapVay + thuNhapDong + thuNhapKhac;

  const cpSinhHoat = Number(formData.chiPhiSinhHoat) || 0;
  const cpSXKD = Number(formData.chiPhiSXKD) || 0;
  const cpKhac = Number(formData.chiPhiKhac) || 0;
  const tongChiPhi = cpSinhHoat + cpSXKD + cpKhac;

  const thuNhapRong = Math.max(0, tongThuNhap - tongChiPhi);

  // Tính toán TSBĐ theo bảng phân loại đất
  const chiTietDat = formData.chiTietLoaiDat || [];
  const tongDienTichDat = chiTietDat.reduce((sum, item) => sum + (Number(item.dienTich) || 0), 0);
  const tongGiaTriDat = chiTietDat.reduce((sum, item) => sum + (Number(item.thanhTien) || 0), 0);
  const giaTriCongTrinh = Number(formData.giaTriCongTrinh) || 0;
  const tongGiaTriTSBD = formData.coTSBD === 'Có' ? (tongGiaTriDat + giaTriCongTrinh) : 0;

  // Tính toán Phương án vay & Nghĩa vụ trả nợ
  const duyetVay = Number(formData.duyetVay) || 0;
  const thoiHan = Number(formData.thoiHanThang) || 12;
  const laiSuat = Number(formData.laiSuatDuyet) || 0;

  const gocThang = thoiHan > 0 ? duyetVay / thoiHan : 0;
  const laiThangDau = (duyetVay * (laiSuat / 100)) / 12;
  
  let nghiaVuKyCaoNhat = gocThang + laiThangDau;
  if (formData.phuongThucTraGoc === 'HANG_QUY') {
    const gocQuy = thoiHan >= 3 ? duyetVay / (thoiHan / 3) : duyetVay;
    nghiaVuKyCaoNhat = gocQuy + (laiThangDau * 3);
  } else if (formData.phuongThucTraGoc === 'HANG_NAM') {
    const gocNam = thoiHan >= 12 ? duyetVay / (thoiHan / 12) : duyetVay;
    nghiaVuKyCaoNhat = gocNam + (laiThangDau * 12);
  } else if (formData.phuongThucTraGoc === 'BAN_NIEN') {
    const goc6Th = thoiHan >= 6 ? duyetVay / (thoiHan / 6) : duyetVay;
    nghiaVuKyCaoNhat = goc6Th + (laiThangDau * 6);
  } else if (formData.phuongThucTraGoc === 'CUOI_KY') {
    nghiaVuKyCaoNhat = duyetVay + laiThangDau;
  }

  const emiThangQuyDoi = gocThang + laiThangDau;
  const tyLeLTV = tongGiaTriTSBD > 0 ? ((duyetVay / tongGiaTriTSBD) * 100).toFixed(1) : '0.0';
  const tyLeDTI = tongThuNhap > 0 ? ((emiThangQuyDoi / tongThuNhap) * 100).toFixed(1) : '0.0';
  const heSoDSCR = emiThangQuyDoi > 0 ? (thuNhapRong / emiThangQuyDoi).toFixed(2) : '0.00';

  // Sinh gợi ý Phương án tối ưu tự động
  const generateOptimalSuggestion = () => {
    const dtiNum = Number(tyLeDTI);
    const ltvNum = Number(tyLeLTV);
    let reasons = [];

    if (formData.coTSBD === 'Có') {
      if (ltvNum <= 70) {
        reasons.push(`Tỷ lệ LTV ${ltvNum}% đạt chuẩn an toàn TSBĐ (<= 70%).`);
      } else if (ltvNum <= 75) {
        reasons.push(`Tỷ lệ LTV ${ltvNum}% tiệm cận trần tối đa (75%), cần theo dõi chặt chẽ biến động giá trị TSBĐ.`);
      } else {
        reasons.push(`CẢNH BÁO: Tỷ lệ LTV ${ltvNum}% vượt mức quy định (75%). Đề nghị bổ sung thêm TSBĐ hoặc giảm số tiền cho vay xuống tối đa ${formatCurrencyVN(tongGiaTriTSBD * 0.7)}.`);
      }
    }

    if (dtiNum <= 50) {
      reasons.push(`Tỷ lệ DTI ${dtiNum}% rất an toàn (<= 50%), dòng tiền thặng dư ${formatCurrencyVN(thuNhapRong)}/tháng đảm bảo trả nợ tốt.`);
    } else if (dtiNum <= 60) {
      reasons.push(`Tỷ lệ DTI ${dtiNum}% đạt chuẩn khả năng trả nợ (<= 60%).`);
    } else {
      reasons.push(`CẢNH BÁO: Nghĩa vụ trả nợ tháng ${formatCurrencyVN(emiThangQuyDoi)} chiếm ${dtiNum}% thu nhập. Đề xuất kéo dài thời hạn vay lên ${thoiHan + 12} tháng hoặc chuyển sang hình thức trả gốc định kỳ quý để giảm áp lực dòng tiền.`);
    }

    if (formData.phuongThucTraGoc === 'HANG_THANG') {
      reasons.push(`Phương thức trả gốc hàng tháng giúp giảm nhanh dư nợ và tiết kiệm chi phí lãi vay cho khách hàng.`);
    } else if (formData.phuongThucTraGoc === 'HANG_QUY') {
      reasons.push(`Phương thức trả gốc hàng quý phù hợp với chu kỳ thu hoạch và thu hồi vốn lưu động của khách hàng.`);
    } else if (formData.phuongThucTraGoc === 'CUOI_KY') {
      reasons.push(`Phương thức trả gốc cuối kỳ chỉ nên áp dụng cho khoản vay thời hạn ngắn (<= 12 tháng) có nguồn thu đột biến vào cuối vụ.`);
    }

    return reasons.join(' ');
  };

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
      chiTietLoaiDat: [...(prev.chiTietLoaiDat || []), newRow]
    }));
  };

  const handleUpdateLandRow = (index, field, val) => {
    setFormData((prev) => {
      const list = [...(prev.chiTietLoaiDat || [])];
      const item = { ...list[index], [field]: val };
      if (field === 'dienTich' || field === 'donGia') {
        const dt = field === 'dienTich' ? Number(val) : Number(item.dienTich);
        const dg = field === 'donGia' ? Number(val) : Number(item.donGia);
        item.thanhTien = (dt || 0) * (dg || 0);
      }
      list[index] = item;
      return { ...prev, chiTietLoaiDat: list };
    });
  };

  const handleRemoveLandRow = (index) => {
    setFormData((prev) => {
      const list = (prev.chiTietLoaiDat || []).filter((_, i) => i !== index);
      return { ...prev, chiTietLoaiDat: list };
    });
  };

  const handleTabChange = (targetTab) => {
    if (targetTab > 1 && !formData.maKH) {
      setFormError('BẮT BUỘC: Vui lòng chọn Khách hàng từ CSDL KH_CORE trước khi chuyển sang các bước tiếp theo!');
      return;
    }
    setFormError('');
    setActiveTab(targetTab);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.maKH) {
      setFormError('BẮT BUỘC: Bạn phải chọn Khách hàng từ CSDL KH_CORE trước khi lưu Báo cáo thẩm định!');
      setActiveTab(1);
      return;
    }
    if (!formData.hoTen || !formData.soCCCD) {
      setFormError('Thông tin khách hàng từ KH_CORE không hợp lệ (thiếu Họ tên hoặc CCCD)');
      setActiveTab(1);
      return;
    }

    const payload = {
      ...formData,
      tongThuNhapThang: tongThuNhap,
      thuNhapChinh: tongThuNhap,
      tongChiPhiThang: tongChiPhi,
      thuNhapRong: thuNhapRong,
      thangDuThang: thuNhapRong,
      dienTich: tongDienTichDat || formData.dienTich,
      giaTriTSBD: tongGiaTriTSBD,
      tyLeLTV: Number(tyLeLTV),
      nghiaVuTraNoThang: Math.round(emiThangQuyDoi),
      tyLeDSR: Number(tyLeDTI),
      heSoBuDap: Number(heSoDSCR),
      phuongAnToiUu: formData.phuongAnToiUu || generateOptimalSuggestion(),
      canBoThamDinh: formData.canBoThamDinh || currentUser?.fullName || 'Lê Văn Tín (CBTD)',
      canBoLapUsername: currentUser?.username || 'qtdyentho.cbtd'
    };

    onSubmit(payload);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1055 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-3 p-md-4">
          {/* Header */}
          <div className="modal-header border-0 pb-2">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <span className="badge bg-primary-subtle text-primary font-monospace fs-6 px-2.5 py-1 rounded-pill">
                  {formData.maBCTD || 'MỚI'}
                </span>
                <span className="badge bg-success-subtle text-success px-2.5 py-1 rounded-pill small fw-semibold">
                  Đồng Bộ Dữ Liệu Pháp Lý Từ KH_CORE
                </span>
                <span className="badge bg-light text-muted border small">
                  Người lập: <strong>{currentUser?.fullName || formData.canBoThamDinh}</strong>
                </span>
              </div>
              <h4 className="fw-extrabold text-slate-900 font-heading m-0">
                Lập Báo Cáo Thẩm Định & Đề Xuất Cấp Tín Dụng
              </h4>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          {/* 5 Tabs Navigation */}
          <div className="border-bottom mt-2 mb-3">
            <ul className="nav nav-tabs nav-fill border-0 gap-1 flex-nowrap overflow-auto" role="tablist">
              <li className="nav-item">
                <button
                  className={`nav-link text-start py-2.5 px-3 rounded-top-3 fw-bold small ${
                    activeTab === 1 ? 'active bg-primary text-white shadow-sm' : 'text-slate-600 hover-bg-light'
                  }`}
                  onClick={() => handleTabChange(1)}
                  type="button"
                >
                  <span className="badge bg-white text-dark me-1.5 rounded-circle px-1.5 py-0.5">1</span>
                  Pháp Lý (Từ Core) & Thu Nhập
                </button>
              </li>

              <li className="nav-item">
                <button
                  className={`nav-link text-start py-2.5 px-3 rounded-top-3 fw-bold small ${
                    activeTab === 2 ? 'active bg-primary text-white shadow-sm' : 'text-slate-600 hover-bg-light'
                  }`}
                  onClick={() => handleTabChange(2)}
                  type="button"
                >
                  <span className="badge bg-white text-dark me-1.5 rounded-circle px-1.5 py-0.5">2</span>
                  Tài Sản Bảo Đảm
                </button>
              </li>

              <li className="nav-item">
                <button
                  className={`nav-link text-start py-2.5 px-3 rounded-top-3 fw-bold small ${
                    activeTab === 3 ? 'active bg-primary text-white shadow-sm' : 'text-slate-600 hover-bg-light'
                  }`}
                  onClick={() => handleTabChange(3)}
                  type="button"
                >
                  <span className="badge bg-white text-dark me-1.5 rounded-circle px-1.5 py-0.5">3</span>
                  Thực Địa & CIC
                </button>
              </li>

              <li className="nav-item">
                <button
                  className={`nav-link text-start py-2.5 px-3 rounded-top-3 fw-bold small ${
                    activeTab === 4 ? 'active bg-primary text-white shadow-sm' : 'text-slate-600 hover-bg-light'
                  }`}
                  onClick={() => handleTabChange(4)}
                  type="button"
                >
                  <span className="badge bg-white text-dark me-1.5 rounded-circle px-1.5 py-0.5">4</span>
                  Đề Xuất & Phương Án
                </button>
              </li>

              <li className="nav-item">
                <button
                  className={`nav-link text-start py-2.5 px-3 rounded-top-3 fw-bold small ${
                    activeTab === 5 ? 'active bg-primary text-white shadow-sm' : 'text-slate-600 hover-bg-light'
                  }`}
                  onClick={() => handleTabChange(5)}
                  type="button"
                >
                  <span className="badge bg-white text-dark me-1.5 rounded-circle px-1.5 py-0.5">5</span>
                  Kết Luận & Trình Duyệt
                </button>
              </li>
            </ul>
          </div>

          {formError && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3">
              <AlertCircle size={18} />
              <span className="small fw-semibold">{formError}</span>
            </div>
          )}

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="modal-body py-2">
            {/* ========================================================================= */}
            {/* TAB 1: THÔNG TIN PHÁP LÝ TỰ ĐỘNG TỪ KH_CORE & THU NHẬP CHI TIẾT           */}
            {/* ========================================================================= */}
            {activeTab === 1 && (
              <div className="d-flex flex-column gap-3">
                {/* Khối Bắt Buộc Chọn Khách Hàng Từ KH_CORE */}
                <div className="p-3 bg-primary-subtle rounded-3 border border-primary-subtle shadow-2xs">
                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <label className="form-label small fw-extrabold text-primary m-0 d-flex align-items-center gap-1.5">
                      <Search size={16} /> BẮT BUỘC CHỌN THÀNH VIÊN TỪ CƠ SỞ DỮ LIỆU KH_CORE (*)
                    </label>
                    <span className="badge bg-white text-primary border border-primary-subtle small fw-bold">
                      {formData.maKH ? `Đã liên kết: ${formData.maKH} - ${formData.hoTen}` : 'Chưa chọn khách hàng'}
                    </span>
                  </div>

                  <div className="row g-2 align-items-center">
                    <div className="col-md-5">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white"><Search size={14} /></span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Gõ tìm theo Tên, CCCD, Mã KH, SĐT..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-7">
                      <select
                        className="form-select form-select-sm fw-bold border-primary"
                        value={formData.maKH}
                        onChange={(e) => handleSelectCustomer(e.target.value)}
                        required
                      >
                        <option value="">-- Bấm để chọn Khách Hàng từ KH_CORE ({filteredCustomers.length} KH) --</option>
                        {filteredCustomers.map((c) => (
                          <option key={c.maKH} value={c.maKH}>
                            {c.hoTen} • Mã: {c.maKH} • CCCD: {c.cccd || c.gttt} • SĐT: {c.dienThoaiDD || c.dienThoai || '---'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {!formData.maKH && (
                    <div className="mt-2 pt-2 border-top border-primary-subtle d-flex align-items-center gap-2 text-primary small">
                      <Info size={16} />
                      <span>
                        <strong>Quy tắc nghiệp vụ:</strong> Cán bộ tín dụng không nhập tay tên và thông tin pháp lý. Nếu khách hàng chưa có trong danh sách, vui lòng thêm khách hàng vào danh mục <strong>Khách Hàng Core (KH_CORE)</strong> trước khi lập Báo cáo thẩm định.
                      </span>
                    </div>
                  )}
                </div>

                {/* Thông tin nhân thân (Read-only từ KH_CORE) */}
                <div className="row g-3">
                  {/* Cột Trái: Ảnh KH & Trạng thái Core */}
                  <div className="col-md-4">
                    <div className="p-3 bg-white rounded-3 border h-100 text-center d-flex flex-column align-items-center justify-content-center">
                      <div className="mb-2 position-relative">
                        {formData.hinhAnhKH ? (
                          <img
                            src={formData.hinhAnhKH}
                            alt="Ảnh khách hàng"
                            className="rounded-3 border object-fit-cover shadow-sm"
                            style={{ width: '130px', height: '150px' }}
                          />
                        ) : (
                          <div
                            className="rounded-3 border bg-light d-flex flex-column align-items-center justify-content-center text-muted"
                            style={{ width: '130px', height: '150px' }}
                          >
                            <Camera size={36} className="opacity-50 mb-1" />
                            <span style={{ fontSize: '0.7rem' }}>Ảnh chân dung</span>
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        className="form-control form-control-sm text-center"
                        placeholder="Dán link ảnh KH (URL)..."
                        value={formData.hinhAnhKH}
                        onChange={(e) => setFormData({ ...formData, hinhAnhKH: e.target.value })}
                      />
                      <span className="text-muted mt-1" style={{ fontSize: '0.68rem' }}>
                        Ảnh chụp nhận diện thực tế tại cơ sở
                      </span>
                    </div>
                  </div>

                  {/* Cột Phải: Các trường dữ liệu pháp lý (Khóa cố định) */}
                  <div className="col-md-8">
                    <div className="row g-2">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-slate-700 d-flex justify-content-between">
                          <span>Họ và Tên Khách Hàng:</span>
                          <span className="badge bg-secondary-subtle text-secondary small"><Lock size={10} className="inline me-0.5" /> Từ KH_CORE</span>
                        </label>
                        <input
                          type="text"
                          className="form-control fw-bold bg-light"
                          value={formData.hoTen}
                          readOnly
                          placeholder="-- Chọn khách hàng từ KH_CORE --"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-slate-700 d-flex justify-content-between">
                          <span>Số CCCD / GTTT:</span>
                          <span className="badge bg-secondary-subtle text-secondary small"><Lock size={10} className="inline me-0.5" /> Từ KH_CORE</span>
                        </label>
                        <input
                          type="text"
                          className="form-control font-monospace fw-bold bg-light"
                          value={formData.soCCCD}
                          readOnly
                          placeholder="-- CCCD 12 số --"
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-slate-700">Ngày Sinh (Core)</label>
                        <input
                          type="text"
                          className="form-control bg-light"
                          value={formData.ngaySinh}
                          readOnly
                          placeholder="dd/MM/yyyy"
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-slate-700">Giới Tính</label>
                        <select
                          className="form-select bg-light"
                          value={formData.gioiTinh}
                          onChange={(e) => setFormData({ ...formData, gioiTinh: e.target.value })}
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-slate-700">Số Điện Thoại (Core)</label>
                        <input
                          type="text"
                          className="form-control bg-light"
                          value={formData.dienThoai}
                          readOnly
                          placeholder="Số điện thoại..."
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-slate-700">Ngành Nghề / Lĩnh Vực Hoạt Động</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.nganhNghe}
                          onChange={(e) => setFormData({ ...formData, nganhNghe: e.target.value })}
                          placeholder="Kinh doanh tạp hóa, Nông nghiệp..."
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-slate-700">Trình Độ Học Vấn</label>
                        <select
                          className="form-select"
                          value={formData.trinhDo}
                          onChange={(e) => setFormData({ ...formData, trinhDo: e.target.value })}
                        >
                          <option value="Đại học / Cao đẳng">Đại học / Cao đẳng</option>
                          <option value="Trung cấp / Dạy nghề">Trung cấp / Dạy nghề</option>
                          <option value="THPT (12/12)">THPT (12/12)</option>
                          <option value="THCS (9/12)">THCS (9/12)</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-bold text-slate-700 d-flex justify-content-between">
                          <span>Địa Chỉ Thường Trú (Core):</span>
                          <span className="badge bg-secondary-subtle text-secondary small"><Lock size={10} className="inline me-0.5" /> Từ KH_CORE</span>
                        </label>
                        <input
                          type="text"
                          className="form-control bg-light"
                          value={formData.diaChi}
                          readOnly
                          placeholder="Địa chỉ thường trú..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Khối Hôn Nhân & Người Đồng Vay */}
                <div className="p-3 bg-light rounded-3 border">
                  <h6 className="fw-bold text-slate-800 mb-2 d-flex align-items-center gap-1.5">
                    <User size={16} className="text-primary" /> Thông Tin Hôn Nhân & Người Đồng Vay (Vợ / Chồng)
                  </h6>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-slate-700">Tình Trạng Hôn Nhân</label>
                      <select
                        className="form-select"
                        value={formData.tinhTrangHonNhan}
                        onChange={(e) => setFormData({ ...formData, tinhTrangHonNhan: e.target.value })}
                      >
                        <option value="Đã kết hôn">Đã kết hôn</option>
                        <option value="Độc thân">Độc thân</option>
                        <option value="Ly hôn / Góa">Ly hôn / Góa</option>
                      </select>
                    </div>

                    <div className="col-md-8">
                      <label className="form-label small fw-bold text-slate-700">Họ Tên & Số CCCD Người Đồng Vay (nếu có)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nguoiDongVay}
                        onChange={(e) => setFormData({ ...formData, nguoiDongVay: e.target.value })}
                        placeholder="Nguyễn Thị Hoa (Vợ - CCCD: 038186001234)"
                      />
                    </div>
                  </div>
                </div>

                {/* Khối Chi Tiết Thu Nhập, Nguồn Gốc & Thu Nhập Ròng */}
                <div className="p-3 bg-light rounded-3 border">
                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <h6 className="fw-bold text-slate-800 m-0 d-flex align-items-center gap-1.5">
                      <DollarSign size={16} className="text-success" /> Kê Khai Thu Nhập & Nguồn Gốc (Người Vay + Đồng Vay)
                    </h6>
                    <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace fw-bold">
                      Thu Nhập Ròng: {formatCurrencyVN(thuNhapRong)}/tháng
                    </span>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="p-2.5 bg-white rounded-3 border">
                        <span className="small fw-bold text-primary d-block mb-1">1. Thu nhập Người Vay Chính (VNĐ/tháng)</span>
                        <ThousandInput
                          className="form-control fw-bold text-success mb-2"
                          value={formData.thuNhapNguoiVay}
                          onChange={(val) => setFormData({ ...formData, thuNhapNguoiVay: val })}
                          placeholder="25,000,000"
                        />
                        <label className="form-label small text-muted mb-0">Nguồn gốc thu nhập người vay:</label>
                        <textarea
                          rows={2}
                          className="form-control form-control-sm"
                          value={formData.nguonThuNguoiVay}
                          onChange={(e) => setFormData({ ...formData, nguonThuNguoiVay: e.target.value })}
                          placeholder="Lương, lợi nhuận SXKD, bán nông sản..."
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-2.5 bg-white rounded-3 border">
                        <span className="small fw-bold text-info d-block mb-1">2. Thu nhập Người Đồng Vay / Vợ Chồng (VNĐ/tháng)</span>
                        <ThousandInput
                          className="form-control fw-bold text-info mb-2"
                          value={formData.thuNhapDongVay}
                          onChange={(val) => setFormData({ ...formData, thuNhapDongVay: val })}
                          placeholder="10,000,000"
                        />
                        <label className="form-label small text-muted mb-0">Nguồn gốc thu nhập đồng vay:</label>
                        <textarea
                          rows={2}
                          className="form-control form-control-sm"
                          value={formData.nguonThuDongVay}
                          onChange={(e) => setFormData({ ...formData, nguonThuDongVay: e.target.value })}
                          placeholder="Lương, buôn bán tạp hóa, làm thêm..."
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-slate-700">Chi Phí Sinh Hoạt Gia Đình</label>
                      <ThousandInput
                        className="form-control text-danger fw-semibold"
                        value={formData.chiPhiSinhHoat}
                        onChange={(val) => setFormData({ ...formData, chiPhiSinhHoat: val })}
                        placeholder="10,000,000"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-slate-700">Chi Phí SXKD / Vận Hành</label>
                      <ThousandInput
                        className="form-control text-danger fw-semibold"
                        value={formData.chiPhiSXKD}
                        onChange={(val) => setFormData({ ...formData, chiPhiSXKD: val })}
                        placeholder="5,000,000"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-slate-700">Chi Phí Khác (nếu có)</label>
                      <ThousandInput
                        className="form-control text-danger fw-semibold"
                        value={formData.chiPhiKhac}
                        onChange={(val) => setFormData({ ...formData, chiPhiKhac: val })}
                        placeholder="0"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-slate-700">Tài Liệu Chứng Minh Nguồn Thu Nhập</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.chungMinhThuNhap}
                        onChange={(e) => setFormData({ ...formData, chungMinhThuNhap: e.target.value })}
                        placeholder="Mô tả chứng từ hoặc dán link tài liệu chứng minh thu nhập..."
                      />
                    </div>
                  </div>
                </div>

                {/* Khối Nhu Cầu Vay Vốn */}
                <div className="p-3 bg-light rounded-3 border">
                  <h6 className="fw-bold text-slate-800 mb-2 d-flex align-items-center gap-1.5">
                    <TrendingUp size={16} className="text-primary" /> Nhu Cầu Vốn Đề Xuất
                  </h6>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-slate-700">Số Tiền Đề Xuất Vay (VNĐ)</label>
                      <ThousandInput
                        className="form-control fw-bold text-primary"
                        value={formData.deXuatVay}
                        onChange={(val) => setFormData({ ...formData, deXuatVay: val, duyetVay: val })}
                        placeholder="200,000,000"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-slate-700">Thời Hạn Vay (tháng)</label>
                      <input
                        type="number"
                        className="form-control fw-semibold"
                        value={formData.thoiHanVay}
                        onChange={(e) => setFormData({ ...formData, thoiHanVay: Number(e.target.value), thoiHanThang: Number(e.target.value) })}
                        min={1}
                        max={120}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-slate-700">Lãi Suất Đề Nghị (%/năm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control fw-semibold"
                        value={formData.laiSuatDeNghi}
                        onChange={(e) => setFormData({ ...formData, laiSuatDeNghi: Number(e.target.value), laiSuatDuyet: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-slate-700">Mục Đích Sử Dụng Vốn Vay</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.mucDichVay}
                        onChange={(e) => setFormData({ ...formData, mucDichVay: e.target.value })}
                        placeholder="Đầu tư mở rộng xưởng cơ khí & mua thêm nguyên vật liệu..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: TÀI SẢN BẢO ĐẢM & BẢNG PHÂN LOẠI DIỆN TÍCH ĐẤT ĐA LOẠI             */}
            {/* ========================================================================= */}
            {activeTab === 2 && (
              <div className="d-flex flex-column gap-3">
                <div className="row g-2 align-items-center">
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-slate-700">Có Tài Sản Bảo Đảm Không?</label>
                    <select
                      className="form-select fw-semibold"
                      value={formData.coTSBD}
                      onChange={(e) => setFormData({ ...formData, coTSBD: e.target.value })}
                    >
                      <option value="Có">Có TSBĐ (Thế chấp / Cầm cố)</option>
                      <option value="Không">Không (Cho vay tín chấp)</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-slate-700">Hình Thức Bảo Đảm</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.hinhThucBaoDam}
                      onChange={(e) => setFormData({ ...formData, hinhThucBaoDam: e.target.value })}
                      placeholder="Thế chấp QSDĐ (Sổ đỏ)"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-slate-700">Nguồn Gốc Tài Sản</label>
                    <select
                      className="form-select"
                      value={formData.nguonGocTSBD}
                      onChange={(e) => setFormData({ ...formData, nguonGocTSBD: e.target.value })}
                    >
                      <option value="Nhận chuyển nhượng quyền sử dụng đất">Nhận chuyển nhượng (Mua bán)</option>
                      <option value="Nhà nước giao đất có thu tiền / Công nhận QSDĐ">Nhà nước giao / Công nhận QSDĐ</option>
                      <option value="Thừa kế quyền sử dụng đất">Thừa kế</option>
                      <option value="Tặng cho quyền sử dụng đất">Tặng cho</option>
                      <option value="Khác">Nguồn gốc khác</option>
                    </select>
                  </div>
                </div>

                {formData.coTSBD === 'Có' && (
                  <>
                    <div className="p-3 bg-light rounded-3 border">
                      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                        <div>
                          <h6 className="fw-bold text-slate-800 m-0 d-flex align-items-center gap-1.5">
                            <Building2 size={16} className="text-primary" /> Phân Loại Diện Tích & Định Giá Từng Loại Đất (VNĐ/m²)
                          </h6>
                          <span className="text-muted small">
                            Hỗ trợ thửa đất có nhiều mục đích sử dụng (Đất ở ONT, Đất trồng cây CLN, Đất nuôi trồng thủy sản...)
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary fw-semibold"
                          onClick={handleAddLandRow}
                        >
                          <Plus size={14} className="me-1 inline" /> Thêm Loại Đất
                        </button>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-sm table-bordered bg-white align-middle mb-2">
                          <thead className="table-light small">
                            <tr>
                              <th style={{ width: '35%' }}>Loại Đất / Mục Đích Sử Dụng</th>
                              <th style={{ width: '20%' }} className="text-end">Diện Tích (m²)</th>
                              <th style={{ width: '20%' }} className="text-end">Đơn Giá Định Giá (VNĐ/m²)</th>
                              <th style={{ width: '20%' }} className="text-end">Thành Tiền (VNĐ)</th>
                              <th style={{ width: '5%' }} className="text-center">Xóa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {chiTietDat.map((row, idx) => (
                              <tr key={row.id || idx}>
                                <td>
                                  <select
                                    className="form-select form-select-sm fw-semibold"
                                    value={row.loaiDat}
                                    onChange={(e) => handleUpdateLandRow(idx, 'loaiDat', e.target.value)}
                                  >
                                    <option value="Đất ở tại nông thôn (ONT)">Đất ở tại nông thôn (ONT)</option>
                                    <option value="Đất ở tại đô thị (ODT)">Đất ở tại đô thị (ODT)</option>
                                    <option value="Đất trồng cây lâu năm (CLN)">Đất trồng cây lâu năm (CLN)</option>
                                    <option value="Đất trồng cây hàng năm khác (HNK)">Đất trồng cây hàng năm khác (HNK)</option>
                                    <option value="Đất trồng lúa (LUC/LUK)">Đất trồng lúa (LUC/LUK)</option>
                                    <option value="Đất nuôi trồng thủy sản (NTS)">Đất nuôi trồng thủy sản (NTS)</option>
                                    <option value="Đất rừng sản xuất (RSX)">Đất rừng sản xuất (RSX)</option>
                                    <option value="Đất thương mại, dịch vụ (TMD)">Đất thương mại, dịch vụ (TMD)</option>
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.1"
                                    className="form-control form-control-sm text-end fw-bold"
                                    value={row.dienTich}
                                    onChange={(e) => handleUpdateLandRow(idx, 'dienTich', e.target.value)}
                                    placeholder="100"
                                  />
                                </td>
                                <td>
                                  <ThousandInput
                                    className="form-control form-control-sm text-end fw-semibold text-primary"
                                    value={row.donGia}
                                    onChange={(val) => handleUpdateLandRow(idx, 'donGia', val)}
                                    placeholder="3,000,000"
                                  />
                                </td>
                                <td className="text-end fw-bold text-success num-tabular">
                                  {formatCurrencyVN(row.thanhTien || 0)}
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-outline-danger p-1"
                                    onClick={() => handleRemoveLandRow(idx)}
                                    disabled={chiTietDat.length <= 1}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="table-light fw-bold small">
                            <tr>
                              <td>TỔNG DIỆN TÍCH & GIÁ TRỊ QUYỀN SỬ DỤNG ĐẤT:</td>
                              <td className="text-end text-primary num-tabular">{tongDienTichDat.toLocaleString('vi-VN')} m²</td>
                              <td className="text-end">---</td>
                              <td className="text-end text-success num-tabular">{formatCurrencyVN(tongGiaTriDat)}</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      <div className="row g-2 mt-2 pt-2 border-top">
                        <div className="col-md-4">
                          <label className="form-label small fw-bold text-slate-700">Giá Trị Công Trình / Nhà Ở Trên Đất (VNĐ)</label>
                          <ThousandInput
                            className="form-control text-primary fw-semibold"
                            value={formData.giaTriCongTrinh}
                            onChange={(val) => setFormData({ ...formData, giaTriCongTrinh: val })}
                            placeholder="150,000,000"
                          />
                        </div>

                        <div className="col-md-4">
                          <label className="form-label small fw-bold text-slate-700">Giá Trị Thị Trường Tham Khảo (VNĐ)</label>
                          <ThousandInput
                            className="form-control fw-semibold"
                            value={formData.giaTriThiTruong}
                            onChange={(val) => setFormData({ ...formData, giaTriThiTruong: val })}
                            placeholder="700,000,000"
                          />
                        </div>

                        <div className="col-md-4">
                          <label className="form-label small fw-bold text-slate-700">Tổng Giá Trị Định Giá QTDND (VNĐ)</label>
                          <div className="form-control bg-success-subtle text-success fw-extrabold num-tabular">
                            {formatCurrencyVN(tongGiaTriTSBD)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row g-2">
                      <div className="col-md-3">
                        <label className="form-label small fw-bold text-slate-700">Số Giấy Chứng Nhận (GCN / Sổ đỏ)</label>
                        <input
                          type="text"
                          className="form-control font-monospace fw-bold text-primary"
                          value={formData.soGCN}
                          onChange={(e) => setFormData({ ...formData, soGCN: e.target.value })}
                          placeholder="CH 892341"
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label small fw-bold text-slate-700">Thửa Đất Số</label>
                        <input
                          type="text"
                          className="form-control font-monospace"
                          value={formData.thuaDatSo}
                          onChange={(e) => setFormData({ ...formData, thuaDatSo: e.target.value })}
                          placeholder="112"
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label small fw-bold text-slate-700">Tờ Bản Đồ Số</label>
                        <input
                          type="text"
                          className="form-control font-monospace"
                          value={formData.toBanDoSo}
                          onChange={(e) => setFormData({ ...formData, toBanDoSo: e.target.value })}
                          placeholder="08"
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label small fw-bold text-slate-700">Chủ Sở Hữu Ghi Trên Sổ</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.chuSoHuuTSBD}
                          onChange={(e) => setFormData({ ...formData, chuSoHuuTSBD: e.target.value })}
                          placeholder="Nguyễn Văn An"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-slate-700">Địa Chỉ Nơi Có Tài Sản Bảo Đảm</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.diaChiTSBD}
                          onChange={(e) => setFormData({ ...formData, diaChiTSBD: e.target.value })}
                          placeholder="Thôn Yên Lãng, Xã Yên Thọ, Huyện Ý Yên, Nam Định"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-slate-700">Tình Trạng Pháp Lý & Quy Hoạch</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.tinhTrangPhapLyTSBD}
                          onChange={(e) => setFormData({ ...formData, tinhTrangPhapLyTSBD: e.target.value })}
                          placeholder="Đầy đủ sổ đỏ hợp pháp, không có tranh chấp hay quy hoạch"
                        />
                      </div>

                      <div className="col-md-8">
                        <label className="form-label small fw-bold text-slate-700">Mô Tả Hiện Trạng & Ghi Chú Tài Sản</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.moTaTSBD}
                          onChange={(e) => setFormData({ ...formData, moTaTSBD: e.target.value })}
                          placeholder="Đường liên thôn rộng 5m, xe tải vào tận nơi..."
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-slate-700">Hình Ảnh Tài Sản / Sổ Đỏ (URL)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.hinhAnhTSBD}
                          onChange={(e) => setFormData({ ...formData, hinhAnhTSBD: e.target.value })}
                          placeholder="Dán link ảnh thực địa tài sản..."
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: THỰC ĐỊA, KHẢ NĂNG TÀI CHÍNH & LỊCH SỬ CIC                         */}
            {/* ========================================================================= */}
            {activeTab === 3 && (
              <div className="d-flex flex-column gap-3">
                <div className="p-3 bg-light rounded-3 border">
                  <h6 className="fw-bold text-slate-800 mb-2 d-flex align-items-center gap-1.5">
                    <Calculator size={16} className="text-primary" /> Năng Lực Tài Chính & Dòng Tiền Thặng Dư (Kế Thừa Từ Kê Khai)
                  </h6>
                  <div className="row g-2 text-center">
                    <div className="col-md-4">
                      <div className="p-2.5 bg-white rounded-3 border">
                        <span className="text-muted small d-block">Tổng Thu Nhập Hàng Tháng:</span>
                        <span className="fw-bold text-success fs-6 num-tabular">{formatCurrencyVN(tongThuNhap)}</span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="p-2.5 bg-white rounded-3 border">
                        <span className="text-muted small d-block">Tổng Chi Phí Hàng Tháng:</span>
                        <span className="fw-bold text-danger fs-6 num-tabular">{formatCurrencyVN(tongChiPhi)}</span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="p-2.5 bg-white rounded-3 border">
                        <span className="text-muted small d-block">Thu Nhập Ròng Thặng Dư:</span>
                        <span className="fw-extrabold text-primary fs-6 num-tabular">{formatCurrencyVN(thuNhapRong)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-light rounded-3 border">
                  <h6 className="fw-bold text-slate-800 mb-2 d-flex align-items-center gap-1.5">
                    <ShieldCheck size={16} className="text-primary" /> Lịch Sử Quan Hệ Tín Dụng & Tra Cứu CIC
                  </h6>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-slate-700">Xếp Hạng Nhóm Nợ CIC</label>
                      <select
                        className="form-select fw-semibold"
                        value={formData.xepHangCIC}
                        onChange={(e) => setFormData({ ...formData, xepHangCIC: e.target.value })}
                      >
                        <option value="Nhóm 1 (Tốt)">Nhóm 1 (Nợ đủ tiêu chuẩn - Tốt)</option>
                        <option value="Nhóm 2 (Cần chú ý)">Nhóm 2 (Nợ cần chú ý)</option>
                        <option value="Nhóm 3 (Dưới tiêu chuẩn)">Nhóm 3 (Nợ dưới tiêu chuẩn)</option>
                        <option value="Nhóm 4 (Nghi ngờ)">Nhóm 4 (Nợ nghi ngờ)</option>
                        <option value="Nhóm 5 (Có khả năng mất vốn)">Nhóm 5 (Nợ có khả năng mất vốn)</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-slate-700">Số TCTD Đang Có Quan Hệ</label>
                      <input
                        type="number"
                        className="form-control fw-semibold"
                        value={formData.soTCTDQuanHe}
                        onChange={(e) => setFormData({ ...formData, soTCTDQuanHe: Number(e.target.value) })}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-slate-700">Tổng Dư Nợ Tại Các TCTD Khác (VNĐ)</label>
                      <ThousandInput
                        className="form-control fw-semibold"
                        value={formData.duNoCICNgoai}
                        onChange={(val) => setFormData({ ...formData, duNoCICNgoai: val })}
                        placeholder="0"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-slate-700">Lịch Sử Trả Nợ Tại Các TCTD</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.lichSuTraNo}
                        onChange={(e) => setFormData({ ...formData, lichSuTraNo: e.target.value })}
                        placeholder="Trả nợ đúng hạn, không có nợ quá hạn"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-slate-700">Ghi Chú Kết Quả Tra Cứu CIC</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.ghiChuCIC}
                        onChange={(e) => setFormData({ ...formData, ghiChuCIC: e.target.value })}
                        placeholder="Tra cứu CIC: Lịch sử tín dụng tốt..."
                      />
                    </div>
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-slate-700">Địa Điểm Thẩm Định Thực Tế</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.diaDiemThamDinh}
                      onChange={(e) => setFormData({ ...formData, diaDiemThamDinh: e.target.value })}
                      placeholder="Tại nhà riêng và xưởng sản xuất..."
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-slate-700">Tư Cách Khách Hàng & Uy Tín Xã Hội</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.tuCachKhachHang}
                      onChange={(e) => setFormData({ ...formData, tuCachKhachHang: e.target.value })}
                      placeholder="Đạo đức tốt, lối sống lành mạnh, có uy tín cao..."
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold text-slate-700">Đánh Giá Hiện Trạng Hoạt Động SXKD / Sử Dụng Vốn</label>
                    <textarea
                      rows={2}
                      className="form-control"
                      value={formData.hienTrangSXKD}
                      onChange={(e) => setFormData({ ...formData, hienTrangSXKD: e.target.value })}
                      placeholder="Quy mô hoạt động ổn định, máy móc vận hành bình thường, đơn hàng đều đặn..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: ĐỀ XUẤT, PHƯƠNG THỨC TRẢ GỐC/LÃI & PHƯƠNG ÁN TỐI ƯU              */}
            {/* ========================================================================= */}
            {activeTab === 4 && (
              <div className="d-flex flex-column gap-3">
                <div className="p-3 bg-light rounded-3 border">
                  <h6 className="fw-bold text-slate-800 mb-2 d-flex align-items-center gap-1.5">
                    <TrendingUp size={16} className="text-primary" /> Đề Xuất Cấp Tín Dụng Của Cán Bộ Thẩm Định
                  </h6>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-slate-700">Số Tiền Cho Vay Đề Xuất (VNĐ) <span className="text-danger">*</span></label>
                      <ThousandInput
                        className="form-control fw-bold text-danger"
                        value={formData.duyetVay}
                        onChange={(val) => setFormData({ ...formData, duyetVay: val })}
                        placeholder="200,000,000"
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-slate-700">Thời Hạn Vay (Tháng)</label>
                      <input
                        type="number"
                        className="form-control fw-bold"
                        value={formData.thoiHanThang}
                        onChange={(e) => setFormData({ ...formData, thoiHanThang: Number(e.target.value) })}
                        min={1}
                        max={120}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-slate-700">Lãi Suất Cho Vay (%/năm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control fw-bold text-success"
                        value={formData.laiSuatDuyet}
                        onChange={(e) => setFormData({ ...formData, laiSuatDuyet: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-slate-700">
                        Phương Thức Trả Gốc <span className="text-primary fw-bold">(*)</span>
                      </label>
                      <select
                        className="form-select fw-semibold"
                        value={formData.phuongThucTraGoc}
                        onChange={(e) => setFormData({ ...formData, phuongThucTraGoc: e.target.value })}
                      >
                        <option value="HANG_THANG">1. Trả gốc đều hàng tháng (Định kỳ tháng)</option>
                        <option value="HANG_QUY">2. Trả gốc đều hàng quý (3 tháng/lần)</option>
                        <option value="BAN_NIEN">3. Trả gốc đều 6 tháng/lần (Bán niên)</option>
                        <option value="HANG_NAM">4. Trả gốc đều hàng năm (12 tháng/lần)</option>
                        <option value="CUOI_KY">5. Trả toàn bộ gốc cuối kỳ (Khi đáo hạn)</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-slate-700">Phương Thức Trả Lãi</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        readOnly
                        value="Lãi thu hàng tháng theo dư nợ thực tế (Chuẩn TT 14/2017/TT-NHNN)"
                      />
                    </div>
                  </div>
                </div>

                <div className="row g-2 text-center">
                  <div className="col-6 col-md-3">
                    <div className="p-2.5 bg-light rounded-3 border">
                      <span className="text-muted small d-block">Tỷ lệ LTV (Vay/TSBĐ):</span>
                      <div className={`fw-extrabold fs-6 ${Number(tyLeLTV) > 75 ? 'text-danger' : Number(tyLeLTV) > 70 ? 'text-warning' : 'text-success'}`}>
                        {tyLeLTV}%
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                        {Number(tyLeLTV) <= 70 ? 'Đạt chuẩn an toàn (≤70%)' : Number(tyLeLTV) <= 75 ? 'Mức tối đa cho phép' : 'Vượt trần quy định'}
                      </span>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="p-2.5 bg-light rounded-3 border">
                      <span className="text-muted small d-block">Tỷ lệ DTI (Nợ/Thu nhập):</span>
                      <div className={`fw-extrabold fs-6 ${Number(tyLeDTI) > 60 ? 'text-danger' : 'text-success'}`}>
                        {tyLeDTI}%
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                        {Number(tyLeDTI) <= 60 ? 'Dòng tiền đạt chuẩn (≤60%)' : 'Áp lực trả nợ cao'}
                      </span>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="p-2.5 bg-light rounded-3 border">
                      <span className="text-muted small d-block">Nghĩa vụ tháng bình quân:</span>
                      <div className="fw-extrabold text-danger fs-6 num-tabular">
                        {formatCurrencyVN(emiThangQuyDoi)}
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                        Gốc: {formatCurrencyVN(gocThang)} + Lãi
                      </span>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="p-2.5 bg-light rounded-3 border">
                      <span className="text-muted small d-block">Hệ số bù đắp (DSCR):</span>
                      <div className={`fw-extrabold fs-6 ${Number(heSoDSCR) >= 1.2 ? 'text-success' : 'text-warning'}`}>
                        {heSoDSCR}x
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                        {Number(heSoDSCR) >= 1.2 ? 'Dòng tiền thặng dư tốt' : 'Thặng dư mỏng'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-primary-subtle rounded-3 border border-primary-subtle">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h6 className="fw-bold text-primary m-0 d-flex align-items-center gap-1.5">
                      <Sparkles size={16} /> Đánh Giá Khả Năng Trả Nợ & Đề Xuất Phương Án Tối Ưu
                    </h6>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-primary"
                      onClick={() => setFormData({ ...formData, phuongAnToiUu: generateOptimalSuggestion() })}
                    >
                      Tự động phân tích lại
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    className="form-control form-control-sm bg-white"
                    value={formData.phuongAnToiUu || generateOptimalSuggestion()}
                    onChange={(e) => setFormData({ ...formData, phuongAnToiUu: e.target.value })}
                    placeholder="Nhập nhận định phân tích phương án tối ưu..."
                  />
                  <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
                    Hệ thống tự động đối chiếu DTI, LTV, dòng tiền thặng dư và phương thức trả gốc để đưa ra khuyến nghị an toàn nhất.
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-slate-700">Hình Thức Giải Ngân</label>
                    <select
                      className="form-select"
                      value={formData.phuongThucGiaiNgan}
                      onChange={(e) => setFormData({ ...formData, phuongThucGiaiNgan: e.target.value })}
                    >
                      <option value="Chuyển khoản qua tài khoản CASA">Chuyển khoản qua tài khoản CASA (Khuyến khích)</option>
                      <option value="Tiền mặt tại quầy">Tiền mặt tại quầy</option>
                      <option value="Chuyển khoản cho bên thụ hưởng thứ 3">Chuyển khoản cho bên thụ hưởng thứ 3</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-slate-700">Biện Pháp Bảo Đảm Thực Hiện Nghĩa Vụ</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.bienPhapBaoDam}
                      onChange={(e) => setFormData({ ...formData, bienPhapBaoDam: e.target.value })}
                      placeholder="Thế chấp QSDĐ, công chứng và đăng ký GDBĐ đầy đủ"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: KIẾN NGHỊ KẾT LUẬN & KÝ DUYỆT ĐA CẤP                             */}
            {/* ========================================================================= */}
            {activeTab === 5 && (
              <div className="d-flex flex-column gap-3">
                <div className="p-3 bg-light rounded-3 border">
                  <h6 className="fw-bold text-slate-800 mb-2 d-flex align-items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-success" /> Đề Xuất Kết Luận Của Cán Bộ Thẩm Định
                  </h6>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-slate-700">Đề Xuất Kết Luận <span className="text-danger">*</span></label>
                      <select
                        className="form-select fw-bold"
                        value={formData.ketLuan}
                        onChange={(e) => setFormData({ ...formData, ketLuan: e.target.value })}
                      >
                        <option value="Đồng ý cấp tín dụng">1. Đề xuất: Đồng ý cấp tín dụng</option>
                        <option value="Có điều kiện bổ sung">2. Đề xuất: Đồng ý nhưng có điều kiện bổ sung</option>
                        <option value="Từ chối cấp tín dụng">3. Đề xuất: Không đủ điều kiện / Từ chối</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-slate-700">Đánh Giá Mức Độ Rủi Ro</label>
                      <select
                        className="form-select"
                        value={formData.mucDoRuiRo}
                        onChange={(e) => setFormData({ ...formData, mucDoRuiRo: e.target.value })}
                      >
                        <option value="Thấp">Thấp (Khách hàng tốt)</option>
                        <option value="Trung bình">Trung bình</option>
                        <option value="Cao">Cao (Cần giám sát)</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-slate-700">Cán Bộ Lập Báo Cáo</label>
                      <input
                        type="text"
                        className="form-control bg-light fw-semibold"
                        readOnly
                        value={currentUser?.fullName || formData.canBoThamDinh}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-slate-700">Điều Kiện Giải Ngân / Lưu Ý Giám Sát Sau Cho Vay</label>
                      <textarea
                        rows={3}
                        className="form-control"
                        value={formData.dieuKienGiaiNgan}
                        onChange={(e) => setFormData({ ...formData, dieuKienGiaiNgan: e.target.value })}
                        placeholder="Hoàn tất thủ tục công chứng HĐTC và nhận kết quả đăng ký thế chấp tại VP ĐKĐĐ; kiểm tra tiến độ sử dụng vốn sau 30 ngày..."
                      />
                    </div>
                  </div>
                </div>

                {/* Sơ đồ quy trình phê duyệt đa cấp */}
                <div className="p-3 bg-white rounded-3 border">
                  <span className="small fw-bold text-muted text-uppercase d-block mb-2 text-center" style={{ letterSpacing: '0.5px' }}>
                    Quy Trình Phê Duyệt Tín Dụng Đa Cấp 4 Bước (QTDND Yên Thọ)
                  </span>
                  <div className="row g-2 text-center">
                    <div className="col-3">
                      <div className="p-2 border rounded bg-success-subtle border-success-subtle">
                        <span className="small fw-bold text-success d-block">1. CBTD Lập Hồ Sơ</span>
                        <div className="fw-semibold small mt-1 text-slate-900">{currentUser?.fullName || formData.canBoThamDinh}</div>
                        <span className="badge bg-success text-white small mt-1">Đang hoàn tất</span>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="p-2 border rounded bg-light">
                        <span className="small fw-bold text-secondary d-block">2. Trưởng Phòng TD</span>
                        <div className="text-muted small mt-1">Chờ thẩm tra</div>
                        <span className="badge bg-secondary-subtle text-secondary small mt-1">Chờ xử lý</span>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="p-2 border rounded bg-light">
                        <span className="small fw-bold text-secondary d-block">3. Ban Kiểm Soát</span>
                        <div className="text-muted small mt-1">Chờ giám sát rủi ro</div>
                        <span className="badge bg-secondary-subtle text-secondary small mt-1">Chờ xử lý</span>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="p-2 border rounded bg-light">
                        <span className="small fw-bold text-secondary d-block">4. HĐQT / Ban Giám Đốc</span>
                        <div className="text-muted small mt-1">Chờ phê duyệt</div>
                        <span className="badge bg-secondary-subtle text-secondary small mt-1">Quyết định cuối</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="modal-footer border-0 pt-3 pb-0 px-0 d-flex justify-content-between">
              <div>
                {activeTab > 1 && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => handleTabChange(activeTab - 1)}
                  >
                    ← Quay Lại
                  </button>
                )}
              </div>

              <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                  Hủy Bỏ
                </button>

                {activeTab < 5 ? (
                  <button
                    type="button"
                    className="btn btn-brand btn-sm fw-semibold"
                    onClick={() => handleTabChange(activeTab + 1)}
                  >
                    Tiếp Theo →
                  </button>
                ) : (
                  <button type="submit" className="btn btn-success btn-sm fw-bold px-3">
                    <FileCheck2 size={16} className="me-1 inline" /> Hoàn Tất & Lưu Hồ Sơ Thẩm Định
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
