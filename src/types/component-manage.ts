export interface Component {
  id?: number;
  name: string;
  service_tree: string;
  owner?: string;
  description?: string;
  repo_url?: string;
  repo_branch?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ComponentParameter {
  id?: number;
  component_id: string;
  environment_id: string;
  param_yaml: string;
  created_at?: string;
  updated_at?: string;
}