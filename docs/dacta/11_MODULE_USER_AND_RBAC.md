# 👥 ĐẶC TẢ PHÂN HỆ PHÂN QUYỀN & QUẢN LÝ NGƯỜI DÙNG (USER & RBAC)
# Quản Trị Tài Khoản, Phân Quyền 4 Cấp & Bảo Mật Session — QTDND Yên Thọ

---

## 1. MỤC TIÊU VÀ PHẠM VI NGHIỆP VỤ

Phân hệ **User Management** đảm bảo tính an toàn, bảo mật thông tin và phân định trách nhiệm rõ ràng cho toàn bộ nhân sự tham gia vận hành hệ thống tại QTDND Yên Thọ:
- Quản lý danh sách tài khoản người dùng: Tạo mới, cập nhật họ tên, chức danh, phân quyền vai trò (`role`), khóa tài khoản và thiết lập lại mật khẩu.
- Bảo mật xác thực: Băm mật khẩu an toàn, quản lý phiên làm việc (`AuthService`), tự động đăng xuất khi hết hạn phiên hoặc đổi mật khẩu.
- Nhật ký truy cập và kiểm toán (Audit Trail): Ghi nhận thời gian đăng nhập và lịch sử thao tác của từng tài khoản.

---

## 2. MA TRẬN PHÂN QUYỀN CHỨC NĂNG (ACCESS CONTROL MATRIX)

| Phân Hệ / Chức Năng | `ADMIN` (Quản Trị) | `LANH_DAO` (Ban Giám Đốc/HĐQT) | `CBTD` (Cán Bộ Tín Dụng) | `KE_TOAN` (Kế Toán/Thủ Quỹ) |
| :--- | :---: | :---: | :---: | :---: |
| **Xem Dashboard & KPIs** | Toàn quyền | Toàn quyền | Dữ liệu cá nhân phụ trách | Toàn quyền |
| **Tra cứu Khách hàng 360°** | Toàn quyền | Toàn quyền | Toàn quyền | Toàn quyền |
| **Gán CBTD phụ trách** | Có | Có | Không | Không |
| **Quản lý Tài sản thế chấp** | Toàn quyền | Xem | Tạo & Chỉnh sửa | Xem |
| **Lập Tờ trình Thẩm định** | Toàn quyền | Phê duyệt | Lập & Đề xuất | Xem |
| **Phê duyệt Tín dụng 4 cấp** | Toàn quyền | Phê duyệt cấp cao | Không | Không |
| **Biên bản Kiểm tra sau vay** | Toàn quyền | Phê duyệt | Lập & Chụp ảnh | Xem |
| **Đăng ký Thỏa thuận Trích nợ** | Toàn quyền | Xem | Đăng ký & Chỉnh sửa | Đăng ký & Chỉnh sửa |
| **Khởi tạo Đợt Trích nợ** | Toàn quyền | Duyệt đợt | Không | Khởi tạo & Chỉnh sửa |
| **Đối soát & Chốt đợt Trích nợ** | Toàn quyền | Giám sát | Không | Nhập sao kê & Chốt đợt |
| **Cảnh báo & Đôn đốc nợ** | Toàn quyền | Giám sát | Đôn đốc & Ghi nhật ký | Xem & Báo cáo |
| **Xuất Báo cáo Thống kê** | Toàn quyền | Toàn quyền | Theo địa bàn | Toàn quyền |
| **Quản lý Biểu mẫu Mail-Merge** | Toàn quyền | Xem | Trộn biểu mẫu | Trộn biểu mẫu |
| **Quản lý Người dùng & RBAC** | Toàn quyền | Không | Không | Không |
| **Cấu hình & Kích hoạt Sync SQL**| Toàn quyền | Kích hoạt Sync | Không | Không |

---

## 3. QUY TRÌNH BẢO MẬT & ĐỔI MẬT KHẨU CÁ NHÂN

- Mỗi cán bộ khi được cấp tài khoản bắt buộc phải đổi mật khẩu trong lần đăng nhập đầu tiên.
- Tính năng **Đổi Mật Khẩu** (`ChangePasswordModal.jsx`) tích hợp sẵn ngay góc dưới thanh Sidebar, cho phép cán bộ chủ động đổi mật khẩu định kỳ 30 - 90 ngày theo khuyến nghị an toàn thông tin của Ngân hàng Nhà nước.
