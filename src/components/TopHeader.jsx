import React from 'react';
import {
  RefreshCw,
  Menu,
  Sun,
  Moon,
  CheckCircle2
} from 'lucide-react';

export default function TopHeader({
  activeTabTitle,
  syncStatus,
  isSyncing,
  onTriggerSync,
  onToggleSidebar,
  isDarkMode,
  onToggleTheme
}) {
  const isProcessing = Boolean(isSyncing);

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
      {/* Left: Mobile & Desktop Menu Toggle + Standard Title */}
      <div className="d-flex align-items-center gap-2.5">
        <button
          type="button"
          className="btn btn-sm btn-light p-2 rounded-2 border d-flex align-items-center justify-content-center"
          onClick={onToggleSidebar}
          aria-label="Toggle Menu"
          title="Đóng / Mở Menu Điều Hướng"
        >
          <Menu size={17} />
        </button>

        <h1 className="fs-6 fw-semibold m-0 text-slate-900 font-heading text-truncate">
          {activeTabTitle}
        </h1>
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

        {/* Smart Integrated Sync Button (Chỉ quay khi người dùng bấm đồng bộ, xong trở về trạng thái chờ tĩnh) */}
        <button
          type="button"
          className={`btn btn-sm ${
            isProcessing
              ? 'btn-warning text-dark'
              : 'btn-brand text-white'
          } d-flex align-items-center gap-1.5 fw-medium px-3 shadow-sm`}
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
          <span>{isProcessing ? 'Đang đồng bộ...' : 'Đồng bộ'}</span>
        </button>
      </div>
    </header>
  );
}
