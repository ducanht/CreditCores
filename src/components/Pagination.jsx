import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Component Phân Trang Chuẩn Toàn Hệ Thống (Mặc định 15 dòng / trang)
 */
export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 15,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50, 100]
}) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(validCurrentPage * pageSize, totalItems);

  // Tạo danh sách các số trang cần hiển thị
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, validCurrentPage - delta);
      i <= Math.min(totalPages - 1, validCurrentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (validCurrentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (validCurrentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    // Khử trùng lặp
    return [...new Set(rangeWithDots)];
  };

  if (totalItems <= 0) return null;

  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 pt-3 mt-3 border-top">
      {/* Thông tin số lượng bản ghi */}
      <div className="d-flex align-items-center gap-2 text-muted small">
        <span>
          Hiển thị <strong className="text-dark">{startItem}</strong> -{' '}
          <strong className="text-dark">{endItem}</strong> trên tổng số{' '}
          <strong className="text-primary">{totalItems}</strong> bản ghi
        </span>

        {onPageSizeChange && (
          <div className="d-inline-flex align-items-center gap-1 ms-2">
            <span>| Mỗi trang:</span>
            <select
              className="form-select form-select-sm py-0 px-2 fw-semibold"
              style={{ width: 'auto', height: '28px', fontSize: '0.8rem' }}
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                if (onPageChange) onPageChange(1);
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Điều khiển chuyển trang */}
      <div className="d-flex align-items-center gap-1">
        <button
          className="btn btn-sm btn-outline-secondary p-1 px-2"
          onClick={() => onPageChange && onPageChange(1)}
          disabled={validCurrentPage === 1}
          title="Trang đầu"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          className="btn btn-sm btn-outline-secondary p-1 px-2"
          onClick={() => onPageChange && onPageChange(validCurrentPage - 1)}
          disabled={validCurrentPage === 1}
          title="Trang trước"
        >
          <ChevronLeft size={14} />
        </button>

        <div className="d-inline-flex gap-1 mx-1">
          {getPageNumbers().map((num, idx) => {
            if (num === '...') {
              return (
                <span key={`dots-${idx}`} className="px-2 py-1 text-muted small">
                  ...
                </span>
              );
            }
            const isActive = num === validCurrentPage;
            return (
              <button
                key={num}
                className={`btn btn-sm ${
                  isActive ? 'btn-brand fw-bold shadow-sm' : 'btn-light border text-dark'
                }`}
                style={{ minWidth: '32px', height: '30px', padding: '0 6px', fontSize: '0.8rem' }}
                onClick={() => onPageChange && onPageChange(num)}
              >
                {num}
              </button>
            );
          })}
        </div>

        <button
          className="btn btn-sm btn-outline-secondary p-1 px-2"
          onClick={() => onPageChange && onPageChange(validCurrentPage + 1)}
          disabled={validCurrentPage === totalPages}
          title="Trang tiếp"
        >
          <ChevronRight size={14} />
        </button>
        <button
          className="btn btn-sm btn-outline-secondary p-1 px-2"
          onClick={() => onPageChange && onPageChange(totalPages)}
          disabled={validCurrentPage === totalPages}
          title="Trang cuối"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
