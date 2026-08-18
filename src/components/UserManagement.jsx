import React, { useState, useEffect } from 'react';
import { Users, Plus, KeyRound, Search, ShieldCheck, UserCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { hashPassword, ROLE_LABELS } from '../services/auth';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newResetPass, setNewResetPass] = useState('123456');
  const [saving, setSaving] = useState(false);

  // Form User state
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    role: 'CBTD',
    status: 'ACTIVE',
    password: ''
  });

  const fetchUsers = async () => {
    try {
      const res = await api.getUserList();
      if (res.status === 'success' && res.data) {
        setUsers(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      username: '',
      fullName: '',
      role: 'CBTD',
      status: 'ACTIVE',
      password: ''
    });
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      password: ''
    });
    setShowModal(true);
  };

  const handleOpenReset = (user) => {
    setSelectedUser(user);
    setNewResetPass('123456');
    setShowResetModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let payload = {
        username: formData.username,
        fullName: formData.fullName,
        role: formData.role,
        status: formData.status
      };

      if (formData.password) {
        payload.passwordHash = await hashPassword(formData.password);
      }

      const res = await api.saveUser(payload);
      if (res.status === 'success') {
        alert(res.message || 'Lưu tài khoản thành công!');
        setShowModal(false);
        fetchUsers();
      } else {
        alert(res.message || 'Lưu tài khoản thất bại.');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPass = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    try {
      const pHash = await hashPassword(newResetPass);
      const res = await api.resetPassword(selectedUser.username, pHash);
      if (res.status === 'success') {
        alert(res.message || `Đã reset mật khẩu tài khoản ${selectedUser.username} thành "${newResetPass}"!`);
        setShowResetModal(false);
      } else {
        alert(res.message || 'Reset mật khẩu thất bại.');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      !searchTerm ||
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Controls */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div className="input-group" style={{ maxWidth: 350 }}>
            <span className="input-group-text bg-light border-end-0">
              <Search size={16} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Tìm kiếm tài khoản người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <button className="btn btn-primary fw-bold d-flex align-items-center gap-2" onClick={handleOpenAdd}>
          <Plus size={18} /> Thêm Tài Khoản Mới
        </button>
      </div>

      {/* Users Table */}
      <div className="card-modern p-4">
        <h5 className="fw-bold mb-3 text-slate-800 d-flex align-items-center gap-2">
          <Users size={20} className="text-primary" />
          Danh Sách Tài Khoản & Phân Quyền Hệ Thống ({filtered.length})
        </h5>

        <div className="table-responsive">
          <table className="table table-custom align-middle">
            <thead>
              <tr>
                <th>Tên Đăng Nhập</th>
                <th>Họ và Tên</th>
                <th className="text-center">Vai Trò / Phân Quyền</th>
                <th className="text-center">Trạng Thái</th>
                <th>Ngày Tạo</th>
                <th>Đăng Nhập Gần Nhất</th>
                <th className="text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const roleInfo = ROLE_LABELS[u.role] || { label: u.role, badgeClass: 'badge-info-soft' };
                return (
                  <tr key={u.username}>
                    <td className="fw-bold text-primary">{u.username}</td>
                    <td className="fw-semibold text-dark">{u.fullName}</td>
                    <td className="text-center">
                      <span className={`badge-status ${roleInfo.badgeClass}`}>
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge-status ${
                          u.status === 'ACTIVE' ? 'badge-success-soft' : 'badge-danger-soft'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>
                    <td className="text-muted small">{u.createdAt || '---'}</td>
                    <td className="text-muted small">{u.lastLogin || '---'}</td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleOpenEdit(u)}
                          title="Chỉnh sửa thông tin / phân quyền"
                        >
                          Sửa
                        </button>
                        <button
                          className="btn btn-sm btn-outline-warning text-dark"
                          onClick={() => handleOpenReset(u)}
                          title="Reset mật khẩu"
                        >
                          <KeyRound size={13} /> Reset Pass
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit User */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  {selectedUser ? 'Chỉnh Sửa Tài Khoản' : 'Thêm Tài Khoản Mới'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSaveUser}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Tên Đăng Nhập (Username)</label>
                    <input
                      type="text"
                      className="form-control fw-bold"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={Boolean(selectedUser)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Họ và Tên Cán Bộ</label>
                    <input
                      type="text"
                      className="form-control fw-semibold"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>

                  {!selectedUser && (
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted">Mật Khẩu Ban Đầu</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Mặc định: 123456 (nếu để trống)"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Vai Trò & Phân Quyền (Role)</label>
                    <select
                      className="form-select fw-bold"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="ADMIN">ADMIN - Quản trị viên (Toàn quyền hệ thống)</option>
                      <option value="CBTD">CBTD - Cán bộ tín dụng (Thẩm định, Kiểm tra vốn, Nợ tồn)</option>
                      <option value="KETOAN">KETOAN - Kế toán viên (Trích nợ, Chạy đợt, Đối soát, Báo cáo)</option>
                      <option value="LANHDAO">LANHDAO - Ban Lãnh đạo (Dashboard, Phê duyệt, Báo cáo)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Trạng Thái Tài Khoản</label>
                    <select
                      className="form-select fw-semibold"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="ACTIVE">ACTIVE - Đang hoạt động bình thường</option>
                      <option value="LOCKED">LOCKED - Tạm khóa truy cập</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary fw-semibold" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold px-4" disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Lưu Tài Khoản'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {showResetModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <KeyRound size={20} /> Reset Mật Khẩu: {selectedUser?.username}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowResetModal(false)}></button>
              </div>

              <form onSubmit={handleResetPass}>
                <div className="modal-body p-4">
                  <p className="small text-muted mb-3">
                    Nhập mật khẩu mới để cấp lại cho cán bộ <strong>{selectedUser?.fullName}</strong> ({selectedUser?.username}):
                  </p>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Mật Khẩu Mới</label>
                    <input
                      type="text"
                      className="form-control fw-bold"
                      value={newResetPass}
                      onChange={(e) => setNewResetPass(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary fw-semibold" onClick={() => setShowResetModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-warning text-dark fw-bold px-4" disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Xác Nhận Reset'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
