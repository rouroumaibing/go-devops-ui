<template>
  <el-card class="pipeline-dashboard-container">
    <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
      <el-tab-pane v-for="tab in tabsConfig" :key="tab.name" :label="tab.label" :name="tab.name"></el-tab-pane>
    </el-tabs>
    <div class="tab-content">
      <div v-if="!currentComponent" class="loading">加载中...</div>
      <component :is="currentComponent" v-else />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Component } from 'vue';
import { ElTabs, ElTabPane, ElCard, ElMessage } from 'element-plus';

import type { TabPaneName as ElTabPaneName } from 'element-plus';

interface TabConfig {
  label: string;
  name: TabPaneName;
  component: () => Promise<{ default: Component }>;
}

type TabPaneName = 'component' | 'manage' | 'environment' | 'build' | 'change' | 'product';

const tabsConfig: TabConfig[] = [
  { label: '组件管理', name: 'component', component: () => import('./component/ComponentManage.vue') },
  { label: '流水线管理', name: 'manage', component: () => import('./pipeline/PipelineManage.vue') },
  { label: '环境管理', name: 'environment', component: () => import('./environment/EnvironmentManage.vue') },
  { label: '构建管理', name: 'build', component: () => import('./build/BuildManage.vue') },
  { label: '变更管理', name: 'change', component: () => import('./change/ChangeManage.vue') },
  { label: '产物管理', name: 'product', component: () => import('./product/ProductManage.vue') },
];

// 4. 创建组件映射表（从tabsConfig生成）
const componentMap: Record<TabPaneName, () => Promise<{ default: Component }>> = {
  ...tabsConfig.reduce((map, tab) => {
    map[tab.name] = tab.component;
    return map;
  }, {} as Record<TabPaneName, () => Promise<{ default: Component }>>)
};

const activeTab = ref<TabPaneName>('component');
const route = useRoute();
const router = useRouter();
// Use shallowRef instead of ref
const loadedComponents = shallowRef<Record<string, Component>>({});

// 当前要显示的组件
const currentComponent = computed(() => {
  return loadedComponents.value[activeTab.value];
});

onMounted(() => {
  const tabName = route.query.tab as TabPaneName;
  if (tabName && tabsConfig.some(tab => tab.name === tabName)) {
    activeTab.value = tabName;
  }
  // 加载初始选中的组件
  loadComponent(activeTab.value);
});

// 处理页签切换
const handleTabChange = async (tabName: ElTabPaneName) => {
  if (typeof tabName === 'string' && tabsConfig.some(tab => tab.name === tabName)) {
    router.push({ path: route.path, query: { ...route.query, tab: tabName } });
    await loadComponent(tabName as TabPaneName);
    activeTab.value = tabName as TabPaneName;
  }
};

// 加载组件
const loadComponent = async (tabName: TabPaneName) => {
  if (!loadedComponents.value[tabName] && componentMap[tabName]) {
    try {
      const module = await componentMap[tabName]();
      if (module && module.default) {
        loadedComponents.value[tabName] = module.default;
        loadedComponents.value = { ...loadedComponents.value };
      } else {
        throw new Error(`组件模块无效: ${tabName}`);
      }
    } catch (error) {
      ElMessage.error(`加载${tabName}组件失败`);
    }
  }
};
</script>

<style scoped>
.pipeline-dashboard-container {
  padding: 20px;
  height: 100%;
}
.tab-content {
  margin-top: 20px;
}

</style>
