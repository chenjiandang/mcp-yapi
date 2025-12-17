# YApi MCP 服务器

这是一个 Model Context Protocol (MCP) 服务器，用于与 YApi 集成，可以获取 YApi 接口定义并在 AI Agent 中使用。

## 功能特性

- 🔌 获取单个 YApi 接口的完整定义（请求参数、响应数据等）
- 📁 获取 YApi 分类下所有接口的信息
- 🤖 支持 GitHub Copilot Agent 集成
- 🔒 支持 Token 认证

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
YAPI_BASE_URL=http://your-yapi-domain.com
YAPI_TOKEN=your-yapi-token-here
```

### 3. 构建项目

```bash
npm run build
```

### 4. 启动服务

```bash
npm start
```

## MCP 工具说明

### get_yapi_interface

获取单个接口的详细信息。

**参数:**
- `interfaceId` (string): YApi 接口 ID

**返回:**
```json
{
  "_id": 123456,
  "title": "用户登录",
  "path": "/api/user/login",
  "method": "POST",
  "req_body_other": {
    "type": "object",
    "properties": {
      "username": { "type": "string" },
      "password": { "type": "string" }
    }
  },
  "res_body": {
    "type": "object",
    "properties": {
      "code": { "type": "number" },
      "data": {
        "type": "object",
        "properties": {
          "token": { "type": "string" },
          "userInfo": { "type": "object" }
        }
      }
    }
  }
}
```

### get_yapi_category

获取分类下所有接口的信息。

**参数:**
- `categoryId` (string): YApi 分类 ID（纯数字，不需要 "cat_" 前缀）

**返回:**
```json
{
  "categoryId": "789",
  "totalCount": 5,
  "interfaces": [
    {
      "_id": 123456,
      "title": "接口1",
      // ... 完整接口信息
    },
    // ... 更多接口
  ]
}
```

## 在 GitHub Copilot 中使用

### 配置 MCP 服务器

在 VS Code 中配置 MCP 服务器（通常在 `settings.json` 中）：

```json
{
  "github.copilot.advanced": {
    "mcpServers": {
      "yapi": {
        "command": "node",
        "args": ["path/to/mcp-yapi/dist/index.js"],
        "env": {
          "YAPI_BASE_URL": "http://your-yapi-domain.com",
          "YAPI_TOKEN": "your-yapi-token"
        }
      }
    }
  }
}
```

### 使用 YApi 页面生成器 Agent

该项目包含一个预配置的 GitHub Agent，可以根据 YApi 接口定义自动生成页面代码。

**使用方法:**

1. **生成单个接口对应的页面:**
   ```
   @yapi-page-generator 请根据 YApi 接口 123456 生成用户列表页面
   ```

2. **生成分类下所有接口对应的页面:**
   ```
   @yapi-page-generator 请根据 YApi 分类 cat_789 生成相关页面
   ```

3. **结合原型图生成页面:**
   ```
   @yapi-page-generator 请根据 YApi 接口 123456 和附件中的原型图生成登录页面
   ```

Agent 会自动：
- 获取 YApi 接口定义
- 分析项目结构和技术栈
- 生成 TypeScript 类型定义
- 生成 API 调用函数
- 生成页面组件代码
- 更新路由配置

详细说明请查看 [Agent 文档](.github/agents/yapi-page-generator/README.md)。

## 项目结构

```
mcp-yapi/
├── src/
│   ├── index.ts          # MCP 服务器入口
│   └── yapi.ts           # YApi API 封装
├── .github/
│   └── agents/
│       └── yapi-page-generator/
│           ├── README.md     # Agent 使用说明
│           └── agent.yml     # Agent 配置
├── dist/                 # 编译输出目录
├── .env.example          # 环境变量示例
├── package.json
├── tsconfig.json
└── README.md
```

## 开发

### 开发模式

```bash
npm run dev
```

这会启动 TypeScript 监听模式，自动编译代码变更。

### 调试

使用 VS Code 的调试功能，或者手动运行：

```bash
node --inspect dist/index.js
```

## YApi API 参考

本服务使用以下 YApi API：

- `GET /api/interface/get?id={id}&token={token}` - 获取接口详情
- `GET /api/interface/list_cat?catid={catid}&token={token}` - 获取分类接口列表

更多 YApi API 文档请参考 [YApi 官方文档](https://hellosean1025.github.io/yapi/)。

## 常见问题

### 1. 如何获取 YApi Token？

登录 YApi 后，在项目设置中可以找到项目的 Token。

### 2. 支持哪些 YApi 版本？

理论上支持所有 YApi 版本，已在 YApi v1.9+ 上测试。

### 3. 如何在多个项目中使用？

可以为不同项目配置不同的 Token，或者在调用时动态切换配置。

### 4. 接口数据很大时性能如何？

服务会自动处理大量接口数据，对于分类接口会并行获取详情以提高性能。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
