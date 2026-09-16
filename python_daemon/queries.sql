-- ========================================================================================
-- HỆ THỐNG QUẢN LÝ TÍN DỤNG & TRÍCH NỢ AUTOMATION - CREDITCORES
-- QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ (QTDND YÊN THỌ)
-- Tệp: queries.sql
-- Thư mục: CreditCores/python_daemon/
-- CSDL đích: Microsoft SQL Server (CoreBanking NG-eFUND)
-- Mục đích: Tổng hợp toàn bộ câu lệnh SQL chuẩn dùng để trích xuất dữ liệu từ CoreBanking
--          phục vụ tiến trình Python Daemon (sync_daemon.py) đẩy lên Google Sheets CSDL.
-- ========================================================================================

USE [NG-eFUND]
GO

-- ========================================================================================
-- PHẦN 1: TRÍCH XUẤT DỮ LIỆU KHÁCH HÀNG & THÀNH VIÊN VỐN GÓP (BẢNG ĐÍCH: KH_CORE)
-- ========================================================================================
-- Mô tả:
--   - Kết hợp thông tin khách hàng (DC_KHACH_HANG), địa bàn thôn/xã (DC_KHU_VUC) 
--     và sổ cổ phần thành viên (DC_THANH_VIEN).
--   - Tính tổng vốn góp cổ phần (SUM(SO_TIEN)) của từng khách hàng.
--   - Phục vụ phân hệ Tra cứu KH 360°, Thẩm định tín dụng, Đăng ký trích nợ.
-- Quy tắc chuẩn hóa phía Python:
--   - MaKH, CCCD, DienThoai, SoTV: Được bọc tiền tố ' để bảo toàn số 0 ở đầu trên Google Sheets.
--   - NgaySinh, NgayCap, NgayVaoTV: Đổi từ định dạng YYYYMMDD sang dd/MM/yyyy.
--   - TongTienCP: Ép kiểu số nguyên không phần thập phân.
-- ========================================================================================

SELECT 
    kh.MA_KHACH_HANG AS MaKH,
    kh.TEN_KHACH_HANG AS HoTen,
    kh.DIA_CHI AS DiaChi,
    kh.NGAY_SINH AS NgaySinh,
    kh.SO_CMND AS CCCD,
    kh.NGAY_CAP AS NgayCap,
    kh.NOI_CAP AS NoiCap,
    kh.SO_DIEN_THOAI AS DienThoai,
    kh.SO_DI_DONG AS DienThoaiDD,
    kh.SO_TAI_KHOAN AS SoTK,
    kv.TEN_KHU_VUC AS KhuVuc,
    tv.SO_THANH_VIEN AS SoTV,
    tv.SO_CO_PHAN AS SoSoCP,
    tv.NGAY_MO_SO AS NgayVaoTV,
    ISNULL(SUM(tv.SO_TIEN), 0) AS TongTienCP
FROM dbo.DC_KHACH_HANG kh WITH (NOLOCK)
LEFT JOIN dbo.DC_KHU_VUC kv WITH (NOLOCK) 
    ON kh.MA_KHU_VUC = kv.MA_KHU_VUC
LEFT JOIN dbo.DC_THANH_VIEN tv WITH (NOLOCK) 
    ON kh.MA_KHACH_HANG = tv.MA_KHACH_HANG
GROUP BY 
    kh.MA_KHACH_HANG,
    kh.TEN_KHACH_HANG,
    kh.DIA_CHI,
    kh.NGAY_SINH,
    kh.SO_CMND,
    kh.NGAY_CAP,
    kh.NOI_CAP,
    kh.SO_DIEN_THOAI,
    kh.SO_DI_DONG,
    kh.SO_TAI_KHOAN,
    kv.TEN_KHU_VUC,
    tv.SO_THANH_VIEN,
    tv.SO_CO_PHAN,
    tv.NGAY_MO_SO
ORDER BY kh.MA_KHACH_HANG ASC;
GO


-- ========================================================================================
-- PHẦN 2: TRÍCH XUẤT HỢP ĐỒNG TÍN DỤNG & KHẾ ƯỚC DƯ NỢ HIỆN HỮU (BẢNG ĐÍCH: HDTD_CORE)
-- ========================================================================================
-- Mô tả:
--   - Kết hợp khế ước nhận nợ (TD_KHE_UOC), hợp đồng tín dụng mẹ (TD_HOP_DONG_TD),
--     tài khoản vay (KT_TAI_KHOAN) và danh mục sản phẩm vay (vwTD_SAN_PHAM).
--   - Lọc chỉ lấy các món vay đang còn dư nợ gốc thực tế (a.SO_DU > 0 AND c.SO_DU > 0).
--   - Phục vụ tính lãi trích nợ tự động kỳ 05, 15, 25 hàng tháng theo TT 14/2017/TT-NHNN,
--     giám sát nợ đến hạn và lập kế hoạch kiểm tra vốn sau giải ngân.
-- Quy tắc chuẩn hóa phía Python:
--   - SoHDTD, MaKH: Bảo toàn chuỗi nguyên bản (giữ số 0 ở đầu MaKH).
--   - TienVay, DuNo: Ép kiểu nguyên không phần thập phân.
--   - LaiSuat: Làm tròn 2 chữ số thập phân (%/năm).
--   - NgayVay, DenHan, TraLaiDenNgay: Đổi từ định dạng YYYYMMDD sang dd/MM/yyyy.
--   - CBTD_PhuTrach, Ten_CBTD: Tự động bảo toàn phân công đã có trên Google Sheets.
--   - TrangThaiHD: Gắn 'DANG_VAY' (tự động nhận diện 'DA_TAT_TOAN' khi hợp đồng hết nợ).
-- ========================================================================================

SELECT 
    d.SO_HDTD AS SoHDTD,
    d.MA_KHACH_HANG AS MaKH,
    d.SO_TIEN_VAY AS TienVay,
    a.SO_DU AS DuNo,
    a.LAI_SUAT AS LaiSuat,
    d.NGAY_VAY AS NgayVay,
    d.NGAY_DAO_HAN AS DenHan,
    a.THU_LAI_DEN_NGAY AS TraLaiDenNgay,
    sp.TEN_SAN_PHAM AS MaLoaiVay,
    d.SO_THANG_VAY AS SoThangVay,
    d.MO_TA_MUC_DICH_VAY AS MoTaVay
FROM dbo.TD_KHE_UOC a WITH (NOLOCK)
INNER JOIN dbo.TD_HOP_DONG_TD d WITH (NOLOCK) 
    ON a.MA_HDTD = d.MA_HDTD
INNER JOIN dbo.KT_TAI_KHOAN c WITH (NOLOCK) 
    ON c.SO_TAI_KHOAN = a.SO_TAI_KHOAN
LEFT JOIN dbo.vwTD_SAN_PHAM sp WITH (NOLOCK) 
    ON sp.MA_SAN_PHAM = a.MA_SAN_PHAM
WHERE a.SO_DU > 0 
  AND c.SO_DU > 0
ORDER BY d.MA_KHACH_HANG ASC, d.NGAY_VAY DESC;
GO


-- ========================================================================================
-- PHẦN 3 (MỞ RỘNG - THAM KHẢO): TRÍCH XUẤT TÀI KHOẢN TIỀN GỬI THANH TOÁN (CASA)
-- ========================================================================================
-- Mô tả: Dùng để đối soát số dư khả dụng trên tài khoản CASA của thành viên trước khi
--        thực hiện trích nợ tự động định kỳ vào các ngày 05, 15, 25.
-- ========================================================================================

SELECT 
    tk.SO_TAI_KHOAN AS SoTK,
    tk.MA_KHACH_HANG AS MaKH,
    kh.TEN_KHACH_HANG AS HoTen,
    tk.SO_DU AS SoDuKhaDung,
    tk.NGAY_MO AS NgayMoTK,
    tk.TRANG_THAI AS TrangThaiTK
FROM dbo.KT_TAI_KHOAN tk WITH (NOLOCK)
INNER JOIN dbo.DC_KHACH_HANG kh WITH (NOLOCK) 
    ON tk.MA_KHACH_HANG = kh.MA_KHACH_HANG
WHERE tk.MA_LOAI_TIEN_GUI IN ('TGTT', 'CASA')
  AND tk.TRANG_THAI = 'A'
ORDER BY tk.MA_KHACH_HANG ASC;
GO
