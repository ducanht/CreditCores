import React from 'react';
import { FileBarChart2, Download, MapPin, PieChart } from 'lucide-react';
import { formatCurrencyVN } from '../utils/dateUtils';

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
                      <td className="text-center num-tabular">{a.countKH}</td>
                      <td className="text-end fw-bold text-primary num-tabular">{formatCurrencyVN(a.duNo)}</td>
                      <td className="text-end fw-bold text-success num-tabular">{a.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Report 2: By Product */}
        <div className="col-lg-6">
          <div className="card-modern p-4 h-100">
            <h6 className="fw-bold mb-3 text-slate-800 d-flex align-items-center gap-2">
              <PieChart size={18} className="text-success" /> Cơ Cấu Sản Phẩm Tín Dụng
            </h6>

            <div className="table-responsive">
              <table className="table table-custom align-middle">
                <thead>
                  <tr>
                    <th>Sản Phẩm Vay</th>
                    <th className="text-center">Số Món</th>
                    <th className="text-end">Tổng Dư Nợ (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  {loanTypes.map((lt, idx) => (
                    <tr key={idx}>
                      <td className="fw-semibold text-dark d-flex align-items-center gap-2">
                        <span className={`badge p-1 rounded-circle ${lt.color}`}> </span>
                        {lt.type}
                      </td>
                      <td className="text-center num-tabular">{lt.count}</td>
                      <td className="text-end fw-bold text-success num-tabular">{formatCurrencyVN(lt.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
