import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  KeyRound,
  Search,
  ShieldCheck,
  UserCheck,
  Shield,
  Check,
  Save,
  Layers,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { hashPassword, ROLE_LABELS, MODULE_REGISTRY } from '../services/auth';
import Pagination from './Pagination';

const GROUPS_METADATA = [
  {
    code: 'ADMIN',
    name: 'Quản Trị Viên (Admin)',
    badgeClass: 'badge-danger-soft',
    description: 'Toàn quyền quản trị hệ thống, quản lý người dùng và cấu hình tham số'
  },
  {
    code: 'CBTD',
    name: 'Cán Bộ Tín Dụng',
    badgeClass: 'badge-brand-soft',
    description: 'Thẩm định hồ sơ vay vốn, lập biên bản kiểm tra sử dụng vốn và tra cứu 360°'
  },
  {
    code: 'KETOAN',
    name: 'Kế Toán Viên / Thủ Quỹ',
    badgeClass: 'badge-success-soft',
    description: 'Quản lý thỏa thuận ủy quyền trích nợ, tạo đợt trích nợ tự động và đối soát số liệu'
  },
  {
    code: 'BKS',
    name: 'Ban Kiểm Soát / Giám Đốc',
    badgeClass: 'badge-warning-soft',
    description: 'Giám sát hoạt động tín dụng, cảnh báo nợ quá hạn và xem báo cáo thống kê đa chiều'
  }
];

export default function UserManagement() {
  const [activeSubTab, setActiveSubTab] = useState('roles'); // 'roles' | 'users'
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(15);
  const [saving, setSaving] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  // Modals state
  const [showUserModal, setShowUserModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newResetPass, setNewResetPass] = useState('Qtd@2003');

  // Form User state
  const [userFormData, setUserFormData] = useState({
    username: '',
    fullName: '',
    role: 'CBTD',
    customPermissions: [],
    status: 'ACTIVE',
    password: 'Qtd@2003'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([
        api.getUserList(),
        api.getRolesAndPermissions()
      ]);

      if (uRes.status === 'success' && uRes.data) {
        setUsers(uRes.data);
      }
      if (rRes.status === 'success' && rRes.data) {
        const rolesList = Array.isArray(rRes.data) ? rRes.data : (rRes.data.roles || []);
        // Đảm bảo có đủ 4 nhóm
        const mergedRoles = GROUPS_METADATA.map(g => {
          const found = rolesList.find(r => r.roleCode === g.code);
          return {
            roleCode: g.code,
            roleName: g.name,
            description: g.description,
            permissions: found?.permissions || (
              g.code === 'ADMIN' ? MODULE_REGISTRY.map(m => m.id) :
              g.code === 'CBTD' ? ['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_register', 'reports'] :
              g.code === 'KETOAN' ? ['dashboard', 'customer360', 'debit_register', 'debit_batch', 'reconciliation', 'debt_warning', 'reports'] :
              ['dashboard', 'customer360', 'appraisal', 'inspection', 'debt_warning', 'reports']
            )
          };
        });
        setRoles(mergedRoles);
      }
    } catch (e) {
      console.error('Lỗi nạp dữ liệu phân quyền:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (msg, type = 'success') => {
    setAlertInfo({ msg, type });
    setTimeout(() => setAlertInfo(null), 4000);
  };

  // --- ROLE PERMISSION MATRIX HANDLERS ---
  const toggleGroupPermission = (roleCode, moduleId) => {
    setRoles(prevRoles =>
      prevRoles.map(role => {
        if (role.roleCode === roleCode) {
          const currentPerms = role.permissions || [];
          const exists = currentPerms.includes(moduleId);
          const newPerms = exists
            ? currentPerms.filter(p => p !== moduleId)
            : [...currentPerms, moduleId];
          return { ...role, permissions: newPerms };
        }
        return role;
      })
    );
  };

  const handleSaveGroupPermissions = async (roleObj) => {
    setSaving(true);
    try {
      const res = await api.saveRolePermissions(roleObj);
      if (res.status === 'success') {
        showNotification(res.message || `Đã lưu phân quyền nhóm ${roleObj.roleName} thành công!`);
      } else {
        showNotification(res.message || 'Lỗi lưu phân quyền nhóm.', 'danger');
      }
    } catch (e) {
      showNotification('Lỗi kết nối máy chủ: ' + e.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllGroups = async () => {
    setSaving(true);
    try {
      for (const r of roles) {
        await api.saveRolePermissions(r);
      }
      showNotification('Đã cập nhật ma trận phân quyền cho toàn bộ 4 nhóm nghiệp vụ thành công!');
    } catch (e) {
      showNotification('Lỗi lưu phân quyền: ' + e.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  // --- USER ACCOUNT HANDLERS ---
  const handleOpenAddUser = () => {
    setUserFormData({
      username: '',
      fullName: '',
      role: 'CBTD',
      customPermissions: [],
      status: 'ACTIVE',
      password: 'Qtd@2003'
    });
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u) => {
    setSelectedUser(u);
    setUserFormData({
      username: u.username,
      fullName: u.fullName,
      role: u.role || 'CBTD',
      customPermissions: u.customPermissions || [],
      status: u.status || 'ACTIVE',
      password: ''
    });
    setShowUserModal(true);
  };

  const handleSaveUserSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!userFormData.username.trim() || !userFormData.fullName.trim()) {
      alert('Vui lòng nhập đầy đủ tên đăng nhập và họ tên.');
      return;
    }

    setSaving(true);
    try {
      let pHash = undefined;
      if (!selectedUser && userFormData.password) {
        pHash = await hashPassword(userFormData.password);
      }

      const payload = {
        username: userFormData.username.trim().toLowerCase(),
        fullName: userFormData.fullName.trim(),
        role: userFormData.role,
        customPermissions: userFormData.customPermissions,
        status: userFormData.status,
        passwordHash: pHash
      };

      const res = await api.saveUser(payload);
      if (res.status === 'success') {
        showNotification(res.message || 'Lưu thông tin tài khoản thành công!');
        setShowUserModal(false);
        fetchData();
      } else {
        showNotification(res.message || 'Lỗi lưu tài khoản.', 'danger');
      }
    } catch (err) {
      showNotification('Lỗi: ' + err.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (!selectedUser || !newResetPass) return;
    setSaving(true);
    try {
      const pHash = await hashPassword(newResetPass);
      const res = await api.resetPassword(selectedUser.username, pHash);
      if (res.status === 'success') {
        showNotification(`Đã đặt lại mật khẩu cho tài khoản ${selectedUser.username} thành công!`);
        setShowResetModal(false);
      } else {
        showNotification(res.message || 'Lỗi reset mật khẩu.', 'danger');
      }
    } catch (err) {
      showNotification('Lỗi: ' + err.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u =>
    !searchTerm ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * userPageSize,
    userPage * userPageSize
  );

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header & Sub-tab navigation */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <div
            className="p-2 rounded-3 text-dark d-flex align-items-center justify-content-center"
            style={{ background: 'linear-gradient(135deg, #9acd32 0%, #047857 100%)', width: 42, height: 42 }}
          >
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h5 className="fw-bold m-0 text-slate-800 font-heading">
              Quản Trị Phân Quyền & Người Dùng
            </h5>
            <span className="text-muted small">
              Quản lý phân quyền truy cập theo 4 nhóm nghiệp vụ và danh sách cán bộ
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="d-flex align-items-center gap-2">
          <div className="btn-group p-1 bg-light rounded-3 border">
            <button
              type="button"
              className={`btn btn-sm ${activeSubTab === 'roles' ? 'btn-brand fw-bold shadow-sm' : 'btn-light text-muted'}`}
              onClick={() => setActiveSubTab('roles')}
            >
              <Layers size={14} className="me-1" /> Phân Quyền Theo Nhóm
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeSubTab === 'users' ? 'btn-brand fw-bold shadow-sm' : 'btn-light text-muted'}`}
              onClick={() => setActiveSubTab('users')}
            >
              <Users size={14} className="me-1" /> Danh Sách Tài Khoản
            </button>
          </div>

          <button
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={fetchData}
            disabled={loading}
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={14} className={loading ? 'fa-spin' : ''} />
          </button>
        </div>
      </div>

      {alertInfo && (
        <div className={`alert alert-${alertInfo.type} d-flex align-items-center gap-2 py-2 px-3 small shadow-sm`}>
          <AlertCircle size={16} />
          <div>{alertInfo.msg}</div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: MA TRẬN PHÂN QUYỀN THEO NHÓM (GROUP PERMISSIONS MATRIX) */}
      {/* ========================================================================= */}
      {activeSubTab === 'roles' && (
        <div className="card-modern p-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h6 className="fw-bold text-slate-800 m-0 d-flex align-items-center gap-2">
                <Shield size={18} className="text-success" /> Ma Trận Phân Quyền Truy Cập (4 Nhóm Nghiệp Vụ)
              </h6>
              <span className="text-muted small">
                Chọn để cấp quyền truy cập từng phân hệ chức năng cho từng nhóm nghiệp vụ
              </span>
            </div>

            <button
              className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-2"
              onClick={handleSaveAllGroups}
              disabled={saving}
            >
              <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu Tất Cả Phân Quyền'}
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-custom align-middle">
              <thead>
                <tr>
                  <th style={{ minWidth: 260 }}>Phân Hệ Chức Năng (11 Module)</th>
                  <th style={{ width: 140 }}>Phạm Vi</th>
                  {roles.map(r => (
                    <th key={r.roleCode} className="text-center" style={{ width: 170 }}>
                      <div className="d-flex flex-column align-items-center">
                        <span className="fw-bold text-dark">{r.roleName.split('(')[0].trim()}</span>
                        <span className="badge bg-light text-muted border font-monospace mt-1" style={{ fontSize: '0.68rem' }}>
                          {r.roleCode}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULE_REGISTRY.map((mod) => (
                  <tr key={mod.id}>
                    <td>
                      <div className="fw-bold text-dark">{mod.label}</div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{mod.description}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-secondary border">
                        {mod.category}
                      </span>
                    </td>

                    {roles.map(role => {
                      const isAllowed = (role.permissions || []).includes(mod.id);
                      const isAdmin = role.roleCode === 'ADMIN';

                      return (
                        <td key={role.roleCode} className="text-center">
                          <button
                            type="button"
                            className={`btn btn-sm p-1 rounded-3 ${
                              isAllowed ? 'btn-success text-white' : 'btn-outline-secondary text-muted'
                            }`}
                            onClick={() => toggleGroupPermission(role.roleCode, mod.id)}
                            style={{ width: 34, height: 34 }}
                            title={`${isAllowed ? 'Đang cấp quyền' : 'Chưa cấp quyền'} cho nhóm ${role.roleName}`}
                          >
                            {isAllowed ? <Check size={16} /> : <Square size={16} />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Group Summary Cards */}
          <div className="row g-3 mt-3">
            {roles.map(r => {
              const meta = GROUPS_METADATA.find(g => g.code === r.roleCode) || {};
              const permCount = (r.permissions || []).length;

              return (
                <div key={r.roleCode} className="col-md-6 col-lg-3">
                  <div className="p-3 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className={`badge-status ${meta.badgeClass || 'badge-brand-soft'}`}>
                          {r.roleCode}
                        </span>
                        <span className="small fw-bold text-primary">
                          {permCount} / {MODULE_REGISTRY.length} quyền
                        </span>
                      </div>
                      <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.9rem' }}>
                        {r.roleName}
                      </h6>
                      <p className="text-muted small m-0" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                        {r.description}
                      </p>
                    </div>

                    <button
                      className="btn btn-sm btn-outline-success mt-3 fw-bold w-100 d-flex align-items-center justify-content-center gap-1"
                      onClick={() => handleSaveGroupPermissions(r)}
                      disabled={saving}
                    >
                      <Save size={13} /> Lưu Nhóm Này
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DANH SÁCH TÀI KHOẢN & GÁN NHÓM (USER ACCOUNTS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'users' && (
        <div className="card-modern p-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h6 className="fw-bold text-slate-800 m-0 d-flex align-items-center gap-2">
                <Users size={18} className="text-primary" /> Danh Sách Tài Khoản Cán Bộ & Gán Nhóm
              </h6>
              <span className="text-muted small">
                Gán tài khoản cán bộ vào đúng nhóm nghiệp vụ để tự động kế thừa phân quyền
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <div className="input-group input-group-sm" style={{ width: 240 }}>
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Tìm theo username, tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button
                className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-1"
                onClick={handleOpenAddUser}
              >
                <Plus size={15} /> Thêm Tài Khoản
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-custom align-middle">
              <thead>
                <tr>
                  <th>Tài Khoản (Username)</th>
                  <th>Họ Và Tên</th>
                  <th>Nhóm Nghiệp Vụ</th>
                  <th className="text-center">Trạng Thái</th>
                  <th>Lần Đăng Nhập Cuối</th>
                  <th className="text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((u) => {
                    const groupMeta = GROUPS_METADATA.find(g => g.code === u.role) || {};
                    const roleLabel = ROLE_LABELS[u.role] || { label: u.role, badgeClass: 'badge-brand-soft' };
                    const isLocked = u.status === 'LOCKED';

                    return (
                      <tr key={u.username}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                              style={{
                                width: 32,
                                height: 32,
                                background: 'linear-gradient(135deg, #9acd32 0%, #047857 100%)',
                                color: '#0f172a',
                                fontSize: '0.78rem'
                              }}
                            >
                              {(u.fullName || u.username)[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-bold font-monospace text-dark">{u.username}</div>
                              <span className="text-muted small" style={{ fontSize: '0.7rem' }}>Ngày tạo: {u.createdAt || '---'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="fw-semibold text-dark">{u.fullName}</td>
                        <td>
                          <span className={`badge-status ${roleLabel.badgeClass}`}>
                            {roleLabel.label} ({u.role})
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`badge ${isLocked ? 'bg-danger' : 'bg-success'}`}>
                            {isLocked ? 'Đã khóa' : 'Hoạt động'}
                          </span>
                        </td>
                        <td className="small text-muted">{u.lastLogin || '---'}</td>
                        <td className="text-center">
                          <div className="d-inline-flex gap-1">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleOpenEditUser(u)}
                              title="Chỉnh sửa thông tin & đổi nhóm"
                            >
                              Sửa
                            </button>
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => {
                                setSelectedUser(u);
                                setNewResetPass('Qtd@2003');
                                setShowResetModal(true);
                              }}
                              title="Đặt lại mật khẩu"
                            >
                              <KeyRound size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      {loading ? 'Đang tải danh sách tài khoản...' : 'Không tìm thấy tài khoản phù hợp.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang danh sách tài khoản */}
          <Pagination
            currentPage={userPage}
            totalItems={filteredUsers.length}
            pageSize={userPageSize}
            onPageChange={setUserPage}
            onPageSizeChange={setUserPageSize}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM / SỬA TÀI KHOẢN VÀ GÁN NHÓM */}
      {/* ========================================================================= */}
      {showUserModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark font-heading">
                  {selectedUser ? 'Chỉnh Sửa Tài Khoản Cán Bộ' : 'Thêm Mới Tài Khoản Cán Bộ'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowUserModal(false)} />
              </div>

              <form onSubmit={handleSaveUserSubmit}>
                <div className="modal-body py-3">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">
                      Tên Đăng Nhập (Username)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="vd: qtdyentho.cbtd..."
                      value={userFormData.username}
                      onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                      disabled={Boolean(selectedUser)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">
                      Họ Và Tên Cán Bộ
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="vd: Lê Văn Tín"
                      value={userFormData.fullName}
                      onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">
                      Nhóm Nghiệp Vụ Phân Quyền
                    </label>
                    <select
                      className="form-select fw-semibold"
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    >
                      <option value="ADMIN">Quản Trị Viên (ADMIN) - Toàn quyền</option>
                      <option value="CBTD">Cán Bộ Tín Dụng (CBTD)</option>
                      <option value="KETOAN">Kế Toán Viên (KETOAN)</option>
                      <option value="BKS">Ban Kiểm Soát (BKS)</option>
                      <option value="LANHDAO">Ban Giám Đốc / HĐQT (LANHDAO)</option>
                    </select>
                    <div className="form-text small text-muted mt-1">
                      Tài khoản sẽ tự động kế thừa toàn bộ quyền hạn của nhóm đã được cấu hình trong Ma trận phân quyền.
                    </div>
                  </div>

                  {!selectedUser && (
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-dark">
                        Mật Khẩu Khởi Tạo
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Mặc định: Qtd@2003"
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">
                      Trạng Thái Tài Khoản
                    </label>
                    <select
                      className="form-select"
                      value={userFormData.status}
                      onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}
                    >
                      <option value="ACTIVE">Hoạt động (Cho phép đăng nhập)</option>
                      <option value="LOCKED">Khóa tài khoản (Tạm dừng truy cập)</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowUserModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-brand fw-bold" disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Lưu Tài Khoản'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESET MẬT KHẨU */}
      {/* ========================================================================= */}
      {showResetModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark font-heading d-flex align-items-center gap-2">
                  <KeyRound size={20} className="text-warning" /> Đặt Lại Mật Khẩu
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowResetModal(false)} />
              </div>

              <div className="modal-body py-3">
                <p className="small text-muted mb-3">
                  Đặt lại mật khẩu mới cho tài khoản: <strong className="text-dark">{selectedUser?.username}</strong> ({selectedUser?.fullName})
                </p>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">
                    Mật Khẩu Mới
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập mật khẩu mới..."
                    value={newResetPass}
                    onChange={(e) => setNewResetPass(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-light" onClick={() => setShowResetModal(false)}>
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-warning fw-bold text-dark"
                  onClick={handleResetPasswordSubmit}
                  disabled={saving}
                >
                  {saving ? 'Đang thực hiện...' : 'Xác Nhận Đổi Mật Khẩu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
