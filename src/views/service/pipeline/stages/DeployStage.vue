<template>
  <el-form ref="checkPointForm" :model="deployStageConfig"  label-width="100px" label-position="left">
    <el-form-item label="执行超时时间" formProps="timeoutHours">
      <el-input-number
        v-model="deployStageConfig.timeoutHours"
        :min="1"
        :max="72"
        label="小时"
      ></el-input-number>
    </el-form-item>
  </el-form>
  <el-tree-v2
    style="max-width: 600px"
    :data="treeData"
    :height="200"
    :props="treeProps"
    show-checkbox
    :default-checked-keys="defaultCheckedKeys"
    :default-expanded-keys="defaultExpandedKeys"
  />
</template>

<script lang="ts" setup>
import axios from 'axios';
import { ref, onMounted, defineEmits, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Environment } from '@/types/environment-manage';

interface EnvironmentTreeNode extends Environment {
  children?: EnvironmentTreeNode[];
}
const formProps = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
});

const treeProps = {
  value: 'id',
  label: 'name',
  children: 'children',
};

// 定义响应式变量
const treeData = ref<EnvironmentTreeNode[]>([]);
const loading = ref(false);
const defaultCheckedKeys = ref<string[]>([]);
const defaultExpandedKeys = ref<string[]>([]);
const componentId = ref<string | undefined>(undefined);
const router = useRoute();
// 获取环境数据
const fetchEnv = async (componentId: string) => {
  try {
    loading.value = true;
    const response = await axios.get(`/api/component/${componentId}/environments`);
    if (response.data.length > 0) {
      treeData.value = response.data;

    } else {
      treeData.value = generateDefaultEnvironmentTree();
    }
  } catch (error) {
    ElMessage.error('加载环境数据失败，请重试');
    treeData.value = generateDefaultEnvironmentTree();
  } finally {
    loading.value = false;
  }
};

// 在组件挂载时获取环境数据
onMounted(() => {
  const queryComponentId = router.query.componentId;
  componentId.value = typeof queryComponentId === 'string' ? queryComponentId : undefined;
  if (componentId.value) {
    fetchEnv(componentId.value);
  }
});

// 定义组件事件，用于向父组件更新配置
const emits = defineEmits<{
  (e: 'update:config', config: { timeoutHours: number; }): void
}>();

// 创建响应式变量存储构建配置，初始值从props中获取或使用空字符串
const deployStageConfig = ref<{
  timeoutHours: number;
}>({
  timeoutHours: formProps.config?.timeoutHours || 24
});

// 监听props.config变化，确保外部更新时能同步到内部状态
watch(() => formProps.config, (newConfig) => {
  if (newConfig) {
    deployStageConfig.value = {
      timeoutHours: newConfig.timeoutHours || 24
    };
  }
}, { deep: true });


// 监听内部配置变化并通知父组件
watch(deployStageConfig, (newVal) => {
  emits('update:config', newVal);
}, { deep: true });

// 生成默认环境树数据
const generateDefaultEnvironmentTree = (): EnvironmentTreeNode[] => {
  return [
    {
      id: 1,
      name: 'Default',
      is_env: false,
      env_group: '',
      component_id: componentId.value || '',
      service_addr: '',
      description: '',
      created_at: "",
      updated_at: "",
      children: []
    },
  ];
};
</script>