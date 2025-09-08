<template>
  <el-card class="api-manager-container">
    <template #header>
      <div class="card-header">
        <span>API管理</span>
        <el-button type="primary" @click="createApi">创建API</el-button>
      </div>
    </template>
    
    <!-- 搜索和筛选 -->
    <div class="search-container">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索API名称或路径"
        style="width: 300px; margin-right: 10px;"
      />
      <el-button type="primary" @click="searchApi">搜索</el-button>
    </div>
    
    <!-- API列表 -->
    <el-table :data="apiList" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="API名称" />
      <el-table-column prop="path" label="请求路径" />
      <el-table-column prop="method" label="请求方法" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="editApi(scope.row)">编辑</el-button>
          <el-button type="danger" size="small" @click="deleteApi(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

// 定义API接口类型
interface ApiItem {
  id: string
  name: string
  path: string
  method: string
  status: number
  createdAt: string
}

// 状态定义
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(50)

// 模拟API数据
const apiList = ref<ApiItem[]>([
  {
    id: '1',
    name: '用户列表',
    path: '/api/users',
    method: 'GET',
    status: 1,
    createdAt: '2023-07-15 10:30:00'
  },
  {
    id: '2',
    name: '创建用户',
    path: '/api/users',
    method: 'POST',
    status: 1,
    createdAt: '2023-07-15 10:35:00'
  },
  {
    id: '3',
    name: '更新用户',
    path: '/api/users/:id',
    method: 'PUT',
    status: 1,
    createdAt: '2023-07-15 10:40:00'
  },
  {
    id: '4',
    name: '删除用户',
    path: '/api/users/:id',
    method: 'DELETE',
    status: 0,
    createdAt: '2023-07-15 10:45:00'
  },
  {
    id: '5',
    name: '用户详情',
    path: '/api/users/:id',
    method: 'GET',
    status: 1,
    createdAt: '2023-07-15 10:50:00'
  }
])

// 搜索API
const searchApi = () => {
  ElMessage.success('搜索API: ' + searchKeyword.value)
  // 实际项目中这里应该调用后端API进行搜索
}

// 创建API
const createApi = () => {
  ElMessage.success('创建API')
  // 实际项目中这里应该打开创建API的对话框
}

// 编辑API
const editApi = (api: ApiItem) => {
  ElMessage.success('编辑API: ' + api.name)
  // 实际项目中这里应该打开编辑API的对话框
}

// 删除API
const deleteApi = (id: string) => {
  ElMessage.success('删除API: ' + id)
  // 实际项目中这里应该调用后端API删除API
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
}

const handleCurrentChange = (current: number) => {
  currentPage.value = current
}
</script>

<style scoped>
.api-manager-container {
  margin: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-container {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>