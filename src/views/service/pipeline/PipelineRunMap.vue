<template>
  <div class="pipeline-view">
    <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
      <el-button 
          :loading="isRefreshing"
          @click="refreshPipelineData"
          :icon="Refresh"
          :disabled="!pipelineId || isRefreshing"
      >
      </el-button>
    </div>

    <!-- 状态图例 -->
    <div class="legend-wrapper">
      <div class="legend">
        <div class="legend-item">
          <div class="status-dot status-wait"></div>
          <span>初始</span>
        </div>
        <div class="legend-item">
          <div class="status-dot status-processing"></div>
          <span>待执行</span>
        </div>
        <div class="legend-item">
          <div class="status-dot status-success"></div>
          <span>成功</span>
        </div>
        <div class="legend-item">
          <div class="status-dot status-failed"></div>
          <span>失败</span>
        </div>
      </div>
    </div>

    <!-- 流水线内容区域 -->
    <div class="pipeline-content">
      <div class="stages-container">
        <!-- 流水线阶段 -->
        <div 
          v-for="(group, index) in sortedStageGroups" 
          :key="group.stage_group_id || index"
          class="stage-wrapper"
        >
          <!-- 阶段头部 -->
          <div class="stage-header">
            <div class="stage-number" :class="getStageStatusClass(group)">
              {{ index + 1 }}
            </div>
            <div class="stage-title">
              {{ group.stage_group_name }}
            </div>
          </div>
          
          <!-- 子阶段列表 -->
          <div class="sub-stages">
            <div 
              v-for="(subStage, subIndex) in group.stages" 
              :key="subStage.id" 
              class="sub-stage"
            >
              <div class="sub-stage-dot" :class="getSubStageStatusClass(group, subStage)">
                {{ subIndex + 1 }}
              </div>
              <div class="sub-stage-name">{{ subStage.stage_name }}</div>
            </div>
          </div>
        </div>
        
        <!-- 连接线 -->
        <div class="connection-lines"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, defineProps, defineEmits, onMounted } from 'vue';
import { Check, Close, Loading, Refresh } from '@element-plus/icons-vue';
import { Pipeline_stages, Pipeline, PipelineStageGroupJobs, PipelineStageJobs } from '@/types/pipeline';
import axios from '@/utils/axios';
import { ElMessage } from 'element-plus';

// Props定义
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

// 从API获取的pipeline stage group jobs数据
const pipelineStageGroupJobs = computed(() => {
  return Array.isArray(pipelineJobs.value) ? pipelineJobs.value : [];
});

// 处理和排序stage groups
const sortedStageGroups = computed(() => {
  // 确保pipelineStages.value是数组
  if (!Array.isArray(pipelineStages.value)) {
    return [];
  }
  
  // 1. 先按stage_group_order对Pipeline_stages进行排序
  const sortedByGroup = [...pipelineStages.value].sort((a, b) => (a.stage_group_order ?? 0) - (b.stage_group_order ?? 0));

  // 2. 创建分组映射，处理顺序逻辑
  const groupsMap = sortedByGroup.reduce((acc, stage) => {
    if (stage.stage_group_id && !acc[stage.stage_group_id]) {
      acc[stage.stage_group_id] = {
        ...stage,
        stages: [] as Pipeline_stages[],
        pipeline_stage_group_job: undefined
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
  
  // 3. 为每个分组添加对应的状态信息
  if (Array.isArray(pipelineStageGroupJobs.value)) {
    Object.keys(groupsMap).forEach(groupId => {
      const matchingJob = pipelineStageGroupJobs.value.find(job => job.stage_group_id === groupId);
      if (matchingJob) {
        groupsMap[groupId].pipeline_stage_group_job = matchingJob;
      }
    });
  }
  
  // 4. 对每个组内的stages按stage_order排序
  Object.values(groupsMap).forEach(group => {
    group.stages.sort((a, b) => (a.stage_order ?? 0) - (b.stage_order ?? 0));
  });

  return Object.values(groupsMap);
});

// 获取阶段状态
const getStageStatus = (group: Pipeline_stages & {
  stages: Pipeline_stages[];
  pipeline_stage_group_job?: PipelineStageGroupJobs;
}) => {
  if (!group.pipeline_stage_group_job || !group.pipeline_stage_group_job.status) {
    return 'wait';
  }
  return group.pipeline_stage_group_job.status;
};

// 获取阶段状态对应的CSS类
const getStageStatusClass = (group: Pipeline_stages & {
  stages: Pipeline_stages[];
  pipeline_stage_group_job?: PipelineStageGroupJobs;
}) => {
  const status = getStageStatus(group);
  return `status-${status}`;
};

// 获取子阶段状态
const getSubStageStatus = (group: Pipeline_stages & {
  stages: Pipeline_stages[];
  pipeline_stage_group_job?: PipelineStageGroupJobs;
}, subStage: Pipeline_stages) => {
  if (!group.pipeline_stage_group_job?.pipeline_stage_jobs) {
    return 'wait';
  }
  
  const matchedJob = group.pipeline_stage_group_job.pipeline_stage_jobs.find(job => 
    job.name === subStage.stage_name || job.name.includes(subStage.stage_name || '')
  );
  
  return matchedJob?.status || 'wait';
};

// 获取子阶段状态对应的CSS类
const getSubStageStatusClass = (group: Pipeline_stages & {
  stages: Pipeline_stages[];
  pipeline_stage_group_job?: PipelineStageGroupJobs;
}, subStage: Pipeline_stages) => {
  const status = getSubStageStatus(group, subStage);
  return `status-${status}`;
};

// 获取流水线job数据
const fetchPipelineJobs = async () => {
  if (!pipelineId.value) {
    return;
  }

  try {
    const response = await axios.get<PipelineStageGroupJobs[]>(`/api/pipeline/${pipelineId.value}/jobs`);
    pipelineJobs.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('获取流水线job数据失败:', error);
    pipelineJobs.value = [];
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
</script>

<style scoped>
/* 流水线视图容器 */
.pipeline-view {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

/* 图例样式 */
.legend-wrapper {
  display: flex;
  justify-content: right;
  margin-bottom: 30px;
}

.legend {
  display: flex;
  gap: 20px;
  padding: 10px 20px;
  background-color: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.status-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 流水线内容区域 */
.pipeline-content {
  width: 100%;
  overflow-x: auto;
}

/* 阶段容器 */
.stages-container {
  display: flex;
  gap: 40px;
  position: relative;
  padding: 0 20px;
}

/* 连接线 */
.connection-lines {
  position: absolute;
  top: 24px;
  left: 60px;
  right: 60px;
  height: 2px;
  background-color: #e5e7eb;
  z-index: 1;
}

/* 阶段包装器 */
.stage-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
  position: relative;
  z-index: 2;
}

/* 阶段头部 */
.stage-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
  text-align: center;
}

/* 阶段编号 */
.stage-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 阶段标题 */
.stage-title {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  min-width: 80px;
}

/* 子阶段容器 */
.sub-stages {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background-color: #f9fafb;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

/* 子阶段项 */
.sub-stage {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

/* 子阶段点 */
.sub-stage-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 子阶段名称 */
.sub-stage-name {
  font-size: 13px;
  color: #6b7280;
}

/* 状态颜色 */
.status-wait {
  background-color: #E5E7EB;
}

.status-processing {
  background-color: #FACC15;
}

.status-success {
  background-color: #22C55E;
}

.status-failed {
  background-color: #EF4444;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .stages-container {
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
  }
  
  .connection-lines {
    display: none;
  }
  
  .stage-wrapper {
    min-width: 90px;
  }
  
  .sub-stages {
    min-width: 100px;
    padding: 8px 12px;
  }
  
  .legend {
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
}
</style>