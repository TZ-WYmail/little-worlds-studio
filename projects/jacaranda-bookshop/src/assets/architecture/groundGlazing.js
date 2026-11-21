export function groundGlazing({ width, depth }) {
  return {
    frontWindows: [-width * 0.3, width * 0.3].map((x) => ({ x, y: 1.24, width: width * 0.25, height: 1.26 })),
    frontDoor: { x: 0, y: 1.015, width: width * 0.28, height: 1.72 },
    east: { x: -depth * 0.21, y: 1.31, width: depth * 0.58, height: 1.43 },
    west: { x: depth * 0.17, y: 1.30, width: 0.83, height: 0.75 },
    back: { x: width * 0.23, y: 1.40, width: 0.64, height: 0.41 },
  }
}
