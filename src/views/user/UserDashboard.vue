<template>
  <el-card class="user-dashboard-container">
    <template #header>
      <div class="card-header">
        <h2>用户管理</h2>
      </div>
    </template>
    <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
      <el-tab-pane label="用户列表" name="list">
        <UserManage />
      </el-tab-pane>
      <el-tab-pane label="用户组管理" name="group">
        <UserGroupManage />
      </el-tab-pane>
      <el-tab-pane label="权限管理" name="permission">
        <PermissionManage />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { TabPaneName } from 'element-plus';
import UserManage from './UserManage.vue';
import UserGroupManage from './UserGroupManage.vue';
import PermissionManage from './PermissionManage.vue';

const route = useRoute();
const router = useRouter();
const activeTab = ref<TabPaneName>('list');

onMounted(() => {
  const tab = route.query.tab as TabPaneName;
  if (tab) {
    activeTab.value = tab;
  }
});

const handleTabChange = (tab: TabPaneName) => {
  router.push({ path: '/user', query: { ...route.query, tab } });
  activeTab.value = tab;
};
</script>

<style scoped>
.user-dashboard-container {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>