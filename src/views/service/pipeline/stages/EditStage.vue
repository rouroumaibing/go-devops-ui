<template>
  <el-dialog 
    v-model="visible"
    :title="title"
    width="70%"
  >
    <el-row :gutter="20">
      <!-- 左侧菜单 - 占30%宽度 -->
      <el-col :span="7">
        <el-tree-v2
          style="height: 400px; border: 2px solid #eee"
          :data="menuData"
          @node-click="handleNodeClick"
          v-model:selectedKeys="selectedKeys"
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
                <el-icon @click.stop="addNode(data)" size="16"><Plus /></el-icon>
                <el-icon @click.stop="deleteNode(data)" size="16"><Minus /></el-icon>
              </div>
            </div>
          </template>
        </el-tree-v2>
      </el-col>
      
      <!-- 右侧内容 - 占70%宽度 -->
      <el-col :span="17">
        
        <!-- 添加阶段类型选择器 -->
        <el-select 
          v-model="selectedStageType"
          placeholder="请选择阶段类型"
          style="margin-top: 15px;"
        >
          <el-option 
            v-for="type in StageType"
            :key="type.name"
            :label="type.value"
            :value="type.name"
          ></el-option>
        </el-select>
        
        <component 
          :is="currentStageComponent"
          v-if="selectedStageType"
          style="margin-top: 15px;"
          :config="currentStageConfig"
          @update:config="handleStageConfigUpdate"
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
import { ElMessageBox } from 'element-plus';
import BuildStage from './BuildStage.vue';
import CheckPointStage from './CheckPointStage.vue';
import TestStage from './TestStage.vue';
import { StageType } from '@/types/pipeline-stagetype';
import { Pipeline_stages, Pipeline_job } from '@/types/pipeline';

const stageConfig = ref<Record<string, any>>({});
const selectedStageType = ref<string>('new_group');
const selectedKeys = ref<string[]>([]);
const currentNode = ref<Pipeline_stages | null>(null);
const currentStageConfig = ref<Record<string, any>>({});
const menuData = ref<Pipeline_stages[]>([]);
// 初始化menuData的函数
const initMenuData = () => {
  // 使用传递的actionName或默认值
  const groupName = props.actionName || '构建';
  menuData.value = [
    {
      group_name: groupName,
      stage_order: 0,
      stage_name: groupName,
      pipeline_jobs: { parameters: '', status: '' }
    }
  ];

  // 设置selectedStageType
  const defaultStage = menuData.value[0];
  if (defaultStage) {
    const stageType = StageType.find(type => type.value === defaultStage.stage_name)?.name || '';
    if (stageType) {
      selectedStageType.value = stageType;
    }
  }
};

// Props和Emits
const props = defineProps({
  visible: Boolean,
  title: { type: String, default: '编辑阶段' },
  stageId: Number,
  actionName: String, 
  groupId: String
});
const visible = ref<boolean>(props.visible);

const emits = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'confirm', stages: Array<{ name: string; type: string; config: any; stage_order: number }>): void;
  (e: 'cancel'): void;
}>();


// 计算属性 - 动态切换组件
const currentStageComponent = computed(() => {
  switch(selectedStageType.value) {
    case 'build':
      return BuildStage;
    case 'checkpoint':
      return CheckPointStage;
    case 'test':
      return TestStage;
    default:
      return null;
  }
});

// 方法 - 更新配置
const handleStageConfigUpdate = (config: Record<string, any>): void => {
  if (currentNode.value) {
    const stageOrder = currentNode.value.stage_order?.toString() || '';
    stageConfig.value[stageOrder] = {
      type: selectedStageType.value,
      config
    };
  }
};

// 方法 - 确认
const handleConfirm = (): void => {
  const stages = menuData.value.map(node => {
    const stageOrder = node.stage_order?.toString() || '';
    const stageInfo = stageConfig.value[stageOrder] || { type: '', config: {} };
    return {
      name: node.stage_name || '',
      type: stageInfo.type,
      config: stageInfo.config,
      stage_order: node.stage_order || 0
    };
  });
  
  emits('confirm', stages);
  emits('update:visible', false);
  visible.value = false;
};

// 方法 - 取消
const handleCancel = (): void => {
  emits('cancel');
  visible.value = false;
};

// 方法 - 节点点击
const handleNodeClick = (data: any, node: any, e: MouseEvent): void => {
  const stageNode = data as Pipeline_stages;
  selectedKeys.value = [stageNode.stage_order?.toString() || ''];
  currentNode.value = stageNode;
  
  const stageType = StageType.find(type => type.value === stageNode.stage_name)?.name || '';
  if (stageType) {
    selectedStageType.value = stageType;
    const stageOrder = stageNode.stage_order?.toString() || '';
    // 使用nextTick确保DOM更新后再加载配置
    nextTick(() => {
      currentStageConfig.value = { ...(stageConfig.value[stageOrder]?.config || {}) };
    });
  }
};

// 方法 - 上移节点
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

// 方法 - 添加节点
const addNode = (node: Pipeline_stages): void => {
  const index = menuData.value.findIndex(item => item.stage_order === node.stage_order);
  if (index !== -1) {
    menuData.value.splice(index + 1, 0, {
      group_name: '新建分组',
      stage_order: menuData.value.length,
      stage_name: '新建阶段',
      pipeline_jobs: { parameters: '', status: '' }
    });
    
    updateStageOrders();
    menuData.value = [...menuData.value];
    
    const newNode = menuData.value[index + 1];
    currentNode.value = newNode;
    selectedKeys.value = [newNode.stage_order?.toString() || ''];
    selectedStageType.value = 'new_group';
    
    const newStageOrder = newNode.stage_order?.toString() || '';
    stageConfig.value[newStageOrder] = {
      type: 'new_group',
      config: {}
    };
    
    currentStageConfig.value = stageConfig.value[newStageOrder].config;
  }
};

// 方法 - 删除节点
const deleteNode = (node: Pipeline_stages): void => {
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
          group_name: '默认分组',
          stage_order: 0,
          stage_name: '默认阶段',
          pipeline_jobs: { parameters: '', status: '' }
        }];
      } else {
        updateStageOrders();
      }
      
      if (currentNode.value?.stage_order === node.stage_order) {
        currentNode.value = null;
        selectedKeys.value = [];
      }
      
      if (menuData.value.length > 0) {
        currentNode.value = menuData.value[0];
        selectedKeys.value = [menuData.value[0].stage_order?.toString() || ''];
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
  const newStageConfig: Record<string, any> = {};
  
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
  
  // 更新配置
  stageConfig.value = newStageConfig;
};

// 生命周期 - 挂载
onMounted(() => {
  initMenuData();
  if (menuData.value.length > 0) {
    currentNode.value = menuData.value[0];
    selectedKeys.value = [menuData.value[0].stage_order?.toString() || ''];
    const stageOrder = menuData.value[0].stage_order?.toString() || '';
    currentStageConfig.value = stageConfig.value[stageOrder]?.config || {};
  }
});

// 监听actionName变化，重新初始化menuData
watch(
  () => props.actionName,
  (newActionName) => {
    if (newActionName) {
      initMenuData();
    }
  }
);

// 监听 - visible状态同步
watch(() => props.visible, (val) => {
  visible.value = val;
});

watch(visible, (val) => {
  emits('update:visible', val);
});

// 监听 - 阶段类型变化
watch(selectedStageType, (newVal) => {
  if (newVal && currentNode.value) {
    const stageTypeItem = StageType.find(type => type.name === newVal);
    if (stageTypeItem) {
      currentNode.value.stage_name = stageTypeItem.value;
      // 确保menuData触发更新
      menuData.value = [...menuData.value];
    }
  }
});
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
