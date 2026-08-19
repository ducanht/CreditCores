import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Shield,
  Send,
  Eye,
  Building,
  CreditCard,
  Printer,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { AuthService } from '../services/auth';
import { formatDateVN, formatCurrencyVN, getTodayISO } from '../utils/dateUtils';
import ThousandInput from './ThousandInput';
import Pagination from './Pagination';

export default function Appraisal({ prefilledCustomer, onOpenCustomerQuickView }) {
  const currentUser = AuthService.getCurrentUser();
  const [appraisals, setAppraisals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showOpinionModal, setShowOpinionModal] = useState(false);
  const [selectedAppraisal, setSelectedAppraisal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKetLuan, setFilterKetLuan] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    maKH: '',
    hoTen: '',
    deXuatVay: 300000000,
    duyetVay: 300000000,
    thoiHanThang: 12,
    laiSuatDuyet: 9.5,
    thuNhapThang: 25000000,
    chiPhiThang: 10000000,
    xepHangCIC: 'Hạng 1 (Tốt / Điểm 685)',
    soTCTDQuanHe: 1,
    duNoCICNgoai: 0,
    ghiChuCIC: 'Không có nợ cần chú ý trong 3 năm gần nhất. Lịch sử trả nợ đầy đủ đúng hạn tại Agribank.',
    loaiTSBD: 'QSDĐ (Sổ đỏ / Sổ hồng)',
    chuSoHuuTSBD: '',
    moTaTSBD: 'GCN QSDĐ số DT 123456, Thửa 42, TBĐ 08. DT: 150m2 tại Thôn 3, Yên Thọ.',
    giaTriTSBD: 600000000,
    hinhAnhTSBD: '',
    hinhAnhThamDinh: '',
    mucDoRuiRo: 'Thấp',
    ketLuan: 'Đồng ý cấp tín dụng',
    canBoThamDinh: currentUser?.fullName || 'Lê Văn Tín'
  });

  // Opinion Form State
  const [opinionForm, setOpinionForm] = useState({
    decision: 'Đồng ý cấp tín dụng',
    approvedAmount: 300000000,
    note: ''
  });

  const fetchAppraisals = async () => {
    setLoading(true);
    try {
      const res = await api.getAppraisals();
      if (res.status === 'success' && res.data) {
        setAppraisals(res.data);
      }
    } catch (e) {
      console.error('Lỗi tải danh sách thẩm định:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppraisals();
  }, []);

  useEffect(() => {
    if (prefilledCustomer) {
      setFormData(prev => ({
        ...prev,
        maKH: prefilledCustomer.maKH,
        hoTen: prefilledCustomer.hoTen,
        chuSoHuuTSBD: prefilledCustomer.hoTen + ' (Chính chủ)',
        moTaTSBD: `Tài sản bảo đảm của khách hàng ${prefilledCustomer.hoTen} tại ${prefilledCustomer.diaChi || 'Yên Thọ'}`
      }));
      setShowModal(true);
    }
  }, [prefilledCustomer]);

  const thangDu = Math.max(0, formData.thuNhapThang - formData.chiPhiThang);
  const ltvPercent = formData.giaTriTSBD > 0 ? ((formData.duyetVay / formData.giaTriTSBD) * 100).toFixed(1) + '%' : '0%';

  const handleSaveAppraisal = async (e) => {
    if (e) e.preventDefault();
    if (!formData.maKH || !formData.hoTen) {
      alert('Vui lòng nhập Mã KH và Họ tên khách hàng.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        tyLeLTV: ltvPercent,
        danhSachYKien: [
          {
            role: currentUser?.role || 'CBTD',
            evaluatorName: currentUser?.fullName || 'Cán bộ thẩm định',
            decision: formData.ketLuan,
            approvedAmount: formData.duyetVay,
            note: 'Đề xuất ban đầu từ hồ sơ thẩm định thực địa',
            createdAt: new Date().toLocaleString('vi-VN')
          }
        ]
      };
      const res = await api.saveAppraisalReport(payload);
      if (res.status === 'success') {
        alert(res.message || 'Đã lưu báo cáo thẩm định thành công!');
        setShowModal(false);
        fetchAppraisals();
      } else {
        alert(res.message || 'Lỗi lưu báo cáo.');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddOpinionSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedAppraisal) return;

    setSaving(true);
    try {
      const payload = {
        maBCTD: selectedAppraisal.maBCTD,
        role: currentUser?.role || 'CBTD',
        evaluatorName: currentUser?.fullName || currentUser?.username || 'Cán bộ',
        decision: opinionForm.decision,
        approvedAmount: opinionForm.approvedAmount,
        note: opinionForm.note
      };

      const res = await api.addApprovalOpinion(payload);
      if (res.status === 'success') {
        alert(res.message || 'Đã ghi nhận ý kiến đánh giá thành công!');
        setShowOpinionModal(false);
        setOpinionForm({ decision: 'Đồng ý cấp tín dụng', approvedAmount: selectedAppraisal.duyetVay, note: '' });
        fetchAppraisals();
        const updatedList = (await api.getAppraisals()).data || [];
        const currentUpdated = updatedList.find(a => a.maBCTD === selectedAppraisal.maBCTD);
        if (currentUpdated) setSelectedAppraisal(currentUpdated);
      } else {
        alert(res.message || 'Lỗi ghi nhận ý kiến.');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredAppraisals = appraisals.filter(a => {
    const matchesSearch = !searchTerm ||
      a.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.maKH?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.maBCTD?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.canBoThamDinh?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesKetLuan = filterKetLuan === 'ALL' || a.ketLuan === filterKetLuan;
    return matchesSearch && matchesKetLuan;
  });

  const paginatedAppraisals = filteredAppraisals.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Controls */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center flex-wrap gap-2">
          {/* Bộ lọc Kết luận */}
          <select
            className="form-select form-select-sm"
            style={{ width: 170 }}
            value={filterKetLuan}
            onChange={(e) => {
              setFilterKetLuan(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả Kết Luận</option>
            <option value="Đồng ý cấp tín dụng">Đồng ý cấp tín dụng</option>
            <option value="Đồng ý có điều kiện">Đồng ý có điều kiện</option>
            <option value="Từ chối cấp tín dụng">Từ chối cấp tín dụng</option>
          </select>

          <div className="input-group input-group-sm" style={{ width: 260 }}>
            <span className="input-group-text bg-white border-end-0 text-muted">
              <Search size={14} />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Tìm theo Mã BCTD, Mã KH, Họ tên..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <button
          className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-2 shadow-sm"
          onClick={() => {
            setFormData({
              maKH: '',
              hoTen: '',
              deXuatVay: 300000000,
              duyetVay: 300000000,
              thoiHanThang: 12,
              laiSuatDuyet: 9.5,
              thuNhapThang: 25000000,
              chiPhiThang: 10000000,
              xepHangCIC: 'Hạng 1 (Tốt / Điểm 685)',
              soTCTDQuanHe: 1,
              duNoCICNgoai: 0,
              ghiChuCIC: 'Không có nợ cần chú ý trong 3 năm gần nhất. Lịch sử trả nợ đầy đủ đúng hạn tại Agribank.',
              loaiTSBD: 'QSDĐ (Sổ đỏ / Sổ hồng)',
              chuSoHuuTSBD: '',
              moTaTSBD: '',
              giaTriTSBD: 600000000,
              hinhAnhTSBD: '',
              hinhAnhThamDinh: '',
              mucDoRuiRo: 'Thấp',
              ketLuan: 'Đồng ý cấp tín dụng',
              canBoThamDinh: currentUser?.fullName || 'Lê Văn Tín'
            });
            setShowModal(true);
          }}
        >
          <Plus size={16} /> Lập Báo Cáo Thẩm Định Mới
        </button>
      </div>

      {/* Bảng Danh Sách Hồ Sơ Thẩm Định */}
      <div className="card-modern p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-slate-800 m-0 font-heading d-flex align-items-center gap-2">
            <FileCheck2 size={20} className="text-success" /> Sổ Theo Dõi Thẩm Định & Đánh Giá Phê Duyệt Đa Cấp
          </h5>
          <span className="badge bg-light text-muted border">
            {filteredAppraisals.length} hồ sơ
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-custom align-middle">
            <thead>
              <tr>
                <th>Mã BCTD</th>
                <th>Khách Hàng Vay</th>
                <th className="text-end">Đề Xuất / Duyệt Vay</th>
                <th>Thông Tin & Điểm CIC</th>
                <th>Tài Sản Bảo Đảm (LTV)</th>
                <th>Ý Kiến Phê Duyệt ({currentUser?.role === 'ADMIN' ? 'Admin Tổng Hợp' : 'Đa Cấp'})</th>
                <th className="text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAppraisals.length > 0 ? (
                paginatedAppraisals.map((item) => {
                  const opinions = item.danhSachYKien || [];
                  const latestOpinion = opinions[opinions.length - 1];

                  return (
                    <tr key={item.maBCTD}>
                      <td>
                        <div className="fw-bold font-monospace text-primary">{item.maBCTD}</div>
                        <div className="small text-muted">{formatDateVN(item.ngayLap)}</div>
                      </td>

                      <td>
                        <div
                          className="customer-click-link"
                          onClick={() => {
                            if (onOpenCustomerQuickView) {
                              onOpenCustomerQuickView({
                                maKH: item.maKH,
                                hoTen: item.hoTen,
                                diaChi: item.moTaTSBD || 'Yên Thọ'
                              });
                            }
                          }}
                          title="Nhấp để xem nhanh thông tin 360° khách hàng này"
                        >
                          {item.hoTen}
                        </div>
                        <div className="small text-muted font-monospace">{item.maKH}</div>
                      </td>

                      <td className="text-end">
                        <div className="fw-bold text-dark num-tabular">{formatCurrencyVN(item.duyetVay)}</div>
                        <div className="small text-muted num-tabular">Đề xuất: {formatCurrencyVN(item.deXuatVay)}</div>
                        <div className="small text-muted">{item.thoiHanThang} tháng • {item.laiSuatDuyet}%/năm</div>
                      </td>

                      <td>
                        <span className="badge bg-success-subtle text-success fw-bold font-monospace">
                          {item.xepHangCIC || 'Hạng 1 (Tốt)'}
                        </span>
                        {item.ghiChuCIC && (
                          <div className="small text-muted text-truncate mt-1" style={{ maxWidth: 220 }} title={item.ghiChuCIC}>
                            {item.ghiChuCIC}
                          </div>
                        )}
                        <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                          Dư nợ TCTD khác: {formatCurrencyVN(item.duNoCICNgoai || 0)}
                        </div>
                      </td>

                      <td>
                        <div className="small fw-semibold text-dark text-truncate" style={{ maxWidth: 180 }}>
                          {item.loaiTSBD || 'QSDĐ'}
                        </div>
                        <div className="small text-muted">LTV: <strong className="text-primary">{item.tyLeLTV || '50%'}</strong></div>
                        <div className="small text-muted num-tabular">GT: {formatCurrencyVN(item.giaTriTSBD)}</div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-1 mb-1">
                          <span className="badge bg-primary-subtle text-primary">
                            {opinions.length} ý kiến đánh giá
                          </span>
                        </div>
                        {latestOpinion ? (
                          <div className="small text-dark" style={{ fontSize: '0.75rem' }}>
                            <strong>{latestOpinion.evaluatorName}</strong> ({latestOpinion.role}):{' '}
                            <span className="text-success fw-bold">{latestOpinion.decision}</span>
                          </div>
                        ) : (
                          <span className="small text-muted">Chưa có ý kiến phê duyệt</span>
                        )}
                      </td>

                      <td className="text-center">
                        <div className="d-inline-flex gap-1">
                          <button
                            className="btn btn-sm btn-brand fw-semibold d-inline-flex align-items-center gap-1"
                            onClick={() => {
                              setSelectedAppraisal(item);
                              setShowDetailModal(true);
                            }}
                            title="Xem chi tiết báo cáo & tất cả ý kiến đánh giá"
                          >
                            <Eye size={13} /> Chi Tiết
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                            onClick={() => {
                              setSelectedAppraisal(item);
                              setOpinionForm({
                                decision: 'Đồng ý cấp tín dụng',
                                approvedAmount: item.duyetVay,
                                note: ''
                              });
                              setShowOpinionModal(true);
                            }}
                            title="Thêm ý kiến đánh giá / Phê duyệt của bạn"
                          >
                            <MessageSquare size={13} /> Đánh Giá
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    {loading ? 'Đang tải hồ sơ thẩm định...' : 'Không có hồ sơ thẩm định nào.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang chuẩn 15 dòng */}
        <Pagination
          currentPage={page}
          totalItems={filteredAppraisals.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* ========================================================================= */}
      {/* MODAL: LẬP BÁO CÁO THẨM ĐỊNH MỚI */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <div>
                  <h5 className="modal-title fw-bold text-dark font-heading">
                    Lập Báo Cáo Thẩm Định Tín Dụng & TSĐB
                  </h5>
                  <span className="text-muted small">
                    Thông tin tra cứu CIC, tài sản bảo đảm và đề xuất phương án cấp tín dụng
                  </span>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>

              <form onSubmit={handleSaveAppraisal}>
                <div className="modal-body py-3">
                  <div className="row g-3">
                    {/* Khách hàng */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Mã Khách Hàng (*)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="vd: KH008892"
                        value={formData.maKH}
                        onChange={(e) => setFormData({ ...formData, maKH: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Họ Và Tên Khách Hàng (*)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="vd: NGUYỄN VĂN AN"
                        value={formData.hoTen}
                        onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                        required
                      />
                    </div>

                    {/* Phương án vay */}
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-dark">Đề Xuất Vay (*)</label>
                      <ThousandInput
                        value={formData.deXuatVay}
                        onChange={(v) => setFormData({ ...formData, deXuatVay: v })}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-dark">Duyệt Vay (*)</label>
                      <ThousandInput
                        value={formData.duyetVay}
                        onChange={(v) => setFormData({ ...formData, duyetVay: v })}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-dark">Thời Hạn (Tháng)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={formData.thoiHanThang}
                        onChange={(e) => setFormData({ ...formData, thoiHanThang: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-dark">Lãi Suất (%/năm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control form-control-sm"
                        value={formData.laiSuatDuyet}
                        onChange={(e) => setFormData({ ...formData, laiSuatDuyet: Number(e.target.value) })}
                      />
                    </div>

                    {/* Thu nhập & Chi phí */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Thu Nhập Bình Quân Hàng Tháng</label>
                      <ThousandInput
                        value={formData.thuNhapThang}
                        onChange={(v) => setFormData({ ...formData, thuNhapThang: v })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Chi Phí Sinh Hoạt / Kinh Doanh Tháng</label>
                      <ThousandInput
                        value={formData.chiPhiThang}
                        onChange={(v) => setFormData({ ...formData, chiPhiThang: v })}
                      />
                    </div>

                    {/* CIC Thông Tin Chi Tiết */}
                    <div className="col-12">
                      <div className="p-3 bg-light rounded-3 border">
                        <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                          <CreditCard size={16} className="text-primary" /> Thông Tin & Ghi Chú Tra Cứu CIC (Trung Tâm Thông Tin Tín Dụng)
                        </h6>
                        <div className="row g-2">
                          <div className="col-md-4">
                            <label className="form-label small text-muted">Xếp Hạng / Điểm CIC</label>
                            <input
                              type="text"
                              className="form-control form-control-sm font-monospace"
                              value={formData.xepHangCIC}
                              onChange={(e) => setFormData({ ...formData, xepHangCIC: e.target.value })}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small text-muted">Số TCTD Đang Quan Hệ</label>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={formData.soTCTDQuanHe}
                              onChange={(e) => setFormData({ ...formData, soTCTDQuanHe: Number(e.target.value) })}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small text-muted">Dư Nợ Tại TCTD Khác (VNĐ)</label>
                            <ThousandInput
                              value={formData.duNoCICNgoai}
                              onChange={(v) => setFormData({ ...formData, duNoCICNgoai: v })}
                            />
                          </div>
                          <div className="col-12 mt-2">
                            <label className="form-label small text-muted">Ghi Chú Tra Cứu CIC Chi Tiết Để Xem Qua (*)</label>
                            <textarea
                              className="form-control form-control-sm"
                              rows="2"
                              placeholder="Lịch sử nợ quá hạn 3 năm, tài sản thế chấp tại ngân hàng khác, lịch sử thanh toán..."
                              value={formData.ghiChuCIC}
                              onChange={(e) => setFormData({ ...formData, ghiChuCIC: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tài sản bảo đảm */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Loại Tài Sản Bảo Đảm</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.loaiTSBD}
                        onChange={(e) => setFormData({ ...formData, loaiTSBD: e.target.value })}
                      >
                        <option value="QSDĐ (Sổ đỏ / Sổ hồng)">QSDĐ (Sổ đỏ / Sổ hồng)</option>
                        <option value="Phương tiện vận tải (Xe ô tô / Xe tải)">Phương tiện vận tải (Xe ô tô / Xe tải)</option>
                        <option value="Giấy tờ có giá / Sổ tiết kiệm">Giấy tờ có giá / Sổ tiết kiệm</option>
                        <option value="Tín chấp hoàn toàn">Tín chấp hoàn toàn</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Giá Trị Định Giá TSBD (*)</label>
                      <ThousandInput
                        value={formData.giaTriTSBD}
                        onChange={(v) => setFormData({ ...formData, giaTriTSBD: v })}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-dark">Mô Tả Chi Tiết TSBD</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Số GCN, thửa đất, tờ bản đồ, địa chỉ tài sản..."
                        value={formData.moTaTSBD}
                        onChange={(e) => setFormData({ ...formData, moTaTSBD: e.target.value })}
                      />
                    </div>

                    {/* Kết luận đề xuất */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Kết Luận Thẩm Định Ban Đầu</label>
                      <select
                        className="form-select form-select-sm fw-bold text-success"
                        value={formData.ketLuan}
                        onChange={(e) => setFormData({ ...formData, ketLuan: e.target.value })}
                      >
                        <option value="Đồng ý cấp tín dụng">Đồng ý cấp tín dụng</option>
                        <option value="Đồng ý có điều kiện">Đồng ý có điều kiện</option>
                        <option value="Từ chối cấp tín dụng">Từ chối cấp tín dụng</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Tỷ Lệ Cho Vay / TSBD (LTV)</label>
                      <div className="p-2 border rounded-2 bg-light fw-bold text-primary small">
                        {ltvPercent} (Định giá: {formatCurrencyVN(formData.giaTriTSBD)})
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-brand fw-bold" disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Lưu Hồ Sơ Thẩm Định'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: XEM CHI TIẾT & ADMIN TỔNG HỢP TOÀN BỘ Ý KIẾN ĐÁNH GIÁ */}
      {/* ========================================================================= */}
      {showDetailModal && selectedAppraisal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <div>
                  <span className="badge bg-primary-subtle text-primary mb-1">
                    BÁO CÁO THẨM ĐỊNH SỐ: {selectedAppraisal.maBCTD}
                  </span>
                  <h5 className="modal-title fw-bold text-dark font-heading">
                    Hồ Sơ Thẩm Định Tín Dụng & Tổng Hợp Ý Kiến Phê Duyệt
                  </h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)} />
              </div>

              <div className="modal-body py-3">
                {/* Khách hàng & Khoản vay */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="row g-2 small">
                    <div className="col-sm-6">
                      <span className="text-muted">Khách hàng:</span> <strong className="text-dark">{selectedAppraisal.hoTen}</strong> ({selectedAppraisal.maKH})
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted">Số tiền duyệt vay:</span> <strong className="text-danger num-tabular">{formatCurrencyVN(selectedAppraisal.duyetVay)}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted">Thời hạn & Lãi suất:</span> <strong>{selectedAppraisal.thoiHanThang} tháng • {selectedAppraisal.laiSuatDuyet}%/năm</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted">Tài sản bảo đảm:</span> <strong>{selectedAppraisal.loaiTSBD} (LTV: {selectedAppraisal.tyLeLTV})</strong>
                    </div>
                  </div>
                </div>

                {/* Thông tin CIC */}
                <div className="mb-3">
                  <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.88rem' }}>1. Báo Cáo Thông Tin CIC:</h6>
                  <div className="p-3 border rounded-2 bg-white small">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span><strong>Xếp hạng CIC:</strong> <span className="badge bg-success">{selectedAppraisal.xepHangCIC || 'Hạng 1 (Tốt)'}</span></span>
                      <span><strong>Dư nợ TCTD khác:</strong> {formatCurrencyVN(selectedAppraisal.duNoCICNgoai || 0)}</span>
                    </div>
                    <div className="mt-2 text-muted">
                      <strong>Ghi chú tra cứu CIC:</strong> {selectedAppraisal.ghiChuCIC || 'Không phát sinh nợ xấu hoặc nợ cần chú ý.'}
                    </div>
                  </div>
                </div>

                {/* Danh Sách Toàn Bộ Ý Kiến Đánh Giá Của Các Bộ Phận (Admin Review Panel) */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold text-dark m-0" style={{ fontSize: '0.88rem' }}>
                      2. Tổng Hợp Toàn Bộ Ý Kiến Đánh Giá & Phê Duyệt (Admin / Lãnh Đạo Xem Xét):
                    </h6>
                    <button
                      className="btn btn-xs btn-outline-primary py-1 px-2 fw-bold"
                      onClick={() => {
                        setOpinionForm({
                          decision: 'Đồng ý cấp tín dụng',
                          approvedAmount: selectedAppraisal.duyetVay,
                          note: ''
                        });
                        setShowOpinionModal(true);
                      }}
                    >
                      + Thêm Ý Kiến Của Bạn
                    </button>
                  </div>

                  <div className="border rounded-2 p-3 bg-light">
                    {selectedAppraisal.danhSachYKien && selectedAppraisal.danhSachYKien.length > 0 ? (
                      <div className="d-flex flex-column gap-2">
                        {selectedAppraisal.danhSachYKien.map((op, idx) => (
                          <div key={idx} className="p-2 bg-white rounded border small">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-dark text-white">{op.role}</span>
                                <strong className="text-dark">{op.evaluatorName}</strong>
                              </div>
                              <span className="text-muted" style={{ fontSize: '0.7rem' }}>{op.createdAt}</span>
                            </div>
                            <div>
                              <strong>Quyết định:</strong>{' '}
                              <span className={op.decision?.includes('Đồng ý') ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                {op.decision}
                              </span>{' '}
                              • Hạn mức đề xuất:{' '}
                              <span className="fw-bold num-tabular text-dark">{formatCurrencyVN(op.approvedAmount)}</span>
                            </div>
                            {op.note && (
                              <div className="mt-1 text-muted fst-italic">
                                "{op.note}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted small text-center py-2">
                        Chưa có ý kiến đánh giá nào được ghi nhận.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
                <button type="button" className="btn btn-outline-dark btn-sm d-flex align-items-center gap-1" onClick={() => window.print()}>
                  <Printer size={15} /> In Báo Cáo Thẩm Định
                </button>
                <button type="button" className="btn btn-light" onClick={() => setShowDetailModal(false)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ĐÓNG GÓP Ý KIẾN ĐÁNH GIÁ / PHÊ DUYỆT */}
      {/* ========================================================================= */}
      {showOpinionModal && selectedAppraisal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1065 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark font-heading d-flex align-items-center gap-2">
                  <MessageSquare size={20} className="text-primary" /> Ý Kiến Đánh Giá & Phê Duyệt
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowOpinionModal(false)} />
              </div>

              <form onSubmit={handleAddOpinionSubmit}>
                <div className="modal-body py-3">
                  <p className="small text-muted mb-3">
                    Đánh giá cho hồ sơ: <strong className="text-dark">{selectedAppraisal.hoTen}</strong> ({selectedAppraisal.maBCTD}) với vai trò:{' '}
                    <span className="badge bg-dark text-white">{currentUser?.role || 'CBTD'}</span> (<strong>{currentUser?.fullName || currentUser?.username}</strong>)
                  </p>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">Quyết Định Thẩm Định (*)</label>
                    <select
                      className="form-select fw-semibold"
                      value={opinionForm.decision}
                      onChange={(e) => setOpinionForm({ ...opinionForm, decision: e.target.value })}
                    >
                      <option value="Đồng ý cấp tín dụng">Đồng ý cấp tín dụng</option>
                      <option value="Đồng ý có điều kiện">Đồng ý có điều kiện (Bổ sung TSĐB / giảm hạn mức)</option>
                      <option value="Từ chối cấp tín dụng">Từ chối cấp tín dụng</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">Hạn Mức Đề Xuất Phê Duyệt (*)</label>
                    <ThousandInput
                      value={opinionForm.approvedAmount}
                      onChange={(v) => setOpinionForm({ ...opinionForm, approvedAmount: v })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">Ghi Chú Đánh Giá / Lý Giải Phê Duyệt (*)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Lý giải căn cứ đồng ý/từ chối, đánh giá rủi ro CIC, tài sản hoặc lưu ý khi giải ngân..."
                      value={opinionForm.note}
                      onChange={(e) => setOpinionForm({ ...opinionForm, note: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowOpinionModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-brand fw-bold" disabled={saving}>
                    {saving ? 'Đang gửi...' : 'Gửi Ý Kiến Đánh Giá'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
