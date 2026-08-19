import React from 'react';
import {
  FileCheck2,
  Printer,
  User,
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  X,
  Layers,
  Calculator,
  Percent,
  Sparkles,
  Download,
  Lock,
  Clock,
  Award
} from 'lucide-react';
import { formatCurrencyVN, formatDateVN } from '../../utils/dateUtils';

export default function AppraisalDetailModal({ appraisal, onClose, onOpenAddOpinion, onOpenPrintPreview, currentUser }) {
  if (!appraisal) return null;

  const isHDQT = currentUser?.role === 'LANHDAO' || currentUser?.role === 'ADMIN';
  const isBKS = currentUser?.role === 'BKS';
  const isCBTD = currentUser?.role === 'CBTD';

  const duyetVay = Number(appraisal.duyetVay || appraisal.deXuatVay) || 0;
  const thuNhap = Number(appraisal.tongThuNhapThang || appraisal.thuNhapChinh) || 0;
  const chiPhi = Number(appraisal.tongChiPhiThang) || 0;
  const thuNhapRong = Number(appraisal.thuNhapRong || appraisal.thangDuThang) || (thuNhap - chiPhi);
  const giaTriTSBD = Number(appraisal.giaTriTSBD) || 0;
  const tyLeLTV = appraisal.tyLeLTV || (giaTriTSBD > 0 ? ((duyetVay / giaTriTSBD) * 100).toFixed(1) : '0.0');

  const thoiHan = Number(appraisal.thoiHanThang || appraisal.thoiHanVay) || 12;
  const laiSuat = Number(appraisal.laiSuatDuyet || appraisal.laiSuatDeNghi) || 0;
  const gocThang = thoiHan > 0 ? duyetVay / thoiHan : 0;
  const laiThang = (duyetVay * (laiSuat / 100)) / 12;
  const nghiaVuTraNoThang = Number(appraisal.nghiaVuTraNoThang) || (gocThang + laiThang);
  const tyLeDSR = appraisal.tyLeDSR || (thuNhap > 0 ? ((nghiaVuTraNoThang / thuNhap) * 100).toFixed(1) : '0.0');
  const heSoBuDap = appraisal.heSoBuDap || (nghiaVuTraNoThang > 0 ? (thuNhapRong / nghiaVuTraNoThang).toFixed(2) : '0.00');

  // Phân tích chi tiết loại đất
  let chiTietDat = [];
  try {
    chiTietDat = typeof appraisal.chiTietLoaiDat === 'string'
      ? JSON.parse(appraisal.chiTietLoaiDat || '[]')
      : (appraisal.chiTietLoaiDat || []);
  } catch (e) {
    chiTietDat = [];
  }

  const opinions = appraisal.danhSachYKien || [];

  // Tìm các ý kiến theo từng cấp
  const opinionHDQT = opinions.find(o => (o.chucVu && (o.chucVu.includes('HĐQT') || o.chucVu.includes('Giám Đốc') || o.chucVu.includes('Lãnh Đạo'))) || o.capDuyet === 'HDQT');
  const opinionBKS = opinions.find(o => (o.chucVu && o.chucVu.includes('Kiểm Soát')) || o.capDuyet === 'BKS');
  const opinionTruongPhong = opinions.find(o => (o.chucVu && o.chucVu.includes('Trưởng Phòng')) || o.capDuyet === 'TRUONG_PHONG');

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-3 p-md-4">
          {/* Header */}
          <div className="modal-header border-0 pb-2">
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <span className="badge bg-primary-subtle text-primary font-monospace fs-6 px-2.5 py-1 rounded-pill">
                  {appraisal.maBCTD}
                </span>
                <span
                  className={`badge-status ${
                    appraisal.ketLuan === 'Đồng ý cấp tín dụng'
                      ? 'badge-success-soft'
                      : appraisal.ketLuan === 'Có điều kiện bổ sung'
                      ? 'badge-warning-soft'
                      : 'badge-danger-soft'
                  }`}
                >
                  {appraisal.ketLuan}
                </span>
                <span className="badge bg-light text-muted border small">
                  Ngày lập: {formatDateVN(appraisal.ngayLap || new Date())}
                </span>
                <span className="badge bg-secondary-subtle text-secondary small">
                  Rủi ro: {appraisal.mucDoRuiRo || 'Thấp'}
                </span>
                <span className="badge bg-info-subtle text-info small">
                  CBTD Lập: <strong>{appraisal.canBoThamDinh || 'Lê Văn Tín (CBTD)'}</strong>
                </span>
              </div>
              <h4 className="fw-extrabold text-slate-900 font-heading m-0">
                Chi Tiết Báo Cáo Thẩm Định Tín Dụng & Theo Dõi Phê Duyệt Đa Cấp
              </h4>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body py-2">
            {/* ========================================================================= */}
            {/* TIẾN TRÌNH PHÊ DUYỆT 4 CẤP (STEPPER / TIMELINE CHUỖI DUYỆT)              */}
            {/* ========================================================================= */}
            <div className="p-3 bg-light rounded-3 border mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <h6 className="fw-bold text-slate-800 m-0 d-flex align-items-center gap-1.5">
                  <Award size={18} className="text-primary" /> Tiến Trình Thẩm Định & Phê Duyệt Đa Cấp (CBTD → Trưởng Phòng → BKS → HĐQT)
                </h6>
                <span className="badge bg-white text-muted border small">
                  Tổng số ý kiến ghi nhận: <strong>{opinions.length}</strong>
                </span>
              </div>

              <div className="row g-2 text-center">
                {/* 1. CBTD Lập */}
                <div className="col-6 col-md-3">
                  <div className="p-2.5 bg-white rounded-3 border border-success h-100 shadow-2xs">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="badge bg-success text-white small">1. CBTD Lập</span>
                      <CheckCircle2 size={15} className="text-success" />
                    </div>
                    <div className="fw-bold text-slate-900 small">{appraisal.canBoThamDinh || 'Lê Văn Tín'}</div>
                    <div className="text-muted" style={{ fontSize: '0.68rem' }}>Đề xuất: {formatCurrencyVN(duyetVay)}</div>
                    <span className="badge bg-success-subtle text-success small mt-1">Đã lập hồ sơ</span>
                  </div>
                </div>

                {/* 2. Trưởng Phòng Tín Dụng */}
                <div className="col-6 col-md-3">
                  <div className={`p-2.5 bg-white rounded-3 border h-100 shadow-2xs ${opinionTruongPhong ? 'border-success' : 'border-secondary-subtle'}`}>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="badge bg-secondary-subtle text-secondary small">2. Trưởng Phòng TD</span>
                      {opinionTruongPhong ? <CheckCircle2 size={15} className="text-success" /> : <Clock size={15} className="text-muted" />}
                    </div>
                    <div className="fw-bold text-slate-900 small">{opinionTruongPhong ? opinionTruongPhong.nguoiDanhGia : 'Chờ thẩm tra'}</div>
                    <div className="text-muted text-truncate" style={{ fontSize: '0.68rem' }}>
                      {opinionTruongPhong ? opinionTruongPhong.yKien : 'Đang xử lý'}
                    </div>
                    <span className={`badge small mt-1 ${opinionTruongPhong ? 'bg-success-subtle text-success' : 'bg-light text-muted border'}`}>
                      {opinionTruongPhong ? 'Đã cho ý kiến' : 'Chờ ý kiến'}
                    </span>
                  </div>
                </div>

                {/* 3. Ban Kiểm Soát */}
                <div className="col-6 col-md-3">
                  <div className={`p-2.5 bg-white rounded-3 border h-100 shadow-2xs ${opinionBKS ? 'border-warning' : 'border-secondary-subtle'}`}>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="badge bg-warning text-dark small">3. Ban Kiểm Soát</span>
                      {opinionBKS ? <ShieldCheck size={15} className="text-warning" /> : <Clock size={15} className="text-muted" />}
                    </div>
                    <div className="fw-bold text-slate-900 small">{opinionBKS ? opinionBKS.nguoiDanhGia : 'Chờ giám sát rủi ro'}</div>
                    <div className="text-muted text-truncate" style={{ fontSize: '0.68rem' }}>
                      {opinionBKS ? opinionBKS.yKien : 'Thẩm tra tuân thủ'}
                    </div>
                    <span className={`badge small mt-1 ${opinionBKS ? 'bg-warning-subtle text-dark border border-warning' : 'bg-light text-muted border'}`}>
                      {opinionBKS ? 'Đã thẩm tra' : 'Chờ BKS'}
                    </span>
                  </div>
                </div>

                {/* 4. HĐQT / Ban Giám Đốc */}
                <div className="col-6 col-md-3">
                  <div className={`p-2.5 bg-white rounded-3 border h-100 shadow-2xs ${opinionHDQT ? 'border-danger' : 'border-secondary-subtle'}`}>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="badge bg-danger text-white small">4. HĐQT / BGĐ</span>
                      {opinionHDQT ? <CheckCircle2 size={15} className="text-danger" /> : <Clock size={15} className="text-muted" />}
                    </div>
                    <div className="fw-bold text-slate-900 small">{opinionHDQT ? opinionHDQT.nguoiDanhGia : 'Chờ phê duyệt'}</div>
                    <div className="text-muted text-truncate" style={{ fontSize: '0.68rem' }}>
                      {opinionHDQT ? opinionHDQT.yKien : 'Quyết định cuối'}
                    </div>
                    <span className={`badge small mt-1 ${opinionHDQT ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-light text-muted border'}`}>
                      {opinionHDQT ? 'Đã phê duyệt' : 'Chờ HĐQT'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Banner Chỉ Số Nổi Bật */}
            <div className="row g-2 mb-3">
              <div className="col-6 col-md-3">
                <div className="p-2.5 bg-light rounded-3 border text-center">
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>Hạn mức duyệt vay:</span>
                  <div className="fw-extrabold text-danger fs-6 num-tabular">{formatCurrencyVN(duyetVay)}</div>
                  <span className="text-muted" style={{ fontSize: '0.68rem' }}>{thoiHan} tháng • {laiSuat}%/năm</span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-2.5 bg-light rounded-3 border text-center">
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>Tỷ lệ LTV (Vay/TSĐB):</span>
                  <div className={`fw-extrabold fs-6 ${Number(tyLeLTV) > 75 ? 'text-danger' : Number(tyLeLTV) > 70 ? 'text-warning' : 'text-success'}`}>
                    {tyLeLTV}%
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                    {Number(tyLeLTV) <= 70 ? 'An toàn cao (≤70%)' : Number(tyLeLTV) <= 75 ? 'Hạn mức tối đa' : 'Vượt trần quy định'}
                  </span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-2.5 bg-light rounded-3 border text-center">
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>Tỷ lệ DTI (Nợ/Thu nhập):</span>
                  <div className={`fw-extrabold fs-6 ${Number(tyLeDSR) > 60 ? 'text-danger' : 'text-success'}`}>
                    {tyLeDSR}%
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                    {Number(tyLeDSR) <= 60 ? 'Dòng tiền đạt chuẩn (≤60%)' : 'Rủi ro dòng tiền'}
                  </span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-2.5 bg-light rounded-3 border text-center">
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>Thu Nhập Ròng Thặng Dư:</span>
                  <div className="fw-extrabold text-success fs-6 num-tabular">
                    {formatCurrencyVN(thuNhapRong)}
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                    Nghĩa vụ nợ: {formatCurrencyVN(nghiaVuTraNoThang)}/tháng
                  </span>
                </div>
              </div>
            </div>

            {/* NHÓM 1: PHÁP LÝ KHÁCH HÀNG (TỪ KH_CORE) */}
            <div className="p-3 bg-white rounded-3 border mb-3">
              <h6 className="fw-bold text-primary mb-2 d-flex align-items-center gap-2">
                <User size={18} /> 1. Thông Tin Pháp Lý Khách Hàng (Dữ Liệu Khóa Từ KH_CORE) & Nhu Cầu Vay
              </h6>
              <div className="row g-2">
                <div className="col-md-3 text-center">
                  {appraisal.hinhAnhKH ? (
                    <img
                      src={appraisal.hinhAnhKH}
                      alt="Ảnh khách hàng"
                      className="rounded border object-fit-cover shadow-sm mb-1"
                      style={{ width: '100px', height: '120px' }}
                    />
                  ) : (
                    <div
                      className="rounded border bg-light d-flex flex-column align-items-center justify-content-center text-muted mx-auto mb-1"
                      style={{ width: '100px', height: '120px' }}
                    >
                      <User size={32} className="opacity-50" />
                      <span style={{ fontSize: '0.65rem' }}>Ảnh chân dung</span>
                    </div>
                  )}
                  <span className="small text-muted d-block fw-bold">{appraisal.hoTen}</span>
                  <span className="badge bg-secondary-subtle text-secondary small"><Lock size={10} className="inline me-0.5" /> Core: {appraisal.maKH}</span>
                </div>

                <div className="col-md-9">
                  <div className="row g-2">
                    <div className="col-md-6">
                      <span className="text-muted small d-block">Khách hàng vay:</span>
                      <strong className="text-dark">{appraisal.hoTen}</strong> (Mã: <strong>{appraisal.maKH}</strong>)
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted small d-block">Số CCCD / Ngày cấp:</span>
                      <span className="font-monospace fw-bold">{appraisal.soCCCD}</span> ({formatDateVN(appraisal.ngayCap || '')})
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted small d-block">Số điện thoại / Nơi ở:</span>
                      <span>{appraisal.dienThoai || '---'} • {appraisal.diaChi}</span>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted small d-block">Ngành nghề & Trình độ:</span>
                      <span>{appraisal.nganhNghe || 'Kinh doanh tự do'} • {appraisal.trinhDo || 'Đại học / Cao đẳng'}</span>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted small d-block">Hôn nhân & Người đồng vay:</span>
                      <span>{appraisal.tinhTrangHonNhan || 'Đã kết hôn'} — {appraisal.nguoiDongVay || 'Không có'}</span>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted small d-block">Mục đích vay vốn:</span>
                      <span className="text-primary fw-semibold">{appraisal.mucDichVay}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* NHÓM 2: TÀI SẢN BẢO ĐẢM & ĐẤT ĐA LOẠI */}
            <div className="p-3 bg-white rounded-3 border mb-3">
              <h6 className="fw-bold text-primary mb-2 d-flex align-items-center gap-2">
                <Building2 size={18} /> 2. Tài Sản Bảo Đảm & Chi Tiết Định Giá Từng Loại Đất
              </h6>
              {appraisal.coTSBD === 'Có' ? (
                <>
                  <div className="row g-2 mb-2">
                    <div className="col-md-4">
                      <span className="text-muted small d-block">Loại TSBĐ:</span>
                      <strong>{appraisal.loaiTSBD || 'QSDĐ & Nhà ở'}</strong>
                    </div>
                    <div className="col-md-4">
                      <span className="text-muted small d-block">Số GCN (Sổ đỏ):</span>
                      <span className="font-monospace fw-bold text-primary">{appraisal.soGCN || '---'}</span> (Thửa {appraisal.thuaDatSo}, Tờ BĐ {appraisal.toBanDoSo})
                    </div>
                    <div className="col-md-4">
                      <span className="text-muted small d-block">Nguồn gốc & Chủ sở hữu:</span>
                      <span>{appraisal.nguonGocTSBD || 'Nhận chuyển nhượng'} • {appraisal.chuSoHuuTSBD || appraisal.hoTen}</span>
                    </div>
                    <div className="col-12">
                      <span className="text-muted small d-block">Địa chỉ tài sản & Hiện trạng:</span>
                      <span>{appraisal.diaChiTSBD || appraisal.diaChi} — {appraisal.moTaTSBD}</span>
                    </div>
                  </div>

                  {chiTietDat.length > 0 && (
                    <div className="table-responsive mt-2">
                      <table className="table table-sm table-bordered align-middle mb-1">
                        <thead className="table-light small">
                          <tr>
                            <th>Loại Đất</th>
                            <th className="text-end">Diện Tích (m²)</th>
                            <th className="text-end">Đơn Giá Định Giá (VNĐ/m²)</th>
                            <th className="text-end">Thành Tiền (VNĐ)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chiTietDat.map((d, i) => (
                            <tr key={i}>
                              <td className="small">{d.loaiDat}</td>
                              <td className="text-end num-tabular">{d.dienTich}</td>
                              <td className="text-end num-tabular">{formatCurrencyVN(d.donGia)}</td>
                              <td className="text-end fw-bold num-tabular">{formatCurrencyVN(d.thanhTien)}</td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan="3" className="small fw-semibold">Giá trị công trình xây dựng / Nhà ở trên đất:</td>
                            <td className="text-end fw-bold num-tabular">{formatCurrencyVN(appraisal.giaTriCongTrinh || 0)}</td>
                          </tr>
                          <tr className="table-light fw-bold">
                            <td colSpan="3" className="text-primary text-uppercase small">TỔNG GIÁ TRỊ ĐỊNH GIÁ QTDND:</td>
                            <td className="text-end text-success fs-6 num-tabular">{formatCurrencyVN(giaTriTSBD)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted small">Khoản vay không áp dụng tài sản bảo đảm (Cho vay tín chấp).</div>
              )}
            </div>

            {/* NHÓM 3: NĂNG LỰC TÀI CHÍNH & LỊCH SỬ CIC */}
            <div className="p-3 bg-white rounded-3 border mb-3">
              <h6 className="fw-bold text-primary mb-2 d-flex align-items-center gap-2">
                <DollarSign size={18} /> 3. Năng Lực Tài Chính, Dòng Tiền & Lịch Sử Tín Dụng CIC
              </h6>
              <div className="row g-2">
                <div className="col-md-6">
                  <div className="p-2.5 bg-light rounded-3 border">
                    <span className="fw-bold small text-slate-800 d-block mb-1">Cơ cấu thu nhập hàng tháng:</span>
                    <div className="d-flex justify-content-between small mb-1">
                      <span>• Người vay chính:</span>
                      <span className="fw-bold">{formatCurrencyVN(appraisal.thuNhapNguoiVay || appraisal.thuNhapChinh)}</span>
                    </div>
                    <div className="d-flex justify-content-between small mb-1">
                      <span>• Người đồng vay / Vợ chồng:</span>
                      <span className="fw-bold">{formatCurrencyVN(appraisal.thuNhapDongVay || 0)}</span>
                    </div>
                    <div className="d-flex justify-content-between small border-top pt-1 text-primary fw-bold">
                      <span>TỔNG THU NHẬP:</span>
                      <span>{formatCurrencyVN(thuNhap)}/tháng</span>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-2.5 bg-light rounded-3 border">
                    <span className="fw-bold small text-slate-800 d-block mb-1">Chi phí & Dòng tiền thặng dư:</span>
                    <div className="d-flex justify-content-between small mb-1">
                      <span>• Chi phí sinh hoạt:</span>
                      <span>{formatCurrencyVN(appraisal.chiPhiSinhHoat || 0)}</span>
                    </div>
                    <div className="d-flex justify-content-between small mb-1">
                      <span>• Chi phí SXKD & Khác:</span>
                      <span>{formatCurrencyVN(appraisal.chiPhiSXKD || 0)}</span>
                    </div>
                    <div className="d-flex justify-content-between small border-top pt-1 text-success fw-bold">
                      <span>THU NHẬP RÒNG:</span>
                      <span>{formatCurrencyVN(thuNhapRong)}/tháng</span>
                    </div>
                  </div>
                </div>

                <div className="col-12 mt-2">
                  <div className="p-2 bg-slate-50 rounded-3 border small">
                    <strong>Thông tin CIC:</strong> Nhóm nợ: <span className="badge bg-success-subtle text-success">{appraisal.xepHangCIC || 'Nhóm 1'}</span> • Quan hệ: <strong>{appraisal.soTCTDQuanHe || 1} TCTD</strong> • Dư nợ ngoài: {formatCurrencyVN(appraisal.duNoCICNgoai || 0)} • {appraisal.ghiChuCIC || 'Lịch sử tín dụng tốt'}
                  </div>
                </div>
              </div>
            </div>

            {/* NHÓM 4: ĐỀ XUẤT CẤP TÍN DỤNG & PHƯƠNG ÁN TỐI ƯU */}
            <div className="p-3 bg-white rounded-3 border mb-3">
              <h6 className="fw-bold text-primary mb-2 d-flex align-items-center gap-2">
                <TrendingUp size={18} /> 4. Đề Xuất Cấp Tín Dụng & Đánh Giá Phương Án Tối Ưu
              </h6>
              <div className="row g-2 mb-2">
                <div className="col-md-3">
                  <span className="text-muted small d-block">Số tiền duyệt vay:</span>
                  <strong className="text-danger fs-6">{formatCurrencyVN(duyetVay)}</strong>
                </div>
                <div className="col-md-3">
                  <span className="text-muted small d-block">Thời hạn & Lãi suất:</span>
                  <span><strong>{thoiHan} tháng</strong> • <strong>{laiSuat}%/năm</strong></span>
                </div>
                <div className="col-md-3">
                  <span className="text-muted small d-block">Phương thức trả gốc:</span>
                  <span className="badge bg-primary-subtle text-primary">
                    {appraisal.phuongThucTraGoc === 'HANG_QUY' ? 'Gốc đều hàng quý' : appraisal.phuongThucTraGoc === 'CUOI_KY' ? 'Gốc trả cuối kỳ' : 'Gốc đều hàng tháng'}
                  </span>
                </div>
                <div className="col-md-3">
                  <span className="text-muted small d-block">Nghĩa vụ nợ tháng cao nhất:</span>
                  <strong className="text-dark">{formatCurrencyVN(nghiaVuTraNoThang)}</strong>
                </div>
              </div>

              {appraisal.phuongAnToiUu && (
                <div className="p-2.5 bg-primary-subtle rounded-3 border border-primary-subtle small mb-2">
                  <strong className="text-primary d-flex align-items-center gap-1 mb-1">
                    <Sparkles size={14} /> Nhận định & Khuyến nghị phương án tối ưu:
                  </strong>
                  <span>{appraisal.phuongAnToiUu}</span>
                </div>
              )}

              <div className="p-2 bg-light rounded-3 border small">
                <strong>Điều kiện giải ngân & Chỉ đạo giám sát:</strong> {appraisal.dieuKienGiaiNgan || 'Hoàn tất thủ tục công chứng và đăng ký GDBĐ đầy đủ.'}
              </div>
            </div>

            {/* NHÓM 5: TỔNG HỢP Ý KIẾN PHÊ DUYỆT & CHỈ ĐẠO CÁC CẤP */}
            <div className="p-3 bg-white rounded-3 border">
              <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <div>
                  <h6 className="fw-bold text-primary m-0 d-flex align-items-center gap-2">
                    <MessageSquare size={18} /> 5. Tổng Hợp Ý Kiến Phê Duyệt & Chỉ Đạo Của Các Cấp ({opinions.length})
                  </h6>
                  <span className="text-muted small">
                    CBTD, Ban Kiểm Soát và HĐQT đều xem được toàn diện tiến trình ý kiến này.
                  </span>
                </div>

                <button
                  type="button"
                  className={`btn btn-sm fw-bold d-flex align-items-center gap-1.5 shadow-sm ${
                    isHDQT ? 'btn-danger text-white' : isBKS ? 'btn-warning text-dark' : 'btn-outline-primary'
                  }`}
                  onClick={() => onOpenAddOpinion && onOpenAddOpinion(appraisal)}
                >
                  <FileCheck2 size={15} />
                  {isHDQT ? 'HĐQT Phê Duyệt / Chỉ Đạo' : isBKS ? 'BKS Thẩm Tra Rủi Ro' : '+ Thêm Ý Kiến Đánh Giá'}
                </button>
              </div>

              {opinions.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {opinions.map((op, idx) => (
                    <div key={idx} className="p-3 bg-light rounded-3 border shadow-2xs">
                      <div className="d-flex justify-content-between align-items-center mb-1.5 flex-wrap gap-1">
                        <div>
                          <strong className="text-dark">{op.nguoiDanhGia}</strong>{' '}
                          <span className="badge bg-secondary-subtle text-secondary small ms-1">{op.chucVu}</span>
                          {op.capDuyet && (
                            <span className="badge bg-primary-subtle text-primary small ms-1">Cấp: {op.capDuyet}</span>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge ${
                            op.yKien?.includes('Đồng ý') || op.yKien?.includes('Thống nhất')
                              ? 'bg-success'
                              : op.yKien?.includes('điều kiện') || op.yKien?.includes('trung bình')
                              ? 'bg-warning text-dark'
                              : 'bg-danger'
                          }`}>
                            {op.yKien}
                          </span>
                          <span className="text-muted small" style={{ fontSize: '0.72rem' }}>{op.ngayDanhGia}</span>
                        </div>
                      </div>

                      <p className="small text-slate-700 m-0 mb-1">{op.noiDung}</p>

                      {(op.hanMucDuyet || op.laiSuatDuyet) && (
                        <div className="small text-danger fw-semibold">
                          Hạn mức phê duyệt: {formatCurrencyVN(op.hanMucDuyet)} • Lãi suất: {op.laiSuatDuyet}%/năm
                        </div>
                      )}

                      {op.dieuKienBoSung && (
                        <div className="small text-warning-emphasis bg-warning-subtle p-1.5 rounded border border-warning-subtle mt-1">
                          <strong>Lưu ý / Điều kiện chỉ đạo:</strong> {op.dieuKienBoSung}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-muted small bg-light rounded-3 border">
                  Chưa có ý kiến phê duyệt nào được ghi nhận. Bấm nút phía trên để thêm ý kiến hoặc phê duyệt.
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer border-top pt-3 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-1.5 text-white"
              onClick={() => onOpenPrintPreview && onOpenPrintPreview(appraisal)}
            >
              <Printer size={15} /> In / Xuất Hồ Sơ Thẩm Định (A4 & Word)
            </button>

            <div className="d-flex gap-2">
              <button
                type="button"
                className={`btn btn-sm fw-semibold ${
                  isHDQT ? 'btn-danger text-white' : isBKS ? 'btn-warning text-dark' : 'btn-primary'
                }`}
                onClick={() => onOpenAddOpinion && onOpenAddOpinion(appraisal)}
              >
                {isHDQT ? 'Phê Duyệt Tín Dụng (HĐQT)' : isBKS ? 'Thẩm Tra (BKS)' : 'Ghi Nhận Ý Kiến'}
              </button>

              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
