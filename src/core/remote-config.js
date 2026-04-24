/**
 * RemoteConfig - 远程动态配置模块
 * 
 * 从服务端获取调试控制台的启用配置，支持：
 * - 基于用户身份（企业id + 工号）的精准控制
 * - 请求超时自动降级为本地配置
 * - 配置缓存与刷新
 */

const eventBus = require('./event-bus');

// 默认远程配置选项
const DEFAULT_OPTIONS = {
  // 远程配置接口地址
  configUrl: '',
  // 请求超时时间（毫秒），超时后降级为本地配置
  timeout: 1000,
  // 用户身份信息（用于后端判断是否为该用户开启调试）
  userIdentity: {
    corpId: '',    // 企业ID
    userId: ''     // 用户名/工号
  },
  // 自定义请求头
  headers: {},
  // 自定义请求参数（会与 userIdentity 合并发送）
  extraParams: {},
  // 配置缓存 key（存储到 Storage 中，下次启动可快速读取）
  cacheKey: '__mp_debug_remote_config__',
  // 缓存有效期（毫秒），默认 5 分钟
  cacheTTL: 5 * 60 * 1000,
  // 是否启用缓存
  enableCache: true
};

// 模块内部状态
let _options = {};
let _fetching = false;

/**
 * 发起远程配置请求
 * @param {Object} options - 远程配置选项
 * @returns {Promise<Object>} 解析后的配置对象
 * 
 * 返回值约定（后端应返回的 JSON 结构）：
 * {
 *   "enabled": true,            // 是否启用调试面板
 *   "enableConsole": true,      // 可选，是否启用 Console
 *   "enableNetwork": true,      // 可选，是否启用 Network
 *   "enableError": true,        // 可选，是否启用错误捕获
 *   "enableStorage": true,      // 可选，是否启用 Storage
 *   "remoteLoggerUrl": "",      // 可选，远程日志上报地址（覆盖本地配置）
 *   "remoteLoggerTypes": []     // 可选，需要上报的类型
 * }
 */
function fetchConfig(options = {}) {
  _options = Object.assign({}, DEFAULT_OPTIONS, options);

  if (!_options.configUrl) {
    return Promise.resolve(null);
  }

  // 优先尝试读取缓存
  if (_options.enableCache) {
    const cached = _readCache();
    if (cached) {
      _log('Using cached remote config');
      eventBus.emit('remoteConfig:loaded', { source: 'cache', config: cached });
      return Promise.resolve(cached);
    }
  }

  return _requestConfig();
}

/**
 * 发起网络请求获取配置（带超时控制）
 * @returns {Promise<Object|null>}
 */
function _requestConfig() {
  if (_fetching) {
    return Promise.resolve(null);
  }

  _fetching = true;

  return new Promise(function (resolve) {
    let settled = false;
    let requestTask = null;

    // 超时计时器
    const timer = setTimeout(function () {
      if (!settled) {
        settled = true;
        _fetching = false;
        _log('Remote config request timeout (' + _options.timeout + 'ms), fallback to local config');
        if (requestTask && requestTask.abort) {
          requestTask.abort();
        }
        eventBus.emit('remoteConfig:timeout');
        resolve(null);
      }
    }, _options.timeout);

    // 构建请求参数
    const requestData = Object.assign(
      {},
      _options.extraParams,
      {
        corpId: _options.userIdentity.corpId || '',
        userId: _options.userIdentity.userId || ''
      }
    );

    // 使用原始 wx.request 避免被 SDK 自身的 network interceptor 拦截
    // 注意：此时 network interceptor 可能尚未安装，直接使用 wx.request 即可
    try {
      requestTask = wx.request({
        url: _options.configUrl,
        method: 'GET',
        data: requestData,
        header: Object.assign({ 'content-type': 'application/json' }, _options.headers),
        success: function (res) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          _fetching = false;

          if (res.statusCode === 200 && res.data) {
            var config = typeof res.data === 'object' ? res.data : null;
            // 兼容后端包了一层 { code, data } 的情况
            if (config && config.data && typeof config.data === 'object' && config.code !== undefined) {
              config = config.data;
            }
            if (config) {
              _log('Remote config loaded successfully');
              if (_options.enableCache) {
                _writeCache(config);
              }
              eventBus.emit('remoteConfig:loaded', { source: 'remote', config: config });
              resolve(config);
            } else {
              _log('Remote config response invalid, fallback to local config');
              eventBus.emit('remoteConfig:error', { message: 'Invalid response data' });
              resolve(null);
            }
          } else {
            _log('Remote config request failed (status: ' + res.statusCode + '), fallback to local config');
            eventBus.emit('remoteConfig:error', { statusCode: res.statusCode });
            resolve(null);
          }
        },
        fail: function (err) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          _fetching = false;
          _log('Remote config request error, fallback to local config');
          eventBus.emit('remoteConfig:error', { message: err.errMsg || 'Request failed' });
          resolve(null);
        }
      });
    } catch (e) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        _fetching = false;
        _log('Remote config request exception, fallback to local config');
        resolve(null);
      }
    }
  });
}

/**
 * 读取缓存的配置
 * @returns {Object|null}
 */
function _readCache() {
  try {
    var cached = wx.getStorageSync(_options.cacheKey);
    if (cached && cached.timestamp && cached.config) {
      if (Date.now() - cached.timestamp < _options.cacheTTL) {
        return cached.config;
      }
      // 缓存过期，清除
      wx.removeStorageSync(_options.cacheKey);
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * 写入配置缓存
 * @param {Object} config
 */
function _writeCache(config) {
  try {
    wx.setStorageSync(_options.cacheKey, {
      config: config,
      timestamp: Date.now()
    });
  } catch (e) {
    // ignore
  }
}

/**
 * 清除配置缓存
 */
function clearCache() {
  try {
    wx.removeStorageSync(_options.cacheKey || DEFAULT_OPTIONS.cacheKey);
  } catch (e) {
    // ignore
  }
}

/**
 * 内部日志
 */
function _log() {
  var args = Array.prototype.slice.call(arguments);
  var fn = (typeof console !== 'undefined' && console.__originalLog) ? console.__originalLog : console.log;
  fn.apply(console, ['[MpDebug][RemoteConfig]'].concat(args));
}

module.exports = {
  fetchConfig: fetchConfig,
  clearCache: clearCache
};
