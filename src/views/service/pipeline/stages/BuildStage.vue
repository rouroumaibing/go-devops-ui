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
import { ElForm } from 'element-plus';

const props = defineProps<{
  initialConfig?: {
    buildCommand?: string;
    imageName?: string;
    buildDir?: string;
  }
}>();

const emits = defineEmits<{
  (e: 'update:config', config: {
    buildCommand: string;
    imageName: string;
    buildDir: string;
  }): void
}>();

const buildForm = ref<InstanceType<typeof ElForm>>();
const buildConfig = ref<{
  buildCommand: string;
  imageName: string;
  buildDir: string;
}>({
  buildCommand: props.initialConfig?.buildCommand || '',
  imageName: props.initialConfig?.imageName || '',
  buildDir: props.initialConfig?.buildDir || ''
});

// 监听配置变化并通知父组件
watch(buildConfig, (newVal) => {
  emits('update:config', newVal);
}, { deep: true });
</script>