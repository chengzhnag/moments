// api.js - 前端API请求封装

class ApiClient {
  constructor(baseURL = 'https://record.241125.xyz/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.currentUser = null;
  }

  /**
   * 设置认证信息
   * @param {string} account - 用户账号
   * @param {string} password - 用户密码
   */
  setAuth(account, password) {
    const credentials = btoa(`${account}:${password}`);
    this.defaultHeaders.Authorization = `Basic ${credentials}`;
  }

  /**
   * 恢复认证状态（用于从本地存储恢复）
   * @param {string} account - 用户账号
   * @param {string} password - 用户密码
   */
  restoreAuth(account, password) {
    this.setAuth(account, password);
  }

  /**
   * 清除认证信息
   */
  clearAuth() {
    delete this.defaultHeaders.Authorization;
    this.currentUser = null;
  }

  /**
   * 通用请求方法
   * @param {string} endpoint - API端点
   * @param {Object} options - 请求选项
   * @returns {Promise<any>} 响应数据
   * @throws {Error} 请求失败时抛出错误
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data.data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  /**
   * GET请求
   * @param {string} endpoint - API端点
   * @param {Object} params - 查询参数
   * @returns {Promise<any>} 响应数据
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  /**
   * POST请求
   * @param {string} endpoint - API端点
   * @param {Object} data - 请求体数据
   * @returns {Promise<any>} 响应数据
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT请求
   * @param {string} endpoint - API端点
   * @param {Object} data - 请求体数据
   * @returns {Promise<any>} 响应数据
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE请求
   * @param {string} endpoint - API端点
   * @returns {Promise<any>} 响应数据
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// 创建API实例
const api = new ApiClient();

// 认证API封装
export const authApi = {
  /**
   * 登录验证 - 通过account查询用户，然后匹配密码
   * @param {string} account - 用户账号
   * @param {string} password - 用户密码
   * @returns {Promise<Object>} 登录结果 { success: boolean, user: Object }
   * @throws {Error} 登录失败时抛出错误
   */
  async login(account, password) {
    try {
      // 设置临时认证信息用于验证
      api.setAuth(account, password);

      // 尝试获取用户列表来验证认证是否成功
      // 如果认证失败会抛出错误
      const users = await api.get('/auth');
      console.log('users：', users);

      // 认证成功，保存当前用户信息
      api.currentUser = {
        ...users,
        authenticated: true,
        loginTime: new Date().toISOString()
      };
      return { success: true, user: api.currentUser };

    } catch (error) {
      // 认证失败，清除认证信息
      api.clearAuth();

      // 根据错误类型返回不同的错误信息
      if (error.message.includes('Authentication failed') ||
        error.message.includes('Unauthorized')) {
        throw new Error('账号或密码错误');
      } else {
        throw new Error('登录失败: ' + error.message);
      }
    }
  },

  /**
   * 登出
   * @returns {Object} 登出结果 { success: boolean, message: string }
   */
  logout() {
    api.clearAuth();
    return { success: true, message: '登出成功' };
  },

  /**
   * 检查是否已认证
   * @returns {boolean} 是否已认证
   */
  isAuthenticated() {
    return !!api.defaultHeaders.Authorization && api.currentUser?.authenticated;
  },

  /**
   * 获取当前用户信息
   * @returns {Object|null} 当前用户信息
   */
  getCurrentUser() {
    return api.currentUser;
  },

  /**
   * 验证当前认证状态是否有效
   * @returns {Promise<boolean>} 认证是否有效
   */
  async validateAuth() {
    try {
      if (!this.isAuthenticated()) {
        return false;
      }

      // 尝试访问需要认证的接口来验证
      await api.get('/auth');
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * 恢复认证状态
   * @param {string} account - 用户账号
   * @param {string} password - 用户密码
   */
  restoreAuth(account, password) {
    api.restoreAuth(account, password);
  }
};

// Users API 封装
export const usersApi = {
  /**
   * 获取用户列表
   * @param {Object} params - 查询参数
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.limit=10] - 每页数量
   * @returns {Promise<Object>} 用户列表数据 { users: Array, pagination: Object }
   */
  getUsers: (params = {}) => api.get('/users', params),

  /**
   * 获取单个用户
   * @param {number} id - 用户ID
   * @returns {Promise<Object>} 用户信息
   */
  getUser: (id) => api.get(`/users/${id}`),

  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @param {string} userData.account - 用户账号
   * @param {string} userData.password - 用户密码
   * @param {string} userData.name - 用户名称
   * @param {string} [userData.role='normal'] - 用户角色
   * @param {Object} [userData.extra_data] - 扩展数据
   * @returns {Promise<Object>} 创建的用户信息
   */
  createUser: (userData) => api.post('/users', userData),

  /**
   * 更新用户
   * @param {number} id - 用户ID
   * @param {Object} userData - 更新的用户数据
   * @param {string} [userData.account] - 用户账号
   * @param {string} [userData.password] - 用户密码
   * @param {string} [userData.name] - 用户名称
   * @param {string} [userData.role] - 用户角色
   * @param {Object} [userData.extra_data] - 扩展数据
   * @returns {Promise<Object>} 更新后的用户信息
   */
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),

  /**
   * 删除用户
   * @param {number} id - 用户ID
   * @returns {Promise<Object>} 删除结果
   */
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Records API 封装
export const recordsApi = {
  /**
   * 获取记录列表
   * @param {Object} params - 查询参数
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.limit=10] - 每页数量
   * @returns {Promise<Object>} 记录列表数据 { records: Array, pagination: Object }
   */
  getRecords: (params = {}) => api.get('/records', params),

  /**
   * 获取单个记录
   * @param {number} id - 记录ID
   * @returns {Promise<Object>} 记录信息
   */
  getRecord: (id) => api.get(`/records/${id}`),

  /**
   * 创建记录
   * @param {Object} recordData - 记录数据
   * @param {number} recordData.creator_id - 创建人ID
   * @param {string} [recordData.content_text] - 文本内容
   * @param {string} [recordData.content_media] - 媒体内容（JSON字符串）
   * @param {Object} [recordData.extra_data] - 扩展数据
   * @returns {Promise<Object>} 创建的记录信息
   */
  createRecord: (recordData) => api.post('/records', recordData),

  /**
   * 更新记录
   * @param {number} id - 记录ID
   * @param {Object} recordData - 更新的记录数据
   * @param {number} [recordData.creator_id] - 创建人ID
   * @param {string} [recordData.content_text] - 文本内容
   * @param {string} [recordData.content_media] - 媒体内容（JSON字符串）
   * @param {Object} [recordData.extra_data] - 扩展数据
   * @returns {Promise<Object>} 更新后的记录信息
   */
  updateRecord: (id, recordData) => api.put(`/records/${id}`, recordData),

  /**
   * 删除记录
   * @param {number} id - 记录ID
   * @returns {Promise<Object>} 删除结果
   */
  deleteRecord: (id) => api.delete(`/records/${id}`),
};

// 导出API实例和认证API
export default api;