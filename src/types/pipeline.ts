export interface Pipeline {
  id?: string;
  name: string;
  component_id: string;
  service_tree: string;
  created_at?: string;
  updated_at?: string;
  pipeline_stages: Pipeline_stages[];
}

export interface Pipeline_stages {
  id?: string;
  group_id?: string;
  group_name: string;
  group_order?: number;
  stage_type?: string;
  stage_name?: string;
  stage_order?: number;
  pipeline_id?: string;
  created_at?: string;
  updated_at?: string;
  pipeline_jobs?: Pipeline_job;
}

export interface Pipeline_job{
  id?: string;
  pipeline_id?: string;
  stage_id?: string;
  parameters?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;  
}