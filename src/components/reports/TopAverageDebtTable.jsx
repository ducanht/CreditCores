import React, { useMemo } from 'react';
import {
  TrendingUp,
  Award,
  Crown,
  ShieldAlert,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  Users,
  MapPin,
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { formatCurrencyVN, getTodayVN } from '../../utils/dateUtils';

export default function TopAverageDebtTable({ topAvgDebtData = [], totalDuNo = 0, loading = false }) {
  // Tính tổng số liệu Top
  const stats = useMemo(() => {
    const list = topAvgDebtData || [];
    const totalTopDuNo = list.reduce((acc, curr) => acc + (Number(curr.tongDuNo) || Number(curr.duNoBinhQuan) || 0), 0);
    const totalTopTienVay = list.reduce((acc, curr) => acc + (Number(curr.tongTienVay) || 0), 0);
    const top1 = list[0] || null;
    const concentrationRate = totalDuNo > 0 ? ((totalTopDuNo / totalDuNo) * 100).toFixed(2) : '0.00';
    const avgDebt = list.length > 0 ? Math.round(totalTopDuNo / list.length) : 0;

    return {
      count: list.length,
      totalTopDuNo,
      totalTopTienVay,
      top1,
      concentrationRate,
      avgDebt
    };
  }, [topAvgDebtData, totalDuNo]);

  // Xuất file CSV
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'BÁO CÁO XẾP HẠNG TOP KHÁCH HÀNG DƯ NỢ BÌNH QUÂN CAO NHẤT (TOP_DU_NO_BINH_QUAN)\n';
    csvContent += 'QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ\n';
    csvContent += `Thời điểm xuất: ${getTodayVN()} | Tổng dư nợ toàn Quỹ: ${totalDuNo} VNĐ\n\n`;

    csvContent += 'Thứ Hạng,Mã KH,Số TV,Họ và Tên Khách Hàng,Địa Bàn,Số Món Vay,Tổng Vốn Vay (VNĐ),Dư Nợ Hiện Hành (VNĐ),Tỷ Trọng Quỹ (%),Đánh Giá Rủi Ro\n';

    topAvgDebtData.forEach((item, idx) => {
      const rank = item.xepHang || (idx + 1);
      const rate = Number(item.tyTrongDuNo) || 0;
      let assessment = 'An toàn';
      if (rate >= 5) assessment = 'Giám sát chặt chẽ';
      else if (rate >= 3) assessment = 'Cần lưu ý theo dõi';

      csvContent += `${rank},"'${item.maKH || ''}","'${item.soTV || ''}","${item.hoTen || ''}","${item.khuVuc || ''}",${item.soMonVay || 1},${item.tongTienVay || 0},${item.tongDuNo || item.duNoBinhQuan || 0},"${rate.toFixed(2)}%","${assessment}"\n`;
    });

    csvContent += `\nTỔNG TOP ${stats.count},,,,"${stats.count} Thành viên",,${stats.totalTopTienVay},${stats.totalTopDuNo},"${stats.concentrationRate}%",\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Top_DuNo_BinhQuan_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* 1. Thẻ Tóm Tắt & Chỉ Số Tập Trung Tín Dụng */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="p-3 rounded-3" style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-subtle)' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="small text-muted fw-medium text-uppercase" style={{ fontSize: '0.72rem' }}>
                  Tổng Dư Nợ Top {stats.count}
                </span>
                <h4 className="fw-bold m-0 mt-1 num-tabular font-heading text-primary">
                  {formatCurrencyVN(stats.totalTopDuNo)}
                </h4>
              </div>
              <div className="p-2 rounded-2 bg-primary-subtle text-primary">
                <Crown size={18} />
              </div>
            </div>
            <div className="small text-muted mt-2 pt-2 border-top" style={{ fontSize: '0.73rem' }}>
              Chiếm tỷ trọng lớn nhất danh mục
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="p-3 rounded-3" style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-subtle)' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="small text-muted fw-medium text-uppercase" style={{ fontSize: '0.72rem' }}>
                  Tỷ Trọng / Dư Nợ Toàn Quỹ
                </span>
                <h4 className="fw-bold m-0 mt-1 num-tabular font-heading text-danger">
                  {stats.concentrationRate}%
                </h4>
              </div>
              <div className="p-2 rounded-2 bg-danger-subtle text-danger">
                <ShieldAlert size={18} />
              </div>
            </div>
            <div className="small text-muted mt-2 pt-2 border-top" style={{ fontSize: '0.73rem' }}>
              Ngưỡng an toàn tập trung TT 39/2016
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="p-3 rounded-3" style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-subtle)' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="small text-muted fw-medium text-uppercase" style={{ fontSize: '0.72rem' }}>
                  Thành Viên Dư Nợ Lớn Nhất
                </span>
                <h5 className="fw-bold m-0 mt-1 text-truncate font-heading" style={{ maxWidth: '170px' }}>
                  {stats.top1 ? stats.top1.hoTen : '—'}
                </h5>
                <div className="small fw-semibold text-success num-tabular">
                  {stats.top1 ? formatCurrencyVN(stats.top1.tongDuNo || stats.top1.duNoBinhQuan) : '—'}
                </div>
              </div>
              <div className="p-2 rounded-2" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#d97706' }}>
                <Award size={18} />
              </div>
            </div>
            <div className="small text-muted mt-2 pt-2 border-top" style={{ fontSize: '0.73rem' }}>
              {stats.top1 ? `${stats.top1.khuVuc || 'Địa bàn'} - ${stats.top1.soMonVay || 1} món vay` : 'Chưa có số liệu'}
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="p-3 rounded-3" style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-subtle)' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="small text-muted fw-medium text-uppercase" style={{ fontSize: '0.72rem' }}>
                  Dư Nợ Bình Quân / Thành Viên Top
                </span>
                <h4 className="fw-bold m-0 mt-1 num-tabular font-heading text-info">
                  {formatCurrencyVN(stats.avgDebt)}
                </h4>
              </div>
              <div className="p-2 rounded-2 bg-info-subtle text-info">
                <Users size={18} />
              </div>
            </div>
            <div className="small text-muted mt-2 pt-2 border-top" style={{ fontSize: '0.73rem' }}>
              Quy mô cấp tín dụng nhóm cao
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bảng Danh Sách Xếp Hạng */}
      <div className="card-modern p-0 overflow-hidden">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom" style={{ background: 'var(--bg-surface)' }}>
          <div className="d-flex align-items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <h6 className="fw-bold m-0 font-heading">
              Bảng Xếp Hạng Top {stats.count} Khách Hàng Dư Nợ Bình Quân Toàn Quỹ
            </h6>
          </div>
          <button
            className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
            onClick={handleExportCSV}
            title="Xuất bảng xếp hạng sang Excel (CSV)"
          >
            <FileSpreadsheet size={14} /> Xuất Báo Cáo CSV
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-custom table-hover align-middle small mb-0">
            <thead>
              <tr>
                <th className="text-center" style={{ width: '60px' }}>Hạng</th>
                <th style={{ width: '100px' }}>Mã KH / TV</th>
                <th>Họ Và Tên Thành Viên</th>
                <th>Địa Bàn Cư Trú</th>
                <th className="text-center" style={{ width: '80px' }}>Số Món</th>
                <th className="text-end" style={{ width: '140px' }}>Tổng Tiền Vay</th>
                <th className="text-end" style={{ width: '150px' }}>Dư Nợ Hiện Hành</th>
                <th style={{ width: '170px' }}>Tỷ Trọng Quỹ</th>
                <th className="text-center" style={{ width: '130px' }}>Đánh Giá Rủi Ro</th>
              </tr>
            </thead>
            <tbody>
              {topAvgDebtData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    <div className="empty-state-icon mx-auto mb-2"><TrendingUp size={28} /></div>
                    <span>Chưa có dữ liệu Top Dư Nợ</span>
                  </td>
                </tr>
              ) : (
                topAvgDebtData.map((item, idx) => {
                  const rank = item.xepHang || (idx + 1);
                  const debt = Number(item.tongDuNo) || Number(item.duNoBinhQuan) || 0;
                  const rate = Number(item.tyTrongDuNo) || 0;

                  // Đánh giá mức độ tập trung
                  let riskBadge = { label: 'An toàn', class: 'badge-success-soft', icon: ShieldCheck };
                  if (rate >= 5) {
                    riskBadge = { label: 'Giám sát chặt', class: 'badge-danger-soft', icon: ShieldAlert };
                  } else if (rate >= 3) {
                    riskBadge = { label: 'Cần theo dõi', class: 'badge-warning-soft', icon: Info };
                  }
                  const RiskIcon = riskBadge.icon;

                  return (
                    <tr key={item.maKH || idx}>
                      <td className="text-center">
                        {rank === 1 && (
                          <span className="badge rounded-circle p-2" style={{ background: '#fef08a', color: '#854d0e', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Top 1">
                            🥇
                          </span>
                        )}
                        {rank === 2 && (
                          <span className="badge rounded-circle p-2" style={{ background: '#e2e8f0', color: '#334155', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Top 2">
                            🥈
                          </span>
                        )}
                        {rank === 3 && (
                          <span className="badge rounded-circle p-2" style={{ background: '#fed7aa', color: '#9a3412', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Top 3">
                            🥉
                          </span>
                        )}
                        {rank > 3 && (
                          <span className="badge bg-secondary-subtle text-secondary font-monospace" style={{ fontSize: '0.75rem', width: '26px' }}>
                            #{rank}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="font-monospace fw-semibold">{item.maKH}</span>
                          {item.soTV && <span className="badge badge-brand-soft font-monospace" style={{ fontSize: '0.65rem' }}>TV: {item.soTV}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold">{item.hoTen}</div>
                        {item.diaChi && <div className="text-muted text-truncate" style={{ maxWidth: '200px', fontSize: '0.72rem' }}>{item.diaChi}</div>}
                      </td>
                      <td>
                        <span className="text-truncate d-inline-block" style={{ maxWidth: '140px' }} title={item.khuVuc}>
                          {item.khuVuc || 'Xã Yên Thọ'}
                        </span>
                      </td>
                      <td className="text-center num-tabular font-monospace">
                        {item.soMonVay || 1}
                      </td>
                      <td className="text-end num-tabular fw-medium">
                        {formatCurrencyVN(item.tongTienVay)}
                      </td>
                      <td className="text-end num-tabular fw-bold text-danger">
                        {formatCurrencyVN(debt)}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: '6px', backgroundColor: 'var(--bg-surface-soft)' }}>
                            <div
                              className="progress-bar bg-danger"
                              style={{ width: `${Math.min(rate * 10, 100)}%` }}
                              title={`Tỷ trọng: ${rate.toFixed(2)}%`}
                            />
                          </div>
                          <span className="font-monospace fw-semibold small" style={{ width: '45px', textAlign: 'right', fontSize: '0.75rem' }}>
                            {rate.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${riskBadge.class} d-inline-flex align-items-center gap-1`} style={{ fontSize: '0.7rem' }}>
                          <RiskIcon size={12} /> {riskBadge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {topAvgDebtData.length > 0 && (
              <tfoot className="fw-bold" style={{ background: 'var(--bg-surface-soft)' }}>
                <tr>
                  <td colSpan={4} className="text-center text-uppercase">
                    TỔNG CỘNG TOP {stats.count} KHÁCH HÀNG
                  </td>
                  <td className="text-center num-tabular">
                    {topAvgDebtData.reduce((acc, curr) => acc + (Number(curr.soMonVay) || 1), 0)}
                  </td>
                  <td className="text-end num-tabular text-success">
                    {formatCurrencyVN(stats.totalTopTienVay)}
                  </td>
                  <td className="text-end num-tabular text-danger">
                    {formatCurrencyVN(stats.totalTopDuNo)}
                  </td>
                  <td colSpan={2} className="text-start">
                    <span className="badge badge-brand-soft font-monospace">
                      Chiếm {stats.concentrationRate}% toàn Quỹ
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
