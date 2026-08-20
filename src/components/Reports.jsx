import React, { useState, useEffect, useMemo } from 'react';
import {
  FileBarChart2,
  Download,
  MapPin,
  PieChart,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Users,
  DollarSign,
  Landmark,
  Layers,
  ArrowUpRight,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Calendar,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrencyVN, getTodayVN } from '../utils/dateUtils';

export default function Reports() {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('2026_Q3'); // '2026_ALL', '2026_Q3', '2026_M08'

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.getReportsData();
      if (res.status === 'success' && res.data) {
        setReportsData(res.data);
      }
    } catch (e) {
      console.error('Lỗi nạp báo cáo:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const areaData = useMemo(() => {
    if (reportsData?.areaData?.length > 0) return reportsData.areaData;
    return [
      { area: 'Xã Yên Thọ (Thôn 1, 2, 3, 4)', countKH: 142, duNo: 22500000000, rate: '46.4%', color: 'bg-primary' },
      { area: 'Xã Yên Trường (Thôn 1, 2, 3)', countKH: 110, duNo: 16800000000, rate: '34.6%', color: 'bg-success' },
      { area: 'Xã Yên Bái / Quý Lộc', countKH: 68, duNo: 9200000000, rate: '19.0%', color: 'bg-warning' }
    ];
  }, [reportsData]);

  const loanTypes = useMemo(() => {
    if (reportsData?.loanTypes?.length > 0) return reportsData.loanTypes;
    return [
      { type: 'Nông nghiệp & Chăn nuôi', count: 184, amount: 26000000000, rate: '53.6%', color: '#16a34a' },
      { type: 'Thương mại & Dịch vụ', count: 98, amount: 14500000000, rate: '29.9%', color: '#0284c7' },
      { type: 'Tiêu dùng & Đời sống', count: 60, amount: 8000000000, rate: '16.5%', color: '#eab308' }
    ];
  }, [reportsData]);

  const totalDuNo = useMemo(() => {
    return areaData.reduce((acc, curr) => acc + (Number(curr.duNo) || 0), 0) || 48500000000;
  }, [areaData]);

  const totalMembers = useMemo(() => {
    return areaData.reduce((acc, curr) => acc + (Number(curr.countKH) || 0), 0) || 320;
  }, [areaData]);

  const avgLoanSize = totalMembers > 0 ? Math.round(totalDuNo / totalMembers) : 0;

  // Xuất file CSV báo cáo quản trị
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'BÁO CÁO THỐNG KÊ & PHÂN TÍCH QUẢN TRỊ TÍN DỤNG\n';
    csvContent += 'QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ\n';
    csvContent += `Thời điểm xuất: ${getTodayVN()}\n\n`;

    csvContent += '1. PHÂN BỔ DƯ NỢ THEO 3 XÃ\n';
    csvContent += 'Địa bàn,Số khách hàng,Tổng dư nợ (VNĐ),Tỷ trọng\n';
    areaData.forEach((a) => {
      csvContent += `"${a.area}",${a.countKH},${a.duNo},"${a.rate}"\n`;
    });
    csvContent += `TỔNG CỘNG,${totalMembers},${totalDuNo},100%\n\n`;

    csvContent += '2. CƠ CẤU SẢN PHẨM TÍN DỤNG\n';
    csvContent += 'Sản phẩm vay,Số món,Tổng dư nợ (VNĐ),Tỷ trọng\n';
    loanTypes.forEach((lt) => {
      csvContent += `"${lt.type}",${lt.count},${lt.amount},"${lt.rate}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BaoCao_QuanTri_TinDung_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. Filter & Actions Toolbar */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <span className="small fw-medium text-muted d-flex align-items-center gap-1.5">
            <Calendar size={15} className="text-primary" /> Chu kỳ:
          </span>
          <select
            className="form-select form-select-sm fw-medium"
            style={{ width: 160 }}
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="2026_Q3">Quý 3/2026</option>
            <option value="2026_M08">Tháng 08/2026</option>
            <option value="2026_M07">Tháng 07/2026</option>
            <option value="2026_ALL">Cả Năm 2026</option>
          </select>
        </div>

        <div className="d-flex align-items-center flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={fetchReports}
            disabled={loading}
            title="Tải lại số liệu báo cáo"
          >
            <RefreshCw size={13} className={loading ? 'fa-spin' : ''} />
            <span className="d-none d-sm-inline">Làm mới</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
            onClick={() => window.print()}
            title="In báo cáo thống kê"
          >
            <Printer size={13} />
            <span className="d-none d-sm-inline">In Báo Cáo</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-brand fw-medium d-flex align-items-center gap-1.5 text-white shadow-sm"
            onClick={handleExportCSV}
          >
            <Download size={14} /> Xuất Báo Cáo (.csv)
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Bento Cards Row */}
      <div className="row g-3">
        {/* KPI 1: Tổng Dư Nợ */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-modern p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                  Tổng Dư Nợ Tín Dụng
                </span>
                <h3 className="fw-semibold text-slate-900 m-0 mt-1 num-tabular font-heading fs-4">
                  {formatCurrencyVN(totalDuNo)}
                </h3>
              </div>
              <div className="p-2 rounded-2 bg-primary-subtle text-primary">
                <Landmark size={18} />
              </div>
            </div>
            <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span className="text-success fw-medium d-flex align-items-center gap-1">
                <ArrowUpRight size={13} /> +4.8% tăng trưởng
              </span>
              <span>Kế hoạch: 52 Tỷ</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Thành Viên Vay Vốn */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-modern p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                  Thành Viên Vay Vốn
                </span>
                <h3 className="fw-semibold text-primary m-0 mt-1 num-tabular font-heading fs-4">
                  {totalMembers} Thành Viên
                </h3>
              </div>
              <div className="p-2 rounded-2 bg-info-subtle text-info">
                <Users size={18} />
              </div>
            </div>
            <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span>Dư nợ BQ/món:</span>
              <strong className="text-dark num-tabular">{formatCurrencyVN(avgLoanSize)}</strong>
            </div>
          </div>
        </div>

        {/* KPI 3: Tỷ Lệ Thu Hồi Trích Nợ */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-modern p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                  Thu Hồi Trích Nợ CASA
                </span>
                <h3 className="fw-semibold text-success m-0 mt-1 num-tabular font-heading fs-4">
                  96.8%
                </h3>
              </div>
              <div className="p-2 rounded-2 bg-success-subtle text-success">
                <Zap size={18} />
              </div>
            </div>
            <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span className="text-success fw-medium d-flex align-items-center gap-1">
                <CheckCircle2 size={12} /> Tự động hóa đạt chuẩn
              </span>
              <span>Kỳ 1, 2, 3</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Nợ Xấu & An Toàn Vốn */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-modern p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                  Tỷ Lệ Nợ Xấu (N3-N5)
                </span>
                <h3 className="fw-semibold text-slate-900 m-0 mt-1 num-tabular font-heading fs-4 text-success">
                  0.82%
                </h3>
              </div>
              <div className="p-2 rounded-2 bg-success-subtle text-success">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span className="text-success fw-medium">Ngưỡng an toàn (≤1.5%)</span>
              <span className="badge bg-success-subtle text-success px-1.5 py-0.5">Tốt</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Analytics Grid: 2 Visual Interactive Dashboard Cards */}
      <div className="row g-4">
        {/* Dashboard Block 1: Phân Bổ Dư Nợ Theo Địa Bàn 3 Xã */}
        <div className="col-12 col-lg-6">
          <div className="card-modern p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold m-0 text-slate-900 font-heading d-flex align-items-center gap-2">
                  <MapPin size={17} className="text-primary" /> Phân Bổ Dư Nợ Theo Địa Bàn (3 Xã)
                </h6>
                <span className="badge bg-light text-muted border small">
                  {areaData.length} địa bàn
                </span>
              </div>

              {/* Multi-Segment Visual Progress Bar */}
              <div className="progress mb-3" style={{ height: 10, borderRadius: 6, backgroundColor: '#f1f5f9' }}>
                {areaData.map((a, idx) => {
                  const numRate = parseFloat(a.rate) || 0;
                  const bgClass = idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-success' : 'bg-warning';
                  return (
                    <div
                      key={idx}
                      className={`progress-bar ${bgClass}`}
                      style={{ width: `${numRate}%` }}
                      title={`${a.area}: ${a.rate}`}
                    />
                  );
                })}
              </div>

              {/* Detailed Breakdown List */}
              <div className="table-responsive">
                <table className="table table-custom align-middle small">
                  <thead>
                    <tr>
                      <th>Địa Bàn / Xã</th>
                      <th className="text-center">Số KH</th>
                      <th className="text-end">Dư Nợ (VNĐ)</th>
                      <th className="text-end">Tỷ Trọng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {areaData.map((a, idx) => {
                      const dotColor = idx === 0 ? '#3b82f6' : idx === 1 ? '#22c55e' : '#f59e0b';
                      return (
                        <tr key={idx}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span className="p-1 rounded-circle" style={{ backgroundColor: dotColor }}></span>
                              <span className="fw-medium text-dark">{a.area}</span>
                            </div>
                          </td>
                          <td className="text-center num-tabular">{a.countKH}</td>
                          <td className="text-end fw-medium text-primary num-tabular">
                            {formatCurrencyVN(a.duNo)}
                          </td>
                          <td className="text-end fw-medium text-success num-tabular">
                            <span className="badge bg-light text-dark border font-monospace">
                              {a.rate}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-3 pt-2 border-top d-flex justify-content-between text-muted small" style={{ fontSize: '0.75rem' }}>
              <span>Trọng tâm tăng trưởng: Xã Yên Thọ</span>
              <span>Tổng địa bàn: 3 Xã trọng điểm</span>
            </div>
          </div>
        </div>

        {/* Dashboard Block 2: Cơ Cấu Sản Phẩm Tín Dụng */}
        <div className="col-12 col-lg-6">
          <div className="card-modern p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold m-0 text-slate-900 font-heading d-flex align-items-center gap-2">
                  <PieChart size={17} className="text-success" /> Cơ Cấu Sản Phẩm Vay Vốn
                </h6>
                <span className="badge bg-light text-muted border small">
                  {loanTypes.length} nhóm sản phẩm
                </span>
              </div>

              {/* Multi-Segment Visual Progress Bar */}
              <div className="progress mb-3" style={{ height: 10, borderRadius: 6, backgroundColor: '#f1f5f9' }}>
                {loanTypes.map((lt, idx) => {
                  const numRate = parseFloat(lt.rate) || 0;
                  return (
                    <div
                      key={idx}
                      className="progress-bar"
                      style={{ width: `${numRate}%`, backgroundColor: lt.color }}
                      title={`${lt.type}: ${lt.rate}`}
                    />
                  );
                })}
              </div>

              {/* Detailed Breakdown List */}
              <div className="table-responsive">
                <table className="table table-custom align-middle small">
                  <thead>
                    <tr>
                      <th>Sản Phẩm Vay</th>
                      <th className="text-center">Số Món</th>
                      <th className="text-end">Tổng Dư Nợ (VNĐ)</th>
                      <th className="text-end">Tỷ Trọng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanTypes.map((lt, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="p-1 rounded-circle" style={{ backgroundColor: lt.color }}></span>
                            <span className="fw-medium text-dark">{lt.type}</span>
                          </div>
                        </td>
                        <td className="text-center num-tabular">{lt.count}</td>
                        <td className="text-end fw-medium text-success num-tabular">
                          {formatCurrencyVN(lt.amount)}
                        </td>
                        <td className="text-end fw-medium num-tabular">
                          <span className="badge bg-light text-dark border font-monospace">
                            {lt.rate}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-3 pt-2 border-top d-flex justify-content-between text-muted small" style={{ fontSize: '0.75rem' }}>
              <span>Cho vay nông nghiệp chiếm tỷ trọng cao nhất (53.6%)</span>
              <span>Định hướng: Tiếp tục mở rộng</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Risk & Supervision Quality Indicators Row */}
      <div className="card-modern p-4">
        <h6 className="fw-semibold mb-3 text-slate-900 font-heading d-flex align-items-center gap-2">
          <ShieldCheck size={18} className="text-primary" /> Bộ Chỉ Số Giám Sát An Toàn & Chất Lượng Danh Mục Tín Dụng
        </h6>

        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="p-3 bg-light-subtle rounded-3 border">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-medium text-dark">Tỷ Lệ Bảo Đảm TSĐB (LTV Bình Quân)</span>
                <span className="badge bg-success-subtle text-success fw-medium">42.5%</span>
              </div>
              <div className="progress mt-2" style={{ height: 6, borderRadius: 99 }}>
                <div className="progress-bar bg-success" style={{ width: '42.5%' }}></div>
              </div>
              <div className="small text-muted mt-2" style={{ fontSize: '0.72rem' }}>
                Hệ số an toàn cao, giá trị TSĐB vượt 2.3 lần tổng dư nợ
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="p-3 bg-light-subtle rounded-3 border">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-medium text-dark">Tiến Độ Kiểm Tra Vốn Sau Vay</span>
                <span className="badge bg-primary-subtle text-primary fw-medium">94.2%</span>
              </div>
              <div className="progress mt-2" style={{ height: 6, borderRadius: 99 }}>
                <div className="progress-bar bg-primary" style={{ width: '94.2%' }}></div>
              </div>
              <div className="small text-muted mt-2" style={{ fontSize: '0.72rem' }}>
                Đã hoàn thành lập biên bản thực địa định kỳ cho 302/320 món
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="p-3 bg-light-subtle rounded-3 border">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-medium text-dark">Bao Phủ Trích Nợ Tự Động CASA</span>
                <span className="badge bg-info-subtle text-info fw-medium">85.4%</span>
              </div>
              <div className="progress mt-2" style={{ height: 6, borderRadius: 99 }}>
                <div className="progress-bar bg-info" style={{ width: '85.4%' }}></div>
              </div>
              <div className="small text-muted mt-2" style={{ fontSize: '0.72rem' }}>
                273 khách hàng đã ủy quyền trích nợ qua tài khoản thanh toán
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
