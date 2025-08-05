<template>
  <el-form ref="testForm" :model="testConfig" label-width="100px">
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

const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
});

const emits = defineEmits<{
  (e: 'update:config', config: {
    testCommand: string;
    reportPath: string;
    testTypes: string[];
  }): void
}>();

const testConfig = ref<{
  testCommand: string;
  reportPath: string;
  testTypes: string[];
}>({
  testCommand: props.config?.testCommand || '',
  reportPath: props.config?.reportPath || '',
  testTypes: props.config?.testTypes || []
});

// 监听props.config变化，确保外部更新时能同步到内部状态
watch(() => props.config, (newConfig) => {
  if (newConfig) {
    testConfig.value = {
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