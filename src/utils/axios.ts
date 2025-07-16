import axios from 'axios';

const instance = axios.create({
  baseURL: '/api', // 设置基础URL
  timeout: 5000
});

// 响应拦截器
instance.interceptors.response.use(
  response => {
    // 验证响应数据是否为数组
    if (response.config.method === 'get' && !Array.isArray(response.data)) {
      return Promise.reject(new Error('期望数组类型响应数据'));
    }
    return response;
  },
  error => {
    return Promise.reject(error);
  }
);

export default instance;