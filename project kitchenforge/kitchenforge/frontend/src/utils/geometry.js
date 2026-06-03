// Client-side helpers shared by 2D, 3D, and elevation views.
// Plan stores cm with origin at the room's top-left corner (Y goes down).

export const WALL_MOUNT_CM = 140;   // bottom of wall cabinets above floor

export function makeId() {
  // crypto.randomUUID is supported in all evergreen browsers.
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function clampToRoom(item, room) {
  return {
    x: Math.max(0, Math.min(room.width - item.w, item.x)),
    y: Math.max(0, Math.min(room.depth - item.d, item.y)),
  };
}

// Snap a (free) x/y to walls within `snap` cm of an edge.
export function snapToWalls(x, y, item, room, snap = 8) {
  if (Math.abs(x) < snap) x = 0;
  if (Math.abs(y) < snap) y = 0;
  if (Math.abs(room.width - (x + item.w)) < snap) x = room.width - item.w;
  if (Math.abs(room.depth - (y + item.d)) < snap) y = room.depth - item.d;
  return { x, y };
}

// Returns the axis-aligned bounding box in room coordinates, accounting for rotation.
export function getAABB(item) {
  // For 90/270 rotation the footprint width and depth swap.
  const rotated = item.rotation === 90 || item.rotation === 270;
  const w = rotated ? item.d : item.w;
  const d = rotated ? item.w : item.d;
  return { x1: item.x, y1: item.y, x2: item.x + w, y2: item.y + d };
}

// Returns true when two AABBs overlap (1 cm tolerance allows flush placement).
function overlaps(a, b, tol = 1) {
  return a.x1 < b.x2 - tol && a.x2 > b.x1 + tol &&
         a.y1 < b.y2 - tol && a.y2 > b.y1 + tol;
}

// Returns a Set of item ids that overlap at least one other item.
export function getCollisions(items) {
  const boxes = items.map(it => ({ id: it.id, box: getAABB(it) }));
  const colliding = new Set();
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (overlaps(boxes[i].box, boxes[j].box)) {
        colliding.add(boxes[i].id);
        colliding.add(boxes[j].id);
      }
    }
  }
  return colliding;
}

export function categoryColor(category) {
  return {
    base:      '#e8dfc9',
    wall:      '#f0e9d6',
    tall:      '#d4c8a8',
    appliance: '#aac4d1',
  }[category] || '#cccccc';
}

export function categoryStroke(category) {
  return {
    base:      '#9c8e6b',
    wall:      '#9c8e6b',
    tall:      '#7a6f50',
    appliance: '#5a7a8a',
  }[category] || '#666';
}
