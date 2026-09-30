"""
========================================================================================
HỆ THỐNG QUẢN LÝ TÍN DỤNG & TRÍCH NỢ AUTOMATION - CREDITCORES (QTDND YÊN THỌ)
File: sql_queries.py
Mục đích: Quản lý tập trung các câu lệnh SQL trích xuất từ CoreBanking NG-eFUND.

CSDL CoreBanking chỉ cung cấp DUY NHẤT 2 nhóm nghiệp vụ:
1. KH_CORE: Trích xuất danh mục Khách hàng, CCCD, Thành viên vốn góp, Địa bàn (Thôn, Xã).
2. Khế ước & Dư nợ Tín dụng (Phục vụ 3 bảng Google Sheets theo mục đích nghiệp vụ):
   - HDTD_CORE: Danh sách HĐTD HIỆN TẠI (Thời gian thực) phục vụ Báo cáo Tổng quan.
   - HDTD_CORE_DN: Danh sách HĐTD ĐẾN MỘT NGÀY CỤ THỂ (@denngay do người dùng chọn)
                   phục vụ Báo cáo Tổng quan & Sao kê tín dụng đến ngày chốt.
   - HDTD_CORE_ALL: Danh sách HĐTD SAO KÊ ĐẾN CÁC NGÀY CUỐI THÁNG trong năm
                    phục vụ Biểu đồ Diễn biến tháng & Top 50 Dư nợ bình quân cuối tháng.
========================================================================================
"""

from datetime import datetime

REGISTERED_QUERIES = {
    # ------------------------------------------------------------------------------------
    # 1. KH_CORE: TRÍCH XUẤT KHÁCH HÀNG & THÀNH VIÊN VỐN GÓP
    # ------------------------------------------------------------------------------------
    "KH_CORE": {
        "sheet_name": "KH_CORE",
        "description": "Danh bạ khách hàng, hồ sơ định danh CCCD, thành viên vốn góp và địa bàn thôn xã",
        "query": """
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
        LEFT JOIN dbo.DC_KHU_VUC kv WITH (NOLOCK) ON kh.MA_KHU_VUC = kv.MA_KHU_VUC
        LEFT JOIN dbo.DC_THANH_VIEN tv WITH (NOLOCK) ON kh.MA_KHACH_HANG = tv.MA_KHACH_HANG
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
        ORDER BY kh.MA_KHACH_HANG;
        """,
        "field_mapping": {
            "makh": "MaKH",
            "ma_khach_hang": "MaKH",
            "hoten": "HoTen",
            "ten_khach_hang": "HoTen",
            "cccd": "CCCD",
            "so_cmnd": "CCCD",
            "ngaycap": "NgayCap",
            "ngay_cap": "NgayCap",
            "noicap": "NoiCap",
            "noi_cap": "NoiCap",
            "ngaysinh": "NgaySinh",
            "ngay_sinh": "NgaySinh",
            "dienthoai": "DienThoai",
            "so_dien_thoai": "DienThoai",
            "dienthoaidd": "DienThoaiDD",
            "so_di_dong": "DienThoaiDD",
            "diachi": "DiaChi",
            "dia_chi": "DiaChi",
            "khuvuc": "KhuVuc",
            "ten_khu_vuc": "KhuVuc",
            "sotk": "SoTK",
            "so_tai_khoan": "SoTK",
            "sotv": "SoTV",
            "so_thanh_vien": "SoTV",
            "sosocp": "SoSoCP",
            "so_co_phan": "SoSoCP",
            "ngayvaotv": "NgayVaoTV",
            "ngay_mo_so": "NgayVaoTV",
            "tongtiencp": "TongTienCP",
            "so_tien": "TongTienCP"
        }
    },

    # ------------------------------------------------------------------------------------
    # 2. HDTD_CORE: TRÍCH XUẤT HĐTD HIỆN TẠI (DÙNG CHO BÁO CÁO TỔNG QUAN)
    # ------------------------------------------------------------------------------------
    "HDTD_CORE": {
        "sheet_name": "HDTD_CORE",
        "description": "Danh sách hợp đồng tín dụng & khế ước dư nợ hiện tại thời gian thực (Báo cáo Tổng quan)",
        "query": """
        SELECT 
            A.MA_KHE_UOC AS SoHDTD,
            D.MA_KHACH_HANG AS MAKH,
            B.TEN_KHACH_HANG AS TenKH,
            B.SO_CMND AS CCCD,
            B.SO_DI_DONG AS DienThoai,
            B.DIA_CHI AS DiaChi,
            -- TÁCH LẤY TÊN THÔN TỪ CỘT DIA_CHI
            LTRIM(RTRIM(
                CASE 
                    WHEN CHARINDEX(',', B.DIA_CHI) > 0 
                    THEN LEFT(B.DIA_CHI, CHARINDEX(',', B.DIA_CHI) - 1)
                    ELSE B.DIA_CHI 
                END
            )) AS KvThon,
            ISNULL(G.TEN_DIA_LY, N'') AS KvXa,
            D.SO_TIEN_VAY AS TienVay,
            C.SO_DU AS DuNo,
            FORMAT(A.LAI_SUAT, 'N2') AS LaiSuat,
            CONVERT(VARCHAR(10), D.NGAY_VAY, 103) AS NgayVay,
            CONVERT(VARCHAR(10), D.NGAY_DAO_HAN, 103) AS DenHan,
            CONVERT(VARCHAR(10), A.THU_LAI_DEN_NGAY, 103) AS TLDenNgay,
            SP.TEN_SAN_PHAM AS MaLoaiVay,
            D.SO_THANG_VAY AS SoThangVay,
            D.MO_TA_MUC_DICH_VAY AS MucDichVay,
            D.MA_LOAI_HD AS MaLoaiHD,
            A.NHOM_NO_HIEN_TAI AS NhomNo
        FROM dbo.TD_KHE_UOC A 
        INNER JOIN dbo.TD_HOP_DONG_TD D ON A.MA_HDTD = D.MA_HDTD
        INNER JOIN dbo.DC_KHACH_HANG B ON B.MA_KHACH_HANG = D.MA_KHACH_HANG
        INNER JOIN dbo.DC_THANH_VIEN TV ON B.MA_KHACH_HANG = TV.MA_KHACH_HANG
        INNER JOIN dbo.DC_KHU_VUC KV ON B.MA_KHU_VUC = KV.MA_KHU_VUC
        INNER JOIN dbo.KT_TAI_KHOAN C ON C.SO_TAI_KHOAN = A.SO_TAI_KHOAN
        INNER JOIN dbo.vwTD_SAN_PHAM SP ON SP.MA_SAN_PHAM = A.MA_SAN_PHAM
        INNER JOIN dbo.DC_LOAI_VAY LV ON LV.MA_LOAI_VAY = SP.MA_LOAI_VAY
        LEFT JOIN (
            SELECT DISTINCT 
                A.MA_KHU_VUC, 
                B.MA_DIA_LY, 
                B.TEN_DIA_LY 
            FROM dbo.DC_DON_VI_KHU_VUC A 
            INNER JOIN dbo.DC_DIA_LY B ON A.MA_DIA_LY = B.MA_DIA_LY 
            WHERE A.MA_PGD LIKE '01'
        ) G ON G.MA_KHU_VUC = KV.MA_KHU_VUC
        WHERE C.SO_DU > 0
        ORDER BY D.MA_KHACH_HANG, D.NGAY_VAY DESC;
        """,
        "field_mapping": {
            "sohdtd": "SoHDTD",
            "ma_khe_uoc": "SoHDTD",
            "makh": "MaKH",
            "ma_khach_hang": "MaKH",
            "tenkh": "HoTen",
            "hoten": "HoTen",
            "ten_khach_hang": "HoTen",
            "cccd": "CCCD",
            "so_cmnd": "CCCD",
            "dienthoai": "DienThoai",
            "so_di_dong": "DienThoai",
            "diachi": "DiaChi",
            "dia_chi": "DiaChi",
            "kvthon": "KvThon",
            "kvxa": "KvXa",
            "ten_dia_ly": "KvXa",
            "tienvay": "TienVay",
            "so_tien_vay": "TienVay",
            "duno": "DuNo",
            "so_du": "DuNo",
            "laisuat": "LaiSuat",
            "lai_suat": "LaiSuat",
            "ngayvay": "NgayVay",
            "ngay_vay": "NgayVay",
            "denhan": "DenHan",
            "ngay_dao_han": "DenHan",
            "tldenngay": "TraLaiDenNgay",
            "tralaidenngay": "TraLaiDenNgay",
            "thu_lai_den_ngay": "TraLaiDenNgay",
            "sothangvay": "SoThangVay",
            "so_thang_vay": "SoThangVay",
            "maloaivay": "MaLoaiVay",
            "ten_san_pham": "MaLoaiVay",
            "mucdichvay": "MoTaVay",
            "motavay": "MoTaVay",
            "mo_ta_muc_dich_vay": "MoTaVay",
            "maloaihd": "MaLoaiHD",
            "ma_loai_hd": "MaLoaiHD",
            "nhomno": "NhomNo",
            "nhom_no_hien_tai": "NhomNo"
        }
    },

    # ------------------------------------------------------------------------------------
    # 3. HDTD_CORE_DN: TRÍCH XUẤT HĐTD ĐẾN MỘT NGÀY CỤ THỂ (@denngay do người dùng chọn)
    # ------------------------------------------------------------------------------------
    "HDTD_CORE_DN": {
        "sheet_name": "HDTD_CORE_DN",
        "description": "Danh sách hợp đồng tín dụng & dư nợ chốt đến một ngày cụ thể (Báo cáo Tổng quan & Sao kê đến ngày)",
        "query": """
        DECLARE @denngay VARCHAR(8) = '{denngay}';

        SELECT 
            a.so_hdtd AS SoHDTD,
            b.ma_khach_hang AS MaKH,
            b.ten_khach_hang AS TenKH,
            b.SO_CMND AS CCCD,
            b.SO_DI_DONG AS DienThoai,
            f.ten_khu_vuc AS DiaChi,
            LTRIM(RTRIM(
                CASE 
                    WHEN CHARINDEX(',', B.DIA_CHI) > 0 
                    THEN LEFT(B.DIA_CHI, CHARINDEX(',', B.DIA_CHI) - 1)
                    ELSE B.DIA_CHI 
                END
            )) AS KvThon,
            ISNULL(G.TEN_DIA_LY, '') AS KhuVuc,
            CONVERT(VARCHAR(10), CONVERT(DATETIME, LEFT(a.ngay_vay, 8), 103), 103) AS NgayVay,
            CONVERT(VARCHAR(10), CONVERT(DATETIME, LEFT(a.ngay_dao_han, 8), 103), 103) AS DenHan,
            CAST(c.lai_suat AS FLOAT) / 100 AS LaiSuat,
            CONVERT(INT, c.so_tien_gn) AS TienVay,
            CONVERT(INT, e.so_du) AS DuNo,
            CONVERT(VARCHAR(10), CONVERT(DATETIME, LEFT(kw.thu_lai_den_ngay, 8), 103), 103) AS TL_DenNgay,
            a.SO_THANG_VAY AS SoThangVay,
            d.MA_LOAI_VAY AS LoaiVay, 
            A.MA_LOAI_HD AS MaLoaiHD,
            A.MO_TA_MUC_DICH_VAY AS MucDich,
            C.nhom_no_hien_tai AS NhomNo
        FROM 
            td_hop_dong_td a 
        INNER JOIN (
            SELECT DISTINCT 
                kh.*, 
                ISNULL(tv.SO_THANH_VIEN, '') AS so_thanh_vien 
            FROM 
                dc_khach_hang kh 
            LEFT JOIN (
                SELECT 
                    ma_khach_hang, 
                    MIN(so_thanh_vien) AS so_thanh_vien 
                FROM 
                    fn_dc_thanh_vien_ls(@denngay, '%') 
                GROUP BY 
                    ma_khach_hang
            ) tv ON kh.ma_khach_hang = tv.ma_khach_hang 
        ) b ON a.ma_khach_hang = b.ma_khach_hang
        INNER JOIN 
            fn_TD_KHE_UOC_LS('01', @denngay) c ON a.ma_hdtd = c.ma_hdtd 
            AND c.nhom_no_hien_tai IN ('NHOM1', 'NHOM2', 'NHOM3', 'NHOM4', 'NHOM5')
        INNER JOIN 
            td_san_pham d ON c.ma_san_pham = d.ma_san_pham
        INNER JOIN 
            fn_KT_TAI_KHOAN_LS_CHI_NHANH(@denngay, 'TKTD', '01') e ON e.so_tai_khoan = c.so_tai_khoan
        INNER JOIN 
            dc_khu_vuc f ON b.ma_khu_vuc = f.ma_khu_vuc
        INNER JOIN 
            TD_KHE_UOC KW ON KW.MA_HDTD = a.MA_HDTD
        LEFT JOIN (
            SELECT DISTINCT 
                A.MA_KHU_VUC, 
                B.MA_DIA_LY, 
                B.TEN_DIA_LY 
            FROM 
                DC_DON_VI_KHU_VUC A 
            JOIN 
                DC_DIA_LY B ON A.MA_DIA_LY = B.MA_DIA_LY 
            WHERE 
                MA_PGD LIKE '01'
        ) G ON G.MA_KHU_VUC = F.MA_KHU_VUC
        WHERE 
            e.so_du > 0 
            AND e.ma_chi_nhanh LIKE '01'                       
            AND b.ma_khu_vuc IN ('01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24')
            AND d.ma_san_pham IN ('NH01','NH02','NH03','NH04','NH05','NH06','NH07','TH01','TH02','TH03','TH04','TH05','TH06','TH07')
            AND c.NGAY_GIAI_NGAN >= '00010101'
            AND c.NGAY_GIAI_NGAN <= '99991231'
            AND c.NGAY_DAO_HAN >= '00010101'
            AND c.NGAY_DAO_HAN <= '99991231'
            AND E.loai_tk = 'TKTD'
        ORDER BY 
            a.ngay_vay;
        """,
        "fallback_query": """
        SELECT 
            A.MA_KHE_UOC AS SoHDTD,
            D.MA_KHACH_HANG AS MaKH,
            B.TEN_KHACH_HANG AS HoTen,
            B.SO_CMND AS CCCD,
            B.SO_DI_DONG AS DienThoai,
            B.DIA_CHI AS DiaChi,
            LTRIM(RTRIM(
                CASE 
                    WHEN CHARINDEX(',', B.DIA_CHI) > 0 
                    THEN LEFT(B.DIA_CHI, CHARINDEX(',', B.DIA_CHI) - 1)
                    ELSE B.DIA_CHI 
                END
            )) AS KvThon,
            ISNULL(G.TEN_DIA_LY, N'') AS KvXa,
            D.SO_TIEN_VAY AS TienVay,
            C.SO_DU AS DuNo,
            FORMAT(A.LAI_SUAT, 'N2') AS LaiSuat,
            CONVERT(VARCHAR(10), D.NGAY_VAY, 103) AS NgayVay,
            CONVERT(VARCHAR(10), D.NGAY_DAO_HAN, 103) AS DenHan,
            CONVERT(VARCHAR(10), A.THU_LAI_DEN_NGAY, 103) AS TraLaiDenNgay,
            SP.TEN_SAN_PHAM AS MaLoaiVay,
            D.SO_THANG_VAY AS SoThangVay,
            D.MO_TA_MUC_DICH_VAY AS MoTaVay,
            D.MA_LOAI_HD AS MaLoaiHD,
            A.NHOM_NO_HIEN_TAI AS NhomNo
        FROM dbo.TD_KHE_UOC A 
        INNER JOIN dbo.TD_HOP_DONG_TD D ON A.MA_HDTD = D.MA_HDTD
        INNER JOIN dbo.DC_KHACH_HANG B ON B.MA_KHACH_HANG = D.MA_KHACH_HANG
        INNER JOIN dbo.DC_THANH_VIEN TV ON B.MA_KHACH_HANG = TV.MA_KHACH_HANG
        INNER JOIN dbo.DC_KHU_VUC KV ON B.MA_KHU_VUC = KV.MA_KHU_VUC
        INNER JOIN dbo.KT_TAI_KHOAN C ON C.SO_TAI_KHOAN = A.SO_TAI_KHOAN
        INNER JOIN dbo.vwTD_SAN_PHAM SP ON SP.MA_SAN_PHAM = A.MA_SAN_PHAM
        INNER JOIN dbo.DC_LOAI_VAY LV ON LV.MA_LOAI_VAY = SP.MA_LOAI_VAY
        LEFT JOIN (
            SELECT DISTINCT 
                A.MA_KHU_VUC, 
                B.MA_DIA_LY, 
                B.TEN_DIA_LY 
            FROM dbo.DC_DON_VI_KHU_VUC A 
            INNER JOIN dbo.DC_DIA_LY B ON A.MA_DIA_LY = B.MA_DIA_LY 
            WHERE A.MA_PGD LIKE '01'
        ) G ON G.MA_KHU_VUC = KV.MA_KHU_VUC
        WHERE C.SO_DU > 0
        ORDER BY D.MA_KHACH_HANG, D.NGAY_VAY DESC;
        """,
        "field_mapping": {
            "sohdtd": "SoHDTD",
            "so_hdtd": "SoHDTD",
            "makh": "MaKH",
            "ma_khach_hang": "MaKH",
            "tenkh": "HoTen",
            "hoten": "HoTen",
            "ten_khach_hang": "HoTen",
            "cccd": "CCCD",
            "so_cmnd": "CCCD",
            "dienthoai": "DienThoai",
            "so_di_dong": "DienThoai",
            "diachi": "DiaChi",
            "ten_khu_vuc": "DiaChi",
            "kvthon": "KvThon",
            "khuvuc": "KvXa",
            "kvxa": "KvXa",
            "ten_dia_ly": "KvXa",
            "ngayvay": "NgayVay",
            "ngay_vay": "NgayVay",
            "denhan": "DenHan",
            "ngay_dao_han": "DenHan",
            "laisuat": "LaiSuat",
            "lai_suat": "LaiSuat",
            "tienvay": "TienVay",
            "so_tien_gn": "TienVay",
            "duno": "DuNo",
            "so_du": "DuNo",
            "tl_denngay": "TraLaiDenNgay",
            "tldenngay": "TraLaiDenNgay",
            "tralaidenngay": "TraLaiDenNgay",
            "thu_lai_den_ngay": "TraLaiDenNgay",
            "sothangvay": "SoThangVay",
            "so_thang_vay": "SoThangVay",
            "loaivay": "MaLoaiVay",
            "maloaivay": "MaLoaiVay",
            "maloaihd": "MaLoaiHD",
            "ma_loai_hd": "MaLoaiHD",
            "mucdich": "MoTaVay",
            "motavay": "MoTaVay",
            "mo_ta_muc_dich_vay": "MoTaVay",
            "nhomno": "NhomNo",
            "nhom_no_hien_tai": "NhomNo"
        }
    },

    # ------------------------------------------------------------------------------------
    # 4. HDTD_CORE_ALL: TRÍCH XUẤT HĐTD CÁC NGÀY CUỐI THÁNG (DÙNG CHO SO SÁNH & TOP 50 BQ)
    # ------------------------------------------------------------------------------------
    "HDTD_CORE_ALL": {
        "sheet_name": "HDTD_CORE_ALL",
        "description": "Kho lưu trữ sao kê HĐTD các ngày cuối tháng (Diễn biến tháng, so sánh tăng trưởng & Top 50 BQ)",
        "query": """
        DECLARE @denngay VARCHAR(8) = '{denngay}';

        SELECT 
            a.so_hdtd AS SoHDTD,
            b.ma_khach_hang AS MaKH,
            b.ten_khach_hang AS TenKH,
            b.SO_CMND AS CCCD,
            b.SO_DI_DONG AS DienThoai,
            f.ten_khu_vuc AS DiaChi,
            LTRIM(RTRIM(
                CASE 
                    WHEN CHARINDEX(',', B.DIA_CHI) > 0 
                    THEN LEFT(B.DIA_CHI, CHARINDEX(',', B.DIA_CHI) - 1)
                    ELSE B.DIA_CHI 
                END
            )) AS KvThon,
            ISNULL(G.TEN_DIA_LY, '') AS KhuVuc,
            CONVERT(VARCHAR(10), CONVERT(DATETIME, LEFT(a.ngay_vay, 8), 103), 103) AS NgayVay,
            CONVERT(VARCHAR(10), CONVERT(DATETIME, LEFT(a.ngay_dao_han, 8), 103), 103) AS DenHan,
            CAST(c.lai_suat AS FLOAT) / 100 AS LaiSuat,
            CONVERT(INT, c.so_tien_gn) AS TienVay,
            CONVERT(INT, e.so_du) AS DuNo,
            CONVERT(VARCHAR(10), CONVERT(DATETIME, LEFT(kw.thu_lai_den_ngay, 8), 103), 103) AS TL_DenNgay,
            a.SO_THANG_VAY AS SoThangVay,
            d.MA_LOAI_VAY AS LoaiVay, 
            A.MA_LOAI_HD AS MaLoaiHD,
            A.MO_TA_MUC_DICH_VAY AS MucDich,
            C.nhom_no_hien_tai AS NhomNo
        FROM 
            td_hop_dong_td a 
        INNER JOIN (
            SELECT DISTINCT 
                kh.*, 
                ISNULL(tv.SO_THANH_VIEN, '') AS so_thanh_vien 
            FROM 
                dc_khach_hang kh 
            LEFT JOIN (
                SELECT 
                    ma_khach_hang, 
                    MIN(so_thanh_vien) AS so_thanh_vien 
                FROM 
                    fn_dc_thanh_vien_ls(@denngay, '%') 
                GROUP BY 
                    ma_khach_hang
            ) tv ON kh.ma_khach_hang = tv.ma_khach_hang 
        ) b ON a.ma_khach_hang = b.ma_khach_hang
        INNER JOIN 
            fn_TD_KHE_UOC_LS('01', @denngay) c ON a.ma_hdtd = c.ma_hdtd 
            AND c.nhom_no_hien_tai IN ('NHOM1', 'NHOM2', 'NHOM3', 'NHOM4', 'NHOM5')
        INNER JOIN 
            td_san_pham d ON c.ma_san_pham = d.ma_san_pham
        INNER JOIN 
            fn_KT_TAI_KHOAN_LS_CHI_NHANH(@denngay, 'TKTD', '01') e ON e.so_tai_khoan = c.so_tai_khoan
        INNER JOIN 
            dc_khu_vuc f ON b.ma_khu_vuc = f.ma_khu_vuc
        INNER JOIN 
            TD_KHE_UOC KW ON KW.MA_HDTD = a.MA_HDTD
        LEFT JOIN (
            SELECT DISTINCT 
                A.MA_KHU_VUC, 
                B.MA_DIA_LY, 
                B.TEN_DIA_LY 
            FROM 
                DC_DON_VI_KHU_VUC A 
            JOIN 
                DC_DIA_LY B ON A.MA_DIA_LY = B.MA_DIA_LY 
            WHERE 
                MA_PGD LIKE '01'
        ) G ON G.MA_KHU_VUC = F.MA_KHU_VUC
        WHERE 
            e.so_du > 0 
            AND e.ma_chi_nhanh LIKE '01'                       
            AND b.ma_khu_vuc IN ('01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24')
            AND d.ma_san_pham IN ('NH01','NH02','NH03','NH04','NH05','NH06','NH07','TH01','TH02','TH03','TH04','TH05','TH06','TH07')
            AND c.NGAY_GIAI_NGAN >= '00010101'
            AND c.NGAY_GIAI_NGAN <= '99991231'
            AND c.NGAY_DAO_HAN >= '00010101'
            AND c.NGAY_DAO_HAN <= '99991231'
            AND E.loai_tk = 'TKTD'
        ORDER BY 
            a.ngay_vay;
        """,
        "fallback_query": """
        SELECT 
            A.MA_KHE_UOC AS SoHDTD,
            D.MA_KHACH_HANG AS MaKH,
            B.TEN_KHACH_HANG AS HoTen,
            B.SO_CMND AS CCCD,
            B.SO_DI_DONG AS DienThoai,
            B.DIA_CHI AS DiaChi,
            LTRIM(RTRIM(
                CASE 
                    WHEN CHARINDEX(',', B.DIA_CHI) > 0 
                    THEN LEFT(B.DIA_CHI, CHARINDEX(',', B.DIA_CHI) - 1)
                    ELSE B.DIA_CHI 
                END
            )) AS KvThon,
            ISNULL(G.TEN_DIA_LY, N'') AS KvXa,
            D.SO_TIEN_VAY AS TienVay,
            C.SO_DU AS DuNo,
            FORMAT(A.LAI_SUAT, 'N2') AS LaiSuat,
            CONVERT(VARCHAR(10), D.NGAY_VAY, 103) AS NgayVay,
            CONVERT(VARCHAR(10), D.NGAY_DAO_HAN, 103) AS DenHan,
            CONVERT(VARCHAR(10), A.THU_LAI_DEN_NGAY, 103) AS TraLaiDenNgay,
            SP.TEN_SAN_PHAM AS MaLoaiVay,
            D.SO_THANG_VAY AS SoThangVay,
            D.MO_TA_MUC_DICH_VAY AS MoTaVay,
            D.MA_LOAI_HD AS MaLoaiHD,
            A.NHOM_NO_HIEN_TAI AS NhomNo
        FROM dbo.TD_KHE_UOC A 
        INNER JOIN dbo.TD_HOP_DONG_TD D ON A.MA_HDTD = D.MA_HDTD
        INNER JOIN dbo.DC_KHACH_HANG B ON B.MA_KHACH_HANG = D.MA_KHACH_HANG
        INNER JOIN dbo.DC_THANH_VIEN TV ON B.MA_KHACH_HANG = TV.MA_KHACH_HANG
        INNER JOIN dbo.DC_KHU_VUC KV ON B.MA_KHU_VUC = KV.MA_KHU_VUC
        INNER JOIN dbo.KT_TAI_KHOAN C ON C.SO_TAI_KHOAN = A.SO_TAI_KHOAN
        INNER JOIN dbo.vwTD_SAN_PHAM SP ON SP.MA_SAN_PHAM = A.MA_SAN_PHAM
        INNER JOIN dbo.DC_LOAI_VAY LV ON LV.MA_LOAI_VAY = SP.MA_LOAI_VAY
        LEFT JOIN (
            SELECT DISTINCT 
                A.MA_KHU_VUC, 
                B.MA_DIA_LY, 
                B.TEN_DIA_LY 
            FROM dbo.DC_DON_VI_KHU_VUC A 
            INNER JOIN dbo.DC_DIA_LY B ON A.MA_DIA_LY = B.MA_DIA_LY 
            WHERE A.MA_PGD LIKE '01'
        ) G ON G.MA_KHU_VUC = KV.MA_KHU_VUC
        WHERE C.SO_DU > 0
        ORDER BY D.MA_KHACH_HANG, D.NGAY_VAY DESC;
        """,
        "field_mapping": {
            "sohdtd": "SoHDTD",
            "so_hdtd": "SoHDTD",
            "makh": "MaKH",
            "ma_khach_hang": "MaKH",
            "tenkh": "HoTen",
            "hoten": "HoTen",
            "ten_khach_hang": "HoTen",
            "cccd": "CCCD",
            "so_cmnd": "CCCD",
            "dienthoai": "DienThoai",
            "so_di_dong": "DienThoai",
            "diachi": "DiaChi",
            "ten_khu_vuc": "DiaChi",
            "kvthon": "KvThon",
            "khuvuc": "KvXa",
            "kvxa": "KvXa",
            "ten_dia_ly": "KvXa",
            "ngayvay": "NgayVay",
            "ngay_vay": "NgayVay",
            "denhan": "DenHan",
            "ngay_dao_han": "DenHan",
            "laisuat": "LaiSuat",
            "lai_suat": "LaiSuat",
            "tienvay": "TienVay",
            "so_tien_gn": "TienVay",
            "duno": "DuNo",
            "so_du": "DuNo",
            "tl_denngay": "TraLaiDenNgay",
            "tldenngay": "TraLaiDenNgay",
            "tralaidenngay": "TraLaiDenNgay",
            "thu_lai_den_ngay": "TraLaiDenNgay",
            "sothangvay": "SoThangVay",
            "so_thang_vay": "SoThangVay",
            "loaivay": "MaLoaiVay",
            "maloaivay": "MaLoaiVay",
            "maloaihd": "MaLoaiHD",
            "ma_loai_hd": "MaLoaiHD",
            "mucdich": "MoTaVay",
            "motavay": "MoTaVay",
            "mo_ta_muc_dich_vay": "MoTaVay",
            "nhomno": "NhomNo",
            "nhom_no_hien_tai": "NhomNo"
        }
    }
}

# Alias HDTD_CORE_D trỏ về cấu hình chuẩn HDTD_CORE_DN
REGISTERED_QUERIES["HDTD_CORE_D"] = REGISTERED_QUERIES["HDTD_CORE_DN"]

def register_custom_sql(table_key, sql_query, sheet_name=None, field_mapping=None, description=""):
    """
    Cho phép cập nhật hoặc thay thế câu lệnh SQL cho 1 trong các bảng lõi.
    """
    key = table_key.upper().strip()
    target_key = "HDTD_CORE_DN" if key in ("HDTD_CORE_D", "HDTD_CORE_DN") else key
    if target_key in REGISTERED_QUERIES:
        REGISTERED_QUERIES[target_key]["query"] = sql_query.strip()
        if sheet_name:
            REGISTERED_QUERIES[target_key]["sheet_name"] = sheet_name
        if field_mapping:
            REGISTERED_QUERIES[target_key]["field_mapping"].update(field_mapping)
        if description:
            REGISTERED_QUERIES[target_key]["description"] = description
    else:
        REGISTERED_QUERIES[target_key] = {
            "sheet_name": sheet_name or target_key,
            "description": description or f"Truy vấn SQL cho bảng {target_key}",
            "query": sql_query.strip(),
            "field_mapping": field_mapping or {}
        }
    if target_key == "HDTD_CORE_DN":
        REGISTERED_QUERIES["HDTD_CORE_D"] = REGISTERED_QUERIES["HDTD_CORE_DN"]

def get_query_definition(table_key):
    """
    Lấy thông tin cấu hình câu lệnh SQL cho một bảng (hỗ trợ cả HDTD_CORE_D và HDTD_CORE_DN).
    """
    key = table_key.upper().strip()
    if key in ("HDTD_CORE_D", "HDTD_CORE_DN"):
        return REGISTERED_QUERIES.get("HDTD_CORE_DN")
    return REGISTERED_QUERIES.get(key)

def list_registered_tables():
    """
    Liệt kê đúng 4 bảng lõi được cấp phép từ SQL Server CoreBanking:
    1. KH_CORE: Danh bạ Khách hàng & Thành viên
    2. HDTD_CORE: HĐTD hiện tại (Báo cáo Tổng quan)
    3. HDTD_CORE_DN (hoặc HDTD_CORE_D): HĐTD đến ngày chốt (Báo cáo Tổng quan & Sao kê đến ngày)
    4. HDTD_CORE_ALL: HĐTD các ngày cuối tháng (So sánh tăng trưởng & Top 50 BQ)
    """
    unique_keys = ["KH_CORE", "HDTD_CORE", "HDTD_CORE_DN", "HDTD_CORE_ALL"]
    return [
        {
            "key": k,
            "sheet_name": REGISTERED_QUERIES[k]["sheet_name"],
            "description": REGISTERED_QUERIES[k]["description"]
        }
        for k in unique_keys if k in REGISTERED_QUERIES
    ]

