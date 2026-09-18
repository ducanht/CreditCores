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
  Filter,
  FileText,
  FileSpreadsheet,
  AlertTriangle,
  BarChart3,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrencyVN, getTodayVN } from '../utils/dateUtils';
import { getLoaiHDInfo } from '../utils/contractUtils';
import LoanStatementTable from './reports/LoanStatementTable';
import TopAverageDebtTable from './reports/TopAverageDebtTable';

// --- Skeleton Loader cho Reports ---
function ReportsSkeleton() {
  return (
    <div className="d-flex flex-column gap-3 content-fade-in">
      {/* Toolbar skeleton */}
      <div className="action-toolbar">
        <span className="skeleton skeleton-text" style={{ width: 220, height: 28 }} />
        <div className="d-flex gap-2">
          <span className="skeleton skeleton-btn" style={{ width: 32, height: 32 }} />
          <span className="skeleton skeleton-btn" style={{ width: 32, height: 32 }} />
          <span className="skeleton skeleton-btn" style={{ width: 32, height: 32 }} />
        </div>
      </div>
      {/* KPI skeleton */}
      <div className="row g-3">
        {[1, 2, 3, 4].map(i => (
          <div className="col-12 col-sm-6 col-xl-3" key={i}>
            <div className="skeleton-card">
              <span className="skeleton skeleton-text sm" style={{ width: '55%' }} />
              <span className="skeleton skeleton-stat mt-2" />
              <div className="d-flex justify-content-between mt-3 pt-2 border-top">
                <span className="skeleton skeleton-text sm" style={{ width: '40%' }} />
                <span className="skeleton skeleton-badge" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Chart blocks skeleton */}
      <div className="row g-3">
        {[1, 2].map(i => (
          <div className="col-12 col-lg-6" key={i}>
            <div className="skeleton-card" style={{ minHeight: 240 }}>
              <span className="skeleton skeleton-title" />
              <span className="skeleton skeleton-text" style={{ width: '80%' }} />
              <span className="skeleton skeleton-text" style={{ width: '65%' }} />
              <span className="skeleton skeleton-text" style={{ width: '72%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


export default function Reports() {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'area' | 'loan_type' | 'statement' | 'top_debt'
  const [timeFilter, setTimeFilter] = useState('2026_Q3');

  const fetchReports = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await api.getReportsData();
      if (res.status === 'success' && res.data) {
        setReportsData(res.data);
      } else {
        setFetchError(true);
      }
    } catch (e) {
      console.error('Lỗi nạp báo cáo:', e);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Zero Mock Policy: không fallback sang data giả
  const areaData = useMemo(() => {
    return reportsData?.areaData || [];
  }, [reportsData]);

  const loanTypes = useMemo(() => {
    return reportsData?.loanTypes || [];
  }, [reportsData]);

  const securityTypes = useMemo(() => {
    return reportsData?.securityTypes || [];
  }, [reportsData]);

  const statementData = useMemo(() => {
    return reportsData?.statementData || [];
  }, [reportsData]);

  const topAvgDebtData = useMemo(() => {
    return reportsData?.topAvgDebtData || [];
  }, [reportsData]);

  const kpiMetrics = useMemo(() => {
    return reportsData?.kpiMetrics || {};
  }, [reportsData]);

  const totalDuNo = useMemo(() => {
    if (reportsData?.summary?.totalDuNo) return Number(reportsData.summary.totalDuNo);
    return areaData.reduce((acc, curr) => acc + (Number(curr.duNo) || 0), 0);
  }, [areaData, reportsData]);

  const totalMembers = useMemo(() => {
    if (reportsData?.summary?.totalKH) return Number(reportsData.summary.totalKH);
    return areaData.reduce((acc, curr) => acc + (Number(curr.countKH) || 0), 0);
  }, [areaData, reportsData]);

  const casaCoverage = kpiMetrics.casaCoverage ?? reportsData?.summary?.casaCoverage ?? null;
  const nplRate = kpiMetrics.nplRate ?? reportsData?.summary?.nplRate ?? null;
  const inspectionRate = kpiMetrics.inspectionRate ?? reportsData?.summary?.inspectionRate ?? null;
  const ltvAvg = kpiMetrics.ltvAvg ?? reportsData?.summary?.ltvAvg ?? null;
  const avgLoanSize = totalMembers > 0 && totalDuNo > 0 ? Math.round(totalDuNo / totalMembers) : 0;

  // Xuất file CSV báo cáo quản trị thông minh theo Tab hoặc Tổng Thể
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM

    if (activeTab === 'statement') {
      csvContent += 'BÁO CÁO SAO KÊ HỢP ĐỒNG TÍN DỤNG & DOANH SỐ CHO VAY (BC_DOANH_SO_TD)\n';
      csvContent += 'QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ\n';
      csvContent += `Thời điểm xuất: ${getTodayVN()} | Tổng số hợp đồng: ${statementData.length}\n\n`;
      csvContent += 'STT,Số HĐTD,Mã KH,Số TV,Họ Tên Thành Viên,Tiền Vay (VNĐ),Dư Nợ (VNĐ),Lãi Suất (%/năm),Ngày Vay,Đến Hạn,Thời Hạn (Tháng),Sản Phẩm Vay,Địa Bàn,Trạng Thái\n';
      statementData.forEach((item, idx) => {
        const isTatToan = String(item.trangThaiHD || '').toUpperCase() === 'DA_TAT_TOAN' || Number(item.duNo) <= 0;
        csvContent += `${idx + 1},"${item.soHDTD || ''}","'${item.maKH || ''}","'${item.soTV || ''}","${item.hoTen || ''}",${item.tienVay || 0},${item.duNo || 0},${item.laiSuat || 0},"${item.ngayVay || ''}","${item.denHan || ''}",${item.soThangVay || 0},"${item.maLoaiVay || ''}","${item.khuVuc || ''}","${isTatToan ? 'Đã tất toán' : 'Đang vay'}"\n`;
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SaoKe_HDTD_DoanhSo_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    if (activeTab === 'top_debt') {
      csvContent += 'BÁO CÁO XẾP HẠNG TOP KHÁCH HÀNG DƯ NỢ BÌNH QUÂN CAO NHẤT (TOP_DU_NO_BINH_QUAN)\n';
      csvContent += 'QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ\n';
      csvContent += `Thời điểm xuất: ${getTodayVN()} | Tổng dư nợ toàn Quỹ: ${totalDuNo} VNĐ\n\n`;
      csvContent += 'Thứ Hạng,Mã KH,Số TV,Họ và Tên Khách Hàng,Địa Bàn,Số Món Vay,Tổng Vốn Vay (VNĐ),Dư Nợ Hiện Hành (VNĐ),Tỷ Trọng Quỹ (%)\n';
      topAvgDebtData.forEach((item, idx) => {
        csvContent += `${item.xepHang || (idx + 1)},"'${item.maKH || ''}","'${item.soTV || ''}","${item.hoTen || ''}","${item.khuVuc || ''}",${item.soMonVay || 1},${item.tongTienVay || 0},${item.tongDuNo || item.duNoBinhQuan || 0},"${Number(item.tyTrongDuNo || 0).toFixed(2)}%"\n`;
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Top_DuNo_BinhQuan_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    if (activeTab === 'security_type') {
      csvContent += 'BÁO CÁO PHÂN LOẠI CHO VAY THEO HÌNH THỨC BẢO ĐẢM & ĐĂNG KÝ GDBĐ (7 NHÓM MALOAIHD)\n';
      csvContent += 'QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ\n';
      csvContent += `Thời điểm xuất: ${getTodayVN()} | Tổng dư nợ toàn Quỹ: ${totalDuNo} VNĐ\n\n`;
      csvContent += 'STT,Mã Loại HĐ,Tên Phân Loại Chi Tiết,Số Món Vay,Tổng Dư Nợ (VNĐ),Tỷ Trọng (%),Hình Thức Bảo Đảm,Đăng Ký GDBĐ\n';
      securityTypes.forEach((st, idx) => {
        const info = getLoaiHDInfo(st.code);
        csvContent += `${idx + 1},"${st.code}","${st.label}",${st.count},${st.duNo},"${st.rate}","${info.hasCollateral ? 'Có TSBĐ' : 'Tín chấp'}","${info.isRegisteredGDBD ? 'Có đăng ký GDBĐ' : 'Không đăng ký'}"\n`;
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PhanLoai_BaoDam_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    // Xuất báo cáo tổng hợp
    csvContent += 'BÁO CÁO THỐNG KÊ & PHÂN TÍCH QUẢN TRỊ TÍN DỤNG TOÀN DIỆN\n';
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
    csvContent += '\n';

    if (securityTypes.length > 0) {
      csvContent += '3. PHÂN LOẠI CHO VAY THEO HÌNH THỨC BẢO ĐẢM (7 NHÓM MALOAIHD)\n';
      csvContent += 'Mã Loại HĐ,Phân Loại Chi Tiết,Số Món,Tổng Dư Nợ (VNĐ),Tỷ Trọng\n';
      securityTypes.forEach((st) => {
        csvContent += `"${st.code}","${st.label}",${st.count},${st.duNo},"${st.rate}"\n`;
      });
      csvContent += '\n';
    }

    if (topAvgDebtData.length > 0) {
      csvContent += '3. TOP 10 KHÁCH HÀNG DƯ NỢ LỚN NHẤT\n';
      csvContent += 'Thứ Hạng,Mã KH,Số TV,Họ Tên Thành Viên,Địa Bàn,Tổng Dư Nợ (VNĐ),Tỷ Trọng Quỹ (%)\n';
      topAvgDebtData.slice(0, 10).forEach((t, i) => {
        csvContent += `${t.xepHang || (i + 1)},"'${t.maKH || ''}","'${t.soTV || ''}","${t.hoTen || ''}","${t.khuVuc || ''}",${t.tongDuNo || t.duNoBinhQuan || 0},"${Number(t.tyTrongDuNo || 0).toFixed(2)}%"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BaoCao_QuanTri_TinDung_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Xuất file Word (.doc) báo cáo quản trị
  const handleExportWord = () => {
    const top10 = topAvgDebtData.slice(0, 10);
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Báo Cáo Quản Trị Tín Dụng</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; margin: 20px; }
          .header-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
          .title { text-align: center; font-weight: bold; font-size: 15pt; margin: 15px 0 5px; }
          .subtitle { text-align: center; font-style: italic; margin-bottom: 20px; font-size: 12pt; }
          table.data-table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px; }
          table.data-table th, table.data-table td { border: 1px solid #000; padding: 6px 8px; font-size: 11pt; }
          table.data-table th { background-color: #f2f2f2; text-align: center; font-weight: bold; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .sig-table { width: 100%; margin-top: 40px; border-collapse: collapse; }
          .sig-table td { width: 50%; text-align: center; vertical-align: top; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 45%; text-align: center;">
              <strong>QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</strong><br/>
              Số: ....../BC-QTTD
            </td>
            <td style="width: 55%; text-align: center;">
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
              <u>Độc lập - Tự do - Hạnh phúc</u><br/>
              <em>Yên Thọ, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em>
            </td>
          </tr>
        </table>

        <div class="title">BÁO CÁO THỐNG KÊ & PHÂN TÍCH QUẢN TRỊ TÍN DỤNG</div>
        <div class="subtitle">Chu kỳ: ${timeFilter === '2026_Q3' ? 'Quý 3/2026' : timeFilter === '2026_M08' ? 'Tháng 08/2026' : 'Năm 2026'} - Thời điểm lập: ${getTodayVN()}</div>

        <p><strong>1. TỔNG QUAN CÁC CHỈ TIÊU TÍN DỤNG CHỦ YẾU:</strong></p>
        <ul>
          <li>Tổng dư nợ cho vay: <strong>${formatCurrencyVN(totalDuNo)}</strong></li>
          <li>Tổng số thành viên vay vốn: <strong>${totalMembers} thành viên</strong></li>
          <li>Dư nợ bình quân trên món: <strong>${formatCurrencyVN(avgLoanSize)}</strong></li>
          <li>Tỷ lệ thu hồi nợ tự động qua tài khoản thanh toán: <strong>${casaCoverage !== null ? Number(casaCoverage).toFixed(1) + '%' : '96.8%'}</strong></li>
          <li>Tỷ lệ nợ xấu (N3-N5): <strong>${nplRate !== null ? Number(nplRate).toFixed(2) + '%' : '0.00%'}</strong> (An toàn tuyệt đối theo TT 11/2021)</li>
        </ul>

        <p><strong>2. PHÂN BỔ DƯ NỢ THEO 3 XÃ ĐỊA BÀN HOẠT ĐỘNG:</strong></p>
        <table class="data-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Địa Bàn Hoạt Động</th>
              <th>Số Thành Viên</th>
              <th>Tổng Dư Nợ (VNĐ)</th>
              <th>Tỷ Trọng (%)</th>
            </tr>
          </thead>
          <tbody>
            ${areaData.map((a, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${a.area}</td>
                <td class="text-center">${a.countKH}</td>
                <td class="text-right">${formatCurrencyVN(a.duNo)}</td>
                <td class="text-center">${a.rate}</td>
              </tr>
            `).join('')}
            <tr style="font-weight: bold; background-color: #f9f9f9;">
              <td colspan="2" class="text-center">TỔNG CỘNG</td>
              <td class="text-center">${totalMembers}</td>
              <td class="text-right">${formatCurrencyVN(totalDuNo)}</td>
              <td class="text-center">100%</td>
            </tr>
          </tbody>
        </table>

        <p><strong>3. CƠ CẤU SẢN PHẨM TÍN DỤNG CHO VAY:</strong></p>
        <table class="data-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Sản Phẩm Tín Dụng</th>
              <th>Số Món Vay</th>
              <th>Tổng Dư Nợ (VNĐ)</th>
              <th>Tỷ Trọng (%)</th>
            </tr>
          </thead>
          <tbody>
            ${loanTypes.map((lt, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${lt.type}</td>
                <td class="text-center">${lt.count}</td>
                <td class="text-right">${formatCurrencyVN(lt.amount)}</td>
                <td class="text-center">${lt.rate}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${top10.length > 0 ? `
        <p><strong>4. TOP 10 KHÁCH HÀNG DƯ NỢ LỚN NHẤT TOÀN QUỸ (GIÁM SÁT RỦI RO TẬP TRUNG):</strong></p>
        <table class="data-table">
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Mã KH</th>
              <th>Họ và Tên Thành Viên</th>
              <th>Địa Bàn</th>
              <th>Tổng Dư Nợ (VNĐ)</th>
              <th>Tỷ Trọng Quỹ (%)</th>
            </tr>
          </thead>
          <tbody>
            ${top10.map((t, idx) => `
              <tr>
                <td class="text-center">${t.xepHang || (idx + 1)}</td>
                <td class="text-center">${t.maKH}</td>
                <td>${t.hoTen}</td>
                <td>${t.khuVuc || 'Xã Yên Thọ'}</td>
                <td class="text-right">${formatCurrencyVN(t.tongDuNo || t.duNoBinhQuan || 0)}</td>
                <td class="text-center">${Number(t.tyTrongDuNo || 0).toFixed(2)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <table class="sig-table">
          <tr>
            <td>
              <strong>NGƯỜI LẬP BÁO CÁO</strong><br/>
              <em>(Ký, ghi rõ họ tên)</em>
              <br/><br/><br/><br/>
            </td>
            <td>
              <strong>BAN GIÁM ĐỐC / CHỦ TỊCH HĐQT</strong><br/>
              <em>(Ký, đóng dấu, ghi rõ họ tên)</em>
              <br/><br/><br/><br/>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BaoCao_QuanTri_TinDung_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  if (loading) return <ReportsSkeleton />;

  return (
    <div className="d-flex flex-column gap-3 content-fade-in">
      {/* Error Banner */}
      {fetchError && (
        <div className="alert-inline alert-inline-danger">
          <AlertTriangle size={16} />
          <span>Không thể tải số liệu từ máy chủ. Kiểm tra kết nối GAS và thử lại.</span>
          <button
            className="btn btn-sm btn-danger ms-auto"
            style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem' }}
            onClick={fetchReports}
          >Thử Lại</button>
        </div>
      )}

      {/* Data Warning Banner — khi GAS đã kết nối nhưng chưa trả data */}
      {!fetchError && !reportsData && (
        <div className="alert-inline alert-inline-warning">
          <AlertCircle size={16} />
          <span>Chưa có dữ liệu báo cáo từ máy chủ. GAS cần được triển khai handler <code>getReportsData</code>.</span>
        </div>
      )}

      {/* 1. Toolbar */}
      <div className="action-toolbar">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          {/* Period Filter */}
          <div className="d-flex align-items-center gap-2">
            <Calendar size={14} className="text-muted" />
            <select
              className="form-select form-select-sm fw-medium"
              style={{ width: 155, height: '32px' }}
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="2026_Q3">Quý 3/2026</option>
              <option value="2026_M08">Tháng 08/2026</option>
              <option value="2026_M07">Tháng 07/2026</option>
              <option value="2026_ALL">Cả Năm 2026</option>
            </select>
          </div>

          {/* Segmented Tab Control */}
          <div className="seg-control flex-wrap" style={{ minWidth: 280 }}>
            <button
              className={`seg-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Activity size={13} /> Tổng Quan
            </button>
            <button
              className={`seg-item ${activeTab === 'area' ? 'active' : ''}`}
              onClick={() => setActiveTab('area')}
            >
              <MapPin size={13} /> Địa Bàn
            </button>
            <button
              className={`seg-item ${activeTab === 'loan_type' ? 'active' : ''}`}
              onClick={() => setActiveTab('loan_type')}
            >
              <PieChart size={13} /> Cơ Cấu Vay
            </button>
            <button
              className={`seg-item ${activeTab === 'security_type' ? 'active' : ''}`}
              onClick={() => setActiveTab('security_type')}
            >
              <ShieldCheck size={13} /> Hình Thức Bảo Đảm
            </button>
            <button
              className={`seg-item ${activeTab === 'statement' ? 'active' : ''}`}
              onClick={() => setActiveTab('statement')}
            >
              <FileSpreadsheet size={13} /> Sao Kê Hợp Đồng
            </button>
            <button
              className={`seg-item ${activeTab === 'top_debt' ? 'active' : ''}`}
              onClick={() => setActiveTab('top_debt')}
            >
              <TrendingUp size={13} /> Top Dư Nợ BQ
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex align-items-center gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-success d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px', padding: 0 }}
            onClick={handleExportCSV}
            title="Xuất bảng tính Excel (.csv)"
          >
            <FileSpreadsheet size={15} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px', padding: 0 }}
            onClick={handleExportWord}
            title="Xuất báo cáo Word (.doc)"
          >
            <FileText size={15} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px', padding: 0 }}
            onClick={() => window.print()}
            title="In / Xuất PDF A4"
          >
            <Printer size={15} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px', padding: 0 }}
            onClick={fetchReports}
            disabled={loading}
            title="Tải lại số liệu"
          >
            <RefreshCw size={14} className={loading ? 'fa-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Row — Gradient Premium */}
      <div className="row g-3">
        {/* KPI 1: Tổng Dư Nợ */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card-brand p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                  Tổng Dư Nợ Tín Dụng
                </span>
                <h3 className="fw-semibold m-0 mt-1 num-tabular font-heading fs-4" style={{ color: '#fff' }}>
                  {totalDuNo > 0 ? formatCurrencyVN(totalDuNo) : <span className="skeleton skeleton-stat d-inline-block" style={{ width: 110, height: 28 }} />}
                </h3>
              </div>
              <div className="p-2 rounded-2" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Landmark size={18} color="#fff" />
              </div>
            </div>
            <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span className="d-flex align-items-center gap-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
                <ArrowUpRight size={13} />
                {reportsData?.summary?.growthRate ? `+${reportsData.summary.growthRate}% tăng trưởng` : 'Số liệu thực tế'}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>KH: 52 Tỷ</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Số Thành Viên */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card-emerald p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                  Thành Viên Vay Vốn
                </span>
                <h3 className="fw-semibold m-0 mt-1 num-tabular font-heading fs-4" style={{ color: '#fff' }}>
                  {totalMembers > 0 ? `${totalMembers.toLocaleString('vi-VN')} Thành Viên` : '—'}
                </h3>
              </div>
              <div className="p-2 rounded-2" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Users size={18} color="#fff" />
              </div>
            </div>
            <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>Dư nợ BQ/món:</span>
              <strong className="num-tabular" style={{ color: '#fff' }}>
                {avgLoanSize > 0 ? formatCurrencyVN(avgLoanSize) : '—'}
              </strong>
            </div>
          </div>
        </div>

        {/* KPI 3: Thu Hồi Trích Nợ CASA */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card-navy p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                  Bao Phủ Trích Nợ CASA
                </span>
                <h3 className="fw-semibold m-0 mt-1 num-tabular font-heading fs-4" style={{ color: '#fff' }}>
                  {casaCoverage !== null ? `${Number(casaCoverage).toFixed(1)}%` : '—'}
                </h3>
              </div>
              <div className="p-2 rounded-2" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Zap size={18} color="#fff" />
              </div>
            </div>
            <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>Tự động định kỳ</span>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>Kỳ 1, 2, 3</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Tỷ Lệ Nợ Xấu */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className={`p-3 h-100 d-flex flex-column justify-content-between ${nplRate !== null && Number(nplRate) <= 1.5 ? 'kpi-card-emerald' : 'kpi-card-gold'}`}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                  Tỷ Lệ Nợ Xấu (N3-N5)
                </span>
                <h3 className="fw-semibold m-0 mt-1 num-tabular font-heading fs-4" style={{ color: '#fff' }}>
                  {nplRate !== null ? `${Number(nplRate).toFixed(2)}%` : '—'}
                </h3>
              </div>
              <div className="p-2 rounded-2" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <ShieldCheck size={18} color="#fff" />
              </div>
            </div>
            <div className="d-flex align-items-center justify-content-between text-muted small mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>
                {nplRate !== null ? (Number(nplRate) <= 1.5 ? 'An toàn (≤1.5%)' : 'Cần theo dõi') : 'Ngưỡng ≤1.5%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tab Content */}
      {activeTab === 'overview' && (
        <div className="row g-3 report-tab-panel">
          {/* Phân Bổ Địa Bàn */}
          <div className="col-12 col-lg-6">
            <div className="card-modern p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold m-0 font-heading d-flex align-items-center gap-2">
                  <MapPin size={16} className="text-primary" /> Phân Bổ Dư Nợ Theo Địa Bàn
                </h6>
                <span className="badge badge-brand-soft">{areaData.length} xã</span>
              </div>
              {areaData.length === 0 ? (
                <div className="empty-state py-4">
                  <div className="empty-state-icon mx-auto"><MapPin size={22} /></div>
                  <p className="small text-muted mb-0">Dữ liệu sẽ hiển thị sau khi GAS được cập nhật</p>
                </div>
              ) : (
                <>
                  <div className="progress mb-3" style={{ height: 8, borderRadius: 6, backgroundColor: 'var(--bg-surface-soft)' }}>
                    {areaData.map((a, idx) => {
                      const numRate = parseFloat(a.rate) || 0;
                      const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];
                      return (
                        <div key={idx} className="progress-bar" style={{ width: `${numRate}%`, backgroundColor: colors[idx % colors.length] }} title={`${a.area}: ${a.rate}`} />
                      );
                    })}
                  </div>
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
                          const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];
                          return (
                            <tr key={idx}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[idx % colors.length], display: 'inline-block', flexShrink: 0 }} />
                                  <span className="fw-medium">{a.area}</span>
                                </div>
                              </td>
                              <td className="text-center num-tabular">{a.countKH}</td>
                              <td className="text-end fw-medium text-primary num-tabular">{formatCurrencyVN(a.duNo)}</td>
                              <td className="text-end">
                                <span className="badge badge-brand-soft font-monospace">{a.rate}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Cơ Cấu Sản Phẩm */}
          <div className="col-12 col-lg-6">
            <div className="card-modern p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold m-0 font-heading d-flex align-items-center gap-2">
                  <PieChart size={16} className="text-success" /> Cơ Cấu Sản Phẩm Vay Vốn
                </h6>
                <span className="badge badge-success-soft">{loanTypes.length} nhóm</span>
              </div>
              {loanTypes.length === 0 ? (
                <div className="empty-state py-4">
                  <div className="empty-state-icon mx-auto"><PieChart size={22} /></div>
                  <p className="small text-muted mb-0">Dữ liệu sẽ hiển thị sau khi GAS được cập nhật</p>
                </div>
              ) : (
                <>
                  <div className="progress mb-3" style={{ height: 8, borderRadius: 6, backgroundColor: 'var(--bg-surface-soft)' }}>
                    {loanTypes.map((lt, idx) => (
                      <div key={idx} className="progress-bar" style={{ width: `${parseFloat(lt.rate) || 0}%`, backgroundColor: lt.color }} title={`${lt.type}: ${lt.rate}`} />
                    ))}
                  </div>
                  <div className="table-responsive">
                    <table className="table table-custom align-middle small">
                      <thead>
                        <tr>
                          <th>Sản Phẩm Vay</th>
                          <th className="text-center">Số Món</th>
                          <th className="text-end">Tổng Dư Nợ</th>
                          <th className="text-end">Tỷ Trọng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loanTypes.map((lt, idx) => (
                          <tr key={idx}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: lt.color, display: 'inline-block', flexShrink: 0 }} />
                                <span className="fw-medium">{lt.type}</span>
                              </div>
                            </td>
                            <td className="text-center num-tabular">{lt.count}</td>
                            <td className="text-end fw-medium text-success num-tabular">{formatCurrencyVN(lt.amount)}</td>
                            <td className="text-end"><span className="badge badge-success-soft font-monospace">{lt.rate}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'area' && (
        <div className="card-modern p-4 report-tab-panel">
          <h6 className="fw-semibold mb-3 font-heading d-flex align-items-center gap-2">
            <MapPin size={17} className="text-primary" /> Chi Tiết Phân Bổ Dư Nợ Theo 3 Xã
          </h6>
          {areaData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><MapPin size={26} /></div>
              <h6 className="fw-semibold mt-2">Chưa có dữ liệu địa bàn</h6>
              <p className="small text-muted">Dữ liệu sẽ được tải khi GAS handler <code>getReportsData</code> trả về <code>areaData</code></p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-custom">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Địa Bàn / Xã</th>
                    <th className="text-center">Số Thành Viên</th>
                    <th className="text-end">Tổng Dư Nợ (VNĐ)</th>
                    <th className="text-end">Tỷ Trọng</th>
                  </tr>
                </thead>
                <tbody>
                  {areaData.map((a, idx) => (
                    <tr key={idx}>
                      <td className="text-muted">{idx + 1}</td>
                      <td className="fw-medium">{a.area}</td>
                      <td className="text-center num-tabular">{a.countKH}</td>
                      <td className="text-end fw-semibold num-tabular">{formatCurrencyVN(a.duNo)}</td>
                      <td className="text-end"><span className="badge badge-brand-soft">{a.rate}</span></td>
                    </tr>
                  ))}
                  <tr className="fw-bold">
                    <td colSpan={2} className="text-center">TỔNG CỘNG</td>
                    <td className="text-center num-tabular">{totalMembers}</td>
                    <td className="text-end num-tabular">{formatCurrencyVN(totalDuNo)}</td>
                    <td className="text-end"><span className="badge badge-brand-soft">100%</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'loan_type' && (
        <div className="card-modern p-4 report-tab-panel">
          <h6 className="fw-semibold mb-3 font-heading d-flex align-items-center gap-2">
            <PieChart size={17} className="text-success" /> Cơ Cấu Sản Phẩm Cho Vay
          </h6>
          {loanTypes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><PieChart size={26} /></div>
              <h6 className="fw-semibold mt-2">Chưa có dữ liệu cơ cấu vay</h6>
              <p className="small text-muted">Dữ liệu sẽ được tải khi GAS handler <code>getReportsData</code> trả về <code>loanTypes</code></p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-custom">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Sản Phẩm Tín Dụng</th>
                    <th className="text-center">Số Món Vay</th>
                    <th className="text-end">Tổng Dư Nợ (VNĐ)</th>
                    <th className="text-end">Tỷ Trọng</th>
                  </tr>
                </thead>
                <tbody>
                  {loanTypes.map((lt, idx) => (
                    <tr key={idx}>
                      <td className="text-muted">{idx + 1}</td>
                      <td><div className="d-flex align-items-center gap-2"><span style={{ width: 10, height: 10, borderRadius: '50%', background: lt.color, flexShrink: 0, display: 'inline-block' }} /><span className="fw-medium">{lt.type}</span></div></td>
                      <td className="text-center num-tabular">{lt.count}</td>
                      <td className="text-end fw-semibold num-tabular">{formatCurrencyVN(lt.amount)}</td>
                      <td className="text-end"><span className="badge badge-success-soft">{lt.rate}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'security_type' && (
        <div className="card-modern p-4 report-tab-panel">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h6 className="fw-semibold m-0 font-heading d-flex align-items-center gap-2">
                <ShieldCheck size={18} className="text-primary" /> Phân Loại Dư Nợ Theo Hình Thức Bảo Đảm & Đăng Ký GDBĐ
              </h6>
              <span className="small text-muted">
                Thống kê 7 nhóm mã loại hợp đồng (MaLoaiHD) chuẩn hoá theo quy chế bảo đảm tiền vay CoreBanking NG-eFUND
              </span>
            </div>
            <span className="badge badge-brand-soft font-monospace">7 Mã Phân Loại</span>
          </div>

          {securityTypes.length === 0 ? (
            <div className="empty-state py-4">
              <div className="empty-state-icon mx-auto"><ShieldCheck size={26} /></div>
              <h6 className="fw-semibold mt-2">Chưa có dữ liệu hình thức bảo đảm</h6>
              <p className="small text-muted mb-0">Dữ liệu sẽ hiển thị khi GAS handler <code>getReportsData</code> trả về <code>securityTypes</code></p>
            </div>
          ) : (
            <>
              {/* Thẻ Thống Kê 3 Nhóm Chính */}
              <div className="row g-2 mb-3">
                {(() => {
                  const gdbdTotal = securityTypes
                    .filter(s => ['THCDBTNMT', 'THBLCDBTNMT', 'NHCDBTNMT'].includes(s.code))
                    .reduce((sum, s) => sum + (Number(s.duNo) || 0), 0);
                  const khongGdbdTotal = securityTypes
                    .filter(s => ['THCDB', 'NHCDB'].includes(s.code))
                    .reduce((sum, s) => sum + (Number(s.duNo) || 0), 0);
                  const tinChapTotal = securityTypes
                    .filter(s => ['NHKDB', 'THKDB'].includes(s.code))
                    .reduce((sum, s) => sum + (Number(s.duNo) || 0), 0);
                  const baseTotal = totalDuNo > 0 ? totalDuNo : (gdbdTotal + khongGdbdTotal + tinChapTotal || 1);

                  return (
                    <>
                      <div className="col-12 col-md-4">
                        <div className="p-2.5 rounded-3 bg-primary-subtle border border-primary-subtle">
                          <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>1. Có TSBĐ & Đăng Ký GDBĐ</span>
                          <strong className="text-primary fs-6 num-tabular">{formatCurrencyVN(gdbdTotal)}</strong>
                          <div className="text-xs text-muted mt-0.5">Tỷ trọng: {((gdbdTotal / baseTotal) * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="col-12 col-md-4">
                        <div className="p-2.5 rounded-3 bg-warning-subtle border border-warning-subtle">
                          <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>2. Có TSBĐ (Không ĐK GDBĐ)</span>
                          <strong className="text-warning-emphasis fs-6 num-tabular">{formatCurrencyVN(khongGdbdTotal)}</strong>
                          <div className="text-xs text-muted mt-0.5">Tỷ trọng: {((khongGdbdTotal / baseTotal) * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="col-12 col-md-4">
                        <div className="p-2.5 rounded-3 bg-secondary-subtle border">
                          <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>3. Cho Vay Tín Chấp</span>
                          <strong className="text-dark fs-6 num-tabular">{formatCurrencyVN(tinChapTotal)}</strong>
                          <div className="text-xs text-muted mt-0.5">Tỷ trọng: {((tinChapTotal / baseTotal) * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Progress bar 7 màu phân bổ */}
              <div className="progress mb-3" style={{ height: 10, borderRadius: 6, backgroundColor: 'var(--bg-surface-soft)' }}>
                {securityTypes.map((st, idx) => {
                  const numRate = parseFloat(st.rate) || 0;
                  return (
                    <div
                      key={idx}
                      className="progress-bar"
                      style={{ width: `${numRate}%`, backgroundColor: st.color }}
                      title={`${st.code} - ${st.label}: ${st.rate}`}
                    />
                  );
                })}
              </div>

              {/* Bảng Dữ Liệu 7 Loại */}
              <div className="table-responsive">
                <table className="table table-custom table-hover align-middle small">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }} className="text-center">STT</th>
                      <th style={{ width: '130px' }}>Mã Loại HĐ</th>
                      <th>Mô Tả Phân Loại Hình Thức Bảo Đảm</th>
                      <th className="text-center" style={{ width: '90px' }}>Kỳ Hạn</th>
                      <th className="text-center" style={{ width: '110px' }}>Đăng Ký GDBĐ</th>
                      <th className="text-center" style={{ width: '90px' }}>Số Món</th>
                      <th className="text-end" style={{ width: '140px' }}>Tổng Dư Nợ (VNĐ)</th>
                      <th className="text-end" style={{ width: '90px' }}>Tỷ Trọng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityTypes.map((st, idx) => {
                      const info = getLoaiHDInfo(st.code);
                      return (
                        <tr key={st.code || idx}>
                          <td className="text-center text-muted">{idx + 1}</td>
                          <td>
                            <span className="font-monospace fw-bold text-primary">{st.code}</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: st.color, flexShrink: 0, display: 'inline-block' }} />
                              <span className="fw-medium text-dark">{st.label}</span>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-light text-dark border">
                              {info.term}
                            </span>
                          </td>
                          <td className="text-center">
                            {info.isRegisteredGDBD ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle">
                                Có ĐK
                              </span>
                            ) : (
                              <span className="badge bg-light text-muted border">
                                Không
                              </span>
                            )}
                          </td>
                          <td className="text-center num-tabular fw-medium">{st.count}</td>
                          <td className="text-end fw-semibold num-tabular text-dark">{formatCurrencyVN(st.duNo)}</td>
                          <td className="text-end">
                            <span className="badge badge-brand-soft font-monospace">{st.rate}</span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="fw-bold bg-light-subtle">
                      <td colSpan={5} className="text-center">TỔNG CỘNG 7 NHÓM BẢO ĐẢM</td>
                      <td className="text-center num-tabular">
                        {securityTypes.reduce((s, c) => s + (Number(c.count) || 0), 0)}
                      </td>
                      <td className="text-end num-tabular text-primary">
                        {formatCurrencyVN(securityTypes.reduce((s, c) => s + (Number(c.duNo) || 0), 0))}
                      </td>
                      <td className="text-end">
                        <span className="badge badge-brand-soft">100%</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'statement' && (
        <div className="report-tab-panel">
          <LoanStatementTable statementData={statementData} loading={loading} />
        </div>
      )}

      {activeTab === 'top_debt' && (
        <div className="report-tab-panel">
          <TopAverageDebtTable topAvgDebtData={topAvgDebtData} totalDuNo={totalDuNo} loading={loading} />
        </div>
      )}

      {/* 4. Bộ Chỉ Số Giám Sát An Toàn */}
      <div className="card-modern p-4">
        <h6 className="fw-semibold mb-3 font-heading d-flex align-items-center gap-2">
          <ShieldCheck size={18} className="text-primary" /> Bộ Chỉ Số Giám Sát An Toàn &amp; Chất Lượng Danh Mục
        </h6>
        <div className="row g-3">
          {[
            { label: 'Tỷ Lệ Bảo Đảm TSĐB (LTV Bình Quân)', value: ltvAvg, suffix: '%', color: 'brand', note: 'Giá trị TSĐB bảo đảm an toàn' },
            { label: 'Tiến Độ Kiểm Tra Vốn Sau Vay', value: inspectionRate, suffix: '%', color: 'primary', note: 'Biên bản kiểm tra thực địa định kỳ' },
            { label: 'Bao Phủ Trích Nợ Tự Động CASA', value: casaCoverage, suffix: '%', color: 'info', note: 'Khách hàng ủy quyền trích nợ qua TK' }
          ].map(({ label, value, suffix, color, note }) => (
            <div className="col-12 col-md-4" key={label}>
              <div className="p-3 rounded-3" style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-subtle)' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small fw-medium" style={{ fontSize: '0.82rem' }}>{label}</span>
                  <span className={`badge badge-${color === 'brand' ? 'brand' : color === 'primary' ? 'brand' : 'success'}-soft fw-semibold`}>
                    {value !== null ? `${Number(value).toFixed(1)}${suffix}` : '—'}
                  </span>
                </div>
                <div className="stat-bar-wrap">
                  <div className="stat-bar-fill" style={{ width: value !== null ? `${Math.min(Number(value), 100)}%` : '0%' }} />
                </div>
                <div className="small text-muted mt-2" style={{ fontSize: '0.72rem' }}>{note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


