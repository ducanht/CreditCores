/**
 * ========================================================================================
 * MODULE QUẢN LÝ HỢP ĐỒNG & TÀI LIỆU LƯU TRỮ (MAIL MERGE ENGINE)
 * CreditCores - Quỹ Tín Dụng Nhân Dân Yên Thọ
 * - Tự động sao chép Google Doc từ Template
 * - Trộn dữ liệu (Mail Merge) bằng DocumentApp
 * - Lưu URL xem trước (Iframe) & PDF tải xuống
 * ========================================================================================
 */

var DocumentController = (function() {
  var CONTRACTS_FOLDER_NAME = "CreditCores_Generated_Contracts";

  function getOrCreateFolder() {
    var customFolderId = '';
    try {
      if (typeof ConfigController !== 'undefined') {
        var settings = ConfigController.getDriveSettings();
        if (settings && settings.status === 'success' && settings.data && settings.data.contractFolderId) {
          customFolderId = settings.data.contractFolderId;
        }
      }
    } catch(e) {
      Logger.log('Cannot read Drive Settings: ' + e.toString());
    }
    
    if (customFolderId) {
      try {
        return DriveApp.getFolderById(customFolderId);
      } catch(e) {
        Logger.log('Invalid folder ID, fallback to default name: ' + e.toString());
      }
    }

    var folders = DriveApp.getFoldersByName(CONTRACTS_FOLDER_NAME);
    if (folders.hasNext()) {
      return folders.next();
    } else {
      return DriveApp.createFolder(CONTRACTS_FOLDER_NAME);
    }
  }

  function handleGenerateContract(ss, payload) {
    try {
      var maKH = payload.maKH;
      var hoTen = payload.hoTen || "Unknown";
      var templateId = payload.templateId; // Google Doc ID
      var tenBieuMau = payload.tenBieuMau || "Hợp Đồng Tín Dụng";
      var truongTronData = payload.truongTronData || {}; // { "{{HoTen}}": "Nguyễn Văn A" }
      var nguoiLap = payload.username || "Hệ Thống";

      if (!maKH || !templateId) {
        return { status: "error", message: "Thiếu mã khách hàng hoặc Template ID." };
      }

      // 1. Tìm hoặc tạo thư mục
      var folder = getOrCreateFolder();

      // 2. Tạo bản sao từ Template
      var templateFile = DriveApp.getFileById(templateId);
      var timeStamp = Utilities.formatDate(new Date(), "GMT+7", "ddMMyyyy_HHmmss");
      var newFileName = maKH + "_" + tenBieuMau + "_" + timeStamp;
      var newFile = templateFile.makeCopy(newFileName, folder);
      var newDocId = newFile.getId();

      // 3. Thực hiện thay thế từ khóa (Mail Merge)
      var doc = DocumentApp.openById(newDocId);
      var body = doc.getBody();

      for (var key in truongTronData) {
        if (truongTronData.hasOwnProperty(key)) {
          var value = truongTronData[key] || "";
          body.replaceText(key, value);
        }
      }
      doc.saveAndClose();

      // 4. Mở quyền truy cập để Preview (Iframe) và In ấn
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      // 5. Chuẩn bị URL
      var docUrl = newFile.getUrl();
      var pdfUrl = "https://docs.google.com/document/d/" + newDocId + "/export?format=pdf";

      // 6. Lưu lịch sử vào HỢP ĐỒNG LƯU TRỮ
      var sheet = ss.getSheetByName("DOCUMENT_STORAGE");
      if (!sheet) {
        SchemaSetup.ensureDatabaseSchema(ss);
        sheet = ss.getSheetByName("DOCUMENT_STORAGE");
      }
      
      var newRow = [
        newDocId,                 // ID_HOP_DONG
        maKH,                     // MA_KH
        hoTen,                    // TEN_KHACH_HANG
        tenBieuMau,               // LOAI_BIEU_MAU
        nguoiLap,                 // NGUOI_LAP
        new Date(),               // NGAY_LAP
        docUrl,                   // LINK_GOOGLE_DOC
        pdfUrl,                   // LINK_PDF
        "HOAN_THANH"              // TRANG_THAI
      ];
      sheet.appendRow(newRow);

      return {
        status: "success",
        message: "Khởi tạo hợp đồng thành công.",
        data: {
          docId: newDocId,
          docUrl: docUrl,
          pdfUrl: pdfUrl,
          fileName: newFileName
        }
      };

    } catch (e) {
      Logger.log("Lỗi generateContract: " + e.toString());
      return { status: "error", message: "Lỗi tạo hợp đồng: " + e.toString() };
    }
  }

  function handleGetContracts(ss, payload) {
    try {
      var sheet = ss.getSheetByName("DOCUMENT_STORAGE");
      if (!sheet) return { status: "success", data: [] };

      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return { status: "success", data: [] };

      var data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
      var result = [];
      var filterMaKH = payload.maKH;

      for (var i = data.length - 1; i >= 0; i--) { // Lấy từ mới nhất xuống
        var row = data[i];
        if (filterMaKH && row[1] !== filterMaKH) continue;

        result.push({
          idHopDong: row[0],
          maKH: row[1],
          tenKhachHang: row[2],
          loaiBieuMau: row[3],
          nguoiLap: row[4],
          ngayLap: row[5],
          linkGoogleDoc: row[6],
          linkPdf: row[7],
          trangThai: row[8]
        });
      }

      return { status: "success", data: result };

    } catch (e) {
      return { status: "error", message: "Lỗi lấy danh sách hợp đồng: " + e.toString() };
    }
  }

  return {
    handleGenerateContract: handleGenerateContract,
    handleGetContracts: handleGetContracts
  };
})();
