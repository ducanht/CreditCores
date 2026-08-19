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

  // Nạp nhanh tài khoản mẫu (1-Tap Fast Fill)
  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  return (
    <div
      className="login-overlay d-flex align-items-center justify-content-center p-2 p-sm-3 p-md-4"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#070a12',
        backgroundImage: 'radial-gradient(at 100% 0%, rgba(154, 205, 50, 0.15) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(4, 120, 87, 0.15) 0px, transparent 50%)',
        zIndex: 9999,
        overflowY: 'auto'
      }}
    >
      {/* ========================================================================= */}
      {/* 📱 GIAO DIỆN DÀNH RIÊNG CHO ĐIỆN THOẠI (MOBILE PHONE < 768px)            */}
      {/* ========================================================================= */}
      <div className="d-block d-md-none w-100 py-3" style={{ maxWidth: '440px' }}>
        {/* Mobile Header Branding */}
        <div className="text-center mb-3">
          <div
            className="mx-auto mb-2 rounded-circle d-flex align-items-center justify-content-center shadow-lg"
            style={{
              width: 58,
              height: 58,
              background: 'linear-gradient(135deg, #9acd32 0%, #047857 100%)',
              border: '2px solid rgba(255,255,255,0.2)'
            }}
          >
            <Landmark size={28} className="text-white" />
          </div>
          <h5 className="fw-extrabold text-white font-heading m-0 lh-1" style={{ letterSpacing: '0.5px' }}>
            QTDND YÊN THỌ
          </h5>
          <div className="d-inline-flex align-items-center mt-1 px-2.5 py-0.5 rounded-pill bg-dark border border-secondary" style={{ fontSize: '0.72rem', color: '#a3e635' }}>
            Hệ Thống Quản Lý Tín Dụng & Trích Nợ
          </div>
        </div>

        {/* Mobile Login Card */}
        <div
          className="bg-white rounded-4 shadow-2xl p-4"
          style={{
            border: '1px solid rgba(154, 205, 50, 0.3)',
            boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="text-center mb-3">
            <h5 className="fw-bold text-dark font-heading m-0">Đăng Nhập Cán Bộ</h5>
            <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
              Nhập tài khoản để truy cập hệ thống
            </span>
          </div>

          {errorMsg && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3 small rounded-3" role="alert">
              <AlertCircle size={16} className="flex-shrink-0" />
              <div style={{ fontSize: '0.82rem' }}>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Tên đăng nhập Mobile */}
            <div className="mb-3">
              <label className="form-label small fw-bold text-dark mb-1">
                Tên đăng nhập
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted px-3">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  className="form-control form-control-lg border-start-0 fs-6"
                  placeholder="qtdyentho.admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Mật khẩu Mobile */}
            <div className="mb-3">
              <label className="form-label small fw-bold text-dark mb-1">
                Mật khẩu
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted px-3">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control form-control-lg border-start-0 border-end-0 fs-6"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="btn btn-light border border-start-0 text-muted px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Tài khoản mẫu 1 chạm trên Mobile */}
            <div className="mb-3 p-2 bg-light rounded-3 border">
              <div className="small fw-bold text-muted mb-1.5 d-flex align-items-center justify-content-between" style={{ fontSize: '0.75rem' }}>
                <span>⚡ Chọn nhanh tài khoản demo:</span>
                <span className="text-primary fw-normal" style={{ fontSize: '0.7rem' }}>MK: Qtd@2003</span>
              </div>
              <div className="d-flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark bg-white py-1 px-2 rounded-2 fw-semibold"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => handleQuickFill('qtdyentho.admin', 'Qtd@2003')}
                >
                  👑 Admin
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary bg-white py-1 px-2 rounded-2 fw-semibold"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => handleQuickFill('qtdyentho.cbtd', 'Qtd@2003')}
                >
                  💼 CBTD
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success bg-white py-1 px-2 rounded-2 fw-semibold"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => handleQuickFill('qtdyentho.ketoan', 'Qtd@2003')}
                >
                  📊 Kế toán
                </button>
              </div>
            </div>

            {/* Nút Đăng nhập Mobile */}
            <button
              type="submit"
              className="btn btn-brand w-100 py-2.5 fw-bold shadow d-flex align-items-center justify-content-center gap-2 rounded-3"
              style={{ fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP HỆ THỐNG'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Mobile Footer Info */}
          <div className="mt-3 pt-2 border-top text-center">
            <div className="d-inline-flex align-items-center gap-1.5 text-success small" style={{ fontSize: '0.75rem' }}>
              <ShieldCheck size={14} /> Bảo mật dữ liệu chuẩn ngân hàng
            </div>
          </div>
        </div>

        <div className="text-center mt-3">
          <span className="text-muted small" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Hỗ trợ kỹ thuật: 0237.8770.793
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 💻 GIAO DIỆN DÀNH CHO TABLET & DESKTOP (>= 768px)                         */}
      {/* ========================================================================= */}
      <div
        className="d-none d-md-block card-modern shadow-2xl overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '840px',
          borderRadius: '16px',
          border: '1.5px solid rgba(154, 205, 50, 0.35)',
          background: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
        }}
      >
        <div className="row g-0">
          {/* Cột trái: Thông tin nhận diện Quỹ */}
          <div
            className="col-md-5 p-4 p-lg-5 d-flex flex-column justify-content-between text-white"
            style={{
              backgroundColor: '#06281e',
              backgroundImage: 'linear-gradient(160deg, #06281e 0%, #091a26 100%)',
              borderRight: '1px solid rgba(154, 205, 50, 0.2)'
            }}
          >
            <div>
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="p-2.5 rounded-3 text-dark d-flex align-items-center justify-content-center flex-shrink-0 shadow"
                  style={{ background: 'linear-gradient(135deg, #9acd32 0%, #047857 100%)', width: 48, height: 48 }}
                >
                  <Landmark size={26} className="text-white" />
                </div>
                <div>
                  <h5 className="fw-extrabold m-0 text-white lh-1 font-heading" style={{ letterSpacing: '0.5px' }}>
                    QTDND YÊN THỌ
                  </h5>
                  <span style={{ fontSize: '0.75rem', color: '#a3e635', fontWeight: 600 }}>
                    Thành lập: 01/12/2003
                  </span>
                </div>
              </div>

              <h6 className="fw-bold mb-2 text-white" style={{ fontSize: '1.05rem', lineHeight: '1.4' }}>
                Hệ Thống Quản Lý Tín Dụng & Trích Nợ Tự Động
              </h6>
              <p className="small mb-4 text-slate-300" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                Phần mềm quản trị nội bộ phục vụ thẩm định hồ sơ vay vốn, kiểm tra thực địa, lập đợt trích nợ tự động và đối soát số liệu.
              </p>

              <div className="d-flex flex-column gap-2 small mb-4" style={{ color: '#e2e8f0' }}>
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle2 size={15} className="text-success" />
                  <span>Thẩm định tín dụng & Định giá TSĐB</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle2 size={15} className="text-success" />
                  <span>Trích nợ tự động CASA 3 kỳ (05, 15, 25)</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle2 size={15} className="text-success" />
                  <span>Đồng bộ 2 chiều SQL Server Core 24/7</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-top border-slate-800">
              <div className="d-flex align-items-center gap-2 small mb-1" style={{ color: '#a3e635' }}>
                <ShieldCheck size={16} />
                <span>Bảo mật dữ liệu chuẩn ngân hàng</span>
              </div>
              <div className="text-muted small d-flex align-items-center gap-1.5" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                <Phone size={13} /> Hỗ trợ kỹ thuật: 0237.8770.793
              </div>
            </div>
          </div>

          {/* Cột phải: Form đăng nhập Tablet & Desktop */}
          <div className="col-md-7 p-4 p-lg-5 bg-white d-flex flex-column justify-content-center">
            <div className="mb-4">
              <h4 className="fw-bold text-slate-900 font-heading mb-1">
                Đăng Nhập Hệ Thống
              </h4>
              <p className="text-muted small m-0">
                Nhập thông tin tài khoản cán bộ để truy cập các phân hệ.
              </p>
            </div>

            {errorMsg && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3 small rounded-3" role="alert">
                <AlertCircle size={16} className="flex-shrink-0" />
                <div>{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleLogin}>
              {/* Tên đăng nhập */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-slate-700">
                  Tên đăng nhập
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <User size={17} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Nhập tên đăng nhập (vd: qtdyentho.admin)..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Mật khẩu */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-slate-700">
                  Mật khẩu
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <Lock size={17} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control border-start-0 border-end-0"
                    placeholder="Nhập mật khẩu..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-start-0 text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Quick 1-Tap Demo Fill */}
              <div className="mb-4 p-2.5 bg-light rounded-3 border">
                <div className="small fw-bold text-muted mb-1.5 d-flex align-items-center justify-content-between" style={{ fontSize: '0.78rem' }}>
                  <span>⚡ Tài khoản mẫu trải nghiệm nhanh:</span>
                  <span className="text-primary font-monospace fw-bold" style={{ fontSize: '0.75rem' }}>Mật khẩu: Qtd@2003</span>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark bg-white py-1 px-2.5 rounded-2 fw-semibold"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => handleQuickFill('qtdyentho.admin', 'Qtd@2003')}
                  >
                    👑 Quản Trị Viên (Admin)
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary bg-white py-1 px-2.5 rounded-2 fw-semibold"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => handleQuickFill('qtdyentho.cbtd', 'Qtd@2003')}
                  >
                    💼 Cán Bộ Tín Dụng
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success bg-white py-1 px-2.5 rounded-2 fw-semibold"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => handleQuickFill('qtdyentho.ketoan', 'Qtd@2003')}
                  >
                    📊 Kế Toán Viên
                  </button>
                </div>
              </div>

              {/* Nút Đăng nhập */}
              <button
                type="submit"
                className="btn btn-brand w-100 py-2.5 fw-bold shadow d-flex align-items-center justify-content-center gap-2 rounded-3"
                disabled={loading}
              >
                {loading ? 'Đang xác thực bảo mật...' : 'ĐĂNG NHẬP HỆ THỐNG'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
