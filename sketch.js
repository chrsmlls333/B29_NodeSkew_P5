import { p5Manager, floorStep, cyrusBeckLine } from "./libraries/cem/0.2.2/cem.js";
import { Grid } from "./gestures/Grid.js";


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


let p5m, mouse, grid, shiver, noiser;
window.setup = function() {
  p5.disableFriendlyErrors = true; // disables FES

  window.p5m = p5m = new p5Manager(page.width, page.height);
  mouse = p5m.mouse;
  p5m.registerDraw(draw);
  p5m.applyToCanvases((c) => {
    c.noSmooth();
  })
  frameRate(60);

  // Build Grid
  grid = new Grid( page.innerWidth, page.innerHeight, 24 );

  // Subtle Rotation
  shiver = {
    period() { return 0.25 * map(floorStep(mouseX, width/7), 0, width, 5, 60); }, //sec
    cycle() { return (frameCount / 60) * (TWO_PI / this.period()) },
    amplitude: 50,
    vector() {
      const v = createVector( cos(this.cycle()), sin(this.cycle()) );
      v.mult(this.amplitude);
      // Object.defineProperty(this, "vector", {value: v})
      return v;
    }
  };

  // Comment
  noiser = {
    amplitude: 1,
    scale: 0.1,//150,
    driftSpeed: 1,
    _step: createVector(),
    set step({ x, y }) {
      this._step = p5.Vector.mult(createVector(x, y), this.scale);
    },
    result() {
      return noise( this._step.x, 
                    this._step.y, 
                    this.driftSpeed * frameCount / 60 ) * this.amplitude;
    }
  }
}

window.draw = () => {
  p5m.preDraw();
  p5m.runUserDraw();
  p5m.postDraw();
}

// ======================================================


function draw(c) {
  c.background(240); 

  // Expand Grid for long lines
  const maxDragCartesian = max(mouse.dragPosition.array().map(abs));
  grid.adjustPadding(maxDragCartesian);
  
  // Calculate MouseY Scaling of Dynamics
  const mousePosition = mouse.dragPosition.copy();
  const interactiveAmplitude = mouseIsPressed ? 0 : 
    constrain(map(mouseY, height*0.1, height*0.9, 1, 0),0,1);

  // 
  c.translate(page.marginPx, page.marginPx);

  //
  grid.forEachNode(({index0, index, position}) => {

    //Get variations
    noiser.step = index0;
    let midPoint = mousePosition.copy();
    switch (3) {
      case 1:
        midPoint.add(p5.Vector.mult(shiver.vector(), interactiveAmplitude));
        break;
      case 2:
        midPoint.add(p5.Vector.mult(shiver.vector(), noiser.result * interactiveAmplitude));
        break;
      case 3:
        midPoint.add(createVector(noiser.result()-0.5, noiser.result()-0.5).mult(50 * interactiveAmplitude));
        break;
      case 4:
        break;
      default:
        break;
    }

    c.push();
    c.translate(position.x, position.y);
    c.stroke(0, 0, 255, 128);
    c.strokeWeight(1);

    for (const [s, v] of switches.on.entries()) {
      if (!v) continue;
      const quad = {
        x: (s % 4) - 1.5,
        y: (s - (s % 4))/4 - 1.5
      }
      c.line( midPoint.x,               midPoint.y, 
              grid.spacing.x * quad.x,  grid.spacing.y * quad.y );
    }

    if (switches.allOff()) {
      c.strokeWeight(5);
      c.point(midPoint.x, midPoint.y);
    }

    c.pop();
  });
  

  // ==========================================
  
  p5m.setUserData({
    variables: {
      canvas: {
        width,
        height,
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
  on: Array(16).fill(false),
  get(i) { return this.on[i] },
  set(i, v) { this.on[i] = v },
  toggle(i) { this.on[i] = !this.on[i] },
  reset(b = false) { this.on.fill(b) },
  allOff() { return !this.on.some(Boolean) },
  allOn() { return this.on.every(Boolean) }, 
};
switches.on[4] = switches.on[8] = switches.on[11] = true; //default


window.mouseDragged = (event) => {
  if (mouseButton == LEFT) {
    // console.log('hello');
    mouse.drag();
  } else if (mouseButton == RIGHT) {
  } else if (mouseButton == CENTER) {
  }
}

window.keyTyped = (event) => {
  const keymap = ['1','2','3','4',
                  'q','w','e','r',
                  'a','s','d','f',
                  'z','x','c','v']
  if (keymap.some(v => v == key)) {
    const index = keymap.indexOf(key);
    switches.toggle(index);
  }

  if (key == ' ') {
    switches.reset();
    mouse.reset();
  }

  if (key == '5'){
    p5m.requestSVG();
  }

  if (key == '6'){
    p5m.requestImage();
  }

  if (key == '7'){
    p5m.requestSVG();
    p5m.requestImage();
  }
  
}