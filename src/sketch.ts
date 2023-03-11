
import p5 from "p5"
// @ts-ignore
import p5Svg from "p5.js-svg"
p5Svg(p5)

import { Pane } from 'tweakpane';
import { ButtonGridApi } from "@tweakpane/plugin-essentials";
import { Vector2, Vector3 } from "@math.gl/core";

import { p5Manager, floorStep, constrain, bboxCorners } from "./libraries/cemjs/src/cem";
import { drawCropLine, DrawStages, Mouse, p5NoiseField } from "./libraries/cemjs/src/p5";

import { Grid } from "./gestures/Grid";

const urlParams = new URLSearchParams(window.location.search)

let page = {
  fullscreenMode: urlParams.get('fs') === '1',
  paperWidthIn: Number.parseFloat(urlParams.get('w') || "") || 11,
  paperHeightIn: Number.parseFloat(urlParams.get('h') || "") || 8.5,
  resolution: Number.parseInt(urlParams.get('ppi') || "") || 96,
  marginIn: Number.parseFloat(urlParams.get('m') || "") || 0, 
  get width()  { return this.fullscreenMode ? window.innerWidth  : this.paperWidthIn*this.resolution },
  get height() { return this.fullscreenMode ? window.innerHeight : this.paperHeightIn*this.resolution },
  get margin() { return this.marginIn*this.resolution },
  get innerWidth()  { return this.width - (this.margin*2) },
  get innerHeight() { return this.height - (this.margin*2) },
  get sizeBounds() { return bboxCorners(0,0,this.width,this.height) },
  get insetSizeBounds() { return bboxCorners(0,0,this.innerWidth,this.innerHeight) },
  get insetBounds() { return bboxCorners(this.margin,this.margin,this.innerWidth,this.innerHeight) }
};




new p5((p: p5) => {

  let p5m: p5Manager;
  let mouse: Mouse;

  const state = {
    // Grid Settings
    grid: new Grid(),
    // Drag Offset
    nodeOffset: new Vector2,
    totalLines: 0,
    // Linear Offset
    noise: new p5NoiseField(p, {
      amplitude: 30,
      scale: 0.2,
      speed: new Vector3(0.5,0.5,0.5),
      mono: true
    }),
    // Subtle Rotation
    shiver: {
      period() { return 0.25 * p.map(floorStep(p.mouseX, p.width/7), 0, p.width, 5, 60); }, //sec
      cycle() { return (p.frameCount / 60) * (p.TWO_PI / this.period()) },
      amplitude: 50,
      get() {
        const c = this.cycle();
        return {
          x: Math.cos(c) * this.amplitude,
          y: Math.sin(c) * this.amplitude
        }
      }
    },
    switches: {
      on: <boolean[]>Array(16).fill(false),
      get(i:number) { return this.on[i] },
      set(i:number, v:boolean) { this.on[i] = v },
      toggle(i:number) { this.on[i] = !this.on[i] },
      reset(b = false) { this.on.fill(b) },
      allOff() { return !this.on.some(Boolean) },
      allOn() { return this.on.every(Boolean) }, 
    },
    theme: {
      backgroundColor: "#F0F0F0FF",
      strokeColor: "#0000FF80",
      strokeWeight: 1,
    }
  }

  

  p.setup = function() {

    // Setup Canvas
    (window as any).p5m = p5m = new p5Manager(p, page.fullscreenMode, page.width, page.height)
    // TODO turn this into method
    // p.pixelDensity(Math.min(p.pixelDensity(), 2))
    p.frameRate(120);
    p5m.applyToCanvases((c) => { 
      c.noSmooth() 
      c.colorMode(p.RGB, 1.0)
    })
    
    // UI
    mouse = new Mouse(p, state.nodeOffset)
    p5m.registerGUIAdditions(GUIadditions)

    // Build Grid, Connections, Noise
    state.grid.updateGrid( page.innerWidth, page.innerHeight, 24, true )

    // state.switches.on[4] = state.switches.on[8] = state.switches.on[11] = true;
    state.switches.on[5] = true

    p5m.onDraw(() => state.noise.tick(), DrawStages.predraw)

    // Register Main Draw Call
    p5m.onDraw(draw)

    //Load Settings
    p5m.getGUIPresetFromLocalStorage()
  }


  // ======================================================
  
  let 
    dragOffset = new Vector2(), 
    dragOffsetPerNode = new Vector2(),
    uvPosition = new Vector2(),
    paddingAmount = [0,0],
    lineBounds: number[][];

  function draw(c: p5.Graphics) {
    //Clear
    c.background(state.theme.backgroundColor)

    // Optimized Gets
    lineBounds = page.insetSizeBounds
    const longEdge = Math.max(c.width,c.height)
    state.totalLines = 0;

    // Expand Grid for long lines
    dragOffset.copy(state.nodeOffset)
    dragOffset.divide([state.grid.divs, state.grid.divs]) //normalize to divisions
    mouse.dragCoefficent = 0.7*state.grid.divs //compensate on dragging
    paddingAmount = dragOffset.map(v => Math.abs(v) + state.noise.amplitude/2)
    state.grid.adjustPadding(...paddingAmount);
    
    // Offset from canvas edge
    if (page.margin != 0) c.translate(page.margin, page.margin);

    // Set Coloring and Theme
    if (p.frameCount < 30) {
      c.stroke(state.theme.strokeColor);
      c.strokeWeight(state.theme.strokeWeight);
    }
  
    // Main Loop
    // const [ xMax0, yMax0 ] = state.grid.numcells0
    state.grid.forEachNode(({index0, position}) => {
      // const [ x0, y0 ] = index0
      // const i0 = y0 * xMax0 + x0;
      
      //Get variations 
      uvPosition.fromArray(position).divide([longEdge, longEdge])
      const [ nx, ny ] = state.noise.getVec2(uvPosition, true)
      dragOffsetPerNode.copy(dragOffset)
      dragOffsetPerNode.add([nx,ny])
      
      // Draw Connection Lines 
      for (const [num, activated] of state.switches.on.entries()) {
        if (!activated) continue;
        const current = {
          x: (num % 4) - 1.5,
          y: (num - (num % 4))/4 - 1.5
        }

        const drawn = drawCropLine(c, 
          position[0] + dragOffsetPerNode.x,
          position[1] + dragOffsetPerNode.y,
          position[0] + (state.grid.spacing.x * current.x),  
          position[1] + (state.grid.spacing.y * current.y),
          lineBounds
        )
        if (drawn) state.totalLines++
      }
  
      if (state.switches.allOff()) {
        c.strokeWeight(constrain(state.theme.strokeWeight*2, 3, Infinity)); //5px
        c.point(position[0] + dragOffsetPerNode.x, position[1] + dragOffsetPerNode.y);
        state.totalLines++
        c.strokeWeight(state.theme.strokeWeight);
      }

    });

  }
  
  // =============================================================

  function GUIadditions(pane: Pane) {
    
    const pg = pane.addFolder({ title: "Grid" })
    pg.addInput(page, "marginIn", { 
      min: 0, max: Math.min(page.paperWidthIn,page.paperHeightIn)/2,
      label: "Margin"
    }).on("change", ev => {
      state.grid.updateGrid( page.innerWidth, page.innerHeight )
    })
    pg.addInput(state.grid, "divs", { 
      label: "Cells",
      min: 1, max: 80, step: 1 
    }).on("change", ev => { state.grid.adjustDivisions(ev.value) })
    const nosMax = 500/24
    pg.addInput(state, "nodeOffset", {
      label: "Anchor"
    })

    const pc = pane.addFolder({ title: "Lines"});
    (pc.addBlade({
      view: 'buttongrid',
      size: [4, 4],
      cells: (x:number, y:number) => ({
        title: connectionKeyMap[x + (y*4)]
      }),
      label: 'Connection Matrix',
    }) as ButtonGridApi).on('click', (ev) => {
      let [x, y] = ev.index
      state.switches.toggle(x + (y*4))
    });
    pc.addMonitor(state, "totalLines", { label: "# Lines" })

    
    const pt = pane.addFolder({ title: "Theme" })
    pt.addInput(state.theme, "backgroundColor", { color: { alpha: true }, label: "Bg Color" })
    pt.addInput(state.theme, "strokeColor",     { color: { alpha: true }, label: "Line Color" })
    pt.addInput(state.theme, "strokeWeight",    { min: 0.1, max: 5, step: 0.1, label: "Line Weight" })

    
    const pn = pane.addFolder({ title: "Noise" })
    pn.addInput(state.noise, "amplitude", { min: 0 })
    pn.addInput(state.noise, "scale", { min: 0.001, max: 0.5 })
    pn.addInput(state.noise, "lod", { min: 1, max: 10, step: 1 })
      .on("change", ev => { state.noise.setDetail(ev.value) })
    pn.addInput(state.noise, "falloff", { min: 0.001, max: 1 })
      .on("change", ev => { state.noise.setFalloff(ev.value) })
    const sMax = 3;
    pn.addInput(state.noise, "speed", {
      x: {min: -sMax, max: sMax},
      y: {min: -sMax, max: sMax},
      z: {min: 0 },
    })
    pn.addInput(state.noise, "position", {
      disabled: true
    })
    pn.addInput(state.noise, "mono")
  }

  // =============================================================
  
  let dragOriginatingOnCanvas: boolean
  p.mousePressed = (event: MouseEvent) => {
    dragOriginatingOnCanvas = event.target === p5m.canvas.elt
  }
  p.mouseReleased = (event: MouseEvent) => {
    dragOriginatingOnCanvas = false;
  }
  p.mouseDragged = (event: MouseEvent) => {
    if (!dragOriginatingOnCanvas) return
    
    if (p.mouseButton == p.LEFT) {
      mouse.drag();
    } else if (p.mouseButton == p.RIGHT) {
    } else if (p.mouseButton == p.CENTER) {
    }
  }
  
  const connectionKeyMap = ['1','2','3','4',
                            'q','w','e','r',
                            'a','s','d','f',
                            'z','x','c','v']
  p.keyTyped = (event) => {
    if (connectionKeyMap.some(v => v == p.key)) {
      const index = connectionKeyMap.indexOf(p.key);
      state.switches.toggle(index);
    }
  
    if (p.key == ' ') {
      state.switches.reset();
      mouse.reset();
    }
  
    if (p.key == '5'){
      p5m.requestSVG();
    }
  
    if (p.key == '6'){
      p5m.requestImage();
    }
  
    if (p.key == '7'){
      p5m.requestSVG();
      p5m.requestImage();
    }
    
  }

}, document.body);
