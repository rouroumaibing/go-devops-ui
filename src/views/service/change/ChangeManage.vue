<template>
  <div class="change-manage">
    <el-table :data="changeList">
      <el-table-column prop="id" label="变更编号"></el-table-column>
      <el-table-column prop="description" label="描述"></el-table-column>
      <el-table-column prop="content" label="变更内容"></el-table-column>
      <el-table-column prop="status" label="状态"></el-table-column>
      <el-table-column prop="creator" label="创建人"></el-table-column>
      <el-table-column prop="updateTime" label="最后更新时间"></el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
// 模拟数据
const changeList = [
  { id: 'C001', description: '初始版本', content: '创建项目结构', status: '已完成', creator: 'admin', updateTime: '2025-07-01 10:00' }
]
</script>