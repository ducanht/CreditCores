import React from 'react';
import { formatThousand, parseThousand } from '../utils/numberInputUtils';

/**
 * Component ô nhập tiền tệ / số tự động định dạng phân cách hàng nghìn
 */
export default function ThousandInput({
  value,
  onChange,
  placeholder = 'Nhập số tiền...',
  className = 'form-control',
  suffix = 'đ',
  disabled = false,
  required = false,
  id,
  name
}) {
  const displayValue = formatThousand(value);

  const handleChange = (e) => {
    const rawVal = e.target.value;
    const numericVal = parseThousand(rawVal);
    if (onChange) {
      onChange(numericVal);
    }
  };

  return (
    <div className="input-group input-group-sm">
      <input
        type="text"
        inputMode="numeric"
        id={id}
        name={name}
        className={`${className} num-tabular fw-bold text-end`}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
      {suffix && (
        <span className="input-group-text bg-light text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
          {suffix}
        </span>
      )}
    </div>
  );
}
