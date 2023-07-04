## virtual-render.ts 可视区域渲染管理器
目录：packages/x6/src/graph/virtual-render.ts
init():初始化做了2件事：
1. 重新渲染区域
2. 监听事件
初始化的时候，使用lodash的throttle创建一个节流函数，节流开始前调用一次this.resetRenderArea方法，200ms后才能再次调用。
将渲染区域事件挂在画布的translate、scale、resize事件上。
dispose()：画布销毁的时候就触发停止监听事件的操作
最重要的是resetRenderArea():重新渲染区域，如果开启了可视区域渲染，那么只渲染可视区域部分。
其中做了2件事：
1. 获取当前可视区域（容器的区域）
2. 渲染可视区域
调用graph的getGraphArea()，往下走就是transform的getGraphArea()，其中往下调用getComputedSize()获取容器的宽和高，再用Rectangle类通过宽高实例化出一个矩形。接着用graphToLocal()使用矩阵代表graph的变换点。然后拿到变换的矩阵，调用schedule调度类的setRenderArea，往下的flushWaittingViews()调用requestViewUpdate()请求视图更新，合并更新请求，刷新图。