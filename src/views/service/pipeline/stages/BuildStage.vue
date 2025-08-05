<template>
  <el-form ref="buildForm" :model="buildConfig" label-width="100px">
    <el-form-item label="构建命令" prop="buildCommand">
      <el-input v-model="buildConfig.buildCommand" placeholder="例如: npm run build"></el-input>
    </el-form-item>
    <el-form-item label="镜像名称" prop="imageName">
      <el-input v-model="buildConfig.imageName" placeholder="例如: my-app:latest"></el-input>
    </el-form-item>
    <el-form-item label="构建目录" prop="buildDir">
      <el-input v-model="buildConfig.buildDir" placeholder="例如: ./src"></el-input>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';

const props = defineProps({"config":{"type":Object,"default":()=>({})}});

const emits = defineEmits<{(e:'update:config', config:{buildCommand:string;imageName:string;buildDir:string;}):void}>();

const buildConfig = ref<{buildCommand:string;imageName:string;buildDir:string;}>({
  buildCommand: props.config?.buildCommand || '',
  imageName: props.config?.imageName || '',
  buildDir: props.config?.buildDir || ''
});

// 监听props.config变化，确保外部更新时能同步到内部状态
watch(() => props.config, (newConfig) => {
  if (newConfig) {
    buildConfig.value = {
      buildCommand: newConfig.buildCommand || '',
      imageName: newConfig.imageName || '',
      buildDir: newConfig.buildDir || ''
    };
  }
}, { deep: true });

// 监听内部配置变化并通知父组件
watch(buildConfig, (newVal) => {
  emits('update:config', newVal);
}, { deep: true });
</script>