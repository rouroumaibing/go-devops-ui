<template>
  <div class="create-pipeline-container">
      <el-form ref="pipelineForm" :model="formData" :rules="formRules" label-width="120px">
        <el-form-item label="流水线名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入流水线名称" maxLength="50"></el-input>
        </el-form-item>
            <el-button :icon="Plus" circle @click="handleAddAction(0)"/>
            <template v-for="(action, index) in pipelineActionsDefault" :key="action.group_name">
            <el-button size="large" round text bg @click="handleEditAction(index)">
              {{ action.group_name }}
              <el-icon><EditPen /></el-icon>
              <el-icon><Operation /></el-icon>
            </el-button>
            <el-button :icon="Plus" circle @click="handleAddAction(index + 1)" />
          </template>
        </el-form>
          <AddStage
            :visible="showAddActionDialog"
            :title="addActionDialogTitle"
            :action-name="newActionName"
            :insert-position="currentInsertIndex"
            @update:visible="(value: boolean) => showAddActionDialog = value"
            @confirm="confirmAddAction"
            @cancel="handleDialogCancel"
          ></AddStage>
          <EditStage
            :visible="showEditActionDialog"
            :title="editActionDialogTitle"
            :action-name="editActionName"
            @update:visible="(value: boolean) => showEditActionDialog = value"
            @confirm="confirmEditAction"
            @cancel="handleDialogCancel"
          ></EditStage>
        <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
      </div>

      <div class="pipeline-run-container">
        <PipelineRun  
        :pipeline-stages="pipelineActionsDefault"/>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineEmits, defineProps, toRefs } from 'vue';
import axios from 'axios';
import { FormInstance, FormRules, ElMessage } from 'element-plus';
import { Plus, EditPen, Operation } from '@element-plus/icons-vue';
import AddStage from './stages/AddStage.vue';
import EditStage from './stages/EditStage.vue';
import PipelineRun from './PipelineRun.vue';

import type { Pipeline, Pipeline_stages, Pipeline_job } from '@/types/pipeline';

const emit = defineEmits(['cancel', 'success']);

const state = reactive({
  resultStagesData: null as Pipeline_stages[] | null,
  resultJobsData: null as Pipeline_job | null,
})

const { resultStagesData, resultJobsData } = toRefs(state)


const pipelineActionsDefault = ref<Pipeline_stages[]>([
  { group_name: '构建' }
]);

const currentInsertIndex = ref(0);
const showAddActionDialog = ref(false);
const showEditActionDialog = ref(false);
const newActionName = ref('');
const editActionName = ref('');
const addActionDialogTitle = ref('添加');
const editActionDialogTitle = ref('编辑');

const props = defineProps<{
  componentId: string;
  serviceTree: string;
}>();

// 添加新操作的处理函数
const handleAddAction = (index: number) => {
  currentInsertIndex.value = index;
  showAddActionDialog.value = true;
  newActionName.value = ''; 
};

// 添加新编辑的处理函数
const handleEditAction = (index: number) => {
  currentInsertIndex.value = index;
  showEditActionDialog.value = true;
  editActionName.value = pipelineActionsDefault.value[index].group_name;
};

// 确认添加新操作
const confirmAddAction = (newActionName: string) => {

  if (!newActionName.trim()) {
    ElMessage.error('请输入操作名称');
    return;
  }

  // 创建新stage对象，暂不设置group_order
  const newStage: Pipeline_stages = {
    group_name: newActionName.trim(),
    group_order: 0, 
    stage_name: newActionName.trim() + '1',
    stage_order: 1,
    pipeline_jobs: { parameters: '', status: '' }
  };

  // 插入到指定位置
  pipelineActionsDefault.value.splice(currentInsertIndex.value, 0, newStage);

  // 重新计算所有group_order（从1开始递增）
  pipelineActionsDefault.value.forEach((stage, index) => {
    stage.group_order = index + 1;
  });

  showAddActionDialog.value = false;
  ElMessage.success('操作添加成功');
};

const confirmEditAction = (stages: any[]) => {
  // Handle the stages data from EditStage
  console.log('Received stages:', stages);
  // Add your logic to update pipelineActionsDefault with the new stages
  
  showEditActionDialog.value = false;
  ElMessage.success('操作编辑成功');
}

// 表单引用
const pipelineForm = ref<FormInstance>();

// 表单数据
const formData = reactive<{
  name: string;
  description: string;
  type: string;
}>({
  name: '',
  description: '',
  type: ''
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

const handleCancel = () => {
  emit('cancel');
};

const handleDialogCancel = () => {
  newActionName.value = '';
};


const handleSubmit = async () => {
  if (!pipelineForm.value) return;

    const resultTableData: Omit<Pipeline, 'id'> = {
      name: formData.name,
      component_id: props.componentId,
      service_tree: props.serviceTree, 
      pipeline_stages: resultStagesData.value as Pipeline_stages[]
    };

  try {
    const valid = await pipelineForm.value.validate();
    if (valid) {

      // 发送创建流水线的POST请求
      const response = await axios.post('/api/pipeline', resultTableData);
      ElMessage.success('流水线创建成功');
      emit('success', response.data);
      emit('cancel');
    }
  } catch (error) {
    console.log('表单验证失败:', error);
    ElMessage.error('流水线创建失败，请检查表单数据');
  }
};

</script>

<style scoped>
.create-pipeline-container {
  padding: 20px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}

.pipeline-run-container {
  margin-top: 30px;
  padding: 20px;
  border-top: 1px dashed #e8e8e8;
}
</style>
