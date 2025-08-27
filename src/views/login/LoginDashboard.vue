<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <div class="login-title">
        <h2>DevOps平台登录</h2>
        <p>欢迎使用DevOps管理平台</p>
      </div>
      
      <!-- 登录方式切换 -->
      <div class="login-tabs">
        <el-button
          type="text"
          :class="{ active: loginMethod === 'password' }"
          @click="switchToPasswordLogin"
        >
          账号密码登录
        </el-button>
        <el-button
          type="text"
          :class="{ active: loginMethod === 'sms' }"
          @click="switchToSmsLogin"
        >
          短信验证码登录
        </el-button>
      </div>
      
      <!-- 账号密码登录表单 -->
      <LoginPWD ref="loginPWDRef" v-if="loginMethod === 'password'" />
      
      <!-- 短信验证码登录表单 -->
      <LoginSMS ref="loginSMSRef" v-if="loginMethod === 'sms'" />
      
      <!-- 第三方登录 -->
      <div class="third-party-login">
        <div class="separator">
          <span>其他登录方式</span>
        </div>
        <div class="third-party-buttons">
          <LoginQQ ref="loginQQRef" />
          <LoginWechat ref="loginWeChatRef" />
          <LoginWeiBo ref="loginWeiBoRef" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LoginPWD from './auths/LoginPWD.vue';
import LoginSMS from './auths/LoginSMS.vue';
import LoginQQ from './auths/LoginQQ.vue';
import LoginWechat from './auths/LoginWechat.vue';
import LoginWeiBo from './auths/LoginWeiBo.vue';

// 登录方式状态
const loginMethod = ref<'password' | 'sms'>('password');

// 组件引用
const loginPWDRef = ref();
const loginSMSRef = ref();
const loginQQRef = ref();
const loginWeChatRef = ref();
const loginWeiBoRef = ref();

// 切换到账号密码登录
const switchToPasswordLogin = () => {
  loginMethod.value = 'password';
};

// 切换到短信验证码登录
const switchToSmsLogin = () => {
  loginMethod.value = 'sms';
};
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form-wrapper {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  width: 400px;
  max-width: 90%;
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
}

.login-title h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.login-title p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.login-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  border-bottom: 1px solid #e4e7ed;
}

.login-tabs .el-button {
  font-size: 16px;
  padding: 10px 20px;
}

.login-tabs .el-button.active {
  color: #409eff;
  border-bottom: 2px solid #409eff;
}

.third-party-login {
  margin-top: 30px;
}

.separator {
  text-align: center;
  margin-bottom: 20px;
  position: relative;
}

.separator::before,
.separator::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #e4e7ed;
}

.separator::before {
  left: 0;
}

.separator::after {
  right: 0;
}

.separator span {
  padding: 0 20px;
  background: white;
  color: #909399;
  font-size: 14px;
}

.third-party-buttons {
  display: flex;
  justify-content: center;
  gap: 30px;
}
</style>