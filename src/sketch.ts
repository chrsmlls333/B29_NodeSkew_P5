
import p5 from "p5"
// @ts-ignore
import p5Svg from "p5.js-svg"
p5Svg(p5)

import { p5Manager, floorStep, VecToArray, Vec, vecMultScalar, ObjToVec, vecAddVec, constrain, vecDivScalar, Vec3, setVec } from "./libraries/cemjs/src/cem";
import { Grid } from "./gestures/Grid";
import { DrawStages, Mouse, p5NoiseField } from "./libraries/cemjs/src/p5";

import { Pane } from 'tweakpane';
import { ButtonGridApi } from "@tweakpane/plugin-essentials";



let page = {
  paperWidthIn: 11,
  paperHeightIn: 8.5,
  resolution: 96,
  marginPx: 0, 
  get width()  { return  this.paperWidthIn*this.resolution },
  get height() { return this.paperHeightIn*this.resolution },
  get innerWidth()  { return  (this.paperWidthIn*this.resolution) - (this.marginPx*2) },
  get innerHeight() { return (this.paperHeightIn*this.resolution) - (this.marginPx*2) },
};




new p5((p: p5) => {

  let p5m: p5Manager;
  let mouse: Mouse;

  const state = {
    // Grid Settings
    grid: new Grid(),
    // Drag Offset
    nodeOffset: Vec(),
    totalLines: 0,
    // Linear Offset
    noise: new p5NoiseField(p, {
      amplitude: 30,
      scale: 0.2,
      speed: Vec3(0.5,0.5,0.5),
      mono: true
    }),
    // Subtle Rotation
    shiver: {
      period() { return 0.25 * p.map(floorStep(p.mouseX, p.width/7), 0, p.width, 5, 60); }, //sec
      cycle() { return (p.frameCount / 60) * (p.TWO_PI / this.period()) },
      amplitude: 50,
      vector() {
        const c = this.cycle();
        return vecMultScalar(Vec( Math.cos(c), Math.sin(c)), this.amplitude);
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
    (window as any).p5m = p5m = new p5Manager(p, page.width, page.height)
    // TODO turn this into method
    // p.pixelDensity(Math.min(p.pixelDensity(), 2))
    p.frameRate(60);
    p5m.applyToCanvases((c) => { 
      c.noSmooth() 
      c.colorMode(p.RGB, 1.0)
    })
    
    // UI
    mouse = new Mouse(p, state.nodeOffset)
    p5m.registerGUIAdditions(GUIadditions)

    // Build Grid, Connections, Noise
    state.grid.updateGrid( page.innerWidth, page.innerHeight, 24 )

    state.switches.on[4] = state.switches.on[8] = state.switches.on[11] = true;

    p5m.onDraw(() => state.noise.tick(), DrawStages.predraw)

    // Register Main Draw Call
    p5m.onDraw(draw)

    // TODO replace this with exportable config
    p5m.onDraw(c => { 
      p5m.setUserData({
        variables: {
          canvas: {
            width: c.width,
            height: c.height,
          },
          state,
          // grid,
          // interactiveAmplitude,
        }
      })
    })

    console.log("Draw Calls", p5m.getDrawCalls());
  }


  // ======================================================
  
  
  function draw(c: p5.Graphics) {
    
    const longEdge = Math.max(c.width,c.height)
    state.totalLines = 0;

    // Expand Grid for long lines
    let midPoint = vecMultScalar(ObjToVec(state.nodeOffset), state.grid.spacing.x) 
    const maxDragCartesian = Math.max(...VecToArray(midPoint).map(Math.abs))
    state.grid.adjustPadding(maxDragCartesian);
    
    // Offset from canvas edge
    c.translate(page.marginPx, page.marginPx);

    // Set Coloring and Theme
    c.background(state.theme.backgroundColor)
    c.stroke(state.theme.strokeColor);
    c.strokeWeight(state.theme.strokeWeight);
  
    // Main Loop
    state.grid.forEachNode(({index0, position}) => {
      
      //Get variations 
      const normalizedpos = vecDivScalar(position, longEdge)
      const noisOffset = state.noise.getVec(normalizedpos, true);
      let thisMidPoint = Vec(...VecToArray(midPoint)); //really need to ditch this implementation
      switch (3) {
        // case 1:
        //   midPoint.add(p5.Vector.mult(shiver.vector(), interactiveAmplitude));
        //   break;
        // case 2:
        //   midPoint.add(p5.Vector.mult(shiver.vector(), noiser.result * interactiveAmplitude));
        //   break;
        case 3:
          if (p.mouseIsPressed && dragOriginatingOnCanvas) break
          thisMidPoint = vecAddVec(midPoint, noisOffset);
          break;
        // case 4:
        //   break;
        default:
          break;
      }
      
      for (const [num, activated] of state.switches.on.entries()) {
        if (!activated) continue;
        const current = {
          x: (num % 4) - 1.5,
          y: (num - (num % 4))/4 - 1.5
        }
        c.line( 
          position.x + thisMidPoint.x,
          position.y + thisMidPoint.y, 
          position.x + (state.grid.spacing.x * current.x),  
          position.y + (state.grid.spacing.y * current.y) 
        );

        state.totalLines++
      }
  
      if (state.switches.allOff()) {
        c.strokeWeight(constrain(state.theme.strokeWeight*2, 5, Infinity)); //5px
        c.point(position.x + thisMidPoint.x, position.y + thisMidPoint.y);
        state.totalLines++
        c.strokeWeight(state.theme.strokeWeight);
      }

    });

  }
  
  // =============================================================

  function GUIadditions(p: Pane) {
    
    const pg = p.addFolder({ title: "Grid" })
    pg.addInput(state.grid, "divs", { 
      label: "Cells",
      min: 1, max: 60, step: 1 
    }).on("change", ev => { state.grid.adjustDivisions(ev.value) })
    const nosMax = 500/24
    pg.addInput(state, "nodeOffset", {
      label: "Anchor",
      x: {min: -nosMax, max: nosMax},
      y: {min: -nosMax, max: nosMax}
    })

    const pc = p.addFolder({ title: "Lines"});
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

    
    const pt = p.addFolder({ title: "Theme" })
    pt.addInput(state.theme, "backgroundColor", { color: { alpha: true } })
    pt.addInput(state.theme, "strokeColor",     { color: { alpha: true } })
    pt.addInput(state.theme, "strokeWeight",    { min: 0.1, max: 5, step: 0.1 })

    
    const pn = p.addFolder({ title: "Noise" })
    pn.addInput(state.noise, "amplitude", { min: 0, max: 60 })
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
      disabled: true, x: { }, y: { }, z: { },
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
      mouse.dragCoefficent = 0.4/24*(state.grid.divs/24) //TODO needs work to formalize
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
