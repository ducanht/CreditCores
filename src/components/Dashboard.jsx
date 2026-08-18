import React from 'react';
import { Landmark, TrendingUp, Users, AlertCircle, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react';

export default function Dashboard({ stats, onNavigate }) {
  const formatCurrency = (val) => (val || 0).toLocaleString('vi-VN') + ' đ';

  return (
    <div className="d-flex flex-column gap-4">
      {/* 4 Core Metric KPI Cards */}
      <div className="row g-3">
        <div className="col-md-3">
          <div className="card-modern p-3" style={{ borderLeft: '4px solid #0d6efd' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Tổng Dư Nợ Tín Dụng</span>
              <div className="p-2 rounded-3 bg-primary-subtle text-primary">
                <Landmark size={18} />
              </div>
            </div>
            <h3 className="fw-bold text-dark mb-1 fs-4">{formatCurrency(stats?.totalDuNo)}</h3>
            <span className="text-success small fw-medium d-flex align-items-center gap-1">
              <TrendingUp size={13} /> {stats?.totalHopDong || 0} khế ước đang hoạt động
            </span>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card-modern p-3" style={{ borderLeft: '4px solid #0f5132' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Dự Thu Lãi Kỳ Này</span>
              <div className="p-2 rounded-3 bg-success-subtle text-success">
                <TrendingUp size={18} />
              </div>
            </div>
            <h3 className="fw-bold text-dark mb-1 fs-4">{formatCurrency(stats?.totalDuThuLai)}</h3>
            <span className="text-muted small">Ước tính theo lãi suất từng HĐ</span>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card-modern p-3" style={{ borderLeft: '4px solid #7c3aed' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Đăng Ký Trích Nợ</span>
              <div className="p-2 rounded-3 bg-purple-subtle text-purple" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                <Users size={18} />
              </div>
            </div>
            <h3 className="fw-bold text-dark mb-1 fs-4">{stats?.totalKhachHangTrichNo || 0}</h3>
            <span className="text-muted small">Khách hàng ủy quyền Auto-Debit</span>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card-modern p-3" style={{ borderLeft: '4px solid #be123c' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Tổng Nợ Tồn Đọng</span>
              <div className="p-2 rounded-3 bg-danger-subtle text-danger">
                <AlertCircle size={18} />
              </div>
            </div>
            <h3 className="fw-bold text-danger mb-1 fs-4">{formatCurrency(stats?.totalNoTon)}</h3>
            <span className="text-danger small fw-medium">Chuyển tiếp sang kỳ sau</span>
          </div>
        </div>
      </div>

      {/* Progress & Recent Batches Section */}
      <div className="row g-3">
        {/* Recent Debit Batches */}
        <div className="col-lg-8">
          <div className="card-modern p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 text-slate-800">Các Đợt Trích Nợ Gần Nhất</h5>
              <button
                className="btn btn-sm btn-link text-primary fw-semibold text-decoration-none d-flex align-items-center gap-1 p-0"
                onClick={() => onNavigate('debit_batch')}
              >
                Xem chi tiết <ArrowUpRight size={14} />
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
                    stats.recentBatches.map(batch => {
                      const rate = batch.tongPhaiThu > 0 ? Math.round((batch.tongDaTrich / batch.tongPhaiThu) * 100) : 0;
                      return (
                        <tr key={batch.maDot}>
                          <td className="fw-bold text-primary">{batch.maDot}</td>
                          <td>Kỳ {batch.kyTrich} (Tháng {batch.thangNam})</td>
                          <td className="text-end fw-semibold">{formatCurrency(batch.tongPhaiThu)}</td>
                          <td className="text-end text-success fw-semibold">{formatCurrency(batch.tongDaTrich)}</td>
                          <td className="text-end text-danger fw-semibold">{formatCurrency(batch.tongConNo)}</td>
                          <td className="text-center">
                            <span
                              className={`badge-status ${
                                batch.trangThai === 'HOAN_TAT'
                                  ? 'badge-success-soft'
                                  : batch.trangThai === 'DANG_XU_LY'
                                  ? 'badge-warning-soft'
                                  : 'badge-info-soft'
                              }`}
                            >
                              {batch.trangThai} ({rate}%)
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">
                        Chưa có dữ liệu đợt trích nợ nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Operations Guide */}
        <div className="col-lg-4">
          <div className="card-modern p-4 d-flex flex-column gap-3">
            <h5 className="fw-bold m-0 text-slate-800">Quy Trình Thu Nợ Tự Động</h5>

            <div className="d-flex align-items-start gap-3 p-3 rounded-3 bg-light">
              <div className="p-2 rounded-circle bg-primary text-white mt-1">
                <span className="fw-bold small px-1">1</span>
              </div>
              <div>
                <h6 className="fw-bold mb-1">Khởi tạo Đợt Trích Nợ</h6>
                <p className="text-muted small m-0">Tự động quét số dư, tính lãi phát sinh và gộp nợ tồn của khách hàng.</p>
              </div>
            </div>

            <div className="d-flex align-items-start gap-3 p-3 rounded-3 bg-light">
              <div className="p-2 rounded-circle bg-warning text-white mt-1">
                <span className="fw-bold small px-1">2</span>
              </div>
              <div>
                <h6 className="fw-bold mb-1">Xuất Lệnh Trích Core</h6>
                <p className="text-muted small m-0">Kết xuất file danh sách lệnh trích nợ nạp vào hệ thống CoreBanking.</p>
              </div>
            </div>

            <div className="d-flex align-items-start gap-3 p-3 rounded-3 bg-light">
              <div className="p-2 rounded-circle bg-success text-white mt-1">
                <span className="fw-bold small px-1">3</span>
              </div>
              <div>
                <h6 className="fw-bold mb-1">Đối Soát & Xử Lý Nợ Tồn</h6>
                <p className="text-muted small m-0">Nạp file kết quả, phân loại thành công và lưu nợ thiếu vào sổ theo dõi.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
