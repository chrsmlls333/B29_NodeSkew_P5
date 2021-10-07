import { Queue, floorStep, ceilVector } from "./libraries/cem/0.2.1/cem.js";

let canvasDims;
window.setup = () => {
  const paperWidth = 8.5,
        paperHeight = 11,
        canvasScalar = 70;
  createCanvas( paperWidth*canvasScalar, 
                paperHeight*canvasScalar);
  canvasDims = createVector(width, height);
  // frameRate(10);
  noSmooth();

  setupMouse();
}

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
// switches.on[5] = true; //"home"

const mouse = {};
function setupMouse() {
  const defaultAccumulator = createVector( -48, 18 );
  Object.assign(mouse, { 
    get x() { return mouseX }, 
    get y() { return mouseY },
    accumulator: defaultAccumulator,
    dragSpeedMult: 0.5, 
    getDragPositionY() { return this.accumulator.y; },
    getDragPositionX() { return this.accumulator.x; },
    getDragPosition()  { return this.accumulator },
    accumulate() {
      const m = createVector( mouseX,  mouseY  );
      const p = createVector( pmouseX, pmouseY );
      const d = p5.Vector.sub( m, p );
      d.mult(this.dragSpeedMult);
      this.accumulator.add( d )
    },
    reset: function() {
      this.accumulator = defaultAccumulator;
    }
  });
}

// ======================================================

const frames = new Queue(30, 60);
window.draw = () => {
  frames.tick(frameRate());
  document.title = `${int(frameRate())}/${int(frames.average())} fps, Frame ${frameCount}`;
  canvasDims.set(width, height);
  draw();
}

const draw = () => {
  background(240); 
  
  // Subtle Rotation
  const period = 0.25 * map(floorStep(mouseX, width/7), 0, width, 5, 60); //sec
  const shiver = {
    cycle: millis() * TWO_PI / (period * 1000),
    amplitude: 50,
    get vector() {
      const v = createVector(
        cos(this.cycle), 
        sin(this.cycle)
      );
      v.mult(this.amplitude);
      Object.defineProperty(this, "vector", {value: v})
      return v;
    }
  };

  // Grid
  const generateGrid = () => {
    const baseDivisions = 9;
    const minDim = min(width, height);    
    const numCells = p5.Vector.mult(canvasDims, baseDivisions / minDim);
    ceilVector(numCells);
    numCells.z = 1; // don't divide by zero ;P
    const cellSpacing = p5.Vector.div(canvasDims, numCells)
    const maxDragCartesian = max(mouse.getDragPosition().array().map(abs));
    const minSpacingValue = min(cellSpacing.array().slice(0, 2));
    const extraCellsPadding = ceil(maxDragCartesian / minSpacingValue) + 1;
    const extraCellsTotal = extraCellsPadding * 2;
    numCells.add(extraCellsTotal, extraCellsTotal);
    return {
      base: baseDivisions,
      num: numCells,
      spacing: cellSpacing,
      extra: extraCellsPadding,
      extra2: extraCellsTotal
    };
  }
  const grid = generateGrid();

  const interactiveAmplitude = mouseIsPressed ? 0 : 
    constrain(map(mouseY, height*0.1, height*0.9, 1, 0),0,1);

  const noiser = {
    amplitude: 1,
    _step: createVector(),
    set step({ x, y }) {
      this._step = p5.Vector.mult(createVector(x, y), 200);
    },
    get result() {
      return noise( this._step.x, 
                    this._step.y, 
                    millis() / 1000 ) * this.amplitude;
    }
  }

  for (let i = 0; i < grid.num.x; i++) {
    for (let j = 0; j < grid.num.y; j++) {
      const index = {x:i, y:j}
      noiser.step = index;

      let display = true;

      const step = createVector(i, j);
      step.sub(grid.extra, grid.extra);
      step.mult(grid.spacing);
  
      let midPoint = mouse.getDragPosition().copy();
      switch (3) {
        case 1:
          midPoint.add(p5.Vector.mult(shiver.vector, interactiveAmplitude));
          break;
        case 2:
          midPoint.add(p5.Vector.mult(shiver.vector, noiser.result * interactiveAmplitude));
          break;
        case 3:
          midPoint.add(createVector(noiser.result, noiser.result).mult(30 * interactiveAmplitude));
          break;
      
        default:
          break;
      }

      push();
      translate(step.x, step.y);
      stroke(0, 0, 255, 128);
      strokeWeight(1);

      for (const [s, v] of switches.on.entries()) {
        if (!v) continue;
        const quad = {
          x: (s % 4) - 1,
          y: (s - (s % 4))/4 - 1
        }
        line( midPoint.x,               midPoint.y, 
              grid.spacing.x * quad.x,  grid.spacing.y * quad.y );
      }

      strokeWeight(5);

      if (switches.allOff()) {
        point(midPoint.x, midPoint.y);
      }

      pop();
    }
  }
}

// =============================================================

window.mouseDragged = (event) => {
  if (mouseButton == LEFT) {
    // console.log('hello');
    mouse.accumulate();
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
  
}