// Math Functions //////////////////////////////////////////////////////

export * from "./scalingfit.js";
export * from "./random.js";
export * from "./p5math.js";

const findStep = (func, value, step) => {
    if (step == 0) return 0; //throw?
    return step * func(value / step);
}
export const roundStep = function(value, step = 1) { return findStep(Math.round, ...arguments) };
export const floorStep = function(value, step = 1) { return findStep(Math.floor, ...arguments) };
export const  ceilStep = function(value, step = 1) { return findStep( Math.ceil, ...arguments) };