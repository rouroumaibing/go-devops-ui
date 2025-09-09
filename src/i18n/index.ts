import { createI18n } from 'vue-i18n'
import { defineStore } from 'pinia'

// 语言常量定义
export const SUPPORTED_LANGUAGES = {
  ZH: 'zh',
  EN: 'en'
} as const

export type Language = typeof SUPPORTED_LANGUAGES[keyof typeof SUPPORTED_LANGUAGES]

// 语言存储
export const useLangStore = defineStore('lang', {
  state: () => ({
    lang: (localStorage.getItem('lang') || SUPPORTED_LANGUAGES.ZH) as Language
  }),
  actions: {
    setLang(lang: Language) {
      this.lang = lang
      localStorage.setItem('lang', lang)
      i18n.global.locale.value = lang
    }
  }
})

// 导入翻译文件
import zh from '@/locales/zh'
import en from '@/locales/en'

const messages = { zh, en }

// 创建i18n实例
export const i18n = createI18n({
  legacy: false, 
  locale: localStorage.getItem('lang') || SUPPORTED_LANGUAGES.ZH,
  fallbackLocale: SUPPORTED_LANGUAGES.EN,
  messages
})

// 工具函数
/**
 * 检查语言是否受支持
 */
export function isLanguageSupported(lang: string): lang is Language {
  return Object.values(SUPPORTED_LANGUAGES).includes(lang as Language)
}

/**
 * 获取当前语言
 */
export function getCurrentLanguage(): Language {
  const langStore = useLangStore()
  return langStore.lang
}

/**
 * 切换语言
 */
export function setLocale(locale: Language) {
  const langStore = useLangStore()
  langStore.setLang(locale)
}