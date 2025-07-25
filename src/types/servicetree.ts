export interface ServiceTree {
  id: string
  name: string
  full_path: string
  node_type: 'category' | 'subcategory' | 'service' 
  service_id?: string
  parent_id?: string
  level: number
  description?: string
  children?: ServiceTree[]
}

export interface Component {
  id?: string;
  name: string;
  service_tree: string;
  owner: string;
  description?: string;
  repo_url: string;
  repo_branch: string;
  created_at?: string;
  updated_at?: string;
}