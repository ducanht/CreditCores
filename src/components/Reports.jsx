import React from 'react';
import { FileBarChart2, Download, Filter, Landmark, MapPin, PieChart } from 'lucide-react';

export default function Reports() {
  const formatCurrency = (val) => (val || 0).toLocaleString('vi-VN') + ' đ';

  const areaData = [
    { area: 'Xã Yên Thọ (Thôn 1, 2, 3, 4)', countKH: 142, countLoans: 156, duNo: 22500000000, rate: '46.4%' },
    { area: 'Xã Yên Trường (Thôn 1, 2, 3)', countKH: 110, countLoans: 118, duNo: 16800000000, rate: '34.6%' },
    { area: 'Xã Yên Bái (Thôn 5, 6, 7)', countKH: 68, countLoans: 68, duNo: 9200000000, rate: '19.0%' }
  ];

  const loanTypes = [
    { type: 'Nông nghiệp & Chăn nuôi', count: 184, amount: 26000000000, color: 'bg-success' },
    { type: 'Thương mại & Dịch vụ', count: 98, amount: 14500000000, color: 'bg-primary' },
    { type: 'Tiêu dùng & Đời sống', count: 60, amount: 8000000000, color: 'bg-warning' }
  ];

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="fw-bold m-0 text-slate-800 d-flex align-items-center gap-2">
            <FileBarChart2 size={20} className="text-primary" /> Báo Cáo Thống Kê & Phân Tích Quản Trị Tín Dụng
          </h5>
          <span className="text-muted small">Số liệu cập nhật theo thời gian thực từ CSDL</span>
        </div>

        <button
          className="btn btn-outline-success fw-semibold d-flex align-items-center gap-2"
          onClick={() => alert('Đang kết xuất Báo cáo Quản trị Tín dụng định dạng Excel...')}
        >
          <Download size={16} /> Xuất Báo Cáo Excel
        </button>
      </div>

      {/* Grid: 2 Report Cards */}
      <div className="row g-3">
        {/* Report 1: By Area */}
        <div className="col-lg-6">
          <div className="card-modern p-4 h-100">
            <h6 className="fw-bold mb-3 text-slate-800 d-flex align-items-center gap-2">
              <MapPin size={18} className="text-primary" /> Phân Bổ Dư Nợ Theo Địa Bàn Quản Lý (3 Xã)
            </h6>

            <div className="table-responsive">
              <table className="table table-custom align-middle">
                <thead>
                  <tr>
                    <th>Địa Bàn / Xã</th>
                    <th className="text-center">Số Khách Hàng</th>
                    <th className="text-end">Dư Nợ (VNĐ)</th>
                    <th className="text-end">Tỷ Trọng</th>
                  </tr>
                </thead>
                <tbody>
                  {areaData.map((a, idx) => (
                    <tr key={idx}>
                      <td className="fw-semibold text-dark">{a.area}</td>
                      <td className="text-center">{a.countKH} KH</td>
                      <td className="text-end fw-bold text-primary">{formatCurrency(a.duNo)}</td>
                      <td className="text-end fw-bold">{a.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Report 2: By Loan Product */}
        <div className="col-lg-6">
          <div className="card-modern p-4 h-100">
            <h6 className="fw-bold mb-3 text-slate-800 d-flex align-items-center gap-2">
              <PieChart size={18} className="text-primary" /> Cơ Cấu Sản Phẩm Cho Vay
            </h6>

            <div className="d-flex flex-column gap-3 mt-3">
              {loanTypes.map((t, idx) => (
                <div key={idx} className="p-3 bg-light rounded-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold text-dark">{t.type}</span>
                    <span className="fw-bold text-primary">{formatCurrency(t.amount)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center text-muted small">
                    <span>{t.count} món vay</span>
                    <span>{((t.amount / 48500000000) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="progress mt-2" style={{ height: 6 }}>
                    <div
                      className={`progress-bar ${t.color}`}
                      style={{ width: `${(t.amount / 48500000000) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
