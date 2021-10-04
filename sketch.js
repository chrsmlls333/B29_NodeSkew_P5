// import { map } from "./libraries/cem/0.2.1/cem.js";

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

const mouse = {};
function setupMouse() {
  Object.assign(mouse, { 
    get x() { return mouseX }, 
    get y() { return mouseY },
    xAcc: 168.5, //width/2,
    yAcc: 380, //height/2,
    dragSpeedMult: 5.5, 
    getYAccNorm() { 
      return this.dragSpeedMult * 
             map(this.yAcc, 0, height, -0.5, 0.5) 
             + 0.5; 
    },
    getXAccNorm() { 
      return this.dragSpeedMult * 
             map(this.xAcc, 0, width, -0.5, 0.5) 
             + 0.5; 
    },
    accumulate() {
      this.xAcc += mouseX - pmouseX;
      this.yAcc += mouseY - pmouseY;
      // console.log(this.xAcc, this.yAcc);
    },
    reset: function() {
      this.xAcc = width/2;
      this.yAcc = height/2;
    }
  });
  
}

// ======================================================





window.draw = () => {

  background(240); 

  // Compensate Drag
  const offset = { 
    x: mouse.getXAccNorm(),
    y: mouse.getYAccNorm()
  }
  
  // Subtle Rotation
  const period = 0.25 * int(map(mouseX, 0, width, 5, 30)); //sec
  const shiver = {
    cycle: millis() * TWO_PI / (period * 1000),
    amplitude: 50,
  };

  // Grid
  const base = 9;
  const grid = {
    base,
    extra: base*3,
  };
  grid.num = {
    x: ceil(grid.base * (width  / min(width, height))) + 2*grid.extra,
    y: ceil(grid.base * (height / min(width, height))) + 2*grid.extra
  };
  grid.spacing = {
    x: width  / (grid.num.x - (grid.extra*2)),
    y: height / (grid.num.y - (grid.extra*2))
  }

  // Math -- Step/Point Data
  let steps = Array(grid.num.x).fill(Array(grid.num.y).fill({}));
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
        x: lerp(0, grid.spacing.x, offset.x) + 
           shiver.amplitude*cos(shiver.cycle)*step.noise.result,
        y: lerp(0, grid.spacing.y, offset.y) + 
           shiver.amplitude*sin(shiver.cycle)*step.noise.result,
      }
  //     // save
  //     steps[i][j] = step; //TODO inefficient, rewrite
  //   }
  // }

  // // Draw
  // for (let i = 0; i < grid.num.x; i++) {
  //   for (let j = 0; j < grid.num.y; j++) {
  //     const step = steps[i][j];
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