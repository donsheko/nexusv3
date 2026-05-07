/**
 * Sko-Nexus MCP Server
 * Powered by Vesper
 */

const fs = require("fs");
const path = require("path");
const {Server} = require("@modelcontextprotocol/sdk/server/index.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} = require("@modelcontextprotocol/sdk/types.js");

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
 * Dinamically load tools from ./tools/
 */
const tools = {};
const toolsPath = path.join(__dirname, "tools");

if (fs.existsSync(toolsPath)) {
  const toolFiles = fs
    .readdirSync(toolsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of toolFiles) {
    const tool = require(path.join(toolsPath, file));
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
      content: [{type: "text", text: `Error: ${error.message}`}],
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
