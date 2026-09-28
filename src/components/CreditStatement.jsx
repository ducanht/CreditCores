import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  TrendingUp,
  Award,
  PieChart,
  CalendarRange,
  Search,
  Filter,
  Download,
  RefreshCw,
  Building2,
  Users,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Layers,
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';
import { formatCurrencyVN, getTodayVN } from '../utils/dateUtils';
import { api } from '../services/api';
import {
  MonthlyDebtTrendChart,
  Top50DebtSection,
  SecurityTypeBreakdown,
  LoanProductDonutChart,
  ExtractAsOfModal
} from './dashboard/index';
import DatePickerVN from './DatePickerVN';

// Helper rút gọn tiền tệ sang Tỷ / Triệu
const formatCompactVN = (amount) => {
  const num = Number(amount) || 0;
  if (Math.abs(num) >= 1e9) {
    const val = (num / 1e9).toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
    return `${val} tỷ`;
  }
  if (Math.abs(num) >= 1e6) {
    const val = (num / 1e6).toFixed(1).replace(/\.?0+$/, '').replace('.', ',');
    return `${val} tr`;
  }
  return num.toLocaleString('vi-VN') + ' đ';
};

export default function CreditStatement({ currentUser, onOpenCustomerQuickView }) {
  // Tab điều hướng chính: 'as_of' (Đến ngày) | 'monthly' (Theo tháng) | 'yearly' (Theo năm) | 'top_50' (Top 50) | 'structure' (Cơ cấu vay)
  const [activeTab, setActiveTab] = useState('as_of');

  // Mốc thời gian & bộ lọc phổ quát
  const [asOfDate, setAsOfDate] = useState(() => getTodayVN());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  // Modal trích xuất Core SQL (@denngay)
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);

  // Trạng thái dữ liệu
  const [isLoading, setIsLoading] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [statementContracts, setStatementContracts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCommune, setFilterCommune] = useState('ALL');
  const [filterCBTD, setFilterCBTD] = useState('ALL');

  // Phân trang danh sách hợp đồng sao kê
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Nạp dữ liệu sao kê
  const loadStatementData = async (forceFresh = false) => {
    setIsLoading(true);
    try {
      // 1. Nạp thống kê tổng hợp (hỗ trợ cả HDTD_CORE_DN và HDTD_CORE_ALL)
      const resStats = await api.getDashboardStats({
        mode: activeTab === 'monthly' ? 'compare' : 'as_of_date',
        asOfDate: asOfDate,
        sheetName: activeTab === 'monthly' ? 'HDTD_CORE_ALL' : 'HDTD_CORE_DN'
      }, forceFresh);

      if (resStats && resStats.status === 'success' && resStats.data) {
        setStatsData(resStats.data);
      }

      // 2. Nạp chi tiết danh sách hợp đồng sao kê
      const resReports = await api.getReportsData(forceFresh);
      if (resReports && resReports.status === 'success' && resReports.data) {
        const contracts = resReports.data.statementData || [];
        setStatementContracts(contracts);
      }
    } catch (err) {
      console.error('Lỗi nạp dữ liệu Sao kê tín dụng:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatementData();
  }, [activeTab]);

  // Danh sách địa bàn xã động từ dữ liệu thực tế
  const availableCommunes = useMemo(() => {
    const set = new Set();
    statementContracts.forEach(c => {
      const x = String(c.kvXa || c.xa || c.khuVuc || '').trim();
      if (x && x !== 'Khác' && x !== 'ALL') set.add(x);
    });
    return Array.from(set).sort();
  }, [statementContracts]);

  // Danh sách cán bộ tín dụng
  const availableCBTDs = useMemo(() => {
    const set = new Set();
    statementContracts.forEach(c => {
      const name = c.tenCBTD || c.cbtdPhuTrach || '';
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [statementContracts]);

  // Lọc danh sách hợp đồng sao kê
  const filteredContracts = useMemo(() => {
    return statementContracts.filter(item => {
      if (filterCommune !== 'ALL') {
        const areaStr = String(item.kvXa || item.xa || item.khuVuc || '');
        if (!areaStr.includes(filterCommune)) return false;
      }
      if (filterCBTD !== 'ALL' && (item.tenCBTD !== filterCBTD && item.cbtdPhuTrach !== filterCBTD)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.hoTen && item.hoTen.toLowerCase().includes(q);
        const matchHD = item.soHDTD && item.soHDTD.toLowerCase().includes(q);
        const matchKH = item.maKH && item.maKH.toLowerCase().includes(q);
        const matchDiaChi = item.diaChi && item.diaChi.toLowerCase().includes(q);
        return matchName || matchHD || matchKH || matchDiaChi;
      }
      return true;
    });
  }, [statementContracts, filterCommune, filterCBTD, searchQuery]);

  // Tổng hợp nhanh cho danh sách hợp đồng lọc
  const filteredSummary = useMemo(() => {
    let totalDuNo = 0;
    let totalTienVay = 0;
    const khSet = new Set();
    filteredContracts.forEach(c => {
      totalDuNo += (Number(c.duNo) || 0);
      totalTienVay += (Number(c.tienVay) || 0);
      if (c.maKH) khSet.add(c.maKH);
    });
    return {
      totalDuNo,
      totalTienVay,
      totalContracts: filteredContracts.length,
      totalBorrowers: khSet.size
    };
  }, [filteredContracts]);

  // Dữ liệu phân trang
  const totalPages = Math.ceil(filteredContracts.length / pageSize) || 1;
  const paginatedContracts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContracts.slice(start, start + pageSize);
  }, [filteredContracts, currentPage]);

  // Xuất file CSV danh sách sao kê
  const handleExportCSV = () => {
    if (filteredContracts.length === 0) return;
    let csvContent = '\uFEFF';
    csvContent += 'STT,Số HĐTD,Mã KH,Số TV,Họ Và Tên,Địa Chỉ,Khu Vực Xã,Tiền Vay,Dư Nợ,Lãi Suất,Ngày Vay,Đến Hạn,Thời Hạn,Loại Vay,CBTD Phụ Trách\n';

    filteredContracts.forEach((item, idx) => {
      const row = [
        idx + 1,
        `"${item.soHDTD || ''}"`,
        `"${item.maKH || ''}"`,
        `"${item.soTV || ''}"`,
        `"${(item.hoTen || '').replace(/"/g, '""')}"`,
        `"${(item.diaChi || '').replace(/"/g, '""')}"`,
        `"${(item.khuVuc || item.xa || '').replace(/"/g, '""')}"`,
        item.tienVay || 0,
        item.duNo || 0,
        item.laiSuat || '',
        `"${item.ngayVay || ''}"`,
        `"${item.denHan || ''}"`,
        item.soThangVay || '',
        `"${(item.maLoaiVay || item.moTaVay || '').replace(/"/g, '""')}"`,
        `"${(item.tenCBTD || item.cbtdPhuTrach || '').replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Sao_Ke_Tin_Dung_${activeTab}_${(asOfDate || getTodayVN()).replace(/\//g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dữ liệu cho các tab con
  const monthlyDebtTrend = statsData?.monthlyDebtTrend || [];
  const top50DenNgay = statsData?.top50DuNoDenNgay || [];
  const top50BinhQuan = statsData?.top50DuNoBinhQuanCuoiThang || [];
  const totalDuNoAll = statsData?.totalDuNo || filteredSummary.totalDuNo || 0;
  const securityTypes = statsData?.securityTypes || statsData?.securityTypeStats || statsData?.securityTypeDistribution || [];
  const loanGroups = statsData?.loanGroups || statsData?.loanTypes || [];
  const loanTypes = statsData?.loanTypes || [];

  return (
    <div className="credit-statement-container d-flex flex-column gap-3 pb-4 content-fade-in">
      {/* 1. Header Phân Hệ & Thanh Điều Hướng 5 Tab Chuẩn Ngân Hàng */}
      <div className="card-modern p-3">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2.5 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded-2.5 bg-success-subtle text-success">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-bold mb-0 font-heading text-dark">Sao Kê Tín Dụng</h5>
                {/* Icon nhấp nháy tình trạng hệ thống trực tuyến */}
                <span className="pulse-online" title="Hệ thống trực tuyến" />
              </div>
              <span className="small text-muted">
                Tra cứu, sao kê đa chiều và phân tích dữ liệu tín dụng thời gian thực
              </span>
            </div>
          </div>

          {/* Công cụ thao tác nhanh */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 px-2.5 py-1.5 rounded-2"
              onClick={() => loadStatementData(true)}
              disabled={isLoading}
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={13} className={isLoading ? 'spin-animation' : ''} />
              <span className="small">{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-success d-flex align-items-center gap-1.5 px-2.5 py-1.5 rounded-2"
              onClick={handleExportCSV}
              title="Xuất file CSV"
            >
              <Download size={13} />
              <span className="small">Xuất CSV</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 px-2.5 py-1.5 rounded-2"
              onClick={() => setIsExtractModalOpen(true)}
              title="Trích xuất từ Core SQL"
            >
              <Database size={13} />
              <span className="small">Trích xuất Core SQL</span>
            </button>
          </div>
        </div>

        {/* 5 Tab điều hướng tinh gọn */}
        <div className="d-flex align-items-center gap-1.5 flex-wrap">
          <button
            type="button"
            className={`btn btn-sm text-start py-2 px-3 rounded-2.5 d-flex align-items-center gap-1.5 border transition-all flex-grow-1 ${
              activeTab === 'as_of'
                ? 'btn-primary text-white fw-bold shadow-xs'
                : 'btn-light text-dark'
            }`}
            onClick={() => { setActiveTab('as_of'); setCurrentPage(1); }}
          >
            <Calendar size={14} />
            <span>Đến ngày</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm text-start py-2 px-3 rounded-2.5 d-flex align-items-center gap-1.5 border transition-all flex-grow-1 ${
              activeTab === 'monthly'
                ? 'btn-primary text-white fw-bold shadow-xs'
                : 'btn-light text-dark'
            }`}
            onClick={() => setActiveTab('monthly')}
          >
            <TrendingUp size={14} />
            <span>Theo tháng</span>
            <span className={`badge ms-auto ${activeTab === 'monthly' ? 'bg-white text-dark' : 'bg-primary-subtle text-primary'}`}>
              Biểu đồ
            </span>
          </button>

          <button
            type="button"
            className={`btn btn-sm text-start py-2 px-3 rounded-2.5 d-flex align-items-center gap-1.5 border transition-all flex-grow-1 ${
              activeTab === 'yearly'
                ? 'btn-primary text-white fw-bold shadow-xs'
                : 'btn-light text-dark'
            }`}
            onClick={() => setActiveTab('yearly')}
          >
            <CalendarRange size={14} />
            <span>Theo năm</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm text-start py-2 px-3 rounded-2.5 d-flex align-items-center gap-1.5 border transition-all flex-grow-1 ${
              activeTab === 'top_50'
                ? 'btn-primary text-white fw-bold shadow-xs'
                : 'btn-light text-dark'
            }`}
            onClick={() => setActiveTab('top_50')}
          >
            <Award size={14} />
            <span>Top 50</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm text-start py-2 px-3 rounded-2.5 d-flex align-items-center gap-1.5 border transition-all flex-grow-1 ${
              activeTab === 'structure'
                ? 'btn-primary text-white fw-bold shadow-xs'
                : 'btn-light text-dark'
            }`}
            onClick={() => setActiveTab('structure')}
          >
            <PieChart size={14} />
            <span>Cơ cấu vay</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ĐẾN NGÀY                                                           */}
      {/* ========================================================================= */}
      {activeTab === 'as_of' && (
        <div className="d-flex flex-column gap-3">
          {/* Bộ lọc mốc ngày & tìm kiếm */}
          <div className="card-modern p-3">
            <div className="row g-2.5 align-items-center">
              <div className="col-12 col-md-3">
                <label className="form-label small text-muted mb-1 fw-medium">Mốc sao kê đến ngày</label>
                <div className="d-flex align-items-center gap-1.5">
                  <div className="flex-grow-1">
                    <DatePickerVN
                      value={asOfDate}
                      onChange={(val) => setAsOfDate(val)}
                      placeholder="dd/mm/yyyy"
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm flex-shrink-0"
                    onClick={() => loadStatementData(true)}
                    disabled={isLoading}
                    title="Xem sao kê theo mốc ngày"
                  >
                    Xem
                  </button>
                </div>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label small text-muted mb-1 fw-medium">Địa bàn xã</label>
                <select
                  className="form-select form-select-sm"
                  value={filterCommune}
                  onChange={(e) => { setFilterCommune(e.target.value); setCurrentPage(1); }}
                >
                  <option value="ALL">-- Tất cả địa bàn --</option>
                  {availableCommunes.map(commune => (
                    <option key={commune} value={commune}>{commune}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label small text-muted mb-1 fw-medium">Cán bộ tín dụng</label>
                <select
                  className="form-select form-select-sm"
                  value={filterCBTD}
                  onChange={(e) => { setFilterCBTD(e.target.value); setCurrentPage(1); }}
                >
                  <option value="ALL">-- Tất cả cán bộ --</option>
                  {availableCBTDs.map(cbtd => (
                    <option key={cbtd} value={cbtd}>{cbtd}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label small text-muted mb-1 fw-medium">Tìm kiếm nhanh</label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white text-muted">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Họ tên, Số HĐ, CCCD..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Chỉ số tóm tắt sao kê */}
            <div className="row g-2 mt-2 pt-2 border-top">
              <div className="col-6 col-md-3">
                <div className="p-2 rounded-2 bg-light">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Tổng Dư Nợ Thực Tế Đến Ngày (DuNo)</span>
                  <strong className="fs-6 text-primary num-tabular font-numeric">{formatCurrencyVN(filteredSummary.totalDuNo)}</strong>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-2 rounded-2 bg-light">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Tổng Vốn Cho Vay Ban Đầu (TienVay)</span>
                  <strong className="fs-6 text-dark num-tabular font-numeric">{formatCurrencyVN(filteredSummary.totalTienVay)}</strong>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-2 rounded-2 bg-light">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Số Lượng Hợp Đồng</span>
                  <strong className="fs-6 text-success num-tabular font-numeric">{filteredSummary.totalContracts} HĐ</strong>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-2 rounded-2 bg-light">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Số Thành Viên Vay</span>
                  <strong className="fs-6 text-dark num-tabular font-numeric">{filteredSummary.totalBorrowers} TV</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Bảng Danh Sách Hợp Đồng Tín Dụng Sao Kê */}
          <div className="card-modern p-3">
            <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom flex-wrap gap-2">
              <span className="fw-semibold text-dark small">
                Danh sách hợp đồng tín dụng ({filteredContracts.length} món)
              </span>
              <span className="text-muted small">
                Trang {currentPage} / {totalPages}
              </span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover table-custom align-middle mb-0" style={{ fontSize: '0.84rem' }}>
                <thead className="table-light text-secondary text-uppercase" style={{ fontSize: '0.72rem' }}>
                  <tr>
                    <th>STT</th>
                    <th>Số HĐTD</th>
                    <th>Mã KH</th>
                    <th>Họ Tên Khách Vay</th>
                    <th>Địa Bàn</th>
                    <th className="text-end">Tiền Vay</th>
                    <th className="text-end">Dư Nợ Hiện Tại</th>
                    <th className="text-center">Lãi Suất</th>
                    <th className="text-center">Ngày Vay</th>
                    <th className="text-center">Đến Hạn</th>
                    <th>CBTD</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContracts.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-4 text-muted">
                        Không tìm thấy hợp đồng tín dụng nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    paginatedContracts.map((item, idx) => {
                      const stt = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <tr
                          key={item.soHDTD || idx}
                          className="cursor-pointer"
                          onClick={() => onOpenCustomerQuickView && onOpenCustomerQuickView(item)}
                          title="Bấm để xem hồ sơ 360°"
                        >
                          <td className="text-muted small text-center">{stt}</td>
                          <td className="fw-semibold font-monospace text-primary">{item.soHDTD}</td>
                          <td className="font-monospace text-muted">{item.maKH}</td>
                          <td className="fw-bold text-dark">{item.hoTen}</td>
                          <td className="small text-muted">{item.khuVuc || item.xa || item.diaChi}</td>
                          <td className="text-end num-tabular font-numeric">{formatCurrencyVN(item.tienVay)}</td>
                          <td className="text-end fw-bold num-tabular font-numeric text-primary">{formatCurrencyVN(item.duNo)}</td>
                          <td className="text-center font-monospace">{item.laiSuat}%</td>
                          <td className="text-center font-monospace small">{item.ngayVay}</td>
                          <td className="text-center font-monospace small">{item.denHan}</td>
                          <td className="small text-muted">{item.tenCBTD || item.cbtdPhuTrach}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredContracts.length > 0 && (
                  <tfoot className="table-light fw-bold" style={{ fontSize: '0.84rem' }}>
                    <tr className="border-top-2">
                      <td colSpan={5} className="text-center text-secondary py-2">
                        Tổng cộng ({filteredContracts.length} hợp đồng)
                      </td>
                      <td className="text-end num-tabular font-numeric py-2">
                        {formatCurrencyVN(filteredSummary.totalTienVay)}
                      </td>
                      <td className="text-end num-tabular font-numeric text-primary py-2">
                        {formatCurrencyVN(filteredSummary.totalDuNo)}
                      </td>
                      <td colSpan={4} className="py-2"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Điều khiển phân trang */}
            {totalPages > 1 && (
              <div className="d-flex align-items-center justify-content-between mt-3 pt-2 border-top flex-wrap gap-2">
                <span className="small text-muted">
                  Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredContracts.length)} trong số {filteredContracts.length} hợp đồng
                </span>
                <div className="btn-group btn-group-sm">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    « Trước
                  </button>
                  <span className="btn btn-outline-secondary disabled bg-light text-dark fw-bold">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sau »
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: THEO THÁNG (CÓ BIỂU ĐỒ SO SÁNH CHỈ SỐ THEO THÁNG)                  */}
      {/* ========================================================================= */}
      {activeTab === 'monthly' && (
        <div className="d-flex flex-column gap-3">
          {/* Biểu đồ diễn biến và so sánh các chỉ số theo tháng */}
          <MonthlyDebtTrendChart monthlyDebtTrend={monthlyDebtTrend} />

          {/* Thẻ chỉ số so sánh liên tháng gần nhất */}
          {monthlyDebtTrend.length >= 2 && (() => {
            const latest = monthlyDebtTrend[monthlyDebtTrend.length - 1];
            const previous = monthlyDebtTrend[monthlyDebtTrend.length - 2];
            const deltaDuNo = latest.totalDuNo - previous.totalDuNo;
            const deltaHD = latest.countHD - previous.countHD;
            const deltaKH = latest.countKH - previous.countKH;
            const growthRate = previous.totalDuNo > 0 ? ((deltaDuNo / previous.totalDuNo) * 100).toFixed(1) : 0;

            return (
              <div className="card-modern p-3">
                <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <TrendingUp size={16} className="text-primary" />
                    <h6 className="fw-bold mb-0 text-dark">Đối Soát Tăng Trưởng Liên Tháng ({previous.date} → {latest.date})</h6>
                  </div>
                  <span className={`badge ${deltaDuNo >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} fw-bold`}>
                    Tăng trưởng: {growthRate >= 0 ? '+' : ''}{growthRate}%
                  </span>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-sm-4">
                    <div className="p-2.5 rounded-2.5 bg-light border">
                      <span className="small text-muted d-block mb-1">Chênh lệch Dư nợ (Δ)</span>
                      <div className={`fs-5 fw-bold num-tabular font-numeric ${deltaDuNo >= 0 ? 'text-success' : 'text-danger'}`}>
                        {deltaDuNo >= 0 ? '+' : ''}{formatCurrencyVN(deltaDuNo)}
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {latest.date}: {formatCompactVN(latest.totalDuNo)} vs {previous.date}: {formatCompactVN(previous.totalDuNo)}
                      </span>
                    </div>
                  </div>

                  <div className="col-12 col-sm-4">
                    <div className="p-2.5 rounded-2.5 bg-light border">
                      <span className="small text-muted d-block mb-1">Biến động Hợp đồng</span>
                      <div className={`fs-5 fw-bold num-tabular font-numeric ${deltaHD >= 0 ? 'text-primary' : 'text-danger'}`}>
                        {deltaHD >= 0 ? '+' : ''}{deltaHD} HĐ
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Hiện tại: {latest.countHD} HĐ • Kỳ trước: {previous.countHD} HĐ
                      </span>
                    </div>
                  </div>

                  <div className="col-12 col-sm-4">
                    <div className="p-2.5 rounded-2.5 bg-light border">
                      <span className="small text-muted d-block mb-1">Biến động Thành viên vay</span>
                      <div className={`fs-5 fw-bold num-tabular font-numeric ${deltaKH >= 0 ? 'text-info' : 'text-danger'}`}>
                        {deltaKH >= 0 ? '+' : ''}{deltaKH} TV
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Hiện tại: {latest.countKH} TV • Kỳ trước: {previous.countKH} TV
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: THEO NĂM                                                           */}
      {/* ========================================================================= */}
      {activeTab === 'yearly' && (
        <div className="d-flex flex-column gap-3">
          <div className="card-modern p-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <CalendarRange size={18} className="text-primary" />
                <h6 className="fw-bold mb-0 text-dark">Tổng Hợp & So Sánh Tín Dụng Theo Năm Tài Chính</h6>
              </div>
              <div className="d-flex align-items-center gap-2">
                <label className="small text-muted mb-0">Năm tài chính:</label>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 110 }}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="card-modern p-3 bg-light border h-100">
                  <h6 className="fw-bold text-dark small mb-2">Quy Mô & Tốc Độ Tăng Trưởng Năm {selectedYear}</h6>
                  <p className="small text-muted mb-3">
                    Tổng kết chuỗi số liệu tín dụng và so sánh với chỉ tiêu tăng trưởng tín dụng được Ngân hàng Nhà nước giao đầu năm.
                  </p>
                  <div className="d-flex flex-column gap-2 small">
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span className="text-muted">Dư nợ chốt cuối kỳ:</span>
                      <strong className="text-primary font-numeric">{formatCurrencyVN(totalDuNoAll)}</strong>
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span className="text-muted">Tổng số hợp đồng đang vay:</span>
                      <strong className="text-dark font-numeric">{filteredSummary.totalContracts} HĐ</strong>
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span className="text-muted">Số thành viên vay vốn:</span>
                      <strong className="text-dark font-numeric">{filteredSummary.totalBorrowers} TV</strong>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">Dư nợ bình quân / Hợp đồng:</span>
                      <strong className="text-dark font-numeric">
                        {filteredSummary.totalContracts > 0 ? formatCompactVN(totalDuNoAll / filteredSummary.totalContracts) : '0 đ'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="card-modern p-3 bg-light border h-100">
                  <h6 className="fw-bold text-dark small mb-2">Đánh Giá An Toàn Vốn & Tỷ Trọng</h6>
                  <div className="p-3 bg-white rounded-2 border mb-2 text-center">
                    <span className="text-muted small d-block">Tỷ lệ bao phủ ủy quyền CASA</span>
                    <strong className="fs-4 text-success font-numeric">
                      {filteredSummary.totalBorrowers > 0 ? Math.round((filteredContracts.filter(c => c.soTK_CASA).length / filteredSummary.totalBorrowers) * 100) : 0}%
                    </strong>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-muted small mt-2">
                    <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                    <span>Dữ liệu được cập nhật tự động từ kho dữ liệu tín dụng QTDND Yên Thọ.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TOP 50                                                             */}
      {/* ========================================================================= */}
      {activeTab === 'top_50' && (
        <Top50DebtSection
          top50DuNoDenNgay={top50DenNgay}
          top50DuNoBinhQuanCuoiThang={top50BinhQuan}
          totalDuNo={totalDuNoAll}
          onOpenCustomerQuickView={onOpenCustomerQuickView}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CƠ CẤU VAY                                                         */}
      {/* ========================================================================= */}
      {activeTab === 'structure' && (
        <div className="d-flex flex-column gap-3">
          {/* 7 Hình thức bảo đảm TSĐB */}
          <SecurityTypeBreakdown
            securityTypes={securityTypes}
            totalDuNo={totalDuNoAll}
          />

          {/* Cơ cấu sản phẩm vay */}
          <LoanProductDonutChart
            loanGroups={loanGroups}
            loanTypes={loanTypes}
            totalDuNo={totalDuNoAll}
          />
        </div>
      )}

      {/* Modal Trích Xuất Core SQL */}
      {isExtractModalOpen && (
        <ExtractAsOfModal
          isOpen={isExtractModalOpen}
          onClose={() => setIsExtractModalOpen(false)}
          onSuccess={() => loadStatementData(true)}
        />
      )}
    </div>
  );
}
