<template>
  <div class="pipeline-container">
    <el-card shadow="hover" class="page-card">
      <router-view />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

</script>

<style scoped>
.pipeline-container {
  padding: 20px;
}

</style>