/**
 * ========================================================================================
 * CREDITCORES - CACHE (HIGH-PERFORMANCE CHUNKED CACHE)
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Hệ thống Memory Caching phân tầng (Multi-tier Chunked Cache)
 *              Hỗ trợ tự động chia nhỏ dữ liệu vượt ngưỡng 100KB của CacheService
 *              và ghép lại nguyên vẹn (Zero-drop-cache), tham chiếu kiến trúc HuyDongVon.
 * @created     15/08/2026
 * @updated     18/09/2026
 * @version     3.0
 * ========================================================================================
 */

var CacheHelper = {
  CHUNK_SIZE_LIMIT: 80 * 1024, // 80KB an toàn (dưới giới hạn 100KB của Google Apps Script)
  _executionCache: {},         // In-Memory Per-Execution Cache (Cực nhanh trong 1 vòng đời request)

  // Phân tầng thời gian sống (Cache Tiering)
  TIERS: {
    HOT: 180,      // 3 phút: Dashboard, Sync Monitor
    WARM: 900,     // 15 phút: Reports, Customer 360 default, Debt warnings
    COLD: 21600    // 6 giờ: Roles, Permissions, Templates, Drive settings
  },

  getCachedData: function(key) {
    // 1. Kiểm tra In-Memory Execution Cache trước (< 0.1ms)
    if (this._executionCache && this._executionCache[key]) {
      return this._executionCache[key];
    }

    try {
      var cache = CacheService.getScriptCache();
      var metadataStr = cache.get(key);
      if (metadataStr == null) return null;

      var metadata;
      try {
        metadata = JSON.parse(metadataStr);
      } catch (e) {
        return null;
      }

      // 2. Nếu là dữ liệu chia nhỏ (Chunked Storage)
      if (metadata && metadata.__isChunked) {
        var chunkKeys = [];
        for (var i = 0; i < metadata.count; i++) {
          chunkKeys.push(key + "_chunk_" + i);
        }
        var chunkData = cache.getAll(chunkKeys);
        var fullStr = "";
        for (var j = 0; j < metadata.count; j++) {
          var cVal = chunkData[key + "_chunk_" + j];
          if (cVal == null) return null; // Mất 1 chunk coi như cache không hợp lệ
          fullStr += cVal;
        }
        var parsed = JSON.parse(fullStr);
        if (!this._executionCache) this._executionCache = {};
        this._executionCache[key] = parsed;
        return parsed;
      }

      // 3. Dữ liệu đơn
      if (!this._executionCache) this._executionCache = {};
      this._executionCache[key] = metadata;
      return metadata;
    } catch (e) {
      Logger.log("Cache get error for key " + key + ": " + e.toString());
    }
    return null;
  },

  setCachedData: function(key, data, ttlSeconds) {
    if (!data) return;
    if (!this._executionCache) this._executionCache = {};
    this._executionCache[key] = data;

    var expiration = ttlSeconds || this.TIERS.WARM;
    try {
      var cache = CacheService.getScriptCache();
      var jsonStr = JSON.stringify(data);

      if (jsonStr.length <= this.CHUNK_SIZE_LIMIT) {
        // Dưới 80KB: Lưu trực tiếp
        cache.put(key, jsonStr, expiration);
      } else {
        // Vượt 80KB: Tự động Chunking phân mảnh
        var count = 0;
        var batchMap = {};
        for (var i = 0; i < jsonStr.length; i += this.CHUNK_SIZE_LIMIT) {
          batchMap[key + "_chunk_" + count] = jsonStr.substring(i, i + this.CHUNK_SIZE_LIMIT);
          count++;
        }

        // Lưu metadata
        var meta = {
          __isChunked: true,
          count: count,
          totalLength: jsonStr.length,
          timestamp: Date.now()
        };
        batchMap[key] = JSON.stringify(meta);

        // Ghi hàng loạt vào CacheService
        cache.putAll(batchMap, expiration);
      }
    } catch (e) {
      Logger.log("Cache set error for key " + key + ": " + e.toString());
    }
  },

  clearCacheKeys: function(keys) {
    var keyList = Array.isArray(keys) ? keys : [keys];
    try {
      var cache = CacheService.getScriptCache();
      var keysToRemove = [];

      for (var k = 0; k < keyList.length; k++) {
        var baseKey = keyList[k];
        if (this._executionCache) delete this._executionCache[baseKey];
        keysToRemove.push(baseKey);

        // Xóa cả các chunk tiềm năng (tối đa 30 chunks)
        for (var c = 0; c < 30; c++) {
          keysToRemove.push(baseKey + "_chunk_" + c);
        }
      }

      cache.removeAll(keysToRemove);
    } catch (e) {
      Logger.log("Cache clear error: " + e.toString());
    }
  },

  invalidateModuleCache: function(module) {
    var keyMap = {
      dashboard: ['dashboard_stats', 'reports_data_v2'],
      customer: ['dashboard_stats', 'reports_data_v2', 'cust360_default'],
      appraisal: ['appraisals_list', 'dashboard_stats'],
      inspection: ['inspections_list', 'dashboard_stats'],
      debit: ['debit_registrations', 'debit_batches', 'dashboard_stats', 'debt_warnings'],
      reconciliation: ['debit_batches', 'debt_warnings', 'dashboard_stats'],
      auth: ['users_list', 'roles_permissions']
    };
    var keys = keyMap[module] || ['dashboard_stats', 'reports_data_v2'];
    this.clearCacheKeys(keys);
  }
};
