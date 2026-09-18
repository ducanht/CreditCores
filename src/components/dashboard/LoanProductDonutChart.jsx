import React, { useMemo } from 'react';
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
  // Tìm thông tin xã nếu đang chọn
  const activeArea = useMemo(() => {
    if (!selectedCommune || selectedCommune === 'ALL') return null;
    return areaStats.find((a) => a.name === selectedCommune || a.key === selectedCommune);
  }, [areaStats, selectedCommune]);

  // Dữ liệu sản phẩm vay (tính theo xã đang chọn hoặc toàn Quỹ)
  const productData = useMemo(() => {
    let nn = 0, td = 0, tm = 0;

    if (activeArea && activeArea.loanGroups) {
      nn = activeArea.loanGroups['Nông nghiệp'] || 0;
      td = activeArea.loanGroups['Tiêu dùng - Đời sống'] || 0;
      tm = activeArea.loanGroups['Thương mại - Dịch vụ'] || 0;
    } else {
      areaStats.forEach((a) => {
        if (a.loanGroups) {
          nn += a.loanGroups['Nông nghiệp'] || 0;
          td += a.loanGroups['Tiêu dùng - Đời sống'] || 0;
          tm += a.loanGroups['Thương mại - Dịch vụ'] || 0;
        }
      });
    }

    const currentTotal = nn + td + tm || (activeArea ? activeArea.duNo : totalDuNo) || 1;

    const items = [
      {
        name: 'Nông nghiệp, lâm nghiệp, thủy sản',
        shortName: 'Nông nghiệp',
        amount: nn,
        color: '#10b981', // Emerald
        bgClass: 'bg-success',
        textClass: 'text-success'
      },
      {
        name: 'Tiêu dùng - Đời sống',
        shortName: 'Tiêu dùng',
        amount: td,
        color: '#0284c7', // Sky Blue
        bgClass: 'bg-primary',
        textClass: 'text-primary'
      },
      {
        name: 'Thương mại - Dịch vụ',
        shortName: 'Thương mại',
        amount: tm,
        color: '#f59e0b', // Amber
        bgClass: 'bg-warning',
        textClass: 'text-warning-emphasis'
      }
    ];

    let accumulatedPercent = 0;
    return {
      total: currentTotal,
      items: items.map((item) => {
        const rate = (item.amount / currentTotal) * 100;
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
  }, [areaStats, activeArea, totalDuNo]);

  // Cấu hình SVG Donut Chart
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.29

  return (
    <div className="card-modern p-4 h-100 d-flex flex-column justify-content-between">
      <div>
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
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

          {activeArea && (
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle small font-monospace">
              {activeArea.name}
            </span>
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

                  return (
                    <circle
                      key={idx}
                      cx="75"
                      cy="75"
                      r={radius}
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth="22"
                      strokeDasharray={`${strokeLength} ${circumference}`}
                      strokeDashoffset={strokeOffset}
                      style={{ transition: 'stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease' }}
                    />
                  );
                })}
              </svg>

              {/* Tâm Donut */}
              <div
                className="position-absolute top-50 start-50 translate-middle text-center"
                style={{ width: '85px' }}
              >
                <span className="text-muted d-block small" style={{ fontSize: '0.68rem', lineHeight: 1 }}>
                  {activeArea ? activeArea.name : 'Tổng Dư Nợ'}
                </span>
                <strong className="fs-6 fw-bold text-dark num-tabular d-block mt-0.5" style={{ lineHeight: 1.1 }}>
                  {formatCompactVN(productData.total)}
                </strong>
              </div>
            </div>
          </div>

          {/* Legend Chi Tiết */}
          <div className="col-12 col-sm-7">
            <div className="d-flex flex-column gap-2">
              {productData.items.map((item, idx) => (
                <div key={idx} className="p-2 rounded-2 bg-light-subtle border">
                  <div className="d-flex justify-content-between align-items-center mb-1">
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
                    <strong className="num-tabular text-dark">{formatCompactVN(item.amount)}</strong>
                  </div>
                </div>
              ))}
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
