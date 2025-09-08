import { defineStore } from 'pinia'

export const useLangStore = defineStore('lang', {
  state: () => ({
    lang: (localStorage.getItem('lang') || 'zh') as 'zh' | 'en'
  })
})