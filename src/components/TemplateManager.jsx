import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Printer,
  FileCheck,
  CheckCircle2,
  Link2,
  FolderOpen,
  Eye,
  RefreshCw,
  Layers,
  Code,
  Download,
  User,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { formatDateVN, formatCurrencyVN, getTodayISO, getTodayVN } from '../utils/dateUtils';
import Pagination from './Pagination';

// DANH MỤC BIỂU MẪU MẶC ĐỊNH MỞ RỘNG
const INITIAL_TEMPLATES = [
  {
    id: 'BM_KIEM_TRA_VON',
    maBM: 'BM_KT_01',
    tenBM: 'Biên Bản Kiểm Tra Sử Dụng Vốn Sau Giải Ngân',
    phanHe: 'Kiểm Tra Vốn',
    loaiNguon: 'GOOGLE_DOCS',
    linkNguon: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    moTa: 'Mẫu biên bản thực địa kiểm tra phương án sản xuất kinh doanh của khách hàng định kỳ 30 ngày / 90 ngày.',
    truongTron: [
      '{{HoTen}}',
      '{{MaKH}}',
      '{{SoCCCD}}',
      '{{DiaChi}}',
      '{{SoHDTD}}',
      '{{TienVay}}',
      '{{NgayVay}}',
      '{{NgayKiemTra}}',
      '{{ThanhPhanDoan}}',
      '{{DiaDiemKT}}',
      '{{MucDichVay}}',
      '{{KetLuanKT}}',
      '{{NgayKTNext}}'
    ],
    trangThai: 'Đang áp dụng',
    ngayCapNhat: '19/08/2026'
  },
  {
    id: 'BM_THAM_DINH',
    maBM: 'BM_TD_02',
    tenBM: 'Báo Cáo Thẩm Định Điều Kiện Cấp Tín Dụng & TSĐB',
    phanHe: 'Thẩm Định',
    loaiNguon: 'GOOGLE_DOCS',
    linkNguon: 'https://docs.google.com/document/d/1uPsmMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    moTa: 'Tờ trình thẩm định phương án vay vốn, đánh giá xếp hạng CIC, tài sản thế chấp và tỷ lệ LTV.',
    truongTron: [
      '{{HoTen}}',
      '{{MaKH}}',
      '{{SoCCCD}}',
      '{{DiaChi}}',
      '{{DeXuatVay}}',
      '{{DuyetVay}}',
      '{{ThoiHanThang}}',
      '{{LaiSuatDuyet}}',
      '{{ThuNhapThang}}',
      '{{ChiPhiThang}}',
      '{{XepHangCIC}}',
      '{{LoaiTSBD}}',
      '{{GiaTriTSBD}}',
      '{{TyLeLTV}}',
      '{{CanBoThamDinh}}',
      '{{KetLuan}}'
    ],
    trangThai: 'Đang áp dụng',
    ngayCapNhat: '19/08/2026'
  },
  {
    id: 'BM_UY_QUYEN_DEBIT',
    maBM: 'BM_AD_03',
    tenBM: 'Thỏa Thuận Ủy Quyền Trích Nợ Tự Động Tài Khoản CASA',
    phanHe: 'Trích Nợ Tự Động',
    loaiNguon: 'GOOGLE_DOCS',
    linkNguon: 'https://docs.google.com/document/d/1wZkMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    moTa: 'Hợp đồng ủy quyền cho phép QTDND Yên Thọ tự động cắt nợ tiền gốc và lãi từ tài khoản thanh toán CASA.',
    truongTron: [
      '{{HoTen}}',
      '{{MaKH}}',
      '{{SoCCCD}}',
      '{{NgayCapCCCD}}',
      '{{DiaChi}}',
      '{{SoTKCASA}}',
      '{{KyTrichNo}}',
      '{{NgayTrichHangThang}}',
      '{{DieuKhoanUyQuyen}}',
      '{{NgayKy}}'
    ],
    trangThai: 'Đang áp dụng',
    ngayCapNhat: '19/08/2026'
  },
  {
    id: 'BM_LENH_TRICH_NO',
    maBM: 'BM_AD_04',
    tenBM: 'Bảng Tổng Hợp Lệnh Trích Nợ Định Kỳ (Xuất File Core)',
    phanHe: 'Trích Nợ Tự Động',
    loaiNguon: 'GOOGLE_SHEETS',
    linkNguon: 'https://docs.google.com/spreadsheets/d/1e9xMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    moTa: 'Mẫu kết xuất tệp lệnh trích nợ đồng loạt chuyển sang hệ thống máy chủ CoreBanking.',
    truongTron: [
      '{{MaDot}}',
      '{{KyTrich}}',
      '{{ThangNam}}',
      '{{TongSoKH}}',
      '{{TongTienPhaiThu}}',
      '{{TongDaTrich}}',
      '{{TongNoTon}}',
      '{{NgayLapBang}}'
    ],
    trangThai: 'Đang áp dụng',
    ngayCapNhat: '19/08/2026'
  },
  {
    id: 'BM_THONG_BAO_NO',
    maBM: 'BM_THN_05',
    tenBM: 'Thông Báo Đôn Đốc Thu Hồi Nợ Gốc & Lãi Đến Hạn',
    phanHe: 'Thu Hồi Nợ',
    loaiNguon: 'GOOGLE_DOCS',
    linkNguon: 'https://docs.google.com/document/d/1kLxMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    moTa: 'Thông báo gửi cho thành viên vay vốn trước ngày đến hạn trả nợ 5 ngày hoặc khi phát sinh nợ quá hạn.',
    truongTron: [
      '{{HoTen}}',
      '{{MaKH}}',
      '{{SoHDTD}}',
      '{{SoTienGocDenHan}}',
      '{{SoTienLaiDenHan}}',
      '{{SoTienNoTon}}',
      '{{TongPhaiNop}}',
      '{{HanChotNop}}',
      '{{SoTKCASA}}',
      '{{DienThoaiLienHe}}'
    ],
    trangThai: 'Đang áp dụng',
    ngayCapNhat: '19/08/2026'
  }
];

const AVAILABLE_TAGS_DICTIONARY = [
  { group: '1. Khách Hàng & Thành Viên', tags: ['{{HoTen}}', '{{MaKH}}', '{{SoCCCD}}', '{{NgayCapCCCD}}', '{{DiaChi}}', '{{DienThoai}}', '{{SoTV}}', '{{SoTKCASA}}'] },
  { group: '2. Hợp Đồng & Dư Nợ', tags: ['{{SoHDTD}}', '{{TienVay}}', '{{DuNo}}', '{{LaiSuat}}', '{{NgayVay}}', '{{DenHan}}', '{{MucDichVay}}'] },
  { group: '3. Thẩm Định & TSĐB', tags: ['{{DeXuatVay}}', '{{DuyetVay}}', '{{ThoiHanThang}}', '{{LaiSuatDuyet}}', '{{ThuNhapThang}}', '{{ChiPhiThang}}', '{{XepHangCIC}}', '{{LoaiTSBD}}', '{{GiaTriTSBD}}', '{{TyLeLTV}}', '{{CanBoThamDinh}}', '{{KetLuan}}'] },
  { group: '4. Kiểm Tra Vốn & Trích Nợ', tags: ['{{NgayKiemTra}}', '{{ThanhPhanDoan}}', '{{DiaDiemKT}}', '{{KetLuanKT}}', '{{NgayKTNext}}', '{{MaDot}}', '{{KyTrich}}', '{{ThangNam}}', '{{SoTienTrich}}'] }
];

export default function TemplateManager() {
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('creditcore_templates');
    return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
  });

  const [customersList, setCustomersList] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhanHe, setFilterPhanHe] = useState('ALL');
  const [filterTrangThai, setFilterTrangThai] = useState('ALL');

  // Phân trang
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showTagDictionary, setShowTagDictionary] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [copiedTag, setCopiedTag] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    maBM: '',
    tenBM: '',
    phanHe: 'Kiểm Tra Vốn',
    loaiNguon: 'GOOGLE_DOCS',
    linkNguon: '',
    moTa: '',
    truongTronStr: '',
    trangThai: 'Đang áp dụng'
  });

  // Mail Merge Test State
  const [sampleData, setSampleData] = useState({
    HoTen: 'NGUYỄN VĂN AN',
    MaKH: 'KH008892',
    SoCCCD: '038088001234',
    NgayCapCCCD: '12/05/2021',
    DiaChi: 'Thôn Tân Lộc, xã Quý Lộc, huyện Yên Định, tỉnh Thanh Hoá',
    DienThoai: '0912.345.678',
    SoTV: 'TV-008892',
    SoHDTD: 'KU-2026-0312',
    TienVay: '300.000.000 đ',
    DuNo: '285.000.000 đ',
    LaiSuat: '9.5%/năm',
    SoTKCASA: '0381000123456',
    NgayVay: '12/02/2026',
    DenHan: '12/02/2027',
    NgayKiemTra: '19/08/2026',
    ThanhPhanDoan: 'Lê Văn Tín (CBTD) & Ban Kiểm Soát',
    DiaDiemKT: 'Trang trại chăn nuôi xã Quý Lộc',
    MucDichVay: 'Đầu tư mở rộng chuồng trại chăn nuôi bò sữa',
    KetLuanKT: 'Sử dụng vốn đúng mục đích 100%, trang trại phát triển tốt',
    NgayKTNext: '19/11/2026',
    DeXuatVay: '300.000.000 đ',
    DuyetVay: '300.000.000 đ',
    ThoiHanThang: '12 tháng',
    LaiSuatDuyet: '9.5%/năm',
    ThuNhapThang: '45.000.000 đ',
    ChiPhiThang: '15.000.000 đ',
    XepHangCIC: 'Nhóm 1 (Tốt)',
    LoaiTSBD: 'Quyền sử dụng đất & nhà ở',
    GiaTriTSBD: '850.000.000 đ',
    TyLeLTV: '35.3%',
    CanBoThamDinh: 'Lê Văn Tín',
    KetLuan: 'Đủ điều kiện cấp tín dụng',
    KyTrichNo: 'Kỳ 1 (Ngày 05)',
    NgayTrichHangThang: 'Ngày 05 hàng tháng',
    DieuKhoanUyQuyen: 'Ủy quyền trích tự động toàn bộ gốc và lãi khi đến hạn',
    NgayKy: getTodayVN(),
    MaDot: 'DOT-202608-K1',
    KyTrich: '1',
    ThangNam: '202608',
    TongSoKH: '48',
    TongTienPhaiThu: '125.650.000 đ',
    TongDaTrich: '125.650.000 đ',
    TongNoTon: '0 đ',
    NgayLapBang: getTodayVN(),
    SoTienGocDenHan: '0 đ',
    SoTienLaiDenHan: '1.643.836 đ',
    SoTienNoTon: '0 đ',
    TongPhaiNop: '1.643.836 đ',
    HanChotNop: '05/08/2026',
    DienThoaiLienHe: '0237.3888.999'
  });

  useEffect(() => {
    const loadBackendTemplates = async () => {
      try {
        const [resTpl, resCust] = await Promise.all([
          api.getTemplates(),
          api.searchCustomer360('')
        ]);

        if (resTpl.status === 'success' && Array.isArray(resTpl.data) && resTpl.data.length > 0) {
          setTemplates(resTpl.data);
          localStorage.setItem('creditcore_templates', JSON.stringify(resTpl.data));
        }

        if (resCust.status === 'success' && resCust.data) {
          const list = resCust.data.customers || resCust.data || [];
          setCustomersList(list);
        }
      } catch (e) {
        console.warn('Dùng offline templates cache:', e);
      }
    };
    loadBackendTemplates();
  }, []);

  const handleSelectCustomerForMerge = (maKH) => {
    setSelectedCustomerId(maKH);
    const found = customersList.find((c) => c.maKH === maKH);
    if (found) {
      setSampleData((prev) => ({
        ...prev,
        HoTen: found.hoTen || prev.HoTen,
        MaKH: found.maKH || prev.MaKH,
        SoCCCD: found.soCCCD || found.gttt || prev.SoCCCD,
        DiaChi: found.diaChi || prev.DiaChi,
        DienThoai: found.dienThoai || prev.DienThoai,
        SoTV: found.soTV || `TV-${found.maKH}`,
        SoTKCASA: found.soTK || prev.SoTKCASA,
        DuNo: found.tongDuNo ? formatCurrencyVN(found.tongDuNo) : prev.DuNo
      }));
    }
  };

  const saveToStorage = async (updated, itemToSave = null, deleteId = null) => {
    setTemplates(updated);
    localStorage.setItem('creditcore_templates', JSON.stringify(updated));

    try {
      if (itemToSave) {
        await api.saveTemplate(itemToSave);
      } else if (deleteId) {
        await api.deleteTemplate(deleteId);
      }
    } catch (e) {
      console.warn('Lỗi đồng bộ template lên backend:', e);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      id: 'BM_' + Date.now(),
      maBM: 'BM_MOI_' + (templates.length + 1),
      tenBM: '',
      phanHe: 'Tín Dụng',
      loaiNguon: 'GOOGLE_DOCS',
      linkNguon: 'https://docs.google.com/document/d/.../edit',
      moTa: '',
      truongTronStr: '{{HoTen}}, {{MaKH}}, {{SoCCCD}}, {{DiaChi}}, {{SoHDTD}}, {{TienVay}}',
      trangThai: 'Đang áp dụng'
    });
    setShowEditModal(true);
  };

  const handleOpenEdit = (tpl) => {
    setFormData({
      ...tpl,
      truongTronStr: tpl.truongTron ? tpl.truongTron.join(', ') : ''
    });
    setShowEditModal(true);
  };

  const handleAddTagToForm = (tag) => {
    const current = formData.truongTronStr ? formData.truongTronStr.split(',').map((t) => t.trim()) : [];
    if (!current.includes(tag)) {
      current.push(tag);
      setFormData({ ...formData, truongTronStr: current.join(', ') });
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!formData.tenBM || !formData.maBM) {
      alert('Vui lòng nhập Mã biểu mẫu và Tên biểu mẫu.');
      return;
    }

    const tags = formData.truongTronStr
      ? formData.truongTronStr
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const itemToSave = {
      ...formData,
      truongTron: tags,
      ngayCapNhat: new Date().toLocaleDateString('vi-VN')
    };

    const existsIndex = templates.findIndex((t) => t.id === formData.id);
    let updated = [];
    if (existsIndex >= 0) {
      updated = [...templates];
      updated[existsIndex] = itemToSave;
    } else {
      updated = [itemToSave, ...templates];
    }

    await saveToStorage(updated, itemToSave);
    setShowEditModal(false);
    alert('Đã lưu cấu hình biểu mẫu thành công!');
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa biểu mẫu này khỏi danh mục?')) {
      const updated = templates.filter((t) => t.id !== id);
      await saveToStorage(updated, null, id);
    }
  };

  const handleCopyTag = (tag) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(''), 2000);
  };

  const handleExportMergedDocx = () => {
    if (!selectedTemplate) return;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${selectedTemplate.tenBM} - ${sampleData.HoTen}</title>
        <style>
          @page WordSection1 {
            size: 595.3pt 841.9pt;
            margin: 42.5pt 42.5pt 42.5pt 42.5pt;
          }
          div.WordSection1 { page: WordSection1; font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.35; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px; font-family: 'Times New Roman', serif; font-size: 12pt; }
          th, td { border: 1px solid #333; padding: 6px 8px; vertical-align: top; }
          .header-table { border: none; margin-bottom: 15px; }
          .header-table td { border: none; padding: 2px; }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .title { font-size: 15pt; font-weight: bold; text-align: center; margin-top: 10px; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          <table class="header-table">
            <tr>
              <td style="width: 45%; text-align: center;">
                <span class="bold">QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</span><br/>
                <span>Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hoá</span><br/>
                <span>Mã BM: ${selectedTemplate.maBM}</span>
              </td>
              <td style="width: 55%; text-align: center;">
                <span class="bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br/>
                <span class="bold">Độc lập - Tự do - Hạnh phúc</span><br/>
                <span>-------------------</span><br/>
                <i>Quý Lộc, ngày ${sampleData.NgayKiemTra || new Date().toLocaleDateString('vi-VN')}</i>
              </td>
            </tr>
          </table>

          <div class="title">${selectedTemplate.tenBM.toUpperCase()}</div>
          <div class="text-center" style="margin-bottom: 15px; font-style: italic;">(${selectedTemplate.moTa || 'Văn bản trộn dữ liệu tự động từ hệ thống CreditCores'})</div>

          <table>
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="width: 40%;">Trường Dữ Liệu</th>
                <th style="width: 60%;">Nội Dung Trộn Áp Dụng</th>
              </tr>
            </thead>
            <tbody>
              ${(selectedTemplate.truongTron || []).map(tag => {
                const cleanKey = tag.replace(/[{}]/g, '');
                const val = sampleData[cleanKey] || `[${cleanKey} của khách hàng]`;
                return `
                  <tr>
                    <td class="bold">${cleanKey} (${tag})</td>
                    <td>${val}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <table class="header-table" style="margin-top: 40px;">
            <tr>
              <td style="width: 50%; text-align: center;">
                <span class="bold">KHÁCH HÀNG / THÀNH VIÊN</span><br/>
                <i>(Ký, ghi rõ họ tên)</i><br/><br/><br/><br/>
                <span class="bold">${sampleData.HoTen}</span>
              </td>
              <td style="width: 50%; text-align: center;">
                <span class="bold">ĐẠI DIỆN QTDND YÊN THỌ</span><br/>
                <i>(Ký, đóng dấu)</i><br/><br/><br/><br/>
                <span class="bold">${sampleData.ThanhPhanDoan ? sampleData.ThanhPhanDoan.split('(')[0].trim() : 'Giám Đốc Quỹ'}</span>
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
    downloadLink.download = `${selectedTemplate.maBM}_${sampleData.HoTen.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Lọc và phân trang
  const filteredTemplates = templates.filter((t) => {
    const matchSearch =
      !searchTerm ||
      t.tenBM?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.maBM?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.moTa?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchPhanHe = filterPhanHe === 'ALL' || t.phanHe === filterPhanHe;
    const matchTrangThai = filterTrangThai === 'ALL' || t.trangThai === filterTrangThai;

    return matchSearch && matchPhanHe && matchTrangThai;
  });

  const paginatedTemplates = filteredTemplates.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. Header Controls */}
      <div className="card-modern p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center flex-wrap gap-2">
          {/* Bộ lọc Phân hệ */}
          <select
            className="form-select form-select-sm"
            style={{ width: 170 }}
            value={filterPhanHe}
            onChange={(e) => {
              setFilterPhanHe(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả Phân Hệ</option>
            <option value="Kiểm Tra Vốn">Kiểm Tra Vốn</option>
            <option value="Thẩm Định">Thẩm Định</option>
            <option value="Trích Nợ Tự Động">Trích Nợ Tự Động</option>
            <option value="Thu Hồi Nợ">Thu Hồi Nợ</option>
            <option value="Tín Dụng">Tín Dụng</option>
          </select>

          {/* Bộ lọc Trạng thái */}
          <select
            className="form-select form-select-sm"
            style={{ width: 150 }}
            value={filterTrangThai}
            onChange={(e) => {
              setFilterTrangThai(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả Trạng Thái</option>
            <option value="Đang áp dụng">Đang áp dụng</option>
            <option value="Tạm ngưng">Tạm ngưng</option>
          </select>

          {/* Tìm kiếm */}
          <div className="input-group input-group-sm" style={{ width: 240 }}>
            <span className="input-group-text bg-light border-end-0 text-muted">
              <Search size={13} />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Tìm Mã, Tên biểu mẫu..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm fw-medium d-flex align-items-center gap-1"
            onClick={() => setShowTagDictionary(true)}
          >
            <Code size={14} /> Từ Điển Thẻ Biến Mail Merge
          </button>
          <button
            type="button"
            className="btn btn-brand btn-sm fw-medium d-flex align-items-center gap-1.5 shadow-sm text-white"
            onClick={handleOpenAdd}
          >
            <Plus size={15} /> Thêm Biểu Mẫu Mới
          </button>
        </div>
      </div>

      {/* 2. Bảng Danh Sách Biểu Mẫu */}
      <div className="card-modern p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-semibold text-slate-900 m-0 font-heading d-flex align-items-center gap-2">
              <Layers size={18} className="text-primary" /> Trung Tâm Cấu Hình Biểu Mẫu & Trộn Dữ Liệu (Mail Merge Hub)
            </h5>
            <div className="text-muted small mt-0.5">
              Quản lý danh mục biểu mẫu và ánh xạ tự động trường dữ liệu khách hàng vào Google Docs / Word
            </div>
          </div>
          <span className="badge bg-light text-muted border">
            {filteredTemplates.length} biểu mẫu
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-custom align-middle small">
            <thead>
              <tr>
                <th>Mã Biểu Mẫu</th>
                <th>Tên Biểu Mẫu & Mô Tả</th>
                <th>Phân Hệ Áp Dụng</th>
                <th>Nguồn Tệp Mẫu</th>
                <th>Thẻ Biến Trộn Sẵn</th>
                <th className="text-center">Trạng Thái</th>
                <th className="text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTemplates.length > 0 ? (
                paginatedTemplates.map((tpl) => (
                  <tr key={tpl.id}>
                    <td>
                      <span className="fw-medium font-monospace text-primary">{tpl.maBM}</span>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{tpl.ngayCapNhat}</div>
                    </td>

                    <td>
                      <div className="fw-medium text-slate-900">{tpl.tenBM}</div>
                      <div className="text-muted text-truncate" style={{ maxWidth: 260, fontSize: '0.75rem' }} title={tpl.moTa}>
                        {tpl.moTa || 'Không có mô tả chi tiết'}
                      </div>
                    </td>

                    <td>
                      <span className="badge bg-primary-subtle text-primary fw-medium">
                        {tpl.phanHe}
                      </span>
                    </td>

                    <td>
                      <a
                        href={tpl.linkNguon}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 py-1 px-2 text-truncate"
                        style={{ maxWidth: 180, fontSize: '0.75rem' }}
                        title={tpl.linkNguon}
                      >
                        <Link2 size={12} /> {tpl.loaiNguon === 'GOOGLE_DOCS' ? 'Google Docs' : 'Google Sheets'}
                        <ExternalLink size={10} className="ms-1 text-muted" />
                      </a>
                    </td>

                    <td>
                      <div className="d-flex flex-wrap gap-1" style={{ maxWidth: 220 }}>
                        {(tpl.truongTron || []).slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className={`badge border font-monospace ${copiedTag === tag ? 'bg-success text-white' : 'bg-light text-dark'}`}
                            style={{ fontSize: '0.68rem', cursor: 'pointer' }}
                            onClick={() => handleCopyTag(tag)}
                            title="Nhấp để sao chép"
                          >
                            {tag}
                          </span>
                        ))}
                        {(tpl.truongTron || []).length > 3 && (
                          <span className="badge bg-secondary-subtle text-muted" style={{ fontSize: '0.68rem' }}>
                            +{(tpl.truongTron || []).length - 3} thẻ
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="text-center">
                      <span
                        className={`badge-status ${
                          tpl.trangThai === 'Đang áp dụng' ? 'badge-success-soft' : 'badge-warning-soft'
                        }`}
                      >
                        {tpl.trangThai}
                      </span>
                    </td>

                    <td className="text-center">
                      <div className="d-inline-flex gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-brand d-inline-flex align-items-center gap-1 fw-medium text-white shadow-sm"
                          onClick={() => {
                            setSelectedTemplate(tpl);
                            setShowMergeModal(true);
                          }}
                          title="Trộn dữ liệu tài liệu (Mail Merge)"
                        >
                          <Printer size={12} /> Trộn Dữ Liệu
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary p-1 px-2"
                          onClick={() => handleOpenEdit(tpl)}
                          title="Chỉnh sửa cấu hình mẫu"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger p-1 px-2"
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          title="Xóa biểu mẫu"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    Không tìm thấy biểu mẫu nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang chuẩn 15 dòng */}
        <Pagination
          currentPage={page}
          totalItems={filteredTemplates.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* ========================================================================= */}
      {/* MODAL: THÊM / CHỈNH SỬA CẤU HÌNH BIỂU MẪU */}
      {/* ========================================================================= */}
      {showEditModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-semibold text-dark font-heading d-flex align-items-center gap-2">
                  <FileText size={18} className="text-primary" /> Cấu Hình Biểu Mẫu Báo Cáo
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} />
              </div>

              <form onSubmit={handleSaveTemplate}>
                <div className="modal-body py-3">
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-medium text-dark">Mã Biểu Mẫu (*)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace fw-medium"
                        placeholder="vd: BM_KT_01"
                        value={formData.maBM}
                        onChange={(e) => setFormData({ ...formData, maBM: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-8">
                      <label className="form-label small fw-medium text-dark">Tên Biểu Mẫu (*)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm fw-medium"
                        placeholder="vd: Biên Bản Kiểm Tra Sử Dụng Vốn Sau Giải Ngân"
                        value={formData.tenBM}
                        onChange={(e) => setFormData({ ...formData, tenBM: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-medium text-dark">Phân Hệ Nghiệp Vụ</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.phanHe}
                        onChange={(e) => setFormData({ ...formData, phanHe: e.target.value })}
                      >
                        <option value="Kiểm Tra Vốn">Kiểm Tra Vốn</option>
                        <option value="Thẩm Định">Thẩm Định</option>
                        <option value="Trích Nợ Tự Động">Trích Nợ Tự Động</option>
                        <option value="Thu Hồi Nợ">Thu Hồi Nợ</option>
                        <option value="Tín Dụng">Tín Dụng</option>
                        <option value="Khác">Khác (Tùy biến)</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-medium text-dark">Loại Nguồn Mẫu</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.loaiNguon}
                        onChange={(e) => setFormData({ ...formData, loaiNguon: e.target.value })}
                      >
                        <option value="GOOGLE_DOCS">Google Docs (Soạn thảo văn bản)</option>
                        <option value="GOOGLE_SHEETS">Google Sheets (Bảng tính / Lệnh)</option>
                        <option value="FILE_UPLOAD">Tệp Word/Excel Tải Lên</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-medium text-dark">Trạng Thái Sử Dụng</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.trangThai}
                        onChange={(e) => setFormData({ ...formData, trangThai: e.target.value })}
                      >
                        <option value="Đang áp dụng">Đang áp dụng</option>
                        <option value="Tạm ngưng">Tạm ngưng</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-medium text-dark">
                        Đường Link Google Docs / Google Sheets Mẫu (*)
                      </label>
                      <input
                        type="url"
                        className="form-control form-control-sm font-monospace"
                        placeholder="https://docs.google.com/document/d/.../edit"
                        value={formData.linkNguon}
                        onChange={(e) => setFormData({ ...formData, linkNguon: e.target.value })}
                        required
                      />
                      <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                        * Cần chia sẻ quyền "Người xem" (Viewer) hoặc "Người chỉnh sửa" (Editor) cho đường dẫn này.
                      </span>
                    </div>

                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-medium text-dark m-0">
                          Danh Sách Thẻ Biến Trộn Dữ Liệu (cách nhau bởi dấu phẩy)
                        </label>
                        <span className="text-muted small" style={{ fontSize: '0.72rem' }}>Bấm thẻ bên dưới để chèn nhanh</span>
                      </div>
                      <textarea
                        className="form-control form-control-sm font-monospace mb-2"
                        rows="3"
                        placeholder="{{HoTen}}, {{MaKH}}, {{SoCCCD}}, {{DiaChi}}, {{SoHDTD}}, {{TienVay}}..."
                        value={formData.truongTronStr}
                        onChange={(e) => setFormData({ ...formData, truongTronStr: e.target.value })}
                      />

                      {/* Quick Add Tag Chips */}
                      <div className="p-2 bg-light rounded-2 border">
                        <span className="text-muted small d-block mb-1.5" style={{ fontSize: '0.72rem' }}>Gợi ý thẻ biến phổ biến:</span>
                        <div className="d-flex flex-wrap gap-1">
                          {AVAILABLE_TAGS_DICTIONARY.flatMap((g) => g.tags).slice(0, 14).map((tag, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="btn btn-outline-secondary btn-xs py-0.5 px-1.5 font-monospace small"
                              style={{ fontSize: '0.70rem' }}
                              onClick={() => handleAddTagToForm(tag)}
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-medium text-dark">Mô Tả & Hướng Dẫn Sử Dụng</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="2"
                        placeholder="Mục đích sử dụng, căn cứ pháp lý, đối tượng áp dụng..."
                        value={formData.moTa}
                        onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light btn-sm" onClick={() => setShowEditModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-brand btn-sm fw-medium text-white">
                    Lưu Cấu Hình Biểu Mẫu
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THỬ NGHIỆM TRỘN DỮ LIỆU (MAIL MERGE TESTER & VIEWER) */}
      {/* ========================================================================= */}
      {showMergeModal && selectedTemplate && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1065 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <div>
                  <span className="badge bg-primary-subtle text-primary mb-1">
                    {selectedTemplate.maBM} • {selectedTemplate.phanHe}
                  </span>
                  <h5 className="modal-title fw-semibold text-dark font-heading">
                    Trộn Dữ Liệu Tự Động: {selectedTemplate.tenBM}
                  </h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowMergeModal(false)} />
              </div>

              <div className="modal-body py-3">
                {/* Chọn khách hàng thực tế */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <strong className="text-dark small d-flex align-items-center gap-1.5">
                      <User size={14} className="text-primary" /> Chọn Thành Viên / Khách Hàng Trộn Dữ Liệu:
                    </strong>
                    <select
                      className="form-select form-select-sm fw-medium"
                      style={{ maxWidth: 280 }}
                      value={selectedCustomerId}
                      onChange={(e) => handleSelectCustomerForMerge(e.target.value)}
                    >
                      <option value="">-- Dữ liệu mẫu mặc định --</option>
                      {customersList.map((c) => (
                        <option key={c.maKH} value={c.maKH}>
                          {c.maKH} - {c.hoTen}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-2 small">
                    <div className="col-sm-6">
                      <span className="text-muted">Khách hàng:</span> <strong className="text-dark">{sampleData.HoTen}</strong> ({sampleData.MaKH})
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted">Hợp đồng:</span> <strong className="text-primary font-monospace">{sampleData.SoHDTD}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted">Số tiền vay:</span> <strong className="text-danger num-tabular">{sampleData.TienVay}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted">Số TK CASA:</span> <strong className="text-success font-monospace">{sampleData.SoTKCASA}</strong>
                    </div>
                  </div>
                </div>

                <h6 className="fw-semibold text-dark mb-2 small">Xem Trước Bảng Ánh Xạ Biến Trộn (Mail Merge Mapping):</h6>
                <div className="table-responsive border rounded-3 bg-white mb-3" style={{ maxHeight: 220, overflowY: 'auto' }}>
                  <table className="table table-custom align-middle m-0 small">
                    <thead className="bg-light">
                      <tr>
                        <th>Tên Thẻ Biến Mail Merge</th>
                        <th>Giá Trị Dữ Liệu Thay Thế</th>
                        <th className="text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedTemplate.truongTron || []).map((tag, idx) => {
                        const cleanKey = tag.replace(/[{}]/g, '');
                        const val = sampleData[cleanKey] || `[${cleanKey} của khách hàng]`;
                        const isCopied = copiedTag === tag;
                        return (
                          <tr key={idx}>
                            <td>
                              <span className="badge bg-light text-primary border font-monospace">{tag}</span>
                            </td>
                            <td className="fw-medium text-dark">{val}</td>
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-secondary p-1 px-2"
                                onClick={() => handleCopyTag(tag)}
                                title="Sao chép thẻ này để dán vào file Word"
                              >
                                {isCopied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-light rounded-3 border small text-muted" style={{ fontSize: '0.78rem' }}>
                  <strong>💡 Hướng Dẫn Soạn Thảo:</strong> Mở file Google Docs mẫu của bạn, chèn các thẻ biến dạng <code>{'{{HoTen}}'}</code>, <code>{'{{TienVay}}'}</code> vào đúng vị trí cần điền. Khi xuất báo cáo, hệ thống sẽ tự động thay thế bằng dữ liệu khách hàng được chọn.
                </div>
              </div>

              <div className="modal-footer border-0 pt-0 d-flex justify-content-between flex-wrap gap-2">
                <a
                  href={selectedTemplate.linkNguon}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                >
                  <ExternalLink size={13} /> Mở Tệp Google Docs Mẫu
                </a>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm fw-medium d-flex align-items-center gap-1"
                    onClick={handleExportMergedDocx}
                    title="Tải về file Microsoft Word (.doc) sau khi trộn"
                  >
                    <Download size={13} /> Xuất File Word (.doc)
                  </button>
                  <button
                    type="button"
                    className="btn btn-brand btn-sm fw-medium d-flex align-items-center gap-1 text-white"
                    onClick={() => window.print()}
                    title="In trực tiếp hoặc Lưu dưới dạng PDF"
                  >
                    <Printer size={13} /> In / Lưu PDF
                  </button>
                  <button type="button" className="btn btn-light btn-sm" onClick={() => setShowMergeModal(false)}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TỪ ĐIỂN THẺ BIẾN MAIL MERGE (TAG DICTIONARY) */}
      {/* ========================================================================= */}
      {showTagDictionary && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-semibold text-dark font-heading d-flex align-items-center gap-2">
                  <Code size={18} className="text-primary" /> Từ Điển Thẻ Biến Trộn Dữ Liệu Chuẩn (Mail Merge Tags)
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowTagDictionary(false)} />
              </div>

              <div className="modal-body py-3">
                <p className="small text-muted mb-3">
                  Nhấp vào bất kỳ thẻ biến nào dưới đây để sao chép và dán trực tiếp vào file Word / Google Docs mẫu:
                </p>

                <div className="row g-3">
                  {AVAILABLE_TAGS_DICTIONARY.map((group, gIdx) => (
                    <div key={gIdx} className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <h6 className="fw-semibold text-dark small mb-2 text-primary">{group.group}</h6>
                        <div className="d-flex flex-wrap gap-1.5">
                          {group.tags.map((tag, tIdx) => {
                            const isCopied = copiedTag === tag;
                            return (
                              <button
                                key={tIdx}
                                type="button"
                                className={`btn btn-sm py-1 px-2 font-monospace d-flex align-items-center gap-1 ${
                                  isCopied ? 'btn-success text-white' : 'btn-outline-secondary bg-white'
                                }`}
                                style={{ fontSize: '0.74rem' }}
                                onClick={() => handleCopyTag(tag)}
                                title="Nhấp để sao chép"
                              >
                                {isCopied ? <Check size={11} /> : <Copy size={11} className="text-muted" />}
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-brand btn-sm fw-medium text-white" onClick={() => setShowTagDictionary(false)}>
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
