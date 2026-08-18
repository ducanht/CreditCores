import React, { useState } from 'react';
import { Landmark, Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { AuthService } from '../services/auth';

export default function LoginModal({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
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
      const res = await AuthService.login(username, password);
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickSelectAccount = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#070a12',
        backgroundImage: 'radial-gradient(at 100% 0%, rgba(154, 205, 50, 0.12) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(4, 120, 87, 0.12) 0px, transparent 50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
    >
      <div
        className="card-modern shadow-2xl overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '860px',
          borderRadius: '16px',
          border: '1.5px solid rgba(154, 205, 50, 0.35)',
          background: '#ffffff',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="row g-0">
          {/* Cột trái: Thông tin nhận diện Quỹ */}
          <div
            className="col-lg-5 p-4 p-md-5 d-flex flex-column justify-content-between text-white"
            style={{
              backgroundColor: '#06281e',
              backgroundImage: 'linear-gradient(160deg, #06281e 0%, #091a26 100%)',
              borderRight: '1px solid rgba(154, 205, 50, 0.2)'
            }}
          >
            <div>
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="p-2 rounded-3 text-dark d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #9acd32 0%, #047857 100%)', width: 44, height: 44 }}
                >
                  <Landmark size={24} className="text-white" />
                </div>
                <div>
                  <h5 className="fw-extrabold m-0 text-white lh-1 font-heading" style={{ letterSpacing: '0.5px' }}>
                    QTDND YÊN THỌ
                  </h5>
                  <span style={{ fontSize: '0.72rem', color: '#a3e635', fontWeight: 600 }}>
                    Thành lập: 01/12/2003
                  </span>
                </div>
              </div>

              <h6 className="fw-bold mb-2 text-white" style={{ fontSize: '1.05rem', lineHeight: '1.4' }}>
                Hệ Thống Quản Lý Tín Dụng & Trích Nợ Tự Động
              </h6>
              <p className="small mb-4" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                Phần mềm quản trị nội bộ phục vụ thẩm định hồ sơ vay vốn, kiểm tra thực địa, lập đợt trích nợ tự động và đối soát số liệu.
              </p>
            </div>

            <div className="pt-3 border-top border-slate-800">
              <div className="d-flex align-items-center gap-2 small mb-2" style={{ color: '#a3e635' }}>
                <ShieldCheck size={16} />
                <span>Bảo mật dữ liệu chuẩn ngân hàng</span>
              </div>
              <div className="text-muted small" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Hỗ trợ kỹ thuật: 0237.8770.793
              </div>
            </div>
          </div>

          {/* Cột phải: Khung đăng nhập */}
          <div className="col-lg-7 p-4 p-md-5 bg-white d-flex flex-column justify-content-between">
            <div>
              <div className="mb-4">
                <h4 className="fw-bold text-slate-900 font-heading mb-1">
                  Đăng Nhập
                </h4>
                <p className="text-muted small m-0">
                  Nhập thông tin tài khoản cán bộ để truy cập hệ thống.
                </p>
              </div>

              {errorMsg && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3 small" role="alert">
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
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Nhập tên đăng nhập (vd: admin, cbtd...)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
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
                      <Lock size={16} />
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
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Nút Đăng nhập */}
                <button
                  type="submit"
                  className="btn btn-brand w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 mb-3"
                  disabled={loading}
                >
                  {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </div>

            {/* Chọn nhanh tài khoản cán bộ */}
            <div className="pt-3 border-top border-slate-200">
              <div className="text-muted small fw-semibold mb-2" style={{ fontSize: '0.72rem' }}>
                TÀI KHOẢN NGHIỆP VỤ MẪU:
              </div>
              <div className="d-flex flex-wrap gap-1">
                <button
                  type="button"
                  className={`btn btn-sm ${username === 'admin' ? 'btn-dark' : 'btn-outline-secondary'}`}
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => quickSelectAccount('admin', '123456')}
                >
                  Quản trị viên (admin)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${username === 'cbtd' ? 'btn-dark' : 'btn-outline-secondary'}`}
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => quickSelectAccount('cbtd', '123456')}
                >
                  Cán bộ tín dụng (cbtd)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${username === 'ketoan' ? 'btn-dark' : 'btn-outline-secondary'}`}
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => quickSelectAccount('ketoan', '123456')}
                >
                  Kế toán (ketoan)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${username === 'lanhdao' ? 'btn-dark' : 'btn-outline-secondary'}`}
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => quickSelectAccount('lanhdao', '123456')}
                >
                  Ban giám đốc (lanhdao)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
