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
| 📡 **预留扩展** | 远程日志上报接口已预留 |

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
│       │   └── storage-manager.js
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

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `env` | `string` | `''` | 环境标识。`development` / `dev` / `test` / `staging` 时自动启用 |
| `enabled` | `boolean` | - | 是否启用（优先级高于 `env`）。不设置时根据 `env` 自动判断 |
| `enableConsole` | `boolean` | `true` | 是否启用 Console 拦截 |
| `enableNetwork` | `boolean` | `true` | 是否启用 Network 拦截 |
| `enableError` | `boolean` | `true` | 是否启用全局错误捕获 |
| `enableStorage` | `boolean` | `true` | 是否启用 Storage 面板 |
| `panelHeight` | `number` | `60` | 面板高度（屏幕百分比，取值 30-90） |

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

#### 动态控制（从服务端读取配置）

```javascript
// 先不启用
MpDebug.init({ enabled: false });

// 后续从服务端获取到配置后再启用
// 注意：由于技术限制，init 只能调用一次。建议在 init 之前获取好配置。
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
│   └── storage-manager.js     # Storage 管理
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
| `isEnabled()` | - | `boolean` | SDK 是否已启用 |
| `getConfig()` | - | `Object` | 获取当前配置 |
| `getVersion()` | - | `string` | 获取 SDK 版本号 |

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

### MpDebug.eventBus（事件总线）

用于高级场景，如监听日志/请求事件：

```javascript
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
```

### 预留的远程日志上报钩子

SDK 内部已预留以下事件，可用于将来接入远程日志上报服务：

```javascript
// 监听日志（用于远程上报）
MpDebug.eventBus.on('log:remote', (logItem) => {
  // 上报到你的日志服务
  myLogService.report(logItem);
});

// 监听网络请求（用于远程上报）
MpDebug.eventBus.on('network:remote', (record) => {
  myLogService.reportNetwork(record);
});

// 监听错误（用于远程上报）
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
└──────────────────────────────────────────┘
```

### 核心设计原则

1. **低侵入性**：仅劫持 `console.*` 和 `wx.request`，不劫持 App/Page/Component 构造器
2. **事件驱动**：核心模块通过 EventBus 与 UI 组件解耦
3. **数据集中存储**：日志和请求记录存储在 Core 模块中，通过 `getApp()` 跨页面共享
4. **单向数据流**：Core → EventBus → UI Components

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

### 7. 如何接入远程日志上报？

SDK 已预留远程上报的事件钩子，参考 [API 参考](#预留的远程日志上报钩子) 部分。

---

## 📝 更新日志

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
