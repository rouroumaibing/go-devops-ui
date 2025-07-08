<template>
  <el-card class="component-manage-container">
    <template #header>
      <div class="card-header">
        <el-button type="primary" icon="Plus">新增组件</el-button>
      </div>
    </template>
    
    <!-- 新增服务树与组件列表的左右布局 -->
    <el-row :gutter="20">
      <!-- 服务树 - 左侧 -->
      <el-col :span="6">
        <div class="service-tree-container">
          <h3>服务组件树</h3>
          <el-tree
            :data="serviceTreeData"
            :props="treeProps"
            node-key="id"
            default-expand-all
            class="service-tree"
          ></el-tree>
        </div>
      </el-col>
      
      <!-- 组件列表 - 右侧 -->
      <el-col :span="18">
        <el-table :data="componentList" border stripe>
          <!-- 表格内容保持不变 -->
          <el-table-column type="index" label="序号" width="80"></el-table-column>
          <el-table-column prop="name" label="组件名称" width="180"></el-table-column>
          <el-table-column prop="version" label="版本" width="120"></el-table-column>
          <el-table-column prop="type" label="类型" width="120"></el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-switch v-model="row.status" :active-value="1" :inactive-value="0"></el-switch>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default>
              <el-button :link="true" size="small">编辑</el-button>
              <el-button :link="true" size="small" text-color="red">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 服务树配置
const treeProps = ref({
  label: 'name',
  children: 'components'
});

// 服务树数据（服务为父节点，组件为子节点）
const serviceTreeData = ref([
  {
    id: 1,
    name: '用户服务',
    components: [
      { id: 101, name: '用户认证组件' },
      { id: 102, name: '权限管理组件' }
    ]
  },
  {
    id: 2,
    name: '订单服务',
    components: [
      { id: 201, name: '订单创建组件' },
      { id: 202, name: '支付集成组件' }
    ]
  },
  {
    id: 3,
    name: '商品服务',
    components: [
      { id: 301, name: '商品展示组件' },
      { id: 302, name: '库存管理组件' }
    ]
  }
]);

// 组件列表数据（保持不变）
const componentList = ref([
  { id: 1, name: '组件A', version: '1.0.0', type: '前端', status: 1 },
  { id: 2, name: '组件B', version: '2.1.0', type: '后端', status: 1 },
  { id: 3, name: '组件C', version: '0.9.5', type: '数据库', status: 0 },
]);
</script>

<style scoped>
.component-manage-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 服务树样式 */
.service-tree-container {
  background: #f9f9f9;
  border-radius: 4px;
  padding: 15px;
  height: 100%;
  min-height: 400px;
}

.service-tree-container h3 {
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.service-tree {
  width: 100%;
}
</style>