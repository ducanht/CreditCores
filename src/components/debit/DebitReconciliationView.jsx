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
  Calendar,
  Layers,
  Filter,
  Check,
  ShieldCheck,
  Lock,
  ChevronDown
} from 'lucide-react';
import { api } from '../../services/api';
import { formatCurrencyVN, formatDateVN, getTodayVN } from '../../utils/dateUtils';
import Pagination from '../Pagination';
import { StatusBadge, EmptyState } from '../shared';

export default function DebitReconciliationView({
  batches = [],
  initialBatchId,
  onBatchUpdated,
  onOpenCustomerQuickView
}) {
  const [selectedBatch, setSelectedBatch] = useState(initialBatchId || '');
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'THANH_CONG' | 'TRICH_MOT_PHAN' | 'THAT_BAI'
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [items, setItems] = useState([]);

  // Tự động chọn đợt đầu tiên nếu chưa chọn
  useEffect(() => {
    if (!selectedBatch && batches && batches.length > 0) {
      const first = batches[0].maDot;
      setSelectedBatch(first);
      loadBatchItems(first);
    } else if (initialBatchId && initialBatchId !== selectedBatch) {
      setSelectedBatch(initialBatchId);
      loadBatchItems(initialBatchId);
    }
  }, [batches, initialBatchId]);

  const loadBatchItems = async (batchId) => {
    if (!batchId) {
      setItems([]);
      return;
    }
    setLoadingItems(true);
    try {
      const res = await api.getDebitBatchDetails(batchId, true);
      if (res.status === 'success' && Array.isArray(res.data)) {
        const mapped = res.data.map((item) => {
          const phaiThu = Number(item.soTienTrich || item.tongDuKien || item.phaiThu || item.tongPhaiThu) || 0;
          let daTrich = Number(item.daTrich !== undefined ? item.daTrich : 0);
          let ketQua = item.trangThai || item.ketQua || 'CHUA_XU_LY';
          if (ketQua === 'THANH_CONG' && daTrich === 0) {
            daTrich = phaiThu;
          }
          return {
            maKH: item.maKH || '',
            soHDTD: item.soHDTD || '',
            hoTen: item.hoTen || '',
            soTK: item.soTK || '',
            diaChi: item.diaChi || '',
            phaiThu: phaiThu,
            daTrich: daTrich,
            ketQua: ketQua,
            lyDoLoi: item.lyDo || item.lyDoLoi || '',
            maGiaoDichCore: item.maGiaoDichCore || ''
          };
        });
        setItems(mapped);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Lỗi nạp chi tiết đợt trích nợ:', err);
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const currentBatchObj = useMemo(() => {
    return batches.find(b => b.maDot === selectedBatch) || null;
  }, [batches, selectedBatch]);

  const handleBatchChange = (newBatchId) => {
    setSelectedBatch(newBatchId);
    setPage(1);
    setUploadedFileName('');
    loadBatchItems(newBatchId);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result;
        if (!text || typeof text !== 'string') return;
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) return;

        setItems((prevItems) => {
          let matchedCount = 0;
          const updated = prevItems.map((item) => {
            const matchedLine = lines.find((l) => {
              const cleaned = l.replace(/["\t]/g, '');
              return (
                (item.soTK && cleaned.includes(item.soTK)) ||
                (item.soHDTD && cleaned.includes(item.soHDTD)) ||
                (item.maKH && cleaned.includes(item.maKH))
              );
            });

            if (matchedLine) {
              matchedCount++;
              const parts = matchedLine.split(/,|\t/).map((p) => p.trim().replace(/^"|"$/g, ''));
              let detectedDaTrich = item.phaiThu;
              let detectedStatus = 'THANH_CONG';
              let detectedLyDo = 'Đã đối chiếu thành công từ tệp CoreBanking';

              for (const part of parts) {
                const num = Number(part.replace(/\./g, '').replace(/,/g, ''));
                if (!isNaN(num) && num > 0 && num <= item.phaiThu * 1.5) {
                  detectedDaTrich = num;
                  break;
                }
              }

              const lowerLine = matchedLine.toLowerCase();
              if (
                lowerLine.includes('that bai') ||
                lowerLine.includes('không đủ') ||
                lowerLine.includes('khong du') ||
                lowerLine.includes('loi')
              ) {
                detectedStatus = 'THAT_BAI';
                detectedDaTrich = 0;
                detectedLyDo = 'Số dư tài khoản không đủ / Lỗi giao dịch';
              } else if (detectedDaTrich < item.phaiThu) {
                detectedStatus = 'TRICH_MOT_PHAN';
                detectedLyDo = 'Trích một phần số dư tài khoản';
              }

              return {
                ...item,
                daTrich: detectedDaTrich,
                ketQua: detectedStatus,
                lyDoLoi: detectedLyDo
              };
            }
            return item;
          });

          alert(`Đã nhận diện tệp "${file.name}" và đối soát thành công ${matchedCount} món trích nợ!`);
          return updated;
        });
      } catch (err) {
        console.error('Lỗi đọc tệp kết quả:', err);
        alert('Lỗi đọc tệp kết quả đối soát: ' + err.message);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleProcessReconcile = async () => {
    if (!selectedBatch) {
      alert('Vui lòng chọn đợt trích nợ cần đối soát!');
      return;
    }
    setReconciling(true);
    try {
      const res = await api.reconcileUpload({
        maDot: selectedBatch,
        items: items
      });
      if (res.status === 'success') {
        setReconcileResult(res);
        alert(res.message || 'Đối soát số liệu và cập nhật nợ tồn đọng thành công!');
        loadBatchItems(selectedBatch);
        if (onBatchUpdated) onBatchUpdated();
      } else {
        alert('Lỗi: ' + res.message);
      }
    } catch (e) {
      alert('Lỗi đối soát: ' + e.message);
    } finally {
      setReconciling(false);
    }
  };

  // Xuất Excel .csv
  const handleExportExcel = () => {
    let csv = '\uFEFF';
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

  // Cập nhật trạng thái từng món
  const handleItemDaTrichChange = (index, value) => {
    const num = Number(value.replace(/[^0-9]/g, '')) || 0;
    setItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };
      target.daTrich = num;
      if (num >= target.phaiThu && target.phaiThu > 0) {
        target.ketQua = 'THANH_CONG';
        target.lyDoLoi = '';
      } else if (num > 0) {
        target.ketQua = 'TRICH_MOT_PHAN';
        target.lyDoLoi = 'Trích một phần số dư';
      } else {
        target.ketQua = 'THAT_BAI';
        target.lyDoLoi = 'Số dư tài khoản không đủ';
      }
      copy[index] = target;
      return copy;
    });
  };

  const handleQuickSetStatus = (index, status) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };
      target.ketQua = status;
      if (status === 'THANH_CONG') {
        target.daTrich = target.phaiThu;
        target.lyDoLoi = '';
      } else if (status === 'THAT_BAI') {
        target.daTrich = 0;
        target.lyDoLoi = 'Số dư tài khoản không đủ';
      } else if (status === 'TRICH_MOT_PHAN') {
        target.daTrich = Math.floor(target.phaiThu / 2);
        target.lyDoLoi = 'Trích một phần số dư';
      }
      copy[index] = target;
      return copy;
    });
  };

  // Thống kê số liệu đối soát
  const stats = useMemo(() => {
    let tongPhaiThu = 0;
    let tongDaTrich = 0;
    let countSuccess = 0;
    let countPartial = 0;
    let countFailed = 0;
    let countPending = 0;

    items.forEach((it) => {
      tongPhaiThu += it.phaiThu || 0;
      tongDaTrich += it.daTrich || 0;
      if (it.ketQua === 'THANH_CONG') countSuccess++;
      else if (it.ketQua === 'TRICH_MOT_PHAN') countPartial++;
      else if (it.ketQua === 'THAT_BAI') countFailed++;
      else countPending++;
    });

    const tongConNo = Math.max(0, tongPhaiThu - tongDaTrich);
    const rate = tongPhaiThu > 0 ? ((tongDaTrich / tongPhaiThu) * 100).toFixed(2) : 0;

    return {
      tongPhaiThu,
      tongDaTrich,
      tongConNo,
      rate,
      countSuccess,
      countPartial,
      countFailed,
      countPending,
      total: items.length
    };
  }, [items]);

  // Bộ lọc danh sách
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const matchSearch =
        !searchTerm ||
        it.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        it.maKH?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        it.soHDTD?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        it.soTK?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchFilter = activeFilter === 'ALL' || it.ketQua === activeFilter;
      return matchSearch && matchFilter;
    });
  }, [items, searchTerm, activeFilter]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  return (
    <div className="d-flex flex-column gap-3 content-fade-in">
      {/* 1. THANH CHỌN ĐỢT & THAO TÁC HEADER */}
      <div className="card-modern p-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="small fw-bold text-slate-700">Chọn Đợt Trích Nợ:</span>
            <select
              className="form-select form-select-sm fw-bold border-brand text-brand"
              style={{ minWidth: 260 }}
              value={selectedBatch}
              onChange={(e) => handleBatchChange(e.target.value)}
              disabled={loadingItems || reconciling}
            >
              {batches.map((b) => (
                <option key={b.maDot} value={b.maDot}>
                  {b.maDot} - {b.tenDot || `Đợt ${b.thangNam || ''}`} ({b.trangThai || 'MOI_TAO'})
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => loadBatchItems(selectedBatch)}
              disabled={loadingItems}
              title="Tải lại chi tiết đợt"
            >
              <RefreshCw size={13} className={loadingItems ? 'fa-spin' : ''} />
            </button>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Tải tệp sao kê */}
            <label className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1.5 cursor-pointer m-0 shadow-sm">
              <Upload size={14} />
              <span>{uploadedFileName ? 'Tải lại sao kê' : 'Nạp sao kê Core (.csv)'}</span>
              <input
                type="file"
                accept=".csv, .txt"
                className="d-none"
                onChange={handleFileUpload}
              />
            </label>

            {/* Xuất Excel */}
            <button
              type="button"
              className="btn btn-outline-success btn-sm d-flex align-items-center gap-1 shadow-sm"
              onClick={handleExportExcel}
              disabled={items.length === 0}
            >
              <FileSpreadsheet size={14} />
              <span>Xuất Excel</span>
            </button>

            {/* Nút Chốt sổ đợt */}
            <button
              type="button"
              className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-1.5 shadow-sm"
              onClick={handleProcessReconcile}
              disabled={reconciling || items.length === 0}
            >
              <ShieldCheck size={15} />
              <span>{reconciling ? 'Đang lưu đối soát...' : 'Lưu & Chốt Đợt Trích'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KHỐI THỐNG KÊ KẾT QUẢ ĐỐI SOÁT */}
      <div className="row g-2.5">
        <div className="col-6 col-md-3">
          <div className="p-3 bg-light rounded-3 border h-100">
            <div className="text-muted small fw-medium">Tổng Tiền Phải Thu</div>
            <div className="fs-5 fw-bold text-slate-800 num-tabular">
              {formatCurrencyVN(stats.tongPhaiThu)}
            </div>
            <div className="text-xs text-muted mt-1">{stats.total} món vay trong đợt</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="p-3 bg-success-subtle rounded-3 border border-success-subtle h-100">
            <div className="text-success small fw-medium">Đã Trích Thành Công</div>
            <div className="fs-5 fw-bold text-success num-tabular">
              {formatCurrencyVN(stats.tongDaTrich)}
            </div>
            <div className="text-xs text-success mt-1">
              Đạt <span className="fw-bold">{stats.rate}%</span> ({stats.countSuccess} món)
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="p-3 bg-warning-subtle rounded-3 border border-warning-subtle h-100">
            <div className="text-warning-emphasis small fw-medium">Trích Một Phần</div>
            <div className="fs-5 fw-bold text-warning-emphasis num-tabular">
              {stats.countPartial} <span className="fs-6 font-normal">món</span>
            </div>
            <div className="text-xs text-muted mt-1">Tài khoản thiếu một phần số dư</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="p-3 bg-danger-subtle rounded-3 border border-danger-subtle h-100">
            <div className="text-danger small fw-medium">Thất Bại / Còn Nợ</div>
            <div className="fs-5 fw-bold text-danger num-tabular">
              {formatCurrencyVN(stats.tongConNo)}
            </div>
            <div className="text-xs text-danger mt-1">
              {stats.countFailed} món thất bại (Chuyển sổ nợ)
            </div>
          </div>
        </div>
      </div>

      {/* 3. THANH BỘ LỌC & TÌM KIẾM TRONG ĐỢT */}
      <div className="card-modern p-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          {/* Bộ lọc trạng thái */}
          <div className="d-flex gap-1.5 flex-wrap">
            <button
              className={`btn btn-sm ${activeFilter === 'ALL' ? 'btn-slate-800 text-white' : 'btn-outline-secondary'}`}
              onClick={() => { setActiveFilter('ALL'); setPage(1); }}
            >
              Tất cả ({items.length})
            </button>
            <button
              className={`btn btn-sm ${activeFilter === 'THANH_CONG' ? 'btn-success text-white' : 'btn-outline-success'}`}
              onClick={() => { setActiveFilter('THANH_CONG'); setPage(1); }}
            >
              Thành công ({stats.countSuccess})
            </button>
            <button
              className={`btn btn-sm ${activeFilter === 'TRICH_MOT_PHAN' ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
              onClick={() => { setActiveFilter('TRICH_MOT_PHAN'); setPage(1); }}
            >
              Một phần ({stats.countPartial})
            </button>
            <button
              className={`btn btn-sm ${activeFilter === 'THAT_BAI' ? 'btn-danger text-white' : 'btn-outline-danger'}`}
              onClick={() => { setActiveFilter('THAT_BAI'); setPage(1); }}
            >
              Thất bại ({stats.countFailed})
            </button>
          </div>

          {/* Ô tìm kiếm */}
          <div className="input-group input-group-sm" style={{ width: 260 }}>
            <span className="input-group-text bg-white border-end-0 text-muted">
              <Search size={14} />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Tìm Tên, Mã KH, HĐTD, Số TK..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. BẢNG DỮ LIỆU ĐỐI SOÁT */}
      <div className="card-modern p-0 overflow-hidden">
        {loadingItems ? (
          <div className="p-5 text-center text-muted">
            <span className="spinner-border spinner-border-sm me-2 text-success"></span>
            Đang tải dữ liệu đối soát đợt {selectedBatch}...
          </div>
        ) : paginatedItems.length === 0 ? (
          <EmptyState
            title="Không tìm thấy món trích nợ nào"
            message={
              items.length === 0
                ? 'Đợt trích nợ này chưa có dữ liệu chi tiết hoặc chưa được khởi tạo.'
                : 'Không có bản ghi nào khớp với điều kiện lọc hiện tại.'
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
              <thead className="table-light text-muted small text-uppercase font-heading">
                <tr>
                  <th style={{ width: 45 }} className="text-center">#</th>
                  <th>Khách Hàng & Hợp Đồng</th>
                  <th>Tài Khoản CASA</th>
                  <th className="text-end">Phải Thu (VNĐ)</th>
                  <th className="text-end" style={{ width: 150 }}>Đã Trích (VNĐ)</th>
                  <th className="text-end">Còn Lại (VNĐ)</th>
                  <th className="text-center" style={{ width: 140 }}>Trạng Thái</th>
                  <th style={{ width: 160 }}>Lý Do / Ghi Chú</th>
                  <th className="text-center" style={{ width: 100 }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, idx) => {
                  const globalIdx = (page - 1) * pageSize + idx;
                  const conNo = Math.max(0, item.phaiThu - item.daTrich);
                  const isFull = item.ketQua === 'THANH_CONG';
                  const isPartial = item.ketQua === 'TRICH_MOT_PHAN';
                  const isFailed = item.ketQua === 'THAT_BAI';

                  return (
                    <tr key={`${item.soHDTD || item.maKH}_${globalIdx}`}>
                      <td className="text-center text-muted small">{globalIdx + 1}</td>

                      {/* Khách hàng & HĐTD */}
                      <td>
                        <div
                          className="fw-bold text-slate-800 hover-primary cursor-pointer d-flex align-items-center gap-1"
                          onClick={() => onOpenCustomerQuickView && onOpenCustomerQuickView({ maKH: item.maKH, hoTen: item.hoTen })}
                          title="Nhấp xem chi tiết 360°"
                        >
                          <span>{item.hoTen}</span>
                        </div>
                        <div className="text-xs text-muted d-flex align-items-center gap-2 mt-0.5 font-monospace">
                          <span className="badge bg-light text-dark border">{item.maKH}</span>
                          <span>HĐ: {item.soHDTD}</span>
                        </div>
                      </td>

                      {/* Số TK CASA */}
                      <td>
                        <span className="font-monospace text-slate-700 fw-bold">{item.soTK || '---'}</span>
                      </td>

                      {/* Phải thu */}
                      <td className="text-end fw-bold text-slate-800 num-tabular">
                        {formatCurrencyVN(item.phaiThu)}
                      </td>

                      {/* Đã trích (Cho phép chỉnh sửa nhanh) */}
                      <td className="text-end">
                        <input
                          type="text"
                          className={`form-control form-control-sm text-end fw-bold num-tabular ${
                            isFull ? 'text-success bg-success-subtle border-success' :
                            isPartial ? 'text-warning-emphasis bg-warning-subtle border-warning' :
                            'text-danger bg-danger-subtle border-danger'
                          }`}
                          value={item.daTrich ? Number(item.daTrich).toLocaleString('vi-VN') : '0'}
                          onChange={(e) => handleItemDaTrichChange(globalIdx, e.target.value)}
                        />
                      </td>

                      {/* Còn lại */}
                      <td className="text-end num-tabular">
                        {conNo > 0 ? (
                          <span className="fw-bold text-danger">{formatCurrencyVN(conNo)}</span>
                        ) : (
                          <span className="text-success small fw-semibold">0 đ</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="text-center">
                        {isFull && <StatusBadge status="THANH_CONG" label="Đã trích đủ" />}
                        {isPartial && <StatusBadge status="TRICH_MOT_PHAN" label="Trích 1 phần" />}
                        {isFailed && <StatusBadge status="THAT_BAI" label="Thất bại" />}
                        {!isFull && !isPartial && !isFailed && (
                          <span className="badge bg-secondary">Chưa xử lý</span>
                        )}
                      </td>

                      {/* Lý do / Ghi chú */}
                      <td className="text-muted small text-truncate" style={{ maxWidth: 160 }} title={item.lyDoLoi}>
                        {item.lyDoLoi || (isFull ? 'Khớp thành công' : '---')}
                      </td>

                      {/* Thao tác set nhanh */}
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-success p-1"
                            title="Đánh dấu trích đủ"
                            onClick={() => handleQuickSetStatus(globalIdx, 'THANH_CONG')}
                          >
                            <Check size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger p-1"
                            title="Đánh dấu thất bại"
                            onClick={() => handleQuickSetStatus(globalIdx, 'THAT_BAI')}
                          >
                            <XCircle size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        {filteredItems.length > pageSize && (
          <div className="p-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
            <span className="small text-muted">
              Hiển thị {paginatedItems.length} / {filteredItems.length} món
            </span>
            <Pagination
              currentPage={page}
              totalItems={filteredItems.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
