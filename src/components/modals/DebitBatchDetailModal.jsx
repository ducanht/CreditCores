import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Printer,
  Download,
  Search,
  Filter,
  FileSpreadsheet,
  Calendar,
  Layers,
  Clock,
  UserCheck,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { formatCurrencyVN, formatDateVN, getTodayVN } from '../../utils/dateUtils';
import Pagination from '../Pagination';

export default function DebitBatchDetailModal({
  show,
  onClose,
  batch = null,
  onUpdateItem,
  onDeleteBatch,
  onOpenCustomerQuickView
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ trangThai: '', daTrich: 0, maGiaoDichCore: '', lyDo: '' });
  const [savingItem, setSavingItem] = useState(false);

  if (!show || !batch) return null;

  const items = batch.items || batch.chiTietDanhSach || [];

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      item.hoTen?.toLowerCase().includes(term) ||
      item.maKH?.toLowerCase().includes(term) ||
      item.soTK?.toLowerCase().includes(term) ||
      item.soHDTD?.toLowerCase().includes(term);

    const matchStatus = filterStatus === 'ALL' || item.trangThai === filterStatus;
    return matchSearch && matchStatus;
  });

  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const totalPhaiThu = items.reduce((sum, i) => sum + (i.soTienTrich || i.tongDuKien || 0), 0);
  const totalDaTrich = items.reduce((sum, i) => sum + (i.daTrich || 0), 0);
  const totalConNo = Math.max(0, totalPhaiThu - totalDaTrich);

  // 1. XUẤT CSV ĐẦY ĐỦ THÔNG TIN NỘI BỘ
  const handleExportCSV = () => {
    const headers = ['Mã KH', 'Họ Tên', 'Số TK CASA', 'Số HĐTD', 'Dư Nợ Gốc', 'Lãi Phải Thu', 'Gốc Đến Hạn', 'Nợ Tồn', 'Tổng Phải Thu', 'Đã Trích', 'Trạng Thái'];
    const rows = items.map((i) => [
      `"${i.maKH || ''}"`,
      `"${i.hoTen || ''}"`,
      `"\t${i.soTK || ''}"`,
      `"${i.soHDTD || ''}"`,
      i.tongDuNo || 0,
      i.laiPhatSinh || 0,
      i.gocDenHan || 0,
      i.noTon || 0,
      i.soTienTrich || i.tongDuKien || 0,
      i.daTrich || 0,
      `"${i.trangThai || 'CHUA_XU_LY'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BANG_KE_TRICH_NO_${batch.maDot || 'DOT'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 2. XUẤT TỆP LỆNH TRÍCH NỢ CHO COREBANKING / CO-OPBANK
  const handleExportCoreBankingCSV = () => {
    const headers = ['STT', 'Số Tài Khoản CASA', 'Tên Chủ Tài Khoản', 'Số Tiền Trích Nợ (VNĐ)', 'Nội Dung Trích Nợ', 'Số Hợp Đồng Vay'];
    const rows = items.map((i, idx) => [
      idx + 1,
      `"\t${i.soTK || ''}"`,
      `"${i.hoTen || ''}"`,
      i.soTienTrich || i.tongDuKien || 0,
      `"TRICH NO KY ${batch.kyTrich || 1} THANG ${batch.thangNam || ''} HD ${i.soHDTD || ''}"`,
      `"${i.soHDTD || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LENH_TRICH_COREBANKING_${batch.maDot || 'DOT'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 3. XUẤT BẢNG KÊ WORD (.DOC) CHUẨN A4 HÀNH CHÍNH
  const handleExportWord = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Bảng Kê Trích Nợ - ${batch.maDot}</title>
        <style>
          @page Section1 { size: 595.3pt 841.9pt; margin: 1.8cm 1.5cm 1.8cm 1.5cm; }
          div.Section1 { page: Section1; }
          body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.35; color: #000; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .title { text-align: center; font-size: 14pt; font-weight: bold; margin: 10px 0 3px; text-transform: uppercase; }
          .subtitle { text-align: center; font-size: 11pt; font-style: italic; margin-bottom: 15px; }
          .data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .data-table th, .data-table td { border: 1px solid #000; padding: 5px 6px; font-size: 10pt; }
          .data-table th { background-color: #f2f2f2; text-align: center; font-weight: bold; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .fw-bold { font-weight: bold; }
          .sig-table { width: 100%; margin-top: 30px; border-collapse: collapse; page-break-inside: avoid; }
          .sig-table td { width: 33.33%; text-align: center; vertical-align: top; font-size: 11pt; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <table class="header-table">
            <tr>
              <td style="width: 50%; text-align: center; vertical-align: top;">
                <strong>QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</strong><br/>
                Địa chỉ: Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hoá<br/>
                Số: ....../BK-TN-YENTHO
              </td>
              <td style="width: 50%; text-align: center; vertical-align: top;">
                <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
                <strong>Độc lập - Tự do - Hạnh phúc</strong><br/>
                -------------------<br/>
                <em>Quý Lộc, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em>
              </td>
            </tr>
          </table>

          <div class="title">BẢNG KÊ THU HỒI NỢ TỰ ĐỘNG TÀI KHOẢN THANH TOÁN (CASA)</div>
          <div class="subtitle">Đợt trích: <strong>${batch.maDot}</strong> • Kỳ trích: <strong>Kỳ ${batch.kyTrich}</strong> • Tháng thu nợ: <strong>${batch.thangNam}</strong></div>

          <p><strong>I. TỔNG HỢP KẾT QUẢ ĐỢT TRÍCH NỢ:</strong></p>
          <ul>
            <li>Tổng số món trích thu: <strong>${items.length} món</strong></li>
            <li>Tổng số tiền phải thu theo kế hoạch: <strong>${formatCurrencyVN(totalPhaiThu)}</strong></li>
            <li>Tổng số tiền đã trích thu thành công: <strong>${formatCurrencyVN(totalDaTrich)}</strong> (Tỷ lệ: ${totalPhaiThu > 0 ? ((totalDaTrich / totalPhaiThu) * 100).toFixed(1) : 0}%)</li>
            <li>Tổng số tiền nợ tồn đọng chuyển kỳ sau: <strong>${formatCurrencyVN(totalConNo)}</strong></li>
          </ul>

          <p><strong>II. BẢNG CHI TIẾT CÁC MÓN TRÍCH NỢ TỰ ĐỘNG:</strong></p>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 5%;">STT</th>
                <th style="width: 10%;">Mã KH</th>
                <th style="width: 22%;">Họ Và Tên Khách Hàng</th>
                <th style="width: 15%;">Số TK CASA</th>
                <th style="width: 14%;">Số HĐTD</th>
                <th style="width: 17%;" class="text-right">Số Tiền Phải Thu</th>
                <th style="width: 17%;" class="text-right">Đã Trích</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((it, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td class="text-center">${it.maKH || ''}</td>
                  <td><strong>${it.hoTen || ''}</strong></td>
                  <td class="text-center">${it.soTK || ''}</td>
                  <td class="text-center">${it.soHDTD || ''}</td>
                  <td class="text-right fw-bold">${formatCurrencyVN(it.soTienTrich || it.tongDuKien || 0)}</td>
                  <td class="text-right">${formatCurrencyVN(it.daTrich || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <th colspan="5" class="text-right">TỔNG CỘNG:</th>
                <th class="text-right">${formatCurrencyVN(totalPhaiThu)}</th>
                <th class="text-right">${formatCurrencyVN(totalDaTrich)}</th>
              </tr>
            </tfoot>
          </table>

          <table class="sig-table">
            <tr>
              <td>
                <strong>NGƯỜI LẬP BẢNG</strong><br/>
                <em>(Ký, ghi rõ họ tên)</em>
                <br/><br/><br/><br/>
                <strong>Cán bộ tín dụng</strong>
              </td>
              <td>
                <strong>KẾ TOÁN TRƯỞNG</strong><br/>
                <em>(Ký, ghi rõ họ tên)</em>
                <br/><br/><br/><br/>
                <strong>.....................................</strong>
              </td>
              <td>
                <strong>GIÁM ĐỐC QUỸ</strong><br/>
                <em>(Ký, đóng dấu)</em>
                <br/><br/><br/><br/>
                <strong>.....................................</strong>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BANG_KE_TRICH_NO_${batch.maDot || 'DOT'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStartEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      trangThai: item.trangThai || 'CHUA_XU_LY',
      daTrich: item.daTrich !== undefined ? item.daTrich : (item.trangThai === 'THANH_CONG' ? (item.soTienTrich || item.tongDuKien || 0) : 0),
      maGiaoDichCore: item.maGiaoDichCore || '',
      lyDo: item.lyDo || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !onUpdateItem) return;
    setSavingItem(true);
    try {
      await onUpdateItem({
        maDot: batch.maDot,
        soHDTD: editingItem.soHDTD,
        maKH: editingItem.maKH,
        trangThai: editForm.trangThai,
        daTrich: Number(editForm.daTrich) || 0,
        maGiaoDichCore: editForm.maGiaoDichCore,
        lyDo: editForm.lyDo
      });
      setEditingItem(null);
    } catch (err) {
      alert('Lỗi cập nhật: ' + err.message);
    } finally {
      setSavingItem(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1055 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-4">
          {/* Header */}
          <div className="modal-header border-0 pb-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="modal-title fw-bold text-slate-900 font-heading d-flex align-items-center gap-2">
                <Zap size={20} className="text-warning" />
                Chi Tiết Đợt Trích Nợ: <span className="text-primary font-monospace">{batch.maDot}</span>
              </h5>
              <div className="text-muted small mt-0.5">
                Kỳ {batch.kyTrich} • Tháng {batch.thangNam} • Ngày tạo: {batch.ngayTao || getTodayVN()}
              </div>
            </div>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-outline-success btn-sm fw-semibold d-flex align-items-center gap-1 shadow-sm"
                onClick={handleExportCoreBankingCSV}
                title="Xuất file lệnh trích nợ tự động nộp CoreBanking / Co-opBank"
              >
                <Download size={14} /> File CoreBanking
              </button>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm fw-semibold d-flex align-items-center gap-1 shadow-sm"
                onClick={handleExportWord}
                title="Xuất bản in Microsoft Word (.doc) có khối ký duyệt"
              >
                <FileSpreadsheet size={14} /> Xuất Word
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm fw-semibold d-flex align-items-center gap-1 shadow-sm"
                onClick={handleExportCSV}
                title="Xuất dữ liệu Excel / CSV toàn diện"
              >
                <Download size={14} /> CSV Chi Tiết
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm fw-semibold d-flex align-items-center gap-1 shadow-sm"
                onClick={handlePrint}
              >
                <Printer size={14} /> In Bảng Kê
              </button>
              {onDeleteBatch && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm fw-semibold d-flex align-items-center gap-1 shadow-sm"
                  onClick={() => {
                    onDeleteBatch(batch);
                    onClose();
                  }}
                  title="Xóa toàn bộ đợt trích nợ này"
                >
                  <Trash2 size={14} /> Xóa Đợt
                </button>
              )}
              <button type="button" className="btn-close ms-2" onClick={onClose} />
            </div>
          </div>

          <div className="modal-body py-3">
            {/* KPI Summary Cards */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6 col-md-3">
                <div className="p-3 bg-light rounded-3 border">
                  <span className="text-muted small d-block">Tổng Số Món Trích</span>
                  <h4 className="fw-bold text-dark m-0 num-tabular">{items.length} món</h4>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-md-3">
                <div className="p-3 bg-light rounded-3 border">
                  <span className="text-muted small d-block">Tổng Tiền Phải Thu</span>
                  <h4 className="fw-bold text-primary m-0 num-tabular">{formatCurrencyVN(totalPhaiThu)}</h4>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-md-3">
                <div className="p-3 bg-light rounded-3 border">
                  <span className="text-muted small d-block">Đã Trích Thành Công</span>
                  <h4 className="fw-bold text-success m-0 num-tabular">{formatCurrencyVN(totalDaTrich)}</h4>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-md-3">
                <div className="p-3 bg-light rounded-3 border">
                  <span className="text-muted small d-block">Còn Lại (Nợ Tồn)</span>
                  <h4 className="fw-bold text-danger m-0 num-tabular">{formatCurrencyVN(totalConNo)}</h4>
                </div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div className="input-group input-group-sm" style={{ maxWidth: 320 }}>
                <span className="input-group-text bg-light border-end-0">
                  <Search size={14} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Tìm khách hàng, số TK, hợp đồng..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="d-flex align-items-center gap-2">
                <select
                  className="form-select form-select-sm"
                  style={{ width: 180 }}
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="THANH_CONG">Đã trích đủ (Thành công)</option>
                  <option value="TRICH_MOT_PHAN">Trích một phần</option>
                  <option value="THAT_BAI">Trích thất bại</option>
                  <option value="CHUA_XU_LY">Chưa xử lý (Chờ trích)</option>
                </select>
              </div>
            </div>

            {/* Table Detail */}
            {items.length === 0 ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary spinner-border-sm mb-2" role="status"></div>
                <div className="text-muted small">Đang nạp chi tiết các món trích nợ từ CSDL Google Sheets...</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-custom align-middle small">
                  <thead>
                    <tr>
                      <th>Mã KH</th>
                      <th>Họ và Tên</th>
                      <th>Số TK CASA</th>
                      <th>Số HĐTD</th>
                      <th className="text-end">Dư Nợ Gốc</th>
                      <th className="text-end">Lãi TT14</th>
                      <th className="text-end">Nợ Tồn</th>
                      <th className="text-end">Phải Thu</th>
                      <th className="text-end">Đã Trích</th>
                      <th className="text-center">Kết Quả</th>
                      {onUpdateItem && <th className="text-center" style={{ width: 90 }}>Thao Tác</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.length > 0 ? (
                      paginatedItems.map((item, idx) => {
                        const isEditing = editingItem && ((editingItem.soHDTD && editingItem.soHDTD === item.soHDTD) || (editingItem.maKH === item.maKH));
                        return (
                          <React.Fragment key={idx}>
                            <tr>
                              <td className="fw-bold font-monospace">
                                <button
                                  type="button"
                                  className="btn btn-link p-0 fw-bold font-monospace text-decoration-none text-primary"
                                  onClick={() => onOpenCustomerQuickView && onOpenCustomerQuickView({ maKH: item.maKH, hoTen: item.hoTen })}
                                >
                                  {item.maKH}
                                </button>
                              </td>
                              <td className="fw-semibold text-slate-900">{item.hoTen}</td>
                              <td className="font-monospace text-muted">{item.soTK}</td>
                              <td className="font-monospace text-muted">{item.soHDTD}</td>
                              <td className="text-end num-tabular">{formatCurrencyVN(item.tongDuNo)}</td>
                              <td className="text-end num-tabular text-primary">{formatCurrencyVN(item.laiPhatSinh)}</td>
                              <td className="text-end num-tabular text-danger">{formatCurrencyVN(item.noTon)}</td>
                              <td className="text-end fw-bold num-tabular">{formatCurrencyVN(item.soTienTrich || item.tongDuKien)}</td>
                              <td className="text-end fw-bold text-success num-tabular">{formatCurrencyVN(item.daTrich || 0)}</td>
                              <td className="text-center">
                                {item.trangThai === 'THANH_CONG' ? (
                                  <span className="badge bg-success-subtle text-success">Đã trích đủ</span>
                                ) : item.trangThai === 'TRICH_MOT_PHAN' ? (
                                  <span className="badge bg-warning-subtle text-warning">Trích 1 phần</span>
                                ) : item.trangThai === 'THAT_BAI' ? (
                                  <span className="badge bg-danger-subtle text-danger" title={item.lyDo || 'Không đủ số dư'}>
                                    Thất bại
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary-subtle text-secondary">Chờ trích</span>
                                )}
                              </td>
                              {onUpdateItem && (
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className={`btn btn-sm py-0 px-2 ${isEditing ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => isEditing ? setEditingItem(null) : handleStartEdit(item)}
                                    title={isEditing ? 'Đóng chế độ sửa' : 'Cập nhật kết quả trích nợ'}
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                </td>
                              )}
                            </tr>
                            {isEditing && (
                              <tr className="bg-light">
                                <td colSpan={onUpdateItem ? 11 : 10} className="p-3 border-bottom">
                                  <div className="card p-3 border shadow-sm">
                                    <h6 className="fw-bold text-primary mb-2 small">
                                      Cập Nhật Kết Quả Trích Nợ: {item.hoTen} ({item.soHDTD})
                                    </h6>
                                    <div className="row g-2 align-items-end">
                                      <div className="col-md-3">
                                        <label className="form-label small text-muted mb-1">Trạng Thái Kết Quả</label>
                                        <select
                                          className="form-select form-select-sm"
                                          value={editForm.trangThai}
                                          onChange={(e) => {
                                            const newSt = e.target.value;
                                            setEditForm(prev => ({
                                              ...prev,
                                              trangThai: newSt,
                                              daTrich: newSt === 'THANH_CONG' ? (item.soTienTrich || item.tongDuKien || 0) : (newSt === 'THAT_BAI' ? 0 : prev.daTrich)
                                            }));
                                          }}
                                        >
                                          <option value="THANH_CONG">Đã trích đủ (Thành công)</option>
                                          <option value="TRICH_MOT_PHAN">Trích một phần</option>
                                          <option value="THAT_BAI">Trích thất bại (Không đủ số dư)</option>
                                          <option value="CHUA_XU_LY">Chờ trích (Chưa xử lý)</option>
                                        </select>
                                      </div>
                                      <div className="col-md-3">
                                        <label className="form-label small text-muted mb-1">Số Tiền Thực Trích (VNĐ)</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm font-monospace"
                                          value={editForm.daTrich}
                                          onChange={(e) => setEditForm(prev => ({ ...prev, daTrich: e.target.value }))}
                                          placeholder="0"
                                        />
                                      </div>
                                      <div className="col-md-3">
                                        <label className="form-label small text-muted mb-1">Mã Giao Dịch Core (Ref)</label>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm font-monospace"
                                          value={editForm.maGiaoDichCore}
                                          onChange={(e) => setEditForm(prev => ({ ...prev, maGiaoDichCore: e.target.value }))}
                                          placeholder="VD: FT2609..."
                                        />
                                      </div>
                                      <div className="col-md-3 d-flex gap-2">
                                        <button
                                          type="button"
                                          className="btn btn-primary btn-sm flex-fill fw-bold d-inline-flex align-items-center justify-content-center gap-1"
                                          onClick={handleSaveEdit}
                                          disabled={savingItem}
                                        >
                                          {savingItem ? <Loader2 size={13} className="fa-spin" /> : <Check size={13} />} Lưu
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary btn-sm"
                                          onClick={() => setEditingItem(null)}
                                        >
                                          <X size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={onUpdateItem ? 11 : 10} className="text-center text-muted py-3">
                          Không có bản ghi phù hợp với điều kiện tìm kiếm.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {items.length > 0 && (
              <Pagination
                currentPage={page}
                totalItems={filteredItems.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            )}
          </div>

          <div className="modal-footer border-0 pt-0">
            <button type="button" className="btn btn-light btn-sm px-4 fw-semibold" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
