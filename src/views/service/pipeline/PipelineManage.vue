<template>
  <el-card class="pipeline-orchestration-container">
    <template #header>
      <el-button v-if="!isCreatePipeline" type="primary" icon="Plus" @click="enterCreateMode">创建流水线</el-button>
    </template>

    <div v-if="!isCreatePipeline">
      <div>
        <el-skeleton v-if="loading" :rows="5" border stripe class="table-skeleton"></el-skeleton>
        <el-alert v-else-if="error" type="error" description="获取流水线列表失败，请重试" show-icon></el-alert>
        <el-empty v-else-if="pipelineList.length === 0" description="暂无流水线数据"></el-empty>

        <el-row v-else class="layout-container">
          <el-col :span="6" class="left-panel">
              <el-tree-v2
                :data="pipelineTreeData"
                :props="treeProps"
                node-key="id"
                @node-click="handlePipelineNodeClick"
              />
          </el-col>

          <!-- 右侧任务管理区域 -->
          <el-col :span="18" class="right-panel">
            <el-table v-if="selectedPipeline" :data="[selectedPipeline]" border stripe>
              <el-table-column prop="name" label="流水线名称" width="180"></el-table-column>
              <el-table-column prop="pipeline_group" label="流水线分组" width="180"></el-table-column>
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
                  <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="请选择流水线"></el-empty>
          </el-col>
        </el-row>

        <div class="pipeline-run-container">
          <PipelineMap 
            v-if="selectedPipelineId && pipelineList.length > 0"
            :pipeline-stages="pipelineList.find(p => p.id === selectedPipelineId)?.pipeline_stages ?? []"
          />
          <el-empty v-else description="请选择流水线以查看运行状态"></el-empty>
        </div>
      </div>
    </div>

    <el-drawer 
      v-model="isCreatePipeline"
      direction="rtl"
      title="创建流水线"
      size="80%"
    >
      <PipelineCreate
        :component-id="componentId || ''"
        :service-tree="serviceTree || ''"
        @cancel="isCreatePipeline = false"
        @success="handlePipelineCreated" 
      />
    </el-drawer>
  </el-card>
</template>

<script setup lang="ts">
import axios from '@/utils/axios';
import { ref, onMounted, watch, computed, reactive, toRefs } from 'vue';  
import { ElMessage } from 'element-plus';
import { useRoute } from 'vue-router';

import PipelineCreate from './PipelineCreate.vue';
//import PipelineMap from './PipelineMap.vue';
import PipelineMap from './PipelineRunMap.vue';

import { Pipeline } from '@/types/pipeline';

const state = reactive({
  pipelineDetail: null as Pipeline | null,
});

const { pipelineDetail } = toRefs(state);

const pipelineList = ref<Pipeline[]>([]);
const loading = ref(false);
const error = ref('');
const router = useRoute();
const componentId = ref<string | undefined>(undefined);
const serviceTree = ref<string | undefined>(undefined);
const selectedPipelineId = ref<string | undefined>(undefined);
const isCreatePipeline = ref(false);

// 树形结构的props配置
const treeProps = {
  value: 'id',
  label: 'label',
  children: 'children',
};

// 将pipelineList转换为树形结构数据
const pipelineTreeData = computed(() => {
  if (!pipelineList.value.length) return [];
  
  // 按pipeline_group分组
  const groups: Record<string, Pipeline[]> = {};
  pipelineList.value.forEach(pipeline => {
    const groupName = pipeline.pipeline_group || '未分组';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(pipeline);
  });
  
  // 转换为树形结构
  return Object.entries(groups).map(([groupName, pipelines]) => ({
    id: `group-${groupName}`,
    label: `${groupName} (${pipelines.length})`,
    isGroup: true,
    children: pipelines.map(pipeline => ({
      id: pipeline.id,
      label: pipeline.name,
      pipeline: pipeline
    }))
  }));
});

const selectedPipeline = computed(() => {
  return pipelineList.value.find(p => p.id === selectedPipelineId.value);
});

const handleApiError = (error: any, defaultData: any[], message: string) => {
  ElMessage.warning(`${message}，已加载默认数据`);
  error.value = message;
  return defaultData;
};

const enterCreateMode = () => {
  isCreatePipeline.value = true;
};

const handleEdit = (pipeline: Pipeline) => {
  try {
    axios.put(`/pipeline/edit/${pipeline.id}`, pipeline).then(res => {
      ElMessage.success('流水线编辑成功');
    }).catch(err => {
      ElMessage.error('流水线编辑失败');
    });
  } catch (error) {
    ElMessage.error('流水线编辑失败');
  }
};

const handleRun = async (pipeline: Pipeline) => {
  try {
    const response = await axios.post(`/api/pipeline/${pipeline.id}/job`, pipeline);
    
    // Show success message
    ElMessage.success('流水线已开始运行');
    
  } catch (error) {
    console.error('运行流水线失败:', error);
    ElMessage.error('运行流水线失败，请重试');
  }
};

// 处理节点点击事件
const handlePipelineNodeClick = (data: any) => {
  // 安全地检查属性是否存在
  if (data && typeof data === 'object' && !data.isGroup && data.pipeline && data.pipeline.id) {
    selectedPipelineId.value = data.pipeline.id;
  }
};

const handlePipelineCreated = async () => {
  isCreatePipeline.value = false;
  ElMessage.success('流水线创建成功');
  if (componentId.value) {
    pipelineList.value = await fetchPipelines(componentId.value);
  }
};

const fetchPipelines = async (componentId: string) => {
  try {
    loading.value = true;
    const response = await axios.get<Pipeline>(`/api/component/${componentId}/pipelines`);
    pipelineDetail.value = response.data;
    return Array.isArray(pipelineDetail.value) ? pipelineDetail.value : generateDefaultPipeline();
  } catch (err) {
    const defaultData = handleApiError(err, generateDefaultPipeline(), '获取流水线列表失败');
    return defaultData;
  } finally {
    loading.value = false;
  }
};

const handleDelete = async (pipeline: Pipeline) => {
  try {
    await axios.delete(`/api/pipeline/${pipeline.id}`);
    ElMessage.success('流水线删除成功');
    if (componentId.value) {
      pipelineList.value = await fetchPipelines(componentId.value);
    }
  } catch (err) {
    ElMessage.error('流水线删除失败');
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

const generateDefaultPipeline = (): Pipeline[] => [
  {
    "id": "0000-0000-0123",
    "name": "流水线1",
    "pipeline_group": "未分组",
    "component_id": "a4f44f30-43e3-4e42-8167-373e2f8da001",
    "service_tree": "app/push-server",
    "created_at": "2025-07-15 10:30",
    "updated_at": "2025-07-15 10:30",
    "pipeline_stages": [{
          "id": "000-0000-0000",
          "stage_group_id": "xxxx-xxx-xxxx-xxxx-xxxxx01",
          "stage_group_name": "构建",
          "stage_group_order": 1,
          "stage_type": "build",
          "stage_name": "构建任务",
          "parallel": false,
          "stage_order": 1,
          "pipeline_id": "0000-0000-0123",
          "created_at": "2025-07-15 10:30",
          "updated_at": "2025-07-15 10:30",
          "parameters": '',
      },{
          "id": "000-0000-0001",
          "stage_group_id": "xxxx-xxx-xxxx-xxxx-xxxxx01",
          "stage_group_name": "构建",
          "stage_group_order": 1,
          "stage_type": "build",
          "stage_name": "静态检查",
          "parallel": false,
          "stage_order": 2,
          "pipeline_id": "0000-0000-0123",
          "created_at": "2025-07-15 10:30",
          "updated_at": "2025-07-15 10:30",
          "parameters": '',
        },{
          "id": "000-0000-0003",
          "stage_group_id": "xxxx-xxx-xxxx-xxxx-xxxxx02",
          "stage_group_name": "卡点",
          "stage_group_order": 2,
          "stage_type": "checkpoint",
          "stage_name": "人工卡点",
          "parallel": false,
          "stage_order": 1,
          "pipeline_id": "0000-0000-0123",
          "created_at": "2025-07-15 10:30",
          "updated_at": "2025-07-15 10:30",
          "parameters": '',
        },{
          "id": "000-0000-0004",
          "stage_group_id": "xxxx-xxx-xxxx-xxxx-xxxxx03",
          "stage_group_name": "部署",
          "stage_group_order": 3,
          "stage_type": "deploy",
          "stage_name": "部署环境",
          "parallel": false,
          "stage_order": 1,
          "pipeline_id": "0000-0000-0123",
          "created_at": "2025-07-15 10:30",
          "updated_at": "2025-07-15 10:30",
          "parameters": '',
        },{
          "id": "000-0000-0006",
          "stage_group_id": "xxxx-xxx-xxxx-xxxx-xxxxx04",
          "stage_group_name": "测试",
          "stage_group_order": 4,
          "stage_type": "test",
          "stage_name": "测试任务",
          "parallel": false,
          "stage_order": 1,
          "pipeline_id": "0000-0000-0123",
          "created_at": "2025-07-15 10:30",
          "updated_at": "2025-07-15 10:30",
          "parameters": '',
        },
      ]}
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
  display: flex;
  align-items: center;
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
