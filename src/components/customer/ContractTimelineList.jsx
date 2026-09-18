import React, { useState } from 'react';
import {
  Landmark,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  UserCog,
  Calendar,
  Layers,
  Zap,
  ArrowRight,
  Calculator,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { formatCurrencyVN, formatDateVN } from '../../utils/dateUtils';
import { getLoaiHDInfo } from '../../utils/contractUtils';

// Helper tính số ngày và phần trăm thời hạn vay đã qua
const calculateLoanTimeline = (ngayVayStr, denHanStr) => {
  if (!ngayVayStr || !denHanStr) {
    return { percent: 0, daysLeft: null, isPastDue: false, isUrgent: false };
  }

  // Parse định dạng dd/mm/yyyy hoặc yyyy-mm-dd
  const parseDate = (dStr) => {
    if (typeof dStr !== 'string') return new Date(dStr);
    if (dStr.includes('/')) {
      const [d, m, y] = dStr.split('/').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(dStr);
  };

  const start = parseDate(ngayVayStr).getTime();
  const end = parseDate(denHanStr).getTime();
  const now = new Date().getTime();

  if (isNaN(start) || isNaN(end) || end <= start) {
    return { percent: 50, daysLeft: null, isPastDue: false, isUrgent: false };
  }

  const totalDuration = end - start;
  const elapsed = Math.max(0, now - start);
  const percent = Math.min(100, Math.round((elapsed / totalDuration) * 100));

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.round((end - now) / msPerDay);
  const isPastDue = daysLeft < 0;
  const isUrgent = daysLeft >= 0 && daysLeft <= 30;

  return { percent, daysLeft, isPastDue, isUrgent };
};

export default function ContractTimelineList({
  contracts = [],
  customer = null,
  onNavigateToInspection,
  onNavigateToDebit,
  onOpenAssignModal
}) {
  const [expandedSchedules, setExpandedSchedules] = useState({});

  const toggleSchedule = (soHDTD) => {
    setExpandedSchedules((prev) => ({
      ...prev,
      [soHDTD]: !prev[soHDTD]
    }));
  };

  if (!contracts || contracts.length === 0) {
    return (
      <div className="card-modern p-4 text-center text-muted">
        <Landmark size={36} className="mb-2 opacity-25" />
        <div>Khách hàng này hiện không có khế ước tín dụng nào phù hợp với bộ lọc.</div>
      </div>
    );
  }

  return (
    <div className="card-modern p-4 content-fade-in shadow-sm border-0">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h5 className="fw-bold m-0 text-slate-900 font-heading d-flex align-items-center gap-2">
            <Landmark size={20} className="text-primary" />
            Hồ Sơ Tiến Độ Hợp Đồng & Khế Ước Tín Dụng ({contracts.length})
          </h5>
          <span className="small text-muted">
            Trực quan hóa thời hạn vay, dư nợ gốc và tiến độ thanh toán theo TT 14/2017/TT-NHNN
          </span>
        </div>

        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 font-monospace">
          {contracts.filter((c) => c.trangThaiHD === 'DANG_VAY' || Number(c.duNo) > 0).length} Đang vay •{' '}
          {contracts.filter((c) => c.trangThaiHD === 'DA_TAT_TOAN' || Number(c.duNo) === 0).length} Đã tất toán
        </span>
      </div>

      <div className="d-flex flex-column gap-3">
        {contracts.map((c) => {
          const isSettled = c.trangThaiHD === 'DA_TAT_TOAN' || Number(c.duNo || 0) === 0;
          const timeline = calculateLoanTimeline(c.ngayVay, c.denHan);
          const isScheduleOpen = !!expandedSchedules[c.soHDTD];

          // Tính toán lãi dự kiến
          const rate = Number(c.laiSuat) || 10.46;
          const duNo = Number(c.duNo) || 0;
          const monthlyEstInterest = Math.round((duNo * (rate / 100)) / 12);
          const dailyActualInterest = Math.round((duNo * (rate / 100)) / 365);
          const thirtyDayInterest = Math.round((duNo * rate * 30) / 36500);

          let barColor = '#10b981'; // Xanh lá
          let statusBadgeClass = 'bg-success-subtle text-success border border-success-subtle';
          let deadlineText = `Còn ${timeline.daysLeft} ngày`;

          if (isSettled) {
            barColor = '#94a3b8';
            statusBadgeClass = 'bg-secondary-subtle text-secondary border';
            deadlineText = 'Đã tất toán';
          } else if (timeline.isPastDue) {
            barColor = '#ef4444'; // Đỏ
            statusBadgeClass = 'bg-danger-subtle text-danger border border-danger-subtle';
            deadlineText = `Quá hạn ${Math.abs(timeline.daysLeft)} ngày`;
          } else if (timeline.isUrgent) {
            barColor = '#f59e0b'; // Vàng cam
            statusBadgeClass = 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
            deadlineText = `Sắp đến hạn (còn ${timeline.daysLeft} ngày)`;
          }

          const loaiHDInfo = getLoaiHDInfo(c.maLoaiHD);

          return (
            <div
              key={c.soHDTD}
              className={`p-3.5 rounded-3 border transition-all ${
                isSettled ? 'bg-light-subtle opacity-75' : 'bg-white shadow-xs hover-shadow'
              }`}
              style={{
                borderLeft: `4px solid ${barColor}`
              }}
            >
              {/* HÀNG 1: SỐ HỢP ĐỒNG, TRẠNG THÁI, HÌNH THỨC BẢO ĐẢM & CBTD */}
              <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="fw-bold font-monospace text-primary fs-6">
                    {c.soHDTD}
                  </span>
                  <span className={`badge small px-2 py-0.5 fw-semibold ${statusBadgeClass}`}>
                    {isSettled ? (
                      <>
                        <CheckCircle2 size={12} className="me-1 inline" /> ĐÃ TẤT TOÁN
                      </>
                    ) : (
                      <>
                        <Clock size={12} className="me-1 inline" /> ĐANG VAY
                      </>
                    )}
                  </span>
                  {/* Badge Phân Loại Hợp Đồng & Hình Thức Bảo Đảm */}
                  <span 
                    className={`badge small px-2 py-0.5 fw-medium ${loaiHDInfo.badgeClass}`}
                    title={`Mã loại HĐ: ${loaiHDInfo.code} - ${loaiHDInfo.label}`}
                  >
                    <ShieldCheck size={11} className="me-1 inline" />
                    {loaiHDInfo.shortLabel}
                  </span>
                  {c.moTaVay && (
                    <span className="text-muted small d-none d-md-inline">
                      • {c.moTaVay}
                    </span>
                  )}
                </div>

                <div className="d-flex align-items-center gap-1.5 small text-muted">
                  <span>CBTD:</span>
                  <strong className="text-dark">{c.tenCBTD || 'Lê Văn Tín (CBTD)'}</strong>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-secondary p-0.5 px-1.5 ms-1"
                    onClick={() => onOpenAssignModal && onOpenAssignModal(c, customer)}
                    title="Chuyển giao CBTD phụ trách hợp đồng"
                  >
                    <UserCog size={12} />
                  </button>
                </div>
              </div>

              {/* HÀNG 2: SỐ LIỆU TÀI CHÍNH */}
              <div className="row g-2 mb-3 small">
                <div className="col-6 col-sm-3">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Số Tiền Vay Ban Đầu</span>
                  <strong className="num-tabular text-dark fs-6">{formatCurrencyVN(c.tienVay)}</strong>
                </div>

                <div className="col-6 col-sm-3">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Dư Nợ Gốc Hiện Tại</span>
                  <strong className={`num-tabular fs-6 ${isSettled ? 'text-secondary' : 'text-danger'}`}>
                    {isSettled ? '0 ₫' : formatCurrencyVN(c.duNo)}
                  </strong>
                </div>

                <div className="col-6 col-sm-3">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Lãi Suất Cho Vay</span>
                  <strong className="text-success fs-6">{c.laiSuat || 10.46}%/năm</strong>
                </div>

                <div className="col-6 col-sm-3">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Đã Trả Lãi Đến Ngày</span>
                  <strong className="font-monospace text-slate-700">{c.traLaiDenNgay || '---'}</strong>
                </div>
              </div>

              {/* HÀNG 3: TIMELINE TIẾN ĐỘ THỜI HẠN VAY */}
              {!isSettled && (
                <div className="p-2.5 bg-light rounded-2 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1 text-muted small" style={{ fontSize: '0.74rem' }}>
                    <span className="d-flex align-items-center gap-1">
                      <Calendar size={12} /> Ngày vay: <strong>{c.ngayVay ? formatDateVN(c.ngayVay) : '---'}</strong>
                    </span>

                    <span className="fw-bold font-monospace" style={{ color: barColor }}>
                      {deadlineText} ({timeline.percent}% thời hạn)
                    </span>

                    <span className="d-flex align-items-center gap-1">
                      Đến hạn: <strong>{c.denHan ? formatDateVN(c.denHan) : '---'}</strong>
                    </span>
                  </div>

                  {/* Thanh Progress Thời Hạn */}
                  <div className="progress" style={{ height: '7px', borderRadius: '4px', backgroundColor: '#e2e8f0' }}>
                    <div
                      className="progress-bar"
                      style={{
                        width: `${timeline.percent}%`,
                        backgroundColor: barColor,
                        transition: 'width 0.6s ease'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* HÀNG MỞ RỘNG: MÔ PHỎNG LỊCH TRẢ NỢ VÀ DỰ TÍNH LÃI */}
              {isScheduleOpen && !isSettled && (
                <div className="p-3 bg-light-subtle rounded-3 border mb-3 content-fade-in">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold m-0 text-slate-800 d-flex align-items-center gap-1.5" style={{ fontSize: '0.85rem' }}>
                      <Calculator size={15} className="text-primary" />
                      Dự Tính Phân Kỳ & Tiền Lãi Theo TT 14/2017/TT-NHNN
                    </h6>
                    <span className="badge bg-primary-subtle text-primary small">
                      Dư nợ giảm dần
                    </span>
                  </div>

                  <div className="row g-2 small">
                    <div className="col-12 col-md-4">
                      <div className="p-2 bg-white rounded border">
                        <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Lãi Bình Quân / Tháng</span>
                        <strong className="text-danger num-tabular fs-6">{formatCurrencyVN(monthlyEstInterest)}</strong>
                        <div className="text-xs text-muted mt-0.5">Khoảng {formatCurrencyVN(dailyActualInterest)} / ngày</div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="p-2 bg-white rounded border">
                        <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Kỳ Thu Lãi Tự Động CASA</span>
                        <strong className="text-success fs-6">Kỳ 1 (05) • Kỳ 2 (15) • Kỳ 3 (25)</strong>
                        <div className="text-xs text-muted mt-0.5">Trích trực tiếp từ tài khoản {customer?.soTK || 'CASA'}</div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="p-2 bg-white rounded border">
                        <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Dự Tính 30 Ngày Tới</span>
                        <strong className="text-primary num-tabular fs-6">{formatCurrencyVN(thirtyDayInterest)}</strong>
                        <div className="text-xs text-muted mt-0.5">Theo công thức (Dư nợ x Lãi suất x 30) / 36500</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* HÀNG 4: THAO TÁC NHANH TRÊN HỢP ĐỒNG */}
              <div className="d-flex justify-content-between align-items-center pt-2 border-top border-light flex-wrap gap-2">
                <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                  Đối soát tự động với SQL Server Core Banking QTDND Yên Thọ
                </span>

                <div className="d-flex align-items-center gap-2">
                  {!isSettled && (
                    <>
                      <button
                        type="button"
                        className={`btn btn-xs fw-semibold d-flex align-items-center gap-1 py-1 px-2.5 shadow-xs ${
                          isScheduleOpen ? 'btn-secondary text-white' : 'btn-outline-info text-info'
                        }`}
                        onClick={() => toggleSchedule(c.soHDTD)}
                        title="Xem dự tính tiền lãi và kế hoạch trả nợ định kỳ"
                      >
                        <Calculator size={13} />
                        {isScheduleOpen ? 'Ẩn Lịch Trả Nợ' : 'Lịch Trả Nợ & Lãi'}
                        {isScheduleOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      <button
                        type="button"
                        className="btn btn-xs btn-outline-warning fw-semibold d-flex align-items-center gap-1 py-1 px-2.5 shadow-xs"
                        onClick={() => onNavigateToInspection && onNavigateToInspection(customer, c)}
                        title="Lập biên bản kiểm tra sử dụng vốn vay sau giải ngân"
                      >
                        <ShieldCheck size={13} /> Kiểm Tra Vốn
                      </button>

                      <button
                        type="button"
                        className="btn btn-xs btn-outline-primary fw-semibold d-flex align-items-center gap-1 py-1 px-2.5 shadow-xs"
                        onClick={() => onNavigateToDebit && onNavigateToDebit(customer)}
                        title="Ủy quyền trích nợ tự động CASA cho hợp đồng này"
                      >
                        <Zap size={13} /> Trích Nợ CASA
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
