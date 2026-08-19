import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  FileDown,
  ExternalLink,
  Calendar,
  Users,
  ShieldCheck,
  AlertTriangle,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  Filter,
  Image,
  FolderOpen
} from 'lucide-react';
import { api } from '../services/api';
import { formatDateVN, formatDateTimeVN, getTodayISO, toISODateString } from '../utils/dateUtils';
import Pagination from './Pagination';

const INSPECTION_TEAMS = [
  { id: 'ALL', label: 'Tất Cả Đoàn KT', color: 'btn-secondary' },
  { id: 'CBTD', label: 'Cán Bộ Tín Dụng (CBTD)', color: 'btn-outline-success', badge: 'badge-brand-soft' },
  { id: 'BKS', label: 'Ban Kiểm Soát (BKS)', color: 'btn-outline-warning', badge: 'badge-warning-soft' },
  { id: 'HDQT', label: 'Hội Đồng Quản Trị (HĐQT)', color: 'btn-outline-primary', badge: 'badge-danger-soft' }
];

export default function LoanInspection({ prefilledContract }) {
  const [inspections, setInspections] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    soHDTD: '',
    maKH: '',
    hoTen: '',
    loaiDoanKT: 'CBTD',
    thanhPhanDoan: 'Lê Văn Tín (CBTD)',
    ngayKiemTra: getTodayISO(),
    lanKiemTra: 'Lần 1 (Sau giải ngân 30 ngày)',
    ngayKTNext: '',
    hinhThuc: 'Thực địa tại cơ sở',
    diaDiemKT: '',
    danhGiaMucDich: 'Đúng mục đích 100%',
    tienDoSuDungVon: 'Đã giải ngân và đưa vào sản xuất kinh doanh',
    mucDoRuiRo: 'Thấp',
    moTaThucTe: '',
    kienNghi: 'Tiếp tục duy trì dư nợ và theo dõi định kỳ',
    fileBienBanUrl: '',
    hinhAnhKiemTra: ''
  });

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const res = await api.getInspections();
      if (res.status === 'success' && res.data) {
        setInspections(res.data);
      }
    } catch (e) {
      console.error('Lỗi tải danh sách kiểm tra vốn:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  useEffect(() => {
    if (prefilledContract) {
      // Tự động tính ngày kiểm tra tiếp theo (+3 tháng)
      const d = new Date();
      d.setMonth(d.getMonth() + 3);
      const nextDateStr = toISODateString(d);

      setFormData(prev => ({
        ...prev,
        soHDTD: prefilledContract.soHDTD || '',
        maKH: prefilledContract.maKH || '',
        hoTen: prefilledContract.hoTen || '',
        ngayKTNext: nextDateStr
      }));
      setShowModal(true);
    }
  }, [prefilledContract]);

  // Gợi ý tính ngày kiểm tra tiếp theo
  const setNextDateByMonths = (months) => {
    const baseDate = formData.ngayKiemTra ? new Date(formData.ngayKiemTra) : new Date();
    baseDate.setMonth(baseDate.getMonth() + months);
    setFormData(prev => ({ ...prev, ngayKTNext: toISODateString(baseDate) }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.soHDTD || !formData.hoTen) {
      alert('Vui lòng nhập đầy đủ Số Hợp đồng và Họ tên khách hàng.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.saveLoanInspection(formData);
      if (res.status === 'success') {
        alert(res.message || 'Đã lưu Biên bản kiểm tra sử dụng vốn thành công!');
        setShowModal(false);
        fetchInspections();
      } else {
        alert(res.message || 'Lỗi lưu biên bản.');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Lọc dữ liệu đa tiêu chí
  const filteredInspections = inspections.filter(item => {
    const matchSearch =
      !searchTerm ||
      item.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.soHDTD?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maKH?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maBBKT?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.thanhPhanDoan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.diaDiemKT?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchTeam = teamFilter === 'ALL' || item.loaiDoanKT === teamFilter;
    const matchRisk = riskFilter === 'ALL' || item.mucDoRuiRo === riskFilter;

    return matchSearch && matchTeam && matchRisk;
  });

  const paginatedInspections = filteredInspections.slice((page - 1) * pageSize, page * pageSize);

  // Thống kê nhanh
  const countTotal = inspections.length;
  const countCBTD = inspections.filter(i => i.loaiDoanKT === 'CBTD').length;
  const countBKS = inspections.filter(i => i.loaiDoanKT === 'BKS').length;
  const countHDQT = inspections.filter(i => i.loaiDoanKT === 'HDQT').length;

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. KPIs Thống Kê Đoàn Kiểm Tra */}
      <div className="row g-3">
        <div className="col-sm-6 col-xl-3">
          <div className="card-modern p-3 d-flex align-items-center gap-3">
            <div
              className="p-3 rounded-3 text-dark d-flex align-items-center justify-content-center"
              style={{ background: 'linear-gradient(135deg, #9acd32 0%, #047857 100%)', width: 48, height: 48 }}
            >
              <ClipboardList size={24} className="text-white" />
            </div>
            <div>
              <span className="text-muted small fw-bold">TỔNG HỒ SƠ ĐÃ KT</span>
              <h4 className="fw-bold text-dark m-0 num-tabular">{countTotal} hồ sơ</h4>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card-modern p-3 d-flex align-items-center gap-3">
            <div className="p-3 rounded-3 bg-success-subtle text-success d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
              <Users size={24} />
            </div>
            <div>
              <span className="text-muted small fw-bold">CBTD KIỂM TRA</span>
              <h4 className="fw-bold text-success m-0 num-tabular">{countCBTD} biên bản</h4>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card-modern p-3 d-flex align-items-center gap-3">
            <div className="p-3 rounded-3 bg-warning-subtle text-warning d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="text-muted small fw-bold">BKS KIỂM TRA</span>
              <h4 className="fw-bold text-warning m-0 num-tabular">{countBKS} biên bản</h4>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card-modern p-3 d-flex align-items-center gap-3">
            <div className="p-3 rounded-3 bg-danger-subtle text-danger d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <span className="text-muted small fw-bold">HĐQT KIỂM TRA</span>
              <h4 className="fw-bold text-danger m-0 num-tabular">{countHDQT} biên bản</h4>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Thanh Điều Khiển & Bộ Lọc Đa Chiều */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Lọc theo đoàn kiểm tra */}
          <div className="btn-group p-1 bg-light rounded-3 border">
            {INSPECTION_TEAMS.map(team => (
              <button
                key={team.id}
                type="button"
                className={`btn btn-sm ${teamFilter === team.id ? 'btn-brand fw-bold shadow-sm' : 'btn-light text-muted'}`}
                onClick={() => setTeamFilter(team.id)}
              >
                {team.label}
              </button>
            ))}
          </div>

          {/* Lọc mức độ rủi ro */}
          <select
            className="form-select form-select-sm"
            style={{ width: 140 }}
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="ALL">Mọi mức rủi ro</option>
            <option value="Thấp">Rủi ro: Thấp</option>
            <option value="Trung bình">Rủi ro: Trung bình</option>
            <option value="Cao">Rủi ro: Cao</option>
          </select>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Ô tìm kiếm */}
          <div className="input-group input-group-sm" style={{ width: 260 }}>
            <span className="input-group-text bg-white border-end-0 text-muted">
              <Search size={14} />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Tìm theo HĐTD, Tên KH, Cán bộ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Nút Lập Biên Bản */}
          <button
            className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
            onClick={() => {
              const d = new Date();
              d.setMonth(d.getMonth() + 3);
              setFormData({
                soHDTD: '',
                maKH: '',
                hoTen: '',
                loaiDoanKT: 'CBTD',
                thanhPhanDoan: 'Lê Văn Tín (CBTD)',
                ngayKiemTra: getTodayISO(),
                lanKiemTra: 'Lần 1 (Sau giải ngân 30 ngày)',
                ngayKTNext: toISODateString(d),
                hinhThuc: 'Thực địa tại cơ sở',
                diaDiemKT: '',
                danhGiaMucDich: 'Đúng mục đích 100%',
                tienDoSuDungVon: 'Đã giải ngân và đưa vào sản xuất kinh doanh',
                mucDoRuiRo: 'Thấp',
                moTaThucTe: '',
                kienNghi: 'Tiếp tục duy trì dư nợ và theo dõi định kỳ',
                fileBienBanUrl: '',
                hinhAnhKiemTra: ''
              });
              setShowModal(true);
            }}
          >
            <Plus size={16} /> Lập Biên Bản Kiểm Tra Mới
          </button>
        </div>
      </div>

      {/* 3. Bảng Danh Sách Biên Bản Kiểm Tra Sử Dụng Vốn */}
      <div className="card-modern p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-slate-800 m-0 font-heading d-flex align-items-center gap-2">
            <ClipboardList size={20} className="text-success" /> Sổ Theo Dõi Kiểm Tra Sử Dụng Vốn Sau Giải Ngân
          </h5>
          <span className="badge bg-light text-muted border">
            Hiển thị {filteredInspections.length} / {inspections.length} biên bản
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-custom align-middle">
            <thead>
              <tr>
                <th>Mã BBKT / Hợp Đồng</th>
                <th>Khách Hàng Vay Vốn</th>
                <th>Đoàn & Thành Phần Kiểm Tra</th>
                <th>Ngày Kiểm Tra</th>
                <th>Lần KT Tiếp Theo</th>
                <th>Đánh Giá & Rủi Ro</th>
                <th className="text-center">Tệp Biên Bản</th>
                <th className="text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInspections.length > 0 ? (
                paginatedInspections.map((item) => {
                  const isCBTD = item.loaiDoanKT === 'CBTD';
                  const isBKS = item.loaiDoanKT === 'BKS';
                  const isHDQT = item.loaiDoanKT === 'HDQT';

                  const badgeClass = isCBTD
                    ? 'badge-brand-soft'
                    : isBKS
                    ? 'badge-warning-soft'
                    : 'badge-danger-soft';

                  const teamName = isCBTD ? 'CBTD' : isBKS ? 'BKS' : 'HĐQT';

                  return (
                    <tr key={item.maBBKT}>
                      <td>
                        <div className="fw-bold font-monospace text-dark">{item.maBBKT}</div>
                        <div className="small fw-semibold text-primary font-monospace">{item.soHDTD}</div>
                        <span className="badge bg-light text-muted border" style={{ fontSize: '0.68rem' }}>
                          {item.lanKiemTra}
                        </span>
                      </td>

                      <td>
                        <div className="fw-bold text-dark">{item.hoTen}</div>
                        <div className="small text-muted font-monospace">{item.maKH}</div>
                        <div className="small text-muted text-truncate" style={{ maxWidth: 180 }}>
                          {item.diaDiemKT || 'Tại cơ sở khách hàng'}
                        </div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-1 mb-1">
                          <span className={`badge-status ${badgeClass}`}>
                            {teamName}
                          </span>
                        </div>
                        <div className="small text-dark fw-medium" style={{ fontSize: '0.78rem', maxWidth: 220 }}>
                          {item.thanhPhanDoan || 'Cán bộ phụ trách'}
                        </div>
                        <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                          Hình thức: {item.hinhThuc}
                        </div>
                      </td>

                      <td>
                        <div className="fw-bold text-dark num-tabular d-flex align-items-center gap-1">
                          <Calendar size={13} className="text-muted" />
                          {formatDateVN(item.ngayKiemTra)}
                        </div>
                        <span className="badge bg-success-subtle text-success" style={{ fontSize: '0.68rem' }}>
                          ĐÃ DUYỆT
                        </span>
                      </td>

                      <td>
                        {item.ngayKTNext ? (
                          <div>
                            <div className="fw-bold text-danger num-tabular d-flex align-items-center gap-1">
                              <Clock size={13} />
                              {formatDateVN(item.ngayKTNext)}
                            </div>
                            <span className="badge bg-warning-subtle text-warning fw-bold" style={{ fontSize: '0.68rem' }}>
                              ĐẾN HẠN KT
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted small">---</span>
                        )}
                      </td>

                      <td>
                        <div className="small text-dark fw-semibold text-truncate" style={{ maxWidth: 200 }} title={item.danhGiaMucDich}>
                          {item.danhGiaMucDich}
                        </div>
                        <div className="d-flex align-items-center gap-1 mt-1">
                          <span
                            className={`badge-status ${
                              item.mucDoRuiRo === 'Thấp'
                                ? 'badge-success-soft'
                                : item.mucDoRuiRo === 'Trung bình'
                                ? 'badge-warning-soft'
                                : 'badge-danger-soft'
                            }`}
                            style={{ fontSize: '0.68rem' }}
                          >
                            Rủi ro: {item.mucDoRuiRo}
                          </span>
                        </div>
                      </td>

                      <td className="text-center">
                        <div className="d-flex flex-column align-items-center gap-1">
                          {item.fileBienBanUrl ? (
                            <a
                              href={item.fileBienBanUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 py-1 px-2"
                              style={{ fontSize: '0.72rem' }}
                              title="Tải / Xem tệp Biên bản kiểm tra"
                            >
                              <FileDown size={13} /> Tải Biên Bản
                            </a>
                          ) : (
                            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>Chưa đính kèm file</span>
                          )}

                          {item.hinhAnhKiemTra && (
                            <a
                              href={item.hinhAnhKiemTra}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1 py-0 px-2"
                              style={{ fontSize: '0.7rem' }}
                              title="Xem ảnh hiện trường thực địa"
                            >
                              <Image size={11} /> Xem Ảnh Thực Địa
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-brand d-inline-flex align-items-center gap-1 fw-semibold"
                          onClick={() => {
                            setSelectedInspection(item);
                            setShowDetailModal(true);
                          }}
                          title="Xem chi tiết & In biên bản"
                        >
                          <Eye size={14} /> Chi Tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    {loading ? 'Đang tải dữ liệu kiểm tra vốn...' : 'Chưa có hồ sơ kiểm tra nào phù hợp.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang chuẩn 15 dòng */}
        <Pagination
          currentPage={page}
          totalItems={filteredInspections.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* ========================================================================= */}
      {/* MODAL: LẬP BIÊN BẢN KIỂM TRA SỬ DỤNG VỐN MỚI */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <div>
                  <h5 className="modal-title fw-bold text-dark font-heading">
                    Lập Biên Bản Kiểm Tra Sử Dụng Vốn
                  </h5>
                  <span className="text-muted small">
                    Ghi nhận kết quả kiểm tra thực địa, đánh giá mục đích sử dụng vốn và phân loại rủi ro
                  </span>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body py-3">
                  <div className="row g-3">
                    {/* Hợp đồng & Khách hàng */}
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-dark">Số Hợp Đồng Tín Dụng (*)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="vd: KU-2025-0982"
                        value={formData.soHDTD}
                        onChange={(e) => setFormData({ ...formData, soHDTD: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-dark">Mã Khách Hàng</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="vd: KH008892"
                        value={formData.maKH}
                        onChange={(e) => setFormData({ ...formData, maKH: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-dark">Họ Và Tên Khách Hàng (*)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="vd: Nguyễn Văn An"
                        value={formData.hoTen}
                        onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                        required
                      />
                    </div>

                    {/* Đoàn kiểm tra & Thành phần */}
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-dark">Đoàn Kiểm Tra (*)</label>
                      <select
                        className="form-select fw-semibold"
                        value={formData.loaiDoanKT}
                        onChange={(e) => {
                          const val = e.target.value;
                          const defaultMembers =
                            val === 'CBTD' ? 'Lê Văn Tín (CBTD)' :
                            val === 'BKS' ? 'Nguyễn Kiểm Soát (Trưởng BKS), Lê Văn Tín (CBTD)' :
                            'Phạm Giám Đốc (Chủ tịch HĐQT), Nguyễn Kiểm Soát (BKS), Lê Văn Tín (CBTD)';
                          setFormData({ ...formData, loaiDoanKT: val, thanhPhanDoan: defaultMembers });
                        }}
                      >
                        <option value="CBTD">Cán Bộ Tín Dụng (CBTD)</option>
                        <option value="BKS">Ban Kiểm Soát (BKS)</option>
                        <option value="HDQT">Hội Đồng Quản Trị / Ban Giám Đốc (HĐQT)</option>
                      </select>
                    </div>

                    <div className="col-md-8">
                      <label className="form-label small fw-bold text-dark">Thành Phần Đoàn Kiểm Tra (*)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="vd: Lê Văn Tín (CBTD), Trần Thị Toán (Kế toán)..."
                        value={formData.thanhPhanDoan}
                        onChange={(e) => setFormData({ ...formData, thanhPhanDoan: e.target.value })}
                        required
                      />
                    </div>

                    {/* Ngày kiểm tra & Lần kiểm tra tiếp theo */}
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-dark">Ngày Kiểm Tra Thực Tế (*)</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.ngayKiemTra}
                        onChange={(e) => setFormData({ ...formData, ngayKiemTra: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-dark">Lần Kiểm Tra</label>
                      <select
                        className="form-select"
                        value={formData.lanKiemTra}
                        onChange={(e) => setFormData({ ...formData, lanKiemTra: e.target.value })}
                      >
                        <option value="Lần 1 (Sau giải ngân 30 ngày)">Lần 1 (Sau giải ngân 30 ngày)</option>
                        <option value="Lần 2 (Định kỳ 6 tháng)">Lần 2 (Định kỳ 6 tháng)</option>
                        <option value="Lần 3 (Định kỳ hàng năm)">Lần 3 (Định kỳ hàng năm)</option>
                        <option value="Kiểm tra đột xuất">Kiểm tra đột xuất</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold text-dark m-0">Ngày KT Lần Tới</label>
                        <div className="d-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-secondary py-0 px-1"
                            style={{ fontSize: '0.65rem' }}
                            onClick={() => setNextDateByMonths(3)}
                          >
                            +3T
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-secondary py-0 px-1"
                            style={{ fontSize: '0.65rem' }}
                            onClick={() => setNextDateByMonths(6)}
                          >
                            +6T
                          </button>
                        </div>
                      </div>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.ngayKTNext}
                        onChange={(e) => setFormData({ ...formData, ngayKTNext: e.target.value })}
                      />
                    </div>

                    {/* Hình thức & Địa điểm */}
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-dark">Hình Thức Kiểm Tra</label>
                      <select
                        className="form-select"
                        value={formData.hinhThuc}
                        onChange={(e) => setFormData({ ...formData, hinhThuc: e.target.value })}
                      >
                        <option value="Thực địa tại cơ sở">Thực địa tại cơ sở</option>
                        <option value="Kiểm tra hóa đơn chứng từ">Kiểm tra hóa đơn chứng từ</option>
                        <option value="Kết hợp thực địa & chứng từ">Kết hợp thực địa & chứng từ</option>
                      </select>
                    </div>

                    <div className="col-md-8">
                      <label className="form-label small fw-bold text-dark">Địa Điểm Kiểm Tra Thực Tế</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="vd: Thôn 3, Xã Yên Thọ (Trang trại chăn nuôi bò)"
                        value={formData.diaDiemKT}
                        onChange={(e) => setFormData({ ...formData, diaDiemKT: e.target.value })}
                      />
                    </div>

                    {/* Đánh giá & Rủi ro */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Đánh Giá Mục Đích Vốn (*)</label>
                      <select
                        className="form-select fw-semibold"
                        value={formData.danhGiaMucDich}
                        onChange={(e) => setFormData({ ...formData, danhGiaMucDich: e.target.value })}
                      >
                        <option value="Đúng mục đích 100%">Đúng mục đích 100%</option>
                        <option value="Sai mục đích một phần">Sai mục đích một phần (Cần khắc phục)</option>
                        <option value="Sai mục đích toàn bộ">Sai mục đích toàn bộ (Thu hồi nợ gấp)</option>
                        <option value="Chưa đưa vào sử dụng">Chưa đưa vào sử dụng</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Mức Độ Rủi Ro Tín Dụng</label>
                      <select
                        className="form-select fw-semibold"
                        value={formData.mucDoRuiRo}
                        onChange={(e) => setFormData({ ...formData, mucDoRuiRo: e.target.value })}
                      >
                        <option value="Thấp">Thấp (Khách hàng làm ăn hiệu quả)</option>
                        <option value="Trung bình">Trung bình (Cần đôn đốc nhắc nhở)</option>
                        <option value="Cao">Cao (Có nguy cơ nợ quá hạn)</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-dark">Tiến Độ Giải Ngân & Sử Dụng Vốn</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="vd: Đã mua 6 con bò sữa giống Pháp, chuồng trại hoàn thành 100%..."
                        value={formData.tienDoSuDungVon}
                        onChange={(e) => setFormData({ ...formData, tienDoSuDungVon: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-dark">Ghi Nhận Thực Tế Tại Hiện Trường</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Ghi nhận hiện trạng tài sản, hoạt động SXKD, doanh thu thực tế..."
                        value={formData.moTaThucTe}
                        onChange={(e) => setFormData({ ...formData, moTaThucTe: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-dark">Kết Luận & Kiến Nghị Của Đoàn Kiểm Tra</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Kiến nghị tiếp tục cho vay, nâng hạn mức hoặc thu hồi nợ trước hạn..."
                        value={formData.kienNghi}
                        onChange={(e) => setFormData({ ...formData, kienNghi: e.target.value })}
                      />
                    </div>

                    {/* File Upload Links */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1">
                        <FileDown size={14} className="text-primary" /> Link Tệp Biên Bản Đã Ký (Google Drive URL)
                      </label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://drive.google.com/file/d/..."
                        value={formData.fileBienBanUrl}
                        onChange={(e) => setFormData({ ...formData, fileBienBanUrl: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1">
                        <Image size={14} className="text-success" /> Link Thư Mục Ảnh Thực Địa (Google Drive URL)
                      </label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://drive.google.com/drive/folders/..."
                        value={formData.hinhAnhKiemTra}
                        onChange={(e) => setFormData({ ...formData, hinhAnhKiemTra: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-brand fw-bold d-flex align-items-center gap-2" disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Lưu Biên Bản Kiểm Tra'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: XEM CHI TIẾT & IN BIÊN BẢN KIỂM TRA SỬ DỤNG VỐN */}
      {/* ========================================================================= */}
      {showDetailModal && selectedInspection && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <div>
                  <span className="badge bg-success-subtle text-success mb-1">
                    BIÊN BẢN KIỂM TRA SỐ: {selectedInspection.maBBKT}
                  </span>
                  <h5 className="modal-title fw-bold text-dark font-heading">
                    Biên Bản Kiểm Tra Sử Dụng Vốn Vay Sau Giải Ngân
                  </h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)} />
              </div>

              <div className="modal-body py-3">
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="row g-2 small">
                    <div className="col-sm-6">
                      <span className="text-muted">Khách hàng:</span> <strong className="text-dark">{selectedInspection.hoTen}</strong> ({selectedInspection.maKH})
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted">Hợp đồng tín dụng:</span> <strong className="text-primary font-monospace">{selectedInspection.soHDTD}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted">Đoàn kiểm tra:</span> <span className="badge bg-dark text-white">{selectedInspection.loaiDoanKT}</span>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted">Ngày kiểm tra:</span> <strong className="text-dark">{formatDateVN(selectedInspection.ngayKiemTra)}</strong>
                    </div>
                    <div className="col-12">
                      <span className="text-muted">Thành phần đoàn:</span> <strong className="text-dark">{selectedInspection.thanhPhanDoan}</strong>
                    </div>
                    <div className="col-12">
                      <span className="text-muted">Địa điểm:</span> <span className="text-dark">{selectedInspection.diaDiemKT || 'Tại cơ sở khách hàng'}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.88rem' }}>1. Đánh Giá Mục Đích & Tiến Độ Vốn:</h6>
                  <div className="p-2 border rounded-2 bg-white small">
                    <div><strong>Đánh giá mục đích:</strong> <span className="text-success fw-bold">{selectedInspection.danhGiaMucDich}</span></div>
                    <div className="mt-1"><strong>Tiến độ sử dụng vốn:</strong> {selectedInspection.tienDoSuDungVon || 'Đã giải ngân hết'}</div>
                    <div className="mt-1"><strong>Mức độ rủi ro:</strong> <span className="badge bg-success">{selectedInspection.mucDoRuiRo}</span></div>
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.88rem' }}>2. Ghi Nhận Hiện Trường & Kiến Nghị:</h6>
                  <div className="p-2 border rounded-2 bg-white small">
                    <p className="m-0 mb-2"><strong>Hiện trạng thực tế:</strong> {selectedInspection.moTaThucTe || 'Khách hàng sử dụng vốn đúng phương án vay.'}</p>
                    <p className="m-0"><strong>Kiến nghị của đoàn:</strong> {selectedInspection.kienNghi || 'Tiếp tục theo dõi định kỳ.'}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.88rem' }}>3. Lần Kiểm Tra Tiếp Theo:</h6>
                  <div className="p-2 border rounded-2 bg-white small d-flex align-items-center justify-content-between">
                    <div>
                      <span className="text-muted">Ngày dự kiến kiểm tra tiếp:</span>{' '}
                      <strong className="text-primary font-monospace fs-6">
                        {selectedInspection.ngayKTNext ? formatDateVN(selectedInspection.ngayKTNext) : 'Chưa xếp lịch'}
                      </strong>
                    </div>
                    <span className="badge bg-warning text-dark">Kiểm tra định kỳ 6 tháng</span>
                  </div>
                </div>

                {/* File Links Preview */}
                <div className="d-flex gap-2 flex-wrap">
                  {selectedInspection.fileBienBanUrl && (
                    <a
                      href={selectedInspection.fileBienBanUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                    >
                      <FileDown size={14} /> Tải Tệp Biên Bản Đính Kèm (PDF)
                    </a>
                  )}

                  {selectedInspection.hinhAnhKiemTra && (
                    <a
                      href={selectedInspection.hinhAnhKiemTra}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                    >
                      <FolderOpen size={14} /> Mở Thư Mục Ảnh Thực Địa
                    </a>
                  )}
                </div>
              </div>

              <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm d-flex align-items-center gap-1"
                  onClick={() => window.print()}
                >
                  <Printer size={15} /> In Biên Bản
                </button>
                <button type="button" className="btn btn-light" onClick={() => setShowDetailModal(false)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
