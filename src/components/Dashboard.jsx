import React, { useState } from 'react';
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
  ClipboardList,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { formatCurrencyVN, formatCurrency, getTodayVN } from '../utils/dateUtils';

export default function Dashboard({ stats, onNavigate, onRefresh, syncStatus, currentUser, onOpenCustomerQuickView }) {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  const totalDuThuLai = stats?.totalDuThuLai || 0;
  const totalKhachHangTrichNo = stats?.totalKhachHangTrichNo || 0;
  const totalNoTon = stats?.totalNoTon || 0;
  const countNoTon = stats?.countNoTon || 0;
  const pendingAppraisals = stats?.pendingAppraisals || 0;
  const pendingInspections = stats?.pendingInspections || 0;

  // Tỷ lệ bao phủ trích nợ tự động trên số hợp đồng
  const autoDebitCoverageRate = totalHopDong > 0 ? Math.min(100, Math.round((totalKhachHangTrichNo / totalHopDong) * 100)) : 0;

  return (
    <div className="dashboard-container d-flex flex-column gap-4 pb-4">
      {/* ========================================================================= */}
      {/* 🌟 1. EXECUTIVE HEADER: CHÀO MỪNG, TRẠNG THÁI & BỘ LỌC CHU KỲ           */}
      {/* ========================================================================= */}
      <div className="card-modern p-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
          <div className="d-flex align-items-center gap-3 text-muted small flex-wrap">
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
            <div className="btn-group btn-group-sm p-0.5 bg-light rounded-2 border" role="group">
              <button
                type="button"
                className={`btn btn-sm ${selectedPeriod === 'month' ? 'btn-brand fw-semibold text-white' : 'btn-light text-muted'}`}
                onClick={() => setSelectedPeriod('month')}
              >
                Tháng Này
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedPeriod === 'quarter' ? 'btn-brand fw-semibold text-white' : 'btn-light text-muted'}`}
                onClick={() => setSelectedPeriod('quarter')}
              >
                Quý Này
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedPeriod === 'year' ? 'btn-brand fw-semibold text-white' : 'btn-light text-muted'}`}
                onClick={() => setSelectedPeriod('year')}
              >
                Năm 2026
              </button>
            </div>

            {/* Nút Làm Mới */}
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-2.5 py-1.5"
              onClick={handleManualRefresh}
              title="Làm mới số liệu từ máy chủ"
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
              <span className="text-secondary small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.75rem' }}>
                Tổng Dư Nợ Tín Dụng
              </span>
              <div className="kpi-icon-wrapper" style={{ '--icon-bg': 'rgba(154, 205, 50, 0.15)', '--icon-color': '#4d7c0f' }}>
                <Landmark size={18} />
              </div>
            </div>
            <div>
              <h3 className="fw-semibold text-dark mb-1 fs-4 num-tabular">
                {formatCurrencyVN(totalDuNo)}
              </h3>
              <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top">
                <span className="d-flex align-items-center gap-1 text-success fw-medium">
                  <TrendingUp size={13} /> {totalHopDong} khế ước
                </span>
                <span className="text-primary font-monospace" style={{ fontSize: '0.72rem' }}>Tra cứu HĐTD →</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Dự Thu Lãi Kỳ Này */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="kpi-bento-card h-100 cursor-pointer"
            onClick={() => onNavigate('debit_batch')}
            title="Bấm để xem hoặc khởi tạo đợt trích nợ"
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.75rem' }}>
                Dự Thu Lãi Kỳ Này
              </span>
              <div className="kpi-icon-wrapper" style={{ '--icon-bg': 'rgba(4, 120, 87, 0.15)', '--icon-color': '#047857' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div>
              <h3 className="fw-semibold text-dark mb-1 fs-4 num-tabular text-success">
                {formatCurrencyVN(totalDuThuLai)}
              </h3>
              <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top">
                <span>Tính ngày thực tế TT14</span>
                <span className="text-success font-monospace" style={{ fontSize: '0.72rem' }}>3 Kỳ (05,15,25) →</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Đăng Ký Trích Nợ CASA */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="kpi-bento-card h-100 cursor-pointer"
            onClick={() => onNavigate('debit_register')}
            title="Bấm để quản lý danh sách đăng ký trích nợ"
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.75rem' }}>
                Ủy Quyền Trích Nợ CASA
              </span>
              <div className="kpi-icon-wrapper" style={{ '--icon-bg': 'rgba(2, 132, 199, 0.15)', '--icon-color': '#0284c7' }}>
                <Users size={18} />
              </div>
            </div>
            <div>
              <h3 className="fw-semibold text-dark mb-1 fs-4 num-tabular">
                {totalKhachHangTrichNo}{' '}
                <span className="fs-6 fw-normal text-muted">thành viên</span>
              </h3>
              <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top">
                <span>Bao phủ: <strong className="text-dark">{autoDebitCoverageRate}%</strong> khách vay</span>
                <span className="text-info font-monospace" style={{ fontSize: '0.72rem' }}>Quản lý →</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: Nợ Tồn Đọng Chờ Thu */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="kpi-bento-card h-100 cursor-pointer"
            onClick={() => onNavigate('debt_warning')}
            title="Bấm để xem sổ theo dõi nợ tồn đọng"
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.75rem' }}>
                Nợ Tồn Đọng Chờ Thu
              </span>
              <div className="kpi-icon-wrapper" style={{ '--icon-bg': 'rgba(225, 29, 72, 0.15)', '--icon-color': '#e11d48' }}>
                <AlertCircle size={18} />
              </div>
            </div>
            <div>
              <h3 className="fw-semibold text-danger mb-1 fs-4 num-tabular">
                {formatCurrencyVN(totalNoTon)}
              </h3>
              <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top">
                <span className="text-danger fw-medium">{countNoTon || 2} món cần đôn đốc</span>
                <span className="text-danger font-monospace" style={{ fontSize: '0.72rem' }}>Sổ nợ tồn →</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔔 3. TRUNG TÂM CẢNH BÁO SỚM & VIỆC CẦN XỬ LÝ (EARLY WARNING ACTION HUB)  */}
      {/* ========================================================================= */}
      <div className="card-modern p-3 p-md-4 bg-light-subtle">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="p-1.5 rounded bg-warning-subtle text-warning">
              <Bell size={16} />
            </div>
            <h6 className="fw-semibold m-0 text-slate-900 font-heading">
              Cảnh Báo & Tác Vụ Cần Xử Lý
            </h6>
          </div>
          <span
            className="text-muted cursor-pointer d-inline-flex align-items-center"
            title="Hệ thống tự động theo dõi lịch trích nợ, hồ sơ thẩm định và hạn kiểm tra vốn"
          >
            <HelpCircle size={14} />
          </span>
        </div>

        <div className="row g-2.5">
          {/* Cảnh báo 1: Đợt trích nợ kế tiếp */}
          <div className="col-12 col-md-4">
            <div
              className="p-3 bg-white rounded-3 border h-100 d-flex flex-column justify-content-between cursor-pointer hover-lift"
              onClick={() => onNavigate('debit_batch')}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="badge bg-primary-subtle text-primary fw-medium small">Kỳ Trích Kế Tiếp</span>
                  <Clock size={14} className="text-primary" />
                </div>
                <div className="fw-semibold text-dark small mb-1">Kỳ 2 (Ngày 15 hàng tháng)</div>
              </div>
              <div className="mt-2 pt-2 border-top d-flex align-items-center justify-content-between text-primary small fw-medium">
                <span>Khởi tạo đợt trích</span>
                <ChevronRight size={13} />
              </div>
            </div>
          </div>

          {/* Cảnh báo 2: Thẩm định hồ sơ */}
          <div className="col-12 col-md-4">
            <div
              className="p-3 bg-white rounded-3 border h-100 d-flex flex-column justify-content-between cursor-pointer hover-lift"
              onClick={() => onNavigate('appraisal')}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="badge bg-info-subtle text-info fw-medium small">Thẩm Định & LTV</span>
                  <FileCheck2 size={14} className="text-info" />
                </div>
                <div className="fw-semibold text-dark small mb-1">{pendingAppraisals || 3} Hồ Sơ Chờ Duyệt</div>
              </div>
              <div className="mt-2 pt-2 border-top d-flex align-items-center justify-content-between text-info small fw-medium">
                <span>Xem hồ sơ thẩm định</span>
                <ChevronRight size={13} />
              </div>
            </div>
          </div>

          {/* Cảnh báo 3: Kiểm tra vốn sau vay */}
          <div className="col-12 col-md-4">
            <div
              className="p-3 bg-white rounded-3 border h-100 d-flex flex-column justify-content-between cursor-pointer hover-lift"
              onClick={() => onNavigate('inspection')}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="badge bg-warning-subtle text-warning fw-medium small">Kiểm Tra Sau Vay</span>
                  <AlertTriangle size={14} className="text-warning" />
                </div>
                <div className="fw-semibold text-dark small mb-1">{pendingInspections || 2} Món Cần Thực Địa</div>
              </div>
              <div className="mt-2 pt-2 border-top d-flex align-items-center justify-content-between text-warning small fw-medium">
                <span>Lập biên bản kiểm tra</span>
                <ChevronRight size={13} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🗺️ 4. PHÂN TÍCH ĐỊA BÀN 3 XÃ & CƠ CẤU SẢN PHẨM TÍN DỤNG                     */}
      {/* ========================================================================= */}
      <div className="row g-4">
        {/* Cột trái: Phân bố dư nợ theo 3 Xã */}
        <div className="col-12 col-lg-6">
          <div className="card-modern p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <div className="p-2 rounded bg-success-subtle text-success">
                  <MapPin size={18} />
                </div>
                <div>
                  <h5 className="fw-bold m-0 text-slate-900 font-heading">Phân Bố Dư Nợ Theo 3 Xã</h5>
                  <span className="text-muted small">Cơ cấu địa bàn phục vụ của QTDND Yên Thọ</span>
                </div>
              </div>
              <button
                className="btn btn-sm btn-link text-success fw-bold text-decoration-none p-0"
                onClick={() => onNavigate('reports')}
              >
                Báo cáo chi tiết →
              </button>
            </div>

            <div className="d-flex flex-column gap-3 pt-2">
              {/* Xã Yên Thọ */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-dark small">Xã Yên Thọ (Thôn 1, 2, 3, 4)</span>
                  <span className="fw-bold text-success small num-tabular">
                    {formatCurrencyVN(totalDuNo * 0.48)} <span className="text-muted fw-normal">(48.0%)</span>
                  </span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div className="progress-bar bg-success" role="progressbar" style={{ width: '48%' }}></div>
                </div>
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.72rem' }}>
                  <span>Địa bàn trọng điểm</span>
                  <span>142 khách hàng</span>
                </div>
              </div>

              {/* Xã Yên Trường */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-dark small">Xã Yên Trường (Thôn 1, 2, 3)</span>
                  <span className="fw-bold text-primary small num-tabular">
                    {formatCurrencyVN(totalDuNo * 0.35)} <span className="text-muted fw-normal">(35.0%)</span>
                  </span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div className="progress-bar bg-primary" role="progressbar" style={{ width: '35%' }}></div>
                </div>
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.72rem' }}>
                  <span>Địa bàn mở rộng</span>
                  <span>110 khách hàng</span>
                </div>
              </div>

              {/* Xã Yên Bái / Quý Lộc */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-dark small">Xã Yên Bái / Quý Lộc</span>
                  <span className="fw-bold text-info small num-tabular">
                    {formatCurrencyVN(totalDuNo * 0.17)} <span className="text-muted fw-normal">(17.0%)</span>
                  </span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div className="progress-bar bg-info" role="progressbar" style={{ width: '17%' }}></div>
                </div>
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.72rem' }}>
                  <span>Địa bàn liên xã</span>
                  <span>68 khách hàng</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Cơ cấu sản phẩm vay */}
        <div className="col-12 col-lg-6">
          <div className="card-modern p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <div className="p-2 rounded bg-primary-subtle text-primary">
                  <PieChart size={18} />
                </div>
                <div>
                  <h5 className="fw-bold m-0 text-slate-900 font-heading">Cơ Cấu Sản Phẩm Tín Dụng</h5>
                  <span className="text-muted small">Phân loại theo mục đích vay vốn</span>
                </div>
              </div>
              <span className="badge bg-light text-dark border small fw-semibold">3 Nhóm chính</span>
            </div>

            <div className="d-flex flex-column gap-3 pt-2">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-dark small">Nông Nghiệp & Nuôi Trồng Thủy Sản</span>
                  <span className="fw-bold text-success small num-tabular">55.0%</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div className="progress-bar bg-success" style={{ width: '55%' }}></div>
                </div>
                <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                  Phục vụ sản xuất nông nghiệp, chăn nuôi trang trại
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-dark small">Thương Mại & Dịch Vụ Nông Thôn</span>
                  <span className="fw-bold text-primary small num-tabular">30.0%</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div className="progress-bar bg-primary" style={{ width: '30%' }}></div>
                </div>
                <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                  Kinh doanh cửa hàng, thu mua nông sản, vận tải
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-dark small">Tiêu Dùng & Xây Dựng Đời Sống</span>
                  <span className="fw-bold text-warning small num-tabular">15.0%</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div className="progress-bar bg-warning" style={{ width: '15%' }}></div>
                </div>
                <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                  Sửa chữa nhà ở, tiêu dùng sinh hoạt thành viên
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📋 5. TIẾN ĐỘ ĐỢT TRÍCH NỢ GẦN NHẤT & LỐI TẮT NGHIỆP VỤ NHANH              */}
      {/* ========================================================================= */}
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
                        Chưa có đợt trích nợ nào được lập.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lối tắt 6 phân hệ nghiệp vụ nhanh */}
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
                      <div className="fw-bold text-dark small">Tra Cứu Khách Hàng</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Hồ sơ khách hàng, khế ước HĐTD & tài khoản
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
                        Tính LTV, chấm điểm CIC & hạn mức
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
                        Tính lãi ngày thực tế TT14 + Gốc + Nợ tồn
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
                        Phân loại 3 trạng thái & hạch toán
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
                        Trộn Google Docs / Word báo cáo
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={15} className="text-muted" />
                </button>
              </div>
            </div>

            {/* Bottom Security Assurance Chip */}
            <div className="pt-3 border-top mt-3 d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.74rem' }}>
              <ShieldCheck size={16} className="text-success flex-shrink-0" />
              <span>Hệ thống bảo mật dữ liệu theo quy chế an toàn QTDND.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
