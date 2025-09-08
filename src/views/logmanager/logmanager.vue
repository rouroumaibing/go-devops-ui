<template>
  <el-card class="log-manager-container">
    <template #header>
      <div class="card-header">
        <span>日志管理</span>
        <el-button type="primary" @click="refreshLogs">刷新日志</el-button>
      </div>
    </template>
    
    <!-- 搜索和筛选 -->
    <div class="search-filter-container">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索日志内容"
        style="width: 300px; margin-right: 10px;"
      />
      <el-select v-model="logLevel" placeholder="选择日志级别" style="width: 150px; margin-right: 10px;">
        <el-option label="全部" value="" />
        <el-option label="DEBUG" value="DEBUG" />
        <el-option label="INFO" value="INFO" />
        <el-option label="WARN" value="WARN" />
        <el-option label="ERROR" value="ERROR" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        style="width: 300px; margin-right: 10px;"
      />
      <el-button type="primary" @click="searchLogs">搜索</el-button>
    </div>
    
    <!-- 日志列表 -->
    <el-table :data="logList" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="time" label="时间" width="180" />
      <el-table-column prop="level" label="级别" width="100">
        <template #default="scope">
          <el-tag :type="getLevelType(scope.row.level)">
            {{ scope.row.level }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="source" label="来源" width="150" />
      <el-table-column prop="message" label="日志内容" show-overflow-tooltip />
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

// 定义日志接口类型
interface LogItem {
  id: string
  time: string
  level: string
  source: string
  message: string
}

// 状态定义
const searchKeyword = ref('')
const logLevel = ref('')
const dateRange = ref<[string, string] | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 模拟日志数据
const logList = ref<LogItem[]>([
  {
    id: '1',
    time: '2023-07-15 10:30:00',
    level: 'INFO',
    source: 'system',
    message: '系统启动成功，版本 v1.0.0'
  },
  {
    id: '2',
    time: '2023-07-15 10:35:23',
    level: 'INFO',
    source: 'user',
    message: '用户 admin 登录成功'
  },
  {
    id: '3',
    time: '2023-07-15 10:40:15',
    level: 'WARN',
    source: 'api',
    message: 'API 请求频率过高: /api/users/list'
  },
  {
    id: '4',
    time: '2023-07-15 10:45:30',
    level: 'ERROR',
    source: 'database',
    message: '数据库连接超时，请检查数据库服务'
  },
  {
    id: '5',
    time: '2023-07-15 10:50:05',
    level: 'DEBUG',
    source: 'pipeline',
    message: '流水线 ID: 0000-0000-0123 开始执行'
  }
])

// 根据日志级别获取标签类型
const getLevelType = (level: string) => {
  switch (level) {
    case 'ERROR':
      return 'danger'
    case 'WARN':
      return 'warning'
    case 'INFO':
      return 'success'
    case 'DEBUG':
      return 'info'
    default:
      return 'default'
  }
}

// 搜索日志
const searchLogs = () => {
  ElMessage.success('搜索日志: ' + searchKeyword.value)
  // 实际项目中这里应该调用后端API进行搜索
}

// 刷新日志
const refreshLogs = () => {
  ElMessage.success('刷新日志列表')
  // 实际项目中这里应该重新加载日志数据
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
.log-manager-container {
  margin: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-filter-container {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>