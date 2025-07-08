<template>
  <el-card class="pipeline-orchestration-container">
    <template #header>
      <div class="card-header">
        <div>
          <el-select v-model="selectedServicesId" placeholder="全部服务" style="margin-left: 10px; width: 180px;">
            <el-option value="" label="全部服务"></el-option>
            <el-option v-for="service in servicesOptions" :key="service.id" :label="service.name" :value="service.id"></el-option>
          </el-select>
          <el-select v-model="selectedComponentId" placeholder="全部组件" style="margin-left: 10px; width: 180px;">
            <el-option value="" label="全部组件"></el-option>
            <el-option v-for="component in filteredComponentOptions" :key="component.id" :label="component.name" :value="component.id"></el-option>
          </el-select>
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
      <el-table-column prop="sericeName" label="所属服务"></el-table-column>
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

// 状态管理
const servicesOptions = ref<Service[]>([]);
const pipelineList = ref<Pipeline[]>([]);
const componentOptions = ref<Component[]>([]);
const selectedComponentId = ref<number | string>('');
const selectedServicesId = ref<number | string>('');

const loading = ref(false);
const error = ref('');

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

// 数据获取
const fetchServices = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/services');
    servicesOptions.value = Array.isArray(response.data) ? response.data : DEFAULT_SERVICES;
  } catch (err) {
    console.error('获取服务列表失败:', err);
    servicesOptions.value = DEFAULT_SERVICES;
    ElMessage.warning('获取服务列表失败，已加载默认服务数据');
  }
};

const fetchPipelines = async () => {
  try {
    loading.value = true;
    error.value = '';
    const response = await axios.get('http://localhost:3000/api/pipelines'); 
    pipelineList.value = Array.isArray(response.data) ? response.data : DEFAULT_PIPELINES;
  } catch (err) {
    console.error('数据请求错误:', err);
    pipelineList.value = DEFAULT_PIPELINES;
    ElMessage.warning('获取流水线列表失败，已加载默认数据');
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


onMounted(() => {
  fetchServices(); 
  fetchPipelines();
  fetchComponents();
});

// 业务逻辑
const filteredComponentOptions = computed(() => {
  if (!selectedServicesId.value || selectedServicesId.value === '') {
    return componentOptions.value;
  }
  return componentOptions.value.filter(component => 
    component.serviceId === Number(selectedServicesId.value)
  );
});

const filteredPipelines = computed(() => {
  return pipelineList.value.filter(pipeline => {
    // 服务过滤
    const serviceMatch = !selectedServicesId.value || selectedServicesId.value === '' || 
      componentOptions.value.find(c => c.id === pipeline.componentId)?.serviceId === Number(selectedServicesId.value);
    // 组件过滤
    const componentMatch = !selectedComponentId.value || selectedComponentId.value === '' || 
      pipeline.componentId === Number(selectedComponentId.value);
    return serviceMatch && componentMatch;
  });
});

// 监听服务选择变化，重置组件选择
watch(selectedServicesId, () => {
  selectedComponentId.value = '';
});

const handleEdit = (pipeline: Pipeline) => {
  console.log('编辑流水线:', pipeline);
  // router.push(`/pipeline/edit/${pipeline.id}`);
};
</script>

<style scoped>
.pipeline-orchestration-container { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.table-skeleton { width: 100%; height: 400px; }
</style>
