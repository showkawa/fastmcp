# 项目概览
`FastMCP` 是一个用 **TypeScript** 编写的框架，用来快速构建符合 Model Context Protocol（MCP）规范的服务器。它在官方 SDK 之上封装了大量样板代码，提供更易用的 API 与 CLI 工具，专注于「工具 (Tool) + 资源 (Resource) + 会话 (Session)」的完整生命周期管理。

# 1. 项目架构 & 技术栈

| 技术 / 依赖 | 作用 |
|-------------|------|
| **TypeScript** | 主语言，提供类型安全与现代语法。 |
| **@modelcontextprotocol/sdk** | 官方 MCP SDK，实现协议底层能力；由框架二次封装。 |
| **zod / arktype / valibot** | 参数校验与 JSON-Schema 互转，支持 Standard Schema 规范。 |
| **tsup** | 打包工具，将 TS 源码编译为 ESM 产物（`dist/`）。 |
| **vitest** | 单元测试框架（与 Jest 兼容）。 |
| **eslint + prettier** | 代码质量与风格检查 / 格式化。 |
| **yargs** | 构建 CLI 命令行解析器。 |
| **execa** | 在 CLI 中执行子进程（启动 dev server、Inspector 等）。 |
| **undici / file-type / fuse.js / uri-templates** | 网络请求、文件类型识别、模糊搜索、URI 模板解析等辅助功能。 |

目录结构（核心部分）  
```
fastmcp/
├─ src/
│  ├─ FastMCP.ts          // 核心框架类，封装服务器启动与会话管理
│  ├─ bin/fastmcp.ts      // CLI 入口，提供 dev / inspect / validate 命令
│  └─ examples/           // 参考示例（加法服务器、OAuth 服务器等）
├─ package.json
├─ tsconfig.json
└─ README.md              // 详细使用说明
```

# 2. 关键功能

1. **零样板服务器启动**  
   ```ts
   const server = new FastMCP({ name: "Demo", version: "1.0.0" });
   server.addTool({ name:"add", parameters:z.object({a:z.number(),b:z.number()}), execute:({a,b})=>String(a+b) });
   server.start({ transportType:"stdio" });
   ```

2. **多协议传输**  
   - `stdio`（本地进程内）
   - `httpStream`（HTTP Streaming，支持 SSE 兼容模式）

3. **工具 (Tool) 定义与参数校验**  
   支持 Standard Schema；可选用 **Zod/ArkType/Valibot** 任一库书写参数定义。

4. **资源 (Resource) & 嵌入 (Embedded)**  
   内置 `imageContent` / `audioContent` 等辅助函数，支持将图片、音频、二进制直接打包到返回内容，或生成可复用的资源 URI。

5. **会话 (Session) 与鉴权**  
   - 自定义 `authenticate` 回调，用请求头或 token 初始化会话。  
   - 强类型服务器事件（progress、streaming output、health-check 等）。

6. **CLI 工具**  
   - `fastmcp dev <file>`：热重载开发服务器（可 `--watch`）。  
   - `fastmcp inspect <file>`：使用 MCP Inspector 可视化调试。  
   - `fastmcp validate <file>`：静态/类型校验，确保结构正确。

7. **测试用例**  
   `src/FastMCP.test.ts` & `src/FastMCP.oauth.test.ts` 展示了完整的集成测试写法。

# 3. 启动 & 常用命令

以 **pnpm** 为例，其他包管理器同理。

```bash
# 安装依赖
pnpm install

# 构建产物（dist/）
pnpm build

# 运行官方示例（加法服务器）
npx fastmcp dev src/examples/addition.ts
# 监听文件变更自动重启
npx fastmcp dev src/examples/addition.ts --watch

# 打开可视化 Inspector
npx fastmcp inspect src/examples/addition.ts

# 校验自定义服务器文件
npx fastmcp validate path/to/your-server.ts      # 普通校验
npx fastmcp validate path/to/your-server.ts --strict   # 启用 TypeScript 严格模式

# 运行测试
pnpm test

# 格式化 + ESLint 修复
pnpm format
```

> 若要发布自己的 MCP 包：  
> 1. 修改 `package.json` 信息；2. 执行 `pnpm lint` 保证通过；3. 使用 `npm publish` 或 `jsr publish`（见 release 配置）。

---

以上即为 `fastmcp` 项目核心介绍及使用指南。如需更深入的 API 细节、示例或最佳实践，请参考仓库内的 `README.md` 与 `src/examples/` 目录。
