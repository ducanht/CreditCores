import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Printer,
  FileCheck,
  CheckCircle2,
  Sparkles,
  Link2,
  FolderOpen,
  Eye,
  RefreshCw,
  Layers,
  Code
} from 'lucide-react';
import { api } from '../services/api';
import { formatDateVN, formatCurrencyVN, getTodayISO } from '../utils/dateUtils';
import Pagination from './Pagination';

// DANH MỤC BIỂU MẪU MẶC ĐỊNH MỞ RỘNG
const INITIAL_TEMPLATES = [
  {
    id: 'BM_KIEM_TRA_VON',
    maBM: 'BM_KT_01',
    tenBM: 'Biên Bản Kiểm Tra Sử Dụng Vốn Sau Giải Ngân',
    phanHe: 'Kiểm Tra Vốn',
    loaiNguon: 'GOOGLE_DOCS',
    linkNguon: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    moTa: 'Mẫu biên bản thực địa kiểm tra phương án sản xuất kinh doanh của khách hàng định kỳ 30 ngày / 90 ngày.',
    truongTron: [
      '{{HoTen}}',
      '{{MaKH}}',
      '{{SoCCCD}}',
      '{{DiaChi}}',
      '{{SoHDTD}}',
      '{{TienVay}}',
      '{{NgayVay}}',
      '{{NgayKiemTra}}',
      '{{ThanhPhanDoan}}',
      '{{DiaDiemKT}}',
      '{{MucDichVay}}',
      '{{KetLuanKT}}',
      '{{NgayKTNext}}'
    ],
    trangThai: 'Đang áp dụng',
    ngayCapNhat: '19/08/2026'
  },
  {
    id: 'BM_THAM_DINH',
    maBM: 'BM_TD_02',
    tenBM: 'Báo Cáo Thẩm Định Điều Kiện Cấp Tín Dụng & TSĐB',
    phanHe: 'Thẩm Định',
    loaiNguon: 'GOOGLE_DOCS',
    linkNguon: 'https://docs.google.com/document/d/1uPsmMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    moTa: 'Tờ trình thẩm định phương án vay vốn, đánh giá xếp hạng CIC, tài sản thế chấp và tỷ lệ LTV.',
    truongTron: [
      '{{HoTen}}',
      '{{MaKH}}',
      '{{SoCCCD}}',
      '{{DiaChi}}',
      '{{DeXuatVay}}',
      '{{DuyetVay}}',
      '{{ThoiHanThang}}',
      '{{LaiSuatDuyet}}',
      '{{ThuNhapThang}}',
      '{{ChiPhiThang}}',
      '{{XepHangCIC}}',
      '{{LoaiTSBD}}',
      '{{GiaTriTSBD}}',
      '{{TyLeLTV}}',
      '{{CanBoThamDinh}}',
      '{{KetLuan}}'
    ],
    trangThai: 'Đang áp dụng',
    ngayCapNhat: '19/08/2026'
  },
  {
    id: 'BM_UY_QUYEN_DEBIT',
    maBM: 'BM_AD_03',
    tenBM: 'Thỏa Thuận Ủy Quyền Trích Nợ Tự Động Tài Khoản CASA',
    phanHe: 'Trích Nợ Tự Động',
    loaiNguon: 'GOOGLE_DOCS',
    linkNguon: 'https://docs.google.com/document/d/1wZkMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    moTa: 'Hợp đồng ủy quyền cho phép QTDND Yên Thọ tự động cắt nợ tiền gốc và lãi từ tài khoản thanh toán CASA.',
    truongTron: [
      '{{HoTen}}',
      '{{MaKH}}',
      '{{SoCCCD}}',
      '{{NgayCapCCCD}}',
      '{{DiaChi}}',
      '{{SoTKCASA}}',
      '{{KyTrichNo}}',
      '{{NgayTrichHangThang}}',
      '{{DieuKhoanUyQuyen}}',
      '{{NgayKy}}'
    ],
    trangThai: 'Đang áp dụng',
    ngayCapNhat: '19/08/2026'
  },
  {
    id: 'BM_LENH_TRICH_NO',
    maBM: 'BM_AD_04',
    tenBM: 'Bảng Tổng Hợp Lệnh Trích Nợ Định Kỳ (Xuất File Core)',
    phanHe: 'Trích Nợ Tự Động',
    loaiNguon: 'GOOGLE_SHEETS',
    linkNguon: 'https://docs.google.com/spreadsheets/d/1e9xMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    moTa: 'Mẫu kết xuất tệp lệnh trích nợ đồng loạt chuyển sang hệ thống máy chủ CoreBanking.',
    truongTron: [
      '{{MaDot}}',
      '{{KyTrich}}',
      '{{ThangNam}}',
      '{{TongSoKH}}',
      '{{TongTienPhaiThu}}',
      '{{TongDaTrich}}',
      '{{TongNoTon}}',
      '{{NgayLapBang}}'
    ],
    trangThai: 'Đang áp dụng',
    ngayCapNhat: '19/08/2026'
  },
  {
    id: 'BM_THONG_BAO_NO',
    maBM: 'BM_THN_05',
    tenBM: 'Thông Báo Đôn Đốc Thu Hồi Nợ Gốc & Lãi Đến Hạn',
    phanHe: 'Thu Hồi Nợ',
    loaiNguon: 'GOOGLE_DOCS',
    linkNguon: 'https://docs.google.com/document/d/1kLxMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    moTa: 'Thông báo gửi cho thành viên vay vốn trước ngày đến hạn trả nợ 5 ngày hoặc khi phát sinh nợ quá hạn.',
    truongTron: [
      '{{HoTen}}',
      '{{MaKH}}',
      '{{SoHDTD}}',
      '{{SoTienGocDenHan}}',
      '{{SoTienLaiDenHan}}',
      '{{SoTienNoTon}}',
      '{{TongPhaiNop}}',
      '{{HanChotNop}}',
      '{{SoTKCASA}}',
      '{{DienThoaiLienHe}}'
    ],
    trangThai: 'Đang áp dụng',
    ngayCapNhat: '19/08/2026'
  }
];

export default function TemplateManager() {
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('creditcore_templates');
    return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhanHe, setFilterPhanHe] = useState('ALL');
  const [filterTrangThai, setFilterTrangThai] = useState('ALL');

  // Phân trang
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showTagDictionary, setShowTagDictionary] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    maBM: '',
    tenBM: '',
    phanHe: 'Kiểm Tra Vốn',
    loaiNguon: 'GOOGLE_DOCS',
    linkNguon: '',
    moTa: '',
    truongTronStr: '',
    trangThai: 'Đang áp dụng'
  });

  // Mail Merge Test State
  const [sampleData, setSampleData] = useState({
    HoTen: 'NGUYỄN VĂN AN',
    MaKH: 'KH008892',
    SoCCCD: '038088001234',
    DiaChi: 'Thôn 3, Xã Yên Thọ, Huyện Yên Định, Tỉnh Thanh Hóa',
    SoHDTD: 'HD-2025-081',
    TienVay: '300.000.000 đ',
    DuNo: '285.000.000 đ',
    LaiSuat: '9.5%/năm',
    SoTKCASA: '3500205123456',
    NgayKiemTra: '19/08/2026',
    ThanhPhanDoan: 'Lê Văn Tín (CBTD) & Ban Kiểm Soát',
    DiaDiemKT: 'Trang trại chăn nuôi bò sữa xã Yên Thọ',
    MucDichVay: 'Đầu tư mở rộng chuồng trại chăn nuôi',
    KetLuanKT: 'Sử dụng vốn đúng mục đích 100%, kinh doanh hiệu quả',
    NgayKTNext: '19/11/2026'
  });

  const saveToStorage = (updated) => {
    setTemplates(updated);
    localStorage.setItem('creditcore_templates', JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setFormData({
      id: 'BM_' + Date.now(),
      maBM: 'BM_MOI_' + (templates.length + 1),
      tenBM: '',
      phanHe: 'Tín Dụng',
      loaiNguon: 'GOOGLE_DOCS',
      linkNguon: 'https://docs.google.com/document/d/.../edit',
      moTa: '',
      truongTronStr: '{{HoTen}}, {{MaKH}}, {{SoCCCD}}, {{DiaChi}}, {{SoHDTD}}, {{TienVay}}',
      trangThai: 'Đang áp dụng'
    });
    setShowEditModal(true);
  };

  const handleOpenEdit = (tpl) => {
    setFormData({
      ...tpl,
      truongTronStr: tpl.truongTron ? tpl.truongTron.join(', ') : ''
    });
    setShowEditModal(true);
  };

  const handleSaveTemplate = (e) => {
    e.preventDefault();
    if (!formData.tenBM || !formData.maBM) {
      alert('Vui lòng nhập Mã biểu mẫu và Tên biểu mẫu.');
      return;
    }

    const tags = formData.truongTronStr
      ? formData.truongTronStr
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const itemToSave = {
      ...formData,
      truongTron: tags,
      ngayCapNhat: new Date().toLocaleDateString('vi-VN')
    };

    const existsIndex = templates.findIndex((t) => t.id === formData.id);
    let updated = [];
    if (existsIndex >= 0) {
      updated = [...templates];
      updated[existsIndex] = itemToSave;
    } else {
      updated = [itemToSave, ...templates];
    }

    saveToStorage(updated);
    setShowEditModal(false);
    alert('Đã lưu cấu hình biểu mẫu thành công!');
  };

  const handleDeleteTemplate = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa biểu mẫu này khỏi danh mục?')) {
      const updated = templates.filter((t) => t.id !== id);
      saveToStorage(updated);
    }
  };

  const handleCopyTag = (tag) => {
    navigator.clipboard.writeText(tag);
    alert(`Đã sao chép thẻ biến: ${tag}`);
  };

  // Lọc và phân trang
  const filteredTemplates = templates.filter((t) => {
    const matchSearch =
      !searchTerm ||
      t.tenBM?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.maBM?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.moTa?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchPhanHe = filterPhanHe === 'ALL' || t.phanHe === filterPhanHe;
    const matchTrangThai = filterTrangThai === 'ALL' || t.trangThai === filterTrangThai;

    return matchSearch && matchPhanHe && matchTrangThai;
  });

  const paginatedTemplates = filteredTemplates.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Controls */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center flex-wrap gap-2">
          {/* Bộ lọc Phân hệ */}
          <select
            className="form-select form-select-sm"
            style={{ width: 170 }}
            value={filterPhanHe}
            onChange={(e) => {
              setFilterPhanHe(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả Phân Hệ</option>
            <option value="Kiểm Tra Vốn">Kiểm Tra Vốn</option>
            <option value="Thẩm Định">Thẩm Định</option>
            <option value="Trích Nợ Tự Động">Trích Nợ Tự Động</option>
            <option value="Thu Hồi Nợ">Thu Hồi Nợ</option>
            <option value="Tín Dụng">Tín Dụng</option>
          </select>

          {/* Bộ lọc Trạng thái */}
          <select
            className="form-select form-select-sm"
            style={{ width: 150 }}
            value={filterTrangThai}
            onChange={(e) => {
              setFilterTrangThai(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả Trạng Thái</option>
            <option value="Đang áp dụng">Đang áp dụng</option>
            <option value="Tạm ngưng">Tạm ngưng</option>
          </select>

          {/* Tìm kiếm */}
          <div className="input-group input-group-sm" style={{ width: 240 }}>
            <span className="input-group-text bg-white border-end-0 text-muted">
              <Search size={14} />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Tìm Mã, Tên biểu mẫu..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm fw-semibold d-flex align-items-center gap-1"
            onClick={() => setShowTagDictionary(true)}
          >
            <Code size={15} /> Từ Điển Thẻ Biến Mail Merge
          </button>
          <button
            className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-2 shadow-sm"
            onClick={handleOpenAdd}
          >
            <Plus size={16} /> Thêm Biểu Mẫu Mới
          </button>
        </div>
      </div>

      {/* Bảng Danh Sách Biểu Mẫu */}
      <div className="card-modern p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-slate-800 m-0 font-heading d-flex align-items-center gap-2">
            <Layers size={20} className="text-primary" /> Trung Tâm Cấu Hình Biểu Mẫu & Trộn Dữ Liệu (Mail Merge Hub)
          </h5>
          <span className="badge bg-light text-muted border">
            {filteredTemplates.length} biểu mẫu
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-custom align-middle">
            <thead>
              <tr>
                <th>Mã Biểu Mẫu</th>
                <th>Tên Biểu Mẫu & Mô Tả</th>
                <th>Phân Hệ Áp Dụng</th>
                <th>Nguồn Tệp Mẫu</th>
                <th>Thẻ Biến Trộn Sẵn</th>
                <th className="text-center">Trạng Thái</th>
                <th className="text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTemplates.length > 0 ? (
                paginatedTemplates.map((tpl) => (
                  <tr key={tpl.id}>
                    <td>
                      <span className="fw-bold font-monospace text-primary">{tpl.maBM}</span>
                      <div className="small text-muted">{tpl.ngayCapNhat}</div>
                    </td>

                    <td>
                      <div className="fw-bold text-dark">{tpl.tenBM}</div>
                      <div className="small text-muted text-truncate" style={{ maxWidth: 260 }} title={tpl.moTa}>
                        {tpl.moTa || 'Không có mô tả chi tiết'}
                      </div>
                    </td>

                    <td>
                      <span className="badge bg-primary-subtle text-primary fw-semibold">
                        {tpl.phanHe}
                      </span>
                    </td>

                    <td>
                      <a
                        href={tpl.linkNguon}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 py-1 px-2 text-truncate"
                        style={{ maxWidth: 180, fontSize: '0.75rem' }}
                        title={tpl.linkNguon}
                      >
                        <Link2 size={13} /> {tpl.loaiNguon === 'GOOGLE_DOCS' ? 'Google Docs' : 'Google Sheets'}
                        <ExternalLink size={11} className="ms-1 text-muted" />
                      </a>
                    </td>

                    <td>
                      <div className="d-flex flex-wrap gap-1" style={{ maxWidth: 220 }}>
                        {(tpl.truongTron || []).slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="badge bg-light text-dark border font-monospace"
                            style={{ fontSize: '0.68rem', cursor: 'pointer' }}
                            onClick={() => handleCopyTag(tag)}
                            title="Nhấp để sao chép"
                          >
                            {tag}
                          </span>
                        ))}
                        {(tpl.truongTron || []).length > 3 && (
                          <span className="badge bg-secondary-subtle text-muted" style={{ fontSize: '0.68rem' }}>
                            +{(tpl.truongTron || []).length - 3} thẻ
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="text-center">
                      <span
                        className={`badge-status ${
                          tpl.trangThai === 'Đang áp dụng' ? 'badge-success-soft' : 'badge-warning-soft'
                        }`}
                      >
                        {tpl.trangThai}
                      </span>
                    </td>

                    <td className="text-center">
                      <div className="d-inline-flex gap-1">
                        <button
                          className="btn btn-sm btn-brand d-inline-flex align-items-center gap-1 fw-semibold"
                          onClick={() => {
                            setSelectedTemplate(tpl);
                            setShowMergeModal(true);
                          }}
                          title="Trộn dữ liệu thử nghiệm (Mail Merge)"
                        >
                          <Sparkles size={13} /> Trộn Dữ Liệu
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary p-1 px-2"
                          onClick={() => handleOpenEdit(tpl)}
                          title="Chỉnh sửa cấu hình mẫu"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger p-1 px-2"
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          title="Xóa biểu mẫu"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    Không tìm thấy biểu mẫu nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang chuẩn 15 dòng */}
        <Pagination
          currentPage={page}
          totalItems={filteredTemplates.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* ========================================================================= */}
      {/* MODAL: THÊM / CHỈNH SỬA CẤU HÌNH BIỂU MẪU */}
      {/* ========================================================================= */}
      {showEditModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark font-heading d-flex align-items-center gap-2">
                  <FileText size={20} className="text-primary" /> Cấu Hình Biểu Mẫu Báo Cáo
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} />
              </div>

              <form onSubmit={handleSaveTemplate}>
                <div className="modal-body py-3">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-dark">Mã Biểu Mẫu (*)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace fw-bold"
                        placeholder="vd: BM_KT_01"
                        value={formData.maBM}
                        onChange={(e) => setFormData({ ...formData, maBM: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-8">
                      <label className="form-label small fw-bold text-dark">Tên Biểu Mẫu (*)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fw-bold"
                        placeholder="vd: Biên Bản Kiểm Tra Sử Dụng Vốn Sau Giải Ngân"
                        value={formData.tenBM}
                        onChange={(e) => setFormData({ ...formData, tenBM: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-dark">Phân Hệ Nghiệp Vụ</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.phanHe}
                        onChange={(e) => setFormData({ ...formData, phanHe: e.target.value })}
                      >
                        <option value="Kiểm Tra Vốn">Kiểm Tra Vốn</option>
                        <option value="Thẩm Định">Thẩm Định</option>
                        <option value="Trích Nợ Tự Động">Trích Nợ Tự Động</option>
                        <option value="Thu Hồi Nợ">Thu Hồi Nợ</option>
                        <option value="Tín Dụng">Tín Dụng</option>
                        <option value="Khác">Khác (Tùy biến)</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-dark">Loại Nguồn Mẫu</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.loaiNguon}
                        onChange={(e) => setFormData({ ...formData, loaiNguon: e.target.value })}
                      >
                        <option value="GOOGLE_DOCS">Google Docs (Soạn thảo văn bản)</option>
                        <option value="GOOGLE_SHEETS">Google Sheets (Bảng tính / Lệnh)</option>
                        <option value="FILE_UPLOAD">Tệp Word/Excel Tải Lên</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-dark">Trạng Thái</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.trangThai}
                        onChange={(e) => setFormData({ ...formData, trangThai: e.target.value })}
                      >
                        <option value="Đang áp dụng">Đang áp dụng</option>
                        <option value="Tạm ngưng">Tạm ngưng</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-dark">
                        Đường Link Google Docs / Google Sheets Mẫu (*)
                      </label>
                      <input
                        type="url"
                        className="form-control form-control-sm font-monospace"
                        placeholder="https://docs.google.com/document/d/.../edit"
                        value={formData.linkNguon}
                        onChange={(e) => setFormData({ ...formData, linkNguon: e.target.value })}
                        required
                      />
                      <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                        * Nhớ chia sẻ quyền "Người xem" (Viewer) hoặc "Người chỉnh sửa" (Editor) cho link này.
                      </span>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-dark">
                        Danh Sách Thẻ Biến Trộn Dữ Liệu (Cách nhau bởi dấu phẩy)
                      </label>
                      <textarea
                        className="form-control form-control-sm font-monospace"
                        rows="3"
                        placeholder="{{HoTen}}, {{MaKH}}, {{SoCCCD}}, {{DiaChi}}, {{SoHDTD}}, {{TienVay}}..."
                        value={formData.truongTronStr}
                        onChange={(e) => setFormData({ ...formData, truongTronStr: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-dark">Mô Tả & Hướng Dẫn Sử Dụng</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="2"
                        placeholder="Mục đích sử dụng, căn cứ pháp lý, đối tượng áp dụng..."
                        value={formData.moTa}
                        onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowEditModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-brand fw-bold">
                    Lưu Cấu Hình Biểu Mẫu
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THỬ NGHIỆM TRỘN DỮ LIỆU (MAIL MERGE TESTER & VIEWER) */}
      {/* ========================================================================= */}
      {showMergeModal && selectedTemplate && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1065 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <div>
                  <span className="badge bg-primary-subtle text-primary mb-1">
                    {selectedTemplate.maBM} • {selectedTemplate.phanHe}
                  </span>
                  <h5 className="modal-title fw-bold text-dark font-heading">
                    Trộn Dữ Liệu Tự Động: {selectedTemplate.tenBM}
                  </h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowMergeModal(false)} />
              </div>

              <div className="modal-body py-3">
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong className="text-dark small">Dữ Liệu Khách Hàng / Hợp Đồng Mẫu Được Trộn:</strong>
                    <span className="badge bg-success">Dữ liệu thực tế CSDL</span>
                  </div>
                  <div className="row g-2 small">
                    <div className="col-sm-6">
                      <span className="text-muted">Khách hàng:</span> <strong className="text-dark">{sampleData.HoTen}</strong> ({sampleData.MaKH})
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted">Hợp đồng:</span> <strong className="text-primary">{sampleData.SoHDTD}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted">Số tiền vay:</span> <strong className="text-danger">{sampleData.TienVay}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted">Số TK CASA:</span> <strong className="text-success">{sampleData.SoTKCASA}</strong>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold text-dark mb-2 small">Xem Trước Bảng Ánh Xạ Biến Trộn (Mail Merge Mapping):</h6>
                <div className="table-responsive border rounded-3 bg-white mb-3" style={{ maxHeight: 220, overflowY: 'auto' }}>
                  <table className="table table-custom align-middle m-0 small">
                    <thead className="bg-light">
                      <tr>
                        <th>Tên Thẻ Biến Mail Merge</th>
                        <th>Giá Trị Dữ Liệu Thay Thế</th>
                        <th className="text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedTemplate.truongTron || []).map((tag, idx) => {
                        const cleanKey = tag.replace(/[{}]/g, '');
                        const val = sampleData[cleanKey] || `[${cleanKey} của khách hàng]`;
                        return (
                          <tr key={idx}>
                            <td>
                              <span className="badge bg-light text-primary border font-monospace">{tag}</span>
                            </td>
                            <td className="fw-semibold text-dark">{val}</td>
                            <td className="text-center">
                              <button
                                className="btn btn-xs btn-outline-secondary p-1 px-2"
                                onClick={() => handleCopyTag(tag)}
                                title="Sao chép thẻ này để dán vào file Word"
                              >
                                <Copy size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-light rounded-3 border small text-muted">
                  <strong>💡 Hướng Dẫn Soạn Thảo:</strong> Mở file Google Docs mẫu của bạn, chèn các thẻ biến dạng <code>{'{{HoTen}}'}</code>, <code>{'{{TienVay}}'}</code> vào đúng vị trí cần điền. Khi xuất báo cáo, hệ thống sẽ tự động thay thế bằng dữ liệu khách hàng được chọn.
                </div>
              </div>

              <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
                <a
                  href={selectedTemplate.linkNguon}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                >
                  <ExternalLink size={14} /> Mở Tệp Google Docs Mẫu
                </a>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-light btn-sm" onClick={() => setShowMergeModal(false)}>
                    Đóng
                  </button>
                  <button
                    type="button"
                    className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-1"
                    onClick={() => window.print()}
                  >
                    <Printer size={14} /> Xuất In / Lưu PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TỪ ĐIỂN THẺ BIẾN MAIL MERGE (TAG DICTIONARY) */}
      {/* ========================================================================= */}
      {showTagDictionary && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark font-heading d-flex align-items-center gap-2">
                  <Code size={20} className="text-primary" /> Từ Điển Thẻ Biến Trộn Dữ Liệu Chuẩn (Mail Merge Tags)
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowTagDictionary(false)} />
              </div>

              <div className="modal-body py-3">
                <p className="small text-muted mb-3">
                  Bạn có thể sao chép bất kỳ thẻ biến nào dưới đây và dán trực tiếp vào file Word / Google Docs mẫu. Hệ thống sẽ tự động điền dữ liệu tương ứng:
                </p>

                <div className="row g-3">
                  {/* Nhóm Thông tin Khách hàng */}
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border h-100">
                      <h6 className="fw-bold text-dark small mb-2 text-primary">1. Thông Tin Khách Hàng & Thành Viên</h6>
                      <ul className="list-unstyled small d-flex flex-column gap-1 m-0">
                        <li><code>{'{{HoTen}}'}</code>: Họ và tên khách hàng</li>
                        <li><code>{'{{MaKH}}'}</code>: Mã khách hàng (KH008892)</li>
                        <li><code>{'{{SoCCCD}}'}</code>: Số CCCD 12 chữ số</li>
                        <li><code>{'{{NgayCapCCCD}}'}</code>: Ngày cấp CCCD</li>
                        <li><code>{'{{DiaChi}}'}</code>: Địa chỉ thường trú</li>
                        <li><code>{'{{DienThoai}}'}</code>: Số điện thoại liên hệ</li>
                        <li><code>{'{{SoTV}}'}</code>: Mã số thành viên QTDND</li>
                        <li><code>{'{{SoTKCASA}}'}</code>: Số tài khoản tiền gửi CASA</li>
                      </ul>
                    </div>
                  </div>

                  {/* Nhóm Hợp đồng & Tín dụng */}
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border h-100">
                      <h6 className="fw-bold text-dark small mb-2 text-success">2. Hợp Đồng Tín Dụng & Dư Nợ</h6>
                      <ul className="list-unstyled small d-flex flex-column gap-1 m-0">
                        <li><code>{'{{SoHDTD}}'}</code>: Số hợp đồng / khế ước</li>
                        <li><code>{'{{TienVay}}'}</code>: Số tiền giải ngân ban đầu</li>
                        <li><code>{'{{DuNo}}'}</code>: Dư nợ gốc hiện tại</li>
                        <li><code>{'{{LaiSuat}}'}</code>: Lãi suất cho vay (%/năm)</li>
                        <li><code>{'{{NgayVay}}'}</code>: Ngày bắt đầu nhận nợ</li>
                        <li><code>{'{{DenHan}}'}</code>: Ngày kết thúc thời hạn vay</li>
                        <li><code>{'{{TraLaiDenNgay}}'}</code>: Ngày đã thu lãi gần nhất</li>
                        <li><code>{'{{MucDichVay}}'}</code>: Phương án sản xuất kinh doanh</li>
                      </ul>
                    </div>
                  </div>

                  {/* Nhóm Thẩm định & Tài sản */}
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border h-100">
                      <h6 className="fw-bold text-dark small mb-2 text-warning">3. Thẩm Định & Tài Sản Thế Chấp</h6>
                      <ul className="list-unstyled small d-flex flex-column gap-1 m-0">
                        <li><code>{'{{LoaiTSBD}}'}</code>: Loại tài sản bảo đảm (QSDĐ, Xe...)</li>
                        <li><code>{'{{GiaTriTSBD}}'}</code>: Giá trị định giá TSĐB</li>
                        <li><code>{'{{TyLeLTV}}'}</code>: Tỷ lệ cho vay trên TSĐB</li>
                        <li><code>{'{{XepHangCIC}}'}</code>: Điểm tín dụng và xếp hạng CIC</li>
                        <li><code>{'{{CanBoThamDinh}}'}</code>: Họ tên cán bộ lập thẩm định</li>
                        <li><code>{'{{KetLuan}}'}</code>: Kết luận phê duyệt cấp tín dụng</li>
                      </ul>
                    </div>
                  </div>

                  {/* Nhóm Kiểm tra & Trích nợ */}
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border h-100">
                      <h6 className="fw-bold text-dark small mb-2 text-danger">4. Kiểm Tra Vốn & Trích Nợ</h6>
                      <ul className="list-unstyled small d-flex flex-column gap-1 m-0">
                        <li><code>{'{{NgayKiemTra}}'}</code>: Ngày thực hiện kiểm tra vốn</li>
                        <li><code>{'{{ThanhPhanDoan}}'}</code>: Danh sách thành viên đoàn KT</li>
                        <li><code>{'{{DiaDiemKT}}'}</code>: Địa điểm kiểm tra thực tế</li>
                        <li><code>{'{{NgayKTNext}}'}</code>: Ngày kiểm tra định kỳ lần tới</li>
                        <li><code>{'{{SoTienTrich}}'}</code>: Số tiền trích nợ tự động</li>
                        <li><code>{'{{KyTrichNo}}'}</code>: Kỳ trích nợ (Kỳ 1, 2, 3)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-brand fw-bold" onClick={() => setShowTagDictionary(false)}>
                  Đã Hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
