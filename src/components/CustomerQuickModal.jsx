import React from 'react';
import {
  User,
  Phone,
  MapPin,
  CreditCard,
  Building2,
  Calendar,
  FileText,
  ShieldCheck,
  Zap,
  ArrowRight,
  ClipboardList,
  FileCheck2,
  X
} from 'lucide-react';
import { formatCurrencyVN, formatDateVN } from '../utils/dateUtils';

export default function CustomerQuickModal({
  customer,
  onClose,
  onNavigateToAppraisal,
  onNavigateToInspection,
  onNavigateToDebit
}) {
  if (!customer) return null;

  const totalDuNo = (customer.contracts || []).reduce((sum, c) => sum + (c.duNo || 0), 0);

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1070 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-4">
          {/* Header */}
          <div className="modal-header border-0 pb-0">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                style={{
                  width: 48,
                  height: 48,
                  background: 'linear-gradient(135deg, #9acd32 0%, #047857 100%)',
                  color: '#0f172a',
                  fontSize: '1.2rem',
                  boxShadow: '0 4px 12px rgba(154, 205, 50, 0.4)'
                }}
              >
                {(customer.hoTen || 'K')[0].toUpperCase()}
              </div>

              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h4 className="fw-extrabold m-0 text-dark font-heading">
                    {customer.hoTen}
                  </h4>
                  <span className="badge bg-primary-subtle text-primary font-monospace">
                    {customer.maKH}
                  </span>
                  <span className="badge bg-success-subtle text-success">
                    Thành viên: {customer.soTV || 'TV-0001'}
                  </span>
                </div>
                <div className="text-muted small mt-1 d-flex align-items-center gap-3 flex-wrap">
                  <span><Phone size={13} className="me-1" />{customer.dienThoaiDD || customer.dienThoai || '---'}</span>
                  <span><CreditCard size={13} className="me-1" />CCCD: {customer.cccd || customer.gttt || customer.soCCCD || '---'}</span>
                  <span><MapPin size={13} className="me-1" />{customer.diaChi || customer.khuVuc || customer.diaChiTSBD || '---'}</span>
                </div>
              </div>
            </div>

            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body py-3">
            {/* Quick Metrics */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-4">
                <div className="p-3 bg-light rounded-3 border h-100">
                  <span className="text-muted small fw-bold d-block">TỔNG DƯ NỢ HIỆN TẠI</span>
                  <h5 className="fw-extrabold text-danger m-0 mt-1 num-tabular">
                    {formatCurrencyVN(totalDuNo)}
                  </h5>
                  <span className="small text-muted">{customer.contracts?.length || 0} hợp đồng tín dụng</span>
                </div>
              </div>

              <div className="col-12 col-sm-4">
                <div className="p-3 bg-light rounded-3 border h-100">
                  <span className="text-muted small fw-bold d-block">VỐN GÓP THÀNH VIÊN</span>
                  <h5 className="fw-extrabold text-success m-0 mt-1 num-tabular">
                    {formatCurrencyVN(customer.tongTienCP || 20000000)}
                  </h5>
                  <span className="small text-muted">Sổ CP: {customer.soSoCP || 'CP-0102'}</span>
                </div>
              </div>

              <div className="col-12 col-sm-4">
                <div className="p-3 bg-light rounded-3 border h-100">
                  <span className="text-muted small fw-bold d-block">SỐ TÀI KHOẢN CASA</span>
                  <h5 className="fw-extrabold text-primary m-0 mt-1 font-monospace" style={{ fontSize: '1rem' }}>
                    {customer.soTK || '3500205123456'}
                  </h5>
                  <span className="badge bg-success-subtle text-success mt-1">
                    Đã đăng ký trích nợ tự động
                  </span>
                </div>
              </div>
            </div>

            {/* Danh Sách Hợp Đồng Tín Dụng */}
            <div className="mb-4">
              <h6 className="fw-bold text-dark mb-2 font-heading d-flex align-items-center gap-2">
                <FileText size={16} className="text-primary" /> Danh Sách Hợp Đồng Vay Vốn & Khế Ước
              </h6>

              {customer.contracts && customer.contracts.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-custom align-middle">
                    <thead>
                      <tr>
                        <th>Số HĐTD / Khế Ước</th>
                        <th>Mục Đích Vay</th>
                        <th className="text-end">Tiền Vay</th>
                        <th className="text-end">Dư Nợ Gốc</th>
                        <th>Lãi Suất</th>
                        <th>Ngày Đáo Hạn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.contracts.map((c) => (
                        <tr key={c.soHDTD}>
                          <td>
                            <span className="fw-bold font-monospace text-primary">{c.soHDTD}</span>
                            <div className="small text-muted">{c.maLoaiVay || 'LV01'}</div>
                          </td>
                          <td className="small text-dark fw-medium" style={{ maxWidth: 200 }}>
                            {c.moTaVay || 'Cho vay sản xuất kinh doanh nông nghiệp'}
                          </td>
                          <td className="text-end fw-semibold num-tabular text-dark">
                            {formatCurrencyVN(c.tienVay)}
                          </td>
                          <td className="text-end fw-bold num-tabular text-danger">
                            {formatCurrencyVN(c.duNo)}
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border font-monospace">
                              {c.laiSuat}%/năm
                            </span>
                          </td>
                          <td className="small text-dark num-tabular">
                            {c.denHan || '---'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 bg-light rounded-3 text-center text-muted small">
                  Khách hàng hiện không có hợp đồng vay vốn nào đang hoạt động.
                </div>
              )}
            </div>

            {/* Thao Tác Chuyển Nhanh Phân Hệ (Cross-module Shortcuts) */}
            <div>
              <h6 className="fw-bold text-dark mb-2 font-heading">
                Thao Tác Nghiệp Vụ Nhanh Cho Khách Hàng Này:
              </h6>
              <div className="d-flex gap-2 flex-wrap">
                <button
                  className="btn btn-sm btn-outline-success d-flex align-items-center gap-1 fw-bold"
                  onClick={() => {
                    onClose();
                    if (onNavigateToAppraisal) onNavigateToAppraisal(customer);
                  }}
                >
                  <FileCheck2 size={15} /> Lập Hồ Sơ Thẩm Định Mới
                </button>

                <button
                  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 fw-bold"
                  onClick={() => {
                    onClose();
                    if (onNavigateToInspection && customer.contracts?.[0]) {
                      onNavigateToInspection({
                        soHDTD: customer.contracts[0].soHDTD,
                        maKH: customer.maKH,
                        hoTen: customer.hoTen
                      });
                    }
                  }}
                >
                  <ClipboardList size={15} /> Kiểm Tra Sử Dụng Vốn
                </button>

                <button
                  className="btn btn-sm btn-outline-warning text-dark d-flex align-items-center gap-1 fw-bold"
                  onClick={() => {
                    onClose();
                    if (onNavigateToDebit) onNavigateToDebit(customer);
                  }}
                >
                  <Zap size={15} /> Đăng Ký / Xem Trích Nợ Tự Động
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer border-0 pt-0">
            <button type="button" className="btn btn-light" onClick={onClose}>
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
