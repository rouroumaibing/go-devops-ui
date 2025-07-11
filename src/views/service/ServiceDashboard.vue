<template>
  <el-card class="pipeline-dashboard-container">
    <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
      <el-tab-pane label="组件管理" name="component">
        <ComponentManage />
      </el-tab-pane>
      <el-tab-pane label="流水线管理" name="manage">
        <PipelineManage />
      </el-tab-pane>
      <el-tab-pane label="任务管理" name="job">
        <PipelineJob />
      </el-tab-pane>
      <el-tab-pane label="环境管理" name="environment">
        <EnvironmentManage />
      </el-tab-pane>
      <el-tab-pane label="构建管理" name="build">
        <BuildManage />
      </el-tab-pane>
      <el-tab-pane label="变更管理" name="change">
        <ChangeManage />
      </el-tab-pane>
      <el-tab-pane label="产物管理" name="product">
        <ProductManage />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { TabPaneName } from 'element-plus';
import ComponentManage from './ComponentManage.vue';
import PipelineManage from './PipelineManage.vue';
import EnvironmentManage from './EnvironmentManage.vue';
import BuildManage from './BuildManage.vue';
import ChangeManage from './ChangeManage.vue';
import ProductManage from './ProductManage.vue';
import PipelineJob from './PipelineJob.vue';

const activeTab = ref('component');
const route = useRoute();
const router = useRouter();

onMounted(() => {
  const tabName = route.query.tab as TabPaneName;
  if (tabName) {
    activeTab.value = String(tabName);
  }
});
const handleTabChange = (tabName: TabPaneName) => {
  router.push({ path: route.path, query: { ...route.query, tab: String(tabName) } });
};
</script>

<style scoped>
.pipeline-dashboard-container {
  padding: 20px;
  height: 100%;
}
</style>