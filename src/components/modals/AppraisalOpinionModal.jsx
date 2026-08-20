import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  Building2,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  FileCheck2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import ThousandInput from '../ThousandInput';
import { formatCurrencyVN, formatDateTimeVN, formatDateVN } from '../../utils/dateUtils';

export default function AppraisalOpinionModal({ appraisal, onClose, onSubmit, currentUser }) {
  if (!appraisal) return null;

  const isHDQT = currentUser?.role === 'LANHDAO' || currentUser?.role === 'ADMIN';
  const isBKS = currentUser?.role === 'BKS';
  const isCBTD = currentUser?.role === 'CBTD';

  const defaultRoleTitle = isHDQT
    ? 'Hội Đồng Quản Trị / Ban Giám Đốc'
    : isBKS
    ? 'Ban Kiểm Soát (Thẩm Tra & Giám Sát Rủi Ro)'
    : currentUser?.role === 'KETOAN'
    ? 'Kế Toán Trưởng / Kế Toán Viên'
    : 'Trưởng Phòng Tín Dụng / CBTD';

  const defaultDecision = isHDQT
    ? 'Đồng ý phê duyệt cấp tín dụng'
    : isBKS
    ? 'Thống nhất đề xuất (Đủ điều kiện, Rủi ro thấp)'
    : 'Thống nhất trình cấp thẩm quyền';

  const [opinionData, setOpinionData] = useState({
    nguoiDanhGia: currentUser?.fullName || 'Lê Văn Tín (CBTD)',
    chucVu: defaultRoleTitle,
    capDuyet: isHDQT ? 'HDQT' : isBKS ? 'BKS' : 'TRUONG_PHONG',
    yKien: defaultDecision,
    hanMucDuyet: Number(appraisal.duyetVay || appraisal.deXuatVay) || 0,
    laiSuatDuyet: Number(appraisal.laiSuatDuyet || appraisal.laiSuatDeNghi) || 9.5,
    dieuKienBoSung: '',
    noiDung: isHDQT
      ? 'HĐQT thống nhất phê duyệt cấp tín dụng cho khách hàng theo đúng hạn mức và điều kiện đề xuất.'
      : isBKS
      ? 'Hồ sơ pháp lý hợp lệ, tài sản đảm bảo đủ điều kiện thế chấp, thu nhập và dòng tiền thặng dư đảm bảo khả năng trả nợ.'
      : 'Hồ sơ đầy đủ, phương án vay vốn khả thi, kính trình HĐQT và Ban Giám đốc xem xét phê duyệt.'
  });

  const duyetVay = Number(appraisal.duyetVay || appraisal.deXuatVay) || 0;
  const thoiHan = Number(appraisal.thoiHanThang || appraisal.thoiHanVay) || 12;
  const laiSuat = Number(appraisal.laiSuatDuyet || appraisal.laiSuatDeNghi) || 0;
  const thuNhapRong = Number(appraisal.thuNhapRong || appraisal.thangDuThang) || 0;
  const giaTriTSBD = Number(appraisal.giaTriTSBD) || 0;
  const tyLeLTV = appraisal.tyLeLTV || (giaTriTSBD > 0 ? ((duyetVay / giaTriTSBD) * 100).toFixed(1) : '0.0');
  const tyLeDSR = appraisal.tyLeDSR || '0.0';

  const opinions = appraisal.danhSachYKien || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!opinionData.nguoiDanhGia || !opinionData.noiDung) {
      alert('Vui lòng nhập đầy đủ họ tên người đánh giá và nội dung ý kiến.');
      return;
    }

    const payload = {
      ...opinionData,
      updateKetLuan: isHDQT,
      ngayDanhGia: new Date().toLocaleString('vi-VN')
    };

    onSubmit(appraisal.maBCTD, payload);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1070 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-3 p-md-4">
          {/* Header */}
          <div className="modal-header border-0 pb-1 d-flex justify-content-between align-items-center">
            <div className="flex-grow-1 me-2">
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <span className="badge bg-primary-subtle text-primary font-monospace">
                  {appraisal.maBCTD}
                </span>
                <span className="badge bg-light text-muted border small d-none d-sm-inline">
                  KH: <strong>{appraisal.hoTen}</strong>
                </span>
                <span className={`badge ${isHDQT ? 'bg-danger text-white' : isBKS ? 'bg-warning text-dark' : 'bg-info text-white'}`}>
                  {isHDQT ? 'Phê duyệt HĐQT' : isBKS ? 'Thẩm tra BKS' : 'Ý kiến Trưởng Phòng'}
                </span>
              </div>
              <h5 className="modal-title fw-bold text-slate-900 font-heading m-0">
                {isHDQT ? 'Phê Duyệt Tín Dụng — HĐQT' : isBKS ? 'Ý Kiến Thẩm Tra — BKS' : 'Ghi Nhận Ý Kiến Phê Duyệt'}
              </h5>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          {/* Loan Summary Badge */}
          <div className="p-2 bg-slate-50 rounded-3 border my-2">
            <div className="row g-2 text-center small">
              <div className="col-6 col-md-3">
                <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Duyệt vay:</span>
                <strong className="text-danger num-tabular">{formatCurrencyVN(duyetVay)}</strong>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Thời hạn / Lãi suất:</span>
                <strong>{thoiHan} th&aacute;ng &bull; {laiSuat}%</strong>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>LTV / DTI:</span>
                <strong className="text-primary">{tyLeLTV}% &bull; {tyLeDSR}%</strong>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Thu nhập ròng:</span>
                <strong className="text-success num-tabular">{formatCurrencyVN(thuNhapRong)}/th&aacute;ng</strong>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body py-2">
              {/* Lịch sử các ý kiến đã có (Timeline chuỗi phê duyệt) */}
              {opinions.length > 0 && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1.5">
                    <span className="fw-bold text-slate-800 small d-flex align-items-center gap-1">
                      <MessageSquare size={14} className="text-primary" /> Tổng Hợp Ý Kiến Đã Ghi Nhận Trước Đó ({opinions.length}):
                    </span>
                  </div>
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: 180, overflowY: 'auto' }}>
                    {opinions.map((yk, idx) => (
                      <div key={idx} className="p-2.5 bg-white rounded-3 border shadow-2xs small">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div>
                            <strong className="text-slate-900">{yk.nguoiDanhGia}</strong>{' '}
                            <span className="badge bg-secondary-subtle text-secondary">{yk.chucVu}</span>
                          </div>
                          <div className="d-flex align-items-center gap-1.5">
                            <span className={`badge ${
                              yk.yKien?.includes('Đồng ý') || yk.yKien?.includes('Thống nhất')
                                ? 'bg-success'
                                : yk.yKien?.includes('điều kiện') || yk.yKien?.includes('trung bình')
                                ? 'bg-warning text-dark'
                                : 'bg-danger'
                            }`}>
                              {yk.yKien}
                            </span>
                            <span className="text-muted" style={{ fontSize: '0.68rem' }}>{yk.ngayDanhGia}</span>
                          </div>
                        </div>
                        <p className="m-0 text-slate-700">{yk.noiDung}</p>
                        {yk.dieuKienBoSung && (
                          <div className="mt-1 pt-1 border-top text-danger small">
                            <strong>Lưu ý / Điều kiện:</strong> {yk.dieuKienBoSung}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form bổ sung ý kiến mới theo Role */}
              <div className="p-3 bg-light rounded-3 border">
                <h6 className="fw-bold text-primary small mb-2 d-flex align-items-center gap-1.5">
                  <ShieldCheck size={16} /> Ý Kiến & Quyết Định Của Bạn:
                </h6>

                <div className="row g-2">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-slate-700">Họ và Tên Người Đánh Giá (*)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm fw-bold"
                      value={opinionData.nguoiDanhGia}
                      onChange={(e) => setOpinionData({ ...opinionData, nguoiDanhGia: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-slate-700">Chức Vụ / Bộ Phận</label>
                    <select
                      className="form-select form-select-sm fw-semibold"
                      value={opinionData.chucVu}
                      onChange={(e) => setOpinionData({ ...opinionData, chucVu: e.target.value })}
                    >
                      <option value="Hội Đồng Quản Trị / Ban Giám Đốc">1. Hội Đồng Quản Trị / Ban Giám Đốc</option>
                      <option value="Ban Kiểm Soát (Thẩm Tra & Giám Sát Rủi Ro)">2. Ban Kiểm Soát</option>
                      <option value="Tổ Trưởng / Trưởng Phòng Tín Dụng">3. Tổ Trưởng / Trưởng Phòng Tín Dụng</option>
                      <option value="Cán Bộ Tín Dụng">4. Cán Bộ Tín Dụng</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold text-slate-700">Quyết Định / Ý Kiến Phê Duyệt (*)</label>
                    {isHDQT ? (
                      <select
                        className="form-select form-select-sm fw-bold text-primary"
                        value={opinionData.yKien}
                        onChange={(e) => setOpinionData({ ...opinionData, yKien: e.target.value })}
                      >
                        <option value="Đồng ý phê duyệt cấp tín dụng">✔ 1. Đồng ý phê duyệt cấp tín dụng</option>
                        <option value="Đồng ý có điều kiện bổ sung">⚠ 2. Đồng ý nhưng có điều kiện bổ sung</option>
                        <option value="Yêu cầu bổ sung hồ sơ / Thẩm định lại">🔄 3. Yêu cầu CBTD thẩm định lại / Bổ sung hồ sơ</option>
                        <option value="Từ chối cấp tín dụng">✖ 4. Từ chối cấp tín dụng</option>
                      </select>
                    ) : isBKS ? (
                      <select
                        className="form-select form-select-sm fw-bold text-primary"
                        value={opinionData.yKien}
                        onChange={(e) => setOpinionData({ ...opinionData, yKien: e.target.value })}
                      >
                        <option value="Thống nhất đề xuất (Đủ điều kiện, Rủi ro thấp)">✔ 1. Thống nhất đề xuất (Đủ điều kiện, Rủi ro thấp)</option>
                        <option value="Kiến nghị giám sát rủi ro (Rủi ro trung bình)">⚠ 2. Kiến nghị giám sát rủi ro chặt chẽ (Rủi ro trung bình)</option>
                        <option value="Cảnh báo rủi ro cao / Đề nghị HĐQT xem xét kỹ">🚨 3. Cảnh báo rủi ro cao / Đề nghị HĐQT xem xét kỹ</option>
                        <option value="Không thống nhất cho vay">✖ 4. Không thống nhất cho vay</option>
                      </select>
                    ) : (
                      <select
                        className="form-select form-select-sm fw-bold text-primary"
                        value={opinionData.yKien}
                        onChange={(e) => setOpinionData({ ...opinionData, yKien: e.target.value })}
                      >
                        <option value="Thống nhất trình cấp thẩm quyền">✔ 1. Thống nhất trình HĐQT & Ban Giám đốc</option>
                        <option value="Yêu cầu CBTD bổ sung / Thẩm định lại">🔄 2. Yêu cầu CBTD bổ sung / Thẩm định lại</option>
                        <option value="Không thống nhất">✖ 3. Không thống nhất</option>
                      </select>
                    )}
                  </div>

                  {isHDQT && (
                    <>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-slate-700">Hạn Mức Phê Duyệt Cuối Cùng (VNĐ)</label>
                        <ThousandInput
                          className="form-control form-control-sm fw-bold text-danger"
                          value={opinionData.hanMucDuyet}
                          onChange={(val) => setOpinionData({ ...opinionData, hanMucDuyet: val })}
                          placeholder="200,000,000"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-slate-700">Lãi Suất Phê Duyệt (%/năm)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control form-control-sm fw-bold text-success"
                          value={opinionData.laiSuatDuyet}
                          onChange={(e) => setOpinionData({ ...opinionData, laiSuatDuyet: Number(e.target.value) })}
                        />
                      </div>
                    </>
                  )}

                  <div className="col-12">
                    <label className="form-label small fw-bold text-slate-700">
                      Điều Kiện Bổ Sung / Lưu Ý Chỉ Đạo Giám Sát (nếu có)
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={opinionData.dieuKienBoSung}
                      onChange={(e) => setOpinionData({ ...opinionData, dieuKienBoSung: e.target.value })}
                      placeholder="Yêu cầu ký bổ sung người đồng vay, kiểm tra hiện trạng sau giải ngân 15 ngày..."
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold text-slate-700">Nội Dung Đánh Giá / Nhận Xét Chi Tiết (*)</label>
                    <textarea
                      rows={3}
                      className="form-control form-control-sm"
                      value={opinionData.noiDung}
                      onChange={(e) => setOpinionData({ ...opinionData, noiDung: e.target.value })}
                      placeholder="Nhập nội dung nhận xét chi tiết..."
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 pt-2 pb-0 px-0 d-flex justify-content-between">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Hủy Bỏ
              </button>
              <button type="submit" className="btn btn-success btn-sm fw-bold px-3">
                <FileCheck2 size={16} className="me-1 inline" /> Xác Nhận & Ghi Nhận Ý Kiến Phê Duyệt
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
