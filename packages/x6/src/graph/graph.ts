import { Basecoat, NumberExt, Dom, KeyValue } from '@antv/x6-common'
import { Point, Rectangle } from '@antv/x6-geometry'
import { Model, Collection, Cell, Node, Edge } from '../model'
import { CellView } from '../view'
import * as Registry from '../registry'
import { GraphView } from './view'
import { EventArgs } from './events'
import { CSSManager as Css } from './css'
import { Options as GraphOptions } from './options'
import { GridManager as Grid } from './grid'
import { TransformManager as Transform } from './transform'
import { BackgroundManager as Background } from './background'
import { PanningManager as Panning } from './panning'
import { MouseWheel as Wheel } from './mousewheel'
import { VirtualRenderManager as VirtualRender } from './virtual-render'
import { Renderer as ViewRenderer } from '../renderer'
import { DefsManager as Defs } from './defs'
import { CoordManager as Coord } from './coord'
import { HighlightManager as Highlight } from './highlight'
import { SizeManager as Size } from './size'

export class Graph extends Basecoat<EventArgs> {
  /**
   * installedPlugins属性是一个已安装的插件集合。
   */
  private installedPlugins: Set<Graph.Plugin> = new Set()
  /**
   * 表示图形对象的数据模型。
   */
  public model: Model

  /**
   * 表示图形对象的选项。
   */
  public readonly options: GraphOptions.Definition
  /**
   * css、view、grid、defs、coord、renderer等属性分别表示图形对象的样式、视图、网格、定义、坐标系、渲染器等管理器。
   */
  public readonly css: Css
  public readonly view: GraphView
  public readonly grid: Grid
  public readonly defs: Defs
  public readonly coord: Coord
  public readonly renderer: ViewRenderer
  public readonly highlight: Highlight
  public readonly transform: Transform
  public readonly background: Background
  public readonly panning: Panning
  public readonly mousewheel: Wheel
  public readonly virtualRender: VirtualRender
  public readonly size: Size

  public get container() {
    return this.options.container
  }

  /**
   * 返回图形对象的标签。
   */
  protected get [Symbol.toStringTag]() {
    return Graph.toStringTag
  }

  /**
   * constructor构造函数接受一个options参数，用于初始化图形对象及其相关的管理器。
   * @param options
   */
  constructor(options: Partial<GraphOptions.Manual>) {
    super()
    this.options = GraphOptions.get(options)
    this.css = new Css(this)
    this.view = new GraphView(this)
    this.defs = new Defs(this)
    this.coord = new Coord(this)
    this.transform = new Transform(this)
    this.highlight = new Highlight(this)
    this.grid = new Grid(this)
    this.background = new Background(this)

    if (this.options.model) {
      this.model = this.options.model
    } else {
      this.model = new Model()
      this.model.graph = this
    }

    this.renderer = new ViewRenderer(this)
    this.panning = new Panning(this)
    this.mousewheel = new Wheel(this)
    this.virtualRender = new VirtualRender(this)
    this.size = new Size(this)
  }

  // #region model

  /**
   * isNode方法判断一个单元是否为节点。
   * @param cell
   * @returns
   */
  isNode(cell: Cell): cell is Node {
    return cell.isNode()
  }
  /**
   * isNode方法判断一个单元是否为边
   * @param cell
   * @returns
   */
  isEdge(cell: Cell): cell is Edge {
    return cell.isEdge()
  }
  /**
   * resetCells方法重置图形对象的所有单元。
   * @param cells
   * @param options
   * @returns
   */
  resetCells(cells: Cell[], options: Collection.SetOptions = {}) {
    this.model.resetCells(cells, options)
    return this
  }

  /**
   * clearCells方法清空图形对象的所有单元。
   * @param options
   * @returns
   */
  clearCells(options: Cell.SetOptions = {}) {
    this.model.clear(options)
    return this
  }

  /**
   * toJSON方法将图形对象的数据模型转换为JSON格式。

   * @param options 
   * @returns 
   */
  toJSON(options: Model.ToJSONOptions = {}) {
    return this.model.toJSON(options)
  }

  /**
   * parseJSON方法解析JSON数据并更新图形对象的数据模型。
   * @param data
   * @returns
   */
  parseJSON(data: Model.FromJSONData) {
    return this.model.parseJSON(data)
  }

  /**
   * fromJSON方法从JSON数据中创建图形对象。
   * @param data
   * @param options
   * @returns
   */
  fromJSON(data: Model.FromJSONData, options: Model.FromJSONOptions = {}) {
    this.model.fromJSON(data, options)
    return this
  }

  /**
   * getCellById方法根据ID获取图形对象中的单元。
   * @param id
   * @returns
   */
  getCellById(id: string) {
    return this.model.getCell(id)
  }

  /**
   * 添加一个节点到图形对象中。
   * @param metadata
   * @param options
   */
  addNode(metadata: Node.Metadata, options?: Model.AddOptions): Node
  addNode(node: Node, options?: Model.AddOptions): Node
  addNode(node: Node | Node.Metadata, options: Model.AddOptions = {}): Node {
    return this.model.addNode(node, options)
  }

  /**
   * 添加多条边到图形对象中。
   * @param nodes
   * @param options
   * @returns
   */
  addNodes(nodes: (Node | Node.Metadata)[], options: Model.AddOptions = {}) {
    return this.addCell(
      nodes.map((node) => (Node.isNode(node) ? node : this.createNode(node))),
      options,
    )
  }

  createNode(metadata: Node.Metadata) {
    return this.model.createNode(metadata)
  }

  removeNode(nodeId: string, options?: Collection.RemoveOptions): Node | null
  removeNode(node: Node, options?: Collection.RemoveOptions): Node | null
  removeNode(node: Node | string, options: Collection.RemoveOptions = {}) {
    return this.model.removeCell(node as Node, options) as Node
  }

  addEdge(metadata: Edge.Metadata, options?: Model.AddOptions): Edge
  addEdge(edge: Edge, options?: Model.AddOptions): Edge
  addEdge(edge: Edge | Edge.Metadata, options: Model.AddOptions = {}): Edge {
    return this.model.addEdge(edge, options)
  }

  addEdges(edges: (Edge | Edge.Metadata)[], options: Model.AddOptions = {}) {
    return this.addCell(
      edges.map((edge) => (Edge.isEdge(edge) ? edge : this.createEdge(edge))),
      options,
    )
  }

  /**
   * 移除图形对象中的一条边。
   * @param edgeId
   * @param options
   */
  removeEdge(edgeId: string, options?: Collection.RemoveOptions): Edge | null
  removeEdge(edge: Edge, options?: Collection.RemoveOptions): Edge | null
  removeEdge(edge: Edge | string, options: Collection.RemoveOptions = {}) {
    return this.model.removeCell(edge as Edge, options) as Edge
  }

  createEdge(metadata: Edge.Metadata) {
    return this.model.createEdge(metadata)
  }

  addCell(cell: Cell | Cell[], options: Model.AddOptions = {}) {
    this.model.addCell(cell, options)
    return this
  }

  removeCell(cellId: string, options?: Collection.RemoveOptions): Cell | null
  removeCell(cell: Cell, options?: Collection.RemoveOptions): Cell | null
  removeCell(cell: Cell | string, options: Collection.RemoveOptions = {}) {
    return this.model.removeCell(cell as Cell, options)
  }

  removeCells(cells: (Cell | string)[], options: Cell.RemoveOptions = {}) {
    return this.model.removeCells(cells, options)
  }

  removeConnectedEdges(cell: Cell | string, options: Cell.RemoveOptions = {}) {
    return this.model.removeConnectedEdges(cell, options)
  }

  /**
   * disconnectConnectedEdges方法断开与指定单元相连的边。
   * @param cell
   * @param options
   * @returns
   */
  disconnectConnectedEdges(cell: Cell | string, options: Edge.SetOptions = {}) {
    this.model.disconnectConnectedEdges(cell, options)
    return this
  }

  /**
   * hasCell方法判断图形对象中是否包含指定的单元。
   * @param cellId
   */
  hasCell(cellId: string): boolean
  hasCell(cell: Cell): boolean
  hasCell(cell: string | Cell): boolean {
    return this.model.has(cell as Cell)
  }

  /**
   * getCells方法获取图形对象中的所有单元。
   * @returns
   */
  getCells() {
    return this.model.getCells()
  }

  /**
   * getCellCount方法获取图形对象中的单元数量。
   * @returns
   */
  getCellCount() {
    return this.model.total()
  }

  /**
   * Returns all the nodes in the graph.
   * getNodes()方法返回图形中的所有节点。
   */
  getNodes() {
    return this.model.getNodes()
  }

  /**
   * Returns all the edges in the graph.
   * getEdges()方法返回图形中的所有边。
   */
  getEdges() {
    return this.model.getEdges()
  }

  /**
   * Returns all outgoing edges for the node.
   * getOutgoingEdges(cell: Cell | string)方法返回指定节点的所有出边。
   */
  getOutgoingEdges(cell: Cell | string) {
    return this.model.getOutgoingEdges(cell)
  }

  /**
   * Returns all incoming edges for the node.
   * getIncomingEdges(cell: Cell | string)方法返回指定节点的所有入边。
   */
  getIncomingEdges(cell: Cell | string) {
    return this.model.getIncomingEdges(cell)
  }

  /**
   * Returns edges connected with cell.
   * getConnectedEdges(cell: Cell | string, options: Model.GetConnectedEdgesOptions = {})方法返回与指定节点连接的所有边。参数options是一个可选对象，用于指定获取连接边的选项。
   */
  getConnectedEdges(
    cell: Cell | string,
    options: Model.GetConnectedEdgesOptions = {},
  ) {
    return this.model.getConnectedEdges(cell, options)
  }

  /**
   * Returns an array of all the roots of the graph.
   * getRootNodes()方法返回图形中所有根节点的数组。
   */
  getRootNodes() {
    return this.model.getRoots()
  }

  /**
   * Returns an array of all the leafs of the graph.
   * getLeafNodes()方法返回图形中所有叶节点的数组。
   */
  getLeafNodes() {
    return this.model.getLeafs()
  }

  /**
   * Returns `true` if the node is a root node, i.e.
   * there is no  edges coming to the node.
   * isRootNode(cell: Cell | string)方法判断指定的节点是否为根节点，即该节点没有入边。如果是根节点，则返回true。
   */
  isRootNode(cell: Cell | string) {
    return this.model.isRoot(cell)
  }

  /**
   * Returns `true` if the node is a leaf node, i.e.
   * there is no edges going out from the node.
   * isLeafNode(cell: Cell | string)方法判断指定的节点是否为叶节点，即该节点没有出边。如果是叶节点，则返回true。
   */
  isLeafNode(cell: Cell | string) {
    return this.model.isLeaf(cell)
  }

  /**
   * Returns all the neighbors of node in the graph. Neighbors are all
   * the nodes connected to node via either incoming or outgoing edge.
   * getNeighbors(cell: Cell, options: Model.GetNeighborsOptions = {})方法返回指定节点在图形中的所有邻居节点。邻居节点是通过入边或出边与指定节点相连的节点。
   */
  getNeighbors(cell: Cell, options: Model.GetNeighborsOptions = {}) {
    return this.model.getNeighbors(cell, options)
  }

  /**
   * Returns `true` if `cell2` is a neighbor of `cell1`.
   * isNeighbor(cell1: Cell, cell2: Cell, options: Model.GetNeighborsOptions = {})方法判断cell2是否是cell1的邻居节点。如果是邻居节点，则返回true。
   */
  isNeighbor(
    cell1: Cell,
    cell2: Cell,
    options: Model.GetNeighborsOptions = {},
  ) {
    return this.model.isNeighbor(cell1, cell2, options)
  }

  /**
   * getSuccessors(cell: Cell, options: Model.GetPredecessorsOptions = {})方法返回指定节点在图形中的所有后继节点。后继节点是通过出边与指定节点相连的节点。
   */
  getSuccessors(cell: Cell, options: Model.GetPredecessorsOptions = {}) {
    return this.model.getSuccessors(cell, options)
  }

  /**
   * Returns `true` if `cell2` is a successor of `cell1`.
   * isSuccessor(cell1: Cell, cell2: Cell, options: Model.GetPredecessorsOptions = {})方法判断cell2是否是cell1的后继节点。如果是后继节点，则返回true。
   */
  isSuccessor(
    cell1: Cell,
    cell2: Cell,
    options: Model.GetPredecessorsOptions = {},
  ) {
    return this.model.isSuccessor(cell1, cell2, options)
  }

  /**
   * getPredecessors(cell: Cell, options: Model.GetPredecessorsOptions = {})方法返回指定节点在图形中的所有前驱节点。前驱节点是通过入边与指定节点相连的节点。
   */
  getPredecessors(cell: Cell, options: Model.GetPredecessorsOptions = {}) {
    return this.model.getPredecessors(cell, options)
  }

  /**
   * Returns `true` if `cell2` is a predecessor of `cell1`.
   * isPredecessor(cell1: Cell, cell2: Cell, options: Model.GetPredecessorsOptions = {})方法判断cell2是否是cell1的前驱节点。如果是前驱节点，则返回true。
   */
  isPredecessor(
    cell1: Cell,
    cell2: Cell,
    options: Model.GetPredecessorsOptions = {},
  ) {
    return this.model.isPredecessor(cell1, cell2, options)
  }

  /**
   * getCommonAncestor(...cells: (Cell | null | undefined)[])方法返回指定节点的最近共同祖先节点。
   */
  getCommonAncestor(...cells: (Cell | null | undefined)[]) {
    return this.model.getCommonAncestor(...cells)
  }

  /**
   * Returns an array of cells that result from finding nodes/edges that
   * are connected to any of the cells in the cells array. This function
   * loops over cells and if the current cell is a edge, it collects its
   * source/target nodes; if it is an node, it collects its incoming and
   * outgoing edges if both the edge terminal (source/target) are in the
   * cells array.
   * getSubGraph(cells: Cell[], options: Model.GetSubgraphOptions = {})
   * 方法返回与传入的cells数组中的任何一个节点或边连接的所有节点和边的数组。
   * 该方法遍历cells数组，如果当前元素是边，则收集其源节点和目标节点；如果当前元素是节点，
   * 并且该节点的入边和出边的端点都在cells数组中，则收集该节点的入边和出边。
   */
  getSubGraph(cells: Cell[], options: Model.GetSubgraphOptions = {}) {
    return this.model.getSubGraph(cells, options)
  }

  /**
   * Clones the whole subgraph (including all the connected links whose
   * source/target is in the subgraph). If `options.deep` is `true`, also
   * take into account all the embedded cells of all the subgraph cells.
   *
   * Returns a map of the form: { [original cell ID]: [clone] }.
   *
   * cloneSubGraph(cells: Cell[], options: Model.GetSubgraphOptions = {})
   * 方法克隆整个子图（包括所有连接到子图中的源节点/目标节点的链接）。
   * 如果options.deep为true，还会考虑所有子图节点的嵌套单元格。
   */
  cloneSubGraph(cells: Cell[], options: Model.GetSubgraphOptions = {}) {
    return this.model.cloneSubGraph(cells, options)
  }

  /**
   * cloneCells(cells: Cell[])方法克隆给定的单元格数组，并返回克隆的单元格数组。
   */
  cloneCells(cells: Cell[]) {
    return this.model.cloneCells(cells)
  }

  /**
   * Returns an array of nodes whose bounding box contains point.
   * Note that there can be more then one node as nodes might overlap.
   * 方法返回边界框包含指定点的所有节点的数组。注意可能会有多个节点，因为节点可能重叠。
   */
  getNodesFromPoint(x: number, y: number): Node[]
  getNodesFromPoint(p: Point.PointLike): Node[]
  getNodesFromPoint(x: number | Point.PointLike, y?: number) {
    return this.model.getNodesFromPoint(x as number, y as number)
  }

  /**
   * Returns an array of nodes whose bounding box top/left coordinate
   * falls into the rectangle.
   * 返回边界框的上/左坐标位于指定矩形内的所有节点的数组。
   */
  getNodesInArea(
    x: number,
    y: number,
    w: number,
    h: number,
    options?: Model.GetCellsInAreaOptions,
  ): Node[]
  getNodesInArea(
    rect: Rectangle.RectangleLike,
    options?: Model.GetCellsInAreaOptions,
  ): Node[]
  getNodesInArea(
    x: number | Rectangle.RectangleLike,
    y?: number | Model.GetCellsInAreaOptions,
    w?: number,
    h?: number,
    options?: Model.GetCellsInAreaOptions,
  ): Node[] {
    return this.model.getNodesInArea(
      x as number,
      y as number,
      w as number,
      h as number,
      options,
    )
  }

  /**
   * 返回位于指定节点下方的所有节点的数组。
   * 可以通过options.by属性指定搜索方式，是通过边界框还是关键点进行搜索。
   */
  getNodesUnderNode(
    node: Node,
    options: {
      by?: 'bbox' | Rectangle.KeyPoint
    } = {},
  ) {
    return this.model.getNodesUnderNode(node, options)
  }

  /**
   * 通过迭代器函数在图形中搜索指定单元格的所有匹配节点。
   * 可以通过options参数设置搜索选项。该方法会返回当前类的实例，方便链式调用。
   */
  searchCell(
    cell: Cell,
    iterator: Model.SearchIterator,
    options: Model.SearchOptions = {},
  ) {
    this.model.search(cell, iterator, options)
    return this
  }

  /** *
   * Returns an array of IDs of nodes on the shortest
   * path between source and target.
   * 返回源节点和目标节点之间的最短路径上的所有节点的ID数组。
   */
  getShortestPath(
    source: Cell | string,
    target: Cell | string,
    options: Model.GetShortestPathOptions = {},
  ) {
    return this.model.getShortestPath(source, target, options)
  }

  /**
   * Returns the bounding box that surrounds all cells in the graph.
   * 返回包围图形中所有单元格的边界框。
   */
  getAllCellsBBox() {
    return this.model.getAllCellsBBox()
  }

  /**
   * Returns the bounding box that surrounds all the given cells.
   * 返回包围给定单元格的边界框。
   */
  getCellsBBox(cells: Cell[], options: Cell.GetCellsBBoxOptions = {}) {
    return this.model.getCellsBBox(cells, options)
  }

  /**
   * 开始一个批处理操作，可以指定批处理操作的名称和附加数据。
   */
  startBatch(name: string | Model.BatchName, data: KeyValue = {}) {
    this.model.startBatch(name as Model.BatchName, data)
  }

  /**
   * 结束一个批处理操作，可以指定批处理操作的名称和附加数据。
   */
  stopBatch(name: string | Model.BatchName, data: KeyValue = {}) {
    this.model.stopBatch(name as Model.BatchName, data)
  }

  /**
   * 用于执行一批操作，并在操作开始和结束时自动调用startBatch和stopBatch方法。
   * 可以传入操作执行的函数和附加数据。
   */
  batchUpdate<T>(execute: () => T, data?: KeyValue): T
  batchUpdate<T>(
    name: string | Model.BatchName,
    execute: () => T,
    data?: KeyValue,
  ): T
  batchUpdate<T>(
    arg1: string | Model.BatchName | (() => T),
    arg2?: (() => T) | KeyValue,
    arg3?: KeyValue,
  ): T {
    const name = typeof arg1 === 'string' ? arg1 : 'update'
    const execute = typeof arg1 === 'string' ? (arg2 as () => T) : arg1
    const data = typeof arg2 === 'function' ? arg3 : arg2
    this.startBatch(name, data)
    const result = execute()
    this.stopBatch(name, data)
    return result
  }

  /**
   * 更新给定单元的ID。
   */
  updateCellId(cell: Cell, newId: string) {
    return this.model.updateCellId(cell, newId)
  }

  // #endregion

  // #region view
  /**
   * 根据提供的单元格或元素引用查找对应的视图。
   * 如果提供的是单元格引用，则调用findViewByCell方法；如果提供的是元素引用，
   * 则调用findViewByElem方法。
   */
  findView(ref: Cell | Element) {
    if (Cell.isCell(ref)) {
      return this.findViewByCell(ref)
    }

    return this.findViewByElem(ref)
  }

  /**
   * 根据提供的点或矩形引用查找对应的视图数组。
   * 如果提供的是矩形引用，则调用findViewsInArea方法；
   * 如果提供的是点引用，则调用findViewsFromPoint方法。
   */
  findViews(ref: Point.PointLike | Rectangle.RectangleLike) {
    if (Rectangle.isRectangleLike(ref)) {
      return this.findViewsInArea(ref)
    }

    if (Point.isPointLike(ref)) {
      return this.findViewsFromPoint(ref)
    }

    return []
  }

  /**
   * 根据单元格的ID或单元格对象查找对应的视图。
   * @param cellId
   */
  findViewByCell(cellId: string | number): CellView | null
  findViewByCell(cell: Cell | null): CellView | null
  findViewByCell(
    cell: Cell | string | number | null | undefined,
  ): CellView | null {
    return this.renderer.findViewByCell(cell as Cell)
  }

  /**
   * 根据元素的ID或元素对象查找对应的视图。
   * @param elem
   * @returns
   */
  findViewByElem(elem: string | Element | undefined | null) {
    return this.renderer.findViewByElem(elem)
  }

  /**
   * 根据给定的坐标点或点引用查找包含该点的所有视图。
   * @param x
   * @param y
   */
  findViewsFromPoint(x: number, y: number): CellView[]
  findViewsFromPoint(p: Point.PointLike): CellView[]
  findViewsFromPoint(x: number | Point.PointLike, y?: number) {
    const p = typeof x === 'number' ? { x, y: y as number } : x
    return this.renderer.findViewsFromPoint(p)
  }

  /**
   * 根据给定的矩形范围或矩形引用查找包含在该范围内的所有视图。
   * 这些方法用于在视图中查找元素或区域对应的视图。
   * @param x
   * @param y
   * @param width
   * @param height
   * @param options
   */
  findViewsInArea(
    x: number,
    y: number,
    width: number,
    height: number,
    options?: ViewRenderer.FindViewsInAreaOptions,
  ): CellView[]
  findViewsInArea(
    rect: Rectangle.RectangleLike,
    options?: ViewRenderer.FindViewsInAreaOptions,
  ): CellView[]
  findViewsInArea(
    x: number | Rectangle.RectangleLike,
    y?: number | ViewRenderer.FindViewsInAreaOptions,
    width?: number,
    height?: number,
    options?: ViewRenderer.FindViewsInAreaOptions,
  ) {
    const rect =
      typeof x === 'number'
        ? {
            x,
            y: y as number,
            width: width as number,
            height: height as number,
          }
        : x
    const localOptions =
      typeof x === 'number'
        ? options
        : (y as ViewRenderer.FindViewsInAreaOptions)
    return this.renderer.findViewsInArea(rect, localOptions)
  }

  // #endregion

  // #region transform

  /**
   * Returns the current transformation matrix of the graph.
   * 返回当前图形的变换矩阵。
   */
  matrix(): DOMMatrix
  /**
   * Sets new transformation with the given `matrix`
   * 设置图形的变换矩阵。
   */
  matrix(mat: DOMMatrix | Dom.MatrixLike | null): this
  matrix(mat?: DOMMatrix | Dom.MatrixLike | null) {
    if (typeof mat === 'undefined') {
      return this.transform.getMatrix()
    }
    this.transform.setMatrix(mat)
    return this
  }

  /**
   * 调整图形的大小。如果安装了滚动插件（scroller），则调用插件的resize方法；
   * 否则调用transform的resize方法。
   * @param width
   * @param height
   * @returns
   */
  resize(width?: number, height?: number) {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller) {
      scroller.resize(width, height)
    } else {
      this.transform.resize(width, height)
    }
    return this
  }

  /**
   * 返回当前图形的缩放比例。
   */
  scale(): Dom.Scale
  scale(sx: number, sy?: number, cx?: number, cy?: number): this
  scale(sx?: number, sy: number = sx as number, cx = 0, cy = 0) {
    if (typeof sx === 'undefined') {
      return this.transform.getScale()
    }
    this.transform.scale(sx, sy, cx, cy)
    return this
  }

  /**
   * 返回当前图形的缩放级别。
   */
  zoom(): number
  zoom(factor: number, options?: Transform.ZoomOptions): this
  /**
   * 设置图形的缩放级别。
   * @param factor
   * @param options
   * @returns
   */
  zoom(factor?: number, options?: Transform.ZoomOptions) {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller) {
      if (typeof factor === 'undefined') {
        return scroller.zoom()
      }
      scroller.zoom(factor, options)
    } else {
      if (typeof factor === 'undefined') {
        return this.transform.getZoom()
      }
      this.transform.zoom(factor, options)
    }

    return this
  }

  /**
   * 将图形缩放到指定的缩放级别。
   * 如果安装了滚动插件（scroller），则调用插件的zoom方法并将absolute选项设置为true；
   * 否则调用transform的zoom方法并将absolute选项设置为true。
   * @param factor
   * @param options
   * @returns
   */
  zoomTo(
    factor: number,
    options: Omit<Transform.ZoomOptions, 'absolute'> = {},
  ) {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller) {
      scroller.zoom(factor, { ...options, absolute: true })
    } else {
      this.transform.zoom(factor, { ...options, absolute: true })
    }

    return this
  }

  /**
   * 将图形缩放以适应指定的矩形区域。
   * 如果安装了滚动插件（scroller），则调用插件的zoomToRect方法；
   * 否则调用transform的zoomToRect方法。
   * @param rect
   * @param options
   * @returns
   */
  zoomToRect(
    rect: Rectangle.RectangleLike,
    options: Transform.ScaleContentToFitOptions &
      Transform.ScaleContentToFitOptions = {},
  ) {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller) {
      scroller.zoomToRect(rect, options)
    } else {
      this.transform.zoomToRect(rect, options)
    }

    return this
  }

  /**
   * 将图形缩放以适应内容区域。如果安装了滚动插件（scroller），则调用插件的zoomToFit方法；否则调用transform的zoomToFit方法。
   * @param options
   * @returns
   */
  zoomToFit(
    options: Transform.GetContentAreaOptions &
      Transform.ScaleContentToFitOptions = {},
  ) {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller) {
      scroller.zoomToFit(options)
    } else {
      this.transform.zoomToFit(options)
    }

    return this
  }

  /**
   * 返回当前图形的旋转角度。
   */
  rotate(): Dom.Rotation
  rotate(angle: number, cx?: number, cy?: number): this
  /**
   * 设置图形的旋转角度。
   * @param angle
   * @param cx
   * @param cy
   * @returns
   */
  rotate(angle?: number, cx?: number, cy?: number) {
    if (typeof angle === 'undefined') {
      return this.transform.getRotation()
    }

    this.transform.rotate(angle, cx, cy)
    return this
  }

  /**
   * 返回当前图形的平移距离。
   */
  translate(): Dom.Translation
  translate(tx: number, ty: number): this
  /**
   * 设置图形的平移距离。
   * @param tx
   * @param ty
   * @returns
   */
  translate(tx?: number, ty?: number) {
    if (typeof tx === 'undefined') {
      return this.transform.getTranslation()
    }

    this.transform.translate(tx, ty as number)
    return this
  }

  /**
   * 按给定的增量平移图形。
   * @param dx
   * @param dy
   * @returns
   */
  translateBy(dx: number, dy: number): this {
    const ts = this.translate()
    const tx = ts.tx + dx
    const ty = ts.ty + dy
    return this.translate(tx, ty)
  }

  /**
   * 返回图形的图形区域。
   * @returns
   */
  getGraphArea() {
    return this.transform.getGraphArea()
  }

  /**
   * 返回图形的内容区域。
   * @param options
   * @returns
   */
  getContentArea(options: Transform.GetContentAreaOptions = {}) {
    return this.transform.getContentArea(options)
  }

  /**
   * 返回图形的内容范围的边界框。
   * @param options
   * @returns
   */
  getContentBBox(options: Transform.GetContentAreaOptions = {}) {
    return this.transform.getContentBBox(options)
  }

  /**
   * 将图形调整为适应内容的大小。
   * @param gridWidth
   * @param gridHeight
   * @param padding
   * @param options
   */
  fitToContent(
    gridWidth?: number,
    gridHeight?: number,
    padding?: NumberExt.SideOptions,
    options?: Transform.FitToContentOptions,
  ): Rectangle
  fitToContent(options?: Transform.FitToContentFullOptions): Rectangle
  fitToContent(
    gridWidth?: number | Transform.FitToContentFullOptions,
    gridHeight?: number,
    padding?: NumberExt.SideOptions,
    options?: Transform.FitToContentOptions,
  ) {
    return this.transform.fitToContent(gridWidth, gridHeight, padding, options)
  }

  /**
   * 将图形的内容缩放以适应视图区域。
   * @param options
   * @returns
   */
  scaleContentToFit(options: Transform.ScaleContentToFitOptions = {}) {
    this.transform.scaleContentToFit(options)
    return this
  }

  /**
   * Position the center of graph to the center of the viewport.
   * 将图形的中心位置调整到视图的中心。
   */
  center(options?: Transform.CenterOptions) {
    return this.centerPoint(options)
  }

  /**
   * Position the point (x,y) on the graph (in local coordinates) to the
   * center of the viewport. If only one of the coordinates is specified,
   * only center along the specified dimension and keep the other coordinate
   * unchanged.
   * 将图形上的点（以本地坐标表示）定位到视图区域的中心。如果只指定其中一个坐标，只会在指定的维度上居中，保持另一个坐标不变。
   */
  centerPoint(
    x: number,
    y: null | number,
    options?: Transform.CenterOptions,
  ): this
  centerPoint(
    x: null | number,
    y: number,
    options?: Transform.CenterOptions,
  ): this
  centerPoint(optons?: Transform.CenterOptions): this
  /**
   * 将图形上的点（以本地坐标表示）定位到视图区域的中心。
   * @param x
   * @param y
   * @param options
   * @returns
   */
  centerPoint(
    x?: number | null | Transform.CenterOptions,
    y?: number | null,
    options?: Transform.CenterOptions,
  ) {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller) {
      scroller.centerPoint(x as number, y as number, options)
    } else {
      this.transform.centerPoint(x as number, y as number)
    }

    return this
  }

  /**
   * 将图形的内容区域定位到视图区域的中心。
   * @param options
   * @returns
   */
  centerContent(options?: Transform.PositionContentOptions) {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller) {
      scroller.centerContent(options)
    } else {
      this.transform.centerContent(options)
    }

    return this
  }

  /**
   * 将指定的单元格定位到视图区域的中心。
   * @param cell
   * @param options
   * @returns
   */
  centerCell(cell: Cell, options?: Transform.PositionContentOptions) {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller) {
      scroller.centerCell(cell, options)
    } else {
      this.transform.centerCell(cell)
    }

    return this
  }

  /**
   * 将指定的点定位到视图区域的指定位置。
   * @param point
   * @param x
   * @param y
   * @param options
   * @returns
   */
  positionPoint(
    point: Point.PointLike,
    x: number | string,
    y: number | string,
    options: Transform.CenterOptions = {},
  ) {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller) {
      scroller.positionPoint(point, x, y, options)
    } else {
      this.transform.positionPoint(point, x, y)
    }

    return this
  }

  /**
   * 将指定的矩形区域定位到视图区域的指定位置。
   * @param rect
   * @param direction
   * @param options
   * @returns
   */
  positionRect(
    rect: Rectangle.RectangleLike,
    direction: Transform.Direction,
    options?: Transform.CenterOptions,
  ) {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller) {
      scroller.positionRect(rect, direction, options)
    } else {
      this.transform.positionRect(rect, direction)
    }

    return this
  }

  /**
   * 将指定的单元格定位到视图区域的指定位置。
   * @param cell
   * @param direction
   * @param options
   * @returns
   */
  positionCell(
    cell: Cell,
    direction: Transform.Direction,
    options?: Transform.CenterOptions,
  ) {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller) {
      scroller.positionCell(cell, direction, options)
    } else {
      this.transform.positionCell(cell, direction)
    }

    return this
  }

  /**
   * 将图形的内容区域定位到视图区域的指定位置。
   * @param pos
   * @param options
   * @returns
   */
  positionContent(
    pos: Transform.Direction,
    options?: Transform.PositionContentOptions,
  ) {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller) {
      scroller.positionContent(pos, options)
    } else {
      this.transform.positionContent(pos, options)
    }

    return this
  }

  // #endregion

  // #region coord

  /**
   * 将给定的点或坐标对齐到网格上。
   * @param p
   */
  snapToGrid(p: Point.PointLike): Point
  snapToGrid(x: number, y: number): Point
  snapToGrid(x: number | Point.PointLike, y?: number) {
    return this.coord.snapToGrid(x, y)
  }

  /**
   * 将给定的点、矩形或坐标从页面坐标系转换为本地坐标系。
   * @param rect
   */
  pageToLocal(rect: Rectangle.RectangleLike): Rectangle
  pageToLocal(x: number, y: number, width: number, height: number): Rectangle
  pageToLocal(p: Point.PointLike): Point
  pageToLocal(x: number, y: number): Point
  pageToLocal(
    x: number | Point.PointLike | Rectangle.RectangleLike,
    y?: number,
    width?: number,
    height?: number,
  ) {
    if (Rectangle.isRectangleLike(x)) {
      return this.coord.pageToLocalRect(x)
    }

    if (
      typeof x === 'number' &&
      typeof y === 'number' &&
      typeof width === 'number' &&
      typeof height === 'number'
    ) {
      return this.coord.pageToLocalRect(x, y, width, height)
    }

    return this.coord.pageToLocalPoint(x, y)
  }

  /**
   * 将给定的点、矩形或坐标从本地坐标系转换为页面坐标系。
   * @param rect
   */
  localToPage(rect: Rectangle.RectangleLike): Rectangle
  localToPage(x: number, y: number, width: number, height: number): Rectangle
  localToPage(p: Point.PointLike): Point
  localToPage(x: number, y: number): Point
  localToPage(
    x: number | Point.PointLike | Rectangle.RectangleLike,
    y?: number,
    width?: number,
    height?: number,
  ) {
    if (Rectangle.isRectangleLike(x)) {
      return this.coord.localToPageRect(x)
    }

    if (
      typeof x === 'number' &&
      typeof y === 'number' &&
      typeof width === 'number' &&
      typeof height === 'number'
    ) {
      return this.coord.localToPageRect(x, y, width, height)
    }

    return this.coord.localToPagePoint(x, y)
  }

  /**
   * 将给定的点、矩形或坐标从客户端坐标系转换为本地坐标系。
   * @param rect
   */
  clientToLocal(rect: Rectangle.RectangleLike): Rectangle
  clientToLocal(x: number, y: number, width: number, height: number): Rectangle
  clientToLocal(p: Point.PointLike): Point
  clientToLocal(x: number, y: number): Point
  clientToLocal(
    x: number | Point.PointLike | Rectangle.RectangleLike,
    y?: number,
    width?: number,
    height?: number,
  ) {
    if (Rectangle.isRectangleLike(x)) {
      return this.coord.clientToLocalRect(x)
    }

    if (
      typeof x === 'number' &&
      typeof y === 'number' &&
      typeof width === 'number' &&
      typeof height === 'number'
    ) {
      return this.coord.clientToLocalRect(x, y, width, height)
    }

    return this.coord.clientToLocalPoint(x, y)
  }

  /**
   * 将给定的点、矩形或坐标从本地坐标系转换为客户端坐标系。
   * @param rect
   */
  localToClient(rect: Rectangle.RectangleLike): Rectangle
  localToClient(x: number, y: number, width: number, height: number): Rectangle
  localToClient(p: Point.PointLike): Point
  localToClient(x: number, y: number): Point
  localToClient(
    x: number | Point.PointLike | Rectangle.RectangleLike,
    y?: number,
    width?: number,
    height?: number,
  ) {
    if (Rectangle.isRectangleLike(x)) {
      return this.coord.localToClientRect(x)
    }

    if (
      typeof x === 'number' &&
      typeof y === 'number' &&
      typeof width === 'number' &&
      typeof height === 'number'
    ) {
      return this.coord.localToClientRect(x, y, width, height)
    }

    return this.coord.localToClientPoint(x, y)
  }

  /**
   * Transform the rectangle `rect` defined in the local coordinate system to
   * the graph coordinate system.
   * 将给定的点、矩形或坐标从本地坐标系转换为图形坐标系。
   */
  localToGraph(rect: Rectangle.RectangleLike): Rectangle
  /**
   * Transform the rectangle `x`, `y`, `width`, `height` defined in the local
   * coordinate system to the graph coordinate system.
   */
  localToGraph(x: number, y: number, width: number, height: number): Rectangle
  /**
   * Transform the point `p` defined in the local coordinate system to
   * the graph coordinate system.
   */
  localToGraph(p: Point.PointLike): Point
  /**
   * Transform the point `x`, `y` defined in the local coordinate system to
   * the graph coordinate system.
   */
  localToGraph(x: number, y: number): Point
  localToGraph(
    x: number | Point.PointLike | Rectangle.RectangleLike,
    y?: number,
    width?: number,
    height?: number,
  ) {
    if (Rectangle.isRectangleLike(x)) {
      return this.coord.localToGraphRect(x)
    }

    if (
      typeof x === 'number' &&
      typeof y === 'number' &&
      typeof width === 'number' &&
      typeof height === 'number'
    ) {
      return this.coord.localToGraphRect(x, y, width, height)
    }

    return this.coord.localToGraphPoint(x, y)
  }

  /**
   * 将给定的点、矩形或坐标从图形坐标系转换为本地坐标系。
   * @param rect
   */
  graphToLocal(rect: Rectangle.RectangleLike): Rectangle
  graphToLocal(x: number, y: number, width: number, height: number): Rectangle
  graphToLocal(p: Point.PointLike): Point
  graphToLocal(x: number, y: number): Point
  graphToLocal(
    x: number | Point.PointLike | Rectangle.RectangleLike,
    y?: number,
    width?: number,
    height?: number,
  ) {
    if (Rectangle.isRectangleLike(x)) {
      return this.coord.graphToLocalRect(x)
    }

    if (
      typeof x === 'number' &&
      typeof y === 'number' &&
      typeof width === 'number' &&
      typeof height === 'number'
    ) {
      return this.coord.graphToLocalRect(x, y, width, height)
    }
    return this.coord.graphToLocalPoint(x, y)
  }

  /**
   * 将给定的点、矩形或坐标从客户端坐标系转换为图形坐标系。
   * @param rect
   */
  clientToGraph(rect: Rectangle.RectangleLike): Rectangle
  clientToGraph(x: number, y: number, width: number, height: number): Rectangle
  clientToGraph(p: Point.PointLike): Point
  clientToGraph(x: number, y: number): Point
  clientToGraph(
    x: number | Point.PointLike | Rectangle.RectangleLike,
    y?: number,
    width?: number,
    height?: number,
  ) {
    if (Rectangle.isRectangleLike(x)) {
      return this.coord.clientToGraphRect(x)
    }
    if (
      typeof x === 'number' &&
      typeof y === 'number' &&
      typeof width === 'number' &&
      typeof height === 'number'
    ) {
      return this.coord.clientToGraphRect(x, y, width, height)
    }
    return this.coord.clientToGraphPoint(x, y)
  }

  // #endregion

  // #region defs
  /**
   * 定义过滤，并返回过滤后的对象。
   * @param options
   * @returns
   */
  defineFilter(options: Defs.FilterOptions) {
    return this.defs.filter(options)
  }

  /**
   * 用于定义渐变，并返回渐变对象。
   * @param options
   * @returns
   */
  defineGradient(options: Defs.GradientOptions) {
    return this.defs.gradient(options)
  }

  /**
   * 定义标记，并返回标记对象。
   * @param options
   * @returns
   */
  defineMarker(options: Defs.MarkerOptions) {
    return this.defs.marker(options)
  }

  // #endregion

  // #region grid

  /**
   * 获取当前网格的大小。
   */
  getGridSize() {
    return this.grid.getGridSize()
  }
  /**
   * 设置网格的大小，并返回当前图形对象。
   * @param gridSize
   * @returns
   */
  setGridSize(gridSize: number) {
    this.grid.setGridSize(gridSize)
    return this
  }

  /**
   * 显示网格，并返回当前图形对象。
   * @returns
   */
  showGrid() {
    this.grid.show()
    return this
  }

  /**
   * 隐藏网格，并返回当前图形对象。
   * @returns
   */
  hideGrid() {
    this.grid.hide()
    return this
  }

  /**
   * 清除网格，并返回当前图形对象。
   * @returns
   */
  clearGrid() {
    this.grid.clear()
    return this
  }

  /**
   * 绘制网格，并返回当前图形对象。其中，options参数是一个可选的配置对象，用于设置网格的绘制样式。
   * @param options
   * @returns
   */
  drawGrid(options?: Grid.DrawGridOptions) {
    this.grid.draw(options)
    return this
  }

  // #endregion

  // #region background

  /**
   * 更新背景。
   * @returns
   */
  updateBackground() {
    this.background.update()
    return this
  }

  /**
   * 绘制背景。其中，options参数是一个可选的配置对象，用于设置背景的绘制样式。onGraph参数是一个布尔值，指示是否在图形上绘制背景。如果存在滚动插件并且背景选项为空或者onGraph为假，则会使用滚动插件的drawBackground方法绘制背景，否则使用默认的绘制方法。
   * @param options
   * @param onGraph
   * @returns
   */
  drawBackground(options?: Background.Options, onGraph?: boolean) {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller != null && (this.options.background == null || !onGraph)) {
      scroller.drawBackground(options, onGraph)
    } else {
      this.background.draw(options)
    }
    return this
  }

  /**
   * 清除背景。onGraph参数是一个布尔值，指示是否在图形上清除背景。如果存在滚动插件并且背景选项为空或者onGraph为假，则会使用滚动插件的clearBackground方法清除背景，否则使用默认的清除方法。
   * @param onGraph
   * @returns
   */
  clearBackground(onGraph?: boolean) {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller != null && (this.options.background == null || !onGraph)) {
      scroller.clearBackground(onGraph)
    } else {
      this.background.clear()
    }
    return this
  }

  // #endregion

  // #region virtual-render

  /**
   * 启用虚拟渲染。
   * @returns
   */
  enableVirtualRender() {
    this.virtualRender.enableVirtualRender()
    return this
  }

  /**
   * 禁用虚拟渲染。
   * @returns
   */
  disableVirtualRender() {
    this.virtualRender.disableVirtualRender()
    return this
  }

  // #endregion

  // #region mousewheel

  /**
   * 判断鼠标滚轮是否启用。
   * @returns
   */
  isMouseWheelEnabled() {
    return !this.mousewheel.disabled
  }

  /**
   * 启用鼠标滚轮。
   * @returns
   */
  enableMouseWheel() {
    this.mousewheel.enable()
    return this
  }

  /**
   * 禁用鼠标滚轮。
   * @returns
   */
  disableMouseWheel() {
    this.mousewheel.disable()
    return this
  }

  /**
   * 切换鼠标滚轮的启用状态。如果未提供enabled参数，则根据当前状态进行切换；如果提供了enabled参数，根据参数值来设置鼠标滚轮的启用状态。
   * @param enabled
   * @returns
   */
  toggleMouseWheel(enabled?: boolean) {
    if (enabled == null) {
      if (this.isMouseWheelEnabled()) {
        this.disableMouseWheel()
      } else {
        this.enableMouseWheel()
      }
    } else if (enabled) {
      this.enableMouseWheel()
    } else {
      this.disableMouseWheel()
    }
    return this
  }

  // #endregion

  // #region panning

  /**
   * 判断是否可平移。如果存在滚动插件，则调用滚动插件的isPannable方法；否则，调用默认的pannable属性。
   * @returns
   */
  isPannable() {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller) {
      return scroller.isPannable()
    }
    return this.panning.pannable
  }

  /**
   * 启用平移。如果存在滚动插件，则调用滚动插件的enablePanning方法；否则，调用默认的enablePanning方法。
   * @returns
   */
  enablePanning() {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller) {
      scroller.enablePanning()
    } else {
      this.panning.enablePanning()
    }

    return this
  }

  /**
   * 禁用平移。如果存在滚动插件，则调用滚动插件的disablePanning方法；否则，调用默认的disablePanning方法。
   * @returns
   */
  disablePanning() {
    const scroller = this.getPlugin<any>('scroller')
    if (scroller) {
      scroller.disablePanning()
    } else {
      this.panning.disablePanning()
    }
    return this
  }

  /**
   * 切换平移的启用状态。如果未提供pannable参数，则根据当前状态进行切换；如果提供了pannable参数，根据参数值来设置平移的启用状态。
   * @param pannable
   * @returns
   */
  togglePanning(pannable?: boolean) {
    if (pannable == null) {
      if (this.isPannable()) {
        this.disablePanning()
      } else {
        this.enablePanning()
      }
    } else if (pannable !== this.isPannable()) {
      if (pannable) {
        this.enablePanning()
      } else {
        this.disablePanning()
      }
    }

    return this
  }

  // #endregion

  // #region plugin

  /**
   * 用某个图形插件。如果插件尚未安装，则将其添加到已安装的插件列表中，并调用插件的init方法进行初始化。
   * @param plugin
   * @param options
   * @returns
   */
  use(plugin: Graph.Plugin, ...options: any[]) {
    if (!this.installedPlugins.has(plugin)) {
      this.installedPlugins.add(plugin)
      plugin.init(this, ...options)
    }
    return this
  }

  /**
   * 获取指定名称的图形插件对象。
   * @param pluginName
   * @returns
   */
  getPlugin<T extends Graph.Plugin>(pluginName: string): T | undefined {
    return Array.from(this.installedPlugins).find(
      (plugin) => plugin.name === pluginName,
    ) as T
  }

  /**
   * 获取指定名称数组的图形插件对象数组。
   * @param pluginName
   * @returns
   */
  getPlugins<T extends Graph.Plugin[]>(pluginName: string[]): T | undefined {
    return Array.from(this.installedPlugins).filter((plugin) =>
      pluginName.includes(plugin.name),
    ) as T
  }

  /**
   * 启用指定名称或名称数组的图形插件。
   * @param plugins
   * @returns
   */
  enablePlugins(plugins: string[] | string) {
    let postPlugins = plugins
    if (!Array.isArray(postPlugins)) {
      postPlugins = [postPlugins]
    }
    const aboutToChangePlugins = this.getPlugins(postPlugins)
    aboutToChangePlugins?.forEach((plugin) => {
      plugin?.enable?.()
    })
    return this
  }

  /**
   * 禁用指定名称或名称数组的图形插件。
   * @param plugins
   * @returns
   */
  disablePlugins(plugins: string[] | string) {
    let postPlugins = plugins
    if (!Array.isArray(postPlugins)) {
      postPlugins = [postPlugins]
    }
    const aboutToChangePlugins = this.getPlugins(postPlugins)
    aboutToChangePlugins?.forEach((plugin) => {
      plugin?.disable?.()
    })
    return this
  }

  /**
   * 判断指定名称的图形插件是否启用。
   * @param pluginName
   * @returns
   */
  isPluginEnabled(pluginName: string) {
    const pluginIns = this.getPlugin(pluginName)
    return pluginIns?.isEnabled?.()
  }

  /**
   * 销毁指定名称或名称数组的图形插件。
   * @param plugins
   * @returns
   */
  disposePlugins(plugins: string[] | string) {
    let postPlugins = plugins
    if (!Array.isArray(postPlugins)) {
      postPlugins = [postPlugins]
    }
    const aboutToChangePlugins = this.getPlugins(postPlugins)
    aboutToChangePlugins?.forEach((plugin) => {
      plugin.dispose()
    })
    return this
  }

  // #endregion

  // #region dispose

  /**
   * 定义了一个dispose方法，用于销毁图形对象及其相关的资源
   */
  @Basecoat.dispose()
  dispose() {
    this.clearCells()
    this.off()

    this.css.dispose()
    this.defs.dispose()
    this.grid.dispose()
    this.coord.dispose()
    this.transform.dispose()
    this.highlight.dispose()
    this.background.dispose()
    this.mousewheel.dispose()
    this.panning.dispose()
    this.view.dispose()
    this.renderer.dispose()

    this.installedPlugins.forEach((plugin) => {
      plugin.dispose()
    })
  }

  // #endregion
}

/**
 * 命名空间别名，用于简化使用
 */
export namespace Graph {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  export import View = GraphView
  export import Renderer = ViewRenderer
  export import MouseWheel = Wheel
  export import DefsManager = Defs
  export import GridManager = Grid
  export import CoordManager = Coord
  export import TransformManager = Transform
  export import HighlightManager = Highlight
  export import BackgroundManager = Background
}

/**
 * Graph.Options接口定义了图形库的选项。
 */
export namespace Graph {
  export interface Options extends GraphOptions.Manual {}
}

/**
 * Graph.toStringTag定义了图形库的标签。
 */
export namespace Graph {
  export const toStringTag = `X6.${Graph.name}`

  /**
   * Graph.isGraph函数用于判断一个对象是否为Graph类的实例。
   * @param instance
   * @returns
   */
  export function isGraph(instance: any): instance is Graph {
    if (instance == null) {
      return false
    }

    if (instance instanceof Graph) {
      return true
    }

    const tag = instance[Symbol.toStringTag]

    if (tag == null || tag === toStringTag) {
      return true
    }

    return false
  }
}

/**
 * Graph.render函数用于创建一个Graph实例并渲染到指定的容器。
 */
export namespace Graph {
  export function render(
    options: Partial<Options>,
    data?: Model.FromJSONData,
  ): Graph
  export function render(
    container: HTMLElement,
    data?: Model.FromJSONData,
  ): Graph
  export function render(
    options: Partial<Options> | HTMLElement,
    data?: Model.FromJSONData,
  ): Graph {
    const graph =
      options instanceof HTMLElement
        ? new Graph({ container: options })
        : new Graph(options)

    if (data != null) {
      graph.fromJSON(data)
    }

    return graph
  }
}

/**
 * Graph.registerNode、Graph.registerEdge等函数用于注册节点、边、视图和其他自定义组件。
 */
export namespace Graph {
  export const registerNode = Node.registry.register
  export const registerEdge = Edge.registry.register
  export const registerView = CellView.registry.register
  export const registerAttr = Registry.Attr.registry.register
  export const registerGrid = Registry.Grid.registry.register
  export const registerFilter = Registry.Filter.registry.register
  export const registerNodeTool = Registry.NodeTool.registry.register
  export const registerEdgeTool = Registry.EdgeTool.registry.register
  export const registerBackground = Registry.Background.registry.register
  export const registerHighlighter = Registry.Highlighter.registry.register
  export const registerPortLayout = Registry.PortLayout.registry.register
  export const registerPortLabelLayout =
    Registry.PortLabelLayout.registry.register
  export const registerMarker = Registry.Marker.registry.register
  export const registerRouter = Registry.Router.registry.register
  export const registerConnector = Registry.Connector.registry.register
  export const registerAnchor = Registry.NodeAnchor.registry.register
  export const registerEdgeAnchor = Registry.EdgeAnchor.registry.register
  export const registerConnectionPoint =
    Registry.ConnectionPoint.registry.register
}

/**
 * Graph.unregisterNode、Graph.unregisterEdge等函数用于注销已注册的组件。
 */
export namespace Graph {
  export const unregisterNode = Node.registry.unregister
  export const unregisterEdge = Edge.registry.unregister
  export const unregisterView = CellView.registry.unregister
  export const unregisterAttr = Registry.Attr.registry.unregister
  export const unregisterGrid = Registry.Grid.registry.unregister
  export const unregisterFilter = Registry.Filter.registry.unregister
  export const unregisterNodeTool = Registry.NodeTool.registry.unregister
  export const unregisterEdgeTool = Registry.EdgeTool.registry.unregister
  export const unregisterBackground = Registry.Background.registry.unregister
  export const unregisterHighlighter = Registry.Highlighter.registry.unregister
  export const unregisterPortLayout = Registry.PortLayout.registry.unregister
  export const unregisterPortLabelLayout =
    Registry.PortLabelLayout.registry.unregister
  export const unregisterMarker = Registry.Marker.registry.unregister
  export const unregisterRouter = Registry.Router.registry.unregister
  export const unregisterConnector = Registry.Connector.registry.unregister
  export const unregisterAnchor = Registry.NodeAnchor.registry.unregister
  export const unregisterEdgeAnchor = Registry.EdgeAnchor.registry.unregister
  export const unregisterConnectionPoint =
    Registry.ConnectionPoint.registry.unregister
}

/**
 * Graph.Plugin类型定义了图形插件的接口，包含了名称、初始化、销毁和启用/禁用的方法。
 */
export namespace Graph {
  export type Plugin = {
    name: string
    init: (graph: Graph, ...options: any[]) => any
    dispose: () => void

    enable?: () => void
    disable?: () => void
    isEnabled?: () => boolean
  }
}
