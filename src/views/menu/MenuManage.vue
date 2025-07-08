<template>
  <div class="menu-manage-container">
    <el-card shadow="hover" class="page-card">
      <!-- 卡片头部：添加标题和操作按钮 -->
      <template #header>
        <div class="card-header">
          <h2>菜单管理</h2>
          <el-button type="primary" icon="Plus" @click="handleAddMenu">新增菜单</el-button>
        </div>
      </template>

      <!-- 加载状态 -->
      <el-skeleton v-if="loading" :rows="5" border stripe class="table-skeleton"></el-skeleton>

      <!-- 错误提示 -->
      <el-alert v-else-if="error" type="error" description="获取菜单列表失败，请重试" show-icon></el-alert>

      <!-- 无数据提示 -->
      <el-empty v-else-if="menuList.length === 0" description="暂无菜单数据"></el-empty>

      <!-- 菜单表格 -->
      <el-table v-else :data="menuList" border stripe>
        <el-table-column type="index" label="序号" width="80"></el-table-column>
        <el-table-column prop="name" label="菜单名称" width="180"></el-table-column>
        <el-table-column prop="path" label="路由路径" width="180"></el-table-column>
        <el-table-column prop="icon" label="图标" width="120">
          <template #default="{ row }"><el-icon :size="20"><component :is="row.icon" /></el-icon></template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="handleStatusChange(row)"></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button link size="small" @click="handleEditMenu(row)">编辑</el-button>
            <el-button link size="small" text-color="red" @click="handleDeleteMenu(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑菜单对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="formMenu" label-width="100px">
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="formMenu.name" placeholder="请输入菜单名称"></el-input>
        </el-form-item>
        <el-form-item label="路由路径" prop="path">
          <el-input v-model="formMenu.path" placeholder="请输入路由路径"></el-input>
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="formMenu.icon" placeholder="请输入图标名称"></el-input>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formMenu.sort" :min="1" :max="100"></el-input-number>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="formMenu.status" :active-value="1" :inactive-value="0"></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveMenu">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Menu } from '@element-plus/icons-vue';

// 定义菜单数据类型接口
interface Menu {
  id: number;
  name: string;
  path: string;
  icon: string;
  sort: number;
  status: 0 | 1;
}

// 状态管理
const menuList = ref<Menu[]>([]);
const loading = ref(false);
const error = ref('');
const dialogVisible = ref(false);
const dialogTitle = ref('新增菜单');
const formMenu = reactive<Partial<Menu>>({ name: '', path: '', icon: '', sort: 1, status: 1 });
const currentMenuId = ref<number | null>(null);

// 默认菜单数据
const DEFAULT_MENUS: Menu[] = [
  { id: 1, name: '仪表盘', path: '/dashboard', icon: 'Home', sort: 1, status: 1 },
  { id: 2, name: '用户管理', path: '/user', icon: 'User', sort: 2, status: 1 },
  { id: 3, name: '角色管理', path: '/role', icon: 'UserFilled', sort: 3, status: 1 },
  { id: 4, name: '菜单管理', path: '/menu', icon: 'Menu', sort: 4, status: 1 },
];

// 获取菜单列表数据
const fetchMenus = async () => {
  try {
    loading.value = true;
    error.value = '';
    const response = await axios.get('/api/menus');
    menuList.value = Array.isArray(response.data) ? response.data : DEFAULT_MENUS;
  } catch (err) {
    console.error('获取菜单列表失败:', err);
    menuList.value = DEFAULT_MENUS;
    ElMessage.warning('获取菜单列表失败，已加载默认数据');
  } finally {
    loading.value = false;
  }
};

// 状态切换处理
const handleStatusChange = async (row: Menu) => {
  try {
    await axios.patch(`/api/menus/${row.id}/status`, { status: row.status });
    ElMessage.success(`菜单状态已${row.status === 1 ? '启用' : '禁用'}`);
  } catch (err) {
    console.error('更新菜单状态失败:', err);
    row.status = row.status === 1 ? 0 : 1; // 回滚状态
    ElMessage.error('更新菜单状态失败');
  }
};

// 新增菜单
const handleAddMenu = () => {
  dialogTitle.value = '新增菜单';
  currentMenuId.value = null;
  Object.assign(formMenu, { name: '', path: '', icon: '', sort: 1, status: 1 });
  dialogVisible.value = true;
};

// 编辑菜单
const handleEditMenu = (row: Menu) => {
  dialogTitle.value = '编辑菜单';
  currentMenuId.value = row.id;
  Object.assign(formMenu, { ...row });
  dialogVisible.value = true;
};

// 保存菜单
const handleSaveMenu = async () => {
  try {
    if (currentMenuId.value) {
      // 更新菜单
      await axios.put(`/api/menus/${currentMenuId.value}`, formMenu);
      ElMessage.success('菜单更新成功');
    } else {
      // 新增菜单
      await axios.post('/api/menus', formMenu);
      ElMessage.success('菜单新增成功');
    }
    dialogVisible.value = false;
    fetchMenus(); // 重新加载菜单列表
  } catch (err) {
    console.error('保存菜单失败:', err);
    ElMessage.error('保存菜单失败');
  }
};

// 删除菜单
const handleDeleteMenu = async (row: Menu) => {
  try {
    await ElMessageBox.confirm('确定要删除此菜单吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await axios.delete(`/api/menus/${row.id}`);
    ElMessage.success('菜单删除成功');
    fetchMenus(); // 重新加载菜单列表
  } catch (err) {
    console.error('删除菜单失败:', err);
    if (err !== 'cancel') ElMessage.error('删除菜单失败');
  }
};

// 页面加载时获取数据
onMounted(() => {
  fetchMenus();
});
</script>

<style scoped>
.menu-manage-container { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.table-skeleton { width: 100%; height: 400px; }
</style>