<template>
  <el-form ref="checkPointForm" :model="deployStageConfig" :rules="formRules" label-width="100px">
    <el-form-item label="任务名称" formProps="deployName">
      <el-input v-model="deployStageConfig.deployName" placeholder="请输入任务名称"></el-input>
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
import { ElMessage, FormRules } from 'element-plus';
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

const emits = defineEmits<{
  (e: 'update:config', config: {
    deployName: string;
  }): void
}>();

const deployStageConfig = ref<{
  deployName: string;
}>({
  deployName: formProps.config?.deployName || '',
});

const formRules = ref<FormRules>({
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
});
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

// 监听props.config变化，确保外部更新时能同步到内部状态
watch(() => formProps.config, (newConfig) => {
  if (newConfig) {
    deployStageConfig.value = {
      deployName: newConfig.deployName || '',
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