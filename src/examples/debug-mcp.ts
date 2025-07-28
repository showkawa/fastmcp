import path from "path";

import { FastMCPClient } from "../FastMCP";

async function main() {
  // 定义要调用的 MCP 工具的命令
  // 我们使用 ts-node 直接运行 TypeScript 源文件，这样就无需在每次修改后都重新构建 (npm run build)
  const mcpCommand = [
    "npx",
    "ts-node",
    path.resolve(__dirname, "../../mcp/precious-metal-mcp/src/index.ts"),
  ];

  // 创建一个 FastMCP 客户端实例
  const client = new FastMCPClient({
    command: mcpCommand,
  });

  try {
    console.log("🚀 Starting MCP client for debugging...");
    await client.start();
    console.log("✅ Client connected to MCP process.");

    // 定义要发送给 getPreciousMetalPrice 工具的参数
    const params = {
      market: "new_york",
      metal: "gold",
      type: "spot",
    };

    console.log(
      "\n📞 Calling tool 'getPreciousMetalPrice' with params:",
      params
    );

    // 调用工具并等待结果
    const result = await client.call("getPreciousMetalPrice", params);

    console.log("\n🎉 Received result:");
    // 结果通常是一个 JSON 字符串，我们将其解析后打印出来
    console.log(JSON.parse(result));
  } catch (error) {
    console.error("\n❌ An error occurred during MCP debugging:", error);
  } finally {
    // 确保在结束时关闭客户端，这会终止子进程
    console.log("\n🔌 Closing client...");
    await client.close();
  }
}

main();
