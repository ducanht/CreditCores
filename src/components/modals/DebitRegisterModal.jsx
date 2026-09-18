import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Edit3,
  AlertCircle,
  Search,
  CheckSquare,
  Square,
  CheckCircle2,
  Calendar,
  Filter,
  FileText,
  CreditCard
} from 'lucide-react';
import { isValidCCCD } from '../../utils/validators';
import { formatCurrencyVN, formatDateVN } from '../../utils/dateUtils';

export default function DebitRegisterModal({
  show,
  onClose,
  onSubmit,
  onBatchSubmit,
  editingItem = null,
  prefilledCustomer = null,
  allCustomers = [],
  allContracts = [],
  registrations = []
}) {
  const isEdit = Boolean(editingItem);

  // --- 1. STATE CHO CHẾ ĐỘ CHỈNH SỬA (SINGLE EDIT) ---
  const [editFormData, setEditFormData] = useState({
    maKH: '',
    hoTen: '',
    gttt: '',
    soTK: '',
    diaChi: '',
    kyTrich: 1,
    trangThai: 'Hiệu lực',
    ghiChu: ''
  });

  // --- 2. STATE CHO CHẾ ĐỘ ĐĂNG KÝ MỚI THEO HĐTD (BATCH SELECTION) ---
  const [selectedKyTrich, setSelectedKyTrich] = useState(1);
  const [batchTrangThai, setBatchTrangThai] = useState('Hiệu lực');
  const [batchGhiChu, setBatchGhiChu] = useState('Ủy quyền trích nợ tự động CASA');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegStatus, setFilterRegStatus] = useState('ALL'); // 'ALL' | 'UNREGISTERED' | 'REGISTERED'
  const [selectedHDTDMaps, setSelectedHDTDMaps] = useState({});
  const [customSoTKMaps, setCustomSoTKMaps] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Map tra cứu nhanh trạng thái đăng ký của khách hàng từ danh sách registrations
  const regMap = useMemo(() => {
    const map = {};
    (registrations || []).forEach((r) => {
      const cleanMa = String(r.maKH || '').replace(/^'/, '').trim();
      if (cleanMa) {
        map[cleanMa] = r;
      }
    });
    return map;
  }, [registrations]);

  // Map tra cứu thông tin khách hàng từ KH_CORE
  const customerMap = useMemo(() => {
    const map = {};
    (allCustomers || []).forEach((c) => {
      const cleanMa = String(c.maKH || '').replace(/^'/, '').trim();
      if (cleanMa) {
        map[cleanMa] = c;
      }
    });
    return map;
  }, [allCustomers]);

  // Danh sách HĐTD hợp lệ đang vay (dư nợ > 0 hoặc trạng thái DANG_VAY)
  const enrichedContracts = useMemo(() => {
    return (allContracts || [])
      .filter((c) => (c.duNo > 0 || c.trangThaiHD === 'DANG_VAY' || c.trangThai !== 'Đã tất toán'))
      .map((c) => {
        const cleanMa = String(c.maKH || '').replace(/^'/, '').trim();
        const cust = customerMap[cleanMa] || {};
        const reg = regMap[cleanMa];
        return {
          ...c,
          cleanMaKH: cleanMa,
          hoTen: c.hoTen || cust.hoTen || 'Khách hàng',
          cccd: c.cccd || cust.cccd || cust.gttt || '',
          soTK: c.soTK || cust.soTK || '',
          diaChi: c.diaChi || cust.diaChi || '',
          isRegistered: Boolean(reg),
          existingReg: reg || null
        };
      });
  }, [allContracts, customerMap, regMap]);

  // Lọc HĐTD theo từ khóa tìm kiếm và bộ lọc trạng thái đăng ký
  const filteredContracts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return enrichedContracts.filter((c) => {
      const matchSearch =
        !term ||
        c.hoTen?.toLowerCase().includes(term) ||
        c.soHDTD?.toLowerCase().includes(term) ||
        c.cleanMaKH?.toLowerCase().includes(term) ||
        c.cccd?.toLowerCase().includes(term) ||
        c.soTK?.toLowerCase().includes(term);

      const matchReg =
        filterRegStatus === 'ALL' ||
        (filterRegStatus === 'UNREGISTERED' && !c.isRegistered) ||
        (filterRegStatus === 'REGISTERED' && c.isRegistered);

      return matchSearch && matchReg;
    });
  }, [enrichedContracts, searchTerm, filterRegStatus]);

  // Reset form khi mở modal
  useEffect(() => {
    if (!show) return;

    if (editingItem) {
      setEditFormData({
        maKH: editingItem.maKH || '',
        hoTen: editingItem.hoTen || '',
        gttt: editingItem.gttt || '',
        soTK: editingItem.soTK || '',
        diaChi: editingItem.diaChi || '',
        kyTrich: Number(editingItem.kyTrich) || 1,
        trangThai: editingItem.trangThai || 'Hiệu lực',
        ghiChu: editingItem.ghiChu || ''
      });
      setFormError('');
    } else {
      setSelectedKyTrich(1);
      setBatchTrangThai('Hiệu lực');
      setBatchGhiChu('Ủy quyền trích nợ tự động CASA');
      setSearchTerm('');
      setFilterRegStatus('ALL');
      setSelectedHDTDMaps({});
      setCustomSoTKMaps({});
      setFormError('');

      // Nếu có prefilledCustomer từ trang chi tiết
      if (prefilledCustomer) {
        const cleanMa = String(prefilledCustomer.maKH || '').replace(/^'/, '').trim();
        const initialMap = {};
        enrichedContracts.forEach((c) => {
          if (c.cleanMaKH === cleanMa) {
            initialMap[c.soHDTD] = true;
          }
        });
        setSelectedHDTDMaps(initialMap);
      }
    }
  }, [editingItem, prefilledCustomer, show]);

  // Xử lý tick chọn từng HĐTD
  const handleToggleHDTD = (soHDTD) => {
    setSelectedHDTDMaps((prev) => ({
      ...prev,
      [soHDTD]: !prev[soHDTD]
    }));
  };

  // Xử lý Chọn tất cả / Bỏ chọn tất cả các HĐTD đang hiển thị
  const isAllFilteredSelected = useMemo(() => {
    if (filteredContracts.length === 0) return false;
    return filteredContracts.every((c) => selectedHDTDMaps[c.soHDTD]);
  }, [filteredContracts, selectedHDTDMaps]);

  const handleToggleSelectAll = () => {
    const nextState = !isAllFilteredSelected;
    const newSelected = { ...selectedHDTDMaps };
    filteredContracts.forEach((c) => {
      newSelected[c.soHDTD] = nextState;
    });
    setSelectedHDTDMaps(newSelected);
  };

  // Đếm số lượng HĐTD và số lượng Khách hàng đã chọn
  const { selectedCount, selectedCustCount, selectedContractList } = useMemo(() => {
    const list = enrichedContracts.filter((c) => selectedHDTDMaps[c.soHDTD]);
    const uniqueCust = new Set(list.map((c) => c.cleanMaKH));
    return {
      selectedCount: list.length,
      selectedCustCount: uniqueCust.size,
      selectedContractList: list
    };
  }, [enrichedContracts, selectedHDTDMaps]);

  // Xử lý submit ở chế độ chỉnh sửa đơn lẻ
  const handleSingleEditSubmit = (e) => {
    e.preventDefault();
    if (!editFormData.maKH || !editFormData.hoTen || !editFormData.soTK) {
      setFormError('Vui lòng điền đầy đủ Mã KH, Họ tên và Số tài khoản CASA.');
      return;
    }
    if (editFormData.gttt && !isValidCCCD(editFormData.gttt)) {
      setFormError('Số CCCD không hợp lệ (Phải đúng 12 chữ số bắt đầu bằng số 0).');
      return;
    }
    if (onSubmit) {
      onSubmit(editFormData);
    }
  };

  // Xử lý submit ở chế độ thêm đăng ký hàng loạt theo HĐTD
  const handleBatchRegisterSubmit = async (e) => {
    e.preventDefault();
    if (selectedCount === 0) {
      setFormError('Vui lòng tick chọn ít nhất một Hợp đồng tín dụng để thêm đăng ký trích nợ!');
      return;
    }

    // Nhóm các HĐTD theo khách hàng (MaKH) để tránh trùng lặp bản ghi đăng ký
    const custMap = {};
    selectedContractList.forEach((c) => {
      const maKH = c.cleanMaKH;
      const soTK = customSoTKMaps[c.soHDTD] || c.soTK || '';
      if (!custMap[maKH]) {
        custMap[maKH] = {
          maKH: maKH,
          hoTen: c.hoTen,
          gttt: c.cccd,
          soTK: soTK,
          diaChi: c.diaChi,
          kyTrich: Number(selectedKyTrich),
          trangThai: batchTrangThai,
          ghiChu: batchGhiChu ? `${batchGhiChu} (HĐ: ${c.soHDTD})` : `HĐ: ${c.soHDTD}`,
          hdList: [c.soHDTD]
        };
      } else {
        custMap[maKH].hdList.push(c.soHDTD);
        custMap[maKH].ghiChu = `${batchGhiChu} (HĐ: ${custMap[maKH].hdList.join(', ')})`;
        if (!custMap[maKH].soTK && soTK) {
          custMap[maKH].soTK = soTK;
        }
      }
    });

    const payloadItems = Object.values(custMap);

    setIsSubmitting(true);
    setFormError('');
    try {
      if (onBatchSubmit) {
        await onBatchSubmit({
          kyTrich: Number(selectedKyTrich),
          trangThai: batchTrangThai,
          ghiChu: batchGhiChu,
          items: payloadItems
        });
      } else if (onSubmit) {
        // Fallback gọi onSubmit cho từng item nếu onBatchSubmit không truyền
        for (const item of payloadItems) {
          await onSubmit(item);
        }
      }
    } catch (err) {
      setFormError('Lỗi xử lý đăng ký: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  // =========================================================================
  // VIEW 1: CHỈNH SỬA THỎA THUẬN CÓ SẴN (SINGLE EDIT)
  // =========================================================================
  if (isEdit) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content card-modern p-4">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold text-dark font-heading d-flex align-items-center gap-2">
                <Edit3 size={20} className="text-primary" /> Chỉnh Sửa Thỏa Thuận Trích Nợ Tự Động CASA
              </h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <form onSubmit={handleSingleEditSubmit}>
              <div className="modal-body py-3">
                {formError && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small mb-3">
                    <AlertCircle size={16} />
                    <div>{formError}</div>
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-dark">Mã Khách Hàng</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace fw-bold bg-light"
                      value={editFormData.maKH}
                      readOnly
                    />
                  </div>

                  <div className="col-12 col-md-8">
                    <label className="form-label small fw-bold text-dark">Họ Và Tên Khách Hàng</label>
                    <input
                      type="text"
                      className="form-control form-control-sm fw-bold bg-light"
                      value={editFormData.hoTen}
                      readOnly
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-dark">Số CCCD (12 chữ số)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace bg-light"
                      maxLength={12}
                      value={editFormData.gttt}
                      readOnly
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-dark">Số Tài Khoản CASA</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace fw-bold text-success"
                      placeholder="010000001888"
                      value={editFormData.soTK}
                      onChange={(e) => setEditFormData({ ...editFormData, soTK: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold text-dark">Địa Chỉ Thường Trú</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light"
                      value={editFormData.diaChi}
                      readOnly
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-dark">Kỳ Trích Nợ Đăng Ký</label>
                    <select
                      className="form-select form-select-sm fw-bold"
                      value={editFormData.kyTrich}
                      onChange={(e) => setEditFormData({ ...editFormData, kyTrich: Number(e.target.value) })}
                    >
                      <option value={1}>Kỳ 1 (Ngày 05 hàng tháng)</option>
                      <option value={2}>Kỳ 2 (Ngày 15 hàng tháng)</option>
                      <option value={3}>Kỳ 3 (Ngày 25 hàng tháng)</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-dark">Trạng Thái Thỏa Thuận</label>
                    <select
                      className="form-select form-select-sm"
                      value={editFormData.trangThai}
                      onChange={(e) => setEditFormData({ ...editFormData, trangThai: e.target.value })}
                    >
                      <option value="Hiệu lực">Hiệu lực</option>
                      <option value="Tạm ngưng">Tạm ngưng</option>
                      <option value="Hủy">Hủy đăng ký</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold text-dark">Ghi Chú Nghiệp Vụ</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Ghi chú chi tiết hoặc thỏa thuận riêng..."
                      value={editFormData.ghiChu}
                      onChange={(e) => setEditFormData({ ...editFormData, ghiChu: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-light" onClick={onClose}>
                  Đóng
                </button>
                <button type="submit" className="btn btn-brand fw-bold">
                  Cập Nhật Thỏa Thuận
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ĐĂNG KÝ TRÍCH NỢ MỚI THEO HỢP ĐỒNG TÍN DỤNG (BATCH ENROLLMENT)
  // =========================================================================
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '95%' }}>
        <div className="modal-content card-modern p-3 p-md-4">
          {/* HEADER MODAL */}
          <div className="modal-header border-0 pb-2">
            <div>
              <h5 className="modal-title fw-bold text-dark font-heading d-flex align-items-center gap-2">
                <UserCheck size={22} className="text-primary" /> Đăng Ký Thỏa Thuận Trích Nợ Tự Động CASA
              </h5>
              <p className="text-muted small m-0 mt-0.5">
                Chọn đợt trích nợ định kỳ, tra cứu các hợp đồng tín dụng và tick chọn khách hàng ủy quyền trích nợ tự động.
              </p>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleBatchRegisterSubmit} className="d-flex flex-column" style={{ minHeight: 0 }}>
            {/* THÔNG BÁO LỖI NẾU CÓ */}
            {formError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small mx-3 mb-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <div>{formError}</div>
              </div>
            )}

            {/* BƯỚC 1: KHỐI CHỌN ĐỢT TRÍCH NỢ & CẤU HÌNH */}
            <div className="p-3 bg-light rounded-3 border mx-3 mb-3">
              <div className="row g-3 align-items-center">
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-bold text-primary mb-1 d-flex align-items-center gap-1">
                    <Calendar size={14} /> Chọn Kỳ / Đợt Trích Nợ Định Kỳ:
                  </label>
                  <select
                    className="form-select form-select-sm fw-bold border-primary"
                    value={selectedKyTrich}
                    onChange={(e) => setSelectedKyTrich(Number(e.target.value))}
                  >
                    <option value={1}>Kỳ 1 (Ngày 05 hàng tháng)</option>
                    <option value={2}>Kỳ 2 (Ngày 15 hàng tháng)</option>
                    <option value={3}>Kỳ 3 (Ngày 25 hàng tháng)</option>
                  </select>
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label small fw-bold text-dark mb-1">Trạng Thái Áp Dụng:</label>
                  <select
                    className="form-select form-select-sm"
                    value={batchTrangThai}
                    onChange={(e) => setBatchTrangThai(e.target.value)}
                  >
                    <option value="Hiệu lực">Hiệu lực (Kích hoạt ngay)</option>
                    <option value="Tạm ngưng">Tạm ngưng (Tạm hoãn trích)</option>
                  </select>
                </div>

                <div className="col-12 col-md-5">
                  <label className="form-label small fw-bold text-dark mb-1">Ghi Chú Nghiệp Vụ:</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ghi chú đợt đăng ký hoặc số quyết định..."
                    value={batchGhiChu}
                    onChange={(e) => setBatchGhiChu(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* BƯỚC 2: THANH TÌM KIẾM & BỘ LỌC HĐTD */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 px-3 mb-2">
              <div className="d-flex align-items-center gap-2 flex-wrap flex-grow-1">
                <div className="input-group input-group-sm" style={{ minWidth: 260, maxWidth: 360 }}>
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Tìm tên KH, số HĐTD, mã KH, CCCD..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="btn-group btn-group-sm">
                  <button
                    type="button"
                    className={`btn btn-sm ${filterRegStatus === 'ALL' ? 'btn-secondary fw-bold' : 'btn-outline-secondary'}`}
                    onClick={() => setFilterRegStatus('ALL')}
                  >
                    Tất cả HĐ ({enrichedContracts.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${filterRegStatus === 'UNREGISTERED' ? 'btn-primary fw-bold' : 'btn-outline-primary'}`}
                    onClick={() => setFilterRegStatus('UNREGISTERED')}
                  >
                    Chưa ĐK ({enrichedContracts.filter((c) => !c.isRegistered).length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${filterRegStatus === 'REGISTERED' ? 'btn-success fw-bold' : 'btn-outline-success'}`}
                    onClick={() => setFilterRegStatus('REGISTERED')}
                  >
                    Đã ĐK ({enrichedContracts.filter((c) => c.isRegistered).length})
                  </button>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary fw-medium d-flex align-items-center gap-1"
                  onClick={handleToggleSelectAll}
                >
                  {isAllFilteredSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                  {isAllFilteredSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả đang lọc'}
                </button>
              </div>
            </div>

            {/* BẢNG DANH SÁCH HỢP ĐỒNG TÍN DỤNG */}
            <div className="modal-body py-0 px-3 flex-grow-1" style={{ maxHeight: '52vh', overflowY: 'auto' }}>
              <div className="table-responsive border rounded-3 bg-white">
                <table className="table table-hover table-sm align-middle m-0" style={{ fontSize: '0.85rem' }}>
                  <thead className="table-light sticky-top text-nowrap" style={{ zIndex: 10 }}>
                    <tr>
                      <th className="text-center" style={{ width: 42 }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={isAllFilteredSelected}
                          onChange={handleToggleSelectAll}
                          title="Chọn/Bỏ chọn tất cả"
                        />
                      </th>
                      <th>Số HĐTD (Khế Ước)</th>
                      <th>Khách Hàng / Mã KH</th>
                      <th>Số TK CASA</th>
                      <th className="text-end">Dư Nợ Hiện Tại</th>
                      <th className="text-center">Lãi Suất</th>
                      <th className="text-center">Ngày Vay</th>
                      <th className="text-center">Đến Hạn</th>
                      <th className="text-center">Trả Lãi Đến</th>
                      <th className="text-center">Trạng Thái ĐK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContracts.length > 0 ? (
                      filteredContracts.map((c) => {
                        const isSelected = Boolean(selectedHDTDMaps[c.soHDTD]);
                        const curSoTK = customSoTKMaps[c.soHDTD] !== undefined ? customSoTKMaps[c.soHDTD] : c.soTK;

                        return (
                          <tr
                            key={c.soHDTD}
                            className={isSelected ? 'table-primary-subtle' : ''}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleToggleHDTD(c.soHDTD)}
                          >
                            <td className="text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={isSelected}
                                onChange={() => handleToggleHDTD(c.soHDTD)}
                              />
                            </td>
                            <td>
                              <span className="font-monospace fw-bold text-primary">{c.soHDTD}</span>
                            </td>
                            <td>
                              <div className="fw-bold text-dark">{c.hoTen}</div>
                              <div className="text-muted text-xs font-monospace">
                                {c.cleanMaKH} {c.cccd ? `• CCCD: ${c.cccd}` : ''}
                              </div>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              {curSoTK ? (
                                <span className="font-monospace fw-semibold text-success">{curSoTK}</span>
                              ) : (
                                <input
                                  type="text"
                                  className="form-control form-control-sm font-monospace text-success py-0 px-1.5"
                                  style={{ width: 130, height: 26 }}
                                  placeholder="Nhập số TK..."
                                  value={curSoTK || ''}
                                  onChange={(e) => {
                                    setCustomSoTKMaps({ ...customSoTKMaps, [c.soHDTD]: e.target.value });
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              )}
                            </td>
                            <td className="text-end fw-bold num-tabular text-danger">
                              {formatCurrencyVN(c.duNo)}
                            </td>
                            <td className="text-center font-monospace">{c.laiSuat || 10.46}%</td>
                            <td className="text-center text-muted font-monospace">{c.ngayVay || '---'}</td>
                            <td className="text-center text-muted font-monospace">{c.denHan || '---'}</td>
                            <td className="text-center font-monospace fw-semibold text-slate-700">
                              {c.traLaiDenNgay || '---'}
                            </td>
                            <td className="text-center">
                              {c.isRegistered ? (
                                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                                  Đã ĐK (Kỳ {c.existingReg?.kyTrich})
                                </span>
                              ) : (
                                <span className="badge bg-light text-muted border px-2 py-1">
                                  Chưa ĐK
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center text-muted py-4">
                          Không tìm thấy hợp đồng tín dụng nào phù hợp với điều kiện tìm kiếm.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FOOTER MODAL */}
            <div className="modal-footer border-0 pt-3 px-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary fs-6 px-3 py-1.5">
                  Đã chọn: <strong>{selectedCount}</strong> HĐTD
                </span>
                <span className="text-muted small">
                  ({selectedCustCount} khách hàng riêng biệt)
                </span>
              </div>

              <div className="d-flex gap-2">
                <button type="button" className="btn btn-light" onClick={onClose} disabled={isSubmitting}>
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn btn-brand fw-bold d-flex align-items-center gap-1.5 shadow-sm"
                  disabled={selectedCount === 0 || isSubmitting}
                >
                  <CheckCircle2 size={16} />
                  {isSubmitting
                    ? 'Đang lưu thỏa thuận...'
                    : `Thêm Đăng Ký Trích Nợ (${selectedCount} HĐTD)`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

