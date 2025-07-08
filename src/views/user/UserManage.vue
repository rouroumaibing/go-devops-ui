<template>
  <el-card title="用户管理">
    <el-table :data="userList">
      <el-table-column prop="id" label="ID"></el-table-column>
      <el-table-column prop="name" label="用户名"></el-table-column>
      <el-table-column prop="role" label="角色"></el-table-column>
      <el-table-column label="操作">
        <template #default>
          <el-button type="primary" size="small">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
const userList = [
  { id: 1, name: '管理员', role: '系统管理员' },
  { id: 2, name: '测试用户', role: '普通用户' }
]
</script>