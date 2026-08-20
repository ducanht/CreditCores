import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  RefreshCw,
  CheckCircle2,
  Server,
  Database,
  Save,
  Globe,
  FolderOpen,
  HardDrive,
  Sliders,
  FileCheck2,
  Lock,
  Layers
} from 'lucide-react';
import { getGasApiUrl, setGasApiUrl, api } from '../services/api';

export default function Settings({ syncStatus, isSyncing, onTriggerSync }) {
  const [gasUrlInput, setGasUrlInput] = useState(getGasApiUrl());
  const [saveMsg, setSaveMsg] = useState('');

  // Drive Folder Configuration State
  const [driveConfig, setDriveConfig] = useState({
    rootFolderId: '1E2zPUuYHkhXMDS5ZM7jxI-FY4JrD17O66ruN5uK15U0',
    appraisalFolderId: '1-Appraisal_TSBD_YenTho',
    inspectionFolderId: '1-Inspection_KTV_YenTho',
    documentsFolderId: '1-Docs_Customer_YenTho',
    autoCompress: true,
    maxImageDimension: 1280,
    compressionQuality: 0.75
  });

  const [driveSaveMsg, setDriveSaveMsg] = useState('');
  const [loadingDrive, setLoadingDrive] = useState(false);

  useEffect(() => {
    const loadDriveCfg = async () => {
      try {
        const res = await api.getDriveSettings();
        if (res.status === 'success' && res.data) {
          setDriveConfig(res.data);
        }
      } catch (e) {
        console.warn('Lỗi tải cấu hình Drive:', e);
      }
    };
    loadDriveCfg();
  }, []);

  const handleSaveUrl = (e) => {
    e.preventDefault();
    setGasApiUrl(gasUrlInput);
    setSaveMsg('Đã lưu cấu hình Google Apps Script Web App URL.');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handleSaveDriveConfig = async (e) => {
    e.preventDefault();
    setLoadingDrive(true);
    try {
      const res = await api.saveDriveSettings(driveConfig);
      if (res.status === 'success') {
        setDriveSaveMsg('Đã lưu cấu hình thư mục Google Drive & tham số nén ảnh.');
        setTimeout(() => setDriveSaveMsg(''), 3000);
      }
    } catch (e) {
      alert('Lỗi lưu cấu hình: ' + e.message);
    } finally {
      setLoadingDrive(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. API Configuration */}
      <div className="card-modern p-4">
        <h5 className="fw-bold mb-2 text-slate-900 font-heading d-flex align-items-center gap-2">
          <Globe size={18} className="text-primary" /> Cấu Hình Máy Chủ Google Apps Script Web App
        </h5>
        <p className="text-muted small mb-3">
          Điền URL triển khai Web App từ Google Apps Script. Nếu để trống, hệ thống sử dụng cơ chế dữ liệu nội bộ.
        </p>

        <form onSubmit={handleSaveUrl} className="row g-2 align-items-center">
          <div className="col-12 col-md-9">
            <input
              type="url"
              className="form-control form-control-sm font-monospace"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={gasUrlInput}
              onChange={(e) => setGasUrlInput(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-3">
            <button type="submit" className="btn btn-primary btn-sm fw-bold w-100 d-flex align-items-center justify-content-center gap-1.5">
              <Save size={14} /> Lưu URL Máy Chủ
            </button>
          </div>
        </form>

        {saveMsg && <div className="alert alert-success mt-2 py-1.5 px-3 small fw-semibold">{saveMsg}</div>}
      </div>

      {/* 2. Google Drive Storage & Auto Compression Settings */}
      <div className="card-modern p-4">
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <h5 className="fw-bold m-0 text-slate-900 font-heading d-flex align-items-center gap-2">
            <FolderOpen size={18} className="text-success" /> Cấu Hình Lưu Trữ Tệp & Hình Ảnh (Google Drive)
          </h5>
          <span className="badge bg-success-subtle text-success small fw-semibold">
            Tự động nén Canvas & Chuẩn hóa định danh
          </span>
        </div>
        <p className="text-muted small mb-3">
          Thiết lập ID thư mục Google Drive để tự động phân loại tệp tải lên và quy định chuẩn nén hình ảnh thực địa.
        </p>

        <form onSubmit={handleSaveDriveConfig}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold text-dark">Thư Mục Gốc QTDND (Root Folder ID)</label>
              <input
                type="text"
                className="form-control form-control-sm font-monospace"
                value={driveConfig.rootFolderId}
                onChange={(e) => setDriveConfig({ ...driveConfig, rootFolderId: e.target.value })}
                placeholder="ID thư mục gốc..."
              />
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>Thư mục cha chứa toàn bộ dữ liệu tệp tin</span>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold text-dark">Thư Mục Thẩm Định & TSĐB (Appraisal Folder ID)</label>
              <input
                type="text"
                className="form-control form-control-sm font-monospace"
                value={driveConfig.appraisalFolderId}
                onChange={(e) => setDriveConfig({ ...driveConfig, appraisalFolderId: e.target.value })}
                placeholder="ID thư mục thẩm định..."
              />
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>Lưu ảnh sổ đỏ, đất đai, nhà ở, chứng minh thu nhập</span>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold text-dark">Thư Mục Kiểm Tra Sử Dụng Vốn (Inspection Folder ID)</label>
              <input
                type="text"
                className="form-control form-control-sm font-monospace"
                value={driveConfig.inspectionFolderId}
                onChange={(e) => setDriveConfig({ ...driveConfig, inspectionFolderId: e.target.value })}
                placeholder="ID thư mục kiểm tra vốn..."
              />
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>Lưu ảnh thực địa, chuồng trại, máy móc, hóa đơn mua sắm</span>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold text-dark">Thư Mục Hồ Sơ Thành Viên (Customer Docs ID)</label>
              <input
                type="text"
                className="form-control form-control-sm font-monospace"
                value={driveConfig.documentsFolderId}
                onChange={(e) => setDriveConfig({ ...driveConfig, documentsFolderId: e.target.value })}
                placeholder="ID thư mục hồ sơ thành viên..."
              />
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>Lưu ảnh chân dung, CCCD, đơn đề nghị vay</span>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold text-dark">Kích Thước Ảnh Tối Đa (Max Dimension)</label>
              <select
                className="form-select form-select-sm"
                value={driveConfig.maxImageDimension}
                onChange={(e) => setDriveConfig({ ...driveConfig, maxImageDimension: Number(e.target.value) })}
              >
                <option value={1024}>1024 px (Tối ưu tốc độ, ~100 KB)</option>
                <option value={1280}>1280 px (Khuyên dùng - Chuẩn tài liệu, ~180 KB)</option>
                <option value={1920}>1920 px (Full HD sắc nét, ~350 KB)</option>
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold text-dark">Mức Nén JPEG (Compression Quality)</label>
              <select
                className="form-select form-select-sm"
                value={driveConfig.compressionQuality}
                onChange={(e) => setDriveConfig({ ...driveConfig, compressionQuality: Number(e.target.value) })}
              >
                <option value={0.65}>65% (Tiết kiệm dung lượng tối đa)</option>
                <option value={0.75}>75% (Chuẩn cân bằng dung lượng & độ nét)</option>
                <option value={0.85}>85% (Chất lượng cao)</option>
              </select>
            </div>

            <div className="col-12 col-md-4 d-flex align-items-end">
              <button
                type="submit"
                className="btn btn-brand btn-sm fw-bold w-100 d-flex align-items-center justify-content-center gap-1.5 text-white"
                disabled={loadingDrive}
              >
                <Save size={14} /> {loadingDrive ? 'Đang lưu...' : 'Lưu Cấu Hình Drive'}
              </button>
            </div>
          </div>
        </form>

        {driveSaveMsg && <div className="alert alert-success mt-3 py-1.5 px-3 small fw-semibold">{driveSaveMsg}</div>}
      </div>

      {/* 3. Quy Chuẩn Đặt Tên Tệp Lưu Trữ */}
      <div className="card-modern p-4">
        <h5 className="fw-bold mb-2 text-slate-900 font-heading d-flex align-items-center gap-2">
          <FileCheck2 size={18} className="text-primary" /> Quy Chuẩn Đặt Tên Tệp Lưu Trữ Tự Động
        </h5>
        <div className="table-responsive">
          <table className="table table-sm table-custom align-middle m-0 small">
            <thead>
              <tr>
                <th>Phân Loại</th>
                <th>Tiền Tố</th>
                <th>Cấu Trúc Tên File Chuẩn Hóa</th>
                <th>Ví Dụ Thực Tế</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="fw-semibold">Ảnh Thành Viên</td>
                <td><span className="badge bg-primary-subtle text-primary font-monospace">KH_AVATAR</span></td>
                <td className="font-monospace">KH_AVATAR_[MaKH]_[HoTen]_[Timestamp].jpg</td>
                <td className="font-monospace text-muted">KH_AVATAR_KH008892_NGUYEN_VAN_AN_1724123.jpg</td>
              </tr>
              <tr>
                <td className="fw-semibold">Ảnh Tài Sản Bảo Đảm</td>
                <td><span className="badge bg-success-subtle text-success font-monospace">TSBD</span></td>
                <td className="font-monospace">TSBD_[MaBCTD]_[MaKH]_[Timestamp].jpg</td>
                <td className="font-monospace text-muted">TSBD_BCTD-2026-081_KH008892_1724123.jpg</td>
              </tr>
              <tr>
                <td className="fw-semibold">Ảnh Kiểm Tra Thực Địa</td>
                <td><span className="badge bg-warning-subtle text-dark font-monospace">KT_THUCDIA</span></td>
                <td className="font-monospace">KT_THUCDIA_[MaBBKT]_[SoHDTD]_[Timestamp].jpg</td>
                <td className="font-monospace text-muted">KT_THUCDIA_BBKT-2026-0120_KU-2026-0312_1724123.jpg</td>
              </tr>
              <tr>
                <td className="fw-semibold">Chứng Từ / Hóa Đơn</td>
                <td><span className="badge bg-danger-subtle text-danger font-monospace">KT_CHUNGTU</span></td>
                <td className="font-monospace">KT_CHUNGTU_[MaBBKT]_[SoHDTD]_[Timestamp].pdf</td>
                <td className="font-monospace text-muted">KT_CHUNGTU_BBKT-2026-0120_KU-2026-0312_1724123.pdf</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Sync Daemon & Queue Monitor */}
      <div className="card-modern p-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="fw-bold m-0 text-slate-900 font-heading d-flex align-items-center gap-2">
            <Server size={18} className="text-primary" /> Trạng Thái Đồng Bộ Cơ Sở Dữ Liệu SQL Server
          </h5>
          <button
            className="btn btn-outline-primary btn-sm fw-bold d-flex align-items-center gap-1.5"
            onClick={onTriggerSync}
            disabled={isSyncing}
          >
            <RefreshCw size={14} className={isSyncing ? 'fa-spin' : ''} />
            {isSyncing ? 'Đang gửi lệnh...' : 'Gửi Lệnh SYNC_DATA'}
          </button>
        </div>

        <div className="row g-3">
          <div className="col-6 col-md-3">
            <div className="p-3 bg-light rounded-3">
              <span className="text-muted small d-block">Lệnh Hiện Tại</span>
              <span className="fw-bold font-monospace text-primary">{syncStatus?.command || 'IDLE'}</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 bg-light rounded-3">
              <span className="text-muted small d-block">Trạng Thái</span>
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
          <div className="col-6 col-md-3">
            <div className="p-3 bg-light rounded-3">
              <span className="text-muted small d-block">Bắt Đầu</span>
              <span className="fw-semibold text-dark small font-monospace">{syncStatus?.startTime || '---'}</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 bg-light rounded-3">
              <span className="text-muted small d-block">Hoàn Tất</span>
              <span className="fw-semibold text-dark small font-monospace">{syncStatus?.finishTime || '---'}</span>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="p-3 bg-light rounded-3">
              <span className="text-muted small d-block">Số Bản Ghi Đồng Bộ</span>
              <span className="fw-bold text-success num-tabular">{syncStatus?.totalRows || 0} dòng</span>
            </div>
          </div>
          <div className="col-12 col-md-9">
            <div className="p-3 bg-light rounded-3">
              <span className="text-muted small d-block">Nhật Ký Hệ Thống</span>
              <span className="fw-semibold text-dark small">{syncStatus?.message || 'Hệ thống sẵn sàng.'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
