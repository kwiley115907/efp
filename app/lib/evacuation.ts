import type { DoorLike, Point, RoomLabel, RouteResult, Wall } from "./plan-types";
import { midpoint, pointAtOffsetOnWall } from "./geometry";
import { GridData } from "./grid";
import { compressPath, findPathOnGrid } from "./pathfinding";

type ExitTarget = {
  label: string;
  point: Point;
};

const EXIT_REGEX = /(exit|egress|gate|beach access)/i;

export function detectExitTargets(params: {
  doors: DoorLike[];
  walls: Wall[];
  roomLabels: RoomLabel[];
}): ExitTarget[] {
  const { doors, walls, roomLabels } = params;

  const labelBasedTargets: ExitTarget[] = roomLabels
    .filter((label) => EXIT_REGEX.test(label.text))
    .map((label) => ({
      label: label.text,
      point: { x: label.x, y: label.y },
    }));

  const openingBasedTargets: ExitTarget[] = doors
    .filter((door) => EXIT_REGEX.test(door.label ?? ""))
    .map((door) => {
      const wall = walls.find((w) => w.id === door.wallId);
      if (!wall) return null;

      const a = pointAtOffsetOnWall(wall, door.offset);
      const b = pointAtOffsetOnWall(wall, door.offset + door.width);

      return {
        label: door.label || `Exit ${door.id}`,
        point: midpoint(a, b),
      };
    })
    .filter((target): target is ExitTarget => target !== null);

  const merged = [...labelBasedTargets, ...openingBasedTargets];

  const deduped: ExitTarget[] = [];
  const seen = new Set<string>();

  for (const target of merged) {
    const k = `${Math.round(target.point.x)}-${Math.round(target.point.y)}-${target.label}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(target);
  }

  return deduped;
}

export function calculateTravelDistance(path: Point[]): number {
  let total = 0;

  for (let i = 1; i < path.length; i++) {
    total += Math.hypot(
      path[i].x - path[i - 1].x,
      path[i].y - path[i - 1].y
    );
  }

  return total;
}

export function generateRoutes(params: {
  start: Point;
  exits: ExitTarget[];
  grid: GridData;
  maxRoutes?: number;
}): RouteResult[] {
  const { start, exits, grid, maxRoutes = 3 } = params;

  const routes: RouteResult[] = [];

  for (const exit of exits) {
    const rawPath = findPathOnGrid(grid, start, exit.point);
    if (!rawPath.length) continue;

    const simplified = compressPath(rawPath);

    routes.push({
      exitLabel: exit.label,
      path: simplified,
      distance: calculateTravelDistance(simplified),
    });
  }

  return routes.sort((a, b) => a.distance - b.distance).slice(0, maxRoutes);
}
