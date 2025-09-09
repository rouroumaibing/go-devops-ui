import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import '@/assets/style.css'
import router from '@/router'
import { createPinia } from 'pinia'
import { i18n } from './i18n'
import { configureMonacoEnvironment } from './utils/monaco-config'

const app = createApp(App)
const pinia = createPinia()

// 配置Monaco环境，包含被动事件监听器设置
configureMonacoEnvironment() 

// Configure Element Plus
app.use(ElementPlus, {
  size: 'default',
  zIndex: 3000,
  keyboardNavigation: true
})

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(pinia)
app.use(i18n)
app.mount('#app')