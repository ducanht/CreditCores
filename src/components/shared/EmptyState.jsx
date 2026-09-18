import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState Component dùng chung khi danh sách rỗng hoặc không tìm thấy kết quả
 * @param {React.ComponentType} icon - Icon Lucide
 * @param {string} title - Tiêu đề thông báo
 * @param {string} description - Chi tiết mô tả
 * @param {React.ReactNode} action - (Tùy chọn) Nút bấm hành động
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Không có dữ liệu',
  description = 'Chưa có bản ghi nào hoặc không tìm thấy kết quả phù hợp với bộ lọc.',
  action = null
}) {
  return (
    <div className="empty-state py-5 text-center content-fade-in">
      <div className="empty-state-icon mx-auto mb-3">
        <Icon size={26} className="text-muted" />
      </div>
      <h6 className="fw-semibold text-body mb-1 fs-6">{title}</h6>
      <p className="text-muted small mb-3 mx-auto" style={{ maxWidth: '360px' }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
