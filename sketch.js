import { Queue, floorStep } from "./libraries/cem/0.2.1/cem.js";
const p5 = window.p5;


window.setup = () => {
  const paperWidth = 8.5,
        paperHeight = 11,
        canvasScalar = 70;
  createCanvas( paperWidth*canvasScalar, 
                paperHeight*canvasScalar);
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
  Object.assign(mouse, { 
    get x() { return mouseX }, 
    get y() { return mouseY },
    accumulator: {
      x: -48, //width/2,
      y: 18, //height/2,
    },
    dragSpeedMult: 0.5, 
    getDragPositionY() { return this.accumulator.y; },
    getDragPositionX() { return this.accumulator.x; },
    getDragPosition()  { return this.accumulator },
    accumulate() {
      this.accumulator.x += (mouseX - pmouseX) * this.dragSpeedMult;
      this.accumulator.y += (mouseY - pmouseY) * this.dragSpeedMult;
    },
    reset: function() {
      this.accumulator.x = width/2;
      this.accumulator.y = height/2;
    }
  });
  
}

// ======================================================

const frames = new Queue(15, 60);
window.draw = () => {
  frames.tick(frameRate());
  document.title = `${int(frameRate())}/${int(frames.average())} fps, Frame ${frameCount}`;
  draw();
}

const draw = () => {
  background(240); 
  
  // Subtle Rotation
  const period = 0.25 * map(floorStep(mouseX, width/7), 0, width, 5, 60); //sec
  const shiver = {
    cycle: millis() * TWO_PI / (period * 1000),
    amplitude: 50,
  };

  // Grid
  const grid = {
    base: 9
  };
  grid.num = {
    x: ceil(grid.base * (width  / min(width, height))),
    y: ceil(grid.base * (height / min(width, height)))
  };
  grid.spacing = {
    x: width  / grid.num.x,
    y: height / grid.num.y
  }
  grid.extra = ceil(max(Object.values(mouse.getDragPosition()).map(abs)) / min(Object.values(grid.spacing))) + 1
  grid.num.x += 2*grid.extra;
  grid.num.y += 2*grid.extra;


  for (let i = 0; i < grid.num.x; i++) {
    for (let j = 0; j < grid.num.y; j++) {
      const step = {
        x: (i-grid.extra) * grid.spacing.x,
        y: (j-grid.extra) * grid.spacing.y
      }
      step.noise = {
        scale: 200,
        amplitude: mouseIsPressed ? 0 : constrain(map(mouseY, height*0.1, height*0.9, 1, 0),0,1),
      }
      step.noise.result = noise(step.x*step.noise.scale, 
                                step.y*step.noise.scale, 
                                millis()/1000) *
                          step.noise.amplitude;
      step.midPoint = {
        x: mouse.getDragPositionX() + 
           (shiver.amplitude*cos(shiver.cycle)*step.noise.result),
        y: mouse.getDragPositionY() + 
           (shiver.amplitude*sin(shiver.cycle)*step.noise.result),
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
        line( step.midPoint.x, step.midPoint.y, 
              grid.spacing.x * quad.x, grid.spacing.y * quad.y );
      }

      strokeWeight(5);

      if (switches.allOff()) {
        point(step.midPoint.x, step.midPoint.y);
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