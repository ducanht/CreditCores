/**
 * DỮ LIỆU MẪU BANKING CHO CHẾ ĐỘ OFFLINE / FALLBACK
 * Chuẩn hóa ngày tháng dd/MM/yyyy và số tiền VNĐ
 */

import { formatDateVN, formatDateTimeVN, getTodayVN } from '../utils/dateUtils.js';

export const initialMockData = {
  stats: {
    totalDuNo: 1020000000,
    totalHopDong: 4,
    totalDuThuLai: 8229167,
    totalKhachHangTrichNo: 3,
    totalNoTon: 12500000,
    recentBatches: [
      {
        maDot: 'DOT-202608-K2',
        thangNam: '202608',
        kyTrich: 2,
        tongPhaiThu: 120000000,
        tongDaTrich: 114000000,
        tongConNo: 6000000,
        ngayTao: '15/08/2026 08:30:00',
        trangThai: 'HOAN_TAT'
      },
      {
        maDot: 'DOT-202608-K1',
        thangNam: '202608',
        kyTrich: 1,
        tongPhaiThu: 145000000,
        tongDaTrich: 138500000,
        tongConNo: 6500000,
        ngayTao: '05/08/2026 08:30:00',
        trangThai: 'HOAN_TAT'
      }
    ]
  },

  customers: [
    {
      maKH: 'KH008892',
      hoTen: 'NGUYỄN VĂN AN',
      diaChi: 'Thôn 3, Xã Yên Thọ',
      ngaySinh: '15/05/1985',
      cccd: '038086012345',
      ngayCap: '15/05/2021',
      noiCap: 'Cục CSQLHC về TTXH',
      dienThoai: '02373850123',
      dienThoaiDD: '0912345678',
      soTK: '3500205123456',
      khuVuc: 'Thôn 3, Yên Thọ',
      soTV: 'TV-0892',
      soSoCP: 'CP-0412',
      ngayVaoTV: '10/01/2018',
      tongTienCP: 15000000,
      contracts: [
        {
          soHDTD: 'KU-2025-0982',
          maKH: 'KH008892',
          tienVay: 300000000,
          duNo: 250000000,
          laiSuat: 9.5,
          ngayVay: '15/08/2025',
          denHan: '15/08/2026',
          traLaiDenNgay: '15/07/2026',
          maLoaiVay: 'LV01',
          soThangVay: 12,
          moTaVay: 'Cho vay phát triển chăn nuôi bò sữa'
        },
        {
          soHDTD: 'KU-2026-0145',
          maKH: 'KH008892',
          tienVay: 300000000,
          duNo: 200000000,
          laiSuat: 10.2,
          ngayVay: '10/02/2026',
          denHan: '10/02/2028',
          traLaiDenNgay: '10/07/2026',
          maLoaiVay: 'LV03',
          soThangVay: 24,
          moTaVay: 'Cho vay kinh doanh vật tư nông nghiệp'
        }
      ]
    },
    {
      maKH: 'KH009102',
      hoTen: 'LÊ THỊ MAI',
      diaChi: 'Thôn 1, Xã Yên Trường',
      ngaySinh: '20/10/1990',
      cccd: '038190098765',
      ngayCap: '10/08/2020',
      noiCap: 'CA Tỉnh Thanh Hóa',
      dienThoai: '02373850999',
      dienThoaiDD: '0988123456',
      soTK: '3500205987654',
      khuVuc: 'Thôn 1, Yên Trường',
      soTV: 'TV-0910',
      soSoCP: 'CP-0511',
      ngayVaoTV: '15/03/2019',
      tongTienCP: 20000000,
      contracts: [
        {
          soHDTD: 'KU-2026-0312',
          maKH: 'KH009102',
          tienVay: 200000000,
          duNo: 150000000,
          laiSuat: 9.8,
          ngayVay: '05/03/2026',
          denHan: '05/03/2028',
          traLaiDenNgay: '05/07/2026',
          maLoaiVay: 'LV02',
          soThangVay: 24,
          moTaVay: 'Cho vay trồng trọt công nghệ cao'
        }
      ]
    },
    {
      maKH: 'KH007415',
      hoTen: 'TRẦN VĂN QUÂN',
      diaChi: 'Thôn 5, Xã Yên Bái',
      ngaySinh: '08/12/1979',
      cccd: '038079001122',
      ngayCap: '12/04/2022',
      noiCap: 'Cục CSQLHC về TTXH',
      dienThoai: '02373850888',
      dienThoaiDD: '0903456789',
      soTK: '3500205556677',
      khuVuc: 'Thôn 5, Yên Bái',
      soTV: 'TV-0741',
      soSoCP: 'CP-0320',
      ngayVaoTV: '20/11/2016',
      tongTienCP: 30000000,
      contracts: [
        {
          soHDTD: 'KU-2025-0811',
          maKH: 'KH007415',
          tienVay: 500000000,
          duNo: 420000000,
          laiSuat: 9.5,
          ngayVay: '20/11/2025',
          denHan: '20/11/2027',
          traLaiDenNgay: '20/07/2026',
          maLoaiVay: 'LV03',
          soThangVay: 24,
          moTaVay: 'Cho vay mua xe tải vận chuyển nông sản'
        }
      ]
    }
  ],

  appraisals: [
    {
      maBCTD: 'BCTD-2026-081',
      maKH: 'KH008892',
      hoTen: 'NGUYỄN VĂN AN',
      deXuatVay: 300000000,
      duyetVay: 300000000,
      thoiHanThang: 12,
      laiSuatDuyet: 9.5,
      thuNhapThang: 25000000,
      xepHangCIC: 'Hang A (Tot)',
      loaiTSBD: 'QSDĐ (Sổ đỏ / Sổ hồng)',
      chuSoHuuTSBD: 'Nguyễn Văn An (Chính chủ)',
      moTaTSBD: 'GCN QSDĐ số DT 123456, Thửa 42, TBĐ 08. DT: 150m2 tại Thôn 3, Yên Thọ.',
      giaTriTSBD: 600000000,
      tyLeLTV: '50.0%',
      hinhAnhTSBD: 'https://drive.google.com/drive/folders/tsbd_kh008892',
      hinhAnhThamDinh: 'https://drive.google.com/drive/folders/thamdinh_kh008892',
      mucDoRuiRo: 'Thấp',
      ketLuan: 'Đồng ý cấp tín dụng',
      ngayLap: '10/08/2025',
      canBoThamDinh: 'Lê Văn Tín'
    }
  ],

  inspections: [
    {
      maBBKT: 'BBKT-2025-0042',
      soHDTD: 'KU-2025-0982',
      maKH: 'KH008892',
      hoTen: 'NGUYỄN VĂN AN',
      loaiDoanKT: 'CBTD',
      thanhPhanDoan: 'Lê Văn Tín (CBTD phụ trách địa bàn Thôn 3)',
      ngayKiemTra: '15/09/2025',
      lanKiemTra: 'Lần 1 (Sau giải ngân 30 ngày)',
      ngayKTNext: '15/03/2026',
      hinhThuc: 'Thực địa tại trang trại',
      diaDiemKT: 'Thôn 3, Xã Yên Thọ',
      danhGiaMucDich: 'Đúng mục đích 100%',
      tienDoSuDungVon: 'Đã giải ngân và mua 6 con bò sữa giống Pháp',
      mucDoRuiRo: 'Thấp',
      moTaThucTe: 'Đã đầu tư mua thêm 6 con bò sữa giống Pháp, chuồng trại mở rộng 80m2 đạt chuẩn. Đàn bò khỏe mạnh.',
      kienNghi: 'Tiếp tục duy trì dư nợ, đôn đốc trả nợ lãi định kỳ ngày 15 hàng tháng.',
      fileBienBanUrl: 'https://drive.google.com/file/d/bbkt_2025_0042/view',
      hinhAnhKiemTra: 'https://drive.google.com/drive/folders/ktv_kh008892_1',
      trangThai: 'ĐÃ_DUYỆT',
      ngayTao: '15/09/2025 10:30:00'
    },
    {
      maBBKT: 'BBKT-2026-0088',
      soHDTD: 'KU-2025-0982',
      maKH: 'KH008892',
      hoTen: 'NGUYỄN VĂN AN',
      loaiDoanKT: 'BKS',
      thanhPhanDoan: 'Nguyễn Kiểm Soát (Trưởng BKS), Lê Văn Tín (CBTD)',
      ngayKiemTra: '18/03/2026',
      lanKiemTra: 'Lần 2 (Định kỳ BKS 6 tháng)',
      ngayKTNext: '18/09/2026',
      hinhThuc: 'Thực địa & Kiểm tra sổ sách',
      diaDiemKT: 'Thôn 3, Xã Yên Thọ',
      danhGiaMucDich: 'Đúng mục đích 100%',
      tienDoSuDungVon: 'Trang trại vận hành ổn định, cho sản lượng sữa 120 lít/ngày',
      mucDoRuiRo: 'Thấp',
      moTaThucTe: 'Trang trại bò sữa phát triển tốt, đã ký hợp đồng bao tiêu sữa với nhà máy. Khách hàng trả nợ gốc lãi đúng hạn.',
      kienNghi: 'Đánh giá xếp loại A. Đề xuất HĐQT xem xét nâng hạn mức khi có nhu cầu.',
      fileBienBanUrl: 'https://drive.google.com/file/d/bbkt_2026_0088/view',
      hinhAnhKiemTra: 'https://drive.google.com/drive/folders/ktv_kh008892_2',
      trangThai: 'ĐÃ_DUYỆT',
      ngayTao: '18/03/2026 14:00:00'
    },
    {
      maBBKT: 'BBKT-2026-0105',
      soHDTD: 'KU-2025-0811',
      maKH: 'KH007415',
      hoTen: 'TRẦN VĂN QUÂN',
      loaiDoanKT: 'HDQT',
      thanhPhanDoan: 'Phạm Giám Đốc (Chủ tịch HĐQT), Nguyễn Kiểm Soát (BKS), Lê Văn Tín (CBTD)',
      ngayKiemTra: '25/04/2026',
      lanKiemTra: 'Lần 1 (Đoàn HĐQT kiểm tra món vay lớn > 500tr)',
      ngayKTNext: '25/10/2026',
      hinhThuc: 'Thực địa & Thẩm tra đăng kiểm xe',
      diaDiemKT: 'Thôn 5, Xã Yên Bái',
      danhGiaMucDich: 'Đúng mục đích 100%',
      tienDoSuDungVon: 'Đã mua xe tải HOWO 8 tấn phục vụ chở nông sản',
      mucDoRuiRo: 'Thấp',
      moTaThucTe: 'Xe tải biển số 36C-458.92 đã đăng ký, đăng kiểm đầy đủ và mua bảo hiểm thân vỏ. Xe đang chạy tuyến nông sản Thanh Hóa - Hà Nội.',
      kienNghi: 'Đoàn HĐQT nhất trí nghiệm thu kết quả kiểm tra sử dụng vốn.',
      fileBienBanUrl: 'https://drive.google.com/file/d/bbkt_2026_0105/view',
      hinhAnhKiemTra: 'https://drive.google.com/drive/folders/ktv_kh007415_1',
      trangThai: 'ĐÃ_DUYỆT',
      ngayTao: '25/04/2026 16:30:00'
    },
    {
      maBBKT: 'BBKT-2026-0120',
      soHDTD: 'KU-2026-0312',
      maKH: 'KH009102',
      hoTen: 'LÊ THỊ MAI',
      loaiDoanKT: 'CBTD',
      thanhPhanDoan: 'Lê Văn Tín (CBTD)',
      ngayKiemTra: '10/05/2026',
      lanKiemTra: 'Lần 1 (Sau giải ngân 30 ngày)',
      ngayKTNext: '10/11/2026',
      hinhThuc: 'Thực địa',
      diaDiemKT: 'Thôn 1, Xã Yên Trường',
      danhGiaMucDich: 'Đúng mục đích 100%',
      tienDoSuDungVon: 'Đã hoàn thiện nhà màng 1000m2 trồng dưa lưới',
      mucDoRuiRo: 'Thấp',
      moTaThucTe: 'Nhà màng công nghệ cao đã lắp đặt hệ thống tưới nhỏ giọt Israel, cây dưa lưới đang phát triển tuần thứ 3.',
      kienNghi: 'Theo dõi tình hình thu hoạch vụ đầu tiên để dự báo dòng tiền.',
      fileBienBanUrl: 'https://drive.google.com/file/d/bbkt_2026_0120/view',
      hinhAnhKiemTra: 'https://drive.google.com/drive/folders/ktv_kh009102_1',
      trangThai: 'ĐÃ_DUYỆT',
      ngayTao: '10/05/2026 09:15:00'
    }
  ],

  debitRegistrations: [
    { maKH: 'KH008892', hoTen: 'NGUYỄN VĂN AN', gttt: '038086012345', diaChi: 'Thôn 3, Yên Thọ', soTK: '3500205123456', kyTrich: 1, trangThai: 'Hieu luc', ghiChu: 'Ủy quyền trích nợ tự động' },
    { maKH: 'KH009102', hoTen: 'LÊ THỊ MAI', gttt: '038190098765', diaChi: 'Thôn 1, Yên Trường', soTK: '3500205987654', kyTrich: 2, trangThai: 'Hieu luc', ghiChu: 'Ủy quyền trích nợ tự động' },
    { maKH: 'KH007415', hoTen: 'TRẦN VĂN QUÂN', gttt: '038079001122', diaChi: 'Thôn 5, Yên Bái', soTK: '3500205556677', kyTrich: 3, trangThai: 'Hieu luc', ghiChu: 'Ủy quyền trích nợ tự động' }
  ],

  debtWarnings: [
    { maKH: 'KH008892', soHDTD: 'KU-2025-0982', gocTon: 0, laiTon: 6500000, tongNoTon: 6500000, kyPhatSinh: 'DOT-202608-K1', trangThai: 'CHUA_THU', ngayCapNhat: '06/08/2026 09:00:00' },
    { maKH: 'KH009102', soHDTD: 'KU-2026-0312', gocTon: 0, laiTon: 6000000, tongNoTon: 6000000, kyPhatSinh: 'DOT-202608-K2', trangThai: 'CHUA_THU', ngayCapNhat: '16/08/2026 09:00:00' }
  ],

  reportsData: {
    areaData: [
      { area: 'Xã Yên Thọ (Thôn 1, 2, 3, 4)', countKH: 142, countLoans: 156, duNo: 22500000000, rate: '46.4%' },
      { area: 'Xã Yên Trường (Thôn 1, 2, 3)', countKH: 110, countLoans: 118, duNo: 16800000000, rate: '34.6%' },
      { area: 'Xã Yên Bái / Quý Lộc', countKH: 68, countLoans: 68, duNo: 9200000000, rate: '19.0%' }
    ],
    loanTypes: [
      { type: 'Nông nghiệp & Chăn nuôi', count: 184, amount: 26000000000, color: 'bg-success' },
      { type: 'Thương mại & Dịch vụ', count: 98, amount: 14500000000, color: 'bg-primary' },
      { type: 'Tiêu dùng & Đời sống', count: 60, amount: 8000000000, color: 'bg-warning' }
    ],
    totalDuNo: 48500000000
  },

  roles: [
    {
      roleCode: 'ADMIN',
      roleName: 'Quản Trị Viên Toàn Quyền',
      permissions: ['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_register', 'debit_batch', 'reconciliation', 'debt_warning', 'reports', 'user_management', 'settings'],
      description: 'Toàn quyền quản trị hệ thống và người dùng',
      updatedAt: '18/08/2026 14:00:00'
    },
    {
      roleCode: 'CBTD',
      roleName: 'Cán Bộ Tín Dụng',
      permissions: ['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_register', 'reports'],
      description: 'Thẩm định, kiểm tra vốn và theo dõi khách hàng',
      updatedAt: '18/08/2026 14:00:00'
    },
    {
      roleCode: 'KETOAN',
      roleName: 'Kế Toán Viên / Thủ Quỹ',
      permissions: ['dashboard', 'customer360', 'debit_register', 'debit_batch', 'reconciliation', 'debt_warning', 'reports'],
      description: 'Quản lý trích nợ, đối soát và sổ theo dõi nợ',
      updatedAt: '18/08/2026 14:00:00'
    },
    {
      roleCode: 'BKS',
      roleName: 'Ban Kiểm Soát',
      permissions: ['dashboard', 'customer360', 'appraisal', 'inspection', 'debt_warning', 'reports'],
      description: 'Kiểm soát, giám sát rủi ro và báo cáo',
      updatedAt: '18/08/2026 14:00:00'
    },
    {
      roleCode: 'LANHDAO',
      roleName: 'Ban Giám Đốc / HĐQT',
      permissions: ['dashboard', 'customer360', 'debt_warning', 'reports'],
      description: 'Giám sát tổng quan báo cáo và phê duyệt rủi ro',
      updatedAt: '18/08/2026 14:00:00'
    }
  ],

  users: [
    { username: 'qtdyentho.admin', passwordHash: 'ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9', fullName: 'Quản Trị Viên Hệ Thống', role: 'ADMIN', customPermissions: [], status: 'ACTIVE', createdAt: '18/08/2026 08:00:00', lastLogin: '---' },
    { username: 'qtdyentho.cbtd', passwordHash: 'ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9', fullName: 'Cán Bộ Tín Dụng', role: 'CBTD', customPermissions: [], status: 'ACTIVE', createdAt: '18/08/2026 08:00:00', lastLogin: '---' },
    { username: 'qtdyentho.ketoan', passwordHash: 'ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9', fullName: 'Kế Toán Viên', role: 'KETOAN', customPermissions: [], status: 'ACTIVE', createdAt: '18/08/2026 08:00:00', lastLogin: '---' },
    { username: 'qtdyentho.bks', passwordHash: 'ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9', fullName: 'Ban Kiểm Soát', role: 'BKS', customPermissions: [], status: 'ACTIVE', createdAt: '18/08/2026 08:00:00', lastLogin: '---' },
    { username: 'admin', passwordHash: 'ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9', fullName: 'Nguyễn Quản Trị', role: 'ADMIN', customPermissions: [], status: 'ACTIVE', createdAt: '18/08/2026 08:00:00', lastLogin: '---' },
    { username: 'cbtd', passwordHash: 'ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9', fullName: 'Lê Văn Tín', role: 'CBTD', customPermissions: [], status: 'ACTIVE', createdAt: '18/08/2026 08:00:00', lastLogin: '---' },
    { username: 'ketoan', passwordHash: 'ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9', fullName: 'Trần Thị Toán', role: 'KETOAN', customPermissions: [], status: 'ACTIVE', createdAt: '18/08/2026 08:00:00', lastLogin: '---' },
    { username: 'lanhdao', passwordHash: 'ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9', fullName: 'Phạm Giám Đốc', role: 'LANHDAO', customPermissions: [], status: 'ACTIVE', createdAt: '18/08/2026 08:00:00', lastLogin: '---' }
  ]
};
