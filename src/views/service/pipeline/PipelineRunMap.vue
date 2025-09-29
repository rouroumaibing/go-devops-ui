<template>
  <div class="pipeline-run-map-container">
    <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
      <el-button 
          :loading="isRefreshing"
          @click="refreshPipelineData"
          :icon="Refresh"
          :disabled="!pipelineId || isRefreshing"
      >
      </el-button>
    </div>
    
    <div class="steps-container">
      <el-steps 
        :active="activeStep"
        align-center 
        direction="horizontal" 
        :space="spaceSize"
        finish-status="success"
      >
        <el-step 
          :title="startStep.title"
          :status="startStep.status"
        />
        
        <template v-for="(group, index) in sortedStageGroups" :key="group.stage_group_id || index">
          <el-step 
            :title="getStepTitle(group)"
            :description="getStepDescription(group, index)"
            :status="getStepStatus(group, index)"
          >
            <template #description>
              <div v-if="group.stages && group.stages.length > 0" class="sub-steps-container">
                <div v-for="subStage in group.stages" :key="subStage.id" class="sub-step-item">
                  <!-- 修改状态获取方式 -->
                  <span class="sub-step-status" :class="getSubStageStatusClass(group, subStage, index)">
                    <el-icon v-if="getSubStageStatus(group, subStage) === 'success'">
                      <Check className="sub-step-icon" />
                    </el-icon>
                    <el-icon v-else-if="getSubStageStatus(group, subStage) === 'failed'">
                      <Close className="sub-step-icon" />
                    </el-icon>
                    <el-icon v-else-if="getSubStageStatus(group, subStage) === 'processing'">
                      <Loading className="sub-step-icon" />
                    </el-icon>
                    <el-icon v-else>
                      <CirclePlus className="sub-step-icon" />
                    </el-icon>
                  </span>
                  <span class="sub-step-name">{{ subStage.stage_name }}</span>
                </div>
              </div>
            </template>
          </el-step>
        </template>
        
        <el-step 
          :title="endStep.title"
          :status="endStep.status"
        />
      </el-steps>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, defineProps, defineEmits, onMounted } from 'vue';
import { Check, Close, Loading, CirclePlus, Refresh } from '@element-plus/icons-vue';
import { Pipeline_stages, Pipeline, PipelineStageGroupJobs, PipelineStageJobs } from '@/types/pipeline';
import axios from '@/utils/axios';
import { ElMessage } from 'element-plus';

// 更新props定义
const props = defineProps<{
  pipelineStages: Pipeline_stages[];
  pipeline?: Pipeline;
}>();

const emit = defineEmits<{
  'update:pipelineStages': [stages: Pipeline_stages[]];
}>();

// 辅助计算属性和变量
const pipelineStages = computed(() => props.pipelineStages);
const isRefreshing = ref(false);
const pipelineJobs = ref<PipelineStageGroupJobs[]>([]);

// 获取pipeline_id
const pipelineId = computed<string | null>(() => {
  if (!pipelineStages.value || pipelineStages.value.length === 0) return null;
  return pipelineStages.value[0].pipeline_id ?? null;
});

// 根据屏幕宽度调整步骤间距
const spaceSize = computed(() => {
  const screenWidth = window.innerWidth;
  if (screenWidth < 768) return 40;
  if (screenWidth < 1024) return 80;
  return 160;
});

// 从API获取的pipeline stage group jobs数据
const pipelineStageGroupJobs = computed(() => {
  return pipelineJobs.value;
});

// 处理和排序stage groups
const sortedStageGroups = computed(() => {
  const sortedByGroup = [...pipelineStages.value].sort((a, b) => (a.stage_group_order ?? 0) - (b.stage_group_order ?? 0));

  const groupsMap = sortedByGroup.reduce((acc, stage) => {
    if (stage.stage_group_id && !acc[stage.stage_group_id]) {
      acc[stage.stage_group_id] = {
        ...stage,
        stages: [] as Pipeline_stages[],
        pipeline_stage_group_job: pipelineStageGroupJobs.value.find(job => job.stage_group_id === stage.stage_group_id)
      };
    }
    if (stage.stage_group_id) {
      acc[stage.stage_group_id].stages.push(stage);
    }
    return acc;
  }, {} as Record<string, Pipeline_stages & {
    stages: Pipeline_stages[];
    pipeline_stage_group_job?: PipelineStageGroupJobs;
  }>);

  Object.values(groupsMap).forEach(group => {
    group.stages.sort((a, b) => (a.stage_order ?? 0) - (b.stage_order ?? 0));
  });

  return Object.values(groupsMap);
});

// 计算当前活动步骤
const activeStep = computed(() => {
  if (sortedStageGroups.value.length === 0) return 0;
  
  // 检查是否所有步骤都已完成
  const allGroupsCompleted = sortedStageGroups.value.every(group => {
    return group.pipeline_stage_group_job?.status === 'success';
  });
  
  if (allGroupsCompleted) {
    return sortedStageGroups.value.length + 1; // 所有步骤完成，显示最后一步
  }
  
  // 寻找当前正在处理的步骤或第一个未完成的步骤
  for (let i = 0; i < sortedStageGroups.value.length; i++) {
    const group = sortedStageGroups.value[i];
    
    // 检查是否有失败的步骤
    if (group.pipeline_stage_group_job?.status === 'failed') {
      return i + 1; // 显示失败的步骤
    }
    
    // 检查是否有正在处理的步骤
    if (group.pipeline_stage_group_job?.status === 'processing') {
      return i + 1; // 显示正在处理的步骤
    }
    
    // 检查是否有未完成的步骤
    if (group.pipeline_stage_group_job?.status !== 'success') {
      return i + 1; // 显示第一个未完成的步骤
    }
  }
  
  return 0; // 默认返回第一步
});

// 获取开始步骤信息
const startStep = computed(() => {
  if (sortedStageGroups.value.length === 0) {
    return {
      title: '准备中',
      status: 'init'
    };
  }
  
  // 检查是否有任何步骤已开始
  const hasStarted = sortedStageGroups.value.some(group => 
    group.pipeline_stage_group_job?.status && 
    (group.pipeline_stage_group_job.status === 'success' || 
     group.pipeline_stage_group_job.status === 'processing' || 
     group.pipeline_stage_group_job.status === 'failed')
  );
  
  const status = hasStarted ? 'success' : 'wait';
  return {
    title: '开始',
    status
  };
});

// 获取结束步骤信息
const endStep = computed(() => {
  if (sortedStageGroups.value.length === 0) {
    return {
      title: '完成',
      status: 'init'
    };
  }
  
  // 检查是否所有步骤都已完成
  const allCompleted = sortedStageGroups.value.every(group => 
    group.pipeline_stage_group_job?.status === 'success'
  );
  
  const status = allCompleted ? 'success' : 'wait';
  
  return {
    title: '完成',
    status
  };
});

// 获取流水线job数据
const fetchPipelineJobs = async () => {
  if (!pipelineId.value) {
    return;
  }

  try {
    const response = await axios.get<PipelineStageGroupJobs[]>(`/api/pipeline/${pipelineId.value}/jobs`);
    pipelineJobs.value = response.data || [];
  } catch (error) {
    console.error('获取流水线job数据失败:', error);
  }
};

// 刷新流水线数据
const refreshPipelineData = async () => {
  if (!pipelineId.value) {
    ElMessage.error('无法刷新：未找到流水线ID');
    return;
  }

  isRefreshing.value = true;

  try {
    const pipelinePromise = axios.get<Pipeline>(`/api/pipeline/${pipelineId.value}`);
    const jobsPromise = fetchPipelineJobs();
    
    // 并行获取数据
    const pipelineResponse = await pipelinePromise;
    await jobsPromise;
    
    if (!pipelineResponse.data || !pipelineResponse.data.pipeline_stages) {
      throw new Error('获取流水线数据失败：返回数据格式不正确');
    }
    
    emit('update:pipelineStages', pipelineResponse.data.pipeline_stages);
    
    ElMessage.success('流水线数据刷新成功');
  } catch (error) {
    console.error('刷新流水线数据失败:', error);
    ElMessage.error(`刷新失败：${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    isRefreshing.value = false;
  }
};

// 组件挂载时获取job数据
onMounted(() => {
  if (pipelineId.value) {
    fetchPipelineJobs();
  }
});

// 获取步骤标题
const getStepTitle = (group: Pipeline_stages & {
  stages: Pipeline_stages[];
  pipeline_stage_group_job?: PipelineStageGroupJobs;
}) => {
  return group.stage_group_name || '未命名阶段';
};

// 获取步骤状态
const getStepStatus = (group: Pipeline_stages & {
  stages: Pipeline_stages[];
  pipeline_stage_group_job?: PipelineStageGroupJobs;
}, index: number) => {
  const stepIndex = index + 1;
  const totalSteps = sortedStageGroups.value.length + 2;
  
  if (!group.pipeline_stage_group_job) {
    return 'init';
  }
  
  // 优先根据任务组的实际状态来决定
  switch (group.pipeline_stage_group_job.status) {
    case 'failed':
      return 'error';
    case 'processing':
      return 'process';
    case 'success':
      return 'success';
    default:
      return 'init';
  }
};

// 获取子步骤状态
const getSubStageStatus = (group: Pipeline_stages & {
  stages: Pipeline_stages[];
  pipeline_stage_group_job?: PipelineStageGroupJobs;
}, subStage: Pipeline_stages) => {
  // 根据pipeline_stage_group_job中的pipeline_stage_jobs查找对应的状态
  if (!group.pipeline_stage_group_job?.pipeline_stage_jobs) {
    return 'init';
  }
  
  // 尝试通过名称匹配对应的stage job
  const matchedJob = group.pipeline_stage_group_job.pipeline_stage_jobs.find(job => 
    job.name === subStage.stage_name || job.name.includes(subStage.stage_name || '')
  );
  
  return matchedJob?.status || 'init';
};

// 获取步骤描述
const getStepDescription = (group: Pipeline_stages & {
  stages: Pipeline_stages[];
  pipeline_stage_group_job?: PipelineStageGroupJobs;
}, index: number) => {
  const status = getStepStatus(group, index);
  const statusTextMap: Record<string, string> = {
    'success': '已完成',
    'error': '已失败',
    'process': '运行中',
    'init': '未运行'
  };
  
  return statusTextMap[status] || '未知状态';
};

// 获取子步骤状态对应的CSS类
const getSubStageStatusClass = (group: Pipeline_stages & {
  stages: Pipeline_stages[];
  pipeline_stage_group_job?: PipelineStageGroupJobs;
}, subStage: Pipeline_stages, groupIndex: number) => {
  const stepIndex = groupIndex + 1;
  
  // 根据步骤位置确定基本状态
  if (activeStep.value > stepIndex) {
    return 'status-success';
  }
  
  if (activeStep.value < stepIndex) {
    return 'status-init';
  }
  
  // 获取子步骤的实际状态
  const status = getSubStageStatus(group, subStage);
  
  const statusMap: Record<string, string> = {
    'success': 'status-success',
    'failed': 'status-failed',
    'processing': 'status-processing',
    'init': 'status-init'
  };
  
  return statusMap[status] || 'status-init';
};
</script>

<style scoped>
.pipeline-run-map-container {
  padding: 20px;
}

.steps-container {
  min-height: 200px;
}

.sub-steps-container {
  margin-top: 10px;
}

.sub-step-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding-left: 10px;
}

.sub-step-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: 8px;
  border-radius: 50%;
  background-color: #f0f0f0;
}

.sub-step-icon {
  width: 14px;
  height: 14px;
}

.sub-step-name {
  font-size: 12px;
  color: #666;
}

.status-success {
  background-color: #f0f9eb;
  color: #67c23a;
}

.status-failed {
  background-color: #fef0f0;
  color: #f56c6c;
}

.status-processing {
  background-color: #f0f9eb;
  color: #67c23a;
  animation: pulse 1.5s infinite;
}

.status-init {
  background-color: #f5f7fa;
  color: #909399;
}

/* 为processing状态添加动态效果 */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .pipeline-run-map-container {
    padding: 10px;
  }
  
  .sub-step-item {
    padding-left: 5px;
  }
  
  .sub-step-name {
    font-size: 11px;
  }
}
</style>
