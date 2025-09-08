export interface Environment {
  id?: number;
  name: string;
  is_prod: boolean;
  is_env: boolean;
  env_group: string;
  component_id: string;
  description?: string;
  images_addr?: string;
  images_user?: string;
  images_pwd?: string;
  kubernetes_addr?: string;
  kubeconfig?: string;
  kube_namespace?: string;
  component_values?: string;
  created_at?: string;
  updated_at?: string;
}