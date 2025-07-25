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
import { ElForm } from 'element-plus';

const props = defineProps<{
  initialConfig?: {
    testCommand?: string;
    reportPath?: string;
    testTypes?: string[];
  }
}>();

const emits = defineEmits<{
  (e: 'update:config', config: {
    testCommand: string;
    reportPath: string;
    testTypes: string[];
  }): void
}>();

const testForm = ref<InstanceType<typeof ElForm>>();
const testConfig = ref<{
  testCommand: string;
  reportPath: string;
  testTypes: string[];
}>({
  testCommand: props.initialConfig?.testCommand || '',
  reportPath: props.initialConfig?.reportPath || '',
  testTypes: props.initialConfig?.testTypes || []
});

watch(testConfig, (newVal) => {
  emits('update:config', newVal);
}, { deep: true });
</script>