/*
 * Right-hand panel: when nothing is selected, shows quickstart hints.
 * When a cabinet is selected, shows editable W/D/H, X/Y, rotation,
 * material, plus Duplicate / Remove buttons.
 */
import React from 'react';
import { usePlan } from '../hooks/usePlan.jsx';

const MATERIALS = ['oak', 'walnut', 'white', 'black'];

export default function Properties() {
  const { selectedItem, updateItem, duplicate, removeItem } = usePlan();

  if (!selectedItem) {
    return (
      <aside className="properties">
        <div className="props-title">Plan</div>
        <div className="props-sub">KitchenForge MVP</div>
        <div className="empty-state">
          <div className="icon">⌂</div>
          <p>Select a cabinet from the library<br/>and click in the room to place it.</p>
        </div>
        <div className="prop-group">
          <div className="prop-label">Quick Start</div>
          <div className="quickstart">
            <strong>1.</strong> Set room size in the top bar<br/>
            <strong>2.</strong> Click a cabinet on the left<br/>
            <strong>3.</strong> Click in the room to place it<br/>
            <strong>4.</strong> Drag to move, <kbd>R</kbd> to rotate, <kbd>D</kbd> to duplicate
          </div>
        </div>
        <div className="prop-group">
          <div className="prop-label">Tip</div>
          <div className="quickstart" style={{ fontStyle: 'italic' }}>
            Cabinets snap to walls when within 8 cm.
          </div>
        </div>
      </aside>
    );
  }

  const it = selectedItem;
  const num = (k, v) => {
    const n = parseFloat(v);
    if (!isNaN(n)) updateItem(it.id, { [k]: n });
  };

  return (
    <aside className="properties">
      <div className="props-title">{it.name}</div>
      <div className="props-sub">{it.category}</div>

      <div className="prop-group">
        <div className="prop-label">Dimensions (cm)</div>
        <div className="prop-row">
          <input type="number" value={it.w} onChange={e => num('w', e.target.value)} min="20" max="200"/><span className="unit">W</span>
          <input type="number" value={it.d} onChange={e => num('d', e.target.value)} min="20" max="100"/><span className="unit">D</span>
          <input type="number" value={it.h} onChange={e => num('h', e.target.value)} min="20" max="240"/><span className="unit">H</span>
        </div>
      </div>

      <div className="prop-group">
        <div className="prop-label">Position (cm)</div>
        <div className="prop-row">
          <input type="number" value={Math.round(it.x)} onChange={e => num('x', e.target.value)}/><span className="unit">X</span>
          <input type="number" value={Math.round(it.y)} onChange={e => num('y', e.target.value)}/><span className="unit">Y</span>
        </div>
      </div>

      <div className="prop-group">
        <div className="prop-label">Rotation (deg)</div>
        <div className="prop-row">
          <input type="number" value={it.rotation} step="90"
                 onChange={e => updateItem(it.id, { rotation: ((parseInt(e.target.value) || 0) % 360 + 360) % 360 })}/>
          <span className="unit">°</span>
        </div>
      </div>

      <div className="prop-group">
        <div className="prop-label">Unit Price (€)</div>
        <div className="prop-row">
          <input type="number" value={it.price ?? 0} min="0" step="1"
                 onChange={e => num('price', e.target.value)}/>
          <span className="unit">€</span>
        </div>
      </div>

      <div className="prop-group">
        <div className="prop-label">Material</div>
        <div className="prop-row">
          <select value={it.material || 'oak'}
                  onChange={e => updateItem(it.id, { material: e.target.value })}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 12 }}>
            {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="prop-group">
        <div className="prop-row" style={{ gap: 8 }}>
          <button className="btn" style={{ flex: 1, padding: 10 }}
                  onClick={() => duplicate(it.id)}>Duplicate</button>
          <button className="btn danger-btn" style={{ flex: 1, width: 'auto' }}
                  onClick={() => removeItem(it.id)}>Remove</button>
        </div>
      </div>
    </aside>
  );
}
