import React, { useMemo } from 'react';
import { ShieldCheck, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { formatCurrencyVN } from '../../utils/dateUtils';

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

const calcPercentNum = (part, total) => {
  const p = Number(part) || 0;
  const t = Number(total) || 0;
  if (t <= 0) return 0;
  return Number(((p / t) * 100).toFixed(1));
};

export default function SecurityTypeBreakdown({ securityTypes = [], totalDuNo = 0 }) {
  // Chuẩn hóa và gom nhóm 3 cấp độ bảo đảm
  const groupedData = useMemo(() => {
    let securedGdbdDuNo = 0;
    let securedGdbdCount = 0;

    let securedOtherDuNo = 0;
    let securedOtherCount = 0;

    let unsecuredDuNo = 0;
    let unsecuredCount = 0;

    const items = securityTypes.map(item => {
      const code = item.code || '';
      const count = Number(item.count) || 0;
      const duNo = Number(item.duNo) || 0;
      const rate = totalDuNo > 0 ? calcPercentNum(duNo, totalDuNo) : 0;

      let groupCategory = 'other';
      if (code.includes('TNMT') || code.includes('GDBD')) {
        groupCategory = 'gdbd';
        securedGdbdDuNo += duNo;
        securedGdbdCount += count;
      } else if (code.includes('CDB')) {
        groupCategory = 'other';
        securedOtherDuNo += duNo;
        securedOtherCount += count;
      } else {
        groupCategory = 'unsecured';
        unsecuredDuNo += duNo;
        unsecuredCount += count;
      }

      return {
        ...item,
        count,
        duNo,
        rate,
        groupCategory
      };
    });

    return {
      items,
      gdbd: { duNo: securedGdbdDuNo, count: securedGdbdCount, rate: calcPercentNum(securedGdbdDuNo, totalDuNo) },
      other: { duNo: securedOtherDuNo, count: securedOtherCount, rate: calcPercentNum(securedOtherDuNo, totalDuNo) },
      unsecured: { duNo: unsecuredDuNo, count: unsecuredCount, rate: calcPercentNum(unsecuredDuNo, totalDuNo) }
    };
  }, [securityTypes, totalDuNo]);

  return (
    <div className="card-modern p-4">
      {/* Tiêu đề phần cơ cấu bảo đảm */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="p-2 rounded bg-success-subtle text-success">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h5 className="fw-bold m-0 text-slate-900 font-heading">
              Cơ Cấu Hình Thức Bảo Đảm Tiền Vay
            </h5>
            <span className="text-muted small">Phân loại theo hợp đồng thế chấp tài sản và đăng ký giao dịch bảo đảm</span>
          </div>
        </div>
        <span className="badge bg-light text-dark border small fw-semibold">
          7 Hình thức bảo đảm
        </span>
      </div>

      {/* 3 Thẻ tóm tắt nhóm bảo đảm */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-4">
          <div className="p-2.5 rounded bg-light border border-primary-subtle">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-muted fw-medium">Đăng Ký GDBĐ (BĐS)</span>
              <span className="badge bg-primary text-white font-monospace">{groupedData.gdbd.rate}%</span>
            </div>
            <div className="fw-bold text-primary fs-6 num-tabular">
              {formatCompactVN(groupedData.gdbd.duNo)}
            </div>
            <div className="text-muted small mt-0.5" style={{ fontSize: '0.72rem' }}>
              {groupedData.gdbd.count} hợp đồng thế chấp
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="p-2.5 rounded bg-light border border-warning-subtle">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-muted fw-medium">Có TSBĐ Khác</span>
              <span className="badge bg-warning-subtle text-warning-emphasis font-monospace">{groupedData.other.rate}%</span>
            </div>
            <div className="fw-bold text-dark fs-6 num-tabular">
              {formatCompactVN(groupedData.other.duNo)}
            </div>
            <div className="text-muted small mt-0.5" style={{ fontSize: '0.72rem' }}>
              {groupedData.other.count} hợp đồng cầm cố/bảo lãnh
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="p-2.5 rounded bg-light border border-secondary-subtle">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-muted fw-medium">Tín Chấp / Không TSBĐ</span>
              <span className="badge bg-secondary-subtle text-secondary font-monospace">{groupedData.unsecured.rate}%</span>
            </div>
            <div className="fw-bold text-secondary fs-6 num-tabular">
              {formatCompactVN(groupedData.unsecured.duNo)}
            </div>
            <div className="text-muted small mt-0.5" style={{ fontSize: '0.72rem' }}>
              {groupedData.unsecured.count} hợp đồng tín chấp
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar phân bổ tỷ trọng 3 nhóm */}
      <div className="progress mb-3" style={{ height: '8px' }}>
        <div
          className="progress-bar bg-primary"
          style={{ width: `${groupedData.gdbd.rate}%` }}
          title={`Đăng ký GDBĐ: ${groupedData.gdbd.rate}%`}
        ></div>
        <div
          className="progress-bar bg-warning"
          style={{ width: `${groupedData.other.rate}%` }}
          title={`Có TSBĐ khác: ${groupedData.other.rate}%`}
        ></div>
        <div
          className="progress-bar bg-secondary"
          style={{ width: `${groupedData.unsecured.rate}%` }}
          title={`Tín chấp: ${groupedData.unsecured.rate}%`}
        ></div>
      </div>

      {/* Bảng chi tiết từng mã loại hợp đồng */}
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
          <thead className="table-light text-secondary text-uppercase" style={{ fontSize: '0.72rem' }}>
            <tr>
              <th style={{ width: '15%' }}>Mã Loại</th>
              <th style={{ width: '45%' }}>Hình Thức Bảo Đảm</th>
              <th className="text-center" style={{ width: '12%' }}>Số Món</th>
              <th className="text-end" style={{ width: '16%' }}>Dư Nợ (VNĐ)</th>
              <th className="text-end" style={{ width: '12%' }}>Tỷ Trọng</th>
            </tr>
          </thead>
          <tbody>
            {groupedData.items && groupedData.items.length > 0 ? (
              groupedData.items.map((item) => (
                <tr key={item.code}>
                  <td className="font-monospace fw-bold text-primary">{item.code}</td>
                  <td className="text-dark">{item.label}</td>
                  <td className="text-center num-tabular">{item.count}</td>
                  <td className="text-end fw-semibold num-tabular text-dark">
                    {formatCurrencyVN(item.duNo)}
                  </td>
                  <td className="text-end num-tabular font-monospace fw-bold text-secondary">
                    {item.rate}%
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-3 text-muted">
                  Đang nạp dữ liệu phân loại tài sản bảo đảm...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
