
import p5 from "p5"
// @ts-ignore
import p5Svg from "p5.js-svg"
p5Svg(p5)

import { p5Manager, floorStep, VecToArray, Vec, vecMultScalar, ObjToVec, vecAddVec } from "./libraries/cemjs/src/cem";
import { Grid } from "./gestures/Grid";
import { Mouse } from "./libraries/cemjs/src/p5";

let page = {
  paperWidthIn: 8.5,
  paperHeightIn: 11,
  resolution: 96,
  marginPx: 0, 
  get width()  { return  this.paperWidthIn*this.resolution },
  get height() { return this.paperHeightIn*this.resolution },
  get innerWidth()  { return  (this.paperWidthIn*this.resolution) - (this.marginPx*2) },
  get innerHeight() { return (this.paperHeightIn*this.resolution) - (this.marginPx*2) },
};

let state = {
  offset: Vec()
}


new p5((p: p5) => {

  let p5m: p5Manager;
  let mouse = new Mouse(p, state.offset);
  let grid: Grid;
  let shiver: any;
  let noiser: any;

  p.setup = () => {
    p.disableFriendlyErrors = false; // disables FES

    (window as any).p5m = p5m = new p5Manager(p, page.width, page.height);
    p5m.registerDraw(draw);
    p5m.applyToCanvases((c) => {
      c.noSmooth();
    })
    p.frameRate(60);

    // Build Grid
    grid = new Grid( page.innerWidth, page.innerHeight, 24 );

    // Subtle Rotation
    shiver = {
      period() { return 0.25 * p.map(floorStep(p.mouseX, p.width/7), 0, p.width, 5, 60); }, //sec
      cycle() { return (p.frameCount / 60) * (p.TWO_PI / this.period()) },
      amplitude: 50,
      vector() {
        const c = this.cycle();
        return vecMultScalar(Vec( Math.cos(c), Math.sin(c)), this.amplitude);
      }
    };

    // Comment
    noiser = {
      amplitude: 1,
      scale: 0.1,//150,
      driftSpeed: 1,
      _step: Vec(),
      set step({ x, y }: Vec) {
        this._step = vecMultScalar(Vec(x, y), this.scale);
      },
      result() {
        return p.noise( this._step.x, this._step.y, 
                        this.driftSpeed * p.frameCount / 60 ) * this.amplitude;
      }
    }
  }

  p.draw = () => {
    p5m.preDraw();
    p5m.runUserDraw();
    p5m.postDraw();
  }
  

  // ======================================================
  
  
  function draw(c: p5.Graphics) {
    c.background(240); 
    const mousePosition = mouse.dragPosition;
    // Expand Grid for long lines
    
    const maxDragCartesian = Math.max(...VecToArray(mousePosition).map(Math.abs))
    grid.adjustPadding(maxDragCartesian);
    
    // Calculate MouseY Scaling of Dynamics
    const interactiveAmplitude = p.mouseIsPressed ? 0 : 
      p.constrain(p.map(p.mouseY, p.height*0.1, p.height*0.9, 1, 0),0,1);
    
    // 
    c.translate(page.marginPx, page.marginPx);

    c.stroke(0, 0, 255, 128);
    c.strokeWeight(1);
  
    //
    grid.forEachNode(({index0, position}) => {
  
      //Get variations
      noiser.step = index0;
      const nois: number = noiser.result();
      let midPoint = ObjToVec(mousePosition);
      switch (3) {
        // case 1:
        //   midPoint.add(p5.Vector.mult(shiver.vector(), interactiveAmplitude));
        //   break;
        // case 2:
        //   midPoint.add(p5.Vector.mult(shiver.vector(), noiser.result * interactiveAmplitude));
        //   break;
        case 3:
          let noisOffset = vecMultScalar(Vec(nois-0.5, nois-0.5), 50 * interactiveAmplitude) 
          midPoint = vecAddVec(midPoint, noisOffset);
          break;
        // case 4:
        //   break;
        default:
          break;
      }
  
      // c.push();
      // c.translate(position.x, position.y);
      
      for (const [num, activated] of switches.on.entries()) {
        if (!activated) continue;
        const quad = {
          x: (num % 4) - 1.5,
          y: (num - (num % 4))/4 - 1.5
        }
        c.line( position.x + midPoint.x,                 position.y + midPoint.y, 
                position.x + (grid.spacing.x * quad.x),  position.y + (grid.spacing.y * quad.y) );
      }
  
      if (switches.allOff()) {
        c.strokeWeight(5);
        c.point(position.x + midPoint.x, position.y + midPoint.y);
        c.strokeWeight(1);
      }
  
      // c.pop();
    });

  
    // ==========================================
    
    p5m.setUserData({
      variables: {
        canvas: {
          width: c.width,
          height: c.height,
        },
        grid,
        shiver,
        noiser,
        interactiveAmplitude,
      },
      // setup: window.setup.toString(),
      // draw: draw.toString(),
      // file: import.meta.url,
    })
  }
  
  // =============================================================
  
  const switches = {
    on: <boolean[]>Array(16).fill(false),
    get(i:number) { return this.on[i] },
    set(i:number, v:boolean) { this.on[i] = v },
    toggle(i:number) { this.on[i] = !this.on[i] },
    reset(b = false) { this.on.fill(b) },
    allOff() { return !this.on.some(Boolean) },
    allOn() { return this.on.every(Boolean) }, 
  };
  switches.on[4] = switches.on[8] = switches.on[11] = true; //default
  
  
  p.mouseDragged = (event) => {
    if (p.mouseButton == p.LEFT) {
      mouse.drag();
    } else if (p.mouseButton == p.RIGHT) {
    } else if (p.mouseButton == p.CENTER) {
    }
  }
  
  p.keyTyped = (event) => {
    const keymap = ['1','2','3','4',
                    'q','w','e','r',
                    'a','s','d','f',
                    'z','x','c','v']
    if (keymap.some(v => v == p.key)) {
      const index = keymap.indexOf(p.key);
      switches.toggle(index);
    }
  
    if (p.key == ' ') {
      switches.reset();
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
