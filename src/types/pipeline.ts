export interface Pipeline {
  id?: string;
  name: string;
  pipeline_group?: string;
  component_id: string;
  service_tree: string;
  created_at?: string;
  updated_at?: string;
  pipeline_stages: Pipeline_stages[];
}

export interface Pipeline_stages {
  id?: string;
  stage_group_id?: string;
  stage_group_name: string;
  stage_group_order: number;
  stage_type?: string;
  stage_name?: string;
  parallel: boolean;
  stage_order: number;
  job_type?: string;
  pipeline_id?: string;
  created_at?: string;
  updated_at?: string;
  pipeline_job: Pipeline_job;
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

