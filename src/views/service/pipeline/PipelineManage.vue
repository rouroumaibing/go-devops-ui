<template>
  <el-card class="pipeline-orchestration-container">
    <template #header v-if="!isCreateMode">
      <el-button type="primary" icon="Plus" @click="enterCreateMode">创建流水线</el-button>
    </template>
    <div v-if="isCreateMode">
      <PipelineCreate
        v-if="isCreateMode"
        ref="createPipelineFormRef"
        :initial-form-data="{}"
        :component-id="componentId"
        @cancel="handleCancel"
        @save="savePipeline"
        @edit-step="handleStepEdit"
        @add-stage-between="handleAddStageBetween" 
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
            <el-table-column prop="componentName" label="所属组件" width="180"></el-table-column>
            <el-table-column prop="serviceName" label="所属服务"></el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
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
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { ElMessage, ElForm } from 'element-plus';
import axios from 'axios';
import { useRoute, useRouter } from 'vue-router';

import PipelineCreate from './PipelineCreate.vue';


interface Pipeline {
  id: number;
  name: string;
  createTime: string;
  componentId: number;
  componentName: string;
  serviceName?: string;
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

const pipelineList = ref<Pipeline[]>([]);
const loading = ref(false);
const error = ref('');
const route = useRoute();
const componentId = ref<number | undefined>(undefined);
const selectedPipelineId = ref<number | undefined>(undefined);
const isCreateMode = ref(false);
const formData = ref<PipelineFormData>({ name: '', type: '', group: '' });
const pipelineForm = ref<InstanceType<typeof ElForm>>();

const selectedPipeline = computed(() => {
  return pipelineList.value.find(p => p.id === selectedPipelineId.value);
});

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
  { id: 1, name: 'alpha测试环境', createTime: '2023-07-15 10:30', componentId: 2, componentName: '组件B' },
  { id: 2, name: 'beta测试环境', createTime: '2023-07-18 14:20', componentId: 1, componentName: '组件A' },

  { id: 3, name: 'gamma测试环境', createTime: '2023-07-20 09:15', componentId: 0, componentName: '未分类' }
];

const fetchPipelines = async (componentId?: number) => {
  try {
    loading.value = true;
    error.value = '';
    console.log('开始加载流水线数据'); 
    const params = componentId ? { componentId } : {};
    const response = await axios.get(API_ENDPOINTS.pipelines, { params });
    const data = Array.isArray(response.data) ? response.data : DEFAULT_PIPELINES;
    const result = componentId ? data.filter(p => p.componentId === componentId) : data;
    return result.length > 0 ? result : DEFAULT_PIPELINES;
  } catch (err) {
const defaultData = handleApiError(err, DEFAULT_PIPELINES, '获取流水线列表失败');
    const result = componentId ? defaultData.filter(p => p.componentId === componentId) : defaultData;
    return result.length > 0 ? result : DEFAULT_PIPELINES;
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  const componentIdParam = route.query.componentId;
  if (componentIdParam && !isNaN(Number(componentIdParam))) {
    componentId.value = Number(componentIdParam);
  } else if (componentIdParam) {
    ElMessage.warning('无效的组件ID参数，将显示所有流水线');
  }
  pipelineList.value = await fetchPipelines(componentId.value);
});

watch(
  () => route.query.componentId,
  (newComponentId) => {
    if (newComponentId !== undefined) {
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

const enterCreateMode = () => {
  isCreateMode.value = true;
  formData.value = { name: '', type: '', group: '' };
  if (pipelineForm.value) {
    pipelineForm.value.clearValidate();
  }
};


const handleEdit = (pipeline: Pipeline) => {
  console.log('编辑流水线:', pipeline);
  // router.push(`/pipeline/edit/${pipeline.id}`);
};

const handleRun = (pipeline: Pipeline) => {
  console.log('运行流水线:', pipeline);
  // router.push(`/pipeline/run/${pipeline.id}`);
};

const handleStepEdit = (stepType: string) => {
  console.log(`编辑步骤: ${stepType}`);
  // 这里可以添加步骤编辑逻辑
};

const handleCancel = () => {
  isCreateMode.value = false;
  formData.value = { name: '', type: '', group: '' };
};

const savePipeline = async () => {
  try {
    await createPipelineFormRef.value?.pipelineForm?.validate();
    loading.value = true;
    error.value = '';
    console.log('开始保存流水线数据'); 
    const params = componentId.value ? { componentId: componentId.value } : {};
    const response = await axios.post(API_ENDPOINTS.pipelines, formData.value, { params });
    const data = Array.isArray(response.data) ? response.data : DEFAULT_PIPELINES;
    const result = componentId.value ? data.filter(p => p.componentId === componentId.value) : data;
    return result.length > 0 ? result : DEFAULT_PIPELINES;
  } catch (err) {
    const defaultData = handleApiError(err, DEFAULT_PIPELINES, '保存流水线失败');
    const result = componentId.value ? defaultData.filter(p => p.componentId === componentId.value) : defaultData;
    return result.length > 0 ? result : DEFAULT_PIPELINES;
  } finally {
    loading.value = false;
  }
};

const handleAddStageBetween = (index: number) => {
  console.log('Adding stage between index:', index);
};

interface CreatePipelineFormExposed {
  pipelineForm: InstanceType<typeof ElForm> | undefined;
  validateForm: () => Promise<boolean>;
}

const createPipelineFormRef = ref<InstanceType<typeof PipelineCreate> & CreatePipelineFormExposed>();
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
</style>