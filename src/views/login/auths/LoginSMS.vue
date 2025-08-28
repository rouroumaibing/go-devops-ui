<template>
  <el-form
    ref="smsFormRef"
    :model="smsForm"
    :rules="smsFormRules"
    class="login-form"
  >
    <el-form-item prop="phone">
      <el-input
        v-model="smsForm.phone"
        placeholder="请输入手机号码"
        :prefix-icon="Phone"
      />
    </el-form-item>
    
    <el-form-item prop="smsCode">
      <el-row :gutter="10">
        <el-col :span="14">
          <el-input
            v-model="smsForm.smsCode"
            placeholder="请输入短信验证码"
            :prefix-icon="Message"
          />
        </el-col>
        <el-col :span="10">
          <el-button
            type="primary"
            :disabled="countdown > 0 || !smsForm.phone"
            @click="sendSmsCode"
          >
            {{ countdown > 0 ? `${countdown}秒后重新发送` : '获取验证码' }}
          </el-button>
        </el-col>
      </el-row>
    </el-form-item>
    
    <el-form-item>
      <el-button
        type="primary"
        class="login-button"
        :loading="loading"
        @click="handleSMSLogin"
      >
        登录
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { Phone, Message } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import router from '@/router';
import axios from '@/utils/axios';

// 表单引用
const smsFormRef = ref<FormInstance>();

// 加载状态
const loading = ref(false);

// 短信倒计时
const countdown = ref(0);
let countdownTimer: number | null = null;

// 短信登录表单
const smsForm = reactive({
  phone: '',
  smsCode: ''
});

// 短信登录表单验证规则
const smsFormRules = ref<FormRules>({
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  smsCode: [
    { required: true, message: '请输入短信验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '验证码长度为4-6位', trigger: 'blur' }
  ]
});

// 发送短信验证码
const sendSmsCode = async () => {
  const valid = await smsFormRef.value?.validateField('phone');
  if (valid) return;
  
  try {
    // 使用实际的获取短信验证码API地址
    await axios.get('/api/auth/sms', {
      params: {
        phone: smsForm.phone
      }
    });
    
    ElMessage.success('短信验证码已发送');
    // 开始倒计时
    startCountdown();
  } catch (error) {
    ElMessage.error('发送失败，请稍后重试');
    console.error('发送短信验证码失败:', error);
  }
};

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60;
  
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }
  }, 1000) as unknown as number;
};

// 处理短信验证码登录 - 定义为普通函数
const handleSMSLogin = async () => {
  const valid = await smsFormRef.value?.validate();
  if (!valid) return;
  
  loading.value = true;
  try {
    // 使用实际的短信登录API地址
    const response = await axios.post('/api/auth/login', {
      phone: smsForm.phone,
      sms_code: smsForm.smsCode,
      method: 'sms'
    });
    ElMessage.success('登录成功');
    // 登录成功后跳转到首页
    router.replace('/dashboard');
  } catch (error) {
    ElMessage.error('登录失败，请检查验证码是否正确');
  } finally {
    loading.value = false;
  }
};

// 如果需要让父组件也能调用这个方法，可以在这里暴露它
defineExpose({
  handleSMSLogin
});
</script>

<style scoped>
.login-form {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
}
</style>