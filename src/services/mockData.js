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
      maBBKT: 'BBKT-2026-0042',
      soHDTD: 'KU-2025-0982',
      maKH: 'KH008892',
      hoTen: 'NGUYỄN VĂN AN',
      ngayKiemTra: '15/09/2025',
      hinhThuc: 'Thực địa',
      danhGiaMucDich: 'Đúng mục đích',
      mucDoRuiRo: 'Thấp',
      moTaThucTe: 'Đã đầu tư mua thêm 6 con bò sữa giống Pháp, chuồng trại mở rộng 80m2 đạt chuẩn.',
      hinhAnhKiemTra: 'https://drive.google.com/drive/folders/ktv_kh008892_1',
      canBoKiemTra: 'Lê Văn Tín'
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
      roleCode: 'LANHDAO',
      roleName: 'Ban Giám Đốc / HĐQT',
      permissions: ['dashboard', 'customer360', 'debt_warning', 'reports'],
      description: 'Giám sát tổng quan báo cáo và phê duyệt rủi ro',
      updatedAt: '18/08/2026 14:00:00'
    }
  ],

  users: [
    { username: 'admin', passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', fullName: 'Nguyễn Quản Trị', role: 'ADMIN', customPermissions: [], status: 'ACTIVE', createdAt: '18/08/2026 08:00:00', lastLogin: '---' },
    { username: 'cbtd', passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', fullName: 'Lê Văn Tín', role: 'CBTD', customPermissions: [], status: 'ACTIVE', createdAt: '18/08/2026 08:00:00', lastLogin: '---' },
    { username: 'ketoan', passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', fullName: 'Trần Thị Toán', role: 'KETOAN', customPermissions: [], status: 'ACTIVE', createdAt: '18/08/2026 08:00:00', lastLogin: '---' },
    { username: 'lanhdao', passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', fullName: 'Phạm Giám Đốc', role: 'LANHDAO', customPermissions: [], status: 'ACTIVE', createdAt: '18/08/2026 08:00:00', lastLogin: '---' }
  ]
};
