import React, { useRef } from 'react';
import { ClipboardList, ExternalLink, Printer, Download, CheckCircle2, AlertTriangle, X, ShieldCheck, User, Building2, Calendar } from 'lucide-react';
import { formatDateVN } from '../../utils/dateUtils';

export default function InspectionDetailModal({ inspection, onClose }) {
  const printRef = useRef(null);
  if (!inspection) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Biên Bản Kiểm Tra Sử Dụng Vốn - ${inspection.maBBKT}</title>
        <style>
          @page WordSection1 {
            size: 595.3pt 841.9pt; /* A4 */
            margin: 42.5pt 42.5pt 42.5pt 42.5pt;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-paper-source: 0;
          }
          div.WordSection1 { page: WordSection1; font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.35; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px; font-family: 'Times New Roman', serif; font-size: 12pt; }
          th, td { border: 1px solid #333; padding: 6px 8px; vertical-align: top; }
          .header-table { border: none; margin-bottom: 15px; }
          .header-table td { border: none; padding: 2px; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .title { font-size: 16pt; font-weight: bold; text-align: center; margin-top: 10px; margin-bottom: 5px; }
          .section-title { font-size: 13pt; font-weight: bold; margin-top: 12px; margin-bottom: 4px; text-transform: uppercase; color: #0f172a; }
          .highlight { background-color: #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          <table class="header-table">
            <tr>
              <td style="width: 45%; text-align: center;">
                <span class="bold">QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</span><br/>
                <span>Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hoá</span><br/>
                <span>Số: ${inspection.maBBKT}/BBKT</span>
              </td>
              <td style="width: 55%; text-align: center;">
                <span class="bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br/>
                <span class="bold">Độc lập - Tự do - Hạnh phúc</span><br/>
                <span>-------------------</span><br/>
                <i>Quý Lộc, ngày ${inspection.ngayKiemTra || formatDateVN(new Date())}</i>
              </td>
            </tr>
          </table>

          <div class="title">BIÊN BẢN KIỂM TRA SỬ DỤNG VỐN VAY</div>
          <div class="text-center" style="margin-bottom: 15px; font-style: italic;">(Kiểm tra thực tế tình hình sử dụng vốn vay sau giải ngân và định kỳ)</div>

          <div class="section-title">I. THÀNH PHẦN ĐOÀN KIỂM TRA & THÔNG TIN MÓN VAY</div>
          <table>
            <tr>
              <td style="width: 30%;" class="bold">Họ và tên khách hàng:</td>
              <td style="width: 35%;" class="bold">${inspection.hoTen}</td>
              <td style="width: 15%;" class="bold">Mã KH:</td>
              <td style="width: 20%;">${inspection.maKH}</td>
            </tr>
            <tr>
              <td class="bold">Số HĐTD / Khế ước:</td>
              <td class="bold">${inspection.soHDTD}</td>
              <td class="bold">Lần kiểm tra:</td>
              <td>${inspection.lanKiemTra || 'Lần 1'}</td>
            </tr>
            <tr>
              <td class="bold">Thành phần đoàn KT:</td>
              <td colspan="3">${inspection.thanhPhanDoan || 'Cán bộ tín dụng phụ trách địa bàn'} (${inspection.loaiDoanKT || 'CBTD'})</td>
            </tr>
            <tr>
              <td class="bold">Ngày kiểm tra:</td>
              <td>${inspection.ngayKiemTra}</td>
              <td class="bold">Lần KT kế tiếp:</td>
              <td>${inspection.ngayKTNext || 'Theo quy định'}</td>
            </tr>
            <tr>
              <td class="bold">Địa điểm kiểm tra:</td>
              <td colspan="3">${inspection.diaDiemKT || 'Tại cơ sở khách hàng'}</td>
            </tr>
            <tr>
              <td class="bold">Hình thức kiểm tra:</td>
              <td colspan="3">${inspection.hinhThuc || 'Kiểm tra thực địa & hồ sơ chứng từ'}</td>
            </tr>
          </table>

          <div class="section-title">II. KẾT QUẢ KIỂM TRA THỰC TẾ & ĐÁNH GIÁ</div>
          <table>
            <tr class="highlight">
              <th style="width: 40%;">Nội Dung Kiểm Tra</th>
              <th style="width: 60%;">Kết Quả & Đánh Giá Của Đoàn</th>
            </tr>
            <tr>
              <td class="bold">Đánh giá mục đích sử dụng vốn:</td>
              <td class="bold" style="color: #15803d;">${inspection.danhGiaMucDich || 'Đúng mục đích 100%'}</td>
            </tr>
            <tr>
              <td class="bold">Tiến độ sử dụng vốn / Mua sắm:</td>
              <td>${inspection.tienDoSuDungVon || 'Đã giải ngân và đưa vào hoạt động kinh doanh ổn định.'}</td>
            </tr>
            <tr>
              <td class="bold">Mức độ rủi ro món vay:</td>
              <td class="bold">${inspection.mucDoRuiRo || 'Thấp / Bình thường'}</td>
            </tr>
            <tr>
              <td class="bold">Mô tả hiện trạng thực tế & Tài sản bảo đảm:</td>
              <td>${inspection.moTaThucTe || 'Khách hàng sử dụng vốn đúng phương án đã được phê duyệt, cơ sở kinh doanh vận hành bình thường, tài sản thế chấp nguyên vẹn.'}</td>
            </tr>
            <tr>
              <td class="bold">Kết luận chung:</td>
              <td class="bold" style="color: #1e40af;">${inspection.trangThai === 'ĐÃ_DUYỆT' || inspection.trangThai === 'Đạt' ? 'ĐẠT YÊU CẦU KIỂM TRA' : inspection.trangThai || 'ĐẠT'}</td>
            </tr>
            <tr>
              <td class="bold">Kiến nghị & Biện pháp quản lý:</td>
              <td>${inspection.kienNghi || 'Tiếp tục duy trì dư nợ, đôn đốc khách hàng thực hiện nghĩa vụ trả nợ gốc và lãi đầy đủ theo đúng thỏa thuận hợp đồng tín dụng.'}</td>
            </tr>
          </table>

          <table class="header-table" style="margin-top: 40px;">
            <tr>
              <td style="width: 50%; text-align: center;">
                <span class="bold">ĐẠI DIỆN KHÁCH HÀNG VAY VỐN</span><br/>
                <i>(Ký, ghi rõ họ tên)</i><br/><br/><br/><br/>
                <span class="bold">${inspection.hoTen}</span>
              </td>
              <td style="width: 50%; text-align: center;">
                <span class="bold">TRƯỞNG ĐOÀN KIỂM TRA</span><br/>
                <i>(Ký, ghi rõ họ tên)</i><br/><br/><br/><br/>
                <span class="bold">${inspection.thanhPhanDoan ? inspection.thanhPhanDoan.split(',')[0].trim() : 'Lê Văn Tín (CBTD)'}</span>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `BBKT_${inspection.maBBKT}_${inspection.hoTen.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-3 p-md-4">
          {/* Header Actions */}
          <div className="modal-header border-bottom pb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <span className="badge bg-primary-subtle text-primary font-monospace">
                  {inspection.maBBKT}
                </span>
                <span className="badge bg-success-subtle text-success">
                  {inspection.lanKiemTra || 'Lần 1'}
                </span>
                <span className="badge bg-light text-muted border small">
                  HĐTD: <strong>{inspection.soHDTD}</strong>
                </span>
              </div>
              <h5 className="fw-extrabold text-slate-900 m-0 font-heading">
                Biên Bản Kiểm Tra Sử Dụng Vốn Vay
              </h5>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm fw-semibold d-flex align-items-center gap-1.5"
                onClick={handleExportWord}
                title="Tải về file Microsoft Word (.doc) để lưu trữ hoặc chỉnh sửa"
              >
                <Download size={15} /> Xuất File Word (.doc)
              </button>

              <button
                type="button"
                className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-1.5 text-white"
                onClick={handlePrint}
                title="In trực tiếp hoặc Lưu dưới dạng PDF chuẩn A4"
              >
                <Printer size={15} /> In / Xuất PDF (A4)
              </button>

              <button type="button" className="btn-close ms-2" onClick={onClose} />
            </div>
          </div>

          {/* Document Preview (A4 Paper Simulation) */}
          <div className="modal-body py-4 bg-slate-100 d-flex justify-content-center">
            <div
              ref={printRef}
              className="bg-white p-4 p-md-5 rounded shadow-sm border text-dark print-document-container"
              style={{
                width: '100%',
                maxWidth: '850px',
                minHeight: '900px',
                fontFamily: '"Times New Roman", Times, serif',
                fontSize: '14px',
                lineHeight: '1.4'
              }}
            >
              {/* Header Quốc hiệu & Đơn vị */}
              <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4">
                <div className="text-center" style={{ width: '45%' }}>
                  <div className="fw-bold text-uppercase" style={{ fontSize: '13px' }}>
                    QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ
                  </div>
                  <div style={{ fontSize: '12px' }}>Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hoá</div>
                  <div className="fw-bold mt-1 text-primary font-monospace" style={{ fontSize: '12px' }}>
                    Số: {inspection.maBBKT}/BBKT
                  </div>
                </div>

                <div className="text-center" style={{ width: '55%' }}>
                  <div className="fw-bold text-uppercase" style={{ fontSize: '13px' }}>
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </div>
                  <div className="fw-bold" style={{ fontSize: '12px' }}>
                    Độc lập - Tự do - Hạnh phúc
                  </div>
                  <div className="text-muted" style={{ fontSize: '10px' }}>
                    -------------------
                  </div>
                  <div className="fst-italic mt-1" style={{ fontSize: '12px' }}>
                    Quý Lộc, ngày {inspection.ngayKiemTra || formatDateVN(new Date())}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-4">
                <h4 className="fw-bold text-uppercase mb-1" style={{ fontSize: '18px', letterSpacing: '0.5px' }}>
                  BIÊN BẢN KIỂM TRA SỬ DỤNG VỐN VAY
                </h4>
                <div className="fst-italic text-muted" style={{ fontSize: '13px' }}>
                  (Kiểm tra thực tế tình hình sử dụng vốn vay sau giải ngân và định kỳ)
                </div>
              </div>

              {/* Section 1: Thông tin chung */}
              <div className="mb-4">
                <div className="fw-bold text-uppercase text-primary border-bottom pb-1 mb-2" style={{ fontSize: '14px' }}>
                  I. THÀNH PHẦN ĐOÀN KIỂM TRA & THÔNG TIN MÓN VAY
                </div>
                <table className="table table-sm table-bordered align-middle mb-0" style={{ fontSize: '13px' }}>
                  <tbody>
                    <tr>
                      <td className="bg-light fw-bold" style={{ width: '30%' }}>Họ và tên khách hàng:</td>
                      <td className="fw-bold text-uppercase" style={{ width: '35%' }}>{inspection.hoTen}</td>
                      <td className="bg-light fw-bold" style={{ width: '15%' }}>Mã KH:</td>
                      <td className="font-monospace fw-bold">{inspection.maKH}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Số HĐTD / Khế ước:</td>
                      <td className="font-monospace fw-bold text-primary">{inspection.soHDTD}</td>
                      <td className="bg-light fw-bold">Lần kiểm tra:</td>
                      <td>{inspection.lanKiemTra || 'Lần 1'}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Thành phần đoàn kiểm tra:</td>
                      <td colSpan="3">
                        <span className="badge bg-primary me-1">{inspection.loaiDoanKT || 'CBTD'}</span>
                        {inspection.thanhPhanDoan || 'Cán bộ tín dụng phụ trách địa bàn'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Ngày kiểm tra:</td>
                      <td className="font-monospace">{inspection.ngayKiemTra}</td>
                      <td className="bg-light fw-bold">Lần KT kế tiếp:</td>
                      <td className="font-monospace text-primary fw-bold">{inspection.ngayKTNext || 'Theo quy định'}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Địa điểm kiểm tra:</td>
                      <td colSpan="3">{inspection.diaDiemKT || 'Tại cơ sở khách hàng'}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Hình thức kiểm tra:</td>
                      <td colSpan="3">{inspection.hinhThuc || 'Kiểm tra thực địa & hồ sơ chứng từ'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 2: Đánh giá & Kết quả */}
              <div className="mb-4">
                <div className="fw-bold text-uppercase text-primary border-bottom pb-1 mb-2" style={{ fontSize: '14px' }}>
                  II. KẾT QUẢ KIỂM TRA THỰC TẾ & ĐÁNH GIÁ
                </div>
                <table className="table table-sm table-bordered align-middle mb-2" style={{ fontSize: '13px' }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '35%' }}>Nội Dung Kiểm Tra</th>
                      <th style={{ width: '65%' }}>Kết Quả & Đánh Giá Của Đoàn</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="fw-bold">Mục đích sử dụng vốn:</td>
                      <td className="fw-bold text-success">{inspection.danhGiaMucDich || 'Đúng mục đích 100%'}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Tiến độ sử dụng vốn / Mua sắm:</td>
                      <td>{inspection.tienDoSuDungVon || 'Đã giải ngân và đưa vào hoạt động kinh doanh ổn định.'}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Mức độ rủi ro món vay:</td>
                      <td>
                        <span className={`badge ${inspection.mucDoRuiRo === 'Cao' || inspection.mucDoRuiRo === 'Rủi ro cao' ? 'bg-danger' : 'bg-success'}`}>
                          {inspection.mucDoRuiRo || 'Thấp / Bình thường'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Mô tả hiện trạng thực tế & TSBĐ:</td>
                      <td>{inspection.moTaThucTe || 'Khách hàng sử dụng vốn đúng phương án đã được phê duyệt, cơ sở kinh doanh vận hành bình thường, tài sản thế chấp nguyên vẹn.'}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Kết luận chung:</td>
                      <td className="fw-bold text-primary">{inspection.trangThai === 'ĐÃ_DUYỆT' || inspection.trangThai === 'Đạt' ? 'ĐẠT YÊU CẦU KIỂM TRA' : inspection.trangThai || 'ĐẠT'}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Kiến nghị & Biện pháp quản lý:</td>
                      <td>{inspection.kienNghi || 'Tiếp tục duy trì dư nợ, đôn đốc khách hàng thực hiện nghĩa vụ trả nợ gốc và lãi đầy đủ theo đúng thỏa thuận hợp đồng tín dụng.'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Chữ ký 2 bên */}
              <div className="row g-2 text-center mt-5 pt-3">
                <div className="col-6">
                  <div className="fw-bold" style={{ fontSize: '13px' }}>ĐẠI DIỆN KHÁCH HÀNG VAY VỐN</div>
                  <div className="fst-italic text-muted small" style={{ fontSize: '11px' }}>(Ký, ghi rõ họ tên)</div>
                  <div style={{ height: '70px' }}></div>
                  <div className="fw-bold">{inspection.hoTen}</div>
                </div>

                <div className="col-6">
                  <div className="fw-bold" style={{ fontSize: '13px' }}>TRƯỞNG ĐOÀN KIỂM TRA</div>
                  <div className="fst-italic text-muted small" style={{ fontSize: '11px' }}>(Ký, ghi rõ họ tên)</div>
                  <div style={{ height: '70px' }}></div>
                  <div className="fw-bold">{inspection.thanhPhanDoan ? inspection.thanhPhanDoan.split(',')[0].trim() : 'Lê Văn Tín (CBTD)'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
