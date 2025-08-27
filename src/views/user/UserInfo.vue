// 个人主页待完善
<template>
  <div class="user-info">
    <h1>个人信息</h1>
    <p>账号：{{ user.accountname }}</p>
    <p>昵称：{{ user.nickname }}</p>
    <p>邮箱：{{ user.email }}</p>
    <p>手机号：{{ user.phone }}</p>
    <p>微信：{{ user.wechat }}</p>
    <p>微博：{{ user.weibo }}</p>
    <p>QQ：{{ user.qq }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

onMounted(() => {
  user.value = userStore.userInfo;
});
</script>

<style scoped>
.user-info {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin: 20px;
}
</style>