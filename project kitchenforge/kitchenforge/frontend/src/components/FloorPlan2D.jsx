/*
 * Pure-SVG top-down floor plan editor.
 *
 * Why SVG and not Konva: the plan is < 100 nodes, redraws are cheap, and SVG
 * gives us zero-dependency PNG export via <img> + <canvas>. If perf ever
 * matters, swapping to Konva is mechanical.
 *
 * Coordinates: SVG is drawn at SCALE px/cm with a PADDING border so the
 * walls + dimension labels have room. eventToRoomCm() inverts the transform.
 */
import React, { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { usePlan } from '../hooks/usePlan.jsx';
import {
  categoryColor, categoryStroke, snapToWalls, clampToRoom, getCollisions,
} from '../utils/geometry.js';

const PADDING = 60;     // px

export default function FloorPlan2D() {
  const {
    state, addItem, moveItem, select, removeItem, rotateItem,
    duplicate, disarm, setError,
  } = usePlan();
  const { plan, selectedId, armedItem } = state;
  const collisions = getCollisions(plan.items);
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [scale, setScale] = useState(1.5);
  const [drag, setDrag] = useState(null);

  // Resize observer — keep the SVG fitting its container.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const availW = el.clientWidth - 80;
      const availH = el.clientHeight - 80;
      const sx = availW / (plan.room.width + 80);
      const sy = availH / (plan.room.depth + 80);
      setScale(Math.max(0.6, Math.min(sx, sy, 2.4)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [plan.room.width, plan.room.depth]);

  const cmToPx = useCallback((cm) => cm * scale, [scale]);

  const eventToRoomCm = useCallback((e) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - PADDING) / scale,
      y: (e.clientY - rect.top - PADDING) / scale,
    };
  }, [scale]);

  // Keyboard: R rotates, Del removes, Esc disarms/deselects, D duplicates.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') { disarm(); select(null); }
      if ((e.key === 'r' || e.key === 'R') && selectedId) rotateItem(selectedId);
      if ((e.key === 'd' || e.key === 'D') && selectedId) duplicate(selectedId);
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) removeItem(selectedId);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, rotateItem, duplicate, removeItem, disarm, select]);

  // Global mouse listeners for drag.
  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => {
      const pos = eventToRoomCm(e);
      const it = plan.items.find(i => i.id === drag.id);
      if (!it) return;
      let nx = pos.x - drag.offsetX;
      let ny = pos.y - drag.offsetY;
      const snapped = snapToWalls(nx, ny, it, plan.room, 8);
      const clamped = clampToRoom({ ...it, x: snapped.x, y: snapped.y }, plan.room);
      moveItem(it.id, clamped.x, clamped.y);
    };
    const onUp = () => setDrag(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag, plan.items, plan.room, moveItem, eventToRoomCm]);

  // Click on canvas: place armed item, or deselect on empty space.
  const onSvgClick = (e) => {
    if (armedItem) {
      const pos = eventToRoomCm(e);
      const it = armedItem;
      const x = Math.max(0, Math.min(plan.room.width  - it.w, pos.x - it.w / 2));
      const y = Math.max(0, Math.min(plan.room.depth  - it.d, pos.y - it.d / 2));
      const newItem = {
        name: it.name,
        category: it._cat,
        kind: it.kind ?? null,
        w: it.w, d: it.d, h: it.h,
        x, y, rotation: 0, material: 'oak',
        price: it.price ?? 0,
      };
      addItem(newItem);
      // Warn (but don't block) if the new placement would collide.
      const preview = [...plan.items, { ...newItem, id: '__preview__' }];
      if (getCollisions(preview).has('__preview__')) {
        setError('Overlapping cabinets — check placement.');
      }
      return;
    }
    if (e.target === svgRef.current || e.target.tagName === 'rect') {
      // Click on background (the floor rect) deselects.
      if (!e.target.closest('.item')) select(null);
    }
  };

  const onItemMouseDown = (e, it) => {
    e.stopPropagation();
    select(it.id);
    const start = eventToRoomCm(e);
    setDrag({ id: it.id, offsetX: start.x - it.x, offsetY: start.y - it.y });
  };

  const W = cmToPx(plan.room.width)  + PADDING * 2;
  const H = cmToPx(plan.room.depth)  + PADDING * 2;
  const wallT = cmToPx(10);
  const rx = PADDING, ry = PADDING;
  const rw = cmToPx(plan.room.width), rd = cmToPx(plan.room.depth);

  return (
    <div className="canvas-area" ref={containerRef}>
      <div className="canvas-pad">
        <svg
          ref={svgRef}
          className={`floorplan ${armedItem ? 'armed' : ''} ${drag ? 'dragging' : ''}`}
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          xmlns="http://www.w3.org/2000/svg"
          onClick={onSvgClick}
        >
          <defs>
            <pattern id="grid10" width={cmToPx(10)} height={cmToPx(10)} patternUnits="userSpaceOnUse">
              <path d={`M ${cmToPx(10)} 0 L 0 0 0 ${cmToPx(10)}`} fill="none" stroke="#ebe2c8" strokeWidth="0.5"/>
            </pattern>
            <pattern id="grid50" width={cmToPx(50)} height={cmToPx(50)} patternUnits="userSpaceOnUse">
              <path d={`M ${cmToPx(50)} 0 L 0 0 0 ${cmToPx(50)}`} fill="none" stroke="#d4c9a8" strokeWidth="0.8"/>
            </pattern>
          </defs>

          <rect x={rx} y={ry} width={rw} height={rd} fill="#fdfaf3"/>
          <rect x={rx} y={ry} width={rw} height={rd} fill="url(#grid10)"/>
          <rect x={rx} y={ry} width={rw} height={rd} fill="url(#grid50)"/>

          <rect x={rx - wallT} y={ry - wallT} width={rw + 2*wallT} height={wallT} fill="#2a2520"/>
          <rect x={rx - wallT} y={ry + rd}    width={rw + 2*wallT} height={wallT} fill="#2a2520"/>
          <rect x={rx - wallT} y={ry}         width={wallT} height={rd}           fill="#2a2520"/>
          <rect x={rx + rw}    y={ry}         width={wallT} height={rd}           fill="#2a2520"/>

          <text x={rx + rw/2} y={ry - wallT - 12} textAnchor="middle"
                fontFamily="JetBrains Mono" fontSize="11" fill="#6b635a">
            {plan.room.width} cm
          </text>
          <text x={rx - wallT - 14} y={ry + rd/2} textAnchor="middle"
                fontFamily="JetBrains Mono" fontSize="11" fill="#6b635a"
                transform={`rotate(-90 ${rx - wallT - 14} ${ry + rd/2})`}>
            {plan.room.depth} cm
          </text>

          {plan.items.map(it => (
            <ItemNode
              key={it.id}
              item={it}
              cmToPx={cmToPx}
              isSelected={it.id === selectedId}
              isColliding={collisions.has(it.id)}
              onMouseDown={(e) => onItemMouseDown(e, it)}
            />
          ))}
        </svg>
      </div>

      <div className="help-bar">
        <span><kbd>click</kbd> place</span>
        <span><kbd>drag</kbd> move</span>
        <span><kbd>R</kbd> rotate</span>
        <span><kbd>D</kbd> duplicate</span>
        <span><kbd>Del</kbd> remove</span>
        <span><kbd>Esc</kbd> deselect</span>
      </div>
    </div>
  );
}

function ItemNode({ item, cmToPx, isSelected, isColliding, onMouseDown }) {
  const x = PADDING + cmToPx(item.x);
  const y = PADDING + cmToPx(item.y);
  const w = cmToPx(item.w);
  const d = cmToPx(item.d);
  const cx = x + w / 2, cy = y + d / 2;
  const fill = isColliding ? '#f5c0b0' : categoryColor(item.category);
  const stroke = isSelected ? '#c45c3e' : isColliding ? '#c0392b' : categoryStroke(item.category);
  const strokeW = isSelected || isColliding ? 2 : 1;
  const dashed = item.category === 'wall';

  return (
    <g
      className="item"
      transform={`translate(${cx},${cy}) rotate(${item.rotation}) translate(${-w/2},${-d/2})`}
      style={{ cursor: 'grab' }}
      onMouseDown={onMouseDown}
    >
      <rect
        x={0} y={0} width={w} height={d}
        fill={fill} stroke={stroke} strokeWidth={strokeW}
        strokeDasharray={dashed ? '5 3' : undefined}
      />
      {/* Front edge marker */}
      <line x1={0} y1={d} x2={w} y2={d} stroke={categoryStroke(item.category)} strokeWidth="2.5"/>
      {/* Closed-unit diagonals */}
      {(item.category === 'base' || item.category === 'tall') && (
        <>
          <line x1={0} y1={0} x2={w} y2={d} stroke={categoryStroke(item.category)} strokeWidth="0.5" opacity="0.4"/>
          <line x1={0} y1={d} x2={w} y2={0} stroke={categoryStroke(item.category)} strokeWidth="0.5" opacity="0.4"/>
        </>
      )}
      <ApplianceIcon item={item} w={w} d={d}/>
      {w > 32 && d > 24 && (
        <text x={w/2} y={d/2 - 2} textAnchor="middle"
              fontFamily="JetBrains Mono" fontSize="9"
              fill={categoryStroke(item.category)} pointerEvents="none">
          {item.name}
        </text>
      )}
    </g>
  );
}

function ApplianceIcon({ item, w, d }) {
  const stroke = categoryStroke(item.category);
  if (item.kind === 'sink') {
    return (
      <>
        <rect x={w*0.12} y={d*0.15} width={w*0.76} height={d*0.7}
              fill="white" stroke={stroke} rx="3"/>
        <circle cx={w*0.5} cy={d*0.5} r={Math.min(w,d)*0.07} fill={stroke}/>
      </>
    );
  }
  if (item.kind === 'hob') {
    const rings = [[0.3,0.35],[0.7,0.35],[0.3,0.7],[0.7,0.7]];
    return (
      <>
        {rings.map(([px,py], i) => (
          <circle key={i} cx={w*px} cy={d*py} r={Math.min(w,d)*0.09}
                  fill="none" stroke={stroke} strokeWidth="1.2"/>
        ))}
      </>
    );
  }
  if (item.kind === 'dishwasher') {
    return <text x={w/2} y={d/2 + 12} textAnchor="middle"
                 fontFamily="JetBrains Mono" fontSize="11" fill={stroke}>DW</text>;
  }
  if (item.kind === 'fridge') {
    return <text x={w/2} y={d/2 + 12} textAnchor="middle"
                 fontFamily="JetBrains Mono" fontSize="11" fill={stroke}>REF</text>;
  }
  if (item.kind === 'oven-tower') {
    return <rect x={w*0.2} y={d*0.3} width={w*0.6} height={d*0.4}
                 fill="none" stroke={stroke} strokeWidth="1.2"/>;
  }
  return null;
}
