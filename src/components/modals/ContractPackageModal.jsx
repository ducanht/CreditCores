import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileCheck2,
  Download,
  Printer,
  X,
  CheckCircle2,
  ShieldCheck,
  Building2,
  User,
  Layers,
  Sparkles
} from 'lucide-react';
import { formatCurrencyVN, getTodayVN, formatDateVN } from '../../utils/dateUtils';

export default function ContractPackageModal({
  show,
  onClose,
  allCustomers = [],
  allContracts = [],
  allCollaterals = [],
  preselectedCustomer = null,
  preselectedContract = null
}) {
  const [selectedMaKH, setSelectedMaKH] = useState('');
  const [selectedSoHDTD, setSelectedSoHDTD] = useState('');
  const [selectedSoGCN, setSelectedSoGCN] = useState('');
  const [activeDocTab, setActiveDocTab] = useState('HDTD'); // 'HDTD' | 'HDTC' | 'BBDG' | 'GNN' | 'DON' | 'TRICH_NO'

  // Khi modal mở, điền trước khách hàng/khoản vay nếu có
  useEffect(() => {
    if (preselectedCustomer) {
      setSelectedMaKH(preselectedCustomer.maKH);
    }
    if (preselectedContract) {
      setSelectedSoHDTD(preselectedContract.soHDTD);
      if (preselectedContract.maKH) setSelectedMaKH(preselectedContract.maKH);
    }
  }, [preselectedCustomer, preselectedContract]);

  if (!show) return null;

  // Lấy đối tượng dữ liệu thực tế
  const customer = allCustomers.find((c) => c.maKH === selectedMaKH) || (allCustomers.length > 0 ? allCustomers[0] : null);
  const availableContracts = allContracts.filter((ct) => !selectedMaKH || ct.maKH === selectedMaKH);
  const contract = allContracts.find((ct) => ct.soHDTD === selectedSoHDTD) || (availableContracts.length > 0 ? availableContracts[0] : null);
  const availableCollaterals = allCollaterals.filter((col) => !selectedMaKH || col.maKH === selectedMaKH);
  const collateral = allCollaterals.find((col) => col.soGCN === selectedSoGCN) || (availableCollaterals.length > 0 ? availableCollaterals[0] : null);

  // Biến hợp nhất (Merged Data Tags)
  const d = {
    // Khách hàng
    HoTen: customer?.hoTen || 'NGUYỄN VĂN AN',
    MaKH: customer?.maKH || 'KH008892',
    SoCCCD: customer?.cccd || customer?.gttt || '038088001234',
    NgayCapCCCD: customer?.ngayCap || '12/05/2021',
    NoiCapCCCD: customer?.noiCap || 'Cục CSQLHC về TTXH',
    NgaySinh: customer?.ngaySinh || '15/08/1985',
    DiaChi: customer?.diaChi || 'Thôn Tân Lộc, xã Quý Lộc, huyện Yên Định, tỉnh Thanh Hóa',
    DienThoai: customer?.dienThoaiDD || customer?.dienThoai || '0912.345.678',
    SoTV: customer?.soTV || 'TV-008892',
    SoTK_CASA: customer?.soTK || '0381000123456',

    // Khoản vay
    SoHDTD: contract?.soHDTD || 'KU-2026-0312',
    TienVay: Number(contract?.tienVay || contract?.duNo || 200000000),
    LaiSuat: Number(contract?.laiSuat || 9.5),
    NgayVay: contract?.ngayVay || getTodayVN(),
    DenHan: contract?.denHan || '15/01/2028',
    SoThangVay: contract?.soThangVay || 24,
    MucDichVay: contract?.moTaVay || 'Đầu tư phát triển sản xuất kinh doanh nông nghiệp',
    PhuongThucTraGoc: 'Trả gốc định kỳ hàng tháng, lãi tính trên dư nợ thực tế',

    // Tài sản thế chấp (TSBD_CORE)
    SoGCN: collateral?.soGCN || 'CH 892341',
    SoVaoSoCapGCN: collateral?.soVaoSoCapGCN || 'CS-01234',
    NgayCapGCN: collateral?.ngayCapGCN || '12/05/2021',
    NoiCapGCN: collateral?.noiCapGCN || 'Sở Tài Nguyên & Môi Trường tỉnh Thanh Hóa',
    ChuSoHuu: collateral?.chuSoHuu || customer?.hoTen || 'NGUYỄN VĂN AN',
    CCCD_ChuTS: collateral?.cccdChuTS || customer?.cccd || '038088001234',
    ThuaDatSo: collateral?.thuaDatSo || '112',
    ToBanDoSo: collateral?.toBanDoSo || '08',
    DiaChiThuaDat: collateral?.diaChiThuaDat || 'Thôn Tân Lộc, xã Quý Lộc, huyện Yên Định, tỉnh Thanh Hóa',
    DienTich: collateral?.dienTich || 250,
    GiaTriDinhGiaQTD: Number(collateral?.giaTriDinhGiaQTD || 650000000),
    SoTienDamBaoToiDa: Number(collateral?.soTienDamBaoToiDa || 455000000),
    VanPhongCongChung: collateral?.vanPhongCongChung || 'Văn phòng Công chứng Yên Định'
  };

  // Hàm xuất tài liệu Word (.doc)
  const handleExportSingleWord = (docType) => {
    let title = '';
    let bodyContent = '';

    if (docType === 'HDTD') {
      title = `HỢP ĐỒNG TÍN DỤNG SỐ ${d.SoHDTD}`;
      bodyContent = `
        <div style="text-align: center; font-weight: bold; font-size: 15pt; margin-bottom: 5px;">HỢP ĐỒNG TÍN DỤNG KIÊM KHẾ ƯỚC NHẬN NỢ</div>
        <div style="text-align: center; font-style: italic; margin-bottom: 20px;">Số: ${d.SoHDTD}/HĐTD-QTD</div>
        <p>Hôm nay, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}, tại Trụ sở Quỹ Tín dụng Nhân dân Yên Thọ, chúng tôi gồm có:</p>
        <p><strong>BÊN CHO VAY (BÊN A): QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</strong><br/>
        Địa chỉ: Xã Yên Thọ, huyện Yên Định, tỉnh Thanh Hóa<br/>
        Đại diện bởi: Ông <strong>Lê Văn Tín</strong> - Chức vụ: Giám đốc</p>
        <p><strong>BÊN VAY (BÊN B): THÀNH VIÊN VAY VỐN</strong><br/>
        Họ và tên: <strong>${d.HoTen}</strong> • Mã thành viên: <strong>${d.SoTV}</strong><br/>
        Số CCCD: <strong>${d.SoCCCD}</strong> cấp ngày ${d.NgayCapCCCD} tại ${d.NoiCapCCCD}<br/>
        Địa chỉ thường trú: ${d.DiaChi}<br/>
        Số điện thoại: ${d.DienThoai} • Số tài khoản thanh toán CASA: <strong>${d.SoTK_CASA}</strong></p>
        <p><strong>ĐIỀU 1: SỐ TIỀN VAY VÀ MỤC ĐÍCH SỬ DỤNG VỐN</strong><br/>
        1. Số tiền cho vay: <strong>${formatCurrencyVN(d.TienVay)}</strong><br/>
        2. Mục đích vay vốn: ${d.MucDichVay}<br/>
        3. Thời hạn vay: <strong>${d.SoThangVay} tháng</strong> (từ ngày ${d.NgayVay} đến ngày ${d.DenHan}).</p>
        <p><strong>ĐIỀU 2: LÃI SUẤT VÀ PHƯƠNG THỨC TRẢ NỢ</strong><br/>
        1. Lãi suất cho vay: <strong>${d.LaiSuat}%/năm</strong> (tính theo số ngày thực tế theo Thông tư 14/2017/TT-NHNN).<br/>
        2. Phương thức trả nợ: ${d.PhuongThucTraGoc}.</p>
        <p><strong>ĐIỀU 3: BIỆN PHÁP BẢO ĐẢM TIỀN VAY</strong><br/>
        Khoản vay được bảo đảm bằng Quyền sử dụng đất tại Thửa đất số <strong>${d.ThuaDatSo}</strong>, Tờ bản đồ số <strong>${d.ToBanDoSo}</strong> theo Giấy chứng nhận QSDĐ số <strong>${d.SoGCN}</strong>.</p>
      `;
    } else if (docType === 'HDTC') {
      title = `HỢP ĐỒNG THẾ CHẤP QUYỀN SỬ DỤNG ĐẤT SỐ ${d.SoGCN}`;
      bodyContent = `
        <div style="text-align: center; font-weight: bold; font-size: 15pt; margin-bottom: 5px;">HỢP ĐỒNG THẾ CHẤP QUYỀN SỬ DỤNG ĐẤT</div>
        <div style="text-align: center; font-style: italic; margin-bottom: 20px;">(Phục vụ Công chứng & Đăng ký Giao dịch bảo đảm)</div>
        <p><strong>BÊN THẾ CHẤP (BÊN A):</strong><br/>
        Ông/Bà: <strong>${d.ChuSoHuu}</strong> • Số CCCD: <strong>${d.CCCD_ChuTS}</strong><br/>
        Địa chỉ: ${d.DiaChi}</p>
        <p><strong>BÊN NHẬN THẾ CHẤP (BÊN B): QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</strong><br/>
        Đại diện bởi: Ông <strong>Lê Văn Tín</strong> - Chức vụ: Giám đốc</p>
        <p><strong>ĐIỀU 1: TÀI SẢN THẾ CHẤP (SỔ ĐỎ)</strong><br/>
        1. Quyền sử dụng đất tại Thửa đất số: <strong>${d.ThuaDatSo}</strong>, Tờ bản đồ số: <strong>${d.ToBanDoSo}</strong><br/>
        2. Địa chỉ thửa đất: ${d.DiaChiThuaDat}<br/>
        3. Diện tích: <strong>${d.DienTich} m²</strong><br/>
        4. Giấy chứng nhận QSDĐ số: <strong>${d.SoGCN}</strong>, Số vào sổ cấp GCN: <strong>${d.SoVaoSoCapGCN}</strong> do ${d.NoiCapGCN} cấp ngày ${d.NgayCapGCN}.<br/>
        5. Giá trị định giá thỏa thuận: <strong>${formatCurrencyVN(d.GiaTriDinhGiaQTD)}</strong><br/>
        6. Hạn mức đảm bảo nghĩa vụ trả nợ tối đa: <strong>${formatCurrencyVN(d.SoTienDamBaoToiDa)}</strong>.</p>
      `;
    } else if (docType === 'BBDG') {
      title = `BIÊN BẢN ĐỊNH GIÁ TÀI SẢN BẢO ĐẢM`;
      bodyContent = `
        <div style="text-align: center; font-weight: bold; font-size: 15pt; margin-bottom: 5px;">BIÊN BẢN ĐỊNH GIÁ TÀI SẢN BẢO ĐẢM</div>
        <div style="text-align: center; font-style: italic; margin-bottom: 20px;">Hội đồng Định giá Quỹ Tín Dụng Nhân Dân Yên Thọ</div>
        <p>Hội đồng tiến hành thẩm định và định giá tài sản thế chấp theo Giấy chứng nhận QSDĐ số <strong>${d.SoGCN}</strong> của khách hàng <strong>${d.HoTen}</strong>:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;" border="1">
          <tr style="background-color: #f2f2f2; text-align: center; font-weight: bold;">
            <td>Hạng Mục Thẩm Định</td>
            <td>Thông Số Chi Tiết</td>
            <td>Giá Trị Định Giá (VNĐ)</td>
          </tr>
          <tr>
            <td>Thửa đất số / Tờ bản đồ</td>
            <td style="text-align: center;">Thửa ${d.ThuaDatSo} - TBĐ ${d.ToBanDoSo}</td>
            <td rowspan="2" style="text-align: right; font-weight: bold;">${formatCurrencyVN(d.GiaTriDinhGiaQTD)}</td>
          </tr>
          <tr>
            <td>Tổng diện tích & Vị trí</td>
            <td>${d.DienTich} m² - ${d.DiaChiThuaDat}</td>
          </tr>
          <tr>
            <td>Hạn mức cho vay tối đa (70%)</td>
            <td style="text-align: center;">Tỷ lệ LTV chuẩn an toàn</td>
            <td style="text-align: right; font-weight: bold; color: green;">${formatCurrencyVN(d.SoTienDamBaoToiDa)}</td>
          </tr>
        </table>
      `;
    } else if (docType === 'GNN') {
      title = `GIẤY NHẬN NỢ & LỊCH TRẢ NỢ`;
      bodyContent = `
        <div style="text-align: center; font-weight: bold; font-size: 15pt; margin-bottom: 5px;">GIẤY NHẬN NỢ KIÊM LỊCH TRẢ NỢ CHI TIẾT</div>
        <div style="text-align: center; font-style: italic; margin-bottom: 20px;">Khế ước số: ${d.SoHDTD} - Ngày nhận nợ: ${d.NgayVay}</div>
        <p>Tôi là: <strong>${d.HoTen}</strong>, Số CCCD: <strong>${d.SoCCCD}</strong> xác nhận đã nhận đủ số tiền giải ngân <strong>${formatCurrencyVN(d.TienVay)}</strong> từ Quỹ Tín dụng Nhân dân Yên Thọ và cam kết hoàn trả đúng lịch trình định kỳ hàng tháng.</p>
      `;
    } else if (docType === 'TRICH_NO') {
      title = `THỎA THUẬN ỦY QUYỀN TRÍCH NỢ TỰ ĐỘNG CASA`;
      bodyContent = `
        <div style="text-align: center; font-weight: bold; font-size: 15pt; margin-bottom: 5px;">THỎA THUẬN ỦY QUYỀN TRÍCH NỢ TỰ ĐỘNG CASA</div>
        <div style="text-align: center; font-style: italic; margin-bottom: 20px;">Số TK Thanh Toán: ${d.SoTK_CASA}</div>
        <p>Tôi là: <strong>${d.HoTen}</strong> ủy quyền không hủy ngang cho Quỹ Tín dụng Nhân dân Yên Thọ tự động trích nợ từ tài khoản thanh toán CASA số <strong>${d.SoTK_CASA}</strong> để thu hồi gốc, lãi định kỳ của Hợp đồng tín dụng số <strong>${d.SoHDTD}</strong>.</p>
      `;
    } else {
      title = `ĐƠN ĐỀ NGHỊ VAY VỐN KIÊM PHƯƠNG ÁN SXKD`;
      bodyContent = `
        <div style="text-align: center; font-weight: bold; font-size: 15pt; margin-bottom: 5px;">ĐƠN ĐỀ NGHỊ CẤP TÍN DỤNG & PHƯƠNG ÁN VAY VỐN</div>
        <p>Kính gửi: Hội đồng Quản trị & Ban Giám đốc Quỹ Tín Dụng Nhân Dân Yên Thọ</p>
        <p>Tôi tên là: <strong>${d.HoTen}</strong> (Mã thành viên: ${d.SoTV}), Số CCCD: ${d.SoCCCD}. Đề nghị vay vốn số tiền: <strong>${formatCurrencyVN(d.TienVay)}</strong> để ${d.MucDichVay}.</p>
      `;
    }

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; margin: 20px; }
          .header-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
          .sig-table { width: 100%; margin-top: 40px; border-collapse: collapse; }
          .sig-table td { width: 50%; text-align: center; vertical-align: top; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 45%; text-align: center;">
              <strong>QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</strong><br/>
              Hồ sơ tín dụng số: ${d.SoHDTD}
            </td>
            <td style="width: 55%; text-align: center;">
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
              <u>Độc lập - Tự do - Hạnh phúc</u><br/>
              <em>Yên Thọ, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em>
            </td>
          </tr>
        </table>

        ${bodyContent}

        <table class="sig-table">
          <tr>
            <td>
              <strong>ĐẠI DIỆN BÊN VAY / BÊN THẾ CHẤP</strong><br/>
              <em>(Ký, ghi rõ họ tên)</em>
              <br/><br/><br/><br/>
              <strong>${d.HoTen}</strong>
            </td>
            <td>
              <strong>ĐẠI DIỆN QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</strong><br/>
              <em>(Ký, đóng dấu, ghi rõ họ tên)</em>
              <br/><br/><br/><br/>
              <strong>GIÁM ĐỐC</strong>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docType}_${d.MaKH}_${d.SoHDTD}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Hàm tải trọn bộ 6 hợp đồng tín dụng
  const handleExportFullPackage = () => {
    ['HDTD', 'HDTC', 'BBDG', 'GNN', 'DON', 'TRICH_NO'].forEach((type, index) => {
      setTimeout(() => {
        handleExportSingleWord(type);
      }, index * 300);
    });
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1055 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-4">
          {/* Header */}
          <div className="modal-header border-0 pb-0">
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded-2 bg-primary-subtle text-primary">
                <FileCheck2 size={24} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-slate-900 font-heading m-0">
                  Tạo Trọn Bộ Hợp Đồng Tín Dụng & Hồ Sơ Thế Chấp Đầy Đủ
                </h5>
                <span className="small text-muted">Hợp nhất tự động dữ liệu: KH_CORE + HDTD_CORE + TSBD_CORE</span>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body py-3 d-flex flex-column gap-3">
            {/* Bộ Lọc 3 Thực Thể: Khách Hàng + Khoản Vay + Sổ Đỏ Thế Chấp */}
            <div className="p-3 bg-light rounded-3 border">
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-bold text-primary">1. Chọn Khách Hàng (KH_CORE)</label>
                  <select
                    className="form-select form-select-sm fw-bold border-primary"
                    value={selectedMaKH}
                    onChange={(e) => setSelectedMaKH(e.target.value)}
                  >
                    {allCustomers.map((c) => (
                      <option key={c.maKH} value={c.maKH}>
                        {c.hoTen} ({c.maKH}) • CCCD: {c.cccd || c.gttt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-bold text-dark">2. Khoản Vay (HDTD_CORE)</label>
                  <select
                    className="form-select form-select-sm font-monospace fw-medium"
                    value={selectedSoHDTD}
                    onChange={(e) => setSelectedSoHDTD(e.target.value)}
                  >
                    {availableContracts.length > 0 ? (
                      availableContracts.map((ct) => (
                        <option key={ct.soHDTD} value={ct.soHDTD}>
                          {ct.soHDTD} • {formatCurrencyVN(ct.tienVay || ct.duNo)}
                        </option>
                      ))
                    ) : (
                      <option value="">-- Mặc định khoản vay mẫu --</option>
                    )}
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-bold text-success">3. Sổ Đỏ Thế Chấp (TSBD_CORE)</label>
                  <select
                    className="form-select form-select-sm font-monospace fw-bold border-success text-success"
                    value={selectedSoGCN}
                    onChange={(e) => setSelectedSoGCN(e.target.value)}
                  >
                    {availableCollaterals.length > 0 ? (
                      availableCollaterals.map((col) => (
                        <option key={col.soGCN} value={col.soGCN}>
                          Sổ {col.soGCN} (Thửa {col.thuaDatSo} - {col.dienTich}m²)
                        </option>
                      ))
                    ) : (
                      allCollaterals.map((col) => (
                        <option key={col.soGCN} value={col.soGCN}>
                          Sổ {col.soGCN} ({col.chuSoHuu})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Thanh Tab Chuyển Đổi 6 Biểu Mẫu Pháp Lý */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 border-bottom pb-2">
              <div className="btn-group btn-group-sm p-0.5 bg-light rounded-2 border" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${activeDocTab === 'HDTD' ? 'btn-brand fw-bold text-white' : 'btn-light text-muted'}`}
                  onClick={() => setActiveDocTab('HDTD')}
                >
                  1. Hợp Đồng Tín Dụng
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeDocTab === 'HDTC' ? 'btn-brand fw-bold text-white' : 'btn-light text-muted'}`}
                  onClick={() => setActiveDocTab('HDTC')}
                >
                  2. HĐ Thế Chấp (Sổ Đỏ)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeDocTab === 'BBDG' ? 'btn-brand fw-bold text-white' : 'btn-light text-muted'}`}
                  onClick={() => setActiveDocTab('BBDG')}
                >
                  3. Biên Bản Định Giá
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeDocTab === 'GNN' ? 'btn-brand fw-bold text-white' : 'btn-light text-muted'}`}
                  onClick={() => setActiveDocTab('GNN')}
                >
                  4. Giấy Nhận Nợ
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeDocTab === 'DON' ? 'btn-brand fw-bold text-white' : 'btn-light text-muted'}`}
                  onClick={() => setActiveDocTab('DON')}
                >
                  5. Đơn Đề Nghị Vay
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeDocTab === 'TRICH_NO' ? 'btn-brand fw-bold text-white' : 'btn-light text-muted'}`}
                  onClick={() => setActiveDocTab('TRICH_NO')}
                >
                  6. Thỏa Thuận CASA
                </button>
              </div>

              <div className="d-flex align-items-center gap-1.5">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                  onClick={() => handleExportSingleWord(activeDocTab)}
                  title="Xuất file Word (.doc) cho mẫu đang xem"
                >
                  <FileText size={14} /> Xuất Mẫu Này (.doc)
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  onClick={() => window.print()}
                  title="In / Xuất PDF"
                >
                  <Printer size={14} /> In PDF
                </button>
              </div>
            </div>

            {/* Khung Soạn Thảo & Xem Trước Văn Bản Trộn (Live Preview Card) */}
            <div
              className="card p-4 border rounded-3 bg-white shadow-2xs overflow-auto font-serif"
              style={{ maxHeight: '420px', fontSize: '0.95rem', lineHeight: '1.6' }}
            >
              {activeDocTab === 'HDTD' && (
                <div>
                  <div className="text-center fw-bold fs-5 mb-1 font-heading">HỢP ĐỒNG TÍN DỤNG KIÊM KHẾ ƯỚC NHẬN NỢ</div>
                  <div className="text-center text-muted fst-italic mb-3">Số: {d.SoHDTD}/HĐTD-QTD • Ngày ký: {getTodayVN()}</div>
                  <p>Căn cứ Luật Các tổ chức tín dụng và Điều lệ hoạt động của Quỹ Tín Dụng Nhân Dân Yên Thọ.</p>
                  <p><strong>BÊN CHO VAY (BÊN A): QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</strong><br/>
                  Địa chỉ: Xã Yên Thọ, huyện Yên Định, tỉnh Thanh Hóa • Đại diện: Ông <strong>Lê Văn Tín</strong> - Giám đốc.</p>
                  <p><strong>BÊN VAY (BÊN B): THÀNH VIÊN VAY VỐN</strong><br/>
                  Họ và tên: <strong className="text-primary">{d.HoTen}</strong> (Mã TV: <span className="font-monospace fw-bold">{d.SoTV}</span>)<br/>
                  Số CCCD: <span className="font-monospace fw-bold">{d.SoCCCD}</span> • Ngày cấp: {d.NgayCapCCCD} • Nơi cấp: {d.NoiCapCCCD}<br/>
                  Địa chỉ thường trú: {d.DiaChi}<br/>
                  Số điện thoại: {d.DienThoai} • Số tài khoản CASA: <span className="font-monospace fw-bold text-success">{d.SoTK_CASA}</span></p>
                  <p><strong>ĐIỀU 1: THỎA THUẬN VAY VỐN</strong><br/>
                  - Số tiền cho vay: <strong className="text-success">{formatCurrencyVN(d.TienVay)}</strong><br/>
                  - Thời hạn vay: <strong>{d.SoThangVay} tháng</strong> (từ {d.NgayVay} đến {d.DenHan})<br/>
                  - Lãi suất: <strong>{d.LaiSuat}%/năm</strong> (tính theo ngày thực tế TT 14/2017/TT-NHNN).<br/>
                  - Phương thức trả nợ: {d.PhuongThucTraGoc}.</p>
                  <p><strong>ĐIỀU 2: BIỆN PHÁP BẢO ĐẢM TIỀN VAY</strong><br/>
                  Bên B tự nguyện thế chấp Quyền sử dụng đất tại Thửa số <strong>{d.ThuaDatSo}</strong>, Tờ bản đồ <strong>{d.ToBanDoSo}</strong> theo Giấy chứng nhận QSDĐ số <strong className="text-danger">{d.SoGCN}</strong>.</p>
                </div>
              )}

              {activeDocTab === 'HDTC' && (
                <div>
                  <div className="text-center fw-bold fs-5 mb-1 font-heading">HỢP ĐỒNG THẾ CHẤP QUYỀN SỬ DỤNG ĐẤT</div>
                  <div className="text-center text-muted fst-italic mb-3">(Phục vụ Công chứng & Đăng ký Giao dịch bảo đảm)</div>
                  <p><strong>BÊN THẾ CHẤP (BÊN A):</strong><br/>
                  Ông/Bà: <strong className="text-primary">{d.ChuSoHuu}</strong> • CCCD: <span className="font-monospace fw-bold">{d.CCCD_ChuTS}</span><br/>
                  Địa chỉ: {d.DiaChi}</p>
                  <p><strong>BÊN NHẬN THẾ CHẤP (BÊN B): QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</strong></p>
                  <p><strong>ĐIỀU 1: TÀI SẢN THẾ CHẤP TẠI TSBD_CORE</strong><br/>
                  - Thửa đất số: <span className="font-monospace fw-bold">{d.ThuaDatSo}</span> • Tờ bản đồ số: <span className="font-monospace fw-bold">{d.ToBanDoSo}</span><br/>
                  - Địa chỉ thửa đất: {d.DiaChiThuaDat}<br/>
                  - Diện tích: <strong>{d.DienTich} m²</strong><br/>
                  - Giấy chứng nhận QSDĐ (Sổ đỏ) số: <strong className="text-danger font-monospace">{d.SoGCN}</strong> (Số vào sổ: {d.SoVaoSoCapGCN}) do {d.NoiCapGCN} cấp ngày {d.NgayCapGCN}.<br/>
                  - Giá trị định giá QTD: <strong className="text-success">{formatCurrencyVN(d.GiaTriDinhGiaQTD)}</strong><br/>
                  - Số tiền bảo đảm tối đa: <strong className="text-primary">{formatCurrencyVN(d.SoTienDamBaoToiDa)}</strong>.</p>
                </div>
              )}

              {activeDocTab === 'BBDG' && (
                <div>
                  <div className="text-center fw-bold fs-5 mb-1 font-heading">BIÊN BẢN ĐỊNH GIÁ TÀI SẢN BẢO ĐẢM</div>
                  <div className="text-center text-muted fst-italic mb-3">Hội đồng Định giá Quỹ Tín Dụng Nhân Dân Yên Thọ</div>
                  <p>Tài sản định giá: Giấy chứng nhận QSDĐ số <strong className="text-danger">{d.SoGCN}</strong> của thành viên <strong>{d.HoTen}</strong>.</p>
                  <p>- Địa chỉ thửa đất: {d.DiaChiThuaDat}<br/>
                  - Diện tích: <strong>{d.DienTich} m²</strong> (Thửa số {d.ThuaDatSo}, TBĐ số {d.ToBanDoSo})<br/>
                  - Giá trị định giá QTDND: <strong className="text-success">{formatCurrencyVN(d.GiaTriDinhGiaQTD)}</strong><br/>
                  - Hạn mức bảo đảm vay tối đa (LTV 70%): <strong className="text-primary">{formatCurrencyVN(d.SoTienDamBaoToiDa)}</strong>.</p>
                </div>
              )}

              {activeDocTab === 'GNN' && (
                <div>
                  <div className="text-center fw-bold fs-5 mb-1 font-heading">GIẤY NHẬN NỢ & LỊCH TRẢ NỢ</div>
                  <div className="text-center text-muted fst-italic mb-3">Khế ước số: {d.SoHDTD} • Ngày nhận nợ: {d.NgayVay}</div>
                  <p>Thành viên vay: <strong>{d.HoTen}</strong> xác nhận đã nhận đủ số tiền giải ngân <strong>{formatCurrencyVN(d.TienVay)}</strong> và cam kết thanh toán gốc, lãi định kỳ theo quy định.</p>
                </div>
              )}

              {activeDocTab === 'DON' && (
                <div>
                  <div className="text-center fw-bold fs-5 mb-1 font-heading">ĐƠN ĐỀ NGHỊ VAY VỐN KIÊM PHƯƠNG ÁN SXKD</div>
                  <p>Kính gửi: Quỹ Tín Dụng Nhân Dân Yên Thọ</p>
                  <p>Tôi là <strong>{d.HoTen}</strong>, Mã TV <strong>{d.SoTV}</strong> đề nghị vay <strong>{formatCurrencyVN(d.TienVay)}</strong> với mục đích {d.MucDichVay}.</p>
                </div>
              )}

              {activeDocTab === 'TRICH_NO' && (
                <div>
                  <div className="text-center fw-bold fs-5 mb-1 font-heading">THỎA THUẬN ỦY QUYỀN TRÍCH NỢ TỰ ĐỘNG CASA</div>
                  <div className="text-center text-muted fst-italic mb-3">Số TK CASA: {d.SoTK_CASA}</div>
                  <p>Ủy quyền trích nợ tự động tài khoản thanh toán CASA số <strong>{d.SoTK_CASA}</strong> cho Quỹ Tín Dụng Nhân Dân Yên Thọ để thanh toán các kỳ trả nợ của Hợp đồng số <strong>{d.SoHDTD}</strong>.</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
            <button type="button" className="btn btn-light btn-sm px-3" onClick={onClose}>
              Đóng
            </button>
            <button
              type="button"
              className="btn btn-brand btn-sm text-white fw-bold px-4 shadow-sm d-flex align-items-center gap-1.5"
              onClick={handleExportFullPackage}
            >
              <Sparkles size={16} /> Xuất Trọn Bộ 6 Hợp Đồng (.doc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
