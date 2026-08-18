import React, { useState, useEffect } from 'react';
import { FileBarChart2, Download, MapPin, PieChart, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { formatCurrencyVN } from '../utils/dateUtils';

export default function Reports() {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const areaData = reportsData?.areaData || [];
  const loanTypes = reportsData?.loanTypes || [];
  const totalDuNo = reportsData?.totalDuNo || 0;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="fw-bold m-0 text-slate-800 d-flex align-items-center gap-2">
            <FileBarChart2 size={20} className="text-primary" /> Báo Cáo Thống Kê & Phân Tích Quản Trị Tín Dụng
          </h5>
          <span className="text-muted small">Số liệu cập nhật tự động thời gian thực từ CSDL Google Sheets</span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={fetchReports}
            disabled={loading}
            title="Tải lại số liệu báo cáo"
          >
            <RefreshCw size={14} className={loading ? 'fa-spin' : ''} /> Làm mới
          </button>
          <button
            className="btn btn-sm btn-brand fw-bold d-flex align-items-center gap-2"
            onClick={() => alert('Đang kết xuất Báo cáo Quản trị Tín dụng định dạng Excel...')}
          >
            <Download size={16} /> Xuất Báo Cáo Excel
          </button>
        </div>
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
                  {areaData.length > 0 ? (
                    areaData.map((a, idx) => (
                      <tr key={idx}>
                        <td className="fw-semibold text-dark">{a.area}</td>
                        <td className="text-center num-tabular">{a.countKH}</td>
                        <td className="text-end fw-bold text-primary num-tabular">{formatCurrencyVN(a.duNo)}</td>
                        <td className="text-end fw-bold text-success num-tabular">{a.rate}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        {loading ? 'Đang tổng hợp số liệu...' : 'Chưa có dữ liệu địa bàn.'}
                      </td>
                    </tr>
                  )}
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
                  {loanTypes.length > 0 ? (
                    loanTypes.map((lt, idx) => (
                      <tr key={idx}>
                        <td className="fw-semibold text-dark d-flex align-items-center gap-2">
                          <span className={`badge p-1 rounded-circle ${lt.color || 'bg-primary'}`}> </span>
                          {lt.type}
                        </td>
                        <td className="text-center num-tabular">{lt.count}</td>
                        <td className="text-end fw-bold text-success num-tabular">{formatCurrencyVN(lt.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-4">
                        {loading ? 'Đang tổng hợp cơ cấu sản phẩm...' : 'Chưa có dữ liệu sản phẩm.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
