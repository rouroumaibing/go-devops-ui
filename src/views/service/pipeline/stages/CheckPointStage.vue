<template>
  <el-form ref="checkPointForm" :model="checkPointConfig" :rules="formRules" label-width="100px" label-position="left">
    <el-form-item label="任务名称" formProps="checkPointName">
      <el-input v-model="checkPointConfig.checkPointName" placeholder="请输入任务名称"></el-input>
    </el-form-item>
    <el-form-item label="审批人" formProps="approver">
      <el-input v-model="checkPointConfig.approver" placeholder="输入审批人用户名，多个用逗号分隔"></el-input>
    </el-form-item>
    <el-form-item label="审批有效时间" formProps="timeoutHours">
      <el-input-number
        v-model="checkPointConfig.timeoutHours"
        :min="1"
        :max="72"
        label="小时"
      ></el-input-number>
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
    checkPointName: string;
    approver: string;
    timeoutHours: number;
  }): void
}>();

const checkPointConfig = ref<{
  checkPointName: string;
  approver: string;
  timeoutHours: number;
}>({
  checkPointName: formProps.config?.checkPointName || '',
  approver: formProps.config?.approver || '',
  timeoutHours: formProps.config?.timeoutHours || 24
});

const formRules = ref<FormRules>({
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
});

// 监听props.config变化，确保外部更新时能同步到内部状态
watch(() => formProps.config, (newConfig) => {
  if (newConfig) {
    checkPointConfig.value = {
      checkPointName: newConfig.checkPointName || '',
      approver: newConfig.approver || '',
      timeoutHours: newConfig.timeoutHours || 24
    };
  }
}, { deep: true });

// 监听内部配置变化并通知父组件
watch(checkPointConfig, (newVal) => {
  emits('update:config', newVal);
}, { deep: true });
</script>