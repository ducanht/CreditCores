import React from 'react';
import {
  RefreshCw,
  Menu,
  Sun,
  Moon,
  CheckCircle2
} from 'lucide-react';

export default function TopHeader({
  syncStatus,
  isSyncing,
  onTriggerSync,
  onToggleSidebar,
  isDarkMode,
  onToggleTheme
}) {
  const isDaemonSuccess = syncStatus?.status === 'SUCCESS';
  const isDaemonProcessing = syncStatus?.status === 'PROCESSING' || syncStatus?.status === 'PENDING' || isSyncing;

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
        zIndex: 1020,
        height: '56px'
      }}
    >
      {/* Left: Mobile & Desktop Menu Toggle */}
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
      </div>

      {/* Right: Minimal Essential Controls */}
      <div className="d-flex align-items-center gap-2">
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
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Smart Integrated Sync Button (Icon quay khi đồng bộ, dừng khi xong) */}
        <button
          type="button"
          className={`btn btn-sm ${
            isDaemonProcessing
              ? 'btn-warning text-dark'
              : isDaemonSuccess
              ? 'btn-brand text-white'
              : 'btn-brand text-white'
          } d-flex align-items-center gap-1.5 fw-medium px-3 shadow-sm`}
          style={{ height: '34px', borderRadius: '8px', fontSize: '0.80rem' }}
          onClick={onTriggerSync}
          disabled={isDaemonProcessing}
          title={
            isDaemonProcessing
              ? 'Đang thực hiện đồng bộ dữ liệu SQL Server Core...'
              : `Đồng bộ dữ liệu CoreBanking (Trạng thái: ${syncStatus?.status || 'Sẵn sàng'})`
          }
        >
          <RefreshCw
            size={13}
            className={isDaemonProcessing ? 'fa-spin' : ''}
          />
          <span>{isDaemonProcessing ? 'Đang đồng bộ...' : 'Đồng bộ'}</span>
        </button>
      </div>
    </header>
  );
}
