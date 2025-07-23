
<template>
    <div class="pipeline-container">
        <div class="stage-box">
          <div class="sopt-group">
                <div class="start-text">开始</div>
                <div class="start-sopt"></div>
          </div>
              <div class="start-line"></div>
            <!-- 使用v-for循环生成多个middle-container -->
            <div v-for="(pipeline, pipelineIndex) in pipelines" :key="pipelineIndex" class="middle-container">
                <div class="vertical-sopt-container">
                    <div class="middle-sopt-group">
                        <div class="middle-text">{{ pipeline.name }}</div>
                        <div class="middle-sopt"></div>
                    </div>
                    <!-- 使用v-for循环生成多个middle-node-sopt-group -->
                    <div v-for="(node, nodeIndex) in pipeline.nodes" :key="nodeIndex" class="middle-node-sopt-group">
                        <div class="middle-node-line"></div>
                        <div class="middle-node-sopt"></div>
                        <div class="middle-node-text">{{ node.name }}</div>
                    </div>
                </div>
                <div class="middle-line"></div>
            </div>
            <div class="sopt-group">
                <div class="end-text">完成</div>    
                <div class="end-sopt"></div>  
            </div>
        </div>
    </div>
</template>

<script>
export default {
  data() {
    return {
      // 定义流水线数据，可根据需要添加更多流水线和节点
      pipelines: [
        {
          name: '构建',
          nodes: [
            { id: '000-0000-0000', name: '构建1',command: 'go build', status: "success" },
            { id: '000-0000-0001', name: '构建2', command: 'go build', status: "success" },
            { id: '000-0000-0002', name: '归档', command: 'go archive', status: "success" }
          ]
        },{
          name: '卡点',
          nodes: [
            { id: '000-0000-0003', name: '责任人： xxx', command: 'go test', status: "processing" },
          ]
        }, {
          name: '部署',
          nodes: [
            { id: '000-0000-0004', name: 'alpha环境', command: 'go deploy', status: "failed" },
            { id: '000-0000-0005', name: 'beta环境', command: 'go deploy', status: "pending" },
            { id: '000-0000-0006', name: 'gamma环境', command: 'go deploy', status: "pending" }
          ]
        },
         {
           name: '测试',
           nodes: [
             { id: '000-0000-0007', name: '自动测试用例', command: 'go test', status: "pending" }
           ]
         }
      ]
    };
  }
};
</script>

<style scoped>
.pipeline-container {
  height: 100%;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.stage-box {
  display: flex;
  align-items: flex-start;
  min-height: 60px;
  width: 100%;
  position: relative;
}

.middle-container {
  display: flex;
  align-items: flex-start;
  flex: 1;
  position: relative;
}

.vertical-sopt-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  margin-top: 0px;
  height: 100%;
}

.stage-box .start-sopt {
  display: flex;
  align-items: flex-start;
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #4CAF50;
  position: relative;
}

.stage-box .start-line {
  height: 2px;
  background-color: #4CAF50;
  margin: 0 10px;
  flex-grow: 1;
}

.stage-box .start-text {
  position: absolute;
  top: -25px;
  left: 0;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 12px;
}

.stage-box .end-sopt {
  display: flex;
  align-items: flex-start;
  display: inline-block;
  width: 10px;
  height: 10px;
  right: 0;
  border-radius: 50%;
  background-color: #4CAF50;
  position: relative;
}

.stage-box .end-line {
  height: 2px;
  background-color: #4CAF50;
  margin: 0 8px;
  flex-grow: 1;
}

.stage-box .end-text {
  position: absolute;
  top: -25px;
  right: 0;
  transform: translateX(50%);
  white-space: nowrap;
  font-size: 12px;
}

.sopt-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.middle-sopt-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.middle-sopt {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #4CAF50;
}

.middle-line {
  height: 2px;
  background-color: #4CAF50;
  margin: 0 8px;
  flex-grow: 1;
}

.middle-text {
  position: absolute;
  top: -25px;
  margin-bottom: 6px;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 12px;
}

.middle-node-sopt-group {
  position: relative;
  display: flex;
  align-items: flex-end;
  margin-top: 8px;
  width: 5px;
}

.middle-node-line {
  position: absolute;
  left: -75%;
  top: -10px;
  bottom: 0;
  width: 15px;
  border-left: 2px solid #4CAF50;
  border-bottom: 2px solid #4CAF50;
  border-bottom-left-radius: 5px;
  transform: translateX(5px);
}

.middle-node-sopt {
  position: absolute;
  display: inline-block;
  top: 24px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #4CAF50;
  margin-left: 15px;
}

.middle-node-text {
  display: inline-block;
  margin-top: 10px;
  margin-left: 25px;
  white-space: nowrap;
  font-size: 12px;
}
</style>