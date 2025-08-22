<template>
  <el-form ref="testForm" :model="testConfig" label-width="100px" label-position="left">
    <el-form-item label="执行超时时间" formProps="timeoutHours">
      <el-input-number
        v-model="testConfig.timeoutHours"
        :min="1"
        :max="72"
        label="小时"
      ></el-input-number>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';

const formProps = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
});

const emits = defineEmits<{
  (e: 'update:config', config: {
    timeoutHours: number;
  }): void
}>();

const testConfig = ref<{
  timeoutHours: number;
}>({
  timeoutHours: formProps.config?.timeoutHours || 24,
});

// 监听内部配置变化并通知父组件
watch(testConfig, (newVal) => {
  emits('update:config', newVal);
}, { deep: true });
</script>