import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import Dashboard from './components/Dashboard';
import Customer360 from './components/Customer360';
import Appraisal from './components/Appraisal';
import LoanInspection from './components/LoanInspection';
import DebitManager from './components/DebitManager';
import Reconciliation from './components/Reconciliation';
import DebtWarning from './components/DebtWarning';
import Reports from './components/Reports';
import Settings from './components/Settings';
import UserManagement from './components/UserManagement';
import LoginModal from './components/LoginModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import { api } from './services/api';
import { AuthService } from './services/auth';

const TAB_TITLES = {
  dashboard: 'Dashboard Quản Trị Tín Dụng',
  customer360: 'Tra Cứu Khách Hàng & Hợp Đồng 360°',
  appraisal: 'Thẩm Định Tín Dụng & Tài Sản Đảm Bảo',
  inspection: 'Biên Bản Kiểm Tra Sử Dụng Vốn Sau Giải Ngân',
  debit_register: 'Quản Lý Đăng Ký Dịch Vụ Trích Nợ',
  debit_batch: 'Khởi Tạo & Quản Lý Đợt Trích Nợ Tự Động',
  reconciliation: 'Đối Soát Kết Quả Trích Nợ Từ CoreBanking',
  debt_warning: 'Sổ Theo Dõi Nợ Tồn Đọng & Cảnh Báo',
  reports: 'Báo Cáo Thống Kê & Phân Tích Dư Nợ',
  user_management: 'Phân Quyền 360° & Quản Lý Tài Khoản',
  settings: 'Cấu Hình & Giám Sát Đồng Bộ Dữ Liệu Core'
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [stats, setStats] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Cross-module prefill states
  const [prefilledCustomer, setPrefilledCustomer] = useState(null);
  const [prefilledContract, setPrefilledContract] = useState(null);

  const fetchInitialData = async () => {
    try {
      const [resStats, resSync] = await Promise.all([
        api.getDashboardStats(),
        api.getSyncStatus()
      ]);
      if (resStats.status === 'success') setStats(resStats.data);
      if (resSync.status === 'success') setSyncStatus(resSync.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchInitialData();
      const interval = setInterval(async () => {
        try {
          const resSync = await api.getSyncStatus();
          if (resSync.status === 'success') setSyncStatus(resSync.data);
        } catch (e) {}
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống CreditCores?')) {
      AuthService.logout();
      setCurrentUser(null);
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await api.triggerSqlSync();
      if (res.status === 'success') {
        alert(res.message || 'Đã gửi lệnh đồng bộ!');
        const sRes = await api.getSyncStatus();
        if (sRes.status === 'success') setSyncStatus(sRes.data);
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

  // IF NOT AUTHENTICATED -> SHOW LOGIN SCREEN
  if (!currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenChangePass={() => setShowChangePassModal(true)}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="main-wrapper">
        <TopHeader
          activeTabTitle={TAB_TITLES[activeTab] || 'CreditCores'}
          syncStatus={syncStatus}
          isSyncing={isSyncing}
          onTriggerSync={handleTriggerSync}
          currentUser={currentUser}
          onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <main className="content-area">
          {activeTab === 'dashboard' && <Dashboard stats={stats} onNavigate={setActiveTab} />}

          {activeTab === 'customer360' && (
            <Customer360
              onNavigateToAppraisal={handleNavigateToAppraisal}
              onNavigateToInspection={handleNavigateToInspection}
              onNavigateToDebit={handleNavigateToDebit}
            />
          )}

          {activeTab === 'appraisal' && <Appraisal prefilledCustomer={prefilledCustomer} />}

          {activeTab === 'inspection' && <LoanInspection prefilledContract={prefilledContract} />}

          {activeTab === 'debit_register' && <DebitManager prefilledCustomer={prefilledCustomer} />}

          {activeTab === 'debit_batch' && <DebitManager prefilledCustomer={null} />}

          {activeTab === 'reconciliation' && <Reconciliation />}

          {activeTab === 'debt_warning' && <DebtWarning />}

          {activeTab === 'reports' && <Reports />}

          {activeTab === 'user_management' && <UserManagement />}

          {activeTab === 'settings' && (
            <Settings
              syncStatus={syncStatus}
              isSyncing={isSyncing}
              onTriggerSync={handleTriggerSync}
            />
          )}
        </main>
      </div>

      {showChangePassModal && (
        <ChangePasswordModal onClose={() => setShowChangePassModal(false)} />
      )}
    </div>
  );
}
