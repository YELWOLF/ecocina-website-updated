/*
 * Elevation views — front (looking at the back wall, +Z faces camera) and
 * side (looking at the left wall, +X faces camera).
 *
 * For each elevation we project items whose *back edge* hits that wall,
 * stacked at their correct height. Wall cabinets float at WALL_MOUNT_CM.
 *
 * Two-column SVG, scaled to fit the column.
 */
import React, { useMemo } from 'react';
import { usePlan } from '../hooks/usePlan.jsx';
import { categoryColor, categoryStroke, WALL_MOUNT_CM } from '../utils/geometry.js';

const VIEW_W = 320;     // px
const VIEW_H = 220;     // px
const PADDING = 24;

export default function ElevationPlan() {
  const { state } = usePlan();
  const { plan } = state;

  const front = useMemo(() => buildElevation(plan, 'front'), [plan]);
  const side  = useMemo(() => buildElevation(plan, 'side'),  [plan]);

  return (
    <div className="elevations">
      <div className="elev-block">
        <div className="elev-title">Front Elevation</div>
        <ElevationSVG view={front}/>
      </div>
      <div className="elev-block">
        <div className="elev-title">Side Elevation</div>
        <ElevationSVG view={side}/>
      </div>
    </div>
  );
}

/*
 * Project items onto an axis-aligned wall. Each item becomes a 2D rect with
 * (xCm, yCm) bottom-left + (wCm, hCm) size, in the elevation's coordinate
 * system: x along the wall, y up from the floor.
 */
function buildElevation(plan, which) {
  const wallLength = which === 'front' ? plan.room.width : plan.room.depth;
  const ceiling    = plan.room.height;
  const rects = [];

  for (const it of plan.items) {
    // Width & X along wall depend on rotation: for a cabinet rotated 90°,
    // its "wall-facing" extent is its depth, not its width.
    const facingWidth = (it.rotation === 90 || it.rotation === 270) ? it.d : it.w;
    const xAlong = which === 'front' ? it.x : it.y;
    const yBottom = it.category === 'wall' ? WALL_MOUNT_CM : 0;
    const hHeight = it.h;

    rects.push({
      id: it.id,
      name: it.name,
      category: it.category,
      x: xAlong,
      y: yBottom,
      w: facingWidth,
      h: hHeight,
    });
  }

  return { wallLength, ceiling, rects };
}

function ElevationSVG({ view }) {
  const sx = (VIEW_W - PADDING * 2) / Math.max(view.wallLength, 1);
  const sy = (VIEW_H - PADDING * 2) / Math.max(view.ceiling,    1);
  const s  = Math.min(sx, sy);
  const ox = PADDING;
  const oy = VIEW_H - PADDING;        // svg Y grows down, we flip

  return (
    <svg width={VIEW_W} height={VIEW_H} className="elevation-svg">
      {/* floor */}
      <line x1={ox} y1={oy} x2={ox + view.wallLength * s} y2={oy}
            stroke="#2a2520" strokeWidth="2"/>
      {/* ceiling */}
      <line x1={ox} y1={oy - view.ceiling * s}
            x2={ox + view.wallLength * s} y2={oy - view.ceiling * s}
            stroke="#2a2520" strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>
      {/* items */}
      {view.rects.map(r => (
        <g key={r.id}>
          <rect
            x={ox + r.x * s}
            y={oy - (r.y + r.h) * s}
            width={r.w * s}
            height={r.h * s}
            fill={categoryColor(r.category)}
            stroke={categoryStroke(r.category)}
            strokeDasharray={r.category === 'wall' ? '4 2' : undefined}
          />
          {r.w * s > 28 && r.h * s > 14 && (
            <text x={ox + (r.x + r.w/2) * s}
                  y={oy - (r.y + r.h/2) * s + 3}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono" fontSize="9"
                  fill={categoryStroke(r.category)}>
              {r.name}
            </text>
          )}
        </g>
      ))}
      {/* wall length label */}
      <text x={ox + (view.wallLength * s)/2} y={VIEW_H - 6}
            textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="#6b635a">
        {Math.round(view.wallLength)} cm
      </text>
    </svg>
  );
}
