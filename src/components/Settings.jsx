import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, RefreshCw, CheckCircle2, Server, Database, Save, Globe } from 'lucide-react';
import { getGasApiUrl, setGasApiUrl, api } from '../services/api';

export default function Settings({ syncStatus, isSyncing, onTriggerSync }) {
  const [gasUrlInput, setGasUrlInput] = useState(getGasApiUrl());
  const [saveMsg, setSaveMsg] = useState('');

  const handleSaveUrl = (e) => {
    e.preventDefault();
    setGasApiUrl(gasUrlInput);
    setSaveMsg('Đã lưu cấu hình Google Apps Script URL thành công!');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. API Configuration */}
      <div className="card-modern p-4">
        <h5 className="fw-bold mb-3 text-slate-800 d-flex align-items-center gap-2">
          <Globe size={20} className="text-primary" /> Cấu Hình Kết Nối Google Apps Script Web App API
        </h5>
        <p className="text-muted small">
          Điền URL triển khai dạng Web App (Execute as: Me, Who has access: Anyone) từ dự án Google Apps Script của bạn.
          Nếu để trống, hệ thống sẽ tự động chạy ở chế độ <strong>Giả Lập Dữ Liệu (Demo Mock Data Mode)</strong>.
        </p>

        <form onSubmit={handleSaveUrl} className="row g-3">
          <div className="col-md-10">
            <input
              type="url"
              className="form-control"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={gasUrlInput}
              onChange={(e) => setGasUrlInput(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary fw-bold w-100 d-flex align-items-center justify-content-center gap-2">
              <Save size={16} /> Lưu Cấu Hình
            </button>
          </div>
        </form>

        {saveMsg && <div className="alert alert-success mt-3 py-2 small fw-semibold">{saveMsg}</div>}
      </div>

      {/* 2. Sync Daemon & Queue Monitor */}
      <div className="card-modern p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold m-0 text-slate-800 d-flex align-items-center gap-2">
            <Server size={20} className="text-primary" /> Giám Sát Hàng Đợi & Local Python Daemon Server
          </h5>
          <button
            className="btn btn-primary fw-bold d-flex align-items-center gap-2"
            onClick={onTriggerSync}
            disabled={isSyncing}
          >
            <RefreshCw size={16} className={isSyncing ? 'fa-spin' : ''} />
            {isSyncing ? 'Đang gửi lệnh...' : 'Gửi Lệnh SYNC_DATA Ngay'}
          </button>
        </div>

        <div className="row g-3">
          <div className="col-md-3">
            <div className="p-3 bg-light rounded-3">
              <span className="text-muted small d-block">Lệnh Hiện Tại (COMMAND)</span>
              <span className="fw-bold fs-6 text-primary">{syncStatus?.command || 'IDLE'}</span>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 bg-light rounded-3">
              <span className="text-muted small d-block">Trạng Thái (STATUS)</span>
              <span
                className={`badge-status ${
                  syncStatus?.status === 'SUCCESS'
                    ? 'badge-success-soft'
                    : syncStatus?.status === 'PROCESSING'
                    ? 'badge-warning-soft'
                    : 'badge-danger-soft'
                }`}
              >
                {syncStatus?.status || 'IDLE'}
              </span>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 bg-light rounded-3">
              <span className="text-muted small d-block">Thời Gian Bắt Đầu (START)</span>
              <span className="fw-semibold text-dark small">{syncStatus?.startTime || '---'}</span>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 bg-light rounded-3">
              <span className="text-muted small d-block">Thời Gian Hoàn Tất (FINISH)</span>
              <span className="fw-semibold text-dark small">{syncStatus?.finishTime || '---'}</span>
            </div>
          </div>

          <div className="col-md-3">
            <div className="p-3 bg-light rounded-3">
              <span className="text-muted small d-block">Tổng Số Dòng Đồng Bộ</span>
              <span className="fw-bold fs-6 text-success">{syncStatus?.totalRows || 0} dòng</span>
            </div>
          </div>
          <div className="col-md-9">
            <div className="p-3 bg-light rounded-3">
              <span className="text-muted small d-block">Thông Điệp Hệ Thống (MESSAGE)</span>
              <span className="fw-semibold text-dark small">{syncStatus?.message || 'Chưa có thông điệp.'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. System Architecture Card */}
      <div className="card-modern p-4">
        <h5 className="fw-bold mb-3 text-slate-800 d-flex align-items-center gap-2">
          <Database size={20} className="text-primary" /> Kiến Trúc Vận Hành Phân Tán (System Architecture)
        </h5>

        <div className="p-3 bg-light rounded-3 small">
          <ul className="m-0 ps-3 d-flex flex-column gap-2 text-muted">
            <li>
              <strong>1. SQL Server CoreBanking:</strong> Nơi lưu trữ dữ liệu nguồn nội bộ tại quầy chi nhánh.
            </li>
            <li>
              <strong>2. Python Local Daemon (sync_daemon.py):</strong> Thường trực 24/7 trên server local, kiểm tra hàng đợi sheet SETTING mỗi 5 giây, truy vấn và đẩy KH_CORE & HDTD_CORE lên đám mây.
            </li>
            <li>
              <strong>3. Google Sheets DB:</strong> 9 sheets chuẩn hóa đóng vai trò Staging & Cloud Database tốc độ cao.
            </li>
            <li>
              <strong>4. Google Apps Script REST API (Code.gs):</strong> Trung tâm xử lý logic tính lãi, lập đợt trích nợ, đối soát và trả JSON CORS.
            </li>
            <li>
              <strong>5. React Vite Frontend:</strong> Giao diện Single Page Application triển khai tự động qua Vercel.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
