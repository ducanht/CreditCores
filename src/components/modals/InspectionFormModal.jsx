import React, { useState, useEffect } from 'react';
import { ClipboardList, AlertCircle } from 'lucide-react';
import { isValidDateVN } from '../../utils/validators';
import ImageUploader from '../ImageUploader';

export default function InspectionFormModal({
  show,
  onClose,
  onSubmit,
  prefilledContract = null,
  allContracts = []
}) {
  const [formData, setFormData] = useState({
    maBBKT: '',
    soHDTD: '',
    maKH: '',
    hoTen: '',
    loaiDoanKT: 'CBTD',
    thanhPhanDoan: '',
    ngayKiemTra: new Date().toLocaleDateString('vi-VN'),
    lanKiemTra: 1,
    ngayKTNext: '',
    hinhThuc: 'Thực địa',
    diaDiemKT: '',
    danhGiaMucDich: 'Đúng mục đích 100%',
    tienDoSuDungVon: 'Đã hoàn thành 100% phương án giải ngân',
    mucDoRuiRo: 'Bình thường',
    moTaThucTe: '',
    kienNghi: 'Tiếp tục theo dõi thu nợ đúng hạn',
    fileBienBanUrl: '',
    trangThai: 'Đạt'
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (prefilledContract) {
      handleSelectContract(prefilledContract.soHDTD, prefilledContract);
    } else {
      setFormData((prev) => ({
        ...prev,
        maBBKT: 'BBKT-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000))
      }));
    }
  }, [prefilledContract]);

  if (!show) return null;

  const handleSelectContract = (soHDTD, contractObj = null) => {
    const c = contractObj || allContracts.find((item) => item.soHDTD === soHDTD);
    if (c) {
      setFormData((prev) => ({
        ...prev,
        soHDTD: c.soHDTD,
        maKH: c.maKH || '',
        hoTen: c.hoTen || prev.hoTen,
        diaDiemKT: c.diaChi || prev.diaDiemKT
      }));
      setFormError('');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.soHDTD || !formData.maKH || !formData.ngayKiemTra) {
      setFormError('Vui lòng điền đầy đủ Số HĐTD, Mã KH và Ngày kiểm tra.');
      return;
    }

    if (formData.ngayKiemTra && !isValidDateVN(formData.ngayKiemTra)) {
      setFormError('Ngày kiểm tra không đúng định dạng dd/MM/yyyy.');
      return;
    }

    if (formData.ngayKTNext && !isValidDateVN(formData.ngayKTNext)) {
      setFormError('Ngày kiểm tra lần tiếp theo không đúng định dạng dd/MM/yyyy.');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold text-dark font-heading d-flex align-items-center gap-2">
              <ClipboardList size={20} className="text-success" /> Lập Biên Bản Kiểm Tra Sử Dụng Vốn Sau Giải Ngân
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleFormSubmit}>
            <div className="modal-body py-3">
              {formError && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small mb-3">
                  <AlertCircle size={16} />
                  <div>{formError}</div>
                </div>
              )}

              {/* Khối Chọn Hợp Đồng & Khách Hàng Từ HDTD_CORE / KH_CORE */}
              <div className="p-3 bg-light rounded-3 border mb-3">
                <label className="form-label small fw-bold text-success mb-1.5 d-flex justify-content-between">
                  <span>Chọn Hợp Đồng / Khách Hàng từ CSDL Core (*):</span>
                  <span className="badge bg-success-subtle text-success small">KH_CORE & HDTD_CORE Linked</span>
                </label>
                <select
                  className="form-select form-select-sm fw-bold border-success"
                  value={formData.soHDTD}
                  onChange={(e) => handleSelectContract(e.target.value)}
                  required
                >
                  <option value="">-- Bấm để chọn Hợp Đồng Khách Hàng ({allContracts.length} HĐ) --</option>
                  {allContracts.map((ct) => (
                    <option key={ct.soHDTD} value={ct.soHDTD}>
                      {ct.soHDTD} • {ct.hoTen} ({ct.maKH}) • Dư nợ: {Number(ct.duNo || 0).toLocaleString('vi-VN')} đ
                    </option>
                  ))}
                </select>
              </div>

              <div className="row g-3">
                <div className="col-12 col-sm-6 col-md-4">
                  <label className="form-label small fw-bold text-dark">Mã Biên Bản (*)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace fw-bold"
                    value={formData.maBBKT}
                    onChange={(e) => setFormData({ ...formData, maBBKT: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12 col-sm-6 col-md-4">
                  <label className="form-label small fw-bold text-dark">Số Khế Ước / HĐTD</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace fw-bold text-primary bg-light"
                    placeholder="HD-2025-081"
                    value={formData.soHDTD}
                    readOnly
                  />
                </div>

                <div className="col-12 col-sm-6 col-md-4">
                  <label className="form-label small fw-bold text-dark">Mã Khách Hàng</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace bg-light"
                    placeholder="KH008892"
                    value={formData.maKH}
                    readOnly
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-dark">Họ Và Tên Khách Hàng</label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-light fw-bold"
                    placeholder="NGUYỄN VĂN AN"
                    value={formData.hoTen}
                    readOnly
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-dark">Đoàn Kiểm Tra Của</label>
                  <select
                    className="form-select form-select-sm fw-bold"
                    value={formData.loaiDoanKT}
                    onChange={(e) => setFormData({ ...formData, loaiDoanKT: e.target.value })}
                  >
                    <option value="CBTD">Cán Bộ Tín Dụng (CBTD)</option>
                    <option value="BKS">Ban Kiểm Soát (BKS)</option>
                    <option value="HDQT">Hội Đồng Quản Trị / Ban Lãnh Đạo</option>
                    <option value="LIEN_NGANH">Đoàn Liên Ngành Nội Bộ</option>
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-dark">Thành Phần Đoàn Kiểm Tra</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Lê Văn Tín (CBTD) & Ban Kiểm Soát..."
                    value={formData.thanhPhanDoan}
                    onChange={(e) => setFormData({ ...formData, thanhPhanDoan: e.target.value })}
                  />
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label small fw-bold text-dark">Ngày Kiểm Tra (dd/MM/yyyy)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="18/08/2026"
                    value={formData.ngayKiemTra}
                    onChange={(e) => setFormData({ ...formData, ngayKiemTra: e.target.value })}
                  />
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label small fw-bold text-dark">Lần Kiểm Tra Thứ</label>
                  <input
                    type="number"
                    className="form-control form-control-sm text-center fw-bold"
                    value={formData.lanKiemTra}
                    onChange={(e) => setFormData({ ...formData, lanKiemTra: Number(e.target.value) })}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-dark">Địa Điểm Kiểm Tra Thực Tế</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Thôn 3, Xã Yên Thọ..."
                    value={formData.diaDiemKT}
                    onChange={(e) => setFormData({ ...formData, diaDiemKT: e.target.value })}
                  />
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label small fw-bold text-dark">Hình Thức Kiểm Tra</label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.hinhThuc}
                    onChange={(e) => setFormData({ ...formData, hinhThuc: e.target.value })}
                  >
                    <option value="Thực địa">Trực tiếp tại thực địa</option>
                    <option value="Hồ sơ chứng từ">Kiểm tra hồ sơ chứng từ</option>
                    <option value="Kết hợp cả hai">Kết hợp thực địa & chứng từ</option>
                  </select>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label small fw-bold text-dark">Lần KT Kế Tiếp</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="18/11/2026"
                    value={formData.ngayKTNext}
                    onChange={(e) => setFormData({ ...formData, ngayKTNext: e.target.value })}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-dark">Đánh Giá Mục Đích Sử Dụng Vốn</label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.danhGiaMucDich}
                    onChange={(e) => setFormData({ ...formData, danhGiaMucDich: e.target.value })}
                  >
                    <option value="Đúng mục đích 100%">Đúng mục đích 100%</option>
                    <option value="Sử dụng đúng một phần">Sử dụng đúng một phần</option>
                    <option value="Sai mục đích vay vốn">Sai mục đích vay vốn</option>
                  </select>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label small fw-bold text-dark">Mức Độ Rủi Ro</label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.mucDoRuiRo}
                    onChange={(e) => setFormData({ ...formData, mucDoRuiRo: e.target.value })}
                  >
                    <option value="Bình thường">Bình thường (Thấp)</option>
                    <option value="Cần theo dõi">Cần theo dõi (Trung bình)</option>
                    <option value="Rủi ro cao">Rủi ro cao (Cảnh báo)</option>
                  </select>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label small fw-bold text-dark">Kết Luận</label>
                  <select
                    className="form-select form-select-sm fw-bold"
                    value={formData.trangThai}
                    onChange={(e) => setFormData({ ...formData, trangThai: e.target.value })}
                  >
                    <option value="Đạt">Đạt tiêu chuẩn</option>
                    <option value="Cần khắc phục">Cần khắc phục</option>
                    <option value="Vi phạm">Vi phạm cam kết</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-dark">Mô Tả Thực Tế & Kiến Nghị</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    placeholder="Mô tả hiện trạng tài sản, hoạt động kinh doanh và ý kiến của đoàn kiểm tra..."
                    value={formData.moTaThucTe}
                    onChange={(e) => setFormData({ ...formData, moTaThucTe: e.target.value })}
                  />
                </div>

                {/* 2 Khối Tải / Chụp Ảnh Thực Địa & Hồ Sơ Đính Kèm */}
                <div className="col-12 col-md-6">
                  <ImageUploader
                    label="Ảnh Kiểm Tra Thực Địa / TSBĐ (Nén & Lưu Drive)"
                    prefix="KT_THUCDIA"
                    entityId={formData.maBBKT || 'BBKT'}
                    extraInfo={formData.soHDTD || formData.maKH}
                    currentValue={formData.hinhAnhKiemTra}
                    onChange={(url) => setFormData({ ...formData, hinhAnhKiemTra: url })}
                    folderType="inspection"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <ImageUploader
                    label="Tài Liệu / Hóa Đơn Mua Sắm (Ảnh/PDF)"
                    prefix="KT_CHUNGTU"
                    entityId={formData.maBBKT || 'BBKT'}
                    extraInfo={formData.soHDTD || formData.maKH}
                    currentValue={formData.fileBienBanUrl}
                    onChange={(url) => setFormData({ ...formData, fileBienBanUrl: url })}
                    folderType="inspection"
                    acceptDocs={true}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn btn-light" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn btn-brand fw-bold">
                Lưu Biên Bản Kiểm Tra
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
