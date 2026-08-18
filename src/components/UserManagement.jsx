import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  KeyRound,
  Search,
  ShieldCheck,
  UserCheck,
  Shield,
  Sliders,
  Check,
  Save,
  Layers,
  Sparkles,
  Info,
  CheckSquare,
  Square
} from 'lucide-react';
import { api } from '../services/api';
import { hashPassword, ROLE_LABELS, MODULE_REGISTRY } from '../services/auth';

export default function UserManagement() {
  const [subTab, setSubTab] = useState('users'); // 'users' | 'roles' | 'modules'
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newResetPass, setNewResetPass] = useState('123456');
  const [saving, setSaving] = useState(false);

  // Form User state
  const [userFormData, setUserFormData] = useState({
    username: '',
    fullName: '',
    role: 'CBTD',
    customPermissions: [],
    status: 'ACTIVE',
    password: ''
  });

  // Form Role state
  const [roleFormData, setRoleFormData] = useState({
    roleCode: '',
    roleName: '',
    permissions: [],
    description: ''
  });

  const fetchData = async () => {
    try {
      const [uRes, rRes] = await Promise.all([
        api.getUserList(),
        api.getRolesAndPermissions()
      ]);

      if (uRes.status === 'success' && uRes.data) {
        setUsers(uRes.data);
      }
      if (rRes.status === 'success' && rRes.data && rRes.data.roles) {
        setRoles(rRes.data.roles);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- USER HANDLERS ---
  const handleOpenAddUser = () => {
    setUserFormData({
      username: '',
      fullName: '',
      role: 'CBTD',
      customPermissions: [],
      status: 'ACTIVE',
      password: ''
    });
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleOpenEditUser = (user) => {
    setSelectedUser(user);
    setUserFormData({
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      customPermissions: user.customPermissions || [],
      status: user.status,
      password: ''
    });
    setShowUserModal(true);
  };

  const handleToggleUserCustomPerm = (moduleId) => {
    const current = userFormData.customPermissions || [];
    if (current.includes(moduleId)) {
      setUserFormData({
        ...userFormData,
        customPermissions: current.filter((id) => id !== moduleId)
      });
    } else {
      setUserFormData({
        ...userFormData,
        customPermissions: [...current, moduleId]
      });
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let payload = {
        username: userFormData.username,
        fullName: userFormData.fullName,
        role: userFormData.role,
        customPermissions: userFormData.customPermissions,
        status: userFormData.status
      };

      if (userFormData.password) {
        payload.passwordHash = await hashPassword(userFormData.password);
      }

      const res = await api.saveUser(payload);
      if (res.status === 'success') {
        alert(res.message || 'Lưu tài khoản và phân quyền thành công!');
        setShowUserModal(false);
        fetchData();
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
        alert(res.message || `Đã reset mật khẩu cho ${selectedUser.username} thành "${newResetPass}"!`);
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

  // --- ROLE / GROUP PERMISSIONS HANDLERS ---
  const handleToggleRolePermission = async (roleCode, moduleId) => {
    const targetRole = roles.find((r) => r.roleCode === roleCode);
    if (!targetRole) return;

    let updatedPerms = [...(targetRole.permissions || [])];
    if (updatedPerms.includes(moduleId)) {
      updatedPerms = updatedPerms.filter((id) => id !== moduleId);
    } else {
      updatedPerms.push(moduleId);
    }

    // Cập nhật state local ngay lập tức
    const newRoles = roles.map((r) =>
      r.roleCode === roleCode ? { ...r, permissions: updatedPerms } : r
    );
    setRoles(newRoles);

    // Lưu vào Backend
    try {
      await api.saveRolePermissions({
        roleCode: targetRole.roleCode,
        roleName: targetRole.roleName,
        permissions: updatedPerms,
        description: targetRole.description
      });
    } catch (e) {
      console.error('Lỗi cập nhật quyền nhóm:', e);
    }
  };

  const handleOpenAddRole = () => {
    setRoleFormData({
      roleCode: '',
      roleName: '',
      permissions: ['dashboard', 'customer360'],
      description: ''
    });
    setShowRoleModal(true);
  };

  const handleSaveNewRole = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.saveRolePermissions(roleFormData);
      if (res.status === 'success') {
        alert(res.message || 'Tạo nhóm quyền mới thành công!');
        setShowRoleModal(false);
        fetchData();
      } else {
        alert(res.message || 'Tạo nhóm quyền thất bại.');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Helper tính danh sách quyền tổng hợp của một User
  const calculateEffectiveCount = (user) => {
    const roleObj = roles.find((r) => r.roleCode === user.role);
    const rolePerms = roleObj ? roleObj.permissions : [];
    const customPerms = user.customPermissions || [];
    const all = new Set([...rolePerms, ...customPerms]);
    return all.size;
  };

  const filteredUsers = users.filter(
    (u) =>
      !searchTerm ||
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="d-flex flex-column gap-4">
      {/* Navigation Sub-Tabs */}
      <div className="card-modern p-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="btn-group p-1 bg-light rounded-3">
          <button
            className={`btn btn-sm fw-bold px-3 ${
              subTab === 'users' ? 'btn-primary shadow-sm' : 'btn-light text-muted'
            }`}
            onClick={() => setSubTab('users')}
          >
            <Users size={16} className="me-1" /> Danh Sách Người Dùng & Gán Quyền ({users.length})
          </button>
          <button
            className={`btn btn-sm fw-bold px-3 ${
              subTab === 'roles' ? 'btn-primary shadow-sm' : 'btn-light text-muted'
            }`}
            onClick={() => setSubTab('roles')}
          >
            <ShieldCheck size={16} className="me-1" /> Ma Trận Phân Quyền Nhóm 360° ({roles.length})
          </button>
          <button
            className={`btn btn-sm fw-bold px-3 ${
              subTab === 'modules' ? 'btn-primary shadow-sm' : 'btn-light text-muted'
            }`}
            onClick={() => setSubTab('modules')}
          >
            <Layers size={16} className="me-1" /> Danh Mục Phân Hệ Mở Rộng ({MODULE_REGISTRY.length})
          </button>
        </div>

        {subTab === 'users' && (
          <button className="btn btn-primary fw-bold d-flex align-items-center gap-2" onClick={handleOpenAddUser}>
            <Plus size={18} /> Thêm Người Dùng Mới
          </button>
        )}

        {subTab === 'roles' && (
          <button className="btn btn-outline-primary fw-bold d-flex align-items-center gap-2" onClick={handleOpenAddRole}>
            <Plus size={18} /> Thêm Nhóm Quyền Mới
          </button>
        )}
      </div>

      {/* ================= TAB 1: USERS 360° ================= */}
      {subTab === 'users' && (
        <div className="card-modern p-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h5 className="fw-bold m-0 text-slate-800 d-flex align-items-center gap-2">
              <Users size={20} className="text-primary" />
              Quản Lý Người Dùng & Phân Quyền Cá Nhân Hóa
            </h5>

            <div className="input-group" style={{ maxWidth: 320 }}>
              <span className="input-group-text bg-light border-end-0">
                <Search size={16} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Tìm tên đăng nhập, họ tên, vai trò..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-custom align-middle">
              <thead>
                <tr>
                  <th>Tài Khoản</th>
                  <th>Họ và Tên</th>
                  <th className="text-center">Nhóm Vai Trò</th>
                  <th className="text-center">Phân Hệ Cho Phép</th>
                  <th className="text-center">Trạng Thái</th>
                  <th>Đăng Nhập Gần Nhất</th>
                  <th className="text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const roleInfo = ROLE_LABELS[u.role] || { label: u.role, badgeClass: 'badge-info-soft' };
                  const permCount = calculateEffectiveCount(u);
                  const hasCustom = u.customPermissions && u.customPermissions.length > 0;

                  return (
                    <tr key={u.username}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold"
                            style={{ width: 34, height: 34, fontSize: '0.8rem' }}
                          >
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="fw-bold text-primary">{u.username}</span>
                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                              Tạo: {u.createdAt || '---'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="fw-semibold text-dark">{u.fullName}</td>
                      <td className="text-center">
                        <span className={`badge-status ${roleInfo.badgeClass}`}>{roleInfo.label}</span>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-secondary-subtle text-dark px-2 py-1 fw-bold">
                          {permCount} / {MODULE_REGISTRY.length} phân hệ
                        </span>
                        {hasCustom && (
                          <span
                            className="badge bg-warning-subtle text-warning-emphasis ms-1"
                            title={`Có ${u.customPermissions.length} quyền riêng lẻ bổ sung`}
                          >
                            +{u.customPermissions.length} riêng
                          </span>
                        )}
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
                      <td className="text-muted small">{u.lastLogin || '---'}</td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenEditUser(u)}
                            title="Sửa thông tin & phân quyền tick chọn"
                          >
                            <Sliders size={13} className="me-1" /> Phân Quyền
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning text-dark"
                            onClick={() => {
                              setSelectedUser(u);
                              setNewResetPass('123456');
                              setShowResetModal(true);
                            }}
                            title="Reset mật khẩu"
                          >
                            <KeyRound size={13} />
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
      )}

      {/* ================= TAB 2: ROLES & GROUP PERMISSIONS MATRIX ================= */}
      {subTab === 'roles' && (
        <div className="card-modern p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold m-0 text-slate-800 d-flex align-items-center gap-2">
                <ShieldCheck size={20} className="text-primary" />
                Ma Trận Phân Quyền Nhóm Chức Năng 360°
              </h5>
              <p className="text-muted small m-0 mt-1">
                Tick chọn trực tiếp để bật/tắt quyền truy cập từng phân hệ cho từng nhóm vai trò. Thay đổi được lưu tự động lên CSDL.
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered align-middle text-center" style={{ borderColor: 'var(--card-border)' }}>
              <thead className="bg-light">
                <tr>
                  <th className="text-start" style={{ minWidth: 260 }}>
                    Phân Hệ Nghiệp Vụ
                  </th>
                  {roles.map((r) => {
                    const rInfo = ROLE_LABELS[r.roleCode] || { label: r.roleName, badgeClass: 'badge-info-soft' };
                    return (
                      <th key={r.roleCode} style={{ minWidth: 150 }}>
                        <div>{r.roleName}</div>
                        <span className={`badge-status ${rInfo.badgeClass} mt-1`} style={{ fontSize: '0.68rem' }}>
                          {r.roleCode}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {MODULE_REGISTRY.map((mod) => (
                  <tr key={mod.id}>
                    <td className="text-start">
                      <div className="fw-bold text-dark">{mod.label}</div>
                      <div className="text-muted" style={{ fontSize: '0.74rem' }}>
                        {mod.description}
                      </div>
                    </td>
                    {roles.map((r) => {
                      const isAllowed = r.permissions && r.permissions.includes(mod.id);
                      const isSystemAdmin = r.roleCode === 'ADMIN' && mod.id === 'user_management';

                      return (
                        <td key={r.roleCode + '_' + mod.id}>
                          <button
                            type="button"
                            className={`btn btn-sm ${
                              isAllowed
                                ? 'btn-success text-white'
                                : 'btn-outline-secondary opacity-50'
                            } d-inline-flex align-items-center justify-content-center p-2 rounded-circle`}
                            style={{ width: 32, height: 32 }}
                            disabled={isSystemAdmin}
                            onClick={() => handleToggleRolePermission(r.roleCode, mod.id)}
                            title={isAllowed ? 'Đang có quyền (Click để tắt)' : 'Chưa có quyền (Click để cấp)'}
                          >
                            {isAllowed ? <Check size={16} /> : <span style={{ fontSize: '0.65rem' }}>✕</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: EXTENSIBLE MODULE REGISTRY ================= */}
      {subTab === 'modules' && (
        <div className="card-modern p-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <Layers size={20} className="text-primary" />
            <h5 className="fw-bold m-0 text-slate-800">
              Danh Mục Phân Hệ Nghiệp Vụ Chuẩn Hóa (Khả Năng Mở Rộng)
            </h5>
          </div>

          <div className="alert alert-info d-flex align-items-center gap-2 py-2 small mb-4">
            <Info size={18} className="flex-shrink-0" />
            <span>
              Hệ thống được thiết kế theo kiến trúc Dynamic Registry. Mọi tính năng bổ sung trong tương lai chỉ cần khai báo mã định danh là tự động xuất hiện trong ma trận phân quyền 360°.
            </span>
          </div>

          <div className="row g-3">
            {MODULE_REGISTRY.map((mod, idx) => (
              <div className="col-md-6 col-lg-4" key={mod.id}>
                <div className="p-3 border rounded-3 bg-white h-100 shadow-sm d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="badge bg-primary-subtle text-primary fw-semibold">{mod.category}</span>
                      <span className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                        #{idx + 1} - {mod.id}
                      </span>
                    </div>
                    <h6 className="fw-bold text-slate-800 m-0 mt-2">{mod.label}</h6>
                    <p className="text-muted small mt-1 mb-0">{mod.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL ADD / EDIT USER VỚI TICK QUYỀN 360° ================= */}
      {showUserModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-2xl" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <Sliders size={20} />
                  {selectedUser ? `Cấu Hình Quyền 360°: ${selectedUser.username}` : 'Thêm Người Dùng Mới'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowUserModal(false)}></button>
              </div>

              <form onSubmit={handleSaveUser}>
                <div className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Tên Đăng Nhập (Username)</label>
                      <input
                        type="text"
                        className="form-control fw-bold"
                        value={userFormData.username}
                        onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                        disabled={Boolean(selectedUser)}
                        placeholder="cbtd_yentho, ketoan01..."
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Họ và Tên Cán Bộ</label>
                      <input
                        type="text"
                        className="form-control fw-semibold"
                        value={userFormData.fullName}
                        onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                        placeholder="Nguyễn Văn A..."
                        required
                      />
                    </div>

                    {!selectedUser && (
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">Mật Khẩu Ban Đầu</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Mặc định: 123456 (nếu để trống)"
                          value={userFormData.password}
                          onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                        />
                      </div>
                    )}

                    <div className={selectedUser ? 'col-md-6' : 'col-md-6'}>
                      <label className="form-label small fw-bold text-muted">Nhóm Vai Trò (Role/Group)</label>
                      <select
                        className="form-select fw-bold"
                        value={userFormData.role}
                        onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                      >
                        {roles.map((r) => (
                          <option key={r.roleCode} value={r.roleCode}>
                            {r.roleName} ({r.roleCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Trạng Thái Tài Khoản</label>
                      <select
                        className="form-select fw-semibold"
                        value={userFormData.status}
                        onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}
                      >
                        <option value="ACTIVE">ACTIVE - Đang hoạt động</option>
                        <option value="LOCKED">LOCKED - Tạm khóa truy cập</option>
                      </select>
                    </div>
                  </div>

                  {/* GRANULAR TICK BOX 360° */}
                  <div className="pt-3 border-top">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="fw-bold text-slate-800 d-flex align-items-center gap-2">
                        <Sparkles size={16} className="text-warning" />
                        <span>TÙY BIẾN QUYỀN TRUY CẬP RIÊNG LẺ (CUSTOM PERMISSIONS):</span>
                      </div>
                      <span className="text-muted small">Tick chọn để mở rộng quyền ngoài nhóm</span>
                    </div>

                    <div className="row g-2">
                      {MODULE_REGISTRY.map((mod) => {
                        const roleObj = roles.find((r) => r.roleCode === userFormData.role);
                        const isInherited = roleObj && roleObj.permissions && roleObj.permissions.includes(mod.id);
                        const isCustomChecked = userFormData.customPermissions && userFormData.customPermissions.includes(mod.id);
                        const isActive = isInherited || isCustomChecked;

                        return (
                          <div className="col-md-6" key={mod.id}>
                            <div
                              onClick={() => {
                                if (!isInherited) handleToggleUserCustomPerm(mod.id);
                              }}
                              className={`p-2 border rounded-3 d-flex align-items-center justify-content-between ${
                                isInherited
                                  ? 'bg-light border-primary-subtle opacity-75'
                                  : isCustomChecked
                                  ? 'bg-success-subtle border-success'
                                  : 'bg-white'
                              }`}
                              style={{ cursor: isInherited ? 'not-allowed' : 'pointer' }}
                            >
                              <div className="d-flex align-items-center gap-2 overflow-hidden">
                                {isInherited ? (
                                  <CheckSquare size={18} className="text-primary flex-shrink-0" />
                                ) : isCustomChecked ? (
                                  <CheckSquare size={18} className="text-success flex-shrink-0" />
                                ) : (
                                  <Square size={18} className="text-muted flex-shrink-0" />
                                )}
                                <div className="text-truncate">
                                  <div className="fw-bold small text-dark text-truncate">{mod.label}</div>
                                  <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                                    {isInherited ? '(Thừa hưởng từ nhóm vai trò)' : '(Quyền tùy chỉnh riêng lẻ)'}
                                  </div>
                                </div>
                              </div>

                              <span
                                className={`badge ${
                                  isInherited
                                    ? 'bg-primary-subtle text-primary'
                                    : isCustomChecked
                                    ? 'bg-success text-white'
                                    : 'bg-light text-muted'
                                }`}
                                style={{ fontSize: '0.65rem' }}
                              >
                                {isInherited ? 'Kế thừa' : isCustomChecked ? 'Cấp riêng' : 'Chưa có'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary fw-semibold" onClick={() => setShowUserModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold px-4" disabled={saving}>
                    {saving ? 'Đang lưu CSDL...' : 'Lưu Tài Khoản & Quyền'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL THÊM NHÓM QUYỀN MỚI ================= */}
      {showRoleModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Thêm Nhóm Quyền Nghiệp Vụ Mới</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRoleModal(false)}></button>
              </div>

              <form onSubmit={handleSaveNewRole}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Mã Nhóm (Role Code)</label>
                    <input
                      type="text"
                      className="form-control text-uppercase fw-bold"
                      placeholder="THUQUY, KIEMSOAT, THANHTRA..."
                      value={roleFormData.roleCode}
                      onChange={(e) => setRoleFormData({ ...roleFormData, roleCode: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Tên Nhóm Quyền</label>
                    <input
                      type="text"
                      className="form-control fw-semibold"
                      placeholder="Thủ Quỹ, Kiểm Soát Viên..."
                      value={roleFormData.roleName}
                      onChange={(e) => setRoleFormData({ ...roleFormData, roleName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Mô Tả Nhiệm Vụ</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Mô tả phạm vi quyền hạn..."
                      value={roleFormData.description}
                      onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary fw-semibold" onClick={() => setShowRoleModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold px-4" disabled={saving}>
                    {saving ? 'Đang tạo...' : 'Tạo Nhóm Mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL RESET PASSWORD ================= */}
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
                    Cấp lại mật khẩu mới cho cán bộ <strong>{selectedUser?.fullName}</strong> ({selectedUser?.username}):
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
