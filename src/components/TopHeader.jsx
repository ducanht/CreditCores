import React from 'react';
import {
  RefreshCw,
  Database,
  Shield,
  Menu,
  Sun,
  Moon
} from 'lucide-react';
import { getGasApiUrl } from '../services/api';
import { ROLE_LABELS } from '../services/auth';

export default function TopHeader({
  activeTabTitle,
  syncStatus,
  isSyncing,
  onTriggerSync,
  currentUser,
  onToggleSidebar,
  isDarkMode,
  onToggleTheme
}) {
  const isLiveMode = Boolean(getGasApiUrl());
  const roleInfo = ROLE_LABELS[currentUser?.role] || {
    label: currentUser?.role || 'Cán Bộ',
    badgeClass: 'badge-brand-soft'
  };

  const isDaemonSuccess = syncStatus?.status === 'SUCCESS';
  const isDaemonProcessing = syncStatus?.status === 'PROCESSING' || syncStatus?.status === 'PENDING';

  return (
    <header
      className="header-brand-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 1020
      }}
    >
      <div className="d-flex align-items-center gap-3">
        {/* Menu Toggle Button */}
        <button
          className="btn btn-sm btn-light p-2 rounded-3 border d-flex align-items-center justify-content-center"
          onClick={onToggleSidebar}
          aria-label="Toggle Menu"
          title="Đóng / Mở Menu Điều Hướng"
        >
          <Menu size={18} />
        </button>

        <div>
          <h2 className="fs-6 fw-semibold m-0 text-slate-900 font-heading text-truncate">
            {activeTabTitle}
          </h2>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 gap-md-3">
        {/* Dark / Light Mode Switcher */}
        <button
          className="btn btn-sm p-2 rounded-3 d-flex align-items-center justify-content-center"
          style={{
            background: isDarkMode ? '#1e293b' : '#f4fce8',
            border: '1.5px solid var(--border-subtle)',
            color: isDarkMode ? '#fde047' : '#3b6600',
            transition: 'all 0.2s ease'
          }}
          onClick={onToggleTheme}
          title={isDarkMode ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
        >
          {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User Role Tag */}
        <div className={`badge-status ${roleInfo.badgeClass} d-none d-md-inline-flex`} title="Vai trò người dùng hiện tại">
          <Shield size={13} />
          <span>{currentUser?.fullName || currentUser?.username} ({roleInfo.label})</span>
        </div>

        {/* Mode Indicator */}
        <div
          className={`badge-status ${isLiveMode ? 'badge-success-soft' : 'badge-brand-soft'} d-none d-sm-inline-flex`}
          title={isLiveMode ? 'Kết nối Live GAS API' : 'Chế độ Demo Fallback'}
        >
          <Database size={13} />
          <span>{isLiveMode ? 'Live GAS' : 'Demo Mode'}</span>
        </div>

        {/* Daemon Status Badge */}
        <div
          className={`badge-status ${
            isDaemonSuccess ? 'badge-success-soft' : isDaemonProcessing ? 'badge-warning-soft' : 'badge-danger-soft'
          }`}
          title={`Trạng thái Daemon: ${syncStatus?.status || 'IDLE'}`}
        >
          <div className="pulse-online" />
          <span className="d-none d-sm-inline">Core:</span>
          <span>{syncStatus?.status || 'IDLE'}</span>
        </div>

        {/* Quick Sync Trigger */}
        <button
          className="btn btn-sm btn-brand d-flex align-items-center gap-1 fw-bold px-3 shadow-sm"
          onClick={onTriggerSync}
          disabled={isSyncing}
          title="Đồng bộ dữ liệu SQL Server Core"
        >
          <RefreshCw size={13} className={isSyncing ? 'fa-spin' : ''} />
          <span className="d-none d-sm-inline">{isSyncing ? 'Đang gửi...' : 'Đồng bộ'}</span>
        </button>
      </div>
    </header>
  );
}
