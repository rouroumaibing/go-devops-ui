
<template>
    <div class="pipeline-container">
        <div class="stage-box">
            <div class="start-sopt">
                <div class="start-line"></div>
                <div class="start-text">开始</div>
            </div>
            <div class="middle-sopt">
                <div class="middle-line"></div>
                <div class="middle-text">构建</div>
            </div>
            <div class="middle-sopt">
                <div class="middle-line"></div>
                <div class="middle-text">测试</div>
            </div>
            <div class="end-sopt">
                <div class="end-line"></div>
                <div class="end-text">结束</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pipeline-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100px;
}

.stage-box {
    position: relative;
    display: flex;
    align-items: center;
    height: 60px;
}

.stage-box .start-sopt {
    width: 16px;
    height: 16px;
    background-color: #00b42a;
    border-radius: 50%;
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
}

.stage-box .start-line {
    width: 120px;
    height: 2px;
    background-color: #00b42a;
    margin-left: 8px;
}

.stage-box .start-text {
    margin-left: 16px;
    font-size: 14px;
    color: #333;
    white-space: nowrap;
}

.stage-box .middle-sopt {
    width: 16px;
    height: 16px;
    background-color: #00b42a;
    border-radius: 50%;
    position: relative;
    z-index: 2;
    margin-left: 120px; 
    display: flex;
    align-items: center;
}

.stage-box .middle-line {
    width: 120px;
    height: 2px;
    background-color: #00b42a;
    margin-left: 8px;
}

.stage-box .middle-text {
    margin-left: 16px;
    font-size: 14px;
    color: #333;
    white-space: nowrap;
}

.stage-box .end-sopt {
    width: 16px;
    height: 16px;
    background-color: #00b42a;
    border-radius: 50%;
    position: relative;
    z-index: 2;
    margin-left: 120px;
}

.stage-box .end-line {
    width: 0;
}

.stage-box .end-text {
    margin-left: 16px;
    font-size: 14px;
    color: #333;
    white-space: nowrap;
}
</style>