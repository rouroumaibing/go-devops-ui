<template>
  <el-form
    ref="passwordFormRef"
    :model="passwordForm"
    :rules="passwordFormRules"
    class="login-form"
  >
    <el-form-item prop="username">
      <el-input
        v-model="passwordForm.username"
        placeholder="请输入用户名"
        :prefix-icon="User"
      />
    </el-form-item>
    
    <el-form-item prop="password">
      <el-input
        v-model="passwordForm.password"
        placeholder="请输入密码"
        type="password"
        :prefix-icon="Lock"
        show-password
      />
    </el-form-item>
    
    <el-form-item class="remember-forgot">
      <div class="forgot-register">
        <el-link type="primary" :underline="false" @click="handleForgotPassword">
          忘记密码？
        </el-link>
        <el-link type="primary" :underline="false" @click="handleRegister">
          注册账户
        </el-link>
      </div>
    </el-form-item>
    
    <el-form-item>
      <el-button
        type="primary"
        class="login-button"
        :loading="loading"
        @click="handlePasswordLogin"
      >
        登录
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import router from '@/router';
import axios from '@/utils/axios';
import { Users } from '@/types/usersinfo';

// 表单引用
const passwordFormRef = ref<FormInstance>();

// 加载状态
const loading = ref(false);

// 账号密码登录表单
const passwordForm = reactive({
  username: '',
  password: ''
});

// 账号密码表单验证规则
const passwordFormRules = ref<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
});

// 处理账号密码登录
const handlePasswordLogin = async () => {
  const valid = await passwordFormRef.value?.validate();
  if (!valid) return;
  
  loading.value = true;

  const requestData: Users = {
    accountname: passwordForm.username,
    password: passwordForm.password,
  }
  try {
    // 使用实际的登录API地址
    const response = await axios.post('/api/auth/login', requestData);
    ElMessage.success('登录成功');

    // 登录成功后跳转到首页
    router.replace('/dashboard');
  } catch (error) {
    ElMessage.error('登录失败，请检查用户名和密码是否正确');
  } finally {
    loading.value = false;
  }
};

// 处理忘记密码
const handleForgotPassword = () => {
  console.log('忘记密码');
  ElMessage.info('忘记密码功能暂未实现');
};

// 处理注册账户
const handleRegister = () => {
  // 跳转到注册页面
  router.push('/login/register');
};

// 暴露方法给父组件
defineExpose({
  handlePasswordLogin
});
</script>

<style scoped>
.login-form { margin-bottom: 20px; }

.remember-forgot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-register {
  display: flex;
  gap: 15px;
}

.login-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
}
</style>