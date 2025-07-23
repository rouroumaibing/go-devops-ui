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
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { FormInstance, FormRules, ElMessage } from 'element-plus';
import { CirclePlus, EditPen, Operation } from '@element-plus/icons-vue';
import AddStage from './stages/AddStage.vue';
import EditStage from './stages/EditStage.vue';

interface pipeline {
  id: string;
  name: string;
  component_id: string;
  service_tree: string;
  pipeline_detail: string;
  create_at: string;
  update_at: string;
}

interface pipeline_job{
  id: string;
  name: string;
  commamd: string;
  pipeline_id: string;
  status: string;
  create_at: string;
  update_at: string;  
}

const router = useRouter();
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

const handleSubmit = async () => {
  if (!pipelineForm.value) return;

  try {
    const valid = await pipelineForm.value.validate();
    if (valid) {
      console.log('流水线数据:', formData);
      ElMessage.success('流水线创建成功');
    }
  } catch (error) {
    console.log('表单验证失败:', error);
  }
};

const handleCancel = () => {
  router.go(-1);
};

const handleDialogCancel = () => {
  newActionName.value = '';
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
