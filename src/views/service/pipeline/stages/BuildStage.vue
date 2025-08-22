<template>
  <el-form ref="buildForm" :model="buildConfig" label-width="100px" label-position="left">
    <el-form-item label="执行超时时间" formProps="timeoutHours">
      <el-input-number
        v-model="buildConfig.timeoutHours"
        :min="1"
        :max="72"
        label="小时"
      ></el-input-number>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';

// 定义组件属性，接收配置对象作为参数，默认值为空对象
const formProps = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
});

// 定义组件事件，用于向父组件更新配置
const emits = defineEmits<{
  (e: 'update:config', config: { timeoutHours: number; }): void
}>();

const buildConfig = ref<{
  timeoutHours: number;
}>({
  timeoutHours: formProps.config?.timeoutHours || 24
});

watch(buildConfig, (newVal) => {
  emits('update:config', newVal);
}, { deep: true });
</script>