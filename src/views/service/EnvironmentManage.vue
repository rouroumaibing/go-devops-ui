<template>
  <el-card class="environment-container">
    <template #header>
      <div class="card-header">
        <div>
          <el-button type="primary" icon="Plus" @click="handleAddGroup">新增分组</el-button>
          <el-button type="primary" icon="Setting" @click="handleEnvironmentManagement">环境管理</el-button>
        </div>
      </div>
    </template>

    <el-container class="main-container">
      <el-aside width="200px" class="sidebar">
        <el-menu
          default-active="1"
          class="el-menu-vertical-demo"
          @select="handleGroupSelect"
        >
          <el-sub-menu v-for="group in groups" :key="group.id" :index="group.id.toString()">
            <template #title>
              <span>{{ group.name }}</span>
            </template>
            <el-menu-item
              v-for="env in group.environments"
              :key="env.id"
              :index="`${group.id}-${env.id}`"
              @click="handleEnvironmentSelect(env)"
            >
              {{ env.name }}
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>

      <!-- 右侧内容区域 -->
      <el-main class="content-area">
        <div v-if="selectedEnvironment">
          <h3>{{ selectedEnvironment.name }} ({{ selectedGroup?.name }})</h3>
          <el-descriptions title="环境详情">
            <el-descriptions-item label="环境类型">{{ selectedEnvironment.type }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ selectedEnvironment.status === 'active' ? '启用' : '禁用' }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ selectedEnvironment.updatedAt }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <div v-else class="empty-state">
          <el-empty description="请选择或创建环境"></el-empty>
        </div>
      </el-main>
    </el-container>
    <!-- 新增环境管理对话框 -->
    <el-dialog
      v-model="environmentManagementDialogVisible"
      title="环境管理"
      width="70%"
    >
      <el-table :data="selectedGroup?.environments || []" style="width: 100%">
        <el-table-column prop="name" label="环境名称" />
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
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox, ElEmpty, ElDescriptions, ElDescriptionsItem } from 'element-plus';
import axios from '@/utils/axios';

// 定义环境类型接口
interface Environment {
  id: number;
  name: string;
  type: string;
  status: 'active' | 'disabled';
  updatedAt: string;
  [key: string]: any;
}

// 定义分组接口
interface EnvironmentGroup {
  id: number;
  name: string;
  environments: Environment[];
}

// 状态管理
const groups = ref<EnvironmentGroup[]>([]);
const selectedGroup = ref<EnvironmentGroup | null>(null);
const selectedEnvironment = ref<Environment | null>(null);
const loading = ref<boolean>(false);

// 默认数据
const DEFAULT_GROUPS: EnvironmentGroup[] = [
  {
    id: 1,
    name: 'CI环境组',
    environments: [
      { id: 1, name: 'CI开发环境', type: '开发', status: 'active', updatedAt: '2023-08-15 09:30' },
      { id: 2, name: 'CI测试环境', type: '测试', status: 'active', updatedAt: '2023-08-16 14:20' }
    ]
  },
  {
    id: 2,
    name: 'CD环境组',
    environments: [
      { id: 3, name: 'CD生产环境', type: '生产', status: 'active', updatedAt: '2023-08-12 10:15' },
      { id: 4, name: 'CD灾备环境', type: '灾备', status: 'active', updatedAt: '2023-08-14 16:30' }
    ]
  }
];

// 数据获取
const fetchGroups = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/environment-groups');
    groups.value = response.data.data || DEFAULT_GROUPS;
  } catch (err) {
    console.error('获取环境分组失败:', err);
    groups.value = DEFAULT_GROUPS;
    ElMessage.warning('获取环境分组失败，已加载默认数据');
  } finally {
    loading.value = false;
  }
};

// 生命周期
onMounted(() => {
  fetchGroups();
});

// 事件处理 - 分组相关
const handleGroupSelect = (key: string) => {
  // 处理分组选择逻辑
};

const handleAddGroup = () => {
  ElMessageBox.prompt('请输入分组名称', '新增分组', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  }).then(({ value }) => {
    const newGroup: EnvironmentGroup = {
      id: Date.now(),
      name: value,
      environments: []
    };
    groups.value.push(newGroup);
    ElMessage.success('分组创建成功');
  });
};

const handleEditGroup = (group: EnvironmentGroup) => {
  ElMessageBox.prompt('请输入新的分组名称', '编辑分组', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: group.name
  }).then(({ value }) => {
    group.name = value;
    ElMessage.success('分组更新成功');
  });
};

const handleDeleteGroup = (groupId: number) => {
  const group = groups.value.find(g => g.id === groupId);
  if (group?.environments.length) {
    ElMessage.warning('请先删除分组下的所有环境');
    return;
  }

  ElMessageBox.confirm('确定要删除该分组吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    groups.value = groups.value.filter(g => g.id !== groupId);
    ElMessage.success('分组删除成功');
  });
};

// 事件处理 - 环境相关
const handleEnvironmentSelect = (environment: Environment) => {
  selectedEnvironment.value = environment;
  selectedGroup.value = groups.value.find(g => 
    g.environments.some(e => e.id === environment.id)
  ) || null;
};

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
      currentGroup.environments = currentGroup.environments.filter(e => e.id !== environment.id);
      selectedEnvironment.value = null;
      ElMessage.success('环境删除成功');
    });
  }
};
// 新增环境管理对话框状态
const environmentManagementDialogVisible = ref<boolean>(false);

// 新增环境管理按钮点击事件
const handleEnvironmentManagement = () => {
  if (!selectedGroup.value) {
    ElMessage.warning('请先选择一个环境分组');
    return;
  }
  environmentManagementDialogVisible.value = true;
};

</script>

<style scoped>
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
}

.sidebar {
  background-color: #f5f5f5;
  height: 100%;
  padding-top: 10px;
}

.content-area {
  padding: 20px;
  background-color: #fff;
}

.group-edit-btn,
.group-delete-btn {
  margin-left: 5px;
  opacity: 0.7;
}

.el-sub-menu .el-menu-item {
  padding-left: 40px !important;
}

.empty-state {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>