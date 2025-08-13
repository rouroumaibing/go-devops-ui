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
        <div v-if="selectedEnvironment" class="environment-detail">
          <div class="detail-header">
            <h2>{{ selectedEnvironment.name }} 详情</h2>
              <div>
                <el-button type="primary" icon="Setting" @click="handleEnvironmentManagement">环境管理</el-button>
              </div>
          </div>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-card>
                <template #header><h3>基本信息</h3></template>
                <el-descriptions :column="1">
                  <el-descriptions-item label="环境名称">{{ selectedEnvironment.name }}</el-descriptions-item>
                  <el-descriptions-item label="更新时间">{{ selectedEnvironment.updated_at }}</el-descriptions-item>
                  <el-descriptions-item label="所属分组">{{ selectedGroup?.name || '-' }}</el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <div v-else class="empty-detail">
          <el-empty description="请选择一个环境查看详情"></el-empty>
        </div>
      </el-main>
    </el-container>

    <!-- 添加节点对话框 -->
    <el-dialog v-model="addNodeDialogVisible" title="添加节点" width="30%">
      <el-form ref="addNodeFormRef" :model="newNodeForm" label-width="80px">
        <el-form-item label="节点名称" prop="name" :rules="[{ required: true, message: '请输入节点名称', trigger: 'blur' }]">
          <el-input v-model="newNodeForm.name" placeholder="请输入节点名称"></el-input>
        </el-form-item>
        <el-form-item v-if="currentParentNode" label="节点类型">
          <el-radio-group v-model="newNodeForm.is_env">
            <el-radio :label="true">环境节点</el-radio>
            <el-radio :label="false">分组节点</el-radio>
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

    <!-- 环境管理对话框改为抽屉 -->
    <el-drawer
      v-model="environmentManagementDialogVisible"
      direction="rtl"
      title="环境管理"
      size="70%"
    >
      >
        <el-table :data="allEnvironments" style="width: 100%">
          <el-table-column prop="name" label="环境名称" />
          <el-table-column prop="status" label="状态" />
          <el-table-column prop="updated_at" label="更新时间" />
          <el-table-column label="操作">
            <template #default="{ row }">
              <el-button size="small" @click="handleEditEnvironment(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDeleteEnvironment(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-drawer>
    </el-card>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref, onMounted, watch, onBeforeUnmount, reactive, toRefs, computed } from 'vue';
import { ElMessage, ElMessageBox, ElTreeV2, ElInput, ElButton, ElIcon, ElLoading, ElDialog, ElForm, ElFormItem, ElRadioGroup, ElRadio, ElMain, ElAside, ElContainer, ElDivider, ElRow, ElCol, ElCard, ElSelect, ElOption } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';
import type { TreeNodeData, TreeInstance, FormInstance } from 'element-plus';
import { Environment } from '@/types/environment-manage';

interface EnvironmentTreeNode extends Environment, TreeNodeData {}

const state = reactive({
  query: '',
  treeData: [] as EnvironmentTreeNode[],
  loading: false,
  selectedEnvironment: null as Environment | null,
  selectedGroup: null as EnvironmentTreeNode | null,
  addNodeDialogVisible: false,
  environmentManagementDialogVisible: false,
  currentParentNode: null as EnvironmentTreeNode | null,
  newNodeForm: { name: '', is_env: true, type: '' },
  expandedKeys: [] as number[],
  treeHeight: 0
})

const { query, treeData, loading, selectedEnvironment, selectedGroup, addNodeDialogVisible, environmentManagementDialogVisible, currentParentNode, newNodeForm, expandedKeys, treeHeight } = toRefs(state)

const treeRef = ref<TreeInstance | null>(null);
const treeContainer = ref<HTMLDivElement | null>(null);
const addNodeFormRef = ref<FormInstance | null>(null);
const componentId = ref<string | undefined>(undefined);
const router = useRoute();

// 计算属性：收集所有环境节点
const allEnvironments = computed(() => {
  const environments: EnvironmentTreeNode[] = [];
  
  const collectEnvironments = (nodes: EnvironmentTreeNode[]) => {
    nodes.forEach(node => {
      if (node.is_env) {
        environments.push(node);
      }
      if (node.children && node.children.length > 0) {
        collectEnvironments(node.children);
      }
    });
  };
  
  collectEnvironments(treeData.value);
  return environments;
});

const props = {
  label: 'name',
  children: 'children',
  isLeaf: (data: TreeNodeData) => {
    if (!isEnvironmentTreeNode(data)) return false;
    return data.is_env;
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
  newNodeForm.value = { name: '', is_env: true, type: '' };
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
    if (newNodeForm.value.is_env) {
      // 创建环境节点
      newNode = {
        env_group: currentParentNode.value?.name || '', 
        component_id: componentId.value || '',

        name: newNodeForm.value.name,
        is_env: true,
        children: [] 
      };
    } else {
      // 创建分组节点
      newNode = {
        env_group: currentParentNode.value?.name || '', 
        component_id: componentId.value || '',
        name: newNodeForm.value.name,
        is_env: false,
        children: []
      };
    }

    // 调用API保存到后端
    const response = await axios.post('/api/environment', newNode);
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

// 环境管理按钮点击事件
const handleEnvironmentManagement = () => {
  environmentManagementDialogVisible.value = true;
};

// 事件处理 - 环境相关
const handleEditEnvironment = (environment: Environment) => {
  if (environment) {
    ElMessage.info(`编辑环境: ${environment.name}`);
    // 实际实现中这里应该打开环境编辑表单
  }
};

const handleDeleteEnvironment = (environment: Environment) => {
  const currentGroup = selectedGroup.value;
  if (environment && currentGroup) {
    ElMessageBox.confirm('确定要删除该环境吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      const latestGroup = selectedGroup.value;
      if (latestGroup && latestGroup.children) {
        latestGroup.children = latestGroup.children.filter((item: EnvironmentTreeNode) =>
          isEnvironment(item) ? item.id !== environment.id : true
        );
      }
      selectedEnvironment.value = null;
      ElMessage.success('环境删除成功');
    });
  }
};

const filterMethod = (value: string, data: TreeNodeData): boolean => {
  if (!isEnvironmentTreeNode(data)) return false;
  if (!value) return true;
  return data.label.toLowerCase().includes(value.toLowerCase());
};

// 类型守卫 - 判断是否为环境节点
function isEnvironment(data: any): data is Environment {
  return data && data.is_env === true && typeof data.id === 'number' && typeof data.name === 'string';
}

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

// 获取环境数据
const fetchEnv = async (componentId: string) => {
  try {
    loading.value = true;
    const response = await axios.get(`/api/component/${componentId}/environments`);
    if (response.data.length > 0) {
      treeData.value = response.data; 
    } else {
      treeData.value = generateDefaultEnvironmentTree();
    }
  } catch (error) {
    ElMessage.error('加载环境数据失败，请重试');
    treeData.value = generateDefaultEnvironmentTree();
  } finally {
    loading.value = false;
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

// 生成默认环境树数据
const generateDefaultEnvironmentTree = (): EnvironmentTreeNode[] => {
  return [
    {
      id: 1,
      name: 'Default',
      is_env: false,
      env_group: 'Default',
      component_id: componentId.value || '',
      service_addr: '',
      description: '',
      created_at: "",
      updated_at: "",
      children: [{}]
    },
  ];
};
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

.environment-detail {
  height: 100%;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.empty-detail {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
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