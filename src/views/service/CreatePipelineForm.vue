<template>
  <div class="create-pipeline-container">
    <el-card class="form-card">
      <div slot="header" class="card-header">
        <h2>创建新流水线</h2>
        <p>配置流水线的基本信息和执行步骤</p>
      </div>

      <el-form ref="pipelineForm" :model="formData" :rules="formRules" label-width="120px">
        <!-- 基本信息区域 -->
        <el-form-item label="流水线名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入流水线名称" maxLength="50"></el-input>
        </el-form-item>

        <el-form-item label="流水线描述">
          <el-input type="textarea" v-model="formData.description" placeholder="请输入流水线描述" :rows="3"></el-input>
        </el-form-item>

        <el-form-item label="流水线类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择流水线类型">
            <el-option label="构建流水线" value="build"></el-option>
            <el-option label="部署流水线" value="deploy"></el-option>
            <el-option label="综合流水线" value="combined"></el-option>
          </el-select>
        </el-form-item>

        <!-- 阶段配置区域 -->
        <el-form-item>
          <div class="section-title">
            <h3>流水线阶段配置</h3>
            <el-button type="primary" size="small" @click="addStage">
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>

          <!-- 流水线流程图容器 -->
          <div class="pipeline-container">
            <div class="pipeline-scroll">
              <!-- 连接线容器 -->
              <div class="connectors">
                <!-- 阶段间连接线 -->
                <div v-for="(connector, index) in stageConnectors" :key="'connector-'+index"
                     class="stage-connector" :style="{ left: connector.left + 'px', width: connector.width + 'px' }"></div>
                
              </div>

              <!-- 流水线阶段 -->
              <template v-for="(stage, index) in formData.stages" :key="stage.id">
                <div class="stage" :class="'stage-' + ((index % 4) + 1)">
                  <div class="stage-header">
                    <div class="stage-title-content">
                      <el-input v-model="stage.name" placeholder="请输入阶段名称" class="stage-title-input"></el-input>
                      <div class="stage-actions">
                        <el-button type="text" size="small" @click="addStep(index)">
                            <el-icon><Plus /></el-icon>
                        </el-button>
                        <el-button type="text" size="small" @click="removeStage(index)" v-if="formData.stages.length > 1">
                            <el-icon><Minus /></el-icon>
                        </el-button>
                      </div>
                    </div>
                  </div>

                  <!-- 子步骤列表 -->
                  <div class="stage-content">
                    <div v-for="(step, stepIndex) in stage.steps" :key="step.id" class="step">
                      <!-- 删除步骤图标 -->
                      <div class="step">
                        <!-- <div class="step-icon">
                          <el-icon><Cube /></el-icon>
                        </div> -->
                        <div class="step-content">
                          <el-input v-model="step.name" placeholder="请输入步骤名称" class="step-name-input"></el-input>
                          <p class="step-desc">步骤 {{ stepIndex + 1 }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 添加阶段按钮 -->
                <div class="add-stage" v-if="index < formData.stages.length - 1" @click="addStageAtPosition(index + 1)">
                  <el-icon><Plus /></el-icon>
                </div>
              </template>

              <!-- 末尾添加阶段按钮 -->
              <div class="add-stage" @click="addStageAtPosition(formData.stages.length)">
                <el-icon><Plus /></el-icon>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, watch } from 'vue';
import { FormInstance, FormRules, ElMessage } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';

interface StageConnector {
  left: number;
  width: number;
}

const stageConnectors = ref<StageConnector[]>([]);
// 表单引用
const pipelineForm = ref<FormInstance>();

// 表单数据
const formData = reactive<{
  name: string;
  description: string;
  type: string;
  stages: Array<{
    id: string;
    name: string;
    steps: Array<{
      id: string;
      name: string;
    }>
  }>
}>({
  name: '',
  description: '',
  type: '',
  stages: [
    {
      id: 'stage_' + Date.now(),
      name: '',
      steps: [
        {
          id: 'step_' + Date.now(),
          name: ''
        }
      ]
    }
  ]
});

const formRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入流水线名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度应在2-50个字符之间', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择流水线类型', trigger: 'change' }
  ]
});

// 添加阶段
const addStage = () => {
  formData.stages.push({
    id: 'stage_' + Date.now(),
    name: '',
    steps: [
      {
        id: 'step_' + Date.now(),
        name: ''
      }
    ]
  });
};

// 删除阶段
const removeStage = (index: number) => {
  formData.stages.splice(index, 1);
};

// 添加步骤
const addStep = (stageIndex: number) => {
  formData.stages[stageIndex].steps.push({
    id: 'step_' + Date.now(),
    name: ''
  });
};

// 删除步骤
const removeStep = (stageIndex: number, stepIndex: number) => {
  formData.stages[stageIndex].steps.splice(stepIndex, 1);
};

// 提交表单
const handleSubmit = async () => {
  if (!pipelineForm.value) return;

  try {
    const valid = await pipelineForm.value.validate();
    if (valid) {
      // 这里添加表单提交逻辑
      console.log('流水线数据:', formData);
      // 提交成功后可以重定向或显示成功消息
      ElMessage.success('流水线创建成功');
    }
  } catch (error) {
    console.log('表单验证失败:', error);
  }
};

// 取消操作
const handleCancel = () => {
  // 这里添加取消逻辑，如返回上一页
  window.history.back();
};

// 添加带位置的阶段
const addStageAtPosition = (position: number) => {
  formData.stages.splice(position, 0, {
    id: 'stage_' + Date.now(),
    name: '',
    steps: [
      {
        id: 'step_' + Date.now(),
        name: ''
      }
    ]
  });
  // 更新连接线位置
  nextTick(() => updateConnectors());
};

// 更新连接线位置
const updateConnectors = () => {
  const stages = document.querySelectorAll('.stage');
  const connectors = document.querySelectorAll('.stage-connector');
  
  stages.forEach((stage, index) => {
    if (index < stages.length - 1) {
      const currentRect = stage.getBoundingClientRect();
      const nextRect = stages[index + 1].getBoundingClientRect();
      const connector = connectors[index] as HTMLElement;
      
      if (connector) {
        connector.style.width = `${nextRect.left - currentRect.right}px`;
      }
    }
  });
};


// 计算连接线位置
const calculateConnectors = () => {
  nextTick(() => {
    const stages = document.querySelectorAll('.stage');
   const connectors: StageConnector[] = [];
    
    stages.forEach((stage, index) => {
      if (index < stages.length - 1) {
        const currentRect = stage.getBoundingClientRect();
        const nextRect = stages[index + 1].getBoundingClientRect();
        const pipelineElement = document.querySelector('.pipeline-scroll');
        if (!pipelineElement) return;
        const pipelineRect = pipelineElement.getBoundingClientRect();
        
        connectors.push({
          left: currentRect.right - pipelineRect.left,
          width: nextRect.left - currentRect.right
        });
      }
    });
    
    stageConnectors.value = connectors;
  });
};

// 在阶段变化时更新连接线
watch(() => formData.stages, () => {
  calculateConnectors();
  nextTick(() => updateConnectors());

}, { deep: true });

onMounted(() => {
  calculateConnectors();
  nextTick(() => updateConnectors());
});

</script>

<style scoped>
.create-pipeline-container {
  padding: 20px;
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.card-header h2 {
  margin-bottom: 5px;
  color: #1a1a1a;
}

.card-header p {
  color: #666;
  margin-bottom: 0;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.stages-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stage-item {
  width: 100%;
}

.stage-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.stage-name-item {
  flex: 1;
  margin-bottom: 0;
}

.stage-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 10px;
}

.step-item {
  padding: 10px;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}

/* 统一灰色样式 */
.stage {
  background-color: #f5f5f5; /* 浅灰色背景 */
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 15px;
}

.stage-header {
  border-left: 4px solid #999; /* 灰色边框 */
  padding-left: 15px;
  margin-bottom: 15px;
}

.step {
  border-left: 3px solid #ccc; /* 浅灰色步骤边框 */
  padding-left: 15px;
  margin-bottom: 10px;
  background-color: #fff; /* 白色步骤背景 */
}

/* 修改添加按钮为灰色 */
.add-button {
  width: 60px; 
  height: 60px; 
  border-radius: 50%; 
  background: #999; /* 灰色背景 */
  color: white; 
  font-size: 2rem; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
  transition: all 0.3s ease; 
}

.add-button:hover {
  background: #666; /* 深灰色悬停效果 */
  transform: scale(1.1); 
  box-shadow: 0 6px 12px rgba(0,0,0,0.15); 
}

/* 修改连接线为灰色 */
.stage-connector {
  position: absolute; 
  height: 4px; 
  background-color: #ccc; /* 灰色连接线 */
  top: 0; 
}

.pipeline-scroll {
  display: flex;          /* 使用flex布局实现横向排列 */
  flex-direction: row;   /* 横向排列子元素 */
  min-width: 100%;       /* 确保容器宽度至少为100% */
  padding: 20px 0;       /* 上下 padding */
  position: relative;    /* 为连接线提供定位上下文 */
  overflow-x: auto;      /* 当内容超出时显示水平滚动条 */
  overflow-y: hidden;    /* 隐藏垂直滚动条 */
}

/* 阶段样式调整 */
.stage {
  min-width: 280px;      /* 固定阶段宽度 */
  margin-right: 30px;    /* 阶段之间的间距 */
  flex-shrink: 0;        /* 防止阶段被压缩 */
}

/* 连接线容器样式 */
.connectors {
  position: absolute;     /* 绝对定位 */
  top: 85px;              /* 垂直居中对齐阶段标题 */
  left: 0;                /* 左对齐 */
  right: 0;               /* 右对齐 */
  height: 4px;            /* 连接线高度 */
  z-index: 1;             /* 确保连接线在阶段下方 */
  pointer-events: none;   /* 让连接线不阻挡交互 */
}

/* 阶段连接线样式 */
.stage-connector {
  position: absolute;     /* 绝对定位 */
  height: 4px;            /* 连接线高度 */
  background-color: #e5e7eb; /* 连接线颜色 */
  top: 0;                 /* 顶部对齐 */
}

/* 添加阶段按钮样式调整 */
.add-stage {
  margin: 0 15px;         /* 按钮间距 */
  display: flex;          /* 使用flex布局 */
  align-items: center;    /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  flex-shrink: 0;         /* 防止按钮被压缩 */
}
.add-button { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #9f7aea, #6b46c1); color: white; font-size: 2rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(107, 70, 193, 0.3); transition: all 0.3s ease; }
.add-button:hover { transform: scale(1.1); box-shadow: 0 12px 25px rgba(107, 70, 193, 0.4); }

</style>