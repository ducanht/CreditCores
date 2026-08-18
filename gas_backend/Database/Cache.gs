/**
 * HỆ THỐNG CACHE SCRIPTCACHE TỐI ƯU HẠN NGẠCH GOOGLE FREE
 */

var CacheHelper = {
  getCachedData: function(key) {
    try {
      var cache = CacheService.getScriptCache();
      var cached = cache.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      Logger.log("Cache get error for key " + key + ": " + e);
    }
    return null;
  },

  setCachedData: function(key, data, ttlSeconds) {
    try {
      var cache = CacheService.getScriptCache();
      var str = JSON.stringify(data);
      if (str.length < 90000) {
        cache.put(key, str, ttlSeconds || 30);
      }
    } catch (e) {
      Logger.log("Cache set error for key " + key + ": " + e);
    }
  },

  clearCacheKeys: function(keys) {
    try {
      var cache = CacheService.getScriptCache();
      if (Array.isArray(keys)) {
        cache.removeAll(keys);
      } else if (keys) {
        cache.remove(keys);
      }
    } catch (e) {
      Logger.log("Cache clear error: " + e);
    }
  },

  invalidateModuleCache: function(module) {
    var keyMap = {
      dashboard: ['dashboard_stats', 'reports_data'],
      customer: ['dashboard_stats', 'reports_data'],
      appraisal: ['appraisals_list', 'dashboard_stats'],
      inspection: ['inspections_list'],
      debit: ['debit_registrations', 'debit_batches', 'dashboard_stats', 'debt_warnings'],
      reconciliation: ['debit_batches', 'debt_warnings', 'dashboard_stats'],
      auth: ['users_list', 'roles_permissions']
    };
    var keys = keyMap[module] || ['dashboard_stats'];
    this.clearCacheKeys(keys);
  }
};
