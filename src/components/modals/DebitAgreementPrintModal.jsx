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
  CreditCard
} from 'lucide-react';
import { formatCurrencyVN, formatDateVN, getTodayVN } from '../../utils/dateUtils';

export default function DebitAgreementPrintModal({ registration, contracts = [], onClose }) {
  const printRef = useRef(null);
  if (!registration) return null;

  // Lọc các hợp đồng tín dụng của khách hàng này
  const custContracts = contracts.filter((c) => c.maKH === registration.maKH);
  const kyText =
    Number(registration.kyTrich) === 1
      ? 'Kỳ 1 (Ngày 05 hàng tháng)'
      : Number(registration.kyTrich) === 2
      ? 'Kỳ 2 (Ngày 15 hàng tháng)'
      : Number(registration.kyTrich) === 3
      ? 'Kỳ 3 (Ngày 25 hàng tháng)'
      : `Kỳ ${registration.kyTrich}`;

  const ngayTaoText = registration.ngayTao ? formatDateVN(registration.ngayTao) : getTodayVN();
  const dateParts = ngayTaoText.split('/');
  const ngayStr = dateParts[0] || new Date().getDate();
  const thangStr = dateParts[1] || new Date().getMonth() + 1;
  const namStr = dateParts[2] || new Date().getFullYear();

  // In ấn trực tiếp qua trình duyệt
  const handlePrint = () => {
    window.print();
  };

  // Xuất file Microsoft Word (.doc)
  const handleExportWord = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Thỏa Thuận Trích Nợ Tự Động - ${registration.hoTen}</title>
        <style>
          @page Section1 { size: 595.3pt 841.9pt; margin: 1.8cm 1.8cm 1.8cm 1.8cm; mso-header-margin: 36pt; mso-footer-margin: 36pt; }
          div.Section1 { page: Section1; }
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.45; color: #000; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .header-table td { vertical-align: top; text-align: center; }
          .title { text-align: center; font-size: 15pt; font-weight: bold; margin: 15px 0 5px 0; text-transform: uppercase; }
          .subtitle { text-align: center; font-size: 12pt; font-style: italic; margin-bottom: 25px; }
          .section-heading { font-weight: bold; font-size: 13pt; margin-top: 15px; margin-bottom: 8px; text-transform: uppercase; }
          .data-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          .data-table th, .data-table td { border: 1px solid #000; padding: 6px 8px; font-size: 12pt; }
          .data-table th { background-color: #f2f2f2; text-align: center; font-weight: bold; }
          .signature-table { width: 100%; border-collapse: collapse; margin-top: 40px; page-break-inside: avoid; }
          .signature-table td { vertical-align: top; text-align: center; width: 50%; font-size: 12pt; }
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
                Số: ....../TT-TN-YENTHO
              </td>
              <td style="width: 55%;">
                <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
                <strong>Độc lập - Tự do - Hạnh phúc</strong><br/>
                -------------------<br/>
                <em>Quý Lộc, ngày ${ngayStr} tháng ${thangStr} năm ${namStr}</em>
              </td>
            </tr>
          </table>

          <div class="title">GIẤY ĐĂNG KÝ VÀ THỎA THUẬN ỦY QUYỀN<br/>TRÍCH NỢ TỰ ĐỘNG TÀI KHOẢN THANH TOÁN (CASA)</div>
          <div class="subtitle">(Phục vụ thu nợ gốc, lãi tiền vay theo Thông tư số 14/2017/TT-NHNN)</div>

          <p>Hôm nay, ngày ${ngayStr} tháng ${thangStr} năm ${namStr}, tại trụ sở Quỹ tín dụng nhân dân Yên Thọ, chúng tôi gồm có:</p>

          <p class="section-heading">I. BÊN ỦY QUYỀN (KHÁCH HÀNG VAY VỐN):</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <tr>
              <td style="width: 60%; padding: 3px 0;">- Họ và tên khách hàng: <strong>${registration.hoTen || '...................................................'}</strong></td>
              <td style="width: 40%; padding: 3px 0;">Mã khách hàng: <strong>${registration.maKH || '..................'}</strong></td>
            </tr>
            <tr>
              <td style="padding: 3px 0;">- Số CCCD/GTTT: <strong>${registration.gttt || registration.cccd || '.......................................'}</strong></td>
              <td style="padding: 3px 0;">Điện thoại: <strong>${registration.dienThoai || '..................'}</strong></td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 3px 0;">- Địa chỉ thường trú: ${registration.diaChi || 'Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa'}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 3px 0;">- <strong>Số tài khoản thanh toán (CASA) chỉ định trích nợ:</strong> <strong style="font-size: 14pt; color: #004d40;">${registration.soTK || '...........................................'}</strong> mở tại Quỹ tín dụng nhân dân Yên Thọ.</td>
            </tr>
          </table>

          <p class="section-heading">II. BÊN ĐƯỢC ỦY QUYỀN: QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</p>
          <p style="margin: 3px 0;">- Đại diện: Ông/Bà <strong>........................................................</strong> - Chức vụ: <strong>Giám đốc</strong></p>
          <p style="margin: 3px 0;">- Cán bộ tín dụng quản lý: <strong>${registration.cbtđ || 'Cán bộ phụ trách địa bàn'}</strong></p>
          <p style="margin: 3px 0;">- Địa chỉ: Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa</p>

          <p class="section-heading">III. NỘI DUNG THỎA THUẬN ỦY QUYỀN TRÍCH NỢ:</p>
          <p>Bên Ủy quyền tự nguyện thỏa thuận và ủy quyền không hủy ngang cho Quỹ tín dụng nhân dân Yên Thọ được quyền tự động trích tiền từ tài khoản tiền gửi thanh toán (CASA) nêu trên để thanh toán nghĩa vụ trả nợ vay theo các nội dung sau:</p>

          <p><strong>1. Danh mục Hợp đồng tín dụng được trích nợ tự động:</strong></p>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 8%;">STT</th>
                <th style="width: 28%;">Số Hợp Đồng Tín Dụng</th>
                <th style="width: 24%;">Dư Nợ Vay (VNĐ)</th>
                <th style="width: 20%;">Lãi Suất (%/năm)</th>
                <th style="width: 20%;">Kỳ Hạn Thu Nợ</th>
              </tr>
            </thead>
            <tbody>
              ${
                custContracts.length > 0
                  ? custContracts
                      .map(
                        (c, i) => `
                <tr>
                  <td class="text-center">${i + 1}</td>
                  <td class="fw-bold">${c.soHDTD || 'HĐTD'}</td>
                  <td class="text-right">${formatCurrencyVN(c.duNo || c.soTien || 0)}</td>
                  <td class="text-center">${c.laiSuat || '...'}%/năm</td>
                  <td class="text-center">${kyText}</td>
                </tr>`
                      )
                      .join('')
                  : `
                <tr>
                  <td class="text-center">1</td>
                  <td class="fw-bold">Toàn bộ các HĐTD phát sinh</td>
                  <td class="text-right">Theo thực tế dư nợ</td>
                  <td class="text-center">Theo từng HĐ</td>
                  <td class="text-center">${kyText}</td>
                </tr>`
              }
            </tbody>
          </table>

          <p><strong>2. Thời điểm và phương thức trích nợ:</strong></p>
          <ul>
            <li><strong>Kỳ trích nợ ấn định:</strong> Định kỳ vào <strong>${kyText}</strong>. Quỹ tín dụng nhân dân Yên Thọ sẽ tự động quét số dư khả dụng và trích trừ tài khoản để thu nợ.</li>
            <li><strong>Thứ tự ưu tiên trích thu:</strong> Nợ gốc quá hạn (nếu có) → Lãi quá hạn → Lãi trong hạn kỳ hiện tại (tính theo số ngày thực tế theo Thông tư số 14/2017/TT-NHNN) → Gốc đến hạn.</li>
            <li><strong>Trường hợp số dư không đủ:</strong> Quỹ tín dụng nhân dân Yên Thọ được quyền trích toàn bộ số dư hiện có (nếu lớn hơn số dư tối thiểu duy trì tài khoản) để thu nợ một phần. Phần nghĩa vụ nợ còn lại sẽ được theo dõi nợ tồn đọng và tự động tiếp tục trích thu khi tài khoản có tiền.</li>
          </ul>

          <p><strong>3. Cam kết của Bên Ủy quyền:</strong></p>
          <ul>
            <li>Cam kết duy trì đủ số dư tiền gửi khả dụng trên tài khoản CASA tối thiểu bằng nghĩa vụ nợ phải trả trước ngày đến hạn của từng kỳ trích nợ.</li>
            <li>Chịu hoàn toàn trách nhiệm về các phát sinh nợ quá hạn, lãi phạt nếu tài khoản không đủ tiền để hệ thống thực hiện trích nợ tự động.</li>
            <li>Văn bản thỏa thuận này có hiệu lực kể từ ngày ký cho đến khi toàn bộ các khoản vay của khách hàng tại Quỹ tín dụng nhân dân Yên Thọ được tất toán hoàn toàn hoặc có văn bản thỏa thuận chấm dứt hiệu lực được hai bên chấp thuận.</li>
          </ul>

          <p>Giấy thỏa thuận này được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để thực hiện.</p>

          <table class="signature-table">
            <tr>
              <td>
                <strong>BÊN ỦY QUYỀN (KHÁCH HÀNG)</strong><br/>
                <em>(Ký, ghi rõ họ tên)</em>
                <br/><br/><br/><br/><br/>
                <strong>${registration.hoTen}</strong>
              </td>
              <td>
                <strong>ĐẠI DIỆN QTDND YÊN THỌ</strong><br/>
                <em>(Ký, đóng dấu, ghi rõ chức vụ)</em>
                <br/><br/><br/><br/><br/>
                <strong>GIÁM ĐỐC</strong>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ThoaThuanTrichNo_${registration.maKH}_${registration.hoTen.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern shadow-lg border-0">
          {/* Header Thanh Công Cụ */}
          <div className="modal-header border-bottom py-3 px-4 bg-light d-flex justify-content-between align-items-center">
            <div>
              <h5 className="modal-title fw-bold text-slate-900 font-heading d-flex align-items-center gap-2 m-0">
                <FileText size={20} className="text-primary" />
                Văn Bản Thỏa Thuận Trích Nợ Tự Động (CASA)
              </h5>
              <span className="text-muted small">
                Khách hàng: <strong className="text-slate-800">{registration.hoTen}</strong> • Mã KH: <span className="font-monospace text-primary">{registration.maKH}</span>
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-success btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
                onClick={handleExportWord}
                title="Tải tệp Microsoft Word chuẩn văn bản hành chính"
              >
                <Download size={15} /> Xuất Word (.doc)
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
                onClick={handlePrint}
                title="In trực tiếp trang A4"
              >
                <Printer size={15} /> In Thỏa Thuận (A4)
              </button>
              <button type="button" className="btn-close ms-2" onClick={onClose} />
            </div>
          </div>

          {/* Khung Xem Trước Trang In A4 */}
          <div className="modal-body p-4 bg-slate-100" style={{ minHeight: '75vh' }}>
            <div
              ref={printRef}
              className="bg-white p-5 mx-auto rounded-3 shadow-sm"
              style={{
                maxWidth: '850px',
                minHeight: '1100px',
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '13pt',
                lineHeight: '1.45',
                color: '#111827'
              }}
            >
              {/* Tiêu đề Quốc hiệu & Đơn vị */}
              <div className="d-flex justify-content-between text-center mb-4">
                <div style={{ width: '45%' }}>
                  <div className="fw-bold fs-6">QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</div>
                  <div className="small text-muted">Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hoá</div>
                  <div className="small text-muted font-monospace mt-1">Số: ....../TT-TN-YENTHO</div>
                </div>
                <div style={{ width: '55%' }}>
                  <div className="fw-bold fs-6">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="fw-bold">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-muted small">-------------------</div>
                  <div className="fst-italic small mt-1">
                    Quý Lộc, ngày {ngayStr} tháng {thangStr} năm {namStr}
                  </div>
                </div>
              </div>

              {/* Tên văn bản */}
              <div className="text-center my-4">
                <h4 className="fw-bold text-uppercase m-0" style={{ letterSpacing: '0.5px' }}>
                  GIẤY ĐĂNG KÝ VÀ THỎA THUẬN ỦY QUYỀN
                  <br />
                  TRÍCH NỢ TỰ ĐỘNG TÀI KHOẢN THANH TOÁN (CASA)
                </h4>
                <div className="fst-italic small text-muted mt-1">
                  (Phục vụ thu hồi nợ gốc, lãi tiền vay theo Thông tư số 14/2017/TT-NHNN)
                </div>
              </div>

              {/* Lời mở đầu */}
              <p className="mb-3">
                Hôm nay, ngày {ngayStr} tháng {thangStr} năm {namStr}, tại trụ sở Quỹ tín dụng nhân dân Yên Thọ, chúng tôi gồm có:
              </p>

              {/* I. BÊN ỦY QUYỀN */}
              <div className="fw-bold text-uppercase mb-2 text-primary border-bottom pb-1">
                I. BÊN ỦY QUYỀN (KHÁCH HÀNG VAY VỐN):
              </div>
              <div className="row g-2 mb-3">
                <div className="col-7">
                  - Họ và tên khách hàng: <strong className="fs-6">{registration.hoTen}</strong>
                </div>
                <div className="col-5">
                  - Mã khách hàng: <strong className="font-monospace text-primary">{registration.maKH}</strong>
                </div>
                <div className="col-7">
                  - Số CCCD/GTTT: <strong>{registration.gttt || registration.cccd || '---'}</strong>
                </div>
                <div className="col-5">
                  - Điện thoại: <strong>{registration.dienThoai || '---'}</strong>
                </div>
                <div className="col-12">
                  - Địa chỉ thường trú: {registration.diaChi || 'Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa'}
                </div>
                <div className="col-12 p-2 bg-light rounded border border-success-subtle mt-1">
                  - <strong>Số tài khoản thanh toán (CASA) ủy quyền:</strong>{' '}
                  <strong className="fs-5 font-monospace text-success">{registration.soTK}</strong>{' '}
                  <span className="small text-muted">(Mở tại Quỹ tín dụng nhân dân Yên Thọ)</span>
                </div>
              </div>

              {/* II. BÊN ĐƯỢC ỦY QUYỀN */}
              <div className="fw-bold text-uppercase mb-2 text-primary border-bottom pb-1">
                II. BÊN ĐƯỢC ỦY QUYỀN: QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ
              </div>
              <div className="mb-3">
                <div>- Đại diện: Ông/Bà <strong>........................................................</strong> - Chức vụ: <strong>Giám đốc</strong></div>
                <div>- Cán bộ tín dụng phụ trách: <strong>{registration.cbtđ || 'Cán bộ tín dụng địa bàn'}</strong></div>
                <div>- Địa chỉ giao dịch: Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hoá</div>
              </div>

              {/* III. NỘI DUNG ỦY QUYỀN */}
              <div className="fw-bold text-uppercase mb-2 text-primary border-bottom pb-1">
                III. NỘI DUNG THỎA THUẬN ỦY QUYỀN TRÍCH NỢ:
              </div>
              <p className="mb-2">
                Bên Ủy quyền tự nguyện ủy quyền vô điều kiện và không hủy ngang cho Quỹ tín dụng nhân dân Yên Thọ được chủ động tự động trích nợ từ tài khoản thanh toán (CASA) số{' '}
                <strong className="font-monospace text-success">{registration.soTK}</strong> để thực hiện nghĩa vụ trả nợ vay theo các điều khoản sau:
              </p>

              <div className="fw-bold mb-1">1. Danh mục các Hợp đồng tín dụng được trích thu:</div>
              <div className="table-responsive mb-3">
                <table className="table table-bordered table-sm align-middle mb-0" style={{ fontSize: '11pt' }}>
                  <thead className="table-light text-center">
                    <tr>
                      <th style={{ width: '8%' }}>STT</th>
                      <th style={{ width: '32%' }}>Số Hợp Đồng Tín Dụng</th>
                      <th style={{ width: '25%' }} className="text-end">Dư Nợ Vay (VNĐ)</th>
                      <th style={{ width: '15%' }} className="text-center">Lãi Suất</th>
                      <th style={{ width: '20%' }} className="text-center">Kỳ Trích</th>
                    </tr>
                  </thead>
                  <tbody>
                    {custContracts.length > 0 ? (
                      custContracts.map((c, i) => (
                        <tr key={i}>
                          <td className="text-center">{i + 1}</td>
                          <td className="fw-bold font-monospace text-primary">{c.soHDTD}</td>
                          <td className="text-end num-tabular fw-semibold">{formatCurrencyVN(c.duNo || c.soTien || 0)}</td>
                          <td className="text-center">{c.laiSuat || '...'}%/năm</td>
                          <td className="text-center fw-semibold text-success">{kyText}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="text-center">1</td>
                        <td className="fw-bold font-monospace text-primary">Các khoản vay theo thoả thuận</td>
                        <td className="text-end num-tabular">Theo thực tế phát sinh</td>
                        <td className="text-center">Theo từng HĐ</td>
                        <td className="text-center fw-semibold text-success">{kyText}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="fw-bold mb-1">2. Thời điểm và nguyên tắc trích nợ:</div>
              <ul className="ps-4 mb-3">
                <li>
                  <strong>Kỳ hạn trích nợ định kỳ:</strong> Được ấn định vào <strong>{kyText}</strong>. Hệ thống tự động thực hiện lệnh trích tài khoản vào ngày làm việc này.
                </li>
                <li>
                  <strong>Nguyên tắc trích trừ nghĩa vụ nợ:</strong> Thu nợ gốc quá hạn (nếu có) → Lãi quá hạn → Lãi trong hạn kỳ hiện tại (tính chính xác theo ngày thực tế chuẩn Thông tư số 14/2017/TT-NHNN) → Nợ gốc đến hạn.
                </li>
                <li>
                  <strong>Xử lý khi tài khoản không đủ số dư:</strong> Quỹ tín dụng nhân dân Yên Thọ được quyền trích một phần số dư hiện có và tiếp tục theo dõi trích thu nợ tồn đọng trong các đợt tiếp theo ngay khi tài khoản có tiền.
                </li>
              </ul>

              <div className="fw-bold mb-1">3. Cam kết của khách hàng:</div>
              <ul className="ps-4 mb-4">
                <li>Bên Ủy quyền cam kết luôn duy trì đủ số dư khả dụng trên tài khoản CASA tối thiểu bằng số tiền nghĩa vụ nợ của từng kỳ hạn thanh toán.</li>
                <li>Chịu hoàn toàn trách nhiệm và các biện pháp xử lý theo quy định nội bộ của Quỹ tín dụng nhân dân Yên Thọ nếu để phát sinh nợ quá hạn do không có đủ số dư tài khoản.</li>
                <li>Thỏa thuận này có hiệu lực kể từ ngày ký cho đến khi toàn bộ dư nợ của các Hợp đồng tín dụng được tất toán hoàn toàn.</li>
              </ul>

              {/* Chữ ký hai bên */}
              <div className="d-flex justify-content-between text-center mt-5 pt-3" style={{ pageBreakInside: 'avoid' }}>
                <div style={{ width: '45%' }}>
                  <div className="fw-bold text-uppercase">BÊN ỦY QUYỀN (KHÁCH HÀNG)</div>
                  <div className="fst-italic small text-muted">(Ký, ghi rõ họ tên)</div>
                  <div style={{ height: '90px' }}></div>
                  <div className="fw-bold fs-6">{registration.hoTen}</div>
                </div>

                <div style={{ width: '45%' }}>
                  <div className="fw-bold text-uppercase">ĐẠI DIỆN QTDND YÊN THỌ</div>
                  <div className="fst-italic small text-muted">(Ký, đóng dấu, ghi rõ chức vụ)</div>
                  <div style={{ height: '90px' }}></div>
                  <div className="fw-bold fs-6">GIÁM ĐỐC</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer nút đóng */}
          <div className="modal-footer border-top py-2 px-4 bg-light d-flex justify-content-between">
            <span className="text-muted small">
              Văn bản được thiết lập chuẩn khổ giấy A4 (ISO 216) phục vụ in ấn và lưu trữ hồ sơ pháp lý tín dụng.
            </span>
            <button type="button" className="btn btn-secondary btn-sm px-4 fw-semibold" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
