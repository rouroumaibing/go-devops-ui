<template>
  <div class="build-manage">
    <div class="compare-layout">
      <!-- 左侧环境选择区域 -->
      <div class="environment-selector">
        <div class="environment-label">环境:</div>
        <el-select v-model="selectedEnvironment" placeholder="请选择环境" style="width: 100%; margin-bottom: 20%;" @change="selectEnvironment" :disabled="loadingEnvs">
          <el-option v-for="env in environments" :key="env.id" :label="env.name" :value="env.id?.toString()"></el-option>
        </el-select>
        
        <!-- 环境列表 -->
        <div class="environment-list">
          <div class="env-item" v-for="env in environments" :key="env.id" 
               :class="{ 'active': selectedEnvironment === env.id?.toString(), 'loading': loadingEnv === env.id?.toString() }" 
               @click="selectEnvironment(env.id?.toString() ?? '')" :disabled="loadingEnvs">
            {{ env.name }}
            <el-loading v-if="loadingEnv === env.id?.toString()" :model="true" size="small" text="加载中..." />
          </div>
        </div>
      </div>

      <!-- 右侧配置对比区域 -->
      <div class="config-editor-wrapper">
        <!-- 右上角导入导出按钮 -->
        <div class="top-right-actions">
          <input type="file" ref="fileInput" style="display: none" accept=".yaml,.yml" @change="handleFileSelect" />
          <el-button size="small" @click="triggerFileInput" :disabled="!selectedEnvironment">导入</el-button>
          <el-button size="small" @click="downloadConfig" :disabled="!selectedEnvironment">导出</el-button>
        </div>

        <!-- 引入YamlCompare组件 -->
        <YamlCompare ref="yamlCompareRef" />

        <div class="bottom-right-actions">
          <el-button @click="cancelConfig" :loading="isSubmitting || loadingEnv">取消</el-button>
          <el-button type="primary" @click="saveConfig" :loading="isSubmitting" :disabled="!selectedEnvironment">保存</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import YamlCompare from '../../../views/inputmodule/YamlCompare.vue';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import axios from '../../../utils/axios';
import type { Environment } from '../../../types/environment-manage';

// 定义配置接口
interface EnvironmentConfig {
  original: string;
  modified: string;
  lastUpdated?: string;
}

// 组件引用
const yamlCompareRef = ref<InstanceType<typeof YamlCompare>>();
const fileInput = ref<HTMLInputElement | null>(null);

// 状态变量
const selectedEnvironment = ref(''); 
const loadingEnv = ref('');
const isSubmitting = ref(false);
const hasChanges = ref(false);
const loadingEnvs = ref(false);

// 环境列表
const environments = ref<Environment[]>([]);

// 当前环境配置缓存
const currentEnvironment = ref<Environment | null>(null);

// 触发文件输入
const triggerFileInput = () => {
  fileInput.value?.click();
};

// 从返回值中提取环境is_env为true的环境列表
const isEnvList = (response: Environment[]) => {
  return response.filter(env => env.is_env);
};

// 从API获取环境列表
const fetchEnvironments = async () => {
  loadingEnvs.value = true;
  try {
    const response = await axios.get<Environment[]>('/api/environment');
    console.log("response.data:",response.data)
    environments.value = isEnvList(response.data);
  } catch (error) {
    ElMessage.error('获取环境列表失败');
  } finally {
    loadingEnvs.value = false;
  }
};

// 选择环境 - 从存储中获取配置并传递给编辑器
const selectEnvironment = async (envId: string) => {
  if (!envId) return;
  
  // 如果有未保存的更改，提示用户
  if (hasChanges.value && selectedEnvironment.value && selectedEnvironment.value !== envId) {
    const confirmed = await ElMessageBox.confirm(
      '当前配置有未保存的更改，确定要切换环境吗？',
      '确认切换',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).catch(() => false);
    
    if (!confirmed) {
      // 恢复原选择
      return;
    }
  }
  
  selectedEnvironment.value = envId;
  loadingEnv.value = envId;
  
  try {
    // 查找当前环境
    const env = environments.value.find(e => e.id?.toString() === envId);
    if (!env) {
      ElMessage.error('环境不存在');
      return;
    }
    
    currentEnvironment.value = env;
    
    // 从component_values中解析YAML配置
    let originalYaml = `# ${env.name}原始配置`;
    let modifiedYaml = `# ${env.name}修改后配置`;
    
    if (env.component_values) {
      try {
        // 解析component_values字段的JSON内容
        const componentValues = JSON.parse(env.component_values);
        // 假设JSON中包含original和modified字段，存储YAML字符串
        originalYaml = componentValues.original || originalYaml;
        modifiedYaml = componentValues.modified || modifiedYaml;
      } catch (jsonError) {
        console.warn('解析component_values失败，使用默认配置:', jsonError);
      }
    }
    
    // 将配置传递给YamlCompare组件展示
    yamlCompareRef.value?.loadCustomYaml(originalYaml, modifiedYaml);
    hasChanges.value = false;
    
    ElMessage.info(`已加载${env.name}的配置`);
  } catch (error) {
    ElMessage.error('加载配置失败');
  } finally {
    loadingEnv.value = '';
  }
};

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (!file || !selectedEnvironment.value) return;
  
  // 验证文件类型
  const isYaml = file.name.endsWith('.yaml') || file.name.endsWith('.yml');
  if (!isYaml) {
    ElMessage.error('只能上传YAML文件!');
    input.value = '';
    return;
  }
  
  // 读取文件内容
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      // 将上传的内容作为修改后的配置
      if (yamlCompareRef.value) {
        const currentContent = yamlCompareRef.value.getCurrentYamlContent();
        yamlCompareRef.value.loadCustomYaml(currentContent.original, content);
        hasChanges.value = true;
      }
      ElMessage.success('配置导入成功');
    } catch (error) {
      ElMessage.error('文件读取失败');
    }
    input.value = '';
  };
  reader.readAsText(file);
};

// 取消配置
const cancelConfig = () => {
  if (!selectedEnvironment.value) return;
  
  // 重新加载当前环境的配置
  selectEnvironment(selectedEnvironment.value);
  ElMessage.info('已取消操作');
};

// 保存配置 - 从编辑器获取新值并保存到存储
const saveConfig = async () => {
  if (!selectedEnvironment.value || !yamlCompareRef.value || !currentEnvironment.value) {
    ElMessage.warning('请先选择环境');
    return;
  }
  
  isSubmitting.value = true;
  try {
    // 从YamlCompare组件获取当前编辑的内容
    const currentContent = yamlCompareRef.value.getCurrentYamlContent();
    
    // 构建要保存的component_values JSON对象
    const componentValues = {
      original: currentContent.original,
      modified: currentContent.modified,
      lastUpdated: new Date().toLocaleString()
    };
    
    // 更新当前环境对象
    const updatedEnvironment: Environment = {
      ...currentEnvironment.value,
      component_values: JSON.stringify(componentValues) // 转换为JSON字符串
    };
    
    // 模拟API请求保存配置
    // 实际项目中应该调用后端API保存配置
    // await axios.put(`/api/environment/${selectedEnvironment.value}`, updatedEnvironment);
    
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 更新本地环境列表中的配置
    const envIndex = environments.value.findIndex(e => e.id?.toString() === selectedEnvironment.value);
    if (envIndex !== -1) {
      environments.value[envIndex] = updatedEnvironment;
    }
    currentEnvironment.value = updatedEnvironment;
    
    console.log('保存配置:', {
      environment: selectedEnvironment.value,
      config: componentValues
    });
    
    hasChanges.value = false;
    ElMessage.success('配置保存成功');
  } catch (error) {
    ElMessage.error('保存配置失败');
    console.error('保存配置错误:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// 下载配置
const downloadConfig = () => {
  if (!selectedEnvironment.value || !yamlCompareRef.value) return;
  
  const currentContent = yamlCompareRef.value.getCurrentYamlContent();
  const env = environments.value.find(e => e.id?.toString() === selectedEnvironment.value);
  const envLabel = env?.name || '配置';
  
  // 创建合并后的配置内容
  const mergedContent = `# ${envLabel}配置比较\n\n# 原始配置\n${currentContent.original}\n\n---\n\n# 修改后配置\n${currentContent.modified}`;
  
  // 创建下载链接
  const blob = new Blob([mergedContent], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${envLabel}_config_${Date.now()}.yaml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  ElMessage.success('配置下载成功');
};

// 监听编辑器内容变化（实际项目中可以通过事件或回调实现更实时的检测）
let contentCheckTimer: number | null = null;
const startContentChecking = () => {
  // 每3秒检查一次内容是否有变化
  contentCheckTimer = window.setInterval(() => {
    if (selectedEnvironment.value && yamlCompareRef.value && currentEnvironment.value) {
      const currentContent = yamlCompareRef.value.getCurrentYamlContent();
      
      try {
        // 比较当前内容与存储内容
        let originalContent = '';
        let modifiedContent = '';
        
        if (currentEnvironment.value.component_values) {
          const componentValues = JSON.parse(currentEnvironment.value.component_values);
          originalContent = componentValues.original || '';
          modifiedContent = componentValues.modified || '';
        }
        
        hasChanges.value = currentContent.original !== originalContent || 
                          currentContent.modified !== modifiedContent;
      } catch (error) {
        console.warn('检查内容变化失败:', error);
      }
    }
  }, 3000);
};

// 组件挂载时初始化
onMounted(async () => {
  // 获取环境列表
  await fetchEnvironments();
  
  // 默认选择第一个环境
  if (environments.value.length > 0 && !selectedEnvironment.value) {
    selectEnvironment(environments.value[0].id?.toString() || '');
  }
  
  // 开始监控内容变化
  startContentChecking();
});

// 组件卸载时清理
onBeforeUnmount(() => {
  if (contentCheckTimer) {
    clearInterval(contentCheckTimer);
  }
});
</script>

<style scoped>
/* 主容器布局 */
.build-manage {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 主要布局容器 */
.compare-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧环境选择区域 - 保留必要样式 */
.environment-selector {
  width: 150px;
  border-right: 1px solid #e4e7ed;
  padding: 15px;
  background-color: #fff;
}

.environment-label {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 14px;
}

.environment-list {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.env-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #e4e7ed;
  font-size: 14px;
  position: relative;
}

.env-item:hover {
  background-color: #f5f7fa;
}

.env-item.active {
  background-color: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}

.env-item.loading {
  opacity: 0.6;
  cursor: not-allowed;
}

.env-item:last-child {
  border-bottom: none;
}

/* 右侧配置对比区域 - 简化样式 */
.config-editor-wrapper {
  flex: 1;
  position: relative;
  padding: 10px;
  background-color: #fff;
}

/* 按钮组定位 - 保留必要的定位样式 */
.top-right-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  gap: 8px;
}

.bottom-right-actions {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  gap: 10px;
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>