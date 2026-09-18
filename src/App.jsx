import React, { useState, useEffect, Suspense, lazy } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import Dashboard from './components/Dashboard';
import LoginModal from './components/LoginModal';
import { api } from './services/api';
import { AuthService } from './services/auth';

// Tối ưu Code-Splitting: Lazy loading các phân hệ để khởi chạy trang Tổng Quan tức thì
const Customer360 = lazy(() => import('./components/Customer360'));
const CollateralManager = lazy(() => import('./components/CollateralManager'));
const Appraisal = lazy(() => import('./components/Appraisal'));
const LoanInspection = lazy(() => import('./components/LoanInspection'));
const DebitManager = lazy(() => import('./components/DebitManager'));
const Reconciliation = lazy(() => import('./components/Reconciliation'));
const DebtWarning = lazy(() => import('./components/DebtWarning'));
const Reports = lazy(() => import('./components/Reports'));
const TemplateManager = lazy(() => import('./components/TemplateManager'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const Settings = lazy(() => import('./components/Settings'));
const ChangePasswordModal = lazy(() => import('./components/ChangePasswordModal'));
const CustomerQuickModal = lazy(() => import('./components/CustomerQuickModal'));

// Dynamic Prefetching Map
const TAB_PREFETCHERS = {
  customer360: () => import('./components/Customer360'),
  collateral: () => import('./components/CollateralManager'),
  appraisal: () => import('./components/Appraisal'),
  inspection: () => import('./components/LoanInspection'),
  debit_register: () => import('./components/DebitManager'),
  debit_batch: () => import('./components/DebitManager'),
  reconciliation: () => import('./components/Reconciliation'),
  debt_warning: () => import('./components/DebtWarning'),
  reports: () => import('./components/Reports'),
  templates: () => import('./components/TemplateManager'),
  user_management: () => import('./components/UserManagement'),
  settings: () => import('./components/Settings')
};

// UI Skeleton khi chuyển đổi phân hệ (0 layout shift)
function TabLoadingSkeleton({ title = 'Đang nạp phân hệ...' }) {
  return (
    <div className="tab-loading-skeleton p-4 animate-fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
        <div>
          <div className="placeholder-glow">
            <span className="placeholder col-5 placeholder-lg mb-2 rounded bg-secondary opacity-25"></span>
          </div>
          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.85rem' }}>
            <span className="spinner-border spinner-border-sm text-success" role="status" aria-hidden="true"></span>
            <span>{title}</span>
          </div>
        </div>
        <div className="placeholder-glow">
          <span className="placeholder rounded px-4 py-2 bg-secondary opacity-25" style={{ width: 130, height: 36, display: 'inline-block' }}></span>
        </div>
      </div>
      <div className="row g-3 mb-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="col-12 col-md-3">
            <div className="card border-0 shadow-sm p-3" style={{ borderRadius: 12 }}>
              <div className="placeholder-glow">
                <span className="placeholder col-6 mb-2 bg-secondary opacity-25 rounded"></span>
                <span className="placeholder col-10 placeholder-lg bg-secondary opacity-25 rounded"></span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 12 }}>
        <div className="placeholder-glow">
          <span className="placeholder col-12 mb-3 py-3 rounded bg-secondary opacity-25"></span>
          <span className="placeholder col-12 mb-2 rounded bg-secondary opacity-25"></span>
          <span className="placeholder col-12 mb-2 rounded bg-secondary opacity-25"></span>
          <span className="placeholder col-8 rounded bg-secondary opacity-25"></span>
        </div>
      </div>
    </div>
  );
}

const TAB_TITLES = {
  dashboard: 'Tổng Quan',
  customer360: 'Tra Cứu Khách Hàng & Hợp Đồng',
  collateral: 'Tài Sản Thế Chấp & Hợp Đồng (TSBD_CORE)',
  appraisal: 'Thẩm Định Tín Dụng & TSĐB',
  inspection: 'Kiểm Tra Sử Dụng Vốn',
  debit_register: 'Đăng Ký Dịch Vụ Trích Nợ',
  debit_batch: 'Đợt Trích Nợ Tự Động',
  reconciliation: 'Đối Soát Kết Quả CoreBanking',
  debt_warning: 'Sổ Theo Dõi Nợ Tồn Đọng',
  reports: 'Báo Cáo Thống Kê Dư Nợ',
  templates: 'Quản Lý Biểu Mẫu Trộn Tài Liệu',
  user_management: 'Phân Quyền & Quản Lý Tài Khoản',
  settings: 'Cấu Hình & Giám Sát Đồng Bộ Core'
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('CREDITCORES_ACTIVE_TAB') || 'dashboard');
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('CREDITCORES_THEME') === 'dark');

  const [stats, setStats] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Cross-module prefill & quick view states
  const [prefilledCustomer, setPrefilledCustomer] = useState(null);
  const [prefilledContract, setPrefilledContract] = useState(null);
  const [quickViewCustomer, setQuickViewCustomer] = useState(null);

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('CREDITCORES_ACTIVE_TAB', tab);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('CREDITCORES_THEME', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('CREDITCORES_THEME', 'light');
    }
  }, [isDarkMode]);

  // Đảm bảo activeTab luôn hợp lệ với phân quyền người dùng
  useEffect(() => {
    if (currentUser && !AuthService.hasPermission(activeTab, currentUser)) {
      setActiveTab('dashboard');
      localStorage.setItem('CREDITCORES_ACTIVE_TAB', 'dashboard');
    }
  }, [currentUser, activeTab]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth < 992) {
      setIsMobileSidebarOpen(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => !prev);
    }
  };

  const fetchInitialData = async () => {
    try {
      // Optimize: Tách luồng để component nào xong trước render trước
      api.getDashboardStats().then(res => {
        if (res.status === 'success') setStats(res.data);
      }).catch(e => console.error('Lỗi nạp stats:', e));

      api.getSyncStatus().then(res => {
        if (res.status === 'success') setSyncStatus(res.data);
      }).catch(e => console.error('Lỗi nạp sync status:', e));
    } catch (e) {
      console.error('Lỗi khởi tạo dữ liệu ban đầu:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchInitialData();
      
      // Auto-trigger background SQL sync when idle
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          api.triggerSqlSync().then(res => {
            if (res.status === 'success') {
              console.log('Background SQL Sync success:', res.message);
              // Silently refresh sync status
              api.getSyncStatus().then(sRes => {
                if (sRes.status === 'success') setSyncStatus(sRes.data);
              }).catch(() => {});
            }
          }).catch(err => console.error('Background SQL Sync error:', err));
        }, { timeout: 10000 });
      }

      // Prefetch các tab thường dùng nhất khi trình duyệt nhàn rỗi (Customer 360 & Reports)
      const idlePrefetch = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
      const idleId = idlePrefetch(() => {
        if (TAB_PREFETCHERS.customer360) TAB_PREFETCHERS.customer360();
        if (TAB_PREFETCHERS.reports) TAB_PREFETCHERS.reports();
      });

      return () => {
        if (window.cancelIdleCallback && idleId) {
          window.cancelIdleCallback(idleId);
        }
      };
    }
  }, [currentUser]);

  const handlePrefetchTab = (tabId) => {
    if (TAB_PREFETCHERS[tabId]) {
      TAB_PREFETCHERS[tabId]();
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    fetchInitialData();
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống CreditCores?')) {
      AuthService.logout();
      setCurrentUser(null);
    }
  };

  const handleTriggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await api.triggerSqlSync();
      if (res.status === 'success') {
        api.clearCache();
        const [sRes, statsRes] = await Promise.all([
          api.getSyncStatus(),
          api.getDashboardStats(true)
        ]);
        if (sRes && sRes.status === 'success') setSyncStatus(sRes.data);
        if (statsRes && statsRes.status === 'success') setStats(statsRes.data);
        alert(res.message || 'Đồng bộ dữ liệu SQL Server Core thành công!');
      }
    } catch (e) {
      alert('Lỗi kích hoạt đồng bộ: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Cross-module navigation helpers
  const handleNavigateToAppraisal = (customer) => {
    setPrefilledCustomer(customer);
    setActiveTab('appraisal');
  };

  const handleNavigateToInspection = (customer, contract) => {
    setPrefilledContract({ ...contract, hoTen: customer?.hoTen });
    setActiveTab('inspection');
  };

  const handleNavigateToDebit = (customer) => {
    setPrefilledCustomer(customer);
    setActiveTab('debit_register');
  };

  const handleOpenCustomerQuickView = async (customer) => {
    if (!customer) return;
    setQuickViewCustomer(customer);

    // Tự động truy vấn CSDL KH_CORE để lấy đầy đủ CCCD, SĐT, Địa chỉ, Danh sách hợp đồng vay nếu dữ liệu chưa đầy đủ
    if (customer.maKH && (!customer.contracts || !customer.cccd || !customer.dienThoaiDD)) {
      try {
        const res = await api.searchCustomer360(customer.maKH);
        if (res.status === 'success' && Array.isArray(res.data)) {
          const fullCust = res.data.find(c => c.maKH === customer.maKH) || res.data[0];
          if (fullCust) {
            setQuickViewCustomer(prev => ({ ...prev, ...fullCust }));
          }
        }
      } catch (err) {
        console.warn('Lỗi nạp chi tiết khách hàng 360:', err);
      }
    }
  };

  // IF NOT AUTHENTICATED -> SHOW LOGIN SCREEN
  if (!currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        onPrefetchTab={handlePrefetchTab}
        currentUser={currentUser}
        onOpenChangePass={() => setShowChangePassModal(true)}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      <div className="main-wrapper">
        <TopHeader
          activeTabTitle={TAB_TITLES[activeTab] || 'CreditCores'}
          activeTab={activeTab}
          onNavigate={handleSelectTab}
          syncStatus={syncStatus}
          isSyncing={isSyncing}
          onTriggerSync={handleTriggerSync}
          currentUser={currentUser}
          onToggleSidebar={handleToggleSidebar}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />

        <main className="content-area">
          <Suspense fallback={<TabLoadingSkeleton title={`Đang tải ${TAB_TITLES[activeTab] || 'phân hệ'}...`} />}>
            {activeTab === 'dashboard' && (
              <Dashboard 
                stats={stats} 
                onNavigate={handleSelectTab} 
                onRefresh={fetchInitialData}
                syncStatus={syncStatus}
                currentUser={currentUser}
                onOpenCustomerQuickView={handleOpenCustomerQuickView}
              />
            )}

            {activeTab === 'customer360' && (
              <Customer360
                currentUser={currentUser}
                onNavigateToAppraisal={handleNavigateToAppraisal}
                onNavigateToInspection={handleNavigateToInspection}
                onNavigateToDebit={handleNavigateToDebit}
                onOpenCustomerQuickView={handleOpenCustomerQuickView}
              />
            )}

            {activeTab === 'collateral' && (
              <CollateralManager
                onOpenCustomerQuickView={handleOpenCustomerQuickView}
              />
            )}

            {activeTab === 'appraisal' && (
              <Appraisal 
                currentUser={currentUser}
                prefilledCustomer={prefilledCustomer} 
                onOpenCustomerQuickView={handleOpenCustomerQuickView}
              />
            )}

            {activeTab === 'inspection' && (
              <LoanInspection 
                prefilledContract={prefilledContract}
                onOpenCustomerQuickView={handleOpenCustomerQuickView}
              />
            )}

            {activeTab === 'debit_register' && (
              <DebitManager 
                initialSubTab="register"
                prefilledCustomer={prefilledCustomer}
                onOpenCustomerQuickView={handleOpenCustomerQuickView}
              />
            )}

            {activeTab === 'debit_batch' && (
              <DebitManager 
                initialSubTab="batch"
                prefilledCustomer={null}
                onOpenCustomerQuickView={handleOpenCustomerQuickView}
              />
            )}

            {activeTab === 'reconciliation' && <Reconciliation />}

            {activeTab === 'debt_warning' && (
              <DebtWarning onOpenCustomerQuickView={handleOpenCustomerQuickView} />
            )}

            {activeTab === 'reports' && <Reports />}

            {activeTab === 'templates' && <TemplateManager />}

            {activeTab === 'user_management' && <UserManagement />}

            {activeTab === 'settings' && (
              <Settings
                syncStatus={syncStatus}
                isSyncing={isSyncing}
                onTriggerSync={handleTriggerSync}
              />
            )}
          </Suspense>
        </main>
      </div>

      <Suspense fallback={null}>
        {showChangePassModal && (
          <ChangePasswordModal onClose={() => setShowChangePassModal(false)} />
        )}

        {quickViewCustomer && (
          <CustomerQuickModal
            customer={quickViewCustomer}
            onClose={() => setQuickViewCustomer(null)}
            onNavigateToAppraisal={handleNavigateToAppraisal}
            onNavigateToInspection={handleNavigateToInspection}
            onNavigateToDebit={handleNavigateToDebit}
          />
        )}
      </Suspense>
    </div>
  );
}
