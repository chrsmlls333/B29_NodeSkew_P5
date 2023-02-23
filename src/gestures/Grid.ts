import { Vec, ceilVector, vecDivVec, vecMultScalar, vecMultVec, vecSubScalar } from "../libraries/cemjs/src/cem";

export interface GridNode {
  index?: Vec,
  index0?: Vec,
  position: Vec
}

export class Grid {
  size: Vec;
  divs: number;
  cells: Vec;
  spacing: Vec;
  extra: number;

  nodeCache = {
    nodes: <GridNode[]>[],
    expired: true,
  }

  constructor(_width = 100, _height = 100, _divisions = 10) {
    this.size = Vec(_width, _height);
    this.divs = _divisions;

    let minDimension = Math.min(this.size.x, this.size.y);
    let numcells = vecMultScalar(this.size, this.divs/minDimension);
    this.cells = ceilVector(numcells);
    this.spacing = vecDivVec(this.size, this.cells);
    this.extra = 0;
  }

  getNodes( forceUpdate = false ) {
    if( forceUpdate || this.nodeCache.expired ) {
      let nodes = <GridNode[]>[]
      for (let i = 0; i < (this.cells.y + this.extra*2); i++) {
        for (let j = 0; j < (this.cells.x + this.extra*2); j++) {
          const index0 = Vec(j, i);
          const index = vecSubScalar(index0, this.extra);
          const position = vecMultVec(index, this.spacing);
          const n = { index, index0, position }
          nodes.push(n);
        }
      }
      this.nodeCache.nodes = nodes;
      this.nodeCache.expired = false;
    }
    return this.nodeCache.nodes;
  }

  getNodePosition( _x:number, _y:number, index0 = false ) {
    const nodes = this.getNodes();
    let x = index0 ? _x : _x + this.extra;
    let y = index0 ? _y : _y + this.extra;
    return nodes[y * (this.cells.x + this.extra*2) + x].position;
  }

  get() {
    const { size, cells, spacing, extra } = this;
    const nodes = this.getNodes();
    return {
      data: {
        size,
        cells: {
          num: cells,
          extra,
          spacing
        }
      },
      nodes
    }
  }

  forEachNode( callback: (node: GridNode)=>void ) {
    const nodes = this.getNodes();
    nodes.forEach(node => callback(node));
  }

  adjustPadding( dist: number ) {
    const minSpacingValue = Math.min(this.spacing.x, this.spacing.y);
    const extraCellsPadding = Math.ceil((dist + 0.01) / minSpacingValue) + 1;
    this.extra = extraCellsPadding;
    this.nodeCache.expired = true;
  }
}