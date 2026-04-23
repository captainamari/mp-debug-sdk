/**
 * MpDebug - 小程序调试控制台 SDK 入口
 * 
 * 使用方式：
 *   import MpDebug from './lib/mp-debug-sdk/index';
 *   MpDebug.init({ env: 'development' });
 */

const eventBus = require('./event-bus');
const consoleInterceptor = require('./console-interceptor');
const networkInterceptor = require('./network-interceptor');
const errorHandler = require('./error-handler');
const storageManager = require('./storage-manager');

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
  enableStorage: true    // 是否启用 Storage 面板
};

// SDK 是否已初始化
let _initialized = false;

/**
 * 初始化 SDK
 * 注意：必须在 App() 调用之前执行
 * 
 * @param {Object} options - 配置选项
 * @param {string} [options.env=''] - 环境标识，'development' 时自动启用
 * @param {boolean} [options.enabled] - 是否启用（优先级高于 env 判断）
 * @param {boolean} [options.enableConsole=true] - 是否启用 Console 拦截
 * @param {boolean} [options.enableNetwork=true] - 是否启用 Network 拦截
 * @param {boolean} [options.enableError=true] - 是否启用错误捕获
 * @param {boolean} [options.enableStorage=true] - 是否启用 Storage 面板
 */
function init(options = {}) {
  if (_initialized) {
    _warn('MpDebug already initialized');
    return;
  }

  // 合并配置
  Object.assign(_config, options);

  // 判断是否启用
  if (typeof _config.enabled === 'boolean') {
    // 如果显式设置了 enabled，以 enabled 为准
    if (!_config.enabled) {
      _log('MpDebug disabled by config');
      return;
    }
  } else {
    // 未设置 enabled 时，根据 env 判断
    // 默认不启用，只有 env 为 'development' / 'dev' / 'test' 时才启用
    const enabledEnvs = ['development', 'dev', 'test', 'staging'];
    if (!enabledEnvs.includes((_config.env || '').toLowerCase())) {
      _log('MpDebug disabled (env: ' + _config.env + ')');
      return;
    }
  }

  _initialized = true;
  _log('MpDebug initializing...');

  // 按配置安装各模块（注意顺序）
  // 1. 先安装错误捕获（需要在 App() 之前劫持 App 构造函数）
  if (_config.enableError) {
    errorHandler.install();
    _log('Error handler installed');
  }

  // 2. 安装 Console 拦截
  if (_config.enableConsole) {
    consoleInterceptor.install();
    _log('Console interceptor installed');
  }

  // 3. 安装 Network 拦截
  if (_config.enableNetwork) {
    networkInterceptor.install();
    _log('Network interceptor installed');
  }

  _log('MpDebug initialized successfully');

  // 发出初始化完成事件
  eventBus.emit('sdk:ready', _config);
}

/**
 * 销毁 SDK，恢复所有拦截
 */
function destroy() {
  if (!_initialized) return;

  consoleInterceptor.uninstall();
  networkInterceptor.uninstall();
  errorHandler.uninstall();
  eventBus.clear();

  _initialized = false;
}

/**
 * 获取 SDK 是否已启用
 * @returns {boolean}
 */
function isEnabled() {
  return _initialized;
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
  return '1.0.0';
}

// ========== 内部日志方法 ==========

function _log(...args) {
  const fn = consoleInterceptor.originalConsole.log || console.log;
  fn.apply(console, ['[MpDebug]', ...args]);
}

function _warn(...args) {
  const fn = consoleInterceptor.originalConsole.warn || console.warn;
  fn.apply(console, ['[MpDebug]', ...args]);
}

// ========== 导出 ==========

const MpDebug = {
  init,
  destroy,
  isEnabled,
  getConfig,
  getVersion,

  // 暴露子模块，供高级用户使用
  eventBus,
  console: {
    getLogList: consoleInterceptor.getLogList,
    clearLogs: consoleInterceptor.clearLogs,
    addLog: consoleInterceptor.addManualLog
  },
  network: {
    getRequestList: networkInterceptor.getRequestList,
    clearRequests: networkInterceptor.clearRequests
  },
  storage: storageManager
};

module.exports = MpDebug;
