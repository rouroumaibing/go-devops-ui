declare module '@element-plus/icons-vue' {
  import type { Component } from 'vue'
  const component: Component
  export default component
  export const HomeFilled: Component
  export const UserFilled: Component
  export const Menu: Component
  export const Setting: Component
  export const Document: Component
  export const HardDrive: Component
  export const ArrowUp: Component
  export const Check: Component
  export const Plus: Component
  export const Edit: Component
  export const Search: Component
  export const ArrowLeft: Component

}

declare module '@element-plus/icons-vue/*' {
  import type { Component } from 'vue'
  const component: Component
  export default component
}