// 定义流水线类型选项
export const StageType = [ 
  { name: 'build', value: '构建' , job:[
    {name: "build_job", value: "构建任务"},
    {name: "static_check", value: "静态检查"}]}, 
  { name: 'checkpoint', value: '人工卡点', job:[
    {name: "checkpoint", value: "人工卡点"}] }, 
  { name: 'deploy', value: '部署', job:[
    {name: "deploy_env", value: "部署环境"}] }, 
  { name: 'test', value: '测试', job:[
    {name: "test_job", value: "测试任务"}] }
];