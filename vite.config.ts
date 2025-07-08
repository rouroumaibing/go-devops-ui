import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@element-plus/icons-vue': path.resolve(__dirname, './node_modules/@element-plus/icons-vue'),
      '@element-plus/icons-vue/*': path.resolve(__dirname, './node_modules/@element-plus/icons-vue/*'),
    }
  }
})