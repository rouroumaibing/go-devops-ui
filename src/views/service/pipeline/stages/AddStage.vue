<template>
  <el-dialog 
    v-model="visible"
    :title="title"
    width="70%"
  >
    <el-input
    v-model="actionName"
    :placeholder="placeholder"
    @keyup.enter="handleConfirm"
    ></el-input>
      <!-- 添加阶段类型选择器 -->
    <el-select 
      v-model="selectedStageType"
      placeholder="请选择阶段类型"
      style="margin-top: 15px;"
    >
      <el-option 
        v-for="type in StageType"
        :key="type.value"
        :label="type.name"
        :value="type.value"
      ></el-option>
    </el-select>
      <!-- 动态组件显示区域 -->
    <component 
      :is="currentStageComponent"
      v-if="selectedStageType"
      style="margin-top: 15px;"
    ></component>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch, computed } from 'vue';
import BuildStage from './BuildStage.vue';
import CheckPointStage from './CheckPointStage.vue';
import TestStage from './TestStage.vue';
import { StageType } from '@/types/pipeline-stagetype'

const props = defineProps({
  visible: Boolean,
  title: String,
  actionName: String,
  placeholder: { type: String, default: '请输入操作名称' }
});
// 选中的阶段类型
const selectedStageType = ref('');

const emits = defineEmits(['update:visible', 'confirm', 'cancel']);
const visible = ref(props.visible);
const actionName = ref(props.actionName);

// 同步visible状态
watch(() => props.visible, (val) => {
  visible.value = val;
});

watch(visible, (val) => {
  emits('update:visible', val);
});

// 根据选中的阶段类型动态切换组件
const currentStageComponent = computed(() => {
  switch(selectedStageType.value) {
    case 'build':
      return BuildStage;
    case 'checkpoint':
      return CheckPointStage;
    case 'test':
      return TestStage;
    default:
      return null;
  }
});

watch(() => props.actionName, (val) => {
  actionName.value = val;
});

const handleConfirm = () => {
  emits('confirm', actionName.value);
  visible.value = false;
};

const handleCancel = () => {
  emits('cancel');
  visible.value = false;
};
</script>