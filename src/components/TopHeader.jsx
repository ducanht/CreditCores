import React, { useState } from 'react';
import {
  RefreshCw,
  Menu,
  Sun,
  Moon,
  CheckCircle2,
  ChevronRight,
  Bell,
  User,
  Shield,
  Clock
} from 'lucide-react';

export default function TopHeader({
  activeTabTitle,
  activeTab,
  onNavigate,
  syncStatus,
  isSyncing,
  onTriggerSync,
  currentUser,
  onToggleSidebar,
  isDarkMode,
  onToggleTheme
}) {
  const isProcessing = Boolean(isSyncing);
  const [showNotifications, setShowNotifications] = useState(false);

  const userName = currentUser?.fullName || currentUser?.name || currentUser?.username || 'CBTD Quỹ';
  const userRole = currentUser?.roleName || currentUser?.role || 'Cán bộ Tín dụng';
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(p => p[0])
    .join('')
    .toUpperCase() || 'TD';

  return (
    <header
      className="header-brand-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 1020,
        height: '56px',
        backdropFilter: 'blur(8px)'
      }}
    >
      {/* Left: Mobile Toggle + Breadcrumbs Navigation */}
      <div className="d-flex align-items-center gap-2">
        <button
          type="button"
          className="btn btn-sm btn-light p-2 rounded-2 border d-flex align-items-center justify-content-center"
          onClick={onToggleSidebar}
          aria-label="Toggle Menu"
          title="Đóng / Mở Menu Điều Hướng"
        >
          <Menu size={17} />
        </button>

        {/* Desktop Breadcrumb */}
        <nav aria-label="breadcrumb" className="d-none d-sm-flex align-items-center gap-1.5 fs-7 text-muted ms-1">
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none text-muted fs-7 fw-medium d-flex align-items-center gap-1"
            onClick={() => onNavigate && onNavigate('dashboard')}
            title="Về Trang Chủ Tổng Quan"
          >
            <span style={{ color: 'var(--brand-primary, #65a30d)', fontWeight: 600 }}>CreditCores</span>
          </button>
          <ChevronRight size={13} className="text-muted opacity-50" />
          <span className="fw-semibold text-slate-800 dark:text-slate-100 fs-7">{activeTabTitle}</span>
        </nav>

        {/* Mobile Title (when breadcrumb is hidden) */}
        <h1 className="fs-6 fw-semibold m-0 text-slate-800 dark:text-slate-100 font-heading text-truncate d-sm-none">
          {activeTabTitle}
        </h1>

        {/* Sheets Live Status Pill */}
        <div
          className="badge bg-success-subtle text-success border border-success-subtle d-none d-lg-flex align-items-center gap-1.5 py-1 px-2.5 rounded-pill small fw-medium ms-2"
          style={{ fontSize: '0.72rem' }}
          title="Kết nối trực tiếp CSDL Google Sheets & Google Apps Script (Zero Mock)"
        >
          <span className="pulse-online"></span>
          <span>Google Sheets Live {syncStatus?.totalContracts ? `(${syncStatus.totalContracts} HĐTD)` : ''}</span>
        </div>
      </div>

      {/* Right: Actions, Notifications, Theme, User */}
      <div className="d-flex align-items-center gap-2 position-relative">
        {/* Notification Bell */}
        <div className="position-relative">
          <button
            type="button"
            className="btn btn-sm p-2 rounded-2 d-flex align-items-center justify-content-center"
            style={{
              background: isDarkMode ? '#1e293b' : '#f8fafc',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              height: '34px',
              width: '34px',
              position: 'relative'
            }}
            onClick={() => setShowNotifications(prev => !prev)}
            title="Thông báo hệ thống"
          >
            <Bell size={15} />
            <span
              className="notification-dot position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
              style={{ width: '8px', height: '8px', marginTop: '6px', marginLeft: '-6px' }}
            >
              <span className="visually-hidden">Thông báo mới</span>
            </span>
          </button>

          {/* Notification dropdown card */}
          {showNotifications && (
            <div
              className="card shadow-lg border-0 position-absolute end-0 mt-2 p-3 rounded-3"
              style={{
                width: '280px',
                zIndex: 1050,
                background: 'var(--card-bg, #ffffff)',
                border: '1px solid var(--border-subtle) !important'
              }}
            >
              <div className="d-flex align-items-center justify-content-between pb-2 border-bottom mb-2">
                <span className="fw-semibold fs-7 text-body">Thông Báo Hệ Thống</span>
                <span className="badge bg-brand-subtle text-brand-dark fs-8">Trực tuyến</span>
              </div>
              <div className="d-flex flex-column gap-2 fs-7">
                <div className="d-flex align-items-start gap-2 p-2 rounded-2 bg-light dark:bg-slate-800">
                  <CheckCircle2 size={15} className="text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="fw-medium text-body fs-8">CSDL Google Sheets</div>
                    <div className="text-muted fs-8">Kết nối ổn định, tốc độ &lt; 1s</div>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-2 p-2 rounded-2 bg-light dark:bg-slate-800">
                  <Clock size={15} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="fw-medium text-body fs-8">Đồng bộ gần nhất</div>
                    <div className="text-muted fs-8">{syncStatus?.lastSyncTime || 'Sẵn sàng'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light Mode Switcher */}
        <button
          type="button"
          className="btn btn-sm p-2 rounded-2 d-flex align-items-center justify-content-center"
          style={{
            background: isDarkMode ? '#1e293b' : '#f4fce8',
            border: '1px solid var(--border-subtle)',
            color: isDarkMode ? '#fde047' : '#3b6600',
            transition: 'all 0.2s ease',
            height: '34px',
            width: '34px'
          }}
          onClick={onToggleTheme}
          title={isDarkMode ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
        >
          {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Sync Button */}
        <button
          type="button"
          className={`btn btn-sm ${
            isProcessing
              ? 'btn-warning text-dark'
              : 'btn-brand text-white'
          } d-flex align-items-center gap-1.5 fw-medium px-2.5 shadow-sm`}
          style={{ height: '34px', borderRadius: '8px', fontSize: '0.80rem' }}
          onClick={onTriggerSync}
          disabled={isProcessing}
          title={
            isProcessing
              ? 'Đang thực hiện đồng bộ dữ liệu SQL Server Core...'
              : `Bấm để đồng bộ dữ liệu CoreBanking (Lần cuối: ${syncStatus?.lastSyncTime || 'Sẵn sàng'})`
          }
        >
          <RefreshCw
            size={13}
            className={isProcessing ? 'fa-spin' : ''}
          />
          <span className="d-none d-md-inline">{isProcessing ? 'Đang đồng bộ...' : 'Đồng bộ'}</span>
        </button>

        {/* User Profile Pill */}
        <div
          className="d-flex align-items-center gap-2 ps-1 pe-2 py-1 rounded-pill"
          style={{
            background: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
            border: '1px solid var(--border-subtle)'
          }}
          title={`${userName} (${userRole})`}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
            style={{
              width: '26px',
              height: '26px',
              fontSize: '0.72rem',
              background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
              border: '1.5px solid var(--brand-primary, #9acd32)'
            }}
          >
            {userInitials}
          </div>
          <div className="d-none d-xl-block text-start lh-1" style={{ maxWidth: '110px' }}>
            <div className="fw-semibold fs-8 text-truncate text-body">{userName}</div>
            <div className="text-muted fs-8 text-truncate" style={{ fontSize: '0.65rem' }}>{userRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
