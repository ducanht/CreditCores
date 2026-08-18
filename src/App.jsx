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
import { api } from './services/api';

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
  settings: 'Cấu Hình & Giám Sát Đồng Bộ Dữ Liệu Core'
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
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
    fetchInitialData();
    const interval = setInterval(async () => {
      try {
        const resSync = await api.getSyncStatus();
        if (resSync.status === 'success') setSyncStatus(resSync.data);
      } catch (e) {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-wrapper">
        <TopHeader
          activeTabTitle={TAB_TITLES[activeTab] || 'CreditCores'}
          syncStatus={syncStatus}
          isSyncing={isSyncing}
          onTriggerSync={handleTriggerSync}
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

          {activeTab === 'settings' && (
            <Settings
              syncStatus={syncStatus}
              isSyncing={isSyncing}
              onTriggerSync={handleTriggerSync}
            />
          )}
        </main>
      </div>
    </div>
  );
}
