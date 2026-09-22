import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Calendar,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Layers,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { getTodayVN } from '../../utils/dateUtils';

export default function ExtractAsOfModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  const [mode, setMode] = useState('as_of_date'); // 'as_of_date' | 'month_ends'
  const [asOfDate, setAsOfDate] = useState(() => getTodayVN());
  const [selectedMonths, setSelectedMonths] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Toggle chọn tháng
  const toggleMonth = (m) => {
    setSelectedMonths(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m].sort((a, b) => a - b)
    );
  };

  const handleSelectAllMonths = () => {
    setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  };

  const handleSelectPassedMonths = () => {
    const currentMonth = new Date().getMonth() + 1;
    const passed = [];
    for (let i = 1; i <= currentMonth; i++) passed.push(i);
    setSelectedMonths(passed);
  };

  // Gửi lệnh trích xuất
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSyncStatusMsg('Đang gửi yêu cầu vào Hàng đợi Lệnh Core...');

    try {
      const payload = {
        asOfDate: asOfDate,
        mode: mode,
        months: mode === 'month_ends' ? selectedMonths : []
      };

      const res = await api.triggerAsOfExtract(payload);
      if (res && res.status === 'success') {
        setSyncStatusMsg('Đã ghi nhận lệnh vào hàng đợi! Python Daemon đang xử lý...');
        
        // Bắt đầu kiểm tra trạng thái polling
        let checkCount = 0;
        const interval = setInterval(async () => {
          checkCount++;
          try {
            const statusRes = await api.getSyncStatus();
            if (statusRes && statusRes.status === 'success' && statusRes.data) {
              const { command, status, message } = statusRes.data;
              if (status === 'PROCESSING') {
                setSyncStatusMsg(`Python Daemon đang trích xuất CoreBanking... (${checkCount * 2}s)`);
              } else if (status === 'SUCCESS' && (command === 'IDLE' || command === 'EXTRACT_HDTD_DN')) {
                clearInterval(interval);
                setIsSubmitting(false);
                setIsSuccess(true);
                setSyncStatusMsg(message || 'Trích xuất và cập nhật HDTD_CORE_DN thành công!');
                setTimeout(() => {
                  if (onSuccess) onSuccess();
                  onClose();
                }, 1200);
              } else if (status === 'ERROR') {
                clearInterval(interval);
                setIsSubmitting(false);
                setErrorMessage(message || 'Lỗi xử lý từ Python Daemon.');
              }
            }
          } catch (err) {
            console.warn('Lỗi kiểm tra tiến trình đồng bộ:', err);
          }

          if (checkCount >= 20) {
            clearInterval(interval);
            setIsSubmitting(false);
            setSyncStatusMsg('Lệnh đã gửi thành công vào hàng đợi. Dữ liệu sẽ tự động nạp khi hoàn tất.');
            setTimeout(() => {
              if (onSuccess) onSuccess();
              onClose();
            }, 1500);
          }
        }, 2000);
      } else {
        setIsSubmitting(false);
        setErrorMessage(res?.message || 'Không thể gửi lệnh trích xuất.');
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Lỗi mạng khi kết nối máy chủ.');
    }
  };

  return (
    <div className="modal-backdrop-custom d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1060 }}>
      <div className="card-modern p-0 overflow-hidden shadow-lg" style={{ maxWidth: '580px', width: '100%' }}>
        {/* Header Modal */}
        <div className="d-flex justify-content-between align-items-center p-3.5 text-white" style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)' }}>
          <div className="d-flex align-items-center gap-2.5">
            <div className="p-2 rounded-2 bg-white bg-opacity-20">
              <Database size={18} />
            </div>
            <div>
              <h6 className="fw-bold mb-0 font-heading">Trích Xuất Sao Kê HĐTD_CORE_DN Từ SQL Core</h6>
              <span className="small text-white text-opacity-75" style={{ fontSize: '0.75rem' }}>
                Đẩy dữ liệu sao kê 17 cột chuẩn mực từ NG-eFUND lên Google Sheets
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm text-white p-1 hover-lift"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Modal */}
        <form onSubmit={handleSubmit} className="p-3.5 d-flex flex-column gap-3.5">
          {/* Thông báo trạng thái */}
          {syncStatusMsg && !errorMessage && (
            <div className="alert alert-info d-flex align-items-center gap-2 p-2.5 rounded-2.5 mb-0 small">
              {isSuccess ? <CheckCircle2 size={16} className="text-success flex-shrink-0" /> : <RefreshCw size={16} className="spin-animation flex-shrink-0" />}
              <div>{syncStatusMsg}</div>
            </div>
          )}

          {errorMessage && (
            <div className="alert alert-danger d-flex align-items-center gap-2 p-2.5 rounded-2.5 mb-0 small">
              <AlertCircle size={16} className="text-danger flex-shrink-0" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Lựa chọn chế độ sao kê */}
          <div>
            <label className="form-label small fw-bold text-dark mb-1.5">
              1. Chế Độ Trích Xuất Dữ Liệu:
            </label>
            <div className="row g-2">
              <div className="col-12 col-sm-6">
                <div
                  className={`p-3 rounded-2.5 border cursor-pointer transition-all ${
                    mode === 'as_of_date' ? 'bg-primary-subtle border-primary' : 'bg-light'
                  }`}
                  onClick={() => setMode('as_of_date')}
                >
                  <div className="form-check m-0">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="extractMode"
                      id="mode_single"
                      checked={mode === 'as_of_date'}
                      onChange={() => setMode('as_of_date')}
                    />
                    <label className="form-check-label fw-semibold small text-dark d-block ms-1" htmlFor="mode_single">
                      Mốc Ngày Cụ Thể
                    </label>
                  </div>
                  <div className="small text-muted mt-1" style={{ fontSize: '0.72rem', paddingLeft: '1.4rem' }}>
                    Sao kê danh sách HĐTD chốt đến 1 ngày cụ thể (Ví dụ: 31/08/2026).
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6">
                <div
                  className={`p-3 rounded-2.5 border cursor-pointer transition-all ${
                    mode === 'month_ends' ? 'bg-indigo-subtle border-indigo' : 'bg-light'
                  }`}
                  style={mode === 'month_ends' ? { backgroundColor: '#e0e7ff', borderColor: '#6366f1' } : {}}
                  onClick={() => setMode('month_ends')}
                >
                  <div className="form-check m-0">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="extractMode"
                      id="mode_months"
                      checked={mode === 'month_ends'}
                      onChange={() => setMode('month_ends')}
                    />
                    <label className="form-check-label fw-semibold small text-dark d-block ms-1" htmlFor="mode_months">
                      Các Mốc Cuối Tháng
                    </label>
                  </div>
                  <div className="small text-muted mt-1" style={{ fontSize: '0.72rem', paddingLeft: '1.4rem' }}>
                    Trích xuất các ngày cuối tháng (T1 - T12) để vẽ biểu đồ và tính dư nợ bình quân.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chọn Mốc ngày sao kê khi ở chế độ as_of_date */}
          {mode === 'as_of_date' && (
            <div>
              <label className="form-label small fw-bold text-dark mb-1">
                2. Ngày Chốt Sao Kê Dữ Liệu (dd/MM/yyyy):
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Calendar size={15} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="dd/MM/yyyy (Ví dụ: 31/08/2026)"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-text text-muted" style={{ fontSize: '0.72rem' }}>
                Dòng 1 của HDTD_CORE_DN sẽ tự động ghi Banner: <em>Sao kê tín dụng đến ngày {asOfDate}</em>
              </div>
            </div>
          )}

          {/* Chọn các tháng khi ở chế độ month_ends */}
          {mode === 'month_ends' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-1.5">
                <label className="form-label small fw-bold text-dark mb-0">
                  2. Chọn Các Mốc Tháng Cần Sao Kê:
                </label>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-link p-0 small text-decoration-none"
                    style={{ fontSize: '0.72rem' }}
                    onClick={handleSelectAllMonths}
                  >
                    Chọn Cả 12 Tháng
                  </button>
                  <span className="text-muted">|</span>
                  <button
                    type="button"
                    className="btn btn-link p-0 small text-decoration-none"
                    style={{ fontSize: '0.72rem' }}
                    onClick={handleSelectPassedMonths}
                  >
                    Các Tháng Đã Qua
                  </button>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-1.5 p-2.5 bg-light rounded-2 border">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                  const isSelected = selectedMonths.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      className={`btn btn-sm px-2.5 py-1 rounded-2 transition-all font-monospace ${
                        isSelected
                          ? 'btn-primary shadow-sm fw-bold'
                          : 'btn-outline-secondary bg-white text-muted'
                      }`}
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => toggleMonth(m)}
                    >
                      T{m < 10 ? `0${m}` : m}
                    </button>
                  );
                })}
              </div>
              <div className="form-text text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                Đã chọn {selectedMonths.length} mốc tháng. Hệ thống sẽ tự động tính ngày cuối tháng (28/29/30/31).
              </div>
            </div>
          )}

          {/* Quy tắc cấu trúc 2 tầng */}
          <div className="p-2.5 bg-light rounded-2 border small text-muted" style={{ fontSize: '0.73rem' }}>
            <div className="fw-semibold text-dark mb-1">
              ⚡ Kiến trúc chuẩn hóa HDTD_CORE_DN:
            </div>
            <ul className="mb-0 ps-3">
              <li><strong>Dòng 1</strong>: Banner Metadata sao kê & thời gian cập nhật.</li>
              <li><strong>Dòng 2</strong>: Header 17 cột (đã loại bỏ 6 cột CCCD, SĐT, TraLaiDenNgay, CBTD, TrangThaiHD; thêm NgayDuLieu).</li>
              <li><strong>Dòng 3+</strong>: Bản ghi dữ liệu phục vụ báo cáo, thống kê và vẽ biểu đồ.</li>
            </ul>
          </div>

          {/* Footer Buttons */}
          <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary px-3"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Đóng
            </button>
            <button
              type="submit"
              className="btn btn-sm btn-brand text-white fw-semibold px-3.5 d-flex align-items-center gap-2 shadow-sm"
              disabled={isSubmitting || (mode === 'month_ends' && selectedMonths.length === 0)}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="spin-animation" />
                  <span>Đang Xử Lý Lệnh...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Gửi Lệnh Tới Python Daemon</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
