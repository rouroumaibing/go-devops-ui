<template>
  <div class="component-detail-container">
    <el-card class="component-card">
      <div class="detail-header">
        <h2>{{ componentData.name }} 详情</h2>
        <div class="header-actions">
          <el-button type="primary" @click="handleEditClick">
            <el-icon><Edit /></el-icon> 编辑组件
          </el-button>
          <el-button type="default" @click="handleBackClick" style="margin-left: 10px;">
            <el-icon><ArrowLeft /></el-icon> 返回列表
          </el-button>
        </div>
      </div>

      <el-divider></el-divider>

      <el-row :gutter="20">
        <!-- 基本信息卡片 -->
        <el-col :span="12">
          <el-card class="info-card">
            <template #header><h3>基本信息</h3></template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="组件名称">{{ componentData.name }}</el-descriptions-item>
              <el-descriptions-item label="所属服务">{{ componentData.serviceTree }}</el-descriptions-item>
              <el-descriptions-item label="组件ID">{{ componentData.id }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ componentData.createTime }}</el-descriptions-item>
              <el-descriptions-item label="最后更新">{{ componentData.updateTime }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="info-card">
            <template #header><h3>代码库信息</h3></template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="代码库地址">
                <el-link :href="componentData.repoUrl" target="_blank">{{ componentData.repoUrl || '未设置' }}</el-link>
              </el-descriptions-item>
              <el-descriptions-item label="分支">{{ componentData.repoBranch || 'main' }}</el-descriptions-item>
              <el-descriptions-item label="负责人">{{ componentData.owner }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="desc-card" style="margin-top: 20px;">
        <template #header><h3>组件描述</h3></template>
        <div class="component-description">
          {{ componentData.description || '暂无描述信息' }}
        </div>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import axios from '@/utils/axios'
import { ref, onMounted, defineProps } from 'vue';
import { useRoute } from 'vue-router';
import { Edit, ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

// 定义组件数据接口
interface ComponentData {
  id: number;
  name: string;
  serviceTree: string;
  owner: string;
  description?: string;
  repoUrl?: string;
  repoBranch?: string;
  createTime?: string;
  updateTime?: string;
}

const DEFAULT_COMPONENT_DATA: ComponentData = {
  id: 2,
  name: 'push-server',
  serviceTree: 'DevOps > APP',
  description: '消息推送服务，负责APP通知推送。支持多种推送方式，包括xxx、xxx、推送等主流推送渠道。',
  repoUrl: 'https://github.com/example/push-server',
  repoBranch: 'main',
  owner: 'xxx', 
  createTime: '2025-07-15',
  updateTime: '2025-07-17',
};

// 编辑按钮点击事件
const handleEditClick = () => {
  ElMessage.info(`进入 ${componentData.value.name} 的编辑页面`);
  // 实际应用中应使用路由跳转
  // router.push(`/service/component/${componentData.value.id}/edit`);
};

// 返回列表按钮点击事件
const handleBackClick = () => {
  ElMessage.info('返回组件列表');
  // 实际应用中应使用路由返回
  // router.go(-1);
};

// 定义接收的组件ID参数
const props = defineProps<{
  componentId?: string;
}>();

const route = useRoute();
const componentData = ref<ComponentData>(DEFAULT_COMPONENT_DATA);

onMounted(() => {
  const queryComponentId = Array.isArray(route.query.componentId) ? route.query.componentId[0] : route.query.componentId;
  const componentId = props.componentId || queryComponentId;
  if (componentId && componentId !== DEFAULT_COMPONENT_DATA.id.toString()) {
    loadComponentData(componentId);
  }
});

// 加载组件数据的函数
const loadComponentData = async (id: string) => {
  try {
    // 实际API请求实现
    const response =  await axios.get(`/api/component/${id}`);
    componentData.value = response.data;
    ElMessage.success(`加载组件 ${id} 详情成功`);
  } catch (error) {
    ElMessage.error('加载组件详情失败');
    console.error(error);
  }
};
</script>

<style scoped lang="scss">
.component-detail-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.component-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
}

.info-card {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.desc-card .component-description {
  line-height: 1.6;
  padding: 10px;
  color: #606266;
  background-color: #f9f9f9;
  border-radius: 4px;
  min-height: 100px;
}

.resources-card {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}
</style>