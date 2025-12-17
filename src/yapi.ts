import axios, { AxiosInstance } from "axios";

export interface YapiInterface {
  _id: number;
  title: string;
  path: string;
  method: string;
  catid: number;
  project_id: number;
  req_params?: any[];
  req_query?: any[];
  req_headers?: any[];
  req_body_type?: string;
  req_body_form?: any[];
  req_body_other?: string;
  res_body?: string;
  res_body_type?: string;
  desc?: string;
  markdown?: string;
}

export interface YapiCategory {
  _id: number;
  name: string;
  project_id: number;
  desc: string;
  list?: YapiInterface[];
}

/**
 * 创建带认证的 axios 实例
 */
function createYapiClient(baseUrl: string, token: string): AxiosInstance {
  return axios.create({
    baseURL: baseUrl,
    headers: {
      "Content-Type": "application/json",
    },
    params: {
      token,
    },
  });
}

/**
 * 获取单个接口详情
 */
export async function getYapiInterface(
  baseUrl: string,
  token: string,
  interfaceId: string
): Promise<YapiInterface> {
  const client = createYapiClient(baseUrl, token);

  try {
    const response = await client.get("/api/interface/get", {
      params: {
        id: interfaceId,
        token,
      },
    });

    if (response.data.errcode !== 0) {
      throw new Error(response.data.errmsg || "获取接口详情失败");
    }

    const data = response.data.data;

    // 解析请求体和响应体
    let reqBodyParsed = data.req_body_other;
    let resBodyParsed = data.res_body;

    try {
      if (data.req_body_other) {
        reqBodyParsed = JSON.parse(data.req_body_other);
      }
    } catch (e) {
      // 保持原始字符串
    }

    try {
      if (data.res_body) {
        resBodyParsed = JSON.parse(data.res_body);
      }
    } catch (e) {
      // 保持原始字符串
    }

    return {
      ...data,
      req_body_other: reqBodyParsed,
      res_body: resBodyParsed,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `YApi请求失败: ${error.response?.data?.errmsg || error.message}`
      );
    }
    throw error;
  }
}

/**
 * 获取分类下的所有接口列表
 */
export async function getYapiCategoryInterfaces(
  baseUrl: string,
  token: string,
  categoryId: string
): Promise<YapiInterface[]> {
  const client = createYapiClient(baseUrl, token);

  try {
    const response = await client.get("/api/interface/list_cat", {
      params: {
        catid: categoryId,
        token,
      },
    });

    if (response.data.errcode !== 0) {
      throw new Error(response.data.errmsg || "获取分类接口列表失败");
    }

    return response.data.data.list || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `YApi请求失败: ${error.response?.data?.errmsg || error.message}`
      );
    }
    throw error;
  }
}

/**
 * 获取项目下的所有分类
 */
export async function getYapiCategories(
  baseUrl: string,
  token: string,
  projectId: string
): Promise<YapiCategory[]> {
  const client = createYapiClient(baseUrl, token);

  try {
    const response = await client.get("/api/interface/list_menu", {
      params: {
        project_id: projectId,
        token,
      },
    });

    if (response.data.errcode !== 0) {
      throw new Error(response.data.errmsg || "获取项目分类失败");
    }

    return response.data.data || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `YApi请求失败: ${error.response?.data?.errmsg || error.message}`
      );
    }
    throw error;
  }
}
