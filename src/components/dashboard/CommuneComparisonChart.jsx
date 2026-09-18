import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  MapPin,
  TrendingUp,
  Users,
  ChevronRight,
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { formatCurrencyVN } from '../../utils/dateUtils';

// Helper rút gọn tiền tệ sang Tỷ / Triệu hiển thị trực quan
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

export default function CommuneComparisonChart({
  areaStats = [],
  totalDuNo = 0,
  selectedCommune = null,
  onSelectCommune
}) {
  // Metric so sánh: 'duNo' (Dư nợ VNĐ) | 'countHD' (Số hợp đồng) | 'avgLoan' (Dư nợ bình quân)
  const [metric, setMetric] = useState('duNo');
  const [hoveredBar, setHoveredBar] = useState(null);

  // Danh sách xã hiện tại
  const selectedAreaData = useMemo(() => {
    if (!selectedCommune || selectedCommune === 'ALL') return null;
    return areaStats.find(
      (a) => a.name === selectedCommune || a.key === selectedCommune
    );
  }, [areaStats, selectedCommune]);

  // Dataset hiển thị: hoặc 3 Xã, hoặc các Thôn của Xã đang chọn
  const displayItems = useMemo(() => {
    if (selectedAreaData && selectedAreaData.thons && selectedAreaData.thons.length > 0) {
      return selectedAreaData.thons.map((th) => {
        const duNo = Number(th.duNo) || 0;
        const countHD = Number(th.countHD) || 0;
        const countKH = Number(th.countKH) || 0;
        const avgLoan = countHD > 0 ? duNo / countHD : 0;
        return {
          id: th.name,
          label: th.name,
          subLabel: `${countHD} HĐ • ${countKH} TV`,
          duNo,
          countHD,
          countKH,
          avgLoan,
          parentCommune: selectedAreaData.name
        };
      });
    }

    return areaStats.map((a, idx) => {
      const duNo = Number(a.duNo) || 0;
      const countHD = Number(a.countHD) || 0;
      const countKH = Number(a.countKH) || 0;
      const avgLoan = countHD > 0 ? duNo / countHD : 0;
      return {
        id: a.key || a.name,
        label: a.name,
        subLabel: `${(a.thons || []).length} Thôn • ${countHD} HĐ`,
        duNo,
        countHD,
        countKH,
        avgLoan,
        colorIndex: idx
      };
    });
  }, [areaStats, selectedAreaData]);

  // Tìm giá trị max để vẽ tỷ lệ thanh bar
  const maxVal = useMemo(() => {
    const vals = displayItems.map((item) => item[metric] || 0);
    return Math.max(...vals, 1);
  }, [displayItems, metric]);

  const colorPalettes = [
    { bg: 'linear-gradient(180deg, #9ACD32 0%, #6b931e 100%)', text: '#4d7c0f', badge: '#9ACD32' },
    { bg: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)', text: '#0284c7', badge: '#0284c7' },
    { bg: 'linear-gradient(180deg, #10b981 0%, #059669 100%)', text: '#059669', badge: '#10b981' },
    { bg: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)', text: '#d97706', badge: '#f59e0b' },
    { bg: 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)', text: '#6d28d9', badge: '#8b5cf6' },
    { bg: 'linear-gradient(180deg, #ec4899 0%, #be185d 100%)', text: '#be185d', badge: '#ec4899' }
  ];

  return (
    <div className="card-modern p-4 h-100 d-flex flex-column justify-content-between">
      {/* HEADER BIỂU ĐỒ & BỘ LỌC CHỈ SỐ */}
      <div>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h6 className="fw-bold m-0 text-slate-800 font-heading d-flex align-items-center gap-1.5">
                <BarChart3 size={18} className="text-primary" />
                {selectedAreaData ? (
                  <>
                    So Sánh Dư Nợ Các Thôn Thuộc <span className="text-primary">{selectedAreaData.name}</span>
                  </>
                ) : (
                  'Biểu Đồ So Sánh Dư Nợ Tín Dụng Giữa 3 Xã'
                )}
              </h6>
              {selectedAreaData && (
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary d-flex align-items-center gap-1 py-0.5 px-2"
                  onClick={() => onSelectCommune && onSelectCommune('ALL')}
                  title="Quay lại xem so sánh toàn bộ 3 xã"
                >
                  <ArrowLeft size={12} /> Quay lại 3 xã
                </button>
              )}
            </div>
            <span className="text-muted small">
              {selectedAreaData
                ? `Chi tiết ${displayItems.length} thôn trên địa bàn ${selectedAreaData.name}`
                : 'Bấm vào cột xã để xem drill-down phân tích chi tiết từng thôn'}
            </span>
          </div>

          {/* Metric Selector Buttons */}
          <div className="btn-group btn-group-sm bg-light p-0.5 rounded-2 border" role="group">
            <button
              type="button"
              className={`btn btn-sm ${metric === 'duNo' ? 'btn-white shadow-sm fw-bold text-dark' : 'btn-light text-muted'}`}
              onClick={() => setMetric('duNo')}
            >
              <DollarSign size={13} className="me-1 inline" />
              Tổng Dư Nợ
            </button>
            <button
              type="button"
              className={`btn btn-sm ${metric === 'countHD' ? 'btn-white shadow-sm fw-bold text-dark' : 'btn-light text-muted'}`}
              onClick={() => setMetric('countHD')}
            >
              <Users size={13} className="me-1 inline" />
              Số Hợp Đồng
            </button>
            <button
              type="button"
              className={`btn btn-sm ${metric === 'avgLoan' ? 'btn-white shadow-sm fw-bold text-dark' : 'btn-light text-muted'}`}
              onClick={() => setMetric('avgLoan')}
            >
              <TrendingUp size={13} className="me-1 inline" />
              Dư Nợ BQ
            </button>
          </div>
        </div>

        {/* THÂN BIỂU ĐỒ CỘT (HORIZONTAL RESPONSIVE SVG & CSS BARS) */}
        <div className="pt-2 pb-1">
          <div className="d-flex flex-column gap-3">
            {displayItems.map((item, idx) => {
              const val = item[metric] || 0;
              const percent = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;
              const shareOfTotal =
                totalDuNo > 0 && metric === 'duNo'
                  ? ((item.duNo / totalDuNo) * 100).toFixed(1)
                  : null;

              const theme = colorPalettes[idx % colorPalettes.length];
              const isHovered = hoveredBar === item.id;
              const isClickable = !selectedAreaData;

              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-3 transition-all ${
                    isClickable ? 'cursor-pointer hover-bg-light border' : 'bg-light-subtle'
                  }`}
                  style={{
                    backgroundColor: isHovered ? 'rgba(154, 205, 50, 0.08)' : undefined,
                    borderColor: isHovered ? '#9ACD32' : 'transparent'
                  }}
                  onMouseEnter={() => setHoveredBar(item.id)}
                  onMouseLeave={() => setHoveredBar(null)}
                  onClick={() => {
                    if (isClickable && onSelectCommune) {
                      onSelectCommune(item.label);
                    }
                  }}
                  title={
                    isClickable
                      ? `Bấm để xem chi tiết các thôn của ${item.label}`
                      : `${item.label}: ${formatCurrencyVN(item.duNo)}`
                  }
                >
                  <div className="d-flex justify-content-between align-items-center mb-1.5">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold text-dark fs-6 d-flex align-items-center gap-1">
                        <MapPin size={14} style={{ color: theme.badge }} />
                        {item.label}
                      </span>
                      <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        ({item.subLabel})
                      </span>
                      {isClickable && (
                        <span className="badge bg-primary-subtle text-primary small d-none d-sm-inline">
                          Xem chi tiết thôn <ChevronRight size={10} className="inline" />
                        </span>
                      )}
                    </div>

                    <div className="text-end font-monospace">
                      <strong className="fs-6 text-dark num-tabular">
                        {metric === 'duNo'
                          ? formatCompactVN(item.duNo)
                          : metric === 'countHD'
                          ? `${item.countHD} HĐ`
                          : formatCompactVN(item.avgLoan)}
                      </strong>
                      {shareOfTotal && (
                        <span className="badge bg-light text-muted border ms-2 small num-tabular">
                          {shareOfTotal}% Quỹ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thanh Progress Bar Tỷ Lệ */}
                  <div
                    className="progress position-relative overflow-hidden"
                    style={{ height: '14px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-soft, #e2e8f0)' }}
                  >
                    <div
                      className="progress-bar transition-all"
                      style={{
                        width: `${Math.max(percent, 4)}%`,
                        background: theme.bg,
                        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOOTER CHỈ DẪN & TÓM TẮT NHANH */}
      <div className="d-flex justify-content-between align-items-center pt-3 mt-3 border-top text-muted small">
        <div className="d-flex align-items-center gap-2">
          <span className="d-inline-block p-1 rounded-circle bg-success"></span>
          <span>Dữ liệu thực tế đối soát từ CoreBanking SQL Server</span>
        </div>
        <div>
          {selectedAreaData ? (
            <span className="text-primary fw-semibold cursor-pointer" onClick={() => onSelectCommune && onSelectCommune('ALL')}>
              Xem tổng thể 3 Xã →
            </span>
          ) : (
            <span className="text-muted">Nhấp vào từng Xã để đào sâu cấp Thôn</span>
          )}
        </div>
      </div>
    </div>
  );
}
