/**
 * MpDebug - 小程序调试控制台 SDK 入口
 * 
 * 使用方式：
 *   const MpDebug = require('./lib/mp-debug-sdk/core/index');
 *   MpDebug.init({ env: 'development' });
 * 
 * 动态远程配置使用方式：
 *   MpDebug.init({
 *     enabled: false,  // 初始不启用，等待远程配置
 *     remoteConfig: {
 *       configUrl: 'https://api.example.com/debug/config',
 *       timeout: 1000,
 *       userIdentity: { corpId: 'CORP001', userId: 'zhangsan' }
 *     }
 *   });
 */

const eventBus = require('./event-bus');
const consoleInterceptor = require('./console-interceptor');
const networkInterceptor = require('./network-interceptor');
const errorHandler = require('./error-handler');
const storageManager = require('./storage-manager');
const remoteConfig = require('./remote-config');
const remoteLogger = require('./remote-logger');

// SDK 配置
let _config = {
  env: '',              // 环境标识: 'development' | 'production' | 自定义
  enabled: false,       // 是否启用
  maxLogCount: 500,     // 最大日志条数
  maxRequestCount: 200, // 最大请求记录条数
  showButton: true,     // 是否显示悬浮按钮
  buttonPosition: {     // 悬浮按钮默认位置
    right: 10,
    bottom: 200
  },
  panelHeight: 60,      // 面板高度（屏幕百分比）
  enableConsole: true,   // 是否启用 Console 拦截
  enableNetwork: true,   // 是否启用 Network 拦截
  enableError: true,     // 是否启用错误捕获
  enableStorage: true,   // 是否启用 Storage 面板

  // ===== 远程动态配置 =====
  remoteConfig: null,    // 远程配置选项，传入则启用远程配置
  // {
  //   configUrl: '',            // 远程配置接口地址
  //   timeout: 1000,            // 请求超时（毫秒），超时降级为本地配置
  //   userIdentity: {           // 用户身份信息
  //     corpId: '',             // 企业ID
  //     userId: ''              // 用户名/工号
  //   },
  //   headers: {},              // 自定义请求头
  //   extraParams: {},          // 额外请求参数
  //   enableCache: true,        // 是否启用缓存
  //   cacheTTL: 300000          // 缓存有效期（毫秒）
  // }

  // ===== 远程日志上报 =====
  remoteLogger: null     // 远程日志上报选项，传入则启用
  // {
  //   url: '',                  // 上报地址
  //   reportTypes: ['error', 'network'],  // 需要上报的类型
  //   batchSize: 20,            // 批量上报条数阈值
  //   flushInterval: 30000,     // 上报间隔（毫秒）
  //   maxQueueSize: 200,        // 最大队列长度
  //   headers: {},              // 自定义请求头
  //   timeout: 5000,            // 上报超时
  //   beforeReport: null,       // 自定义数据转换钩子 fn(type, data) => data | false
  //   onReportSuccess: null,    // 上报成功回调
  //   onReportError: null       // 上报失败回调
  // }
};

// SDK 是否已初始化
let _initialized = false;

// 远程配置是否已加载完成（用于异步流程判断）
let _remoteConfigLoaded = false;

/**
 * 初始化 SDK
 * 注意：必须在 App() 调用之前执行
 * 
 * 支持两种模式：
 * 1. 同步模式（无 remoteConfig）：立即根据本地配置初始化
 * 2. 异步模式（有 remoteConfig）：先用本地配置决定是否初始化，
 *    然后异步拉取远程配置，如果远程配置启用则动态启用 SDK
 * 
 * @param {Object} options - 配置选项
 */
function init(options) {
  if (options === undefined) options = {};

  if (_initialized) {
    _warn('MpDebug already initialized');
    return;
  }

  // 合并配置
  Object.assign(_config, options);

  // 保存原始 wx.request 引用（供远程日志上报模块使用，必须在拦截之前）
  if (typeof wx !== 'undefined' && wx.request) {
    wx.__mp_debug_original_request = wx.request;
  }

  // 判断是否有远程配置
  var hasRemoteConfig = _config.remoteConfig && _config.remoteConfig.configUrl;

  if (hasRemoteConfig) {
    // ===== 异步模式：远程配置 =====
    // 策略：
    // 1. 先安装 errorHandler（必须在 App() 之前，无法延迟）
    // 2. 异步拉取远程配置
    // 3. 远程配置返回 enabled=true 时，动态安装 console/network 拦截器
    // 4. 超时或异常时，降级为本地 enabled 配置

    // error handler 必须先安装（因为它需要劫持 App 构造函数，必须在 App() 之前）
    if (_config.enableError !== false) {
      errorHandler.install();
    }

    _initialized = true;
    _log('MpDebug initializing with remote config...');

    // 发起远程配置请求
    remoteConfig.fetchConfig(_config.remoteConfig).then(function (remoteConf) {
      _remoteConfigLoaded = true;

      if (remoteConf && remoteConf.enabled === true) {
        // 远程配置启用 SDK
        _log('Remote config: SDK enabled');
        _config.enabled = true;

        // 合并远程配置中的细粒度开关
        if (typeof remoteConf.enableConsole === 'boolean') _config.enableConsole = remoteConf.enableConsole;
        if (typeof remoteConf.enableNetwork === 'boolean') _config.enableNetwork = remoteConf.enableNetwork;
        if (typeof remoteConf.enableError === 'boolean') _config.enableError = remoteConf.enableError;
        if (typeof remoteConf.enableStorage === 'boolean') _config.enableStorage = remoteConf.enableStorage;

        // 安装拦截器
        _installInterceptors();

        // 远程配置可以覆盖日志上报地址
        if (remoteConf.remoteLoggerUrl && _config.remoteLogger) {
          _config.remoteLogger.url = remoteConf.remoteLoggerUrl;
        }
        if (remoteConf.remoteLoggerTypes && _config.remoteLogger) {
          _config.remoteLogger.reportTypes = remoteConf.remoteLoggerTypes;
        }

        // 安装远程日志上报
        _installRemoteLogger();

        eventBus.emit('sdk:ready', _config);
      } else if (remoteConf && remoteConf.enabled === false) {
        // 远程配置明确禁用
        _log('Remote config: SDK disabled');
        _config.enabled = false;

        // 即使不启用面板，远程日志上报仍可独立运行
        _installRemoteLogger();
      } else {
        // 远程配置无效（超时/异常/返回null），降级为本地配置
        _log('Remote config unavailable, fallback to local config');
        _fallbackToLocalConfig();
      }
    });
  } else {
    // ===== 同步模式：本地配置 =====
    _initWithLocalConfig();
  }
}

/**
 * 使用本地配置初始化（同步模式）
 */
function _initWithLocalConfig() {
  // 判断是否启用
  if (typeof _config.enabled === 'boolean') {
    if (!_config.enabled) {
      _log('MpDebug disabled by config');
      // 即使不启用面板，远程日志上报仍可独立运行
      _installRemoteLogger();
      return;
    }
  } else {
    // 未设置 enabled 时，根据 env 判断
    var enabledEnvs = ['development', 'dev', 'test', 'staging'];
    if (!enabledEnvs.includes((_config.env || '').toLowerCase())) {
      _log('MpDebug disabled (env: ' + _config.env + ')');
      // 即使不启用面板，远程日志上报仍可独立运行
      _installRemoteLogger();
      return;
    }
    // env 匹配，标记为启用
    _config.enabled = true;
  }

  _initialized = true;
  _log('MpDebug initializing...');

  // 按配置安装各模块（注意顺序）
  if (_config.enableError) {
    errorHandler.install();
    _log('Error handler installed');
  }

  _installInterceptors();
  _installRemoteLogger();

  _log('MpDebug initialized successfully');
  eventBus.emit('sdk:ready', _config);
}

/**
 * 远程配置失败时降级到本地配置
 */
function _fallbackToLocalConfig() {
  // 已安装 errorHandler，现在根据本地 enabled/env 决定是否继续安装
  if (typeof _config.enabled === 'boolean') {
    if (_config.enabled) {
      _installInterceptors();
      _installRemoteLogger();
      _log('Fallback: SDK enabled by local config');
      eventBus.emit('sdk:ready', _config);
    } else {
      _log('Fallback: SDK disabled by local config');
      _installRemoteLogger();
    }
  } else {
    var enabledEnvs = ['development', 'dev', 'test', 'staging'];
    if (enabledEnvs.includes((_config.env || '').toLowerCase())) {
      _config.enabled = true;
      _installInterceptors();
      _installRemoteLogger();
      _log('Fallback: SDK enabled by env');
      eventBus.emit('sdk:ready', _config);
    } else {
      _log('Fallback: SDK disabled by env');
      _installRemoteLogger();
    }
  }
}

/**
 * 安装 Console / Network 拦截器
 */
function _installInterceptors() {
  if (_config.enableConsole !== false) {
    consoleInterceptor.install();
    _log('Console interceptor installed');
  }

  if (_config.enableNetwork !== false) {
    networkInterceptor.install();
    _log('Network interceptor installed');
  }
}

/**
 * 安装远程日志上报模块
 */
function _installRemoteLogger() {
  if (_config.remoteLogger && _config.remoteLogger.url) {
    remoteLogger.install(Object.assign({ enabled: true }, _config.remoteLogger));
  }
}

/**
 * 销毁 SDK，恢复所有拦截
 */
function destroy() {
  if (!_initialized) return;

  consoleInterceptor.uninstall();
  networkInterceptor.uninstall();
  errorHandler.uninstall();
  remoteLogger.uninstall();
  eventBus.clear();

  _initialized = false;
}

/**
 * 获取 SDK 是否已启用（面板是否可见）
 * @returns {boolean}
 */
function isEnabled() {
  return _initialized && _config.enabled === true;
}

/**
 * 获取 SDK 配置
 * @returns {Object}
 */
function getConfig() {
  return Object.assign({}, _config);
}

/**
 * 获取 SDK 版本号
 * @returns {string}
 */
function getVersion() {
  return '1.1.0';
}

/**
 * 获取远程配置是否已加载
 * @returns {boolean}
 */
function isRemoteConfigLoaded() {
  return _remoteConfigLoaded;
}

// ========== 内部日志方法 ==========

function _log() {
  var args = Array.prototype.slice.call(arguments);
  var fn = consoleInterceptor.originalConsole.log || console.log;
  fn.apply(console, ['[MpDebug]'].concat(args));
}

function _warn() {
  var args = Array.prototype.slice.call(arguments);
  var fn = consoleInterceptor.originalConsole.warn || console.warn;
  fn.apply(console, ['[MpDebug]'].concat(args));
}

// ========== 导出 ==========

var MpDebug = {
  init: init,
  destroy: destroy,
  isEnabled: isEnabled,
  getConfig: getConfig,
  getVersion: getVersion,
  isRemoteConfigLoaded: isRemoteConfigLoaded,

  // 暴露子模块，供高级用户使用
  eventBus: eventBus,
  console: {
    getLogList: consoleInterceptor.getLogList,
    clearLogs: consoleInterceptor.clearLogs,
    addLog: consoleInterceptor.addManualLog
  },
  network: {
    getRequestList: networkInterceptor.getRequestList,
    clearRequests: networkInterceptor.clearRequests
  },
  storage: storageManager,

  // 远程配置模块
  remoteConfig: {
    clearCache: remoteConfig.clearCache
  },

  // 远程日志上报模块
  remoteLogger: {
    flush: remoteLogger.flush
  }
};

module.exports = MpDebug;
