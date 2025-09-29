<template>
  <div class="service-tree-container">
      <el-container class="main-container">
      <el-aside width="300px" class="tree-aside">
        <el-input
          v-model="query"
          style="width: 240px"
          placeholder="请输入关键词搜索"
          @input="onQueryChanged"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <div class="tree-container" ref="treeContainer"
             v-loading="loading" element-loading-text="加载中..." element-loading-background="rgba(255, 255, 255, 0.8)">
          <el-tree-v2
            class="full-height-tree"
            ref="treeRef"
            :data="treeData"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            :filter-method="filterMethod"
            @node-click="(data: TreeNodeData) => handleNodeClick(data as ServiceTree)"
            :default-expanded-keys="expandedKeys"
            :indent="16"
          >
            <template #default="{ data }">
              <div class="tree-node-content">
                <span>{{ data.name }}</span>
                <el-button
                  v-if="data.node_type !== 'service'"
                  class="add-node-btn"
                  size="small"
                  icon="Plus"
                  @click.stop="showAddNodeDialog(data)"
                />
              </div>
            </template>
          </el-tree-v2>
        </div>
        <el-empty v-if="!loading && treeData.length === 0" description="暂无服务数据"></el-empty>
      </el-aside>

      <!-- 右侧详情面板 -->
      <el-main class="detail-panel">
        <div v-if="componentDetail" class="component-detail">
          <div class="detail-header">
            <h2>{{ componentDetail.name }} 详情</h2>
          </div>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-card>
                <template #header><h3>基本信息</h3></template>
                <el-descriptions :column="1">
                  <el-descriptions-item label="组件名称">
                    <el-link type="primary" @click="goToComponentPage" style="cursor: pointer;">
                      {{ componentDetail.name }}
                    </el-link>
                  </el-descriptions-item>
                  <el-descriptions-item label="服务树">{{ componentDetail.service_tree.replace(/\./g, '/') }}</el-descriptions-item>
                  <el-descriptions-item label="创建人">{{ componentDetail.owner }}</el-descriptions-item>
                  <el-descriptions-item label="创建时间">{{ componentDetail.created_at }}</el-descriptions-item>
                  <el-descriptions-item label="更新时间">{{ componentDetail.updated_at }}</el-descriptions-item>
                  <el-descriptions-item label="描述">
                    {{ componentDetail.description || '暂无描述信息' }}
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>

            <el-col :span="12">
              <el-card>
                <template #header><h3>代码库信息</h3></template>
                <el-descriptions v-if="componentDetail" :column="1">
                  <el-descriptions-item label="代码库地址">
                    <el-link :href="componentDetail.repo_url" target="_blank">{{ componentDetail.repo_url || '未设置' }}</el-link>
                  </el-descriptions-item>
                  <el-descriptions-item label="分支">{{ componentDetail.repo_branch || 'main' }}</el-descriptions-item>
                </el-descriptions>
                <div v-else class="empty-info">请选择一个服务组件查看详情</div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <div v-else class="empty-detail">
          <el-empty description="请选择一个组件查看详情"></el-empty>
        </div>
      </el-main>
    </el-container>

    <!-- 添加子节点对话框 -->
    <el-dialog v-model="addNodeDialogVisible" title="添加子节点" width="30%">
      <el-form ref="addNodeFormRef" :model="newServiceTreeNodeForm" label-width="20%">
        <el-form-item label="节点名称" prop="name" :rules="[{ required: true, message: '请输入节点名称', trigger: 'blur' }]">
          <el-input v-model="newServiceTreeNodeForm.name" placeholder="请输入节点名称"></el-input>
        </el-form-item>
        <el-form-item label="节点类型">
          <el-radio-group v-model="newServiceTreeNodeForm.node_type">
            <el-radio :value ="'service'">微服务</el-radio>
            <el-radio :value ="'subcategory'">子类别</el-radio>
            <el-radio :value="'category'">同级类别</el-radio>
          </el-radio-group>
        </el-form-item>
        <!-- 当节点类型为service时显示代码库信息 -->
        <template v-if="newServiceTreeNodeForm.node_type === 'service'">
          <el-form-item label="代码库地址" prop="components.repo_url" :rules="[{ required: true, message: '请输入代码库地址', trigger: 'blur' }]">
            <el-input v-model="newServiceTreeNodeForm.components.repo_url" placeholder="请输入代码库地址"></el-input>
          </el-form-item>
          <el-form-item label="代码库分支" prop="components.repo_branch" :rules="[{ required: true, message: '请输入代码库分支', trigger: 'blur' }]">
            <el-input v-model="newServiceTreeNodeForm.components.repo_branch" placeholder="请输入代码库分支" defaultValue="main"></el-input>
          </el-form-item>
          <el-form-item label="责任人" prop="components.owner" :rules="[{ required: true, message: '请输入责任人', trigger: 'blur' }]">
            <el-input v-model="newServiceTreeNodeForm.components.owner" placeholder="请输入创建人"></el-input>
          </el-form-item>
          <el-form-item label="微服务描述" prop="components.description" >
            <el-input
              v-model="newServiceTreeNodeForm.components.description"
              placeholder="请输入微服务描述"
              type="textarea"
              :rows="3"
            ></el-input>
          </el-form-item>
        </template>
         <template v-if="newServiceTreeNodeForm.node_type != 'service'">
          <el-form-item label="节点描述">
            <el-input
              v-model="newServiceTreeNodeForm.description"
              placeholder="请输入节点描述"
              type="textarea"
              :rows="3"
            ></el-input>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addNodeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="addChildNode">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, reactive, toRefs, ComponentPublicInstance } from 'vue'
import axios from '@/utils/axios'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import { ElTreeV2, TreeNodeData, ElInput, ElButton, ElIcon, ElEmpty,  ElDialog, ElForm, ElFormItem, ElRadioGroup, ElRadio, ElMain, ElAside, ElContainer, ElRow, ElCol, ElCard, ElDescriptions, ElDescriptionsItem, ElLink } from 'element-plus'
import { ServiceTree } from '@/types/servicetree'
import { Component } from '@/types/component-manage'


const treeRef = ref<ComponentPublicInstance<typeof ElTreeV2, { data: ServiceTree[] }>>()
const addNodeFormRef = ref<ComponentPublicInstance<typeof ElForm>>()
const treeContainer = ref<HTMLDivElement | null>(null)
const router = useRouter()
const route = useRoute()

const state = reactive({
  query: '',
  treeData: [] as ServiceTree[],
  loading: false,
  componentDetail: null as Component | null,
  addNodeDialogVisible: false,
  currentParentNode: null as ServiceTree | null,
  expandedKeys: [] as number[]
})

const { query, treeData, loading, expandedKeys, componentDetail, addNodeDialogVisible, currentParentNode } = toRefs(state)

const fetchServiceTree = async () => {
  try {
    loading.value = true;
    const response = await axios.get<ServiceTree[]>('/api/servicetree');
    treeData.value = response.data
    if (treeData.value.length === 0) {
      treeData.value = generateDefaultTree();
    }
  } catch (error) {
    ElMessage.error('Failed to fetch service tree, please try again');
    treeData.value = generateDefaultTree();
  } finally {
    loading.value = false;
  }
};

const fetchComponentDetail = async (id: string) => {
  try {
    loading.value = true;
    const response = await axios.get<Component>(`/api/component/${id}`);
    componentDetail.value = response.data;
  } catch (error) {
    ElMessage.error('Failed to fetch component detail, please try again');
  } finally {
    loading.value = false;
  }
  return componentDetail.value
};

// 搜索过滤逻辑
const onQueryChanged = (query: string) => {
  setTimeout(() => {
    treeRef.value?.filter(query);
  }, 100);
}

const filterMethod = (query: string, node: TreeNodeData) => {
  const treeNode = node as unknown as { data: ServiceTree };
  if (!treeNode.data) return false;
  const matchesName = treeNode.data.name.toLowerCase().includes(query.toLowerCase());
  const matchesPath = treeNode.data.full_path?.toLowerCase().includes(query.toLowerCase()) || false;
  return matchesName || matchesPath;
}

// 节点点击处理
const handleNodeClick = async (data: ServiceTree) => {
    if (data.node_type === 'service' && data.service_id) {
      const componentDetail = await fetchComponentDetail(data.service_id);
    }
}

const goToComponentPage = () => {
  if (componentDetail.value) {
    router.push({ path: '/service', query: { ...route.query, componentId: componentDetail.value.id, serviceTree: componentDetail.value.service_tree } })
  }
}

// 保留ref版本的表单定义并确保命名唯一
const newServiceTreeNodeForm = ref<{name: string; node_type: 'category' | 'subcategory' | 'service' ;  description?: string; components: Component;}>({
  name: '',
  node_type: 'service',
  description: undefined,
  components: {
    name: '',
    service_tree: '',
    description: '',
    owner: '',
    repo_url: '',
    repo_branch: 'main'
  },
});

// 显示添加节点对话框时初始化组件数据
const showAddNodeDialog = (parentNode: ServiceTree) => {
  currentParentNode.value = parentNode;
  newServiceTreeNodeForm.value = {
    name: '',
    node_type: 'category',
    description: undefined,
    components: { 
      name: '',
      service_tree: '',
      description: '',
      owner: '',
      repo_url: '',
      repo_branch: 'main' }
  };
  addNodeFormRef.value?.resetFields();
  addNodeDialogVisible.value = true;
}


// 添加子节点
const addChildNode = async () => {
  if (!currentParentNode.value) return

  // 表单验证
  if (addNodeFormRef.value) {
    try {
      await addNodeFormRef.value.validate()
    } catch (error) {
      return
    }
  }

  // 创建新节点数据（不含临时ID）
  const newNodeData: Omit<ServiceTree, 'id'> = {
    name: newServiceTreeNodeForm.value.name,
    node_type: newServiceTreeNodeForm.value.node_type,
    level: newServiceTreeNodeForm.value.node_type === 'category' ? currentParentNode.value.level : currentParentNode.value.level + 1,
    parent_id: newServiceTreeNodeForm.value.node_type === 'category' ? currentParentNode.value.parent_id : currentParentNode.value.id,
    // 根据节点类型和层级生成full_path
    full_path: newServiceTreeNodeForm.value.node_type === 'category' 
      ? (currentParentNode.value.level === 1 
        ? newServiceTreeNodeForm.value.name 
        : currentParentNode.value.full_path.split('.').slice(0, -1).join('.') + '.' + newServiceTreeNodeForm.value.name)
      : `${currentParentNode.value.full_path}.${newServiceTreeNodeForm.value.name}`,
    description: newServiceTreeNodeForm.value.description,
  }

  const newComponentData: Omit<Component, 'id'> = {
    name: newServiceTreeNodeForm.value.name,
    service_tree: newNodeData.full_path,
    description: newServiceTreeNodeForm.value.description,
    owner: newServiceTreeNodeForm.value.components.owner,
    repo_url: newServiceTreeNodeForm.value.components.repo_url,
    repo_branch: newServiceTreeNodeForm.value.components.repo_branch,
  }

  try {
    // 显示加载状态
    loading.value = true
    if (newNodeData.node_type === 'service') {
      const response = await axios.post<Component>('/api/component', newComponentData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (response.status !== 200) {
        ElMessage.error('添加组件失败: HTTP状态码' + response.status)
        return
      }
      newNodeData.service_id = String(response.data.id)
    }
    // 发送POST请求到/api/servicetree
    await axios.post('/api/servicetree', newNodeData, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // 关闭对话框
    addNodeDialogVisible.value = false
    // 刷新服务树数据
    fetchServiceTree()
    ElMessage.success('节点添加成功')
  } catch (error) {
    ElMessage.error('添加节点失败，请重试')
  } finally {
    // 确保加载状态始终被重置
    loading.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchServiceTree()
})

const generateDefaultTree = (): ServiceTree[] => [
  {
    name: 'DevOps',
    full_path: 'DevOps',
    node_type: 'category',
    level: 1,
    parent_id: '0',
    id: '0',

    children: [ 
      {
        name: 'APP',
        full_path: 'DevOps/APP',
        node_type: 'category',
        level: 2,
        parent_id: '0', // DevOps
        id: '1',

        children: [ 
          {
            name: 'app-server',
            full_path: 'DevOps/APP/app-server',
            node_type: 'service',
            service_id: '3',
            level: 3,
            parent_id: '1', // APP
            description: '应用后端服务',
            id: '3',
            children: []
          }]
        },
    ]
  },
]


</script>

<style scoped lang="scss">
.service-tree-container {
  height: 100%;
  display: flex;
  overflow: hidden;
  flex-direction: column;
}

.main-container {
  flex: 1;
  height: 100%;
  display: flex;
  overflow: hidden; 
}

.tree-aside {
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100%; 
}

.tree-aside .el-input {
  height: 40px;
  flex-shrink: 0;
}

.full-height-tree {
  flex: 1;
  height: 100%;
}

.full-height-tree :deep(.el-tree-virtual-list),
.full-height-tree :deep(.el-tree-v2) {
  height: 100% !important;
  width: 100% !important;
}

.tree-container {
  flex: 1;
  margin-top: 8px;
  overflow: auto;
  white-space: nowrap;
  min-height: 0; 
}
.tree-container .el-vl__window.el-tree-virtual-list {
  height: 100% !important;
  width: 100% !important;
}

.el-tree-v2 {
  display: block;
  width: 100%;
  height: 100%;
}

.detail-panel {
  padding: 20px;
  overflow: auto;
}

.component-detail {
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

.edit-icon {
  margin-left: 8px;
  color: #409eff;
  cursor: pointer;
  opacity: 0.7;
  font-size: 14px;
}

.el-descriptions-item__content:hover .edit-icon {
  opacity: 1;
}
</style>