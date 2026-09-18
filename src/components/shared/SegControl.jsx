import React from 'react';

/**
 * Segmented Control Component dùng chung
 * @param {Array<{ id: string|number, label: string|React.ReactNode, icon?: React.ComponentType, count?: number }>} options
 * @param {string|number} value - ID của tab đang chọn
 * @param {Function} onChange - Callback khi chọn tab mới (id) => void
 * @param {string} className - Class tùy biến thêm
 */
export default function SegControl({ options = [], value, onChange, className = '' }) {
  return (
    <div className={`seg-control ${className}`} role="tablist">
      {options.map((opt) => {
        const isActive = opt.id === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`seg-item ${isActive ? 'active' : ''}`}
            onClick={() => onChange && onChange(opt.id)}
          >
            {Icon && <Icon size={14} className="me-1.5" />}
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`badge ms-1.5 ${
                  isActive ? 'bg-white text-dark' : 'bg-secondary-subtle text-secondary'
                }`}
                style={{ fontSize: '0.68rem', padding: '0.2em 0.55em', borderRadius: '6px' }}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
