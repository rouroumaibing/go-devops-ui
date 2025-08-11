<template>
  <el-card class="pipeline-orchestration-container">
    <template #header>
      <el-button v-if="!isCreateMode" type="primary" icon="Plus" @click="enterCreateMode">创建流水线</el-button>
    </template>

    <div v-if="!isCreateMode">
      <div>
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
                :value="item.id || ''"
              />
            </el-select>
          </el-col>

          <!-- 右侧任务管理区域 -->
          <el-col :span="18" class="right-panel">
            <el-table v-if="selectedPipeline" :data="[selectedPipeline]" border stripe>
              <el-table-column type="index" label="序号" width="80"></el-table-column>
              <el-table-column prop="name" label="流水线名称" width="180"></el-table-column>
              <el-table-column prop="component_id" label="所属组件" width="180"></el-table-column>
              <el-table-column prop="service_tree" label="所属服务">
                <template #default="scope">
                  {{ scope.row.service_tree.replace(/\./g, '/') }}
                </template>
              </el-table-column>
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
          <PipelineRun 
            v-if="selectedPipelineId && pipelineList.length > 0"
            :pipeline-stages="pipelineList.find(p => p.id === selectedPipelineId)?.pipeline_stages ?? []"
          />
          <el-empty v-else description="请选择流水线以查看运行状态"></el-empty>
        </div>
      </div>
    </div>

    <el-drawer 
      v-model="isCreateMode"
      direction="rtl"
      title="创建流水线"
      size="80%"
    >
      <PipelineCreate
        ref="createPipelineFormRef"
        :initial-form-data="formData"
        :component-id="componentId || ''"
        :service-tree="serviceTree || ''"
        @cancel="isCreateMode = false"
        @success="handlePipelineCreated" 
      />
    </el-drawer>
  </el-card>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref, onMounted, watch, computed, reactive, toRefs } from 'vue';
import { ElMessage, ElForm } from 'element-plus';
import { useRoute } from 'vue-router';

import PipelineCreate from './PipelineCreate.vue';
import PipelineRun from './PipelineMap.vue';

import type { Pipeline } from '@/types/pipeline';

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
  pipelineDetail: null as Pipeline | null,
});

const { pipelineDetail } = toRefs(state);

const createPipelineFormRef = ref<InstanceType<typeof PipelineCreate> & CreatePipelineFormExposed>();
const pipelineList = ref<Pipeline[]>([]);
const loading = ref(false);
const error = ref('');
const router = useRoute();
const componentId = ref<string | undefined>(undefined);
const serviceTree = ref<string | undefined>(undefined);
const selectedPipelineId = ref<string | undefined>(undefined);
const isCreateMode = ref(false);
const formData = ref<PipelineFormData>({ name: '', type: '', group: '' });
const pipelineForm = ref<InstanceType<typeof ElForm>>();


const selectedPipeline = computed(() => {
  return pipelineList.value.find(p => p.id === selectedPipelineId.value);
});

const handleApiError = (error: any, defaultData: any[], message: string) => {
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

const handleEdit = (pipeline: Pipeline) => {
  console.log('编辑流水线:', pipeline);
  // router.push(`/pipeline/edit/${pipeline.id}`);
};

const handleRun = (pipeline: Pipeline) => {
  console.log('运行流水线:', pipeline);
  // router.push(`/pipeline/run/${pipeline.id}`);
};

const handlePipelineCreated = async () => {
  isCreateMode.value = false;
  ElMessage.success('流水线创建成功');
  if (componentId.value) {
    pipelineList.value = await fetchPipelines(componentId.value);
  }
};

const fetchPipelines = async (componentId: string) => {
  try {
    loading.value = true;
    const response = await axios.get(`/api/component/${componentId}/pipelines`);
    pipelineDetail.value = response.data;
    return Array.isArray(pipelineDetail.value) ? pipelineDetail.value : generateDefaultPipeline();
  } catch (err) {
    const defaultData = handleApiError(err, generateDefaultPipeline(), '获取流水线列表失败');
    return defaultData;
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  const queryComponentId = router.query.componentId;
  const queryServiceTree = router.query.serviceTree;
  componentId.value = typeof queryComponentId === 'string' ? queryComponentId : undefined;
  pipelineList.value = await fetchPipelines(String(queryComponentId));
  serviceTree.value = typeof queryServiceTree === 'string' ? queryServiceTree : undefined;
});

watch(
  () => router.query.componentId,
  (newComponentId) => {
    fetchPipelines(String(newComponentId)); 
  }
);

const generateDefaultPipeline = (): Pipeline[] =>[
{
  "id": "0000-0000-0123",
  "name": "流水线1",
  "component_id": "a4f44f30-43e3-4e42-8167-373e2f8da001",
  "service_tree": "app/push-server",
  "created_at": "2025-07-15 10:30",
  "updated_at": "2025-07-15 10:30",
  "pipeline_stages": [{
        "id": "000-0000-0000",
        "group_id": "xxxx-xxx-xxxx-xxxx-xxxxx01",
        "group_name": "构建",
        "group_order": 1,
        "stage_type": "build",
        "stage_name": "构建任务",
        "stage_order": 1,
        "pipeline_id": "0000-0000-0123",
        "created_at": "2025-07-15 10:30",
        "updated_at": "2025-07-15 10:30",
        "pipeline_jobs" :{
            "id": "000-0000-0000-1111",
            "pipeline_id": "0000-0000-0123",
            "stage_id": "000-0000-0000",
            "parameters": "go build",
            "status": "success",
            "created_at": "2025-07-15 10:30",
            "updated_at": "2025-07-15 10:30",
        }
    },{
        "id": "000-0000-0001",
        "group_id": "xxxx-xxx-xxxx-xxxx-xxxxx01",
        "group_name": "构建",
        "group_order": 1,
        "stage_type": "build",
        "stage_name": "静态检查",
        "stage_order": 2,
        "pipeline_id": "0000-0000-0123",
        "created_at": "2025-07-15 10:30",
        "updated_at": "2025-07-15 10:30",
        "pipeline_jobs" :{
            "id": "000-0000-0000-1112",
            "pipeline_id": "0000-0000-0123",
            "stage_id": "000-0000-0001",
            "parameters": "go build",
            "status": "success",
            "created_at": "2025-07-15 10:30",
            "updated_at": "2025-07-15 10:30",
        }
      },{
        "id": "000-0000-0003",
        "group_id": "xxxx-xxx-xxxx-xxxx-xxxxx02",
        "group_name": "卡点",
        "group_order": 2,
        "stage_type": "checkpoint",
        "stage_name": "人工卡点",
        "stage_order": 1,
        "pipeline_id": "0000-0000-0123",
        "created_at": "2025-07-15 10:30",
        "updated_at": "2025-07-15 10:30",
        "pipeline_jobs" :{
            "id": "000-0000-0000-1114",
            "pipeline_id": "0000-0000-0123",
            "stage_id": "000-0000-0003",
            "parameters": "kakakaka",
            "status": "success",
            "created_at": "2025-07-15 10:30",
            "updated_at": "2025-07-15 10:30",
        }
      },{
        "id": "000-0000-0004",
        "group_id": "xxxx-xxx-xxxx-xxxx-xxxxx03",
        "group_name": "部署",
        "group_order": 3,
        "stage_type": "deploy",
        "stage_name": "部署环境",
        "stage_order": 1,
        "pipeline_id": "0000-0000-0123",
        "created_at": "2025-07-15 10:30",
        "updated_at": "2025-07-15 10:30",
        "pipeline_jobs" :{
            "id": "000-0000-0000-1115",
            "pipeline_id": "0000-0000-0123",
            "stage_id": "000-0000-0004",
            "parameters": "go deploy",
            "status": "failed",
            "created_at": "2025-07-15 10:30",
            "updated_at": "2025-07-15 10:30",
        }
      },{
        "id": "000-0000-0006",
        "group_id": "xxxx-xxx-xxxx-xxxx-xxxxx04",
        "group_name": "测试",
        "group_order": 4,
        "stage_type": "test",
        "stage_name": "测试任务",
        "stage_order": 1,
        "pipeline_id": "0000-0000-0123",
        "created_at": "2025-07-15 10:30",
        "updated_at": "2025-07-15 10:30",
        "pipeline_jobs" :{
            "id": "000-0000-0000-1117",
            "pipeline_id": "0000-0000-0123",
            "stage_id": "000-0000-0006",
            "parameters": "go test",
            "status": "pending",
            "created_at": "2025-07-15 10:30",
            "updated_at": "2025-07-15 10:30",
        }
      },
    ]}
    ]



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