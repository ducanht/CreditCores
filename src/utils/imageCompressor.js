/**
 * Tiện ích Nén Ảnh và Chuẩn Hóa Tên Tệp Lưu Trữ Google Drive
 * CreditCores - QTDND Yên Thọ
 */

/**
 * Nén ảnh bằng HTML5 Canvas trước khi tải lên
 * @param {File|Blob} fileOrBlob - File ảnh gốc từ camera hoặc input
 * @param {Object} options - Tùy chọn nén (maxWidth, maxHeight, quality)
 * @returns {Promise<{ blob: Blob, dataUrl: string, originalSize: number, compressedSize: number }>}
 */
export async function compressImage(fileOrBlob, options = {}) {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.75,
    mimeType = 'image/jpeg'
  } = options;

  const originalSize = fileOrBlob.size;

  return new Promise((resolve, reject) => {
    // Nếu là PDF hoặc file không phải ảnh -> Không nén canvas, giữ nguyên
    if (fileOrBlob.type && !fileOrBlob.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          blob: fileOrBlob,
          dataUrl: reader.result,
          originalSize,
          compressedSize: originalSize,
          isDocument: true
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBlob);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let width = img.width;
      let height = img.height;

      // Tính tỷ lệ thu nhỏ nếu vượt quá maxWidth/maxHeight
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          maxHeight = height;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Khử răng cưa và vẽ ảnh
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Lỗi nén ảnh qua Canvas'));
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              blob,
              dataUrl: reader.result,
              originalSize,
              compressedSize: blob.size,
              width,
              height
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không thể đọc định dạng hình ảnh'));
    };

    img.src = url;
  });
}

/**
 * Chuẩn hóa tên file theo quy tắc định danh tài liệu QTDND Yên Thọ
 * @param {string} prefix - Loại tài liệu (KH, TSBD, KT, DOC, BCTD)
 * @param {string} entityId - Mã hồ sơ hoặc Mã KH (VD: KH008892, BCTD-2026-081, BBKT-2026-0042)
 * @param {string} extraInfo - Thông tin bổ sung (VD: CCCD, TenKH, SoHDTD)
 * @param {string} extension - Đuôi file (jpg, png, pdf)
 * @returns {string} - Tên file chuẩn hóa
 */
export function formatStandardFileName(prefix, entityId, extraInfo = '', extension = 'jpg') {
  const sanitize = (str) =>
    (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Khử dấu tiếng Việt
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Thay ký tự đặc biệt bằng _
      .replace(/_+/g, '_')
      .toUpperCase();

  const cleanPrefix = sanitize(prefix || 'DOC');
  const cleanEntityId = sanitize(entityId || 'DATA');
  const cleanExtra = extraInfo ? `_${sanitize(extraInfo)}` : '';
  const timestamp = Date.now();
  const cleanExt = (extension || 'jpg').replace('.', '').toLowerCase();

  return `${cleanPrefix}_${cleanEntityId}${cleanExtra}_${timestamp}.${cleanExt}`;
}

/**
 * Chuyển đổi dung lượng bytes sang định dạng dễ đọc (KB, MB)
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
