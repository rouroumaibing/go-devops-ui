<template>
  <el-card class="environment-container">

    <el-container class="main-container">
      <el-aside width="300px" class="tree-aside">
        <div class="tree-container" ref="treeContainer" id="treeContainer" v-loading="loading" element-loading-text="加载中...">
          <el-tree-v2
            :height="treeHeight"
            ref="treeRef"
            :data="treeData"
            :props="props"
            :filter-method="filterMethod"
            @node-click="handleNodeClick"
            :default-expanded-keys="expandedKeys"
          >
            <template #default="{ data }">
              <div class="tree-node-content">
                <span>{{ data.name }}</span> 
                <el-button
                  v-if="!isLeafNode(data)"
                  class="add-node-btn"
                  size="small"
                  icon="Plus"
                  @click.stop="showAddNodeDialog(data)"
                />
              </div>
            </template>
          </el-tree-v2>
        </div>
        <el-empty v-if="!loading && treeData.length === 0" description="暂无环境数据"></el-empty>
      </el-aside>

      <!-- 右侧详情面板 -->
      <el-main class="detail-panel">
        <!-- 使用新的EnvironmentDetails组件 -->
        <EnvironmentDetails 
          :environment="selectedEnvironment"
          :parent-group="selectedGroup"
          :component-id="componentId || ''"
          @refresh-data="handleRefreshData"
          @environment-updated="handleEnvironmentUpdated"
        />
      </el-main>
    </el-container>

    <!-- 添加节点对话框 -->
    <el-dialog v-model="addNodeDialogVisible" title="添加节点" width="30%">
      <el-form ref="addNodeFormRef" :model="newNodeFormData" label-width="80px">
        <el-form-item label="节点名称" prop="name" :rules="[{ required: true, message: '请输入节点名称', trigger: 'blur' }]">
          <el-input v-model="newNodeFormData.name" placeholder="请输入节点名称"></el-input>
        </el-form-item>
        <el-form-item v-if="currentParentNode" label="节点类型">
          <el-radio-group v-model="newNodeFormData.env_type">
            <el-radio :value="'env_node'">环境节点</el-radio>
            <el-radio :value="'env_child_group'">子分组</el-radio>
            <el-radio :value="'env_same_group'">同级分组</el-radio>
          </el-radio-group>
        </el-form-item>

      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addNodeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="addChildNode">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref, onMounted, onBeforeUnmount, reactive, toRefs } from 'vue';
import { ElMessage, ElTreeV2, ElInput, ElButton, ElDialog, ElForm, ElFormItem, ElRadioGroup, ElRadio, ElMain, ElAside, ElContainer, ElCard } from 'element-plus';
import { useRoute } from 'vue-router';
import type { TreeNodeData, TreeInstance, FormInstance } from 'element-plus';
import { Environment } from '@/types/environment-manage';
// 引入新的EnvironmentDetails组件
import EnvironmentDetails from './EnvironmentDetails.vue';

interface EnvironmentTreeNode extends Environment, TreeNodeData {};

const state = reactive({
  treeData: [] as EnvironmentTreeNode[],
  loading: false,
  selectedEnvironment: null as EnvironmentTreeNode | null,
  selectedGroup: null as EnvironmentTreeNode | null,
  addNodeDialogVisible: false,
  currentParentNode: null as EnvironmentTreeNode | null,
  expandedKeys: [] as number[],
  treeHeight: 0
});

const { treeData, loading, selectedEnvironment, selectedGroup, addNodeDialogVisible, currentParentNode, expandedKeys, treeHeight } = toRefs(state);

const treeRef = ref<TreeInstance | null>(null);
const treeContainer = ref<HTMLDivElement | null>(null);
const addNodeFormRef = ref<FormInstance | null>(null);
const componentId = ref<string | undefined>(undefined);
const router = useRoute();

const newNodeForm = ():EnvironmentTreeNode=> {
  return {
    name: '',
    env_type: 'env_node' as 'env_node' | 'env_child_group' | 'env_same_group',
    is_env: false,
    is_prod: false,
    env_group: '',
    component_id: '',
    description: '',
    images_addr: '',
    images_user: '',
    images_pwd: '',
    kubernetes_addr: '',
    kubeconfig: '',
    kube_namespace: '',
    component_values: '',
    children: []
  };
};

// 创建一个ref对象来存储表单数据
const newNodeFormData = ref<EnvironmentTreeNode>(newNodeForm());

// 生成默认环境树数据
const generateDefaultEnvironmentTree = ref<EnvironmentTreeNode[]>([
  {
   ...newNodeForm()
  }
]);

const props = {
  label: 'name',
  children: 'children',
  isLeaf: (data: TreeNodeData) => {
    if (!isEnvironmentTreeNode(data)) return false;
    return data.is_env;
  }
};

const filterMethod = (value: string, data: TreeNodeData): boolean => {
  if (!isEnvironmentTreeNode(data)) return false;
  if (!value) return true;
  return data.label.toLowerCase().includes(value.toLowerCase());
};

// 类型守卫 - 判断是否为自定义树节点
function isEnvironmentTreeNode(data: TreeNodeData): data is EnvironmentTreeNode {
  return 'id' in data && 'name' in data && 'is_env' in data;
}

// 判断是否为叶子节点
const isLeafNode = (data: EnvironmentTreeNode) => {
  return data.is_env === true;
};

// 更新树高度
const updateTreeHeight = () => {
  if (treeContainer.value) {
    treeHeight.value = treeContainer.value.clientHeight - 20;
  }
};

const handleNodeClick = (data: TreeNodeData) => {
  if (isEnvironmentTreeNode(data) && data.is_env) {
    selectedEnvironment.value = data;
    findParentGroup(data);
  } else {
    selectedEnvironment.value = null;
    selectedGroup.value = data as EnvironmentTreeNode;
  }
};

const findParentGroup = (node: EnvironmentTreeNode) => {
  if (!treeRef.value || !node.id) return;
  const treeNode = treeRef.value.getNode(node.id);
  if (treeNode && treeNode.parent && treeNode.parent.data) {
    selectedGroup.value = treeNode.parent.data as EnvironmentTreeNode;
  }
};

const showAddNodeDialog = (parentNode: EnvironmentTreeNode) => {
  currentParentNode.value = parentNode;
  const newFormData = newNodeForm();
  newFormData.name = '';
  newFormData.env_type = 'env_node';
  newNodeFormData.value = newFormData;
  addNodeDialogVisible.value = true;
};

const collectAllNodeIds = (nodes: EnvironmentTreeNode[], ids: number[] = []): number[] => {
  nodes.forEach(node => {
    if (node.id) ids.push(node.id);
    if (node.children && node.children.length > 0) {
      collectAllNodeIds(node.children, ids);
    }
  });
  return ids;
};

const addChildNode = async () => {
  if (!currentParentNode.value) return;

  if (addNodeFormRef.value) {
    try {
      await addNodeFormRef.value.validate();
    } catch (error) {
      console.error('表单验证失败:', error);
      return;
    }
  }

  try {
    // 创建新节点
    let newNode: EnvironmentTreeNode;
    if (newNodeFormData.value.env_type == 'env_node') {
      // 创建环境节点
      newNode = {
        env_group: currentParentNode.value?.name || '', 
        component_id: componentId.value || '',
        name: newNodeFormData.value.name || '',
        is_prod: false,
        is_env: true,
        description: newNodeFormData.value.description || '',
        images_addr: newNodeFormData.value.images_addr || '',
        images_user: newNodeFormData.value.images_user || '',
        images_pwd: newNodeFormData.value.images_pwd || '',
        kubernetes_addr: newNodeFormData.value.kubernetes_addr || '',
        kubeconfig: newNodeFormData.value.kubeconfig || '',
        kube_namespace: newNodeFormData.value.kube_namespace || '',
        children: [] 
      };
    } else {
      let tmp_env_group;
      if (newNodeFormData.value.env_type == 'env_child_group') {
        tmp_env_group = currentParentNode.value?.name
      }
      if (newNodeFormData.value.env_type == 'env_same_group') {
        tmp_env_group = currentParentNode.value?.env_group
      }
      // 创建分组节点
      newNode = {
        env_group: tmp_env_group || '', 
        component_id: componentId.value || '',
        name: newNodeFormData.value.name || '',
        is_prod: false,
        is_env: false,
        children: []
      };
    }

    await axios.post('/api/environment', newNode);
    if (componentId.value) {
      fetchEnv(componentId.value).catch(console.error);
    }

    addNodeDialogVisible.value = false;
    ElMessage.success(`成功添加${newNode.is_env ? '环境' : '分组'}: ${newNode.name}`);
      
  } catch (error) {
    console.error('添加失败:', error);
    ElMessage.error('添加失败，请重试');
  }
};

// 获取环境数据
const fetchEnv = async (componentId: string) => {
  try {
    loading.value = true;
    const response = await axios.get<EnvironmentTreeNode[]>(`/api/component/${componentId}/environments`);
    if (response.data.length > 0) {
      treeData.value = response.data;
    } else {
      treeData.value = generateDefaultEnvironmentTree.value;
    }
    console.log(treeData.value);
  } catch (error) {
    ElMessage.error('加载环境数据失败，请重试');
    treeData.value = generateDefaultEnvironmentTree.value;
  } finally {
    loading.value = false;
  }
  updateTreeHeight();
  window.addEventListener('resize', updateTreeHeight);
};

// 处理刷新数据事件
const handleRefreshData = async () => {
  if (componentId.value) {
    await fetchEnv(componentId.value);
    // 如果有选中的环境，重新查找并选中
    if (selectedEnvironment.value && selectedEnvironment.value.id && treeRef.value) {
      const treeNode = treeRef.value.getNode(selectedEnvironment.value.id);
      if (treeNode && treeNode.data) {
        handleNodeClick(treeNode.data);
      }
    }
  }
};

// 处理环境更新事件
const handleEnvironmentUpdated = (updatedEnv: Environment | null) => {
  if (updatedEnv) {
    // 如果是更新操作，更新选中的环境
    if (selectedEnvironment.value && selectedEnvironment.value.id === updatedEnv.id) {
      selectedEnvironment.value = {
        ...selectedEnvironment.value,
        ...updatedEnv
      };
    }
  } else {
    // 如果是删除操作，清空选中的环境
    selectedEnvironment.value = null;
  }
};

// 页面加载时初始化
onMounted(() => {
  const queryComponentId = router.query.componentId;
  componentId.value = typeof queryComponentId === 'string' ? queryComponentId : undefined;
  if (componentId.value) {
    fetchEnv(componentId.value);
  }
  updateTreeHeight();
  window.addEventListener('resize', updateTreeHeight);
});

// 页面卸载前清理
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateTreeHeight);
});

</script>

<style scoped lang="scss">
.environment-container {
  padding: 20px;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.main-container {
  height: calc(100vh - 180px);
  display: flex;
}

.tree-aside {
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100vh; 
  box-sizing: border-box;
}

.tree-container {
  flex: 1;
  overflow: auto;
  margin-top: 16px;
  background-color: white;
  padding: 0 8px;
}

.detail-panel {
  padding: 20px;
  overflow: auto;
}

.tree-node-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.add-node-btn {
  opacity: 0;
  transition: opacity 0.2s;
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
  border-color: transparent;
}

.add-node-btn:hover {
  background-color: rgba(64, 158, 255, 0.2);
  border-color: transparent;
}

.el-tree-node:hover .add-node-btn {
  opacity: 1;
}
</style>
