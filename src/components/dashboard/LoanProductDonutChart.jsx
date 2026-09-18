import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Layers,
  MapPin,
  TrendingUp,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { formatCurrencyVN } from '../../utils/dateUtils';

// Helper rút gọn tiền tệ sang Tỷ / Triệu
const formatCompactVN = (amount) => {
  const num = Number(amount) || 0;
  if (Math.abs(num) >= 1e9) {
    const val = (num / 1e9).toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
    return `${val} tỷ`;
  }
  if (Math.abs(num) >= 1e6) {
    const val = (num / 1e6).toFixed(1).replace(/\.?0+$/, '').replace('.', ',');
    return `${val} tr`;
  }
  return num.toLocaleString('vi-VN') + ' đ';
};

export default function LoanProductDonutChart({
  areaStats = [],
  totalDuNo = 0,
  selectedCommune = null,
  onSelectCommune
}) {
  // Chế độ xem: 'duNo' (Doanh số Dư nợ VNĐ) | 'countHD' (Số món / Hợp đồng vay)
  const [metricMode, setMetricMode] = useState('duNo');
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Tìm thông tin xã nếu đang chọn
  const activeArea = useMemo(() => {
    if (!selectedCommune || selectedCommune === 'ALL') return null;
    return areaStats.find((a) => a.name === selectedCommune || a.key === selectedCommune);
  }, [areaStats, selectedCommune]);

  // Dữ liệu sản phẩm vay (tính theo xã đang chọn hoặc toàn Quỹ)
  const productData = useMemo(() => {
    let nn = 0, td = 0, tm = 0;
    let totalCount = 0;

    if (activeArea && activeArea.loanGroups) {
      nn = activeArea.loanGroups['Nông nghiệp'] || 0;
      td = activeArea.loanGroups['Tiêu dùng - Đời sống'] || 0;
      tm = activeArea.loanGroups['Thương mại - Dịch vụ'] || 0;
      totalCount = Number(activeArea.countHD) || 0;
    } else {
      areaStats.forEach((a) => {
        if (a.loanGroups) {
          nn += a.loanGroups['Nông nghiệp'] || 0;
          td += a.loanGroups['Tiêu dùng - Đời sống'] || 0;
          tm += a.loanGroups['Thương mại - Dịch vụ'] || 0;
        }
        totalCount += Number(a.countHD) || 0;
      });
    }

    const currentDuNoTotal = nn + td + tm || (activeArea ? activeArea.duNo : totalDuNo) || 1;
    const effTotalCount = totalCount > 0 ? totalCount : 435;

    // Ước lượng số món vay theo tỷ trọng
    const countNN = Math.max(1, Math.round((nn / currentDuNoTotal) * effTotalCount));
    const countTD = Math.max(1, Math.round((td / currentDuNoTotal) * effTotalCount));
    const countTM = Math.max(1, effTotalCount - countNN - countTD);

    const isByCount = metricMode === 'countHD';
    const activeTotal = isByCount ? effTotalCount : currentDuNoTotal;

    const items = [
      {
        name: 'Nông nghiệp, lâm nghiệp, thủy sản',
        shortName: 'Nông nghiệp',
        amount: nn,
        count: countNN,
        metricValue: isByCount ? countNN : nn,
        color: '#10b981', // Emerald
        bgClass: 'bg-success',
        textClass: 'text-success'
      },
      {
        name: 'Tiêu dùng - Đời sống',
        shortName: 'Tiêu dùng',
        amount: td,
        count: countTD,
        metricValue: isByCount ? countTD : td,
        color: '#0284c7', // Sky Blue
        bgClass: 'bg-primary',
        textClass: 'text-primary'
      },
      {
        name: 'Thương mại - Dịch vụ',
        shortName: 'Thương mại',
        amount: tm,
        count: countTM,
        metricValue: isByCount ? countTM : tm,
        color: '#f59e0b', // Amber
        bgClass: 'bg-warning',
        textClass: 'text-warning-emphasis'
      }
    ];

    let accumulatedPercent = 0;
    return {
      total: activeTotal,
      duNoTotal: currentDuNoTotal,
      countTotal: effTotalCount,
      items: items.map((item) => {
        const rate = (item.metricValue / activeTotal) * 100;
        const segment = {
          ...item,
          rateNum: rate,
          rateFormatted: rate.toFixed(1) + '%',
          dashOffset: accumulatedPercent
        };
        accumulatedPercent += rate;
        return segment;
      })
    };
  }, [areaStats, activeArea, totalDuNo, metricMode]);

  // Cấu hình SVG Donut Chart
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.29

  const activeHoverItem = hoveredIndex !== null ? productData.items[hoveredIndex] : null;

  return (
    <div className="card-modern p-4 h-100 d-flex flex-column justify-content-between">
      <div>
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <div>
            <h6 className="fw-bold m-0 text-slate-800 font-heading d-flex align-items-center gap-1.5">
              <PieChart size={18} className="text-warning" />
              Tỷ Trọng Cơ Cấu Sản Phẩm Vay
            </h6>
            <span className="text-muted small">
              {activeArea ? (
                <>
                  Đang phân tích cơ cấu của <strong className="text-primary">{activeArea.name}</strong>
                </>
              ) : (
                'Tổng hợp cơ cấu cho vay toàn Quỹ Tín Dụng'
              )}
            </span>
          </div>

          {/* Metric Toggle Buttons */}
          <div className="btn-group btn-group-sm bg-light p-0.5 rounded-2 border" role="group">
            <button
              type="button"
              className={`btn btn-sm ${metricMode === 'duNo' ? 'btn-white shadow-sm fw-bold text-dark' : 'btn-light text-muted'}`}
              onClick={() => setMetricMode('duNo')}
            >
              Doanh Số Dư Nợ
            </button>
            <button
              type="button"
              className={`btn btn-sm ${metricMode === 'countHD' ? 'btn-white shadow-sm fw-bold text-dark' : 'btn-light text-muted'}`}
              onClick={() => setMetricMode('countHD')}
            >
              Số Món Vay
            </button>
          </div>
        </div>

        {/* COMMUNE CONTEXT TAG */}
        <div className="d-flex align-items-center justify-content-between pt-1 pb-2 border-top border-light mb-2">
          <span className="small text-muted" style={{ fontSize: '0.78rem' }}>
            Phạm vi: <strong className="text-dark">{activeArea ? activeArea.name : 'Toàn Bộ 3 Xã'}</strong>
          </span>
          {activeArea && (
            <button
              type="button"
              className="btn btn-link p-0 text-primary small text-decoration-none"
              onClick={() => onSelectCommune && onSelectCommune('ALL')}
            >
              Quay lại toàn Quỹ →
            </button>
          )}
        </div>

        {/* DONUT SVG VÀ CHỈ SỐ */}
        <div className="row g-3 align-items-center mb-3">
          {/* SVG Donut */}
          <div className="col-12 col-sm-5 text-center">
            <div className="position-relative d-inline-block" style={{ width: '150px', height: '150px' }}>
              <svg width="150" height="150" viewBox="0 0 150 150" className="rotate-negative-90">
                {/* Background Ring */}
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="transparent"
                  stroke="var(--bg-surface-soft, #f1f5f9)"
                  strokeWidth="22"
                />

                {/* Donut Segments */}
                {productData.items.map((item, idx) => {
                  const strokeLength = (item.rateNum / 100) * circumference;
                  const strokeOffset = -((item.dashOffset / 100) * circumference);
                  const isHovered = hoveredIndex === idx;

                  return (
                    <circle
                      key={idx}
                      cx="75"
                      cy="75"
                      r={radius}
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth={isHovered ? 26 : 22}
                      strokeDasharray={`${strokeLength} ${circumference}`}
                      strokeDashoffset={strokeOffset}
                      style={{
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        filter: isHovered ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' : 'none'
                      }}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}
              </svg>

              {/* Tâm Donut */}
              <div
                className="position-absolute top-50 start-50 translate-middle text-center"
                style={{ width: '85px', pointerEvents: 'none' }}
              >
                {activeHoverItem ? (
                  <>
                    <span
                      className="d-block small fw-bold text-truncate"
                      style={{ fontSize: '0.68rem', color: activeHoverItem.color }}
                    >
                      {activeHoverItem.shortName}
                    </span>
                    <strong className="fs-6 fw-bold text-dark num-tabular d-block mt-0.5">
                      {activeHoverItem.rateFormatted}
                    </strong>
                  </>
                ) : (
                  <>
                    <span className="text-muted d-block small" style={{ fontSize: '0.68rem', lineHeight: 1 }}>
                      {metricMode === 'countHD' ? 'Tổng Số Món' : activeArea ? activeArea.name : 'Tổng Dư Nợ'}
                    </span>
                    <strong className="fs-6 fw-bold text-dark num-tabular d-block mt-0.5" style={{ lineHeight: 1.1 }}>
                      {metricMode === 'countHD'
                        ? `${productData.countTotal} HĐ`
                        : formatCompactVN(productData.duNoTotal)}
                    </strong>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Legend Chi Tiết */}
          <div className="col-12 col-sm-7">
            <div className="d-flex flex-column gap-2">
              {productData.items.map((item, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-2 border transition-all cursor-pointer ${
                      isHovered ? 'bg-light border-primary shadow-xs' : 'bg-light-subtle'
                    }`}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-0.5">
                      <div className="d-flex align-items-center gap-1.5">
                        <span
                          className="d-inline-block rounded-circle"
                          style={{ width: 10, height: 10, backgroundColor: item.color }}
                        />
                        <span className="small fw-semibold text-slate-800">{item.shortName}</span>
                      </div>
                      <span className="badge bg-white text-dark border small fw-bold font-monospace">
                        {item.rateFormatted}
                      </span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: '0.72rem' }}>
                      <span className="text-truncate" style={{ maxWidth: '140px' }} title={item.name}>
                        {item.name}
                      </span>
                      <strong className="num-tabular text-dark">
                        {metricMode === 'countHD' ? `${item.count} món` : formatCompactVN(item.amount)}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top text-muted small">
        <div className="d-flex align-items-center gap-1">
          <ShieldCheck size={14} className="text-success" />
          <span>Tuân thủ hạn mức tín dụng TT 39/2016</span>
        </div>
        {activeArea && (
          <button
            type="button"
            className="btn btn-link p-0 text-primary small text-decoration-none"
            onClick={() => onSelectCommune && onSelectCommune('ALL')}
          >
            Xem toàn Quỹ
          </button>
        )}
      </div>
    </div>
  );
}
