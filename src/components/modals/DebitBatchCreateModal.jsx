import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  ArrowLeft,
  Search,
  Calendar,
  Info,
  Layers,
  FileSpreadsheet,
  Printer,
  Download,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  UserCheck
} from 'lucide-react';
import ThousandInput from '../ThousandInput';
import { formatCurrencyVN, formatDateVN, getTodayVN } from '../../utils/dateUtils';
import {
  calculateContractActualInterest,
  getDebitCyclePeriodFlexible,
  isContractInDebitCycle
} from '../../utils/interestUtils';

export default function DebitBatchCreateModal({
  show,
  onClose,
  onSubmit,
  registrations = [],
  contracts = [],
  debtWarnings = [],
  debitConfigs = []
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    thangNam: new Date().toISOString().slice(0, 7).replace('-', ''),
    configId: ''
  });

  const [eligibleList, setEligibleList] = useState([]);
  const [selectedKHMaps, setSelectedKHMaps] = useState({});
  const [selectedContractsMap, setSelectedContractsMap] = useState({}); // { [maKH]: { [soHDTD]: boolean } }
  const [adjustedAmounts, setAdjustedAmounts] = useState({});
  const [selectAll, setSelectAll] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedKH, setExpandedKH] = useState(null);
  const [cycleInfo, setCycleInfo] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(null);

  // Danh sách các đợt cấu hình (kèm fallback 3 đợt mặc định nếu backend chưa có)
  const availableConfigs = useMemo(() => {
    if (debitConfigs && debitConfigs.length > 0) {
      return debitConfigs.filter(c => c.trangThai === 'ACTIVE' || !c.trangThai);
    }
    return [
      {
        maDotConfig: 'DOT_1',
        tenDot: 'Đợt 1 (Ngày vay 26 → 04) - Trích ngày 05 hàng tháng',
        tuNgayVay: 26,
        denNgayVay: 4,
        ngayTrichHangThang: 5,
        trangThai: 'ACTIVE',
        ghiChu: 'Áp dụng cho HĐTD giải ngân từ ngày 26 tháng trước đến ngày 04 tháng này'
      },
      {
        maDotConfig: 'DOT_2',
        tenDot: 'Đợt 2 (Ngày vay 05 → 15) - Trích ngày 15 hàng tháng',
        tuNgayVay: 5,
        denNgayVay: 15,
        ngayTrichHangThang: 15,
        trangThai: 'ACTIVE',
        ghiChu: 'Áp dụng cho HĐTD giải ngân từ ngày 05 đến ngày 15 trong tháng'
      },
      {
        maDotConfig: 'DOT_3',
        tenDot: 'Đợt 3 (Ngày vay 16 → 25) - Trích ngày 25 hàng tháng',
        tuNgayVay: 16,
        denNgayVay: 25,
        ngayTrichHangThang: 25,
        trangThai: 'ACTIVE',
        ghiChu: 'Áp dụng cho HĐTD giải ngân từ ngày 16 đến ngày 25 trong tháng'
      }
    ];
  }, [debitConfigs]);

  // Set default config khi mở modal
  useEffect(() => {
    if (show) {
      setStep(1);
      const now = new Date();
      const currentThangNam = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const defaultCfg = availableConfigs[0];
      setFormData({
        thangNam: currentThangNam,
        configId: defaultCfg ? defaultCfg.maDotConfig : 'DOT_2'
      });
      setSelectedConfig(defaultCfg || null);
    }
  }, [show, availableConfigs]);

  const handleNextToStep2 = (e) => {
    e.preventDefault();
    const cfg = availableConfigs.find(c => c.maDotConfig === formData.configId) || availableConfigs[0];
    setSelectedConfig(cfg);

    const ngayTrich = Number(cfg.ngayTrichHangThang) || 15;
    const cycle = getDebitCyclePeriodFlexible(formData.thangNam, ngayTrich);
    setCycleInfo(cycle);

    // 1. Lọc khách hàng có đăng ký trích nợ đang hiệu lực
    const activeRegs = registrations.filter(
      (r) => r.trangThai === 'Hiệu lực' || r.trangThai === 'Hieu luc' || r.trangThai === 'ACTIVE' || !r.trangThai
    );

    const list = [];
    const initSelectedKH = {};
    const initSelectedContracts = {};
    const initAmounts = {};

    activeRegs.forEach((reg) => {
      // Tìm tất cả HĐTD của KH có dư nợ > 0
      const custAllContracts = contracts.filter((c) => c.maKH === reg.maKH && (Number(c.duNo) > 0 || Number(c.soTien) > 0));
      if (custAllContracts.length === 0) return;

      // Lọc các HĐTD có ngày vay thuộc khoảng cấu hình của đợt này
      const matchingContracts = custAllContracts.filter((c) =>
        isContractInDebitCycle(c, cfg.tuNgayVay, cfg.denNgayVay)
      );

      // Nếu không có HĐ nào trong đợt này, bỏ qua (đúng quy tắc nghiệp vụ tách đợt)
      if (matchingContracts.length === 0) return;

      // Tính lãi chi tiết từng hợp đồng
      const contractsDetail = matchingContracts.map((c) => {
        const calc = calculateContractActualInterest(c, cycle.toDate, cycle.fromDate);
        return {
          ...c,
          soHDTD: c.soHDTD || c.soKheUoc || 'HD-TIN-DUNG',
          duNo: calc.duNo,
          laiSuat: calc.laiSuat,
          tuNgayStr: calc.tuNgayStr,
          denNgayStr: calc.denNgayStr,
          actualDays: calc.actualDays,
          interestAmount: calc.interestAmount,
          gocDenHan: 0 // Có thể mở rộng kiểm tra denHan nếu cần
        };
      });

      const tongDuNo = contractsDetail.reduce((sum, c) => sum + c.duNo, 0);
      const laiPhatSinh = contractsDetail.reduce((sum, c) => sum + c.interestAmount, 0);

      // Nợ tồn đọng từ các đợt trước
      const custWarnings = debtWarnings.filter((w) => w.maKH === reg.maKH);
      const noTon = custWarnings.reduce((sum, w) => sum + (Number(w.tongNoTon) || 0), 0);
      const gocDenHan = 0;
      const tongDuKien = laiPhatSinh + gocDenHan + noTon;

      const item = {
        maKH: reg.maKH,
        hoTen: reg.hoTen,
        cccd: reg.cccd || reg.gttt || '',
        dienThoai: reg.dienThoai || '',
        soTK: reg.soTK,
        diaChi: reg.diaChi || '',
        soHDTD: contractsDetail.map((c) => c.soHDTD).join(', '),
        tongDuNo,
        laiPhatSinh,
        gocDenHan,
        noTon,
        tongDuKien,
        soNgayTinhLai: cycle.standardDays,
        cyclePeriodStr: `${cycle.fromDateStr} → ${cycle.toDateStr}`,
        contractsDetail
      };

      list.push(item);
      initSelectedKH[reg.maKH] = true;
      initAmounts[reg.maKH] = tongDuKien;

      // Mặc định chọn tất cả hợp đồng con
      const cMap = {};
      contractsDetail.forEach((cd) => {
        cMap[cd.soHDTD] = true;
      });
      initSelectedContracts[reg.maKH] = cMap;
    });

    setEligibleList(list);
    setSelectedKHMaps(initSelectedKH);
    setSelectedContractsMap(initSelectedContracts);
    setAdjustedAmounts(initAmounts);
    setSelectAll(true);
    setSearchTerm('');
    setStep(2);
  };

  // Toggle chọn tất cả khách hàng
  const handleToggleSelectAll = (checked) => {
    setSelectAll(checked);
    const updated = {};
    eligibleList.forEach((item) => {
      updated[item.maKH] = checked;
    });
    setSelectedKHMaps(updated);
  };

  // Toggle chọn 1 khách hàng
  const handleToggleSingleKH = (maKH, checked) => {
    const updated = { ...selectedKHMaps, [maKH]: checked };
    setSelectedKHMaps(updated);
    const allChecked = eligibleList.every((item) => updated[item.maKH]);
    setSelectAll(allChecked);
  };

  // Toggle chọn 1 Hợp đồng con trong khách hàng
  const handleToggleContract = (maKH, soHDTD, checked) => {
    const custContracts = selectedContractsMap[maKH] || {};
    const updatedCustContracts = { ...custContracts, [soHDTD]: checked };
    const updatedContractsMap = { ...selectedContractsMap, [maKH]: updatedCustContracts };
    setSelectedContractsMap(updatedContractsMap);

    // Tự động tính toán lại số tiền trích cho khách hàng này dựa trên các HĐ con được chọn
    const item = eligibleList.find(i => i.maKH === maKH);
    if (item && item.contractsDetail) {
      let newLai = 0;
      let anyChecked = false;
      item.contractsDetail.forEach(c => {
        if (updatedCustContracts[c.soHDTD]) {
          newLai += c.interestAmount;
          anyChecked = true;
        }
      });

      const newTong = anyChecked ? (newLai + item.noTon + item.gocDenHan) : 0;
      setAdjustedAmounts(prev => ({ ...prev, [maKH]: newTong }));

      // Nếu không còn HĐ nào được tick, tự bỏ tick KH
      if (!anyChecked) {
        handleToggleSingleKH(maKH, false);
      } else if (!selectedKHMaps[maKH]) {
        handleToggleSingleKH(maKH, true);
      }
    }
  };

  // Sửa số tiền trích trực tiếp của khách hàng
  const handleAmountChange = (maKH, newAmount) => {
    setAdjustedAmounts((prev) => ({
      ...prev,
      [maKH]: Number(newAmount) || 0
    }));
  };

  // Tìm kiếm trong bảng duyệt
  const filteredList = useMemo(() => {
    if (!searchTerm) return eligibleList;
    const term = searchTerm.toLowerCase();
    return eligibleList.filter((item) =>
      item.hoTen?.toLowerCase().includes(term) ||
      item.maKH?.toLowerCase().includes(term) ||
      item.cccd?.includes(term) ||
      item.soTK?.includes(term) ||
      item.soHDTD?.toLowerCase().includes(term)
    );
  }, [eligibleList, searchTerm]);

  const selectedCount = eligibleList.filter((item) => selectedKHMaps[item.maKH]).length;
  const totalSelectedAmount = eligibleList.reduce((sum, item) => {
    if (selectedKHMaps[item.maKH]) {
      return sum + (adjustedAmounts[item.maKH] !== undefined ? adjustedAmounts[item.maKH] : item.tongDuKien);
    }
    return sum;
  }, 0);

  // 1. XUẤT EXCEL / CSV LỆNH GỬI NGÂN HÀNG
  const handleExportBankExcel = () => {
    const selectedItems = eligibleList.filter((item) => selectedKHMaps[item.maKH]);
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 khách hàng để xuất file gửi ngân hàng!');
      return;
    }

    const headers = ['STT', 'Số Tài Khoản CASA', 'Tên Chủ Tài Khoản', 'Số CCCD/GTTT', 'Số Tiền Trích Nợ (VNĐ)', 'Nội Dung Trích Nợ', 'Mã Khách Hàng'];
    const rows = selectedItems.map((item, idx) => {
      const tien = adjustedAmounts[item.maKH] !== undefined ? adjustedAmounts[item.maKH] : item.tongDuKien;
      const noiDung = `TRICH NO LAI VAY THANG ${formData.thangNam} ${selectedConfig?.tenDot || ''}`;
      return [
        idx + 1,
        `"\t${item.soTK || ''}"`,
        `"${item.hoTen || ''}"`,
        `"\t${item.cccd || ''}"`,
        tien,
        `"${noiDung}"`,
        `"${item.maKH || ''}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DANH_SACH_TRICH_NO_CASA_${formData.thangNam}_${selectedConfig?.maDotConfig || 'DOT'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 2. XUẤT WORD BẢNG KÊ A4 CHUẨN KẾ TOÁN QUỸ
  const handleExportWord = () => {
    const selectedItems = eligibleList.filter((item) => selectedKHMaps[item.maKH]);
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 khách hàng để in bảng kê!');
      return;
    }

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Bảng Kê Trích Nợ Tự Động - ${formData.thangNam}</title>
        <style>
          @page Section1 { size: 595.3pt 841.9pt; margin: 1.8cm 1.5cm 1.8cm 1.5cm; }
          div.Section1 { page: Section1; }
          body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.35; color: #000; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .title { text-align: center; font-size: 14pt; font-weight: bold; margin: 10px 0 3px; text-transform: uppercase; }
          .subtitle { text-align: center; font-size: 11pt; font-style: italic; margin-bottom: 15px; }
          .data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .data-table th, .data-table td { border: 1px solid #000; padding: 5px 6px; font-size: 10pt; }
          .data-table th { background-color: #f2f2f2; text-align: center; font-weight: bold; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .fw-bold { font-weight: bold; }
          .sign-table { width: 100%; margin-top: 30px; border-collapse: collapse; }
          .sign-table td { text-align: center; vertical-align: top; width: 33.33%; font-size: 11pt; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <table class="header-table">
            <tr>
              <td style="width: 55%; text-align: center; vertical-align: top;">
                <div style="font-weight: bold; font-size: 10.5pt;">QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</div>
                <div style="font-size: 10pt;">Bộ phận: Tín dụng & Kế toán CASA</div>
                <div style="font-size: 9.5pt; font-style: italic;">Địa chỉ: Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hoá</div>
              </td>
              <td style="text-align: center; vertical-align: top;">
                <div style="font-weight: bold; font-size: 10.5pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style="font-size: 10pt; font-weight: bold;">Độc lập - Tự do - Hạnh phúc</div>
                <div style="font-size: 10pt; font-style: italic; margin-top: 4px;">Quý Lộc, ngày ${getTodayVN()}</div>
              </td>
            </tr>
          </table>

          <div class="title">BẢNG KÊ LẬP ĐỢT TRÍCH NỢ TỰ ĐỘNG QUA TÀI KHOẢN THANH TOÁN CASA</div>
          <div class="subtitle">
            ${selectedConfig?.tenDot || ''} - Tháng: ${formData.thangNam} (Chu kỳ tính lãi: ${cycleInfo?.fromDateStr} đến ${cycleInfo?.toDateStr})
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30px;">STT</th>
                <th>Mã KH</th>
                <th>Họ và Tên Khách Hàng</th>
                <th>Số CCCD/GTTT</th>
                <th>Số TK CASA</th>
                <th>Số HĐTD Vay</th>
                <th>Dư Nợ Gốc (VNĐ)</th>
                <th>Lãi Phát Sinh (VNĐ)</th>
                <th>Nợ Tồn (VNĐ)</th>
                <th>Số Tiền Trích (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              ${selectedItems.map((i, idx) => {
                const tien = adjustedAmounts[i.maKH] !== undefined ? adjustedAmounts[i.maKH] : i.tongDuKien;
                return `
                  <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td class="text-center">${i.maKH}</td>
                    <td><b>${i.hoTen}</b></td>
                    <td class="text-center">${i.cccd || ''}</td>
                    <td class="text-center font-monospace">${i.soTK}</td>
                    <td class="text-center">${i.soHDTD}</td>
                    <td class="text-right">${formatCurrencyVN(i.tongDuNo)}</td>
                    <td class="text-right">${formatCurrencyVN(i.laiPhatSinh)}</td>
                    <td class="text-right">${formatCurrencyVN(i.noTon)}</td>
                    <td class="text-right fw-bold">${formatCurrencyVN(tien)}</td>
                  </tr>
                `;
              }).join('')}
              <tr style="font-weight: bold; background-color: #f9f9f9;">
                <td colspan="6" class="text-center">TỔNG CỘNG (${selectedItems.length} KHÁCH HÀNG)</td>
                <td class="text-right">${formatCurrencyVN(selectedItems.reduce((s, i) => s + i.tongDuNo, 0))}</td>
                <td class="text-right">${formatCurrencyVN(selectedItems.reduce((s, i) => s + i.laiPhatSinh, 0))}</td>
                <td class="text-right">${formatCurrencyVN(selectedItems.reduce((s, i) => s + i.noTon, 0))}</td>
                <td class="text-right" style="color: #b91c1c;">${formatCurrencyVN(totalSelectedAmount)}</td>
              </tr>
            </tbody>
          </table>

          <table class="sign-table">
            <tr>
              <td>
                <b>NGƯỜI LẬP BẢNG</b><br>
                <i style="font-size: 9.5pt;">(Ký, ghi rõ họ tên)</i><br><br><br><br>
                <b>Cán bộ Tín dụng</b>
              </td>
              <td>
                <b>KẾ TOÁN KIỂM SOÁT</b><br>
                <i style="font-size: 9.5pt;">(Ký, ghi rõ họ tên)</i><br><br><br><br>
                <b>Kế toán CASA</b>
              </td>
              <td>
                <b>GIÁM ĐỐC QUỸ</b><br>
                <i style="font-size: 9.5pt;">(Ký, đóng dấu)</i><br><br><br><br>
                <b>Chủ tịch HĐQT / Giám đốc</b>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + htmlContent], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BANG_KE_TRICH_NO_A4_${formData.thangNam}_${selectedConfig?.maDotConfig || 'DOT'}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Xác nhận khởi tạo đợt trích nợ
  const handleFinalSubmit = () => {
    const finalItems = eligibleList
      .filter((item) => selectedKHMaps[item.maKH])
      .map((item) => {
        // Lấy danh sách hợp đồng được chọn của KH
        const custCMap = selectedContractsMap[item.maKH] || {};
        const chosenContracts = (item.contractsDetail || []).filter(c => custCMap[c.soHDTD] !== false);
        return {
          ...item,
          soTienTrich: adjustedAmounts[item.maKH] !== undefined ? adjustedAmounts[item.maKH] : item.tongDuKien,
          contractsDetail: chosenContracts,
          soHDTD: chosenContracts.map(c => c.soHDTD).join(', ')
        };
      });

    if (finalItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 khách hàng để khởi tạo đợt trích nợ.');
      return;
    }

    onSubmit({
      thangNam: formData.thangNam,
      kyTrich: selectedConfig?.ngayTrichHangThang === 5 ? 1 : (selectedConfig?.ngayTrichHangThang === 15 ? 2 : 3),
      maDotConfig: selectedConfig?.maDotConfig,
      tenDot: selectedConfig?.tenDot,
      chiTietDanhSach: finalItems,
      totalPhaiThu: totalSelectedAmount,
      cyclePeriod: cycleInfo
    });
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className={`modal-dialog ${step === 2 ? 'modal-xl' : 'modal-lg'} modal-dialog-centered modal-dialog-scrollable`}>
        <div className="modal-content card-modern p-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold text-dark font-heading d-flex align-items-center gap-2">
              <Zap size={22} className="text-warning" />
              {step === 1 ? 'Bước 1: Chọn Đợt & Tháng Trích Nợ Định Kỳ' : 'Bước 2: Lọc Khách Hàng, Tính Lãi Ngày Thực Tế & Chốt Đợt Trích Nợ'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          {step === 1 ? (
            <form onSubmit={handleNextToStep2}>
              <div className="modal-body py-3">
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-dark">Tháng / Năm Trích Nợ (yyyyMM) <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace fw-bold"
                      placeholder="202609"
                      value={formData.thangNam}
                      onChange={(e) => setFormData({ ...formData, thangNam: e.target.value })}
                      required
                    />
                    <div className="d-flex gap-2 mt-1">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-xs py-0 px-1.5"
                        style={{ fontSize: '0.72rem' }}
                        onClick={() => {
                          const now = new Date();
                          setFormData({ ...formData, thangNam: `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}` });
                        }}
                      >
                        Tháng này
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-xs py-0 px-1.5"
                        style={{ fontSize: '0.72rem' }}
                        onClick={() => {
                          const now = new Date();
                          now.setMonth(now.getMonth() - 1);
                          setFormData({ ...formData, thangNam: `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}` });
                        }}
                      >
                        Tháng trước
                      </button>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-dark">Chọn Đợt Trích Nợ Định Kỳ <span className="text-danger">*</span></label>
                    <select
                      className="form-select form-select-sm fw-bold"
                      value={formData.configId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, configId: val });
                        const cfg = availableConfigs.find(c => c.maDotConfig === val);
                        setSelectedConfig(cfg || null);
                      }}
                    >
                      {availableConfigs.map((cfg) => (
                        <option key={cfg.maDotConfig} value={cfg.maDotConfig}>
                          {cfg.tenDot}
                        </option>
                      ))}
                    </select>
                    <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                      Cấu hình theo khoảng ngày giải ngân trong tháng
                    </span>
                  </div>
                </div>

                {/* Khối tóm tắt quy tắc lọc & tính lãi */}
                {selectedConfig && (
                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <div className="fw-bold text-primary mb-2 d-flex align-items-center gap-1.5">
                      <Calendar size={16} /> Chi Tiết Cấu Hình Đợt Được Chọn:
                    </div>
                    <div className="row g-2 small text-dark">
                      <div className="col-12 col-sm-4">
                        <span className="text-muted">Khoảng ngày vay:</span>{' '}
                        <strong className="text-primary font-monospace">
                          Ngày {selectedConfig.tuNgayVay} → Ngày {selectedConfig.denNgayVay}
                        </strong>
                      </div>
                      <div className="col-12 col-sm-4">
                        <span className="text-muted">Ngày trích CASA:</span>{' '}
                        <strong className="text-danger font-monospace">Ngày {selectedConfig.ngayTrichHangThang} hàng tháng</strong>
                      </div>
                      <div className="col-12 col-sm-4">
                        <span className="text-muted">Khách hàng áp dụng:</span>{' '}
                        <strong className="text-success font-monospace">
                          {registrations.filter(r => r.trangThai === 'Hiệu lực' || r.trangThai === 'Hieu luc' || !r.trangThai).length} KH đã đăng ký
                        </strong>
                      </div>
                      {selectedConfig.ghiChu && (
                        <div className="col-12 text-muted fst-italic">
                          * {selectedConfig.ghiChu}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-primary-subtle rounded-3 border border-primary-subtle small text-slate-800">
                  <div className="fw-bold text-primary mb-1 d-flex align-items-center gap-1">
                    <Info size={16} /> Quy Trình Tự Động Lọc & Tính Lãi:
                  </div>
                  <ul className="m-0 ps-3">
                    <li>Hệ thống quét toàn bộ Khách hàng đã ký Thỏa thuận trích nợ tự động còn hiệu lực.</li>
                    <li>Tự động đối chiếu với <strong>HDTD_CORE</strong> để lấy các Hợp đồng đang có dư nợ <code>DuNo &gt; 0</code> và có ngày vay <code>day(NgayVay)</code> thuộc đợt này.</li>
                    <li>Tính lãi ngày thực tế theo <strong>Thông tư 14/2017/TT-NHNN</strong> ("tính ngày đầu, bỏ ngày cuối", mẫu số 365 ngày).</li>
                    <li>Cộng dồn nợ tồn đọng kỳ trước (nếu có) và cho phép cán bộ kiểm tra, điều chỉnh số tiền trước khi chốt đợt.</li>
                  </ul>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-light" onClick={onClose}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-brand fw-bold d-flex align-items-center gap-1">
                  Tiếp Tục: Quét & Lọc Hợp Đồng Vay <ChevronRight size={16} />
                </button>
              </div>
            </form>
          ) : (
            <div className="modal-body py-2">
              {/* Header summary & Search bar */}
              <div className="d-flex justify-content-between align-items-center mb-2 p-3 bg-light rounded-3 border flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="badge bg-primary">
                    {selectedConfig?.tenDot || 'Đợt Trích Nợ'} • Tháng {formData.thangNam}
                  </span>
                  {cycleInfo && (
                    <span className="badge bg-info text-dark d-flex align-items-center gap-1">
                      <Calendar size={12} /> Chu kỳ: {cycleInfo.fromDateStr} → {cycleInfo.toDateStr} ({cycleInfo.standardDays} ngày)
                    </span>
                  )}
                  <span className="text-dark small fw-semibold">
                    Đã chọn: <strong className="text-primary">{selectedCount}</strong> / {eligibleList.length} khách hàng
                  </span>
                </div>
                <div className="fs-6 fw-bold text-dark">
                  Tổng Tiền Trích: <span className="text-danger num-tabular">{formatCurrencyVN(totalSelectedAmount)}</span>
                </div>
              </div>

              {/* Toolbar Tìm kiếm & Xuất file nhanh */}
              <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <div className="position-relative flex-grow-1" style={{ maxWidth: 450 }}>
                  <Search size={16} className="position-absolute text-muted" style={{ top: 9, left: 12 }} />
                  <input
                    type="text"
                    className="form-control form-control-sm ps-5"
                    placeholder="Tìm theo Tên KH, CCCD, Mã KH hoặc Số TK CASA..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                    onClick={handleExportBankExcel}
                    title="Xuất file danh sách lệnh trích nợ gửi Ngân hàng"
                  >
                    <FileSpreadsheet size={14} /> Xuất File Ngân Hàng
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                    onClick={handleExportWord}
                    title="Xuất bảng kê Word A4 có chữ ký kiểm soát"
                  >
                    <Printer size={14} /> Xuất Bảng Kê A4 (.doc)
                  </button>
                </div>
              </div>

              {/* Bảng danh sách gom theo Khách Hàng */}
              <div className="table-responsive border rounded-3 bg-white mb-3" style={{ maxHeight: 420, overflowY: 'auto' }}>
                <table className="table table-custom align-middle m-0 small">
                  <thead className="bg-light sticky-top" style={{ zIndex: 2 }}>
                    <tr>
                      <th style={{ width: 38 }} className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectAll}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          title="Chọn tất cả / Bỏ chọn tất cả"
                        />
                      </th>
                      <th>Khách Hàng (Ủy Quyền CASA)</th>
                      <th>Số TK CASA</th>
                      <th>Khế Ước / HĐTD</th>
                      <th className="text-end">Tổng Dư Nợ</th>
                      <th className="text-end">Lãi Phát Sinh</th>
                      <th className="text-end">Nợ Tồn</th>
                      <th className="text-end" style={{ minWidth: 160 }}>
                        Số Tiền Trích (VNĐ)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.length > 0 ? (
                      filteredList.map((item) => {
                        const isChecked = Boolean(selectedKHMaps[item.maKH]);
                        const currentAmount = adjustedAmounts[item.maKH] !== undefined ? adjustedAmounts[item.maKH] : item.tongDuKien;
                        const isExpanded = expandedKH === item.maKH;
                        const custContracts = selectedContractsMap[item.maKH] || {};
                        const chosenContractsCount = (item.contractsDetail || []).filter(c => custContracts[c.soHDTD] !== false).length;

                        return (
                          <React.Fragment key={item.maKH}>
                            <tr className={isChecked ? '' : 'table-light text-muted'}>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isChecked}
                                  onChange={(e) => handleToggleSingleKH(item.maKH, e.target.checked)}
                                />
                              </td>
                              <td>
                                <div className="fw-bold text-dark">{item.hoTen}</div>
                                <div className="d-flex align-items-center gap-1.5">
                                  <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '0.68rem' }}>
                                    {item.maKH}
                                  </span>
                                  {item.cccd && (
                                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                                      CCCD: {item.cccd}
                                    </span>
                                  )}
                                  {item.contractsDetail && item.contractsDetail.length > 0 && (
                                    <button
                                      type="button"
                                      className="btn btn-link p-0 text-primary small d-flex align-items-center"
                                      style={{ fontSize: '0.72rem', textDecoration: 'none' }}
                                      onClick={() => setExpandedKH(isExpanded ? null : item.maKH)}
                                    >
                                      ({chosenContractsCount}/{item.contractsDetail.length} HĐ)
                                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="font-monospace fw-semibold text-success">{item.soTK}</td>
                              <td className="font-monospace text-primary">{item.soHDTD}</td>
                              <td className="text-end num-tabular fw-semibold">{formatCurrencyVN(item.tongDuNo)}</td>
                              <td className="text-end text-danger num-tabular fw-bold">
                                {formatCurrencyVN(item.laiPhatSinh)}
                              </td>
                              <td className="text-end text-warning num-tabular">{formatCurrencyVN(item.noTon)}</td>
                              <td className="text-end">
                                <div style={{ maxWidth: 150 }} className="ms-auto">
                                  <ThousandInput
                                    value={currentAmount}
                                    onChange={(val) => handleAmountChange(item.maKH, val)}
                                    disabled={!isChecked}
                                    placeholder="0"
                                    className="form-control form-control-sm text-end fw-bold text-danger"
                                  />
                                </div>
                              </td>
                            </tr>

                            {/* Chi tiết từng Hợp đồng con khi mở rộng */}
                            {isExpanded && item.contractsDetail && (
                              <tr className="table-light">
                                <td colSpan="8" className="p-2 ps-4">
                                  <div className="bg-white p-3 rounded-3 border small shadow-xs">
                                    <div className="fw-bold text-slate-700 mb-2 d-flex align-items-center gap-1">
                                      <Layers size={14} className="text-primary" /> Chi tiết các hợp đồng tín dụng của khách hàng (Có thể tích/bỏ tích từng hợp đồng):
                                    </div>
                                    <div className="table-responsive">
                                      <table className="table table-sm table-bordered m-0 align-middle">
                                        <thead className="table-light">
                                          <tr>
                                            <th style={{ width: 30 }} className="text-center">Chọn</th>
                                            <th>Số HĐTD</th>
                                            <th>Ngày Vay</th>
                                            <th>Dư Nợ Gốc</th>
                                            <th>Lãi Suất</th>
                                            <th>Kỳ Tính Lãi</th>
                                            <th className="text-center">Số Ngày TT</th>
                                            <th className="text-end">Lãi Tính (VNĐ)</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {item.contractsDetail.map((cd, cIdx) => {
                                            const isContractChecked = custContracts[cd.soHDTD] !== false;
                                            return (
                                              <tr key={cIdx} className={isContractChecked ? '' : 'text-muted table-light'}>
                                                <td className="text-center">
                                                  <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={isContractChecked}
                                                    onChange={(e) => handleToggleContract(item.maKH, cd.soHDTD, e.target.checked)}
                                                  />
                                                </td>
                                                <td className="font-monospace fw-bold text-primary">{cd.soHDTD}</td>
                                                <td className="font-monospace">{cd.ngayVay || '---'}</td>
                                                <td className="num-tabular fw-semibold">{formatCurrencyVN(cd.duNo)}</td>
                                                <td className="font-monospace">{cd.laiSuat}%/năm</td>
                                                <td className="small text-muted">{cd.tuNgayStr} → {cd.denNgayStr}</td>
                                                <td className="text-center font-monospace">{cd.actualDays} ngày</td>
                                                <td className="text-end text-danger fw-bold num-tabular">
                                                  {formatCurrencyVN(cd.interestAmount)}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">
                          Không tìm thấy khách hàng nào có hợp đồng vay thỏa mãn đợt trích nợ này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Chân modal */}
              <div className="d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft size={14} /> Quay lại cấu hình
                </button>

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-light btn-sm" onClick={onClose}>
                    Đóng
                  </button>
                  <button
                    type="button"
                    className="btn btn-brand btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
                    onClick={handleFinalSubmit}
                    disabled={selectedCount === 0}
                  >
                    <CheckCircle2 size={16} /> Xác Nhận Khởi Tạo Đợt Trích Nợ ({selectedCount} KH)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
