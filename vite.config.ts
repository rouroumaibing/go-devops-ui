import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import VueDevTools from 'vite-plugin-vue-devtools';
import VueSetupExtend from 'vite-plugin-vue-setup-extend';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import path from 'path';

// 加载环境变量并配置Vite
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    base: './',
    plugins: [
      vue(),
      vueJsx(),
      VueDevTools(),
      VueSetupExtend(),
      visualizer({
        filename: './output/stats.html'
      }),
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz',
        deleteOriginFile: false
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@element-plus/icons-vue': path.resolve(__dirname, './node_modules/@element-plus/icons-vue'),
        '@element-plus/icons-vue/*': path.resolve(__dirname, './node_modules/@element-plus/icons-vue/*'),
      }
    },
    server: {
      host: '0.0.0.0',
      port: 8080,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false, // Set to false if backend uses self-signed certificate
          rewrite: (path) => path,
        },
      },
    },
    build: {
      outDir: path.resolve(__dirname, './output/dist'),
      emptyOutDir: true,
      sourcemap: false, // 生产环境不生成sourcemap
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      rollupOptions: {
        output: {
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: '[ext]/[name]-[hash].[ext]'
        }
      }
    },
    devtool: 'hidden-source-map',
  };
});