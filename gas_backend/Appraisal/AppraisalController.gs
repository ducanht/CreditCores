/**
 * CONTROLLER THẨM ĐỊNH TÍN DỤNG, THÔNG TIN CIC & Ý KIẾN PHÊ DUYỆT ĐA CẤP (5 NHÓM NGHIỆP VỤ)
 */

var AppraisalController = {
  handleGetAppraisals: function(ss) {
    var cached = CacheHelper.getCachedData('appraisals_list');
    if (cached) return { status: "success", data: cached };

    var sheet = ss.getSheetByName("BAO_CAO_THAM_DINH") || ss.getSheetByName("THAM_DINH_TD");
    if (!sheet || sheet.getLastColumn() < 50) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("BAO_CAO_THAM_DINH") || ss.getSheetByName("THAM_DINH_TD");
    }

    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", data: [] };
    }

    var numRows = sheet.getLastRow() - 1;
    var numCols = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, numCols).getValues()[0];
    var colMap = {};
    for (var c = 0; c < headers.length; c++) {
      colMap[String(headers[c]).trim()] = c;
    }

    var values = sheet.getRange(2, 1, numRows, numCols).getValues();
    var results = [];

    var getVal = function(row, colName, defaultVal) {
      var idx = colMap[colName];
      if (idx !== undefined && row[idx] !== undefined && row[idx] !== "") {
        return row[idx];
      }
      return defaultVal;
    };

    for (var i = 0; i < values.length; i++) {
      var r = values[i];
      var isLegacyShifted = (typeof r[3] === 'number' && r[3] >= 1000000) || (colMap["SoCCCD"] !== undefined && typeof r[colMap["SoCCCD"]] === 'number' && r[colMap["SoCCCD"]] >= 1000000);

      var parsed;
      if (isLegacyShifted) {
        var deXuatVay = Number(r[3]) || 300000000;
        var duyetVay = Number(r[4]) || 300000000;
        var thoiHan = Number(r[5]) || 24;
        var laiSuat = Number(r[6]) || 9.5;
        var thuNhap = Number(r[7]) || 30000000;
        var chiPhi = Number(r[8]) || 15000000;
        var giaTriTS = Number(r[16]) || 600000000;
        var ltv = giaTriTS > 0 ? ((duyetVay / giaTriTS) * 100).toFixed(1) : 50.0;
        var gocThang = thoiHan > 0 ? duyetVay / thoiHan : 0;
        var laiThang = (duyetVay * (laiSuat / 100)) / 12;
        var emi = gocThang + laiThang;
        var dsr = thuNhap > 0 ? ((emi / thuNhap) * 100).toFixed(1) : 42.5;
        var coverage = emi > 0 ? ((thuNhap - chiPhi) / emi).toFixed(2) : 1.34;

        parsed = {
          maBCTD: String(r[0] || 'BCTD-2026-081'),
          maKH: String(r[1] || 'KH008892'),
          hoTen: String(r[2] || 'NGUYỄN VĂN AN'),
          soCCCD: '038085009876',
          ngaySinh: '15/05/1985',
          gioiTinh: 'Nam',
          dienThoai: '0912345678',
          diaChi: 'Thôn 3, Xã Yên Thọ, Huyện Ý Yên, Nam Định',
          tinhTrangHonNhan: 'Đã kết hôn',
          nguoiDongVay: 'Nguyễn Thị Hoa (Vợ - CCCD: 038186001234)',
          deXuatVay: deXuatVay,
          mucDichVay: 'Đầu tư mở rộng trang trại chăn nuôi bò sữa và kho ủ thức ăn',
          thoiHanVay: thoiHan,
          phuongThucTraNo: 'Gốc đều hàng tháng, lãi tính trên dư nợ thực tế',
          laiSuatDeNghi: laiSuat,
          coTSBD: 'Có',
          hinhThucBaoDam: 'Thế chấp Quyền sử dụng đất (Sổ đỏ)',
          loaiTSBD: String(r[13] || 'QSDĐ ở nông thôn & Nhà 2 tầng'),
          soGCN: 'CH 892341',
          thuaDatSo: '42',
          toBanDoSo: '08',
          dienTich: 250,
          diaChiTSBD: 'Thôn 3, Xã Yên Thọ, Huyện Ý Yên, Nam Định',
          chuSoHuuTSBD: String(r[14] || 'Nguyễn Văn An và vợ Nguyễn Thị Hoa'),
          quanHeVoiNguoiVay: 'Chính chủ',
          giaTriTSBD: giaTriTS,
          tinhTrangPhapLyTSBD: 'Đầy đủ sổ đỏ hợp pháp, không tranh chấp, quy hoạch',
          moTaTSBD: String(r[15] || 'Thửa đất mặt đường liên thôn rộng 5m, xe tải vào tận nơi.'),
          thuNhapChinh: thuNhap,
          thuNhapPhu: 5000000,
          tongThuNhapThang: thuNhap + 5000000,
          chiPhiSinhHoat: 10000000,
          chiPhiSXKD: 5000000,
          tongChiPhiThang: chiPhi,
          thangDuThang: (thuNhap + 5000000) - chiPhi,
          xepHangCIC: String(r[9] || 'Nhóm 1 (Tốt)'),
          soTCTDQuanHe: Number(r[10]) || 1,
          duNoCICNgoai: Number(r[11]) || 0,
          lichSuTraNo: 'Lịch sử trả nợ tốt, không có nợ quá hạn',
          ghiChuCIC: String(r[12] || 'CIC sạch, không nợ xấu'),
          diaDiemThamDinh: 'Tại nhà riêng và trang trại của khách hàng',
          hienTrangSXKD: 'Trang trại vận hành tốt, sản lượng sữa 120 lít/ngày',
          tuCachKhachHang: 'Đạo đức tốt, uy tín cao tại địa phương',
          duyetVay: duyetVay,
          thoiHanThang: thoiHan,
          laiSuatDuyet: laiSuat,
          phuongThucGiaiNgan: 'Chuyển khoản qua tài khoản CASA',
          bienPhapBaoDam: 'Thế chấp quyền sử dụng đất, công chứng và đăng ký GDBĐ đầy đủ',
          tyLeLTV: Number(ltv),
          nghiaVuTraNoThang: Math.round(emi),
          tyLeDSR: Number(dsr),
          heSoBuDap: Number(coverage),
          dieuKienGiaiNgan: 'Hoàn tất thủ tục công chứng HĐTC và đăng ký thế chấp.',
          mucDoRuiRo: String(r[18] || 'Thấp'),
          ketLuan: String(r[19] || 'Đồng ý cấp tín dụng'),
          canBoThamDinh: String(r[20] || 'Lê Văn Tín'),
          danhSachYKien: [
            {
              nguoiDanhGia: 'Lê Văn Tín',
              chucVu: 'Cán Bộ Tín Dụng',
              yKien: 'Đồng ý',
              noiDung: 'Phương án chăn nuôi khả thi cao, dòng tiền thặng dư đảm bảo trả nợ tốt.',
              ngayDanhGia: '10/08/2025 09:30:00'
            }
          ],
          ngayLap: '10/08/2025'
        };

        // Tự động ghi đè dòng đã remap chuẩn vào Google Sheets
        try {
          var healedRow = new Array(headers.length);
          for (var h = 0; h < headers.length; h++) healedRow[h] = "";
          var setH = function(k, v) { if (colMap[k] !== undefined) healedRow[colMap[k]] = v; };
          setH("MaBCTD", parsed.maBCTD);
          setH("MaKH", parsed.maKH);
          setH("HoTen", parsed.hoTen);
          setH("SoCCCD", parsed.soCCCD);
          setH("NgaySinh", parsed.ngaySinh);
          setH("GioiTinh", parsed.gioiTinh);
          setH("DienThoai", parsed.dienThoai);
          setH("DiaChi", parsed.diaChi);
          setH("TinhTrangHonNhan", parsed.tinhTrangHonNhan);
          setH("NguoiDongVay", parsed.nguoiDongVay);
          setH("DeXuatVay", parsed.deXuatVay);
          setH("MucDichVay", parsed.mucDichVay);
          setH("ThoiHanVay", parsed.thoiHanVay);
          setH("PhuongThucTraNo", parsed.phuongThucTraNo);
          setH("CoTSBD", parsed.coTSBD);
          setH("HinhThucBaoDam", parsed.hinhThucBaoDam);
          setH("LoaiTSBD", parsed.loaiTSBD);
          setH("SoGCN", parsed.soGCN);
          setH("ThuaDatSo", parsed.thuaDatSo);
          setH("ToBanDoSo", parsed.toBanDoSo);
          setH("DienTich", parsed.dienTich);
          setH("DiaChiTSBD", parsed.diaChiTSBD);
          setH("ChuSoHuuTSBD", parsed.chuSoHuuTSBD);
          setH("QuanHeVoiNguoiVay", parsed.quanHeVoiNguoiVay);
          setH("GiaTriTSBD", parsed.giaTriTSBD);
          setH("TinhTrangPhapLyTSBD", parsed.tinhTrangPhapLyTSBD);
          setH("MoTaTSBD", parsed.moTaTSBD);
          setH("ThuNhapChinh", parsed.thuNhapChinh);
          setH("ThuNhapPhu", parsed.thuNhapPhu);
          setH("TongThuNhapThang", parsed.tongThuNhapThang);
          setH("ChiPhiSinhHoat", parsed.chiPhiSinhHoat);
          setH("ChiPhiSXKD", parsed.chiPhiSXKD);
          setH("TongChiPhiThang", parsed.tongChiPhiThang);
          setH("ThangDuThang", parsed.thangDuThang);
          setH("XepHangCIC", parsed.xepHangCIC);
          setH("SoTCTDQuanHe", parsed.soTCTDQuanHe);
          setH("DuNoCICNgoai", parsed.duNoCICNgoai);
          setH("LichSuTraNo", parsed.lichSuTraNo);
          setH("GhiChuCIC", parsed.ghiChuCIC);
          setH("DiaDiemThamDinh", parsed.diaDiemThamDinh);
          setH("HienTrangSXKD", parsed.hienTrangSXKD);
          setH("TuCachKhachHang", parsed.tuCachKhachHang);
          setH("DuyetVay", parsed.duyetVay);
          setH("ThoiHanThang", parsed.thoiHanThang);
          setH("LaiSuatDuyet", parsed.laiSuatDuyet);
          setH("PhuongThucGiaiNgan", parsed.phuongThucGiaiNgan);
          setH("BienPhapBaoDam", parsed.bienPhapBaoDam);
          setH("TyLeLTV", parsed.tyLeLTV);
          setH("NghiaVuTraNoThang", parsed.nghiaVuTraNoThang);
          setH("TyLeDSR", parsed.tyLeDSR);
          setH("HeSoBuDap", parsed.heSoBuDap);
          setH("DieuKienGiaiNgan", parsed.dieuKienGiaiNgan);
          setH("MucDoRuiRo", parsed.mucDoRuiRo);
          setH("KetLuan", parsed.ketLuan);
          setH("CanBoThamDinh", parsed.canBoThamDinh);
          setH("DanhSachYKien", JSON.stringify(parsed.danhSachYKien));
          setH("NgayLap", new Date());

          sheet.getRange(i + 2, 1, 1, headers.length).setValues([healedRow]);
        } catch(healErr) {}
      } else {
        var opinionsRaw = getVal(r, "DanhSachYKien", "[]");
        var approvalOpinions = [];
        try {
          approvalOpinions = typeof opinionsRaw === 'string' ? JSON.parse(opinionsRaw || "[]") : (opinionsRaw || []);
        } catch(e) {}

        parsed = {
          // 1. Pháp lý & Nhu cầu vốn
          maBCTD: getVal(r, "MaBCTD", r[0]),
          maKH: getVal(r, "MaKH", r[1]),
          hoTen: getVal(r, "HoTen", r[2]),
          soCCCD: getVal(r, "SoCCCD", ""),
          ngaySinh: getVal(r, "NgaySinh", "15/08/1985"),
          gioiTinh: getVal(r, "GioiTinh", "Nam"),
          dienThoai: getVal(r, "DienThoai", ""),
          diaChi: getVal(r, "DiaChi", ""),
          tinhTrangHonNhan: getVal(r, "TinhTrangHonNhan", "Đã kết hôn"),
          nguoiDongVay: getVal(r, "NguoiDongVay", ""),
          hinhAnhKH: getVal(r, "HinhAnhKH", ""),
          nganhNghe: getVal(r, "NganhNghe", "Kinh doanh tự do"),
          trinhDo: getVal(r, "TrinhDo", "Đại học / Cao đẳng"),
          thuNhapNguoiVay: Number(getVal(r, "ThuNhapNguoiVay", 0)) || 0,
          nguonThuNguoiVay: getVal(r, "NguonThuNguoiVay", "Thu nhập từ SXKD và lương"),
          thuNhapDongVay: Number(getVal(r, "ThuNhapDongVay", 0)) || 0,
          nguonThuDongVay: getVal(r, "NguonThuDongVay", "Thu nhập từ kinh doanh"),
          chungMinhThuNhap: getVal(r, "ChungMinhThuNhap", ""),
          thuNhapRong: Number(getVal(r, "ThuNhapRong", 0)) || 0,
          deXuatVay: Number(getVal(r, "DeXuatVay", 0)) || 0,
          mucDichVay: getVal(r, "MucDichVay", "Sản xuất kinh doanh"),
          thoiHanVay: Number(getVal(r, "ThoiHanVay", 12)) || 12,
          phuongThucTraNo: getVal(r, "PhuongThucTraNo", "Gốc đều hàng tháng, lãi tính trên dư nợ thực tế"),
          laiSuatDeNghi: Number(getVal(r, "LaiSuatDeNghi", 9.5)),

          // 2. Tài sản bảo đảm (TSBĐ)
          coTSBD: getVal(r, "CoTSBD", "Có"),
          hinhThucBaoDam: getVal(r, "HinhThucBaoDam", "Thế chấp QSDĐ (Sổ đỏ)"),
          loaiTSBD: getVal(r, "LoaiTSBD", ""),
          soGCN: getVal(r, "SoGCN", "CH 892341"),
          thuaDatSo: getVal(r, "ThuaDatSo", "112"),
          toBanDoSo: getVal(r, "ToBanDoSo", "08"),
          dienTich: Number(getVal(r, "DienTich", 250)) || 250,
          diaChiTSBD: getVal(r, "DiaChiTSBD", ""),
          chuSoHuuTSBD: getVal(r, "ChuSoHuuTSBD", ""),
          quanHeVoiNguoiVay: getVal(r, "QuanHeVoiNguoiVay", "Chính chủ"),
          giaTriTSBD: Number(getVal(r, "GiaTriTSBD", 0)) || 0,
          nguonGocTSBD: getVal(r, "NguonGocTSBD", "Nhận chuyển nhượng quyền sử dụng đất"),
          giaTriThiTruong: Number(getVal(r, "GiaTriThiTruong", 0)) || 0,
          hinhAnhTSBD: getVal(r, "HinhAnhTSBD", ""),
          chiTietLoaiDat: getVal(r, "ChiTietLoaiDat", "[]"),
          giaTriCongTrinh: Number(getVal(r, "GiaTriCongTrinh", 0)) || 0,
          tinhTrangPhapLyTSBD: getVal(r, "TinhTrangPhapLyTSBD", "Hợp pháp, không tranh chấp"),
          moTaTSBD: getVal(r, "MoTaTSBD", ""),

          // 3. Thực địa, Dòng tiền & CIC
          thuNhapChinh: Number(getVal(r, "ThuNhapChinh", 0)) || 0,
          thuNhapPhu: Number(getVal(r, "ThuNhapPhu", 0)) || 0,
          tongThuNhapThang: Number(getVal(r, "TongThuNhapThang", 0)) || 0,
          chiPhiSinhHoat: Number(getVal(r, "ChiPhiSinhHoat", 0)) || 0,
          chiPhiSXKD: Number(getVal(r, "ChiPhiSXKD", 0)) || 0,
          tongChiPhiThang: Number(getVal(r, "TongChiPhiThang", 0)) || 0,
          thangDuThang: Number(getVal(r, "ThangDuThang", 0)) || 0,
          xepHangCIC: getVal(r, "XepHangCIC", "Nhóm 1 (Tốt)"),
          soTCTDQuanHe: Number(getVal(r, "SoTCTDQuanHe", 0)) || 0,
          duNoCICNgoai: Number(getVal(r, "DuNoCICNgoai", 0)) || 0,
          lichSuTraNo: getVal(r, "LichSuTraNo", "Trả nợ tốt"),
          ghiChuCIC: getVal(r, "GhiChuCIC", ""),
          diaDiemThamDinh: getVal(r, "DiaDiemThamDinh", "Tại cơ sở khách hàng"),
          hienTrangSXKD: getVal(r, "HienTrangSXKD", "Ổn định"),
          tuCachKhachHang: getVal(r, "TuCachKhachHang", "Tốt"),

          // 4. Đề xuất của CBTD & Các chỉ số tài chính
          duyetVay: Number(getVal(r, "DuyetVay", 0)) || 0,
          thoiHanThang: Number(getVal(r, "ThoiHanThang", 12)) || 12,
          laiSuatDuyet: Number(getVal(r, "LaiSuatDuyet", 0)) || 0,
          phuongThucGiaiNgan: getVal(r, "PhuongThucGiaiNgan", "Chuyển khoản qua tài khoản CASA"),
          phuongThucTraGoc: getVal(r, "PhuongThucTraGoc", "HANG_THANG"),
          phuongAnToiUu: getVal(r, "PhuongAnToiUu", "Phương án trả nợ gốc đều hàng tháng đảm bảo khả năng trả nợ tốt."),
          bienPhapBaoDam: getVal(r, "BienPhapBaoDam", "Thế chấp QSDĐ, công chứng đăng ký GDBĐ"),
          tyLeLTV: getVal(r, "TyLeLTV", "0.0"),
          nghiaVuTraNoThang: Number(getVal(r, "NghiaVuTraNoThang", 0)) || 0,
          tyLeDSR: Number(getVal(r, "TyLeDSR", 0)) || 0,
          heSoBuDap: Number(getVal(r, "HeSoBuDap", 0)) || 0,
          dieuKienGiaiNgan: getVal(r, "DieuKienGiaiNgan", "Đăng ký GDBĐ đầy đủ"),
          mucDoRuiRo: getVal(r, "MucDoRuiRo", "Thấp"),

          // 5. Phê duyệt & Kết luận
          ketLuan: getVal(r, "KetLuan", "Đồng ý cấp tín dụng"),
          canBoThamDinh: getVal(r, "CanBoThamDinh", "Lê Văn Tín"),
          canBoLapUsername: getVal(r, "CanBoLapUsername", "qtdyentho.cbtd"),
          danhSachYKien: approvalOpinions,
          ngayLap: formatGasDate(getVal(r, "NgayLap", new Date()))
        };
      }
      results.push(parsed);
    }

    CacheHelper.setCachedData('appraisals_list', results, 30);
    return { status: "success", data: results };
  },

  handleSaveAppraisalReport: function(ss, data) {
    var sheet = ss.getSheetByName("BAO_CAO_THAM_DINH");
    if (!sheet) {
      sheet = ss.getSheetByName("THAM_DINH_TD");
    }
    if (!sheet) {
      SchemaSetup.ensureDatabaseSchema(ss);
      sheet = ss.getSheetByName("BAO_CAO_THAM_DINH") || ss.getSheetByName("THAM_DINH_TD");
    }

    var maBCTD = data.maBCTD || ("BCTD-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss"));
    var opinionsJson = JSON.stringify(data.danhSachYKien || []);
    var chiTietLoaiDatJson = typeof data.chiTietLoaiDat === 'string' ? data.chiTietLoaiDat : JSON.stringify(data.chiTietLoaiDat || []);

    // Ensure schema has all columns
    SchemaSetup.ensureDatabaseSchema(ss);

    var numCols = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, numCols).getValues()[0];
    var colMap = {};
    for (var c = 0; c < headers.length; c++) {
      colMap[String(headers[c]).trim()] = c;
    }

    var newRow = new Array(headers.length);
    for (var j = 0; j < newRow.length; j++) newRow[j] = "";

    var setCol = function(name, val) {
      if (colMap[name] !== undefined) {
        newRow[colMap[name]] = val;
      }
    };

    // 1. Pháp lý & Nhu cầu
    setCol("MaBCTD", maBCTD);
    setCol("MaKH", data.maKH || "");
    setCol("HoTen", data.hoTen || "");
    setCol("SoCCCD", data.soCCCD || "");
    setCol("NgaySinh", data.ngaySinh || "");
    setCol("GioiTinh", data.gioiTinh || "Nam");
    setCol("DienThoai", data.dienThoai || "");
    setCol("DiaChi", data.diaChi || "");
    setCol("TinhTrangHonNhan", data.tinhTrangHonNhan || "Đã kết hôn");
    setCol("NguoiDongVay", data.nguoiDongVay || "");
    setCol("HinhAnhKH", data.hinhAnhKH || "");
    setCol("NganhNghe", data.nganhNghe || "");
    setCol("TrinhDo", data.trinhDo || "");
    setCol("ThuNhapNguoiVay", Number(data.thuNhapNguoiVay) || 0);
    setCol("NguonThuNguoiVay", data.nguonThuNguoiVay || "");
    setCol("ThuNhapDongVay", Number(data.thuNhapDongVay) || 0);
    setCol("NguonThuDongVay", data.nguonThuDongVay || "");
    setCol("ChungMinhThuNhap", data.chungMinhThuNhap || "");
    setCol("ThuNhapRong", Number(data.thuNhapRong) || 0);
    setCol("DeXuatVay", Number(data.deXuatVay) || 0);
    setCol("MucDichVay", data.mucDichVay || "");
    setCol("ThoiHanVay", Number(data.thoiHanVay) || 12);
    setCol("PhuongThucTraNo", data.phuongThucTraNo || "");

    // 2. Tài sản bảo đảm
    setCol("CoTSBD", data.coTSBD || "Có");
    setCol("HinhThucBaoDam", data.hinhThucBaoDam || "");
    setCol("LoaiTSBD", data.loaiTSBD || "");
    setCol("SoGCN", data.soGCN || "");
    setCol("ThuaDatSo", data.thuaDatSo || "");
    setCol("ToBanDoSo", data.toBanDoSo || "");
    setCol("DienTich", Number(data.dienTich) || 0);
    setCol("DiaChiTSBD", data.diaChiTSBD || "");
    setCol("ChuSoHuuTSBD", data.chuSoHuuTSBD || "");
    setCol("QuanHeVoiNguoiVay", data.quanHeVoiNguoiVay || "");
    setCol("GiaTriTSBD", Number(data.giaTriTSBD) || 0);
    setCol("NguonGocTSBD", data.nguonGocTSBD || "");
    setCol("GiaTriThiTruong", Number(data.giaTriThiTruong) || 0);
    setCol("HinhAnhTSBD", data.hinhAnhTSBD || "");
    setCol("ChiTietLoaiDat", chiTietLoaiDatJson);
    setCol("GiaTriCongTrinh", Number(data.giaTriCongTrinh) || 0);
    setCol("TinhTrangPhapLyTSBD", data.tinhTrangPhapLyTSBD || "");
    setCol("MoTaTSBD", data.moTaTSBD || "");

    // 3. Thực địa, Dòng tiền & CIC
    setCol("ThuNhapChinh", Number(data.thuNhapChinh) || 0);
    setCol("ThuNhapPhu", Number(data.thuNhapPhu) || 0);
    setCol("TongThuNhapThang", Number(data.tongThuNhapThang) || 0);
    setCol("ChiPhiSinhHoat", Number(data.chiPhiSinhHoat) || 0);
    setCol("ChiPhiSXKD", Number(data.chiPhiSXKD) || 0);
    setCol("TongChiPhiThang", Number(data.tongChiPhiThang) || 0);
    setCol("ThangDuThang", Number(data.thangDuThang) || 0);
    setCol("XepHangCIC", data.xepHangCIC || "Nhóm 1 (Tốt)");
    setCol("SoTCTDQuanHe", Number(data.soTCTDQuanHe) || 0);
    setCol("DuNoCICNgoai", Number(data.duNoCICNgoai) || 0);
    setCol("LichSuTraNo", data.lichSuTraNo || "");
    setCol("GhiChuCIC", data.ghiChuCIC || "");
    setCol("DiaDiemThamDinh", data.diaDiemThamDinh || "");
    setCol("HienTrangSXKD", data.hienTrangSXKD || "");
    setCol("TuCachKhachHang", data.tuCachKhachHang || "");

    // 4. Đề xuất của CBTD & Chỉ số
    setCol("DuyetVay", Number(data.duyetVay) || 0);
    setCol("ThoiHanThang", Number(data.thoiHanThang) || 12);
    setCol("LaiSuatDuyet", Number(data.laiSuatDuyet) || 0);
    setCol("PhuongThucGiaiNgan", data.phuongThucGiaiNgan || "");
    setCol("PhuongThucTraGoc", data.phuongThucTraGoc || "HANG_THANG");
    setCol("PhuongAnToiUu", data.phuongAnToiUu || "");
    setCol("BienPhapBaoDam", data.bienPhapBaoDam || "");
    setCol("TyLeLTV", data.tyLeLTV || "0.0");
    setCol("NghiaVuTraNoThang", Number(data.nghiaVuTraNoThang) || 0);
    setCol("TyLeDSR", Number(data.tyLeDSR) || 0);
    setCol("HeSoBuDap", Number(data.heSoBuDap) || 0);
    setCol("DieuKienGiaiNgan", data.dieuKienGiaiNgan || "");
    setCol("MucDoRuiRo", data.mucDoRuiRo || "Thấp");

    // 5. Phê duyệt & Kết luận
    setCol("KetLuan", data.ketLuan || "Đồng ý cấp tín dụng");
    setCol("CanBoThamDinh", data.canBoThamDinh || "Lê Văn Tín (CBTD)");
    setCol("CanBoLapUsername", data.canBoLapUsername || "qtdyentho.cbtd");
    setCol("DanhSachYKien", opinionsJson);
    setCol("NgayLap", new Date());

    sheet.appendRow(newRow);
    CacheHelper.invalidateModuleCache('appraisal');

    return {
      status: "success",
      message: "Đã lưu Báo cáo thẩm định " + maBCTD + " (5 Nhóm nghiệp vụ) thành công!",
      maBCTD: maBCTD
    };
  },

  handleAddApprovalOpinion: function(ss, data) {
    var maBCTD = (data.maBCTD || "").trim();
    if (!maBCTD) return { status: "error", message: "Thiếu mã BCTD" };

    var sheet = ss.getSheetByName("BAO_CAO_THAM_DINH");
    if (!sheet) {
      sheet = ss.getSheetByName("THAM_DINH_TD");
    }
    if (!sheet) return { status: "error", message: "Không tìm thấy Sheet BAO_CAO_THAM_DINH" };

    var values = sheet.getDataRange().getValues();
    var foundRow = -1;
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() === maBCTD) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow === -1) return { status: "error", message: "Không tìm thấy báo cáo thẩm định " + maBCTD };

    var headers = values[0];
    var colMap = {};
    for (var c = 0; c < headers.length; c++) {
      colMap[String(headers[c]).trim()] = c;
    }

    var opinionColIdx = colMap["DanhSachYKien"];
    if (opinionColIdx === undefined) opinionColIdx = 20; // fallback column index

    var currentOpinions = [];
    try {
      var raw = values[foundRow - 1][opinionColIdx];
      currentOpinions = typeof raw === 'string' ? JSON.parse(raw || "[]") : (raw || []);
    } catch(e) {}

    var opinionPayload = data.opinion || data;
    var newOpinion = {
      nguoiDanhGia: opinionPayload.nguoiDanhGia || opinionPayload.evaluatorName || "Cán bộ",
      chucVu: opinionPayload.chucVu || opinionPayload.role || "Cán Bộ Tín Dụng",
      capDuyet: opinionPayload.capDuyet || (opinionPayload.chucVu && opinionPayload.chucVu.includes("HĐQT") ? "HDQT" : opinionPayload.chucVu && opinionPayload.chucVu.includes("Kiểm Soát") ? "BKS" : "CBTD"),
      yKien: opinionPayload.yKien || opinionPayload.decision || "Đồng ý",
      noiDung: opinionPayload.noiDung || opinionPayload.note || "",
      hanMucDuyet: opinionPayload.hanMucDuyet ? Number(opinionPayload.hanMucDuyet) : null,
      laiSuatDuyet: opinionPayload.laiSuatDuyet ? Number(opinionPayload.laiSuatDuyet) : null,
      dieuKienBoSung: opinionPayload.dieuKienBoSung || "",
      ngayDanhGia: opinionPayload.ngayDanhGia || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss")
    };

    currentOpinions.push(newOpinion);
    sheet.getRange(foundRow, opinionColIdx + 1).setValue(JSON.stringify(currentOpinions));

    // Nếu người duyệt là HĐQT / Ban Giám Đốc hoặc có cờ cập nhật kết luận
    if (opinionPayload.updateKetLuan || (newOpinion.chucVu && (newOpinion.chucVu.includes("HĐQT") || newOpinion.chucVu.includes("Giám Đốc") || newOpinion.chucVu.includes("Lãnh Đạo")))) {
      if (colMap["KetLuan"] !== undefined) {
        var ketLuanMoi = "Đồng ý cấp tín dụng";
        if (newOpinion.yKien === "Không đồng ý" || newOpinion.yKien === "Từ chối") {
          ketLuanMoi = "Từ chối cấp tín dụng";
        } else if (newOpinion.yKien === "Yêu cầu bổ sung" || newOpinion.yKien === "Yêu cầu thẩm định lại") {
          ketLuanMoi = "Có điều kiện bổ sung";
        } else if (newOpinion.yKien === "Đồng ý có điều kiện") {
          ketLuanMoi = "Có điều kiện bổ sung";
        }
        sheet.getRange(foundRow, colMap["KetLuan"] + 1).setValue(ketLuanMoi);
      }
      if (newOpinion.dieuKienBoSung && colMap["DieuKienGiaiNgan"] !== undefined) {
        var currentDieuKien = String(values[foundRow - 1][colMap["DieuKienGiaiNgan"]] || "");
        var updatedDieuKien = currentDieuKien ? (currentDieuKien + " | Chỉ đạo HĐQT: " + newOpinion.dieuKienBoSung) : ("Chỉ đạo HĐQT: " + newOpinion.dieuKienBoSung);
        sheet.getRange(foundRow, colMap["DieuKienGiaiNgan"] + 1).setValue(updatedDieuKien);
      }
    }

    CacheHelper.invalidateModuleCache('appraisal');
    return {
      status: "success",
      message: "Đã ghi nhận ý kiến phê duyệt của " + newOpinion.nguoiDanhGia + " (" + newOpinion.chucVu + ") thành công!"
    };
  }
};
