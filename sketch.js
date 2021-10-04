import { shuffleArray } from "./libraries/cem/0.2.1/src/random.js";

window.setup = () => {
  createCanvas(400, 400);
  frameRate(1);
  print(shuffleArray([1,2,3,4,5,6,7,8,9]));
}

window.draw = () => {
  background(color(random(200,255), 0, 255)); 
}
