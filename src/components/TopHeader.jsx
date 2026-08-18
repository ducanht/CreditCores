import React from 'react';
import { RefreshCw, Database, Shield, Menu } from 'lucide-react';
import { getGasApiUrl } from '../services/api';
import { ROLE_LABELS } from '../services/auth';

export default function TopHeader({
  activeTabTitle,
  syncStatus,
  isSyncing,
  onTriggerSync,
  currentUser,
  onToggleMobile
}) {
  const isLiveMode = Boolean(getGasApiUrl());
  const roleInfo = ROLE_LABELS[currentUser?.role] || {
    label: currentUser?.role || 'Cán Bộ',
    badgeClass: 'badge-info-soft'
  };

  const isDaemonSuccess = syncStatus?.status === 'SUCCESS';
  const isDaemonProcessing = syncStatus?.status === 'PROCESSING' || syncStatus?.status === 'PENDING';

  return (
    <header
      className="glass-card"
      style={{
        height: 'var(--header-height)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 99,
        borderRadius: 0
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
          <h2 className="fs-5 fw-bold m-0 text-slate-900 font-heading text-truncate">
            {activeTabTitle}
          </h2>
          <span className="text-muted small d-none d-sm-inline" style={{ fontSize: '0.75rem' }}>
            Quỹ Tín Dụng Nhân Dân Yên Thọ • CreditCores System
          </span>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 gap-md-3">
        {/* User Role Tag */}
        <div className={`badge-status ${roleInfo.badgeClass} d-none d-md-inline-flex`} title="Vai trò người dùng hiện tại">
          <Shield size={13} />
          <span>{currentUser?.fullName || currentUser?.username} ({roleInfo.label})</span>
        </div>

        {/* Mode Indicator */}
        <div
          className={`badge-status ${isLiveMode ? 'badge-success-soft' : 'badge-info-soft'} d-none d-sm-inline-flex`}
          title={isLiveMode ? 'Đang kết nối Google Apps Script Live API' : 'Đang chạy chế độ Mock Data'}
        >
          <Database size={13} />
          <span>{isLiveMode ? 'Live API' : 'Demo Mode'}</span>
        </div>

        {/* Daemon Sync Status Badge with Pulsing Dot */}
        <div
          className={`badge-status ${
            isDaemonSuccess ? 'badge-success-soft' : isDaemonProcessing ? 'badge-warning-soft' : 'badge-danger-soft'
          }`}
          title={`Trạng thái Daemon: ${syncStatus?.status || 'IDLE'}`}
        >
          <span
            className={`status-dot ${
              isDaemonSuccess ? 'dot-success pulse' : isDaemonProcessing ? 'dot-warning pulse' : 'dot-danger'
            }`}
          />
          <span className="d-none d-sm-inline">Daemon:</span>
          <span>{syncStatus?.status || 'IDLE'}</span>
        </div>

        {/* Quick Sync Trigger Button */}
        <button
          className="btn btn-sm btn-primary d-flex align-items-center gap-2 fw-semibold px-3 shadow-sm"
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
