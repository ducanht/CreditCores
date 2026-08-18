/**
 * DỊCH VỤ GIAO TIẾP DỮ LIỆU & RESILIENT API CLIENT CHO CREDITCORES
 * Hỗ trợ Dual-Mode: Live Google Apps Script API + Realistic Mock Data Fallback
 */

import { initialMockData } from './mockData.js';
import { formatDateVN, formatDateTimeVN, getTodayVN } from '../utils/dateUtils.js';

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

// Stateful Mock Database in Memory
const mockDb = JSON.parse(JSON.stringify(initialMockData));

/**
 * Resilient Network Request Wrapper with Dual-Mode Fallback
 */
async function sendRequest(action, data = null, method = 'GET') {
  const url = getGasApiUrl();

  if (url && url.startsWith('http')) {
    try {
      let fetchUrl = url;
      let options = { method: method };

      if (method === 'GET') {
        const queryParams = new URLSearchParams({ action: action });
        if (data && typeof data === 'object') {
          Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
              queryParams.append(key, data[key]);
            }
          });
        }
        fetchUrl += (fetchUrl.includes('?') ? '&' : '?') + queryParams.toString();
      } else {
        options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
        options.body = JSON.stringify({ action: action, data: data });
      }

      const res = await fetch(fetchUrl, options);
      if (res.ok) {
        const json = await res.json();
        if (json && json.status === 'error' && json.message && json.message.includes('Hành động không hợp lệ')) {
          console.warn(`[Dual-Mode Fallback] GAS chưa hỗ trợ action "${action}", chuyển sang Mock Data Handler.`);
          return handleMockFallback(action, data);
        }
        return json;
      }
    } catch (err) {
      console.warn(`[Dual-Mode Fallback] Kết nối GAS thất bại (${err.message}). Đang dùng Mock Database.`);
    }
  }

  return handleMockFallback(action, data);
}

/**
 * Local Fallback Handler
 */
function handleMockFallback(action, data) {
  switch (action) {
    case 'login': {
      const username = (data?.username || '').toLowerCase().trim();
      const user = mockDb.users.find(u => u.username.toLowerCase() === username);
      if (!user) return { status: 'error', message: 'Tên đăng nhập không tồn tại.' };
      if (user.status === 'LOCKED') return { status: 'error', message: 'Tài khoản đã bị khóa.' };
      if (user.passwordHash !== data?.passwordHash) return { status: 'error', message: 'Mật khẩu không chính xác.' };

      return {
        status: 'success',
        message: 'Đăng nhập thành công!',
        user: { username: user.username, fullName: user.fullName, role: user.role, customPermissions: user.customPermissions || [], status: user.status },
        token: 'MOCK_TOKEN_' + Date.now()
      };
    }

    case 'changePassword': {
      const u = mockDb.users.find(usr => usr.username.toLowerCase() === (data?.username || '').toLowerCase());
      if (!u) return { status: 'error', message: 'Không tìm thấy người dùng.' };
      if (u.passwordHash !== data?.oldPasswordHash) return { status: 'error', message: 'Mật khẩu cũ không đúng.' };
      u.passwordHash = data?.newPasswordHash;
      return { status: 'success', message: 'Đổi mật khẩu thành công!' };
    }

    case 'resetPassword': {
      const u = mockDb.users.find(usr => usr.username.toLowerCase() === (data?.username || '').toLowerCase());
      if (!u) return { status: 'error', message: 'Không tìm thấy người dùng.' };
      u.passwordHash = data?.newPasswordHash;
      return { status: 'success', message: 'Đã reset mật khẩu cho người dùng: ' + data?.username };
    }

    case 'getUserList':
      return { status: 'success', data: mockDb.users };

    case 'getRolesAndPermissions':
      return { status: 'success', data: mockDb.roles };

    case 'saveRolePermissions': {
      const roleCode = (data?.roleCode || '').toUpperCase().trim();
      const existing = mockDb.roles.find(r => r.roleCode === roleCode);
      if (existing) {
        existing.roleName = data.roleName || existing.roleName;
        existing.permissions = data.permissions || [];
        existing.description = data.description || '';
        existing.updatedAt = formatDateTimeVN(new Date());
      } else {
        mockDb.roles.push({
          roleCode: roleCode,
          roleName: data?.roleName || roleCode,
          permissions: data?.permissions || [],
          description: data?.description || '',
          updatedAt: formatDateTimeVN(new Date())
        });
      }
      return { status: 'success', message: 'Đã cập nhật phân quyền nhóm ' + roleCode + ' thành công!' };
    }

    case 'saveUser': {
      const username = (data?.username || '').toLowerCase().trim();
      const existing = mockDb.users.find(u => u.username.toLowerCase() === username);
      if (existing) {
        existing.fullName = data.fullName || existing.fullName;
        existing.role = data.role || existing.role;
        existing.customPermissions = data.customPermissions || [];
        existing.status = data.status || existing.status;
        if (data?.passwordHash) existing.passwordHash = data.passwordHash;
        return { status: 'success', message: 'Cập nhật tài khoản & phân quyền thành công!' };
      } else {
        mockDb.users.push({
          username: data?.username,
          passwordHash: data?.passwordHash || '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
          fullName: data?.fullName,
          role: data?.role || 'CBTD',
          customPermissions: data?.customPermissions || [],
          status: data?.status || 'ACTIVE',
          createdAt: formatDateTimeVN(new Date()),
          lastLogin: '---'
        });
        return { status: 'success', message: 'Tạo mới tài khoản thành công!' };
      }
    }

    case 'getDashboardStats':
      return { status: 'success', data: mockDb.stats };

    case 'searchCustomer360': {
      const q = (data?.query || '').toLowerCase().trim();
      const filtered = mockDb.customers.filter(c =>
        !q ||
        c.maKH.toLowerCase().includes(q) ||
        c.hoTen.toLowerCase().includes(q) ||
        c.cccd.includes(q) ||
        c.dienThoaiDD.includes(q) ||
        c.soTK.includes(q)
      );
      return { status: 'success', data: filtered };
    }

    case 'getAppraisals':
      return { status: 'success', data: mockDb.appraisals };

    case 'saveAppraisalReport': {
      const newAppr = {
        maBCTD: 'BCTD-' + Date.now(),
        ...data,
        ngayLap: formatDateVN(new Date())
      };
      mockDb.appraisals.unshift(newAppr);
      return { status: 'success', message: 'Đã lưu báo cáo thẩm định thành công!', maBCTD: newAppr.maBCTD };
    }

    case 'getInspections':
      return { status: 'success', data: mockDb.inspections };

    case 'saveLoanInspection': {
      const newInsp = {
        maBBKT: 'BBKT-' + Date.now(),
        ...data,
        ngayKiemTra: formatDateVN(new Date())
      };
      mockDb.inspections.unshift(newInsp);
      return { status: 'success', message: 'Đã lưu biên bản kiểm tra sử dụng vốn thành công!', maBBKT: newInsp.maBBKT };
    }

    case 'getDebitRegistrations':
      return { status: 'success', data: mockDb.debitRegistrations };

    case 'saveDebitRegister':
      mockDb.debitRegistrations.push(data);
      return { status: 'success', message: 'Đăng ký dịch vụ trích nợ thành công!' };

    case 'getDebitBatches':
      return { status: 'success', data: mockDb.stats.recentBatches };

    case 'createDebitBatch': {
      const newBatch = {
        maDot: `DOT-${data.thangNam}-K${data.kyTrich}`,
        thangNam: data.thangNam,
        kyTrich: Number(data.kyTrich),
        tongPhaiThu: 125000000,
        tongDaTrich: 0,
        tongConNo: 125000000,
        ngayTao: formatDateTimeVN(new Date()),
        trangThai: 'CHO_TRICH_NO'
      };
      mockDb.stats.recentBatches.unshift(newBatch);
      return { status: 'success', message: 'Khởi tạo đợt trích nợ ' + newBatch.maDot + ' thành công!', maDot: newBatch.maDot };
    }

    case 'getDebtWarnings':
      return { status: 'success', data: mockDb.debtWarnings };

    case 'getReportsData':
      return { status: 'success', data: mockDb.reportsData };

    case 'reconcileUpload':
      return {
        status: 'success',
        message: 'Đối soát hoàn tất! Đã trích thành công: 2 món, Thất bại (Nợ tồn): 2 món.',
        summary: { totalDaTrich: 17600000, totalConNo: 12500000, countSuccess: 2, countFailed: 2 }
      };

    case 'getSyncStatus':
      return {
        status: 'success',
        data: { command: 'IDLE', status: 'SUCCESS', requestTime: formatDateTimeVN(new Date()), finishTime: formatDateTimeVN(new Date()), totalRows: 342, message: 'Hệ thống vận hành bình thường.' }
      };

    case 'triggerSqlSync':
      return { status: 'success', message: 'Đã gửi lệnh SYNC_DATA tới Hàng đợi Lệnh Core Server!' };

    default:
      return { status: 'error', message: 'Hành động không xác định: ' + action };
  }
}

export const api = {
  getDashboardStats: () => sendRequest('getDashboardStats'),
  searchCustomer360: (query) => sendRequest('searchCustomer360', { query }),
  getAppraisals: () => sendRequest('getAppraisals'),
  saveAppraisalReport: (data) => sendRequest('saveAppraisalReport', data, 'POST'),
  getInspections: () => sendRequest('getInspections'),
  saveLoanInspection: (data) => sendRequest('saveLoanInspection', data, 'POST'),
  getDebitRegistrations: () => sendRequest('getDebitRegistrations'),
  saveDebitRegister: (data) => sendRequest('saveDebitRegister', data, 'POST'),
  getDebitBatches: () => sendRequest('getDebitBatches'),
  createDebitBatch: (data) => sendRequest('createDebitBatch', data, 'POST'),
  getDebtWarnings: () => sendRequest('getDebtWarnings'),
  getReportsData: () => sendRequest('getReportsData'),
  reconcileUpload: (data) => sendRequest('reconcileUpload', data, 'POST'),
  getSyncStatus: () => sendRequest('getSyncStatus'),
  triggerSqlSync: () => sendRequest('triggerSqlSync', {}, 'POST'),
  login: (credentials) => sendRequest('login', credentials, 'POST'),
  changePassword: (data) => sendRequest('changePassword', data, 'POST'),
  resetPassword: (data) => sendRequest('resetPassword', data, 'POST'),
  getUserList: () => sendRequest('getUserList'),
  saveUser: (data) => sendRequest('saveUser', data, 'POST'),
  getRolesAndPermissions: () => sendRequest('getRolesAndPermissions'),
  saveRolePermissions: (data) => sendRequest('saveRolePermissions', data, 'POST'),
  getModuleRegistry: () => sendRequest('getModuleRegistry')
};
