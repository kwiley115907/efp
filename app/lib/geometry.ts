import type { Point, Wall } from "./plan-types";

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function midpoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

export function normalizeVector(a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;

  return {
    ux: dx / len,
    uy: dy / len,
    len,
  };
}

export function pointAtOffsetOnWall(wall: Wall, offset: number): Point {
  const { ux, uy } = normalizeVector(wall.start, wall.end);

  return {
    x: wall.start.x + ux * offset,
    y: wall.start.y + uy * offset,
  };
}

export function wallPolygonPoints(wall: Wall): Point[] {
  const { ux, uy } = normalizeVector(wall.start, wall.end);
  const px = -uy;
  const py = ux;
  const half = wall.thickness / 2;

  return [
    { x: wall.start.x + px * half, y: wall.start.y + py * half },
    { x: wall.end.x + px * half, y: wall.end.y + py * half },
    { x: wall.end.x - px * half, y: wall.end.y - py * half },
    { x: wall.start.x - px * half, y: wall.start.y - py * half },
  ];
}

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 1e-9) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function distancePointToSegment(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const abLenSq = abx * abx + aby * aby || 1;

  let t = (apx * abx + apy * aby) / abLenSq;
  t = Math.max(0, Math.min(1, t));

  const closest = {
    x: a.x + abx * t,
    y: a.y + aby * t,
  };

  return distance(p, closest);
}
