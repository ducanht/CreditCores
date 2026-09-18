/**
 * ========================================================================================
 * DỊCH VỤ GIAO TIẾP DỮ LIỆU & RESILIENT HIGH-PERFORMANCE API CLIENT CHO CREDITCORES
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * Tối ưu hóa hiệu năng toàn diện (Zero-latency & Stale-While-Revalidate):
 * 1. Persistent LocalStorage Snapshot: Hiển thị giao diện tức thì 0ms từ bản lưu trước.
 * 2. High-Speed In-Memory Caching (SWR): Phản hồi RAM < 1ms cho các lượt chuyển tab.
 * 3. Request Deduplication: Triệt tiêu các lượt gọi mạng trùng lặp đang bay cùng thời điểm.
 * 4. Dual-Path Fallback & Circuit Breaker: Tự động chuyển đổi Vercel Proxy / Direct GAS.
 * 5. Targeted Cache Invalidation: Không xóa sạch toàn bộ cache khi chạy đồng bộ nền.
 * ========================================================================================
 */

import { formatDateVN, formatDateTimeVN, getTodayVN } from '../utils/dateUtils.js';

const DEFAULT_GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxLQHAgdH2cus1zX_z28b31qixMWqq5K0fgIsdy4QFD6xsjRlUyRrwmRyKU28jljAc2/exec';
const STORAGE_KEY_GAS_URL = 'CREDITCORES_GAS_API_URL';
const SNAPSHOT_PREFIX = 'CC_SNAP_';

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
// ⚡ HIGH-SPEED SWR IN-MEMORY CACHE & REQUEST DEDUPLICATION
// ========================================================================================
const apiCache = new Map();
const inFlightRequests = new Map(); // Request Deduplication map
const CACHE_TTL_MS = 60 * 1000;     // 60 giây cache tươi (Fresh Cache)

// Trạng thái sức khỏe của các endpoints (Circuit Breaker)
const endpointHealth = {
  proxyFailingUntil: 0,
  gasFailingUntil: 0
};

// Đọc snapshot từ LocalStorage (Instant 0ms Load)
function getSnapshotFromStorage(cacheKey) {
  if (typeof localStorage === 'undefined') return null;
  try {
    const itemStr = localStorage.getItem(SNAPSHOT_PREFIX + cacheKey);
    if (!itemStr) return null;
    const item = JSON.parse(itemStr);
    // Cho phép snapshot tồn tại 24 giờ
    if (Date.now() - item.timestamp < 24 * 60 * 60 * 1000) {
      return item.response;
    }
  } catch (e) {
    // Bỏ qua nếu lỗi đọc snapshot
  }
  return null;
}

// Lưu snapshot vào LocalStorage
function saveSnapshotToStorage(cacheKey, response) {
  if (typeof localStorage === 'undefined' || !response) return;
  try {
    localStorage.setItem(
      SNAPSHOT_PREFIX + cacheKey,
      JSON.stringify({ response, timestamp: Date.now() })
    );
  } catch (e) {
    // Nếu storage đầy, dọn dẹp các snapshot cũ
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(SNAPSHOT_PREFIX)) localStorage.removeItem(k);
      });
    } catch (ignore) {}
  }
}

export function clearApiCache() {
  apiCache.clear();
  inFlightRequests.clear();
  if (typeof localStorage !== 'undefined') {
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(SNAPSHOT_PREFIX)) localStorage.removeItem(k);
      });
    } catch (e) {}
  }
}

/**
 * Resilient Network Request Wrapper with Persistent SWR & Deduplication
 */
async function sendRequest(action, data = null, method = 'GET', useCache = true) {
  const isReadOp = method === 'GET';
  const cacheKey = `${action}_${JSON.stringify(data || {})}`;
  const now = Date.now();

  // 1. Kiểm tra Fresh In-Memory Cache trước (< 1ms)
  if (isReadOp && useCache && apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return cached.response;
    }
  }

  // 2. Request Deduplication: Nếu đang có request giống hệt đang bay, tái sử dụng Promise
  if (isReadOp && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  // Khởi tạo Promise thực thi mạng
  const fetchPromise = (async () => {
    const directGasUrl = getGasApiUrl();
    const isBrowser = typeof window !== 'undefined';
    const isVercelOrigin = isBrowser && window.location.hostname.includes('vercel.app');

    const candidateUrls = [];

    // Trên Vercel Production: Ưu tiên Vercel Proxy nếu đang khỏe
    if (isVercelOrigin && now > endpointHealth.proxyFailingUntil) {
      candidateUrls.push({ url: '/api/data', isProxy: true });
    }

    // Direct GAS Endpoint
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
            // Direct GAS: Dùng text/plain để tránh CORS OPTIONS preflight
            options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
            options.body = JSON.stringify({ action: action, data: data });
            options.redirect = 'follow';
          }
        }

        // Timeout thích ứng: 9s cho Proxy, 18s cho Direct GAS
        const timeoutMs = candidate.isProxy ? 9000 : 18000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        options.signal = controller.signal;

        const res = await fetch(fetchUrl, options);
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json && json.fallbackRequired) {
            if (candidate.isProxy) endpointHealth.proxyFailingUntil = now + 5000;
            continue;
          }

          // Lưu vào cả RAM Cache và Persistent LocalStorage Snapshot
          if (isReadOp && json && json.status === 'success') {
            apiCache.set(cacheKey, { response: json, timestamp: Date.now() });
            saveSnapshotToStorage(cacheKey, json);
          }

          // Chỉ xóa cache khi thực sự có mutation làm thay đổi CSDL
          // (Không xóa khi chỉ kích hoạt triggerSqlSync hoặc tra cứu)
          if (!isReadOp && action !== 'triggerSqlSync') {
            apiCache.clear();
          }

          return json;
        } else {
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

    // 3. Nếu mạng lỗi nhưng có LocalStorage Snapshot -> Trả về snapshot để người dùng không bị gián đoạn
    if (isReadOp) {
      const fallbackSnap = getSnapshotFromStorage(cacheKey);
      if (fallbackSnap) {
        console.warn(`[CreditCores SWR] Đang sử dụng bản sao lưu LocalStorage cho "${action}"`);
        return fallbackSnap;
      }
    }

    console.error(`[CreditCores Live API] Lỗi gọi hành động "${action}":`, lastError);
    return {
      status: 'error',
      message: `Không thể kết nối đến máy chủ Google Sheets (${action}): ${lastError ? lastError.message : 'Lỗi mạng'}`
    };
  })();

  // Đăng ký inFlightRequest để deduplicate
  if (isReadOp) {
    inFlightRequests.set(cacheKey, fetchPromise);
    fetchPromise.finally(() => {
      inFlightRequests.delete(cacheKey);
    });
  }

  // 4. Nếu có sẵn LocalStorage Snapshot, trả về trước đồng thời cho network chạy ngầm
  if (isReadOp && useCache) {
    const snap = getSnapshotFromStorage(cacheKey);
    if (snap) {
      apiCache.set(cacheKey, { response: snap, timestamp: Date.now() });
      return snap;
    }
  }

  return fetchPromise;
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
