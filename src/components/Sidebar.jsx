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
  UserCog,
  Landmark,
  LogOut,
  KeyRound,
  X
} from 'lucide-react';
import { AuthService, ROLE_LABELS } from '../services/auth';

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenChangePass,
  onLogout,
  isMobileOpen,
  onCloseMobile
}) {
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard Quản trị', icon: LayoutDashboard, category: 'TỔNG QUAN' },
    { id: 'customer360', label: 'Tra cứu KH & HĐ 360°', icon: Users, category: 'KHÁCH HÀNG' },
    { id: 'appraisal', label: 'Thẩm định Tín dụng & TSĐB', icon: FileCheck2, category: 'TÍN DỤNG' },
    { id: 'inspection', label: 'Kiểm tra Sử dụng Vốn', icon: ClipboardList, category: 'TÍN DỤNG' },
    { id: 'debit_register', label: 'Đăng ký Trích nợ', icon: UserCheck, category: 'TRÍCH NỢ' },
    { id: 'debit_batch', label: 'Chạy đợt Trích nợ', icon: Zap, category: 'TRÍCH NỢ' },
    { id: 'reconciliation', label: 'Đối soát & Kết quả', icon: ArrowLeftRight, category: 'KẾ TOÁN' },
    { id: 'debt_warning', label: 'Cảnh báo Nợ tồn đọng', icon: AlertTriangle, category: 'QUẢN LÝ NỢ' },
    { id: 'reports', label: 'Báo cáo Thống kê', icon: FileBarChart2, category: 'BÁO CÁO' },
    { id: 'user_management', label: 'Phân quyền 360° & User', icon: UserCog, category: 'HỆ THỐNG' },
    { id: 'settings', label: 'Cấu hình & Đồng bộ Core', icon: Settings, category: 'HỆ THỐNG' }
  ];

  // Role-based filtering
  const visibleMenuItems = allMenuItems.filter((item) => AuthService.hasPermission(item.id));

  const roleInfo = ROLE_LABELS[currentUser?.role] || {
    label: currentUser?.role || 'Cán Bộ',
    badgeClass: 'badge-info-soft'
  };

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <div
        className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
      />

      <aside
        className={`sidebar-drawer ${isMobileOpen ? 'open' : ''}`}
        style={{
          width: 'var(--sidebar-width)',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          backgroundColor: 'var(--brand-navy-900)',
          backgroundImage: 'linear-gradient(180deg, #0b192c 0%, #06111f 100%)',
          color: '#fff',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 20px rgba(0,0,0,0.25)',
          borderRight: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <div
              className="p-2 rounded-3 text-dark d-flex align-items-center justify-content-center"
              style={{ background: 'linear-gradient(135deg, #00d2d3 0%, #38bdf8 100%)', width: 38, height: 38 }}
            >
              <Landmark size={20} className="text-dark" />
            </div>
            <div>
              <h1 className="m-0 fs-6 fw-bold text-white lh-1 font-heading" style={{ letterSpacing: '0.5px' }}>
                CreditCores
              </h1>
              <span style={{ fontSize: '0.66rem', color: '#94a3b8', fontWeight: 500 }}>
                Core Credit & Auto-Debit
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            className="btn btn-sm btn-link text-white d-lg-none p-1"
            onClick={onCloseMobile}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '12px 10px' }}>
          {visibleMenuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const prevItem = index > 0 ? visibleMenuItems[index - 1] : null;
            const showCategory = !prevItem || prevItem.category !== item.category;

            return (
              <React.Fragment key={item.id}>
                {showCategory && (
                  <div
                    style={{
                      fontSize: '0.62rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1.2px',
                      color: 'rgba(255,255,255,0.35)',
                      padding: '12px 12px 4px 12px',
                      fontWeight: 800
                    }}
                  >
                    {item.category}
                  </div>
                )}
                <div
                  onClick={() => handleSelectTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 14px',
                    margin: '2px 0',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#ffffff' : '#cbd5e1',
                    background: isActive
                      ? 'linear-gradient(90deg, rgba(37, 99, 235, 0.28) 0%, rgba(37, 99, 235, 0.05) 100%)'
                      : 'transparent',
                    borderRadius: '10px',
                    borderLeft: isActive ? '3.5px solid #00d2d3' : '3.5px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                  }}
                  className="sidebar-link"
                >
                  <Icon
                    size={18}
                    className={`me-3 flex-shrink-0 ${isActive ? 'text-info' : 'text-slate-400'}`}
                    style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(0, 210, 211, 0.5))' : 'none' }}
                  />
                  <span className="text-truncate">{item.label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Authenticated User Footer & Profile Card */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            backgroundColor: 'rgba(0,0,0,0.3)',
            fontSize: '0.78rem'
          }}
        >
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center overflow-hidden">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold me-2 flex-shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  fontSize: '0.82rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                }}
              >
                {currentUser?.username ? currentUser.username.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="overflow-hidden">
                <div className="fw-bold text-white text-truncate" style={{ fontSize: '0.85rem' }}>
                  {currentUser?.fullName || currentUser?.username || 'Cán Bộ'}
                </div>
                <span className={`badge-status ${roleInfo.badgeClass}`} style={{ fontSize: '0.66rem', padding: '2px 8px' }}>
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="d-flex gap-2 pt-2 border-top border-slate-800 mt-2">
            <button
              className="btn btn-sm btn-outline-light text-slate-300 flex-grow-1 d-flex align-items-center justify-content-center gap-1 py-1"
              style={{ fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '6px' }}
              onClick={onOpenChangePass}
              title="Đổi mật khẩu tài khoản"
            >
              <KeyRound size={12} /> Đổi Pass
            </button>
            <button
              className="btn btn-sm btn-outline-danger flex-grow-1 d-flex align-items-center justify-content-center gap-1 py-1"
              style={{ fontSize: '0.72rem', borderRadius: '6px' }}
              onClick={onLogout}
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut size={12} /> Đăng Xuất
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
