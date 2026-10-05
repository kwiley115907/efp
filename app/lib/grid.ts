import type { BlockedZone, DoorLike, Point, Wall } from "./plan-types";
import {
  distancePointToSegment,
  pointAtOffsetOnWall,
  pointInPolygon,
  wallPolygonPoints,
} from "./geometry";

export type GridData = {
  cells: number[][];
  cols: number;
  rows: number;
  resolution: number;
  planWidth: number;
  planHeight: number;
};

export function createGrid(
  planWidth: number,
  planHeight: number,
  resolution = 1
): GridData {
  const cols = Math.ceil(planWidth / resolution) + 1;
  const rows = Math.ceil(planHeight / resolution) + 1;

  return {
    cells: Array.from({ length: rows }, () => Array(cols).fill(0)),
    cols,
    rows,
    resolution,
    planWidth,
    planHeight,
  };
}

export function worldToGrid(grid: GridData, point: Point) {
  const gx = Math.max(0, Math.min(grid.cols - 1, Math.floor(point.x / grid.resolution)));
  const gy = Math.max(0, Math.min(grid.rows - 1, Math.floor(point.y / grid.resolution)));

  return { gx, gy };
}

export function gridToWorld(grid: GridData, gx: number, gy: number): Point {
  return {
    x: gx * grid.resolution + grid.resolution / 2,
    y: gy * grid.resolution + grid.resolution / 2,
  };
}

function setCell(grid: GridData, gx: number, gy: number, value: number) {
  if (gx < 0 || gy < 0 || gx >= grid.cols || gy >= grid.rows) return;
  grid.cells[gy][gx] = value;
}

export function rasterizePolygon(grid: GridData, polygon: Point[], value: number) {
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);

  const minX = Math.max(0, Math.min(...xs));
  const maxX = Math.min(grid.planWidth, Math.max(...xs));
  const minY = Math.max(0, Math.min(...ys));
  const maxY = Math.min(grid.planHeight, Math.max(...ys));

  const topLeft = worldToGrid(grid, { x: minX, y: minY });
  const bottomRight = worldToGrid(grid, { x: maxX, y: maxY });

  for (let gy = topLeft.gy; gy <= bottomRight.gy; gy++) {
    for (let gx = topLeft.gx; gx <= bottomRight.gx; gx++) {
      const center = gridToWorld(grid, gx, gy);
      if (pointInPolygon(center, polygon)) {
        setCell(grid, gx, gy, value);
      }
    }
  }
}

export function rasterizeSegment(
  grid: GridData,
  a: Point,
  b: Point,
  thickness: number,
  value: number
) {
  const minX = Math.max(0, Math.min(a.x, b.x) - thickness);
  const maxX = Math.min(grid.planWidth, Math.max(a.x, b.x) + thickness);
  const minY = Math.max(0, Math.min(a.y, b.y) - thickness);
  const maxY = Math.min(grid.planHeight, Math.max(a.y, b.y) + thickness);

  const topLeft = worldToGrid(grid, { x: minX, y: minY });
  const bottomRight = worldToGrid(grid, { x: maxX, y: maxY });

  for (let gy = topLeft.gy; gy <= bottomRight.gy; gy++) {
    for (let gx = topLeft.gx; gx <= bottomRight.gx; gx++) {
      const center = gridToWorld(grid, gx, gy);
      const d = distancePointToSegment(center, a, b);

      if (d <= thickness / 2) {
        setCell(grid, gx, gy, value);
      }
    }
  }
}

export function rasterizeBlockedZone(
  grid: GridData,
  zone: BlockedZone,
  value: number
) {
  const topLeft = worldToGrid(grid, { x: zone.x, y: zone.y });
  const bottomRight = worldToGrid(grid, {
    x: zone.x + zone.width,
    y: zone.y + zone.height,
  });

  for (let gy = topLeft.gy; gy <= bottomRight.gy; gy++) {
    for (let gx = topLeft.gx; gx <= bottomRight.gx; gx++) {
      setCell(grid, gx, gy, value);
    }
  }
}

function carveDoorGap(
  grid: GridData,
  wall: Wall,
  door: DoorLike,
  doorwayClearance: number
) {
  const gapStart = pointAtOffsetOnWall(wall, door.offset);
  const gapEnd = pointAtOffsetOnWall(wall, door.offset + door.width);

  rasterizeSegment(
    grid,
    gapStart,
    gapEnd,
    wall.thickness + doorwayClearance,
    0
  );
}

export function buildOccupancyGrid(params: {
  planWidth: number;
  planHeight: number;
  walls: Wall[];
  doors: DoorLike[];
  blockedZones?: BlockedZone[];
  resolution?: number;
  doorwayClearance?: number;
}) {
  const {
    planWidth,
    planHeight,
    walls,
    doors,
    blockedZones = [],
    resolution = 1,
    doorwayClearance = 0.75,
  } = params;

  const grid = createGrid(planWidth, planHeight, resolution);

  // 1 = blocked, 0 = walkable
  for (const wall of walls) {
    rasterizePolygon(grid, wallPolygonPoints(wall), 1);
  }

  for (const zone of blockedZones) {
    rasterizeBlockedZone(grid, zone, 1);
  }

  // Carve openings/doors back out of walls
  for (const door of doors) {
    const wall = walls.find((w) => w.id === door.wallId);
    if (!wall) continue;
    carveDoorGap(grid, wall, door, doorwayClearance);
  }

  return grid;
}
