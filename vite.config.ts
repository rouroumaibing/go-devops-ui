import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path'

// 加载环境变量
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [vue()],
    resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@element-plus/icons-vue': path.resolve(__dirname, './node_modules/@element-plus/icons-vue'),
      '@element-plus/icons-vue/*': path.resolve(__dirname, './node_modules/@element-plus/icons-vue/*'),
    }
  },
  server: {
    proxy: {
      '/api': {
        target: env.VITE_BACKEND_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false, // Set to false if backend uses self-signed certificate
        rewrite: (path) => path,
      },
    },
  },
  }
});