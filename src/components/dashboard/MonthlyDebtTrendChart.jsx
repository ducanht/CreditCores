import React from 'react';
import { TrendingUp, BarChart3, Calendar, Users, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrencyVN } from '../../utils/dateUtils';

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

export default function MonthlyDebtTrendChart({ monthlyDebtTrend = [] }) {
  if (!monthlyDebtTrend || monthlyDebtTrend.length === 0) {
    return (
      <div className="card-modern p-4 text-center text-muted">
        <BarChart3 size={36} className="mx-auto mb-2 text-secondary opacity-50" />
        <h6 className="fw-semibold">Chưa có chuỗi dữ liệu dư nợ theo tháng</h6>
        <p className="small mb-0">
          Hãy thực hiện trích xuất dữ liệu các ngày cuối tháng (T1 đến T12) từ CoreBanking NG-eFUND để hiển thị biểu đồ.
        </p>
      </div>
    );
  }

  // Tìm giá trị dư nợ lớn nhất để tính chiều cao cột (%)
  const maxDuNo = Math.max(...monthlyDebtTrend.map(m => m.totalDuNo || 0), 1);
  const minDuNo = Math.min(...monthlyDebtTrend.map(m => m.totalDuNo || 0));
  const avgDuNo = Math.round(monthlyDebtTrend.reduce((acc, cur) => acc + (cur.totalDuNo || 0), 0) / monthlyDebtTrend.length);

  return (
    <div className="card-modern p-3 p-md-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <div className="p-2 rounded-2 bg-indigo-subtle text-indigo" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <h6 className="fw-bold mb-0 font-heading">Diễn Biến Dư Nợ Theo Các Mốc Sao Kê Cuối Tháng</h6>
            <span className="small text-muted">Thống kê chuỗi thời gian từ kho lưu trữ cuối tháng <strong>HDTD_CORE_ALL</strong> ({monthlyDebtTrend.length} mốc chốt)</span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="badge text-white px-2.5 py-1.5" style={{ backgroundColor: '#1e3a8a' }}>
            Nguồn: HDTD_CORE_ALL
          </span>
          <span className="badge px-2.5 py-1.5" style={{ backgroundColor: '#4338ca', color: '#fff' }}>
            Bình Quân: {formatCompactVN(avgDuNo)}
          </span>
          <span className="badge bg-success-subtle text-success px-2.5 py-1.5 border border-success-subtle">
            Đỉnh: {formatCompactVN(maxDuNo)}
          </span>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <div className="p-3 bg-light rounded-3 border mb-3">
        <div className="d-flex align-items-end justify-content-between gap-2 overflow-x-auto pt-4 pb-2" style={{ minHeight: '220px' }}>
          {monthlyDebtTrend.map((item, idx) => {
            const heightPct = Math.max(12, Math.round((item.totalDuNo / maxDuNo) * 100));
            const isHighest = item.totalDuNo === maxDuNo;
            const isLowest = item.totalDuNo === minDuNo && monthlyDebtTrend.length > 1;

            return (
              <div key={idx} className="d-flex flex-column align-items-center flex-grow-1" style={{ minWidth: '55px', maxWidth: '85px' }}>
                {/* Tooltip / Label trên cột */}
                <div className="mb-1 text-center" style={{ fontSize: '0.7rem' }}>
                  <span className={`fw-bold d-block ${isHighest ? 'text-primary' : 'text-dark'}`}>
                    {formatCompactVN(item.totalDuNo)}
                  </span>
                  <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                    {item.countHD} HĐ
                  </span>
                </div>

                {/* Thanh cột */}
                <div className="w-100 d-flex justify-content-center" style={{ height: '140px', alignItems: 'flex-end' }}>
                  <div
                    className={`w-75 rounded-top transition-all ${
                      isHighest
                        ? 'shadow'
                        : isLowest
                        ? 'bg-warning'
                        : 'bg-primary'
                    }`}
                    style={{
                      height: `${heightPct}%`,
                      background: isHighest 
                        ? 'linear-gradient(180deg, #4338ca 0%, #6366f1 100%)' 
                        : isLowest
                        ? 'linear-gradient(180deg, #f59e0b 0%, #fbbf24 100%)'
                        : 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%)',
                      transition: 'height 0.4s ease'
                    }}
                    title={`${item.date}: ${formatCurrencyVN(item.totalDuNo)} (${item.countHD} HĐ, ${item.countKH} KH)`}
                  />
                </div>

                {/* Nhãn mốc ngày/tháng phía dưới */}
                <div className="mt-2 text-center">
                  <span className="badge bg-white text-dark border fw-semibold font-monospace" style={{ fontSize: '0.68rem' }}>
                    {item.date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bảng Chi Tiết Số Liệu Các Mốc */}
      <div className="table-responsive">
        <table className="table table-custom table-hover table-sm align-middle small mb-0">
          <thead>
            <tr>
              <th>Mốc Sao Kê</th>
              <th className="text-end">Tổng Dư Nợ</th>
              <th className="text-center">Số Hợp Đồng</th>
              <th className="text-center">Số Thành Viên Vay</th>
              <th className="text-end">Dư Nợ BQ / Thành Viên</th>
              <th className="text-center">Đánh Giá Tăng Trưởng</th>
            </tr>
          </thead>
          <tbody>
            {monthlyDebtTrend.map((m, idx) => {
              const prev = idx > 0 ? monthlyDebtTrend[idx - 1] : null;
              const diff = prev ? m.totalDuNo - prev.totalDuNo : 0;
              const growth = prev && prev.totalDuNo > 0 ? ((diff / prev.totalDuNo) * 100).toFixed(1) : 0;

              return (
                <tr key={idx}>
                  <td>
                    <div className="d-flex align-items-center gap-1.5 font-monospace fw-bold">
                      <Calendar size={13} className="text-primary" />
                      <span>{m.date}</span>
                    </div>
                  </td>
                  <td className="text-end fw-bold font-numeric text-primary">
                    {formatCurrencyVN(m.totalDuNo)}
                  </td>
                  <td className="text-center font-numeric">{m.countHD}</td>
                  <td className="text-center font-numeric">{m.countKH}</td>
                  <td className="text-end font-numeric text-secondary">
                    {formatCurrencyVN(m.duNoBinhQuanKH)}
                  </td>
                  <td className="text-center">
                    {prev ? (
                      <span className={`badge ${diff >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                        {diff >= 0 ? '+' : ''}{growth}%
                      </span>
                    ) : (
                      <span className="text-muted">— (Kỳ gốc)</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
