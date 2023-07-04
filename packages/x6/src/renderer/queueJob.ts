export class JobQueue {
  private isFlushing = false
  private isFlushPending = false
  private scheduleId = 0
  // 队列
  private queue: Job[] = []
  // 框架间隔时间
  private frameInterval = 33
  // 初始时刻
  private initialTime = Date.now()

  /**
   * 任务队列逻辑：
   * 判断任务的优先级，优先级高的，任务立刻执行
   * 优先级不高的，任务提前到队列开头，优先执行
   * 先进先出，后进后出
   * @param job
   */
  queueJob(job: Job) {
    if (job.priority & JOB_PRIORITY.PRIOR) {
      job.cb()
    } else {
      const index = this.findInsertionIndex(job)
      if (index >= 0) {
        this.queue.splice(index, 0, job)
      }
    }
  }

  /**
   * 异步执行任务
   * 进行任务调度，在浏览器空闲的时候调用函数
   */
  queueFlush() {
    if (!this.isFlushing && !this.isFlushPending) {
      this.isFlushPending = true
      this.scheduleJob()
    }
  }

  /**
   * 同步执行任务
   */
  queueFlushSync() {
    if (!this.isFlushing && !this.isFlushPending) {
      this.isFlushPending = true
      this.flushJobsSync()
    }
  }

  /**
   * 清除任务
   */
  clearJobs() {
    this.queue.length = 0
    this.isFlushing = false
    this.isFlushPending = false
    this.cancelScheduleJob()
  }

  /**
   * 执行任务
   */
  flushJobs() {
    this.isFlushPending = false
    this.isFlushing = true

    const startTime = this.getCurrentTime()

    let job
    while ((job = this.queue.shift())) {
      job.cb()
      if (this.getCurrentTime() - startTime >= this.frameInterval) {
        break
      }
    }

    this.isFlushing = false

    if (this.queue.length) {
      this.queueFlush()
    }
  }

  /**
   * 同步执行任务
   * 执行队列中的第一个任务
   */
  flushJobsSync() {
    this.isFlushPending = false
    this.isFlushing = true

    let job
    while ((job = this.queue.shift())) {
      try {
        job.cb()
      } catch (error) {
        // eslint-disable-next-line
        console.log(error)
      }
    }

    this.isFlushing = false
  }

  /**
   * 二分查找
   * 通过二分查找的方式来找到任务插入的位置，从而保证任务的优先级顺序。
   * @param job
   * @returns
   */
  private findInsertionIndex(job: Job) {
    let left = 0
    let ins = this.queue.length
    let right = ins - 1
    const priority = job.priority
    while (left <= right) {
      const mid = ((right - left) >> 1) + left
      if (priority <= this.queue[mid].priority) {
        left = mid + 1
      } else {
        ins = mid
        right = mid - 1
      }
    }
    return ins
  }

  /**
   * 任务调度
   * window.requestIdleCallback() 方法插入一个函数，这个函数将在浏览器空闲时期被调用。
   * 空闲时间，执行任务，在主事件循环上执行后台和低优先级工作，而不影响延迟关键事件，如动画和输入响应。
   * 函数一般会按照先进先调用的顺序执行，然后100ms内没有执行函数，会在超时前执行一次。
   */
  private scheduleJob() {
    if ('requestIdleCallback' in window) {
      if (this.scheduleId) {
        this.cancelScheduleJob()
      }
      this.scheduleId = window.requestIdleCallback(this.flushJobs.bind(this), {
        timeout: 100,
      })
    } else {
      if (this.scheduleId) {
        this.cancelScheduleJob()
      }
      this.scheduleId = (window as Window).setTimeout(this.flushJobs.bind(this))
    }
  }

  /**
   * 结束回调
   */
  private cancelScheduleJob() {
    if ('cancelIdleCallback' in window) {
      if (this.scheduleId) {
        window.cancelIdleCallback(this.scheduleId)
      }
      this.scheduleId = 0
    } else {
      if (this.scheduleId) {
        clearTimeout(this.scheduleId)
      }
      this.scheduleId = 0
    }
  }

  /**
   * 获取当前时间
   * @returns
   */
  private getCurrentTime() {
    const hasPerformanceNow =
      typeof performance === 'object' && typeof performance.now === 'function'
    if (hasPerformanceNow) {
      return performance.now()
    }
    return Date.now() - this.initialTime
  }
}

export interface Job {
  id: string
  priority: JOB_PRIORITY
  cb: () => void
}

export enum JOB_PRIORITY {
  // 渲染边
  RenderEdge = /**/ 1 << 1,
  // 渲染节点
  RenderNode = /**/ 1 << 2,
  // 更新
  Update = /*    */ 1 << 3,
  // 更重要的
  PRIOR = /*     */ 1 << 20,
}

// function findInsertionIndex(job: Job) {
//   let start = 0
//   for (let i = 0, len = queue.length; i < len; i += 1) {
//     const j = queue[i]
//     if (j.id === job.id) {
//       console.log('xx', j.bit, job.bit)
//     }
//     if (j.id === job.id && (job.bit ^ (job.bit & j.bit)) === 0) {
//       return -1
//     }
//     if (j.priority <= job.priority) {
//       start += 1
//     }
//   }
//   return start
// }
