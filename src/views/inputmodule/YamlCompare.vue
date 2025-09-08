<template>
  <div class="yaml-compare-container">
    <div class="compare-header">
      <el-card class="compare-title-card" shadow="never">
        <div class="title-bar">
          <h2 class="compare-title">YAML编辑</h2>
          <el-switch 
            v-model="isEditMode" 
            @change="switchMode" 
            active-text="编辑模式" 
            inactive-text="对比模式"
          />
        </div>
      </el-card>
    </div>
    
    <div class="editor-wrapper">
      <div class="editor-container">
        <div class="editor-header">
          <span class="editor-title">原始配置</span>
        </div>
        <div id="original-editor" ref="originalEditorRef"></div>
      </div>
      <div class="editor-separator"></div>
      <div class="editor-container">
        <div class="editor-header">
          <span class="editor-title">修改后配置</span>
        </div>
        <div id="modified-editor" ref="modifiedEditorRef"></div>
      </div>
    </div>
    
    <div class="compare-controls">
      <el-button v-if="isEditMode" type="success" @click="saveChanges">保存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, defineExpose } from 'vue';
import { configureMonacoEnvironment, monaco } from '../../utils/monaco-config';
import { ElMessage } from 'element-plus';

// 配置 Monaco 环境
configureMonacoEnvironment();

// 编辑器引用和实例
const originalEditorRef = ref<HTMLDivElement | null>(null);
const modifiedEditorRef = ref<HTMLDivElement | null>(null);
let originalEditor: monaco.editor.IStandaloneCodeEditor | null = null;
let modifiedEditor: monaco.editor.IStandaloneCodeEditor | null = null;

// 状态变量
const isEditMode = ref(false);
// 修复：使用装饰器集合替代装饰器ID数组
let originalDecorationsCollection: monaco.editor.IEditorDecorationsCollection | null = null;
let modifiedDecorationsCollection: monaco.editor.IEditorDecorationsCollection | null = null;

// 编辑器配置
const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  language: 'yaml',
  automaticLayout: true,
  minimap: { enabled: true },
  fontSize: 14,
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  theme: 'vs-dark'
};

// 比较两个字符串并应用差异高亮
const applyDiffHighlighting = () => {
  if (!originalEditor || !modifiedEditor || !originalDecorationsCollection || !modifiedDecorationsCollection) return;
  
  const originalContent = originalEditor.getValue();
  const modifiedContent = modifiedEditor.getValue();
  
  const originalLines = originalContent.split('\n');
  const modifiedLines = modifiedContent.split('\n');
  const maxLength = Math.max(originalLines.length, modifiedLines.length);
  
  // 应用新的装饰器
  const originalDiffs: monaco.editor.IModelDeltaDecoration[] = [];
  const modifiedDiffs: monaco.editor.IModelDeltaDecoration[] = [];
  
  for (let i = 0; i < maxLength; i++) {
    const originalLine = originalLines[i] || '';
    const modifiedLine = modifiedLines[i] || '';
    
    if (originalLine !== modifiedLine) {
      if (originalLine) {
        originalDiffs.push({
          range: new monaco.Range(i + 1, 1, i + 1, originalLine.length + 1),
          options: { isWholeLine: true, className: 'diff-deleted' }
        });
      }
      if (modifiedLine) {
        modifiedDiffs.push({
          range: new monaco.Range(i + 1, 1, i + 1, modifiedLine.length + 1),
          options: { isWholeLine: true, className: 'diff-added' }
        });
      }
    }
  }
  
  // 修复：使用装饰器集合的set方法替代deltaDecorations
  originalDecorationsCollection.set(originalDiffs);
  modifiedDecorationsCollection.set(modifiedDiffs);
};

// 初始化编辑器
const initEditors = () => {
  // 创建原始编辑器
  if (originalEditorRef.value) {
    originalEditor = monaco.editor.create(originalEditorRef.value, {
      ...editorOptions,
      value: '', // 初始为空，等待父组件传递数据
      readOnly: !isEditMode.value
    });
    // 修复：创建装饰器集合
    originalDecorationsCollection = originalEditor.createDecorationsCollection();
  }
  
  // 创建修改后编辑器
  if (modifiedEditorRef.value) {
    modifiedEditor = monaco.editor.create(modifiedEditorRef.value, {
      ...editorOptions,
      value: '', // 初始为空，等待父组件传递数据
      readOnly: !isEditMode.value
    });
    // 修复：创建装饰器集合
    modifiedDecorationsCollection = modifiedEditor.createDecorationsCollection();
  }
  
  // 添加内容变化监听器
  originalEditor?.onDidChangeModelContent(() => !isEditMode.value && applyDiffHighlighting());
  modifiedEditor?.onDidChangeModelContent(() => !isEditMode.value && applyDiffHighlighting());
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    originalEditor?.layout();
    modifiedEditor?.layout();
  });
};

// 模式切换
const switchMode = () => {
  if (originalEditor) originalEditor.updateOptions({ readOnly: !isEditMode.value });
  if (modifiedEditor) modifiedEditor.updateOptions({ readOnly: !isEditMode.value });
  
  if (isEditMode.value) {
    // 编辑模式 - 移除高亮
    originalDecorationsCollection?.clear();
    modifiedDecorationsCollection?.clear();
  } else {
    // 对比模式 - 应用高亮
    applyDiffHighlighting();
  }
  
  ElMessage.info(isEditMode.value ? '已切换到编辑模式' : '已切换到对比模式');
};

// 保存更改 - 仅在编辑器内部切换模式和提示
const saveChanges = () => {
  if (!originalEditor || !modifiedEditor) return;
  
  // 切换到对比模式以显示更改
  isEditMode.value = false;
  switchMode();
  
  ElMessage.success('更改已保存');
};

// 外部方法 - 接收从父组件传递的配置数据
const loadCustomYaml = (originalYaml: string, modifiedYaml: string) => {
  originalEditor?.setValue(originalYaml);
  modifiedEditor?.setValue(modifiedYaml);
  
  setTimeout(() => !isEditMode.value && applyDiffHighlighting(), 100);
};

// 外部方法 - 将当前编辑的内容返回给父组件
const getCurrentYamlContent = () => ({
  original: originalEditor?.getValue() || '',
  modified: modifiedEditor?.getValue() || ''
});

// 暴露方法给父组件
defineExpose({
  loadCustomYaml,
  getCurrentYamlContent,
  switchMode,
  saveChanges
});

// 组件生命周期
onMounted(initEditors);

onBeforeUnmount(() => {
  window.removeEventListener('resize', () => {});
  originalEditor?.dispose();
  modifiedEditor?.dispose();
});
</script>

<style scoped>
.yaml-compare-container {
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  overflow: hidden;
}

.compare-header {
  padding: 16px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.compare-title {
  margin: 0;
  font-size: 18px;
  color: #303133;
  font-weight: 500;
}

.editor-wrapper {
  flex: 1;
  display: flex;
  padding: 16px;
  gap: 8px;
  overflow: hidden;
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

.editor-header {
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

#original-editor, #modified-editor {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.editor-separator {
  width: 8px;
  background-color: #f5f7fa;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-separator::before {
  content: '';
  width: 1px;
  height: 20%;
  background-color: #dcdfe6;
}

.compare-controls {
  padding: 16px;
  background-color: #fff;
  border-top: 1px solid #e4e7ed;
  display: flex;
  gap: 12px;
}

/* 差异高亮样式 */
:deep(.diff-deleted) {
  background-color: rgba(255, 0, 0, 0.2) !important;
  border-left: 3px solid #ff0000;
}

:deep(.diff-added) {
  background-color: rgba(0, 255, 0, 0.2) !important;
  border-left: 3px solid #00ff00;
}

/* Monaco编辑器高度控制 */
:deep(.monaco-editor) { height: 100% !important; }
:deep(.monaco-editor-background) { height: 100% !important; }
:deep(.overflow-guard) { height: 100% !important; }
:deep(.margin) { height: 100% !important; }
:deep(.monaco-editor-content) { height: 100% !important; }
</style>