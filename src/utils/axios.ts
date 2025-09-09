import axios from 'axios';
import { TokenRespone } from '@/types/usersinfo';

const instance = axios.create({
  baseURL: '/',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json', 
  },
  withCredentials: true,
  transformRequest: [(data: any) => {
    return data && typeof data === 'object' ? JSON.stringify(data) : data;
  }] as any
});

let refreshTokenPromise: Promise<any> | null = null;
const refreshToken = async () => {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }
  
  refreshTokenPromise = new Promise(async (resolve, reject) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await axios.post<TokenRespone>('/api/auth/refresh', {
        refreshToken
      });
      
      const { accessToken } = response.data;
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      const storage = rememberMe ? localStorage : sessionStorage;
      
      storage.setItem('accessToken', accessToken);
      
      resolve(accessToken);
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      
      window.location.href = '/login';
      reject(error);
    } finally {
      refreshTokenPromise = null;
    }
  });
  
  return refreshTokenPromise;
};

// 请求拦截器 - 添加token
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    const originalRequest = error.config;
    
    // 处理 token 过期（假设状态码 401 表示 token 过期）
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshToken();
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    const errorMsg = error.response?.data?.message || error.message || '请求失败';
    return Promise.reject(new Error(errorMsg));
  }
);

export default instance;