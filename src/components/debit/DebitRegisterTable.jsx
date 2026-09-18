import React from 'react';
import {
  Search,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Filter,
  Printer
} from 'lucide-react';
import { formatDateVN } from '../../utils/dateUtils';
import Pagination from '../Pagination';
import { StatusBadge, EmptyState } from '../shared';

export default function DebitRegisterTable({
  registrations = [],
  filteredRegs = [],
  paginatedRegs = [],
  searchTerm,
  setSearchTerm,
  filterKyTrich,
  setFilterKyTrich,
  filterTrangThai,
  setFilterTrangThai,
  regPage,
  setRegPage,
  regPageSize,
  setRegPageSize,
  actionLoading,
  loading,
  onOpenCustomerQuickView,
  onEditRegistration,
  onToggleStatus,
  onDeleteRegistration,
  onPrintRegistration
}) {
  const activeCount = registrations.filter(
    (r) => r.trangThai === 'Hiệu lực' || r.trangThai === 'Hieu luc'
  ).length;
  const pausedCount = registrations.filter(
    (r) => r.trangThai === 'Tạm ngưng' || r.trangThai === 'Tam ngung'
  ).length;

  return (
    <div className="card-modern p-4 content-fade-in">
      {/* 1. KHỐI THỐNG KÊ KPI NHANH */}
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3">
          <div className="p-3 bg-light rounded-3 border h-100">
            <div className="text-muted small fw-medium">Tổng Thỏa Thuận</div>
            <div className="fs-4 fw-bold text-slate-800">{registrations.length}</div>
            <div className="text-xs text-muted mt-1">Ủy quyền trích CASA</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="p-3 bg-success-subtle rounded-3 border border-success-subtle h-100">
            <div className="text-success small fw-medium">Đang Hiệu Lực</div>
            <div className="fs-4 fw-bold text-success">{activeCount}</div>
            <div className="text-xs text-success mt-1">Sẵn sàng trích nợ</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="p-3 bg-warning-subtle rounded-3 border border-warning-subtle h-100">
            <div className="text-warning-emphasis small fw-medium">Tạm Ngưng</div>
            <div className="fs-4 fw-bold text-warning-emphasis">{pausedCount}</div>
            <div className="text-xs text-muted mt-1">Đang tạm hoãn trích</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="p-3 bg-primary-subtle rounded-3 border border-primary-subtle h-100">
            <div className="text-primary small fw-medium">Phân Bổ Theo Kỳ</div>
            <div className="d-flex gap-1.5 align-items-center mt-1 font-monospace fw-bold flex-wrap">
              <span className="badge bg-primary">K1 (05): {registrations.filter((r) => Number(r.kyTrich) === 1).length}</span>
              <span className="badge bg-info text-dark">K2 (15): {registrations.filter((r) => Number(r.kyTrich) === 2).length}</span>
              <span className="badge bg-secondary">K3 (25): {registrations.filter((r) => Number(r.kyTrich) === 3).length}</span>
            </div>
            <div className="text-xs text-muted mt-1">3 kỳ trích nợ định kỳ</div>
          </div>
        </div>
      </div>

      {/* 2. THANH CÔNG CỤ BỘ LỌC & TÌM KIẾM */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h6 className="fw-bold text-slate-800 m-0 font-heading">
          Danh Sách Khách Hàng Ủy Quyền Trích Nợ Tự Động ({filteredRegs.length})
        </h6>

        <div className="d-flex align-items-center flex-wrap gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: 140 }}
            value={filterKyTrich}
            onChange={(e) => {
              setFilterKyTrich(e.target.value);
              setRegPage(1);
            }}
          >
            <option value="ALL">Tất cả Kỳ</option>
            <option value="1">Kỳ 1 (Ngày 05)</option>
            <option value="2">Kỳ 2 (Ngày 15)</option>
            <option value="3">Kỳ 3 (Ngày 25)</option>
          </select>

          <select
            className="form-select form-select-sm"
            style={{ width: 150 }}
            value={filterTrangThai}
            onChange={(e) => {
              setFilterTrangThai(e.target.value);
              setRegPage(1);
            }}
          >
            <option value="ALL">Tất cả Trạng thái</option>
            <option value="Hiệu lực">Hiệu lực</option>
            <option value="Tạm ngưng">Tạm ngưng</option>
          </select>

          <div className="input-group input-group-sm" style={{ width: 220 }}>
            <span className="input-group-text bg-white border-end-0 text-muted">
              <Search size={14} />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Tìm Tên, Mã KH, Số TK..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setRegPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. BẢNG DỮ LIỆU ĐĂNG KÝ */}
      <div className="table-responsive">
        <table className="table table-custom align-middle">
          <thead>
            <tr>
              <th>Mã Khách Hàng</th>
              <th>Họ Và Tên</th>
              <th>Số CCCD</th>
              <th>Số TK CASA</th>
              <th>Địa Chỉ</th>
              <th className="text-center">Kỳ Trích</th>
              <th>Ngày Đăng Ký</th>
              <th className="text-center">Trạng Thái</th>
              <th className="text-center" style={{ width: 110 }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRegs.length > 0 ? (
              paginatedRegs.map((r, idx) => (
                <tr key={idx}>
                  <td>
                    <div
                      className="customer-click-link font-monospace fw-bold"
                      onClick={() => onOpenCustomerQuickView && onOpenCustomerQuickView(r)}
                      title="Xem chi tiết khách hàng"
                    >
                      {r.maKH}
                    </div>
                  </td>
                  <td className="fw-semibold text-slate-900">{r.hoTen}</td>
                  <td className="font-monospace text-muted">{r.gttt}</td>
                  <td className="font-monospace fw-semibold text-success">{r.soTK}</td>
                  <td className="small text-muted">{r.diaChi}</td>
                  <td className="text-center">
                    <span className="badge bg-primary-subtle text-primary fw-bold">Kỳ {r.kyTrich}</span>
                  </td>
                  <td className="small text-muted">{r.ngayTao ? formatDateVN(r.ngayTao) : '---'}</td>
                  <td className="text-center">
                    <StatusBadge status={r.trangThai} />
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center align-items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-info py-1 px-1.5"
                        title="In văn bản thỏa thuận ủy quyền trích nợ (A4/Word)"
                        onClick={() => onPrintRegistration && onPrintRegistration(r)}
                      >
                        <Printer size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary py-1 px-1.5"
                        title="Chỉnh sửa thỏa thuận"
                        onClick={() => onEditRegistration(r)}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm py-1 px-1.5 ${
                          r.trangThai === 'Hiệu lực' || r.trangThai === 'Hieu luc'
                            ? 'btn-outline-warning'
                            : 'btn-outline-success'
                        }`}
                        title={
                          r.trangThai === 'Hiệu lực' || r.trangThai === 'Hieu luc'
                            ? 'Tạm ngưng trích nợ'
                            : 'Kích hoạt lại'
                        }
                        disabled={actionLoading}
                        onClick={() => onToggleStatus(r)}
                      >
                        {r.trangThai === 'Hiệu lực' || r.trangThai === 'Hieu luc' ? (
                          <ToggleRight size={13} />
                        ) : (
                          <ToggleLeft size={13} />
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger py-1 px-1.5"
                        title="Xóa thỏa thuận"
                        disabled={actionLoading}
                        onClick={() => onDeleteRegistration(r)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  <EmptyState
                    title="Không tìm thấy thỏa thuận trích nợ"
                    description={
                      loading
                        ? 'Đang tải dữ liệu thỏa thuận trích nợ...'
                        : 'Không có bản ghi thỏa thuận nào phù hợp với điều kiện tìm kiếm hoặc lọc.'
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={regPage}
        totalItems={filteredRegs.length}
        pageSize={regPageSize}
        onPageChange={setRegPage}
        onPageSizeChange={setRegPageSize}
      />
    </div>
  );
}
