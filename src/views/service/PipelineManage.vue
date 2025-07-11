<template>
  <el-card class="pipeline-orchestration-container">
    <template #header>
      <div class="card-header">
        <div class="search-container">
          <el-input 
            v-model="query"
            style="width: 240px; margin-bottom: 10px;"
            placeholder="请输入服务/组件关键词搜索"
            @input="onQueryChanged"
          />
          <el-tree-v2 
            ref="treeRef"
            style="width: 300px; max-height: 300px; border: 1px solid #e5e7eb; border-radius: 4px;"
            :data="treeData"
            :props="props"
            :filter-method="filterMethod"
            @node-click="handleNodeClick"
          />
        </div>
        <div>
          <el-button icon="Refresh" @click="fetchPipelines"></el-button>
          <el-button type="primary" icon="Plus">创建流水线</el-button>
        </div>
      </div>
    </template>

    <el-skeleton v-if="loading" :rows="5" border stripe class="table-skeleton"></el-skeleton>
    <el-alert v-else-if="error" type="error" description="获取流水线列表失败，请重试" show-icon></el-alert>
    <el-empty v-else-if="filteredPipelines.length === 0" description="暂无流水线数据"></el-empty>

    <el-table v-else :data="filteredPipelines" border stripe>
      <el-table-column type="index" label="序号" width="80"></el-table-column>
      <el-table-column prop="name" label="流水线名称" width="180"></el-table-column>
      <el-table-column prop="project" label="所属项目" width="150"></el-table-column>
      <el-table-column prop="componentName" label="所属组件" width="180"></el-table-column>
      <el-table-column prop="serviceName" label="所属服务"></el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button link @click="handleEdit(scope.row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import { ElTreeV2 } from 'element-plus';
import type { TreeNodeData, TreeNode } from 'element-plus';
import { ComponentPublicInstance } from 'vue';


interface Service {
  id: number;
  name: string;
}

interface Pipeline {
  id: number;
  name: string;
  project: string;
  status: 'active' | 'disabled';
  createTime: string;
  componentId: number;
  componentName: string;
}

interface Component {
  id: number;
  name: string;
  version?: string;
  type?: string;
  status?: number;
  serviceId?: number;
}

// 添加 TreeItem 接口定义
interface TreeItem {
  id: number;
  label: string;
  isService: boolean; // 设为必填项提高类型安全性
  children?: TreeItem[];
}

// 状态管理
const servicesOptions = ref<Service[]>([]);
const pipelineList = ref<Pipeline[]>([]);
const componentOptions = ref<Component[]>([]);
const selectedComponentId = ref<number | string>('');
// 修正变量名拼写错误 selectedServicesId -> selectedServiceId
const selectedServiceId = ref<number | string>('');

// API常量提取
const API_BASE_URL = 'http://localhost:3000/api';
const API_ENDPOINTS = {
  services: `${API_BASE_URL}/services`,
  pipelines: `${API_BASE_URL}/pipelines`,
  components: `${API_BASE_URL}/components`
};

// 统一错误处理函数
const handleApiError = (error: any, defaultData: any[], message: string) => {
  console.error(message, error);
  ElMessage.warning(`${message}，已加载默认数据`);
  error.value = message;
  return defaultData;
};

// 优化数据获取函数
// 在API_ENDPOINTS常量下方添加默认数据定义
const DEFAULT_SERVICES: Service[] = [
  { id: 1, name: '服务1' },
  { id: 2, name: '服务2' },
  { id: 3, name: '服务3' },
];

const DEFAULT_PIPELINES: Pipeline[] = [
  { id: 1, name: '后端构建流水线', project: '核心系统', status: 'active', createTime: '2023-07-15 10:30', componentId: 2, componentName: '组件B' },
  { id: 2, name: '前端构建流水线', project: '用户平台', status: 'active', createTime: '2023-07-18 14:20', componentId: 1, componentName: '组件A' }
];

const DEFAULT_COMPONENTS: Component[] = [
  { id: 1, name: '组件A', version: '1.0.0', type: '前端', status: 1 ,serviceId:1},
  { id: 2, name: '组件B', version: '2.1.0', type: '后端', status: 1,serviceId:2 },
  { id: 3, name: '组件C', version: '0.9.5', type: '数据库', status: 0,serviceId:3 }
];

// 数据获取函数
const fetchServices = async () => {
  try {
    const response = await axios.get(API_ENDPOINTS.services);
    return Array.isArray(response.data) ? response.data : DEFAULT_SERVICES;
  } catch (err) {
    return handleApiError(err, DEFAULT_SERVICES, '获取服务列表失败');
  }
};

// 在状态管理区域添加loading变量声明
const loading = ref(false);
const error = ref('');

// 树形组件相关状态
const query = ref('');
const treeRef = ref<ComponentPublicInstance<typeof ElTreeV2, { data: TreeItem[] }>>();
const treeData = ref<TreeItem[]>([]);
const props = {
  value: 'id',
  label: 'label',
  children: 'children',
};

// 添加树形数据转换函数（关键修复）
const transformToTreeData = (services: Service[], components: Component[]): TreeItem[] => {
  return services.map(service => ({
    id: service.id,
    label: service.name,
    isService: true,
    children: components
      .filter(component => component.serviceId === service.id)
      .map(component => ({
        id: component.id,
        label: component.name,
        isService: false
      }))
  }));
};

const fetchPipelines = async () => {
  try {
    loading.value = true;
    error.value = '';
    const response = await axios.get(API_ENDPOINTS.pipelines);
    return Array.isArray(response.data) ? response.data : DEFAULT_PIPELINES;
  } catch (err) {
    return handleApiError(err, DEFAULT_PIPELINES, '获取流水线列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchComponents = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/components');
    componentOptions.value = Array.isArray(response.data) ? response.data : DEFAULT_COMPONENTS;
  } catch (err) {
    console.error('获取组件列表失败:', err);
    componentOptions.value = DEFAULT_COMPONENTS;
    ElMessage.warning('获取组件列表失败，已加载默认组件数据');
  }
};

onMounted(async () => {
  await Promise.all([fetchServices(), fetchComponents()]);
  // 转换为树形数据（此处调用了transformToTreeData）
  treeData.value = transformToTreeData(servicesOptions.value, componentOptions.value);
  fetchPipelines();
});

// 业务逻辑
const filteredComponentOptions = computed(() => {
  if (!selectedServiceId.value || selectedServiceId.value === '') {
    return componentOptions.value;
  }
  const serviceId = Number(selectedServiceId.value);
  return componentOptions.value.filter(component => component.serviceId === serviceId);
});

const filteredPipelines = computed(() => {
  return pipelineList.value.filter(pipeline => {
    // 服务过滤
    const serviceMatch = !selectedServiceId.value || selectedServiceId.value === '' || 
      componentOptions.value.find(c => c.id === pipeline.componentId)?.serviceId === Number(selectedServiceId.value);
    // 组件过滤
    const componentMatch = !selectedComponentId.value || selectedComponentId.value === '' || 
      pipeline.componentId === Number(selectedComponentId.value);
    return serviceMatch && componentMatch;
  });
});

// 监听服务选择变化，重置组件选择
watch(selectedServiceId, () => {
  selectedComponentId.value = '';
});

// 树形组件搜索过滤优化
const onQueryChanged = (query: string) => {
  treeRef.value?.filter(query); // 使用可选链避免空引用错误
};

const filterMethod = (query: string, node: TreeNodeData & { label?: string }) => 
  node.label?.includes(query) || false

const handleEdit = (pipeline: Pipeline) => {
  console.log('编辑流水线:', pipeline);
  // router.push(`/pipeline/edit/${pipeline.id}`);
};

// 添加类型守卫函数确保类型安全
const isTreeItem = (data: unknown): data is TreeItem => {
  return typeof data === 'object' && data !== null && 'id' in data && 'label' in data;
};

// 可选：使用类型守卫重构事件处理函数
const handleNodeClick = (data: unknown, node: TreeNode, e: MouseEvent) => {
  if (!isTreeItem(data)) return;
  if (data.isService) {
    selectedServiceId.value = data.id;
    selectedComponentId.value = '';
  } else {
    selectedComponentId.value = data.id;
    // 查找对应的服务ID
    const serviceItem = treeData.value.find(item => 
      item.children?.some(child => child.id === data.id)
    );
    if (serviceItem) {
      selectedServiceId.value = serviceItem.id;
    }
  }
};
</script>

<style scoped>
.pipeline-orchestration-container { padding: 0; }
.card-header { margin-bottom: 15px; }
.search-container { display: flex; flex-direction: column; } /* 添加display:flex确保垂直排列 */
.table-skeleton { width: 100%; height: 400px; }
</style>
