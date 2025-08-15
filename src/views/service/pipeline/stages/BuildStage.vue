<template>
  <el-form ref="buildForm" :model="buildConfig" :rules="formRules" label-width="100px" label-position="left">
    <el-form-item label="任务名称" formProps="buildName">
      <el-input v-model="buildConfig.buildName" placeholder="请输入任务名称"></el-input>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch, reactive } from 'vue';
import type { FormRules } from 'element-plus';

// 定义组件属性，接收配置对象作为参数，默认值为空对象
const formProps = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
});

// 定义组件事件，用于向父组件更新配置
const emits = defineEmits<{
  (e: 'update:config', config: { buildName: string; }): void
}>();

// 创建响应式变量存储构建配置，初始值从props中获取或使用空字符串
const buildConfig = ref<{
  buildName: string;
}>({
  buildName: formProps.config?.buildName || '',
});

const formRules = reactive<FormRules>({
  name: [{ required: true, message: '请输入流水线名称', trigger: 'blur' }],
});

// 监听props.config变化，确保外部更新时能同步到内部状态
watch(() => formProps.config, (newConfig) => {
  if (newConfig) {
    buildConfig.value = {
      buildName: newConfig.buildName || ''
    };
  }
}, { deep: true });

// 监听内部配置变化并通知父组件
watch(buildConfig, (newVal) => {
  emits('update:config', newVal);
}, { deep: true });
</script>