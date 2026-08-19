import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Eye,
  Filter,
  Layers,
  Calculator,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Printer
} from 'lucide-react';
import { api } from '../services/api';
import { formatDateVN, formatCurrencyVN } from '../utils/dateUtils';
import Pagination from './Pagination';
import AppraisalFormModal from './modals/AppraisalFormModal';
import AppraisalOpinionModal from './modals/AppraisalOpinionModal';
import AppraisalDetailModal from './modals/AppraisalDetailModal';
import AppraisalPrintPreviewModal from './modals/AppraisalPrintPreviewModal';

export default function Appraisal({ prefilledCustomer, onOpenCustomerQuickView, currentUser }) {
  const [appraisals, setAppraisals] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKetLuan, setFilterKetLuan] = useState('ALL');
  const [filterRuiRo, setFilterRuiRo] = useState('ALL');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedAppraisalForOpinion, setSelectedAppraisalForOpinion] = useState(null);
  const [selectedAppraisalForDetail, setSelectedAppraisalForDetail] = useState(null);
  const [selectedAppraisalForPrint, setSelectedAppraisalForPrint] = useState(null);

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
        alert('Lưu báo cáo thẩm định tín dụng 5 nhóm thành công!');
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
        alert('Đã ghi nhận ý kiến phê duyệt thành công!');
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
    const matchRuiRo = filterRuiRo === 'ALL' || item.mucDoRuiRo === filterRuiRo;
    return matchSearch && matchStatus && matchRuiRo;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Summary Metrics
  const totalApprovedMoney = filtered.reduce((acc, curr) => acc + (Number(curr.duyetVay) || 0), 0);
  const avgLtv = filtered.length > 0
    ? (filtered.reduce((acc, curr) => acc + (Number(curr.tyLeLTV) || 0), 0) / filtered.length).toFixed(1)
    : '0.0';
  const highRiskCount = filtered.filter((i) => i.mucDoRuiRo === 'Cao' || Number(i.tyLeLTV) > 75).length;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Metric Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card-modern p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small">Tổng số hồ sơ thẩm định</span>
                <h4 className="fw-extrabold text-slate-800 m-0 font-heading">{filtered.length}</h4>
              </div>
              <div className="p-2.5 rounded-3 bg-primary-subtle text-primary">
                <Layers size={22} />
              </div>
            </div>
            <div className="small text-muted mt-2">
              Bao gồm 5 nhóm nghiệp vụ thẩm định
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card-modern p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small">Tổng dư nợ đề xuất duyệt</span>
                <h4 className="fw-extrabold text-danger m-0 font-heading num-tabular">
                  {formatCurrencyVN(totalApprovedMoney)}
                </h4>
              </div>
              <div className="p-2.5 rounded-3 bg-danger-subtle text-danger">
                <DollarSign size={22} />
              </div>
            </div>
            <div className="small text-muted mt-2">
              Hạn mức cấp tín dụng đề nghị
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card-modern p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small">Tỷ lệ LTV bình quân</span>
                <h4 className={`fw-extrabold m-0 font-heading ${Number(avgLtv) > 70 ? 'text-warning' : 'text-success'}`}>
                  {avgLtv}%
                </h4>
              </div>
              <div className="p-2.5 rounded-3 bg-success-subtle text-success">
                <ShieldCheck size={22} />
              </div>
            </div>
            <div className="small text-muted mt-2">
              {Number(avgLtv) <= 70 ? 'Trong ngưỡng an toàn (≤70%)' : 'Cần kiểm soát trần TSĐB'}
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card-modern p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small">Hồ sơ cần theo dõi đặc biệt</span>
                <h4 className={`fw-extrabold m-0 font-heading ${highRiskCount > 0 ? 'text-danger' : 'text-success'}`}>
                  {highRiskCount}
                </h4>
              </div>
              <div className="p-2.5 rounded-3 bg-warning-subtle text-warning">
                <ShieldAlert size={22} />
              </div>
            </div>
            <div className="small text-muted mt-2">
              {highRiskCount > 0 ? 'LTV > 75% hoặc rủi ro cao' : 'Không có hồ sơ cảnh báo'}
            </div>
          </div>
        </div>
      </div>

      {/* Header Controls & Filters */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center flex-wrap gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: 185 }}
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

          <select
            className="form-select form-select-sm"
            style={{ width: 155 }}
            value={filterRuiRo}
            onChange={(e) => {
              setFilterRuiRo(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả Mức Rủi Ro</option>
            <option value="Thấp">Rủi ro: Thấp</option>
            <option value="Trung bình">Rủi ro: Trung bình</option>
            <option value="Cao">Rủi ro: Cao</option>
          </select>

          <div className="input-group input-group-sm" style={{ width: 240 }}>
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
                <th className="text-center">Tỷ Lệ DSR</th>
                <th className="text-center">Mức Rủi Ro</th>
                <th className="text-center">Ý Kiến Đánh Giá</th>
                <th className="text-center">Kết Luận</th>
                <th className="text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((item) => {
                  const opinions = item.danhSachYKien || [];
                  const agreeCount = opinions.filter((y) => y.yKien === 'Đồng ý' || y.yKien === 'Đồng ý có điều kiện').length;
                  const ltvNum = Number(item.tyLeLTV) || 0;
                  const dsrNum = Number(item.tyLeDSR) || 0;

                  return (
                    <tr key={item.maBCTD}>
                      <td className="fw-bold font-monospace text-primary">{item.maBCTD}</td>
                      <td>
                        <div
                          className="customer-click-link"
                          onClick={() => onOpenCustomerQuickView && onOpenCustomerQuickView({ maKH: item.maKH, hoTen: item.hoTen })}
                          title="Xem chi tiết khách hàng"
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
                        <span className={`badge ${ltvNum > 75 ? 'bg-danger' : ltvNum > 70 ? 'bg-warning text-dark' : 'bg-success'}`}>
                          {item.tyLeLTV}%
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${dsrNum > 60 ? 'bg-danger' : 'bg-primary-subtle text-primary'}`}>
                          {dsrNum > 0 ? `${dsrNum}%` : '-'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            item.mucDoRuiRo === 'Cao'
                              ? 'bg-danger'
                              : item.mucDoRuiRo === 'Trung bình'
                              ? 'bg-warning text-dark'
                              : 'bg-success-subtle text-success'
                          }`}
                        >
                          {item.mucDoRuiRo || 'Thấp'}
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
                        <div className="d-inline-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-secondary p-1 px-2"
                            onClick={() => setSelectedAppraisalForDetail(item)}
                            title="Xem chi tiết hồ sơ thẩm định"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success p-1 px-2"
                            onClick={() => setSelectedAppraisalForPrint(item)}
                            title="In Báo Cáo hoặc Xuất File Word (.doc)"
                          >
                            <Printer size={13} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary p-1 px-2"
                            onClick={() => setSelectedAppraisalForOpinion(item)}
                            title="Đánh giá & Phê duyệt"
                          >
                            <FileCheck2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11" className="text-center text-muted py-4">
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
        currentUser={currentUser}
      />

      <AppraisalOpinionModal
        appraisal={selectedAppraisalForOpinion}
        onClose={() => setSelectedAppraisalForOpinion(null)}
        onSubmit={handleSaveOpinionSubmit}
        currentUser={currentUser}
      />

      <AppraisalDetailModal
        appraisal={selectedAppraisalForDetail}
        onClose={() => setSelectedAppraisalForDetail(null)}
        currentUser={currentUser}
        onOpenAddOpinion={(item) => {
          setSelectedAppraisalForDetail(null);
          setSelectedAppraisalForOpinion(item);
        }}
        onOpenPrintPreview={(item) => {
          setSelectedAppraisalForDetail(null);
          setSelectedAppraisalForPrint(item);
        }}
      />

      <AppraisalPrintPreviewModal
        appraisal={selectedAppraisalForPrint}
        onClose={() => setSelectedAppraisalForPrint(null)}
      />
    </div>
  );
}
