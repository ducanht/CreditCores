import React from 'react';
import { ClipboardList, ExternalLink, Printer, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDateVN } from '../../utils/dateUtils';

export default function InspectionDetailModal({ inspection, onClose }) {
  if (!inspection) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-4">
          <div className="modal-header border-0 pb-0">
            <div>
              <span className="badge bg-success-subtle text-success mb-1">
                {inspection.maBBKT} • Lần {inspection.lanKiemTra || 1}
              </span>
              <h5 className="modal-title fw-bold text-dark font-heading">
                Chi Tiết Biên Bản Kiểm Tra Sử Dụng Vốn
              </h5>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body py-3">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="p-3 bg-light rounded-3 border">
                  <span className="text-muted small">Khách Hàng Vay Vốn:</span>
                  <div className="fw-bold text-dark fs-6">{inspection.hoTen}</div>
                  <div className="small font-monospace text-muted">Mã KH: {inspection.maKH}</div>
                  <div className="small text-muted">Hợp đồng: <strong className="text-primary">{inspection.soHDTD}</strong></div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 bg-light rounded-3 border">
                  <span className="text-muted small">Thông Tin Đoàn Kiểm Tra:</span>
                  <div className="fw-bold text-dark">
                    <span className="badge bg-primary me-1">{inspection.loaiDoanKT || 'CBTD'}</span>
                    {inspection.thanhPhanDoan || 'Cán bộ tín dụng phụ trách địa bàn'}
                  </div>
                  <div className="small text-muted mt-1">Ngày KT: <strong>{inspection.ngayKiemTra}</strong></div>
                  <div className="small text-muted">Lần KT tới: <strong className="text-primary">{inspection.ngayKTNext || 'Chưa xếp lịch'}</strong></div>
                </div>
              </div>

              <div className="col-12">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="row g-2 small">
                    <div className="col-sm-6">
                      <span className="text-muted">Địa điểm kiểm tra:</span> <strong className="text-dark">{inspection.diaDiemKT || 'Tại cơ sở khách hàng'}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted">Hình thức:</span> <strong className="text-dark">{inspection.hinhThuc || 'Thực địa'}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted">Đánh giá mục đích:</span> <strong className="text-success">{inspection.danhGiaMucDich}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted">Mức độ rủi ro:</span>{' '}
                      <span className={`badge ${inspection.mucDoRuiRo === 'Rủi ro cao' ? 'bg-danger' : 'bg-success'}`}>
                        {inspection.mucDoRuiRo || 'Bình thường'}
                      </span>
                    </div>
                    <div className="col-12 mt-2">
                      <span className="text-muted">Mô tả thực tế:</span>
                      <p className="m-0 text-dark mt-1">{inspection.moTaThucTe || 'Khách hàng sử dụng vốn đúng phương án sản xuất kinh doanh đã được duyệt.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
              <Printer size={14} className="me-1" /> In Biên Bản
            </button>
            <button type="button" className="btn btn-light btn-sm" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
