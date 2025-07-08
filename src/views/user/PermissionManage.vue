<template>
  <el-card title="权限管理">
    <el-table :data="permissionList">
      <el-table-column prop="id" label="ID"></el-table-column>
      <el-table-column prop="name" label="权限名称"></el-table-column>
      <el-table-column prop="permissions" label="权限项"></el-table-column>
      <el-table-column label="操作">
        <template #default>
          <el-button type="primary" size="small">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
const permissionList = [
  { id: 1, name: '系统管理员', permissions: '全部权限' },
  { id: 2, name: '普通用户', permissions: '查看权限' }
]
</script>