/**
 * RemoteLogger - 远程日志上报模块
 * 
 * 提供远程日志上报能力，用于接入未来的监测平台。
 * 支持：
 * - 选择上报的数据类型（错误信息、网络请求）
 * - 缓冲队列 + 批量上报，不影响用户业务操作
 * - 在合适的时机（页面 onHide/onUnload）上报
 * - 开发者自定义数据转换钩子
 * - 区分生产/测试环境的上报地址
 */

const eventBus = require('./event-bus');

// 默认配置
var DEFAULT_OPTIONS = {
  // 是否启用远程日志上报
  enabled: false,
  // 上报地址配置（区分环境）
  url: '',
  // 需要上报的数据类型
  reportTypes: ['error', 'network'],  // 可选: 'error' | 'network' | 'console'
  // 批量上报的条数阈值
  batchSize: 20,
  // 上报间隔（毫秒），到达间隔时间自动上报（即使未达到 batchSize）
  flushInterval: 30000,  // 30秒
  // 最大缓冲队列长度（超出则丢弃最早的数据）
  maxQueueSize: 200,
  // 自定义请求头
  headers: {},
  // 上报请求超时（毫秒）
  timeout: 5000,
  // 开发者自定义数据转换钩子
  // beforeReport(type, data) => transformedData | false(丢弃该条数据)
  beforeReport: null,
  // 上报成功回调
  onReportSuccess: null,
  // 上报失败回调
  onReportError: null
};

// 模块内部状态
var _options = {};
var _queue = [];
var _installed = false;
var _flushTimer = null;
var _flushing = false;

// 保存原始 wx.request 引用（避免被 SDK 网络拦截器拦截上报请求）
var _originalWxRequest = null;

/**
 * 安装远程日志上报模块
 * @param {Object} options - 配置选项
 */
function install(options) {
  if (_installed) return;

  _options = _mergeOptions(DEFAULT_OPTIONS, options || {});

  if (!_options.enabled || !_options.url) {
    _log('Remote logger disabled (enabled=' + _options.enabled + ', url=' + (_options.url || 'empty') + ')');
    return;
  }

  _installed = true;

  // 保存原始 wx.request 引用
  // 需要在 network interceptor 安装之前，或者使用已保存的原始引用
  _originalWxRequest = wx.__mp_debug_original_request || wx.request;

  // 注册事件监听
  _bindEvents();

  // 启动定时刷新
  if (_options.flushInterval > 0) {
    _flushTimer = setInterval(function () {
      flush();
    }, _options.flushInterval);
  }

  // 监听页面生命周期，在合适的时机上报
  _hookPageLifecycle();

  _log('Remote logger installed, url=' + _options.url + ', types=' + _options.reportTypes.join(','));
  eventBus.emit('remoteLogger:ready');
}

/**
 * 卸载远程日志上报模块
 */
function uninstall() {
  if (!_installed) return;

  // 上报剩余队列数据
  flush();

  // 清理事件监听
  _unbindEvents();

  // 清理定时器
  if (_flushTimer) {
    clearInterval(_flushTimer);
    _flushTimer = null;
  }

  // 恢复页面生命周期
  _unhookPageLifecycle();

  _installed = false;
  _queue = [];
  _log('Remote logger uninstalled');
}

/**
 * 绑定 EventBus 事件
 */
function _bindEvents() {
  // 监听错误上报
  if (_options.reportTypes.indexOf('error') !== -1) {
    _onError = function (errorData) {
      _enqueue('error', errorData);
    };
    eventBus.on('error:remote', _onError);
  }

  // 监听网络请求上报
  if (_options.reportTypes.indexOf('network') !== -1) {
    _onNetwork = function (record) {
      _enqueue('network', {
        url: record.url,
        method: record.method,
        statusCode: record.statusCode,
        duration: record.duration,
        status: record.status,
        errMsg: record.errMsg || '',
        startTimeStr: record.startTimeStr
      });
    };
    eventBus.on('network:remote', _onNetwork);
  }

  // 监听 Console 日志上报（可选）
  if (_options.reportTypes.indexOf('console') !== -1) {
    _onConsole = function (logItem) {
      _enqueue('console', {
        type: logItem.type,
        content: logItem.data.map(function (d) { return d.value; }).join(' '),
        timeStr: logItem.timeStr
      });
    };
    eventBus.on('log:remote', _onConsole);
  }
}

// 事件处理函数引用（用于解绑）
var _onError = null;
var _onNetwork = null;
var _onConsole = null;

/**
 * 解绑 EventBus 事件
 */
function _unbindEvents() {
  if (_onError) {
    eventBus.off('error:remote', _onError);
    _onError = null;
  }
  if (_onNetwork) {
    eventBus.off('network:remote', _onNetwork);
    _onNetwork = null;
  }
  if (_onConsole) {
    eventBus.off('log:remote', _onConsole);
    _onConsole = null;
  }
}

/**
 * 将数据添加到缓冲队列
 * @param {string} type - 数据类型 (error | network | console)
 * @param {Object} data - 数据
 */
function _enqueue(type, data) {
  // 通过开发者钩子进行数据转换/过滤
  var reportData = data;
  if (typeof _options.beforeReport === 'function') {
    try {
      reportData = _options.beforeReport(type, data);
      // 返回 false 或 null 表示丢弃该条数据
      if (reportData === false || reportData === null) {
        return;
      }
    } catch (e) {
      // 钩子执行出错，使用原始数据
      reportData = data;
    }
  }

  _queue.push({
    type: type,
    data: reportData,
    timestamp: Date.now()
  });

  // 超过最大队列长度时丢弃最早的数据
  if (_queue.length > _options.maxQueueSize) {
    _queue = _queue.slice(-_options.maxQueueSize);
  }

  // 达到批量阈值时自动上报
  if (_queue.length >= _options.batchSize) {
    flush();
  }
}

/**
 * 立即上报缓冲队列中的所有数据
 */
function flush() {
  if (_flushing || _queue.length === 0 || !_options.url) {
    return;
  }

  _flushing = true;

  // 取出当前队列的数据（快照）
  var batch = _queue.slice();
  _queue = [];

  _sendReport(batch, function (success) {
    _flushing = false;
    if (!success) {
      // 上报失败时将数据重新放回队列头部（限制重试次数，这里简单处理）
      _queue = batch.concat(_queue);
      if (_queue.length > _options.maxQueueSize) {
        _queue = _queue.slice(-_options.maxQueueSize);
      }
    }
  });
}

/**
 * 发送上报请求
 * @param {Array} batch - 待上报的数据批次
 * @param {Function} callback - 回调 callback(success)
 */
function _sendReport(batch, callback) {
  var requestFn = _originalWxRequest || wx.request;

  try {
    requestFn({
      url: _options.url,
      method: 'POST',
      header: _mergeOptions({ 'content-type': 'application/json' }, _options.headers),
      timeout: _options.timeout,
      data: {
        logs: batch,
        reportTime: Date.now(),
        sdkVersion: '1.1.0'
      },
      success: function (res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          _log('Report sent successfully, ' + batch.length + ' items');
          eventBus.emit('remoteLogger:reported', { count: batch.length, success: true });
          if (typeof _options.onReportSuccess === 'function') {
            try { _options.onReportSuccess(batch, res); } catch (e) { /* ignore */ }
          }
          callback(true);
        } else {
          _log('Report failed (status: ' + res.statusCode + ')');
          eventBus.emit('remoteLogger:reported', { count: batch.length, success: false, statusCode: res.statusCode });
          if (typeof _options.onReportError === 'function') {
            try { _options.onReportError(batch, res); } catch (e) { /* ignore */ }
          }
          callback(false);
        }
      },
      fail: function (err) {
        _log('Report request error: ' + (err.errMsg || ''));
        eventBus.emit('remoteLogger:reported', { count: batch.length, success: false, error: err.errMsg });
        if (typeof _options.onReportError === 'function') {
          try { _options.onReportError(batch, err); } catch (e) { /* ignore */ }
        }
        callback(false);
      }
    });
  } catch (e) {
    _log('Report request exception');
    callback(false);
  }
}

// ========== 页面生命周期钩子 ==========
// 在合适的时机（onHide / onUnload）自动上报，不影响用户操作

var _originalPage = null;

function _hookPageLifecycle() {
  if (typeof Page === 'undefined') return;

  _originalPage = Page;

  Page = function (config) {
    if (!config) config = {};

    // 劫持 onHide
    var originalOnHide = config.onHide;
    config.onHide = function () {
      // 在页面隐藏时尝试上报
      flush();
      if (originalOnHide) {
        originalOnHide.call(this);
      }
    };

    // 劫持 onUnload
    var originalOnUnload = config.onUnload;
    config.onUnload = function () {
      // 在页面卸载时尝试上报
      flush();
      if (originalOnUnload) {
        originalOnUnload.call(this);
      }
    };

    return _originalPage(config);
  };
}

function _unhookPageLifecycle() {
  if (_originalPage) {
    Page = _originalPage;
    _originalPage = null;
  }
}

// ========== 工具函数 ==========

/**
 * 合并选项（浅合并）
 */
function _mergeOptions(defaults, overrides) {
  var result = {};
  var key;
  for (key in defaults) {
    if (defaults.hasOwnProperty(key)) {
      result[key] = defaults[key];
    }
  }
  for (key in overrides) {
    if (overrides.hasOwnProperty(key) && overrides[key] !== undefined) {
      result[key] = overrides[key];
    }
  }
  return result;
}

/**
 * 内部日志
 */
function _log() {
  var args = Array.prototype.slice.call(arguments);
  var fn = (typeof console !== 'undefined' && console.__originalLog) ? console.__originalLog : console.log;
  fn.apply(console, ['[MpDebug][RemoteLogger]'].concat(args));
}

// ========== 导出 ==========

module.exports = {
  install: install,
  uninstall: uninstall,
  flush: flush
};
