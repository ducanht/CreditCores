import React, { useState } from 'react';
import { Lock, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { AuthService } from '../services/auth';

export default function ChangePasswordModal({ onClose }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp. Vui lòng nhập lại.');
      return;
    }

    setLoading(true);
    try {
      const res = await AuthService.changePassword(oldPassword, newPassword);
      if (res.status === 'success') {
        setSuccessMsg('Đổi mật khẩu thành công!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(res.message || 'Đổi mật khẩu thất bại.');
      }
    } catch (err) {
      setErrorMsg('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <KeyRound size={20} /> Thay Đổi Mật Khẩu Tài Khoản
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {errorMsg && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mb-3">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="alert alert-success d-flex align-items-center gap-2 py-2 small mb-3">
                  <CheckCircle2 size={16} className="flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Mật Khẩu Hiện Tại</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <Lock size={16} className="text-muted" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control border-start-0"
                    placeholder="Nhập mật khẩu cũ..."
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Mật Khẩu Mới</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <KeyRound size={16} className="text-muted" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control border-start-0"
                    placeholder="Tối thiểu 6 ký tự..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Xác Nhận Mật Khẩu Mới</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <KeyRound size={16} className="text-muted" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control border-start-0"
                    placeholder="Nhập lại mật khẩu mới..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="chkShowPass"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                <label className="form-check-label small text-muted" htmlFor="chkShowPass">
                  Hiển thị mật khẩu
                </label>
              </div>
            </div>

            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary fw-semibold" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary fw-bold px-4" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Xác Nhận Đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
