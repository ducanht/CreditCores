import React, { useState, useEffect, useMemo } from 'react';
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
  Check,
  Sparkles,
  Save,
  Sliders,
  FileCode,
  ArrowRight,
  HelpCircle,
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { formatDateVN, formatCurrencyVN, getTodayISO, getTodayVN } from '../utils/dateUtils';
import Pagination from './Pagination';

// ========================================================================================
// TỪ ĐIỂN THẺ BIẾN CHUẨN TOÀN DIỆN (SYSTEM-WIDE DYNAMIC TAG DICTIONARY)
// ========================================================================================
const DEFAULT_TAG_DICTIONARY = [
  {
    group: '1. Khách Hàng & Thành Viên',
    items: [
      { tag: '{{HoTen}}', label: 'Họ và tên khách hàng / thành viên', defaultVal: 'NGUYỄN VĂN AN' },
      { tag: '{{MaKH}}', label: 'Mã khách hàng (CoreBanking)', defaultVal: 'KH008892' },
      { tag: '{{SoCCCD}}', label: 'Số CCCD 12 chữ số', defaultVal: '038088001234' },
      { tag: '{{NgayCapCCCD}}', label: 'Ngày cấp CCCD', defaultVal: '12/05/2021' },
      { tag: '{{NoiCapCCCD}}', label: 'Nơi cấp CCCD', defaultVal: 'Cục CSQLHC về TTXH' },
      { tag: '{{DiaChi}}', label: 'Địa chỉ thường trú', defaultVal: 'Thôn Tân Lộc, xã Quý Lộc, huyện Yên Định, tỉnh Thanh Hoá' },
      { tag: '{{DienThoai}}', label: 'Số điện thoại liên hệ', defaultVal: '0912.345.678' },
      { tag: '{{SoTV}}', label: 'Mã số thành viên QTDND', defaultVal: 'TV-008892' },
      { tag: '{{NgayVaoThanhVien}}', label: 'Ngày gia nhập thành viên', defaultVal: '15/01/2020' },
      { tag: '{{SoTKCASA}}', label: 'Số tài khoản tiền gửi CASA', defaultVal: '0381000123456' }
    ]
  },
  {
    group: '2. Hợp Đồng Tín Dụng & Dư Nợ',
    items: [
      { tag: '{{SoHDTD}}', label: 'Số hợp đồng tín dụng / khế ước', defaultVal: 'KU-2026-0312' },
      { tag: '{{TienVay}}', label: 'Số tiền giải ngân ban đầu', defaultVal: '300.000.000 đ' },
      { tag: '{{DuNo}}', label: 'Dư nợ gốc hiện tại', defaultVal: '285.000.000 đ' },
      { tag: '{{LaiSuat}}', label: 'Lãi suất cho vay (%/năm)', defaultVal: '9.5%/năm' },
      { tag: '{{NgayVay}}', label: 'Ngày bắt đầu nhận nợ', defaultVal: '12/02/2026' },
      { tag: '{{DenHan}}', label: 'Ngày kết thúc thời hạn vay', defaultVal: '12/02/2027' },
      { tag: '{{ThoiHanVay}}', label: 'Thời hạn vay vốn (tháng)', defaultVal: '12 tháng' },
      { tag: '{{MucDichVay}}', label: 'Mục đích vay vốn / Phương án SXKD', defaultVal: 'Đầu tư mở rộng chuồng trại chăn nuôi bò sữa' },
      { tag: '{{HinhThucVay}}', label: 'Hình thức cho vay', defaultVal: 'Cho vay từng lần có TSBĐ' }
    ]
  },
  {
    group: '3. Thẩm Định, CIC & TSĐB',
    items: [
      { tag: '{{DeXuatVay}}', label: 'Số tiền đề xuất vay', defaultVal: '300.000.000 đ' },
      { tag: '{{DuyetVay}}', label: 'Số tiền phê duyệt cho vay', defaultVal: '300.000.000 đ' },
      { tag: '{{ThoiHanThang}}', label: 'Thời hạn duyệt (tháng)', defaultVal: '12 tháng' },
      { tag: '{{LaiSuatDuyet}}', label: 'Lãi suất phê duyệt', defaultVal: '9.5%/năm' },
      { tag: '{{ThuNhapThang}}', label: 'Tổng thu nhập bình quân/tháng', defaultVal: '45.000.000 đ' },
      { tag: '{{ChiPhiThang}}', label: 'Tổng chi phí sinh hoạt & KD/tháng', defaultVal: '15.000.000 đ' },
      { tag: '{{XepHangCIC}}', label: 'Xếp hạng tín dụng CIC', defaultVal: 'Nhóm 1 (Tốt - Không nợ xấu)' },
      { tag: '{{LoaiTSBD}}', label: 'Loại tài sản bảo đảm', defaultVal: 'Quyền sử dụng đất & nhà ở' },
      { tag: '{{GiaTriTSBD}}', label: 'Giá trị định giá TSĐB', defaultVal: '850.000.000 đ' },
      { tag: '{{TyLeLTV}}', label: 'Tỷ lệ cho vay trên TSĐB (LTV)', defaultVal: '35.3%' },
      { tag: '{{CanBoThamDinh}}', label: 'Cán bộ lập báo cáo thẩm định', defaultVal: 'Lê Văn Tín' },
      { tag: '{{KetLuan}}', label: 'Kết luận thẩm định tín dụng', defaultVal: 'Đủ điều kiện cấp tín dụng theo quy chế' }
    ]
  },
  {
    group: '4. Bất Động Sản & Tài Sản Thế Chấp Chi Tiết',
    items: [
      { tag: '{{SoSoDo}}', label: 'Số Giấy chứng nhận QSDĐ (Sổ đỏ)', defaultVal: 'CP 123456' },
      { tag: '{{ThuaDatSo}}', label: 'Thửa đất số', defaultVal: '42' },
      { tag: '{{ToBanDoSo}}', label: 'Tờ bản đồ số', defaultVal: '08' },
      { tag: '{{DiaChiThuaDat}}', label: 'Địa chỉ thửa đất thế chấp', defaultVal: 'Thôn Tân Lộc, xã Quý Lộc, Yên Định, Thanh Hoá' },
      { tag: '{{DienTichDat}}', label: 'Diện tích đất (m²)', defaultVal: '240.5 m²' },
      { tag: '{{HinhThucSuDung}}', label: 'Hình thức sử dụng đất', defaultVal: 'Sử dụng riêng' },
      { tag: '{{ChuSoHuuTS}}', label: 'Chủ sở hữu / Sử dụng tài sản', defaultVal: 'Nguyễn Văn An và vợ Trần Thị Bình' }
    ]
  },
  {
    group: '5. Hôn Phối & Người Đồng Trách Nhiệm / Bảo Lãnh',
    items: [
      { tag: '{{TenVoChong}}', label: 'Họ tên vợ / chồng khách hàng', defaultVal: 'TRẦN THỊ BÌNH' },
      { tag: '{{CCCDVoChong}}', label: 'Số CCCD của vợ / chồng', defaultVal: '038190005678' },
      { tag: '{{NguoiBaoLanh}}', label: 'Họ tên người bảo lãnh (nếu có)', defaultVal: 'Nguyễn Văn Cường' },
      { tag: '{{CCCDNguoiBaoLanh}}', label: 'Số CCCD người bảo lãnh', defaultVal: '038085009999' }
    ]
  },
  {
    group: '6. Kiểm Tra Vốn & Trích Nợ Tự Động',
    items: [
      { tag: '{{NgayKiemTra}}', label: 'Ngày thực hiện kiểm tra vốn', defaultVal: '19/08/2026' },
      { tag: '{{ThanhPhanDoan}}', label: 'Thành phần đoàn kiểm tra', defaultVal: 'Lê Văn Tín (CBTD) & Ban Kiểm Soát' },
      { tag: '{{DiaDiemKT}}', label: 'Địa điểm kiểm tra thực tế', defaultVal: 'Trang trại chăn nuôi xã Quý Lộc' },
      { tag: '{{KetLuanKT}}', label: 'Kết luận kiểm tra sử dụng vốn', defaultVal: 'Sử dụng vốn đúng mục đích 100%, trang trại phát triển tốt' },
      { tag: '{{NgayKTNext}}', label: 'Ngày kiểm tra định kỳ lần tới', defaultVal: '19/11/2026' },
      { tag: '{{KyTrichNo}}', label: 'Kỳ trích nợ tự động', defaultVal: 'Kỳ 1 (Ngày 05)' },
      { tag: '{{NgayTrichHangThang}}', label: 'Ngày trích nợ hàng tháng', defaultVal: 'Ngày 05 hàng tháng' },
      { tag: '{{SoTienTrich}}', label: 'Số tiền trích nợ định kỳ', defaultVal: '1.643.836 đ' },
      { tag: '{{TongPhaiNop}}', label: 'Tổng số tiền gốc + lãi phải trả', defaultVal: '1.643.836 đ' },
      { tag: '{{HanChotNop}}', label: 'Hạn chót thanh toán', defaultVal: '05/08/2026' }
    ]
  },
  {
    group: '7. Thông Tin Hành Chính & Quỹ Tín Dụng',
    items: [
      { tag: '{{TenQuyTDND}}', label: 'Tên Quỹ Tín Dụng Nhân Dân', defaultVal: 'QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ' },
      { tag: '{{DiaChiQuyTDND}}', label: 'Địa chỉ trụ sở Quỹ', defaultVal: 'Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hoá' },
      { tag: '{{DienThoaiQuy}}', label: 'Số điện thoại Quỹ', defaultVal: '0237.3888.999' },
      { tag: '{{NgayHienTai}}', label: 'Ngày tháng năm hiện tại', defaultVal: getTodayVN() },
      { tag: '{{GiamDocQuy}}', label: 'Đại diện Ban Giám Đốc Quỹ', defaultVal: 'Giám Đốc Quỹ' },
      { tag: '{{NguoiLapBieu}}', label: 'Cán bộ lập biểu mẫu', defaultVal: 'Cán bộ Tín dụng' }
    ]
  }
];

// DANH MỤC BIỂU MẪU MẶC ĐỊNH MỞ RỘNG (KÈM NỘI DUNG VĂN BẢN TRỘN ĐẦY ĐỦ)
const INITIAL_TEMPLATES = [
  {
    id: 'BM_KIEM_TRA_VON',
    maBM: 'BM_KT_01',
    tenBM: 'Biên Bản Kiểm Tra Sử Dụng Vốn Sau Giải Ngân',
    phanHe: 'Kiểm Tra Vốn',
    loaiNguon: 'GOOGLE_DOCS',
    linkNguon: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    moTa: 'Mẫu biên bản thực địa kiểm tra phương án sản xuất kinh doanh của khách hàng định kỳ 30 ngày / 90 ngày.',
    noiDungMau: `Hôm nay, ngày {{NgayKiemTra}}, tại địa điểm: {{DiaDiemKT}}.
Chúng tôi gồm có:
1. Đại diện Quỹ Tín Dụng Nhân Dân Yên Thọ: {{ThanhPhanDoan}}.
2. Đại diện Bên vay vốn: Ông/Bà {{HoTen}}, CCCD số {{SoCCCD}} cấp ngày {{NgayCapCCCD}} tại {{NoiCapCCCD}}, thường trú tại {{DiaChi}}.

Hai bên cùng tiến hành lập biên bản kiểm tra tình hình sử dụng vốn vay theo Hợp đồng tín dụng số {{SoHDTD}} ngày {{NgayVay}}, số tiền vay: {{TienVay}}, dư nợ hiện tại: {{DuNo}}.
Mục đích vay vốn theo phương án: {{MucDichVay}}.

KẾT QUẢ KIỂM TRA THỰC TẾ:
- Tình hình thực hiện phương án: Khách hàng đã đầu tư đúng mục đích ghi trong hợp đồng, tài sản hình thành từ vốn vay hoạt động bình thường.
- Kết luận của đoàn kiểm tra: {{KetLuanKT}}.
- Thời gian kiểm tra định kỳ tiếp theo dự kiến: {{NgayKTNext}}.

Biên bản được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để làm căn cứ theo dõi.`,
    truongTron: [
      '{{HoTen}}',
      '{{MaKH}}',
      '{{SoCCCD}}',
      '{{NgayCapCCCD}}',
      '{{NoiCapCCCD}}',
      '{{DiaChi}}',
      '{{SoHDTD}}',
      '{{TienVay}}',
      '{{DuNo}}',
      '{{NgayVay}}',
      '{{NgayKiemTra}}',
      '{{ThanhPhanDoan}}',
      '{{DiaDiemKT}}',
      '{{MucDichVay}}',
      '{{KetLuanKT}}',
      '{{NgayKTNext}}'
    ],
    trangThai: 'Đang áp dụng',
    ngayCapNhat: '20/08/2026'
  },
  {
    id: 'BM_THAM_DINH',
    maBM: 'BM_TD_02',
    tenBM: 'Báo Cáo Thẩm Định Điều Kiện Cấp Tín Dụng & TSĐB',
    phanHe: 'Thẩm Định',
    loaiNguon: 'GOOGLE_DOCS',
    linkNguon: 'https://docs.google.com/document/d/1uPsmMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    moTa: 'Tờ trình thẩm định phương án vay vốn, đánh giá xếp hạng CIC, tài sản thế chấp và tỷ lệ LTV.',
    noiDungMau: `BÁO CÁO THẨM ĐỊNH ĐIỀU KIỆN CẤP TÍN DỤNG & TÀI SẢN BẢO ĐẢM
Kính gửi: Ban Giám Đốc Quỹ Tín Dụng Nhân Dân Yên Thọ

I. THÔNG TIN KHÁCH HÀNG:
- Khách hàng: {{HoTen}} (Mã KH: {{MaKH}}), Mã thành viên: {{SoTV}}.
- CCCD số: {{SoCCCD}} cấp ngày {{NgayCapCCCD}}, Địa chỉ: {{DiaChi}}, SĐT: {{DienThoai}}.
- Người hôn phối / Đồng trách nhiệm: {{TenVoChong}} (CCCD số: {{CCCDVoChong}}).

II. PHƯƠNG ÁN VAY VỐN & TÀI CHÍNH:
- Số tiền đề xuất vay: {{DeXuatVay}}, Thời hạn đề xuất: {{ThoiHanThang}}.
- Mục đích sử dụng vốn: {{MucDichVay}}.
- Thu nhập bình quân: {{ThuNhapThang}}/tháng, Chi phí: {{ChiPhiThang}}/tháng.
- Lịch sử tín dụng CIC: {{XepHangCIC}}.

III. TÀI SẢN BẢO ĐẢM:
- Loại TSĐB: {{LoaiTSBD}} (Thửa đất số {{ThuaDatSo}}, Tờ bản đồ số {{ToBanDoSo}}, Sổ đỏ: {{SoSoDo}}).
- Diện tích: {{DienTichDat}}, Địa chỉ TS: {{DiaChiThuaDat}}.
- Giá trị định giá: {{GiaTriTSBD}}, Tỷ lệ cho vay/TSĐB (LTV): {{TyLeLTV}}.

IV. KẾT LUẬN & ĐỀ XUẤT CỦA CÁN BỘ THẨM ĐỊNH:
- Phê duyệt mức cho vay: {{DuyetVay}}, Lãi suất: {{LaiSuatDuyet}}.
- Kết luận: {{KetLuan}}.
- Cán bộ thẩm định: {{CanBoThamDinh}}.`,
    truongTron: [
      '{{HoTen}}',
      '{{MaKH}}',
      '{{SoTV}}',
      '{{SoCCCD}}',
      '{{NgayCapCCCD}}',
      '{{DiaChi}}',
      '{{DienThoai}}',
      '{{TenVoChong}}',
      '{{CCCDVoChong}}',
      '{{DeXuatVay}}',
      '{{DuyetVay}}',
      '{{ThoiHanThang}}',
      '{{LaiSuatDuyet}}',
      '{{ThuNhapThang}}',
      '{{ChiPhiThang}}',
      '{{XepHangCIC}}',
      '{{LoaiTSBD}}',
      '{{SoSoDo}}',
      '{{ThuaDatSo}}',
      '{{ToBanDoSo}}',
      '{{DienTichDat}}',
      '{{DiaChiThuaDat}}',
      '{{GiaTriTSBD}}',
      '{{TyLeLTV}}',
      '{{CanBoThamDinh}}',
      '{{KetLuan}}'
    ],
    trangThai: 'Đang áp dụng',
    ngayCapNhat: '20/08/2026'
  },
  {
    id: 'BM_UY_QUYEN_DEBIT',
    maBM: 'BM_AD_03',
    tenBM: 'Thỏa Thuận Ủy Quyền Trích Nợ Tự Động Tài Khoản CASA',
    phanHe: 'Trích Nợ Tự Động',
    loaiNguon: 'GOOGLE_DOCS',
    linkNguon: 'https://docs.google.com/document/d/1wZkMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    moTa: 'Hợp đồng ủy quyền cho phép QTDND Yên Thọ tự động cắt nợ tiền gốc và lãi từ tài khoản thanh toán CASA.',
    noiDungMau: `THỎA THUẬN ỦY QUYỀN TRÍCH NỢ TỰ ĐỘNG TÀI KHOẢN THANH TOÁN CASA
Căn cứ Hợp đồng tín dụng số: {{SoHDTD}} ký giữa Quỹ Tín Dụng Nhân Dân Yên Thọ và Ông/Bà {{HoTen}}.

BÊN ỦY QUYỀN (BÊN VAY):
- Họ và tên: {{HoTen}}, Mã KH: {{MaKH}}, CCCD: {{SoCCCD}} cấp ngày {{NgayCapCCCD}}.
- Địa chỉ: {{DiaChi}}, Số điện thoại: {{DienThoai}}.
- Số tài khoản thanh toán CASA tại Quỹ: {{SoTKCASA}}.

BÊN ĐƯỢC ỦY QUYỀN (BÊN CHO VAY):
- QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ.
- Địa chỉ: {{DiaChiQuyTDND}}.

NỘI DUNG ỦY QUYỀN:
Bên vay tự nguyện ủy quyền không hủy ngang cho QTDND Yên Thọ được quyền tự động trích tiền từ tài khoản CASA số {{SoTKCASA}} vào ngày trả nợ định kỳ ({{NgayTrichHangThang}} - {{KyTrichNo}}) để thanh toán tiền gốc, lãi và các khoản phí phát sinh của Hợp đồng số {{SoHDTD}}. Số tiền trích thu dự kiến: {{SoTienTrich}}.`,
    truongTron: [
      '{{HoTen}}',
      '{{MaKH}}',
      '{{SoCCCD}}',
      '{{NgayCapCCCD}}',
      '{{DiaChi}}',
      '{{DienThoai}}',
      '{{SoHDTD}}',
      '{{SoTKCASA}}',
      '{{KyTrichNo}}',
      '{{NgayTrichHangThang}}',
      '{{SoTienTrich}}',
      '{{DiaChiQuyTDND}}'
    ],
    trangThai: 'Đang áp dụng',
    ngayCapNhat: '20/08/2026'
  },
  {
    id: 'BM_THONG_BAO_NO',
    maBM: 'BM_THN_05',
    tenBM: 'Thông Báo Đôn Đốc Thu Hồi Nợ Gốc & Lãi Đến Hạn',
    phanHe: 'Thu Hồi Nợ',
    loaiNguon: 'GOOGLE_DOCS',
    linkNguon: 'https://docs.google.com/document/d/1kLxMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    moTa: 'Thông báo gửi cho thành viên vay vốn trước ngày đến hạn trả nợ 5 ngày hoặc khi phát sinh nợ quá hạn.',
    noiDungMau: `THÔNG BÁO ĐÔN ĐỐC THU HỒI NỢ GỐC & LÃI ĐẾN HẠN
Kính gửi: Thành viên / Khách hàng: {{HoTen}} (Mã KH: {{MaKH}}), Địa chỉ: {{DiaChi}}.

Quỹ Tín Dụng Nhân Dân Yên Thọ trân trọng thông báo đến kỳ trả nợ đối với Hợp đồng tín dụng số {{SoHDTD}}:
- Dư nợ gốc hiện tại: {{DuNo}}.
- Lãi suất vay: {{LaiSuat}}.
- Số tiền nợ cần thanh toán kỳ này: {{TongPhaiNop}}.
- Hạn chót thanh toán: {{HanChotNop}}.

Đề nghị Quý khách hàng nộp tiền mặt tại trụ sở Quỹ hoặc duy trì đủ số dư trong Tài khoản CASA số {{SoTKCASA}} để hệ thống tự động trích nợ đúng hạn.
Mọi thắc mắc xin liên hệ số điện thoại: {{DienThoaiQuy}} để được hỗ trợ.`,
    truongTron: [
      '{{HoTen}}',
      '{{MaKH}}',
      '{{DiaChi}}',
      '{{SoHDTD}}',
      '{{DuNo}}',
      '{{LaiSuat}}',
      '{{TongPhaiNop}}',
      '{{HanChotNop}}',
      '{{SoTKCASA}}',
      '{{DienThoaiQuy}}'
    ],
    trangThai: 'Đang áp dụng',
    ngayCapNhat: '20/08/2026'
  }
];

export default function TemplateManager() {
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('creditcore_templates_v2');
    return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
  });

  const [tagDictionary, setTagDictionary] = useState(() => {
    const saved = localStorage.getItem('creditcore_tag_dict');
    return saved ? JSON.parse(saved) : DEFAULT_TAG_DICTIONARY;
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
  const [exportMode, setExportMode] = useState('FULL_TEXT'); // 'FULL_TEXT' hoặc 'ROSTER_TABLE'

  // Dynamic Custom Values Override Map (Lưu trữ giá trị biến tùy biến tại runtime)
  const [dynamicOverrides, setDynamicOverrides] = useState({});
  const [newCustomTagKey, setNewCustomTagKey] = useState('');
  const [newCustomTagVal, setNewCustomTagVal] = useState('');

  // Form State Cho Thêm/Sửa Biểu Mẫu
  const [formData, setFormData] = useState({
    id: '',
    maBM: '',
    tenBM: '',
    phanHe: 'Kiểm Tra Vốn',
    loaiNguon: 'GOOGLE_DOCS',
    linkNguon: '',
    moTa: '',
    noiDungMau: '',
    truongTron: [],
    trangThai: 'Đang áp dụng'
  });

  // Tải dữ liệu mẫu khách hàng từ CSDL
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [resTpl, resCust] = await Promise.all([
          api.getTemplates(),
          api.searchCustomer360('')
        ]);

        if (resTpl.status === 'success' && Array.isArray(resTpl.data) && resTpl.data.length > 0) {
          setTemplates(resTpl.data);
          localStorage.setItem('creditcore_templates_v2', JSON.stringify(resTpl.data));
        }

        if (resCust.status === 'success' && resCust.data) {
          const list = resCust.data.customers || resCust.data || [];
          setCustomersList(list);
        }
      } catch (e) {
        console.warn('Dùng offline templates cache:', e);
      }
    };
    loadInitialData();
  }, []);

  // Xây dựng kho dữ liệu biến động gộp từ: CSDL Khách hàng + Mặc định hệ thống + Tùy biến Cán bộ nhập
  const dynamicMergedValues = useMemo(() => {
    // 1. Dữ liệu gốc mặc định từ từ điển
    const baseMap = {};
    tagDictionary.forEach((grp) => {
      grp.items.forEach((item) => {
        const cleanKey = item.tag.replace(/[{}]/g, '');
        baseMap[cleanKey] = item.defaultVal;
      });
    });

    // 2. Nạp dữ liệu thực tế từ khách hàng được chọn
    if (selectedCustomerId) {
      const found = customersList.find((c) => c.maKH === selectedCustomerId);
      if (found) {
        baseMap['HoTen'] = found.hoTen || baseMap['HoTen'];
        baseMap['MaKH'] = found.maKH || baseMap['MaKH'];
        baseMap['SoCCCD'] = found.soCCCD || found.gttt || baseMap['SoCCCD'];
        baseMap['DiaChi'] = found.diaChi || baseMap['DiaChi'];
        baseMap['DienThoai'] = found.dienThoai || baseMap['DienThoai'];
        baseMap['SoTV'] = found.soTV || `TV-${found.maKH}`;
        baseMap['SoTKCASA'] = found.soTK || baseMap['SoTKCASA'];
        if (found.tongDuNo) {
          baseMap['DuNo'] = formatCurrencyVN(found.tongDuNo);
        }
      }
    }

    // 3. Gộp các giá trị do người dùng chỉnh sửa/thêm trực tiếp (Overrides)
    return { ...baseMap, ...dynamicOverrides };
  }, [selectedCustomerId, customersList, dynamicOverrides, tagDictionary]);

  // Quét tự động toàn bộ thẻ biến {{...}} từ một chuỗi văn bản
  const scanTagsFromText = (text) => {
    if (!text) return [];
    const matches = text.match(/\{\{([a-zA-Z0-9_\u00C0-\u1EF9]+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches)];
  };

  const saveToStorage = async (updated, itemToSave = null, deleteId = null) => {
    setTemplates(updated);
    localStorage.setItem('creditcore_templates_v2', JSON.stringify(updated));

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
      noiDungMau: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nGIẤY ĐỀ NGHỊ VAY VỐN KIÊM PHƯƠNG ÁN TRẢ NỢ\nKính gửi: Quỹ Tín Dụng Nhân Dân Yên Thọ\n\nTôi tên là: {{HoTen}}, CCCD số: {{SoCCCD}} cấp ngày: {{NgayCapCCCD}} tại {{NoiCapCCCD}}.\nĐịa chỉ thường trú: {{DiaChi}}, Số điện thoại: {{DienThoai}}.\nNay tôi làm đơn này đề nghị Quỹ cho tôi vay số tiền: {{TienVay}}, thời hạn: {{ThoiHanVay}}.\nMục đích vay vốn: {{MucDichVay}}.\nTài sản bảo đảm thế chấp: {{LoaiTSBD}} (Giá trị định giá: {{GiaTriTSBD}}).',
      truongTron: ['{{HoTen}}', '{{SoCCCD}}', '{{NgayCapCCCD}}', '{{NoiCapCCCD}}', '{{DiaChi}}', '{{DienThoai}}', '{{TienVay}}', '{{ThoiHanVay}}', '{{MucDichVay}}', '{{LoaiTSBD}}', '{{GiaTriTSBD}}'],
      trangThai: 'Đang áp dụng'
    });
    setShowEditModal(true);
  };

  const handleOpenEdit = (tpl) => {
    setFormData({
      ...tpl,
      noiDungMau: tpl.noiDungMau || '',
      truongTron: tpl.truongTron || []
    });
    setShowEditModal(true);
  };

  // Nút Quét Thẻ Biến Tự Động trong Form Soạn Thảo
  const handleAutoScanFormTags = () => {
    const scanned = scanTagsFromText(formData.noiDungMau);
    if (scanned.length === 0) {
      alert('Không tìm thấy thẻ biến nào dạng {{TenBien}} trong nội dung văn bản.');
      return;
    }
    const merged = [...new Set([...formData.truongTron, ...scanned])];
    setFormData({ ...formData, truongTron: merged });
    alert(`Đã quét và tìm thấy ${scanned.length} thẻ biến trong văn bản!`);
  };

  // Thêm thẻ từ gợi ý vào văn bản và danh sách thẻ
  const handleInsertTagToForm = (tag) => {
    if (!formData.truongTron.includes(tag)) {
      setFormData({
        ...formData,
        truongTron: [...formData.truongTron, tag],
        noiDungMau: formData.noiDungMau + ' ' + tag
      });
    } else {
      setFormData({
        ...formData,
        noiDungMau: formData.noiDungMau + ' ' + tag
      });
    }
  };

  // Xóa thẻ khỏi danh sách
  const handleRemoveTagFromForm = (tagToRemove) => {
    setFormData({
      ...formData,
      truongTron: formData.truongTron.filter((t) => t !== tagToRemove)
    });
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!formData.tenBM || !formData.maBM) {
      alert('Vui lòng nhập Mã biểu mẫu và Tên biểu mẫu.');
      return;
    }

    // Tự động quét lại thẻ lần cuối trước khi lưu
    const scanned = scanTagsFromText(formData.noiDungMau);
    const finalTags = [...new Set([...(formData.truongTron || []), ...scanned])];

    const itemToSave = {
      ...formData,
      truongTron: finalTags,
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
    alert('Đã lưu cấu hình biểu mẫu và cập nhật các trường trộn dữ liệu thành công!');
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

  // Xử lý thay đổi giá trị biến động trực tiếp trên bảng xem trước
  const handleOverrideValueChange = (cleanKey, value) => {
    setDynamicOverrides((prev) => ({
      ...prev,
      [cleanKey]: value
    }));
  };

  // Thêm một trường tùy biến mới vào biểu mẫu ngay tại cửa sổ trộn
  const handleAddCustomFieldToMerge = () => {
    if (!newCustomTagKey.trim()) return;
    const cleanKey = newCustomTagKey.trim().replace(/[{}]/g, '');
    const fullTag = `{{${cleanKey}}}`;

    // Cập nhật vào overrides
    setDynamicOverrides((prev) => ({
      ...prev,
      [cleanKey]: newCustomTagVal || `[${cleanKey}]`
    }));

    // Thêm vào danh sách trường của biểu mẫu đang chọn
    if (selectedTemplate && !selectedTemplate.truongTron.includes(fullTag)) {
      const updatedTpl = {
        ...selectedTemplate,
        truongTron: [...selectedTemplate.truongTron, fullTag]
      };
      setSelectedTemplate(updatedTpl);

      // Cập nhật vào danh sách templates chung
      const updatedList = templates.map((t) => (t.id === updatedTpl.id ? updatedTpl : t));
      saveToStorage(updatedList, updatedTpl);
    }

    setNewCustomTagKey('');
    setNewCustomTagVal('');
  };

  // Xóa một trường khỏi biểu mẫu đang chọn
  const handleRemoveFieldFromMerge = (tagToRemove) => {
    if (!selectedTemplate) return;
    const updatedTpl = {
      ...selectedTemplate,
      truongTron: selectedTemplate.truongTron.filter((t) => t !== tagToRemove)
    };
    setSelectedTemplate(updatedTpl);

    const updatedList = templates.map((t) => (t.id === updatedTpl.id ? updatedTpl : t));
    saveToStorage(updatedList, updatedTpl);
  };

  // Hàm sinh nội dung văn bản sau khi đã thay thế toàn bộ thẻ biến
  const generateMergedFullText = () => {
    if (!selectedTemplate) return '';
    let text = selectedTemplate.noiDungMau || '';
    if (!text) {
      // Nếu chưa có văn bản mẫu, sinh bảng danh sách
      return (selectedTemplate.truongTron || []).map((tag) => {
        const cleanKey = tag.replace(/[{}]/g, '');
        const val = dynamicMergedValues[cleanKey] || '..............';
        return `${cleanKey}: ${val}`;
      }).join('\n');
    }

    // Thay thế toàn bộ thẻ biến xuất hiện trong văn bản
    Object.keys(dynamicMergedValues).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      text = text.replace(regex, dynamicMergedValues[key]);
    });

    // Các thẻ còn sót chưa có giá trị sẽ thay bằng đường chấm
    text = text.replace(/\{\{([a-zA-Z0-9_\u00C0-\u1EF9]+)\}\}/g, '..............');
    return text;
  };

  // Xuất file Microsoft Word (.doc) hoàn chỉnh
  const handleExportMergedDocx = () => {
    if (!selectedTemplate) return;
    const clientName = dynamicMergedValues['HoTen'] || 'KhachHang';

    let bodyHtml = '';
    if (exportMode === 'FULL_TEXT' && selectedTemplate.noiDungMau) {
      const mergedText = generateMergedFullText();
      const paragraphs = mergedText.split('\n').map((p) => {
        if (!p.trim()) return '<p style="margin: 4px 0;">&nbsp;</p>';
        return `<p style="margin: 6px 0; text-align: justify;">${p.trim()}</p>`;
      }).join('');

      bodyHtml = `
        <div style="margin-top: 15px; font-size: 13pt; line-height: 1.4;">
          ${paragraphs}
        </div>
      `;
    } else {
      // Bảng kê đối soát chi tiết
      bodyHtml = `
        <div class="title">${selectedTemplate.tenBM.toUpperCase()}</div>
        <div class="text-center" style="margin-bottom: 15px; font-style: italic;">(${selectedTemplate.moTa || 'Bảng ánh xạ trộn dữ liệu tự động từ hệ thống CreditCores'})</div>

        <table>
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="width: 35%;">Trường Dữ Liệu</th>
              <th style="width: 25%;">Thẻ Biến Trộn</th>
              <th style="width: 40%;">Nội Dung Trộn Áp Dụng</th>
            </tr>
          </thead>
          <tbody>
            ${(selectedTemplate.truongTron || []).map((tag) => {
              const cleanKey = tag.replace(/[{}]/g, '');
              const val = dynamicMergedValues[cleanKey] || '..............';
              return `
                <tr>
                  <td class="bold">${cleanKey}</td>
                  <td style="font-family: monospace; color: #0284c7;">${tag}</td>
                  <td>${val}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${selectedTemplate.tenBM} - ${clientName}</title>
        <style>
          @page WordSection1 {
            size: 595.3pt 841.9pt;
            margin: 42.5pt 42.5pt 42.5pt 42.5pt;
          }
          div.WordSection1 { page: WordSection1; font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.35; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; font-family: 'Times New Roman', serif; font-size: 12pt; }
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
                <i>Quý Lộc, ngày ${dynamicMergedValues['NgayHienTai'] || new Date().toLocaleDateString('vi-VN')}</i>
              </td>
            </tr>
          </table>

          ${bodyHtml}

          <table class="header-table" style="margin-top: 35px;">
            <tr>
              <td style="width: 50%; text-align: center;">
                <span class="bold">KHÁCH HÀNG / THÀNH VIÊN</span><br/>
                <i>(Ký, ghi rõ họ tên)</i><br/><br/><br/><br/><br/>
                <span class="bold">${dynamicMergedValues['HoTen'] || ''}</span>
              </td>
              <td style="width: 50%; text-align: center;">
                <span class="bold">ĐẠI DIỆN QTDND YÊN THỌ</span><br/>
                <i>(Ký, đóng dấu)</i><br/><br/><br/><br/><br/>
                <span class="bold">${dynamicMergedValues['GiamDocQuy'] || 'Giám Đốc Quỹ'}</span>
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
    downloadLink.download = `${selectedTemplate.maBM}_${clientName.replace(/\s+/g, '_')}.doc`;
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
            <Code size={14} /> Từ Điển Thẻ Biến ({tagDictionary.reduce((acc, g) => acc + g.items.length, 0)} Thẻ)
          </button>
          <button
            type="button"
            className="btn btn-brand btn-sm fw-medium d-flex align-items-center gap-1.5 shadow-sm text-white"
            onClick={handleOpenAdd}
          >
            <Plus size={15} /> Thêm Biểu Mẫu Tùy Biến
          </button>
        </div>
      </div>

      {/* 2. Bảng Danh Sách Biểu Mẫu */}
      <div className="card-modern p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <h5 className="fw-semibold text-slate-900 m-0 font-heading d-flex align-items-center gap-2">
              <Layers size={18} className="text-primary" /> Quản Lý Biểu Mẫu & Trộn Dữ Liệu
            </h5>
            <span
              className="text-muted cursor-pointer d-inline-flex align-items-center"
              title="Tự động nhận diện thẻ biến và điền dữ liệu khách hàng vào tài liệu Word/PDF"
            >
              <HelpCircle size={14} />
            </span>
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
                <th>Nguồn Mẫu</th>
                <th>Thẻ Biến Nhận Diện</th>
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
                      <div className="d-flex flex-wrap gap-1" style={{ maxWidth: 240 }}>
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
                          title="Trộn dữ liệu tự động & Chỉnh sửa trường linh hoạt"
                        >
                          <Printer size={12} /> Trộn Dữ Liệu
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary p-1 px-2"
                          onClick={() => handleOpenEdit(tpl)}
                          title="Chỉnh sửa cấu hình & nội dung mẫu"
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

        {/* Phân trang */}
        <Pagination
          currentPage={page}
          totalItems={filteredTemplates.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL: THÊM / CHỈNH SỬA CẤU HÌNH VÀ NỘI DUNG BIỂU MẪU ĐỘNG              */}
      {/* ========================================================================= */}
      {showEditModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <div className="d-flex align-items-center gap-2">
                  <h5 className="modal-title fw-semibold text-dark font-heading d-flex align-items-center gap-2">
                    <FileCode size={18} className="text-primary" /> Thiết Kế & Cấu Hình Biểu Mẫu
                  </h5>
                  <span
                    className="text-muted cursor-pointer d-inline-flex align-items-center"
                    title="Tự động quét thẻ biến {{...}} trong văn bản để tạo danh sách trường trộn dữ liệu"
                  >
                    <HelpCircle size={14} />
                  </span>
                </div>
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
                    </div>

                    {/* Nội dung văn bản mẫu toàn phần */}
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-medium text-dark m-0">
                          Nội Dung Văn Bản Mẫu (Dán toàn bộ bài viết / biểu mẫu có chứa thẻ biến vào đây)
                        </label>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-xs py-0.5 px-2 d-flex align-items-center gap-1"
                          onClick={handleAutoScanFormTags}
                        >
                          <Sparkles size={12} /> Tự Động Quét Thẻ Biến
                        </button>
                      </div>
                      <textarea
                        className="form-control form-control-sm font-monospace mb-2"
                        rows="7"
                        placeholder="Dán nội dung văn bản Word hoặc Google Docs vào đây. Các vị trí cần điền dữ liệu hãy đặt dạng {{HoTen}}, {{SoCCCD}}, {{TienVay}}..."
                        value={formData.noiDungMau}
                        onChange={(e) => setFormData({ ...formData, noiDungMau: e.target.value })}
                      />
                    </div>

                    {/* Danh sách thẻ biến đã phát hiện & Thẻ gợi ý */}
                    <div className="col-12">
                      <div className="p-3 bg-light rounded-2 border">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong className="text-dark small">
                            Danh Sách Thẻ Biến Đang Áp Dụng ({formData.truongTron.length} thẻ):
                          </strong>
                          <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                            Nhấp dấu (×) để loại bỏ thẻ không cần thiết
                          </span>
                        </div>

                        <div className="d-flex flex-wrap gap-1.5 mb-3">
                          {formData.truongTron.map((tag, idx) => (
                            <span key={idx} className="badge bg-primary-subtle text-primary border d-inline-flex align-items-center gap-1 font-monospace">
                              {tag}
                              <button
                                type="button"
                                className="btn-close btn-close-xs"
                                style={{ fontSize: '0.55rem' }}
                                onClick={() => handleRemoveTagFromForm(tag)}
                                title="Xóa thẻ này"
                              />
                            </span>
                          ))}
                        </div>

                        <div className="border-top pt-2">
                          <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>
                            Chèn nhanh các trường dữ liệu phổ biến vào văn bản:
                          </span>
                          <div className="d-flex flex-wrap gap-1">
                            {tagDictionary.flatMap((g) => g.items).slice(0, 16).map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="btn btn-outline-secondary btn-xs py-0.5 px-1.5 font-monospace small bg-white"
                                style={{ fontSize: '0.70rem' }}
                                onClick={() => handleInsertTagToForm(item.tag)}
                                title={item.label}
                              >
                                + {item.tag}
                              </button>
                            ))}
                          </div>
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
                  <button type="submit" className="btn btn-brand btn-sm fw-medium text-white shadow-sm">
                    <Save size={13} className="me-1" /> Lưu Cấu Hình Biểu Mẫu
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: TRỘN DỮ LIỆU TỰ ĐỘNG & TỰ DO THÊM BỚT TRƯỜNG TÙY BIẾN (MAIL MERGE) */}
      {/* ========================================================================= */}
      {showMergeModal && selectedTemplate && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1065 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge bg-primary-subtle text-primary">
                      {selectedTemplate.maBM} • {selectedTemplate.phanHe}
                    </span>
                    <span className="badge bg-success-subtle text-success">
                      Tự động điền dữ liệu động 100%
                    </span>
                  </div>
                  <h5 className="modal-title fw-semibold text-dark font-heading">
                    Trộn Dữ Liệu Tự Động: {selectedTemplate.tenBM}
                  </h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowMergeModal(false)} />
              </div>

              <div className="modal-body py-3">
                {/* 4.1. Chọn Khách hàng thực tế từ CSDL */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <strong className="text-dark small d-flex align-items-center gap-1.5">
                      <User size={14} className="text-primary" /> Chọn Thành Viên / Khách Hàng Để Tự Động Điền Mẫu:
                    </strong>
                    <select
                      className="form-select form-select-sm fw-medium"
                      style={{ maxWidth: 320 }}
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                      <option value="">-- Dữ liệu mẫu mặc định (Demo) --</option>
                      {customersList.map((c) => (
                        <option key={c.maKH} value={c.maKH}>
                          {c.maKH} - {c.hoTen} ({c.diaChi})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-2 small">
                    <div className="col-sm-6 col-md-3">
                      <span className="text-muted">Khách hàng:</span> <strong className="text-dark">{dynamicMergedValues['HoTen']}</strong>
                    </div>
                    <div className="col-sm-6 col-md-3">
                      <span className="text-muted">Số CCCD:</span> <strong className="text-dark font-monospace">{dynamicMergedValues['SoCCCD']}</strong>
                    </div>
                    <div className="col-sm-6 col-md-3">
                      <span className="text-muted">Hợp đồng:</span> <strong className="text-primary font-monospace">{dynamicMergedValues['SoHDTD']}</strong>
                    </div>
                    <div className="col-sm-6 col-md-3">
                      <span className="text-muted">Dư nợ gốc:</span> <strong className="text-danger num-tabular">{dynamicMergedValues['DuNo']}</strong>
                    </div>
                  </div>
                </div>

                {/* 4.2. Chế Độ Xuất Văn Bản */}
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="small fw-medium text-dark">Chế độ xuất tài liệu:</span>
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className={`btn ${exportMode === 'FULL_TEXT' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setExportMode('FULL_TEXT')}
                      >
                        <FileText size={12} className="me-1" /> Văn Bản Hoàn Chỉnh (Theo Đoạn Văn)
                      </button>
                      <button
                        type="button"
                        className={`btn ${exportMode === 'ROSTER_TABLE' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setExportMode('ROSTER_TABLE')}
                      >
                        <Sliders size={12} className="me-1" /> Bảng Kê Đối Soát Từng Trường
                      </button>
                    </div>
                  </div>

                  {/* Thêm trường tùy biến nhanh */}
                  <div className="d-flex align-items-center gap-1.5">
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      style={{ width: 140 }}
                      placeholder="vd: ThuaDatSo"
                      value={newCustomTagKey}
                      onChange={(e) => setNewCustomTagKey(e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      style={{ width: 160 }}
                      placeholder="Giá trị điền..."
                      value={newCustomTagVal}
                      onChange={(e) => setNewCustomTagVal(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                      onClick={handleAddCustomFieldToMerge}
                      title="Thêm trường mới vào biểu mẫu này"
                    >
                      <Plus size={13} /> Thêm Trường
                    </button>
                  </div>
                </div>

                {/* 4.3. Bảng Xem Trước & Chỉnh Sửa Trực Tiếp Từng Giá Trị Biến */}
                <div className="table-responsive border rounded-3 bg-white mb-3" style={{ maxHeight: 250, overflowY: 'auto' }}>
                  <table className="table table-custom align-middle m-0 small">
                    <thead className="bg-light sticky-top">
                      <tr>
                        <th style={{ width: '25%' }}>Tên Thẻ Biến</th>
                        <th style={{ width: '65%' }}>Nội Dung Điền Thực Tế (Có thể chỉnh sửa trực tiếp)</th>
                        <th className="text-center" style={{ width: '10%' }}>Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedTemplate.truongTron || []).map((tag, idx) => {
                        const cleanKey = tag.replace(/[{}]/g, '');
                        const val = dynamicMergedValues[cleanKey] || '';
                        const isCopied = copiedTag === tag;
                        return (
                          <tr key={idx}>
                            <td>
                              <span className="badge bg-light text-primary border font-monospace me-1">{tag}</span>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm py-1 px-2 fw-medium text-dark"
                                value={val}
                                onChange={(e) => handleOverrideValueChange(cleanKey, e.target.value)}
                                placeholder={`Nhập giá trị cho ${cleanKey}...`}
                              />
                            </td>
                            <td className="text-center">
                              <div className="d-inline-flex gap-1">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline-secondary p-1 px-1.5"
                                  onClick={() => handleCopyTag(tag)}
                                  title="Sao chép thẻ này"
                                >
                                  {isCopied ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline-danger p-1 px-1.5"
                                  onClick={() => handleRemoveFieldFromMerge(tag)}
                                  title="Bỏ trường này khỏi biểu mẫu"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 4.4. Xem Trước Văn Bản Đoạn Văn Đã Trộn */}
                {exportMode === 'FULL_TEXT' && selectedTemplate.noiDungMau && (
                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong className="text-dark small">Xem Trước Đoạn Văn Bản Xuất Ra:</strong>
                      <span className="text-muted small" style={{ fontSize: '0.72rem' }}>Toàn bộ thẻ biến đã được điền tự động</span>
                    </div>
                    <div
                      className="p-3 bg-white rounded-2 border small font-monospace text-dark"
                      style={{ whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto', fontSize: '0.80rem' }}
                    >
                      {generateMergedFullText()}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer border-0 pt-0 d-flex justify-content-between flex-wrap gap-2">
                <a
                  href={selectedTemplate.linkNguon}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                >
                  <ExternalLink size={13} /> Mở Tệp Google Docs Gốc
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
                    className="btn btn-brand btn-sm fw-medium d-flex align-items-center gap-1 text-white shadow-sm"
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
      {/* 5. MODAL: TỪ ĐIỂN THẺ BIẾN TOÀN DIỆN (TAG DICTIONARY)                      */}
      {/* ========================================================================= */}
      {showTagDictionary && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content card-modern p-4">
              <div className="modal-header border-0 pb-0">
                <div>
                  <h5 className="modal-title fw-semibold text-dark font-heading d-flex align-items-center gap-2">
                    <Code size={18} className="text-primary" /> Từ Điển Thẻ Biến Trộn Dữ Liệu Tự Động (Mail Merge Tag Dictionary)
                  </h5>
                  <p className="small text-muted m-0">
                    Bất kỳ thẻ biến nào dưới đây được đặt trong Google Docs / Word đều được hệ thống tự động điền khi xuất báo cáo:
                  </p>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowTagDictionary(false)} />
              </div>

              <div className="modal-body py-3">
                <div className="row g-3">
                  {tagDictionary.map((group, gIdx) => (
                    <div key={gIdx} className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <h6 className="fw-semibold text-dark small mb-2 text-primary">{group.group}</h6>
                        <div className="d-flex flex-column gap-1.5">
                          {group.items.map((item, tIdx) => {
                            const isCopied = copiedTag === item.tag;
                            return (
                              <div
                                key={tIdx}
                                className="d-flex justify-content-between align-items-center p-1.5 bg-white rounded border small"
                              >
                                <div>
                                  <span className="font-monospace fw-medium text-primary me-2">{item.tag}</span>
                                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>{item.label}</span>
                                </div>
                                <button
                                  type="button"
                                  className={`btn btn-xs py-0.5 px-2 font-monospace d-flex align-items-center gap-1 ${
                                    isCopied ? 'btn-success text-white' : 'btn-outline-secondary'
                                  }`}
                                  style={{ fontSize: '0.70rem' }}
                                  onClick={() => handleCopyTag(item.tag)}
                                  title="Nhấp để sao chép"
                                >
                                  {isCopied ? <Check size={11} /> : <Copy size={11} className="text-muted" />}
                                  {isCopied ? 'Đã sao chép' : 'Sao chép'}
                                </button>
                              </div>
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
                  Đã Hiểu & Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
