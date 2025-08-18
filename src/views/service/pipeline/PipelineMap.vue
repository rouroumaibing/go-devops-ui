
<template>
    <div class="pipeline-container">
        <div class="stage-box">
          <div class="sopt-group">
                <div class="start-text">开始</div>
                <div class="start-sopt"></div>
          </div>
              <div class="start-line"></div>
            <!-- 使用v-for循环生成多个middle-container -->
            <div v-for="group in groupedStages" :key="group.stage_group_id" class="middle-container">
                <div class="vertical-sopt-container">
                    <div class="middle-sopt-group">
                        <div class="middle-text">{{ group.stage_group_name }}</div>
                        <div class="middle-sopt"></div>
                    </div>
                    <!-- 使用v-for循环生成多个middle-node-sopt-group -->
                    <div v-if="group.stages.length > 0">
                        <div v-for="stage in group.stages" :key="stage.id" class="middle-node-sopt-group">
                            <div class="middle-node-line"></div>
                            <div class="middle-node-sopt"></div>
                            <div class="middle-node-text">{{ stage.stage_name }}</div>
                        </div>
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
import { computed } from 'vue';
import type { Pipeline_stages } from '@/types/pipeline';

//接收参数
const props = defineProps<{
  pipelineStages: Pipeline_stages[]; 
}>();

const pipelineStages = computed(() => props.pipelineStages);

// 按group分组并排序的计算属性
const groupedStages = computed(() => {
  // 1. 按group_order排序所有阶段
  const sortedByGroup = [...pipelineStages.value].sort((a, b) =>  (a.stage_group_order ?? 0) - (b.stage_group_order ?? 0));

  // 2. 按group_id分组
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

  // 3. 对每个组内的阶段按stage_order排序
  Object.values(groupsMap).forEach(group => {
    group.stages.sort((a, b) => (a.stage_order ?? 0) - (b.stage_order ?? 0));
  });

  // 4. 转换为数组并返回
  return Object.values(groupsMap);
});


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