/**
 * ========================================================================================
 * DỊCH VỤ XÁC THỰC BẢO MẬT & PHÂN QUYỀN ĐA CHỨC NĂNG (AUTH & RBAC SERVICE)
 * Hệ thống Quản lý Tín dụng & Trích nợ CreditCores
 * ========================================================================================
 */

import { api } from './api';

const STORAGE_KEY_USER = 'CREDITCORES_AUTH_USER';
const STORAGE_KEY_TOKEN = 'CREDITCORES_AUTH_TOKEN';

/**
 * Mã hóa mật khẩu một chiều SHA-256 bằng Web Crypto API chuẩn ngân hàng
 */
export async function hashPassword(password) {
  if (!password) return '';
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * BẢNG ĐỊNH NGHĨA PHÂN QUYỀN TRUY CẬP (RBAC MATRIX)
 * Roles:
 * - ADMIN: Quản trị viên (Toàn quyền hệ thống, Quản lý tài khoản, Cấu hình & Đồng bộ)
 * - CBTD: Cán bộ Tín dụng (Dashboard, Tra cứu 360, Thẩm định TSĐB, Kiểm tra vốn, Sổ nợ tồn)
 * - KETOAN: Kế toán viên (Dashboard, Tra cứu 360, Đăng ký trích nợ, Chạy đợt, Đối soát, Báo cáo)
 * - LANHDAO: Ban Giám đốc / Lãnh đạo (Dashboard, Tra cứu 360, Phê duyệt, Đối soát, Báo cáo thống kê)
 */
export const ROLE_PERMISSIONS = {
  ADMIN: [
    'dashboard',
    'customer360',
    'appraisal',
    'inspection',
    'debit_register',
    'debit_batch',
    'reconciliation',
    'debt_warning',
    'reports',
    'settings',
    'user_management'
  ],
  CBTD: [
    'dashboard',
    'customer360',
    'appraisal',
    'inspection',
    'debit_register',
    'debt_warning',
    'reports'
  ],
  KETOAN: [
    'dashboard',
    'customer360',
    'debit_register',
    'debit_batch',
    'reconciliation',
    'debt_warning',
    'reports'
  ],
  LANHDAO: [
    'dashboard',
    'customer360',
    'appraisal',
    'inspection',
    'debit_batch',
    'reconciliation',
    'debt_warning',
    'reports'
  ]
};

export const ROLE_LABELS = {
  ADMIN: { label: 'Quản Trị Viên', badgeClass: 'badge-danger-soft', icon: 'fa-shield-halved' },
  CBTD: { label: 'Cán Bộ Tín Dụng', badgeClass: 'badge-info-soft', icon: 'fa-user-tie' },
  KETOAN: { label: 'Kế Toán Viên', badgeClass: 'badge-success-soft', icon: 'fa-calculator' },
  LANHDAO: { label: 'Ban Lãnh Đạo / GĐ', badgeClass: 'badge-warning-soft', icon: 'fa-user-check' }
};

export const AuthService = {
  /**
   * Đăng nhập người dùng
   */
  async login(username, password) {
    const pHash = await hashPassword(password);
    const res = await api.login(username, pHash);

    if (res.status === 'success' && res.user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(res.user));
      if (res.token) {
        localStorage.setItem(STORAGE_KEY_TOKEN, res.token);
      }
      return { success: true, user: res.user };
    } else {
      return { success: false, message: res.message || 'Đăng nhập thất bại.' };
    }
  },

  /**
   * Đăng xuất
   */
  logout() {
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  },

  /**
   * Lấy thông tin user hiện tại
   */
  getCurrentUser() {
    try {
      const u = localStorage.getItem(STORAGE_KEY_USER);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Kiểm tra đã đăng nhập chưa
   */
  isAuthenticated() {
    return Boolean(this.getCurrentUser());
  },

  /**
   * Kiểm tra quyền truy cập module theo Role
   */
  hasPermission(moduleKey) {
    const user = this.getCurrentUser();
    if (!user) return false;
    const role = user.role || 'CBTD';
    const allowed = ROLE_PERMISSIONS[role] || [];
    return allowed.includes(moduleKey);
  },

  /**
   * Đổi mật khẩu
   */
  async changePassword(oldPassword, newPassword) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Chưa đăng nhập');

    const oldHash = await hashPassword(oldPassword);
    const newHash = await hashPassword(newPassword);

    return await api.changePassword(user.username, oldHash, newHash);
  }
};
