import React, { useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { formatDateVN, parseDateVN, isValidDateVN } from '../utils/dateUtils';

const VIETNAMESE_LOCALE = {
  firstDayOfWeek: 1,
  weekdays: {
    shorthand: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    longhand: [
      'Chủ Nhật',
      'Thứ Hai',
      'Thứ Ba',
      'Thứ Tư',
      'Thứ Năm',
      'Thứ Sáu',
      'Thứ Bảy'
    ]
  },
  months: {
    shorthand: [
      'Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6',
      'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'
    ],
    longhand: [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
      'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
      'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ]
  },
  rangeSeparator: ' đến ',
  time_24hr: true,
  today: 'Hôm nay',
  clear: 'Xóa'
};

/**
 * Component Bộ Chọn Ngày Chuẩn Việt Nam (DatePickerVN)
 * Tích hợp Flatpickr, chuẩn GMT+7, định dạng dd/MM/yyyy
 * Bắt buộc disableMobile: true theo quy tắc workspace
 */
export default function DatePickerVN({
  value = '',
  onChange,
  placeholder = 'dd/MM/yyyy',
  className = 'form-control form-control-sm',
  disabled = false,
  readOnly = false,
  required = false,
  minDate,
  maxDate,
  id,
  name,
  containerClassName = ''
}) {
  const inputRef = useRef(null);
  const fpInstanceRef = useRef(null);

  // Chuẩn hóa giá trị hiển thị thành dd/MM/yyyy
  const displayVal = value ? formatDateVN(value) : '';

  useEffect(() => {
    const inputEl = inputRef.current;
    if (!inputEl) return;

    const fp = window.flatpickr;
    if (!fp) return;

    if (fpInstanceRef.current) {
      fpInstanceRef.current.destroy();
    }

    try {
      const options = {
        locale: (fp.l10ns && fp.l10ns.vn) ? fp.l10ns.vn : VIETNAMESE_LOCALE,
        dateFormat: 'd/m/Y',
        allowInput: true,
        disableMobile: true, // Bắt buộc: Tránh xung đột với native datepicker trên iOS/Android
        monthSelectorType: 'static',
        prevArrow: '<i class="fa fa-chevron-left" style="font-size: 11px;"></i>',
        nextArrow: '<i class="fa fa-chevron-right" style="font-size: 11px;"></i>',
        defaultDate: displayVal && displayVal !== '---' ? displayVal : null,
        onChange: (selectedDates, dateStr) => {
          if (onChange) {
            onChange(dateStr, selectedDates[0] || null);
          }
        }
      };

      if (minDate) options.minDate = formatDateVN(minDate);
      if (maxDate) options.maxDate = formatDateVN(maxDate);

      fpInstanceRef.current = fp(inputEl, options);
    } catch (e) {
      console.warn('Không thể khởi tạo Flatpickr:', e);
    }

    return () => {
      if (fpInstanceRef.current) {
        fpInstanceRef.current.destroy();
        fpInstanceRef.current = null;
      }
    };
  }, []);

  // Đồng bộ giá trị prop value vào Flatpickr khi cha re-render
  useEffect(() => {
    if (fpInstanceRef.current) {
      if (displayVal && displayVal !== '---') {
        fpInstanceRef.current.setDate(displayVal, false, 'd/m/Y');
      } else {
        fpInstanceRef.current.clear();
      }
    }
  }, [displayVal]);

  const handleInputChange = (e) => {
    const raw = e.target.value;
    if (onChange) {
      onChange(raw, parseDateVN(raw));
    }
  };

  const handleToggle = () => {
    if (disabled || readOnly) return;
    if (fpInstanceRef.current) {
      fpInstanceRef.current.toggle();
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`input-group input-group-sm datepicker-vn-wrapper ${containerClassName}`}>
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        className={`${className} font-monospace`}
        placeholder={placeholder}
        value={displayVal === '---' ? '' : displayVal}
        onChange={handleInputChange}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        inputMode="numeric"
        autoComplete="off"
        style={{ letterSpacing: '0.3px' }}
      />
      {!readOnly && !disabled && (
        <button
          type="button"
          className="btn btn-outline-secondary btn-datepicker-toggle px-2 d-flex align-items-center justify-content-center"
          onClick={handleToggle}
          tabIndex={-1}
          title="Mở lịch chọn ngày (GMT+7)"
          style={{
            borderColor: 'var(--border-subtle, #cbd5e1)',
            backgroundColor: 'var(--bg-surface-soft, #f8fafc)'
          }}
        >
          <Calendar size={13} className="text-secondary" />
        </button>
      )}
    </div>
  );
}
