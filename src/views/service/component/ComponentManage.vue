<template>
  <div class="component-detail-container">
    <el-card class="component-card">
      <div class="detail-header">
        <h2>{{ componentDetail.name }} 详情</h2>
        <div class="header-actions">
          <el-button type="primary" @click="handleEditClick">
            <el-icon><Edit /></el-icon> 编辑组件
          </el-button>
        </div>
      </div>
      <el-row :gutter="20">
        <!-- 基本信息卡片 -->
        <el-col :span="12">
          <el-card class="info-card">
            <template #header><h3>基本信息</h3></template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="组件名称">{{ componentDetail.name }}</el-descriptions-item>
              <el-descriptions-item label="所属服务">{{ componentDetail.service_tree?.replace(/\./g, '/') }}</el-descriptions-item>
              <el-descriptions-item label="组件ID">{{ componentDetail.id }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ componentDetail.created_at }}</el-descriptions-item>
              <el-descriptions-item label="最后更新">{{ componentDetail.updated_at }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="info-card">
            <template #header><h3>代码库信息</h3></template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="代码库地址">
                <el-link :href="componentDetail.repo_url" target="_blank">{{ componentDetail.repo_url }}</el-link>
              </el-descriptions-item>
              <el-descriptions-item label="分支">{{ componentDetail.repo_branch }}</el-descriptions-item>
              <el-descriptions-item label="负责人">{{ componentDetail.owner }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="desc-card" style="margin-top: 20px;">
        <template #header><h3>组件描述</h3></template>
        <div class="component-description">
          {{ componentDetail.description || '暂无描述信息' }}
        </div>
      </el-card>
      
    <el-dialog v-model="editDialogVisible" title="编辑组件" width="50%">
      <el-form ref="editFormRef" :model="editForm" label-width="120px" :rules="editFormRules">
        <el-form-item label="代码库地址" prop="repo_url">
          <el-input v-model="editForm.repo_url"></el-input>
        </el-form-item>
        <el-form-item label="代码库分支" prop="repo_branch">
          <el-input v-model="editForm.repo_branch"></el-input>
        </el-form-item>
        <el-form-item label="责任人" prop="owner">
          <el-input v-model="editForm.owner" ></el-input>
        </el-form-item>
        <el-form-item label="组件描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditForm(componentDetail.id)">确定</el-button>
        </span>
      </template>
    </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import axios from '@/utils/axios'
import { useRoute } from 'vue-router';
import { ref, onMounted, toRefs, reactive} from 'vue';
import { Edit } from '@element-plus/icons-vue';
import { ElMessage, ElForm} from 'element-plus';

interface componentData {
  id: string;
  name: string;
  service_tree: string;
  owner: string;
  description?: string;
  repo_url: string;
  repo_branch: string;
  created_at?: string;
  updated_at?: string;
}

const route = useRoute();

const state = reactive({
  componentDetail: {} as componentData
})

const { componentDetail } = toRefs(state)

// 编辑对话框状态
const editDialogVisible = ref(false);
// 编辑表单数据
const editForm = ref<Partial<componentData>>({});
// 编辑表单验证规则
const editFormRules = ref({
  repo_url: [{ required: true, message: '请输入代码库地址', trigger: 'blur' }],
  repo_branch: [{ required: true, message: '请输入代码库分支', trigger: 'blur' }],
  owner: [{ required: true, message: '请输入责任人', trigger: 'blur' }],
  description: [{ required: true, message: '请输入组件描述', trigger: 'blur' }],
});
// 编辑表单引用
const editFormRef = ref<InstanceType<typeof ElForm>>();

// 编辑按钮点击事件
const handleEditClick = () => {
  // 打开编辑对话框
  editDialogVisible.value = true;
  editForm.value = {
    repo_url: componentDetail.value.repo_url || '',
    repo_branch: componentDetail.value.repo_branch || '',
    owner: componentDetail.value.owner || '',
    description: componentDetail.value.description || ''
  };
};

// 提交编辑表单
const submitEditForm = async (id: string) => {
  if (!editFormRef.value) return;
  try {
    await editFormRef.value.validate();
    // 调用更新接口
    console.log("asdasdasd:", id)
    console.log("asdasdasd:", editForm.value)

    await putComponentData(id, editForm.value as componentData);
    // 关闭对话框
    editDialogVisible.value = true;
    ElMessage.success('组件更新成功');
  } catch (error) {
    ElMessage.error('表单验证失败，请检查输入');
  }
};
// 定义接收的组件ID参数
const props = defineProps<{
  componentId?: string;
}>();

onMounted(() => {
  const queryComponentId = Array.isArray(route.query.componentId) ? route.query.componentId[0] : route.query.componentId;
  const componentId = props.componentId || queryComponentId;
  if (componentId) {
    fetchComponentData(componentId);
  } else {
    ElMessage.error('组件ID参数不存在或格式错误');
  }

});

// 加载组件数据的函数
const fetchComponentData = async (id: string) => {
  try {
    const response =  await axios.get(`/api/component/${id}`);
    componentDetail.value = response.data;
  } catch (error) {
    ElMessage.error('加载组件详情失败');
  }
};

const putComponentData = async (id: string, data: componentData) => {
  try {
    const response =  await axios.put(`/api/component/${id}`, data);
    componentDetail.value = response.data;
  } catch (error) {
    ElMessage.error('更新组件详情失败');
  }
  return componentDetail.value
}

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