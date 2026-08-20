import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  RefreshCw,
  Eye,
  Maximize2,
  Download,
  UploadCloud,
  HardDrive
} from 'lucide-react';
import { compressImage, formatStandardFileName, formatFileSize } from '../utils/imageCompressor';
import { api } from '../services/api';

export default function ImageUploader({
  label = 'Tải Lên / Chụp Ảnh',
  prefix = 'DOC',
  entityId = 'UNKNOWN',
  extraInfo = '',
  currentValue = '',
  onChange,
  folderType = 'appraisal', // 'appraisal' | 'inspection' | 'customer' | 'documents'
  maxDimension = 1280,
  quality = 0.75,
  acceptDocs = false
}) {
  const [previewUrl, setPreviewUrl] = useState(currentValue || '');
  const [fileName, setFileName] = useState('');
  const [compressionStats, setCompressionStats] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreviewUrl(currentValue || '');
  }, [currentValue]);

  // Dừng Camera khi component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setUploadError('');
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Lỗi mở Camera:', err);
      setUploadError('Không thể mở Camera. Vui lòng cấp quyền truy cập Camera hoặc chọn tải tệp.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      stopCamera();

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await processAndUploadFile(blob, 'captured_photo.jpg');
      }, 'image/jpeg', 0.95);
    } catch (err) {
      setUploadError('Lỗi chụp ảnh: ' + err.message);
      stopCamera();
    }
  };

  const handleFileInputChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndUploadFile(file, file.name);
  };

  const processAndUploadFile = async (fileOrBlob, originalName) => {
    setIsUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      // 1. Nén ảnh bằng Canvas
      const ext = originalName.split('.').pop() || 'jpg';
      const isDoc = ext.toLowerCase() === 'pdf';
      const compressionResult = await compressImage(fileOrBlob, {
        maxWidth: maxDimension,
        maxHeight: maxDimension,
        quality: quality
      });

      // 2. Tạo tên file chuẩn hóa QTDND
      const stdFileName = formatStandardFileName(prefix, entityId, extraInfo, ext);
      setFileName(stdFileName);

      setCompressionStats({
        original: compressionResult.originalSize,
        compressed: compressionResult.compressedSize,
        savings: Math.max(0, Math.round((1 - compressionResult.compressedSize / compressionResult.originalSize) * 100)),
        isDoc
      });

      // 3. Tải lên Google Drive qua GAS API
      const base64Data = compressionResult.dataUrl;
      const res = await api.uploadDriveFile({
        fileName: stdFileName,
        mimeType: isDoc ? 'application/pdf' : 'image/jpeg',
        base64Data: base64Data,
        folderType: folderType,
        entityId: entityId
      });

      if (res.status === 'success' && res.data?.fileUrl) {
        setPreviewUrl(res.data.fileUrl);
        setUploadSuccess(true);
        if (onChange) onChange(res.data.fileUrl);
      } else {
        // Fallback lưu trực tiếp base64 / blob URL nếu ở Demo Mode
        setPreviewUrl(base64Data);
        setUploadSuccess(true);
        if (onChange) onChange(base64Data);
      }
    } catch (err) {
      console.warn('Lỗi nén hoặc tải tệp:', err);
      setUploadError('Lỗi tải tệp: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl('');
    setCompressionStats(null);
    setFileName('');
    setUploadSuccess(false);
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onChange) onChange('');
  };

  const isPdf = previewUrl?.toLowerCase().includes('.pdf') || previewUrl?.startsWith('data:application/pdf');

  return (
    <div className="card-modern p-3 border bg-light-subtle rounded-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <label className="form-label small fw-bold text-dark m-0 d-flex align-items-center gap-1.5">
          <UploadCloud size={15} className="text-primary" /> {label}
        </label>
        {previewUrl && (
          <span className="badge bg-success-subtle text-success small d-flex align-items-center gap-1">
            <CheckCircle2 size={12} /> Đã lưu trữ Drive
          </span>
        )}
      </div>

      {/* Camera Live Stream View */}
      {isCameraActive && (
        <div className="position-relative bg-dark rounded-3 overflow-hidden mb-3 text-center" style={{ minHeight: 240 }}>
          <video ref={videoRef} autoPlay playsInline className="w-100 h-100 object-fit-cover" style={{ maxHeight: 300 }} />
          <div className="position-absolute bottom-0 start-0 end-0 p-3 bg-gradient-dark d-flex justify-content-center gap-3">
            <button
              type="button"
              className="btn btn-danger btn-sm fw-bold d-flex align-items-center gap-1"
              onClick={stopCamera}
            >
              <X size={15} /> Đóng Camera
            </button>
            <button
              type="button"
              className="btn btn-success btn-sm fw-bold px-4 d-flex align-items-center gap-1.5 shadow"
              onClick={capturePhoto}
            >
              <Camera size={16} /> Chụp & Nén Ảnh
            </button>
          </div>
        </div>
      )}

      {/* Preview Area */}
      {previewUrl && !isCameraActive && (
        <div className="p-2 border rounded-3 bg-white mb-2 position-relative">
          <div className="d-flex align-items-center gap-3">
            {isPdf ? (
              <div className="p-3 bg-danger-subtle rounded-3 text-danger d-flex align-items-center justify-content-center" style={{ width: 64, height: 64 }}>
                <FileText size={32} />
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Ảnh xem trước"
                className="rounded border object-fit-cover flex-shrink-0"
                style={{ width: 80, height: 80 }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}

            <div className="overflow-hidden text-truncate flex-grow-1">
              <div className="fw-bold text-dark small text-truncate" title={fileName || 'Tài liệu đã lưu'}>
                {fileName || (isPdf ? 'Tai_Lieu_Dinh_Kem.pdf' : 'Hinh_Anh_Da_Luu.jpg')}
              </div>

              {compressionStats && !compressionStats.isDoc && (
                <div className="text-muted small mt-0.5" style={{ fontSize: '0.72rem' }}>
                  Gốc: <strong>{formatFileSize(compressionStats.original)}</strong> ➔ Nén: <strong className="text-success">{formatFileSize(compressionStats.compressed)}</strong> (Giảm {compressionStats.savings}%)
                </div>
              )}

              <div className="d-flex align-items-center gap-2 mt-1.5 flex-wrap">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-xs btn-outline-primary py-0.5 px-2 small d-inline-flex align-items-center gap-1 text-decoration-none"
                  style={{ fontSize: '0.72rem' }}
                >
                  <Eye size={12} /> Xem Gốc
                </a>

                <button
                  type="button"
                  className="btn btn-xs btn-outline-danger py-0.5 px-2 small d-inline-flex align-items-center gap-1"
                  style={{ fontSize: '0.72rem' }}
                  onClick={handleRemove}
                  title="Xóa tệp này"
                >
                  <Trash2 size={12} /> Xóa / Chụp Lại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      {!isCameraActive && (
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptDocs ? 'image/*,.pdf' : 'image/*'}
            className="d-none"
            onChange={handleFileInputChange}
          />

          <button
            type="button"
            className="btn btn-sm btn-outline-primary fw-semibold d-inline-flex align-items-center gap-1.5"
            onClick={startCamera}
            disabled={isUploading}
            title="Mở Camera để chụp ảnh trực tiếp từ thiết bị"
          >
            <Camera size={15} /> Chụp Trực Tiếp
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary fw-semibold d-inline-flex align-items-center gap-1.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Chọn file từ máy tính hoặc điện thoại"
          >
            <Upload size={15} /> Tải Tệp Lên {acceptDocs && '(Ảnh/PDF)'}
          </button>

          {isUploading && (
            <span className="small text-primary d-inline-flex align-items-center gap-1 ms-2">
              <RefreshCw size={13} className="fa-spin" /> Đang nén & lưu Drive...
            </span>
          )}
        </div>
      )}

      {uploadError && (
        <div className="alert alert-danger py-1.5 px-2 mt-2 mb-0 small d-flex align-items-center gap-1.5">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
