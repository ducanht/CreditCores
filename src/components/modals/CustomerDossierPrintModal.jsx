import React, { useRef } from 'react';
import {
  Printer,
  Download,
  FileText,
  X,
  User,
  Building2,
  CheckCircle2,
  Landmark,
  ShieldCheck,
  Calendar,
  CreditCard,
  Phone,
  MapPin,
  Clock,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { formatCurrencyVN, formatDateVN, getTodayVN } from '../../utils/dateUtils';

// Helper rút gọn tiền tệ
const formatCompactVN = (amount) => {
  const num = Number(amount) || 0;
  if (Math.abs(num) >= 1e9) {
    const val = (num / 1e9).toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
    return `${val} tỷ`;
  }
  if (Math.abs(num) >= 1e6) {
    const val = (num / 1e6).toFixed(1).replace(/\.?0+$/, '').replace('.', ',');
    return `${val} tr`;
  }
  return num.toLocaleString('vi-VN') + ' đ';
};

export default function CustomerDossierPrintModal({ customer, onClose }) {
  const printRef = useRef(null);
  if (!customer) return null;

  const contracts = customer.contracts || [];
  const activeContracts = contracts.filter(
    (c) => c.trangThaiHD === 'DANG_VAY' || Number(c.duNo) > 0
  );
  const settledContracts = contracts.filter(
    (c) => c.trangThaiHD === 'DA_TAT_TOAN' || Number(c.duNo) === 0
  );

  const totalTienVay = contracts.reduce((sum, c) => sum + (Number(c.tienVay) || 0), 0);
  const totalDuNo = activeContracts.reduce((sum, c) => sum + (Number(c.duNo) || 0), 0);

  const todayStr = getTodayVN();
  const dateParts = todayStr.split('/');
  const ngayStr = dateParts[0] || new Date().getDate();
  const thangStr = dateParts[1] || new Date().getMonth() + 1;
  const namStr = dateParts[2] || new Date().getFullYear();

  // In ấn trực tiếp qua trình duyệt
  const handlePrint = () => {
    window.print();
  };

  // Xuất file Microsoft Word (.doc)
  const handleExportWord = () => {
    const rowsHtml = contracts.map((c, idx) => {
      const isSettled = c.trangThaiHD === 'DA_TAT_TOAN' || Number(c.duNo) === 0;
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-weight: bold; text-align: center;">${c.soHDTD}</td>
          <td style="text-align: right;">${formatCurrencyVN(c.tienVay)}</td>
          <td style="text-align: right; font-weight: bold; color: ${isSettled ? '#475569' : '#b91c1c'};">
            ${isSettled ? '0 đ' : formatCurrencyVN(c.duNo)}
          </td>
          <td style="text-align: center;">${c.laiSuat || 10.46}%</td>
          <td style="text-align: center;">${c.ngayVay ? formatDateVN(c.ngayVay) : '---'}</td>
          <td style="text-align: center;">${c.denHan ? formatDateVN(c.denHan) : '---'}</td>
          <td style="text-align: center;">${c.traLaiDenNgay || '---'}</td>
          <td style="text-align: center; font-weight: bold;">${isSettled ? 'ĐÃ TẤT TOÁN' : 'ĐANG VAY'}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Hồ Sơ Tín Dụng Khách Hàng - ${customer.hoTen}</title>
        <style>
          @page Section1 { size: 595.3pt 841.9pt; margin: 1.8cm 1.8cm 1.8cm 1.8cm; mso-header-margin: 36pt; mso-footer-margin: 36pt; }
          div.Section1 { page: Section1; }
          body { font-family: 'Times New Roman', serif; font-size: 12.5pt; line-height: 1.4; color: #000; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
          .header-table td { vertical-align: top; text-align: center; }
          .title { text-align: center; font-size: 15pt; font-weight: bold; margin: 15px 0 5px 0; text-transform: uppercase; }
          .subtitle { text-align: center; font-size: 11pt; font-style: italic; margin-bottom: 20px; }
          .section-heading { font-weight: bold; font-size: 12.5pt; margin-top: 14px; margin-bottom: 6px; text-transform: uppercase; color: #1e3a8a; }
          .data-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .data-table th, .data-table td { border: 1px solid #000; padding: 5px 6px; font-size: 11pt; }
          .data-table th { background-color: #f1f5f9; text-align: center; font-weight: bold; }
          .signature-table { width: 100%; border-collapse: collapse; margin-top: 35px; page-break-inside: avoid; }
          .signature-table td { vertical-align: top; text-align: center; width: 33.33%; font-size: 11.5pt; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .fw-bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <table class="header-table">
            <tr>
              <td style="width: 45%;">
                <strong>QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</strong><br/>
                Địa chỉ: Thôn Tân Lộc, xã Quý Lộc,<br/>
                tỉnh Thanh Hoá<br/>
                Mã KH: <strong>${customer.maKH}</strong>
              </td>
              <td style="width: 55%;">
                <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
                <strong>Độc lập - Tự do - Hạnh phúc</strong><br/>
                -------------------<br/>
                <em>Quý Lộc, ngày ${ngayStr} tháng ${thangStr} năm ${namStr}</em>
              </td>
            </tr>
          </table>

          <div class="title">BẢN TỔNG HỢP HỒ SƠ QUAN HỆ TÍN DỤNG 360°<br/>VÀ ĐÁNH GIÁ TÍN NHIỆM THÀNH VIÊN</div>
          <div class="subtitle">(Trích xuất tự động từ Hệ thống Quản trị Tín dụng Core QTDND Yên Thọ)</div>

          <p class="section-heading">I. THÔNG TIN THÀNH VIÊN & PHÁP LÝ:</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
            <tr>
              <td style="width: 60%; padding: 3px 0;">- Họ và tên: <strong>${customer.hoTen || '...................................................'}</strong></td>
              <td style="width: 40%; padding: 3px 0;">Số CCCD/GTTT: <strong>${customer.cccd || customer.gttt || '...................................'}</strong></td>
            </tr>
            <tr>
              <td style="padding: 3px 0;">- Địa chỉ thường trú: <strong>${customer.diaChi || 'Thôn Tân Lộc, xã Quý Lộc, Thanh Hoá'}</strong></td>
              <td style="padding: 3px 0;">Số điện thoại: <strong>${customer.dienThoaiDD || customer.dienThoai || '---'}</strong></td>
            </tr>
            <tr>
              <td style="padding: 3px 0;">- Số thẻ/sổ thành viên: <strong>${customer.soTV || 'TV-' + customer.maKH}</strong></td>
              <td style="padding: 3px 0;">Số sổ cổ phần: <strong>${customer.soSoCP || 'CP-YENTHO'}</strong></td>
            </tr>
            <tr>
              <td style="padding: 3px 0;">- Tổng vốn góp cổ phần: <strong>${formatCurrencyVN(customer.tongTienCP || 0)}</strong></td>
              <td style="padding: 3px 0;">Số tài khoản CASA: <strong>${customer.soTK || '---'}</strong></td>
            </tr>
            <tr>
              <td style="padding: 3px 0;" colspan="2">- Cán bộ tín dụng quản lý địa bàn: <strong>${customer.tenCBTD || 'Lê Văn Tín (CBTD)'}</strong> (${customer.cbtdPhuTrach || 'qtdyentho.cbtd'})</td>
            </tr>
          </table>

          <p class="section-heading">II. THỰC TRẠNG QUAN HỆ TÍN DỤNG TẠI QUỸ:</p>
          <ul>
            <li>Tổng doanh số vốn đã giải ngân: <strong>${formatCurrencyVN(totalTienVay)}</strong> (${contracts.length} khế ước vay lũy kế).</li>
            <li><strong>Dư nợ tín dụng thực tế hiện tại: <span style="color: #b91c1c;">${formatCurrencyVN(totalDuNo)}</span></strong> (${activeContracts.length} hợp đồng đang vay).</li>
            <li>Số hợp đồng đã hoàn tất nghĩa vụ trả nợ (tất toán): <strong>${settledContracts.length} hợp đồng</strong>.</li>
            <li>Phân loại nhóm nợ theo Thông tư 11/2021/TT-NHNN: <strong>NHÓM 1 (Nợ đủ tiêu chuẩn)</strong>.</li>
            <li>Lịch sử thanh toán lãi & gốc: <strong>Khách hàng chấp hành nghiêm túc, không có nợ quá hạn</strong>.</li>
          </ul>

          <p class="section-heading">III. CHI TIẾT CÁC HỢP ĐỒNG & KHẾ ƯỚC TÍN DỤNG:</p>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 5%;">STT</th>
                <th style="width: 15%;">Số HĐTD</th>
                <th style="width: 15%;">Số Tiền Vay</th>
                <th style="width: 15%;">Dư Nợ Hiện Tại</th>
                <th style="width: 8%;">Lãi Suất</th>
                <th style="width: 11%;">Ngày Vay</th>
                <th style="width: 11%;">Đến Hạn</th>
                <th style="width: 10%;">Đã Trả Lãi</th>
                <th style="width: 10%;">Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="9" style="text-align: center;">Chưa có dữ liệu khế ước tín dụng</td></tr>'}
            </tbody>
          </table>

          <p class="section-heading">IV. Ý KIẾN THEO DÕI VÀ ĐÁNH GIÁ CỦA CÁN BỘ TÍN DỤNG:</p>
          <p style="text-indent: 20px; text-align: justify;">
            Khách hàng <strong>${customer.hoTen}</strong> là thành viên thuộc địa bàn quản lý của Quỹ tín dụng nhân dân Yên Thọ. Quá trình vay vốn sử dụng đúng mục đích phát triển kinh tế gia đình, chấp hành đầy đủ các điều khoản trong hợp đồng tín dụng và cam kết trả nợ. Nguồn thu nhập ổn định, năng lực tài chính bảo đảm khả năng trả nợ đúng hạn.
          </p>

          <table class="signature-table">
            <tr>
              <td>
                <strong>CÁN BỘ TÍN DỤNG</strong><br/>
                <em>(Ký, ghi rõ họ tên)</em>
                <br/><br/><br/><br/><br/>
                <strong>${customer.tenCBTD || 'Lê Văn Tín'}</strong>
              </td>
              <td>
                <strong>TRƯỞNG PHÒNG TÍN DỤNG</strong><br/>
                <em>(Ký, ghi rõ họ tên)</em>
                <br/><br/><br/><br/><br/>
                <strong>...................................................</strong>
              </td>
              <td>
                <strong>GIÁM ĐỐC QUỸ TÍN DỤNG</strong><br/>
                <em>(Ký, đóng dấu)</em>
                <br/><br/><br/><br/><br/>
                <strong>...................................................</strong>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ho_So_Tin_Dung_360_${customer.maKH}_${customer.hoTen.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1075 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px', overflow: 'hidden' }}>
          {/* MODAL ACTION TOOLBAR */}
          <div className="modal-header bg-dark text-white py-2.5 px-4 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <FileText size={18} className="text-warning" />
              <span className="fw-bold fs-6">
                Bản In Hồ Sơ Tín Dụng 360° Thành Viên — {customer.hoTen} ({customer.maKH})
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-success fw-semibold d-flex align-items-center gap-1.5 px-3 shadow-xs"
                onClick={handlePrint}
                title="In hồ sơ A4 qua máy in hoặc xuất PDF"
              >
                <Printer size={15} /> In Hồ Sơ (A4)
              </button>

              <button
                type="button"
                className="btn btn-sm btn-primary fw-semibold d-flex align-items-center gap-1.5 px-3 shadow-xs"
                onClick={handleExportWord}
                title="Tải về file Word (.doc) có thể chỉnh sửa văn bản"
              >
                <Download size={15} /> Xuất Word (.doc)
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-light ms-2"
                onClick={onClose}
                title="Đóng cửa sổ"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* MODAL PREVIEW BODY (A4 PAPER SIMULATION) */}
          <div
            className="modal-body p-4 p-md-5"
            style={{ backgroundColor: '#f1f5f9', minHeight: '600px' }}
          >
            <div
              ref={printRef}
              className="bg-white shadow-sm mx-auto p-4 p-md-5 print-document-container"
              style={{
                maxWidth: '850px',
                minHeight: '1050px',
                color: '#0f172a',
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '13pt',
                lineHeight: 1.45
              }}
            >
              {/* QUỐC HIỆU & TIÊU NGỮ */}
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div className="text-center" style={{ width: '45%' }}>
                  <strong className="d-block text-uppercase" style={{ fontSize: '11.5pt' }}>
                    QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ
                  </strong>
                  <span className="d-block small" style={{ fontSize: '10pt', color: '#475569' }}>
                    Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hoá
                  </span>
                  <span className="d-block small font-monospace" style={{ fontSize: '10.5pt', color: '#1e293b' }}>
                    Mã KH: <strong>{customer.maKH}</strong>
                  </span>
                </div>

                <div className="text-center" style={{ width: '55%' }}>
                  <strong className="d-block text-uppercase" style={{ fontSize: '11.5pt' }}>
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </strong>
                  <strong className="d-block" style={{ fontSize: '11.5pt' }}>
                    Độc lập - Tự do - Hạnh phúc
                  </strong>
                  <div style={{ fontSize: '10pt', margin: '2px 0 6px 0' }}>-------------------</div>
                  <em className="d-block small" style={{ fontSize: '10.5pt' }}>
                    Quý Lộc, ngày {ngayStr} tháng {thangStr} năm {namStr}
                  </em>
                </div>
              </div>

              {/* TIÊU ĐỀ HỒ SƠ */}
              <div className="text-center my-4">
                <h4 className="fw-bold text-uppercase m-0" style={{ fontSize: '15pt', letterSpacing: '0.5px' }}>
                  BẢN TỔNG HỢP HỒ SƠ QUAN HỆ TÍN DỤNG 360°<br />VÀ ĐÁNH GIÁ TÍN NHIỆM THÀNH VIÊN
                </h4>
                <div className="fst-italic text-muted mt-1" style={{ fontSize: '11pt' }}>
                  (Trích xuất dữ liệu đối soát Core Banking SQL Server QTDND Yên Thọ)
                </div>
              </div>

              {/* MỤC I: THÔNG TIN PHÁP LÝ & QUAN HỆ THÀNH VIÊN */}
              <div className="mb-3">
                <div className="fw-bold text-uppercase text-primary mb-2" style={{ fontSize: '12pt' }}>
                  I. THÔNG TIN KHÁCH HÀNG & QUAN HỆ THÀNH VIÊN:
                </div>
                <table className="w-100 mb-2" style={{ fontSize: '11.5pt' }}>
                  <tbody>
                    <tr>
                      <td className="py-1" style={{ width: '60%' }}>
                        - Họ và tên thành viên: <strong>{customer.hoTen}</strong>
                      </td>
                      <td className="py-1" style={{ width: '40%' }}>
                        Số CCCD/GTTT: <strong>{customer.cccd || customer.gttt || '---'}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">
                        - Địa chỉ thường trú: <strong>{customer.diaChi || 'Thôn Tân Lộc, xã Quý Lộc'}</strong>
                      </td>
                      <td className="py-1">
                        Số điện thoại: <strong>{customer.dienThoaiDD || customer.dienThoai || '---'}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">
                        - Số thẻ/sổ thành viên: <strong>{customer.soTV || 'TV-' + customer.maKH}</strong>
                      </td>
                      <td className="py-1">
                        Số sổ cổ phần: <strong>{customer.soSoCP || 'CP-YENTHO'}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">
                        - Tổng vốn góp cổ phần: <strong className="text-success">{formatCurrencyVN(customer.tongTienCP || 0)}</strong>
                      </td>
                      <td className="py-1">
                        Tài khoản CASA: <strong className="font-monospace text-primary">{customer.soTK || '---'}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1" colSpan="2">
                        - Cán bộ tín dụng phụ trách địa bàn: <strong>{customer.tenCBTD || 'Lê Văn Tín (CBTD)'}</strong> ({customer.cbtdPhuTrach || 'qtdyentho.cbtd'})
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* MỤC II: THỰC TRẠNG QUAN HỆ TÍN DỤNG */}
              <div className="mb-3">
                <div className="fw-bold text-uppercase text-primary mb-2" style={{ fontSize: '12pt' }}>
                  II. THỰC TRẠNG QUAN HỆ TÍN DỤNG TẠI QUỸ:
                </div>
                <div className="p-2.5 rounded bg-light border mb-2" style={{ fontSize: '11pt' }}>
                  <div className="row g-2">
                    <div className="col-4">
                      <span className="text-muted d-block">Tổng Vốn Đã Vay:</span>
                      <strong className="fs-6">{formatCurrencyVN(totalTienVay)}</strong>
                    </div>
                    <div className="col-4">
                      <span className="text-muted d-block">Dư Nợ Thực Tế Hiện Tại:</span>
                      <strong className="fs-6 text-danger">{formatCurrencyVN(totalDuNo)}</strong>
                    </div>
                    <div className="col-4">
                      <span className="text-muted d-block">Phân Loại Nhóm Nợ:</span>
                      <strong className="fs-6 text-success">NHÓM 1 (Đủ tiêu chuẩn)</strong>
                    </div>
                  </div>
                </div>
                <ul className="mb-2 ps-3" style={{ fontSize: '11pt' }}>
                  <li>Số khế ước tín dụng lũy kế: <strong>{contracts.length} hợp đồng</strong> (Đang vay: <strong>{activeContracts.length}</strong>, Đã tất toán hoàn toàn: <strong>{settledContracts.length}</strong>).</li>
                  <li>Lịch sử thanh toán lãi và gốc định kỳ: <strong>Đúng hạn 100%, không phát sinh nợ quá hạn hoặc nợ xấu</strong>.</li>
                  <li>Tỷ lệ bảo đảm tín dụng: Đáp ứng đầy đủ quy chế cho vay của NHNN và Điều lệ Quỹ tín dụng.</li>
                </ul>
              </div>

              {/* MỤC III: DANH SÁCH CHI TIẾT CÁC HỢP ĐỒNG */}
              <div className="mb-4">
                <div className="fw-bold text-uppercase text-primary mb-2" style={{ fontSize: '12pt' }}>
                  III. DANH MỤC HỢP ĐỒNG & KHẾ ƯỚC TÍN DỤNG CHI TIẾT:
                </div>
                <table className="table table-bordered border-dark table-sm" style={{ fontSize: '10.5pt' }}>
                  <thead className="table-secondary text-center">
                    <tr>
                      <th style={{ width: '5%' }}>STT</th>
                      <th style={{ width: '15%' }}>Số HĐTD</th>
                      <th style={{ width: '16%' }}>Số Tiền Vay</th>
                      <th style={{ width: '16%' }}>Dư Nợ Hiện Tại</th>
                      <th style={{ width: '8%' }}>Lãi Suất</th>
                      <th style={{ width: '12%' }}>Ngày Vay</th>
                      <th style={{ width: '12%' }}>Đến Hạn</th>
                      <th style={{ width: '16%' }}>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c, idx) => {
                      const isSettled = c.trangThaiHD === 'DA_TAT_TOAN' || Number(c.duNo) === 0;
                      return (
                        <tr key={c.soHDTD || idx}>
                          <td className="text-center">{idx + 1}</td>
                          <td className="font-monospace text-center fw-bold">{c.soHDTD}</td>
                          <td className="text-end num-tabular">{formatCurrencyVN(c.tienVay)}</td>
                          <td className={`text-end num-tabular fw-bold ${isSettled ? 'text-secondary' : 'text-danger'}`}>
                            {isSettled ? '0 ₫' : formatCurrencyVN(c.duNo)}
                          </td>
                          <td className="text-center">{c.laiSuat || 10.46}%</td>
                          <td className="text-center">{c.ngayVay ? formatDateVN(c.ngayVay) : '---'}</td>
                          <td className="text-center">{c.denHan ? formatDateVN(c.denHan) : '---'}</td>
                          <td className="text-center">
                            {isSettled ? (
                              <span className="badge bg-secondary text-white">ĐÃ TẤT TOÁN</span>
                            ) : (
                              <span className="badge bg-success text-white">ĐANG VAY</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {contracts.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-2">
                          Chưa có dữ liệu khế ước tín dụng
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* MỤC IV: Ý KIẾN CỦA CÁN BỘ TÍN DỤNG */}
              <div className="mb-4">
                <div className="fw-bold text-uppercase text-primary mb-1" style={{ fontSize: '12pt' }}>
                  IV. ĐÁNH GIÁ CỦA CÁN BỘ TÍN DỤNG QUẢN LÝ ĐỊA BÀN:
                </div>
                <p className="mb-0 text-justify" style={{ textIndent: '20px', fontSize: '11.5pt' }}>
                  Khách hàng <strong>{customer.hoTen}</strong> có lịch sử quan hệ tín dụng uy tín, mục đích vay vốn rõ ràng, hợp pháp và mang lại hiệu quả kinh tế thiết thực. Tài sản bảo đảm và nguồn thu nhập thực tế bảo đảm đầy đủ khả năng thanh toán nợ gốc, lãi đúng kỳ hạn quy định.
                </p>
              </div>

              {/* CHỮ KÝ 3 BÊN */}
              <div className="d-flex justify-content-between text-center mt-5 pt-3" style={{ fontSize: '11.5pt' }}>
                <div style={{ width: '32%' }}>
                  <strong>CÁN BỘ TÍN DỤNG</strong><br />
                  <em className="small text-muted">(Ký, ghi rõ họ tên)</em>
                  <div style={{ height: '70px' }}></div>
                  <strong>{customer.tenCBTD || 'Lê Văn Tín'}</strong>
                </div>

                <div style={{ width: '32%' }}>
                  <strong>TRƯỞNG PHÒNG TÍN DỤNG</strong><br />
                  <em className="small text-muted">(Ký, ghi rõ họ tên)</em>
                  <div style={{ height: '70px' }}></div>
                  <strong>........................................</strong>
                </div>

                <div style={{ width: '32%' }}>
                  <strong>GIÁM ĐỐC QUỸ</strong><br />
                  <em className="small text-muted">(Ký, đóng dấu)</em>
                  <div style={{ height: '70px' }}></div>
                  <strong>........................................</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
