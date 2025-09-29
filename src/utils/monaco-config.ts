import * as monaco from 'monaco-editor';

// 配置Monaco编辑器环境
export const configureMonacoEnvironment = () => {
  try {
    // 注册YAML语言
    monaco.languages.register({
      id: 'yaml',
      extensions: ['.yaml', '.yml'],
      aliases: ['YAML', 'yaml'],
      mimetypes: ['application/x-yaml', 'text/yaml']
    });

    // 设置YAML语法高亮
    monaco.languages.setMonarchTokensProvider('yaml', {
      tokenizer: {
        root: [
          // 注释
          [/#.*$/, 'comment'],
          // 字符串
          [/'[^']*'/, 'string'],
          [/"[^"\\]*(\\.[^"\\]*)*"/, 'string'],
          // 数字
          [/[0-9.]+/, 'number'],
          // 键值对中的键
          [/[a-zA-Z0-9_\-]+(?=\s*:)/, 'key'],
          // 布尔值
          [/\b(true|false|yes|no)\b/i, 'boolean'],
          // null
          [/\bnull\b/, 'null']
        ]
      }
    });

    // 配置编辑器默认主题和选项
    monaco.editor.defineTheme('vs-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'key', foreground: '00adef' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'boolean', foreground: '569cd6' },
        { token: 'comment', foreground: '6a9955' }
      ],
      colors: {}
    });

    // 设置编辑器全局选项
    monaco.editor.setTheme('vs-dark');
  
  } catch (error) {
    console.error('配置Monaco编辑器失败:', error);
  }
};

export { monaco };