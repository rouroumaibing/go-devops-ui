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
  parameters?: string;
  pipeline_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PipelineStageGroupJobs {
  id?: string;
  name: string;
  pipeline_id: string;
  parallel: boolean;
  stage_group_id: string;
  stage_job_ids: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  pipeline_stage_jobs?: PipelineStageJobs[];
}

export interface PipelineStageJobs {
  id?: string;
  name: string;
  pipeline_id: string;
  stage_group_job_id: string;
  parameters?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}