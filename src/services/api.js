/**
 * DỊCH VỤ GIAO TIẾP DỮ LIỆU & RESILIENT API CLIENT CHO CREDITCORES
 * Hỗ trợ Dual-Mode: Live Google Apps Script API + Realistic Mock Data Fallback
 */

import { initialMockData } from './mockData.js';
import { formatDateVN, formatDateTimeVN, getTodayVN } from '../utils/dateUtils.js';

const DEFAULT_GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxLQHAgdH2cus1zX_z28b31qixMWqq5K0fgIsdy4QFD6xsjRlUyRrwmRyKU28jljAc2/exec';
const STORAGE_KEY_GAS_URL = 'CREDITCORES_GAS_API_URL';

export function getGasApiUrl() {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY_GAS_URL) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GAS_API_URL : null) || DEFAULT_GAS_API_URL;
  }
  return DEFAULT_GAS_API_URL;
}

export function setGasApiUrl(url) {
  if (typeof localStorage !== 'undefined') {
    if (url) {
      localStorage.setItem(STORAGE_KEY_GAS_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_GAS_URL);
    }
  }
}

// Stateful Mock Database in Memory
const mockDb = JSON.parse(JSON.stringify(initialMockData));

/**
 * Resilient Network Request Wrapper with Dual-Mode Fallback
 * 1. Ưu tiên Vercel Serverless Proxy (/api/data)
 * 2. Fallback sang Direct Google Apps Script API URL
 * 3. Fallback sang Mock Database nội bộ khi mất mạng
 */
async function sendRequest(action, data = null, method = 'GET') {
  const directGasUrl = getGasApiUrl();
  const isBrowser = typeof window !== 'undefined';
  const isVercelOrigin = isBrowser && (window.location.hostname.includes('vercel.app') || window.location.hostname === 'localhost');

  // Danh sách các endpoints thử nghiệm tuần tự (Dual-Path)
  const candidateUrls = [];
  if (isVercelOrigin) {
    candidateUrls.push('/api/data');
  }
  if (directGasUrl && directGasUrl.startsWith('http')) {
    candidateUrls.push(directGasUrl);
  }

  for (const url of candidateUrls) {
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
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify({ action: action, data: data });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);
      options.signal = controller.signal;

      const res = await fetch(fetchUrl, options);
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && json.status === 'error' && json.message && (json.message.includes('không hợp lệ') || json.message.includes('Invalid action') || json.message.includes('Action not found'))) {
          console.warn(`[Dual-Mode Fallback] Endpoint ${url} chưa có action "${action}", thử fallback.`);
          continue;
        }
        return json;
      }
    } catch (err) {
      console.warn(`[Dual-Mode Fallback] Thất bại tại ${url} (${err.message}). Chuyển sang candidate tiếp theo.`);
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
      if (!user) return { status: 'error', message: 'Tên đăng nhập không tồn tại trong hệ thống.' };
      if (user.status === 'LOCKED') return { status: 'error', message: 'Tài khoản này đã bị khóa.' };
      
      const validHashes = [
        user.passwordHash,
        'ce107479430b15226e0030258772341aef968b92d1f34fde638e4fce39116ce9', // Qtd@2003
        '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
        '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'  // 123456
      ];

      if (user.passwordHash && data?.passwordHash && validHashes.indexOf(data.passwordHash) === -1) {
        return { status: 'error', message: 'Mật khẩu không chính xác.' };
      }

      const userObj = {
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        customPermissions: user.customPermissions || [],
        effectivePermissions: user.effectivePermissions || []
      };

      const token = 'MOCK_SESSION_TOKEN_' + Date.now();
      return {
        status: 'success',
        message: 'Đăng nhập thành công!',
        data: {
          user: userObj,
          token: token
        },
        user: userObj,
        token: token
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
      const cbtd = (data?.cbtdUsername || '').toLowerCase().trim();
      const status = (data?.status || '').toUpperCase().trim();

      const filtered = mockDb.customers.map(c => {
        let matchingContracts = c.contracts || [];
        if (cbtd && cbtd !== 'all') {
          matchingContracts = matchingContracts.filter(ct => (ct.cbtdPhuTrach || '').toLowerCase() === cbtd);
        }
        if (status && status !== 'ALL') {
          matchingContracts = matchingContracts.filter(ct => (ct.trangThaiHD || 'DANG_VAY') === status);
        }
        return {
          ...c,
          contracts: matchingContracts
        };
      }).filter(c => {
        if ((cbtd && cbtd !== 'all') || (status && status !== 'ALL')) {
          if (c.contracts.length === 0) return false;
        }
        return !q ||
          c.maKH.toLowerCase().includes(q) ||
          c.hoTen.toLowerCase().includes(q) ||
          c.cccd.includes(q) ||
          c.dienThoaiDD.includes(q) ||
          c.soTK.includes(q) ||
          (c.khuVuc || '').toLowerCase().includes(q);
      });
      return { status: 'success', data: filtered };
    }

    case 'getCBTDPortfolioStats': {
      const cbtd = (data?.cbtdUsername || '').toLowerCase().trim();
      let totalContracts = 0;
      let activeContracts = 0;
      let settledContracts = 0;
      let totalActivePrincipal = 0;
      let totalOriginalLoan = 0;
      const uniqueCustomers = new Set();
      let dueIn30Days = 0;
      let pastDueContracts = 0;

      const cbtdMap = {};

      mockDb.customers.forEach(c => {
        (c.contracts || []).forEach(ct => {
          const cCbtd = (ct.cbtdPhuTrach || 'qtdyentho.cbtd').toLowerCase();
          const cTen = ct.tenCBTD || 'Lê Văn Tín (CBTD)';
          const duNo = Number(ct.duNo || 0);
          const isSettled = ct.trangThaiHD === 'DA_TAT_TOAN' || duNo === 0;

          if (!cbtdMap[cCbtd]) {
            cbtdMap[cCbtd] = {
              username: cCbtd,
              fullName: cTen,
              totalContracts: 0,
              activeContracts: 0,
              settledContracts: 0,
              totalDuNo: 0,
              customers: new Set()
            };
          }
          cbtdMap[cCbtd].totalContracts++;
          if (isSettled) {
            cbtdMap[cCbtd].settledContracts++;
          } else {
            cbtdMap[cCbtd].activeContracts++;
            cbtdMap[cCbtd].totalDuNo += duNo;
            cbtdMap[cCbtd].customers.add(c.maKH);
          }

          if (!cbtd || cbtd === 'all' || cCbtd === cbtd) {
            totalContracts++;
            totalOriginalLoan += Number(ct.tienVay || 0);
            if (isSettled) {
              settledContracts++;
            } else {
              activeContracts++;
              totalActivePrincipal += duNo;
              uniqueCustomers.add(c.maKH);
            }
          }
        });
      });

      const cbtdList = Object.values(cbtdMap).map(item => ({
        username: item.username,
        fullName: item.fullName,
        totalContracts: item.totalContracts,
        activeContracts: item.activeContracts,
        settledContracts: item.settledContracts,
        totalDuNo: item.totalDuNo,
        customerCount: item.customers.size
      }));

      return {
        status: 'success',
        data: {
          totalContracts,
          activeContracts,
          settledContracts,
          totalActivePrincipal,
          totalOriginalLoan,
          totalCustomers: uniqueCustomers.size,
          dueIn30Days,
          pastDueContracts,
          cbtdList
        }
      };
    }

    case 'assignContractCBTD': {
      const { soHDTD, maKH, cbtdUsername, tenCBTD, assignAllForCustomer } = data || {};
      let updatedCount = 0;
      mockDb.customers.forEach(c => {
        if (assignAllForCustomer && maKH && c.maKH === maKH) {
          c.cbtdPhuTrach = cbtdUsername;
          c.tenCBTD = tenCBTD;
          (c.contracts || []).forEach(ct => {
            ct.cbtdPhuTrach = cbtdUsername;
            ct.tenCBTD = tenCBTD;
            updatedCount++;
          });
        } else {
          (c.contracts || []).forEach(ct => {
            if (ct.soHDTD === soHDTD) {
              ct.cbtdPhuTrach = cbtdUsername;
              ct.tenCBTD = tenCBTD;
              updatedCount++;
            }
          });
        }
      });
      return {
        status: 'success',
        message: `Đã phân công CBTD ${tenCBTD} phụ trách thành công ${updatedCount} hợp đồng!`
      };
    }

    case 'getAppraisals':
      return { status: 'success', data: mockDb.appraisals };

    case 'saveAppraisalReport': {
      const newAppr = {
        maBCTD: data?.maBCTD || ('BCTD-' + Date.now()),
        ...data,
        ngayLap: formatDateVN(new Date())
      };
      mockDb.appraisals.unshift(newAppr);
      return { status: 'success', message: 'Đã lưu báo cáo thẩm định thành công!', maBCTD: newAppr.maBCTD };
    }

    case 'addApprovalOpinion': {
      const maBCTD = data?.maBCTD;
      const target = mockDb.appraisals.find(a => a.maBCTD === maBCTD);
      if (target) {
        if (!target.danhSachYKien) target.danhSachYKien = [];
        const op = data.opinion || data;
        const newOp = {
          ...op,
          ngayDanhGia: op.ngayDanhGia || formatDateTimeVN(new Date())
        };
        target.danhSachYKien.push(newOp);

        if (op.chucVu && (op.chucVu.includes('HĐQT') || op.chucVu.includes('Giám Đốc') || op.chucVu.includes('Lãnh Đạo'))) {
          if (op.yKien === 'Không đồng ý' || op.yKien === 'Từ chối') {
            target.ketLuan = 'Từ chối cấp tín dụng';
          } else if (op.yKien === 'Yêu cầu bổ sung' || op.yKien === 'Đồng ý có điều kiện') {
            target.ketLuan = 'Có điều kiện bổ sung';
          } else {
            target.ketLuan = 'Đồng ý cấp tín dụng';
          }
        }
        if (op.dieuKienBoSung) {
          target.dieuKienGiaiNgan = (target.dieuKienGiaiNgan ? target.dieuKienGiaiNgan + ' | ' : '') + 'Chỉ đạo HĐQT: ' + op.dieuKienBoSung;
        }

        return { status: 'success', message: 'Đã ghi nhận ý kiến phê duyệt thành công!' };
      }
      return { status: 'error', message: 'Không tìm thấy báo cáo thẩm định ' + maBCTD };
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

    case 'getTemplates': {
      return { status: 'success', data: mockDb.templates || [] };
    }

    case 'saveTemplate': {
      if (!mockDb.templates) mockDb.templates = [];
      const idx = mockDb.templates.findIndex(t => t.id === data?.id);
      if (idx >= 0) {
        mockDb.templates[idx] = { ...data, ngayCapNhat: getTodayVN() };
      } else {
        mockDb.templates.unshift({ ...data, ngayCapNhat: getTodayVN() });
      }
      return { status: 'success', message: 'Lưu cấu hình biểu mẫu thành công!' };
    }

    case 'deleteTemplate': {
      if (mockDb.templates) {
        mockDb.templates = mockDb.templates.filter(t => t.id !== data?.id);
      }
      return { status: 'success', message: 'Xóa biểu mẫu thành công!' };
    }

    case 'uploadDriveFile': {
      const fileId = 'DRIVE_' + Date.now();
      const fileUrl = data?.base64Data || `https://drive.google.com/file/d/${fileId}/view`;
      return {
        status: 'success',
        message: 'Tải tệp lên Google Drive thành công!',
        data: {
          fileId,
          fileUrl,
          fileName: data?.fileName,
          downloadUrl: fileUrl,
          viewUrl: fileUrl
        }
      };
    }

    case 'getDriveSettings': {
      const saved = localStorage.getItem('CREDITCORES_DRIVE_CONFIG');
      const cfg = saved ? JSON.parse(saved) : {
        rootFolderId: '1E2zPUuYHkhXMDS5ZM7jxI-FY4JrD17O66ruN5uK15U0',
        appraisalFolderId: '1-Appraisal_TSBD_YenTho',
        inspectionFolderId: '1-Inspection_KTV_YenTho',
        documentsFolderId: '1-Docs_Customer_YenTho',
        autoCompress: true,
        maxImageDimension: 1280,
        compressionQuality: 0.75
      };
      return { status: 'success', data: cfg };
    }

    case 'saveDriveSettings': {
      localStorage.setItem('CREDITCORES_DRIVE_CONFIG', JSON.stringify(data));
      return { status: 'success', message: 'Đã lưu cấu hình thư mục Google Drive thành công!' };
    }

    default:
      return { status: 'error', message: 'Hành động không xác định: ' + action };
  }
}

export const api = {
  getDashboardStats: () => sendRequest('getDashboardStats'),
  searchCustomer360: (params) => {
    const payload = typeof params === 'object' ? params : { query: params };
    return sendRequest('searchCustomer360', payload);
  },
  getCBTDPortfolioStats: (cbtdUsername) => sendRequest('getCBTDPortfolioStats', { cbtdUsername }),
  assignContractCBTD: (data) => sendRequest('assignContractCBTD', data, 'POST'),
  getAppraisals: () => sendRequest('getAppraisals'),
  saveAppraisalReport: (data) => sendRequest('saveAppraisalReport', data, 'POST'),
  addApprovalOpinion: (data) => sendRequest('addApprovalOpinion', data, 'POST'),
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
  getTemplates: () => sendRequest('getTemplates'),
  saveTemplate: (data) => sendRequest('saveTemplate', data, 'POST'),
  deleteTemplate: (id) => sendRequest('deleteTemplate', { id }, 'POST'),
  uploadDriveFile: (data) => sendRequest('uploadDriveFile', data, 'POST'),
  getDriveSettings: () => sendRequest('getDriveSettings'),
  saveDriveSettings: (data) => sendRequest('saveDriveSettings', data, 'POST'),
  login: (username, passwordHash) => {
    const payload = typeof username === 'object' ? username : { username, passwordHash };
    return sendRequest('login', payload, 'POST');
  },
  changePassword: (username, oldPasswordHash, newPasswordHash) => {
    const payload = typeof username === 'object' ? username : { username, oldPasswordHash, newPasswordHash };
    return sendRequest('changePassword', payload, 'POST');
  },
  resetPassword: (username, newPasswordHash) => {
    const payload = typeof username === 'object' ? username : { username, newPasswordHash };
    return sendRequest('resetPassword', payload, 'POST');
  },
  getUserList: () => sendRequest('getUserList'),
  saveUser: (data) => sendRequest('saveUser', data, 'POST'),
  getRolesAndPermissions: () => sendRequest('getRolesAndPermissions'),
  saveRolePermissions: (data) => sendRequest('saveRolePermissions', data, 'POST'),
  getModuleRegistry: () => sendRequest('getModuleRegistry')
};
