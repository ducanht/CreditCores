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
  Percent
} from 'lucide-react';
import { formatCurrencyVN, formatDateVN } from '../../utils/dateUtils';

export default function AppraisalDetailModal({ appraisal, onClose, onOpenAddOpinion }) {
  if (!appraisal) return null;

  const deXuatVay = Number(appraisal.deXuatVay) || 0;
  const duyetVay = Number(appraisal.duyetVay) || 0;
  const thuNhap = Number(appraisal.tongThuNhapThang || appraisal.thuNhapThang) || 0;
  const chiPhi = Number(appraisal.tongChiPhiThang || appraisal.chiPhiThang) || 0;
  const thangDu = thuNhap - chiPhi;
  const giaTriTSBD = Number(appraisal.giaTriTSBD) || 0;
  const tyLeLTV = giaTriTSBD > 0 ? ((duyetVay / giaTriTSBD) * 100).toFixed(1) : (appraisal.tyLeLTV || 0);

  const thoiHan = Number(appraisal.thoiHanThang) || 12;
  const laiSuat = Number(appraisal.laiSuatDuyet) || 0;
  const gocThang = thoiHan > 0 ? duyetVay / thoiHan : 0;
  const laiThang = (duyetVay * (laiSuat / 100)) / 12;
  const nghiaVuTraNoThang = Number(appraisal.nghiaVuTraNoThang) || (gocThang + laiThang);
  const tyLeDSR = thuNhap > 0 ? ((nghiaVuTraNoThang / thuNhap) * 100).toFixed(1) : (appraisal.tyLeDSR || 0);
  const heSoBuDap = nghiaVuTraNoThang > 0 ? (thangDu / nghiaVuTraNoThang).toFixed(2) : (appraisal.heSoBuDap || '0.00');

  const opinions = appraisal.danhSachYKien || [];
  const agreeCount = opinions.filter((y) => y.yKien === 'Đồng ý').length;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
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
                  Ngày lập: {appraisal.ngayLap || 'Hôm nay'}
                </span>
                <span className="badge bg-secondary-subtle text-secondary small">
                  Rủi ro: {appraisal.mucDoRuiRo || 'Thấp'}
                </span>
              </div>
              <h4 className="fw-extrabold text-slate-900 font-heading m-0">
                Báo Cáo Thẩm Định Tín Dụng & Định Giá TSĐB (5 Nhóm Nghiệp Vụ)
              </h4>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body py-3">
            {/* ========================================================================= */}
            {/* BANNER CHỈ SỐ TÀI CHÍNH TỔNG HỢP                                          */}
            {/* ========================================================================= */}
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
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>Tỷ lệ DSR (Nợ/Thu nhập):</span>
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
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>Hệ số bù đắp dòng tiền:</span>
                  <div className={`fw-extrabold fs-6 ${Number(heSoBuDap) >= 1.2 ? 'text-success' : 'text-danger'}`}>
                    {heSoBuDap}x
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                    {Number(heSoBuDap) >= 1.2 ? 'Đảm bảo trả nợ (≥1.2x)' : 'Cần theo dõi'}
                  </span>
                </div>
              </div>
            </div>

            <div className="row g-3">
              {/* ========================================================================= */}
              {/* NHÓM 1: THÔNG TIN PHÁP LÝ & NHU CẦU VAY VỐN                               */}
              {/* ========================================================================= */}
              <div className="col-12 col-lg-6">
                <div className="p-3 bg-light rounded-3 border h-100">
                  <h6 className="fw-bold text-primary small mb-2.5 d-flex align-items-center gap-1.5 border-bottom pb-1.5">
                    <User size={15} /> 1. Thông Tin Pháp Lý & Nhu Cầu Vốn
                  </h6>

                  <div className="row g-2 small">
                    <div className="col-6">
                      <span className="text-muted">Khách hàng vay:</span>
                      <div className="fw-bold text-dark fs-6">{appraisal.hoTen}</div>
                      <span className="font-monospace text-primary">{appraisal.maKH}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Số CCCD / CMND:</span>
                      <div className="fw-bold font-monospace text-dark">{appraisal.soCCCD || 'Chưa cập nhật'}</div>
                      <span className="text-muted">{appraisal.gioiTinh || 'Nam'} • {appraisal.ngaySinh || '1985'}</span>
                    </div>

                    <div className="col-6">
                      <span className="text-muted">Số điện thoại:</span>
                      <div className="fw-semibold text-dark">{appraisal.dienThoai || '0912345678'}</div>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Tình trạng hôn nhân:</span>
                      <div className="fw-semibold text-dark">{appraisal.tinhTrangHonNhan || 'Đã kết hôn'}</div>
                    </div>

                    <div className="col-12">
                      <span className="text-muted">Địa chỉ thường trú / Cư trú:</span>
                      <div className="fw-semibold text-dark">{appraisal.diaChi || 'Xã Yên Thọ, Ý Yên, Nam Định'}</div>
                    </div>

                    <div className="col-12">
                      <span className="text-muted">Người đồng vay / Vợ chồng / Bảo lãnh:</span>
                      <div className="fw-semibold text-secondary">{appraisal.nguoiDongVay || 'Không có'}</div>
                    </div>

                    <div className="col-6 mt-1">
                      <span className="text-muted">Số tiền xin vay:</span>
                      <div className="fw-bold text-primary fs-6 num-tabular">{formatCurrencyVN(deXuatVay)}</div>
                    </div>
                    <div className="col-6 mt-1">
                      <span className="text-muted">Thời hạn & Phương thức trả:</span>
                      <div className="fw-semibold text-dark">{appraisal.thoiHanVay || thoiHan} tháng</div>
                    </div>

                    <div className="col-12">
                      <span className="text-muted">Mục đích vay vốn:</span>
                      <p className="m-0 text-dark mt-0.5 bg-white p-2 rounded border" style={{ fontSize: '0.78rem' }}>
                        {appraisal.mucDichVay || 'Đầu tư mở rộng sản xuất kinh doanh và bổ sung vốn lưu động.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* NHÓM 2: THÔNG TIN VỀ TÀI SẢN BẢO ĐẢM (TSBĐ)                               */}
              {/* ========================================================================= */}
              <div className="col-12 col-lg-6">
                <div className="p-3 bg-light rounded-3 border h-100">
                  <h6 className="fw-bold text-primary small mb-2.5 d-flex align-items-center gap-1.5 border-bottom pb-1.5">
                    <Building2 size={15} /> 2. Thông Tin Tài Sản Bảo Đảm (TSBĐ)
                  </h6>

                  {appraisal.coTSBD === 'Không' ? (
                    <div className="text-center py-4 bg-white rounded border">
                      <ShieldCheck size={28} className="text-success mb-1" />
                      <h6 className="fw-bold text-dark m-0">Khoản Vay Tín Chấp</h6>
                      <p className="small text-muted m-0">Không yêu cầu tài sản thế chấp.</p>
                    </div>
                  ) : (
                    <div className="row g-2 small">
                      <div className="col-6">
                        <span className="text-muted">Hình thức bảo đảm:</span>
                        <div className="fw-bold text-dark">{appraisal.hinhThucBaoDam || 'Thế chấp QSDĐ (Sổ đỏ)'}</div>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Số GCN / Số Sổ đỏ:</span>
                        <div className="fw-bold font-monospace text-primary">{appraisal.soGCN || 'CH 892341'}</div>
                      </div>

                      <div className="col-4">
                        <span className="text-muted">Thửa đất số:</span>
                        <div className="fw-semibold text-dark">{appraisal.thuaDatSo || '112'}</div>
                      </div>
                      <div className="col-4">
                        <span className="text-muted">Tờ bản đồ:</span>
                        <div className="fw-semibold text-dark">{appraisal.toBanDoSo || '08'}</div>
                      </div>
                      <div className="col-4">
                        <span className="text-muted">Diện tích:</span>
                        <div className="fw-semibold text-dark">{appraisal.dienTich || 250} m²</div>
                      </div>

                      <div className="col-12">
                        <span className="text-muted">Địa chỉ tài sản:</span>
                        <div className="fw-semibold text-dark">{appraisal.diaChiTSBD || appraisal.diaChi}</div>
                      </div>

                      <div className="col-6">
                        <span className="text-muted">Chủ sở hữu:</span>
                        <div className="fw-semibold text-dark">{appraisal.chuSoHuuTSBD || appraisal.hoTen}</div>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Quan hệ với người vay:</span>
                        <div className="fw-semibold text-dark">{appraisal.quanHeVoiNguoiVay || 'Chính chủ'}</div>
                      </div>

                      <div className="col-6 mt-1">
                        <span className="text-muted">Giá trị định giá QTD:</span>
                        <div className="fw-bold text-success fs-6 num-tabular">{formatCurrencyVN(giaTriTSBD)}</div>
                      </div>
                      <div className="col-6 mt-1">
                        <span className="text-muted">Tỷ lệ LTV:</span>
                        <div>
                          <span className={`badge ${Number(tyLeLTV) > 75 ? 'bg-danger' : Number(tyLeLTV) > 70 ? 'bg-warning text-dark' : 'bg-success'}`}>
                            {tyLeLTV}%
                          </span>
                        </div>
                      </div>

                      <div className="col-12">
                        <span className="text-muted">Mô tả hiện trạng & Pháp lý TSĐB:</span>
                        <p className="m-0 text-dark mt-0.5 bg-white p-2 rounded border" style={{ fontSize: '0.78rem' }}>
                          {appraisal.moTaTSBD || 'Tài sản có sổ đỏ hợp pháp, không tranh chấp, đường giao thông thuận lợi.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* NHÓM 3: THU THẬP THỰC ĐỊA, DÒNG TIỀN & CIC                                 */}
              {/* ========================================================================= */}
              <div className="col-12 col-lg-6">
                <div className="p-3 bg-light rounded-3 border h-100">
                  <h6 className="fw-bold text-primary small mb-2.5 d-flex align-items-center gap-1.5 border-bottom pb-1.5">
                    <TrendingUp size={15} /> 3. Thu Thập Thực Địa, Dòng Tiền & CIC
                  </h6>

                  <div className="row g-2 small">
                    <div className="col-6">
                      <span className="text-muted">Thu nhập chính/tháng:</span>
                      <div className="fw-bold text-success num-tabular">{formatCurrencyVN(appraisal.thuNhapChinh || thuNhap)}</div>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Thu nhập phụ/tháng:</span>
                      <div className="fw-bold text-success num-tabular">{formatCurrencyVN(appraisal.thuNhapPhu || 0)}</div>
                    </div>

                    <div className="col-6">
                      <span className="text-muted">Chi phí sinh hoạt:</span>
                      <div className="fw-bold text-danger num-tabular">{formatCurrencyVN(appraisal.chiPhiSinhHoat || (chiPhi * 0.7))}</div>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Chi phí SXKD:</span>
                      <div className="fw-bold text-danger num-tabular">{formatCurrencyVN(appraisal.chiPhiSXKD || (chiPhi * 0.3))}</div>
                    </div>

                    <div className="col-12">
                      <div className="p-2 rounded bg-white border d-flex justify-content-between align-items-center">
                        <span className="text-muted">Thặng dư tích lũy hàng tháng:</span>
                        <span className={`fw-bold fs-6 num-tabular ${thangDu >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatCurrencyVN(thangDu)}
                        </span>
                      </div>
                    </div>

                    <div className="col-6 mt-1">
                      <span className="text-muted">Xếp hạng CIC:</span>
                      <div>
                        <span className="badge bg-success-subtle text-success fw-bold px-2 py-0.5">
                          {appraisal.xepHangCIC || 'Nhóm 1 (Tốt)'}
                        </span>
                      </div>
                    </div>
                    <div className="col-6 mt-1">
                      <span className="text-muted">Số TCTD quan hệ & Dư nợ ngoài:</span>
                      <div className="fw-semibold text-dark">{appraisal.soTCTDQuanHe || 1} TCTD • {formatCurrencyVN(appraisal.duNoCICNgoai || 0)}</div>
                    </div>

                    <div className="col-12">
                      <span className="text-muted">Đánh giá thực địa & Tư cách khách hàng:</span>
                      <p className="m-0 text-dark mt-0.5 bg-white p-2 rounded border" style={{ fontSize: '0.78rem' }}>
                        {appraisal.hienTrangSXKD || 'Khách hàng có cơ sở sản xuất kinh doanh hoạt động ổn định, đạo đức tốt và uy tín cao.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* NHÓM 4: ĐỀ XUẤT CỦA CBTD & CHỈ SỐ TÀI CHÍNH                               */}
              {/* ========================================================================= */}
              <div className="col-12 col-lg-6">
                <div className="p-3 bg-light rounded-3 border h-100">
                  <h6 className="fw-bold text-primary small mb-2.5 d-flex align-items-center gap-1.5 border-bottom pb-1.5">
                    <Calculator size={15} /> 4. Đề Xuất Của CBTD & Chỉ Số Tài Chính
                  </h6>

                  <div className="row g-2 small">
                    <div className="col-6">
                      <span className="text-muted">Số tiền đề xuất duyệt:</span>
                      <div className="fw-bold text-danger fs-6 num-tabular">{formatCurrencyVN(duyetVay)}</div>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Thời hạn & Lãi suất duyệt:</span>
                      <div className="fw-bold text-dark">{thoiHan} tháng • {laiSuat}%/năm</div>
                    </div>

                    <div className="col-6">
                      <span className="text-muted">Phương thức giải ngân:</span>
                      <div className="fw-semibold text-dark">{appraisal.phuongThucGiaiNgan || 'Tài khoản CASA'}</div>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Nghĩa vụ trả nợ ước tính/tháng:</span>
                      <div className="fw-bold text-danger num-tabular">{formatCurrencyVN(Math.round(nghiaVuTraNoThang))}</div>
                    </div>

                    <div className="col-12">
                      <span className="text-muted">Biện pháp bảo đảm & Quản lý rủi ro:</span>
                      <div className="fw-semibold text-dark">{appraisal.bienPhapBaoDam || 'Thế chấp QSDĐ, công chứng đăng ký GDBĐ đầy đủ.'}</div>
                    </div>

                    <div className="col-12">
                      <span className="text-muted">Điều kiện tiên quyết trước giải ngân:</span>
                      <p className="m-0 text-dark mt-0.5 bg-white p-2 rounded border" style={{ fontSize: '0.78rem' }}>
                        {appraisal.dieuKienGiaiNgan || 'Hoàn tất công chứng hợp đồng thế chấp và nhận kết quả đăng ký giao dịch bảo đảm.'}
                      </p>
                    </div>

                    <div className="col-12">
                      <span className="text-muted">Cán bộ thẩm định lập báo cáo:</span>
                      <div className="fw-bold text-primary">{appraisal.canBoThamDinh || 'Lê Văn Tín'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* NHÓM 5: Ý KIẾN PHÊ DUYỆT ĐA CẤP & KẾT LUẬN                                 */}
              {/* ========================================================================= */}
              <div className="col-12">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <h6 className="fw-bold text-primary small m-0 d-flex align-items-center gap-1.5">
                      <MessageSquare size={15} /> 5. Lịch Sử Ý Kiến Phê Duyệt Đa Cấp ({opinions.length} ý kiến, {agreeCount} đồng ý)
                    </h6>
                    {onOpenAddOpinion && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary fw-semibold py-0.5 px-2"
                        onClick={() => onOpenAddOpinion(appraisal)}
                      >
                        + Bổ sung ý kiến đánh giá
                      </button>
                    )}
                  </div>

                  {opinions.length > 0 ? (
                    <div className="d-flex flex-column gap-2 mt-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
                      {opinions.map((yk, idx) => (
                        <div key={idx} className="p-2.5 bg-white rounded-3 border small">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <strong className="text-dark">
                              {yk.nguoiDanhGia} ({yk.chucVu})
                            </strong>
                            <span className={`badge ${yk.yKien === 'Đồng ý' ? 'bg-success' : 'bg-danger'}`}>
                              {yk.yKien}
                            </span>
                          </div>
                          <p className="m-0 text-secondary">{yk.noiDung}</p>
                          <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                            {yk.ngayDanhGia || 'Hôm nay'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-3 bg-white rounded border small">
                      Chưa có ý kiến phê duyệt nào được ghi nhận cho hồ sơ thẩm định này.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer border-0 pt-1 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
              onClick={() => window.print()}
            >
              <Printer size={14} /> In Báo Cáo Thẩm Định
            </button>
            <button type="button" className="btn btn-light btn-sm px-4" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
