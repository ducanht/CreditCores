import React, { useState } from 'react';
import { Landmark, Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, Phone, CheckCircle2 } from 'lucide-react';
import { AuthService } from '../services/auth';

export default function LoginModal({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await AuthService.login(username.trim(), password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setErrorMsg('Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ xác thực.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center p-3"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#070a12',
        backgroundImage:
          'radial-gradient(at 100% 0%, rgba(154,205,50,0.13) 0px, transparent 55%), radial-gradient(at 0% 100%, rgba(4,120,87,0.13) 0px, transparent 55%)',
        zIndex: 9999,
        overflowY: 'auto'
      }}
    >
      <div
        className="w-100 overflow-hidden"
        style={{
          maxWidth: 820,
          borderRadius: 16,
          border: '1.5px solid rgba(154,205,50,0.28)',
          background: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.65)'
        }}
      >
        <div className="row g-0 min-vh-0">
          {/* ─── Cột trái: nhận diện thương hiệu ─── */}
          <div
            className="col-md-5 p-4 d-flex flex-column justify-content-between text-white"
            style={{
              background: 'linear-gradient(160deg, #06281e 0%, #091a26 100%)',
              borderRight: '1px solid rgba(154,205,50,0.18)'
            }}
          >
            <div>
              {/* Logo + Tên */}
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                  style={{
                    width: 48,
                    height: 48,
                    background: 'linear-gradient(135deg, #9acd32 0%, #047857 100%)'
                  }}
                >
                  <Landmark size={24} className="text-white" />
                </div>
                <div>
                  <h5 className="fw-extrabold m-0 text-white lh-1 font-heading" style={{ letterSpacing: '0.5px' }}>
                    QTDND YÊN THỌ
                  </h5>
                  <span style={{ fontSize: '0.72rem', color: '#a3e635', fontWeight: 600 }}>
                    Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hoá
                  </span>
                </div>
              </div>

              {/* Mô tả hệ thống */}
              <h6 className="fw-bold mb-3 text-white" style={{ lineHeight: 1.45 }}>
                Hệ Thống Quản Lý Tín Dụng &amp; Trích Nợ Tự Động
              </h6>

              <div className="d-flex flex-column gap-2 small" style={{ color: '#e2e8f0' }}>
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                  <span>Thẩm định tín dụng &amp; Định giá TSĐB</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                  <span>Trích nợ tự động CASA (kỳ 05, 15, 25)</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                  <span>Đồng bộ 2 chiều SQL Server 24/7</span>
                </div>
              </div>
            </div>

            {/* Footer cột trái */}
            <div className="pt-3 border-top border-slate-800 mt-4">
              <div className="d-flex align-items-center gap-2 small mb-1" style={{ color: '#a3e635' }}>
                <ShieldCheck size={14} />
                <span>Bảo mật dữ liệu chuẩn ngân hàng</span>
              </div>
              <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                <Phone size={12} />
                <span>Hỗ trợ: 0237.8770.793</span>
              </div>
            </div>
          </div>

          {/* ─── Cột phải: Form đăng nhập ─── */}
          <div className="col-md-7 p-4 p-lg-5 bg-white d-flex flex-column justify-content-center">
            <div className="mb-4">
              <h4 className="fw-bold text-slate-900 font-heading mb-1">Đăng Nhập Hệ Thống</h4>
              <p className="text-muted small m-0">Nhập tài khoản cán bộ để truy cập.</p>
            </div>

            {errorMsg && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3 small rounded-3" role="alert">
                <AlertCircle size={16} className="flex-shrink-0" />
                <div>{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleLogin} autoComplete="on">
              {/* Tên đăng nhập */}
              <div className="mb-3">
                <label htmlFor="cc-username" className="form-label small fw-bold text-slate-700 mb-1">
                  Tên đăng nhập
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <User size={17} />
                  </span>
                  <input
                    id="cc-username"
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Nhập tên đăng nhập..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    autoFocus
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Mật khẩu */}
              <div className="mb-4">
                <label htmlFor="cc-password" className="form-label small fw-bold text-slate-700 mb-1">
                  Mật khẩu
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <Lock size={17} />
                  </span>
                  <input
                    id="cc-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-control border-start-0 border-end-0"
                    placeholder="Nhập mật khẩu..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-start-0 text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Nút đăng nhập */}
              <button
                type="submit"
                id="btn-login-submit"
                className="btn btn-brand w-100 py-2 fw-bold shadow d-flex align-items-center justify-content-center gap-2 rounded-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    ĐĂNG NHẬP
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-3 border-top text-center">
              <span className="d-inline-flex align-items-center gap-1 text-success small" style={{ fontSize: '0.75rem' }}>
                <ShieldCheck size={13} /> Kênh đăng nhập bảo mật — Dữ liệu mã hoá TLS
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
