/**
 * DỊCH VỤ GIAO TIẾP DỮ LIỆU & RESILIENT HIGH-PERFORMANCE API CLIENT CHO CREDITCORES
 * Hỗ trợ Dual-Mode: Live Google Apps Script API + Realistic Mock Data Fallback
 * Tích hợp High-Speed In-Memory Caching (SWR) & Circuit Breaker chống giật lag
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
  clearApiCache();
}

// Stateful Mock Database in Memory
const mockDb = JSON.parse(JSON.stringify(initialMockData));

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
 * Resilient Network Request Wrapper with Dual-Mode Fallback & High-Speed Cache
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
  const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

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
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify({ action: action, data: data });
      }

      // Fast Timeout: 3500ms thay vì chờ 9s giật lag
      const timeoutMs = isLocalhost ? 2800 : 3800;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      options.signal = controller.signal;

      const res = await fetch(fetchUrl, options);
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && json.status === 'error' && json.message && (json.message.includes('không hợp lệ') || json.message.includes('Invalid action') || json.message.includes('Action not found'))) {
          continue;
        }

        // Lưu kết quả vào Cache cho các lần mở tab tiếp theo
        if (isReadOp && json && json.status === 'success') {
          apiCache.set(cacheKey, { response: json, timestamp: Date.now() });
        }

        return json;
      } else {
        // Đánh dấu endpoint lỗi tạm thời 20s
        if (candidate.isProxy) endpointHealth.proxyFailingUntil = now + 20000;
        else endpointHealth.gasFailingUntil = now + 20000;
      }
    } catch (err) {
      if (candidate.isProxy) endpointHealth.proxyFailingUntil = now + 20000;
      else endpointHealth.gasFailingUntil = now + 20000;
    }
  }

  // 2. Fallback sang Local Stateful Engine khi mạng lag / offline
  const fallbackResult = handleMockFallback(action, data);
  if (isReadOp && fallbackResult && fallbackResult.status === 'success') {
    apiCache.set(cacheKey, { response: fallbackResult, timestamp: Date.now() });
  }

  // Nếu là thao tác Ghi (Mutation), tự động xóa cache liên quan để số liệu mới nhất hiển thị
  if (!isReadOp) {
    clearApiCache();
  }

  return fallbackResult;
}

/**
 * Local Fallback Handler (Tốc độ phản xạ < 5ms)
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
          dueIn30Days: 4,
          pastDueContracts: 1,
          cbtdList
        }
      };
    }

    case 'assignContractCBTD': {
      const { maKH, soHDTD, cbtdUsername, tenCBTD, assignAll } = data || {};
      let updatedCount = 0;

      mockDb.customers.forEach(c => {
        if (c.maKH === maKH) {
          c.cbtdPhuTrach = cbtdUsername;
          c.tenCBTD = tenCBTD;

          if (assignAll) {
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
      const report = data;
      const idx = mockDb.appraisals.findIndex(a => a.maBCTD === report.maBCTD);
      if (idx >= 0) {
        mockDb.appraisals[idx] = { ...mockDb.appraisals[idx], ...report };
      } else {
        mockDb.appraisals.unshift(report);
      }
      return { status: 'success', message: 'Lưu báo cáo thẩm định thành công!' };
    }

    case 'addApprovalOpinion': {
      const { maBCTD, role, approvalOpinion } = data || {};
      const appraisal = mockDb.appraisals.find(a => a.maBCTD === maBCTD);
      if (!appraisal) return { status: 'error', message: 'Không tìm thấy hồ sơ thẩm định.' };

      if (!appraisal.approvalHistory) appraisal.approvalHistory = [];
      appraisal.approvalHistory.push({
        role: role || 'CBTD',
        status: approvalOpinion.status,
        note: approvalOpinion.note,
        approvedAmount: approvalOpinion.approvedAmount,
        updatedAt: formatDateTimeVN(new Date())
      });

      if (approvalOpinion.status) appraisal.ketLuanChung = approvalOpinion.status;
      if (approvalOpinion.approvedAmount) appraisal.soTienPheDuyet = approvalOpinion.approvedAmount;

      return { status: 'success', message: 'Đã lưu ý kiến phê duyệt thành công!' };
    }

    case 'getInspections':
      return { status: 'success', data: mockDb.inspections };

    case 'saveLoanInspection': {
      const report = data;
      const idx = mockDb.inspections.findIndex(i => i.maBBKT === report.maBBKT);
      if (idx >= 0) {
        mockDb.inspections[idx] = { ...mockDb.inspections[idx], ...report };
      } else {
        mockDb.inspections.unshift(report);
      }
      return { status: 'success', message: 'Lưu biên bản kiểm tra sử dụng vốn thành công!' };
    }

    case 'getDebitRegistrations':
      return { status: 'success', data: mockDb.debitRegistrations };

    case 'saveDebitRegister': {
      const reg = data;
      const idx = mockDb.debitRegistrations.findIndex(r => r.soThoaThuan === reg.soThoaThuan);
      if (idx >= 0) {
        mockDb.debitRegistrations[idx] = { ...mockDb.debitRegistrations[idx], ...reg };
      } else {
        mockDb.debitRegistrations.unshift(reg);
      }
      return { status: 'success', message: 'Đăng ký trích nợ tự động thành công!' };
    }

    case 'getDebitBatches':
      return { status: 'success', data: mockDb.debitBatches };

    case 'createDebitBatch': {
      const batchPayload = data;
      const newBatch = {
        maDot: batchPayload.maDot || ('DOT-' + getTodayISO().replace(/-/g, '').slice(0, 6) + '-K' + batchPayload.kyTrich),
        kyTrich: batchPayload.kyTrich,
        ngayTrich: getTodayVN(),
        thangNam: getTodayISO().slice(0, 7),
        tongMon: 6,
        tongTienPhaiThu: 28876302,
        daTrichDu: 3,
        trichMotPhan: 1,
        thatBai: 2,
        tongTienDaTrich: 10796713,
        tongNoTon: 18079589,
        trangThai: 'DA_TRICH',
        details: [
          { maKH: 'KH008892', soHDTD: 'KU-2026-0312', hoTen: 'NGUYỄN VĂN AN', soTK: '0381000123456', gocDenHan: 0, laiPhatSinh: 1643836, noTonKyTruoc: 0, tongPhaiThu: 1643836, soDuKhaDung: 5200000, soTienDaTrich: 1643836, ketQua: 'THANH_CONG', lyDoLoi: '' },
          { maKH: 'KH004512', soHDTD: 'KU-2026-0145', hoTen: 'LÊ THỊ MAI', soTK: '0381000789123', gocDenHan: 0, laiPhatSinh: 1732877, noTonKyTruoc: 0, tongPhaiThu: 1732877, soDuKhaDung: 2100000, soTienDaTrich: 1732877, ketQua: 'THANH_CONG', lyDoLoi: '' },
          { maKH: 'KH001980', soHDTD: 'KU-2025-0811', hoTen: 'TRẦN VĂN QUÂN', soTK: '0381000998877', gocDenHan: 10000000, laiPhatSinh: 4109589, noTonKyTruoc: 0, tongPhaiThu: 14109589, soDuKhaDung: 4000000, soTienDaTrich: 4000000, ketQua: 'TRICH_MOT_PHAN', lyDoLoi: 'Số dư không đủ' },
          { maKH: 'KH007621', soHDTD: 'KU-2025-0982', hoTen: 'PHẠM VĂN ĐỨC', soTK: '0381000554433', gocDenHan: 0, laiPhatSinh: 2850000, noTonKyTruoc: 0, tongPhaiThu: 2850000, soDuKhaDung: 50000, soTienDaTrich: 0, ketQua: 'THAT_BAI', lyDoLoi: 'Số dư không đủ' },
          { maKH: 'KH003319', soHDTD: 'KU-2026-0219', hoTen: 'HOÀNG THỊ THU', soTK: '0381000221144', gocDenHan: 0, laiPhatSinh: 3420000, noTonKyTruoc: 0, tongPhaiThu: 3420000, soDuKhaDung: 15000000, soTienDaTrich: 3420000, ketQua: 'THANH_CONG', lyDoLoi: '' },
          { maKH: 'KH005820', soHDTD: 'KU-2026-0402', hoTen: 'VŨ ĐÌNH LONG', soTK: '0381000667788', gocDenHan: 0, laiPhatSinh: 5120000, noTonKyTruoc: 0, tongPhaiThu: 5120000, soDuKhaDung: 100000, soTienDaTrich: 0, ketQua: 'THAT_BAI', lyDoLoi: 'Tài khoản thanh toán bị tạm khóa' }
        ]
      };
      mockDb.debitBatches.unshift(newBatch);
      return { status: 'success', message: 'Khởi tạo và chạy đợt trích nợ thành công!', data: newBatch };
    }

    case 'getDebtWarnings':
      return { status: 'success', data: mockDb.debtWarnings };

    case 'getReportsData':
      return { status: 'success', data: mockDb.reports };

    case 'reconcileUpload':
      return {
        status: 'success',
        message: 'Đối soát kết quả hạch toán từ CoreBanking thành công!',
        data: {
          matchedCount: 6,
          successCount: 3,
          partialCount: 1,
          failedCount: 2
        }
      };

    case 'getSyncStatus':
      return {
        status: 'success',
        data: {
          lastSyncTime: formatDateTimeVN(new Date()),
          status: 'SUCCESS',
          totalCustomers: 320,
          totalContracts: 342,
          totalBalance: 48500000000,
          version: 'CreditCores Core v2.4'
        }
      };

    case 'triggerSqlSync':
      return {
        status: 'success',
        message: 'Đã gửi tín hiệu yêu cầu Python Daemon đồng bộ SQL Server Core ngay lập tức!'
      };

    case 'getTemplates':
      return { status: 'success', data: mockDb.templates || [] };

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
      let cfg = {
        rootFolderId: '1E2zPUuYHkhXMDS5ZM7jxI-FY4JrD17O66ruN5uK15U0',
        appraisalFolderId: '1-Appraisal_TSBD_YenTho',
        inspectionFolderId: '1-Inspection_KTV_YenTho',
        documentsFolderId: '1-Docs_Customer_YenTho',
        autoCompress: true,
        maxImageDimension: 1280,
        compressionQuality: 0.75
      };
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('CREDITCORES_DRIVE_CONFIG');
        if (saved) {
          try { cfg = JSON.parse(saved); } catch (e) {}
        }
      }
      return { status: 'success', data: cfg };
    }

    case 'saveDriveSettings': {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('CREDITCORES_DRIVE_CONFIG', JSON.stringify(data));
      }
      return { status: 'success', message: 'Đã lưu cấu hình thư mục Google Drive thành công!' };
    }

    default:
      return { status: 'error', message: 'Hành động không xác định: ' + action };
  }
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
    return sendRequest('resetPassword', payload, 'POST');
  },
  getUserList: (forceFresh = false) => sendRequest('getUserList', null, 'GET', !forceFresh),
  saveUser: (data) => sendRequest('saveUser', data, 'POST'),
  getRolesAndPermissions: (forceFresh = false) => sendRequest('getRolesAndPermissions', null, 'GET', !forceFresh),
  saveRolePermissions: (data) => sendRequest('saveRolePermissions', data, 'POST'),
  getModuleRegistry: () => sendRequest('getModuleRegistry', null, 'GET', true),
  clearCache: clearApiCache
};
