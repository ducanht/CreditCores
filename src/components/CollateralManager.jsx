import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Building2,
  FileText,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FileCheck2,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrencyVN, formatDateVN, getTodayVN } from '../utils/dateUtils';
import Pagination from './Pagination';
import CollateralFormModal from './modals/CollateralFormModal';
import ContractPackageModal from './modals/ContractPackageModal';

export default function CollateralManager({ onOpenCustomerQuickView }) {
  const [collaterals, setCollaterals] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [allContracts, setAllContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'DANG_THE_CHAP' | 'CHO_CONG_CHUNG' | 'DA_GIAI_CHAP'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedCollateral, setSelectedCollateral] = useState(null);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packageTargetCustomer, setPackageTargetCustomer] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCol, resCust] = await Promise.all([
        api.getCollaterals(),
        api.searchCustomer360('')
      ]);

      if (resCol.status === 'success' && resCol.data) setCollaterals(resCol.data);
      if (resCust.status === 'success' && resCust.data) {
        const custList = Array.isArray(resCust.data) ? resCust.data : (resCust.data.customers || []);
        const contractsList = [];
        custList.forEach(c => {
          (c.contracts || []).forEach(ct => {
            contractsList.push({
              ...ct,
              maKH: c.maKH,
              hoTen: c.hoTen,
              cccd: c.cccd,
              dienThoai: c.dienThoaiDD || c.dienThoai,
              diaChi: c.diaChi,
              soTV: c.soTV
            });
          });
        });
        setAllCustomers(custList);
        setAllContracts(contractsList);
      }
    } catch (e) {
      console.error('Lỗi nạp dữ liệu tài sản thế chấp:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveCollateral = async (formData) => {
    try {
      const res = await api.saveCollateral(formData);
      if (res.status === 'success') {
        alert(res.message || 'Lưu tài sản bảo đảm thành công!');
        setShowFormModal(false);
        fetchData();
      } else {
        alert('Lỗi: ' + res.message);
      }
    } catch (err) {
      alert('Lỗi hệ thống: ' + err.message);
    }
  };

  const handleDeleteCollateral = async (col) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài sản bảo đảm (Sổ đỏ: ${col.soGCN}) khỏi CSDL TSBD_CORE?`)) {
      try {
        const res = await api.deleteCollateral({ soGCN: col.soGCN, maTSBD: col.maTSBD });
        if (res.status === 'success') {
          alert('Xóa tài sản thế chấp thành công!');
          fetchData();
        }
      } catch (err) {
        alert('Lỗi: ' + err.message);
      }
    }
  };

  // Xuất Excel (.csv)
  const handleExportExcel = () => {
    let csv = '\uFEFF'; // UTF-8 BOM
    csv += 'DANH MỤC TÀI SẢN THẾ CHẤP & SỔ ĐỎ BẢO ĐẢM TÍN DỤNG (TSBD_CORE)\n';
    csv += 'QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ\n';
    csv += `Ngày xuất: ${getTodayVN()}\n\n`;

    const headers = [
      'STT', 'Số GCN (Sổ Đỏ)', 'Mã TSBD', 'Mã KH', 'Chủ Sở Hữu', 'Số CCCD',
      'Thửa Đất Số', 'Tờ Bản Đồ Số', 'Địa Chỉ Thửa Đất', 'Diện Tích (m2)',
      'Giá Trị Định Giá QTD (VNĐ)', 'Hạn Mức Đảm Bảo (VNĐ)', 'Trạng Thái', 'HĐTD Thế Chấp', 'Số Công Chứng', 'Số ĐKGDBD'
    ];
    csv += headers.join(',') + '\n';

    collaterals.forEach((col, idx) => {
      csv += [
        idx + 1,
        `"${col.soGCN}"`,
        `"${col.maTSBD}"`,
        `"${col.maKH}"`,
        `"${col.chuSoHuu}"`,
        `"\t${col.cccdChuTS || ''}"`,
        `"${col.thuaDatSo}"`,
        `"${col.toBanDoSo}"`,
        `"${col.diaChiThuaDat}"`,
        col.dienTich,
        col.giaTriDinhGiaQTD,
        col.soTienDamBaoToiDa,
        `"${col.trangThaiTheChap === 'DANG_THE_CHAP' ? 'Đang thế chấp' : col.trangThaiTheChap === 'CHO_CONG_CHUNG' ? 'Chờ công chứng' : 'Đã giải chấp'}"`,
        `"${col.soHDTD_LienKet || ''}"`,
        `"${col.soCongChung || ''}"`,
        `"${col.soDangKyGDBD || ''}"`
      ].join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TSBD_CORE_SoDo_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // KPI Metrics
  const totalCount = collaterals.length;
  const mortgagedCount = collaterals.filter(c => c.trangThaiTheChap === 'DANG_THE_CHAP').length;
  const totalValuation = collaterals.reduce((sum, c) => sum + (Number(c.giaTriDinhGiaQTD) || 0), 0);
  const totalSecuredCapacity = collaterals.reduce((sum, c) => sum + (Number(c.soTienDamBaoToiDa) || 0), 0);

  // Filtered List
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return collaterals.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.soGCN?.toLowerCase().includes(term) ||
        item.maTSBD?.toLowerCase().includes(term) ||
        item.maKH?.toLowerCase().includes(term) ||
        item.chuSoHuu?.toLowerCase().includes(term) ||
        item.thuaDatSo?.includes(term) ||
        item.diaChiThuaDat?.toLowerCase().includes(term);

      const matchStatus = statusFilter === 'ALL' || item.trangThaiTheChap === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [collaterals, searchTerm, statusFilter]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="d-flex flex-column gap-3">
      {/* 1. Control Toolbar & Actions */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center flex-wrap gap-2">
          {/* Nút Thêm Mới Sổ Đỏ */}
          <button
            type="button"
            className="btn btn-sm btn-brand text-white fw-bold d-flex align-items-center gap-1.5 shadow-sm"
            onClick={() => { setSelectedCollateral(null); setShowFormModal(true); }}
          >
            <Plus size={15} /> Thêm Sổ Đỏ Mới (TSBD_CORE)
          </button>

          {/* Nút Tạo Bộ Hợp Đồng Tín Dụng */}
          <button
            type="button"
            className="btn btn-sm btn-outline-primary fw-bold d-flex align-items-center gap-1.5"
            onClick={() => { setPackageTargetCustomer(null); setShowPackageModal(true); }}
          >
            <Sparkles size={14} /> Lập Trọn Bộ Hợp Đồng (Full Package)
          </button>
        </div>

        {/* Action Icon Group */}
        <div className="d-flex align-items-center gap-1.5">
          <button
            type="button"
            className="btn btn-sm btn-outline-success p-1.5 rounded-2 d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px' }}
            onClick={handleExportExcel}
            title="Xuất bảng tính Excel (.csv) kho TSBD_CORE"
          >
            <FileSpreadsheet size={15} />
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary p-1.5 rounded-2 d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px' }}
            onClick={() => window.print()}
            title="In danh mục tài sản bảo đảm"
          >
            <Printer size={15} />
          </button>
        </div>
      </div>

      {/* 2. 4 Executive Bento KPI Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card-modern p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                  Tổng Số Sổ Đỏ (TSBĐ)
                </span>
                <h4 className="fw-semibold text-slate-900 m-0 mt-1 num-tabular font-heading fs-4">
                  {totalCount} Giấy
                </h4>
              </div>
              <div className="p-2 rounded bg-success-subtle text-success">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="small text-muted mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span>Kho tài sản quản lý tập trung TSBD_CORE</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card-modern p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                  Tổng Giá Trị Định Giá
                </span>
                <h4 className="fw-semibold text-primary m-0 mt-1 num-tabular font-heading fs-4">
                  {formatCurrencyVN(totalValuation)}
                </h4>
              </div>
              <div className="p-2 rounded bg-primary-subtle text-primary">
                <Building2 size={18} />
              </div>
            </div>
            <div className="small text-muted mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span>Hội đồng định giá QTD thẩm định</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card-modern p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                  Hạn Mức Cho Vay Tối Đa
                </span>
                <h4 className="fw-semibold text-success m-0 mt-1 num-tabular font-heading fs-4">
                  {formatCurrencyVN(totalSecuredCapacity)}
                </h4>
              </div>
              <span className="badge bg-success-subtle text-success small fw-medium">
                LTV 70%
              </span>
            </div>
            <div className="small text-muted mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span>Bảo đảm an toàn thu hồi nợ</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card-modern p-3 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                  Đang Thế Chấp / ĐKGDBD
                </span>
                <h4 className="fw-semibold text-warning m-0 mt-1 num-tabular font-heading fs-4">
                  {mortgagedCount} Sổ
                </h4>
              </div>
              <div className="p-2 rounded bg-warning-subtle text-warning">
                <FileCheck2 size={18} />
              </div>
            </div>
            <div className="small text-muted mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span>Đang lưu giữ tại Két an toàn Quỹ</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Table & Filters */}
      <div className="card-modern p-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          {/* Sub-tab pills */}
          <div className="btn-group btn-group-sm p-0.5 bg-light rounded-2 border" role="group">
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === 'ALL' ? 'btn-brand fw-medium text-white' : 'btn-light text-muted'}`}
              onClick={() => { setStatusFilter('ALL'); setPage(1); }}
            >
              Tất Cả ({collaterals.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === 'DANG_THE_CHAP' ? 'btn-brand fw-medium text-white' : 'btn-light text-muted'}`}
              onClick={() => { setStatusFilter('DANG_THE_CHAP'); setPage(1); }}
            >
              Đang Thế Chấp ({mortgagedCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === 'CHO_CONG_CHUNG' ? 'btn-brand fw-medium text-white' : 'btn-light text-muted'}`}
              onClick={() => { setStatusFilter('CHO_CONG_CHUNG'); setPage(1); }}
            >
              Chờ Công Chứng
            </button>
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === 'DA_GIAI_CHAP' ? 'btn-brand fw-medium text-white' : 'btn-light text-muted'}`}
              onClick={() => { setStatusFilter('DA_GIAI_CHAP'); setPage(1); }}
            >
              Đã Giải Chấp
            </button>
          </div>

          {/* Search box */}
          <div className="input-group input-group-sm" style={{ maxWidth: 280 }}>
            <span className="input-group-text bg-light border-end-0">
              <Search size={13} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Tìm Số GCN, Thửa, Chủ TS, Mã KH..."
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
                <th>Số GCN (Sổ Đỏ)</th>
                <th>Thửa / TBĐ</th>
                <th>Chủ Sở Hữu (KH_CORE)</th>
                <th>Địa Chỉ Thửa Đất</th>
                <th className="text-end">Diện Tích</th>
                <th className="text-end">Định Giá QTD</th>
                <th className="text-end">Hạn Mức Vay</th>
                <th className="text-center">Trạng Thái</th>
                <th className="text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((col, idx) => (
                  <tr key={col.soGCN || idx}>
                    <td className="fw-bold font-monospace text-danger">
                      {col.soGCN}
                      <div className="text-muted small fw-normal" style={{ fontSize: '0.70rem' }}>
                        {col.maTSBD}
                      </div>
                    </td>
                    <td className="font-monospace fw-medium">
                      Thửa {col.thuaDatSo} - TBĐ {col.toBanDoSo}
                    </td>
                    <td>
                      <div className="fw-semibold text-slate-900">{col.chuSoHuu}</div>
                      <button
                        type="button"
                        className="btn btn-link p-0 small font-monospace text-primary text-decoration-none"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => onOpenCustomerQuickView && onOpenCustomerQuickView({ maKH: col.maKH, hoTen: col.chuSoHuu })}
                      >
                        {col.maKH} ({col.quanHeChuTS})
                      </button>
                    </td>
                    <td className="text-muted text-truncate" style={{ maxWidth: 200 }} title={col.diaChiThuaDat}>
                      {col.diaChiThuaDat}
                    </td>
                    <td className="text-end num-tabular fw-medium">{col.dienTich} $m^2$</td>
                    <td className="text-end num-tabular fw-bold text-slate-900">{formatCurrencyVN(col.giaTriDinhGiaQTD)}</td>
                    <td className="text-end num-tabular fw-bold text-success">{formatCurrencyVN(col.soTienDamBaoToiDa)}</td>
                    <td className="text-center">
                      {col.trangThaiTheChap === 'DANG_THE_CHAP' ? (
                        <span className="badge bg-success-subtle text-success">Đang thế chấp</span>
                      ) : col.trangThaiTheChap === 'CHO_CONG_CHUNG' ? (
                        <span className="badge bg-warning-subtle text-warning">Chờ công chứng</span>
                      ) : (
                        <span className="badge bg-secondary-subtle text-secondary">Đã giải chấp</span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-light p-1 text-primary"
                          title="Lập bộ hợp đồng tín dụng cho sổ đỏ này"
                          onClick={() => {
                            setSelectedCollateral(col);
                            setShowPackageModal(true);
                          }}
                        >
                          <Sparkles size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light p-1 text-secondary"
                          title="Chỉnh sửa thông tin sổ đỏ"
                          onClick={() => {
                            setSelectedCollateral(col);
                            setShowFormModal(true);
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light p-1 text-danger"
                          title="Xóa tài sản"
                          onClick={() => handleDeleteCollateral(col)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-4">
                    Không tìm thấy tài sản thế chấp phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Modals */}
      {showFormModal && (
        <CollateralFormModal
          show={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleSaveCollateral}
          selectedCollateral={selectedCollateral}
          allCustomers={allCustomers}
          allContracts={allContracts}
        />
      )}

      {showPackageModal && (
        <ContractPackageModal
          show={showPackageModal}
          onClose={() => setShowPackageModal(false)}
          allCustomers={allCustomers}
          allContracts={allContracts}
          allCollaterals={collaterals}
          preselectedCustomer={selectedCollateral ? { maKH: selectedCollateral.maKH, hoTen: selectedCollateral.chuSoHuu } : null}
        />
      )}
    </div>
  );
}
