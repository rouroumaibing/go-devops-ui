<template>
  <div class="create-pipeline-container">
      <el-form ref="pipelineForm" :model="formData" :rules="formRules" label-width="120px">
        <el-form-item label="流水线名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入流水线名称" maxLength="50"></el-input>
        </el-form-item>
        
          <el-button :icon="CirclePlus" circle @click="handleAddAction(0)"/>
          <template v-for="(action, index) in pipelineActions" :key="action.name">
            <el-button size="large" round text bg @click="handleEditAction(index)">{{ action.name }}
            <el-icon><EditPen /></el-icon>
            <el-icon><Operation /></el-icon>
            </el-button>
            <el-button :icon="CirclePlus" circle @click="handleAddAction(index + 1)" />
          </template>
        </el-form>
          <AddStage
            :visible="showAddActionDialog"
            :title="addActionDialogTitle"
            :action-name="newActionName"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineEmits, defineProps } from 'vue';
import axios from 'axios';
import { FormInstance, FormRules, ElMessage } from 'element-plus';
import { CirclePlus, EditPen, Operation } from '@element-plus/icons-vue';
import AddStage from './stages/AddStage.vue';
import EditStage from './stages/EditStage.vue';
import Pipeline from './PipelineManage.vue';
import Pipeline_stages from './PipelineManage.vue';
import Pipeline_job  from './PipelineManage.vue';

const emit = defineEmits(['cancel', 'success']);

const pipelineActions = ref([
  { name: '构建' },
  { name: '测试' },
  { name: '部署' }
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
  editActionName.value = pipelineActions.value[index].name;
};

// 确认添加新操作
const confirmAddAction = (newActionName: string) => {

  if (!newActionName.trim()) {
    ElMessage.error('请输入操作名称');
    return;
  }

  // 添加新操作到数组
  pipelineActions.value.splice(currentInsertIndex.value, 0, {
    name: newActionName.trim()
  });

  showAddActionDialog.value = false;
  ElMessage.success('操作添加成功');
};

const confirmEditAction = (editActionName: string) => {
  if (!editActionName.trim()) {
    ElMessage.error('请输入操作名称');
    return;
  }
  pipelineActions.value[currentInsertIndex.value].name = editActionName.trim();
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


const fetchPipelineStagesDetail = async (id: string, stage_id: string) => {
  try {
    loading.value = true;
    const response = await axios.get(`/api/pipeline/${id}/stage/${stage_id}`);
    pipelineStagesDetail.value = response.data;
  } catch (error) {
    ElMessage.error('Failed to fetch component detail, please try again');
  } finally {
    loading.value = false;
  }
  return pipelineStagesDetail.value
};

const handleSubmit = async () => {
  if (!pipelineForm.value) return;

  try {
    const valid = await pipelineForm.value.validate();
    if (valid) {
     // 构建符合Pipeline接口的请求数据
      const pipelineData: Omit<typeof Pipeline, 'id'> = {
        name: formData.name,
        component_id: props.componentId,
        service_tree: '', 
        pipeline_stages: pipelineActions.value.map((action, index) => ({
          group_id: action.group_id,
          group_name: action.group_name,
          group_order: index + 1,
          stage_name: action.stage_name,
          stage_order: 1,
          pipeline_id: '',
          pipeline_jobs: {
            pipeline_id: '',
            stage_id: '',
            command: '', 
            status: 'pending',
          }
        }))
      };

      // 发送创建流水线的POST请求
      const response = await axios.post('/api/pipeline', pipelineData);
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
</style>
