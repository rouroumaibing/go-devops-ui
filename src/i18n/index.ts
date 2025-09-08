import { createI18n } from 'vue-i18n'
import zh from '@/locales/zh'
import en from '@/locales/en'
import { useLangStore } from '@/stores/lang'

const messages = { zh, en }

export const i18n = createI18n({
  legacy: false,                 // 必须关闭，才能用 Composition API
  locale: localStorage.getItem('lang') || 'zh',
  fallbackLocale: 'en',
  messages
})

// 封装切换函数，顺便写回 pinia & localStorage
export function setLocale(locale: 'zh' | 'en') {
  i18n.global.locale.value = locale
  localStorage.setItem('lang', locale)
  
  setTimeout(() => {
    const langStore = useLangStore()
    langStore.lang = locale
  }, 0)
}