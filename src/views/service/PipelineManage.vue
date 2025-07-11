<template>
  <el-card class="pipeline-orchestration-container">
    <template #header>
      <div class="card-header">
        <div>
          <el-button type="primary" icon="Plus">创建流水线</el-button>
        </div>
      </div>
    </template>

    <el-skeleton v-if="loading" :rows="5" border stripe class="table-skeleton"></el-skeleton>
    <el-alert v-else-if="error" type="error" description="获取流水线列表失败，请重试" show-icon></el-alert>
    <el-empty v-else-if="pipelineList.length === 0" description="暂无流水线数据"></el-empty>

    <el-table v-else :data="pipelineList" border stripe>
      <el-table-column type="index" label="序号" width="80"></el-table-column>
      <el-table-column prop="name" label="流水线名称" width="180"></el-table-column>
      <el-table-column prop="project" label="所属项目" width="150"></el-table-column>
      <el-table-column prop="componentName" label="所属组件" width="180"></el-table-column>
      <el-table-column prop="serviceName" label="所属服务"></el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status === 'active' ? '启用' : '禁用' }}</el-tag>
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
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import { useRoute } from 'vue-router';

interface Pipeline {
  id: number;
  name: string;
  project: string;
  status: 'active' | 'disabled';
  createTime: string;
  componentId: number;
  componentName: string;
  serviceName?: string;
}

const pipelineList = ref<Pipeline[]>([]);
const loading = ref(false);
const error = ref('');
const route = useRoute();
const componentId = ref<number | undefined>(undefined);

const API_BASE_URL = 'http://localhost:3000/api';
const API_ENDPOINTS = {
  pipelines: `${API_BASE_URL}/pipelines`,
};

const handleApiError = (error: any, defaultData: any[], message: string) => {
  console.error(message, error);
  ElMessage.warning(`${message}，已加载默认数据`);
  error.value = message;
  return defaultData;
};

const DEFAULT_PIPELINES: Pipeline[] = [
  { id: 1, name: '后端构建流水线', project: '核心系统', status: 'active', createTime: '2023-07-15 10:30', componentId: 2, componentName: '组件B' },
  { id: 2, name: '前端构建流水线', project: '用户平台', status: 'active', createTime: '2023-07-18 14:20', componentId: 1, componentName: '组件A' }
];

const fetchPipelines = async (componentId?: number) => {
  try {
    loading.value = true;
    error.value = '';
    const params = componentId ? { componentId } : {};
    const response = await axios.get(API_ENDPOINTS.pipelines, { params });
    const data = Array.isArray(response.data) ? response.data : DEFAULT_PIPELINES;
    return componentId ? data.filter(p => p.componentId === componentId) : data;
  } catch (err) {
    const defaultData = handleApiError(err, DEFAULT_PIPELINES, '获取流水线列表失败');
    return componentId ? defaultData.filter(p => p.componentId === componentId) : defaultData;
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  // 从路由参数获取组件ID并验证有效性
  const componentIdParam = route.query.componentId;
  if (componentIdParam && !isNaN(Number(componentIdParam))) {
    componentId.value = Number(componentIdParam);
  } else if (componentIdParam) {
    ElMessage.warning('无效的组件ID参数，将显示所有流水线');
  }
  pipelineList.value = await fetchPipelines(componentId.value);
});

// 监听组件ID变化，重新加载数据
watch(
  () => route.query.componentId,
  (newComponentId) => {
    if (newComponentId !== undefined) {
      // 验证组件ID是否为有效数字
      if (!isNaN(Number(newComponentId))) {
        componentId.value = Number(newComponentId);
        fetchPipelines(componentId.value).then(data => {
          pipelineList.value = data;
        });
      } else {
        ElMessage.warning('无效的组件ID参数，将显示所有流水线');
        componentId.value = undefined;
        fetchPipelines().then(data => {
          pipelineList.value = data;
        });
      }
    }
  }
);

const handleEdit = (pipeline: Pipeline) => {
  console.log('编辑流水线:', pipeline);
  // router.push(`/pipeline/edit/${pipeline.id}`);
};
</script>

<style scoped>
.pipeline-orchestration-container { padding: 0; }
.card-header { margin-bottom: 15px; }
.search-container { display: flex; flex-direction: column; }
.table-skeleton { width: 100%; height: 400px; }
</style>