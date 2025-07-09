<template>
  <div class="service-tree-container">
    <el-input
      v-model="query"
      style="width: 240px"
      placeholder="请输入关键词搜索"
      @input="onQueryChanged"
      prefix-icon="Search"
    />
    <el-tree-v2
      ref="treeRef"
      class="service-tree"
      :data="treeData"
      :props="props"
      :filter-method="filterMethod"
      @node-click="(data, node) => handleNodeClick(data as TreeItem, node)"
    />
    <el-empty v-if="!loading && treeData.length === 0" description="暂无服务数据"></el-empty>
    <el-loading v-if="loading" target=".service-tree" text="加载中..."></el-loading>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElTreeV2, ElMessage, ElEmpty, ElLoading, TreeNodeData } from 'element-plus'
import { ComponentPublicInstance } from 'vue'
import axios from '@/utils/axios'


// 统一类型定义，与PipelineManage.vue保持一致
interface TreeItem {
  id: string
  label: string
  isService?: boolean
  children?: TreeItem[]
}

// 组件引用类型优化
const treeRef = ref<ComponentPublicInstance<typeof ElTreeV2, { data: TreeItem[] }>>()
const query = ref('')
const treeData = ref<TreeItem[]>([])
const loading = ref(false)

// 树形配置项
const props = {
  value: 'id',
  label: 'label',
  children: 'children',
}

// 从API获取服务树数据
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

// 生成默认服务树数据（API失败时使用）
const generateDefaultTree = (): TreeItem[] => [
  {
    id: 'service-1',
    label: '基础服务',
    isService: true,
    children: [
      { id: 'comp-1-1', label: '认证组件' },
      { id: 'comp-1-2', label: '日志组件' }
    ]
  },
  {
    id: 'service-2',
    label: '业务服务',
    isService: true,
    children: [
      { id: 'comp-2-1', label: '订单组件' },
      { id: 'comp-2-2', label: '支付组件' }
    ]
  }
]

// 搜索过滤逻辑
const onQueryChanged = (query: string) => {
  treeRef.value?.filter(query)
}

// 增强型过滤方法，处理可能的空值
const filterMethod = (query: string, node: TreeNodeData) => {
  // 类型断言确保安全访问data属性
  const treeNode = node as unknown as { data: TreeItem };
  if (!treeNode.data || !treeNode.data.label) return false;
  return treeNode.data.label.toLowerCase().includes(query.toLowerCase());
}

// 节点点击处理
const handleNodeClick = (data: TreeItem, node: any) => {
  if (data.isService) {
    ElMessage.info(`已选择服务: ${data.label}`);
    // 可以在这里添加服务选择后的逻辑
  } else {
    ElMessage.info(`已选择组件: ${data.label}`);
    // 可以在这里添加组件选择后的逻辑
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchServiceTree()
})
</script>

<style scoped>
.service-tree-container {
  padding: 20px;
}

.service-tree {
  margin-top: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
}
</style>