/**
 * Sko-Nexus MCP Server
 * Powered by Vesper
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new Server(
  {
    name: "sko-brain",
    version: "3.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

/**
 * Dynamically load tools from ./tools/
 */
const tools = {};
const toolsPath = path.join(__dirname, "tools");

if (fs.existsSync(toolsPath)) {
  const toolFiles = fs
    .readdirSync(toolsPath)
    .filter((file) => file.endsWith(".js"));
  
  for (const file of toolFiles) {
    const toolModule = await import(path.join(toolsPath, file));
    const tool = toolModule.default || toolModule;
    if (tool.definition && tool.handler) {
      tools[tool.definition.name] = tool;
    }
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.values(tools).map((t) => t.definition),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools[request.params.name];
  if (!tool) {
    throw new McpError(
      ErrorCode.MethodNotFound,
      `Tool not found: ${request.params.name}`,
    );
  }

  try {
    return await tool.handler(request.params.arguments);
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Sko-Nexus MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
