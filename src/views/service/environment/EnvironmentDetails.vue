<template>
  <div v-if="environment" class="environment-detail">
    <div class="detail-header">
      <h2>{{ environment.name }} 详情</h2>
      <div>
        <el-button type="primary" icon="Edit" @click="handleEditEnvironment">编辑</el-button>
        <el-button type="danger" icon="Delete" @click="handleDeleteEnvironment">删除</el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header><h3>基本信息</h3></template>
          <el-descriptions :column="1">
            <el-descriptions-item label="环境id">{{ environment.id }}</el-descriptions-item>
            <el-descriptions-item label="环境名称">{{ environment.name }}</el-descriptions-item>
            <el-descriptions-item label="生产环境">
              <el-switch 
                v-model="environment.is_prod" 
                inline-prompt 
                active-text="是" 
                inactive-text="否" 
                disabled
              />
            </el-descriptions-item>
            <el-descriptions-item label="描述">{{ environment.description }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ environment.updated_at }}</el-descriptions-item>
            <el-descriptions-item label="所属分组">{{ parentGroup?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ environment.created_at }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>

  <div v-else class="empty-detail">
    <el-empty description="请选择一个环境查看详情"></el-empty>
  </div>

  <!-- 编辑环境对话框 -->
  <el-drawer 
    v-model="environmentManagementDialogVisible"
    direction="rtl"
    title="编辑环境"
    size="50%"
  >
    <el-form 
      ref="editEnvironmentFormRef"
      :model="editEnvironmentForm"
      :rules="editEnvironmentRules"
      class="environment-form"
    >
      <!-- 基础配置容器 -->
      <div class="config-section">
        <h3 class="section-title">基础配置：</h3>
        <div class="section-content">
          <el-form-item label="环境名称 ：" prop="name" label-width="200px" style="margin-bottom: 15px;">
            <el-input v-model="editEnvironmentForm.name" placeholder="请输入环境名称"></el-input>
          </el-form-item>
          
          <el-form-item label="是否为生产环境：" prop="is_prod" label-width="200px" style="margin-bottom: 15px;">
            <el-switch
              v-model="editEnvironmentForm.is_prod"
              class="mt-2"
              style="margin-left: 24px"
              inline-prompt
              :active-icon="Check"
              :inactive-icon="Close"
            />
          </el-form-item>
          
          <el-form-item label="描述" label-width="200px" style="margin-bottom: 15px;">
            <el-input 
              v-model="editEnvironmentForm.description" 
              type="textarea" 
              :rows="3"
              placeholder="请输入描述"
            ></el-input>
          </el-form-item>
        </div>
      </div>
      
      
      <!-- 容器镜像对接配置 -->
      <div class="config-section">
        <h3 class="section-title">容器镜像对接配置：</h3>
        <div class="section-content">
          <el-form-item label="镜像仓库地址：" label-width="200px" style="margin-bottom: 15px;">
            <el-input v-model="editEnvironmentForm.images_addr" placeholder="请输入镜像仓库地址"></el-input>
          </el-form-item>
          
          <el-form-item label="镜像用户名：" label-width="200px" style="margin-bottom: 15px;">
            <el-input v-model="editEnvironmentForm.images_user" placeholder="请输入镜像用户名"></el-input>
          </el-form-item>
          
          <el-form-item label="镜像密码：" label-width="200px" style="margin-bottom: 15px;">
            <el-input 
              v-model="editEnvironmentForm.images_pwd" 
              type="password" 
              placeholder="请输入镜像密码"
            ></el-input>
          </el-form-item>
        </div>
      </div>
      
      
      <!-- Kubernetes集群对接配置 -->
      <div class="config-section">
        <h3 class="section-title">Kubernetes集群对接配置：</h3>
        <div class="section-content">
          <el-form-item label="集群地址：" label-width="200px" style="margin-bottom: 15px;">
            <el-input v-model="editEnvironmentForm.kubernetes_addr" placeholder="请输入Kubernetes集群地址"></el-input>
          </el-form-item>
          <el-form-item label="命名空间：" label-width="200px" style="margin-bottom: 15px;">
            <el-input v-model="editEnvironmentForm.kube_namespace" placeholder="请输入Kubernetes命名空间"></el-input>
          </el-form-item>
          <el-form-item label="Kubeconfig：" label-width="200px" style="margin-bottom: 15px;">
            <el-upload
              ref="kubeconfigUploadRef"
              class="upload-kubeconfig"
              action="#"
              :auto-upload="false"
              :show-file-list="true"
              :before-upload="handleKubeconfigUpload"
              :on-change="handleKubeconfigChange"
              :on-remove="handleKubeconfigRemove"
              accept=".yaml,.json"
            >
              <el-button type="primary">选择文件</el-button>
              <template #tip>
                <div class="el-upload__tip">
                  支持 .yaml, .json 格式文件，最大 10MB
                </div>
              </template>
            </el-upload>
          </el-form-item>
        
        </div>
      </div>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="environmentManagementDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEnvironmentEdit">保存</el-button>
      </span>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref, defineProps, defineEmits } from 'vue';
import { ElMessage, ElMessageBox, ElInput, ElButton, ElForm, ElFormItem, ElSwitch, ElUpload } from 'element-plus';
import { Check, Close } from '@element-plus/icons-vue';
import type { FormInstance, FormItemRule, UploadFile, UploadProps } from 'element-plus';
import { Environment } from '@/types/environment-manage';
import type { TreeNodeData } from 'element-plus';

// 定义组件的属性
const props = defineProps({
  environment: {
    type: Object as () => Environment | null,
    default: null
  },
  parentGroup: {
    type: Object as () => TreeNodeData | null,
    default: null
  },
  componentId: {
    type: String,
    required: true
  }
});

// 定义组件的事件
const emit = defineEmits(['refresh-data', 'environment-updated']);

// 表单相关引用
const editEnvironmentFormRef = ref<FormInstance | null>(null);
const editEnvironmentForm = ref<Partial<Environment>>({
  name: '',
  is_prod: false,
  is_env: false,
  description: '',
  images_addr: '',
  images_user: '',
  images_pwd: '',
  kubernetes_addr: '',
  kube_namespace: ''
});
const kubeconfigUploadRef = ref<InstanceType<typeof ElUpload> | null>(null);
const environmentManagementDialogVisible = ref(false);

// 表单验证规则
const editEnvironmentRules: Record<string, FormItemRule[]> = {
  name: [
    { required: true, message: '请输入环境名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '长度不超过 500 个字符', trigger: 'blur' }
  ]
};

// 处理Kubeconfig文件上传前的校验
const handleKubeconfigUpload = (file: File) => {
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!');
    return false;
  }
  return true;
};

// 处理Kubeconfig文件变化
const handleKubeconfigChange = (uploadFile: UploadFile, uploadFiles: UploadFile[]) => {
  if (uploadFile.status === 'ready') {
    const file = uploadFile.raw;
    if (file) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        editEnvironmentForm.value.kubeconfig = content;
      };
      
      reader.onerror = () => {
        ElMessage.error('读取文件失败，请重试');
        if (kubeconfigUploadRef.value) {
          kubeconfigUploadRef.value.clearFiles();
        }
      };
      
      // 读取文件内容，使用UTF-8编码确保跨平台兼容性
      reader.readAsText(file, 'utf-8');
    }
  }
};

// 处理Kubeconfig文件删除
const handleKubeconfigRemove = () => {
  editEnvironmentForm.value.kubeconfig = '';
};

// 编辑环境
const handleEditEnvironment = () => {
  if (props.environment) {
    ElMessage.info(`编辑环境: ${props.environment.name}`);
    // 打开当前环境编辑表单
    editEnvironmentForm.value = {
          name: props.environment.name,
          is_prod: props.environment.is_prod || false,
          env_group: props.environment.env_group,
          description: props.environment.description || '',
          images_addr: props.environment.images_addr,
          images_user: props.environment.images_user,
          images_pwd: props.environment.images_pwd,
          kubernetes_addr: props.environment.kubernetes_addr,
          kubeconfig: props.environment.kubeconfig,
          kube_namespace: props.environment.kube_namespace
        };
    
    environmentManagementDialogVisible.value = true;
  }
};

// 保存环境编辑
const saveEnvironmentEdit = async () => {
  if (!editEnvironmentForm.value.id) return;

  if (editEnvironmentFormRef.value) {
    try {
      await editEnvironmentFormRef.value.validate();
    } catch (error) {
      console.error('表单验证失败:', error);
      return;
    }
  }

  try {
    await axios.put(`/api/environment/${editEnvironmentForm.value.id}`, editEnvironmentForm.value);
    
    // 触发刷新数据事件
    emit('refresh-data');
    emit('environment-updated', editEnvironmentForm.value);
    
    environmentManagementDialogVisible.value = false;
    ElMessage.success('环境更新成功');
  } catch (error) {
    ElMessage.error('更新失败，请重试');
  }
};

// 删除环境
const handleDeleteEnvironment = () => {
  if (props.environment && props.parentGroup) {
    ElMessageBox.confirm('确定要删除该环境吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      // 发送删除请求
      if (props.environment) {
        axios.delete(`/api/environment/${props.environment.id}`).then(() => {
          // 触发刷新数据事件
          emit('refresh-data');
          emit('environment-updated', null);
          
          ElMessage.success('环境删除成功');
        }).catch(error => {
          console.error('删除失败:', error);
          ElMessage.error('删除失败，请重试');
        });
      }
    });
  }
};


</script>

<style scoped lang="scss">
.environment-detail {
  height: 100%;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.empty-detail {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 添加环境编辑表单的样式 */
.environment-form {
  padding: 20px;
}

.config-section {
  margin-bottom: 30px;
  border-radius: 4px;
  overflow: hidden;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 20px 0;
  padding-bottom: 5px;
  color: #303133;
}

.section-content {
  margin-left: 20px;
}
</style>