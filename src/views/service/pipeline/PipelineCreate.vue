<template>
  <div class="pipeline-root-container">
    <div class="create-pipeline-container">
      <el-form ref="pipelineForm" :model="formData" :rules="formRules" label-width="120px">
        <el-form-item label="流水线名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入流水线名称" maxLength="50"></el-input>
        </el-form-item>
        <el-form-item label="流水线分组" prop="pipeline_group">
          <el-input v-model="formData.pipeline_group" placeholder="请输入流水线分组" maxLength="50"></el-input>
        </el-form-item>
            <div class="button-container">
              <el-button :icon="Plus" circle @click="handleAddPielineAction(0) "/>

              <template v-for="(action, index) in groupList" :key="action.stage_group_id">

                <div size="small" round text
                  class="radius"
                  :style="{
                  borderRadius: 'var(--el-border-radius-round)'
                  }"
                >
                  {{ action.stage_group_name }}
                  <el-button :icon="Edit" @click="handleEditPielineAction(action.stage_group_id)"/>
                  <el-dropdown>
                    <el-button :icon="Operation" />
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item :icon="CopyDocument" @click="handleCopyPielineAction(action.stage_group_id)" >复制</el-dropdown-item>
                        <el-dropdown-item :icon="Delete" @click="handleDeletePielineAction(action.stage_group_id)" >删除</el-dropdown-item>
                        <el-dropdown-item :icon="DArrowLeft" @click="handleMoveForwardPielineAction(action.stage_group_id)" >向前移动</el-dropdown-item>
                        <el-dropdown-item :icon="DArrowRight" @click="handleMoveBackwardPielineAction(action.stage_group_id)" >向后移动</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </template>
            </div>
        </el-form>
          <EditStage
            :key="currentEditGroupId"
            :visible="showEditActionDialog"
            :title="editActionDialogTitle"
            :stage-group-name="editGroupName"
            :stage-type="currentEditStageType"
            :stage-name="currentEditStageName"
            :group-id="currentEditGroupId"
            :stage-configs="(allStageConfigs.value || {})[currentEditGroupId || ''] || {}"
            @update:visible="(value: boolean) => showEditActionDialog = value"
            @confirm="confirmEditPielineAction"

            @cancel="() => showEditActionDialog = false"
            @update:stage-configs="(configs) => {
              if (currentEditGroupId) {
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
import { FormInstance, FormRules, ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Operation, Edit, CopyDocument, Delete, DArrowLeft, DArrowRight } from '@element-plus/icons-vue';

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
  pipeline_group?: string;
  description: string;
  type: string;
}>({
  name: '',
  pipeline_group: '未分组',
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
    stage_group_id: generateTempId(),
    stage_group_name: '新建阶段',
    stage_group_order: 0,
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
  const groupMap: Record<string, { stage_group_name: string; stage_group_order: number; stage_group_id: string }> = {};

  pipelineActionsDefault.value.forEach(action => {
    const { stage_group_name, stage_group_order, stage_group_id } = action;

    if (!groupMap[stage_group_name]) {
      groupMap[stage_group_name] = { stage_group_name, stage_group_order: stage_group_order!, stage_group_id: stage_group_id! };

    }
  });

  return Object.values(groupMap).sort((a, b) => a.stage_group_order - b.stage_group_order);

});

// 添加新操作的处理函数
const handleAddPielineAction = (index: number) => {
  currentInsertIndex.value = index;
  // 插入到指定位置
  pipelineActionsDefault.value.splice(currentInsertIndex.value, 0, NewStage());

  // 重新计算所有group_order（从1开始递增）
  pipelineActionsDefault.value.forEach((stage, index) => {
    stage.stage_group_order = index + 1;

  });

  ElMessage.success('操作添加成功');
};

// 添加新编辑的处理函数
const handleEditPielineAction = (stage_group_id: string) => {

  // 找到具有指定group_id的第一个action
  const targetAction = pipelineActionsDefault.value.find(
    item => item.stage_group_id === stage_group_id

  );
  if (targetAction) {
    currentInsertIndex.value = pipelineActionsDefault.value.findIndex(
      item => item.stage_group_order === targetAction.stage_group_order
    );
    editGroupName.value = targetAction.stage_group_name;
    currentEditGroupId.value = targetAction.stage_group_id!; 
    currentEditStageType.value = targetAction.stage_type!;
    currentEditStageName.value = targetAction.stage_name!;
    
    showEditActionDialog.value = true;

  } else {
    ElMessage.error('未找到对应的操作');
  }
};

const confirmEditPielineAction = (data: { stages: Array<{ name: string; type: string; config: any; stage_order: number; parallel: boolean }>, stage_group_name: string }) => {

  const { stages, stage_group_name } = data;
  const groupIndex = pipelineActionsDefault.value.findIndex(
    item => item.stage_group_id === currentEditGroupId.value

  );

  if (groupIndex !== -1) {
    // 创建新数组时直接过滤并添加，减少中间变量
    const newActions = [
      ...pipelineActionsDefault.value.filter(item => item.stage_group_id !== currentEditGroupId.value)

    ];

    // 更新相同group_id的项的group_name（如果有的话）
    pipelineActionsDefault.value
      .filter(item => item.stage_group_id === currentEditGroupId.value)
      .forEach(item => {
        item.stage_group_name = stage_group_name;
      });

    // 添加新阶段
    stages.forEach((stage, index) => {
      newActions.splice(groupIndex + index, 0, {
        stage_group_id: currentEditGroupId.value,
        stage_group_name: stage_group_name,
        stage_group_order: currentInsertIndex.value,
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

const handleCopyPielineAction = (stage_group_id: string) => {
  // 找到指定stage_group_id的所有阶段
  const targetStages = pipelineActionsDefault.value.filter(
    item => item.stage_group_id === stage_group_id
  );
  
  if (targetStages.length === 0) {
    ElMessage.error('未找到对应的操作组');
    return;
  }
  
  // 获取目标组的最大order
  const maxOrder = Math.max(...pipelineActionsDefault.value.map(item => item.stage_group_order || 0));
  const newGroupId = generateTempId();
  const baseGroupName = targetStages[0].stage_group_name || '复制的阶段';
  const newGroupName = `${baseGroupName}（复制）`;
  
  // 创建新的阶段副本
  const newStages = targetStages.map((stage, index) => ({
    ...stage,
    stage_group_id: newGroupId,
    stage_group_name: newGroupName,
    stage_group_order: maxOrder + index + 1
  }));
  
  // 添加新的阶段
  pipelineActionsDefault.value.push(...newStages);
  
  // 重新计算所有group_order（从1开始递增）
  pipelineActionsDefault.value
    .sort((a, b) => (a.stage_group_order || 0) - (b.stage_group_order || 0))
    .forEach((stage, index) => {
      stage.stage_group_order = index + 1;
    });
  
  ElMessage.success('操作组复制成功');
}

const handleDeletePielineAction = (stage_group_id: string) => {
  // 使用confirm对话框确认删除
  ElMessageBox.confirm(
    '确定要删除这个操作组吗？删除后将无法恢复。',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 过滤掉要删除的阶段
    const filteredStages = pipelineActionsDefault.value.filter(
      item => item.stage_group_id !== stage_group_id
    );
    
    // 更新阶段配置
    if (filteredStages.length !== pipelineActionsDefault.value.length) {
      pipelineActionsDefault.value = filteredStages;
      
      // 重新计算所有group_order（从1开始递增）
      pipelineActionsDefault.value.forEach((stage, index) => {
        stage.stage_group_order = index + 1;
      });
      
      ElMessage.success('操作组删除成功');
    } else {
      ElMessage.error('未找到对应的操作组');
    }
  }).catch(() => {
    // 用户取消删除
    ElMessage.info('已取消删除');
  });
}

const handleMoveForwardPielineAction = (stage_group_id: string) => {
  // 找到指定stage_group_id的所有阶段
  const targetStages = pipelineActionsDefault.value.filter(
    item => item.stage_group_id === stage_group_id
  );
  
  if (targetStages.length === 0) {
    ElMessage.error('未找到对应的操作组');
    return;
  }
  
  // 获取目标组的最小order
  const targetMinOrder = Math.min(...targetStages.map(item => item.stage_group_order || 0));
  
  // 如果已经是第一个，不能再向前移动
  if (targetMinOrder <= 1) {
    ElMessage.info('已经是第一个操作组，无法向前移动');
    return;
  }
  
  // 获取前一个组的所有阶段
  const prevStages = pipelineActionsDefault.value.filter(
    item => (item.stage_group_order || 0) < targetMinOrder
  );
  
  if (prevStages.length === 0) {
    ElMessage.info('已经是第一个操作组，无法向前移动');
    return;
  }
  
  // 获取前一个组的最大order
  const prevMaxOrder = Math.max(...prevStages.map(item => item.stage_group_order || 0));
  
  // 交换顺序
  pipelineActionsDefault.value.forEach(stage => {
    if (targetStages.some(t => t.stage_group_id === stage.stage_group_id)) {
      // 目标组的order减去前一组的数量
      stage.stage_group_order = (stage.stage_group_order || 0) - prevStages.length;
    } else if (prevStages.some(p => p.stage_group_id === stage.stage_group_id)) {
      // 前一组的order加上目标组的数量
      stage.stage_group_order = (stage.stage_group_order || 0) + targetStages.length;
    }
  });
  
  ElMessage.success('操作组向前移动成功');
}

const handleMoveBackwardPielineAction = (stage_group_id: string) => {
  // 找到指定stage_group_id的所有阶段
  const targetStages = pipelineActionsDefault.value.filter(
    item => item.stage_group_id === stage_group_id
  );
  
  if (targetStages.length === 0) {
    ElMessage.error('未找到对应的操作组');
    return;
  }
  
  // 获取目标组的最大order
  const targetMaxOrder = Math.max(...targetStages.map(item => item.stage_group_order || 0));
  // 获取所有阶段的最大order
  const maxOrder = Math.max(...pipelineActionsDefault.value.map(item => item.stage_group_order || 0));
  
  // 如果已经是最后一个，不能再向后移动
  if (targetMaxOrder >= maxOrder) {
    ElMessage.info('已经是最后一个操作组，无法向后移动');
    return;
  }
  
  // 获取后一个组的所有阶段
  const nextStages = pipelineActionsDefault.value.filter(
    item => (item.stage_group_order || 0) > targetMaxOrder
  );
  
  if (nextStages.length === 0) {
    ElMessage.info('已经是最后一个操作组，无法向后移动');
    return;
  }
  
  // 获取后一个组的最小order
  const nextMinOrder = Math.min(...nextStages.map(item => item.stage_group_order || 0));
  
  // 交换顺序
  pipelineActionsDefault.value.forEach(stage => {
    if (targetStages.some(t => t.stage_group_id === stage.stage_group_id)) {
      // 目标组的order加上后一组的数量
      stage.stage_group_order = (stage.stage_group_order || 0) + nextStages.length;
    } else if (nextStages.some(n => n.stage_group_id === stage.stage_group_id)) {
      // 后一组的order减去目标组的数量
      stage.stage_group_order = (stage.stage_group_order || 0) - targetStages.length;
    }
  });
  
  ElMessage.success('操作组向后移动成功');
}


const handlePielineSubmit = async () => {
  if (!pipelineForm.value) return;

  const resultTableData: Omit<Pipeline, 'id'> = {
    name: formData.name,
    pipeline_group: formData.pipeline_group,
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
  background-color: #f5f5f5;
  line-height: 35px;
}

.button-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
