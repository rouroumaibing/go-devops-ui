
<template>
    <div class="pipeline-container">
        <div class="stage-box">
          <div class="sopt-group">
                <div class="start-text">开始</div>
                <div class="start-sopt"></div>
          </div>
              <div class="start-line"></div>
            <!-- 使用v-for循环生成多个middle-container -->
            <div v-for="group in groupedStages" :key="group.group_id" class="middle-container">
                <div class="vertical-sopt-container">
                    <div class="middle-sopt-group">
                        <div class="middle-text">{{ group.group_name }}</div>
                        <div class="middle-sopt"></div>
                    </div>
                    <!-- 使用v-for循环生成多个middle-node-sopt-group -->
                    <div v-for="stage in group.stages" :key="stage.id" class="middle-node-sopt-group">
                        <div class="middle-node-line"></div>
                        <div class="middle-node-sopt"></div>
                        <div class="middle-node-text">{{ stage.stage_name }}</div>
                    </div>
                </div>
                <div class="middle-line"></div>
            </div>
            <div class="sopt-group">
                <div class="end-text">完成</div>    
                <div class="end-sopt"></div>  
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref, onMounted, watch, computed, reactive, toRefs } from 'vue';
import { ElMessage, ElForm } from 'element-plus';
import { useRouter, useRoute } from 'vue-router';
import type { Pipeline_stages, Pipeline_job } from '@/types/pipeline';

const state = reactive({
  loading: false,
  pipelineStagesDetail: null as Pipeline_stages[] | null,
  pipelineJobsDetail: null as Pipeline_job | null,
});

const { pipelineStagesDetail, pipelineJobsDetail, loading } = toRefs(state);

const fetchPipelineStagesDetail = async (id: string) => {
  try {
    loading.value = true;
    const response = await axios.get(`/api/pipeline/${id}/stage`);
    pipelineStagesDetail.value = response.data;
  } catch (error) {
    ElMessage.error('Failed to fetch component detail, please try again');
  } finally {
    loading.value = false;
  }
  return pipelineStagesDetail.value
};

// 按group分组并排序的计算属性
const groupedStages = computed(() => {
  // 1. 按group_order排序所有阶段
  const sortedByGroup = [...pipelineStages.value].sort((a, b) => a.group_order - b.group_order);

  // 2. 按group_id分组
  const groupsMap = sortedByGroup.reduce((acc, stage) => {
    if (!acc[stage.group_id]) {
      acc[stage.group_id] = {
        ...stage,
        stages: [] as Pipeline_stages[]
      };
    }
    acc[stage.group_id].stages.push(stage);
    return acc;
  }, {} as Record<string, Pipeline_stages & { stages: Pipeline_stages[] }>);

  // 3. 对每个组内的阶段按stage_order排序
  Object.values(groupsMap).forEach(group => {
    group.stages.sort((a, b) => a.stage_order - b.stage_order);
  });

  // 4. 转换为数组并返回
  return Object.values(groupsMap);
});

const generateDefaultPipeline = ():  Pipeline_stages[] => [
  {
    "id": "000-0000-0000",
    "group_id": "xxxx-xxx-xxxx-xxxx-xxxxx01",
    "group_name": "构建",
    "group_order": 1,
    "stage_name": "构建1",
    "stage_order": 1,
    "pipeline_id": "0000-0000-0123",
    "created_at": "2025-07-15 10:30",
    "updated_at": "2025-07-15 10:30",
    "pipeline_jobs": {
      "id": "000-0000-0000-1111",
      "pipeline_id": "0000-0000-0123",
      "stage_id": "000-0000-0000",
      "command": "go build",
      "status": "success",
      "created_at": "2025-07-15 10:30",
      "updated_at": "2025-07-15 10:30"
    }
  },
  {
    "id": "000-0000-0001",
    "group_id": "xxxx-xxx-xxxx-xxxx-xxxxx01",
    "group_name": "构建",
    "group_order": 1,
    "stage_name": "构建2",
    "stage_order": 2,
    "pipeline_id": "0000-0000-0123",
    "created_at": "2025-07-15 10:30",
    "updated_at": "2025-07-15 10:30",
    "pipeline_jobs": {
      "id": "000-0000-0000-1112",
      "pipeline_id": "0000-0000-0123",
      "stage_id": "000-0000-0001",
      "command": "go build",
      "status": "success",
      "created_at": "2025-07-15 10:30",
      "updated_at": "2025-07-15 10:30",
    }
  },
  {
    "id": "000-0000-0002",
    "group_id": "xxxx-xxx-xxxx-xxxx-xxxxx01",
    "group_name": "构建",
    "group_order": 1,
    "stage_name": "归档",
    "stage_order": 3,
    "pipeline_id": "0000-0000-0123",
    "created_at": "2025-07-15 10:30",
    "updated_at": "2025-07-15 10:30",
    "pipeline_jobs": {
      "id": "000-0000-0000-1113",
      "pipeline_id": "0000-0000-0123",
      "stage_id": "000-0000-0002",
      "command": "go package",
      "status": "success",
      "created_at": "2025-07-15 10:30",
      "updated_at": "2025-07-15 10:30",
    }
  },
  {
    "id": "000-0000-0003",
    "group_id": "xxxx-xxx-xxxx-xxxx-xxxxx02",
    "group_name": "卡点",
    "group_order": 2,
    "stage_name": "责任人： xxx",
    "stage_order": 1,
    "pipeline_id": "0000-0000-0123",
    "created_at": "2025-07-15 10:30",
    "updated_at": "2025-07-15 10:30",
    "pipeline_jobs": {
      "id": "000-0000-0000-1114",
      "pipeline_id": "0000-0000-0123",
      "stage_id": "000-0000-0003",
      "command": "kakakaka",
      "status": "success",
      "created_at": "2025-07-15 10:30",
      "updated_at": "2025-07-15 10:30",
    }
  },
  {
    "id": "000-0000-0004",
    "group_id": "xxxx-xxx-xxxx-xxxx-xxxxx03",
    "group_name": "部署",
    "group_order": 3,
    "stage_name": "alpha环境",
    "stage_order": 1,
    "pipeline_id": "0000-0000-0123",
    "created_at": "2025-07-15 10:30",
    "updated_at": "2025-07-15 10:30",
    "pipeline_jobs": {
      "id": "000-0000-0000-1115",
      "pipeline_id": "0000-0000-0123",
      "stage_id": "000-0000-0004",
      "command": "go deploy",
      "status": "failed",
      "created_at": "2025-07-15 10:30",
      "updated_at": "2025-07-15 10:30",
    }
  },
  {
    "id": "000-0000-0005",
    "group_id": "xxxx-xxx-xxxx-xxxx-xxxxx03",
    "group_name": "部署",
    "group_order": 3,
    "stage_name": "beta环境",
    "stage_order": 2,
    "pipeline_id": "0000-0000-0123",
    "created_at": "2025-07-15 10:30",
    "updated_at": "2025-07-15 10:30",
    "pipeline_jobs": {
      "id": "000-0000-0000-1116",
      "pipeline_id": "0000-0000-0123",
      "stage_id": "000-0000-0005",
      "command": "go deploy",
      "status": "pending",
      "created_at": "2025-07-15 10:30",
      "updated_at": "2025-07-15 10:30",
    }
  },
  {
    "id": "000-0000-0006",
    "group_id": "xxxx-xxx-xxxx-xxxx-xxxxx04",
    "group_name": "测试",
    "group_order": 4,
    "stage_name": "自动测试用例",
    "stage_order": 1,
    "pipeline_id": "0000-0000-0123",
    "created_at": "2025-07-15 10:30",
    "updated_at": "2025-07-15 10:30",
    "pipeline_jobs": {
      "id": "000-0000-0000-1117",
      "pipeline_id": "0000-0000-0123",
      "stage_id": "000-0000-0006",
      "command": "go test",
      "status": "pending",
      "created_at": "2025-07-15 10:30",
      "updated_at": "2025-07-15 10:30"
    }
  }
]
const pipelineStages = ref<Pipeline_stages[]>(generateDefaultPipeline());

</script>

<style scoped>
.pipeline-container {
  height: 100%;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.stage-box {
  display: flex;
  align-items: flex-start;
  min-height: 60px;
  width: 100%;
  position: relative;
}

.middle-container {
  display: flex;
  align-items: flex-start;
  flex: 1;
  position: relative;
}

.vertical-sopt-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  margin-top: 0px;
  height: 100%;
}

.stage-box .start-sopt {
  display: flex;
  align-items: flex-start;
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #4CAF50;
  position: relative;
}

.stage-box .start-line {
  height: 2px;
  background-color: #4CAF50;
  margin: 0 10px;
  flex-grow: 1;
}

.stage-box .start-text {
  position: absolute;
  top: -25px;
  left: 0;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 12px;
}

.stage-box .end-sopt {
  display: flex;
  align-items: flex-start;
  display: inline-block;
  width: 10px;
  height: 10px;
  right: 0;
  border-radius: 50%;
  background-color: #4CAF50;
  position: relative;
}

.stage-box .end-line {
  height: 2px;
  background-color: #4CAF50;
  margin: 0 8px;
  flex-grow: 1;
}

.stage-box .end-text {
  position: absolute;
  top: -25px;
  right: 0;
  transform: translateX(50%);
  white-space: nowrap;
  font-size: 12px;
}

.sopt-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.middle-sopt-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.middle-sopt {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #4CAF50;
}

.middle-line {
  height: 2px;
  background-color: #4CAF50;
  margin: 0 8px;
  flex-grow: 1;
}

.middle-text {
  position: absolute;
  top: -25px;
  margin-bottom: 6px;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 12px;
}

.middle-node-sopt-group {
  position: relative;
  display: flex;
  align-items: flex-end;
  margin-top: 8px;
  width: 5px;
}

.middle-node-line {
  position: absolute;
  left: -75%;
  top: -10px;
  bottom: 0;
  width: 15px;
  border-left: 2px solid #4CAF50;
  border-bottom: 2px solid #4CAF50;
  border-bottom-left-radius: 5px;
  transform: translateX(5px);
}

.middle-node-sopt {
  position: absolute;
  display: inline-block;
  top: 24px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #4CAF50;
  margin-left: 15px;
}

.middle-node-text {
  display: inline-block;
  margin-top: 10px;
  margin-left: 25px;
  white-space: nowrap;
  font-size: 12px;
}
</style>