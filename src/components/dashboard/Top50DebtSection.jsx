import React, { useState, useMemo } from 'react';
import {
  Award,
  Crown,
  TrendingUp,
  Search,
  FileSpreadsheet,
  Users,
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Info
} from 'lucide-react';
import { formatCurrencyVN, getTodayVN } from '../../utils/dateUtils';

export default function Top50DebtSection({
  top50DuNoDenNgay = [],
  top50DuNoBinhQuanCuoiThang = [],
  totalDuNo = 0,
  onOpenCustomerQuickView
}) {
  const [activeTab, setActiveTab] = useState('as_of'); // 'as_of' | 'average'
  const [searchQuery, setSearchQuery] = useState('');

  // Lọc danh sách theo từ khóa tìm kiếm
  const filteredList = useMemo(() => {
    const list = activeTab === 'as_of' ? top50DuNoDenNgay : top50DuNoBinhQuanCuoiThang;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(item =>
      (item.hoTen && item.hoTen.toLowerCase().includes(q)) ||
      (item.maKH && item.maKH.toLowerCase().includes(q)) ||
      (item.diaChi && item.diaChi.toLowerCase().includes(q)) ||
      (item.xa && item.xa.toLowerCase().includes(q)) ||
      (item.thon && item.thon.toLowerCase().includes(q))
    );
  }, [activeTab, top50DuNoDenNgay, top50DuNoBinhQuanCuoiThang, searchQuery]);

  // Tổng hợp số liệu
  const summary = useMemo(() => {
    const rawList = activeTab === 'as_of' ? top50DuNoDenNgay : top50DuNoBinhQuanCuoiThang;
    const totalDebt = rawList.reduce((acc, cur) => acc + (Number(cur.tongDuNo) || Number(cur.duNoBinhQuan) || 0), 0);
    const concentrationRate = totalDuNo > 0 ? ((totalDebt / totalDuNo) * 100).toFixed(2) : '0.00';
    const top1 = rawList[0] || null;

    return {
      count: rawList.length,
      totalDebt,
      concentrationRate,
      top1
    };
  }, [activeTab, top50DuNoDenNgay, top50DuNoBinhQuanCuoiThang, totalDuNo]);

  // Xuất file CSV
  const handleExportCSV = () => {
    let csvContent = '\uFEFF';
    const isAsOf = activeTab === 'as_of';
    const title = isAsOf
      ? 'BÁO CÁO TOP 50 KHÁCH HÀNG CÓ DƯ NỢ LỚN NHẤT ĐẾN NGÀY'
      : 'BÁO CÁO TOP 50 KHÁCH HÀNG CÓ DƯ NỢ BÌNH QUÂN LỚN NHẤT CÁC NGÀY CUỐI THÁNG';

    csvContent += `${title}\nQUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ\n`;
    csvContent += `Thời điểm xuất: ${getTodayVN()} | Tổng số bản ghi: ${filteredList.length}\n\n`;

    if (isAsOf) {
      csvContent += 'Thứ Hạng,Mã KH,Họ Và Tên,Địa Chỉ,Xã,Thôn,Số HĐ,Tổng Dư Nợ (VNĐ),Tỷ Trọng (%)\n';
      filteredList.forEach(item => {
        csvContent += `${item.rank},"'${item.maKH || ''}","${item.hoTen || ''}","${item.diaChi || ''}","${item.xa || ''}","${item.thon || ''}",${item.soHDCount || 1},${item.tongDuNo || 0},"${item.tyLe || ''}"\n`;
      });
    } else {
      csvContent += 'Thứ Hạng,Mã KH,Họ Và Tên,Địa Chỉ,Xã,Thôn,Số Mốc Có Dư Nợ,Dư Nợ Bình Quân (VNĐ),Dư Nợ Hiện Tại (VNĐ)\n';
      filteredList.forEach(item => {
        csvContent += `${item.rank},"'${item.maKH || ''}","${item.hoTen || ''}","${item.diaChi || ''}","${item.xa || ''}","${item.thon || ''}",${item.soThangCoDuNo || 0},${item.duNoBinhQuan || 0},${item.tongDuNoHienTai || 0}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${isAsOf ? 'Top50_DuNo_DenNgay' : 'Top50_DuNo_BinhQuan_CuoiThang'}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Thanh Tabs chuyển đổi 2 danh sách Top */}
      <div className="card-modern p-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div className="d-flex align-items-center gap-1.5 p-1 bg-light rounded-3 border flex-wrap">
            <button
              type="button"
              className={`btn btn-sm px-3 py-1.5 rounded-2 d-flex align-items-center gap-2 transition-all ${
                activeTab === 'as_of'
                  ? 'btn-primary shadow-sm fw-bold'
                  : 'btn-ghost text-secondary hover-lift'
              }`}
              onClick={() => setActiveTab('as_of')}
            >
              <Crown size={15} />
              <span>Top 50 Dư Nợ Lớn Nhất Đến Ngày</span>
              <span className="badge bg-white text-indigo border ms-1" style={{ fontSize: '0.68rem', color: '#4338ca' }}>HDTD_CORE_DN</span>
              <span className="badge bg-white text-primary ms-1">{top50DuNoDenNgay.length}</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm px-3 py-1.5 rounded-2 d-flex align-items-center gap-2 transition-all ${
                activeTab === 'average'
                  ? 'btn-dark text-white shadow-sm fw-bold'
                  : 'btn-ghost text-secondary hover-lift'
              }`}
              style={activeTab === 'average' ? { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' } : {}}
              onClick={() => setActiveTab('average')}
            >
              <TrendingUp size={15} />
              <span>Top 50 Dư Nợ Bình Quân Cuối Tháng</span>
              <span className="badge bg-white text-primary border ms-1" style={{ fontSize: '0.68rem', color: '#1e3a8a' }}>HDTD_CORE_ALL</span>
              <span className="badge bg-white text-dark ms-1">{top50DuNoBinhQuanCuoiThang.length}</span>
            </button>
          </div>

          <div className="d-flex align-items-center gap-2 w-100 w-md-auto justify-content-end">
            <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
              <span className="input-group-text bg-white text-muted">
                <Search size={13} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Tìm tên, mã KH, địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="btn btn-outline-secondary" onClick={() => setSearchQuery('')}>
                  ×
                </button>
              )}
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-success d-flex align-items-center gap-1.5 px-3 py-1.5"
              onClick={handleExportCSV}
              title="Xuất bảng số liệu sang file Excel (CSV)"
            >
              <FileSpreadsheet size={14} />
              <span className="small fw-semibold">Xuất CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Thẻ KPI Tóm Tắt */}
        <div className="row g-3 mt-1">
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-2.5 rounded-2 bg-light border">
              <span className="small text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                Tổng Dư Nợ Nhóm Top ({summary.count} KH)
              </span>
              <div className="fw-bold fs-6 font-numeric text-primary mt-1">
                {formatCurrencyVN(summary.totalDebt)}
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-2.5 rounded-2 bg-light border">
              <span className="small text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                Tỷ Trọng / Toàn Bộ Dư Nợ Quỹ
              </span>
              <div className="fw-bold fs-6 font-numeric text-danger mt-1">
                {summary.concentrationRate}%
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-2.5 rounded-2 bg-light border">
              <span className="small text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                Khách Hàng Top 1
              </span>
              <div className="fw-bold fs-6 text-truncate mt-1 text-dark" title={summary.top1?.hoTen}>
                {summary.top1 ? summary.top1.hoTen : '—'}
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-2.5 rounded-2 bg-light border">
              <span className="small text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                Dư Nợ Top 1
              </span>
              <div className="fw-bold fs-6 font-numeric text-success mt-1">
                {summary.top1 ? formatCurrencyVN(summary.top1.tongDuNo || summary.top1.duNoBinhQuan) : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng Dữ Liệu Chi Tiết */}
      <div className="card-modern p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-custom table-hover align-middle small mb-0">
            <thead>
              <tr>
                <th className="text-center" style={{ width: '65px' }}>Hạng</th>
                <th style={{ width: '100px' }}>Mã KH</th>
                <th>Họ Và Tên Khách Hàng</th>
                <th>Địa Bàn Cư Trú</th>
                {activeTab === 'as_of' ? (
                  <>
                    <th className="text-center" style={{ width: '80px' }}>Số HĐ</th>
                    <th className="text-end" style={{ width: '150px' }}>Dư Nợ Đến Ngày</th>
                    <th className="text-end" style={{ width: '110px' }}>Tỷ Trọng</th>
                  </>
                ) : (
                  <>
                    <th className="text-center" style={{ width: '100px' }}>Số Mốc Sao Kê</th>
                    <th className="text-end" style={{ width: '150px' }}>Dư Nợ Bình Quân</th>
                    <th className="text-end" style={{ width: '150px' }}>Dư Nợ Hiện Tại</th>
                  </>
                )}
                <th className="text-center" style={{ width: '100px' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <div>Không tìm thấy khách hàng nào phù hợp với điều kiện tìm kiếm.</div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const rank = item.rank || (idx + 1);
                  const isTop1 = rank === 1;
                  const isTop2 = rank === 2;
                  const isTop3 = rank === 3;

                  return (
                    <tr key={item.maKH || idx}>
                      <td className="text-center">
                        {isTop1 && (
                          <span className="badge rounded-circle p-1.5 shadow-sm" style={{ backgroundColor: '#fef08a', color: '#854d0e', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            🥇
                          </span>
                        )}
                        {isTop2 && (
                          <span className="badge rounded-circle p-1.5 shadow-sm" style={{ backgroundColor: '#e2e8f0', color: '#334155', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            🥈
                          </span>
                        )}
                        {isTop3 && (
                          <span className="badge rounded-circle p-1.5 shadow-sm" style={{ backgroundColor: '#fed7aa', color: '#9a3412', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            🥉
                          </span>
                        )}
                        {!isTop1 && !isTop2 && !isTop3 && (
                          <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.75rem', width: '28px' }}>
                            #{rank}
                          </span>
                        )}
                      </td>

                      <td>
                        <span className="font-monospace fw-bold text-dark">
                          {item.maKH}
                        </span>
                      </td>

                      <td>
                        <div className="fw-bold text-dark">{item.hoTen}</div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-1 text-muted">
                          <MapPin size={12} className="text-secondary flex-shrink-0" />
                          <span className="text-truncate" style={{ maxWidth: '240px' }} title={item.diaChi}>
                            {item.diaChi || `${item.thon || ''}, ${item.xa || ''}`}
                          </span>
                        </div>
                      </td>

                      {activeTab === 'as_of' ? (
                        <>
                          <td className="text-center font-numeric fw-semibold">
                            {item.soHDCount || 1}
                          </td>
                          <td className="text-end font-numeric fw-bold text-primary">
                            {formatCurrencyVN(item.tongDuNo)}
                          </td>
                          <td className="text-end font-numeric text-danger fw-semibold">
                            {item.tyLe}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="text-center font-numeric">
                            <span className="badge bg-indigo-subtle text-indigo" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                              {item.soThangCoDuNo} kỳ
                            </span>
                          </td>
                          <td className="text-end font-numeric fw-bold text-indigo" style={{ color: '#4338ca' }}>
                            {formatCurrencyVN(item.duNoBinhQuan)}
                          </td>
                          <td className="text-end font-numeric text-muted">
                            {formatCurrencyVN(item.tongDuNoHienTai)}
                          </td>
                        </>
                      )}

                      <td className="text-center">
                        {onOpenCustomerQuickView && (
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost p-1 text-primary hover-lift"
                            onClick={() => onOpenCustomerQuickView(item.maKH)}
                            title="Xem hồ sơ Khách hàng 360°"
                          >
                            <ExternalLink size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
