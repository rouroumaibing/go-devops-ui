<template>
  <el-card class="pipeline-orchestration-container">
    <template #header v-if="!isCreateMode">
      <el-button type="primary" icon="Plus" @click="enterCreateMode">创建流水线</el-button>
    </template>
    <div v-if="isCreateMode">
      <PipelineCreate
        ref="createPipelineFormRef"
        :initial-form-data="{}"
        :component-id="componentId"
      />
    </div>

    <div v-else>
      <el-skeleton v-if="loading" :rows="5" border stripe class="table-skeleton"></el-skeleton>
      <el-alert v-else-if="error" type="error" description="获取流水线列表失败，请重试" show-icon></el-alert>
      <el-empty v-else-if="pipelineList.length === 0" description="暂无流水线数据"></el-empty>

      <el-row v-else class="layout-container">
        <el-col :span="6" class="left-panel">
          <el-select v-model="selectedPipelineId" placeholder="选择流水线" style="width: 100%">
            <el-option
              v-for="item in pipelineList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-col>

        <!-- 右侧任务管理区域 -->
        <el-col :span="18" class="right-panel">
          <el-table v-if="selectedPipeline" :data="[selectedPipeline]" border stripe>
            <el-table-column type="index" label="序号" width="80"></el-table-column>
            <el-table-column prop="name" label="流水线名称" width="180"></el-table-column>
            <el-table-column prop="component_id" label="所属组件" width="180"></el-table-column>
            <el-table-column prop="service_tree" label="所属服务"></el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180"></el-table-column>
            <el-table-column label="操作" width="250">
              <template #default="scope">
                <el-button type="primary" size="small" @click="handleRun(scope.row)">运行</el-button>
                <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="请选择流水线"></el-empty>
        </el-col>
      </el-row>

      <div class="pipeline-run-container">
        <PipelineRun v-if="selectedPipelineId" :pipeline-id="selectedPipelineId" />
        <el-empty v-else description="请选择流水线以查看运行状态"></el-empty>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref, onMounted, watch, computed, reactive, toRefs } from 'vue';
import { ElMessage, ElForm } from 'element-plus';
import { useRouter, useRoute } from 'vue-router';

import PipelineCreate from './PipelineCreate.vue';
import PipelineRun from './PipelineRun.vue';

interface pipeline {
  id: string;
  name: string;
  component_id: string;
  service_tree: string;
  pipeline_stages: string;
  created_at: string;
  updated_at: string;
}

interface pipeline_job{
  id: string;
  name: string;
  command: string;
  pipeline_id: string;
  status: string;
  created_at: string;
  updated_at: string;  
}


interface PipelineFormData {
  name: string;
  type: string;
  group: string;
  steps?: {
    mainStep: number;
    subSteps: Record<string, number>;
  };
}
interface CreatePipelineFormExposed {
  pipelineForm: InstanceType<typeof ElForm> | undefined;
  validateForm: () => Promise<boolean>;
}
const state = reactive({
  pipelineDetail: null as pipeline | null,
  pipelineStagesDetail: null as pipeline_job | null,
});

const { pipelineDetail, pipelineStagesDetail } = toRefs(state);

const createPipelineFormRef = ref<InstanceType<typeof PipelineCreate> & CreatePipelineFormExposed>();
const pipelineList = ref<pipeline[]>([]);
const loading = ref(false);
const error = ref('');
const router = useRoute();
const componentId = ref<number | undefined>(undefined);
const selectedPipelineId = ref<string | undefined>(undefined);
const isCreateMode = ref(false);
const formData = ref<PipelineFormData>({ name: '', type: '', group: '' });
const pipelineForm = ref<InstanceType<typeof ElForm>>();

const DEFAULT_PIPELINES: pipeline[] = [
  { id: '000-0000-0000-0001', name: 'alpha测试环境', created_at: '2025-07-15 10:30', component_id: '0000-0000-0000-0020', service_tree: 'push-server', pipeline_stages: JSON.stringify(DEFAULT_PIPELINE_DETAIL), updated_at: '2025-07-15 10:30' },
  { id: '000-0000-0000-0002', name: 'beta测试环境', created_at: '2025-07-18 14:20', component_id: '0000-0000-0000-0020', service_tree: 'push-server', pipeline_stages: JSON.stringify(DEFAULT_PIPELINE_DETAIL), updated_at: '2025-07-18 14:20' },
  { id: '000-0000-0000-0003', name: 'gamma测试环境', created_at: '2025-07-20 09:15', component_id: '0000-0000-0000-0020', service_tree: 'push-server', pipeline_stages: JSON.stringify(DEFAULT_PIPELINE_DETAIL), updated_at: '2025-07-20 09:15' }

];

const selectedPipeline = computed(() => {
  return pipelineList.value.find(p => p.id === selectedPipelineId.value);
});

const handleApiError = (error: any, defaultData: any[], message: string) => {
  console.error(message, error);
  ElMessage.warning(`${message}，已加载默认数据`);
  error.value = message;
  return defaultData;
};

const enterCreateMode = () => {
  isCreateMode.value = true;
  formData.value = { name: '', type: '', group: '' };
  if (pipelineForm.value) {
    pipelineForm.value.clearValidate();
  }
};


const handleEdit = (pipeline: pipeline) => {
  console.log('编辑流水线:', pipeline);
  // router.push(`/pipeline/edit/${pipeline.id}`);
};

const handleRun = (pipeline: pipeline) => {
  console.log('运行流水线:', pipeline);
  // router.push(`/pipeline/run/${pipeline.id}`);
};

const fetchPipelines = async (id: string) => {
  try {
    loading.value = true;
    const response = await axios.get(`/api/pipelines/${id}`);
    pipelineDetail.value = response.data;
    return DEFAULT_PIPELINE_DETAIL;
  } catch (err) {
const defaultData = handleApiError(err, DEFAULT_PIPELINES, '获取流水线列表失败');
    const result = componentId ? defaultData.filter(p => p.componentId === componentId) : defaultData;
    return result.length > 0 ? result : DEFAULT_PIPELINES;
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  const componentIdParam = router.query.componentId;
  if (componentIdParam && !isNaN(Number(componentIdParam))) {
    componentId.value = Number(componentIdParam);
  } else if (componentIdParam) {
    ElMessage.warning('无效的组件ID参数, 将显示所有流水线');
  }
  pipelineList.value = await fetchPipelines(componentId);
});

watch(
  () => router.query.componentId,
  (newComponentId) => {
    if (newComponentId !== undefined) {
      if (!isNaN(Number(newComponentId))) {
        componentId.value = Number(newComponentId);
        fetchPipelines(componentId.value).then(data => {
          pipelineList.value = data;
        });
      } else {
        ElMessage.warning('无效的组件ID参数,将显示所有流水线');
        componentId.value = undefined;
        fetchPipelines().then(data => {
          pipelineList.value = data;
        });
      }
    }
  }
);

const generateDefaultPipeline = (): pipeline[] => [
  { id: '000-0000-0000-0001', name: 'alpha测试环境', created_at: '2025-07-15 10:30', component_id: '0000-0000-0000-0020', service_tree: 'push-server', pipeline_stages: JSON.stringify(DEFAULT_PIPELINE_DETAIL), updated_at: '2025-07-15 10:30' },
  { id: '000-0000-0000-0002', name: 'beta测试环境', created_at: '2025-07-18 14:20', component_id: '0000-0000-0000-0020', service_tree: 'push-server', pipeline_stages: JSON.stringify(DEFAULT_PIPELINE_DETAIL), updated_at: '2025-07-18 14:20' },
  { id: '000-0000-0000-0003', name: 'gamma测试环境', created_at: '2025-07-20 09:15', component_id: '0000-0000-0000-0020', service_tree: 'push-server', pipeline_stages: JSON.stringify(DEFAULT_PIPELINE_DETAIL), updated_at: '2025-07-20 09:15' }

];

[
  {
    name: '构建',
    stages: [
      { id: '000-0000-0000', name: '构建1', command: 'go build', status: 'success' },
      { id: '000-0000-0001', name: '构建2', command: 'go build', status: 'success' },
      { id: '000-0000-0002', name: '归档', command: 'go archive', status: 'success' }
    ]
  },
  {
    name: '卡点',
    stages: [
      { id: '000-0000-0003', name: '责任人： xxx', command: 'go test', status: 'processing' }
    ]
  },
  {
    name: '部署',
    stages: [
      { id: '000-0000-0004', name: 'alpha环境', command: 'go deploy', status: 'failed' },
      { id: '000-0000-0005', name: 'beta环境', command: 'go deploy', status: 'pending' },
      { id: '000-0000-0006', name: 'gamma环境', command: 'go deploy', status: 'pending' }
    ]
  },
  {
    name: '测试',
    stages: [
      { id: '000-0000-0007', name: '自动测试用例', command: 'go test', status: 'pending' }
    ]
  }
];


</script>

<style scoped>
.pipeline-orchestration-container { padding: 0; }
.card-header { margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
.search-container { display: flex; flex-direction: column; }
.table-skeleton { width: 100%; height: 400px; }
.layout-container { margin: 0 15px; }
.left-panel { padding-right: 15px; border-right: 1px solid #e5e7eb; }
.right-panel { padding-left: 15px; }
.create-form-container { padding: 20px; position: relative; min-height: 400px; }
.form-container { 
  max-width: none; 
  margin: 0; 
  width: 100%; 
}
.form-actions { position: absolute; bottom: 20px; right: 20px; display: flex; gap: 10px; }

.advanced-options-title {
  font-size: 16px;
  font-weight: bold;
  margin: 20px 0 15px;
  color: #303133;
  padding-left: 0px;
}

.steps-container {
  width: 100%;
  overflow-x: auto;
  padding: 10px 0;
}


.main-steps {
  min-width: 0px;
}

.main-step-item {
  width: 33.333%;
}

.sub-steps-vertical {
  margin-top: 15px;
  padding-left: 20px;
}

.el-step__title {
  font-size: 14px;
}

/* 调整垂直步骤连接线样式 */
.el-steps--vertical .el-step__line {
  left: 10px !important;
}

/* 步骤编辑按钮样式 */
.step-edit-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
}

.step-edit-btn .el-icon {
  font-size: 14px;
}

/* 调整步骤标题样式 */
.el-step__title {
  font-size: 14px;
  display: flex;
  align-items: center;
}
.pipeline-run-container {
  margin-top: 30px;
  padding: 20px;
  border-top: 1px dashed #e8e8e8;
}
</style>