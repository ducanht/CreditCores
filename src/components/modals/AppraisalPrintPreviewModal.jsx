import React, { useRef } from 'react';
import {
  Printer,
  Download,
  FileText,
  X,
  User,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Landmark,
  ShieldCheck
} from 'lucide-react';
import { formatCurrencyVN, formatDateVN, getTodayVN } from '../../utils/dateUtils';

export default function AppraisalPrintPreviewModal({ appraisal, onClose }) {
  const printRef = useRef(null);
  if (!appraisal) return null;

  const duyetVay = Number(appraisal.duyetVay || appraisal.deXuatVay) || 0;
  const thoiHan = Number(appraisal.thoiHanThang || appraisal.thoiHanVay) || 12;
  const laiSuat = Number(appraisal.laiSuatDuyet || appraisal.laiSuatDeNghi) || 0;
  const thuNhap = Number(appraisal.tongThuNhapThang || appraisal.thuNhapChinh) || 0;
  const chiPhi = Number(appraisal.tongChiPhiThang) || 0;
  const thuNhapRong = Number(appraisal.thuNhapRong || appraisal.thangDuThang) || (thuNhap - chiPhi);
  const giaTriTSBD = Number(appraisal.giaTriTSBD) || 0;
  const tyLeLTV = appraisal.tyLeLTV || (giaTriTSBD > 0 ? ((duyetVay / giaTriTSBD) * 100).toFixed(1) : '0.0');
  const tyLeDSR = appraisal.tyLeDSR || '0.0';
  const emi = Number(appraisal.nghiaVuTraNoThang) || (duyetVay / thoiHan + (duyetVay * (laiSuat / 100)) / 12);

  // Phân tích chi tiết loại đất
  let chiTietDat = [];
  try {
    chiTietDat = typeof appraisal.chiTietLoaiDat === 'string'
      ? JSON.parse(appraisal.chiTietLoaiDat || '[]')
      : (appraisal.chiTietLoaiDat || []);
  } catch (e) {
    chiTietDat = [];
  }

  // Danh sách ý kiến phê duyệt
  const opinions = appraisal.danhSachYKien || [];

  // Thao tác in ấn
  const handlePrint = () => {
    window.print();
  };

  // Xuất file Microsoft Word (.doc / .docx)
  const handleExportWord = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Báo Cáo Thẩm Định Tín Dụng - ${appraisal.maBCTD}</title>
        <style>
          @page WordSection1 {
            size: 595.3pt 841.9pt; /* A4 */
            margin: 42.5pt 42.5pt 42.5pt 42.5pt;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-paper-source: 0;
          }
          div.WordSection1 { page: WordSection1; font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.3; }
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
                <span>Huyện Ý Yên, Tỉnh Nam Định</span><br/>
                <span>Số: ${appraisal.maBCTD}/BCTD</span>
              </td>
              <td style="width: 55%; text-align: center;">
                <span class="bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br/>
                <span class="bold">Độc lập - Tự do - Hạnh phúc</span><br/>
                <span>-------------------</span><br/>
                <i>Yên Thọ, ngày ${formatDateVN(appraisal.ngayLap || new Date())}</i>
              </td>
            </tr>
          </table>

          <div class="title">BÁO CÁO THẨM ĐỊNH TÍN DỤNG & ĐỊNH GIÁ TÀI SẢN BẢO ĐẢM</div>
          <div class="text-center" style="margin-bottom: 15px; font-style: italic;">(Kiêm Tờ trình đề xuất cấp tín dụng món vay cá nhân / hộ kinh doanh)</div>

          <div class="section-title">I. THÔNG TIN PHÁP LÝ KHÁCH HÀNG & NGƯỜI ĐỒNG VAY</div>
          <table>
            <tr>
              <td style="width: 30%;" class="bold">Họ và tên khách hàng:</td>
              <td style="width: 35%;" class="bold">${appraisal.hoTen}</td>
              <td style="width: 15%;" class="bold">Mã KH:</td>
              <td style="width: 20%;">${appraisal.maKH}</td>
            </tr>
            <tr>
              <td class="bold">Số CCCD / GTTT:</td>
              <td>${appraisal.soCCCD || '---'}</td>
              <td class="bold">Ngày cấp / Nơi cấp:</td>
              <td>${formatDateVN(appraisal.ngayCap || '')}</td>
            </tr>
            <tr>
              <td class="bold">Ngày sinh / Giới tính:</td>
              <td>${appraisal.ngaySinh || '---'} / ${appraisal.gioiTinh || 'Nam'}</td>
              <td class="bold">Số điện thoại:</td>
              <td>${appraisal.dienThoai || '---'}</td>
            </tr>
            <tr>
              <td class="bold">Địa chỉ thường trú:</td>
              <td colspan="3">${appraisal.diaChi}</td>
            </tr>
            <tr>
              <td class="bold">Ngành nghề kinh doanh:</td>
              <td>${appraisal.nganhNghe || 'Kinh doanh tự do'}</td>
              <td class="bold">Trình độ:</td>
              <td>${appraisal.trinhDo || 'Đại học / Cao đẳng'}</td>
            </tr>
            <tr>
              <td class="bold">Tình trạng hôn nhân:</td>
              <td>${appraisal.tinhTrangHonNhan || 'Đã kết hôn'}</td>
              <td class="bold">Người đồng vay:</td>
              <td>${appraisal.nguoiDongVay || 'Không có'}</td>
            </tr>
          </table>

          <div class="section-title">II. NĂNG LỰC TÀI CHÍNH & NGUỒN THU NHẬP</div>
          <table>
            <tr class="highlight">
              <th style="width: 50%;">Nguồn Thu Nhập (VNĐ/tháng)</th>
              <th style="width: 50%;">Chi Phí & Nghĩa Vụ Hàng Tháng (VNĐ)</th>
            </tr>
            <tr>
              <td>
                • Người vay chính: <span class="bold">${formatCurrencyVN(appraisal.thuNhapNguoiVay || appraisal.thuNhapChinh)}</span><br/>
                <i>(${appraisal.nguonThuNguoiVay || 'SXKD và dịch vụ'})</i><br/>
                • Người đồng vay: <span class="bold">${formatCurrencyVN(appraisal.thuNhapDongVay || 0)}</span><br/>
                <i>(${appraisal.nguonThuDongVay || 'Buôn bán và thu nhập khác'})</i><br/>
                <hr style="margin: 4px 0;"/>
                <span class="bold">TỔNG THU NHẬP: ${formatCurrencyVN(thuNhap)}/tháng</span>
              </td>
              <td>
                • Chi phí sinh hoạt: ${formatCurrencyVN(appraisal.chiPhiSinhHoat || 0)}<br/>
                • Chi phí SXKD: ${formatCurrencyVN(appraisal.chiPhiSXKD || 0)}<br/>
                • Chi phí khác: ${formatCurrencyVN(appraisal.chiPhiKhac || 0)}<br/>
                <hr style="margin: 4px 0;"/>
                <span class="bold">TỔNG CHI PHÍ: ${formatCurrencyVN(chiPhi)}/tháng</span><br/>
                <span class="bold" style="color: #15803d;">THU NHẬP RÒNG: ${formatCurrencyVN(thuNhapRong)}/tháng</span>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <span class="bold">Chứng từ chứng minh thu nhập:</span> ${appraisal.chungMinhThuNhap || 'Đầy đủ sổ sách theo dõi doanh thu và hóa đơn bán lẻ thực tế.'}
              </td>
            </tr>
          </table>

          <div class="section-title">III. TÀI SẢN BẢO ĐẢM & ĐỊNH GIÁ</div>
          <table>
            <tr>
              <td style="width: 25%;" class="bold">Loại TSBĐ:</td>
              <td colspan="3">${appraisal.loaiTSBD || 'Quyền sử dụng đất & Nhà ở'}</td>
            </tr>
            <tr>
              <td class="bold">Số GCN (Sổ đỏ):</td>
              <td>${appraisal.soGCN || '---'}</td>
              <td class="bold">Thửa đất / Tờ BĐ:</td>
              <td>Thửa số ${appraisal.thuaDatSo || '---'}, Tờ bản đồ ${appraisal.toBanDoSo || '---'}</td>
            </tr>
            <tr>
              <td class="bold">Chủ sở hữu TSBĐ:</td>
              <td>${appraisal.chuSoHuuTSBD || appraisal.hoTen}</td>
              <td class="bold">Nguồn gốc TS:</td>
              <td>${appraisal.nguonGocTSBD || 'Nhận chuyển nhượng'}</td>
            </tr>
            <tr>
              <td class="bold">Địa chỉ tài sản:</td>
              <td colspan="3">${appraisal.diaChiTSBD || appraisal.diaChi}</td>
            </tr>
          </table>

          ${chiTietDat.length > 0 ? `
          <table style="margin-top: 4px;">
            <tr class="highlight">
              <th>Loại Đất</th>
              <th class="text-right">Diện Tích (m²)</th>
              <th class="text-right">Đơn Giá Định Giá (VNĐ/m²)</th>
              <th class="text-right">Thành Tiền (VNĐ)</th>
            </tr>
            ${chiTietDat.map(d => `
              <tr>
                <td>${d.loaiDat}</td>
                <td class="text-right">${d.dienTich}</td>
                <td class="text-right">${formatCurrencyVN(d.donGia)}</td>
                <td class="text-right bold">${formatCurrencyVN(d.thanhTien)}</td>
              </tr>
            `).join('')}
            <tr>
              <td colspan="3" class="bold">Giá trị công trình xây dựng / Nhà ở trên đất:</td>
              <td class="text-right bold">${formatCurrencyVN(appraisal.giaTriCongTrinh || 0)}</td>
            </tr>
            <tr class="highlight">
              <td colspan="3" class="bold">TỔNG GIÁ TRỊ ĐỊNH GIÁ QTDND (VNĐ):</td>
              <td class="text-right bold" style="color: #15803d; font-size: 13pt;">${formatCurrencyVN(giaTriTSBD)}</td>
            </tr>
          </table>
          ` : ''}

          <div class="section-title">IV. ĐỀ XUẤT CẤP TÍN DỤNG & CÁC CHỈ SỐ AN TOÀN</div>
          <table>
            <tr class="highlight">
              <th style="width: 25%;">Nội Dung Đề Xuất</th>
              <th style="width: 25%;">Thông Số Cấp Vay</th>
              <th style="width: 25%;">Chỉ Số Tài Chính</th>
              <th style="width: 25%;">Đánh Giá An Toàn</th>
            </tr>
            <tr>
              <td class="bold">Số tiền cho vay:</td>
              <td class="bold" style="color: #b91c1c;">${formatCurrencyVN(duyetVay)}</td>
              <td class="bold">Tỷ lệ LTV (Vay/TSBĐ):</td>
              <td class="bold">${tyLeLTV}% (Chuẩn <= 70%)</td>
            </tr>
            <tr>
              <td class="bold">Thời hạn vay:</td>
              <td>${thoiHan} tháng</td>
              <td class="bold">Tỷ lệ DTI (Nợ/Thu nhập):</td>
              <td class="bold">${tyLeDSR}% (Chuẩn <= 60%)</td>
            </tr>
            <tr>
              <td class="bold">Lãi suất cho vay:</td>
              <td>${laiSuat}% / năm</td>
              <td class="bold">Nghĩa vụ nợ tháng cao nhất:</td>
              <td class="bold">${formatCurrencyVN(emi)}</td>
            </tr>
            <tr>
              <td class="bold">Phương thức trả gốc:</td>
              <td>${appraisal.phuongThucTraGoc === 'HANG_QUY' ? 'Trả gốc đều hàng quý (3 tháng/lần)' : appraisal.phuongThucTraGoc === 'CUOI_KY' ? 'Trả toàn bộ gốc khi đáo hạn' : 'Trả gốc đều hàng tháng'}</td>
              <td class="bold">Phương thức trả lãi:</td>
              <td>Hàng tháng theo dư nợ thực tế</td>
            </tr>
            <tr>
              <td class="bold">Mục đích vay vốn:</td>
              <td colspan="3">${appraisal.mucDichVay}</td>
            </tr>
            <tr>
              <td class="bold">Đánh giá phương án tối ưu:</td>
              <td colspan="3" style="font-style: italic;">${appraisal.phuongAnToiUu || 'Dòng tiền thặng dư của khách hàng đảm bảo thực hiện tốt nghĩa vụ trả nợ gốc và lãi đúng hạn.'}</td>
            </tr>
          </table>

          <div class="section-title">V. KẾT LUẬN & Ý KIẾN PHÊ DUYỆT</div>
          <p><span class="bold">1. Đề xuất của CBTD:</span> ${appraisal.ketLuan} - Mức độ rủi ro: ${appraisal.mucDoRuiRo || 'Thấp'}.</p>
          <p><span class="bold">2. Điều kiện giải ngân:</span> ${appraisal.dieuKienGiaiNgan || 'Hoàn tất thủ tục công chứng HĐTC và đăng ký giao dịch bảo đảm đầy đủ.'}</p>

          <table class="header-table" style="margin-top: 30px;">
            <tr>
              <td style="width: 25%; text-align: center;">
                <span class="bold">CÁN BỘ THẨM ĐỊNH</span><br/>
                <i>(Ký, ghi rõ họ tên)</i><br/><br/><br/><br/>
                <span class="bold">${appraisal.canBoThamDinh || 'Lê Văn Tín (CBTD)'}</span>
              </td>
              <td style="width: 25%; text-align: center;">
                <span class="bold">TRƯỞNG PHÒNG TÍN DỤNG</span><br/>
                <i>(Ký, ghi rõ họ tên)</i><br/><br/><br/><br/>
                <span class="bold">Trần Văn Trưởng</span>
              </td>
              <td style="width: 25%; text-align: center;">
                <span class="bold">BAN KIỂM SOÁT</span><br/>
                <i>(Ký, ghi rõ họ tên)</i><br/><br/><br/><br/>
                <span class="bold">Ban Kiểm Soát</span>
              </td>
              <td style="width: 25%; text-align: center;">
                <span class="bold">GIÁM ĐỐC / HĐTD</span><br/>
                <i>(Ký, đóng dấu)</i><br/><br/><br/><br/>
                <span class="bold">Phạm Giám Đốc</span>
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
    downloadLink.download = `BCTD_${appraisal.maBCTD}_${appraisal.hoTen.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1070 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content card-modern p-3 p-md-4">
          {/* Action Header */}
          <div className="modal-header border-bottom pb-3 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fw-extrabold text-slate-900 m-0 d-flex align-items-center gap-2">
                <Printer size={20} className="text-primary" /> Xem Trước & In Báo Cáo Thẩm Định Tín Dụng
              </h5>
              <span className="text-muted small">
                Mã hồ sơ: <strong>{appraisal.maBCTD}</strong> | Khách hàng: <strong>{appraisal.hoTen}</strong>
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm fw-semibold d-flex align-items-center gap-1.5"
                onClick={handleExportWord}
                title="Tải về file Microsoft Word (.doc) để chỉnh sửa"
              >
                <Download size={15} /> Xuất File Word (.doc)
              </button>

              <button
                type="button"
                className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-1.5 text-white"
                onClick={handlePrint}
                title="In trực tiếp hoặc Lưu dưới dạng PDF"
              >
                <Printer size={15} /> In / Xuất PDF (A4)
              </button>

              <button type="button" className="btn-close ms-2" onClick={onClose} />
            </div>
          </div>

          {/* Printable Document Body (A4 Simulation) */}
          <div className="modal-body py-4 bg-slate-100 d-flex justify-content-center">
            <div
              ref={printRef}
              className="bg-white p-4 p-md-5 rounded shadow-sm border text-dark print-document-container"
              style={{
                width: '100%',
                maxWidth: '850px',
                minHeight: '1100px',
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
                  <div style={{ fontSize: '12px' }}>Huyện Ý Yên, Tỉnh Nam Định</div>
                  <div className="fw-bold mt-1 text-primary font-monospace" style={{ fontSize: '12px' }}>
                    Số: {appraisal.maBCTD}/BCTD
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
                    Yên Thọ, ngày {formatDateVN(appraisal.ngayLap || new Date())}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-4">
                <h4 className="fw-bold text-uppercase mb-1" style={{ fontSize: '18px', letterSpacing: '0.5px' }}>
                  BÁO CÁO THẨM ĐỊNH TÍN DỤNG & ĐỊNH GIÁ TSĐB
                </h4>
                <div className="fst-italic text-muted" style={{ fontSize: '13px' }}>
                  (Kiêm Tờ trình đề xuất cấp hạn mức cho vay phục vụ sản xuất kinh doanh / đời sống)
                </div>
              </div>

              {/* Section 1: Pháp lý */}
              <div className="mb-4">
                <div className="fw-bold text-uppercase text-primary border-bottom pb-1 mb-2" style={{ fontSize: '14px' }}>
                  I. THÔNG TIN PHÁP LÝ KHÁCH HÀNG & NGƯỜI ĐỒNG VAY
                </div>
                <div className="row g-2">
                  <div className="col-8">
                    <table className="table table-sm table-bordered align-middle mb-0" style={{ fontSize: '13px' }}>
                      <tbody>
                        <tr>
                          <td className="bg-light fw-bold" style={{ width: '35%' }}>Họ và tên khách hàng:</td>
                          <td className="fw-bold text-uppercase">{appraisal.hoTen}</td>
                        </tr>
                        <tr>
                          <td className="bg-light fw-bold">Mã thành viên / Mã KH:</td>
                          <td><strong>{appraisal.maKH}</strong></td>
                        </tr>
                        <tr>
                          <td className="bg-light fw-bold">Số CCCD / Ngày cấp:</td>
                          <td>{appraisal.soCCCD} ({formatDateVN(appraisal.ngayCap || '')})</td>
                        </tr>
                        <tr>
                          <td className="bg-light fw-bold">Ngày sinh / Giới tính:</td>
                          <td>{appraisal.ngaySinh} / {appraisal.gioiTinh}</td>
                        </tr>
                        <tr>
                          <td className="bg-light fw-bold">Số điện thoại liên hệ:</td>
                          <td>{appraisal.dienThoai}</td>
                        </tr>
                        <tr>
                          <td className="bg-light fw-bold">Địa chỉ thường trú:</td>
                          <td>{appraisal.diaChi}</td>
                        </tr>
                        <tr>
                          <td className="bg-light fw-bold">Ngành nghề / Trình độ:</td>
                          <td>{appraisal.nganhNghe || 'Kinh doanh tự do'} • {appraisal.trinhDo || 'Đại học / Cao đẳng'}</td>
                        </tr>
                        <tr>
                          <td className="bg-light fw-bold">Người đồng vay (Vợ/Chồng):</td>
                          <td>{appraisal.nguoiDongVay || 'Không có'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="col-4 text-center">
                    <div className="p-2 border rounded bg-light d-flex flex-column align-items-center justify-content-center h-100">
                      {appraisal.hinhAnhKH ? (
                        <img
                          src={appraisal.hinhAnhKH}
                          alt="Ảnh khách hàng"
                          className="rounded border mb-1 object-fit-cover"
                          style={{ width: '110px', height: '140px' }}
                        />
                      ) : (
                        <div
                          className="rounded border bg-white d-flex flex-column align-items-center justify-content-center text-muted mb-1"
                          style={{ width: '110px', height: '140px' }}
                        >
                          <User size={36} className="opacity-50" />
                          <span style={{ fontSize: '10px' }}>Ảnh Khách Hàng</span>
                        </div>
                      )}
                      <span className="text-muted small" style={{ fontSize: '11px' }}>Ảnh nhận diện CBTD chụp</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Tài chính & Thu nhập */}
              <div className="mb-4">
                <div className="fw-bold text-uppercase text-primary border-bottom pb-1 mb-2" style={{ fontSize: '14px' }}>
                  II. NĂNG LỰC TÀI CHÍNH & KHẢ NĂNG TRẢ NỢ
                </div>
                <table className="table table-sm table-bordered align-middle mb-2" style={{ fontSize: '13px' }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '50%' }}>Cơ Cấu Thu Nhập (VNĐ/tháng)</th>
                      <th style={{ width: '50%' }}>Chi Phí & Nghĩa Vụ Hàng Tháng (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="d-flex justify-content-between">
                          <span>1. Thu nhập người vay chính:</span>
                          <strong>{formatCurrencyVN(appraisal.thuNhapNguoiVay || appraisal.thuNhapChinh)}</strong>
                        </div>
                        <div className="text-muted small mb-1"><i>({appraisal.nguonThuNguoiVay || 'Lương và lợi nhuận SXKD'})</i></div>

                        <div className="d-flex justify-content-between">
                          <span>2. Thu nhập người đồng vay:</span>
                          <strong>{formatCurrencyVN(appraisal.thuNhapDongVay || 0)}</strong>
                        </div>
                        <div className="text-muted small mb-1"><i>({appraisal.nguonThuDongVay || 'Kinh doanh thương mại'})</i></div>

                        <div className="d-flex justify-content-between pt-1 border-top fw-bold text-primary">
                          <span>TỔNG THU NHẬP HÀNG THÁNG:</span>
                          <span>{formatCurrencyVN(thuNhap)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex justify-content-between">
                          <span>1. Chi phí sinh hoạt gia đình:</span>
                          <span>{formatCurrencyVN(appraisal.chiPhiSinhHoat || 0)}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>2. Chi phí sản xuất kinh doanh:</span>
                          <span>{formatCurrencyVN(appraisal.chiPhiSXKD || 0)}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>3. Chi phí khác:</span>
                          <span>{formatCurrencyVN(appraisal.chiPhiKhac || 0)}</span>
                        </div>
                        <div className="d-flex justify-content-between pt-1 border-top fw-bold text-danger">
                          <span>TỔNG CHI PHÍ:</span>
                          <span>{formatCurrencyVN(chiPhi)}</span>
                        </div>
                        <div className="d-flex justify-content-between pt-1 border-top fw-bold text-success">
                          <span>THU NHẬP RÒNG THẶNG DƯ:</span>
                          <span>{formatCurrencyVN(thuNhapRong)}/tháng</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="2">
                        <strong>Tài liệu chứng minh:</strong> {appraisal.chungMinhThuNhap || 'Hóa đơn bán hàng, sổ theo dõi doanh thu và sao kê tài khoản.'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 3: TSBĐ */}
              <div className="mb-4">
                <div className="fw-bold text-uppercase text-primary border-bottom pb-1 mb-2" style={{ fontSize: '14px' }}>
                  III. TÀI SẢN BẢO ĐẢM & ĐỊNH GIÁ
                </div>
                <table className="table table-sm table-bordered align-middle mb-2" style={{ fontSize: '13px' }}>
                  <tbody>
                    <tr>
                      <td className="bg-light fw-bold" style={{ width: '25%' }}>Loại TSBĐ / Hình thức:</td>
                      <td colSpan="3">{appraisal.loaiTSBD || 'QSDĐ ở nông thôn & Nhà ở'} ({appraisal.hinhThucBaoDam || 'Thế chấp'})</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Số GCN (Sổ đỏ):</td>
                      <td><strong>{appraisal.soGCN || '---'}</strong></td>
                      <td className="bg-light fw-bold">Thửa đất / Tờ BĐ:</td>
                      <td>Thửa số {appraisal.thuaDatSo || '---'}, Tờ bản đồ {appraisal.toBanDoSo || '---'}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Chủ sở hữu tài sản:</td>
                      <td>{appraisal.chuSoHuuTSBD || appraisal.hoTen}</td>
                      <td className="bg-light fw-bold">Nguồn gốc TS:</td>
                      <td>{appraisal.nguonGocTSBD || 'Nhận chuyển nhượng'}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Địa chỉ tài sản:</td>
                      <td colSpan="3">{appraisal.diaChiTSBD || appraisal.diaChi}</td>
                    </tr>
                  </tbody>
                </table>

                {chiTietDat.length > 0 && (
                  <table className="table table-sm table-bordered align-middle mb-2" style={{ fontSize: '13px' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Loại Đất</th>
                        <th className="text-end">Diện Tích (m²)</th>
                        <th className="text-end">Đơn Giá (VNĐ/m²)</th>
                        <th className="text-end">Thành Tiền (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chiTietDat.map((d, i) => (
                        <tr key={i}>
                          <td>{d.loaiDat}</td>
                          <td className="text-end">{d.dienTich}</td>
                          <td className="text-end">{formatCurrencyVN(d.donGia)}</td>
                          <td className="text-end fw-bold">{formatCurrencyVN(d.thanhTien)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="3" className="fw-bold">Giá trị công trình xây dựng / Nhà ở trên đất:</td>
                        <td className="text-end fw-bold">{formatCurrencyVN(appraisal.giaTriCongTrinh || 0)}</td>
                      </tr>
                      <tr className="table-light fw-bold">
                        <td colSpan="3" className="text-uppercase text-primary">TỔNG GIÁ TRỊ ĐỊNH GIÁ QTDND (VNĐ):</td>
                        <td className="text-end text-success fs-6">{formatCurrencyVN(giaTriTSBD)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              {/* Section 4: Đề xuất cấp tín dụng */}
              <div className="mb-4">
                <div className="fw-bold text-uppercase text-primary border-bottom pb-1 mb-2" style={{ fontSize: '14px' }}>
                  IV. ĐỀ XUẤT CẤP TÍN DỤNG & CÁC CHỈ SỐ AN TOÀN
                </div>
                <table className="table table-sm table-bordered align-middle mb-2" style={{ fontSize: '13px' }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '25%' }}>Nội Dung Đề Xuất</th>
                      <th style={{ width: '25%' }}>Thông Số Khoản Vay</th>
                      <th style={{ width: '25%' }}>Chỉ Số Tài Chính</th>
                      <th style={{ width: '25%' }}>Đánh Giá An Toàn</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="fw-bold">Số tiền cho vay:</td>
                      <td className="fw-bold text-danger">{formatCurrencyVN(duyetVay)}</td>
                      <td className="fw-bold">Tỷ lệ LTV (Vay/TSBĐ):</td>
                      <td><strong>{tyLeLTV}%</strong> (Chuẩn ≤ 70%)</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Thời hạn vay:</td>
                      <td>{thoiHan} tháng</td>
                      <td className="fw-bold">Tỷ lệ DTI (Nợ/Thu nhập):</td>
                      <td><strong>{tyLeDSR}%</strong> (Chuẩn ≤ 60%)</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Lãi suất cho vay:</td>
                      <td>{laiSuat}% / năm</td>
                      <td className="fw-bold">Nghĩa vụ tháng cao nhất:</td>
                      <td>{formatCurrencyVN(emi)}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Phương thức trả gốc:</td>
                      <td>{appraisal.phuongThucTraGoc === 'HANG_QUY' ? 'Gốc trả đều hàng quý' : appraisal.phuongThucTraGoc === 'CUOI_KY' ? 'Gốc trả cuối kỳ khi đáo hạn' : 'Gốc đều hàng tháng'}</td>
                      <td className="fw-bold">Phương thức trả lãi:</td>
                      <td>Hàng tháng theo dư nợ thực tế</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Mục đích vay:</td>
                      <td colSpan="3">{appraisal.mucDichVay}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Phương án tối ưu:</td>
                      <td colSpan="3"><i>{appraisal.phuongAnToiUu || 'Dòng tiền thặng dư của khách hàng đảm bảo thực hiện tốt nghĩa vụ trả nợ gốc và lãi đúng hạn.'}</i></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 5: Kết luận & Ký tên */}
              <div className="mb-4">
                <div className="fw-bold text-uppercase text-primary border-bottom pb-1 mb-2" style={{ fontSize: '14px' }}>
                  V. KẾT LUẬN & PHÊ DUYỆT CÁC CẤP
                </div>
                <p className="mb-1"><strong>1. Đề xuất của CBTD:</strong> {appraisal.ketLuan} - Mức độ rủi ro: {appraisal.mucDoRuiRo || 'Thấp'}.</p>
                <p className="mb-3"><strong>2. Điều kiện giải ngân:</strong> {appraisal.dieuKienGiaiNgan || 'Hoàn tất thủ tục công chứng HĐTC và đăng ký giao dịch bảo đảm đầy đủ.'}</p>

                {/* Chữ ký 4 cấp */}
                <div className="row g-2 text-center mt-4 pt-2">
                  <div className="col-3">
                    <div className="fw-bold" style={{ fontSize: '13px' }}>CÁN BỘ THẨM ĐỊNH</div>
                    <div className="fst-italic text-muted small" style={{ fontSize: '11px' }}>(Ký, ghi rõ họ tên)</div>
                    <div style={{ height: '70px' }}></div>
                    <div className="fw-bold">{appraisal.canBoThamDinh || 'Lê Văn Tín (CBTD)'}</div>
                  </div>

                  <div className="col-3">
                    <div className="fw-bold" style={{ fontSize: '13px' }}>TRƯỞNG PHÒNG TD</div>
                    <div className="fst-italic text-muted small" style={{ fontSize: '11px' }}>(Ký, ghi rõ họ tên)</div>
                    <div style={{ height: '70px' }}></div>
                    <div className="fw-bold">Trần Văn Trưởng</div>
                  </div>

                  <div className="col-3">
                    <div className="fw-bold" style={{ fontSize: '13px' }}>BAN KIỂM SOÁT</div>
                    <div className="fst-italic text-muted small" style={{ fontSize: '11px' }}>(Ký, ghi rõ họ tên)</div>
                    <div style={{ height: '70px' }}></div>
                    <div className="fw-bold">Ban Kiểm Soát</div>
                  </div>

                  <div className="col-3">
                    <div className="fw-bold" style={{ fontSize: '13px' }}>GIÁM ĐỐC / HĐTD</div>
                    <div className="fst-italic text-muted small" style={{ fontSize: '11px' }}>(Ký, đóng dấu)</div>
                    <div style={{ height: '70px' }}></div>
                    <div className="fw-bold">Phạm Giám Đốc</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
