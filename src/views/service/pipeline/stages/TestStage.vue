<template>
  <el-form ref="testForm" :model="testConfig" :rules="formRules" label-width="100px">
    <el-form-item label="任务名称" prop="testName">
      <el-input v-model="testConfig.testName" placeholder="请输入任务名称"></el-input>
    </el-form-item>
    <el-form-item label="测试命令" prop="testCommand">
      <el-input v-model="testConfig.testCommand" placeholder="例如: npm run test"></el-input>
    </el-form-item>
    <el-form-item label="测试报告路径" prop="reportPath">
      <el-input v-model="testConfig.reportPath" placeholder="例如: ./test-report"></el-input>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';
import type { FormRules } from 'element-plus';

const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
});

const emits = defineEmits<{
  (e: 'update:config', config: {
    testName: string;
    testCommand: string;
    reportPath: string;
    testTypes: string[];
  }): void
}>();

const testConfig = ref<{
  testName: string;
  testCommand: string;
  reportPath: string;
  testTypes: string[];
}>({
  testName: props.config?.testName || '',
  testCommand: props.config?.testCommand || '',
  reportPath: props.config?.reportPath || '',
  testTypes: props.config?.testTypes || []
});

const formRules = ref<FormRules>({
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
});


// 监听props.config变化，确保外部更新时能同步到内部状态
watch(() => props.config, (newConfig) => {
  if (newConfig) {
    testConfig.value = {
      testName: newConfig.testName || '',
      testCommand: newConfig.testCommand || '',
      reportPath: newConfig.reportPath || '',
      testTypes: newConfig.testTypes || []
    };
  }
}, { deep: true });

// 监听内部配置变化并通知父组件
watch(testConfig, (newVal) => {
  emits('update:config', newVal);
}, { deep: true });
</script>