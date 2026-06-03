/*
 * Sidebar showing all catalog items grouped by category. Clicking an item
 * "arms" it — the next click in the floor plan places it.
 */
import React from 'react';
import { usePlan } from '../hooks/usePlan.jsx';

export default function CabinetLibrary() {
  const { state, arm } = usePlan();
  const { catalog, armedItem } = state;

  if (!catalog) {
    return (
      <aside className="library">
        <div className="cat-title">Loading…</div>
      </aside>
    );
  }

  return (
    <aside className="library">
      {Object.entries(catalog).map(([catKey, cat]) => (
        <div key={catKey}>
          <div className="cat-title">{cat.label}</div>
          <div className="cat-items">
            {cat.items.map(item => {
              const isArmed = armedItem &&
                              armedItem.name === item.name &&
                              armedItem._cat === catKey;
              return (
                <button
                  key={item.name}
                  className={`lib-item ${catKey} ${isArmed ? 'armed' : ''}`}
                  onClick={() => arm({ ...item, _cat: catKey })}
                  type="button"
                >
                  <div className="preview" />
                  <div className="label">{item.name}</div>
                  <div className="dims">{item.w}×{item.d}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
