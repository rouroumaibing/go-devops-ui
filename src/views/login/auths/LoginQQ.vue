<template>
  <el-button
    type="text"
    class="third-party-btn"
    @click="handleQQLogin"
  >
    <Icon icon="ri:qq-fill" class="third-party-icon" />
    <span class="third-party-text">QQ登录</span>
  </el-button>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { Icon } from '@iconify/vue';
import router from '@/router';

// 处理QQ登录 - 定义为普通函数
const handleQQLogin = async () => {
  console.log('QQ登录');
  ElMessage.info('正在跳转到QQ授权页面');
  
  try {
    // 模拟第三方授权过程
    // 实际项目中这里应该跳转到第三方授权页面
    // window.location.href = 'https://example.com/qq/auth';
    
    // 模拟授权成功后返回
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    ElMessage.success('QQ登录成功');
    // 登录成功后跳转到dashboard
    router.replace('/dashboard');
  } catch (error) {
    ElMessage.error('QQ登录失败');
  }
};

// 暴露方法给父组件
defineExpose({
  handleQQLogin
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