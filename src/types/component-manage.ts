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