<template>
  <div class="create-pipeline-container">
      <el-form ref="pipelineForm" :model="formData" :rules="formRules" label-width="120px">
        <el-form-item label="流水线名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入流水线名称" maxLength="50"></el-input>
        </el-form-item>
            <!-- 添加一个容器包裹所有按钮和template，并设置flex布局 -->
            <div class="button-container">
              <el-button :icon="Plus" circle @click="handleAddAction(0) "/>
              <template v-for="(action, index) in groupList" :key="action.group_id">
                <div size="small" round text
                  class="radius"
                  :style="{
                  borderRadius: 'var(--el-border-radius-round)'
                  }"
                >
                  {{ action.group_name }}
                  <el-button :icon="EditPen" @click="handleEditName(action.group_id)"/>
                  <el-button :icon="Operation" @click="handleEditAction(index)"/>
                </div>
                <el-button :icon="Plus" circle @click="handleAddAction(index + 1)" />
              </template>
            </div>
        </el-form>
          <EditStage
            :visible="showEditActionDialog"
            :title="editActionDialogTitle"
            :action-name="editActionName"
            :group-id="currentEditGroupId"
            @update:visible="(value: boolean) => showEditActionDialog = value"
            @confirm="confirmEditAction"
            @cancel="handleDialogCancel"
          ></EditStage>
          <!-- 重命名弹窗 --> 
          <el-dialog
            v-model="showRenameDialog"
            title="编辑分组名称"
            width="30%"
            :before-close="cancelRename"
          >
            <el-form :model="{ name: editActionName }" label-width="80px">
              <el-form-item label="分组名称" prop="name" :rules="[{ required: true, message: '请输入分组名称', trigger: 'blur' }]">
                <el-input v-model="editActionName" placeholder="请输入新的分组名称"></el-input>
              </el-form-item>
            </el-form>
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="cancelRename">取消</el-button>
                <el-button type="primary" @click="confirmRename">确认</el-button>
              </span>
            </template>
          </el-dialog>
        <div class="form-actions">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSubmit">提交</el-button>
        </div>
      </div>

      <div class="pipeline-run-container">
        <PipelineRun  
        :pipeline-stages="pipelineActionsDefault"/>
      </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineEmits, defineProps, toRefs,computed,watch } from 'vue';
import axios from 'axios';
import { FormInstance, FormRules, ElMessage } from 'element-plus';
import { Plus, EditPen, Operation } from '@element-plus/icons-vue';
import EditStage from './stages/EditStage.vue';
import PipelineRun from './PipelineRun.vue';
import { Pipeline, Pipeline_stages, Pipeline_job } from '@/types/pipeline';
import { StageType } from '@/types/pipeline-stagetype';

const emit = defineEmits(['cancel', 'success']);

const state = reactive({
  resultStagesData: null as Pipeline_stages[] | null,
  resultJobsData: null as Pipeline_job | null,
})

const { resultStagesData, resultJobsData } = toRefs(state)

// 添加生成临时ID的函数，用于视图渲染，最后不提交，数据库自动生成新的id
const generateTempId = () => {
  return 'temp_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
};

const pipelineActionsDefault = ref<Pipeline_stages[]>([
  {
    group_id: generateTempId(),
    group_name: '新建分组',
    group_order: 0,
    stage_name: '新建阶段',
    stage_order: 1,
    pipeline_jobs: {
      parameters: '{}',
      status: ''
    }
  }
]);

const currentInsertIndex = ref(0);
const showEditActionDialog = ref(false);
const newActionName = ref('');
const editActionName = ref('');
const editActionDialogTitle = ref('编辑');
const currentEditGroupId = ref<string>('');
const showRenameDialog = ref(false);

const props = defineProps<{
  componentId: string;
  serviceTree: string;
}>();

// 对pipelineActionsDefault进行处理，将group_name相同的阶段合并，生成groupList
// 保留group_order、group_name、group_id，剔除默认新增节点、阶段
const groupList = computed(() => {
  // 创建一个Map来存储每个group_name对应的唯一组
  const groupMap = new Map();
  
  // 遍历pipelineActionsDefault中的所有阶段
  pipelineActionsDefault.value.forEach(action => {
    const { group_name, group_order, group_id } = action;
    
    // 如果group_name不存在于Map中，则添加它
    if (!groupMap.has(group_name)) {
      groupMap.set(group_name, {
        group_name,
        group_order,
        group_id
      });
    }
  });
  
  // 将Map转换为数组并按group_order排序后返回
  return Array.from(groupMap.values()).sort((a, b) => a.group_order - b.group_order);
});

// 添加新操作的处理函数
const handleAddAction = (index: number) => {
  currentInsertIndex.value = index;
  
  // 直接创建新的空action
  const newStage: Pipeline_stages = {
    group_id: generateTempId(),
    group_name: '新建分组',
    group_order: 0,
    stage_name: '新建阶段',
    stage_order: 1,
    pipeline_jobs: {
      parameters: '{}',
      status: ''
    }
  };

  // 插入到指定位置
  pipelineActionsDefault.value.splice(currentInsertIndex.value, 0, newStage);

  // 重新计算所有group_order（从1开始递增）
  pipelineActionsDefault.value.forEach((stage, index) => {
    stage.group_order = index + 1;
  });

  ElMessage.success('操作添加成功');
};

// 添加新编辑的处理函数
const handleEditAction = (index: number) => {
  currentInsertIndex.value = index;
  showEditActionDialog.value = true;
  editActionName.value = groupList.value[index].group_name;
  const targetAction = pipelineActionsDefault.value.find(
    item => item.group_id === groupList.value[index].group_id
  );
  // 确保group_id存在
  if (targetAction) {
    currentEditGroupId.value = targetAction.group_id || generateTempId();
  } else {
    // 如果找不到，生成新的临时ID
    currentEditGroupId.value = generateTempId();
  }
};

const confirmEditAction = (stages: any[]) => {
  // 找到当前编辑的group_index
  const groupIndex = pipelineActionsDefault.value.findIndex(
    item => item.group_id === currentEditGroupId.value
  );

  if (groupIndex !== -1) {
    // 创建一个新数组来存储更新后的数据
    const updatedActions = [...pipelineActionsDefault.value];

    // 更新所有相同group_id的项的group_name
    updatedActions.forEach(item => {
      if (item.group_id === currentEditGroupId.value) {
        item.group_name = editActionName.value;
      }
    });

    // 清空现有阶段
    const filteredActions = updatedActions.filter(
      item => item.group_id !== currentEditGroupId.value
    );

    // 添加新阶段
    const newActions = [...filteredActions];
    stages.forEach((stage, index) => {
      newActions.splice(groupIndex + index, 0, {
        group_id: currentEditGroupId.value,
        group_name: editActionName.value,
        group_order: currentInsertIndex.value,
        stage_name: stage.name,
        stage_order: index + 1,
        pipeline_jobs: {
          parameters: JSON.stringify(stage.config),
          status: ''
        }
      });
    });

    // 替换整个数组以确保响应式更新
    pipelineActionsDefault.value = newActions;
  }

  showEditActionDialog.value = false;
  ElMessage.success('操作编辑成功');
};

const handleEditName = (groupId: string) => {
  const targetAction = pipelineActionsDefault.value.find(
    item => item.group_id === groupId
  );
  if (targetAction) {
    editActionName.value = targetAction.group_name;
    currentEditGroupId.value = groupId; // 设置当前编辑的group_id
    showRenameDialog.value = true;
  }
};

// 处理重命名确认
const confirmRename = () => {
  if (!editActionName.value.trim()) {
    ElMessage.error('分组名称不能为空');
    return;
  }
  // 更新所有相同group_id的项的group_name
  const updatedActions = [...pipelineActionsDefault.value];
  updatedActions.forEach(item => {
    if (item.group_id === currentEditGroupId.value) {
      item.group_name = editActionName.value;
    }
  });

  // 替换原数组以触发响应式更新
  pipelineActionsDefault.value = updatedActions;

  showRenameDialog.value = false;
  ElMessage.success('分组名称修改成功');
};

// 处理重命名取消
const cancelRename = () => {
  showRenameDialog.value = false;
};

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
  showEditActionDialog.value = false;
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

.radius {
  height: 40px;
  width: 220px;
  border: 1px solid var(--el-border-color);
  border-radius: 0;
  text-align: center;
  line-height: 40px;
}

.button-container {
  display: flex;       /* 设置为flex布局 */
  align-items: center; /* 垂直居中对齐 */
  gap: 8px;            /* 元素之间的间距 */
  flex-wrap: wrap;     /* 可选：当空间不足时换行 */
}

</style>
