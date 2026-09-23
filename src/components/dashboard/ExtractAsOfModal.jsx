import React, { useState } from 'react';
import {
  X,
  Database,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Layers,
  HelpCircle,
  FileSpreadsheet,
  TrendingUp,
  Crown
} from 'lucide-react';
import { api } from '../../services/api';
import { getTodayVN } from '../../utils/dateUtils';

export default function ExtractAsOfModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  const [mode, setMode] = useState('as_of_date'); // 'as_of_date' (HDTD_CORE_DN) | 'month_ends' (HDTD_CORE_ALL)
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
    const targetSheet = mode === 'month_ends' ? 'HDTD_CORE_ALL' : 'HDTD_CORE_DN';
    setSyncStatusMsg(`Đang gửi yêu cầu trích xuất ${targetSheet} vào Hàng đợi Lệnh Core...`);

    try {
      const payload = {
        asOfDate: asOfDate,
        mode: mode,
        targetSheet: targetSheet,
        months: mode === 'month_ends' ? selectedMonths : []
      };

      const res = await api.triggerAsOfExtract(payload);
      if (res && res.status === 'success') {
        setSyncStatusMsg(`Đã ghi nhận lệnh trích xuất ${targetSheet}! Python Daemon đang xử lý...`);
        
        // Bắt đầu kiểm tra trạng thái polling
        let checkCount = 0;
        const interval = setInterval(async () => {
          checkCount++;
          try {
            const statusRes = await api.getSyncStatus();
            if (statusRes && statusRes.status === 'success' && statusRes.data) {
              const { command, status, message } = statusRes.data;
              if (status === 'PROCESSING') {
                setSyncStatusMsg(`Python Daemon đang trích xuất CoreBanking vào ${targetSheet}... (${checkCount * 2}s)`);
              } else if (status === 'SUCCESS' && (command === 'IDLE' || command === 'EXTRACT_HDTD_DN' || command === 'EXTRACT_HDTD_ALL')) {
                clearInterval(interval);
                setIsSubmitting(false);
                setIsSuccess(true);
                setSyncStatusMsg(message || `Trích xuất và cập nhật ${targetSheet} thành công!`);
                setTimeout(() => {
                  if (onSuccess) onSuccess(targetSheet);
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

          if (checkCount >= 25) {
            clearInterval(interval);
            setIsSubmitting(false);
            setSyncStatusMsg(`Lệnh trích xuất ${targetSheet} đã được gửi vào hàng đợi. Dữ liệu sẽ tự động nạp khi hoàn tất.`);
            setTimeout(() => {
              if (onSuccess) onSuccess(targetSheet);
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
      <div className="card-modern p-0 overflow-hidden shadow-lg" style={{ maxWidth: '620px', width: '100%' }}>
        {/* Header Modal */}
        <div className="d-flex justify-content-between align-items-center p-3.5 text-white" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #4338ca 100%)' }}>
          <div className="d-flex align-items-center gap-2.5">
            <div className="p-2 rounded-2 bg-white bg-opacity-20">
              <Database size={20} />
            </div>
            <div>
              <h6 className="fw-bold mb-0 font-heading">Trích Xuất Sao Kê HĐTD Từ CoreBanking SQL</h6>
              <span className="small text-white text-opacity-80" style={{ fontSize: '0.75rem' }}>
                Phân định minh bạch giữa HDTD_CORE_DN (Đến ngày) và HDTD_CORE_ALL (Cuối mỗi tháng)
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

          {/* Lựa chọn chế độ sao kê & bảng đích */}
          <div>
            <label className="form-label small fw-bold text-dark mb-1.5">
              1. Chọn Mục Đích & Bảng Đích Lưu Trữ:
            </label>
            <div className="row g-2">
              {/* Option 1: HDTD_CORE_DN */}
              <div className="col-12 col-sm-6">
                <div
                  className={`p-3 rounded-2.5 border cursor-pointer transition-all position-relative h-100 ${
                    mode === 'as_of_date' ? 'bg-primary-subtle border-primary shadow-sm' : 'bg-light'
                  }`}
                  onClick={() => setMode('as_of_date')}
                >
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="badge bg-indigo text-white" style={{ backgroundColor: '#4338ca', fontSize: '0.7rem' }}>
                      HDTD_CORE_DN
                    </span>
                    <Crown size={14} className="text-warning" />
                  </div>
                  <div className="form-check m-0">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="extractMode"
                      id="mode_single"
                      checked={mode === 'as_of_date'}
                      onChange={() => setMode('as_of_date')}
                    />
                    <label className="form-check-label fw-bold small text-dark d-block ms-1" htmlFor="mode_single">
                      Sao Kê Đến 1 Ngày Cụ Thể
                    </label>
                  </div>
                  <div className="small text-muted mt-1.5" style={{ fontSize: '0.72rem', paddingLeft: '1.4rem' }}>
                    Snapshot tại 1 mốc ngày. Phục vụ <strong>đối soát tức thời</strong> và <strong>Top 50 Dư nợ lớn nhất đến ngày</strong>.
                  </div>
                </div>
              </div>

              {/* Option 2: HDTD_CORE_ALL */}
              <div className="col-12 col-sm-6">
                <div
                  className={`p-3 rounded-2.5 border cursor-pointer transition-all position-relative h-100 ${
                    mode === 'month_ends' ? 'bg-indigo-subtle border-indigo shadow-sm' : 'bg-light'
                  }`}
                  style={mode === 'month_ends' ? { backgroundColor: '#e0e7ff', borderColor: '#1e3a8a' } : {}}
                  onClick={() => setMode('month_ends')}
                >
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="badge text-white" style={{ backgroundColor: '#1e3a8a', fontSize: '0.7rem' }}>
                      HDTD_CORE_ALL
                    </span>
                    <TrendingUp size={14} className="text-primary" />
                  </div>
                  <div className="form-check m-0">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="extractMode"
                      id="mode_months"
                      checked={mode === 'month_ends'}
                      onChange={() => setMode('month_ends')}
                    />
                    <label className="form-check-label fw-bold small text-dark d-block ms-1" htmlFor="mode_months">
                      Sao Kê Các Ngày Cuối Tháng
                    </label>
                  </div>
                  <div className="small text-muted mt-1.5" style={{ fontSize: '0.72rem', paddingLeft: '1.4rem' }}>
                    Tập hợp các ngày cuối tháng. Phục vụ <strong>Biểu đồ 12 tháng</strong> và <strong>Top 50 Dư nợ bình quân</strong>.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cấu hình cho HDTD_CORE_DN: Chọn Mốc ngày sao kê */}
          {mode === 'as_of_date' && (
            <div className="p-3 bg-light rounded-2 border">
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
                  placeholder="dd/MM/yyyy (Ví dụ: 30/09/2026)"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-text text-muted mt-1.5" style={{ fontSize: '0.72rem' }}>
                📌 Dòng 1 của sheet <strong>HDTD_CORE_DN</strong> sẽ tự động ghi: <em>Sao kê tín dụng đến ngày {asOfDate} | Dữ liệu cập nhật: [Thời gian thực]</em>
              </div>
            </div>
          )}

          {/* Cấu hình cho HDTD_CORE_ALL: Chọn các tháng */}
          {mode === 'month_ends' && (
            <div className="p-3 bg-light rounded-2 border">
              <div className="d-flex justify-content-between align-items-center mb-1.5">
                <label className="form-label small fw-bold text-dark mb-0">
                  2. Chọn Các Mốc Cuối Tháng Để Lưu Trữ (Năm {new Date().getFullYear()}):
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

              <div className="d-flex flex-wrap gap-1.5 p-2 bg-white rounded border mb-2">
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
              <div className="form-text text-muted mt-0" style={{ fontSize: '0.72rem' }}>
                📌 Đã chọn {selectedMonths.length} kỳ. Dữ liệu sẽ ghi vào <strong>HDTD_CORE_ALL</strong> với mốc ngày cuối từng tháng (28/29/30/31).
              </div>
            </div>
          )}

          {/* Minh bạch dữ liệu & Kiến trúc 2 tầng */}
          <div className="p-2.5 rounded-2 border small" style={{ backgroundColor: '#f8fafc', fontSize: '0.73rem' }}>
            <div className="fw-semibold text-dark mb-1 d-flex align-items-center gap-1.5">
              <Layers size={13} className="text-primary" />
              <span>Minh bạch dữ liệu & Kiến trúc Two-Tier:</span>
            </div>
            <div className="d-flex flex-column gap-1 text-muted">
              <div>
                • <strong className="text-indigo">HDTD_CORE_DN</strong>: Chỉ lưu sao kê của 1 ngày cụ thể $\to$ Không bị trùng lặp, dùng cho tab Top 50 Dư nợ đến ngày.
              </div>
              <div>
                • <strong className="text-primary">HDTD_CORE_ALL</strong>: Lưu trữ dữ liệu lịch sử các ngày cuối tháng $\to$ Dùng cho Biểu đồ xu hướng và Top 50 Dư nợ bình quân cuối tháng.
              </div>
            </div>
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
                  <span>Gửi Lệnh Trích Xuất {mode === 'month_ends' ? 'HDTD_CORE_ALL' : 'HDTD_CORE_DN'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
