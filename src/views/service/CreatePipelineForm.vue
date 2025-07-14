<template>
  <div class="create-form-container">
    <el-form ref="pipelineForm" :model="formData" label-width="120px" class="form-container">
      <el-form-item label="流水线名称" prop="name" :rules="[{ required: true, message: '请输入流水线名称', trigger: 'blur' }]">
        <el-input v-model="formData.name" placeholder="请输入流水线名称"></el-input>
      </el-form-item>

      <el-form-item label="流水线类型" prop="type" :rules="[{ required: true, message: '请选择流水线类型', trigger: 'change' }]">
        <el-select v-model="formData.type" placeholder="请选择流水线类型">
          <el-option label="构建流水线" value="build"></el-option>
          <el-option label="部署流水线" value="deploy"></el-option>
          <el-option label="测试流水线" value="test"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="流水线分组" prop="group" :rules="[{ required: true, message: '请选择流水线分组', trigger: 'change' }]">
        <el-select v-model="formData.group" placeholder="请选择流水线分组">
          <el-option label="后端服务" value="backend"></el-option>
          <el-option label="前端应用" value="frontend"></el-option>
          <el-option label="移动应用" value="mobile"></el-option>
        </el-select>
      </el-form-item>

      <!-- 高级选项文本标题 -->
      <el-form-item>
        <div class="advanced-options-title">高级选项：</div>
        <div class="pipeline-container">
          <div class="pipeline-scroll">
            <!-- 阶段间连接线容器 -->
            <div class="connectors">
              <div class="stage-connector" v-for="i in PIPELINE_STAGES.length - 1" :key="'connector' + i"></div>
              <div class="flow-animation"></div>
            </div>

            <!-- 阶段前添加按钮 -->
            <div class="add-stage-btn" @click="handleAddStageBetween(0)">
              <div class="add-button">+</div>
            </div>

            <!-- 流水线阶段 -->
            <template v-for="(stage, index) in PIPELINE_STAGES" :key="stage.key">
              <div class="stage">
                <div class="stage-header">
                  <div class="stage-icon">
                    <el-icon v-if="stage.key === 'build'">
                      <Cogs />
                    </el-icon>
                    <el-icon v-if="stage.key === 'test'">
                      <CheckCircle />
                    </el-icon>
                    <el-icon v-if="stage.key === 'deploy'">
                      <Rocket />
                    </el-icon>
                  </div>
                  <div class="stage-title-content">
                    <h3>{{ stage.title }}</h3>
                    <div class="stage-actions">
                      <el-button type="text" size="small" class="edit-btn" @click="handleStepEdit(stage.key)">
                        <el-icon><Edit /></el-icon>编辑
                      </el-button>
                    </div>
                  </div>
                </div>

                <!-- 子步骤列表 -->
                <div class="stage-content">
                  <div v-for="(step, idx) in stage.subSteps" :key="idx" class="step">
                    <div class="step-icon">
                      <el-icon><Cube /></el-icon>
                    </div>
                    <div class="step-content">
                      <h4>{{ step }}</h4>
                      <p class="step-desc">子步骤 {{ idx + 1 }}: {{ step }}</p>
                    </div>
                    <div class="status-badge active" v-if="idx === stage.subSteps.length - 1">
                      已完成
                    </div>
                    <!-- 步骤间连接线 -->
                    <div class="step-connector" v-if="idx < stage.subSteps.length - 1"></div>
                  </div>
                </div>
              </div>

              <!-- 阶段间添加按钮 -->
              <div class="add-stage-btn" @click="handleAddStageBetween(index + 1)">
                <div class="add-button">+</div>
              </div>
            </template>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <div class="form-actions">
      <el-button @click="onCancel">返回</el-button>
      <el-button type="primary" @click="onSave(false)">保存</el-button>
      <el-button type="success" @click="onSave(true)">保存并返回</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FormInstance } from 'element-plus';
import { ref, reactive, defineProps, defineEmits } from 'vue';

const props = defineProps({
  initialFormData: { type: Object, default: () => ({ name: '', type: '', group: '' }) },
  componentId: { type: Number, default: 1 }
});

const PIPELINE_STAGES = [
  {
    key: 'build',
    title: '构建阶段',
    subSteps: ['代码拉取', '依赖安装', '编译构建']
  },
  {
    key: 'test',
    title: '测试阶段',
    subSteps: ['单元测试', '集成测试', '性能测试']
  },
  {
    key: 'deploy',
    title: '部署阶段',
    subSteps: ['打包镜像', '推送仓库', '部署应用']
  }
]

// Emits定义
const emit = defineEmits(['cancel', 'save', 'edit-step','add-step', 'add-stage-between']);

// 表单状态
const formData = reactive({ ...props.initialFormData });
const pipelineForm = ref<FormInstance>();

// 核心方法
const onCancel = () => emit('cancel');
const onSave = async (redirectAfterSave: boolean) => {/* 保存逻辑 */};
const handleStepEdit = (stepType: string) => emit('edit-step', stepType);

// 添加新阶段方法
const handleAddStageBetween = (position: number) => {
  emit('add-stage-between', position);
  // 可添加弹窗逻辑让用户输入新阶段信息
};

// 计算连接线位置（在onMounted或updated中调用）
import { onMounted, nextTick } from 'vue';

onMounted(() => {
  updateConnectors();
});

const updateConnectors = () => {
  nextTick(() => {
    const stages = document.querySelectorAll('.stage');
    const connectors = document.querySelectorAll('.stage-connector');
    
    stages.forEach((stage, index) => {
      if (index < stages.length - 1) {
        const currentRect = stage.getBoundingClientRect();
        const nextRect = stages[index + 1].getBoundingClientRect();
        const connector = connectors[index] as HTMLElement;
        
        if (connector) {
          connector.style.left = `${currentRect.right}px`;
          connector.style.width = `${nextRect.left - currentRect.right}px`;
        }
      }
    });
  });
};
</script>

<style scoped>
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

/* 流水线样式 */
.pipeline-container {
  position: relative;
  margin: 30px 0;
  overflow-x: auto;
  padding: 20px 0;
}

.pipeline-scroll {
  display: flex;
  min-width: min-content;
  position: relative;
  padding: 50px 0;
}

/* 阶段间连接线 */
.connectors {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.stage-connector {
  position: absolute;
  height: 4px;
  background: #e2e8f0;
  top: 75px;
  border-radius: 2px;
  z-index: 1;
}

/* 流动动画效果 */
.flow-animation {
  position: absolute;
  height: 4px;
  background: linear-gradient(90deg, #909399, #606266);
  top: 75px;
  width: 0;
  animation: flow 4s infinite;
  border-radius: 2px;
  z-index: 2;
}

@keyframes flow {
  0% { width: 0; left: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { width: 100%; left: 0; opacity: 0; }
}

/* 添加阶段按钮 */
.add-stage-btn {
  position: relative;
  min-width: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 3;
  margin: 0 10px;
}

.add-button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #f2f3f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 1.8rem;
  font-weight: 300;
  transition: all 0.3s ease;
  border: 2px dashed #e5e6eb;
}

.add-button:hover {
  background: #e5e6eb;
  color: #606266;
  transform: scale(1.1);
  border-style: solid;
}

/* 阶段样式 */
.stage {
  position: relative;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}

.stage-header {
  background: white;
  padding: 15px 25px;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  border-left: 4px solid #909399;
}

.stage-header:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

/* 步骤样式 */
.stage-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  position: relative;
  padding: 10px 0 20px;
}

.step {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 12px 15px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  z-index: 2;
}

.step:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.step-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: white;
  font-size: 16px;
  background: linear-gradient(135deg, #909399, #606266);
}

.step-content h4 {
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 2px;
}

.step-desc {
  color: #7f8c8d;
  font-size: 13px;
}

/* 步骤间连接线 */
.step-connector {
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  height: 20px;
  width: 2px;
  background: #e2e8f0;
  z-index: 1;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .pipeline-scroll {
    min-width: 800px;
  }
  .stage {
    min-width: 200px;
  }
}
</style>