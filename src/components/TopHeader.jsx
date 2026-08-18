import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Database, UserCheck, Shield } from 'lucide-react';
import { getGasApiUrl } from '../services/api';
import { ROLE_LABELS } from '../services/auth';

export default function TopHeader({ activeTabTitle, syncStatus, isSyncing, onTriggerSync, currentUser }) {
  const isLiveMode = Boolean(getGasApiUrl());
  const roleInfo = ROLE_LABELS[currentUser?.role] || {
    label: currentUser?.role || 'Cán Bộ',
    badgeClass: 'badge-info-soft'
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: '#fff',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 99
      }}
    >
      <div>
        <h2 className="fs-5 fw-bold m-0 text-slate-800">{activeTabTitle}</h2>
        <span className="text-muted small">Hệ thống Quản lý Tín dụng & Trích nợ Tự động</span>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* User Role Tag */}
        <div className={`badge-status ${roleInfo.badgeClass}`} title="Vai trò người dùng hiện tại">
          <Shield size={13} />
          <span>{currentUser?.fullName || currentUser?.username} ({roleInfo.label})</span>
        </div>

        {/* Mode Indicator */}
        <div
          className={`badge-status ${isLiveMode ? 'badge-success-soft' : 'badge-info-soft'}`}
          title={isLiveMode ? 'Đang kết nối Google Apps Script API' : 'Đang chạy chế độ Mock Data'}
        >
          <Database size={13} />
          <span>{isLiveMode ? 'Live GAS API' : 'Demo Mode'}</span>
        </div>

        {/* Sync Status Badge */}
        <div
          className={`badge-status ${
            syncStatus?.status === 'SUCCESS'
              ? 'badge-success-soft'
              : syncStatus?.status === 'PROCESSING'
              ? 'badge-warning-soft'
              : 'badge-danger-soft'
          }`}
        >
          {syncStatus?.status === 'SUCCESS' ? (
            <CheckCircle2 size={13} />
          ) : (
            <AlertCircle size={13} />
          )}
          <span>Daemon: {syncStatus?.status || 'IDLE'}</span>
        </div>

        {/* Quick Sync Trigger */}
        <button
          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 fw-semibold px-3"
          onClick={onTriggerSync}
          disabled={isSyncing}
          title="Kích hoạt lệnh đồng bộ dữ liệu từ SQL Server Core"
        >
          <RefreshCw size={14} className={isSyncing ? 'fa-spin' : ''} />
          <span>{isSyncing ? 'Đang gửi...' : 'Đồng bộ SQL'}</span>
        </button>
      </div>
    </header>
  );
}
