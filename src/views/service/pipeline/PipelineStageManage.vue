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
const menuData = ref<Pipeline_stages[]>([]);
const stageOrder = ref<number>(0);
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
  stageId: Number,
  stageGroupName: String, 
  stageType: String,
  stageName: String,
  parallel: Boolean,
  stageGroupId: String,
  stageConfigs: { type: Object, default: () => ({}) }
});
const visible = ref<boolean>(props.visible);
const stageConfig = ref<Record<string, Pipeline_job>>({});

// 在initMenuData函数中使用正确的类型
const initMenuData = (stageConfigs: Record<string, Pipeline_stages>) => {
  const menuData: Pipeline_stages[] = [];
  
  // 检查stageConfigs是否为空对象
  if (Object.keys(stageConfigs).length === 0) {
    // 如果是空对象，创建一个默认的菜单项
    menuData.push({
      id: '',
      stage_group_id: props.stageGroupId || '',
      stage_group_name: props.stageGroupName || '新建阶段',
      stage_group_order: 0,
      stage_type: props.stageType || '',
      stage_name: '新建任务',
      stage_order: 0,
      parallel: false,
      job_type: '',
      pipeline_jobs: {
        parameters: '',
        status: ''
      }
    });
  } else {
    // 原有逻辑：遍历配置项
    Object.keys(stageConfigs).forEach(key => {
      const config = stageConfigs[key];
      menuData.push({
        id: config.id,
        stage_group_id: config.stage_group_id,
        stage_group_name: config.stage_group_name,
        stage_group_order: config.stage_group_order,
        stage_type: config.stage_type,
        stage_name: config.stage_name,
        stage_order: config.stage_order,
        parallel: config.parallel,
        job_type: config.job_type,
        pipeline_jobs: config.pipeline_jobs
      });
    });
  }
  
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
  (e: 'confirm', data: { stages: Pipeline_stages[], stage_group_name: string }): void;
  (e: 'cancel'): void;
  (e: 'update:stage-configs', configs: Record<string, Pipeline_job>): void;
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
  menuData.value = [...menuData.value];
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
    // 更新currentJob中的stage_type和job_type
    currentJob.value.stage_type = selectedStageType.value;
    currentJob.value.job_type = selectedJobType.value;
    
    // 只在Pipeline_job对象中使用parameters属性
    stageConfig.value[stageOrder.value] = {
      ...stageConfig.value[stageOrder.value],
      parameters: JSON.stringify(config)
    };
    emits('update:stage-configs', stageConfig.value);
  }
}

// 方法 - 确认
const handleConfirm = async (): Promise<void> => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    
    updateStageOrders();

    // 同步formData.group_name到menuData
    menuData.value.forEach(node => {
      node.stage_group_name = formData.value.stage_group_name;
    });

   // 处理部署阶段，根据selectedItems生成多个阶段
    let jobSelectedItems: Pipeline_stages[] = []; 
    menuData.value.forEach(node => {
      const stageOrder = node.stage_order?.toString() || '';
      const pipelineJob = stageConfig.value[stageOrder];
      
      // 尝试从parameters中解析配置，如果解析失败则使用空对象
      let config: Record<string, any> = {};
      if (pipelineJob?.parameters) {
        try {
          config = JSON.parse(pipelineJob.parameters);
        } catch (e) {
          console.error('Failed to parse parameters:', e);
        }
      }

      // 对于部署阶段，如果配置中有selectedItems，则为每个环境生成一个阶段
      if (config?.selectedItems) {
        const baseStageName = node.stage_name || '';
        const stagesItems = config.selectedItems.map((item: any, index: number) => ({
          stage_name: `${baseStageName}-${item.name}`,
          stage_type: node.stage_type || props.stageType || '',
          job_type: node.job_type,
          stage_order: (node.stage_order || 0) + index,
          parallel: node.parallel,
          pipeline_jobs: {
            parameters: JSON.stringify({...config, selectedItems: [item]})
          },
          stage_group_name: formData.value.stage_group_name
        }));

        jobSelectedItems = [...jobSelectedItems, ...stagesItems];
      } else {
        // 其他类型的阶段保持不变
        jobSelectedItems.push({
          stage_name: node.stage_name || '',
          stage_type: node.stage_type || props.stageType || '',
          job_type: node.job_type,
          stage_order: node.stage_order || 0,
          parallel: node.parallel,
          pipeline_jobs: pipelineJob,
          stage_group_name: formData.value.stage_group_name
        });
      }
    });

    // 传递包含stages和stage_group_name的对象
    emits('confirm', {
      stages: jobSelectedItems,
      stage_group_name: formData.value.stage_group_name
    });
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
  selectedJobKeys.value = [stageJob.stage_order?.toString() || ''];
  currentJob.value = stageJob;
  nextTick(() => {
    const stageOrder = currentJob.value?.stage_order?.toString() ?? '';
    const jobConfig = stageConfig.value[stageOrder];
    currentJobConfig.value = jobConfig?.parameters ? JSON.parse(jobConfig.parameters) : {};
    selectedJobType.value = stageJob.job_type || '';
    // 只有当stage_type有有效值时才更新selectedStageType
    if (currentJob.value?.stage_type) {
      selectedStageType.value = currentJob.value.stage_type;
    }
  });
};

// 方法 - 上移任务
const moveUp = (node: Pipeline_stages): void => {
  const index = menuData.value.findIndex(item => item.stage_order === node.stage_order);
  if (index > 0) {
    [menuData.value[index], menuData.value[index - 1]] = [menuData.value[index - 1], menuData.value[index]];
    updateStageOrders();
    menuData.value = [...menuData.value];
  }
};

// 方法 - 下移节点
const moveDown = (node: Pipeline_stages): void => {
  const index = menuData.value.findIndex(item => item.stage_order === node.stage_order);
  if (index !== -1 && index < menuData.value.length - 1) {
    [menuData.value[index], menuData.value[index + 1]] = [menuData.value[index + 1], menuData.value[index]];
    updateStageOrders();
    menuData.value = [...menuData.value];
  }
};

// 方法 - 添加任务
const addJob = (job: Pipeline_stages): void => {
  
  const index = menuData.value.findIndex(item => item.stage_order === job.stage_order);

  if (index !== -1) {
    const newJob: Pipeline_stages = {
      stage_group_name: formData.value.stage_group_name,
      stage_type: '',
      stage_name: '新建任务',
      parallel: false,
      stage_order: menuData.value.length,
      job_type: '', // 添加job_type字段
      pipeline_jobs: { parameters: '', status: '' }
    };
    
    menuData.value.splice(index + 1, 0, newJob);

    updateStageOrders();
    menuData.value = [...menuData.value];
    
    const newNode = menuData.value[index + 1];
    currentJob.value = newNode;
    selectedJobKeys.value = [newNode.stage_order?.toString() || ''];

    const newStageOrder = newNode.stage_order?.toString() || '';
    // 只存储parameters，不存储stage_type和job_type
    stageConfig.value[newStageOrder] = {
      parameters: ''
    };
    
    // 更新newNode中的属性
    newNode.stage_type = '';
    newNode.job_type = '';
    
    currentJobConfig.value = {};
    selectedJobType.value = '';
  }
};

// 方法 - 删除任务
const deleteJob = (node: Pipeline_stages): void => {
  const index = menuData.value.findIndex(item => item.stage_order === node.stage_order);
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
      menuData.value.splice(index, 1);
      
      if (menuData.value.length === 0) {
        menuData.value = [{
          stage_group_name: '新建阶段',
          stage_order: 0,
          stage_name: '新建任务',
          parallel: false,
          pipeline_jobs: { parameters: '', status: '' }
        }];
      } else {
        updateStageOrders();
      }
      
      if (currentJob.value?.stage_order === node.stage_order) {
        currentJob.value = null;
        selectedJobKeys.value = [];
      }
      
      if (menuData.value.length > 0) {
        currentJob.value = menuData.value[0];
        selectedJobKeys.value = [menuData.value[0].stage_order?.toString() || ''];
      }
      
      menuData.value = [...menuData.value];
    }).catch(() => {
      // 取消删除
    });
  }
};

// 方法 - 更新节点顺序
const updateStageOrders = (): void => {
  // 保存当前的配置
  const oldStageConfig = { ...stageConfig.value };
  // 创建新的配置对象
  const newStageConfig: Record<string, Pipeline_job> = {}; 
  
  menuData.value.forEach((node, index) => {
    const oldStageOrder = node.stage_order?.toString() || '';
    // 更新节点的 stage_order 为其在数组中的索引
    node.stage_order = index;
    const newStageOrder = index.toString();
    
    // 如果旧配置中存在该节点的配置，则转移到新键
    if (oldStageConfig[oldStageOrder]) {
      newStageConfig[newStageOrder] = oldStageConfig[oldStageOrder];
    }
  });
  
  // 替换整个对象以确保响应式更新
  stageConfig.value = newStageConfig;
};

// 生命周期 - 挂载
onMounted(() => {
  menuData.value = initMenuData(props.stageConfigs as Record<string, Pipeline_stages>);
});

// 监听stageGroupName变化，重新初始化menuData
watch(
  () => props.stageGroupName,
  (newActionName) => {
    if (newActionName) {
      menuData.value = initMenuData(props.stageConfigs as Record<string, Pipeline_stages>);
    }
  },
  { immediate: true }
);

// 监听 - visible状态同步
watch(
  () => props.stageConfigs,
  (newConfigs) => {
    if (newConfigs) {
      // 使用JSON.stringify比较确保深度对比
      if (JSON.stringify(newConfigs) !== JSON.stringify(stageConfig.value)) {
        stageConfig.value = {...newConfigs};
        menuData.value = initMenuData(props.stageConfigs as Record<string, Pipeline_stages>);
      }
    }
  },
  { deep: true }
);

watch(visible, (val) => {
  emits('update:visible', val);
});

watch(
  () => formData.value.stage_name,
  (newStageType) => {
    if (newStageType && currentJob.value) {
      currentJob.value.stage_name = newStageType || '';
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
