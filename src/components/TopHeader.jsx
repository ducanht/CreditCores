import React from 'react';
import { RefreshCw, Database, Shield, Menu, Sun, Moon } from 'lucide-react';
import { getGasApiUrl } from '../services/api';
import { ROLE_LABELS } from '../services/auth';

export default function TopHeader({
  activeTabTitle,
  syncStatus,
  isSyncing,
  onTriggerSync,
  currentUser,
  onToggleMobile,
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
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 99
      }}
    >
      <div className="d-flex align-items-center gap-3">
        {/* Mobile Hamburger Toggle Button */}
        <button
          className="btn btn-sm btn-light d-lg-none p-2 rounded-3 border"
          onClick={onToggleMobile}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} className="text-dark" />
        </button>

        <div>
          <h2 className="fs-5 fw-extrabold m-0 text-slate-900 font-heading text-truncate">
            {activeTabTitle}
          </h2>
          <span className="small d-none d-sm-inline" style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
            Quỹ Tín Dụng Nhân Dân Yên Thọ (Thành lập 01/12/2003)
          </span>
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
          title={isDarkMode ? 'Chuyển sang Chế độ Sáng (Light Mode)' : 'Chuyển sang Chế độ Tối (Dark Mode)'}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Role Tag */}
        <div className={`badge-status ${roleInfo.badgeClass} d-none d-md-inline-flex`} title="Vai trò người dùng hiện tại">
          <Shield size={13} />
          <span>{currentUser?.fullName || currentUser?.username} ({roleInfo.label})</span>
        </div>

        {/* Mode Indicator */}
        <div
          className={`badge-status ${isLiveMode ? 'badge-success-soft' : 'badge-brand-soft'} d-none d-sm-inline-flex`}
          title={isLiveMode ? 'Đang kết nối Google Apps Script Live API' : 'Đang chạy chế độ Mock Data'}
        >
          <Database size={13} />
          <span>{isLiveMode ? 'Live GAS' : 'Demo Mode'}</span>
        </div>

        {/* Daemon Sync Status Badge with Pulsing Dot */}
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

        {/* Quick Sync Trigger Button */}
        <button
          className="btn btn-sm btn-brand d-flex align-items-center gap-2 fw-bold px-3 shadow-sm"
          onClick={onTriggerSync}
          disabled={isSyncing}
          title="Kích hoạt lệnh đồng bộ dữ liệu từ SQL Server Core"
        >
          <RefreshCw size={14} className={isSyncing ? 'fa-spin' : ''} />
          <span className="d-none d-sm-inline">{isSyncing ? 'Đang gửi...' : 'Đồng bộ SQL'}</span>
        </button>
      </div>
    </header>
  );
}
