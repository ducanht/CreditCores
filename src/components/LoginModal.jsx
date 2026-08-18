import React, { useState } from 'react';
import { Landmark, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { AuthService } from '../services/auth';

export default function LoginModal({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await AuthService.login(username, password);
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login Helper
  const quickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0f172a',
        backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(27, 54, 93, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}
    >
      <div
        className="card-modern shadow-2xl overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '920px',
          borderRadius: '18px',
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255, 255, 255, 0.98)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
        }}
      >
        <div className="row g-0">
          {/* Left Hero Panel (Banking Brand & Security features) */}
          <div
            className="col-lg-5 p-4 p-md-5 d-flex flex-column justify-content-between text-white"
            style={{
              backgroundColor: 'var(--primary-color)',
              backgroundImage: 'linear-gradient(145deg, #1b365d 0%, #0f2341 100%)'
            }}
          >
            <div>
              <div className="d-flex align-items-center gap-2 mb-4">
                <div className="p-2 rounded-3 bg-info text-dark">
                  <Landmark size={26} />
                </div>
                <div>
                  <h4 className="fw-bold m-0 text-white lh-1">CreditCores</h4>
                  <span className="small text-info-emphasis" style={{ fontSize: '0.75rem', color: '#93c5fd' }}>
                    Core Credit & Auto-Debit
                  </span>
                </div>
              </div>

              <h5 className="fw-bold mb-3 lh-base">
                Hệ Thống Quản Lý Tín Dụng & Trích Nợ Tự Động Nội Bộ
              </h5>
              <p className="small text-slate-300 mb-4 lh-lg" style={{ color: '#cbd5e1' }}>
                Hệ thống bảo mật ngân hàng cấp cao dành riêng cho Quỹ Tín dụng Nhân dân & Co-opBank. 
                Vui lòng đăng nhập tài khoản được cấp quyền để truy cập phân hệ nghiệp vụ.
              </p>
            </div>

            <div className="d-flex flex-column gap-2 pt-3 border-top border-slate-700">
              <div className="d-flex align-items-center gap-2 small text-slate-300" style={{ color: '#94a3b8' }}>
                <ShieldCheck size={16} className="text-success" />
                <span>Mã hóa mật khẩu SHA-256 một chiều</span>
              </div>
              <div className="d-flex align-items-center gap-2 small text-slate-300" style={{ color: '#94a3b8' }}>
                <ShieldCheck size={16} className="text-info" />
                <span>Phân quyền 4 cấp (Admin, CBTD, Kế toán, Lãnh đạo)</span>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="col-lg-7 p-4 p-md-5 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold m-0 text-slate-800">Đăng Nhập Hệ Thống</h4>
                <span className="badge bg-primary-subtle text-primary fw-semibold px-2 py-1">v1.0 Internal</span>
              </div>

              {errorMsg && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mb-4">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLogin}>
                {/* Username Input */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Tên Đăng Nhập</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <User size={18} className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-1 fw-semibold"
                      placeholder="admin, cbtd, ketoan, lanhdao..."
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted text-uppercase">Mật Khẩu</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <Lock size={18} className="text-muted" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control border-start-0 border-end-0 ps-1 fw-semibold"
                      placeholder="Nhập mật khẩu..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="input-group-text bg-light border-start-0 text-muted"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 mb-4 shadow-sm"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Đang xác thực bảo mật...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng Nhập Vào Hệ Thống</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Quick Demo Accounts Selection */}
            <div className="pt-3 border-top">
              <div className="d-flex align-items-center gap-1 small text-muted fw-bold mb-2">
                <Sparkles size={14} className="text-warning" />
                <span>CHỌN NHANH TÀI KHOẢN MẪU PHÂN QUYỀN (DEMO):</span>
              </div>

              <div className="d-grid gap-2 d-md-flex justify-content-between flex-wrap">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger flex-grow-1 text-start"
                  onClick={() => quickLogin('admin', 'admin@123')}
                  title="Quản trị viên: Toàn quyền 10 phân hệ + Quản lý User"
                >
                  <i className="fa-solid fa-shield-halved me-1"></i>
                  <strong>admin</strong>
                  <div style={{ fontSize: '0.68rem' }}>Quản trị viên</div>
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary flex-grow-1 text-start"
                  onClick={() => quickLogin('cbtd', 'cbtd@123')}
                  title="Cán bộ tín dụng: Thẩm định, Kiểm tra vốn, Nợ tồn"
                >
                  <i className="fa-solid fa-user-tie me-1"></i>
                  <strong>cbtd</strong>
                  <div style={{ fontSize: '0.68rem' }}>Tín dụng</div>
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-success flex-grow-1 text-start"
                  onClick={() => quickLogin('ketoan', 'ketoan@123')}
                  title="Kế toán: Đăng ký trích nợ, Chạy đợt, Đối soát"
                >
                  <i className="fa-solid fa-calculator me-1"></i>
                  <strong>ketoan</strong>
                  <div style={{ fontSize: '0.68rem' }}>Kế toán</div>
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning text-dark flex-grow-1 text-start"
                  onClick={() => quickLogin('lanhdao', 'lanhdao@123')}
                  title="Lãnh đạo: Dashboard, Phê duyệt, Báo cáo thống kê"
                >
                  <i className="fa-solid fa-user-check me-1"></i>
                  <strong>lanhdao</strong>
                  <div style={{ fontSize: '0.68rem' }}>Lãnh đạo</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
