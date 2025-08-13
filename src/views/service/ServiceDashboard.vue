<template>
  <el-card class="pipeline-dashboard-container">
    <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
      <el-tab-pane label="组件管理" name="component">
        <ComponentManage v-if="activeTab === 'component'" />
      </el-tab-pane>
      <el-tab-pane label="流水线管理" name="manage">
        <PipelineManage v-if="activeTab === 'manage'" />
      </el-tab-pane>
      <el-tab-pane label="环境管理" name="environment">
        <EnvironmentManage v-if="activeTab === 'environment'" />
      </el-tab-pane>
      <el-tab-pane label="构建管理" name="build">
        <BuildManage v-if="activeTab === 'build'" />
      </el-tab-pane>
      <el-tab-pane label="变更管理" name="change">
        <ChangeManage v-if="activeTab === 'change'" />
      </el-tab-pane>
      <el-tab-pane label="产物管理" name="product">
        <ProductManage v-if="activeTab === 'product'" />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { TabPaneName } from 'element-plus';

import ComponentManage from './component/ComponentManage.vue';
import PipelineManage from './pipeline/PipelineManage.vue';
import EnvironmentManage from './environment/EnvironmentManage.vue';
import BuildManage from './build/BuildManage.vue';
import ChangeManage from './change/ChangeManage.vue';
import ProductManage from './product/ProductManage.vue';

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
