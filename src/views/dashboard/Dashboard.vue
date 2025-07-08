<template>
  <div class="dashboard-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>系统概览</h2>
        </div>
      </template>
      <div class="statistic-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="statistic-card">
              <div class="statistic-content">
                <p class="statistic-label">总用户数</p>
                <p class="statistic-value">1,258</p>
                <p class="statistic-change">+12.5% <span class="text-success"><ArrowUp /></span></p>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="statistic-card">
              <div class="statistic-content">
                <p class="statistic-label">今日活跃</p>
                <p class="statistic-value">328</p>
                <p class="statistic-change">+5.2% <span class="text-success"><ArrowUp /></span></p>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="statistic-card">
              <div class="statistic-content">
                <p class="statistic-label">系统状态</p>
                <p class="statistic-value">正常</p>
                <p class="statistic-change"><span class="text-success"><Check /></span> 所有服务运行正常</p>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="statistic-card">
              <div class="statistic-content">
                <p class="statistic-label">在线时长</p>
                <p class="statistic-value">128天</p>
                <p class="statistic-change">上次重启: 2023-01-15</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ArrowUp, Check } from '@element-plus/icons-vue'
</script>

<style scoped>
.dashboard-container {
  padding: 10px;
}

.statistic-container {
  margin-top: 20px;
}

.statistic-card {
  height: 100%;
}

.statistic-content {
  padding: 15px;
}

.statistic-label {
  color: #606266;
  font-size: 14px;
  margin-bottom: 10px;
}

.statistic-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.statistic-change {
  font-size: 12px;
  color: #909399;
}

.text-success {
  color: #67c23a;
}
</style>