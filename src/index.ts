#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import {
  getYapiInterface,
  getYapiCategoryInterfaces,
  type YapiInterface,
} from "./yapi.js";

dotenv.config();

const YAPI_BASE_URL = process.env.YAPI_BASE_URL || "";
const YAPI_TOKEN = process.env.YAPI_TOKEN || "";

if (!YAPI_BASE_URL || !YAPI_TOKEN) {
  console.error("错误: 请在 .env 文件中配置 YAPI_BASE_URL 和 YAPI_TOKEN");
  process.exit(1);
}

// 定义工具
const tools: Tool[] = [
  {
    name: "get_yapi_interface",
    description:
      "获取单个YApi接口的详细信息，包括请求参数、响应数据等。输入接口ID即可获取接口详情。",
    inputSchema: {
      type: "object",
      properties: {
        interfaceId: {
          type: "string",
          description: "YApi接口ID",
        },
      },
      required: ["interfaceId"],
    },
  },
  {
    name: "get_yapi_category",
    description:
      "获取YApi分类下的所有接口信息。输入格式为 cat_${id}，返回该分类下所有接口的入参和出参信息。",
    inputSchema: {
      type: "object",
      properties: {
        categoryId: {
          type: "string",
          description: "YApi分类ID，格式为数字字符串",
        },
      },
      required: ["categoryId"],
    },
  },
];

// 创建服务器
const server = new Server(
  {
    name: "mcp-yapi-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 处理工具列表请求
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// 处理工具调用请求
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_yapi_interface") {
      if (!args) {
        throw new Error("缺少参数");
      }
      const interfaceId = String(args.interfaceId);
      const data = await getYapiInterface(
        YAPI_BASE_URL,
        YAPI_TOKEN,
        interfaceId
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } else if (name === "get_yapi_category") {     
         if (!args) {
        throw new Error("缺少参数");
      }     
      const categoryId = String(args.categoryId);
      const interfaces = await getYapiCategoryInterfaces(
        YAPI_BASE_URL,
        YAPI_TOKEN,
        categoryId
      );

      // 获取每个接口的详细信息
      const detailedInterfaces = await Promise.all(
        interfaces.map(async (iface) => {
          try {
            const detail = await getYapiInterface(
              YAPI_BASE_URL,
              YAPI_TOKEN,
              String(iface._id)
            );
            return detail;
          } catch (error) {
            console.error(`获取接口 ${iface._id} 详情失败:`, error);
            return null;
          }
        })
      );

      const validInterfaces = detailedInterfaces.filter(
        (iface) => iface !== null
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                categoryId,
                totalCount: validInterfaces.length,
                interfaces: validInterfaces,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    throw new Error(`未知的工具: ${name}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `错误: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("YApi MCP 服务器已启动");
}

main().catch((error) => {
  console.error("服务器启动失败:", error);
  process.exit(1);
});
