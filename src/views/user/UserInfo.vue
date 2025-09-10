<template>
  <div class="user-info">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>个人信息</span>
        </div>
      </template>
      
      <div v-if="loading" class="loading-container">
        <el-loading v-loading="loading" element-loading-text="加载中..."></el-loading>
      </div>
      
      <div v-else-if="error" class="error-container">
        <el-alert :message="error" type="error" show-icon></el-alert>
        <el-button type="primary" @click="fetchUserInfo">重新加载</el-button>
      </div>
      
      <div v-else-if="user" class="user-details">
        <el-descriptions border :column="{ xs: 1, sm: 2, lg: 3 }">
          <el-descriptions-item label="账号">{{ user.accountname }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ user.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ user.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ user.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="微信">{{ user.wechat || '-' }}</el-descriptions-item>
          <el-descriptions-item label="QQ">{{ user.qq || '-' }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ user.age || '-' }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ user.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ user.identitycard ? '******' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ user.created_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ user.updated_at || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <div v-else class="empty-container">
        <el-empty description="暂无用户信息"></el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from '@/utils/axios';
import { ElMessage } from 'element-plus';
import { Users } from '@/types/usersinfo';

// 定义用户信息响应式变量
const user = ref<Users | null>(null);
const loading = ref<boolean>(false);
const error = ref<string>('');

// 定义props
const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

// 获取当前登录用户信息
const fetchUserInfo = async () => {
  loading.value = true;
  error.value = '';
  try {
    const userId = props.userId;
    
    if (!userId) {
      error.value = '未找到用户ID，请先登录';
      ElMessage.warning('请先登录');
      loading.value = false;
      return;
    }
    
    // 调用后端API获取用户信息，并指定响应类型
    const response = await axios.get<{ data?: Users }>(`/api/auth/users/${userId}`);
    
    // 安全地处理响应数据
    if (response && response.data) {
      // 使用类型断言确保类型安全
      user.value = response.data as Users;
    } else {
      error.value = '获取用户信息失败：数据格式不正确';
    }
  } catch (err) {
    console.error('获取用户信息失败:', err);
    error.value = '获取用户信息失败，请稍后重试';
    ElMessage.error('获取用户信息失败');
  } finally {
    loading.value = false;
  }
};

// 组件挂载时获取用户信息
onMounted(() => {
  fetchUserInfo();
});
</script>

<style scoped lang="scss">
.user-info {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-container,
.error-container,
.empty-container {
  padding: 40px 0;
  text-align: center;
}

.user-details {
  padding: 20px 0;
}

.el-button {
  margin-top: 16px;
}

// 适配在抽屉中显示的样式
:deep(.el-card__body) {
  height: calc(100% - 52px);
  overflow-y: auto;
}
</style>