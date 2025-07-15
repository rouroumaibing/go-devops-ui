<template>
  <div class="create-pipeline-container">
      <el-form ref="pipelineForm" :model="formData" :rules="formRules" label-width="120px">
        <el-form-item label="流水线名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入流水线名称" maxLength="50"></el-input>
        </el-form-item>

        <el-form-item label="流水线描述">
          <el-input type="textarea" v-model="formData.description" placeholder="请输入流水线描述" :rows="3"></el-input>
        </el-form-item>

        <el-form-item label="流水线类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择流水线类型">
            <el-option label="构建流水线" value="build"></el-option>
            <el-option label="部署流水线" value="deploy"></el-option>
            <el-option label="综合流水线" value="combined"></el-option>
          </el-select>

        </el-form-item>
          <el-button :icon="CirclePlus" circle />
          <template v-for="action in PIPELINE_ACTIONS" :key="action.name">
            <el-button size="large" round text bg>{{ action.name }}
            <el-icon><EditPen /></el-icon>
            <el-icon><Operation /></el-icon>
            </el-button>
            <el-button :icon="CirclePlus" circle />
          </template>
        </el-form>

      <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { FormInstance, FormRules, ElMessage } from 'element-plus';
import { CirclePlus, EditPen, Operation } from '@element-plus/icons-vue';

const PIPELINE_ACTIONS = [
  { name: '构建' },
  { name: '测试' },
  { name: '部署' }
];

// 表单引用
const pipelineForm = ref<FormInstance>();

// 表单数据
const formData = reactive<{
  name: string;
  description: string;
  type: string;
}>({
  name: '',
  description: '',
  type: ''
});

const formRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入流水线名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度应在2-50个字符之间', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择流水线类型', trigger: 'change' }
  ]
});


// 提交表单
const handleSubmit = async () => {
  if (!pipelineForm.value) return;

  try {
    const valid = await pipelineForm.value.validate();
    if (valid) {
      // 这里添加表单提交逻辑
      console.log('流水线数据:', formData);
      // 提交成功后可以重定向或显示成功消息
      ElMessage.success('流水线创建成功');
    }
  } catch (error) {
    console.log('表单验证失败:', error);
  }
};

// 取消操作
const handleCancel = () => {
  // 这里添加取消逻辑，如返回上一页
  window.history.back();
};


</script>

<style scoped>
.create-pipeline-container {
  padding: 20px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}
</style>
