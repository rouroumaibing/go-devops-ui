export interface Environment {
  id?: number;
  name: string;
  is_env: boolean;
  env_group: string;
  service_addr?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}