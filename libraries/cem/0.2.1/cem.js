// CEM LIBRARY //////////////////////////////////////////////////////////

/*
  Instructions:
  Declare CEM object at top of code.
  > import * as CEM from './libraries/cem/0.2.1/cem.js';
  
  Include key:value pairs for settings.
  Include this injector library before anything.

  Available settings in init declaration:
  boolean verbose || true
    enables debug printing to console
*/

// Classes
export * from './src/UIZoom.js';
export * from './src/Clock.js';

// Named Groups
export * as THREE from './src/THREE.js';
export * as Timers from './src/Timers.js';
export * from './src/easing.js';

// Assorted
export * from './src/math.js';
export * from './src/logging.js';