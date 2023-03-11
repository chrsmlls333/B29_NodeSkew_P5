import { Vector2 } from "@math.gl/core";
import { cloneDeep } from "lodash-es";



export interface GridNode {
  index: [ x: number, y: number ],
  index0: [ x: number, y: number ],
  position: [ x: number, y: number ]
}

export class Grid {
  size = new Vector2();
  divs = 2;
  spacing = new Vector2();
  numcells = new Vector2();
  extra = new Vector2();
  get numcells0() { return new Vector2([
    this.numcells.x + this.extra.x*2,
    this.numcells.y + this.extra.y*2,
  ])}
  squared = false

  nodeCache = {
    nodes: <GridNode[]>[],
    expired: true,
  }

  #v = new Vector2()
  static #blankNode: GridNode = {
    index: [ 0, 0 ],
    index0: [ 0, 0 ],
    position: [ 0, 0 ]
  }

  constructor(_width = 100, _height = 100, _divisions = 10, _squared = false) {
    this.updateGrid(_width, _height, _divisions, _squared)
  }

  updateGrid(
    _width = this.size.x, 
    _height = this.size.y, 
    _divisions = this.divs, 
    _squared = this.squared, 
    forceUpdate = false
  ) {
    if (
      !forceUpdate && 
      this.size && 
      _width === this.size.x && 
      _height === this.size.y && 
      _divisions === this.divs && 
      _squared === this.squared
    ) return
    if (_width === 0 || _height === 0) return

    this.size.set(_width, _height);
    this.divs = _divisions;
    this.squared = _squared;

    let minDimension = Math.min(this.size.x, this.size.y);
    let numcells = this.size.clone().multiplyByScalar( this.divs / minDimension )
    this.numcells.fromArray(numcells.map(n => Math.ceil(n)))
    if (this.squared) {
      let space = minDimension / Math.min(...this.numcells.toArray())
      this.spacing.set(space, space)
    } else {
      this.spacing.copy(this.size).divide(this.numcells)
    }

    this.nodeCache.expired = true;
  }

  adjustDivisions( divs: number = this.divs ) {
    this.updateGrid(this.size.x, this.size.y, divs, this.squared, true)
    this.nodeCache.expired = true;
  }

  
  adjustPadding( _extrawidth = 0, _extraheight = 0, safety = 0.001) {
    let absolutelyExtra = [_extrawidth, _extraheight].map(Math.abs)
    let extraCells = this.#v
      .fromArray(absolutelyExtra)
      .divide(this.spacing)
      .add([safety, safety])
      .map(v => Math.ceil(v))
    
    if (this.extra.equals(extraCells)) return
    this.extra.fromArray(extraCells);
    this.nodeCache.expired = true;
  }

  
  getNodes( forceUpdate = false ) {
    if( forceUpdate || this.nodeCache.expired ) {
      if (!this.nodeCache.nodes) this.nodeCache.nodes = []
      let nodes = this.nodeCache.nodes
      const [ xMax, yMax ] = this.numcells0
      let len = xMax*yMax;

      for (let y = 0; y < yMax; y++) {
        for (let x = 0; x < xMax; x++) {
          let i = x + (y * xMax)
          if (!nodes[i]) nodes[i] = cloneDeep(Grid.#blankNode)
          const node = this.nodeCache.nodes[i] 

          this.#v.set(x, y).toArray(node.index0)
          this.#v.subtract(this.extra).toArray(node.index)
          this.#v.multiply(this.spacing).toArray(node.position)
        }
      }
      this.nodeCache.nodes.length = len
      this.nodeCache.expired = false
    }
    return this.nodeCache.nodes;
  }

  getNodePosition( _x:number, _y:number, index0 = false ) {
    const nodes = this.getNodes();
    const [ xMax, yMax ] = this.numcells0
    let x = index0 ? _x : _x + this.extra.x;
    let y = index0 ? _y : _y + this.extra.y;
    return nodes[x + (y * xMax)].position;
  }

  getPerimeterSize( index0 = false ){
    let numset = this.numcells
    if (index0) numset = this.numcells0
    return numset[0]*2 + numset[1]*2
  }

  get() {
    const { size, numcells, spacing, extra, squared } = this;
    const nodes = this.getNodes();
    return {
      data: {
        size,
        cells: {
          numcells,
          extra,
          spacing,
          squared
        }
      },
      nodes
    }
  }

  forEachNode( callback: (node: GridNode)=>void ) {
    for (const node of this.getNodes()) { callback(node) }
  }

}