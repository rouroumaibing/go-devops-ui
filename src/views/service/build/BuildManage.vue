<template>
  <div class="build-manage">
    <h1>构建管理</h1>
    <el-form>
      <el-form-item label="构建平台">
        <el-input v-model="buildPlatform"></el-input>
      </el-form-item>
      <el-form-item label="构建流水线地址">
        <el-input v-model="pipelineUrl"></el-input>
      </el-form-item>
      <el-form-item label="构建命令">
        <el-input v-model="buildCommand"></el-input>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const buildPlatform = ref('Jenkins')
const pipelineUrl = ref('http://jenkins.example.com/job/devops')
const buildCommand = ref('npm run build')
</script>