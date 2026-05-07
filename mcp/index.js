/**
 * Sko-Nexus MCP Server
 * Powered by Vesper
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { 
  CallToolRequestSchema, 
  ListToolsRequestSchema, 
  ErrorCode, 
  McpError 
} = require("@modelcontextprotocol/sdk/types.js");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const server = new Server(
  {
    name: "sko-nexus-mcp",
    version: "3.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool Handlers will be dynamically loaded from ./tools/
 */
const tools = {
  // Aquí registraremos las herramientas: init, task_start, heartbeat, etc.
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.values(tools).map(t => t.definition),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools[request.params.name];
  if (!tool) {
    throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${request.params.name}`);
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
