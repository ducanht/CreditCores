import React from 'react';

/**
 * StatusBadge Component dùng chung cho toàn hệ sinh thái CreditCores
 * Chuẩn hóa màu sắc thương hiệu và độ tương phản cao WCAG AAA
 * @param {string} status - Mã hoặc tên trạng thái
 * @param {string} label - (Tùy chọn) Nhãn hiển thị đè lên tên trạng thái
 * @param {string} className - Class tùy biến thêm
 */
export default function StatusBadge({ status, label, className = '' }) {
  if (!status) return null;

  const raw = String(status).trim();
  const upper = raw.toUpperCase();

  let badgeClass = 'bg-secondary-subtle text-secondary border-secondary-subtle';
  let displayLabel = label || raw;

  // 1. Thỏa thuận trích nợ
  if (raw === 'Hiệu lực' || raw === 'Hieu luc' || upper === 'ACTIVE') {
    badgeClass = 'bg-success-subtle text-success border border-success-subtle';
    displayLabel = label || 'Hiệu lực';
  } else if (raw === 'Tạm ngưng' || raw === 'Tam ngung' || upper === 'PAUSED') {
    badgeClass = 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
    displayLabel = label || 'Tạm ngưng';
  } else if (raw === 'Đã hủy' || raw === 'Da huy' || upper === 'CANCELLED') {
    badgeClass = 'bg-danger-subtle text-danger border border-danger-subtle';
    displayLabel = label || 'Đã hủy';
  }

  // 2. Kết quả đối soát CoreBanking
  else if (upper === 'TRICH_DU' || upper === 'THANH_CONG') {
    badgeClass = 'bg-success-subtle text-success border border-success-subtle';
    displayLabel = label || 'Đã trích đủ';
  } else if (upper === 'TRICH_MOT_PHAN') {
    badgeClass = 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
    displayLabel = label || 'Trích một phần';
  } else if (upper === 'THAT_BAI' || upper === 'FAILED') {
    badgeClass = 'bg-danger-subtle text-danger border border-danger-subtle';
    displayLabel = label || 'Thất bại';
  } else if (upper === 'CHO_XU_LY' || upper === 'PENDING') {
    badgeClass = 'bg-info-subtle text-info border border-info-subtle';
    displayLabel = label || 'Chờ xử lý';
  }

  // 3. Trạng thái Hợp đồng Tín dụng
  else if (upper === 'DANG_VAY' || raw === 'Đang vay') {
    badgeClass = 'bg-success-subtle text-success border border-success-subtle';
    displayLabel = label || 'Đang vay';
  } else if (upper === 'DA_TAT_TOAN' || raw === 'Đã tất toán') {
    badgeClass = 'bg-secondary-subtle text-secondary border border-secondary-subtle';
    displayLabel = label || 'Đã tất toán';
  } else if (upper === 'QUA_HAN' || raw === 'Quá hạn') {
    badgeClass = 'bg-danger-subtle text-danger border border-danger-subtle';
    displayLabel = label || 'Quá hạn';
  }

  // 4. Trạng thái Đợt Trích Nợ
  else if (upper === 'HOAN_TAT' || upper === 'DA_CHOT') {
    badgeClass = 'bg-success-subtle text-success border border-success-subtle';
    displayLabel = label || 'Đã hoàn tất';
  } else if (upper === 'DANG_XU_LY') {
    badgeClass = 'bg-primary-subtle text-primary border border-primary-subtle';
    displayLabel = label || 'Đang xử lý';
  }

  return (
    <span
      className={`badge rounded-pill fw-medium py-1 px-2.5 ${badgeClass} ${className}`}
      style={{ fontSize: '0.72rem', letterSpacing: '0.2px' }}
    >
      {displayLabel}
    </span>
  );
}
