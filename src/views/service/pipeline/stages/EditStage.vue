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
          :props="defaultProps"
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
              <span>{{ data.label }}</span>
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
            :key="type.value"
            :label="type.name"
            :value="type.value"
          ></el-option>
        </el-select>
        
        <component 
          :is="currentStageComponent"
          v-if="selectedStageType"
          style="margin-top: 15px;"
          @update:config="handleStageConfigUpdate($event, selectedStageType)"
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
import { defineProps, defineEmits, ref, watch, computed} from 'vue';
import { ElMessageBox } from 'element-plus';
import BuildStage from './BuildStage.vue';
import CheckPointStage from './CheckPointStage.vue';
import TestStage from './TestStage.vue';
import { StageType } from '@/types/pipeline-stagetype'

// 添加阶段配置存储
const stageConfig = ref<{
  build?: {
    buildCommand: string;
    imageName: string;
    buildDir: string;
  };
  checkpoint?: {
    checkpointName: string;
  };
  test?: {
    reportPath: string;
  }
}>({});

// 选中的阶段类型
const selectedStageType = ref('');
// 选中的节点key - 现在存储的是节点的stage_order
const selectedKeys = ref<string[]>([]);
// 跟踪当前选中的节点对象
const currentNode = ref<any>(null);

const props = defineProps({
  visible: Boolean,
  title: { type: String, default: '编辑阶段' },
  stageId: Number
});

const emits = defineEmits(['update:visible', 'confirm', 'cancel']);
const visible = ref(props.visible);

// 同步visible状态
watch(() => props.visible, (val) => {
  visible.value = val;
});

watch(visible, (val) => {
  emits('update:visible', val);
});

// 监听阶段类型变化，更新选中节点的label
watch(selectedStageType, (newVal) => {
  if (newVal && currentNode.value) {
    const stageTypeName = StageType.find(type => type.value === newVal)?.name || '';
    // 更新当前选中节点的label
    currentNode.value.label = stageTypeName;
    // 触发视图更新
    menuData.value = [...menuData.value];
  }
});

// 根据选中的阶段类型动态切换组件
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

const handleStageConfigUpdate = (config: any, stageType: string) => {
if (stageType === 'build' || stageType === 'checkpoint' || stageType === 'test') {
  (stageConfig.value as any)[stageType] = config;
}
};

const handleConfirm = () => {
  // 从StageType中获取选中类型的name
  const stageTypeName = StageType.find(type => type.value === selectedStageType.value)?.name || '';
  emits('confirm', {
    name: stageTypeName,
    type: selectedStageType.value,
    config: selectedStageType.value in stageConfig.value ? stageConfig.value[selectedStageType.value as keyof typeof stageConfig.value] : undefined
  });
  emits('update:visible', false);
  visible.value = false;
};

const handleCancel = () => {
  emits('cancel');
  visible.value = false;
};

const defaultProps = { label: 'label' };

const handleNodeClick = (data: any) => {
  console.log('点击节点:', data);
  // 设置选中节点的stage_order
  selectedKeys.value = [data.stage_order.toString()];
  // 保存当前选中的节点对象
  currentNode.value = data;
};

// 添加菜单数据和处理函数 - 为节点添加stage_order
const menuData = ref([
  {
    stage_order: 0, // 从0开始
    label: '构建'
  }
]);

// 添加移动、添加和删除节点的方法
const moveUp = (node: any) => {
  if (!node || typeof node.stage_order !== 'number') {
    console.error('无效的节点数据: 缺少stage_order属性');
    return;
  }
  const index = menuData.value.findIndex(item => item.stage_order === node.stage_order);
  if (index > 0) {
    // 交换节点位置
    [menuData.value[index], menuData.value[index - 1]] = [menuData.value[index - 1], menuData.value[index]];
    // 更新stage_order
    updateStageOrders();
    // 触发视图更新
    menuData.value = [...menuData.value];
  }
};

// 修改 moveDown 方法，使用stage_order查找节点
const moveDown = (node: any) => {
  if (!node || typeof node.stage_order !== 'number') {
    console.error('无效的节点数据: 缺少stage_order属性');
    return;
  }
  const index = menuData.value.findIndex(item => item.stage_order === node.stage_order);
  if (index !== -1 && index < menuData.value.length - 1) {
    // 交换节点位置
    [menuData.value[index], menuData.value[index + 1]] = [menuData.value[index + 1], menuData.value[index]];
    // 更新stage_order
    updateStageOrders();
    // 触发视图更新
    menuData.value = [...menuData.value];
  }
};

// 修改 addNode 方法，添加新节点并分配正确的stage_order
const addNode = (node: any) => {
  console.log('添加节点:', node);
  if (!node || typeof node.stage_order !== 'number') {
    console.error('无效的节点数据: 缺少stage_order属性');
    return;
  }
  const index = menuData.value.findIndex(item => item.stage_order === node.stage_order);
  if (index !== -1) {
    // 在当前节点后添加新节点
    menuData.value.splice(index + 1, 0, {
      stage_order: menuData.value.length, // 临时值，将在updateStageOrders中修正
      label: `新节点${menuData.value.length + 1}`
    });
    // 更新stage_order
    updateStageOrders();
    // 触发视图更新
    menuData.value = [...menuData.value];
  }
};

// 修改 deleteNode 方法，使用stage_order查找节点
const deleteNode = (node: any) => {
  console.log('删除节点:', node);
  if (!node || typeof node.stage_order !== 'number') {
    console.error('无效的节点数据: 缺少stage_order属性');
    return;
  }
  const index = menuData.value.findIndex(item => item.stage_order === node.stage_order);
  if (index !== -1) {
    // 显示确认弹窗
    ElMessageBox.confirm(
      '确定要删除这个节点吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      // 用户点击确定，执行删除
      menuData.value.splice(index, 1);
      // 确保至少保留一个节点
      if (menuData.value.length === 0) {
        menuData.value = [{
          stage_order: 0,
          label: '默认节点'
        }];
      } else {
        // 更新stage_order
        updateStageOrders();
      }
      // 如果删除的是当前选中的节点，清除选中状态
      if (currentNode.value && currentNode.value.stage_order === node.stage_order) {
        currentNode.value = null;
        selectedKeys.value = [];
      }
      // 自动选中第一个节点（如果有）
      if (menuData.value.length > 0) {
        currentNode.value = menuData.value[0];
        selectedKeys.value = [menuData.value[0].stage_order.toString()];
      }
      // 触发视图更新
      menuData.value = [...menuData.value];
    }).catch(() => {
      // 用户点击取消，不执行操作
    });
  }
};

// 添加辅助函数：更新所有节点的stage_order，确保从0开始连续递增
const updateStageOrders = () => {
  menuData.value.forEach((node, index) => {
    node.stage_order = index;
  });
};
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