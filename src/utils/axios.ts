import axios from 'axios';

const instance = axios.create({
  baseURL: '/',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json', 
  },
  transformRequest: [data => {
    return data && typeof data === 'object' ? JSON.stringify(data) : data;
  }]
});


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