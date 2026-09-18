import React from 'react';
import { Eye } from 'lucide-react';
import { formatCurrencyVN } from '../../utils/dateUtils';
import Pagination from '../Pagination';
import { StatusBadge, EmptyState } from '../shared';

export default function DebitBatchTable({
  batches = [],
  paginatedBatches = [],
  batchPage,
  setBatchPage,
  batchPageSize,
  setBatchPageSize,
  loading,
  onSelectBatchDetail,
  onOpenCreateBatch
}) {
  return (
    <div className="card-modern p-4 content-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold text-slate-800 m-0 font-heading">
          Sổ Theo Dõi Các Đợt Trích Nợ Định Kỳ ({batches.length})
        </h6>
      </div>

      <div className="table-responsive">
        <table className="table table-custom align-middle">
          <thead>
            <tr>
              <th>Mã Đợt Trích Nợ</th>
              <th>Tháng / Năm</th>
              <th className="text-center">Kỳ Trích</th>
              <th className="text-end">Phải Thu</th>
              <th className="text-end">Đã Trích</th>
              <th className="text-end">Còn Nợ</th>
              <th className="text-center">Trạng Thái</th>
              <th>Thời Gian Tạo</th>
              <th className="text-center" style={{ width: 100 }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBatches.length > 0 ? (
              paginatedBatches.map((b, idx) => (
                <tr
                  key={idx}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectBatchDetail(b)}
                  title="Bấm để xem chi tiết danh sách đợt trích nợ"
                >
                  <td className="fw-bold font-monospace">
                    <button
                      type="button"
                      className="btn btn-link p-0 fw-bold font-monospace text-decoration-none text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBatchDetail(b);
                      }}
                    >
                      {b.maDot}
                    </button>
                  </td>
                  <td>{b.thangNam}</td>
                  <td className="text-center">
                    <span className="badge bg-secondary-subtle text-secondary">Kỳ {b.kyTrich}</span>
                  </td>
                  <td className="text-end fw-semibold num-tabular">{formatCurrencyVN(b.tongPhaiThu)}</td>
                  <td className="text-end text-success fw-bold num-tabular">{formatCurrencyVN(b.tongDaTrich)}</td>
                  <td className="text-end text-danger fw-bold num-tabular">{formatCurrencyVN(b.tongConNo)}</td>
                  <td className="text-center">
                    <StatusBadge status={b.trangThai || 'DA_CHOT'} />
                  </td>
                  <td className="small text-muted">{b.ngayTao || '---'}</td>
                  <td className="text-center">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary py-1 px-2 d-inline-flex align-items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBatchDetail(b);
                      }}
                      title="Xem chi tiết đợt trích nợ"
                    >
                      <Eye size={13} />
                      <span className="small">Chi tiết</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  <EmptyState
                    title="Chưa có đợt trích nợ nào"
                    description={
                      loading
                        ? 'Đang tải danh sách các đợt trích nợ...'
                        : 'Chưa có đợt trích nợ nào được khởi tạo trong hệ thống.'
                    }
                    action={
                      onOpenCreateBatch && (
                        <button
                          type="button"
                          className="btn btn-brand btn-sm fw-bold shadow-sm"
                          onClick={onOpenCreateBatch}
                        >
                          Khởi Tạo Đợt Đầu Tiên
                        </button>
                      )
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={batchPage}
        totalItems={batches.length}
        pageSize={batchPageSize}
        onPageChange={setBatchPage}
        onPageSizeChange={setBatchPageSize}
      />
    </div>
  );
}
