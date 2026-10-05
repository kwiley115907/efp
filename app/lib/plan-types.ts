export type Point = {
  x: number;
  y: number;
};

export type Wall = {
  id: number;
  start: Point;
  end: Point;
  thickness: number;
  label?: string;
};

export type DoorLike = {
  id: number;
  wallId: number;
  offset: number;
  width: number;
  kind: "door" | "opening";
  hingeSide: "start" | "end";
  swingDirection: "left" | "right";
  inward: boolean;
  label?: string;
};

export type RoomLabel = {
  id: number;
  x: number;
  y: number;
  text: string;
};

export type BlockedZone = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
};

export type RouteResult = {
  exitLabel: string;
  path: Point[];
  distance: number;
};
