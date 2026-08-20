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
  X,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';
import { AuthService, ROLE_LABELS } from '../services/auth';

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenChangePass,
  onLogout,
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse
}) {
  const allMenuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, category: 'TỔNG QUAN' },
    { id: 'customer360', label: 'Tra cứu Khách hàng & HĐ', icon: Users, category: 'KHÁCH HÀNG' },
    { id: 'appraisal', label: 'Thẩm định Tín dụng & TSĐB', icon: FileCheck2, category: 'TÍN DỤNG' },
    { id: 'inspection', label: 'Kiểm tra Sử dụng Vốn', icon: ClipboardList, category: 'TÍN DỤNG' },
    { id: 'debit_register', label: 'Đăng ký Trích nợ', icon: UserCheck, category: 'TRÍCH NỢ' },
    { id: 'debit_batch', label: 'Đợt Trích nợ', icon: Zap, category: 'TRÍCH NỢ' },
    { id: 'reconciliation', label: 'Đối soát & Kết quả', icon: ArrowLeftRight, category: 'KẾ TOÁN' },
    { id: 'debt_warning', label: 'Cảnh báo Nợ tồn đọng', icon: AlertTriangle, category: 'QUẢN LÝ NỢ' },
    { id: 'reports', label: 'Báo cáo Thống kê', icon: FileBarChart2, category: 'BÁO CÁO' },
    { id: 'templates', label: 'Quản lý Biểu mẫu', icon: Layers, category: 'HỆ THỐNG' },
    { id: 'user_management', label: 'Phân quyền & Người dùng', icon: UserCog, category: 'HỆ THỐNG' },
    { id: 'settings', label: 'Cấu hình & Đồng bộ Core', icon: Settings, category: 'HỆ THỐNG' }
  ];

  const visibleMenuItems = allMenuItems.filter((item) => AuthService.hasPermission(item.id, currentUser));

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
      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
      />

      <aside className={`sidebar-drawer ${isMobileOpen ? 'open' : ''}`}>
        {/* Header: Brand & Collapse Toggle */}
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '0 10px' : '0 16px',
            backgroundColor: 'rgba(0,0,0,0.25)',
            borderBottom: '1.5px solid rgba(154, 205, 50, 0.2)'
          }}
        >
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <div
              className="p-2 rounded-3 text-dark d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #9acd32 0%, #047857 100%)',
                width: 38,
                height: 38,
                boxShadow: '0 0 10px rgba(154, 205, 50, 0.4)'
              }}
            >
              <Landmark size={20} className="text-white" />
            </div>

            {!isCollapsed && (
              <div className="overflow-hidden text-truncate">
                <h1 className="m-0 fs-6 fw-extrabold text-white lh-1 font-heading text-truncate">
                  QTDND YÊN THỌ
                </h1>
                <span style={{ fontSize: '0.62rem', color: '#a3e635', fontWeight: 600 }} className="d-block text-truncate">
                  Thôn Tân Lộc, xã Quý Lộc, Thanh Hoá
                </span>
              </div>
            )}
          </div>

          <div className="d-flex align-items-center">
            {/* Desktop Collapse / Expand Button */}
            <button
              className="btn btn-sm btn-link text-white d-none d-lg-flex p-1 align-items-center justify-content-center text-decoration-none"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Mở rộng Menu' : 'Thu gọn Menu'}
              style={{ opacity: 0.8 }}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            {/* Mobile Close Button */}
            <button
              className="btn btn-sm btn-link text-white d-lg-none p-1"
              onClick={onCloseMobile}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Menu Items */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: isCollapsed ? '10px 6px' : '10px 8px' }}>
          {visibleMenuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const prevItem = index > 0 ? visibleMenuItems[index - 1] : null;
            const showCategory = !isCollapsed && (!prevItem || prevItem.category !== item.category);

            return (
              <React.Fragment key={item.id}>
                {showCategory && (
                  <div
                    style={{
                      fontSize: '0.6rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: 'rgba(163, 230, 53, 0.65)',
                      padding: '10px 10px 3px 10px',
                      fontWeight: 800
                    }}
                  >
                    {item.category}
                  </div>
                )}
                <div
                  onClick={() => handleSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    padding: isCollapsed ? '10px 0' : '9px 12px',
                    margin: '2px 0',
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 800 : 500,
                    color: isActive ? '#ffffff' : '#cbd5e1',
                    background: isActive
                      ? 'linear-gradient(90deg, rgba(154, 205, 50, 0.25) 0%, rgba(154, 205, 50, 0.06) 100%)'
                      : 'transparent',
                    borderRadius: '8px',
                    borderLeft: isActive ? '3px solid #9acd32' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  className="sidebar-link"
                >
                  <Icon
                    size={18}
                    className={`flex-shrink-0 ${!isCollapsed ? 'me-2' : ''}`}
                    style={{
                      color: isActive ? '#9acd32' : '#94a3b8',
                      filter: isActive ? 'drop-shadow(0 0 5px rgba(154, 205, 50, 0.5))' : 'none'
                    }}
                  />
                  {!isCollapsed && <span className="text-truncate">{item.label}</span>}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* User Footer */}
        <div
          style={{
            padding: isCollapsed ? '10px 6px' : '12px 14px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(0,0,0,0.3)',
            fontSize: '0.78rem'
          }}
        >
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center overflow-hidden">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold me-2 flex-shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  fontSize: '0.8rem',
                  background: 'linear-gradient(135deg, #9acd32 0%, #047857 100%)',
                  color: '#0f172a',
                  fontWeight: 900
                }}
              >
                {(currentUser?.fullName || currentUser?.username || 'U')[0].toUpperCase()}
              </div>

              {!isCollapsed && (
                <div className="overflow-hidden text-truncate">
                  <div className="fw-bold text-white text-truncate" style={{ fontSize: '0.82rem' }}>
                    {currentUser?.fullName || currentUser?.username}
                  </div>
                  <div className="small" style={{ color: '#a3e635', fontSize: '0.7rem' }}>
                    {roleInfo.label}
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="d-flex align-items-center gap-1">
                <button
                  className="btn btn-sm btn-link p-1 text-slate-400 hover-text-white"
                  onClick={onOpenChangePass}
                  title="Đổi mật khẩu"
                  style={{ color: '#94a3b8' }}
                >
                  <KeyRound size={15} />
                </button>
                <button
                  className="btn btn-sm btn-link p-1 text-danger"
                  onClick={onLogout}
                  title="Đăng xuất"
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}
          </div>

          {isCollapsed && (
            <div className="d-flex justify-content-center mt-2 pt-2 border-top border-slate-800">
              <button
                className="btn btn-sm btn-link p-1 text-danger"
                onClick={onLogout}
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
