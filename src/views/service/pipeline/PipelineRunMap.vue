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
                  <span class="sub-step-status" :class="getStatusClass(subStage.pipeline_job?.status, index)">
                    <el-icon v-if="subStage.pipeline_job?.status === 'success'">
                      <Check className="sub-step-icon" />
                    </el-icon>
                    <el-icon v-else-if="subStage.pipeline_job?.status === 'failed'">
                      <Close className="sub-step-icon" />
                    </el-icon>
                    <el-icon v-else-if="subStage.pipeline_job?.status === 'processing'">
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
import { computed, ref, defineProps, defineEmits } from 'vue';
import { Check, Close, Loading, CirclePlus, Refresh } from '@element-plus/icons-vue';
import { Pipeline_stages, Pipeline_job, Pipeline } from '@/types/pipeline';
import axios from '@/utils/axios';
import { ElMessage } from 'element-plus';

const props = defineProps<{
  pipelineStages: Pipeline_stages[];
}>();

const emit = defineEmits<{
  'update:pipelineStages': [stages: Pipeline_stages[]];
}>();

const pipelineStages = computed(() => props.pipelineStages);
const isRefreshing = ref(false);

const spaceSize = computed(() => {
  const screenWidth = window.innerWidth;
  if (screenWidth < 768) return 40;
  if (screenWidth < 1024) return 80;
  return 160;
});

const sortedStageGroups = computed(() => {
  const sortedByGroup = [...pipelineStages.value].sort((a, b) => (a.stage_group_order ?? 0) - (b.stage_group_order ?? 0));

  const groupsMap = sortedByGroup.reduce((acc, stage) => {
    if (stage.stage_group_id && !acc[stage.stage_group_id]) {
      acc[stage.stage_group_id] = { 
        ...stage,
        stages: [] as Pipeline_stages[]
      };
    }
    if (stage.stage_group_id) {
      acc[stage.stage_group_id].stages.push(stage);
    }
    return acc;
  }, {} as Record<string, Pipeline_stages & { stages: Pipeline_stages[] }>);

  Object.values(groupsMap).forEach(group => {
    group.stages.sort((a, b) => (a.stage_order ?? 0) - (b.stage_order ?? 0));
  });

  return Object.values(groupsMap);
});

// 基于实际状态计算当前活动步骤，而不是通过按钮控制
const activeStep = computed(() => {
  if (sortedStageGroups.value.length === 0) return 0;
  
  // 检查是否所有步骤都已完成
  const allGroupsCompleted = sortedStageGroups.value.every(group => {
    return group.stages.every(stage => stage.pipeline_job?.status === 'success');
  });
  
  if (allGroupsCompleted) {
    return sortedStageGroups.value.length + 1; // 所有步骤完成，显示最后一步
  }
  
  // 寻找当前正在处理的步骤或第一个未完成的步骤
  for (let i = 0; i < sortedStageGroups.value.length; i++) {
    const group = sortedStageGroups.value[i];
    
    // 检查是否有失败的步骤
    const hasFailed = group.stages.some(stage => stage.pipeline_job?.status === 'failed');
    if (hasFailed) {
      return i + 1; // 显示失败的步骤
    }
    
    // 检查是否有正在处理的步骤
    const hasRunning = group.stages.some(stage => stage.pipeline_job?.status === 'processing');
    if (hasRunning) {
      return i + 1; // 显示正在处理的步骤
    }
    
    // 检查是否有未完成的步骤
    const allCompleted = group.stages.every(stage => stage.pipeline_job?.status === 'success');
    if (!allCompleted) {
      return i + 1; // 显示第一个未完成的步骤
    }
  }
  
  return 0; // 默认返回第一步
});

const pipelineId = computed<string | null>(() => {
  if (!pipelineStages.value || pipelineStages.value.length === 0) return null;
  return pipelineStages.value[0].pipeline_id ?? null;
});

const refreshPipelineData = async () => {
  if (!pipelineId.value) {
    ElMessage.error('无法刷新：未找到流水线ID');
    return;
  }

  isRefreshing.value = true;

  try {
    const response = await axios.get<Pipeline>(`/api/pipeline/${pipelineId.value}`);
    
    if (!response.data || !response.data.pipeline_stages) {
      throw new Error('获取流水线数据失败：返回数据格式不正确');
    }
    
    emit('update:pipelineStages', response.data.pipeline_stages);
    
    ElMessage.success('流水线数据刷新成功');
  } catch (error) {
    console.error('刷新流水线数据失败:', error);
    ElMessage.error(`刷新失败：${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    isRefreshing.value = false;
  }
};

const startStep = computed(() => {
  if (sortedStageGroups.value.length === 0) {
    return {
      title: '准备中',
      status: 'wait'
    };
  }
  
  // 检查是否有任何步骤已开始
  const hasStarted = sortedStageGroups.value.some(group => 
    group.stages.some(stage => 
      stage.pipeline_job?.status === 'success' || stage.pipeline_job?.status === 'processing' || stage.pipeline_job?.status === 'failed'
    )
  );
  
  const status = hasStarted ? 'success' : 'wait';
  return {
    title: '开始',
    status
  };
});

const endStep = computed(() => {
  if (sortedStageGroups.value.length === 0) {
    return {
      title: '完成',
      status: 'wait'
    };
  }
  
  // 检查是否所有步骤都已完成
  const allCompleted = sortedStageGroups.value.every(group => 
    group.stages.every(stage => stage.pipeline_job?.status === 'success')
  );
  
  const status = allCompleted ? 'success' : 'wait';
  
  return {
    title: '完成',
    status
  };
});

const getStepTitle = (group: Pipeline_stages & { stages: Pipeline_stages[] }) => {
  return group.stage_group_name || '未命名阶段';
};

const getStepStatus = (group: Pipeline_stages & { stages: Pipeline_stages[] }, index: number) => {
  const stepIndex = index + 1;
  const totalSteps = sortedStageGroups.value.length + 2;
  
  if (activeStep.value > stepIndex) {
    return 'success';
  }
  
  if (activeStep.value === stepIndex) {
    return 'process';
  }
  
  if (activeStep.value >= totalSteps) {
    return 'success';
  }
  
  if (!group.stages || group.stages.length === 0) {
    return 'wait';
  }
  
  const hasFailed = group.stages.some(stage => stage.pipeline_job?.status === 'failed');
  if (hasFailed) {
    return 'error';
  }
  
  const hasRunning = group.stages.some(stage => stage.pipeline_job?.status === 'processing');
  if (hasRunning) {
    return 'process';
  }
  
  const allSuccess = group.stages.every(stage => stage.pipeline_job?.status === 'success');
  if (allSuccess) {
    return 'success';
  }
  
  return 'wait';
};

const getStepDescription = (group: Pipeline_stages & { stages: Pipeline_stages[] }, index: number) => {
  const status = getStepStatus(group, index);
  const statusTextMap: Record<string, string> = {
    'success': '已完成',
    'error': '已失败',
    'process': '运行中',
    'wait': '未运行'
  };
  
  return statusTextMap[status] || '未知状态';
};

const getStatusClass = (status?: string, groupIndex?: number) => {
  if (groupIndex !== undefined) {
    const stepIndex = groupIndex + 1;
    
    if (activeStep.value > stepIndex) {
      return 'status-success';
    }
    
    if (activeStep.value < stepIndex) {
      return 'status-wait';
    }
    const group = sortedStageGroups.value[groupIndex];
    if (group && group.stages && group.stages.length > 0) {
      const allSuccess = group.stages.every(stage => stage.pipeline_job?.status === 'success');
      if (allSuccess) {
        return 'status-success';
      }
      
      const hasFailed = group.stages.some(stage => stage.pipeline_job?.status === 'failed');
      if (hasFailed) {
        return 'status-failed';
      }
    }
  }
  
  const statusMap: Record<string, string> = {
    'success': 'status-success',
    'failed': 'status-failed',
    'processing': 'status-processing',
    'wait': 'status-wait'
  };
  return statusMap[status || 'wait'] || 'status-wait';
};
</script>

<style scoped>
.pipeline-run-map-container {
  padding: 20px;
  width: 100%;
  max-width: none;
  margin: 0;
}

.steps-container {
  margin: 60px 0;
  padding: 0 20px;
  width: 100%;
  justify-content: center;
  align-items: center;
}

.sub-steps-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  min-width: 150px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}
.pipeline-header {
  margin-bottom: 30px;
}

.pipeline-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.pipeline-info {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #666;
}

.steps-container {
  margin: 60px 0;
  padding: 0 20px;
}

.sub-steps-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  min-width: 150px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.el-step {
  position: relative;
}

.sub-step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  padding: 2px 0;
  transition: all 0.3s ease;
}

.status-success .sub-step-name {
  color: #67c23a;
  font-weight: 500;
}

.status-wait .sub-step-name {
  color: #c0c4cc;
  opacity: 0.7;
}

.sub-step-item:hover {
  transform: translateX(2px);
}
.sub-step-name {
  word-break: keep-all;
}

.sub-step-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #fff;
  border: 1px solid;
  transition: all 0.3s ease;
}

.sub-step-icon {
  width: 12px;
  height: 12px;
}

.status-success {
  color: #67c23a;
}

.status-failed {
  color: #f56c6c;
}

.status-processing {
  color: #409eff;
}

.status-wait {
  color: #c0c4cc;
}

.sub-step-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #fff;
  border: 1px solid;
  transition: all 0.3s ease;
}

.status-success .sub-step-status {
  color: #67c23a;
  border-color: #67c23a;
  background-color: #f0f9eb;
}

.status-failed .sub-step-status {
  color: #f56c6c;
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.status-processing .sub-step-status {
  color: #409eff;
  border-color: #409eff;
  background-color: #ecf5ff;
}

.status-wait .sub-step-status {
  color: #c0c4cc;
  border-color: #c0c4cc;
  background-color: #f4f4f5;
}

.sub-step-icon {
  width: 12px;
  height: 12px;
  animation: icon-appear 0.3s ease;
}

@keyframes icon-appear {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .pipeline-info {
    flex-direction: column;
    gap: 5px;
  }
  
  .steps-container {
    margin: 20px 0;
  }
}
</style>