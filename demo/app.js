/**
 * mp-debug-sdk Demo 小程序 - App 入口
 */

// ====== 引入并初始化 mp-debug-sdk ======
const MpDebug = require('./lib/mp-debug-sdk/core/index');

// 在 App() 调用之前初始化
// env 设为 'development' 启用调试面板，设为 'production' 则不启用
MpDebug.init({
  env: 'development',    // 也可以从服务端配置动态获取
  // enabled: true,      // 或者直接通过 enabled 控制
  enableConsole: true,
  enableNetwork: true,
  enableError: true,
  enableStorage: true
});

// ====================================

App({
  onLaunch() {
    console.log('[App] onLaunch - 应用启动');
    console.log('[App] SDK Version:', MpDebug.getVersion());
    console.log('[App] SDK Enabled:', MpDebug.isEnabled());

    // 模拟一些日志
    console.info('[App] 这是一条 info 日志');
    console.warn('[App] 这是一条 warn 日志');
  },

  onShow() {
    console.log('[App] onShow');
  },

  globalData: {
    userInfo: null,
    debugMode: true
  }
});
