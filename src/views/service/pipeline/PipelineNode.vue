<template>
  <el-dialog 
    v-model="visible"
    :title="title"
    width="30%"
  >
    <el-input
      v-model="actionName"
      :placeholder="placeholder"
      @keyup.enter="handleConfirm"
    ></el-input>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';

const props = defineProps({
  visible: Boolean,
  title: String,
  actionName: String,
  placeholder: { type: String, default: '请输入操作名称' }
});

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