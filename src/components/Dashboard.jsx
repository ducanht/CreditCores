import React, { useState, useMemo } from 'react';
import {
  Landmark,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
  MapPin,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  ClipboardList,
  User,
  ArrowUpRight,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  ChevronRight,
  Award
} from 'lucide-react';
import { formatCurrencyVN } from '../utils/dateUtils';
import CommuneComparisonChart from './dashboard/CommuneComparisonChart';
import LoanProductDonutChart from './dashboard/LoanProductDonutChart';
import SecurityTypeBreakdown from './dashboard/SecurityTypeBreakdown';
import Top50DebtSection from './dashboard/Top50DebtSection';
import MonthlyDebtTrendChart from './dashboard/MonthlyDebtTrendChart';

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

// Skeleton Loader khi nạp dữ liệu
function DashboardSkeleton() {
  return (
    <div className="dashboard-container d-flex flex-column gap-3 pb-4 content-fade-in">
      <div className="card-modern p-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span className="skeleton skeleton-text" style={{ width: 220, height: 20 }} />
          <span className="skeleton skeleton-btn" style={{ width: 140, height: 32 }} />
        </div>
      </div>
      <div className="row g-3">
        {[1, 2, 3, 4].map(i => (
          <div className="col-12 col-sm-6 col-xl-3" key={i}>
            <div className="skeleton-card" style={{ minHeight: 105 }}>
              <span className="skeleton skeleton-text sm" style={{ width: '45%' }} />
              <span className="skeleton skeleton-stat mt-2" style={{ width: '70%' }} />
            </div>
          </div>
        ))}
      </div>
      <div className="card-modern p-3">
        <div className="skeleton-card" style={{ height: 260 }} />
      </div>
    </div>
  );
}

export default function Dashboard({ stats, onNavigate, onRefresh, syncStatus, currentUser, onOpenCustomerQuickView }) {
  if (!stats) {
    return <DashboardSkeleton />;
  }

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTabOverview, setActiveTabOverview] = useState('areas'); // 'areas' | 'cbtd' | 'security' | 'top50' | 'trend'

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Trích xuất số liệu từ stats
  const totalDuNo = stats.totalDuNo || 0;
  const totalTienVay = stats.totalTienVay || 0;
  const totalHopDong = stats.totalHopDong || 0;
  const totalThanhVienVay = stats.totalThanhVienVay || 0;
  const laiSuatBinhQuan = stats.laiSuatBinhQuan || '0';
  const duNoBinhQuanHD = totalHopDong > 0 ? Math.round(totalDuNo / totalHopDong) : 0;
  const duNoBinhQuanTV = totalThanhVienVay > 0 ? Math.round(totalDuNo / totalThanhVienVay) : 0;
  const totalDuThuLai = stats.totalDuThuLai || 0;
  const totalKhachHangTrichNo = stats.totalKhachHangTrichNo || 0;
  const autoDebitCoverageRate = stats.autoDebitCoverageRate || 0;
  const totalNoTon = stats.totalNoTon || 0;

  // Dữ liệu địa bàn & CBTD
  const areaStats = stats.areaStats || [];
  const cbtdStats = stats.cbtdStats || [];

  return (
    <div className="dashboard-container d-flex flex-column gap-3 pb-4 content-fade-in">
      {/* 1. Header Bảng Điều Hành & Nút Thao Tác Nhanh */}
      <div className="card-modern p-3">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded-2.5 bg-primary-subtle text-primary">
              <Landmark size={20} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-bold mb-0 font-heading text-dark">Tổng Quan Điều Hành</h5>
                {/* Icon nhấp nháy tình trạng trực tuyến */}
                <span className="pulse-online" title="Hệ thống trực tuyến" />
              </div>
              <span className="small text-muted">
                Bảng số liệu điều hành tín dụng và quản trị rủi ro QTDND Yên Thọ
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 px-2.5 py-1.5 rounded-2"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Làm mới số liệu"
            >
              <RefreshCw size={13} className={isRefreshing ? 'spin-animation' : ''} />
              <span className="small">{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-2 shadow-xs fw-semibold"
              onClick={() => onNavigate && onNavigate('credit_statement')}
              title="Mở phân hệ Sao kê tín dụng chuyên sâu"
            >
              <FileSpreadsheet size={14} />
              <span>Sao kê tín dụng</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Hệ Thống 4 Thẻ Chỉ Số Trọng Yếu */}
      <div className="row g-3">
        {/* Thẻ 1: Tổng Dư Nợ */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card-modern p-3 h-100 cursor-pointer hover-lift border-start border-4 border-success"
            onClick={() => onNavigate && onNavigate('credit_statement')}
            title="Bấm để xem chi tiết sao kê"
          >
            <div className="d-flex justify-content-between align-items-center mb-1 text-muted small">
              <span className="text-uppercase fw-semibold" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                Tổng Dư Nợ Thực Tế
              </span>
              <Landmark size={16} className="text-success" />
            </div>
            <div>
              <h3 className="fw-bold text-dark mb-1 fs-4 num-tabular font-numeric">
                {formatCurrencyVN(totalDuNo)}
              </h3>
              <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top">
                <span className="text-success fw-medium">
                  {totalHopDong} HĐ • {totalThanhVienVay} Khách vay
                </span>
                {totalTienVay > 0 ? (
                  <span className="text-muted font-numeric" style={{ fontSize: '0.72rem' }} title="Tổng vốn giải ngân ban đầu">
                    Giải ngân: {formatCompactVN(totalTienVay)}
                  </span>
                ) : (
                  <span className="text-primary font-monospace" style={{ fontSize: '0.72rem' }}>Sao kê →</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Thẻ 2: Dư Nợ Bình Quân & Lãi Suất */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card-modern p-3 h-100 cursor-pointer hover-lift border-start border-4 border-primary"
            onClick={() => onNavigate && onNavigate('credit_statement')}
            title="Xem chi tiết sao kê"
          >
            <div className="d-flex justify-content-between align-items-center mb-1 text-muted small">
              <span className="text-uppercase fw-semibold" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                Dư Nợ Bình Quân & Lãi Suất
              </span>
              <Users size={16} className="text-primary" />
            </div>
            <div>
              <div className="d-flex align-items-baseline gap-2 mb-1">
                <h4 className="fw-bold text-dark mb-0 fs-5 num-tabular font-numeric">
                  {formatCompactVN(duNoBinhQuanHD)}
                </h4>
                <span className="text-muted small">/ Hợp đồng</span>
              </div>
              <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top">
                <span>BQ/Khách vay: <strong className="text-dark num-tabular font-numeric">{formatCompactVN(duNoBinhQuanTV)}</strong></span>
                <span className="badge bg-primary-subtle text-primary fw-bold font-monospace">LS: {laiSuatBinhQuan}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thẻ 3: Dự Thu Lãi Kỳ Này */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card-modern p-3 h-100 cursor-pointer hover-lift border-start border-4 border-warning"
            onClick={() => onNavigate && onNavigate('debit_batch')}
            title="Quản lý đợt trích nợ"
          >
            <div className="d-flex justify-content-between align-items-center mb-1 text-muted small">
              <span className="text-uppercase fw-semibold" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                Dự Thu Lãi Kỳ Này (TT 14/2017)
              </span>
              <TrendingUp size={16} className="text-warning" />
            </div>
            <div>
              <h3 className="fw-bold text-dark mb-1 fs-4 num-tabular font-numeric">
                {formatCurrencyVN(totalDuThuLai)}
              </h3>
              <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top">
                <span>Tính ngày thực tế</span>
                <span className="text-warning-emphasis font-monospace" style={{ fontSize: '0.72rem' }}>3 Kỳ (05, 15, 25) →</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thẻ 4: Ủy Quyền Trích Nợ Tự Động & Nợ Tồn */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card-modern p-3 h-100 cursor-pointer hover-lift border-start border-4 border-danger"
            onClick={() => onNavigate && onNavigate('debit_register')}
            title="Quản lý ủy quyền trích nợ tự động"
          >
            <div className="d-flex justify-content-between align-items-center mb-1 text-muted small">
              <span className="text-uppercase fw-semibold" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                Ủy Quyền Trích Nợ Tự Động
              </span>
              <Zap size={16} className="text-danger" />
            </div>
            <div>
              <div className="d-flex align-items-baseline gap-2 mb-1">
                <h4 className="fw-bold text-dark mb-0 fs-5 num-tabular font-numeric">
                  {totalKhachHangTrichNo} <span className="fs-6 fw-normal text-muted">TV đăng ký</span>
                </h4>
              </div>
              <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top">
                <span>Bao phủ: <strong className="text-dark font-numeric">{autoDebitCoverageRate}%</strong></span>
                <span className="text-danger fw-semibold">Nợ tồn: {formatCompactVN(totalNoTon)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Phân Hệ Thống Kê Chuyên Sâu (5 Phân Hệ) */}
      <div className="card-modern p-3">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-1.5 flex-wrap">
            <button
              type="button"
              className={`btn btn-sm px-3 py-1.5 rounded-2 d-flex align-items-center gap-1.5 ${
                activeTabOverview === 'areas'
                  ? 'btn-primary text-white fw-bold shadow-xs'
                  : 'btn-light text-muted'
              }`}
              onClick={() => setActiveTabOverview('areas')}
            >
              <MapPin size={14} />
              <span>Địa Bàn & Sản Phẩm ({areaStats.length} Xã)</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm px-3 py-1.5 rounded-2 d-flex align-items-center gap-1.5 ${
                activeTabOverview === 'cbtd'
                  ? 'btn-primary text-white fw-bold shadow-xs'
                  : 'btn-light text-muted'
              }`}
              onClick={() => setActiveTabOverview('cbtd')}
            >
              <User size={14} />
              <span>Cán Bộ Quản Lý ({cbtdStats.length} CBTD)</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm px-3 py-1.5 rounded-2 d-flex align-items-center gap-1.5 ${
                activeTabOverview === 'security'
                  ? 'btn-primary text-white fw-bold shadow-xs'
                  : 'btn-light text-muted'
              }`}
              onClick={() => setActiveTabOverview('security')}
            >
              <ShieldCheck size={14} />
              <span>Cơ Cấu TSĐB</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm px-3 py-1.5 rounded-2 d-flex align-items-center gap-1.5 ${
                activeTabOverview === 'top50'
                  ? 'btn-primary text-white fw-bold shadow-xs'
                  : 'btn-light text-muted'
              }`}
              onClick={() => setActiveTabOverview('top50')}
            >
              <Award size={14} />
              <span>Top 50 Dư Nợ</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm px-3 py-1.5 rounded-2 d-flex align-items-center gap-1.5 ${
                activeTabOverview === 'trend'
                  ? 'btn-primary text-white fw-bold shadow-xs'
                  : 'btn-light text-muted'
              }`}
              onClick={() => setActiveTabOverview('trend')}
            >
              <TrendingUp size={14} />
              <span>Diễn Biến Tháng</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-xs btn-outline-primary d-flex align-items-center gap-1 py-1 px-2.5 rounded-2"
            onClick={() => onNavigate && onNavigate('credit_statement')}
          >
            <span>Xem toàn bộ sao kê</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        {/* 1. Tab Địa Bàn & Sản Phẩm Cho Vay */}
        {activeTabOverview === 'areas' && (
          <div className="d-flex flex-column gap-3">
            <div className="row g-3">
              <div className="col-12 col-xl-7">
                <CommuneComparisonChart
                  areaStats={areaStats}
                  totalDuNo={totalDuNo}
                />
              </div>
              <div className="col-12 col-xl-5">
                <LoanProductDonutChart
                  loanGroups={stats.loanGroups || []}
                  loanTypes={stats.loanTypes || []}
                  totalDuNo={totalDuNo}
                />
              </div>
            </div>

            {/* Bảng tóm tắt theo xã */}
            <div className="table-responsive">
              <table className="table table-hover table-custom align-middle mb-0" style={{ fontSize: '0.84rem' }}>
                <thead className="table-light text-secondary text-uppercase" style={{ fontSize: '0.72rem' }}>
                  <tr>
                    <th>Địa Bàn Xã</th>
                    <th className="text-end">Dư Nợ Thực Tế</th>
                    <th className="text-center">Số Hợp Đồng</th>
                    <th className="text-center">Số Khách Vay</th>
                    <th className="text-end">Dư Nợ BQ / HĐ</th>
                    <th className="text-center">Tỷ Trọng</th>
                  </tr>
                </thead>
                <tbody>
                  {areaStats.map((area, idx) => {
                    const duNo = Number(area.duNo) || Number(area.duno) || 0;
                    const countHD = Number(area.countHD) || 0;
                    const countKH = Number(area.countKH) || 0;
                    const pct = totalDuNo > 0 ? ((duNo / totalDuNo) * 100).toFixed(1) : 0;
                    const avgHD = countHD > 0 ? Math.round(duNo / countHD) : 0;

                    return (
                      <tr key={idx}>
                        <td className="fw-bold text-dark">
                          <div className="d-flex align-items-center gap-1.5">
                            <Building2 size={14} className="text-primary" />
                            <span>{area.name}</span>
                          </div>
                        </td>
                        <td className="text-end fw-bold num-tabular font-numeric text-primary">
                          {formatCurrencyVN(duNo)}
                        </td>
                        <td className="text-center font-numeric">{countHD}</td>
                        <td className="text-center font-numeric">{countKH}</td>
                        <td className="text-end font-numeric text-muted">{formatCompactVN(avgHD)}</td>
                        <td className="text-center">
                          <span className="badge bg-primary-subtle text-primary font-monospace fw-bold">{pct}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Tab Cán Bộ Tín Dụng */}
        {activeTabOverview === 'cbtd' && (
          <div className="table-responsive">
            <table className="table table-hover table-custom align-middle mb-0" style={{ fontSize: '0.84rem' }}>
              <thead className="table-light text-secondary text-uppercase" style={{ fontSize: '0.72rem' }}>
                <tr>
                  <th>Cán Bộ Tín Dụng</th>
                  <th>Mã CBTD</th>
                  <th className="text-end">Dư Nợ Quản Lý</th>
                  <th className="text-center">Số Hợp Đồng</th>
                  <th className="text-center">Số Khách Vay</th>
                  <th className="text-center">Tỷ Trọng Toàn Quỹ</th>
                </tr>
              </thead>
              <tbody>
                {cbtdStats.map((cbtd, idx) => {
                  const duNo = Number(cbtd.duNo) || 0;
                  const countHD = Number(cbtd.countHD) || 0;
                  const countKH = Number(cbtd.countKH) || 0;
                  const pct = totalDuNo > 0 ? ((duNo / totalDuNo) * 100).toFixed(1) : 0;

                  return (
                    <tr key={idx}>
                      <td className="fw-bold text-dark">
                        <div className="d-flex align-items-center gap-1.5">
                          <User size={14} className="text-secondary" />
                          <span>{cbtd.tenCBTD || cbtd.name || 'Cán bộ'}</span>
                        </div>
                      </td>
                      <td className="font-monospace text-muted">{cbtd.username || cbtd.code || ''}</td>
                      <td className="text-end fw-bold num-tabular font-numeric text-primary">
                        {formatCurrencyVN(duNo)}
                      </td>
                      <td className="text-center font-numeric">{countHD}</td>
                      <td className="text-center font-numeric">{countKH}</td>
                      <td className="text-center">
                        <span className="badge bg-success-subtle text-success font-monospace fw-bold">{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Tab Cơ Cấu TSĐB */}
        {activeTabOverview === 'security' && (
          <SecurityTypeBreakdown
            securityTypes={stats.securityTypes || []}
            totalDuNo={totalDuNo}
          />
        )}

        {/* 4. Tab Top 50 Dư Nợ */}
        {activeTabOverview === 'top50' && (
          <Top50DebtSection
            top50DuNoDenNgay={stats.top50DuNoDenNgay || []}
            top50DuNoBinhQuanCuoiThang={stats.top50DuNoBinhQuanCuoiThang || []}
            totalDuNo={totalDuNo}
            onOpenCustomerQuickView={onOpenCustomerQuickView}
          />
        )}

        {/* 5. Tab Diễn Biến Theo Tháng */}
        {activeTabOverview === 'trend' && (
          <MonthlyDebtTrendChart
            monthlyDebtTrend={stats.monthlyDebtTrend || []}
          />
        )}
      </div>

      {/* 4. Phím Tắt Tác Vụ Nhanh */}
      <div className="card-modern p-3">
        <h6 className="fw-bold text-dark small mb-2.5">Lối Tắt Thao Tác Nghiệp Vụ</h6>
        <div className="row g-2">
          <div className="col-6 col-md-3">
            <button
              type="button"
              className="btn btn-light w-100 text-start p-2.5 rounded-2.5 border d-flex align-items-center gap-2 hover-lift"
              onClick={() => onNavigate && onNavigate('credit_statement')}
            >
              <FileSpreadsheet size={16} className="text-primary" />
              <div>
                <strong className="d-block text-dark small">Sao Kê Tín Dụng</strong>
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>Đến ngày, theo tháng, năm</span>
              </div>
            </button>
          </div>

          <div className="col-6 col-md-3">
            <button
              type="button"
              className="btn btn-light w-100 text-start p-2.5 rounded-2.5 border d-flex align-items-center gap-2 hover-lift"
              onClick={() => onNavigate && onNavigate('customer360')}
            >
              <Users size={16} className="text-success" />
              <div>
                <strong className="d-block text-dark small">Tra Cứu Khách Hàng</strong>
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>Hồ sơ 360°, khế ước vay</span>
              </div>
            </button>
          </div>

          <div className="col-6 col-md-3">
            <button
              type="button"
              className="btn btn-light w-100 text-start p-2.5 rounded-2.5 border d-flex align-items-center gap-2 hover-lift"
              onClick={() => onNavigate && onNavigate('debit_batch')}
            >
              <Zap size={16} className="text-warning" />
              <div>
                <strong className="d-block text-dark small">Đợt Trích Nợ</strong>
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>Tự động kỳ 05, 15, 25</span>
              </div>
            </button>
          </div>

          <div className="col-6 col-md-3">
            <button
              type="button"
              className="btn btn-light w-100 text-start p-2.5 rounded-2.5 border d-flex align-items-center gap-2 hover-lift"
              onClick={() => onNavigate && onNavigate('appraisal')}
            >
              <FileCheck2 size={16} className="text-indigo" style={{ color: '#4338ca' }} />
              <div>
                <strong className="d-block text-dark small">Thẩm Định Tín Dụng</strong>
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>Lập hồ sơ & chấm điểm CIC</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
