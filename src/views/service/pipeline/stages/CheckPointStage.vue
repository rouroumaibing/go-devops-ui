<template>
  <el-form ref="checkPointForm" :model="checkPointConfig" label-width="100px">
    <el-form-item label="审批人" prop="approver">
      <el-input v-model="checkPointConfig.approver" placeholder="输入审批人用户名，多个用逗号分隔"></el-input>
    </el-form-item>
    <el-form-item label="卡点描述" prop="description">
      <el-input
        v-model="checkPointConfig.description"
        type="textarea"
        :rows="4"
        placeholder="描述此卡点的目的和检查项"
      ></el-input>
    </el-form-item>
    <el-form-item label="超时时间">
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
import { ElForm } from 'element-plus';

const props = defineProps<{
  initialConfig?: {
    approver?: string;
    description?: string;
    timeoutHours?: number;
  }
}>();

const emits = defineEmits<{
  (e: 'update:config', config: {
    approver: string;
    description: string;
    timeoutHours: number;
  }): void
}>();

const checkPointForm = ref<InstanceType<typeof ElForm>>();
const checkPointConfig = ref<{
  approver: string;
  description: string;
  timeoutHours: number;
}>({
  approver: props.initialConfig?.approver || '',
  description: props.initialConfig?.description || '',
  timeoutHours: props.initialConfig?.timeoutHours || 24
});

watch(checkPointConfig, (newVal) => {
  emits('update:config', newVal);
}, { deep: true });
</script>