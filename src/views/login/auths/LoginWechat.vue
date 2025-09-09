<template>
  <div class="wechat-login-container">
    <el-button
      type="text"
      class="third-party-btn"
      @click="showWechatQRCode"
    >
      <Icon icon="ri:wechat-fill" class="third-party-icon" />
      <span class="third-party-text">微信登录</span>
    </el-button>
    
    <!-- 微信二维码弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="微信扫码登录"
      width="360px"
      :show-close="false"
      center
    >
      <div class="qr-code-wrapper">
        <div id="login_container" class="qr-code-container"></div>
        <p class="qr-code-tips">请使用微信扫描二维码登录</p>
        <p class="qr-code-state" v-if="qrCodeState">{{ qrCodeState }}</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Icon } from '@iconify/vue';
import router from '@/router';
import axios from '@/utils/axios';
import { TokenRespone } from '@/types/usersinfo';

const dialogVisible = ref(false);
const qrCodeState = ref('');
let wxLoginInstance: any = null;
let checkInterval: number | null = null;
const WECHAT_APPID = import.meta.env.VITE_WECHAT_APPID || '';
const WECHAT_REDIRECTURI = import.meta.env.VITE_WECHAT_REDIRECTURI || '';

// 显示微信二维码弹窗
const showWechatQRCode = () => {
  dialogVisible.value = true;
  // 延迟初始化，确保DOM已经渲染
  setTimeout(() => {
    initWechatLogin();
  }, 100);
};

// 关闭弹窗
const closeDialog = () => {
  dialogVisible.value = false;
  // 清理二维码
  cleanWechatLogin();
  // 清理定时器
  cleanupInterval();
};

// 初始化微信登录
const initWechatLogin = () => {
  // 检查微信登录JS是否已加载
  if (!(window as any).WxLogin) {
    loadWechatLoginScript();
    return;
  }
  
  // 生成随机state参数，用于防止CSRF攻击
  const state = generateRandomString();
  // 保存state到sessionStorage，用于后续验证
  sessionStorage.setItem('wechat_oauth_state', state);
  
  // 创建微信登录实例
  wxLoginInstance = new (window as any).WxLogin({
    self_redirect: false,
    id: 'login_container',
    appid: WECHAT_APPID,
    scope: 'snsapi_login',
    redirect_uri: encodeURIComponent(WECHAT_REDIRECTURI),
    state: state,
    style: 'black',
    href: '',
    onReady: (isReady: boolean) => {
      if (isReady) {
        qrCodeState.value = '';
      } else {
        qrCodeState.value = '二维码加载失败，请刷新重试';
      }
    },
    onQRcodeReady: () => {
      qrCodeState.value = '请使用微信扫描二维码';
    }
  });
  
  // 添加授权回调处理
  checkWechatAuthCallback();
};

const loadWechatLoginScript = () => {
  const script = document.createElement('script');
  script.src = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js';
  script.onload = () => {
    initWechatLogin();
  };
  script.onerror = () => {
    qrCodeState.value = '微信登录服务暂不可用，请稍后重试';
  };
  document.head.appendChild(script);
};

// 清理微信登录实例
const cleanWechatLogin = () => {
  const container = document.getElementById('login_container');
  if (container) {
    container.innerHTML = '';
  }
  wxLoginInstance = null;
  qrCodeState.value = '';
};

// 清理定时器
const cleanupInterval = () => {
  if (checkInterval !== null) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
};

// 生成随机字符串
const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// 检查URL中的微信授权回调参数并处理
const checkWechatAuthCallback = () => {
  // 从URL中获取code和state参数
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  // 如果URL中存在code参数，说明是授权回调
  if (code) {
    handleWechatAuthCallback(code, state || '');
  } else {
    // 轮询检测URL变化，处理授权回调
    setupUrlChangeListener();
  }
};

// 处理微信授权回调
const handleWechatAuthCallback = async (code: string, state?: string) => {
  try {
    // 验证state参数，防止CSRF攻击
    const storedState = sessionStorage.getItem('wechat_oauth_state');
    if (state && storedState && state !== storedState) {
      ElMessage.error('微信登录验证失败');
      return;
    }
    
    // 发送code到后端进行验证和登录处理
    const response = await axios.post<TokenRespone>('/api/auth/wechat/callback', { code });
    const tokenData = response.data;
    sessionStorage.setItem('userUUID', tokenData.userUUID);
    sessionStorage.setItem('accessToken', tokenData.accessToken);
    sessionStorage.setItem('refreshToken', tokenData.refreshToken);
    dialogVisible.value = false;
    router.replace('/dashboard');
  } catch (error) {
    console.error('微信登录出错:', error);
    ElMessage.error('微信登录失败，请重试');
  } finally {
    // 清理定时器
    cleanupInterval();
    
    if (window.history.replaceState) {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.delete('code');
      urlParams.delete('state');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, document.title, newUrl);
    }
  }
};

// 设置URL变化监听器，用于处理内嵌二维码的授权回调
const setupUrlChangeListener = () => {
  // 使用定时器轮询检测URL变化
  checkInterval = window.setInterval(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code) {
      cleanupInterval();
      handleWechatAuthCallback(code, state || '');
    }
  }, 1000);
};

// 处理微信登录 - 定义为普通函数，供父组件调用
const handleWechatLogin = () => {
  showWechatQRCode();
};

// 暴露方法给父组件
defineExpose({
  handleWechatLogin
});

// 组件卸载时清理资源
onUnmounted(() => {
  cleanWechatLogin();
  cleanupInterval();
});
</script>

<style scoped>
.wechat-login-container {
  display: inline-block;
}

.third-party-btn {
  font-size: 24px;
}

.third-party-icon {
  font-size: 24px;
  color: #07C160;
  margin-right: 5px;
}

.third-party-text {
  font-size: 16px;
  color: #606266;
}

.qr-code-wrapper {
  text-align: center;
  padding: 20px 0;
}

.qr-code-container {
  width: 200px;
  height: 200px;
  margin: 0 auto 20px;
}

.qr-code-tips {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 14px;
}

.qr-code-state {
  margin: 0;
  color: #409eff;
  font-size: 14px;
}

.dialog-footer {
  width: 100%;
  text-align: center;
}
</style>