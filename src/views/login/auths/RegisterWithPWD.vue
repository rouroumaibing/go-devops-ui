<template>
  <div class="register-container">
    <div class="register-form-wrapper">
      <div class="register-title">
        <h2>账号注册</h2>
        <p>创建DevOps平台账户</p>
      </div>
      
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerFormRules"
        class="register-form"
      >
        <el-form-item prop="accountname">
          <el-input
            v-model="registerForm.accountname"
            placeholder="请设置账号名"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="nickname">
          <el-input
            v-model="registerForm.nickname"
            placeholder="请设置昵称（选填）"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱（选填）"
            :prefix-icon="Message"
          />
        </el-form-item>
        
        <el-form-item prop="phone">
          <el-input
            v-model="registerForm.phone"
            placeholder="请输入手机号码（选填）"
            :prefix-icon="Phone"
          />
        </el-form-item>
        
        <el-form-item prop="weibo">
          <el-input
            v-model="registerForm.weibo"
            placeholder="请输入微博账号（选填）"
            :prefix-icon="Message"
          />
        </el-form-item>
        
        <el-form-item prop="qq">
          <el-input
            v-model="registerForm.qq"
            placeholder="请输入QQ账号（选填）"
            :prefix-icon="Message"
          />
        </el-form-item>
        
        <el-form-item prop="wechat">
          <el-input
            v-model="registerForm.wechat"
            placeholder="请输入微信账号（选填）"
            :prefix-icon="Message"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            placeholder="请设置密码（至少6位）"
            type="password"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            placeholder="请确认密码"
            type="password"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            class="register-button"
            :loading="loading"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="register-footer">
        <el-link type="primary" :underline="false" @click="goToLogin">
          已有账号？返回登录
        </el-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { User, Lock, Phone, Message } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import router from '@/router';
import axios from '@/utils/axios';
import { Users } from '@/types/usersinfo';

// 表单引用
const registerFormRef = ref<FormInstance>();

// 加载状态
const loading = ref(false);

// 注册表单
const registerForm = reactive({
  accountname: '',
  nickname: '',
  email: '',
  phone: '',
  weibo: '',
  qq: '',
  wechat: '',
  password: '',
  confirmPassword: ''
});

// 注册表单验证规则
const registerFormRules = ref<FormRules>({
  accountname: [
    { required: true, message: '请输入账号名', trigger: 'blur' },
    { min: 3, max: 20, message: '账号名长度为3-20位', trigger: 'blur' }
  ],
  nickname: [
    { min: 2, max: 20, message: '昵称长度为2-20位', trigger: 'blur' }
  ],
  email: [
    { required: false, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: false, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  weibo: [
    { required: false, message: '请输入微博账号', trigger: 'blur' }
  ],
  qq: [
    { required: false, message: '请输入QQ账号', trigger: 'blur' }
  ],
  wechat: [
    { required: false, message: '请输入微信账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
});

// 处理注册
const handleRegister = async () => {
  const valid = await registerFormRef.value?.validate();
  if (!valid) return;
  
  const resultData: Users = {
    accountname: registerForm.accountname,
    nickname: registerForm.nickname,
    email: registerForm.email,
    phone: registerForm.phone,
    password: registerForm.password,
    weibo: registerForm.weibo,
    wechat: registerForm.wechat,
    qq: registerForm.qq,
  };
  
  loading.value = true;
  try {
    // 使用实际的注册API地址，确保提交的字段与 Users 接口一致
    const response = await axios.post('/api/auth/register', resultData);
    
    ElMessage.success('注册成功，请登录');
    // 注册成功后跳转到登录页面
    router.push('/login');
  } catch (error) {
    ElMessage.error('注册失败，请稍后重试');
    console.error('注册失败:', error);
  } finally {
    loading.value = false;
  }
};

// 返回登录页面
const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.register-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-form-wrapper {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  width: 400px;
  max-width: 90%;
}

.register-title {
  text-align: center;
  margin-bottom: 30px;
}

.register-title h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.register-title p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.register-form {
  margin-bottom: 20px;
}

.register-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
}

.register-footer {
  text-align: center;
  margin-top: 20px;
}
</style>