<template>
  <router-view />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { watchEffect } from 'vue'

const { locale } = useI18n()

watchEffect(() => {
  document.documentElement.lang = locale.value
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
}
</style>