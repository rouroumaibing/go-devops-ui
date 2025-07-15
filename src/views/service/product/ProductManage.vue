<template>
  <div class="product-manage">
    <el-table :data="productList" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="name" label="产物名称" width="200">
        <template #default="scope">
          <a :href="`/api/download/${scope.row.name}`" target="_blank" class="download-link">{{ scope.row.name }}</a>
        </template>
      </el-table-column>
      <el-table-column prop="size" label="产物大小" width="120">
        <template #default="scope">
          {{ formatFileSize(scope.row.size) }}
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="生成时间" width="180"></el-table-column>
      <el-table-column prop="operator" label="操作人" width="120"></el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="scope">
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElTable, ElTableColumn, ElButton } from 'element-plus';

// 定义产物数据接口
interface Product {
  id: number;
  name: string;
  size: number; // 字节数
  createTime: string;
  operator: string;
}

// 模拟产物数据（已更新为.tgz格式）
const productList = ref<Product[]>([
  { id: 1, name: 'backend-api.tgz', size: 1024 * 1024 * 2.5, createTime: '2025-7-15 09:30:00', operator: '张三' },
  { id: 2, name: 'frontend-assets.tgz', size: 1024 * 1024 * 1.8, createTime: '2025-7-14 14:20:00', operator: '李四' },
  { id: 3, name: 'database-backup.tgz', size: 1024 * 1024 * 50, createTime: '2025-7-13 23:15:00', operator: '王五' },
  { id: 4, name: 'mobile-app.tgz', size: 1024 * 1024 * 8.7, createTime: '2025-7-12 10:05:00', operator: '赵六' },
]);

// 文件大小格式化 (字节转MB/KB)
const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  } else if (bytes >= 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else {
    return bytes + ' B';
  }
};

// 删除操作
const handleDelete = (row: Product) => {
  // 删除逻辑待实现
  console.log('删除产物:', row);
};
</script>

<style scoped>
.product-manage {
  padding: 20px;
}
.download-link {
  color: #409eff;
  text-decoration: none;
}
.download-link:hover {
  text-decoration: underline;
}
</style>