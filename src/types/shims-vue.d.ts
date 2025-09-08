declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare interface ImportMeta {
  env: {
    [key: string]: string | boolean | undefined;
    VITE_BACKEND_API_URL?: string;
    VITE_WECHAT_APPID?: string;
    VITE_WECHAT_REDIRECTURI?: string;
  };
}