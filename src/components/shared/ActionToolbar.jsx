import React from 'react';

/**
 * ActionToolbar Component dùng chung cho thanh công cụ bộ lọc và nút tác vụ
 * @param {React.ReactNode} left - Nội dung bên trái (Search bar, dropdown filters)
 * @param {React.ReactNode} right - Nội dung bên phải (Buttons, export, refresh)
 * @param {string} className - Class tùy biến
 */
export default function ActionToolbar({ left, right, className = '' }) {
  return (
    <div className={`action-toolbar ${className}`}>
      <div className="d-flex align-items-center gap-2 flex-wrap flex-grow-1">
        {left}
      </div>
      {right && (
        <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
          {right}
        </div>
      )}
    </div>
  );
}
