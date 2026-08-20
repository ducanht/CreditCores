/**
 * ========================================================================================
 * CREDITCORES - MODULEREGISTRYCONTROLLER
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Controller/Module ModuleRegistryController xử lý nghiệp vụ liên quan
 * @created     15/08/2026
 * @updated     20/08/2026
 * @version     2.1
 * ========================================================================================
 */

var ModuleRegistryController = {
  handleGetModuleRegistry: function() {
    var modules = [
      { id: 'dashboard', name: 'Dashboard Quản trị', category: 'TỔNG QUAN', description: 'Xem tổng quan KPI, biểu đồ dư nợ và đợt trích nợ' },
      { id: 'customer360', name: 'Tra cứu KH & HĐ 360°', category: 'KHÁCH HÀNG', description: 'Tra cứu toàn diện thông tin thành viên, CASA và hợp đồng tín dụng' },
      { id: 'appraisal', name: 'Thẩm định Tín dụng & TSĐB', category: 'TÍN DỤNG', description: 'Lập báo cáo thẩm định, chấm điểm CIC và định giá tài sản' },
      { id: 'inspection', name: 'Kiểm tra Sử dụng Vốn', category: 'TÍN DỤNG', description: 'Lập biên bản kiểm tra sử dụng vốn sau giải ngân (thực địa/chứng từ)' },
      { id: 'debit_register', name: 'Đăng ký Trích nợ', category: 'TRÍCH NỢ', description: 'Đăng ký thỏa thuận ủy quyền trích nợ tự động tài khoản CASA' },
      { id: 'debit_batch', name: 'Chạy đợt Trích nợ', category: 'TRÍCH NỢ', description: 'Khởi tạo đợt trích nợ, kết xuất file lệnh CoreBanking' },
      { id: 'reconciliation', name: 'Đối soát & Kết quả', category: 'KẾ TOÁN', description: 'Đối soát file kết quả từ Core và phân loại nợ thu thành công/thất bại' },
      { id: 'debt_warning', name: 'Cảnh báo Nợ tồn đọng', category: 'QUẢN LÝ NỢ', description: 'Sổ theo dõi nợ tồn đọng và quản lý đôn đốc thu hồi' },
      { id: 'reports', name: 'Báo cáo Thống kê', category: 'BÁO CÁO', description: 'Phân tích đa chiều dư nợ theo 3 Xã và loại sản phẩm vay' },
      { id: 'templates', name: 'Quản lý Biểu mẫu', category: 'HỆ THỐNG', description: 'Quản lý kho biểu mẫu Google Docs/Word và trộn dữ liệu tài liệu' },
      { id: 'user_management', name: 'Phân quyền 360° & User', category: 'HỆ THỐNG', description: 'Quản trị người dùng, phân quyền theo nhóm và gán quyền cá nhân' },
      { id: 'settings', name: 'Cấu hình & Đồng bộ Core', category: 'HỆ THỐNG', description: 'Giám sát hàng đợi lệnh đồng bộ Core và tham số hệ thống' }
    ];

    return { status: "success", data: modules };
  }
};
