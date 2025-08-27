<template>
  <el-button
    type="text"
    class="third-party-btn"
    @click="handleWechatLogin"
  >
    <Icon icon="ri:wechat-fill" class="third-party-icon" />
    <span class="third-party-text">微信登录</span>
  </el-button>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { Icon } from '@iconify/vue';
import router from '@/router';

// 处理微信登录 - 定义为普通函数
const handleWechatLogin = async () => {
  console.log('微信登录');
  ElMessage.info('正在跳转到微信授权页面');
  
  try {
    // 模拟第三方授权过程
    // 实际项目中这里应该跳转到第三方授权页面
    // window.location.href = 'https://example.com/wechat/auth';
    
    // 模拟授权成功后返回
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    ElMessage.success('微信登录成功');
    // 登录成功后跳转到dashboard
    router.replace('/dashboard');
  } catch (error) {
    ElMessage.error('微信登录失败');
  }
};

// 暴露方法给父组件
defineExpose({
  handleWechatLogin
});
</script>

<style scoped>
.third-party-btn {
  font-size: 24px;
}

.third-party-icon {
  font-size: 24px;
  margin-right: 5px;
}

.third-party-text {
  font-size: 14px;
}
</style>