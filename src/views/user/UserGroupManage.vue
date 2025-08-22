<template>
  <el-card class="page-container">
    <div slot="header" class="card-header">
      <h2>用户组管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon> 新增用户组
      </el-button>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="search-container">
      <el-input
        v-model="searchKeyword"
        placeholder="请输入用户组名称搜索"
        prefix-icon="Search"
        class="search-input"
        @keyup.enter="fetchUserGroups"
      />
    </div>

    <el-skeleton v-if="loading" :rows="5" class="table-skeleton" />
    <el-table
      v-else
      :data="filteredUserGroups"
      border
      stripe
      class="user-group-table"
    >
      <el-table-column type="index" label="序号" width="80" />
      <el-table-column prop="name" label="用户组名称" min-width="150" />
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column prop="userCount" label="用户数量" width="120" align="center" />
      <el-table-column
        prop="status"
        label="状态"
        width="120"
        align="center"
      >
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            :active-value="1"
            :inactive-value="0"
            @change="(value: boolean) => handleStatusChange(row.id, value ? 1 : 0)"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="200"
        align="center"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button
            :link="true"
            size="small"
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            :link="true"
            size="small"
            text-color="#ff4d4f"
            @click="handleDelete(row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!loading && userGroups.length === 0" class="empty-state">
      <el-empty description="暂无用户组数据" />
    </div>

    <div v-if="!loading && !error && userGroups.length > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="userGroups.length"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增用户组' : '编辑用户组'"
      width="500px"
    >
      <el-form
        ref="userGroupForm"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="用户组名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入用户组名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            placeholder="请输入用户组描述"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="formData.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import axios from '@/utils/axios';

// 定义用户组接口类型
interface UserGroup {
  id: number;
  name: string;
  description: string;
  userCount: number;
  status: 0 | 1;
  createdAt: string;
}

// 添加用户组默认数据 - 新增代码
const DEFAULT_USER_GROUPS: UserGroup[] = [
  { id: 1, name: '管理员组', description: '系统管理员权限组', userCount: 5, status: 1, createdAt: '2023-01-15' },
  { id: 2, name: '开发组', description: '开发人员权限组', userCount: 20, status: 1, createdAt: '2023-01-20' },
  { id: 3, name: '测试组', description: '测试人员权限组', userCount: 15, status: 1, createdAt: '2023-01-25' },
  { id: 4, name: '访客组', description: '只读权限访客组', userCount: 30, status: 0, createdAt: '2023-02-01' },
];

// 响应式数据
const userGroups = ref<UserGroup[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const searchKeyword = ref<string>('');
const currentPage = ref<number>(1);
const pageSize = ref<number>(10);

const dialogVisible = ref<boolean>(false);
const dialogType = ref<'add' | 'edit'>('add');
const formData = reactive<Partial<UserGroup>>({
  name: '',
  description: '',
  status: 1
});
const userGroupForm = ref<any>(null);

const formRules = reactive<Record<string, any>>({
  name: [
    { required: true, message: '请输入用户组名称', trigger: 'blur' },
    { min: 2, max: 20, message: '用户组名称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }
  ]
});

const filteredUserGroups = computed(() => {
  let result = [...userGroups.value];

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(group =>
      group.name.toLowerCase().includes(keyword) ||
      group.description.toLowerCase().includes(keyword)
    );
  }

  // 分页处理
  const startIndex = (currentPage.value - 1) * pageSize.value;
  return result.slice(startIndex, startIndex + pageSize.value);
});

const fetchUserGroups = async () => {
  loading.value = true;
  try {
    const response = await axios.get<UserGroup[]>('/api/user-groups');
    userGroups.value = response.data || DEFAULT_USER_GROUPS;
  } catch (err) {
    console.error('Failed to fetch user groups:', err);
    // 只设置默认数据，不设置error变量
    userGroups.value = DEFAULT_USER_GROUPS;
    // 使用ElMessage显示非阻塞警告
    ElMessage.warning('获取用户组列表失败，已加载默认数据');
  } finally {
    loading.value = false;
  }
};

// 新增用户组
const handleAdd = () => {
  dialogType.value = 'add';
  formData.id = undefined;
  formData.name = '';
  formData.description = '';
  formData.status = 1;
  dialogVisible.value = true;
};

// 编辑用户组
const handleEdit = (row: UserGroup) => {
  dialogType.value = 'edit';
  formData.id = row.id;
  formData.name = row.name;
  formData.description = row.description;
  formData.status = row.status;
  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async () => {
  if (!userGroupForm.value) return;

  try {
    await userGroupForm.value.validate();

    if (dialogType.value === 'add') {
      // 模拟新增API请求
      const newGroup: UserGroup = {
        id: Date.now(),
        name: formData.name as string,
        description: formData.description as string,
        status: formData.status as 0 | 1,
        userCount: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };

      // 实际项目中替换为真实API
      // await axios.post('/api/user-groups', newGroup);
      userGroups.value.unshift(newGroup);
      ElMessage.success('用户组创建成功');
    } else {
      // 模拟编辑API请求
      const index = userGroups.value.findIndex(g => g.id === formData.id);
      if (index !== -1) {
        userGroups.value[index] = {
          ...userGroups.value[index],
          name: formData.name as string,
          description: formData.description as string,
          status: formData.status as 0 | 1
        };

        // 实际项目中替换为真实API
        // await axios.put(`/api/user-groups/${formData.id}`, formData);
        ElMessage.success('用户组更新成功');
      }
    }

    dialogVisible.value = false;
  } catch (err) {
    console.error('Form validation failed:', err);
  }
};

// 删除用户组
const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户组吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    // 实际项目中替换为真实API
    // await axios.delete(`/api/user-groups/${id}`);
    userGroups.value = userGroups.value.filter(group => group.id !== id);
    ElMessage.success('用户组删除成功');
  } catch (err) {
    // 用户取消删除
  }
};

// 切换用户组状态
const handleStatusChange = async (id: number, status: 0 | 1) => {
  try {
    // 实际项目中替换为真实API
    // await axios.patch(`/api/user-groups/${id}/status`, { status });
    const index = userGroups.value.findIndex(group => group.id === id);
    if (index !== -1) {
      userGroups.value[index].status = status;
    }
    ElMessage.success(`用户组已${status === 1 ? '启用' : '禁用'}`);
  } catch (err) {
    console.error('Failed to update status:', err);
    ElMessage.error('状态更新失败');
    // 恢复原状态
    fetchUserGroups();
  }
};

// 分页相关方法
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  currentPage.value = 1;
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
};

// 页面加载时获取数据
onMounted(() => {
  fetchUserGroups();
});
</script>

<style scoped>
.page-container {
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
  gap: 10px;
}

.search-input {
  width: 300px;
}

.table-skeleton {
  margin: 20px 0;
}

.error-alert {
  margin-bottom: 20px;
}

.user-group-table {
  width: 100%;
  margin-bottom: 20px;
}

.empty-state {
  margin: 50px 0;
  text-align: center;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>