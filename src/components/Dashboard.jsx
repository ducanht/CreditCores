import React, { useState, useMemo } from 'react';
import {
  Landmark,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  ArrowLeftRight,
  FileCheck2,
  RefreshCw,
  Calendar,
  Layers,
  MapPin,
  PieChart,
  Bell,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  AlertTriangle,
  HelpCircle,
  User,
  Briefcase,
  Filter,
  Search,
  Table,
  LayoutGrid,
  Check,
  Building2,
  BarChart3
} from 'lucide-react';
import { formatCurrencyVN, formatCurrency, getTodayVN } from '../utils/dateUtils';
import CommuneComparisonChart from './dashboard/CommuneComparisonChart';
import LoanProductDonutChart from './dashboard/LoanProductDonutChart';

// Helper rút gọn tiền tệ sang Tỷ / Triệu hiển thị trực quan
const formatCompactVN = (amount) => {
  const num = Number(amount) || 0;
  if (Math.abs(num) >= 1e9) {
    const val = (num / 1e9).toFixed(3).replace(/\.?0+$/, '').replace('.', ',');
    return `${val} tỷ`;
  }
  if (Math.abs(num) >= 1e6) {
    const val = (num / 1e6).toFixed(1).replace(/\.?0+$/, '').replace('.', ',');
    return `${val} tr`;
  }
  return num.toLocaleString('vi-VN') + ' đ';
};

// Helper tính tỷ trọng phần trăm chuẩn dạng số (làm tròn 1 chữ số thập phân)
const calcPercentNum = (part, total) => {
  const p = Number(part) || 0;
  const t = Number(total) || 0;
  if (t <= 0) return 0;
  return Number(((p / t) * 100).toFixed(1));
};

// --- Skeleton Loader cho Dashboard ---
function DashboardSkeleton() {
  return (
    <div className="dashboard-container d-flex flex-column gap-4 pb-4 content-fade-in">
      <div className="card-modern p-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span className="skeleton skeleton-text" style={{ width: 280, height: 24 }} />
          <span className="skeleton skeleton-btn" style={{ width: 220, height: 32 }} />
        </div>
      </div>
      <div className="row g-3">
        {[1, 2, 3, 4].map(i => (
          <div className="col-12 col-sm-6 col-xl-3" key={i}>
            <div className="skeleton-card" style={{ minHeight: 120 }}>
              <span className="skeleton skeleton-text sm" style={{ width: '60%' }} />
              <span className="skeleton skeleton-stat mt-2" style={{ width: '80%' }} />
              <div className="d-flex justify-content-between mt-3 pt-2 border-top">
                <span className="skeleton skeleton-text sm" style={{ width: '45%' }} />
                <span className="skeleton skeleton-badge" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card-modern p-3">
        <div className="row g-3">
          <div className="col-12 col-lg-8">
            <span className="skeleton skeleton-title mb-3" />
            <div className="d-flex flex-column gap-2">
              <span className="skeleton skeleton-card" style={{ height: 68 }} />
              <span className="skeleton skeleton-card" style={{ height: 68 }} />
              <span className="skeleton skeleton-card" style={{ height: 68 }} />
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <span className="skeleton skeleton-title mb-3" />
            <span className="skeleton skeleton-card" style={{ height: 220 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ stats, onNavigate, onRefresh, syncStatus, currentUser, onOpenCustomerQuickView }) {
  if (!stats) {
    return <DashboardSkeleton />;
  }

  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Phân hệ hiển thị: 'communes' (3 Xã & Thôn) | 'cbtd' (CBTD Portfolio) | 'products' (Cơ Cấu Cho Vay & Nghiệp Vụ)
  const [activeSubView, setActiveSubView] = useState('communes');

  // Chế độ xem: 'cards' (Thẻ trực quan) | 'table' (Bảng đối soát chi tiết)
  const [viewMode, setViewMode] = useState('cards');

  // Bộ lọc địa bàn
  const [selectedCommuneFilter, setSelectedCommuneFilter] = useState('ALL');

  // Từ khóa tìm kiếm nhanh thôn / cán bộ
  const [searchQuery, setSearchQuery] = useState('');

  // Trạng thái mở rộng accordion từng xã
  const [expandedCommunes, setExpandedCommunes] = useState({
    'Xã Quý Lộc': true,
    'Xã Yên Trường': true,
    'Xã Vĩnh Lộc': true
  });

  // Trạng thái mở rộng accordion từng CBTD
  const [expandedCbtds, setExpandedCbtds] = useState({
    'qtdyentho.huyennhu': true,
    'qtdyentho.luudinh': true,
    'qtdyentho.huunhan': true
  });

  const toggleCommuneExpand = (name) => {
    setExpandedCommunes(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleCbtdExpand = (user) => {
    setExpandedCbtds(prev => ({ ...prev, [user]: !prev[user] }));
  };

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Tính toán các chỉ số phái sinh
  const totalDuNo = stats?.totalDuNo || 0;
  const totalHopDong = stats?.totalHopDong || 0;
  const totalThanhVienVay = stats?.totalThanhVienVay || 435;
  const duNoBinhQuanHD = stats?.duNoBinhQuanHD || (totalHopDong > 0 ? Math.round(totalDuNo / totalHopDong) : 0);
  const duNoBinhQuanTV = stats?.duNoBinhQuanTV || (totalThanhVienVay > 0 ? Math.round(totalDuNo / totalThanhVienVay) : 0);
  const laiSuatBinhQuan = stats?.laiSuatBinhQuan || 10.4;
  const totalDuThuLai = stats?.totalDuThuLai || 0;
  const totalKhachHangTrichNo = stats?.totalKhachHangTrichNo || 0;
  const totalNoTon = stats?.totalNoTon || 0;
  const countNoTon = stats?.countNoTon || 0;
  const pendingAppraisals = stats?.pendingAppraisals || 0;
  const pendingInspections = stats?.pendingInspections || 0;

  // Tỷ lệ bao phủ trích nợ tự động trên số hợp đồng
  const autoDebitCoverageRate = totalHopDong > 0 ? Math.min(100, Math.round((totalKhachHangTrichNo / totalHopDong) * 100)) : 0;

  // Dữ liệu 3 Xã chuẩn hóa
  const areaStats = useMemo(() => {
    if (!stats?.areaStats || !Array.isArray(stats.areaStats)) return [];
    return stats.areaStats;
  }, [stats?.areaStats]);

  // Dữ liệu CBTD chuẩn hóa
  const cbtdStats = useMemo(() => {
    if (!stats?.cbtdStats || !Array.isArray(stats.cbtdStats)) return [];
    return stats.cbtdStats;
  }, [stats?.cbtdStats]);

  // Dữ liệu Cơ cấu cho vay 3 nhóm chính
  const loanGroups = useMemo(() => {
    if (stats?.loanGroups && Array.isArray(stats.loanGroups)) return stats.loanGroups;
    if (stats?.loanTypes && Array.isArray(stats.loanTypes)) return stats.loanTypes;
    return [];
  }, [stats?.loanGroups, stats?.loanTypes]);

  // Lọc danh sách Xã & Thôn theo Bộ lọc và Từ khóa
  const filteredAreas = useMemo(() => {
    return areaStats
      .filter(area => selectedCommuneFilter === 'ALL' || area.name === selectedCommuneFilter)
      .map(area => {
        if (!searchQuery.trim()) return area;
        const q = searchQuery.toLowerCase().trim();
        const matchesArea = area.name.toLowerCase().includes(q) || (area.cbqlName && area.cbqlName.toLowerCase().includes(q));
        const filteredThons = (area.thons || []).filter(th => th.name.toLowerCase().includes(q));
        if (matchesArea) return area;
        if (filteredThons.length > 0) {
          return { ...area, thons: filteredThons };
        }
        return null;
      })
      .filter(Boolean);
  }, [areaStats, selectedCommuneFilter, searchQuery]);

  // Lọc CBTD theo từ khóa
  const filteredCbtds = useMemo(() => {
    if (!searchQuery.trim()) return cbtdStats;
    const q = searchQuery.toLowerCase().trim();
    return cbtdStats.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.user.toLowerCase().includes(q) || 
      c.assignedArea.toLowerCase().includes(q) ||
      (c.communes && c.communes.some(cm => (cm.thons || []).some(th => th.name.toLowerCase().includes(q))))
    );
  }, [cbtdStats, searchQuery]);

  // Tổng hợp toàn Quỹ cho bảng đối soát
  const summaryTotals = useMemo(() => {
    let nn = 0, td = 0, tm = 0;
    areaStats.forEach(a => {
      if (a.loanGroups) {
        nn += (a.loanGroups['Nông nghiệp'] || 0);
        td += (a.loanGroups['Tiêu dùng - Đời sống'] || 0);
        tm += (a.loanGroups['Thương mại - Dịch vụ'] || 0);
      }
    });
    return {
      duNo: totalDuNo,
      countHD: totalHopDong,
      countKH: totalThanhVienVay,
      duNoBinhQuanHD,
      duNoBinhQuanTV,
      nn,
      td,
      tm
    };
  }, [areaStats, totalDuNo, totalHopDong, totalThanhVienVay, duNoBinhQuanHD, duNoBinhQuanTV]);

  return (
    <div className="dashboard-container d-flex flex-column gap-4 pb-4">
      {/* ========================================================================= */}
      {/* 🌟 1. EXECUTIVE HEADER: CHÀO MỪNG, TRẠNG THÁI & BỘ LỌC CHU KỲ           */}
      {/* ========================================================================= */}
      <div className="card-modern p-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
          <div className="d-flex align-items-center gap-2.5 text-muted small flex-wrap">
            <span>Xin chào, <strong className="text-dark">{currentUser?.fullName || 'Cán bộ Quản trị'}</strong> ({currentUser?.role || 'ADMIN'})</span>
            <span>•</span>
            <span className="d-flex align-items-center gap-1">
              <Calendar size={13} /> {getTodayVN()}
            </span>
            <span>•</span>
            <span className="d-flex align-items-center gap-1 text-success fw-medium">
              <span className="p-1 rounded-circle bg-success d-inline-block"></span> Core SQL: {syncStatus?.status === 'SUCCESS' ? 'Đã đồng bộ' : 'Online'}
            </span>
          </div>

          <div className="d-flex align-items-center gap-2 w-100 w-md-auto justify-content-between justify-content-md-end">
            {/* Bộ chọn chu kỳ */}
            <div className="seg-control" role="tablist">
              <button
                type="button"
                className={`seg-item ${selectedPeriod === 'month' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('month')}
              >
                Tháng Này
              </button>
              <button
                type="button"
                className={`seg-item ${selectedPeriod === 'quarter' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('quarter')}
              >
                Quý Này
              </button>
              <button
                type="button"
                className={`seg-item ${selectedPeriod === 'year' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('year')}
              >
                Năm 2026
              </button>
            </div>

            {/* Nút Làm Mới */}
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-2.5 py-1.5"
              onClick={handleManualRefresh}
              title="Làm mới số liệu từ máy chủ Google Apps Script"
            >
              <RefreshCw size={13} className={isRefreshing ? 'spin-animation text-primary' : ''} />
              <span className="d-none d-sm-inline small">{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 2. HỆ THỐNG 4 THẺ BENTO KPI METRICS CAO CẤP                             */}
      {/* ========================================================================= */}
      <div className="row g-3">
        {/* KPI 1: Tổng Dư Nợ Tín Dụng */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="kpi-bento-card h-100 cursor-pointer"
            onClick={() => onNavigate('customer360')}
            title="Bấm để xem danh sách khách hàng & hợp đồng"
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.74rem' }}>
                Tổng Dư Nợ Tín Dụng
              </span>
              <div className="kpi-icon-wrapper" style={{ '--icon-bg': 'rgba(154, 205, 50, 0.15)', '--icon-color': '#4d7c0f' }}>
                <Landmark size={18} />
              </div>
            </div>
            <div>
              <h3 className="fw-bold text-dark mb-1 fs-4 num-tabular">
                {formatCurrencyVN(totalDuNo)}
              </h3>
              <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top">
                <span className="d-flex align-items-center gap-1 text-success fw-semibold">
                  <TrendingUp size={13} /> {totalHopDong} HĐ • {totalThanhVienVay} TV
                </span>
                <span className="text-primary font-monospace" style={{ fontSize: '0.72rem' }}>Tra cứu HĐTD →</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Dư Nợ Bình Quân & Lãi Suất */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="kpi-bento-card h-100 cursor-pointer"
            onClick={() => setActiveSubView('communes')}
            title="Bấm để xem phân tích địa bàn chi tiết"
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.74rem' }}>
                Dư Nợ Bình Quân & Lãi Suất
              </span>
              <div className="kpi-icon-wrapper" style={{ '--icon-bg': 'rgba(2, 132, 199, 0.15)', '--icon-color': '#0284c7' }}>
                <Users size={18} />
              </div>
            </div>
            <div>
              <div className="d-flex align-items-baseline gap-2 mb-1">
                <h4 className="fw-bold text-dark mb-0 fs-5 num-tabular">
                  {formatCompactVN(duNoBinhQuanHD)}
                </h4>
                <span className="text-muted small">/ Hợp đồng</span>
              </div>
              <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top">
                <span>BQ/Thành viên: <strong className="text-dark num-tabular">{formatCompactVN(duNoBinhQuanTV)}</strong></span>
                <span className="badge bg-info-subtle text-info fw-bold">LS BQ: {laiSuatBinhQuan}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Dự Thu Lãi Kỳ Này */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="kpi-bento-card h-100 cursor-pointer"
            onClick={() => onNavigate('debit_batch')}
            title="Bấm để xem hoặc khởi tạo đợt trích nợ"
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.74rem' }}>
                Dự Thu Lãi Kỳ Này
              </span>
              <div className="kpi-icon-wrapper" style={{ '--icon-bg': 'rgba(4, 120, 87, 0.15)', '--icon-color': '#047857' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div>
              <h3 className="fw-bold text-success mb-1 fs-4 num-tabular">
                {formatCurrencyVN(totalDuThuLai)}
              </h3>
              <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top">
                <span>Tính ngày thực tế TT14</span>
                <span className="text-success font-monospace" style={{ fontSize: '0.72rem' }}>3 Kỳ (05, 15, 25) →</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: Trích Nợ CASA & Nợ Tồn */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="kpi-bento-card h-100 cursor-pointer"
            onClick={() => onNavigate('debit_register')}
            title="Bấm để quản lý danh sách đăng ký trích nợ"
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.74rem' }}>
                Ủy Quyền CASA & Nợ Tồn
              </span>
              <div className="kpi-icon-wrapper" style={{ '--icon-bg': 'rgba(234, 88, 12, 0.15)', '--icon-color': '#ea580c' }}>
                <Zap size={18} />
              </div>
            </div>
            <div>
              <div className="d-flex align-items-baseline gap-2 mb-1">
                <h4 className="fw-bold text-dark mb-0 fs-5 num-tabular">
                  {totalKhachHangTrichNo} <span className="fs-6 fw-normal text-muted">TV trích nợ</span>
                </h4>
              </div>
              <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top">
                <span>Bao phủ: <strong className="text-dark">{autoDebitCoverageRate}%</strong> khách vay</span>
                <span className="text-danger fw-semibold">Nợ tồn: {formatCurrencyVN(totalNoTon)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🧭 3. THANH ĐIỀU HƯỚNG PHÂN HỆ THỐNG KÊ (GRID / FLEX-WRAP - KHÔNG KÉO CUỘN) */}
      {/* ========================================================================= */}
      <div className="card-modern p-2.5">
        <div className="row g-2 align-items-center">
          {/* 3 Nút phân hệ chính */}
          <div className="col-12 col-md-8">
            <div className="row g-1.5">
              <div className="col-12 col-sm-4">
                <button
                  type="button"
                  className={`btn w-100 text-start p-2 rounded-2.5 d-flex align-items-center justify-content-between border transition-all ${
                    activeSubView === 'communes'
                      ? 'btn-brand text-white fw-bold shadow-sm'
                      : 'btn-light text-dark hover-lift'
                  }`}
                  onClick={() => setActiveSubView('communes')}
                >
                  <div className="d-flex align-items-center gap-2">
                    <MapPin size={16} className={activeSubView === 'communes' ? 'text-white' : 'text-success'} />
                    <span className="small">Địa Bàn 3 Xã & Thôn</span>
                  </div>
                  <span className={`badge small ${activeSubView === 'communes' ? 'bg-white text-dark' : 'bg-success-subtle text-success'}`}>
                    12 Thôn
                  </span>
                </button>
              </div>

              <div className="col-12 col-sm-4">
                <button
                  type="button"
                  className={`btn w-100 text-start p-2 rounded-2.5 d-flex align-items-center justify-content-between border transition-all ${
                    activeSubView === 'cbtd'
                      ? 'btn-brand text-white fw-bold shadow-sm'
                      : 'btn-light text-dark hover-lift'
                  }`}
                  onClick={() => setActiveSubView('cbtd')}
                >
                  <div className="d-flex align-items-center gap-2">
                    <User size={16} className={activeSubView === 'cbtd' ? 'text-white' : 'text-primary'} />
                    <span className="small">CBTD Quản Lý Chi Tiết</span>
                  </div>
                  <span className={`badge small ${activeSubView === 'cbtd' ? 'bg-white text-dark' : 'bg-primary-subtle text-primary'}`}>
                    3 Cán Bộ
                  </span>
                </button>
              </div>

              <div className="col-12 col-sm-4">
                <button
                  type="button"
                  className={`btn w-100 text-start p-2 rounded-2.5 d-flex align-items-center justify-content-between border transition-all ${
                    activeSubView === 'products'
                      ? 'btn-brand text-white fw-bold shadow-sm'
                      : 'btn-light text-dark hover-lift'
                  }`}
                  onClick={() => setActiveSubView('products')}
                >
                  <div className="d-flex align-items-center gap-2">
                    <PieChart size={16} className={activeSubView === 'products' ? 'text-white' : 'text-warning'} />
                    <span className="small">Cơ Cấu Cho Vay & Vận Hành</span>
                  </div>
                  <span className={`badge small ${activeSubView === 'products' ? 'bg-white text-dark' : 'bg-warning-subtle text-warning-emphasis'}`}>
                    3 Nhóm
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Công cụ Lọc & Chế độ xem */}
          <div className="col-12 col-md-4">
            <div className="d-flex align-items-center gap-2 justify-content-md-end">
              {/* Ô tìm kiếm nhanh Thôn/Cán bộ */}
              <div className="input-group input-group-sm flex-grow-1" style={{ maxWidth: 220 }}>
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <Search size={13} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Tìm thôn, cán bộ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary border-start-0 border-end"
                    type="button"
                    onClick={() => setSearchQuery('')}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Nút chuyển đổi View Mode (Chỉ dùng khi ở tab Địa bàn hoặc CBTD) */}
              {activeSubView !== 'products' && (
                <div className="btn-group btn-group-sm bg-light p-0.5 rounded-2 border" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${viewMode === 'cards' ? 'btn-white shadow-sm fw-semibold text-dark' : 'btn-light text-muted'}`}
                    onClick={() => setViewMode('cards')}
                    title="Chế độ xem Thẻ Bento trực quan"
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${viewMode === 'table' ? 'btn-white shadow-sm fw-semibold text-dark' : 'btn-light text-muted'}`}
                    onClick={() => setViewMode('table')}
                    title="Chế độ xem Bảng đối soát chi tiết"
                  >
                    <Table size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📍 PHÂN HỆ 1: THỐNG KÊ ĐỊA BÀN 3 XÃ & CHI TIẾT TỪNG THÔN                   */}
      {/* ========================================================================= */}
      {activeSubView === 'communes' && (
        <div className="d-flex flex-column gap-4">
          {/* 📊 KHỐI BIỂU ĐỒ SO SÁNH DƯ NỢ 3 XÃ/THÔN & TỶ TRỌNG SẢN PHẨM VAY */}
          <div className="row g-3">
            <div className="col-12 col-xl-7">
              <CommuneComparisonChart
                areaStats={areaStats}
                totalDuNo={totalDuNo}
                selectedCommune={selectedCommuneFilter}
                onSelectCommune={(val) => setSelectedCommuneFilter(val)}
              />
            </div>
            <div className="col-12 col-xl-5">
              <LoanProductDonutChart
                areaStats={areaStats}
                totalDuNo={totalDuNo}
                selectedCommune={selectedCommuneFilter}
                onSelectCommune={(val) => setSelectedCommuneFilter(val)}
              />
            </div>
          </div>

          {/* Thanh Tóm Tắt Tỷ Trọng 3 Xã */}
          <div className="row g-3">
            {areaStats.map((area, idx) => {
              const colors = [
                { bg: 'bg-success-subtle', text: 'text-success', border: 'border-success' },
                { bg: 'bg-primary-subtle', text: 'text-primary', border: 'border-primary' },
                { bg: 'bg-info-subtle', text: 'text-info', border: 'border-info' }
              ];
              const theme = colors[idx % colors.length];
              const percentNum = calcPercentNum(area.duNo, totalDuNo);
              const isSelected = selectedCommuneFilter === area.name;

              return (
                <div key={area.key || area.name} className="col-12 col-md-4">
                  <div
                    className={`card-modern p-3 cursor-pointer h-100 border-2 transition-all ${
                      isSelected ? `${theme.border} shadow-sm` : 'border-light-subtle'
                    }`}
                    onClick={() => setSelectedCommuneFilter(isSelected ? 'ALL' : area.name)}
                    title={`Bấm để ${isSelected ? 'xem tất cả các xã' : `lọc riêng ${area.name}`}`}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1.5">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold text-dark">{area.name}</span>
                        {isSelected && <span className="badge bg-success text-white small">Đang lọc</span>}
                      </div>
                      <span className={`badge ${theme.bg} ${theme.text} fw-bold`}>
                        {area.rate || `${percentNum}%`}
                      </span>
                    </div>

                    <div className="d-flex align-items-baseline justify-content-between mb-2">
                      <h4 className="fw-bold text-dark mb-0 fs-5 num-tabular">
                        {formatCompactVN(area.duNo)}
                      </h4>
                      <span className="text-muted small num-tabular">
                        {area.countHD || 0} HĐ • {area.countKH || 0} TV
                      </span>
                    </div>

                    {/* Mini progress cơ cấu cho vay tại xã */}
                    <div className="progress mb-2" style={{ height: '6px' }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${calcPercentNum(area.loanGroups?.['Nông nghiệp'], area.duNo)}%` }}
                        title="Nông nghiệp"
                      ></div>
                      <div
                        className="progress-bar bg-primary"
                        style={{ width: `${calcPercentNum(area.loanGroups?.['Tiêu dùng - Đời sống'], area.duNo)}%` }}
                        title="Tiêu dùng"
                      ></div>
                      <div
                        className="progress-bar bg-warning"
                        style={{ width: `${calcPercentNum(area.loanGroups?.['Thương mại - Dịch vụ'], area.duNo)}%` }}
                        title="Thương mại"
                      ></div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: '0.73rem' }}>
                      <span className="d-flex align-items-center gap-1 text-primary fw-medium">
                        <User size={12} /> {area.cbqlName}
                      </span>
                      <span>{(area.thons || []).length} thôn</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CHẾ ĐỘ 1: XEM DẠNG THẺ (CARDS VIEW) */}
          {viewMode === 'cards' && (
            <div className="d-flex flex-column gap-4">
              {filteredAreas.map((commune, cIdx) => {
                const isExpanded = expandedCommunes[commune.name] !== false;
                const cPercent = calcPercentNum(commune.duNo, totalDuNo);
                const nnVal = commune.loanGroups?.['Nông nghiệp'] || 0;
                const tdVal = commune.loanGroups?.['Tiêu dùng - Đời sống'] || 0;
                const tmVal = commune.loanGroups?.['Thương mại - Dịch vụ'] || 0;

                return (
                  <div key={commune.key || commune.name} className="card-modern p-3 p-md-4">
                    {/* Header Xã */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 pb-3 border-bottom">
                      <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                          <h4 className="fw-bold text-dark m-0 font-heading fs-5 d-flex align-items-center gap-2">
                            <MapPin size={20} className="text-success" />
                            {commune.name}
                          </h4>
                          <span className="badge bg-success-subtle text-success fw-bold">
                            Tỷ trọng: {commune.rate || `${cPercent}%`}
                          </span>
                          <span className="badge bg-light text-muted border small">
                            {commune.subText || 'Địa bàn phục vụ'}
                          </span>
                        </div>
                        <div className="text-muted small d-flex align-items-center gap-3 flex-wrap">
                          <span>
                            Cán bộ quản lý: <strong className="text-dark">{commune.cbqlName}</strong>{' '}
                            <span className="font-monospace text-primary">({commune.cbqlUser})</span>
                          </span>
                          <span>•</span>
                          <span>
                            Quy mô: <strong className="text-dark num-tabular">{commune.countHD}</strong> hợp đồng •{' '}
                            <strong className="text-dark num-tabular">{commune.countKH}</strong> thành viên
                          </span>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-3 w-100 w-md-auto justify-content-between justify-content-md-end">
                        <div className="text-end">
                          <div className="text-muted small">Dư nợ địa bàn xã</div>
                          <div className="fw-bold text-dark fs-5 num-tabular">
                            {formatCurrencyVN(commune.duNo)}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary p-1.5 rounded-2"
                          onClick={() => toggleCommuneExpand(commune.name)}
                          title={isExpanded ? 'Thu gọn danh sách thôn' : 'Mở rộng chi tiết từng thôn'}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Thống kê Cơ cấu 3 nhóm cho vay tại Xã */}
                    <div className="mt-3 p-3 bg-light rounded-3 border">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-semibold text-dark small">Cơ cấu cho vay theo 3 nhóm tại {commune.name}:</span>
                        <span className="text-muted small num-tabular">Tổng 100%</span>
                      </div>

                      {/* Thanh phân bổ 3 màu */}
                      <div className="progress mb-2.5" style={{ height: '8px' }}>
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${calcPercentNum(nnVal, commune.duNo)}%` }}
                          title={`Nông nghiệp: ${formatCompactVN(nnVal)} (${calcPercentNum(nnVal, commune.duNo)}%)`}
                        ></div>
                        <div
                          className="progress-bar bg-primary"
                          style={{ width: `${calcPercentNum(tdVal, commune.duNo)}%` }}
                          title={`Tiêu dùng: ${formatCompactVN(tdVal)} (${calcPercentNum(tdVal, commune.duNo)}%)`}
                        ></div>
                        <div
                          className="progress-bar bg-warning"
                          style={{ width: `${calcPercentNum(tmVal, commune.duNo)}%` }}
                          title={`Thương mại: ${formatCompactVN(tmVal)} (${calcPercentNum(tmVal, commune.duNo)}%)`}
                        ></div>
                      </div>

                      {/* 3 Cột số liệu cơ cấu */}
                      <div className="row g-2 text-center text-sm-start">
                        <div className="col-12 col-sm-4">
                          <div className="p-2 rounded bg-white border">
                            <div className="d-flex align-items-center gap-1.5 mb-0.5">
                              <span className="p-1 rounded-circle bg-success d-inline-block"></span>
                              <span className="text-muted small">Nông Nghiệp</span>
                            </div>
                            <div className="fw-bold text-dark num-tabular small">
                              {formatCompactVN(nnVal)}{' '}
                              <span className="text-success fw-bold">({calcPercentNum(nnVal, commune.duNo)}%)</span>
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-sm-4">
                          <div className="p-2 rounded bg-white border">
                            <div className="d-flex align-items-center gap-1.5 mb-0.5">
                              <span className="p-1 rounded-circle bg-primary d-inline-block"></span>
                              <span className="text-muted small">Tiêu Dùng - Đời Sống</span>
                            </div>
                            <div className="fw-bold text-dark num-tabular small">
                              {formatCompactVN(tdVal)}{' '}
                              <span className="text-primary fw-bold">({calcPercentNum(tdVal, commune.duNo)}%)</span>
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-sm-4">
                          <div className="p-2 rounded bg-white border">
                            <div className="d-flex align-items-center gap-1.5 mb-0.5">
                              <span className="p-1 rounded-circle bg-warning d-inline-block"></span>
                              <span className="text-muted small">Thương Mại - Dịch Vụ</span>
                            </div>
                            <div className="fw-bold text-dark num-tabular small">
                              {formatCompactVN(tmVal)}{' '}
                              <span className="text-warning-emphasis fw-bold">({calcPercentNum(tmVal, commune.duNo)}%)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Danh sách các Thôn trong Xã (Accordion Content) */}
                    {isExpanded && (
                      <div className="mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2.5">
                          <span className="fw-bold text-dark small text-uppercase" style={{ letterSpacing: '0.3px' }}>
                            Danh Sách Chi Tiết Các Thôn ({commune.thons?.length || 0} thôn):
                          </span>
                          <span className="text-muted small">Dư nợ BQ/HĐ: {formatCompactVN(commune.duNoBinhQuanHD)}</span>
                        </div>

                        <div className="row g-3">
                          {(commune.thons || []).map((thon) => {
                            const thNN = thon.loanGroups?.['Nông nghiệp'] || 0;
                            const thTD = thon.loanGroups?.['Tiêu dùng - Đời sống'] || 0;
                            const thTM = thon.loanGroups?.['Thương mại - Dịch vụ'] || 0;
                            const thTotal = thon.duno || 1;

                            return (
                              <div key={thon.name} className="col-12 col-md-6 col-xl-4">
                                <div className="p-3 bg-white rounded-3 border h-100 hover-lift d-flex flex-column justify-content-between">
                                  <div>
                                    {/* Tiêu đề Thôn & Tỷ trọng */}
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <div>
                                        <h6 className="fw-bold text-dark m-0">{thon.name}</h6>
                                        <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                          {commune.name}
                                        </span>
                                      </div>
                                      <div className="text-end">
                                        <span className="badge bg-success-subtle text-success fw-bold small">
                                          {thon.rateCommune || `${calcPercentNum(thon.duno, commune.duNo)}%`} xã
                                        </span>
                                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                          {thon.rateTotal || `${calcPercentNum(thon.duno, totalDuNo)}%`} quỹ
                                        </div>
                                      </div>
                                    </div>

                                    {/* Dư nợ & Số lượng HĐ/TV */}
                                    <div className="mb-2.5">
                                      <div className="fw-bold text-dark fs-5 num-tabular">
                                        {formatCurrencyVN(thon.duno)}
                                      </div>
                                      <div className="d-flex align-items-center gap-2 text-muted small mt-1">
                                        <span className="badge bg-light text-dark border">
                                          {thon.countHD} HĐ
                                        </span>
                                        <span>•</span>
                                        <span className="badge bg-light text-dark border">
                                          {thon.countKH} TV
                                        </span>
                                        <span>•</span>
                                        <span className="num-tabular" style={{ fontSize: '0.72rem' }}>
                                          BQ: {formatCompactVN(thon.duNoBinhQuanHD)}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Cơ cấu 3 nhóm cho vay của Thôn */}
                                    <div className="pt-2 border-top">
                                      <div className="d-flex justify-content-between align-items-center mb-1 text-muted" style={{ fontSize: '0.72rem' }}>
                                        <span>Cơ cấu cho vay:</span>
                                        <span>NN / TD / TM</span>
                                      </div>

                                      {/* Mini bar */}
                                      <div className="progress mb-2" style={{ height: '5px' }}>
                                        <div
                                          className="progress-bar bg-success"
                                          style={{ width: `${calcPercentNum(thNN, thTotal)}%` }}
                                          title={`Nông nghiệp: ${formatCompactVN(thNN)}`}
                                        ></div>
                                        <div
                                          className="progress-bar bg-primary"
                                          style={{ width: `${calcPercentNum(thTD, thTotal)}%` }}
                                          title={`Tiêu dùng: ${formatCompactVN(thTD)}`}
                                        ></div>
                                        <div
                                          className="progress-bar bg-warning"
                                          style={{ width: `${calcPercentNum(thTM, thTotal)}%` }}
                                          title={`Thương mại: ${formatCompactVN(thTM)}`}
                                        ></div>
                                      </div>

                                      {/* Chi tiết từng nhóm */}
                                      <div className="d-flex flex-column gap-1" style={{ fontSize: '0.73rem' }}>
                                        <div className="d-flex justify-content-between align-items-center">
                                          <span className="d-flex align-items-center gap-1 text-muted">
                                            <span className="p-0.5 rounded-circle bg-success d-inline-block"></span>
                                            Nông nghiệp:
                                          </span>
                                          <span className="fw-semibold text-dark num-tabular">
                                            {formatCompactVN(thNN)} ({calcPercentNum(thNN, thTotal)}%)
                                          </span>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center">
                                          <span className="d-flex align-items-center gap-1 text-muted">
                                            <span className="p-0.5 rounded-circle bg-primary d-inline-block"></span>
                                            Tiêu dùng - Đời sống:
                                          </span>
                                          <span className="fw-semibold text-dark num-tabular">
                                            {formatCompactVN(thTD)} ({calcPercentNum(thTD, thTotal)}%)
                                          </span>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center">
                                          <span className="d-flex align-items-center gap-1 text-muted">
                                            <span className="p-0.5 rounded-circle bg-warning d-inline-block"></span>
                                            Thương mại - Dịch vụ:
                                          </span>
                                          <span className="fw-semibold text-dark num-tabular">
                                            {formatCompactVN(thTM)} ({calcPercentNum(thTM, thTotal)}%)
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* CHẾ ĐỘ 2: XEM DẠNG BẢNG ĐỐI SOÁT CHI TIẾT (TABLE VIEW) */}
            {viewMode === 'table' && (
              <div className="card-modern p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold m-0 text-slate-900 font-heading">
                      Bảng Đối Soát Dư Nợ Theo Địa Bàn Xã & Thôn
                    </h5>
                    <span className="text-muted small">Chi tiết số liệu đối soát toàn bộ 12 thôn thuộc 3 xã</span>
                  </div>
                  <span className="badge bg-light text-dark border fw-semibold">
                    Chuẩn mực QTDND
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="table table-custom align-middle">
                    <thead>
                      <tr>
                        <th>Địa Bàn (Xã / Thôn)</th>
                        <th>Cán Bộ Quản Lý</th>
                        <th className="text-end">Dư Nợ (VNĐ)</th>
                        <th className="text-center">% Quỹ</th>
                        <th className="text-center">% Xã</th>
                        <th className="text-center">Số HĐ</th>
                        <th className="text-center">Số TV</th>
                        <th className="text-end">Dư Nợ BQ/HĐ</th>
                        <th className="text-end">Nông Nghiệp</th>
                        <th className="text-end">Tiêu Dùng</th>
                        <th className="text-end">Thương Mại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAreas.map((commune) => {
                        const cNN = commune.loanGroups?.['Nông nghiệp'] || 0;
                        const cTD = commune.loanGroups?.['Tiêu dùng - Đời sống'] || 0;
                        const cTM = commune.loanGroups?.['Thương mại - Dịch vụ'] || 0;

                        return (
                          <React.Fragment key={commune.key || commune.name}>
                            {/* Dòng Tổng Xã */}
                            <tr className="table-light fw-bold">
                              <td>
                                <div className="d-flex align-items-center gap-1.5 text-dark">
                                  <MapPin size={15} className="text-success" />
                                  <span>{commune.name}</span>
                                </div>
                              </td>
                              <td>
                                <span className="text-primary">{commune.cbqlName}</span>
                              </td>
                              <td className="text-end text-dark num-tabular">
                                {formatCurrencyVN(commune.duNo)}
                              </td>
                              <td className="text-center text-success">
                                {commune.rate || `${calcPercentNum(commune.duNo, totalDuNo)}%`}
                              </td>
                              <td className="text-center text-muted">100%</td>
                              <td className="text-center num-tabular">{commune.countHD}</td>
                              <td className="text-center num-tabular">{commune.countKH}</td>
                              <td className="text-end num-tabular">
                                {formatCompactVN(commune.duNoBinhQuanHD)}
                              </td>
                              <td className="text-end num-tabular text-success">{formatCompactVN(cNN)}</td>
                              <td className="text-end num-tabular text-primary">{formatCompactVN(cTD)}</td>
                              <td className="text-end num-tabular text-warning-emphasis">{formatCompactVN(cTM)}</td>
                            </tr>

                            {/* Các dòng Thôn trực thuộc */}
                            {(commune.thons || []).map((thon) => {
                              const thNN = thon.loanGroups?.['Nông nghiệp'] || 0;
                              const thTD = thon.loanGroups?.['Tiêu dùng - Đời sống'] || 0;
                              const thTM = thon.loanGroups?.['Thương mại - Dịch vụ'] || 0;

                              return (
                                <tr key={thon.name} className="hover-highlight">
                                  <td className="ps-4">
                                    <span className="text-muted me-1">↳</span>
                                    <span className="fw-medium text-dark">{thon.name}</span>
                                  </td>
                                  <td className="text-muted small">{commune.cbqlUser}</td>
                                  <td className="text-end fw-semibold num-tabular">
                                    {formatCurrency(thon.duno)}
                                  </td>
                                  <td className="text-center text-muted small">
                                    {thon.rateTotal || `${calcPercentNum(thon.duno, totalDuNo)}%`}
                                  </td>
                                  <td className="text-center text-success small fw-semibold">
                                    {thon.rateCommune || `${calcPercentNum(thon.duno, commune.duNo)}%`}
                                  </td>
                                  <td className="text-center num-tabular">{thon.countHD}</td>
                                  <td className="text-center num-tabular">{thon.countKH}</td>
                                  <td className="text-end num-tabular text-muted small">
                                    {formatCompactVN(thon.duNoBinhQuanHD)}
                                  </td>
                                  <td className="text-end num-tabular small">{formatCompactVN(thNN)}</td>
                                  <td className="text-end num-tabular small">{formatCompactVN(thTD)}</td>
                                  <td className="text-end num-tabular small">{formatCompactVN(thTM)}</td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="table-dark fw-bold">
                        <td colSpan="2">TỔNG CỘNG TOÀN QUỸ (3 XÃ)</td>
                        <td className="text-end num-tabular text-white">{formatCurrencyVN(summaryTotals.duNo)}</td>
                        <td className="text-center text-white">100%</td>
                        <td className="text-center text-white">-</td>
                        <td className="text-center num-tabular text-white">{summaryTotals.countHD}</td>
                        <td className="text-center num-tabular text-white">{summaryTotals.countKH}</td>
                        <td className="text-end num-tabular text-white">{formatCompactVN(summaryTotals.duNoBinhQuanHD)}</td>
                        <td className="text-end num-tabular text-white">{formatCompactVN(summaryTotals.nn)}</td>
                        <td className="text-end num-tabular text-white">{formatCompactVN(summaryTotals.td)}</td>
                        <td className="text-end num-tabular text-white">{formatCompactVN(summaryTotals.tm)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👤 PHÂN HỆ 2: THỐNG KÊ CHI TIẾT THEO CÁN BỘ QUẢN LÝ (CBTD PORTFOLIO)      */}
      {/* ========================================================================= */}
      {activeSubView === 'cbtd' && (
        <div className="d-flex flex-column gap-4">
          {/* Header Giới Thiệu Cán Bộ Quản Lý */}
          <div className="card-modern p-3 p-md-4 bg-light-subtle">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
              <div>
                <h5 className="fw-bold m-0 text-slate-900 font-heading d-flex align-items-center gap-2">
                  <Briefcase size={20} className="text-primary" />
                  Danh Mục Quản Trị Tín Dụng Của Cán Bộ Quản Lý
                </h5>
                <span className="text-muted small">
                  Phân công phụ trách trực tiếp theo từng địa bàn xã & thôn nhằm giám sát nợ và đôn đốc thu nợ
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary text-white">3 Cán Bộ Phụ Trách</span>
              </div>
            </div>
          </div>

          {/* CHẾ ĐỘ XEM THẺ PORTFOLIO CỦA CÁN BỘ */}
          {viewMode === 'cards' && (
            <div className="row g-4">
              {filteredCbtds.map((cb, idx) => {
                const isExpanded = expandedCbtds[cb.user] !== false;
                const cRate = calcPercentNum(cb.duNo, totalDuNo);
                const cbNN = cb.loanGroups?.['Nông nghiệp'] || 0;
                const cbTD = cb.loanGroups?.['Tiêu dùng - Đời sống'] || 0;
                const cbTM = cb.loanGroups?.['Thương mại - Dịch vụ'] || 0;
                const initials = cb.name ? cb.name.split(' ').map(n => n[0]).join('').slice(-3) : 'CBTD';

                return (
                  <div key={cb.user} className="col-12">
                    <div className="card-modern p-4">
                      {/* Top Row: Avatar, Họ tên, Địa bàn, Dư nợ */}
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 pb-3 border-bottom">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="p-3 rounded-circle bg-primary-subtle text-primary fw-bold fs-5 d-flex align-items-center justify-content-center"
                            style={{ width: 54, height: 54 }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <h4 className="fw-bold text-dark m-0 fs-5">{cb.name}</h4>
                              <span className="badge bg-primary-subtle text-primary font-monospace small">
                                {cb.user}
                              </span>
                              <span className="badge bg-success-subtle text-success fw-bold">
                                Phụ trách: {cb.assignedArea}
                              </span>
                            </div>
                            <div className="text-muted small mt-1">
                              <span>{cb.role || 'Cán Bộ Tín Dụng Quản Lý'}</span>
                              <span className="mx-2">•</span>
                              <span>Quy mô: <strong className="text-dark num-tabular">{cb.countHD}</strong> HĐ • <strong className="text-dark num-tabular">{cb.countKH}</strong> TV vay</span>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-3 w-100 w-md-auto justify-content-between justify-content-md-end">
                          <div className="text-end">
                            <div className="text-muted small">Tổng Dư Nợ Phụ Trách</div>
                            <div className="fw-bold text-dark fs-5 num-tabular">
                              {formatCurrencyVN(cb.duNo)}{' '}
                              <span className="text-success fw-bold">({cb.rate || `${cRate}%`})</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary p-1.5 rounded-2"
                            onClick={() => toggleCbtdExpand(cb.user)}
                            title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Hàng 4 Chỉ Số Năng Suất Danh Mục Cán Bộ */}
                      <div className="row g-2.5 my-3">
                        <div className="col-6 col-md-3">
                          <div className="p-2.5 rounded-3 bg-light border text-center text-sm-start">
                            <div className="text-muted small" style={{ fontSize: '0.73rem' }}>Dư nợ BQ/Hợp đồng</div>
                            <div className="fw-bold text-dark num-tabular fs-6">
                              {formatCompactVN(cb.duNoBinhQuanHD)}
                            </div>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="p-2.5 rounded-3 bg-light border text-center text-sm-start">
                            <div className="text-muted small" style={{ fontSize: '0.73rem' }}>Dư nợ BQ/Thành viên</div>
                            <div className="fw-bold text-dark num-tabular fs-6">
                              {formatCompactVN(cb.duNoBinhQuanTV)}
                            </div>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="p-2.5 rounded-3 bg-light border text-center text-sm-start">
                            <div className="text-muted small" style={{ fontSize: '0.73rem' }}>Tỷ trọng trong Quỹ</div>
                            <div className="fw-bold text-success num-tabular fs-6">
                              {cb.rate || `${cRate}%`}
                            </div>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="p-2.5 rounded-3 bg-light border text-center text-sm-start">
                            <div className="text-muted small" style={{ fontSize: '0.73rem' }}>Thao tác nhanh</div>
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-primary fw-bold p-0 text-decoration-none"
                              onClick={() => onNavigate('customer360')}
                            >
                              Tra cứu khách hàng →
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Cơ cấu 3 nhóm cho vay của Cán bộ */}
                      <div className="p-3 bg-light rounded-3 border mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1.5">
                          <span className="fw-semibold text-dark small">
                            Cơ cấu cho vay của CBTD {cb.name}:
                          </span>
                          <span className="text-muted small num-tabular">100%</span>
                        </div>

                        <div className="progress mb-2" style={{ height: '7px' }}>
                          <div
                            className="progress-bar bg-success"
                            style={{ width: `${calcPercentNum(cbNN, cb.duNo)}%` }}
                            title={`Nông nghiệp: ${formatCompactVN(cbNN)}`}
                          ></div>
                          <div
                            className="progress-bar bg-primary"
                            style={{ width: `${calcPercentNum(cbTD, cb.duNo)}%` }}
                            title={`Tiêu dùng: ${formatCompactVN(cbTD)}`}
                          ></div>
                          <div
                            className="progress-bar bg-warning"
                            style={{ width: `${calcPercentNum(cbTM, cb.duNo)}%` }}
                            title={`Thương mại: ${formatCompactVN(cbTM)}`}
                          ></div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 text-muted small" style={{ fontSize: '0.74rem' }}>
                          <span className="d-flex align-items-center gap-1">
                            <span className="p-1 rounded-circle bg-success d-inline-block"></span>
                            Nông nghiệp: <strong className="text-dark num-tabular">{formatCompactVN(cbNN)}</strong> ({calcPercentNum(cbNN, cb.duNo)}%)
                          </span>
                          <span className="d-flex align-items-center gap-1">
                            <span className="p-1 rounded-circle bg-primary d-inline-block"></span>
                            Tiêu dùng: <strong className="text-dark num-tabular">{formatCompactVN(cbTD)}</strong> ({calcPercentNum(cbTD, cb.duNo)}%)
                          </span>
                          <span className="d-flex align-items-center gap-1">
                            <span className="p-1 rounded-circle bg-warning d-inline-block"></span>
                            Thương mại: <strong className="text-dark num-tabular">{formatCompactVN(cbTM)}</strong> ({calcPercentNum(cbTM, cb.duNo)}%)
                          </span>
                        </div>
                      </div>

                      {/* Chi tiết từng Thôn cán bộ trực tiếp phụ trách */}
                      {isExpanded && (
                        <div className="pt-2">
                          <div className="fw-bold text-dark small mb-2.5 text-uppercase" style={{ letterSpacing: '0.3px' }}>
                            Chi Tiết Các Thôn Thuộc {cb.assignedArea} Do Cán Bộ Quản Lý:
                          </div>

                          <div className="row g-2.5">
                            {((cb.communes && cb.communes[0]?.thons) || []).map((thon) => {
                              const tNN = thon.loanGroups?.['Nông nghiệp'] || 0;
                              const tTD = thon.loanGroups?.['Tiêu dùng - Đời sống'] || 0;
                              const tTM = thon.loanGroups?.['Thương mại - Dịch vụ'] || 0;

                              return (
                                <div key={thon.name} className="col-12 col-md-6 col-xl-4">
                                  <div className="p-3 bg-white rounded-3 border h-100">
                                    <div className="d-flex justify-content-between align-items-start mb-1.5">
                                      <span className="fw-bold text-dark">{thon.name}</span>
                                      <span className="badge bg-success-subtle text-success small fw-bold">
                                        {thon.rateCommune || `${calcPercentNum(thon.duno, cb.duNo)}%`}
                                      </span>
                                    </div>
                                    <div className="fw-bold text-dark fs-6 num-tabular mb-1">
                                      {formatCurrencyVN(thon.duno)}
                                    </div>
                                    <div className="text-muted small d-flex align-items-center gap-2 mb-2" style={{ fontSize: '0.72rem' }}>
                                      <span>{thon.countHD} HĐ</span>
                                      <span>•</span>
                                      <span>{thon.countKH} TV</span>
                                      <span>•</span>
                                      <span>BQ: {formatCompactVN(thon.duNoBinhQuanHD)}</span>
                                    </div>

                                    {/* Cơ cấu 3 nhóm của thôn */}
                                    <div className="pt-1.5 border-top d-flex flex-column gap-1 text-muted" style={{ fontSize: '0.71rem' }}>
                                      <div className="d-flex justify-content-between">
                                        <span>NN:</span>
                                        <span className="fw-semibold text-dark num-tabular">{formatCompactVN(tNN)}</span>
                                      </div>
                                      <div className="d-flex justify-content-between">
                                        <span>Tiêu dùng:</span>
                                        <span className="fw-semibold text-dark num-tabular">{formatCompactVN(tTD)}</span>
                                      </div>
                                      <div className="d-flex justify-content-between">
                                        <span>Thương mại:</span>
                                        <span className="fw-semibold text-dark num-tabular">{formatCompactVN(tTM)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CHẾ ĐỘ XEM BẢNG SO SÁNH DANH MỤC CÁN BỘ */}
          {viewMode === 'table' && (
            <div className="card-modern p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold m-0 text-slate-900 font-heading">
                    Bảng Tổng Hợp Danh Mục Quản Lý Theo Cán Bộ Tín Dụng
                  </h5>
                  <span className="text-muted small">So sánh quy mô dư nợ, khách hàng và cơ cấu cho vay giữa các cán bộ</span>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-custom align-middle">
                  <thead>
                    <tr>
                      <th>Cán Bộ Tín Dụng</th>
                      <th>Tài Khoản</th>
                      <th>Địa Bàn Phụ Trách</th>
                      <th className="text-end">Dư Nợ Quản Lý</th>
                      <th className="text-center">Tỷ Trọng Quỹ</th>
                      <th className="text-center">Số HĐ</th>
                      <th className="text-center">Số TV</th>
                      <th className="text-end">Dư Nợ BQ/HĐ</th>
                      <th className="text-end">Cho Vay NN</th>
                      <th className="text-end">Cho Vay TD</th>
                      <th className="text-end">Cho Vay TM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCbtds.map((cb) => {
                      const cbNN = cb.loanGroups?.['Nông nghiệp'] || 0;
                      const cbTD = cb.loanGroups?.['Tiêu dùng - Đời sống'] || 0;
                      const cbTM = cb.loanGroups?.['Thương mại - Dịch vụ'] || 0;

                      return (
                        <tr key={cb.user} className="hover-highlight">
                          <td className="fw-bold text-dark">{cb.name}</td>
                          <td className="font-monospace text-primary small">{cb.user}</td>
                          <td>
                            <span className="badge bg-success-subtle text-success fw-medium">
                              {cb.assignedArea}
                            </span>
                          </td>
                          <td className="text-end fw-bold text-dark num-tabular">
                            {formatCurrencyVN(cb.duNo)}
                          </td>
                          <td className="text-center fw-bold text-success">
                            {cb.rate || `${calcPercentNum(cb.duNo, totalDuNo)}%`}
                          </td>
                          <td className="text-center num-tabular">{cb.countHD}</td>
                          <td className="text-center num-tabular">{cb.countKH}</td>
                          <td className="text-end num-tabular text-muted small">
                            {formatCompactVN(cb.duNoBinhQuanHD)}
                          </td>
                          <td className="text-end num-tabular text-success small">{formatCompactVN(cbNN)}</td>
                          <td className="text-end num-tabular text-primary small">{formatCompactVN(cbTD)}</td>
                          <td className="text-end num-tabular text-warning-emphasis small">{formatCompactVN(cbTM)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="table-dark fw-bold">
                      <td colSpan="3">TỔNG CỘNG DANH MỤC</td>
                      <td className="text-end num-tabular text-white">{formatCurrencyVN(summaryTotals.duNo)}</td>
                      <td className="text-center text-white">100%</td>
                      <td className="text-center num-tabular text-white">{summaryTotals.countHD}</td>
                      <td className="text-center num-tabular text-white">{summaryTotals.countKH}</td>
                      <td className="text-end num-tabular text-white">{formatCompactVN(summaryTotals.duNoBinhQuanHD)}</td>
                      <td className="text-end num-tabular text-white">{formatCompactVN(summaryTotals.nn)}</td>
                      <td className="text-end num-tabular text-white">{formatCompactVN(summaryTotals.td)}</td>
                      <td className="text-end num-tabular text-white">{formatCompactVN(summaryTotals.tm)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 PHÂN HỆ 3: CƠ CẤU CHO VAY THEO SẢN PHẨM & TÁC VỤ VẬN HÀNH                */}
      {/* ========================================================================= */}
      {activeSubView === 'products' && (
        <div className="d-flex flex-column gap-4">
          {/* Hàng Cơ cấu Sản phẩm cho vay (3 Nhóm chính) */}
          <div className="row g-4">
            <div className="col-12 col-lg-7">
              <div className="card-modern p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 rounded bg-primary-subtle text-primary">
                      <PieChart size={18} />
                    </div>
                    <div>
                      <h5 className="fw-bold m-0 text-slate-900 font-heading">
                        Cơ Cấu Sản Phẩm Tín Dụng Toàn Quỹ
                      </h5>
                      <span className="text-muted small">Phân bổ theo 3 nhóm mục đích vay vốn chủ lực</span>
                    </div>
                  </div>
                  <span className="badge bg-light text-dark border small fw-semibold">
                    3 Nhóm chính
                  </span>
                </div>

                <div className="d-flex flex-column gap-3 pt-2">
                  {loanGroups && loanGroups.length > 0 ? (
                    loanGroups.map((lg, idx) => {
                      const colors = ['bg-success', 'bg-primary', 'bg-warning'];
                      const colorClass = colors[idx % colors.length];
                      const percentVal = calcPercentNum(lg.duNo, totalDuNo);
                      const totalHds = totalHopDong || 1;
                      const countPercent = Math.round(((lg.count || 0) / totalHds) * 100);

                      return (
                        <div key={lg.key || lg.name || idx} className="p-3 rounded-3 bg-light border border-light-subtle">
                          <div className="d-flex justify-content-between align-items-center mb-1.5">
                            <span className="fw-bold text-dark">{lg.name}</span>
                            <span className="fw-bold text-dark num-tabular">
                              {formatCurrencyVN(lg.duNo || 0)}{' '}
                              <span className="text-primary fw-bold">({lg.rate || `${percentVal}%`})</span>
                            </span>
                          </div>
                          <div className="progress mb-2" style={{ height: '7px' }}>
                            <div className={`progress-bar ${colorClass}`} role="progressbar" style={{ width: `${percentVal}%` }}></div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: '0.73rem' }}>
                            <span>{lg.description || 'Mục đích vay vốn theo quy chế tín dụng'}</span>
                            <span>Quy mô: <strong className="text-dark">{lg.count || 0} HĐ</strong> ({countPercent}%)</span>
                          </div>

                          {/* Chi tiết các gói vay con nếu có */}
                          {lg.subtypes && lg.subtypes.length > 0 && (
                            <div className="mt-2.5 pt-2 border-top">
                              <div className="d-flex flex-wrap gap-2">
                                {lg.subtypes.map((st, sIdx) => (
                                  <span key={sIdx} className="badge bg-white text-dark border small fw-normal py-1 px-2">
                                    {st.name}: <strong className="text-dark">{formatCompactVN(st.duNo)}</strong> ({st.count} HĐ)
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-muted small">Đang nạp cơ cấu sản phẩm vay từ CSDL...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Cột phải: Cảnh báo sớm & Tác vụ cần xử lý */}
            <div className="col-12 col-lg-5">
              <div className="card-modern p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div className="p-1.5 rounded bg-warning-subtle text-warning">
                      <Bell size={16} />
                    </div>
                    <h5 className="fw-bold m-0 text-slate-900 font-heading">
                      Cảnh Báo & Tác Vụ Cần Xử Lý
                    </h5>
                  </div>

                  <div className="d-flex flex-column gap-2.5">
                    {/* Cảnh báo 1: Đợt trích nợ kế tiếp */}
                    <div
                      className="p-3 bg-white rounded-3 border cursor-pointer hover-lift"
                      onClick={() => onNavigate('debit_batch')}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="badge bg-primary-subtle text-primary fw-medium small">Kỳ Trích Kế Tiếp</span>
                        <Clock size={14} className="text-primary" />
                      </div>
                      <div className="fw-semibold text-dark small mb-1">Kỳ 2 (Ngày 15 hàng tháng)</div>
                      <div className="d-flex align-items-center justify-content-between text-primary small fw-medium mt-2 pt-1 border-top">
                        <span>Khởi tạo đợt trích</span>
                        <ChevronRight size={13} />
                      </div>
                    </div>

                    {/* Cảnh báo 2: Thẩm định hồ sơ */}
                    <div
                      className="p-3 bg-white rounded-3 border cursor-pointer hover-lift"
                      onClick={() => onNavigate('appraisal')}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="badge bg-info-subtle text-info fw-medium small">Thẩm Định & LTV</span>
                        <FileCheck2 size={14} className="text-info" />
                      </div>
                      <div className="fw-semibold text-dark small mb-1">{pendingAppraisals || 0} Hồ Sơ Chờ Duyệt</div>
                      <div className="d-flex align-items-center justify-content-between text-info small fw-medium mt-2 pt-1 border-top">
                        <span>Xem hồ sơ thẩm định</span>
                        <ChevronRight size={13} />
                      </div>
                    </div>

                    {/* Cảnh báo 3: Kiểm tra vốn sau vay */}
                    <div
                      className="p-3 bg-white rounded-3 border cursor-pointer hover-lift"
                      onClick={() => onNavigate('inspection')}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="badge bg-warning-subtle text-warning fw-medium small">Kiểm Tra Sau Vay</span>
                        <AlertTriangle size={14} className="text-warning" />
                      </div>
                      <div className="fw-semibold text-dark small mb-1">{pendingInspections || 0} Món Cần Thực Địa</div>
                      <div className="d-flex align-items-center justify-content-between text-warning small fw-medium mt-2 pt-1 border-top">
                        <span>Lập biên bản kiểm tra</span>
                        <ChevronRight size={13} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-top mt-3 d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.74rem' }}>
                  <ShieldCheck size={16} className="text-success flex-shrink-0" />
                  <span>Dữ liệu được bảo mật và tự động đối soát theo chuẩn QTDND.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hàng Tiến Độ Đợt Trích Nợ Gần Nhất & Lối Tắt Nghiệp Vụ */}
          <div className="row g-4">
            {/* Bảng đợt trích nợ gần nhất */}
            <div className="col-12 col-lg-8">
              <div className="card-modern p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold m-0 text-slate-900 font-heading">Các Đợt Trích Nợ Gần Nhất</h5>
                    <span className="text-muted small">Theo dõi tiến độ thu nợ tự động theo từng kỳ</span>
                  </div>
                  <button
                    className="btn btn-sm btn-link text-primary fw-bold text-decoration-none d-flex align-items-center gap-1 p-0"
                    onClick={() => onNavigate('debit_batch')}
                  >
                    Xem tất cả <ArrowUpRight size={14} />
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-custom align-middle">
                    <thead>
                      <tr>
                        <th>Mã Đợt</th>
                        <th>Kỳ Trích</th>
                        <th className="text-end">Phải Thu</th>
                        <th className="text-end">Đã Trích</th>
                        <th className="text-end">Còn Nợ</th>
                        <th className="text-center">Tiến Độ</th>
                        <th className="text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.recentBatches && stats.recentBatches.length > 0 ? (
                        stats.recentBatches.map((batch) => {
                          const rate =
                            batch.completionRate !== undefined
                              ? batch.completionRate
                              : batch.tongPhaiThu > 0
                              ? Math.round((batch.tongDaTrich / batch.tongPhaiThu) * 100)
                              : 0;
                          return (
                            <tr key={batch.maDot} className="hover-highlight">
                              <td className="fw-bold text-primary font-monospace">{batch.maDot}</td>
                              <td>
                                <span className="badge bg-light text-dark border fw-bold">
                                  Kỳ {batch.kyTrich}
                                </span>{' '}
                                <span className="text-muted small">({batch.thangNam})</span>
                              </td>
                              <td className="text-end fw-semibold num-tabular">
                                {formatCurrency(batch.tongPhaiThu)}
                              </td>
                              <td className="text-end fw-bold text-success num-tabular">
                                {formatCurrency(batch.tongDaTrich)}
                              </td>
                              <td className="text-end fw-bold text-danger num-tabular">
                                {formatCurrency(batch.tongConNo)}
                              </td>
                              <td className="text-center" style={{ minWidth: 100 }}>
                                <div className="d-flex align-items-center gap-1.5 justify-content-center">
                                  <div className="progress flex-grow-1" style={{ height: '6px' }}>
                                    <div
                                      className={`progress-bar ${rate >= 90 ? 'bg-success' : rate >= 50 ? 'bg-warning' : 'bg-danger'}`}
                                      style={{ width: `${rate}%` }}
                                    ></div>
                                  </div>
                                  <span className="small fw-bold font-monospace" style={{ fontSize: '0.72rem' }}>
                                    {rate}%
                                  </span>
                                </div>
                              </td>
                              <td className="text-center">
                                <span
                                  className={`badge-status ${
                                    batch.trangThai === 'HOAN_TAT'
                                      ? 'badge-success-soft'
                                      : 'badge-warning-soft'
                                  }`}
                                >
                                  {batch.trangThai === 'HOAN_TAT' ? (
                                    <>
                                      <CheckCircle2 size={12} /> Hoàn tất
                                    </>
                                  ) : (
                                    <>
                                      <Clock size={12} /> Khởi tạo
                                    </>
                                  )}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-4 text-muted">
                            Chưa có đợt trích nợ nào được lập trong kỳ.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Lối tắt 5 phân hệ nghiệp vụ nhanh */}
            <div className="col-12 col-lg-4">
              <div className="card-modern p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h5 className="fw-bold m-0 text-slate-900 font-heading">Thao Tác Nhanh</h5>
                    <span className="badge bg-light text-muted border small">Lối tắt</span>
                  </div>
                  <p className="text-muted small mb-3">Truy cập tức thì các quy trình nghiệp vụ cốt lõi</p>

                  <div className="d-flex flex-column gap-2">
                    <button
                      className="btn btn-outline-primary text-start p-2.5 rounded-3 d-flex align-items-center justify-content-between border-subtle hover-lift"
                      onClick={() => onNavigate('customer360')}
                    >
                      <div className="d-flex align-items-center gap-2.5">
                        <div className="p-2 rounded-2 bg-primary-subtle text-primary">
                          <Users size={16} />
                        </div>
                        <div>
                          <div className="fw-bold text-dark small">Tra Cứu Khách Hàng 360°</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Hồ sơ khách hàng, khế ước HĐTD & tài khoản CASA
                          </div>
                        </div>
                      </div>
                      <ArrowUpRight size={15} className="text-muted" />
                    </button>

                    <button
                      className="btn btn-outline-success text-start p-2.5 rounded-3 d-flex align-items-center justify-content-between border-subtle hover-lift"
                      onClick={() => onNavigate('appraisal')}
                    >
                      <div className="d-flex align-items-center gap-2.5">
                        <div className="p-2 rounded-2 bg-success-subtle text-success">
                          <FileCheck2 size={16} />
                        </div>
                        <div>
                          <div className="fw-bold text-dark small">Thẩm Định & Định Giá TSĐB</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Tính LTV, chấm điểm CIC & hạn mức phê duyệt
                          </div>
                        </div>
                      </div>
                      <ArrowUpRight size={15} className="text-muted" />
                    </button>

                    <button
                      className="btn btn-outline-warning text-dark text-start p-2.5 rounded-3 d-flex align-items-center justify-content-between border-subtle hover-lift"
                      onClick={() => onNavigate('debit_batch')}
                    >
                      <div className="d-flex align-items-center gap-2.5">
                        <div className="p-2 rounded-2 bg-warning-subtle text-warning-emphasis">
                          <Zap size={16} />
                        </div>
                        <div>
                          <div className="fw-bold text-dark small">Khởi Tạo Đợt Trích Nợ</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Tính lãi ngày TT14 + Gốc đến hạn + Nợ tồn
                          </div>
                        </div>
                      </div>
                      <ArrowUpRight size={15} className="text-muted" />
                    </button>

                    <button
                      className="btn btn-outline-info text-dark text-start p-2.5 rounded-3 d-flex align-items-center justify-content-between border-subtle hover-lift"
                      onClick={() => onNavigate('reconciliation')}
                    >
                      <div className="d-flex align-items-center gap-2.5">
                        <div className="p-2 rounded-2 bg-info-subtle text-info-emphasis">
                          <ArrowLeftRight size={16} />
                        </div>
                        <div>
                          <div className="fw-bold text-dark small">Đối Soát Kết Quả Core</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Phân loại trích đủ / một phần & chốt đợt
                          </div>
                        </div>
                      </div>
                      <ArrowUpRight size={15} className="text-muted" />
                    </button>

                    <button
                      className="btn btn-outline-secondary text-start p-2.5 rounded-3 d-flex align-items-center justify-content-between border-subtle hover-lift"
                      onClick={() => onNavigate('templates')}
                    >
                      <div className="d-flex align-items-center gap-2.5">
                        <div className="p-2 rounded-2 bg-secondary-subtle text-secondary">
                          <ClipboardList size={16} />
                        </div>
                        <div>
                          <div className="fw-bold text-dark small">Kho Biểu Mẫu Mail Merge</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Trộn Google Docs / Word báo cáo tự động
                          </div>
                        </div>
                      </div>
                      <ArrowUpRight size={15} className="text-muted" />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-top mt-3 d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.74rem' }}>
                  <ShieldCheck size={16} className="text-success flex-shrink-0" />
                  <span>Bảo toàn phân công cán bộ & số liệu khế ước theo chuẩn hệ thống.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
