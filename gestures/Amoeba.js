import { cyrusBeckLine } from "../libraries/cem/0.2.2/cem.js";

/*
Implement:
  import { Amoeba } from "./gestures/Amoeba.js";
  const center = createVector(mouseX, mouseY);
  Amoeba.draw(c, center);
*/

export class Amoeba {

  // constructor () {}

  static radialPoints = 40;
  static radius = 200;

  static draw(canvas, centerVec) {
    const c = canvas;
    const center = centerVec || createVector(0, 0);
    const num = this.radialPoints;
    const radius = this.radius;

    const boundPoints = [];

    for (let i = 0; i < num; i++) {
      let theta = (TWO_PI * i / num) + frameCount / 400;
      let p = p5.Vector.fromAngle(theta).mult(radius * (1 - noise(i, frameCount / 200) * 0.45));
      p.add(center);
      boundPoints.push(p);
    }

    // c.strokeWeight(3);
    // c.beginShape(POINTS);
    // for (let i = 0; i < boundPoints.length; i++) {
    //   const v = boundPoints[i];
    //   c.vertex(v.x, v.y);
    // }
    // c.endShape(CLOSE);

    c.strokeWeight(1);
    c.stroke(50, 50, 255)
    c.noFill()
    c.beginShape();
    for (let i = 0; i < boundPoints.length; i++) {
      const v = boundPoints[i];
      c.curveVertex(v.x, v.y);
    }
    c.endShape(CLOSE);

    c.beginShape();
    for (let i = 0; i < boundPoints.length; i++) {
      const v = boundPoints[i];
      let v2 = p5.Vector.sub(v, center).mult(1.05).add(center);
      c.curveVertex(v2.x, v2.y);
      c.line(v.x, v.y, v2.x, v2.y);
    }
    c.endShape(CLOSE);

    // for (let i = 0; i < boundPoints.length; i++) {
    //   const v = boundPoints[i];
    //   let p = p5.Vector.sub(v, center).normalize().mult(100).add(v);
    //   let h1 = p.heading();
    //   p.setHeading(h1 + noise(i, frameCount / 400)*0.15)
    //   c.line(v.x, v.y, p.x, p.y);
    // }

    c.strokeWeight(1);
    c.stroke(128)
    const divs = 120;

    for (let i = 0; i < divs; i++) {
      let h = height * i / divs;
      let n = cyrusBeckLine(0, h, width, h, boundPoints);
      if (!n) continue;
      c.line(...n);
    }
    for (let i = 0; i < divs; i++) {
      let w = width * i / divs;
      let n = cyrusBeckLine(w, 0, w, height, boundPoints);
      if (!n) continue;
      c.line(...n);
    }
  }
}