// 完整测试 MCP 工具调用
import { getYapiCategoryInterfaces, getYapiInterface } from './dist/yapi.js';

const YAPI_URL = 'https://xyapi.col.com';
const YAPI_TOKEN = 'dbfd57dc6828920c5aaf5e1c5d7979ca0fc9a3c63025d70c94b00743b9d1be2d';

async function testMcpTool() {
  console.log('=== 测试 MCP get_yapi_category 工具 ===\n');
  
  let categoryId = 'cat_293';
  
  // 支持 cat_293 和 293 两种格式，自动去掉 cat_ 前缀
  if (categoryId.startsWith("cat_")) {
    categoryId = categoryId.substring(4);
  }
  
  console.log(`正在获取分类 ${categoryId} 的接口列表...\n`);
  
  try {
    const interfaces = await getYapiCategoryInterfaces(
      YAPI_URL,
      YAPI_TOKEN,
      categoryId
    );

    console.log(`\n分类接口数量: ${interfaces.length}\n`);

    // 如果没有接口，直接返回
    if (interfaces.length === 0) {
      console.log('❌ 该分类下没有接口');
      console.log(JSON.stringify({
        categoryId,
        totalCount: 0,
        interfaces: [],
        message: "该分类下没有接口"
      }, null, 2));
      return;
    }

    console.log('✅ 找到接口，正在获取详细信息...\n');

    // 获取每个接口的详细信息（如果失败则使用基本信息）
    const detailedInterfaces = await Promise.all(
      interfaces.map(async (iface) => {
        try {
          console.log(`  获取接口 ${iface._id} - ${iface.title}`);
          const detail = await getYapiInterface(
            YAPI_URL,
            YAPI_TOKEN,
            String(iface._id)
          );
          return detail;
        } catch (error) {
          console.error(`  ❌ 获取接口 ${iface._id} 详情失败:`, error.message);
          // 如果获取详情失败，返回基本的列表信息
          return {
            ...iface,
            _detailError: `获取详情失败: ${error.message}`,
          };
        }
      })
    );

    console.log(`\n最终结果: ${detailedInterfaces.length} 个接口（包含基本信息）\n`);
    
    const result = {
      categoryId,
      totalCount: detailedInterfaces.length,
      interfaces: detailedInterfaces,
    };

    console.log('=== 返回数据 ===');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error);
  }
}

testMcpTool();
