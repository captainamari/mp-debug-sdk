# Demo 项目使用说明

## 快速运行

### 方式一：复制源码（推荐）

1. 将 `../src/` 目录的全部内容复制到 `lib/mp-debug-sdk/` 下
2. 使用微信开发者工具打开本 `demo/` 目录
3. 编译运行即可

目录结构应如下：

```
demo/
├── lib/
│   └── mp-debug-sdk/          ← 从 ../src/ 复制
│       ├── core/
│       ├── components/
│       └── utils/
├── pages/
│   ├── index/
│   └── detail/
├── app.js
├── app.json
├── app.wxss
└── project.config.json
```

### 方式二：使用构建产物

1. 在 SDK 根目录执行 `npm run build`
2. 将 `../dist/mp-debug-sdk/` 目录的全部内容复制到 `lib/mp-debug-sdk/` 下
3. 使用微信开发者工具打开本 `demo/` 目录

## 注意事项

- 请在 `project.config.json` 中填入你自己的 `appid`，或者使用测试号
- Demo 中的网络请求使用了 `httpbin.org`，如果请求失败属于正常现象（该域名可能不在合法域名列表中）
- 可在微信开发者工具中关闭"不校验合法域名"选项来测试网络请求
