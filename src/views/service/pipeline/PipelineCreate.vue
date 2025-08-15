<template>
  <div class="pipeline-root-container">
    <div class="create-pipeline-container">
      <el-form ref="pipelineForm" :model="formData" :rules="formRules" label-width="120px">
        <el-form-item label="流水线名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入流水线名称" maxLength="50"></el-input>
        </el-form-item>
            <div class="button-container">
              <el-button :icon="Plus" circle @click="handleAddPielineAction(0) "/>

              <template v-for="(action, index) in groupList" :key="action.group_id">
                <div size="small" round text
                  class="radius"
                  :style="{
                  borderRadius: 'var(--el-border-radius-round)'
                  }"
                >
                  {{ action.group_name }}
                  <el-button :icon="Operation" @click="handleEditPielineAction(action.group_id)"/>
                </div>
                <el-button :icon="Plus" circle @click="handleAddPielineAction(index + 1)" />
              </template>
            </div>
        </el-form>
          <EditStage
            :key="currentEditGroupId"
            :visible="showEditActionDialog"
            :title="editActionDialogTitle"
            :group-name="editGroupName"
            :stage-type="currentEditStageType"
            :stage-name="currentEditStageName"
            :group-id="currentEditGroupId"
            :stage-configs="(allStageConfigs.value || {})[currentEditGroupId || ''] || {}"
            @update:visible="(value: boolean) => showEditActionDialog = value"
            @confirm="confirmEditPielineAction"

            @cancel="() => showEditActionDialog = false"
            @update:stage-configs="(configs) => {
              if (currentEditGroupId) {
                // Ensure allStageConfigs.value is initialized as an object
                allStageConfigs.value = allStageConfigs.value || {};
                allStageConfigs.value[currentEditGroupId] = configs;
              }
            }"
          ></EditStage>
        <div class="form-actions">
          <el-button @click="handlePielineCancel">取消</el-button>
          <el-button type="primary" @click="handlePielineSubmit">提交</el-button>

        </div>
      </div>

      <div class="pipeline-run-container">
        <PipelineRun  
        :pipeline-stages="pipelineActionsDefault"/>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineEmits, defineProps, computed } from 'vue';
import axios from 'axios';
import { FormInstance, FormRules, ElMessage } from 'element-plus';
import { Plus, Operation } from '@element-plus/icons-vue';
import EditStage from './PipelineStageManage.vue';
import PipelineRun from './PipelineMap.vue';
import { Pipeline, Pipeline_stages } from '@/types/pipeline';

const emit = defineEmits(['cancel', 'success']);

const currentInsertIndex = ref(0);
const showEditActionDialog = ref(false);
const editGroupName = ref('');
const editActionDialogTitle = ref('编辑');
const currentEditStageType = ref('');
const currentEditStageName = ref('');
const currentEditGroupId = ref<string>('');
const pipelineForm = ref<FormInstance>();
// 存储全部阶段配置
const allStageConfigs = ref<Record<string, Record<string, any>>>({});


const props = defineProps<{
  componentId: string;
  serviceTree: string;
}>();

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

// 添加生成临时ID的函数，用于视图渲染，最后不提交，数据库自动生成新的id
const generateTempId = () => {
  return 'temp_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
};

const NewStage = (): Pipeline_stages => {
  return {
    group_id: generateTempId(),
    group_name: '新建阶段',
    group_order: 0,
    stage_type: '',
    stage_name: '新建任务',
    parallel: false,
    stage_order: 1,
    pipeline_jobs: {
      parameters: '{}',
      status: ''
    }
  };
};

// 对pipelineActionsDefault进行处理，将group_name相同的阶段合并，生成groupList
// 保留group_order、group_name、group_id，剔除默认新增节点、阶段
// 优化groupList计算逻辑，使用对象而非Map提升性能
const groupList = computed(() => {
  const groupMap: Record<string, { group_name: string; group_order: number; group_id: string }> = {};

  pipelineActionsDefault.value.forEach(action => {
    const { group_name, group_order, group_id } = action;

    if (!groupMap[group_name]) {
      groupMap[group_name] = { group_name, group_order: group_order!, group_id: group_id! };

    }
  });

  return Object.values(groupMap).sort((a, b) => a.group_order - b.group_order);
});

// 添加新操作的处理函数
const handleAddPielineAction = (index: number) => {
  currentInsertIndex.value = index;
  // 插入到指定位置
  pipelineActionsDefault.value.splice(currentInsertIndex.value, 0, NewStage());

  // 重新计算所有group_order（从1开始递增）
  pipelineActionsDefault.value.forEach((stage, index) => {
    stage.group_order = index + 1;
  });

  ElMessage.success('操作添加成功');
};

// 添加新编辑的处理函数
const handleEditPielineAction = (group_id: string) => {

  // 找到具有指定group_id的第一个action
  const targetAction = pipelineActionsDefault.value.find(
    item => item.group_id === group_id
  );
  if (targetAction) {
    currentInsertIndex.value = pipelineActionsDefault.value.findIndex(
      item => item.group_order === targetAction.group_order
    );
    editGroupName.value = targetAction.group_name;
    currentEditGroupId.value = targetAction.group_id!; 
    currentEditStageType.value = targetAction.stage_type!;
    currentEditStageName.value = targetAction.stage_name!;
    
    showEditActionDialog.value = true;

  } else {
    ElMessage.error('未找到对应的操作');
  }
};

const confirmEditPielineAction = (data: { stages: Array<{ name: string; type: string; config: any; stage_order: number; parallel: boolean }>, group_name: string }) => {

  const { stages, group_name } = data;
  const groupIndex = pipelineActionsDefault.value.findIndex(
    item => item.group_id === currentEditGroupId.value
  );

  if (groupIndex !== -1) {
    // 创建新数组时直接过滤并添加，减少中间变量
    const newActions = [
      ...pipelineActionsDefault.value.filter(item => item.group_id !== currentEditGroupId.value)
    ];

    // 更新相同group_id的项的group_name（如果有的话）
    pipelineActionsDefault.value
      .filter(item => item.group_id === currentEditGroupId.value)
      .forEach(item => {
        item.group_name = group_name;
      });

    // 添加新阶段
    stages.forEach((stage, index) => {
      newActions.splice(groupIndex + index, 0, {
        group_id: currentEditGroupId.value,
        group_name: group_name,
        group_order: currentInsertIndex.value,
        stage_type: stage.type,
        stage_name: stage.name,
        parallel: stage.parallel,
        stage_order: index + 1,
        pipeline_jobs: {
          parameters: JSON.stringify(stage.config),
          status: ''
        }
      });
    });

    pipelineActionsDefault.value = newActions;
  }

  showEditActionDialog.value = false;
  ElMessage.success('操作编辑成功');
};

const handlePielineSubmit = async () => {
  if (!pipelineForm.value) return;

  const resultTableData: Omit<Pipeline, 'id'> = {
    name: formData.name,
    component_id: props.componentId,
    service_tree: props.serviceTree,
    pipeline_stages: pipelineActionsDefault.value
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
    ElMessage.error('流水线创建失败，请检查表单数据');
  }
};

const handlePielineCancel = () => {
  emit('cancel');
};

const pipelineActionsDefault = ref<Pipeline_stages[]>([
  {
   ...NewStage()
  }
]);



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
  border-radius: var(--el-border-radius-round); /* 使用变量代替0 */
  text-align: center;
  line-height: 40px;
}

.button-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
