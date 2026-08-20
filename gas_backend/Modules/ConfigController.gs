/**
 * =========================================================================
 * MODULE: CONFIG CONTROLLER
 * Xử lý quản lý biểu mẫu hợp đồng (Template) & Cấu hình hệ thống (Drive)
 * =========================================================================
 */

var ConfigController = {
  
  // -------------------------------------------------------------
  // 1. QUẢN LÝ BIỂU MẪU (TEMPLATES)
  // -------------------------------------------------------------

  getTemplates: function() {
    try {
      var ss = getSpreadsheetInstance();
      if (!ss) return { status: 'error', message: 'Không thể kết nối CSDL' };
      
      var sheet = ss.getSheetByName('CAU_HINH_BIEU_MAU');
      if (!sheet) {
        SchemaSetup.ensureDatabaseSchema(ss);
        sheet = ss.getSheetByName('CAU_HINH_BIEU_MAU');
      }
      
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return { status: 'success', data: [] };
      
      var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
      var templates = [];
      
      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        if (!row[0]) continue; // Bỏ qua dòng trống
        
        templates.push({
          id: row[0].toString(),
          maBM: row[1],
          tenBM: row[2],
          phanHe: row[3],
          loaiNguon: row[4],
          linkNguon: row[5],
          moTa: row[6],
          truongTron: row[7] ? JSON.parse(row[7]) : [],
          trangThai: row[8],
          ngayCapNhat: (row[9] && row[9] instanceof Date) ? Utilities.formatDate(row[9], 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss') : row[9]
        });
      }
      
      // Sắp xếp ID giảm dần (mới nhất lên đầu)
      templates.sort(function(a, b) { return b.id - a.id; });
      return { status: 'success', data: templates };
      
    } catch (e) {
      Logger.log("Lỗi getTemplates: " + e.toString());
      return { status: 'error', message: e.toString() };
    }
  },

  saveTemplate: function(payload) {
    try {
      var lock = LockService.getScriptLock();
      lock.waitLock(5000);
      
      var ss = getSpreadsheetInstance();
      if (!ss) return { status: 'error', message: 'Không thể kết nối CSDL' };
      
      var sheet = ss.getSheetByName('CAU_HINH_BIEU_MAU');
      if (!sheet) {
        SchemaSetup.ensureDatabaseSchema(ss);
        sheet = ss.getSheetByName('CAU_HINH_BIEU_MAU');
      }
      
      var isNew = false;
      var targetRow = -1;
      var newId = payload.id;
      
      if (!newId || newId.toString().indexOf('BM_') > -1 || isNaN(newId)) {
        // Tự sinh ID mới
        isNew = true;
        var lastRow = sheet.getLastRow();
        if (lastRow < 2) {
          newId = 1;
        } else {
          var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(Number).filter(n => !isNaN(n));
          newId = Math.max.apply(null, ids) + 1;
        }
        targetRow = lastRow + 1;
      } else {
        // Cập nhật
        var lastRow = sheet.getLastRow();
        var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < ids.length; i++) {
          if (ids[i][0].toString() === newId.toString()) {
            targetRow = i + 2;
            break;
          }
        }
        if (targetRow === -1) {
          isNew = true;
          targetRow = lastRow + 1;
        }
      }
      
      var rowData = [
        newId,
        payload.maBM,
        payload.tenBM,
        payload.phanHe,
        payload.loaiNguon || 'GOOGLE_DOCS',
        payload.linkNguon,
        payload.moTa,
        JSON.stringify(payload.truongTron || []),
        payload.trangThai || 'Đang áp dụng',
        new Date()
      ];
      
      sheet.getRange(targetRow, 1, 1, 10).setValues([rowData]);
      SpreadsheetApp.flush();
      lock.releaseLock();
      
      return { status: 'success', message: 'Lưu biểu mẫu thành công!' };
    } catch (e) {
      Logger.log("Lỗi saveTemplate: " + e.toString());
      return { status: 'error', message: e.toString() };
    }
  },

  deleteTemplate: function(payload) {
    try {
      var lock = LockService.getScriptLock();
      lock.waitLock(5000);
      
      var ss = getSpreadsheetInstance();
      var sheet = ss.getSheetByName('CAU_HINH_BIEU_MAU');
      if (!sheet) return { status: 'error', message: 'Không tìm thấy CSDL' };
      
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return { status: 'error', message: 'Biểu mẫu không tồn tại.' };
      
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (ids[i][0].toString() === payload.id.toString()) {
          sheet.deleteRow(i + 2);
          SpreadsheetApp.flush();
          lock.releaseLock();
          return { status: 'success', message: 'Đã xóa biểu mẫu thành công!' };
        }
      }
      
      lock.releaseLock();
      return { status: 'error', message: 'Không tìm thấy ID biểu mẫu.' };
    } catch (e) {
      Logger.log("Lỗi deleteTemplate: " + e.toString());
      return { status: 'error', message: e.toString() };
    }
  },

  // -------------------------------------------------------------
  // 2. QUẢN LÝ CẤU HÌNH DRIVE (DRIVE SETTINGS)
  // -------------------------------------------------------------
  // Dùng PropertiesService để lưu trữ cấu hình môi trường nhẹ nhàng, không cần 1 bảng riêng
  
  getDriveSettings: function() {
    try {
      var props = PropertiesService.getScriptProperties();
      var contractFolderId = props.getProperty('CONTRACT_FOLDER_ID') || '';
      return {
        status: 'success',
        data: {
          contractFolderId: contractFolderId
        }
      };
    } catch(e) {
      return { status: 'error', message: e.toString() };
    }
  },
  
  saveDriveSettings: function(payload) {
    try {
      if (!payload || typeof payload.contractFolderId === 'undefined') {
        return { status: 'error', message: 'Dữ liệu cấu hình không hợp lệ.' };
      }
      
      var folderId = payload.contractFolderId.trim();
      
      // Validate folder ID format
      if (folderId.length > 0) {
        try {
          DriveApp.getFolderById(folderId); // Thử lấy folder để kiểm tra quyền
        } catch (err) {
          return { status: 'error', message: 'ID thư mục không hợp lệ hoặc Tài khoản triển khai không có quyền truy cập vào thư mục này!' };
        }
      }
      
      var props = PropertiesService.getScriptProperties();
      props.setProperty('CONTRACT_FOLDER_ID', folderId);
      
      return { status: 'success', message: 'Lưu cấu hình lưu trữ Drive thành công!' };
    } catch(e) {
      return { status: 'error', message: e.toString() };
    }
  }
};
