// 测试 YApi 连接的脚本
import axios from 'axios';

// 请替换成你的实际配置
const YAPI_URL = ''; // 去掉末尾的斜杠
const YAPI_TOKEN = '';
const CATEGORY_ID = '303'; // 你要测试的分类ID

async function testYapiConnection() {
  console.log('=== 测试 YApi 连接 ===');
  console.log(`YApi URL: ${YAPI_URL}`);
  console.log(`Category ID: ${CATEGORY_ID}`);
  console.log('');

  try {
    const response = await axios.get(`${YAPI_URL}/api/interface/list_cat`, {
      params: {
        catid: CATEGORY_ID,
        token: YAPI_TOKEN
      }
    });

    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.errcode === 0) {
      const count = response.data.data?.list?.length || 0;
      console.log(`\n✅ 成功！找到 ${count} 个接口`);
      
      if (count === 0) {
        console.log('⚠️  该分类下没有接口，这可能是返回为空的原因');
      } else {
        console.log('\n接口列表:');
        response.data.data.list.forEach((item, index) => {
          console.log(`  ${index + 1}. [${item.method}] ${item.title} (ID: ${item._id})`);
        });
      }
    } else {
      console.log(`\n❌ 错误: ${response.data.errmsg}`);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

testYapiConnection();
