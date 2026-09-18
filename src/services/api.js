/**
 * DỊCH VỤ GIAO TIẾP DỮ LIỆU & RESILIENT HIGH-PERFORMANCE API CLIENT CHO CREDITCORES
 * Kết nối trực tiếp 100% Live Google Apps Script API & Google Sheets (Zero Mock)
 * Tích hợp High-Speed In-Memory Caching (SWR) & Circuit Breaker chống giật lag
 */

import { formatDateVN, formatDateTimeVN, getTodayVN } from '../utils/dateUtils.js';

const DEFAULT_GAS_API_URL = 'https://script.google.com/macros/s/AKfycbyhfULEPWGnh_P4SPyswMwFdMStLXdDd2jPD5pliRQFlqZ1VjMsRf5CB1JcnBhj8HvG/exec';
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
  clearApiCache();
}

// ========================================================================================
// ⚡ HIGH-SPEED SWR IN-MEMORY CACHE & CIRCUIT BREAKER
// ========================================================================================
const apiCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 giây cache cho các tác vụ đọc (GET)

// Trạng thái sức khỏe của các endpoints (Circuit Breaker)
const endpointHealth = {
  proxyFailingUntil: 0,
  gasFailingUntil: 0
};

export function clearApiCache() {
  apiCache.clear();
}

/**
 * Resilient Network Request Wrapper with Live Google Sheets Priority
 */
async function sendRequest(action, data = null, method = 'GET', useCache = true) {
  const isReadOp = method === 'GET';
  const cacheKey = `${action}_${JSON.stringify(data || {})}`;
  const now = Date.now();

  // 1. Kiểm tra In-Memory Cache trước (Tốc độ phản hồi tức thì < 1ms)
  if (isReadOp && useCache && apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return cached.response;
    }
  }

  const directGasUrl = getGasApiUrl();
  const isBrowser = typeof window !== 'undefined';
  const isVercelOrigin = isBrowser && window.location.hostname.includes('vercel.app');

  // Danh sách các endpoints thử nghiệm
  const candidateUrls = [];
  
  // Trên Vercel Production: Ưu tiên Vercel Proxy nếu đang khỏe
  if (isVercelOrigin && now > endpointHealth.proxyFailingUntil) {
    candidateUrls.push({ url: '/api/data', isProxy: true });
  }
  
  // Direct GAS WebApp Endpoint (hoặc fallback khi không trên Vercel)
  if (directGasUrl && directGasUrl.startsWith('http') && now > endpointHealth.gasFailingUntil) {
    candidateUrls.push({ url: directGasUrl, isProxy: false });
  }

  let lastError = null;

  for (const candidate of candidateUrls) {
    try {
      let fetchUrl = candidate.url;
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
        if (candidate.isProxy) {
          options.headers = { 'Content-Type': 'application/json' };
          options.body = JSON.stringify({ action: action, data: data });
        } else {
          // Direct GAS: Dùng text/plain để tránh CORS OPTIONS preflight của trình duyệt
          options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
          options.body = JSON.stringify({ action: action, data: data });
          options.redirect = 'follow';
        }
      }

      // Đặt timeout 20s đủ cho cold-start và truy vấn lớn từ Google Apps Script
      const timeoutMs = candidate.isProxy ? 10000 : 20000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      options.signal = controller.signal;

      const res = await fetch(fetchUrl, options);
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && json.fallbackRequired) {
          // Proxy yêu cầu chuyển sang direct GAS
          if (candidate.isProxy) endpointHealth.proxyFailingUntil = now + 5000;
          continue;
        }
        if (json && json.status === 'error' && json.message && (json.message.includes('không hợp lệ') || json.message.includes('Invalid action') || json.message.includes('Action not found'))) {
          continue;
        }

        // Lưu kết quả vào Cache cho các lần mở tab tiếp theo
        if (isReadOp && json && json.status === 'success') {
          apiCache.set(cacheKey, { response: json, timestamp: Date.now() });
        }

        // Xóa cache khi có thao tác ghi dữ liệu (Mutation)
        if (!isReadOp) {
          clearApiCache();
        }

        return json;
      } else {
        // Đánh dấu endpoint lỗi tạm thời 3s (không khóa quá lâu)
        if (candidate.isProxy) endpointHealth.proxyFailingUntil = now + 3000;
        else endpointHealth.gasFailingUntil = now + 3000;
        lastError = new Error(`Máy chủ phản hồi HTTP ${res.status}`);
      }
    } catch (err) {
      if (candidate.isProxy) endpointHealth.proxyFailingUntil = now + 3000;
      else endpointHealth.gasFailingUntil = now + 3000;
      lastError = err;
    }
  }

  // 2. Báo lỗi chuẩn mực tới người dùng khi mất kết nối, tuyệt đối không tráo đổi dữ liệu giả
  console.error(`[CreditCores Live API] Lỗi gọi hành động "${action}":`, lastError);
  return {
    status: 'error',
    message: `Không thể kết nối đến máy chủ Google Sheets (${action}): ${lastError ? lastError.message : 'Lỗi mạng'}`
  };
}

export const api = {
  getDashboardStats: (forceFresh = false) => sendRequest('getDashboardStats', null, 'GET', !forceFresh),
  searchCustomer360: (params, forceFresh = false) => {
    const payload = typeof params === 'object' ? params : { query: params };
    return sendRequest('searchCustomer360', payload, 'GET', !forceFresh);
  },
  getCBTDPortfolioStats: (cbtdUsername, forceFresh = false) => sendRequest('getCBTDPortfolioStats', { cbtdUsername }, 'GET', !forceFresh),
  assignContractCBTD: (data) => sendRequest('assignContractCBTD', data, 'POST'),
  getAppraisals: (forceFresh = false) => sendRequest('getAppraisals', null, 'GET', !forceFresh),
  saveAppraisalReport: (data) => sendRequest('saveAppraisalReport', data, 'POST'),
  addApprovalOpinion: (data) => sendRequest('addApprovalOpinion', data, 'POST'),
  getInspections: (forceFresh = false) => sendRequest('getInspections', null, 'GET', !forceFresh),
  saveLoanInspection: (data) => sendRequest('saveLoanInspection', data, 'POST'),
  getDebitRegistrations: (forceFresh = false) => sendRequest('getDebitRegistrations', null, 'GET', !forceFresh),
  saveDebitRegister: (data) => sendRequest('saveDebitRegister', data, 'POST'),
  saveBatchDebitRegister: (data) => sendRequest('saveBatchDebitRegister', data, 'POST'),
  updateDebitRegister: (data) => sendRequest('updateDebitRegister', data, 'POST'),
  toggleDebitRegisterStatus: (data) => sendRequest('toggleDebitRegisterStatus', data, 'POST'),
  deleteDebitRegister: (data) => sendRequest('deleteDebitRegister', data, 'POST'),
  getDebitBatches: (forceFresh = false) => sendRequest('getDebitBatches', null, 'GET', !forceFresh),
  createDebitBatch: (data) => sendRequest('createDebitBatch', data, 'POST'),
  getDebtWarnings: (forceFresh = false) => sendRequest('getDebtWarnings', null, 'GET', !forceFresh),
  getReportsData: (forceFresh = false) => sendRequest('getReportsData', null, 'GET', !forceFresh),
  reconcileUpload: (data) => sendRequest('reconcileUpload', data, 'POST'),
  getSyncStatus: () => sendRequest('getSyncStatus', null, 'GET', false),
  triggerSqlSync: () => sendRequest('triggerSqlSync', {}, 'POST'),
  getTemplates: (forceFresh = false) => sendRequest('getTemplates', null, 'GET', !forceFresh),
  saveTemplate: (data) => sendRequest('saveTemplate', data, 'POST'),
  deleteTemplate: (id) => sendRequest('deleteTemplate', { id }, 'POST'),
  getCollaterals: (forceFresh = false) => sendRequest('getCollaterals', null, 'GET', !forceFresh),
  saveCollateral: (data) => sendRequest('saveCollateral', data, 'POST'),
  deleteCollateral: (params) => sendRequest('deleteCollateral', params, 'POST'),
  uploadDriveFile: (data) => sendRequest('uploadDriveFile', data, 'POST'),
  getDriveSettings: (forceFresh = false) => sendRequest('getDriveSettings', null, 'GET', !forceFresh),
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
    // Security Phase 6 Remediation: Append requester credentials to authorize admin action
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const userStr = window.localStorage.getItem('cc_currentUser');
        const user = userStr ? JSON.parse(userStr) : null;
        if (user) {
          payload.requesterUsername = user.username;
          payload.requesterPasswordHash = user.passwordHash;
          payload.requesterRole = user.role;
        }
      } catch (e) {
        console.warn('Could not read currentUser for auth payload', e);
      }
    }
    return sendRequest('resetPassword', payload, 'POST');
  },
  getUserList: (forceFresh = false) => sendRequest('getUserList', null, 'GET', !forceFresh),
  saveUser: (data) => sendRequest('saveUser', data, 'POST'),
  getRolesAndPermissions: (forceFresh = false) => sendRequest('getRolesAndPermissions', null, 'GET', !forceFresh),
  saveRolePermissions: (data) => sendRequest('saveRolePermissions', data, 'POST'),
  getModuleRegistry: () => sendRequest('getModuleRegistry', null, 'GET', true),
  generateContract: (data) => sendRequest('generateContract', data, 'POST'),
  getContracts: (maKH = '') => sendRequest('getContracts', { maKH }, 'GET'),
  clearCache: clearApiCache
};
