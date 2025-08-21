<template>
  <el-dialog 
    v-model="visible"
    :title="title"
    width="70%"
  >
    <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
      <el-form-item label="阶段名称" prop="stage_group_name">
        <el-input v-model="formData.stage_group_name" placeholder="请输入阶段名称" />
      </el-form-item>
      <el-form-item label="阶段类型" prop="stage_type">
        <el-select 
          v-model="selectedStageType"
          placeholder="请选择阶段类型"
        >
          <el-option 
            v-for="type in StageType"
            :key="type.name"
            :label="type.value"
            :value="type.name"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="是否并行" prop="parallel">
        <el-switch
          v-model="formData.parallel"
          class="mt-2"
          style="margin-left: 24px"
          inline-prompt
          :active-icon="Check"
          :inactive-icon="Close"
        />
      </el-form-item>
    </el-form>

    <el-row :gutter="20">
      <!-- 左侧菜单 - 占30%宽度 -->
      <el-col :span="7">
        <el-tree-v2
          style="height: 400px; border: 2px solid #eee"
          :data="menuData"
          @node-click="handleJobClick"
          v-model:selectedJobKeys="selectedJobKeys"
          node-key="stage_order"
        >
          <template #default="{ data }">
            <div class="tree-node-content">
              <div class="left-icons">
                <el-icon @click.stop="moveUp(data)" size="16"><Top /></el-icon>
                <el-icon @click.stop="moveDown(data)" size="16"><Bottom /></el-icon>
              </div>
              <span>{{ data.stage_name }}</span>
              <div class="right-icons">
                <el-icon @click.stop="addJob(data)" size="16"><Plus /></el-icon>
                <el-icon @click.stop="deleteJob(data)" size="16"><Minus /></el-icon>
              </div>
            </div>
          </template>
        </el-tree-v2>
      </el-col>
      
      <!-- 右侧内容 - 占70%宽度 -->
      <el-col :span="17">
        <el-form-item label="任务名称" formProps="stage_name">
          <el-input v-model="formData.stage_name" placeholder="请输入任务名称"></el-input>
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select 
            v-model="selectedJobType"
            placeholder="请选择任务类型"
            style="margin-top: 0px;"
          >
            <el-option 
              v-for="job in StageType.find(type => type.name === selectedStageType)?.job"
              :key="job.name"
              :label="job.value"
              :value="job.name"
            ></el-option>
          </el-select>
        </el-form-item>
        <component 
          :is="currentStageComponent"
          v-if="selectedJobType"
          style="margin-top: 15px;"
          :config="currentJobConfig"
          @update:config="handleJobConfigUpdate"
        ></component>
      </el-col>
    </el-row>
    
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch, computed, onMounted, nextTick } from 'vue';
import { Check, Close, Top, Bottom, Plus, Minus } from '@element-plus/icons-vue';
import { ElMessageBox, ElForm } from 'element-plus';
import BuildStage from './stages/BuildStage.vue';
import CheckPointStage from './stages/CheckPointStage.vue';
import DeployStage from './stages/DeployStage.vue';
import TestStage from './stages/TestStage.vue';
import { StageType } from '@/types/pipeline-stagetype';
import { Pipeline_stages, Pipeline_job } from '@/types/pipeline';

const selectedStageType = ref<string>('');
const selectedJobType = ref<string>('');
const selectedJobKeys = ref<string[]>([]);
const currentJob = ref<Pipeline_stages | null>(null);
const currentJobConfig = ref<Record<string, any>>({});
const formRef = ref<InstanceType<typeof ElForm> | null>(null);
const formData = ref<{ stage_group_name: string; stage_name: string; parallel: boolean }>({ stage_group_name: '', stage_name: '', parallel: false });

const rules = ref<Record<string, any>>({
  stage_name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  stage_group_name: [{ required: true, message: '请输入阶段名称', trigger: 'blur' }],
  stage_type: [{ required: false, message: '请选择阶段类型', trigger: 'blur' }]
});

// Props和Emits
const props = defineProps({
  visible: Boolean,
  title: { type: String, default: '编辑ing' },
  stageGroupId: String,
  stageGroupName: String, 
  stageGroupOrder: Number,
  stageType: String,
  parallel: Boolean,
  pipelineGroupData: { type: Array as () => Pipeline_stages[], default: () => [] }
});
const visible = ref<boolean>(props.visible);
let menuData: Pipeline_stages[] = [];

const initMenuData = () => {
    Object.values(props.pipelineGroupData).forEach((value) => {
    if (value.stage_group_id === props.stageGroupId) {
      menuData.push(value);
    }
  });
  // 按stage_group_order和stage_order排序
  menuData.sort((a, b) => {
    if (a.stage_group_order !== b.stage_group_order) {
      return a.stage_group_order! - b.stage_group_order!;
    }
    return a.stage_order! - b.stage_order!;
  });

  return menuData;
};

const emits = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'confirm', data: Pipeline_stages[]): void;
  (e: 'cancel'): void;
  (e: 'update: current-edit-configs', configs: Pipeline_stages[]): void;

}>();

const currentJobsClean = () => {
  // 只在切换阶段类型时重置job_type，而不是每次都重置
  if (currentJob.value && selectedJobType.value) {
    // 保留当前选中的job_type
    const currentJobType = selectedJobType.value;
    nextTick(() => {
      selectedJobType.value = currentJobType;
    });
  } else {
    selectedJobType.value = '';
  }
};

// 计算属性 - 动态切换组件
const currentStageComponent = computed(() => {
  switch(selectedStageType.value) {
    case 'build':
      currentJobsClean()
      return BuildStage;
    case 'checkpoint':
      currentJobsClean()
      return CheckPointStage;
    case 'deploy':
      currentJobsClean()
      return DeployStage;
    case 'test':
      currentJobsClean()
      return TestStage;
    default:
      return null;
  }
});

function handleJobConfigUpdate(config: Record<string, any>) {
  if (currentJob.value) {
    currentJob.value.stage_type = selectedStageType.value;
    currentJob.value.job_type = selectedJobType.value;
    
    Object.values(menuData).forEach((value) => {
        if (value.stage_order === currentJob.value?.stage_order) {
          value.pipeline_job.parameters = JSON.stringify(config);
        }
      });
  }
  menuData = [...menuData];
}

// 方法 - 确认
const handleConfirm = async (): Promise<void> => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    
    let jobSelectedItems: Pipeline_stages[] = []; 
    Object.values(menuData).forEach(node => {
      // 更新阶段名称
      node.stage_group_name = formData.value.stage_group_name;
      // 确认是否并行
      node.parallel = formData.value.parallel;
      if (currentJob.value && node.stage_order === currentJob.value.stage_order) {
        //更新任务名称
        node.stage_name = formData.value.stage_name;
      }
      const tmpConfig = JSON.parse(node.pipeline_job.parameters|| '{}')
      // 如果配置中有selectedItems，则为每个环境生成一个阶段
      if (tmpConfig?.selectedItems){
          const baseStageName = node.stage_name || '';
          const stagesItems = tmpConfig.selectedItems.map((item: any, index: number) => ({
            stage_group_id: node.stage_group_id,
            stage_group_name: formData.value.stage_group_name,
            stage_group_order: node.stage_group_order || 0,
            stage_name: `${baseStageName}-${item.name}`,
            stage_type: node.stage_type,
            job_type: selectedJobType.value,
            stage_order: node.stage_order + index,
            parallel: node.parallel,
            pipeline_job: {
              parameters: JSON.stringify({...tmpConfig, selectedItems: [item]})
            },
          }));
          jobSelectedItems = [...jobSelectedItems, ...stagesItems];
        } else {
          // 其他类型的阶段保持不变
          jobSelectedItems.push({
            stage_group_id: node.stage_group_id,
            stage_group_name: node.stage_group_name,
            stage_group_order: node.stage_group_order,
            stage_name: node.stage_name,
            stage_type: node.stage_type,
            job_type: selectedJobType.value,
            stage_order: node.stage_order,
            parallel: node.parallel,
            pipeline_job: tmpConfig, 
          });
        }
    });

    menuData = jobSelectedItems;

    updateStageOrders();

    emits('confirm', menuData);
    emits('update:visible', false);
    visible.value = false;

  } catch (error) {
    // 表单验证失败，不执行后续操作
    console.log('表单验证失败:', error);
  }
};
defineExpose({
  handleJobConfigUpdate,
  handleConfirm,
  currentJobConfig
});

// 方法 - 取消
const handleCancel = (): void => {
  emits('cancel');
  visible.value = false;
};

// 方法 - 点击任务
const handleJobClick = (data: any, node: any, e: MouseEvent): void => {
  const stageJob = data as Pipeline_stages;
  selectedJobKeys.value = [stageJob.stage_order.toString()];
  currentJob.value = stageJob;

  nextTick(() => {
    currentJobConfig.value = JSON.parse(stageJob.pipeline_job.parameters || '{}');
    selectedJobType.value = stageJob.job_type || ''
    if (currentJob.value?.stage_type) {
      selectedStageType.value = currentJob.value.stage_type;
    }
  });
};

// 方法 - 上移任务
const moveUp = (node: Pipeline_stages): void => {
  const index = menuData.findIndex(item => item.stage_order === node.stage_order);
  if (index > 0) {
    [menuData[index], menuData[index - 1]] = [menuData[index - 1], menuData[index]];
    updateStageOrders();
    menuData = [...menuData];
  }
};

// 方法 - 下移节点
const moveDown = (node: Pipeline_stages): void => {
  const index = menuData.findIndex(item => item.stage_order === node.stage_order);
  if (index !== -1 && index < menuData.length - 1) {
    [menuData[index], menuData[index + 1]] = [menuData[index + 1], menuData[index]];
    updateStageOrders();
    menuData = [...menuData];
  }
};

// 方法 - 添加任务
const addJob = (job: Pipeline_stages): void => {
  
  const index = menuData.findIndex(item => item.stage_order === job.stage_order);

  if (index !== -1) {
    const newJob: Pipeline_stages = {
      stage_group_name: job.stage_group_name,
      stage_group_order: job.stage_group_order,
      stage_type: '',
      stage_name: '新建任务',
      parallel: false,
      stage_order: index + 1,
      job_type: '', 
      pipeline_job: {}
    };
    
    menuData.splice(index + 1, 0, newJob);

    updateStageOrders();

    menuData = [...menuData];
    currentJob.value = menuData[index + 1];
    currentJobConfig.value = {};
    selectedJobKeys.value = [menuData[index + 1].stage_order?.toString() || ''];
    selectedJobType.value = '';
  }
};

// 方法 - 删除任务
const deleteJob = (node: Pipeline_stages): void => {
  const index = menuData.findIndex(item => item.stage_order === node.stage_order);
  if (index !== -1) {
    ElMessageBox.confirm(
      '确定要删除这个节点吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      menuData.splice(index, 1);
      
      if (menuData.length === 0) {
        menuData = [{
          stage_group_name: '新建阶段',
          stage_group_order: props.stageGroupOrder || 0,
          stage_order: 0,
          stage_name: '新建任务',
          parallel: false,
          pipeline_job: {}
        }];
      } else {
        updateStageOrders();
      }
            
      if (menuData.length > 0) {
        currentJob.value = menuData[0];
        selectedJobKeys.value = [menuData[0].stage_order?.toString() || ''];
      }
      
      menuData = [...menuData];
    }).catch(() => {
      // 取消删除
    });
  }
};

// 方法 - 更新节点顺序
const updateStageOrders = (): void => {
  menuData.forEach((node, index) => {
    node.stage_order = index;
  });
  menuData = [...menuData];
};


// 修改onMounted钩子，确保初始化stageConfig.value
onMounted(() => {
  menuData = initMenuData();
  if (menuData.length > 0) {
    const firstJob = menuData[0];
    currentJob.value = firstJob;
    selectedJobKeys.value = [firstJob.stage_order?.toString() || ''];
    selectedJobType.value = firstJob.job_type || '';
    selectedStageType.value = firstJob.stage_type || '';
    currentJobConfig.value = firstJob.pipeline_job.parameters ? JSON.parse(firstJob.pipeline_job.parameters) : {};
    formData.value.stage_name = firstJob.stage_name || '';
  }
});

// 修改props.visible的watch，确保每次打开对话框时都能正确初始化数据
watch(
  () => props.visible,
  (newVisible) => {
    visible.value = newVisible;
    
    // 当对话框打开时，重新初始化数据
    if (newVisible) {
      menuData = initMenuData();
      if (menuData.length > 0) {
        const firstJob = menuData[0];
        currentJob.value = firstJob;
        selectedJobKeys.value = [firstJob.stage_order?.toString() || ''];
        selectedJobType.value = firstJob.job_type || '';
        selectedStageType.value = firstJob.stage_type || '';
        currentJobConfig.value = firstJob.pipeline_job.parameters ? JSON.parse(firstJob.pipeline_job.parameters) : {};
        formData.value.stage_name = firstJob.stage_name || '';
      }
    }
  },
  { immediate: true }
);

watch(
  () => props.stageGroupName,
  (newGroupName) => {
    if (newGroupName) {
      menuData = initMenuData();
    }
  },
  { immediate: true }
);

watch(
  () => formData.value.stage_name,
  (newStageName) => {
    if (newStageName && currentJob.value) {
      currentJob.value.stage_name = newStageName || '';
    }
  }
);

// 监听selectedStageType变化，同步到currentJob
watch(
  () => selectedStageType.value,
  (newStageType) => {
    if (currentJob.value) {
      currentJob.value.stage_type = newStageType || '';
    }
  },
  { immediate: true }
);

watch(visible, (val) => {
  emits('update:visible', val);
});

watch(
  () => props.visible,
  (newVisible) => {
    visible.value = newVisible;
  },
  { immediate: true }
);

</script>

<style scoped>
.tree-node-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.left-icons {
  display: flex;
  gap: 4px;
}

.right-icons {
  display: flex;
  gap: 4px;
}
</style>
