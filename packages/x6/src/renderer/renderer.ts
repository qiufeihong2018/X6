/* eslint-disable @typescript-eslint/no-unused-vars */
import { Point, Rectangle } from '@antv/x6-geometry'
import { Base } from '../graph/base'
import { Cell } from '../model'
import { Scheduler } from './scheduler'
import { CellView, EdgeView } from '../view'
import { Util } from '../util'

export class Renderer extends Base {
  private readonly schedule: Scheduler = new Scheduler(this.graph)

  /**
   * 请求视图更新
   * @param view
   * @param flag
   * @param options
   */
  requestViewUpdate(view: CellView, flag: number, options: any = {}) {
    this.schedule.requestViewUpdate(view, flag, options)
  }

  /**
   * 视图是否在挂载中
   * @param view
   * @returns
   */
  isViewMounted(view: CellView) {
    return this.schedule.isViewMounted(view)
  }

  /**
   * 设置渲染区域
   * @param area
   */
  setRenderArea(area?: Rectangle) {
    this.schedule.setRenderArea(area)
  }

  /**
   * 通过元素找到视图
   * @param elem
   * @returns
   */
  findViewByElem(elem: string | Element | undefined | null) {
    if (elem == null) {
      return null
    }
    const container = this.options.container
    const target =
      typeof elem === 'string'
        ? container.querySelector(elem)
        : elem instanceof Element
        ? elem
        : elem[0]

    if (target) {
      const id = this.graph.view.findAttr('data-cell-id', target)
      if (id) {
        const views = this.schedule.views
        if (views[id]) {
          return views[id].view
        }
      }
    }

    return null
  }

  /**
   * 通过节点找到视图
   * @param cellId
   */
  findViewByCell(cellId: string | number): CellView | null
  findViewByCell(cell: Cell | null): CellView | null
  findViewByCell(
    cell: Cell | string | number | null | undefined,
  ): CellView | null {
    if (cell == null) {
      return null
    }
    const id = Cell.isCell(cell) ? cell.id : cell
    const views = this.schedule.views
    if (views[id]) {
      return views[id].view
    }

    return null
  }

  /**
   * 从点找到视图
   * @param p
   * @returns
   */
  findViewsFromPoint(p: Point.PointLike) {
    const ref = { x: p.x, y: p.y }
    return this.model
      .getCells()
      .map((cell) => this.findViewByCell(cell))
      .filter((view) => {
        if (view != null) {
          return Util.getBBox(view.container as SVGElement, {
            target: this.view.stage,
          }).containsPoint(ref)
        }
        return false
      }) as CellView[]
  }

  /**
   * 从点找到边的视图
   * @param p
   * @param threshold
   * @returns
   */
  findEdgeViewsFromPoint(p: Point.PointLike, threshold = 5) {
    return this.model
      .getEdges()
      .map((edge) => this.findViewByCell(edge))
      .filter((view: EdgeView) => {
        if (view != null) {
          const point = view.getClosestPoint(p)
          if (point) {
            return point.distance(p) <= threshold
          }
        }
        return false
      }) as EdgeView[]
  }

  /**
   * 找到在区域内的视图
   * @param rect
   * @param options
   * @returns
   */
  findViewsInArea(
    rect: Rectangle.RectangleLike,
    options: { strict?: boolean; nodeOnly?: boolean } = {},
  ) {
    const area = Rectangle.create(rect)
    return this.model
      .getCells()
      .map((cell) => this.findViewByCell(cell))
      .filter((view) => {
        if (view) {
          if (options.nodeOnly && !view.isNodeView()) {
            return false
          }

          const bbox = Util.getBBox(view.container as SVGElement, {
            target: this.view.stage,
          })
          if (bbox.width === 0) {
            bbox.inflate(1, 0)
          } else if (bbox.height === 0) {
            bbox.inflate(0, 1)
          }
          return options.strict
            ? area.containsRect(bbox)
            : area.isIntersectWithRect(bbox)
        }
        return false
      }) as CellView[]
  }

  @Base.dispose()
  dispose() {
    this.schedule.dispose()
  }
}

export namespace Renderer {
  export interface FindViewsInAreaOptions {
    strict?: boolean
  }
}
