/**
 * mp-debug-sdk Demo 小程序 - App 入口
 */

// ====== 引入并初始化 mp-debug-sdk ======
const MpDebug = require('./lib/mp-debug-sdk/core/index');

// ============================
// 方式一：本地配置（原有方式，开发/测试环境使用）
// ============================
// MpDebug.init({
//   env: 'development',
//   enableConsole: true,
//   enableNetwork: true,
//   enableError: true,
//   enableStorage: true
// });

// ============================
// 方式二：远程动态配置（推荐生产环境使用）
// 从服务端读取配置，为指定用户动态开启调试面板
// ============================
// MpDebug.init({
//   enabled: false,  // 初始不启用，等待远程配置决定
//   remoteConfig: {
//     configUrl: 'https://api.example.com/debug/config',  // 配置接口
//     timeout: 1000,         // 超时1秒，超时则降级为 enabled: false
//     userIdentity: {
//       corpId: 'CORP001',   // 企业ID
//       userId: 'zhangsan'   // 用户工号
//     }
//   }
// });

// ============================
// 方式三：远程配置 + 远程日志上报（完整功能）
// ============================
// MpDebug.init({
//   enabled: false,
//   remoteConfig: {
//     configUrl: 'https://api.example.com/debug/config',
//     timeout: 1000,
//     userIdentity: {
//       corpId: 'CORP001',
//       userId: 'zhangsan'
//     }
//   },
//   remoteLogger: {
//     url: 'https://api.example.com/debug/report',  // 日志上报地址
//     reportTypes: ['error', 'network'],  // 上报错误和网络请求
//     batchSize: 10,         // 每10条批量上报
//     flushInterval: 30000,  // 或每30秒上报一次
//     beforeReport: function(type, data) {
//       // 自定义数据转换钩子（可选）
//       // 返回 false 可以丢弃该条数据
//       data.appVersion = '1.0.0';
//       return data;
//     }
//   }
// });

// ============================
// Demo 使用方式一：本地开发模式
// ============================
MpDebug.init({
  env: 'development',
  enableConsole: true,
  enableNetwork: true,
  enableError: true,
  enableStorage: true,
  // 开启远程日志上报演示（可选）
  // remoteLogger: {
  //   url: 'https://api.example.com/debug/report',
  //   reportTypes: ['error', 'network']
  // }
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
