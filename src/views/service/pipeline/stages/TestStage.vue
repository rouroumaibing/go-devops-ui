<template>
  <el-form ref="testForm" :model="testConfig" :rules="formRules" label-width="100px" label-position="left">
    <el-form-item label="任务名称" formProps="testName">
      <el-input v-model="testConfig.testName" placeholder="请输入任务名称"></el-input>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';
import type { FormRules } from 'element-plus';

const formProps = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
});

const emits = defineEmits<{
  (e: 'update:config', config: {
    testName: string;
  }): void
}>();

const testConfig = ref<{
  testName: string;
}>({
  testName: formProps.config?.testName || '',
});

const formRules = ref<FormRules>({
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
});


// 监听props.config变化，确保外部更新时能同步到内部状态
watch(() => formProps.config, (newConfig) => {
  if (newConfig) {
    testConfig.value = {
      testName: newConfig.testName || ''
    };
  }
}, { deep: true });

// 监听内部配置变化并通知父组件
watch(testConfig, (newVal) => {
  emits('update:config', newVal);
}, { deep: true });
</script>