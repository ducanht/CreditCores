import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  Printer,
  FileText,
  DollarSign,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar
} from 'lucide-react';
import { formatCurrencyVN, getTodayVN } from '../../utils/dateUtils';

export default function LoanStatementTable({ statementData = [], loading = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Lọc dữ liệu
  const filteredData = useMemo(() => {
    return statementData.filter((item) => {
      // Tìm kiếm theo số HĐ, mã KH, số TV, họ tên
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchSoHD = String(item.soHDTD || '').toLowerCase().includes(q);
        const matchMaKH = String(item.maKH || '').toLowerCase().includes(q);
        const matchSoTV = String(item.soTV || '').toLowerCase().includes(q);
        const matchHoTen = String(item.hoTen || '').toLowerCase().includes(q);
        if (!matchSoHD && !matchMaKH && !matchSoTV && !matchHoTen) return false;
      }

      // Lọc địa bàn
      if (areaFilter !== 'ALL') {
        const areaStr = String(item.khuVuc || '');
        if (areaFilter === 'YEN_THO' && !areaStr.includes('Yên Thọ')) return false;
        if (areaFilter === 'YEN_TRUONG' && !areaStr.includes('Yên Trường') && !areaStr.includes('Vĩnh Lộc')) return false;
        if (areaFilter === 'QUY_LOC' && !areaStr.includes('Quý Lộc') && !areaStr.includes('Yên Bái')) return false;
      }

      // Lọc trạng thái
      if (statusFilter !== 'ALL') {
        const st = String(item.trangThaiHD || '').toUpperCase();
        if (statusFilter === 'DANG_VAY' && (st === 'DA_TAT_TOAN' || Number(item.duNo) <= 0)) return false;
        if (statusFilter === 'DA_TAT_TOAN' && st !== 'DA_TAT_TOAN' && Number(item.duNo) > 0) return false;
      }

      // Lọc sản phẩm vay
      if (productFilter !== 'ALL') {
        const prod = String(item.maLoaiVay || item.moTaVay || '');
        if (productFilter === 'NONG_NGHIEP' && !prod.includes('Nông nghiệp') && !prod.includes('Chăn nuôi')) return false;
        if (productFilter === 'THUONG_MAI' && !prod.includes('Thương mại') && !prod.includes('Dịch vụ') && !prod.includes('Kinh doanh')) return false;
        if (productFilter === 'TIEU_DUNG' && !prod.includes('Tiêu dùng') && !prod.includes('Đời sống') && !prod.includes('nhà ở')) return false;
      }

      return true;
    });
  }, [statementData, searchTerm, areaFilter, statusFilter, productFilter]);

  // Tổng hợp sau khi lọc
  const summary = useMemo(() => {
    const totalRecords = filteredData.length;
    const totalTienVay = filteredData.reduce((acc, curr) => acc + (Number(curr.tienVay) || 0), 0);
    const totalDuNo = filteredData.reduce((acc, curr) => acc + (Number(curr.duNo) || 0), 0);
    const avgDuNo = totalRecords > 0 ? Math.round(totalDuNo / totalRecords) : 0;
    return { totalRecords, totalTienVay, totalDuNo, avgDuNo };
  }, [filteredData]);

  // Phân trang
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Xuất file CSV sao kê
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'BÁO CÁO SAO KÊ HỢP ĐỒNG TÍN DỤNG & DOANH SỐ CHO VAY (BC_DOANH_SO_TD)\n';
    csvContent += 'QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ\n';
    csvContent += `Thời điểm xuất: ${getTodayVN()} | Tổng số hợp đồng: ${filteredData.length}\n\n`;

    csvContent += 'STT,Số HĐTD,Mã KH,Số TV,Họ Tên Thành Viên,Tiền Vay (VNĐ),Dư Nợ (VNĐ),Lãi Suất (%/năm),Ngày Vay,Đến Hạn,Thời Hạn (Tháng),Sản Phẩm Vay,Địa Bàn,Trạng Thái\n';

    filteredData.forEach((item, idx) => {
      const isTatToan = String(item.trangThaiHD || '').toUpperCase() === 'DA_TAT_TOAN' || Number(item.duNo) <= 0;
      csvContent += `${idx + 1},"${item.soHDTD || ''}","'${item.maKH || ''}","'${item.soTV || ''}","${item.hoTen || ''}",${item.tienVay || 0},${item.duNo || 0},${item.laiSuat || 0},"${item.ngayVay || ''}","${item.denHan || ''}",${item.soThangVay || 0},"${item.maLoaiVay || ''}","${item.khuVuc || ''}","${isTatToan ? 'Đã tất toán' : 'Đang vay'}"\n`;
    });

    csvContent += `\nTỔNG CỘNG,,,"${summary.totalRecords} Hợp đồng",${summary.totalTienVay},${summary.totalDuNo},,,,,,\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SaoKe_HDTD_DoanhSo_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* 1. Thẻ Tóm Tắt Nhanh */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="p-3 rounded-3" style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-subtle)' }}>
            <span className="small text-muted fw-medium text-uppercase" style={{ fontSize: '0.72rem' }}>Tổng Số Món Sao Kê</span>
            <h4 className="fw-bold m-0 mt-1 num-tabular font-heading text-primary">
              {summary.totalRecords.toLocaleString('vi-VN')} <span className="fs-6 fw-normal text-muted">món</span>
            </h4>
            <div className="small text-muted mt-2" style={{ fontSize: '0.73rem' }}>
              Khế ước tín dụng trong danh mục
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="p-3 rounded-3" style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-subtle)' }}>
            <span className="small text-muted fw-medium text-uppercase" style={{ fontSize: '0.72rem' }}>Tổng Doanh Số Giải Ngân</span>
            <h4 className="fw-bold m-0 mt-1 num-tabular font-heading text-success">
              {formatCurrencyVN(summary.totalTienVay)}
            </h4>
            <div className="small text-muted mt-2" style={{ fontSize: '0.73rem' }}>
              Vốn vay phát sinh lũy kế
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="p-3 rounded-3" style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-subtle)' }}>
            <span className="small text-muted fw-medium text-uppercase" style={{ fontSize: '0.72rem' }}>Tổng Dư Nợ Hiện Hành</span>
            <h4 className="fw-bold m-0 mt-1 num-tabular font-heading text-danger">
              {formatCurrencyVN(summary.totalDuNo)}
            </h4>
            <div className="small text-muted mt-2" style={{ fontSize: '0.73rem' }}>
              Đang lưu hành tại các thành viên
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="p-3 rounded-3" style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-subtle)' }}>
            <span className="small text-muted fw-medium text-uppercase" style={{ fontSize: '0.72rem' }}>Dư Nợ Bình Quân / Món</span>
            <h4 className="fw-bold m-0 mt-1 num-tabular font-heading text-info">
              {formatCurrencyVN(summary.avgDuNo)}
            </h4>
            <div className="small text-muted mt-2" style={{ fontSize: '0.73rem' }}>
              Quy mô bình quân mỗi hợp đồng
            </div>
          </div>
        </div>
      </div>

      {/* 2. Thanh Lọc Đa Năng */}
      <div className="p-3 rounded-3" style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-subtle)' }}>
        <div className="row g-2 align-items-center">
          {/* Ô Tìm Kiếm */}
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-transparent border-end-0">
                <Search size={14} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Tìm Số HĐ, Mã KH, Số TV, Họ tên..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {/* Lọc Địa Bàn */}
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={areaFilter}
              onChange={(e) => { setAreaFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">Mọi Địa Bàn (3 Xã)</option>
              <option value="YEN_THO">Xã Yên Thọ</option>
              <option value="YEN_TRUONG">Xã Yên Trường / Vĩnh Lộc</option>
              <option value="QUY_LOC">Xã Quý Lộc / Yên Bái</option>
            </select>
          </div>

          {/* Lọc Trạng Thái */}
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">Tất Cả Trạng Thái</option>
              <option value="DANG_VAY">Đang Vay (Còn Dư Nợ)</option>
              <option value="DA_TAT_TOAN">Đã Tất Toán (Dư Nợ = 0)</option>
            </select>
          </div>

          {/* Lọc Sản Phẩm */}
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={productFilter}
              onChange={(e) => { setProductFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">Mọi Sản Phẩm Cho Vay</option>
              <option value="NONG_NGHIEP">Nông nghiệp & Chăn nuôi</option>
              <option value="THUONG_MAI">Thương mại & Dịch vụ</option>
              <option value="TIEU_DUNG">Tiêu dùng & Đời sống</option>
            </select>
          </div>

          {/* Xuất Nhanh CSV */}
          <div className="col-6 col-md-2 d-flex justify-content-end gap-1">
            <button
              className="btn btn-sm btn-outline-success d-flex align-items-center gap-1 w-100 justify-content-center"
              onClick={handleExportCSV}
              title="Xuất bảng tính sao kê Excel"
            >
              <FileSpreadsheet size={14} /> Xuất CSV
            </button>
          </div>
        </div>
      </div>

      {/* 3. Bảng Dữ Liệu Sao Kê */}
      <div className="card-modern p-0 overflow-hidden">
        <div className="table-responsive" style={{ maxHeight: '600px' }}>
          <table className="table table-custom table-hover align-middle small mb-0">
            <thead className="sticky-top" style={{ zIndex: 5, background: 'var(--bg-surface)' }}>
              <tr>
                <th style={{ width: '40px' }} className="text-center">STT</th>
                <th style={{ width: '120px' }}>Số HĐTD</th>
                <th style={{ width: '90px' }}>Mã KH / TV</th>
                <th>Họ Tên Thành Viên</th>
                <th className="text-end" style={{ width: '120px' }}>Tiền Vay (VNĐ)</th>
                <th className="text-end" style={{ width: '120px' }}>Dư Nợ Hiện Hành</th>
                <th className="text-center" style={{ width: '70px' }}>Lãi Suất</th>
                <th className="text-center" style={{ width: '90px' }}>Ngày Vay</th>
                <th className="text-center" style={{ width: '90px' }}>Đến Hạn</th>
                <th>Sản Phẩm Vay</th>
                <th>Địa Bàn</th>
                <th className="text-center" style={{ width: '95px' }}>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-5 text-muted">
                    <div className="empty-state-icon mx-auto mb-2"><FileSpreadsheet size={28} /></div>
                    <span>Không tìm thấy hợp đồng tín dụng phù hợp với bộ lọc</span>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const stt = (currentPage - 1) * pageSize + idx + 1;
                  const isTatToan = String(item.trangThaiHD || '').toUpperCase() === 'DA_TAT_TOAN' || Number(item.duNo) <= 0;
                  return (
                    <tr key={item.soHDTD || idx}>
                      <td className="text-center text-muted">{stt}</td>
                      <td>
                        <span className="font-monospace fw-semibold text-primary">{item.soHDTD}</span>
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-medium font-monospace">{item.maKH}</span>
                          {item.soTV && <span className="badge badge-brand-soft font-monospace" style={{ fontSize: '0.65rem' }}>TV: {item.soTV}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold">{item.hoTen}</div>
                        {item.diaChi && <div className="text-muted" style={{ fontSize: '0.72rem' }}>{item.diaChi}</div>}
                      </td>
                      <td className="text-end num-tabular fw-medium">
                        {formatCurrencyVN(item.tienVay)}
                      </td>
                      <td className="text-end num-tabular fw-bold text-danger">
                        {formatCurrencyVN(item.duNo)}
                      </td>
                      <td className="text-center num-tabular font-monospace">
                        {item.laiSuat ? `${Number(item.laiSuat).toFixed(1)}%` : '—'}
                      </td>
                      <td className="text-center num-tabular text-muted" style={{ fontSize: '0.78rem' }}>
                        {item.ngayVay || '—'}
                      </td>
                      <td className="text-center num-tabular text-muted" style={{ fontSize: '0.78rem' }}>
                        {item.denHan || '—'}
                      </td>
                      <td>
                        <span className="text-truncate d-inline-block" style={{ maxWidth: '140px' }} title={item.maLoaiVay || item.moTaVay}>
                          {item.maLoaiVay || item.moTaVay || 'Vay thành viên'}
                        </span>
                      </td>
                      <td>
                        <span className="text-truncate d-inline-block" style={{ maxWidth: '130px' }} title={item.khuVuc}>
                          {item.khuVuc || 'Xã Yên Thọ'}
                        </span>
                      </td>
                      <td className="text-center">
                        {isTatToan ? (
                          <span className="badge bg-secondary-subtle text-secondary border" style={{ fontSize: '0.7rem' }}>
                            Đã Tất Toán
                          </span>
                        ) : (
                          <span className="badge badge-success-soft" style={{ fontSize: '0.7rem' }}>
                            Đang Vay
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Dòng Tổng Cộng Dưới Chân Bảng */}
            {filteredData.length > 0 && (
              <tfoot className="fw-bold sticky-bottom" style={{ zIndex: 4, background: 'var(--bg-surface-soft)' }}>
                <tr>
                  <td colSpan={4} className="text-center text-uppercase">
                    TỔNG CỘNG ({summary.totalRecords} Món)
                  </td>
                  <td className="text-end num-tabular text-success">
                    {formatCurrencyVN(summary.totalTienVay)}
                  </td>
                  <td className="text-end num-tabular text-danger">
                    {formatCurrencyVN(summary.totalDuNo)}
                  </td>
                  <td colSpan={6}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Phân Trang */}
        <div className="d-flex justify-content-between align-items-center p-3 border-top" style={{ background: 'var(--bg-surface)' }}>
          <div className="d-flex align-items-center gap-2 small text-muted">
            <span>Hiển thị</span>
            <select
              className="form-select form-select-sm"
              style={{ width: '70px' }}
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>trên tổng số <strong>{filteredData.length}</strong> món</span>
          </div>

          <div className="d-flex align-items-center gap-1">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} /> Trước
            </button>
            <span className="small px-2">
              Trang <strong>{currentPage}</strong> / {totalPages}
            </span>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Sau <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
