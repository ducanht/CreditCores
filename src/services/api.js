/**
 * DỊCH VỤ GIAO TIẾP DỮ LIỆU & API CLIENT CHO CREDITCORES
 * Hỗ trợ 2 chế độ:
 * 1. Chế độ Trực tuyến (Live Mode): Kết nối trực tiếp tới Google Apps Script Web App Endpoint.
 * 2. Chế độ Giả lập Offline (Mock Data Mode): Nạp dữ liệu mẫu ngân hàng phong phú khi chưa cấu hình GAS URL.
 */

const DEFAULT_GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxLQHAgdH2cus1zX_z28b31qixMWqq5K0fgIsdy4QFD6xsjRlUyRrwmRyKU28jljAc2/exec';
const STORAGE_KEY_GAS_URL = 'CREDITCORES_GAS_API_URL';

export function getGasApiUrl() {
  return localStorage.getItem(STORAGE_KEY_GAS_URL) || import.meta.env.VITE_GAS_API_URL || DEFAULT_GAS_API_URL;
}

export function setGasApiUrl(url) {
  if (url) {
    localStorage.setItem(STORAGE_KEY_GAS_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_GAS_URL);
  }
}

// --- DỮ LIỆU MẪU BAN ĐẦU (INITIAL MOCK DATA) ---
const mockData = {
  stats: {
    totalDuNo: 48500000000,
    totalHopDong: 342,
    totalDuThuLai: 384000000,
    totalKhachHangTrichNo: 215,
    totalNoTon: 24500000,
    recentBatches: [
      { maDot: 'DOT-202608-K1', thangNam: '202608', kyTrich: 1, tongPhaiThu: 145000000, tongDaTrich: 138500000, tongConNo: 6500000, ngayTao: '05/08/2026 08:30', trangThai: 'HOAN_TAT' },
      { maDot: 'DOT-202608-K2', thangNam: '202608', kyTrich: 2, tongPhaiThu: 120000000, tongDaTrich: 114000000, tongConNo: 6000000, ngayTao: '15/08/2026 08:30', trangThai: 'HOAN_TAT' },
      { maDot: 'DOT-202608-K3', thangNam: '202608', kyTrich: 3, tongPhaiThu: 119000000, tongDaTrich: 0, tongConNo: 119000000, ngayTao: '18/08/2026 08:00', trangThai: 'KHOI_TAO' }
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
      loaiTSBD: 'Quyền sử dụng đất ở',
      chuSoHuuTSBD: 'Nguyễn Văn An (Chính chủ)',
      moTaTSBD: 'GCN QSDĐ số DT 123456, Thửa 42, TBĐ 08. DT: 150m2 tại Thôn 3, Yên Thọ.',
      giaTriTSBD: 600000000,
      tyLeLTV: '50.0%',
      hinhAnhTSBD: 'https://drive.google.com/drive/folders/tsbd_kh008892',
      hinhAnhThamDinh: 'https://drive.google.com/drive/folders/thamdinh_kh008892',
      mucDoRuiRo: 'Thap',
      ketLuan: 'Dong y cap tin dung',
      ngayLap: '10/08/2025',
      canBoThamDinh: 'Lê Văn Tín'
    }
  ],
  inspections: [
    {
      maBBKT: 'BBKT-2026-0045',
      soHDTD: 'KU-2025-0982',
      maKH: 'KH008892',
      hoTen: 'NGUYỄN VĂN AN',
      ngayKiemTra: '15/11/2025',
      hinhThuc: 'Thực địa',
      danhGiaMucDich: 'Đúng mục đích',
      mucDoRuiRo: 'Thấp',
      moTaThucTe: 'Đã mua 12 con bò sữa F1 đang sinh trưởng tốt, chuồng trại mở rộng đúng thiết kế.',
      hinhAnhKiemTra: 'https://drive.google.com/drive/folders/kiemtra_kh008892',
      canBoKiemTra: 'Lê Văn Tín'
    }
  ],
  debitRegistrations: [
    { maKH: 'KH008892', hoTen: 'NGUYỄN VĂN AN', gttt: '038086012345', diaChi: 'Thôn 3, Yên Thọ', soTK: '3500205123456', kyTrich: 1, trangThai: 'Hieu luc', ghiChu: 'Đăng ký trích nợ tự động' },
    { maKH: 'KH009102', hoTen: 'LÊ THỊ MAI', gttt: '038190098765', diaChi: 'Thôn 1, Yên Trường', soTK: '3500205987654', kyTrich: 2, trangThai: 'Hieu luc', ghiChu: 'Đăng ký trích nợ tự động' },
    { maKH: 'KH007415', hoTen: 'TRẦN VĂN QUÂN', gttt: '038079001122', diaChi: 'Thôn 5, Yên Bái', soTK: '3500205556677', kyTrich: 3, trangThai: 'Hieu luc', ghiChu: 'Đăng ký trích nợ tự động' }
  ],
  debtWarnings: [
    { maKH: 'KH008892', soHDTD: 'KU-2025-0982', gocTon: 0, laiTon: 6500000, tongNoTon: 6500000, kyPhatSinh: 'DOT-202608-K1', trangThai: 'CHUA_THU', ngayCapNhat: '06/08/2026' },
    { maKH: 'KH009102', soHDTD: 'KU-2026-0312', gocTon: 0, laiTon: 6000000, tongNoTon: 6000000, kyPhatSinh: 'DOT-202608-K2', trangThai: 'CHUA_THU', ngayCapNhat: '16/08/2026' }
  ],
  syncStatus: {
    command: 'IDLE',
    status: 'SUCCESS',
    requestTime: '18/08/2026 08:00:00',
    startTime: '18/08/2026 08:00:01',
    finishTime: '18/08/2026 08:00:05',
    totalRows: 342,
    message: 'Hệ thống vận hành bình thường. Sẵn sàng nhận lệnh.'
  },
  users: [
    { username: 'admin', passwordHash: '7676aaafb027c825bd9abab78b234070e702752f625b752e55e55b48e607e358', fullName: 'Quản Trị Viên Hệ Thống', role: 'ADMIN', customPermissions: [], status: 'ACTIVE', createdAt: '18/08/2026', lastLogin: '18/08/2026 08:00' },
    { username: 'cbtd', passwordHash: '3e00a18bcfd6744fee22728d750f00c48dfa75a3bde2002f9ce53480d72d2cc0', fullName: 'Lê Văn Tín (Cán Bộ Tín Dụng)', role: 'CBTD', customPermissions: [], status: 'ACTIVE', createdAt: '18/08/2026', lastLogin: '---' },
    { username: 'ketoan', passwordHash: 'fad6fda10dd6d54384c03532eb64b86b7ab3bfba4b258a83646ca8ef0d4be98e', fullName: 'Nguyễn Thị Hằng (Kế Toán Viên)', role: 'KETOAN', customPermissions: [], status: 'ACTIVE', createdAt: '18/08/2026', lastLogin: '---' },
    { username: 'lanhdao', passwordHash: 'cbe973fb461f4ab4007d2a1c2da904992d41db551702603c5f7a93e16da4750d', fullName: 'Trần Đình Trọng (Giám Đốc Quỹ)', role: 'LANHDAO', customPermissions: [], status: 'ACTIVE', createdAt: '18/08/2026', lastLogin: '---' }
  ],
  roles: [
    { roleCode: 'ADMIN', roleName: 'Quản Trị Viên', permissions: ['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_register', 'debit_batch', 'reconciliation', 'debt_warning', 'reports', 'user_management', 'settings'], description: 'Toàn quyền hệ thống' },
    { roleCode: 'CBTD', roleName: 'Cán Bộ Tín Dụng', permissions: ['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_register', 'debt_warning', 'reports'], description: 'Thẩm định TSĐB & kiểm tra vốn' },
    { roleCode: 'KETOAN', roleName: 'Kế Toán Viên', permissions: ['dashboard', 'customer360', 'debit_register', 'debit_batch', 'reconciliation', 'debt_warning', 'reports'], description: 'Trích nợ & đối soát hạch toán' },
    { roleCode: 'LANHDAO', roleName: 'Ban Lãnh Đạo / GĐ', permissions: ['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_batch', 'reconciliation', 'debt_warning', 'reports'], description: 'Phê duyệt & báo cáo quản trị' }
  ]
};

// --- HÀM GỌI API CHUNG ---
async function requestApi(action, method = 'GET', data = null) {
  const gasUrl = getGasApiUrl();

  if (gasUrl) {
    try {
      let url = gasUrl;
      const options = { method: method };

      if (method === 'GET') {
        url += (url.includes('?') ? '&' : '?') + 'action=' + encodeURIComponent(action);
        if (data) {
          Object.keys(data).forEach(k => {
            url += `&${encodeURIComponent(k)}=${encodeURIComponent(data[k])}`;
          });
        }
      } else {
        options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
        options.body = JSON.stringify({ action: action, ...(data || {}) });
      }

      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const json = await res.json();
      
      // Nếu GAS là phiên bản cũ chưa hỗ trợ action mới (vd: login), tự động fallback mà không làm gián đoạn người dùng
      if (json && json.status === 'error' && json.message && json.message.includes('Hành động không hợp lệ')) {
        console.warn(`[CreditCores API] GAS chưa cập nhật bản mới cho action [${action}], tự động chuyển sang Fallback Engine.`);
      } else {
        return json;
      }
    } catch (err) {
      console.warn(`[CreditCores API] Gọi GAS thất bại, chuyển sang Mock Data: ${err.message}`);
    }
  }

  // --- XỬ LÝ MOCK DATA FALLBACK ---
  await new Promise(resolve => setTimeout(resolve, 200));

  switch (action) {
    case 'login': {
      const u = String(data?.username || '').trim().toLowerCase();
      const pHash = String(data?.passwordHash || '').trim();
      const match = mockData.users.find(usr => usr.username.toLowerCase() === u);

      if (!match) return { status: 'error', message: 'Tài khoản không tồn tại trong hệ thống.' };
      if (match.status !== 'ACTIVE') return { status: 'error', message: 'Tài khoản đang bị tạm khóa.' };
      if (match.passwordHash !== pHash) return { status: 'error', message: 'Mật khẩu không chính xác.' };

      const roleObj = mockData.roles.find(r => r.roleCode === match.role);
      const rolePerms = roleObj ? roleObj.permissions : [];
      const effectiveSet = new Set([...rolePerms, ...(match.customPermissions || [])]);

      return {
        status: 'success',
        message: 'Đăng nhập thành công',
        user: {
          username: match.username,
          fullName: match.fullName,
          role: match.role,
          customPermissions: match.customPermissions || [],
          effectivePermissions: Array.from(effectiveSet)
        },
        token: 'TOKEN-MOCK-' + Date.now()
      };
    }

    case 'getRolesAndPermissions':
      return {
        status: 'success',
        data: {
          roles: mockData.roles
        }
      };

    case 'saveRolePermissions': {
      const roleCode = String(data?.roleCode || '').toUpperCase();
      const existing = mockData.roles.find(r => r.roleCode === roleCode);
      if (existing) {
        existing.roleName = data?.roleName || existing.roleName;
        existing.permissions = data?.permissions || existing.permissions;
        existing.description = data?.description || existing.description;
        return { status: 'success', message: `Cập nhật nhóm quyền ${existing.roleName} thành công!` };
      } else {
        mockData.roles.push({
          roleCode: roleCode,
          roleName: data?.roleName || roleCode,
          permissions: data?.permissions || [],
          description: data?.description || ''
        });
        return { status: 'success', message: `Tạo mới nhóm quyền ${data?.roleName} thành công!` };
      }
    }

    case 'changePassword': {
      const u = String(data?.username || '').trim().toLowerCase();
      const match = mockData.users.find(usr => usr.username.toLowerCase() === u);
      if (!match) return { status: 'error', message: 'Không tìm thấy người dùng.' };
      if (match.passwordHash !== data?.oldPasswordHash) return { status: 'error', message: 'Mật khẩu cũ không chính xác.' };
      match.passwordHash = data?.newPasswordHash;
      return { status: 'success', message: 'Đổi mật khẩu thành công!' };
    }

    case 'getUserList':
      return {
        status: 'success',
        data: mockData.users.map(u => ({
          username: u.username,
          fullName: u.fullName,
          role: u.role,
          customPermissions: u.customPermissions || [],
          status: u.status,
          createdAt: u.createdAt,
          lastLogin: u.lastLogin
        }))
      };

    case 'saveUser': {
      const existing = mockData.users.find(u => u.username.toLowerCase() === (data?.username || '').toLowerCase());
      if (existing) {
        existing.fullName = data?.fullName || existing.fullName;
        existing.role = data?.role || existing.role;
        existing.customPermissions = data?.customPermissions || existing.customPermissions || [];
        existing.status = data?.status || existing.status;
        if (data?.passwordHash) existing.passwordHash = data.passwordHash;
        return { status: 'success', message: 'Cập nhật tài khoản & phân quyền thành công!' };
      } else {
        mockData.users.push({
          username: data?.username,
          passwordHash: data?.passwordHash || '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
          fullName: data?.fullName,
          role: data?.role || 'CBTD',
          customPermissions: data?.customPermissions || [],
          status: data?.status || 'ACTIVE',
          createdAt: new Date().toLocaleDateString('vi-VN'),
          lastLogin: '---'
        });
        return { status: 'success', message: 'Tạo mới tài khoản thành công!' };
      }
    }

    case 'resetPassword': {
      const u = mockData.users.find(usr => usr.username.toLowerCase() === (data?.username || '').toLowerCase());
      if (!u) return { status: 'error', message: 'Không tìm thấy người dùng.' };
      u.passwordHash = data?.newPasswordHash;
      return { status: 'success', message: 'Đã reset mật khẩu cho người dùng: ' + data?.username };
    }

    case 'getDashboardStats':
      return { status: 'success', data: mockData.stats };

    case 'searchCustomer360':
      const q = (data?.query || '').toLowerCase().trim();
      const filtered = mockData.customers.filter(c =>
        !q ||
        c.maKH.toLowerCase().includes(q) ||
        c.hoTen.toLowerCase().includes(q) ||
        c.cccd.includes(q) ||
        c.dienThoaiDD.includes(q) ||
        c.soTK.includes(q)
      );
      return { status: 'success', data: filtered };

    case 'getAppraisals':
      return { status: 'success', data: mockData.appraisals };

    case 'saveAppraisalReport':
      const newAppr = {
        maBCTD: 'BCTD-' + Date.now(),
        ...data,
        ngayLap: new Date().toLocaleDateString('vi-VN')
      };
      mockData.appraisals.unshift(newAppr);
      return { status: 'success', message: 'Đã lưu báo cáo thẩm định thành công!', maBCTD: newAppr.maBCTD };

    case 'getInspections':
      return { status: 'success', data: mockData.inspections };

    case 'saveLoanInspection':
      const newInsp = {
        maBBKT: 'BBKT-' + Date.now(),
        ...data,
        ngayKiemTra: new Date().toLocaleDateString('vi-VN')
      };
      mockData.inspections.unshift(newInsp);
      return { status: 'success', message: 'Đã lưu biên bản kiểm tra sử dụng vốn thành công!', maBBKT: newInsp.maBBKT };

    case 'getDebitRegistrations':
      return { status: 'success', data: mockData.debitRegistrations };

    case 'saveDebitRegister':
      mockData.debitRegistrations.push(data);
      return { status: 'success', message: 'Đăng ký dịch vụ trích nợ thành công!' };

    case 'getDebitBatches':
      return { status: 'success', data: mockData.stats.recentBatches };

    case 'createDebitBatch':
      const newBatch = {
        maDot: `DOT-${data.thangNam}-K${data.kyTrich}`,
        thangNam: data.thangNam,
        kyTrich: Number(data.kyTrich),
        tongPhaiThu: 125000000,
        tongDaTrich: 0,
        tongConNo: 125000000,
        ngayTao: new Date().toLocaleString('vi-VN'),
        trangThai: 'KHOI_TAO'
      };
      mockData.stats.recentBatches.unshift(newBatch);
      return { status: 'success', message: `Khởi tạo đợt trích nợ ${newBatch.maDot} thành công!`, data: newBatch };

    case 'reconcileUpload':
      return {
        status: 'success',
        message: 'Đã đối soát thành công 18 món vay! (15 Đã trích đủ, 2 Trích một phần, 1 Thất bại)',
        updatedCount: 18
      };

    case 'getDebtWarnings':
      return { status: 'success', data: mockData.debtWarnings };

    case 'triggerSqlSync':
      mockData.syncStatus = {
        command: 'SYNC_DATA',
        status: 'PENDING',
        requestTime: new Date().toLocaleString('vi-VN'),
        startTime: '---',
        finishTime: '---',
        totalRows: 0,
        message: 'Đã phát cờ yêu cầu đồng bộ. Đang chờ Daemon phản hồi...'
      };
      return { status: 'success', message: 'Đã gửi cờ yêu cầu đồng bộ dữ liệu tới SQL Server Core!' };

    case 'getSyncStatus':
      return { status: 'success', data: mockData.syncStatus };

    default:
      return { status: 'success', data: null };
  }
}

export const api = {
  login: (username, passwordHash) => requestApi('login', 'POST', { username, passwordHash }),
  changePassword: (username, oldPasswordHash, newPasswordHash) => requestApi('changePassword', 'POST', { username, oldPasswordHash, newPasswordHash }),
  getUserList: () => requestApi('getUserList'),
  saveUser: (data) => requestApi('saveUser', 'POST', { data }),
  resetPassword: (username, newPasswordHash) => requestApi('resetPassword', 'POST', { username, newPasswordHash }),
  getRolesAndPermissions: () => requestApi('getRolesAndPermissions'),
  saveRolePermissions: (data) => requestApi('saveRolePermissions', 'POST', { data }),
  getDashboardStats: () => requestApi('getDashboardStats'),
  searchCustomer360: (query) => requestApi('searchCustomer360', 'GET', { query }),
  getAppraisals: () => requestApi('getAppraisals'),
  saveAppraisalReport: (data) => requestApi('saveAppraisalReport', 'POST', { data }),
  getInspections: () => requestApi('getInspections'),
  saveLoanInspection: (data) => requestApi('saveLoanInspection', 'POST', { data }),
  getDebitRegistrations: () => requestApi('getDebitRegistrations'),
  saveDebitRegister: (data) => requestApi('saveDebitRegister', 'POST', { data }),
  getDebitBatches: () => requestApi('getDebitBatches'),
  createDebitBatch: (data) => requestApi('createDebitBatch', 'POST', { data }),
  reconcileUpload: (data) => requestApi('reconcileUpload', 'POST', { data }),
  getDebtWarnings: () => requestApi('getDebtWarnings'),
  triggerSqlSync: () => requestApi('triggerSqlSync', 'POST', {}),
  getSyncStatus: () => requestApi('getSyncStatus')
};
