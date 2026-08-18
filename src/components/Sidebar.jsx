import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  ClipboardList,
  UserCheck,
  Zap,
  ArrowLeftRight,
  AlertTriangle,
  FileBarChart2,
  Settings,
  ShieldAlert,
  UserCog,
  Landmark,
  LogOut,
  KeyRound
} from 'lucide-react';
import { AuthService, ROLE_LABELS } from '../services/auth';

export default function Sidebar({ activeTab, setActiveTab, currentUser, onOpenChangePass, onLogout }) {
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard Quản trị', icon: LayoutDashboard },
    { id: 'customer360', label: 'Tra cứu KH & HĐ 360°', icon: Users },
    { id: 'appraisal', label: 'Thẩm định Tín dụng & TSĐB', icon: FileCheck2 },
    { id: 'inspection', label: 'Kiểm tra Sử dụng Vốn', icon: ClipboardList },
    { id: 'debit_register', label: 'Đăng ký Trích nợ', icon: UserCheck },
    { id: 'debit_batch', label: 'Chạy đợt Trích nợ', icon: Zap },
    { id: 'reconciliation', label: 'Đối soát & Kết quả', icon: ArrowLeftRight },
    { id: 'debt_warning', label: 'Cảnh báo Nợ tồn đọng', icon: AlertTriangle },
    { id: 'reports', label: 'Báo cáo Thống kê', icon: FileBarChart2 },
    { id: 'user_management', label: 'Quản lý Tài khoản (Admin)', icon: UserCog },
    { id: 'settings', label: 'Cấu hình & Đồng bộ Core', icon: Settings }
  ];

  // Role-based filtering
  const visibleMenuItems = allMenuItems.filter((item) => AuthService.hasPermission(item.id));

  const roleInfo = ROLE_LABELS[currentUser?.role] || {
    label: currentUser?.role || 'Cán Bộ',
    badgeClass: 'badge-info-soft'
  };

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        backgroundColor: 'var(--primary-color)',
        color: '#fff',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 10px rgba(0,0,0,0.15)'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          backgroundColor: 'rgba(0,0,0,0.18)',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <Landmark className="text-info me-2" size={24} />
        <div>
          <h1 className="m-0 fs-6 fw-bold text-white lh-1">CreditCores</h1>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Core Credit & Auto-Debit</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '12px 0' }}>
        <div
          style={{
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'rgba(255,255,255,0.4)',
            padding: '8px 20px',
            fontWeight: 700
          }}
        >
          Phân hệ Nghiệp vụ
        </div>

        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '11px 20px',
                fontSize: '0.88rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : '#cbd5e1',
                backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                borderLeft: isActive ? '4px solid #38bdf8' : '4px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              className="sidebar-link"
            >
              <Icon size={18} className={`me-3 ${isActive ? 'text-info' : 'text-slate-400'}`} />
              <span className="text-truncate">{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Authenticated User Footer & Actions */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: 'rgba(0,0,0,0.22)',
          fontSize: '0.78rem'
        }}
      >
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center overflow-hidden">
            <div
              className="rounded-circle bg-info text-dark d-flex align-items-center justify-content-center fw-bold me-2 flex-shrink-0"
              style={{ width: 34, height: 34, fontSize: '0.82rem' }}
            >
              {currentUser?.username ? currentUser.username.substring(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="overflow-hidden">
              <div className="fw-bold text-white text-truncate" style={{ fontSize: '0.85rem' }}>
                {currentUser?.fullName || currentUser?.username || 'Cán Bộ'}
              </div>
              <span className={`badge-status ${roleInfo.badgeClass}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                {roleInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* User Quick Actions: Change Pass & Logout */}
        <div className="d-flex gap-1 pt-1 border-top border-slate-700 mt-2">
          <button
            className="btn btn-sm btn-outline-light text-slate-300 w-50 d-flex align-items-center justify-content-center gap-1 py-1"
            style={{ fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.2)' }}
            onClick={onOpenChangePass}
            title="Đổi mật khẩu tài khoản"
          >
            <KeyRound size={12} /> Đổi Pass
          </button>
          <button
            className="btn btn-sm btn-outline-danger w-50 d-flex align-items-center justify-content-center gap-1 py-1"
            style={{ fontSize: '0.72rem' }}
            onClick={onLogout}
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut size={12} /> Đăng Xuất
          </button>
        </div>
      </div>
    </aside>
  );
}
