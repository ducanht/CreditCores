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
  Landmark
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Quản trị', icon: LayoutDashboard },
    { id: 'customer360', label: 'Tra cứu KH & HĐ 360°', icon: Users },
    { id: 'appraisal', label: 'Thẩm định Tín dụng & TSĐB', icon: FileCheck2 },
    { id: 'inspection', label: 'Kiểm tra Sử dụng Vốn', icon: ClipboardList },
    { id: 'debit_register', label: 'Đăng ký Trích nợ', icon: UserCheck },
    { id: 'debit_batch', label: 'Chạy đợt Trích nợ', icon: Zap },
    { id: 'reconciliation', label: 'Đối soát & Kết quả', icon: ArrowLeftRight },
    { id: 'debt_warning', label: 'Cảnh báo Nợ tồn đọng', icon: AlertTriangle },
    { id: 'reports', label: 'Báo cáo Thống kê', icon: FileBarChart2 },
    { id: 'settings', label: 'Cấu hình & Đồng bộ Core', icon: Settings }
  ];

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

        {menuItems.map(item => {
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

      {/* User Footer */}
      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: 'rgba(0,0,0,0.12)',
          fontSize: '0.78rem'
        }}
      >
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle bg-info text-dark d-flex align-items-center justify-content-center fw-bold me-2"
            style={{ width: 32, height: 32, fontSize: '0.8rem' }}
          >
            TD
          </div>
          <div className="overflow-hidden">
            <div className="fw-semibold text-white text-truncate">Cán bộ Tín dụng</div>
            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Co-opBank / QTDND</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
