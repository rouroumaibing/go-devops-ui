<template>
  <div class="pipeline-job-container">
    <h1 class="page-title">流水线任务管理</h1>

    <!-- 主节点步骤条 -->
    <el-steps
      class="main-steps"
      :active="currentMainStep"
      finish-status="success"
      align-center
    >
      <el-step
        v-for="(step, index) in mainSteps"
        :key="index"
        :title="step.title"
        :description="step.description"
      />
    </el-steps>

    <!-- 子节点步骤条 -->
    <div class="sub-steps-container" v-if="currentMainStep < mainSteps.length">
      <el-steps
        class="sub-steps"
        :active="currentSubStep"
        finish-status="success"
        direction="vertical"
      >
        <el-step
          v-for="(subStep, index) in mainSteps[currentMainStep].subSteps"
          :key="index"
          :title="subStep.title"
          :status="getSubStepStatus(index)"
        />
      </el-steps>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button
        @click="prevStep"
        :disabled="!canGoPrev"
        v-if="currentMainStep > 0 || currentSubStep > 0"
      >
        上一步
      </el-button>
      <el-button
        type="primary"
        @click="nextStep"
        :loading="isProcessing"
      >
        {{ isLastStep ? '完成' : '下一步' }}
      </el-button>
    </div>

    <!-- 当前步骤内容区域 -->
    <div class="step-content">
      <component
        :is="currentComponent"
        v-if="currentComponent"
        @complete="handleSubStepComplete"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, defineAsyncComponent } from 'vue';
import { ElMessage } from 'element-plus';

// 定义步骤类型
interface Step {
  title: string;
  description?: string;
  subSteps: SubStep[];
  component: string;
}

interface SubStep {
  title: string;
  status?: 'wait' | 'process' | 'finish' | 'error';
}

// 主步骤数据
const mainSteps: Step[] = [
  {
    title: '编译',
    description: '代码编译与构建',
    component: 'CompileStep',
    subSteps: [
      { title: '构建' },
      { title: '归档' }
    ]
  },
  {
    title: '审批',
    description: '多级领导审批',
    component: 'ApprovalStep',
    subSteps: [
      { title: 'A领导卡点' },
      { title: 'B领导卡点' }
    ]
  },
  {
    title: '类生产推送',
    description: '测试环境部署',
    component: 'StagingDeployStep',
    subSteps: [
      { title: 'Alpha研发环境' },
      { title: 'Beta测试环境' },
      { title: 'Gamma预生产环境' }
    ]
  },
  {
    title: '生产环境推送',
    description: '正式环境部署',
    component: 'ProductionDeployStep',
    subSteps: [
      { title: '北京生产环境' }
    ]
  }
];

// 状态管理
const currentMainStep = ref(0);
const currentSubStep = ref(0);
const isProcessing = ref(false);
const completedSubSteps = ref<Record<number, number[]>>({});

// 异步加载步骤组件
const currentComponent = computed(() => {
  if (currentMainStep.value >= mainSteps.length) return null;
  return defineAsyncComponent(() => 
    import(`@/components/pipeline/${mainSteps[currentMainStep.value].component}.vue`)
  );
});

// 计算属性
const canGoPrev = computed(() => {
  return currentMainStep.value > 0 || currentSubStep.value > 0;
});

const isLastStep = computed(() => {
  const currentStep = mainSteps[currentMainStep.value];
  return (
    currentMainStep.value === mainSteps.length - 1 &&
    currentSubStep.value === currentStep.subSteps.length - 1
  );
});

// 获取子步骤状态
const getSubStepStatus = (subStepIndex: number) => {
  const completed = completedSubSteps.value[currentMainStep.value] || [];
  if (completed.includes(subStepIndex)) return 'finish';
  if (subStepIndex === currentSubStep.value) return 'process';
  return 'wait';
};

// 处理子步骤完成
const handleSubStepComplete = () => {
  // 记录已完成的子步骤
  if (!completedSubSteps.value[currentMainStep.value]) {
    completedSubSteps.value[currentMainStep.value] = [];
  }
  completedSubSteps.value[currentMainStep.value].push(currentSubStep.value);
  nextStep();
};

// 下一步
const nextStep = () => {
  isProcessing.value = true;

  // 模拟处理延迟
  setTimeout(() => {
    const currentStep = mainSteps[currentMainStep.value];

    // 检查是否有更多子步骤
    if (currentSubStep.value < currentStep.subSteps.length - 1) {
      currentSubStep.value++;
    } else {
      // 当前主步骤的所有子步骤已完成
      if (!completedSubSteps.value[currentMainStep.value]) {
        completedSubSteps.value[currentMainStep.value] = [];
      }
      completedSubSteps.value[currentMainStep.value].push(currentSubStep.value);

      // 检查是否有更多主步骤
      if (currentMainStep.value < mainSteps.length - 1) {
        currentMainStep.value++;
        currentSubStep.value = 0;
      } else {
        // 所有步骤完成
        ElMessage.success('流水线任务已全部完成！');
      }
    }

    isProcessing.value = false;
  }, 800);
};

// 上一步
const prevStep = () => {
  if (currentSubStep.value > 0) {
    currentSubStep.value--;
  } else if (currentMainStep.value > 0) {
    currentMainStep.value--;
    const prevStep = mainSteps[currentMainStep.value];
    currentSubStep.value = prevStep.subSteps.length - 1;
  }
};
</script>

<style scoped lang="scss">
.pipeline-job-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 30px;
  color: #333;
}

.main-steps {
  margin-bottom: 40px;
  max-width: 100%;
}

.sub-steps-container {
  margin-left: 40px;
  margin-bottom: 30px;
  width: 500px;
}

.sub-steps {
  border-left: 2px solid #e5e7eb;
  padding-left: 20px;
}

.action-buttons {
  margin-top: 40px;
  display: flex;
  gap: 10px;
}

.step-content {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  min-height: 200px;
}
</style>