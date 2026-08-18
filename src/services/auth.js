/**
 * ========================================================================================
 * DỊCH VỤ XÁC THỰC BẢO MẬT & PHÂN QUYỀN 360° MỞ RỘNG (EXTENSIBLE AUTH & RBAC 360)
 * Hệ thống Quản lý Tín dụng & Trích nợ CreditCores
 * ========================================================================================
 */

import { api } from './api.js';

const STORAGE_KEY_USER = 'CREDITCORES_AUTH_USER';
const STORAGE_KEY_TOKEN = 'CREDITCORES_AUTH_TOKEN';

/**
 * DANH MỤC PHÂN HỆ NGHIỆP VỤ MỞ RỘNG (MODULE REGISTRY)
 * Bất kỳ chức năng mới nào sau này chỉ cần khai báo thêm vào mảng này là hệ thống tự động nhận diện
 */
export const MODULE_REGISTRY = [
  {
    id: 'dashboard',
    label: 'Dashboard Quản trị',
    category: 'Tổng quan',
    description: 'Theo dõi tổng dư nợ, biểu đồ phân tích, dự thu lãi và cảnh báo nợ'
  },
  {
    id: 'customer360',
    label: 'Tra cứu KH & HĐ 360°',
    category: 'Khách hàng',
    description: 'Hồ sơ 360 độ khách hàng, khế ước tín dụng, tài khoản CASA và vốn góp'
  },
  {
    id: 'appraisal',
    label: 'Thẩm định Tín dụng & TSĐB',
    category: 'Tín dụng',
    description: 'Lập hồ sơ thẩm định, tính tỷ lệ LTV, chấm điểm CIC và duyệt hạn mức'
  },
  {
    id: 'inspection',
    label: 'Kiểm tra Sử dụng Vốn',
    category: 'Tín dụng',
    description: 'Lập biên bản kiểm tra thực địa / chứng từ sử dụng vốn sau giải ngân'
  },
  {
    id: 'debit_register',
    label: 'Đăng ký Dịch vụ Trích nợ',
    category: 'Trích nợ',
    description: 'Đăng ký, cập nhật và quản lý thỏa thuận ủy quyền trích nợ tự động'
  },
  {
    id: 'debit_batch',
    label: 'Khởi tạo & Chạy đợt Trích nợ',
    category: 'Trích nợ',
    description: 'Tính toán gốc + lãi + nợ tồn theo kỳ (05, 15, 25) và tạo lệnh trích'
  },
  {
    id: 'reconciliation',
    label: 'Đối soát Kết quả Core',
    category: 'Kế toán',
    description: 'Đối soát file CoreBanking, phân loại 3 trạng thái và ghi nhận hạch toán'
  },
  {
    id: 'debt_warning',
    label: 'Sổ Theo dõi Nợ tồn đọng',
    category: 'Quản lý nợ',
    description: 'Theo dõi nợ trích chưa thành công, phân tích nguyên nhân và đôn đốc'
  },
  {
    id: 'reports',
    label: 'Báo cáo Thống kê & Phân tích',
    category: 'Báo cáo',
    description: 'Báo cáo đa chiều theo 3 xã, sản phẩm tín dụng và tăng trưởng'
  },
  {
    id: 'user_management',
    label: 'Phân quyền 360° & Tài khoản',
    category: 'Hệ thống',
    description: 'Quản lý tài khoản, phân nhóm và tick chọn quyền chi tiết cho từng user/nhóm'
  },
  {
    id: 'settings',
    label: 'Cấu hình & Đồng bộ Core',
    category: 'Hệ thống',
    description: 'Điều khiển hàng đợi lệnh SETTING và theo dõi daemon SQL Server 24/7'
  }
];

export const ROLE_LABELS = {
  ADMIN: { label: 'Quản Trị Viên', badgeClass: 'badge-danger-soft', icon: 'fa-shield-halved' },
  CBTD: { label: 'Cán Bộ Tín Dụng', badgeClass: 'badge-info-soft', icon: 'fa-user-tie' },
  KETOAN: { label: 'Kế Toán Viên', badgeClass: 'badge-success-soft', icon: 'fa-calculator' },
  BKS: { label: 'Ban Kiểm Soát', badgeClass: 'badge-warning-soft', icon: 'fa-user-check' },
  LANHDAO: { label: 'Ban Lãnh Đạo / GĐ', badgeClass: 'badge-warning-soft', icon: 'fa-user-check' }
};

/**
 * Mã hóa mật khẩu một chiều SHA-256
 */
export async function hashPassword(password) {
  if (!password) return '';
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export const AuthService = {
  /**
   * Đăng nhập người dùng
   */
  async login(username, password) {
    const pHash = await hashPassword(password);
    const res = await api.login({ username: username.trim(), passwordHash: pHash });

    if (res.status === 'success' && res.user) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(res.user));
        if (res.token) {
          localStorage.setItem(STORAGE_KEY_TOKEN, res.token);
        }
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
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  },

  /**
   * Lấy thông tin user hiện tại
   */
  getCurrentUser() {
    try {
      if (typeof localStorage === 'undefined') return null;
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
   * Kiểm tra quyền truy cập module theo Phân Quyền 360° (Effective Permissions)
   */
  hasPermission(moduleKey) {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Admin luôn có toàn quyền
    if (user.role === 'ADMIN') return true;

    // Kiểm tra danh sách quyền hiệu lực (hợp nhất giữa Role Permissions và Custom Permissions)
    if (user.effectivePermissions && Array.isArray(user.effectivePermissions)) {
      return user.effectivePermissions.includes(moduleKey);
    }

    // Fallback: nếu có customPermissions
    if (user.customPermissions && Array.isArray(user.customPermissions)) {
      if (user.customPermissions.includes(moduleKey)) return true;
    }

    // Default fallback theo role nếu chưa có effectivePermissions
    const defaultRolePerms = {
      CBTD: ['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_register', 'debt_warning', 'reports'],
      KETOAN: ['dashboard', 'customer360', 'debit_register', 'debit_batch', 'reconciliation', 'debt_warning', 'reports'],
      BKS: ['dashboard', 'customer360', 'appraisal', 'inspection', 'debt_warning', 'reports'],
      LANHDAO: ['dashboard', 'customer360', 'appraisal', 'inspection', 'debit_batch', 'reconciliation', 'debt_warning', 'reports']
    };

    const allowed = defaultRolePerms[user.role] || [];
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
