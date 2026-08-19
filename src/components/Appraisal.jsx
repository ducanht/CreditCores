import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Eye,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { formatDateVN, formatCurrencyVN } from '../utils/dateUtils';
import Pagination from './Pagination';
import AppraisalFormModal from './modals/AppraisalFormModal';
import AppraisalOpinionModal from './modals/AppraisalOpinionModal';

export default function Appraisal({ prefilledCustomer, onOpenCustomerQuickView }) {
  const [appraisals, setAppraisals] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKetLuan, setFilterKetLuan] = useState('ALL');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedAppraisalForOpinion, setSelectedAppraisalForOpinion] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resApp, resCust] = await Promise.all([
        api.getAppraisals(),
        api.searchCustomer360('')
      ]);

      if (resApp.status === 'success' && resApp.data) setAppraisals(resApp.data);
      if (resCust.status === 'success' && resCust.data) {
        setAllCustomers(resCust.data.customers || []);
      }
    } catch (e) {
      console.error('Lỗi nạp dữ liệu thẩm định:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (prefilledCustomer) {
      setShowFormModal(true);
    }
  }, [prefilledCustomer]);

  const handleSaveSubmit = async (formData) => {
    try {
      const res = await api.saveAppraisalReport(formData);
      if (res.status === 'success') {
        alert('Lưu báo cáo thẩm định tín dụng thành công!');
        setShowFormModal(false);
        fetchData();
      } else {
        alert('Lỗi: ' + res.message);
      }
    } catch (err) {
      alert('Lỗi hệ thống: ' + err.message);
    }
  };

  const handleSaveOpinionSubmit = async (maBCTD, opinionData) => {
    try {
      const res = await api.addApprovalOpinion({ maBCTD, opinion: opinionData });
      if (res.status === 'success') {
        alert('Đã ghi nhận ý kiến đánh giá thành công!');
        setSelectedAppraisalForOpinion(null);
        fetchData();
      } else {
        alert('Lỗi: ' + res.message);
      }
    } catch (err) {
      alert('Lỗi hệ thống: ' + err.message);
    }
  };

  // Filtered and Paginated
  const filtered = appraisals.filter((item) => {
    const matchSearch =
      !searchTerm ||
      item.maBCTD?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maKH?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.canBoThamDinh?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = filterKetLuan === 'ALL' || item.ketLuan === filterKetLuan;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Controls */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center flex-wrap gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: 190 }}
            value={filterKetLuan}
            onChange={(e) => {
              setFilterKetLuan(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả Kết Luận</option>
            <option value="Đồng ý cấp tín dụng">Đồng ý cấp tín dụng</option>
            <option value="Có điều kiện bổ sung">Có điều kiện bổ sung</option>
            <option value="Từ chối cấp tín dụng">Từ chối cấp tín dụng</option>
          </select>

          <div className="input-group input-group-sm" style={{ width: 230 }}>
            <span className="input-group-text bg-white border-end-0 text-muted">
              <Search size={14} />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Tìm Mã BCTD, Tên khách..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <button
          className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
          onClick={() => setShowFormModal(true)}
        >
          <Plus size={15} /> Lập Báo Cáo Thẩm Định Mới
        </button>
      </div>

      {/* Appraisal List Table */}
      <div className="card-modern p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold text-slate-800 m-0 font-heading">
            Sổ Hồ Sơ Thẩm Định Tín Dụng & TSĐB ({filtered.length} hồ sơ)
          </h6>
        </div>

        <div className="table-responsive">
          <table className="table table-custom align-middle">
            <thead>
              <tr>
                <th>Mã BCTD</th>
                <th>Khách Hàng Vay Vốn</th>
                <th className="text-end">Duyệt Vay</th>
                <th className="text-center">Thời Hạn</th>
                <th className="text-center">Xếp Hạng CIC</th>
                <th className="text-center">Tỷ Lệ LTV</th>
                <th className="text-center">Ý Kiến Đánh Giá</th>
                <th className="text-center">Kết Luận</th>
                <th className="text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((item) => {
                  const opinions = item.danhSachYKien || [];
                  const agreeCount = opinions.filter((y) => y.yKien === 'Đồng ý').length;

                  return (
                    <tr key={item.maBCTD}>
                      <td className="fw-bold font-monospace text-primary">{item.maBCTD}</td>
                      <td>
                        <div
                          className="customer-click-link"
                          onClick={() => onOpenCustomerQuickView && onOpenCustomerQuickView({ maKH: item.maKH, hoTen: item.hoTen })}
                          title="Xem nhanh thông tin 360° khách hàng"
                        >
                          {item.hoTen || item.maKH}
                        </div>
                        <span className="small text-muted font-monospace">{item.maKH}</span>
                      </td>
                      <td className="text-end fw-bold text-danger num-tabular">{formatCurrencyVN(item.duyetVay)}</td>
                      <td className="text-center">{item.thoiHanThang} tháng</td>
                      <td className="text-center">
                        <span className="badge bg-success-subtle text-success">{item.xepHangCIC}</span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${Number(item.tyLeLTV) > 75 ? 'bg-danger' : 'bg-primary'}`}>
                          {item.tyLeLTV}%
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 py-1 px-2"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setSelectedAppraisalForOpinion(item)}
                          title="Xem hoặc bổ sung ý kiến đánh giá"
                        >
                          <MessageSquare size={12} /> {opinions.length > 0 ? `${agreeCount}/${opinions.length} đồng ý` : 'Chưa có ý kiến'}
                        </button>
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge-status ${
                            item.ketLuan === 'Đồng ý cấp tín dụng'
                              ? 'badge-success-soft'
                              : item.ketLuan === 'Có điều kiện bổ sung'
                              ? 'badge-warning-soft'
                              : 'badge-danger-soft'
                          }`}
                        >
                          {item.ketLuan}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary p-1 px-2"
                          onClick={() => setSelectedAppraisalForOpinion(item)}
                          title="Đánh giá & Phê duyệt"
                        >
                          <FileCheck2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-4">
                    {loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy hồ sơ thẩm định nào phù hợp.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* EXTRACTED MODALS */}
      <AppraisalFormModal
        show={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleSaveSubmit}
        prefilledCustomer={prefilledCustomer}
        allCustomers={allCustomers}
      />

      <AppraisalOpinionModal
        appraisal={selectedAppraisalForOpinion}
        onClose={() => setSelectedAppraisalForOpinion(null)}
        onSubmit={handleSaveOpinionSubmit}
      />
    </div>
  );
}
