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

// MCP 服务通过 stdio 运行时，环境变量由调用方配置提供，不需要本地 .env 文件
// dotenv.config();

const YAPI_BASE_URL = process.env.YAPI_BASE_URL || process.env.YAPI_URL || "";
const YAPI_TOKEN = process.env.YAPI_TOKEN || "";

// 移除启动时的强制检查，改为在运行时检查并返回友好错误信息
// if (!YAPI_BASE_URL || !YAPI_TOKEN) {
//   console.error("错误: 请配置 YAPI_BASE_URL(或 YAPI_URL) 和 YAPI_TOKEN 环境变量");
//   process.exit(1);
// }

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
      "获取YApi分类下的所有接口信息。输入格式支持 cat_293 或 293，返回该分类下所有接口的入参和出参信息。",
    inputSchema: {
      type: "object",
      properties: {
        categoryId: {
          type: "string",
          description: "YApi分类ID，格式可以是 cat_293 或 293",
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
    // 运行时检查环境变量
    if (!YAPI_BASE_URL || !YAPI_TOKEN) {
      throw new Error(
        "未配置 YApi 环境变量。请在 MCP 客户端配置中设置 YAPI_URL 和 YAPI_TOKEN"
      );
    }

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
      let categoryId = String(args.categoryId);
      
      // 支持 cat_293 和 293 两种格式，自动去掉 cat_ 前缀
      if (categoryId.startsWith("cat_")) {
        categoryId = categoryId.substring(4);
      }
      
      console.error(`正在获取分类 ${categoryId} 的接口列表...`);
      
      const interfaces = await getYapiCategoryInterfaces(
        YAPI_BASE_URL,
        YAPI_TOKEN,
        categoryId
      );

      console.error(`分类接口数量: ${interfaces.length}`);

      // 如果没有接口，直接返回
      if (interfaces.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  categoryId,
                  totalCount: 0,
                  interfaces: [],
                  message: "该分类下没有接口"
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // 获取每个接口的详细信息（如果失败则使用基本信息）
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
            // 如果获取详情失败，返回基本的列表信息
            return {
              ...iface,
              _detailError: `获取详情失败: ${error instanceof Error ? error.message : String(error)}`,
            };
          }
        })
      );

      // 所有接口都返回（即使只有基本信息）
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                categoryId,
                totalCount: detailedInterfaces.length,
                interfaces: detailedInterfaces,
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
  
  // 输出调试信息到 stderr（不影响 stdio 通信）
  console.error("YApi MCP 服务器已启动");
  console.error(`YAPI_URL: ${YAPI_BASE_URL ? '已配置' : '未配置'}`);
  console.error(`YAPI_TOKEN: ${YAPI_TOKEN ? '已配置' : '未配置'}`);
}

main().catch((error) => {
  console.error("服务器启动失败:", error);
  process.exit(1);
});
