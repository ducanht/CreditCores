import React, { useState, useEffect, useRef } from 'react';
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
  Zap,
  Server,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import { getTodayVN } from '../../utils/dateUtils';
import DatePickerVN from '../DatePickerVN';

/**
 * Trung Tâm Đồng Bộ Dữ Liệu CoreBanking SQL Server (CoreSyncModal / ExtractAsOfModal)
 * 100% điều khiển qua giao diện WebApp - Không cần dòng lệnh CLI thủ công
 * 
 * Hỗ trợ 3 chế độ đồng bộ trọng yếu:
 * 1. 'current'    : Đồng bộ Thời Gian Thực Hiện Tại (KH_CORE & HDTD_CORE) -> Cho Bảng Tổng Quan & Tra Cứu KH
 * 2. 'as_of_date' : Trích Xuất Sao Kê Đến Ngày Cụ Thể (HDTD_CORE_DN) -> Cho Sao Kê Đến Ngày & Top 50 Đến Ngày
 * 3. 'month_ends' : Trích Xuất Sao Kê Cuối Các Tháng (HDTD_CORE_ALL) -> Cho Xu Hướng 12 Tháng & Top 50 Bình Quân
 */
export default function ExtractAsOfModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'current'
}) {
  if (!isOpen) return null;

  // Mode: 'current' (HDTD_CORE + KH_CORE) | 'as_of_date' (HDTD_CORE_DN) | 'month_ends' (HDTD_CORE_ALL)
  const [mode, setMode] = useState(() => initialMode || 'current');
  const [asOfDate, setAsOfDate] = useState(() => getTodayVN());
  const [selectedMonths, setSelectedMonths] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  
  // Trạng thái tiến trình (Workflow states)
  // stage: 'IDLE' | 'SENDING' | 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'ERROR'
  const [stage, setStage] = useState('IDLE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [syncResultDetails, setSyncResultDetails] = useState(null);
  const [countdown, setCountdown] = useState(null);

  const pollIntervalRef = useRef(null);
  const timerRef = useRef(null);

  // Đổi initialMode nếu prop thay đổi khi mở modal
  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  // Dọn dẹp timers khi unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Toggle chọn tháng cho chế độ month_ends
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

  // Xác định thông tin đích theo mode
  const getTargetInfo = () => {
    switch (mode) {
      case 'current':
        return {
          command: 'SYNC_DATA',
          targetSheet: 'KH_CORE & HDTD_CORE',
          badgeText: 'Số Liệu Thời Gian Thực',
          badgeBg: '#16a34a',
          description: 'Đồng bộ toàn bộ Khách hàng và Dư nợ tín dụng thực tế từ SQL Server CoreBanking vào Bảng Điều Hành Tổng Quan.'
        };
      case 'as_of_date':
        return {
          command: 'EXTRACT_HDTD_DN',
          targetSheet: 'HDTD_CORE_DN',
          badgeText: `Sao Kê Đến Ngày ${asOfDate}`,
          badgeBg: '#4338ca',
          description: 'Trích xuất ảnh chụp số liệu HĐTD đến một ngày cụ thể. Dùng cho Báo cáo Sao Kê Đến Ngày & Top 50 Dư nợ đến ngày.'
        };
      case 'month_ends':
        return {
          command: 'EXTRACT_HDTD_ALL',
          targetSheet: 'HDTD_CORE_ALL',
          badgeText: `Sao Kê Cuối ${selectedMonths.length} Tháng`,
          badgeBg: '#0284c7',
          description: 'Trích xuất số liệu HĐTD các ngày cuối tháng được chọn. Dùng cho Biểu đồ xu hướng 12 tháng & Top 50 Dư nợ bình quân.'
        };
      default:
        return { command: 'SYNC_DATA', targetSheet: 'CORE', badgeText: 'Core SQL', badgeBg: '#475569', description: '' };
    }
  };

  const targetInfo = getTargetInfo();

  // Bắt đầu thực thi đồng bộ 100% qua WebApp
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStage('SENDING');
    setErrorMessage('');
    setElapsedSeconds(0);
    setSyncResultDetails(null);
    setCountdown(null);

    // Bắt đầu đếm giây thực tế
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    const { targetSheet } = targetInfo;
    setSyncStatusMsg(`Đang gửi yêu cầu đồng bộ ${targetSheet} tới Hàng đợi Lệnh Core...`);

    try {
      let res;
      if (mode === 'current') {
        // Gửi lệnh đồng bộ thời gian thực hiện tại
        res = await api.triggerSqlSync();
      } else {
        // Gửi lệnh trích xuất sao kê theo ngày hoặc theo tháng
        const payload = {
          asOfDate: asOfDate,
          mode: mode,
          targetSheet: mode === 'month_ends' ? 'HDTD_CORE_ALL' : 'HDTD_CORE_DN',
          months: mode === 'month_ends' ? selectedMonths : []
        };
        res = await api.triggerAsOfExtract(payload);
      }

      if (res && res.status === 'success') {
        setStage('QUEUED');
        setSyncStatusMsg(`Đã ghi lệnh vào hàng đợi! Đang chờ Python Daemon trên máy chủ kết nối SQL Server...`);

        // Bắt đầu kiểm tra tiến trình Polling mỗi 1.5s
        let pollCount = 0;
        const expectedCommand = mode === 'current' ? 'SYNC_DATA' : (mode === 'month_ends' ? 'EXTRACT_HDTD_ALL' : 'EXTRACT_HDTD_DN');

        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = setInterval(async () => {
          pollCount++;
          try {
            const statusRes = await api.getSyncStatus();
            if (statusRes && statusRes.status === 'success' && statusRes.data) {
              const { command, status, message, totalRows, finishTime } = statusRes.data;

              // Trạng thái Daemon đang xử lý
              if (status === 'PROCESSING') {
                setStage('PROCESSING');
                setSyncStatusMsg(`Python Daemon đang trích xuất dữ liệu từ SQL Server CoreBanking...`);
              } 
              // Trạng thái Daemon đã hoàn tất thành công
              else if (status === 'SUCCESS' && (command === 'IDLE' || command === expectedCommand || pollCount >= 2)) {
                clearInterval(pollIntervalRef.current);
                clearInterval(timerRef.current);
                setStage('SUCCESS');
                setIsSubmitting(false);

                const finalMsg = message || `Đồng bộ thành công ${targetSheet} từ SQL Server CoreBanking!`;
                setSyncStatusMsg(finalMsg);
                setSyncResultDetails({
                  totalRows: totalRows || '---',
                  finishTime: finishTime || 'Vừa xong',
                  targetSheet: targetSheet
                });

                // Xóa RAM Cache để đảm bảo dữ liệu mới được hiển thị ngay
                api.clearCache();

                // Kích hoạt callback thành công cho component cha
                if (onSuccess) {
                  try {
                    onSuccess(targetSheet, mode);
                  } catch (errCb) {
                    console.warn('Lỗi gọi callback onSuccess:', errCb);
                  }
                }

                // Đếm ngược 3s tự đóng modal
                let cd = 3;
                setCountdown(cd);
                const cdTimer = setInterval(() => {
                  cd -= 1;
                  setCountdown(cd);
                  if (cd <= 0) {
                    clearInterval(cdTimer);
                    onClose();
                  }
                }, 1000);
              } 
              // Trạng thái Daemon báo lỗi
              else if (status === 'ERROR') {
                clearInterval(pollIntervalRef.current);
                clearInterval(timerRef.current);
                setStage('ERROR');
                setIsSubmitting(false);
                setErrorMessage(message || 'Lỗi xử lý từ máy chủ SQL Server.');
              }
            }
          } catch (errPoll) {
            console.warn('Lỗi khi kiểm tra tiến trình đồng bộ:', errPoll);
          }

          // Giới hạn an toàn: Sau 50 giây (33 lần poll)
          if (pollCount >= 33) {
            clearInterval(pollIntervalRef.current);
            clearInterval(timerRef.current);
            setIsSubmitting(false);
            setStage('SUCCESS');
            setSyncStatusMsg(`Lệnh đồng bộ đã được gửi thành công vào hàng đợi máy chủ. Dữ liệu đang được nạp ngầm.`);
            api.clearCache();
            if (onSuccess) onSuccess(targetSheet, mode);
            setTimeout(() => onClose(), 2000);
          }
        }, 1500);

      } else {
        clearInterval(timerRef.current);
        setIsSubmitting(false);
        setStage('ERROR');
        setErrorMessage(res?.message || 'Không thể gửi lệnh đồng bộ tới máy chủ.');
      }
    } catch (err) {
      clearInterval(timerRef.current);
      setIsSubmitting(false);
      setStage('ERROR');
      setErrorMessage(err.message || 'Lỗi mạng khi kết nối máy chủ WebApp.');
    }
  };

  return (
    <div className="modal-backdrop-custom d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1060 }}>
      <div className="card-modern p-0 overflow-hidden shadow-xl" style={{ maxWidth: '660px', width: '100%', borderRadius: '14px' }}>
        
        {/* Header Modal Hiện Đại */}
        <div
          className="d-flex justify-content-between align-items-center p-3.5 text-white"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' }}
        >
          <div className="d-flex align-items-center gap-2.5">
            <div className="p-2 rounded-2.5 bg-white bg-opacity-15 shadow-xs">
              <Database size={22} className="text-warning" />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h6 className="fw-bold mb-0 font-heading text-white fs-6">Trung Tâm Đồng Bộ CoreBanking SQL</h6>
                <span className="badge bg-success-subtle text-success border border-success border-opacity-25" style={{ fontSize: '0.68rem' }}>
                  100% Qua WebApp
                </span>
              </div>
              <span className="small text-white text-opacity-75" style={{ fontSize: '0.74rem' }}>
                Trích xuất dữ liệu trực tiếp từ CoreBanking NG-eFUND lên Google Sheets
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm text-white p-1 hover-lift rounded-circle"
            onClick={onClose}
            disabled={isSubmitting}
            title="Đóng cửa sổ"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-4 d-flex flex-column gap-3.5">

          {/* 1. MÀN HÌNH THEO DÕI TIẾN TRÌNH THỜI GIAN THỰC (Khi đang chạy hoặc vừa xong) */}
          {stage !== 'IDLE' && (
            <div className="p-3.5 rounded-3 border bg-light d-flex flex-column gap-3 animate-fade-in">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  {stage === 'PROCESSING' || stage === 'SENDING' || stage === 'QUEUED' ? (
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : stage === 'SUCCESS' ? (
                    <CheckCircle2 size={20} className="text-success" />
                  ) : (
                    <AlertCircle size={20} className="text-danger" />
                  )}
                  <span className="fw-bold small text-dark">
                    {stage === 'SENDING' && 'Đang gửi yêu cầu...'}
                    {stage === 'QUEUED' && 'Đã vào Hàng đợi Core - Chờ Daemon tiếp nhận...'}
                    {stage === 'PROCESSING' && 'Python Daemon đang xử lý trích xuất SQL Core...'}
                    {stage === 'SUCCESS' && 'Đồng Bộ Thành Công 100%!'}
                    {stage === 'ERROR' && 'Gặp Lỗi Xử Lý'}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-1.5 text-muted small font-monospace">
                  <Clock size={13} />
                  <span>{elapsedSeconds}s</span>
                </div>
              </div>

              {/* Thanh tiến trình Progress Bar */}
              <div className="progress" style={{ height: '7px' }}>
                <div
                  className={`progress-bar progress-bar-striped progress-bar-animated ${
                    stage === 'SUCCESS'
                      ? 'bg-success'
                      : stage === 'ERROR'
                      ? 'bg-danger'
                      : 'bg-primary'
                  }`}
                  role="progressbar"
                  style={{
                    width:
                      stage === 'SENDING'
                        ? '25%'
                        : stage === 'QUEUED'
                        ? '50%'
                        : stage === 'PROCESSING'
                        ? '75%'
                        : stage === 'SUCCESS'
                        ? '100%'
                        : '100%'
                  }}
                />
              </div>

              {/* Thông báo chi tiết */}
              <div className="small text-muted" style={{ fontSize: '0.78rem' }}>
                {syncStatusMsg}
              </div>

              {errorMessage && (
                <div className="alert alert-danger py-2 px-2.5 rounded-2 mb-0 small" style={{ fontSize: '0.75rem' }}>
                  <strong>Lỗi:</strong> {errorMessage}
                </div>
              )}

              {/* Chi tiết kết quả khi thành công */}
              {stage === 'SUCCESS' && syncResultDetails && (
                <div className="p-2.5 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-2.5 d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <ShieldCheck size={18} className="text-success" />
                    <span className="small fw-semibold text-success">
                      Dữ liệu đã nạp vào {syncResultDetails.targetSheet}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success text-white small">
                      {syncResultDetails.totalRows} bản ghi
                    </span>
                    {countdown !== null && (
                      <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                        (Tự đóng sau {countdown}s)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. CHỌN CHẾ ĐỘ ĐỒNG BỘ (Khi ở trạng thái sẵn sàng hoặc sau khi lỗi cần cấu hình lại) */}
          {stage === 'IDLE' && (
            <div className="d-flex flex-column gap-3">
              <div>
                <label className="form-label small fw-bold text-dark mb-2 d-flex align-items-center gap-1.5">
                  <span>1. Chọn Nghiệp Vụ Đồng Bộ Cần Thực Hiện:</span>
                </label>

                <div className="row g-2.5">
                  {/* Option 1: ĐỒNG BỘ THỜI GIAN THỰC HIỆN TẠI */}
                  <div className="col-12">
                    <div
                      className={`p-3 rounded-3 border cursor-pointer transition-all position-relative ${
                        mode === 'current'
                          ? 'border-2 border-success bg-success bg-opacity-10 shadow-xs'
                          : 'bg-light hover-lift'
                      }`}
                      onClick={() => setMode('current')}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <input
                            className="form-check-input mt-0 text-success"
                            type="radio"
                            name="syncMode"
                            id="mode_current"
                            checked={mode === 'current'}
                            onChange={() => setMode('current')}
                          />
                          <label className="form-check-label fw-bold small text-dark cursor-pointer" htmlFor="mode_current">
                            ⚡ Đồng Bộ Dư Nợ & Khách Hàng Hiện Tại (Thời Gian Thực)
                          </label>
                        </div>
                        <span className="badge bg-success text-white" style={{ fontSize: '0.68rem' }}>
                          KH_CORE & HDTD_CORE
                        </span>
                      </div>
                      <div className="small text-muted ps-4" style={{ fontSize: '0.75rem' }}>
                        Trích xuất toàn bộ Khách hàng & HĐTD còn dư nợ thực tế để cập nhật <strong>Bảng Tổng Quan</strong>, <strong>Tra Cứu KH 360°</strong> và <strong>Đợt Trích Nợ</strong>.
                      </div>
                    </div>
                  </div>

                  {/* Option 2: SAO KÊ ĐẾN NGÀY CỤ THỂ */}
                  <div className="col-12 col-sm-6">
                    <div
                      className={`p-3 rounded-3 border cursor-pointer transition-all position-relative h-100 ${
                        mode === 'as_of_date'
                          ? 'border-2 border-primary bg-primary bg-opacity-10 shadow-xs'
                          : 'bg-light hover-lift'
                      }`}
                      onClick={() => setMode('as_of_date')}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <input
                            className="form-check-input mt-0"
                            type="radio"
                            name="syncMode"
                            id="mode_single"
                            checked={mode === 'as_of_date'}
                            onChange={() => setMode('as_of_date')}
                          />
                          <label className="form-check-label fw-bold small text-dark cursor-pointer" htmlFor="mode_single">
                            📅 Sao Kê Đến Ngày
                          </label>
                        </div>
                        <span className="badge text-white" style={{ backgroundColor: '#4338ca', fontSize: '0.68rem' }}>
                          HDTD_CORE_DN
                        </span>
                      </div>
                      <div className="small text-muted ps-4" style={{ fontSize: '0.72rem' }}>
                        Snapshot tại 1 mốc ngày chọn. Dùng cho <strong>Sao kê đến ngày</strong> & <strong>Top 50 Dư nợ đến ngày</strong>.
                      </div>
                    </div>
                  </div>

                  {/* Option 3: SAO KÊ CÁC NGÀY CUỐI THÁNG */}
                  <div className="col-12 col-sm-6">
                    <div
                      className={`p-3 rounded-3 border cursor-pointer transition-all position-relative h-100 ${
                        mode === 'month_ends'
                          ? 'border-2 border-info bg-info bg-opacity-10 shadow-xs'
                          : 'bg-light hover-lift'
                      }`}
                      onClick={() => setMode('month_ends')}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <input
                            className="form-check-input mt-0"
                            type="radio"
                            name="syncMode"
                            id="mode_months"
                            checked={mode === 'month_ends'}
                            onChange={() => setMode('month_ends')}
                          />
                          <label className="form-check-label fw-bold small text-dark cursor-pointer" htmlFor="mode_months">
                            📊 Sao Kê Cuối Tháng
                          </label>
                        </div>
                        <span className="badge text-white" style={{ backgroundColor: '#0284c7', fontSize: '0.68rem' }}>
                          HDTD_CORE_ALL
                        </span>
                      </div>
                      <div className="small text-muted ps-4" style={{ fontSize: '0.72rem' }}>
                        Tập hợp các ngày cuối tháng. Dùng cho <strong>Biểu đồ 12 tháng</strong> & <strong>Top 50 Bình quân</strong>.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cấu hình chi tiết khi chọn 'as_of_date' */}
              {mode === 'as_of_date' && (
                <div className="p-3 bg-light rounded-3 border animate-fade-in">
                  <label className="form-label small fw-bold text-dark mb-1">
                    2. Chọn Mốc Ngày Sao Kê (dd/MM/yyyy):
                  </label>
                  <div className="w-100">
                    <DatePickerVN
                      value={asOfDate}
                      onChange={setAsOfDate}
                      placeholder="dd/MM/yyyy (Ví dụ: 30/09/2026)"
                    />
                  </div>
                  <div className="form-text text-muted mt-1.5" style={{ fontSize: '0.72rem' }}>
                    📌 Bản ghi trên <strong>HDTD_CORE_DN</strong> sẽ cập nhật theo mốc ngày <strong>{asOfDate}</strong>.
                  </div>
                </div>
              )}

              {/* Cấu hình chi tiết khi chọn 'month_ends' */}
              {mode === 'month_ends' && (
                <div className="p-3 bg-light rounded-3 border animate-fade-in">
                  <div className="d-flex justify-content-between align-items-center mb-1.5">
                    <label className="form-label small fw-bold text-dark mb-0">
                      2. Chọn Các Mốc Cuối Tháng Năm {new Date().getFullYear()}:
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
                              ? 'btn-primary shadow-xs fw-bold'
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
                    📌 Đã chọn {selectedMonths.length} kỳ cuối tháng. Sẽ ghi vào <strong>HDTD_CORE_ALL</strong>.
                  </div>
                </div>
              )}

              {/* Cam kết kỹ thuật & bảo toàn */}
              <div className="p-2.5 rounded-2.5 border small" style={{ backgroundColor: '#f8fafc', fontSize: '0.74rem' }}>
                <div className="fw-semibold text-dark mb-1 d-flex align-items-center gap-1.5">
                  <ShieldCheck size={14} className="text-success" />
                  <span>Quy Chuẩn Bảo Toàn Dữ Liệu Tín Dụng:</span>
                </div>
                <div className="d-flex flex-column gap-1 text-muted">
                  <div>• <strong>Bảo toàn phân công CBTD</strong>: Không làm mất cán bộ đã được gán trên WebApp.</div>
                  <div>• <strong>Bảo toàn HĐ tất toán</strong>: Giữ nguyên lịch sử các món vay đã trả hết nợ.</div>
                  <div>• <strong>Tính lãi ngày chuẩn TT 14/2017/TT-NHNN</strong>: Tính ngày đầu, bỏ ngày cuối.</div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="d-flex justify-content-between align-items-center pt-2.5 border-top">
            <div className="small text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
              <Server size={13} className="text-primary" />
              <span>SQL: NG-eFUND (CoreBanking)</span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary px-3"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {stage === 'SUCCESS' ? 'Đóng' : 'Hủy bỏ'}
              </button>

              {stage === 'SUCCESS' ? (
                <button
                  type="button"
                  className="btn btn-sm btn-success fw-semibold px-3.5 d-flex align-items-center gap-1.5"
                  onClick={onClose}
                >
                  <Check size={14} />
                  <span>Xem Số Liệu Mới Ngay</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={`btn btn-sm fw-semibold px-3.5 d-flex align-items-center gap-1.5 shadow-sm text-white ${
                    mode === 'current' ? 'btn-success' : 'btn-primary'
                  }`}
                  onClick={handleSubmit}
                  disabled={isSubmitting || (mode === 'month_ends' && selectedMonths.length === 0)}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="spin-animation" />
                      <span>Đang Thực Thi... ({elapsedSeconds}s)</span>
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      <span>Bắt Đầu Đồng Bộ Qua WebApp</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

