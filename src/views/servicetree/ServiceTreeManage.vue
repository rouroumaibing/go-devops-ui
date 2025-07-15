<template>
  <div class="service-tree-container">
    <el-container class="main-container">
      <!-- 左侧服务树 -->
      <el-aside width="300px" class="tree-aside">
        <el-input
          v-model="query"
          style="width: 240px"
          placeholder="请输入关键词搜索"
          @input="onQueryChanged"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <div class="tree-container service-tree" ref="treeContainer">
          <el-tree-v2
            :height="treeHeight"
            ref="treeRef"
            :data="treeData"
            :props="props"
            :filter-method="filterMethod"
            @node-click="(data) => handleNodeClick(data as TreeItem)"
            :default-expanded-keys="expandedKeys"
            :indent="16"
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
        <el-empty v-if="!loading && treeData.length === 0" description="暂无服务数据"></el-empty>
        <el-loading v-if="loading" target="treeContainer" text="加载中..."></el-loading>
      </el-aside>

      <!-- 右侧详情面板 -->
      <el-main class="detail-panel">
        <div v-if="selectedComponent" class="component-detail">
          <div class="detail-header">
            <h2>{{ selectedComponent.label }} 详情</h2>
          </div>

          <el-divider></el-divider>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-card>
                <template #header><h3>基本信息</h3></template>
                <el-descriptions :column="1">
                  <el-descriptions-item label="组件名称">
                    <el-link type="primary" @click="goToComponentPage" style="cursor: pointer;">
                      {{ selectedComponent.label }}
                    </el-link>
                  </el-descriptions-item>
                  <el-descriptions-item label="服务树">{{ getServicePath(selectedComponent) }}</el-descriptions-item>
                  <el-descriptions-item label="创建人">admin</el-descriptions-item>
                  <el-descriptions-item label="创建时间">2023-07-15</el-descriptions-item>
                  <el-descriptions-item label="描述">
                    {{ selectedComponent.description || '暂无描述信息' }}
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>

            <el-col :span="12">
              <el-card>
                <template #header><h3>代码库信息</h3></template>
                <el-descriptions :column="1">
                  <el-descriptions-item label="代码库地址">
                    <el-link :href="selectedComponent.repoUrl" target="_blank">{{ selectedComponent.repoUrl }}</el-link>
                  </el-descriptions-item>
                  <el-descriptions-item label="分支">{{ selectedComponent.branch || 'main' }}</el-descriptions-item>
                </el-descriptions>
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
      <el-form ref="addNodeFormRef" :model="newNodeForm" label-width="80px">
        <el-form-item label="节点名称" prop="label" :rules="[{ required: true, message: '请输入节点名称', trigger: 'blur' }]">
          <el-input v-model="newNodeForm.label" placeholder="请输入节点名称"></el-input>
        </el-form-item>
        <el-form-item label="节点类型">
          <el-radio-group v-model="newNodeForm.isService">
            <el-radio :label="true">服务节点</el-radio>
            <el-radio :label="false">组件节点</el-radio>
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
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, reactive, toRefs, watch, onBeforeUnmount, ComponentPublicInstance} from 'vue'
import axios from '@/utils/axios'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import { ElTreeV2, TreeNodeData, ElInput, ElButton, ElIcon, ElEmpty, ElLoading, ElDialog, ElForm, ElFormItem, ElRadioGroup, ElRadio, ElMain, ElAside, ElContainer, ElDivider, ElRow, ElCol, ElCard, ElDescriptions, ElDescriptionsItem, ElLink } from 'element-plus'

interface TreeItem {
  id: string
  label: string
  isService?: boolean
  children?: TreeItem[]
  description?: string
  repoUrl?: string
  branch?: string
  servicePath?: string
}

const treeRef = ref<ComponentPublicInstance<typeof ElTreeV2, { data: TreeItem[] }>>()
const addNodeFormRef = ref<ComponentPublicInstance<typeof ElForm>>()
const treeContainer = ref<HTMLDivElement | null>(null)
const treeHeight = ref(0)
const router = useRouter()
const route = useRoute()

const updateTreeHeight = () => {
  if (treeContainer.value) {
    // 减去搜索框和边距高度
    treeHeight.value = treeContainer.value.offsetHeight - 16
  }
}

// 状态管理
const state = reactive({
  query: '',
  treeData: [] as TreeItem[],
  loading: false,
  selectedComponent: null as TreeItem | null,
  addNodeDialogVisible: false,
  currentParentNode: null as TreeItem | null,
  newNodeForm: {
    label: '',
    isService: false
  } as { label: string; isService: boolean },
  expandedKeys: [] as string[]
})

// 解构响应式状态
const { query, treeData, loading, selectedComponent, addNodeDialogVisible, currentParentNode, newNodeForm, expandedKeys } = toRefs(state)

// 树形配置
const props = { value: 'id', label: 'label', children: 'children' }

// 数据获取
const fetchServiceTree = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/services/tree')
    treeData.value = response.data || []
  } catch (error) {
    ElMessage.error('获取服务树失败，请重试')
    console.error('Service tree fetch error:', error)
    // 使用默认数据作为回退
    treeData.value = generateDefaultTree()
  } finally {
    loading.value = false
  }
}

// 搜索过滤逻辑
const onQueryChanged = (query: string) => {
  treeRef.value?.filter(query)
}

// 过滤方法
const filterMethod = (query: string, node: TreeNodeData) => {
  const treeNode = node as unknown as { data: TreeItem }
  if (!treeNode.data || !treeNode.data.label) return false
  return treeNode.data.label.toLowerCase().includes(query.toLowerCase())
}

// 判断是否为叶子节点
const isLeafNode = (data: TreeItem): boolean => {
  return !data.children || data.children.length === 0
}

// 节点点击处理
const handleNodeClick = (data: TreeItem) => {
  // 只处理叶子节点（组件）
  if (isLeafNode(data)) {
    selectedComponent.value = data
    // 获取服务路径
    data.servicePath = getServicePath(data)
  }
}

// 获取服务路径（如：DevOps > APP > push-server）
const getServicePath = (node: TreeItem): string => {
  if (!treeRef.value) return node.label
  
  const treeNode = treeRef.value.getNode(node.id)
  if (!treeNode) return node.label
  
  const pathNodes = []
  let currentNode = treeNode
  
  while (currentNode) {
    pathNodes.push(currentNode.data.label)
    currentNode = currentNode.parent
  }
  
  return pathNodes.reverse().join(' > ')
}

const goToComponentPage = () => {
  if (selectedComponent.value) {

    ElMessage.success(`跳转到 ${selectedComponent.value.label} 的编辑页面`)

    if (selectedComponent.value) {
      router.push({ path: '/service', query: { ...route.query, componentId: selectedComponent.value.id } })
    }
  }
}

// 显示添加节点对话框
const showAddNodeDialog = (parentNode: TreeItem) => {
  currentParentNode.value = parentNode
  newNodeForm.value = { label: '', isService: false }
  addNodeDialogVisible.value = true
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

  // 创建新节点
  const newNode: TreeItem = {
    id: `${currentParentNode.value.id}-${Date.now()}`,
    label: newNodeForm.value.label,
    isService: newNodeForm.value.isService,
    children: newNodeForm.value.isService ? [] : undefined
  }

  // 添加到父节点
  if (!currentParentNode.value.children) {
    currentParentNode.value.children = []
  }
  currentParentNode.value.children.push(newNode)

  // 关闭对话框
  addNodeDialogVisible.value = false

  // 显示成功消息
  ElMessage.success(`成功添加子节点: ${newNode.label}`)
}

// 收集所有节点ID用于默认展开
const collectAllNodeIds = (nodes: TreeItem[], ids: string[] = []): string[] => {
  nodes.forEach(node => {
    ids.push(node.id)
    if (node.children && node.children.length > 0) {
      collectAllNodeIds(node.children, ids)
    }
  })
  return ids
}

// 生成默认树数据
const generateDefaultTree = (): TreeItem[] => [
  {
    id: 'devops',
    label: 'DevOps',
    children: [
      {
        id: 'devops-app',
        label: 'APP',
        children: [
          {
            id: 'push-server',
            label: 'push-server',
            description: '消息推送服务，负责APP通知推送',
            repoUrl: 'https://github.com/example/push-server',
            branch: 'main'
          },
          {
            id: 'app-server',
            label: 'app-server',
            description: '应用后端服务',
            repoUrl: 'https://github.com/example/app-server',
            branch: 'develop'
          },
          { id: 'manager-server', label: 'manager-server' },
          { id: 'iam-server', label: 'iam-server' },
          { id: 'web-server', label: 'web-server' },
          { id: 'keyclock', label: 'keyclock' }
        ]
      },
      {
        id: 'paas-db',
        label: 'PaaS-DB',
        children: [
          { id: 's-app-mysqldb', label: 'S-APP-MysqlDB' },
          { id: 's-app-redis', label: 'S-APP-Redis' }
        ]
      },
      {
        id: 'basic-service',
        label: 'BasicService',
        children: [
          {
            id: 'basic-lvs',
            label: 'BasicService-LVS',
            children: [
              { id: 'paas-lvs', label: 'PaaS-LVS' }
            ]
          },
          {
            id: 'basic-lb',
            label: 'BasicService-LB',
            children: [
              { id: 'paas-lb', label: 'PaaS-LB' }
            ]
          },
          {
            id: 'basic-dns',
            label: 'BasicService-DNS',
            children: [
              { id: 'paas-dns', label: 'PaaS-DNS' }
            ]
          }
        ]
      }
    ]
  }
]

// 监听树数据变化，自动展开所有节点
watch(treeData, (newData) => {
  if (newData.length > 0) {
    expandedKeys.value = collectAllNodeIds(newData)
  }
})

// 页面加载时获取数据
onMounted(() => {
  fetchServiceTree()
  // 初始化高度
  updateTreeHeight()
  // 监听窗口大小变化
  window.addEventListener('resize', updateTreeHeight)
})

onBeforeUnmount(() => {
  // 移除事件监听
  window.removeEventListener('resize', updateTreeHeight)
})
</script>

<style scoped lang="scss">
.service-tree-container {
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.main-container {
  height: 100%;
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

.service-tree {
  height: 100vh;
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
/* 添加编辑图标样式 */
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