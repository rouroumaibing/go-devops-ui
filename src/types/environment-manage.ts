export interface Environment {
  id?: number;
  name: string;
  is_env: boolean;
  env_group: string;
  component_id: string;
  service_addr?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}