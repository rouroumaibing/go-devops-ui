import axios from 'axios';

const instance = axios.create({
  baseURL: '/',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json', 
  },
  transformRequest: [data => {
    // 自动将对象转换为JSON字符串
    return data && typeof data === 'object' ? JSON.stringify(data) : data;
  }]
});

// 响应拦截器
instance.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    const errorMsg = error.response?.data?.message || error.message || '请求失败';
    return Promise.reject(new Error(errorMsg));
  }
);

export default instance;