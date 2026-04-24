# mp-debug-sdk

> 微信小程序调试控制台 SDK —— 轻量级、零依赖、可拖拽的小程序调试面板

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📖 目录

- [简介](#-简介)
- [功能特性](#-功能特性)
- [效果预览](#-效果预览)
- [快速开始](#-快速开始)
- [配置选项](#-配置选项)
- [动态远程配置](#-动态远程配置)
- [远程日志上报](#-远程日志上报)
- [面板功能详解](#-面板功能详解)
- [构建压缩](#-构建压缩)
- [API 参考](#-api-参考)
- [Demo 项目](#-demo-项目)
- [架构设计](#-架构设计)
- [常见问题](#-常见问题)
- [更新日志](#-更新日志)

---

## 📌 简介

`mp-debug-sdk` 是一个专为**微信小程序**设计的轻量级调试控制台，类似于 Web 端的 vConsole，但**完全基于小程序原生自定义组件**实现。

### 为什么需要它？

- 微信内置 vConsole **没有 Network 面板**，无法查看请求详情
- 真机/体验版/正式版环境中，**无法使用开发工具的调试能力**
- 需要一个可以在**任何环境**下快速查看日志和网络请求的工具

### 核心优势

| 特性 | 说明 |
|------|------|
| 🪶 **轻量** | 压缩后全量 < 50KB，不影响小程序包体积 |
| 🚫 **零依赖** | 不依赖 vant、uni-app 或任何第三方组件库 |
| 🔌 **即插即用** | 复制文件 + 3 行代码即可接入 |
| 🎛️ **环境可控** | 通过 `env` 参数控制启停，默认不启用 |
| 🖱️ **可拖拽** | 悬浮按钮支持任意位置拖拽 |
| 🌐 **动态控制** | 支持从服务端读取配置，为生产环境指定用户动态开启调试面板 |
| 📡 **远程上报** | 内置远程日志上报模块，缓冲队列 + 批量上报，提供开发者自定义钩子 |

---

## ✨ 功能特性

### 🔹 Console 面板
- 捕获 `console.log` / `info` / `warn` / `error` / `debug`
- 按类型过滤（All / Log / Info / Warn / Error）
- 显示时间戳，支持展开查看详细数据
- 复杂对象（Object / Array）格式化展示
- 一键复制日志内容
- 一键清空

### 🔹 Network 面板
- 拦截所有 `wx.request` 请求
- 显示：请求方法、URL、状态码、耗时、响应大小
- 点击查看请求详情：
  - **General**：URL / Method / Status / Duration / Size
  - **Request Headers**：请求头键值对
  - **Request Body**：请求体（JSON 格式化）
  - **Response**：响应头 + 响应体（JSON 格式化）
- 状态码颜色区分：2xx(绿) / 3xx(蓝) / 4xx(黄) / 5xx(红)
- 一键复制完整请求信息

### 🔹 Storage 面板
- 读取并展示所有本地存储数据
- 显示 Storage 使用量（已用 / 上限）
- 查看单条数据详情（JSON 格式化）
- 支持删除单条数据
- 一键刷新

### 🔹 错误捕获
- 自动捕获 `App.onError` 运行时错误
- 自动捕获 `App.onUnhandledRejection` 未处理的 Promise 拒绝
- 捕获的错误自动显示在 Console 面板

### 🔹 悬浮按钮
- 使用 `movable-view` 实现，支持任意方向拖拽
- 面板关闭时显示未读消息 badge
- 点击展开/收起调试面板

### 🔹 动态远程配置（v1.1.0 新增）
- 从服务端接口获取配置，动态决定是否启用调试面板
- 基于用户身份（企业ID + 工号）精准控制，可为生产环境指定用户开启
- 请求超时（默认 1 秒，可配置）自动降级为本地配置，不影响小程序正常启动
- 支持配置缓存，减少重复请求
- 远程配置可覆盖本地的模块开关（Console / Network / Error / Storage）

### 🔹 远程日志上报（v1.1.0 新增）
- 内置远程日志上报模块，可选择上报错误信息、网络请求、Console 日志
- 缓冲队列 + 批量上报，到达阈值或定时自动发送
- 在合适的时机上报（页面 onHide / onUnload），不影响用户业务操作
- 提供 `beforeReport` 钩子供开发者自定义数据转换/过滤
- 区分生产/测试环境的上报地址
- 即使不启用调试面板，远程日志上报也可独立运行

---

## 🚀 快速开始

### 方式一：使用源码（推荐开发阶段）

#### 1. 复制 SDK 到项目

将 `src/` 目录下的文件复制到你的小程序项目中：

```
你的小程序项目/
├── lib/
│   └── mp-debug-sdk/          ← 复制 src/ 目录的内容到这里
│       ├── core/
│       │   ├── index.js
│       │   ├── event-bus.js
│       │   ├── console-interceptor.js
│       │   ├── network-interceptor.js
│       │   ├── error-handler.js
│       │   ├── storage-manager.js
│       │   ├── remote-config.js      ← 远程动态配置
│       │   └── remote-logger.js      ← 远程日志上报
│       ├── components/
│       │   ├── debug-panel/
│       │   ├── float-button/
│       │   ├── console-panel/
│       │   ├── network-panel/
│       │   └── storage-panel/
│       └── utils/
│           ├── formatter.js
│           └── helper.js
```

#### 2. 初始化 SDK（app.js）

```javascript
// app.js
const MpDebug = require('./lib/mp-debug-sdk/core/index');

// ⚠️ 必须在 App() 调用之前初始化
MpDebug.init({
  env: 'development'  // 'development' 时启用，'production' 时不启用
});

App({
  onLaunch() {
    // 你的业务代码...
  }
});
```

#### 3. 注册组件

**全局注册**（推荐，所有页面都可用）：

```json
// app.json
{
  "usingComponents": {
    "mp-debug": "/lib/mp-debug-sdk/components/debug-panel/index"
  }
}
```

**或按页面注册**：

```json
// pages/index/index.json
{
  "usingComponents": {
    "mp-debug": "/lib/mp-debug-sdk/components/debug-panel/index"
  }
}
```

#### 4. 在页面中使用

```xml
<!-- pages/index/index.wxml -->
<view>
  <!-- 你的页面内容 -->
</view>

<!-- 在页面最底部添加调试面板 -->
<mp-debug />
```

> ✅ 完成！现在页面右下角会出现一个可拖拽的悬浮按钮，点击即可打开调试面板。

---

### 方式二：使用压缩包（推荐生产阶段）

#### 1. 构建压缩

```bash
cd mp-debug-sdk
npm install
npm run build
```

#### 2. 复制压缩产物

将 `dist/mp-debug-sdk/` 目录复制到你的小程序项目的 `lib/` 下。

后续步骤同方式一的 2~4 步。

---

## ⚙️ 配置选项

`MpDebug.init(options)` 支持以下配置：

### 基础配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `env` | `string` | `''` | 环境标识。`development` / `dev` / `test` / `staging` 时自动启用 |
| `enabled` | `boolean` | - | 是否启用（优先级高于 `env`）。不设置时根据 `env` 自动判断 |
| `enableConsole` | `boolean` | `true` | 是否启用 Console 拦截 |
| `enableNetwork` | `boolean` | `true` | 是否启用 Network 拦截 |
| `enableError` | `boolean` | `true` | 是否启用全局错误捕获 |
| `enableStorage` | `boolean` | `true` | 是否启用 Storage 面板 |
| `panelHeight` | `number` | `60` | 面板高度（屏幕百分比，取值 30-90） |
| `remoteConfig` | `Object` | `null` | 远程动态配置选项，详见 [动态远程配置](#-动态远程配置) |
| `remoteLogger` | `Object` | `null` | 远程日志上报选项，详见 [远程日志上报](#-远程日志上报) |

### 配置示例

#### 最简配置

```javascript
MpDebug.init({ env: 'development' });
```

#### 通过 enabled 精确控制

```javascript
MpDebug.init({
  enabled: __wxConfig.envVersion !== 'release'  // 正式版不启用
});
```

#### 按需启用模块

```javascript
MpDebug.init({
  env: 'development',
  enableConsole: true,
  enableNetwork: true,
  enableError: true,
  enableStorage: false  // 不需要 Storage 面板
});
```

#### 动态远程配置（生产环境推荐）

```javascript
MpDebug.init({
  enabled: false,  // 初始不启用，等待远程配置决定
  remoteConfig: {
    configUrl: 'https://api.example.com/debug/config',
    timeout: 1000,  // 超时1秒，超时降级为 enabled: false
    userIdentity: {
      corpId: 'CORP001',   // 企业ID
      userId: 'zhangsan'   // 用户工号
    }
  }
});
```

#### 远程配置 + 远程日志上报（完整功能）

```javascript
MpDebug.init({
  enabled: false,
  remoteConfig: {
    configUrl: 'https://api.example.com/debug/config',
    timeout: 1000,
    userIdentity: { corpId: 'CORP001', userId: 'zhangsan' }
  },
  remoteLogger: {
    url: 'https://api.example.com/debug/report',
    reportTypes: ['error', 'network'],
    batchSize: 10,
    flushInterval: 30000,
    beforeReport(type, data) {
      data.appVersion = '1.0.0';
      return data;
    }
  }
});
```

### 环境变量最佳实践

推荐在项目中维护一个环境变量配置文件：

```javascript
// config/env.js
module.exports = {
  env: 'development',  // 打包发布时改为 'production'
  apiBaseUrl: 'https://api.example.com',
  // ...
};
```

```javascript
// app.js
const MpDebug = require('./lib/mp-debug-sdk/core/index');
const { env } = require('./config/env');

MpDebug.init({ env });

App({ /* ... */ });
```

---

## 🌐 动态远程配置

### 使用场景

在生产环境中，通常不需要所有用户都看到调试面板。但当某个用户遇到问题时，希望能**通过后端配置动态开启**调试面板，而不需要发版。

典型流程：
1. 用户在生产环境使用小程序（`企业ID + 工号 + 密码` 登录）
2. 用户反馈遇到问题
3. 运维/开发在后台为该用户开启调试面板
4. 用户重新打开小程序，自动出现调试面板
5. 问题排查完毕后，在后台关闭调试

### 配置参数

`remoteConfig` 对象支持以下参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `configUrl` | `string` | `''` | **必填**。远程配置接口地址 |
| `timeout` | `number` | `1000` | 请求超时（毫秒）。超时后自动降级为本地 `enabled` 配置 |
| `userIdentity` | `Object` | `{}` | 用户身份信息，发送给后端用于判断 |
| `userIdentity.corpId` | `string` | `''` | 企业ID |
| `userIdentity.userId` | `string` | `''` | 用户名/工号 |
| `headers` | `Object` | `{}` | 自定义请求头（如 token 等） |
| `extraParams` | `Object` | `{}` | 额外请求参数 |
| `enableCache` | `boolean` | `true` | 是否启用配置缓存 |
| `cacheTTL` | `number` | `300000` | 缓存有效期（毫秒），默认 5 分钟 |

### 后端接口约定

SDK 会以 **GET** 方式请求 `configUrl`，携带以下 query 参数：

```
GET /debug/config?corpId=CORP001&userId=zhangsan
```

后端应返回如下 JSON（也兼容 `{ code: 0, data: {...} }` 包装格式）：

```json
{
  "enabled": true,
  "enableConsole": true,
  "enableNetwork": true,
  "enableError": true,
  "enableStorage": true,
  "remoteLoggerUrl": "https://api.example.com/debug/report",
  "remoteLoggerTypes": ["error", "network"]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `enabled` | `boolean` | **必需**。是否为该用户启用调试面板 |
| `enableConsole` | `boolean` | 可选。覆盖本地的 Console 开关 |
| `enableNetwork` | `boolean` | 可选。覆盖本地的 Network 开关 |
| `enableError` | `boolean` | 可选。覆盖本地的 Error 开关 |
| `enableStorage` | `boolean` | 可选。覆盖本地的 Storage 开关 |
| `remoteLoggerUrl` | `string` | 可选。覆盖本地的日志上报地址 |
| `remoteLoggerTypes` | `string[]` | 可选。覆盖本地的日志上报类型 |

### 超时降级机制

```
SDK init() 被调用
    │
    ├── 有 remoteConfig.configUrl?
    │   ├── 是 → 发起远程配置请求
    │   │       ├── 在 timeout 内返回
    │   │       │   ├── enabled: true  → 启用面板 + 安装拦截器
    │   │       │   └── enabled: false → 不启用面板
    │   │       │
    │   │       └── 超时 / 网络异常 / 响应异常
    │   │           └── 降级为本地 enabled / env 配置
    │   │
    │   └── 否 → 使用本地配置（同步模式）
    │
    └── 整个过程不阻塞 App() 的调用，不影响小程序正常启动
```

> ⚠️ **重要**：`errorHandler`（全局错误捕获）必须在 `App()` 之前安装，因此在远程配置模式下它会**先同步安装**，然后再异步等待远程配置决定是否安装其他拦截器。

### 完整使用示例

```javascript
// app.js
const MpDebug = require('./lib/mp-debug-sdk/core/index');

// 从你的业务配置中获取用户信息（此时可能还未登录，可传空）
const userInfo = wx.getStorageSync('userInfo') || {};

MpDebug.init({
  enabled: false,  // 初始不启用
  remoteConfig: {
    configUrl: 'https://api.yourcompany.com/debug/config',
    timeout: 1000,
    userIdentity: {
      corpId: userInfo.corpId || '',
      userId: userInfo.userId || ''
    },
    headers: {
      'Authorization': wx.getStorageSync('token') || ''
    },
    enableCache: true,
    cacheTTL: 5 * 60 * 1000  // 5分钟缓存
  }
});

App({
  onLaunch() {
    // 正常业务代码，不受影响
  }
});
```

### 事件监听

```javascript
// 监听远程配置加载成功
MpDebug.eventBus.on('remoteConfig:loaded', ({ source, config }) => {
  // source: 'cache' | 'remote'
  console.log('Remote config loaded from:', source, config);
});

// 监听远程配置超时
MpDebug.eventBus.on('remoteConfig:timeout', () => {
  console.log('Remote config timeout, using fallback');
});

// 监听远程配置错误
MpDebug.eventBus.on('remoteConfig:error', (err) => {
  console.log('Remote config error:', err);
});
```

---

## 📡 远程日志上报

### 使用场景

将调试信息上报到远程监测平台，用于：
- 生产环境的错误监控和异常检测
- 网络请求性能分析
- 用户行为分析

### 配置参数

`remoteLogger` 对象支持以下参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `url` | `string` | `''` | **必填**。日志上报接口地址 |
| `reportTypes` | `string[]` | `['error', 'network']` | 需要上报的数据类型。可选: `'error'` / `'network'` / `'console'` |
| `batchSize` | `number` | `20` | 批量上报的条数阈值，达到后自动发送 |
| `flushInterval` | `number` | `30000` | 定时上报间隔（毫秒），默认 30 秒 |
| `maxQueueSize` | `number` | `200` | 缓冲队列最大长度，超出则丢弃最早的数据 |
| `headers` | `Object` | `{}` | 自定义请求头 |
| `timeout` | `number` | `5000` | 上报请求超时（毫秒） |
| `beforeReport` | `Function` | `null` | 数据转换钩子。`fn(type, data) => data \| false` |
| `onReportSuccess` | `Function` | `null` | 上报成功回调 |
| `onReportError` | `Function` | `null` | 上报失败回调 |

### 上报时机

为了不影响用户正常操作，SDK 选择以下时机自动上报：

| 触发条件 | 说明 |
|----------|------|
| 达到 `batchSize` | 缓冲队列积累到阈值后自动发送 |
| 达到 `flushInterval` | 定时器触发，即使未达到阈值也发送 |
| 页面 `onHide` | 用户切后台或跳转页面时上报 |
| 页面 `onUnload` | 页面卸载时上报 |
| 手动调用 `flush()` | 开发者主动触发上报 |

### 上报数据格式

SDK 以 **POST** 方式发送数据：

```json
{
  "logs": [
    {
      "type": "error",
      "data": {
        "type": "runtime",
        "message": "xxx is not defined",
        "time": 1714000000000
      },
      "timestamp": 1714000000100
    },
    {
      "type": "network",
      "data": {
        "url": "https://api.example.com/users",
        "method": "GET",
        "statusCode": 500,
        "duration": 230,
        "status": "success",
        "errMsg": "",
        "startTimeStr": "14:30:15.123"
      },
      "timestamp": 1714000000200
    }
  ],
  "reportTime": 1714000000300,
  "sdkVersion": "1.1.0"
}
```

### beforeReport 钩子

通过 `beforeReport` 钩子，开发者可以：

1. **添加自定义字段**（如 appVersion、userId 等）
2. **过滤不需要上报的数据**（返回 `false` 丢弃）
3. **脱敏处理**（对敏感数据进行脱敏）

```javascript
MpDebug.init({
  remoteLogger: {
    url: 'https://api.example.com/debug/report',
    reportTypes: ['error', 'network'],
    beforeReport(type, data) {
      // 1. 添加自定义字段
      data.appVersion = '2.0.0';
      data.userId = getApp().globalData.userId;

      // 2. 过滤：忽略健康检查请求
      if (type === 'network' && data.url.includes('/health')) {
        return false;  // 丢弃该条数据
      }

      // 3. 脱敏：隐藏 token
      if (type === 'network' && data.url.includes('token=')) {
        data.url = data.url.replace(/token=[^&]+/, 'token=***');
      }

      return data;
    },
    onReportSuccess(batch, res) {
      console.log('上报成功:', batch.length, '条');
    },
    onReportError(batch, err) {
      console.warn('上报失败:', err);
    }
  }
});
```

### 独立使用（不开启调试面板）

远程日志上报可以**独立于调试面板**运行。即使 `enabled: false`，只要配置了 `remoteLogger`，上报功能仍然生效：

```javascript
MpDebug.init({
  enabled: false,        // 不显示调试面板
  enableError: true,     // 但仍然捕获错误
  enableNetwork: true,   // 仍然拦截网络请求
  remoteLogger: {
    url: 'https://api.example.com/debug/report',
    reportTypes: ['error', 'network']
  }
});
```

> 💡 这种模式特别适合**生产环境静默监控**：不展示调试 UI，但持续上报错误和异常请求。

### 手动触发上报

```javascript
// 立即上报缓冲队列中的所有数据
MpDebug.remoteLogger.flush();
```

### 事件监听

```javascript
// 远程日志上报模块就绪
MpDebug.eventBus.on('remoteLogger:ready', () => {
  console.log('Remote logger ready');
});

// 上报完成
MpDebug.eventBus.on('remoteLogger:reported', ({ count, success }) => {
  console.log('Reported', count, 'items, success:', success);
});
```

---

## 📱 面板功能详解

### Console 面板

| 功能 | 操作 |
|------|------|
| 查看日志 | 打开面板，默认显示 Console Tab |
| 过滤日志 | 点击顶部标签：All / Log / Info / Warn / Error |
| 展开详情 | 点击日志条目展开详细数据 |
| 复制内容 | 展开后点击 Copy 按钮 |
| 清空日志 | 点击右上角 🗑 按钮 |

**日志类型说明：**
- `›` log（白色）：普通日志
- `ℹ` info（蓝色）：信息日志
- `⚠` warn（黄色）：警告日志
- `✕` error（红色）：错误日志

**自动捕获：**
- 运行时错误显示为 `[Runtime Error]`
- 未处理的 Promise 拒绝显示为 `[Unhandled Promise Rejection]`

### Network 面板

| 功能 | 操作 |
|------|------|
| 查看请求列表 | 切换到 Network Tab |
| 查看请求详情 | 点击任意请求条目 |
| 切换详情 Tab | General / Req Headers / Req Body / Response |
| 复制请求信息 | 详情页点击 Copy 按钮 |
| 返回列表 | 详情页点击 ← Back |
| 清空记录 | 点击右上角 🗑 按钮 |

**状态码颜色：**
- 🟢 2xx（绿色）：成功
- 🔵 3xx（蓝色）：重定向
- 🟡 4xx（黄色）：客户端错误
- 🔴 5xx（红色）：服务端错误

### Storage 面板

| 功能 | 操作 |
|------|------|
| 查看存储列表 | 切换到 Storage Tab（自动加载） |
| 查看详情 | 点击任意存储条目 |
| 删除数据 | 详情页点击 Delete 按钮 |
| 复制值 | 详情页点击 Copy 按钮 |
| 刷新数据 | 点击右上角 🔄 按钮 |

---

## 🔧 构建压缩

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0

### 构建步骤

```bash
# 1. 安装依赖
cd mp-debug-sdk
npm install

# 2. 构建（输出到 dist/mp-debug-sdk/）
npm run build

# 3. 或先清理再构建
npm run build:clean

# 4. 开发模式（监听文件变化自动构建）
npm run watch
```

### 构建产物

```
dist/mp-debug-sdk/
├── core/
│   ├── index.js              # 压缩后的 SDK 入口
│   ├── event-bus.js           # 事件总线
│   ├── console-interceptor.js # Console 拦截器
│   ├── network-interceptor.js # Network 拦截器
│   ├── error-handler.js       # 错误捕获
│   ├── storage-manager.js     # Storage 管理
│   ├── remote-config.js       # 远程动态配置
│   └── remote-logger.js       # 远程日志上报
├── components/
│   ├── debug-panel/           # 主面板（4 个文件）
│   ├── float-button/          # 悬浮按钮
│   ├── console-panel/         # Console 面板
│   ├── network-panel/         # Network 面板
│   └── storage-panel/         # Storage 面板
└── utils/
    ├── formatter.js
    └── helper.js
```

### 构建做了什么？

| 文件类型 | 压缩方式 | 说明 |
|----------|----------|------|
| `.js` | terser | 代码压缩、混淆、移除注释 |
| `.wxss` | clean-css | CSS 压缩 |
| `.wxml` | htmlmin | 移除空白和注释 |
| `.json` | 直接复制 | JSON 已是最小化格式 |

---

## 📚 API 参考

### MpDebug（主模块）

```javascript
const MpDebug = require('./lib/mp-debug-sdk/core/index');
```

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `init(options)` | `Object` | `void` | 初始化 SDK（必须在 App() 之前调用） |
| `destroy()` | - | `void` | 销毁 SDK，恢复所有拦截 |
| `isEnabled()` | - | `boolean` | SDK 是否已启用（面板是否可见） |
| `getConfig()` | - | `Object` | 获取当前配置 |
| `getVersion()` | - | `string` | 获取 SDK 版本号 |
| `isRemoteConfigLoaded()` | - | `boolean` | 远程配置是否已加载完成 |

#### destroy() 使用说明

`destroy()` 用于**完全销毁 SDK**，恢复所有被劫持的原生 API（console、wx.request、App、Page），清理事件监听和定时器，并上报远程日志缓冲队列中剩余的数据。

**使用场景：**
- 小程序退出或需要彻底关闭调试功能时
- 在 `App.onHide` 或页面 `onUnload` 中清理 SDK 资源
- 动态切换调试状态（先 destroy 再重新 init）

```javascript
// 场景 1：在 App 退出时销毁
App({
  onHide() {
    // 小程序切到后台时销毁 SDK（可选）
    MpDebug.destroy();
  }
});

// 场景 2：手动关闭调试
function disableDebug() {
  MpDebug.destroy();
  // destroy 后 SDK 将：
  // - 恢复 console.log/info/warn/error 为原始方法
  // - 恢复 wx.request 为原始方法
  // - 清理 EventBus 所有事件监听
  // - 停止远程日志上报定时器，并上报剩余缓冲数据
  // - 恢复 Page 构造函数
}
```

> ⚠️ **注意**：`destroy()` 后需要重新调用 `init()` 才能再次使用 SDK。由于 `App()` 只会执行一次，`destroy` 后 `errorHandler`（全局错误捕获）将不再对新的错误生效。

### MpDebug.console

```javascript
MpDebug.console.getLogList()   // 获取所有日志
MpDebug.console.clearLogs()    // 清空日志
MpDebug.console.addLog('info', '手动添加一条日志')
```

### MpDebug.network

```javascript
MpDebug.network.getRequestList()  // 获取所有请求记录
MpDebug.network.clearRequests()   // 清空请求记录
```

### MpDebug.storage

```javascript
MpDebug.storage.getAllStorage()    // 获取所有 Storage 数据
MpDebug.storage.getStorageInfo()  // 获取 Storage 概览
```

### MpDebug.remoteConfig

```javascript
MpDebug.remoteConfig.clearCache()  // 清除远程配置缓存
```

### MpDebug.remoteLogger

```javascript
MpDebug.remoteLogger.flush()  // 立即上报缓冲队列中的所有数据
```

### MpDebug.eventBus（事件总线）

用于高级场景，如监听日志/请求/远程配置事件：

```javascript
// ===== 日志与请求事件 =====

// 监听新日志
MpDebug.eventBus.on('console:add', (logItem) => {
  // logItem: { id, type, data, time, timeStr }
});

// 监听新网络请求
MpDebug.eventBus.on('network:request', (record) => {
  // record: { id, url, method, ... }
});

// 监听网络请求响应
MpDebug.eventBus.on('network:response', (record) => {
  // record: { id, statusCode, responseData, duration, ... }
});

// 监听运行时错误
MpDebug.eventBus.on('error:runtime', (error) => {
  // error: { type, message, time }
});

// ===== 远程配置事件 =====

// 远程配置加载完成
MpDebug.eventBus.on('remoteConfig:loaded', ({ source, config }) => {
  // source: 'cache' | 'remote'
});

// 远程配置请求超时
MpDebug.eventBus.on('remoteConfig:timeout', () => {});

// 远程配置请求错误
MpDebug.eventBus.on('remoteConfig:error', (err) => {});

// ===== 远程日志上报事件 =====

// 远程日志上报模块就绪
MpDebug.eventBus.on('remoteLogger:ready', () => {});

// 上报完成
MpDebug.eventBus.on('remoteLogger:reported', ({ count, success }) => {});

// SDK 初始化完成
MpDebug.eventBus.on('sdk:ready', (config) => {});
```

### 远程上报事件钩子（低层级）

SDK 内部会在关键节点 emit 以下事件，开发者也可以直接监听这些事件做自定义上报：

```javascript
// 监听日志（远程上报触发）
MpDebug.eventBus.on('log:remote', (logItem) => {
  myLogService.report(logItem);
});

// 监听网络请求（远程上报触发）
MpDebug.eventBus.on('network:remote', (record) => {
  myLogService.reportNetwork(record);
});

// 监听错误（远程上报触发）
MpDebug.eventBus.on('error:remote', (error) => {
  myLogService.reportError(error);
});
```

---

## 🎮 Demo 项目

项目自带一个完整的 Demo 小程序，位于 `demo/` 目录。

### 运行 Demo

1. 将 `src/` 目录复制到 `demo/lib/mp-debug-sdk/`
2. 使用微信开发者工具打开 `demo/` 目录
3. 即可体验所有功能

### Demo 功能列表

| 功能 | 说明 |
|------|------|
| Console 测试 | 输出各种类型的日志（log / info / warn / error / 复杂对象） |
| 错误捕获测试 | 触发运行时错误和 Promise 拒绝 |
| Network 测试 | 发送 GET / POST / 500 / 404 请求 |
| Storage 测试 | 写入测试数据到本地存储 |
| 跨页面测试 | 跳转详情页，验证日志和请求记录跨页面持久化 |

---

## 🏗️ 架构设计

### 模块关系图

```
┌──────────────────────────────────────────┐
│                用户页面                    │
│   <mp-debug />                           │
│         │                                │
│   ┌─────▼─────┐                         │
│   │DebugPanel │ ← 主面板（整合所有子面板）  │
│   │  ┌──────┐ │                         │
│   │  │Float │ │ ← 悬浮按钮               │
│   │  │Button│ │                         │
│   │  └──────┘ │                         │
│   │  ┌──────┐ ┌──────┐ ┌──────┐       │
│   │  │Consl.│ │Netwk.│ │Storg.│       │
│   │  │Panel │ │Panel │ │Panel │       │
│   │  └──┬───┘ └──┬───┘ └──┬───┘       │
│   └─────┼────────┼────────┼──────────┘ │
│         │        │        │             │
│   ┌─────▼────────▼────────▼─────┐       │
│   │        EventBus              │      │
│   │   (跨模块事件通信总线)         │      │
│   └──┬──────┬──────┬──────┬─────┘      │
│      │      │      │      │             │
│   ┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐        │
│   │Consl││Netwk││Error││Storg│        │
│   │Inter││Inter││Handl││Mangr│        │
│   └──┬──┘└──┬──┘└──┬──┘└──┬──┘        │
│      │      │      │      │             │
│   ┌──▼──────▼──────▼──────▼─────┐      │
│   │      小程序原生 API           │      │
│   │ console │ wx.request │ App  │      │
│   └─────────────────────────────┘      │
│                                          │
│   ┌──────────────┐ ┌──────────────┐     │
│   │ RemoteConfig │ │ RemoteLogger │     │
│   │ 远程动态配置  │ │ 远程日志上报  │     │
│   │ ↕ 服务端API  │ │ → 监测平台   │     │
│   └──────────────┘ └──────────────┘     │
└──────────────────────────────────────────┘
```

### 核心设计原则

1. **低侵入性**：仅劫持 `console.*` 和 `wx.request`，不劫持 App/Page/Component 构造器（远程日志上报模块需劫持 Page 以在合适时机上报，属于轻量级劫持）
2. **事件驱动**：核心模块通过 EventBus 与 UI 组件解耦
3. **数据集中存储**：日志和请求记录存储在 Core 模块中，通过 `getApp()` 跨页面共享
4. **单向数据流**：Core → EventBus → UI Components
5. **优雅降级**：远程配置超时/异常时自动降级为本地配置，不影响小程序正常启动
6. **不影响业务**：远程日志上报使用缓冲队列，在页面 onHide/onUnload 等非关键时机批量上报

---

## ❓ 常见问题

### 1. SDK 会影响小程序的正常功能吗？

SDK 仅在启用时才会拦截 `console` 和 `wx.request`，拦截后**仍然会调用原始方法**，不影响正常的日志输出和网络请求。当 `env` 为 `production` 或 `enabled` 为 `false` 时，SDK 完全不会执行任何拦截。

### 2. 如何在正式版中隐藏调试面板？

```javascript
MpDebug.init({
  enabled: __wxConfig.envVersion !== 'release'
  // envVersion: 'develop' | 'trial' | 'release'
});
```

### 3. 为什么每个页面都需要加 `<mp-debug />`？

小程序的每个页面是独立的，没有全局 DOM 根节点。但你可以在 `app.json` 中全局注册组件后，只需要在每个页面的 wxml 底部添加 `<mp-debug />` 即可。

### 4. 跨页面时日志和请求记录会丢失吗？

不会。日志和请求记录存储在 Core 模块的全局变量中，通过 `require` 的模块缓存机制跨页面共享。

### 5. 如何减小 SDK 对主包体积的影响？

- **使用构建压缩后的文件**（`dist/mp-debug-sdk/`）
- 考虑将 SDK 放在**分包**中（利用小程序分包异步化特性）
- 如果确定不需要某些功能，可以在 init 时关闭对应模块

### 6. wx.request 的 Object.defineProperty 是否在所有环境都可用？

经过测试，在基础库 2.9.0+ 版本中可正常工作。如果遇到兼容性问题，SDK 会自动降级（跳过 Network 拦截），不影响其他功能。

### 7. 如何在生产环境为指定用户开启调试面板？

使用 `remoteConfig` 配置，SDK 会请求你的后端接口获取配置。后端根据 `corpId` + `userId` 判断是否为该用户开启调试：

```javascript
MpDebug.init({
  enabled: false,
  remoteConfig: {
    configUrl: 'https://api.example.com/debug/config',
    timeout: 1000,
    userIdentity: { corpId: 'CORP001', userId: 'zhangsan' }
  }
});
```

详见 [动态远程配置](#-动态远程配置) 章节。

### 8. 远程配置请求会影响小程序启动速度吗？

不会。远程配置请求是**异步**的，不阻塞 `App()` 的调用。SDK 设置了超时机制（默认 1 秒），超时后自动降级为本地配置。此外还支持配置缓存（默认 5 分钟），减少重复请求。

### 9. 远程日志上报会影响用户操作吗？

不会。日志数据先缓存在内存队列中，在以下**非关键时机**批量上报：
- 页面 `onHide`（切后台 / 页面跳转）
- 页面 `onUnload`（页面卸载）
- 达到批量阈值或定时器触发

上报请求使用独立的 `wx.request` 引用，不会被 SDK 的 Network 拦截器捕获。

### 10. 可以只用远程日志上报，不显示调试面板吗？

可以。设置 `enabled: false` 并配置 `remoteLogger` 即可实现静默监控模式：

```javascript
MpDebug.init({
  enabled: false,
  remoteLogger: {
    url: 'https://api.example.com/debug/report',
    reportTypes: ['error', 'network']
  }
});
```

---

## 📝 更新日志

### v1.1.0（2026-04-24）

- ✅ **动态远程配置**：支持从服务端接口动态获取调试开关配置
  - 基于用户身份（企业ID + 工号）精准控制
  - 请求超时自动降级为本地配置，不影响小程序正常启动
  - 支持配置缓存，减少重复请求
  - 远程配置可覆盖本地的模块开关和日志上报地址
- ✅ **远程日志上报**：内置完整的远程日志上报模块
  - 支持选择上报类型：错误信息、网络请求、Console 日志
  - 缓冲队列 + 批量上报，在合适时机（onHide/onUnload）发送
  - 提供 `beforeReport` 钩子供开发者自定义数据转换/过滤
  - 上报请求使用独立引用，不被 Network 拦截器捕获
  - 可独立于调试面板运行（静默监控模式）
- ✅ 调试面板支持远程配置异步加载后动态启用
- ✅ 新增 `isRemoteConfigLoaded()` API
- ✅ 新增 `MpDebug.remoteConfig.clearCache()` API
- ✅ 新增 `MpDebug.remoteLogger.flush()` API
- ✅ 新增多个 EventBus 事件：`remoteConfig:*`、`remoteLogger:*`
- ✅ SDK 版本号升级至 1.1.0

### v1.0.0（2026-04-23）

- ✅ Console 面板：日志捕获、分类过滤、展开详情、复制
- ✅ Network 面板：请求拦截、请求头/体/响应查看、状态码颜色区分
- ✅ Storage 面板：存储数据查看、删除、刷新
- ✅ 全局错误捕获：运行时错误 + Promise 拒绝
- ✅ 悬浮可拖拽按钮
- ✅ 环境变量控制（env / enabled）
- ✅ gulp 构建压缩
- ✅ Demo 小程序
- ✅ 远程日志上报钩子预留

---

## 📄 License

MIT License
