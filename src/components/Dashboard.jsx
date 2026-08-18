import React from 'react';
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
  FileCheck2
} from 'lucide-react';
import { formatCurrencyVN, formatCurrency } from '../utils/dateUtils';

export default function Dashboard({ stats, onNavigate }) {
  return (
    <div className="d-flex flex-column gap-4">
      {/* 4 Core Metric Bento KPI Cards */}
      <div className="row g-3">
        {/* 1. Tổng Dư Nợ */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-bento-card" style={{ '--card-accent-color': '#9acd32', borderLeft: '4px solid #9acd32' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                Tổng Dư Nợ Tín Dụng
              </span>
              <div
                className="kpi-icon-wrapper"
                style={{ '--icon-bg': 'rgba(154, 205, 50, 0.15)', '--icon-color': '#4d7c0f' }}
              >
                <Landmark size={22} />
              </div>
            </div>
            <div>
              <h3 className="fw-bold text-dark mb-1 fs-4 num-tabular">
                {formatCurrencyVN(stats?.totalDuNo)}
              </h3>
              <div className="d-flex align-items-center gap-1 text-success small fw-semibold">
                <TrendingUp size={14} />
                <span>{stats?.totalHopDong || 0} khế ước đang hoạt động</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Dự Thu Lãi Kỳ Này */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-bento-card" style={{ '--card-accent-color': '#047857', borderLeft: '4px solid #047857' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                Dự Thu Lãi Kỳ Này
              </span>
              <div
                className="kpi-icon-wrapper"
                style={{ '--icon-bg': 'rgba(4, 120, 87, 0.15)', '--icon-color': '#047857' }}
              >
                <TrendingUp size={22} />
              </div>
            </div>
            <div>
              <h3 className="fw-bold text-dark mb-1 fs-4 num-tabular text-gradient-emerald">
                {formatCurrencyVN(stats?.totalDuThuLai)}
              </h3>
              <span className="text-muted small">Ước tính theo lãi suất từng HĐ</span>
            </div>
          </div>
        </div>

        {/* 3. Đăng Ký Trích Nợ */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-bento-card" style={{ '--card-accent-color': '#0284c7', borderLeft: '4px solid #0284c7' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                Đăng Ký Trích Nợ
              </span>
              <div
                className="kpi-icon-wrapper"
                style={{ '--icon-bg': 'rgba(2, 132, 199, 0.15)', '--icon-color': '#0284c7' }}
              >
                <Users size={22} />
              </div>
            </div>
            <div>
              <h3 className="fw-bold text-dark mb-1 fs-4 num-tabular">
                {stats?.totalKhachHangTrichNo || 0}{' '}
                <span className="fs-6 fw-normal text-muted">khách hàng</span>
              </h3>
              <span className="text-muted small">Ủy quyền Auto-Debit (Kỳ 1, 2, 3)</span>
            </div>
          </div>
        </div>

        {/* 4. Tổng Nợ Tồn Đọng */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-bento-card" style={{ '--card-accent-color': '#e11d48', borderLeft: '4px solid #e11d48' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                Nợ Tồn Đọng Chờ Thu
              </span>
              <div
                className="kpi-icon-wrapper"
                style={{ '--icon-bg': 'rgba(225, 29, 72, 0.15)', '--icon-color': '#e11d48' }}
              >
                <AlertCircle size={22} />
              </div>
            </div>
            <div>
              <h3 className="fw-bold text-danger mb-1 fs-4 num-tabular">
                {formatCurrencyVN(stats?.totalNoTon)}
              </h3>
              <span className="text-muted small">Cần đôn đốc trước kỳ tiếp theo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Batches + Quick Action Shortcuts */}
      <div className="row g-4">
        {/* Left Col: Recent Debit Batches */}
        <div className="col-12 col-lg-8">
          <div className="card-modern p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold m-0 text-slate-900 font-heading">Các Đợt Trích Nợ Gần Nhất</h5>
                <span className="text-muted small">Theo dõi tiến độ thu nợ tự động theo các kỳ</span>
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
                    <th className="text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentBatches && stats.recentBatches.length > 0 ? (
                    stats.recentBatches.map((batch) => {
                      const rate =
                        batch.tongPhaiThu > 0
                          ? Math.round((batch.tongDaTrich / batch.tongPhaiThu) * 100)
                          : 0;
                      return (
                        <tr key={batch.maDot}>
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
                            <div className="text-muted small font-monospace" style={{ fontSize: '0.7rem' }}>
                              {rate}%
                            </div>
                          </td>
                          <td className="text-end fw-bold text-danger num-tabular">
                            {formatCurrency(batch.tongConNo)}
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
                      <td colSpan="6" className="text-center py-4 text-muted">
                        Chưa có đợt trích nợ nào được lập.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Actions & Operations Shortcuts */}
        <div className="col-12 col-lg-4">
          <div className="card-modern p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-bold m-0 text-slate-900 font-heading mb-1">Thao Tác Nhanh</h5>
              <p className="text-muted small mb-3">Lối tắt đến các nghiệp vụ trọng tâm</p>

              <div className="d-flex flex-column gap-2">
                <button
                  className="btn btn-outline-primary text-start p-3 rounded-3 d-flex align-items-center justify-content-between border-subtle"
                  onClick={() => onNavigate('customer360')}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-3 bg-primary-subtle text-primary">
                      <Users size={18} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark small">Tra Cứu Khách Hàng 360°</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Xem hợp đồng, tài khoản CASA & vốn góp
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={16} className="text-muted" />
                </button>

                <button
                  className="btn btn-outline-success text-start p-3 rounded-3 d-flex align-items-center justify-content-between border-subtle"
                  onClick={() => onNavigate('appraisal')}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-3 bg-success-subtle text-success">
                      <FileCheck2 size={18} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark small">Lập Hồ Sơ Thẩm Định TSĐB</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Tính tỷ lệ LTV & chấm điểm CIC
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={16} className="text-muted" />
                </button>

                <button
                  className="btn btn-outline-warning text-dark text-start p-3 rounded-3 d-flex align-items-center justify-content-between border-subtle"
                  onClick={() => onNavigate('debit_batch')}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-3 bg-warning-subtle text-warning-emphasis">
                      <Zap size={18} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark small">Khởi Tạo Đợt Trích Nợ</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Tự động tính lãi + gốc + nợ tồn
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={16} className="text-muted" />
                </button>

                <button
                  className="btn btn-outline-info text-dark text-start p-3 rounded-3 d-flex align-items-center justify-content-between border-subtle"
                  onClick={() => onNavigate('reconciliation')}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-3 bg-info-subtle text-info-emphasis">
                      <ArrowLeftRight size={18} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark small">Đối Soát Kết Quả Core</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Nạp kết quả và phân loại nợ tồn
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={16} className="text-muted" />
                </button>
              </div>
            </div>

            {/* Bottom Security Assurance Chip */}
            <div className="pt-3 border-top mt-3 d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.74rem' }}>
              <ShieldCheck size={16} className="text-success flex-shrink-0" />
              <span>Hệ thống bảo vệ giao dịch theo chuẩn an toàn QTDND.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
