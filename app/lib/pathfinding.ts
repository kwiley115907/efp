import type { Point } from "./plan-types";
import { GridData, gridToWorld, worldToGrid } from "./grid";

type GridCell = {
  gx: number;
  gy: number;
};

type OpenNode = {
  gx: number;
  gy: number;
  g: number;
  h: number;
  f: number;
  parentKey?: string;
};

function key(gx: number, gy: number) {
  return `${gx},${gy}`;
}

function heuristic(a: GridCell, b: GridCell) {
  return Math.hypot(b.gx - a.gx, b.gy - a.gy);
}

function inBounds(grid: GridData, gx: number, gy: number) {
  return gx >= 0 && gy >= 0 && gx < grid.cols && gy < grid.rows;
}

function isWalkable(grid: GridData, gx: number, gy: number) {
  return inBounds(grid, gx, gy) && grid.cells[gy][gx] === 0;
}

function canMoveDiagonal(
  grid: GridData,
  current: GridCell,
  next: GridCell
) {
  const dx = next.gx - current.gx;
  const dy = next.gy - current.gy;

  if (Math.abs(dx) !== 1 || Math.abs(dy) !== 1) {
    return true;
  }

  // Prevent corner cutting through blocked cells
  const sideA = isWalkable(grid, current.gx + dx, current.gy);
  const sideB = isWalkable(grid, current.gx, current.gy + dy);

  return sideA && sideB;
}

export function findClosestWalkableCell(
  grid: GridData,
  point: Point,
  maxRadiusFeet = 20
): GridCell | null {
  const start = worldToGrid(grid, point);

  if (isWalkable(grid, start.gx, start.gy)) {
    return start;
  }

  const maxRadiusCells = Math.max(
    1,
    Math.ceil(maxRadiusFeet / grid.resolution)
  );

  for (let r = 1; r <= maxRadiusCells; r++) {
    for (let gy = start.gy - r; gy <= start.gy + r; gy++) {
      for (let gx = start.gx - r; gx <= start.gx + r; gx++) {
        const onPerimeter =
          gy === start.gy - r ||
          gy === start.gy + r ||
          gx === start.gx - r ||
          gx === start.gx + r;

        if (!onPerimeter) continue;
        if (!isWalkable(grid, gx, gy)) continue;

        return { gx, gy };
      }
    }
  }

  return null;
}

export function findPathOnGrid(
  grid: GridData,
  startWorld: Point,
  endWorld: Point
): Point[] {
  const start = findClosestWalkableCell(grid, startWorld);
  const end = findClosestWalkableCell(grid, endWorld);

  if (!start || !end) {
    return [];
  }

  const open = new Map<string, OpenNode>();
  const closed = new Set<string>();
  const parents = new Map<string, string>();

  const startKey = key(start.gx, start.gy);
  open.set(startKey, {
    gx: start.gx,
    gy: start.gy,
    g: 0,
    h: heuristic(start, end),
    f: heuristic(start, end),
  });

  const directions = [
    { dx: 1, dy: 0, cost: 1 },
    { dx: -1, dy: 0, cost: 1 },
    { dx: 0, dy: 1, cost: 1 },
    { dx: 0, dy: -1, cost: 1 },
    { dx: 1, dy: 1, cost: Math.SQRT2 },
    { dx: -1, dy: 1, cost: Math.SQRT2 },
    { dx: 1, dy: -1, cost: Math.SQRT2 },
    { dx: -1, dy: -1, cost: Math.SQRT2 },
  ];

  while (open.size > 0) {
    let current: OpenNode | null = null;

    for (const node of open.values()) {
      if (!current || node.f < current.f) {
        current = node;
      }
    }

    if (!current) break;

    const currentKey = key(current.gx, current.gy);

    if (current.gx === end.gx && current.gy === end.gy) {
      const path: Point[] = [];
      let walkKey: string | undefined = currentKey;

      while (walkKey) {
        const [gxRaw, gyRaw] = walkKey.split(",");
        const gx = Number(gxRaw);
        const gy = Number(gyRaw);
        path.push(gridToWorld(grid, gx, gy));
        walkKey = parents.get(walkKey);
      }

      return path.reverse();
    }

    open.delete(currentKey);
    closed.add(currentKey);

    for (const dir of directions) {
      const next = {
        gx: current.gx + dir.dx,
        gy: current.gy + dir.dy,
      };

      const nextKey = key(next.gx, next.gy);

      if (!isWalkable(grid, next.gx, next.gy)) continue;
      if (!canMoveDiagonal(grid, current, next)) continue;
      if (closed.has(nextKey)) continue;

      const tentativeG = current.g + dir.cost;
      const existing = open.get(nextKey);

      if (!existing || tentativeG < existing.g) {
        const h = heuristic(next, end);
        open.set(nextKey, {
          gx: next.gx,
          gy: next.gy,
          g: tentativeG,
          h,
          f: tentativeG + h,
        });
        parents.set(nextKey, currentKey);
      }
    }
  }

  return [];
}

export function compressPath(path: Point[]): Point[] {
  if (path.length <= 2) return path;

  const out: Point[] = [path[0]];

  for (let i = 1; i < path.length - 1; i++) {
    const prev = out[out.length - 1];
    const curr = path[i];
    const next = path[i + 1];

    const ax = curr.x - prev.x;
    const ay = curr.y - prev.y;
    const bx = next.x - curr.x;
    const by = next.y - curr.y;

    const cross = ax * by - ay * bx;

    if (Math.abs(cross) > 1e-6) {
      out.push(curr);
    }
  }

  out.push(path[path.length - 1]);
  return out;
}
