<template>
  <el-card class="environment-container">
    <template #header>
      <div class="card-header">
        <div>
          <el-button type="primary" icon="Setting" @click="handleEnvironmentManagement">环境管理</el-button>
        </div>
      </div>
    </template>

    <el-container class="main-container">
      <!-- 左侧环境树 -->
      <el-aside width="300px" class="tree-aside">
        <el-input
          v-model="query"
          style="width: 240px"
          placeholder="请输入关键词搜索"
          @input="onQueryChanged"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <div class="tree-container" ref="treeContainer">
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
                <span>{{ data.label }}</span>
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
        <el-loading v-if="loading" target="treeContainer" text="加载中..."></el-loading>
      </el-aside>

      <!-- 右侧详情面板 -->
      <el-main class="detail-panel">
        <div v-if="selectedEnvironment" class="environment-detail">
          <div class="detail-header">
            <h2>{{ selectedEnvironment.label }} 详情</h2>
          </div>

          <el-divider></el-divider>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-card>
                <template #header><h3>基本信息</h3></template>
                <el-descriptions :column="1">
                  <el-descriptions-item label="环境名称">{{ selectedEnvironment.label }}</el-descriptions-item>
                  <el-descriptions-item label="环境类型">
                    {{ 
                      { 
                        'development': '开发', 
                        'testing': '测试', 
                        'production': '生产', 
                        'disaster': '灾备'
                      }[selectedEnvironment.type] || selectedEnvironment.type 
                    }}
                  </el-descriptions-item>
                  <el-descriptions-item label="状态">{{ selectedEnvironment.status === 'active' ? '启用' : '禁用' }}</el-descriptions-item>
                  <el-descriptions-item label="更新时间">{{ selectedEnvironment.updatedAt }}</el-descriptions-item>
                  <el-descriptions-item label="所属分组">{{ selectedGroup?.label || '-' }}</el-descriptions-item>
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
        <el-form-item label="节点名称" prop="label" :rules="[{ required: true, message: '请输入节点名称', trigger: 'blur' }]">
          <el-input v-model="newNodeForm.label" placeholder="请输入节点名称"></el-input>
        </el-form-item>
        <el-form-item v-if="currentParentNode" label="节点类型">
          <el-radio-group v-model="newNodeForm.isEnvironment">
            <el-radio :label="true">环境节点</el-radio>
            <el-radio :label="false">分组节点</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="newNodeForm.isEnvironment" label="环境类型">
          <el-select v-model="newNodeForm.type" placeholder="请选择环境类型">
            <el-option label="开发" value="development"></el-option>
            <el-option label="测试" value="testing"></el-option>
            <el-option label="生产" value="production"></el-option>
            <el-option label="灾备" value="disaster"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addNodeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="addChildNode">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 环境管理对话框 -->
    <el-dialog
      v-model="environmentManagementDialogVisible"
      title="环境管理"
      width="70%"
    >
      <el-table :data="filteredEnvironments" style="width: 100%">
        <el-table-column prop="label" label="环境名称" />
        <el-table-column prop="type" label="环境类型" />
        <el-table-column prop="status" label="状态" />
        <el-table-column prop="updatedAt" label="更新时间" />
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button size="small" @click="handleEditEnvironment(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDeleteEnvironment(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, reactive, toRefs, computed } from 'vue';
import { ElMessage, ElMessageBox, ElTreeV2, ElInput, ElButton, ElIcon, ElLoading, ElDialog, ElForm, ElFormItem, ElRadioGroup, ElRadio, ElMain, ElAside, ElContainer, ElDivider, ElRow, ElCol, ElCard, ElSelect, ElOption } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import type { TreeNodeData, TreeInstance, FormInstance } from 'element-plus';

// 定义自定义环境树节点接口，扩展TreeNodeData
interface GroupNode extends TreeNodeData {
  id: number;
  label: string;
  isEnvironment: false;
  children?: EnvironmentTreeNode[];
}

interface EnvironmentNode extends TreeNodeData {
  id: number;
  label: string;
  isEnvironment: true;
  type: string;
  status: 'active' | 'disabled';
  updatedAt: string;
  children?: never;
}

type EnvironmentTreeNode = GroupNode | EnvironmentNode;

interface Environment {
  id: number;
  label: string;
  type: string;
  status: 'active' | 'disabled';
  updatedAt: string;
  [key: string]: any;
}

interface EnvironmentGroup {
  id: number;
  label: string;
  children?: (EnvironmentGroup | Environment)[];
}

const state = reactive({
  query: '',
  treeData: [] as EnvironmentTreeNode[],
  loading: false,
  selectedEnvironment: null as Environment | null,
  selectedGroup: null as EnvironmentGroup | null,
  addNodeDialogVisible: false,
  environmentManagementDialogVisible: false,
  currentParentNode: null as EnvironmentTreeNode | null,
  newNodeForm: { label: '', isEnvironment: true, type: '' },
  expandedKeys: [] as number[],
  treeHeight: 0
})

// 解构响应式状态
const { query, treeData, loading, selectedEnvironment, selectedGroup, addNodeDialogVisible, environmentManagementDialogVisible, currentParentNode, newNodeForm, expandedKeys, treeHeight } = toRefs(state)

// 组件引用
const treeRef = ref<TreeInstance | null>(null);
const treeContainer = ref<HTMLDivElement | null>(null);
const addNodeFormRef = ref<FormInstance | null>(null);

// 树形结构配置
const props = {
  label: 'label',
  children: 'children',
  isLeaf: (data: TreeNodeData) => {
    if (!isEnvironmentTreeNode(data)) return false;
    return data.isEnvironment;
  }
};

// 节点点击处理函数
const handleNodeClick = (data: TreeNodeData) => {
  if (isEnvironmentTreeNode(data) && data.isEnvironment) {
    selectedEnvironment.value = data;
    findParentGroup(data);
  } else {
    selectedEnvironment.value = null;
    selectedGroup.value = data as EnvironmentGroup;
  }
};

// 查找所属分组
const findParentGroup = (node: EnvironmentTreeNode) => {
  if (!treeRef.value) return;
  const treeNode = treeRef.value.getNode(node.id);
  if (treeNode && treeNode.parent && treeNode.parent.data) {
    selectedGroup.value = treeNode.parent.data as EnvironmentGroup;
  }
};

// 显示添加节点对话框
const showAddNodeDialog = (parentNode: EnvironmentTreeNode) => {
  currentParentNode.value = parentNode;
  newNodeForm.value = { label: '', isEnvironment: true, type: '' };
  addNodeDialogVisible.value = true;
};

// 收集所有节点ID用于默认展开
const collectAllNodeIds = (nodes: EnvironmentTreeNode[], ids: number[] = []): number[] => {
  nodes.forEach(node => {
    ids.push(node.id);
    if (node.children && node.children.length > 0) {
      collectAllNodeIds(node.children, ids);
    }
  });
  return ids;
};

// 事件处理 - 分组相关
const handleAddGroup = () => {
  // 顶级分组添加
  currentParentNode.value = null;
  newNodeForm.value = { label: '', isEnvironment: false, type: '' };
  addNodeDialogVisible.value = true;
};

// 添加子节点
const addChildNode = async () => {
  if (!currentParentNode.value) return;

  // 表单验证
  if (addNodeFormRef.value) {
    try {
      await addNodeFormRef.value.validate();
    } catch (error) {
      return;
    }
  }

  // 创建新节点
  // 将原newNode创建代码替换为:
  let newNode: EnvironmentTreeNode;
  if (newNodeForm.value.isEnvironment) {
  // 创建环境节点
  newNode = {
    id: Date.now(),
    label: newNodeForm.value.label,
    isEnvironment: true,
    type: newNodeForm.value.type,
    status: 'active',
    updatedAt: new Date().toLocaleString(),
    children: undefined
  };
  } else {
  // 创建分组节点
  newNode = {
    id: Date.now(),
    label: newNodeForm.value.label,
    isEnvironment: false,
    children: []
  };
  }

  // 添加到父节点或作为顶级节点
  if (currentParentNode.value) {
    if (!currentParentNode.value.children) {
      currentParentNode.value.children = [];
    }
    currentParentNode.value.children.push(newNode);
  } else {
    // 添加顶级节点
    treeData.value.push(newNode);
  }

  // 关闭对话框
  addNodeDialogVisible.value = false;

  // 显示成功消息
  ElMessage.success(`成功添加${newNode.isEnvironment ? '环境' : '分组'}: ${newNode.label}`);
};

// 环境管理按钮点击事件
const handleEnvironmentManagement = () => {
  if (!selectedGroup.value) {
    ElMessage.warning('请先选择一个环境分组');
    return;
  }
  environmentManagementDialogVisible.value = true;
};

// 事件处理 - 环境相关
const handleEditEnvironment = (environment: Environment) => {
  if (environment) {
    ElMessage.info(`编辑环境: ${environment.label}`);
    // 实际实现中这里应该打开环境编辑表单
  }
};

// 将handleDeleteEnvironment函数修改为:
const handleDeleteEnvironment = (environment: Environment) => {
  // 访问ref的值需要使用.value
  const currentGroup = selectedGroup.value;
  if (environment && currentGroup) {
    ElMessageBox.confirm('确定要删除该环境吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      // 获取最新的分组状态并检查children
      const latestGroup = selectedGroup.value;
      if (latestGroup && latestGroup.children) {
        // 使用类型守卫确保过滤安全
        latestGroup.children = latestGroup.children.filter(item => 
          isEnvironment(item) ? item.id !== environment.id : true
        );
      }
      selectedEnvironment.value = null;
      ElMessage.success('环境删除成功');
    });
  }
};

const filterMethod = (value: string, data: TreeNodeData): boolean => {
  // 添加类型守卫确保安全转换
  if (!isEnvironmentTreeNode(data)) return false;
  if (!value) return true;
  return data.label.toLowerCase().includes(value.toLowerCase());
};

// 类型守卫 - 判断是否为环境节点
function isEnvironment(data: any): data is Environment {
  return data && data.isEnvironment === true && typeof data.id === 'number' && typeof data.label === 'string';
}

// 类型守卫 - 判断是否为自定义树节点
function isEnvironmentTreeNode(data: TreeNodeData): data is EnvironmentTreeNode {
  return 'id' in data && 'label' in data && 'isEnvironment' in data;
}

// 搜索查询变化处理
const onQueryChanged = (value: string) => {
  if (treeRef.value) {
    treeRef.value.filter(value);
  }
};

// 判断是否为叶子节点
const isLeafNode = (data: EnvironmentTreeNode) => {
  return data.isEnvironment === true;
};

// 更新树高度
const updateTreeHeight = () => {
  if (treeContainer.value) {
    treeHeight.value = treeContainer.value.clientHeight - 20;
  }
};

// 获取环境分组数据
const fetchGroups = async () => {
  try {
    loading.value = true;
    // 模拟数据
    treeData.value = [
      {
        id: 1,
        label: '开发环境组',
        isEnvironment: false,
        children: [
          {
            id: 101,
            label: '开发环境1',
            isEnvironment: true,
            type: 'development',
            status: 'active',
            updatedAt: new Date().toLocaleString()
          }
        ]
      }
    ];
  } catch (error) {
    ElMessage.error('加载环境数据失败，请重试');
    console.error('Environment groups fetch error:', error);
    // 使用默认数据作为回退
    treeData.value = generateDefaultEnvironmentTree();
  } finally {
    loading.value = false;
  }
};

// 生成默认环境树数据
const generateDefaultEnvironmentTree = (): EnvironmentTreeNode[] => {
  return [
    {
      id: 1,
      label: '默认环境组',
      isEnvironment: false,
      children: [
        {
          id: 100,
          label: '默认环境',
          isEnvironment: true,
          type: 'development',
          status: 'active',
          updatedAt: new Date().toLocaleString()
        }
      ]
    }
  ];
};

// 监听树数据变化，自动展开所有节点
watch(treeData, (newData) => {
  if (newData.length > 0) {
    expandedKeys.value = collectAllNodeIds(newData);
  }
});

// 计算属性：过滤环境节点
const filteredEnvironments = computed<Environment[]>(() => {
  if (!selectedGroup.value?.children) return [];
  return selectedGroup.value.children.filter(isEnvironment);
});

// 页面加载时初始化
onMounted(() => {
  fetchGroups();
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