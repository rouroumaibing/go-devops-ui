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
                <el-button type="primary" icon="Edit" @click="selectedEnvironment && handleEditEnvironment(selectedEnvironment)">编辑</el-button>
                <el-button type="danger" icon="Delete" @click="selectedEnvironment && handleDeleteEnvironment(selectedEnvironment)">删除</el-button>
              </div>
          </div>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-card>
                <template #header><h3>基本信息</h3></template>
                <el-descriptions :column="1">
                  <el-descriptions-item label="环境id">{{ selectedEnvironment.id }}</el-descriptions-item>
                  <el-descriptions-item label="环境名称">{{ selectedEnvironment.name }}</el-descriptions-item>
                  <el-descriptions-item label="服务地址">{{ selectedEnvironment.service_addr }}</el-descriptions-item>
                  <el-descriptions-item label="描述">{{ selectedEnvironment.description }}</el-descriptions-item>
                  <el-descriptions-item label="更新时间">{{ selectedEnvironment.updated_at }}</el-descriptions-item>
                  <el-descriptions-item label="所属分组">{{ selectedGroup?.name || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="创建时间">{{ selectedEnvironment.created_at }}</el-descriptions-item>
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
          <el-radio-group v-model="newNodeForm.env_type">
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

    <!-- 添加编辑环境对话框 -->
    <el-dialog 
      v-model="environmentManagementDialogVisible"
      title="编辑环境" 
      width="500px"
    >
      <el-form 
        ref="editEnvironmentFormRef" 
        :model="editEnvironmentForm" 
        label-width="100px"
        :rules="editEnvironmentRules"
      >
        <el-form-item label="环境名称" prop="name">
          <el-input v-model="editEnvironmentForm.name" placeholder="请输入环境名称"></el-input>
        </el-form-item>
        
        <el-form-item label="服务地址" prop="service_addr">
          <el-input v-model="editEnvironmentForm.service_addr" placeholder="请输入服务地址"></el-input>
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="editEnvironmentForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入环境描述"
          ></el-input>
        </el-form-item>
        
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="environmentManagementDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEnvironmentEdit">保存</el-button>
        </span>
      </template>
    </el-dialog>

    </el-card>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref, onMounted, onBeforeUnmount, reactive, toRefs, computed } from 'vue';
import { ElMessage, ElMessageBox, ElTreeV2, ElInput, ElButton, ElDialog, ElForm, ElFormItem, ElRadioGroup, ElRadio, ElMain, ElAside, ElContainer,  ElRow, ElCol, ElCard } from 'element-plus';
import { useRoute } from 'vue-router';
import type { TreeNodeData, TreeInstance, FormInstance, FormItemRule } from 'element-plus';
import { Environment } from '@/types/environment-manage';

interface EnvironmentTreeNode extends Environment, TreeNodeData {}

const state = reactive({
  treeData: [] as EnvironmentTreeNode[],
  loading: false,
  selectedEnvironment: null as EnvironmentTreeNode | null,
  selectedGroup: null as EnvironmentTreeNode | null,
  addNodeDialogVisible: false,
  environmentManagementDialogVisible: false,
  currentParentNode: null as EnvironmentTreeNode | null,
  expandedKeys: [] as number[],
  treeHeight: 0
})

const { treeData, loading, selectedEnvironment, selectedGroup, addNodeDialogVisible, environmentManagementDialogVisible, currentParentNode,  expandedKeys, treeHeight } = toRefs(state)

const treeRef = ref<TreeInstance | null>(null);
const treeContainer = ref<HTMLDivElement | null>(null);
const addNodeFormRef = ref<FormInstance | null>(null);
const componentId = ref<string | undefined>(undefined);
const editEnvironmentForm = ref<Partial<Environment>>({});
const editEnvironmentFormRef = ref<FormInstance | null>(null);
const router = useRoute();

const newNodeForm = ref<{ name: string; env_type: 'env_node' | 'env_child_group' | 'env_same_group'; }>({
  name: '',
  env_type: 'env_node'
})

const editEnvironmentRules: Record<string, FormItemRule[]> = {
  name: [
    { required: true, message: '请输入环境名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  service_addr: [
    { required: true, message: '请输入服务地址', trigger: 'blur' },
    { type: 'url', message: '请输入正确的URL格式', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '长度不超过 500 个字符', trigger: 'blur' }
  ]
};

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
  newNodeForm.value = { name: '', env_type: 'env_node' };
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
    if (newNodeForm.value.env_type == 'env_node') {
      // 创建环境节点
      newNode = {
        env_group: currentParentNode.value?.name || '', 
        component_id: componentId.value || '',
        name: newNodeForm.value.name,
        is_env: true,
        children: [] 
      };
    } else {
      let tmp_env_group;
      if (newNodeForm.value.env_type == 'env_child_group') {
        tmp_env_group = currentParentNode.value?.name
      }
      if (newNodeForm.value.env_type == 'env_same_group') {
        tmp_env_group = currentParentNode.value?.env_group
      }
      // 创建分组节点
      newNode = {
        env_group: tmp_env_group || '', 
        component_id: componentId.value || '',
        name: newNodeForm.value.name,
        is_env: false,
        children: []
      };
    }

    await axios.post('/api/environment', newNode);
    //等待执行成功后重新获取环境数据
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


// 事件处理 - 环境相关
const handleEditEnvironment = (environment: Environment) => {
  if (environment) {
  ElMessage.info(`编辑环境: ${environment.name}`);
  // 打开当前环境编辑表单
  editEnvironmentForm.value = {
        id: environment.id,
        name: environment.name,
        env_group: environment.env_group,
        component_id: environment.component_id,
        service_addr: environment.service_addr,
        description: environment.description || '',
        created_at: environment.created_at,
        updated_at: environment.updated_at
      };
  }
  environmentManagementDialogVisible.value = true;
};

// 添加保存编辑的方法
const saveEnvironmentEdit = async () => {
  if (!editEnvironmentForm.value.id) return;

  if (editEnvironmentFormRef.value) {
    try {
      await editEnvironmentFormRef.value.validate();
    } catch (error) {
      console.error('表单验证失败:', error);
      return;
    }
  }

  try {
    await axios.put(`/api/environment/${editEnvironmentForm.value.id}`, editEnvironmentForm.value);
    
    // 更新成功后刷新数据
    if (componentId.value) {
      await fetchEnv(componentId.value);
    }
    
    environmentManagementDialogVisible.value = false;
    ElMessage.success('环境更新成功');
  } catch (error) {
    console.error('更新失败:', error);
    ElMessage.error('更新失败，请重试');
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
      // 发送删除请求
      axios.delete(`/api/environment/${environment.id}`).then(() => {
        // 删除成功后刷新环境数据
        if (componentId.value) {
          fetchEnv(componentId.value).catch(console.error);
        }
        selectedEnvironment.value = null;
        ElMessage.success('环境删除成功');
      }).catch(error => {
        console.error('删除失败:', error);
        ElMessage.error('删除失败，请重试');
      });
    });
  }
};


const handlePingTest = (serviceAddr: string) => {
  if (!serviceAddr) {
    ElMessage.error('请输入服务地址');
    return;
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
      treeData.value = generateDefaultEnvironmentTree();
    }
  } catch (error) {
    ElMessage.error('加载环境数据失败，请重试');
    treeData.value = generateDefaultEnvironmentTree();
  } finally {
    loading.value = false;
  }
  updateTreeHeight();
  window.addEventListener('resize', updateTreeHeight);
};


// 页面加载时初始化
onMounted(() => {
  const queryComponentId = router.query.componentId;
  componentId.value = typeof queryComponentId === 'string' ? queryComponentId : undefined;
  if (componentId.value) {
    fetchEnv(componentId.value);
  }
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
      env_group: '',
      component_id: componentId.value || '',
      service_addr: '',
      description: '',
      created_at: "",
      updated_at: "",
      children: []
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
