"""
========================================================================================
HỆ THỐNG QUẢN LÝ TÍN DỤNG & TRÍCH NỢ AUTOMATION - CREDITCORES (QTDND YÊN THỌ)
File: sql_queries.py
Mục đích: Trung tâm đăng ký và quản lý tập trung các câu lệnh SQL trích xuất từ CoreBanking NG-eFUND.
          Hỗ trợ:
          1. Nhận các câu lệnh SQL tùy chỉnh do người dùng cung cấp bất kỳ lúc nào.
          2. Field Mapping thông minh: Tự động ánh xạ tên cột SQL sang Header Google Sheets.
          3. Hỗ trợ tham số động: {denngay}, {chinhanh}, {year}...
========================================================================================
"""

from datetime import datetime

# ========================================================================================
# 1. ĐĂNG KÝ CÂU LỆNH SQL CHO TỪNG BẢNG NGHIỆP VỤ
# ========================================================================================

REGISTERED_QUERIES = {
    # ------------------------------------------------------------------------------------
    # BẢNG 1: KH_CORE (Khách hàng, CCCD, Thôn Xã, Thành viên vốn góp)
    # ------------------------------------------------------------------------------------
    "KH_CORE": {
        "sheet_name": "KH_CORE",
        "description": "Danh bạ khách hàng, hồ sơ định danh CCCD, thành viên vốn góp và địa bàn cư trú",
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
        # Bản đồ ánh xạ nếu tên cột SQL trả về khác với Header Google Sheets
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
    # BẢNG 2: HDTD_CORE (Hợp đồng tín dụng & Dư nợ hiện hành)
    # ------------------------------------------------------------------------------------
    "HDTD_CORE": {
        "sheet_name": "HDTD_CORE",
        "description": "Khế ước nhận nợ, hợp đồng tín dụng mẹ, dư nợ hiện tại và lãi suất vay",
        "query": """
        DECLARE @denngay VARCHAR(50);
        SET @denngay = '{denngay}';
        SELECT 
            a.so_hdtd AS SoHDTD,
            b.ma_khach_hang AS MaKH,
            b.ten_khach_hang AS HoTen,
            b.so_cmnd AS CCCD,
            b.so_di_dong AS DienThoai,
            f.ten_khu_vuc AS DiaChi,
            ISNULL(G.TEN_DIA_LY, '') AS KvXa,
            CONVERT(INT, c.so_tien_gn) AS TienVay,
            CONVERT(INT, e.so_du) AS DuNo,
            CONVERT(VARCHAR, c.lai_suat) AS LaiSuat,
            CONVERT(VARCHAR(10), CONVERT(DATETIME, LEFT(a.ngay_vay, 8), 103), 103) AS NgayVay,
            CONVERT(VARCHAR(10), CONVERT(DATETIME, LEFT(a.ngay_dao_han, 8), 103), 103) AS DenHan,
            a.SO_THANG_VAY AS SoThangVay,
            sp.TEN_SAN_PHAM AS MaLoaiVay,
            a.MO_TA_MUC_DICH_VAY AS MoTaVay,
            a.MA_LOAI_HD AS MaLoaiHD
        FROM td_hop_dong_td a 
            INNER JOIN (
                SELECT DISTINCT kh.*, ISNULL(tv.SO_THANH_VIEN, '') AS so_thanh_vien 
                FROM dc_khach_hang kh 
                LEFT JOIN (
                    SELECT ma_khach_hang, MIN(so_thanh_vien) AS so_thanh_vien 
                    FROM fn_dc_thanh_vien_ls(@denngay, '%') 
                    GROUP BY ma_khach_hang
                ) tv ON kh.ma_khach_hang = tv.ma_khach_hang
            ) b ON a.ma_khach_hang = b.ma_khach_hang
            INNER JOIN fn_TD_KHE_UOC_LS('{chinhanh}', @denngay) c ON a.ma_hdtd = c.ma_hdtd 
                AND c.nhom_no_hien_tai IN ('NHOM1','NHOM2','NHOM3','NHOM4','NHOM5','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','')
            INNER JOIN td_san_pham d ON c.ma_san_pham = d.ma_san_pham
            INNER JOIN vwTD_SAN_PHAM sp ON a.MA_SAN_PHAM = sp.MA_SAN_PHAM
            INNER JOIN fn_KT_TAI_KHOAN_LS_CHI_NHANH(@denngay, 'TKTD', '{chinhanh}') e ON e.so_tai_khoan = c.so_tai_khoan
            INNER JOIN dc_khu_vuc f ON b.ma_khu_vuc = f.ma_khu_vuc
            LEFT JOIN (
                SELECT DISTINCT A.MA_KHU_VUC, B.MA_DIA_LY, B.TEN_DIA_LY 
                FROM DC_DON_VI_KHU_VUC A 
                JOIN DC_DIA_LY B ON A.MA_DIA_LY = B.MA_DIA_LY
            ) G ON B.MA_KHU_VUC = G.MA_KHU_VUC
        WHERE e.so_du > 0 
            AND e.ma_chi_nhanh LIKE '{chinhanh}'                       
            AND E.loai_tk = 'TKTD'
        ORDER BY a.so_hdtd;
        """,
        "fallback_query": """
        SELECT 
            A.MA_KHE_UOC AS SoHDTD,
            D.MA_KHACH_HANG AS MaKH,
            B.TEN_KHACH_HANG AS HoTen,
            B.SO_CMND AS CCCD,
            B.SO_DI_DONG AS DienThoai,
            B.DIA_CHI AS DiaChi,
            ISNULL(KV.TEN_KHU_VUC, '') AS KvXa,
            D.SO_TIEN_VAY AS TienVay,
            C.SO_DU AS DuNo,
            FORMAT(A.LAI_SUAT, 'N2') AS LaiSuat,
            CONVERT(VARCHAR(10), D.NGAY_VAY, 103) AS NgayVay,
            CONVERT(VARCHAR(10), D.NGAY_DAO_HAN, 103) AS DenHan,
            CONVERT(VARCHAR(10), A.THU_LAI_DEN_NGAY, 103) AS TraLaiDenNgay,
            SP.TEN_SAN_PHAM AS MaLoaiVay,
            D.SO_THANG_VAY AS SoThangVay,
            D.MO_TA_MUC_DICH_VAY AS MoTaVay,
            D.MA_LOAI_HD AS MaLoaiHD
        FROM dbo.TD_KHE_UOC A 
        INNER JOIN dbo.TD_HOP_DONG_TD D ON A.MA_HDTD = D.MA_HDTD
        INNER JOIN dbo.DC_KHACH_HANG B ON B.MA_KHACH_HANG = D.MA_KHACH_HANG
        INNER JOIN dbo.DC_THANH_VIEN TV ON B.MA_KHACH_HANG = TV.MA_KHACH_HANG
        INNER JOIN dbo.DC_KHU_VUC KV ON B.MA_KHU_VUC = KV.MA_KHU_VUC
        INNER JOIN dbo.KT_TAI_KHOAN C ON C.SO_TAI_KHOAN = A.SO_TAI_KHOAN
        INNER JOIN dbo.vwTD_SAN_PHAM SP ON SP.MA_SAN_PHAM = A.MA_SAN_PHAM
        INNER JOIN dbo.DC_LOAI_VAY LV ON LV.MA_LOAI_VAY = SP.MA_LOAI_VAY
        WHERE C.SO_DU > 0
        ORDER BY D.MA_KHACH_HANG, D.NGAY_VAY DESC;
        """,
        "field_mapping": {
            "sohdtd": "SoHDTD",
            "ma_khe_uoc": "SoHDTD",
            "so_hdtd": "SoHDTD",
            "makh": "MaKH",
            "ma_khach_hang": "MaKH",
            "hoten": "HoTen",
            "tenkh": "HoTen",
            "ten_khach_hang": "HoTen",
            "cccd": "CCCD",
            "so_cmnd": "CCCD",
            "dienthoai": "DienThoai",
            "so_di_dong": "DienThoai",
            "diachi": "DiaChi",
            "dia_chi": "DiaChi",
            "kvxa": "KvXa",
            "ten_dia_ly": "KvXa",
            "tienvay": "TienVay",
            "so_tien_vay": "TienVay",
            "so_tien_gn": "TienVay",
            "duno": "DuNo",
            "so_du": "DuNo",
            "laisuat": "LaiSuat",
            "lai_suat": "LaiSuat",
            "ngayvay": "NgayVay",
            "ngay_vay": "NgayVay",
            "denhan": "DenHan",
            "ngay_dao_han": "DenHan",
            "tralaidenngay": "TraLaiDenNgay",
            "thu_lai_den_ngay": "TraLaiDenNgay",
            "sothangvay": "SoThangVay",
            "so_thang_vay": "SoThangVay",
            "maloaivay": "MaLoaiVay",
            "ten_san_pham": "MaLoaiVay",
            "motavay": "MoTaVay",
            "mo_ta_muc_dich_vay": "MoTaVay",
            "mucdichvay": "MoTaVay",
            "maloaihd": "MaLoaiHD",
            "ma_loai_hd": "MaLoaiHD"
        }
    },

    # ------------------------------------------------------------------------------------
    # BẢNG 3: TSBD_CORE (Tài sản bảo đảm, Thế chấp, Sổ đỏ, Đăng ký GDBĐ)
    # ------------------------------------------------------------------------------------
    "TSBD_CORE": {
        "sheet_name": "TSBD_CORE",
        "description": "Hồ sơ tài sản bảo đảm thế chấp, Giấy chứng nhận QSD đất, giá trị định giá",
        "query": """
        SELECT 
            ts.MA_TSBD AS MaTSBD,
            ts.SO_GCN AS SoGCN,
            ts.SO_VAO_SO AS SoVaoSoCapGCN,
            CONVERT(VARCHAR(10), ts.NGAY_CAP_GCN, 103) AS NgayCapGCN,
            ts.NOI_CAP_GCN AS NoiCapGCN,
            ts.MA_KHACH_HANG AS MaKH,
            ts.TEN_CHU_SO_HUU AS ChuSoHuu,
            ts.CCCD_CHU_TS AS CCCD_ChuTS,
            ts.QUAN_HE_CHU_TS AS QuanHeChuTS,
            ts.NGUOI_DONG_SO_HUU AS NguoiDongSoHuu,
            ts.THUA_DAT_SO AS ThuaDatSo,
            ts.TO_BAN_DO_SO AS ToBanDoSo,
            ts.DIA_CHI_THUA_DAT AS DiaChiThuaDat,
            CONVERT(INT, ts.DIEN_TICH) AS DienTich,
            ts.HINH_THUC_SU_DUNG AS HinhThucSuDung,
            ts.CHI_TIET_PHAN_LOAI_DAT AS ChiTietPhanLoaiDat,
            ts.NGUON_GOC_SU_DUNG AS NguonGocSuDung,
            CONVERT(INT, ts.GIA_TRI_DINH_GIA_QTD) AS GiaTriDinhGiaQTD,
            CONVERT(INT, ts.GIA_TRI_THI_TRUONG) AS GiaTriThiTruong,
            CONVERT(DECIMAL(5,2), ts.TY_LE_CHO_VAY_TOI_DA) AS TyLeChoVayToiDa,
            CONVERT(INT, ts.SO_TIEN_DAM_BAO_TOI_DA) AS SoTienDamBaoToiDa,
            ts.TRANG_THAI_THE_CHAP AS TrangThaiTheChap,
            ts.SO_HDTD_LIEN_KET AS SoHDTD_LienKet,
            ts.SO_CONG_CHUNG AS SoCongChung,
            CONVERT(VARCHAR(10), ts.NGAY_CONG_CHUNG, 103) AS NgayCongChung,
            ts.VAN_PHONG_CONG_CHUNG AS VanPhongCongChung,
            ts.SO_DANG_KY_GDBD AS SoDangKyGDBD,
            CONVERT(VARCHAR(10), ts.NGAY_DANG_KY_GDBD, 103) AS NgayDangKyGDBD,
            ts.HINH_ANH_GCN AS HinhAnhGCN,
            ts.HINH_ANH_THUC_DIA AS HinhAnhThucDia
        FROM dbo.TD_TAI_SAN_DAM_BAO ts WITH (NOLOCK)
        ORDER BY ts.MA_KHACH_HANG, ts.MA_TSBD;
        """,
        "field_mapping": {
            "matsbd": "MaTSBD",
            "sogcn": "SoGCN",
            "sovaosocapgcn": "SoVaoSoCapGCN",
            "ngaycapgcn": "NgayCapGCN",
            "noicapgcn": "NoiCapGCN",
            "makh": "MaKH",
            "ma_khach_hang": "MaKH",
            "chusohuu": "ChuSoHuu",
            "cccd_chuts": "CCCD_ChuTS",
            "quanhechuts": "QuanHeChuTS",
            "nguoidongsohuu": "NguoiDongSoHuu",
            "thuadatso": "ThuaDatSo",
            "tobandoso": "ToBanDoSo",
            "diachithuadat": "DiaChiThuaDat",
            "dientich": "DienTich",
            "hinhthucsudung": "HinhThucSuDung",
            "chitietphanloaidat": "ChiTietPhanLoaiDat",
            "nguongocsudung": "NguonGocSuDung",
            "giatridinhgiaqtd": "GiaTriDinhGiaQTD",
            "giatrithitruong": "GiaTriThiTruong",
            "tylecho vaytoida": "TyLeChoVayToiDa",
            "sotiendambaotoida": "SoTienDamBaoToiDa",
            "trangthaithechap": "TrangThaiTheChap",
            "sohdtd_lienket": "SoHDTD_LienKet",
            "socongchung": "SoCongChung",
            "ngaycongchung": "NgayCongChung",
            "vanphongcongchung": "VanPhongCongChung",
            "sodangkygdbd": "SoDangKyGDBD",
            "ngaydangkygdbd": "NgayDangKyGDBD",
            "hinhanhgcn": "HinhAnhGCN",
            "hinhanhthucdia": "HinhAnhThucDia"
        }
    },

    # ------------------------------------------------------------------------------------
    # BẢNG 4: CASA_CORE (Tài khoản tiền gửi thanh toán để trích nợ tự động)
    # ------------------------------------------------------------------------------------
    "CASA_CORE": {
        "sheet_name": "DANG_KY_TRICH_NO",
        "description": "Tài khoản tiền gửi thanh toán CASA của thành viên vay vốn phục vụ trích nợ",
        "query": """
        SELECT 
            tk.MA_KHACH_HANG AS MaKH,
            kh.TEN_KHACH_HANG AS HoTen,
            kh.SO_CMND AS CCCD,
            CONVERT(VARCHAR(10), kh.NGAY_CAP, 103) AS NgayCap,
            kh.SO_DI_DONG AS DienThoai,
            kh.DIA_CHI AS DiaChi,
            tk.SO_TAI_KHOAN AS SoTK,
            'KY_15' AS KyTrichMacDinh,
            CASE WHEN tk.TRANG_THAI = 'A' THEN 'ACTIVE' ELSE 'INACTIVE' END AS TrangThai,
            'Đồng bộ từ CoreBanking' AS GhiChu,
            CONVERT(VARCHAR(10), tk.NGAY_MO, 103) AS NgayTao
        FROM dbo.KT_TAI_KHOAN tk WITH (NOLOCK)
        INNER JOIN dbo.DC_KHACH_HANG kh WITH (NOLOCK) ON tk.MA_KHACH_HANG = kh.MA_KHACH_HANG
        WHERE tk.MA_LOAI_TIEN_GUI IN ('TGTT', 'CASA')
        ORDER BY tk.MA_KHACH_HANG;
        """,
        "field_mapping": {
            "makh": "MaKH",
            "ma_khach_hang": "MaKH",
            "hoten": "HoTen",
            "ten_khach_hang": "HoTen",
            "cccd": "CCCD",
            "so_cmnd": "CCCD",
            "ngaycap": "NgayCap",
            "dienthoai": "DienThoai",
            "so_di_dong": "DienThoai",
            "diachi": "DiaChi",
            "sotk": "SoTK",
            "so_tai_khoan": "SoTK",
            "kytrichmacdinh": "KyTrichMacDinh",
            "trangthai": "TrangThai",
            "ghichu": "GhiChu",
            "ngaytao": "NgayTao"
        }
    }
}

# ========================================================================================
# 2. HÀM ĐĂNG KÝ VÀ CẬP NHẬT CÂU LỆNH SQL ĐỘNG DO NGƯỜI DÙNG CUNG CẤP
# ========================================================================================

def register_custom_sql(table_key, sql_query, sheet_name=None, field_mapping=None, description=""):
    """
    Cho phép người dùng hoặc hệ thống đăng ký hoặc cập nhật đè câu lệnh SQL cho bất kỳ bảng nào.
    """
    key = table_key.upper().strip()
    if key not in REGISTERED_QUERIES:
        REGISTERED_QUERIES[key] = {
            "sheet_name": sheet_name or key,
            "description": description or f"Truy vấn tùy chỉnh cho bảng {key}",
            "query": sql_query.strip(),
            "field_mapping": field_mapping or {}
        }
    else:
        REGISTERED_QUERIES[key]["query"] = sql_query.strip()
        if sheet_name:
            REGISTERED_QUERIES[key]["sheet_name"] = sheet_name
        if field_mapping:
            REGISTERED_QUERIES[key]["field_mapping"].update(field_mapping)
        if description:
            REGISTERED_QUERIES[key]["description"] = description

def get_query_definition(table_key):
    """
    Lấy thông tin cấu hình câu lệnh SQL cho một bảng.
    """
    key = table_key.upper().strip()
    return REGISTERED_QUERIES.get(key)

def list_registered_tables():
    """
    Liệt kê tất cả các bảng đã được cấu hình SQL.
    """
    return [
        {
            "key": k,
            "sheet_name": v["sheet_name"],
            "description": v["description"]
        }
        for k, v in REGISTERED_QUERIES.items()
    ]
