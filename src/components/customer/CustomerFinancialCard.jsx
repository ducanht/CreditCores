import React from 'react';
import {
  User,
  CreditCard,
  MapPin,
  UserCheck,
  UserCog,
  Landmark,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Printer,
  FileText
} from 'lucide-react';
import { formatCurrencyVN, formatDateVN } from '../../utils/dateUtils';

// Helper rút gọn tiền tệ sang Tỷ / Triệu
const formatCompactVN = (amount) => {
  const num = Number(amount) || 0;
  if (Math.abs(num) >= 1e9) {
    const val = (num / 1e9).toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
    return `${val} tỷ`;
  }
  if (Math.abs(num) >= 1e6) {
    const val = (num / 1e6).toFixed(1).replace(/\.?0+$/, '').replace('.', ',');
    return `${val} tr`;
  }
  return num.toLocaleString('vi-VN') + ' đ';
};

export default function CustomerFinancialCard({
  customer,
  onOpenAssignModal,
  onNavigateToAppraisal,
  onNavigateToDebit,
  onOpenPrintDossier
}) {
  if (!customer) return null;

  const contracts = customer.contracts || [];
  const activeContracts = contracts.filter(
    (c) => c.trangThaiHD === 'DANG_VAY' || Number(c.duNo) > 0
  );
  const settledContracts = contracts.filter(
    (c) => c.trangThaiHD === 'DA_TAT_TOAN' || Number(c.duNo) === 0
  );

  const totalTienVay = contracts.reduce((sum, c) => sum + (Number(c.tienVay) || 0), 0);
  const totalDuNo = activeContracts.reduce((sum, c) => sum + (Number(c.duNo) || 0), 0);
  const hasSettledAll = activeContracts.length === 0 && contracts.length > 0;

  // Lấy 2 chữ cái đầu làm avatar
  const nameParts = (customer.hoTen || 'Khách Hàng').trim().split(/\s+/);
  const initials = nameParts.length >= 2
    ? (nameParts[nameParts.length - 2][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : (customer.hoTen ? customer.hoTen.slice(0, 2).toUpperCase() : 'KH');

  return (
    <div className="card-modern p-4 content-fade-in shadow-sm border-0">
      {/* 1. HEADER PROFILE VỚI AVATAR & THÔNG TIN CĂN CƯỚC */}
      <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          {/* Avatar Initials Pill */}
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white fw-bold fs-5 shadow-sm"
            style={{
              width: 52,
              height: 52,
              background: 'linear-gradient(135deg, #9ACD32 0%, #1e3a8a 100%)',
              flexShrink: 0
            }}
          >
            {initials}
          </div>

          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h4 className="fw-bold text-slate-900 m-0 font-heading">
                {customer.hoTen}
              </h4>
              <span className="badge bg-primary font-monospace fs-6 px-2 py-0.5">
                {customer.maKH}
              </span>
              <span className="badge bg-success-subtle text-success border border-success-subtle d-flex align-items-center gap-1">
                <ShieldCheck size={12} /> Nhóm 1 (Đủ tiêu chuẩn)
              </span>
              {hasSettledAll && (
                <span className="badge bg-secondary-subtle text-secondary border">
                  Đã tất toán toàn bộ
                </span>
              )}
            </div>

            <div className="d-flex align-items-center gap-3 text-muted small mt-1 flex-wrap">
              <span className="d-flex align-items-center gap-1">
                <CreditCard size={14} className="text-secondary" /> CCCD: <strong>{customer.cccd || customer.gttt || '---'}</strong>
              </span>
              <span>•</span>
              <span className="d-flex align-items-center gap-1">
                <MapPin size={14} className="text-secondary" /> {customer.diaChi || customer.khuVuc || 'Thôn Tân Lộc, Quý Lộc'}
              </span>
              {customer.dienThoai && (
                <>
                  <span>•</span>
                  <span>SĐT: <strong>{customer.dienThoai}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary fw-semibold d-flex align-items-center gap-1 shadow-sm"
            onClick={() => onOpenPrintDossier && onOpenPrintDossier(customer)}
            title="In hoặc xuất file Word hồ sơ tín dụng 360° khách hàng"
          >
            <Printer size={14} className="text-dark" /> In Hồ Sơ 360°
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-info fw-semibold d-flex align-items-center gap-1 shadow-sm"
            onClick={() => onOpenAssignModal && onOpenAssignModal(null, customer)}
            title="Gán hoặc đổi Cán bộ Tín dụng quản lý khách hàng này"
          >
            <UserCog size={14} /> Phân Công CBTD
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-primary fw-semibold d-flex align-items-center gap-1 shadow-sm"
            onClick={() => onNavigateToDebit && onNavigateToDebit(customer)}
            title="Thiết lập thỏa thuận ủy quyền trích nợ tự động CASA"
          >
            <Zap size={14} className="text-warning" /> Ủy Quyền CASA
          </button>

          <button
            type="button"
            className="btn btn-sm btn-brand fw-semibold d-flex align-items-center gap-1 shadow-sm"
            onClick={() => onNavigateToAppraisal && onNavigateToAppraisal(customer)}
            title="Khởi tạo thẩm định khoản vay mới"
          >
            <ArrowUpRight size={14} /> Thẩm Định Vay
          </button>
        </div>
      </div>

      {/* 2. CHỈ SỐ TÀI CHÍNH & SỨC KHỎE TÍN DỤNG 360° */}
      <div className="row g-3 mb-3">
        {/* Chỉ số 1: Dư Nợ Tín Dụng Hiện Tại */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 bg-light rounded-3 border h-100">
            <span className="text-muted small fw-medium text-uppercase d-block" style={{ fontSize: '0.72rem' }}>
              Dư Nợ Đang Vay
            </span>
            <h4 className="fw-bold text-danger m-0 mt-1 num-tabular fs-5">
              {formatCurrencyVN(totalDuNo)}
            </h4>
            <div className="text-xs text-muted mt-1">
              {activeContracts.length} hợp đồng có dư nợ
            </div>
          </div>
        </div>

        {/* Chỉ số 2: Tổng Hạn Mức Tín Dụng Lịch Sử */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 bg-light rounded-3 border h-100">
            <span className="text-muted small fw-medium text-uppercase d-block" style={{ fontSize: '0.72rem' }}>
              Tổng Vốn Đã Giải Ngân
            </span>
            <h4 className="fw-bold text-dark m-0 mt-1 num-tabular fs-5">
              {formatCompactVN(totalTienVay)}
            </h4>
            <div className="text-xs text-muted mt-1">
              {contracts.length} khế ước vay lũy kế
            </div>
          </div>
        </div>

        {/* Chỉ số 3: Vốn Góp Cổ Phần Thành Viên */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 bg-success-subtle rounded-3 border border-success-subtle h-100">
            <span className="text-success small fw-medium text-uppercase d-block" style={{ fontSize: '0.72rem' }}>
              Vốn Góp Cổ Phần
            </span>
            <h4 className="fw-bold text-success m-0 mt-1 num-tabular fs-5">
              {formatCurrencyVN(customer.tongTienCP || 0)}
            </h4>
            <div className="text-xs text-success mt-1">
              {customer.soCoPhan || 0} cổ phần thành viên
            </div>
          </div>
        </div>

        {/* Chỉ số 4: Cán Bộ Tín Dụng Phụ Trách */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 bg-primary-subtle rounded-3 border border-primary-subtle h-100">
            <span className="text-primary small fw-medium text-uppercase d-block" style={{ fontSize: '0.72rem' }}>
              CBTD Phụ Trách
            </span>
            <div className="fw-bold text-dark mt-1 text-truncate" title={customer.tenCBTD || 'Lê Văn Tín (CBTD)'}>
              {customer.tenCBTD || 'Lê Văn Tín (CBTD)'}
            </div>
            <div className="text-xs text-primary mt-1 font-monospace">
              {customer.cbtdPhuTrach || 'qtdyentho.cbtd'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. THÔNG TIN THÀNH VIÊN VÀ TÀI KHOẢN CASA NỘI BỘ */}
      <div className="p-3 rounded-3 bg-light-subtle border">
        <div className="row g-2 small">
          <div className="col-12 col-md-3">
            <span className="text-muted">Số Sổ Cổ Phần:</span>{' '}
            <strong className="font-monospace text-dark">{customer.soSoCP || 'CP-YENTHO'}</strong>
          </div>
          <div className="col-12 col-md-3">
            <span className="text-muted">Ngày Vào Quỹ:</span>{' '}
            <strong>{customer.ngayVaoQuy ? formatDateVN(customer.ngayVaoQuy) : '---'}</strong>
          </div>
          <div className="col-12 col-md-3">
            <span className="text-muted">Số TK CASA:</span>{' '}
            <strong className="font-monospace text-success">{customer.soTK || '---'}</strong>
          </div>
          <div className="col-12 col-md-3">
            <span className="text-muted">Đã Tất Toán:</span>{' '}
            <span className="badge bg-secondary text-white ms-1 font-monospace">
              {settledContracts.length} HĐ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
