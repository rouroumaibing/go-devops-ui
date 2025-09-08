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
          <span>{{ $t('dashboard') }}</span>
        </el-menu-item>
        <el-menu-item index="/serviceTree">
          <el-icon><Setting /></el-icon>
          <span>{{ $t('serviceTree') }}</span>
        </el-menu-item>
        <el-menu-item index="/user">
          <el-icon><UserFilled /></el-icon>
          <span>{{ $t('user') }}</span>
        </el-menu-item>
        <el-menu-item index="/apimanager">
          <el-icon><Document /></el-icon>
          <span>{{ $t('apiManager') }}</span>
        </el-menu-item>
        <el-menu-item index="/logmanager">
          <el-icon><Bell /></el-icon>
          <span>{{ $t('logManager') }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header-container">
        <div class="header-left">
          <el-icon @click="toggleCollapse"><Menu /></el-icon>
        </div>
        <div class="header-right">
          <!-- 语言切换按钮 -->
          <el-dropdown trigger="click" @command="handleLangChange">
            <span class="language-selector">
              <el-icon><Flag /></el-icon>
              <span>{{ currentLangText }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="zh">中文</el-dropdown-item>
                <el-dropdown-item command="en">English</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <!-- 用户信息下拉菜单 -->
          <el-dropdown>
            <span class="user-info">
              <el-avatar>{{ $t('admin').substring(0, 2) }}</el-avatar>
              <span>{{ $t('admin') }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="showUserInfo">{{ $t('personalCenter') }}</el-dropdown-item>
                <el-dropdown-item @click="handleLogout">{{ $t('logout') }}</el-dropdown-item>
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { HomeFilled, UserFilled, Menu, Setting, Document, Bell, Flag } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import UserInfo from '@/views/user/UserInfo.vue'
import { setLocale } from '@/i18n'
import { useLangStore } from '@/stores/lang'

const router = useRouter()
const { locale } = useI18n()
const langStore = useLangStore()

const isCollapse = ref(false)
const userInfoDrawerVisible = ref(false)
const currentUserId = ref('')
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

// 获取当前语言的文本显示
const currentLangText = computed(() => {
  return locale.value === 'zh' ? '中文' : 'English'
})

// 处理语言切换
const handleLangChange = (lang: 'zh' | 'en') => {
  setLocale(lang)
}

const getUserIdFromStorage = () => {
  const storedUserId = sessionStorage.getItem('userId');
  if (storedUserId) {
    currentUserId.value = storedUserId;
  } else {
    // 如果没有找到用户ID，重定向到登录页面
    router.replace('/login');
  }
};

// 打开用户信息抽屉
const showUserInfo = () => {
  if (!currentUserId.value) {
    getUserIdFromStorage();
  }
  
  if (currentUserId.value) {
    userInfoDrawerVisible.value = true;
  }
};

const handleLogout = () => {
  sessionStorage.removeItem('userId');
  router.replace('/login');
}

onMounted(() => {
  getUserIdFromStorage();
});
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

.language-selector {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-right: 20px;
  color: #333;
}

.language-selector .el-icon {
  margin-right: 5px;
}
</style>