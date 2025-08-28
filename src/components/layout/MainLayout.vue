<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="sidebar-container">
      <el-menu
        :router="true"
        default-active=""
        class="el-menu-vertical-demo"
        background-color="#001529"
        text-color="#fff"
        active-text-color="#ffd04b"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>控制台</span>
        </el-menu-item>
        <el-menu-item index="/serviceTree">
          <el-icon><Setting /></el-icon>
          <span>服务树管理</span>
        </el-menu-item>
        <el-menu-item index="/user">
          <el-icon><UserFilled /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header-container">
        <div class="header-left">
          <el-icon @click="toggleCollapse"><Menu /></el-icon>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-avatar>admin</el-avatar>
              <span>管理员</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="showUserInfo">个人中心</el-dropdown-item>
                <el-dropdown-item>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-container">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
  
  <!-- 用户信息抽屉 -->
  <el-drawer
    v-model="userInfoDrawerVisible"
    title="个人信息"
    size="50%"
    direction="rtl"
    :with-header="true"
  >
    <UserInfo :user-id="currentUserId" />
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { HomeFilled, UserFilled, Menu, Setting } from '@element-plus/icons-vue'
// 导入UserInfo组件
import UserInfo from '@/views/user/UserInfo.vue'

const isCollapse = ref(false)
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const userInfoDrawerVisible = ref(false)

const currentUserId = ref('1')

// 打开用户信息抽屉
const showUserInfo = () => {
  userInfoDrawerVisible.value = true
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar-container {
  background-color: #001529;
}

.header-container {
  background-color: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.main-container {
  padding: 20px;
  background-color: #f5f5f5;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-info .el-avatar {
  margin-right: 8px;
}
</style>