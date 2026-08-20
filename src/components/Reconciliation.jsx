import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Upload,
  Search,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  Layers,
  HelpCircle,
  Filter,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrencyVN, formatDateVN, getTodayVN } from '../utils/dateUtils';
import Pagination from './Pagination';

export default function Reconciliation({ onOpenCustomerQuickView }) {
  const [selectedBatch, setSelectedBatch] = useState('DOT-202608-K1');
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'THANH_CONG' | 'TRICH_MOT_PHAN' | 'THAT_BAI'
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Danh sách kết quả đối soát mẫu chuẩn nghiệp vụ
  const [items, setItems] = useState([
    { maKH: 'KH008892', soHDTD: 'KU-2026-0312', hoTen: 'NGUYỄN VĂN AN', soTK: '0381000123456', phaiThu: 1643836, daTrich: 1643836, ketQua: 'THANH_CONG', lyDoLoi: '' },
    { maKH: 'KH004512', soHDTD: 'KU-2026-0145', hoTen: 'LÊ THỊ MAI', soTK: '0381000789123', phaiThu: 1732877, daTrich: 1732877, ketQua: 'THANH_CONG', lyDoLoi: '' },
    { maKH: 'KH001980', soHDTD: 'KU-2025-0811', hoTen: 'TRẦN VĂN QUÂN', soTK: '0381000998877', phaiThu: 14109589, daTrich: 4000000, ketQua: 'TRICH_MOT_PHAN', lyDoLoi: 'Số dư khả dụng chỉ còn 4,000,000 đ' },
    { maKH: 'KH007621', soHDTD: 'KU-2025-0982', hoTen: 'PHẠM VĂN ĐỨC', soTK: '0381000554433', phaiThu: 2850000, daTrich: 0, ketQua: 'THAT_BAI', lyDoLoi: 'Số dư tài khoản không đủ hạn mức' },
    { maKH: 'KH003319', soHDTD: 'KU-2026-0219', hoTen: 'HOÀNG THỊ THU', soTK: '0381000221144', phaiThu: 3420000, daTrich: 3420000, ketQua: 'THANH_CONG', lyDoLoi: '' },
    { maKH: 'KH005820', soHDTD: 'KU-2026-0402', hoTen: 'VŨ ĐÌNH LONG', soTK: '0381000667788', phaiThu: 5120000, daTrich: 0, ketQua: 'THAT_BAI', lyDoLoi: 'Tài khoản thanh toán đang tạm khóa' }
  ]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
    }
  };

  const handleProcessReconcile = async () => {
    setReconciling(true);
    try {
      const res = await api.reconcileUpload({
        maDot: selectedBatch,
        items: items
      });
      if (res.status === 'success') {
        setReconcileResult(res);
        alert(res.message || 'Đối soát số liệu thành công!');
      }
    } catch (e) {
      alert('Lỗi đối soát: ' + e.message);
    } finally {
      setReconciling(false);
    }
  };

  // 1. XUẤT EXCEL (.CSV ĐẦY ĐỦ DỮ LIỆU)
  const handleExportExcel = () => {
    let csv = '\uFEFF'; // UTF-8 BOM
    csv += 'BIÊN BẢN ĐỐI SOÁT KẾT QUẢ TRÍCH NỢ TỰ ĐỘNG COREBANKING\n';
    csv += 'QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ\n';
    csv += `Đợt trích nợ: ${selectedBatch} - Ngày xuất: ${getTodayVN()}\n\n`;

    const headers = ['STT', 'Mã Khách Hàng', 'Số Khế Ước / HĐTD', 'Họ Và Tên Khách Hàng', 'Số TK CASA', 'Số Tiền Phải Thu (VNĐ)', 'Đã Trích Thu (VNĐ)', 'Còn Nợ Tồn (VNĐ)', 'Kết Quả Hạch Toán', 'Ghi Chú / Lý Do Lỗi'];
    csv += headers.join(',') + '\n';

    items.forEach((it, idx) => {
      const conNo = Math.max(0, it.phaiThu - it.daTrich);
      const ketQuaText = it.ketQua === 'THANH_CONG' ? 'Đã trích đủ' : it.ketQua === 'TRICH_MOT_PHAN' ? 'Trích 1 phần' : 'Thất bại';
      csv += [
        idx + 1,
        `"${it.maKH}"`,
        `"${it.soHDTD}"`,
        `"${it.hoTen}"`,
        `"\t${it.soTK}"`,
        it.phaiThu,
        it.daTrich,
        conNo,
        `"${ketQuaText}"`,
        `"${it.lyDoLoi || 'Hoàn tất'}"`
      ].join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DoiSoat_${selectedBatch}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. XUẤT BIÊN BẢN WORD (.DOC HOÀN CHỈNH)
  const handleExportWord = () => {
    const successItems = items.filter(i => i.ketQua === 'THANH_CONG');
    const partialItems = items.filter(i => i.ketQua === 'TRICH_MOT_PHAN');
    const failedItems = items.filter(i => i.ketQua === 'THAT_BAI');

    const totalPhaiThuNum = items.reduce((s, i) => s + i.phaiThu, 0);
    const totalDaTrichNum = items.reduce((s, i) => s + i.daTrich, 0);
    const totalConNoNum = Math.max(0, totalPhaiThuNum - totalDaTrichNum);

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Biên Bản Đối Soát Trích Nợ</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; margin: 20px; }
          .header-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
          .title { text-align: center; font-weight: bold; font-size: 15pt; margin: 15px 0 5px; }
          .subtitle { text-align: center; font-style: italic; margin-bottom: 20px; font-size: 12pt; }
          table.data-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          table.data-table th, table.data-table td { border: 1px solid #000; padding: 6px 8px; font-size: 11pt; }
          table.data-table th { background-color: #f2f2f2; text-align: center; font-weight: bold; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .fw-bold { font-weight: bold; }
          .sig-table { width: 100%; margin-top: 40px; border-collapse: collapse; }
          .sig-table td { width: 50%; text-align: center; vertical-align: top; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 45%; text-align: center;">
              <strong>QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</strong><br/>
              Số: ....../BB-ĐSTN
            </td>
            <td style="width: 55%; text-align: center;">
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
              <u>Độc lập - Tự do - Hạnh phúc</u><br/>
              <em>Yên Thọ, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em>
            </td>
          </tr>
        </table>

        <div class="title">BIÊN BẢN ĐỐI SOÁT KẾT QUẢ TRÍCH NỢ TỰ ĐỘNG COREBANKING</div>
        <div class="subtitle">Đợt trích: ${selectedBatch} - Ngày hạch toán: ${getTodayVN()}</div>

        <p><strong>I. TỔNG HỢP KẾT QUẢ ĐỐI SOÁT:</strong></p>
        <ul>
          <li>Tổng số món dự kiến trích thu: <strong>${items.length} món</strong></li>
          <li>Tổng số tiền phải thu: <strong>${formatCurrencyVN(totalPhaiThuNum)}</strong></li>
          <li>Tổng số tiền đã trích thu thành công: <strong>${formatCurrencyVN(totalDaTrichNum)}</strong> (Tỷ lệ: ${((totalDaTrichNum / totalPhaiThuNum) * 100).toFixed(1)}%)</li>
          <li>Số món trích thu đủ 100%: <strong>${successItems.length} món</strong></li>
          <li>Số món trích thu 1 phần: <strong>${partialItems.length} món</strong> (Còn thiếu: ${formatCurrencyVN(partialItems.reduce((s, i) => s + (i.phaiThu - i.daTrich), 0))})</li>
          <li>Số món không trích thu được (Thất bại): <strong>${failedItems.length} món</strong> (Nợ tồn: ${formatCurrencyVN(failedItems.reduce((s, i) => s + i.phaiThu, 0))})</li>
        </ul>

        <p><strong>II. BẢNG CHI TIẾT ĐỐI SOÁT TỪNG HỢP ĐỒNG:</strong></p>
        <table class="data-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã KH</th>
              <th>Số HĐTD</th>
              <th>Họ Và Tên</th>
              <th>Số TK CASA</th>
              <th>Phải Thu (đ)</th>
              <th>Đã Trích (đ)</th>
              <th>Còn Nợ (đ)</th>
              <th>Kết Quả</th>
              <th>Ghi Chú</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="text-center">${it.maKH}</td>
                <td class="text-center">${it.soHDTD}</td>
                <td>${it.hoTen}</td>
                <td class="text-center">${it.soTK}</td>
                <td class="text-right">${formatCurrencyVN(it.phaiThu)}</td>
                <td class="text-right">${formatCurrencyVN(it.daTrich)}</td>
                <td class="text-right">${formatCurrencyVN(Math.max(0, it.phaiThu - it.daTrich))}</td>
                <td class="text-center">${it.ketQua === 'THANH_CONG' ? 'Trích đủ' : it.ketQua === 'TRICH_MOT_PHAN' ? '1 phần' : 'Thất bại'}</td>
                <td>${it.lyDoLoi || 'Đạt'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <table class="sig-table">
          <tr>
            <td>
              <strong>NGƯỜI LẬP BIÊN BẢN</strong><br/>
              <em>(Ký, ghi rõ họ tên)</em>
              <br/><br/><br/><br/>
            </td>
            <td>
              <strong>KẾ TOÁN TRƯỞNG / BAN ĐIỀU HÀNH</strong><br/>
              <em>(Ký, đóng dấu, ghi rõ họ tên)</em>
              <br/><br/><br/><br/>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BienBan_DoiSoat_${selectedBatch}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const successCount = items.filter((i) => i.ketQua === 'THANH_CONG').length;
  const partialCount = items.filter((i) => i.ketQua === 'TRICH_MOT_PHAN').length;
  const failedCount = items.filter((i) => i.ketQua === 'THAT_BAI').length;
  const totalCount = items.length;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

  const totalPhaiThu = items.reduce((sum, i) => sum + i.phaiThu, 0);
  const totalDaTrich = items.reduce((sum, i) => sum + i.daTrich, 0);
  const totalConNo = Math.max(0, totalPhaiThu - totalDaTrich);

  // Filtering
  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return items.filter((i) => {
      const matchSearch =
        !searchTerm ||
        i.hoTen?.toLowerCase().includes(term) ||
        i.maKH?.toLowerCase().includes(term) ||
        i.soTK?.toLowerCase().includes(term) ||
        i.soHDTD?.toLowerCase().includes(term);

      const matchFilter = activeFilter === 'ALL' || i.ketQua === activeFilter;
      return matchSearch && matchFilter;
    });
  }, [items, searchTerm, activeFilter]);

  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="d-flex flex-column gap-3">
      {/* 1. Sleek Single-Row Control & Compact Icon Export Toolbar */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center flex-wrap gap-2">
          {/* Chọn đợt trích nợ */}
          <div className="d-flex align-items-center gap-1.5">
            <span className="small text-muted fw-medium d-none d-sm-inline" style={{ fontSize: '0.78rem' }}>Đợt:</span>
            <select
              className="form-select form-select-sm fw-medium"
              style={{ width: 175 }}
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="DOT-202608-K1">Kỳ 1 (05/08/2026)</option>
              <option value="DOT-202608-K2">Kỳ 2 (15/08/2026)</option>
              <option value="DOT-202608-K3">Kỳ 3 (25/08/2026)</option>
            </select>
          </div>

          {/* Chọn tệp kết quả */}
          <div className="d-flex align-items-center gap-1">
            <input
              type="file"
              id="reconcileFileInput"
              className="d-none"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="reconcileFileInput"
              className="btn btn-sm btn-light border d-flex align-items-center gap-1.5 px-2.5 text-truncate"
              style={{ maxWidth: 210, cursor: 'pointer', height: '32px' }}
              title={uploadedFileName || 'Chọn tệp hạch toán (.xlsx, .csv)'}
            >
              <Upload size={13} className="text-muted flex-shrink-0" />
              <span className="small text-truncate" style={{ fontSize: '0.78rem' }}>
                {uploadedFileName || 'Chọn tệp kết quả...'}
              </span>
            </label>
          </div>

          {/* Nút Chạy đối soát */}
          <button
            type="button"
            className="btn btn-sm btn-brand fw-medium d-flex align-items-center gap-1 text-white shadow-sm"
            style={{ height: '32px' }}
            onClick={handleProcessReconcile}
            disabled={reconciling}
          >
            <CheckCircle2 size={14} />
            <span>{reconciling ? 'Đang chạy...' : 'Đối Soát'}</span>
          </button>
        </div>

        {/* Action Icon Group (Word, Excel, PDF, Print, Reload) */}
        <div className="d-flex align-items-center gap-1.5">
          {/* Nút Xuất Excel (.csv / .xlsx) */}
          <button
            type="button"
            className="btn btn-sm btn-outline-success p-1.5 rounded-2 d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px' }}
            onClick={handleExportExcel}
            title="Xuất bảng tính Excel (.csv)"
          >
            <FileSpreadsheet size={15} />
          </button>

          {/* Nút Xuất Word (.docx / .doc) */}
          <button
            type="button"
            className="btn btn-sm btn-outline-primary p-1.5 rounded-2 d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px' }}
            onClick={handleExportWord}
            title="Xuất biên bản đối soát Word (.doc)"
          >
            <FileText size={15} />
          </button>

          {/* Nút In / PDF */}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary p-1.5 rounded-2 d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px' }}
            onClick={() => window.print()}
            title="In / Xuất file PDF chuẩn A4"
          >
            <Printer size={15} />
          </button>
        </div>
      </div>

      {/* 2. Executive 4 Bento Stat Cards Row */}
      <div className="row g-3">
        {/* Card 1: Tỷ lệ thu hồi */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card-modern p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                  Tỷ Lệ Thu Hồi
                </span>
                <h4 className="fw-semibold text-slate-900 m-0 mt-1 num-tabular font-heading fs-4">
                  {totalDaTrich > 0 ? ((totalDaTrich / totalPhaiThu) * 100).toFixed(1) : 0}%
                </h4>
              </div>
              <span className="badge bg-success-subtle text-success small fw-medium">
                {formatCurrencyVN(totalDaTrich)}
              </span>
            </div>
            <div className="progress mt-2" style={{ height: 4, borderRadius: 99 }}>
              <div className="progress-bar bg-success" style={{ width: `${(totalDaTrich / totalPhaiThu) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Card 2: Trích đủ */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className={`card-modern p-3 h-100 d-flex flex-column justify-content-between cursor-pointer ${activeFilter === 'THANH_CONG' ? 'border-success' : ''}`}
            onClick={() => { setActiveFilter('THANH_CONG'); setPage(1); }}
            title="Bấm để lọc danh sách trích đủ"
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                  Trích Đủ (Thành Công)
                </span>
                <h4 className="fw-semibold text-success m-0 mt-1 num-tabular font-heading fs-4">
                  {successCount} món
                </h4>
              </div>
              <div className="p-1.5 rounded bg-success-subtle text-success">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="small text-muted mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span>Thu đủ: <strong className="text-dark num-tabular">{formatCurrencyVN(items.filter(i => i.ketQua === 'THANH_CONG').reduce((s, i) => s + i.daTrich, 0))}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 3: Trích 1 phần */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className={`card-modern p-3 h-100 d-flex flex-column justify-content-between cursor-pointer ${activeFilter === 'TRICH_MOT_PHAN' ? 'border-warning' : ''}`}
            onClick={() => { setActiveFilter('TRICH_MOT_PHAN'); setPage(1); }}
            title="Bấm để lọc danh sách trích 1 phần"
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                  Trích Một Phần
                </span>
                <h4 className="fw-semibold text-warning m-0 mt-1 num-tabular font-heading fs-4">
                  {partialCount} món
                </h4>
              </div>
              <div className="p-1.5 rounded bg-warning-subtle text-warning">
                <AlertCircle size={16} />
              </div>
            </div>
            <div className="small text-muted mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span>Còn thiếu: <strong className="text-danger num-tabular">{formatCurrencyVN(items.filter(i => i.ketQua === 'TRICH_MOT_PHAN').reduce((s, i) => s + (i.phaiThu - i.daTrich), 0))}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 4: Chưa trích được */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className={`card-modern p-3 h-100 d-flex flex-column justify-content-between cursor-pointer ${activeFilter === 'THAT_BAI' ? 'border-danger' : ''}`}
            onClick={() => { setActiveFilter('THAT_BAI'); setPage(1); }}
            title="Bấm để lọc danh sách thất bại"
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                  Chưa Trích Được
                </span>
                <h4 className="fw-semibold text-danger m-0 mt-1 num-tabular font-heading fs-4">
                  {failedCount} món
                </h4>
              </div>
              <div className="p-1.5 rounded bg-danger-subtle text-danger">
                <XCircle size={16} />
              </div>
            </div>
            <div className="small text-muted mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span>Nợ tồn: <strong className="text-danger num-tabular">{formatCurrencyVN(items.filter(i => i.ketQua === 'THAT_BAI').reduce((s, i) => s + i.phaiThu, 0))}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Reconcile Table & Filter Tabs */}
      <div className="card-modern p-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          {/* Sub-tab pills */}
          <div className="btn-group btn-group-sm p-0.5 bg-light rounded-2 border" role="group">
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === 'ALL' ? 'btn-brand fw-medium text-white' : 'btn-light text-muted'}`}
              onClick={() => { setActiveFilter('ALL'); setPage(1); }}
            >
              Tất Cả ({items.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === 'THANH_CONG' ? 'btn-brand fw-medium text-white' : 'btn-light text-muted'}`}
              onClick={() => { setActiveFilter('THANH_CONG'); setPage(1); }}
            >
              Đã Trích Đủ ({successCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === 'TRICH_MOT_PHAN' ? 'btn-brand fw-medium text-white' : 'btn-light text-muted'}`}
              onClick={() => { setActiveFilter('TRICH_MOT_PHAN'); setPage(1); }}
            >
              Trích 1 Phần ({partialCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === 'THAT_BAI' ? 'btn-brand fw-medium text-white' : 'btn-light text-muted'}`}
              onClick={() => { setActiveFilter('THAT_BAI'); setPage(1); }}
            >
              Thất Bại ({failedCount})
            </button>
          </div>

          {/* Search bar */}
          <div className="input-group input-group-sm" style={{ maxWidth: 260 }}>
            <span className="input-group-text bg-light border-end-0">
              <Search size={13} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Tìm khách hàng, số HĐTD..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="table table-custom align-middle small">
            <thead>
              <tr>
                <th>Mã KH</th>
                <th>Số Khế Ước</th>
                <th>Khách Hàng</th>
                <th>Số TK CASA</th>
                <th className="text-end">Phải Thu</th>
                <th className="text-end">Đã Trích</th>
                <th className="text-end">Còn Nợ (Tồn)</th>
                <th className="text-center">Kết Quả</th>
                <th>Lý Do / Ghi Chú</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map((it, idx) => {
                  const conNo = Math.max(0, it.phaiThu - it.daTrich);
                  return (
                    <tr key={idx}>
                      <td className="fw-medium font-monospace">
                        <button
                          type="button"
                          className="btn btn-link p-0 fw-medium font-monospace text-decoration-none text-primary"
                          onClick={() => onOpenCustomerQuickView && onOpenCustomerQuickView({ maKH: it.maKH, hoTen: it.hoTen })}
                        >
                          {it.maKH}
                        </button>
                      </td>
                      <td className="font-monospace text-muted">{it.soHDTD}</td>
                      <td className="fw-medium text-slate-900">{it.hoTen}</td>
                      <td className="font-monospace text-muted">{it.soTK}</td>
                      <td className="text-end num-tabular fw-medium">{formatCurrencyVN(it.phaiThu)}</td>
                      <td className="text-end num-tabular text-success fw-medium">{formatCurrencyVN(it.daTrich)}</td>
                      <td className="text-end num-tabular text-danger fw-medium">{formatCurrencyVN(conNo)}</td>
                      <td className="text-center">
                        {it.ketQua === 'THANH_CONG' ? (
                          <span className="badge bg-success-subtle text-success">Đã trích đủ</span>
                        ) : it.ketQua === 'TRICH_MOT_PHAN' ? (
                          <span className="badge bg-warning-subtle text-warning">Trích 1 phần</span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger">Thất bại</span>
                        )}
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {it.lyDoLoi || 'Hoàn tất'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-4">
                    Không có kết quả đối soát phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalItems={filteredItems.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
