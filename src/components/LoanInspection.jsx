import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { formatDateVN } from '../utils/dateUtils';
import Pagination from './Pagination';
import InspectionFormModal from './modals/InspectionFormModal';
import InspectionDetailModal from './modals/InspectionDetailModal';

export default function LoanInspection({ prefilledContract, onOpenCustomerQuickView }) {
  const [inspections, setInspections] = useState([]);
  const [allContracts, setAllContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDoanKT, setFilterDoanKT] = useState('ALL');
  const [filterTrangThai, setFilterTrangThai] = useState('ALL');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resIns, resCust] = await Promise.all([
        api.getInspections(),
        api.searchCustomer360('')
      ]);

      if (resIns.status === 'success' && resIns.data) setInspections(resIns.data);
      if (resCust.status === 'success' && resCust.data) {
        setAllContracts(resCust.data.contracts || []);
      }
    } catch (e) {
      console.error('Lỗi nạp dữ liệu kiểm tra vốn:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (prefilledContract) {
      setShowFormModal(true);
    }
  }, [prefilledContract]);

  const handleSaveSubmit = async (formData) => {
    try {
      const res = await api.saveLoanInspection(formData);
      if (res.status === 'success') {
        alert('Lưu biên bản kiểm tra sử dụng vốn thành công!');
        setShowFormModal(false);
        fetchData();
      } else {
        alert('Lỗi: ' + res.message);
      }
    } catch (err) {
      alert('Lỗi hệ thống: ' + err.message);
    }
  };

  // Filtered and Paginated
  const filtered = inspections.filter((item) => {
    const matchSearch =
      !searchTerm ||
      item.maBBKT?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.soHDTD?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maKH?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hoTen?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchDoan = filterDoanKT === 'ALL' || item.loaiDoanKT === filterDoanKT;
    const matchStatus = filterTrangThai === 'ALL' || item.trangThai === filterTrangThai;

    return matchSearch && matchDoan && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Controls */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center flex-wrap gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: 170 }}
            value={filterDoanKT}
            onChange={(e) => {
              setFilterDoanKT(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả Đoàn KT</option>
            <option value="CBTD">CBTD Phụ Trách</option>
            <option value="BKS">Ban Kiểm Soát</option>
            <option value="HDQT">Hội Đồng Quản Trị</option>
            <option value="LIEN_NGANH">Liên Ngành</option>
          </select>

          <select
            className="form-select form-select-sm"
            style={{ width: 150 }}
            value={filterTrangThai}
            onChange={(e) => {
              setFilterTrangThai(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả Kết Luận</option>
            <option value="Đạt">Đạt tiêu chuẩn</option>
            <option value="Cần khắc phục">Cần khắc phục</option>
            <option value="Vi phạm">Vi phạm</option>
          </select>

          <div className="input-group input-group-sm" style={{ width: 220 }}>
            <span className="input-group-text bg-white border-end-0 text-muted">
              <Search size={14} />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Tìm Mã BB, HĐ, Khách..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <button
          className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
          onClick={() => setShowFormModal(true)}
        >
          <Plus size={15} /> Lập Biên Bản Kiểm Tra Mới
        </button>
      </div>

      {/* Inspection List Table */}
      <div className="card-modern p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold text-slate-800 m-0 font-heading">
            Sổ Theo Dõi Kiểm Tra Sử Dụng Vốn Sau Giải Ngân ({filtered.length} biên bản)
          </h6>
        </div>

        <div className="table-responsive">
          <table className="table table-custom align-middle">
            <thead>
              <tr>
                <th>Mã Biên Bản</th>
                <th>Số Khế Ước / HĐ</th>
                <th>Khách Hàng Vay Vốn</th>
                <th>Đoàn Kiểm Tra</th>
                <th>Ngày Kiểm Tra</th>
                <th>Ngày KT Tiếp Theo</th>
                <th className="text-center">Kết Luận</th>
                <th className="text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((item) => (
                  <tr key={item.maBBKT}>
                    <td className="fw-bold font-monospace text-primary">{item.maBBKT}</td>
                    <td className="font-monospace fw-semibold text-dark">{item.soHDTD}</td>
                    <td>
                      <div
                        className="customer-click-link"
                        onClick={() => onOpenCustomerQuickView && onOpenCustomerQuickView({ maKH: item.maKH, hoTen: item.hoTen })}
                        title="Xem nhanh thông tin 360° khách hàng"
                      >
                        {item.hoTen || item.maKH}
                      </div>
                      <span className="small text-muted font-monospace">{item.maKH}</span>
                    </td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary me-1">{item.loaiDoanKT || 'CBTD'}</span>
                      <span className="small text-muted">{item.thanhPhanDoan || 'CBTD phụ trách'}</span>
                    </td>
                    <td className="font-monospace text-dark">{item.ngayKiemTra}</td>
                    <td className="font-monospace text-primary fw-bold">{item.ngayKTNext || '---'}</td>
                    <td className="text-center">
                      <span className={`badge-status ${item.trangThai === 'Đạt' ? 'badge-success-soft' : 'badge-danger-soft'}`}>
                        {item.trangThai}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-outline-secondary p-1 px-2"
                        onClick={() => setSelectedInspection(item)}
                        title="Xem chi tiết biên bản"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    {loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy biên bản kiểm tra nào phù hợp.'}
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

      {/* EXTRACTED MODALS */}
      <InspectionFormModal
        show={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleSaveSubmit}
        prefilledContract={prefilledContract}
        allContracts={allContracts}
      />

      <InspectionDetailModal
        inspection={selectedInspection}
        onClose={() => setSelectedInspection(null)}
      />
    </div>
  );
}
