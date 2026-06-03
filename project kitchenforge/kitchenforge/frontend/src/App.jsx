/*
 * Top-level layout. Three columns: library | editor+3D+elevations | properties.
 *
 * On first mount we GET /api/catalog and POST /api/plans to create an empty
 * plan on the server. After that, we don't sync to the server on every
 * keystroke (would be overkill); Save explicitly PUTs the plan, Load fetches
 * a JSON file the user picks. Export goes through the backend for PDF and
 * stays client-side for PNG.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import jsPDF from 'jspdf';
import { usePlan } from './hooks/usePlan.jsx';
import { api } from './utils/api.js';
import CabinetLibrary from './components/CabinetLibrary.jsx';
import FloorPlan2D from './components/FloorPlan2D.jsx';
import Viewer3D from './components/Viewer3D.jsx';
import ElevationPlan from './components/ElevationPlan.jsx';
import Properties from './components/Properties.jsx';
import QuotePanel from './components/QuotePanel.jsx';

export default function App() {
  const { state, setCatalog, setPlan, setRoom, setError, undo, redo, canUndo, canRedo } = usePlan();
  const { plan, catalog } = state;
  const fileInputRef = useRef(null);

  // Undo/redo keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  }, [undo, redo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Bootstrap: catalog + create a new plan on the server.
  useEffect(() => {
    (async () => {
      try {
        const cat = await api.catalog();
        setCatalog(cat);
        const created = await api.createPlan({ name: 'Untitled Plan' });
        setPlan({
          id: created.id,
          name: created.name,
          room: created.room,
          items: created.items,
        });
      } catch (e) {
        setError(e.message);
        console.error(e);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPrice = plan.items.reduce((s, i) => s + (i.price ?? 0), 0);

  const totalRunCm = plan.items
    .filter(i => i.category === 'base' || i.category === 'tall' ||
                 (i.category === 'appliance' && i.kind !== 'sink'))
    .reduce((s, i) => s + i.w, 0);

  const onSave = async () => {
    if (!plan.id) return;
    try {
      await api.updatePlan(plan.id, plan);
      // Also offer a JSON download for portable backup.
      const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${plan.name.replace(/\s+/g, '_')}.json`;
      a.click();
    } catch (e) { setError(e.message); }
  };

  const onLoad = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        // Push to backend so subsequent saves/exports work, then mirror to UI.
        const created = await api.createPlan(data);
        setPlan({
          id: created.id,
          name: created.name,
          room: created.room,
          items: created.items,
        });
      } catch (err) { setError(err.message); }
    };
    reader.readAsText(file);
    e.target.value = '';   // allow re-loading the same file later
  };

  const onExportPNG = () => {
    const svg = document.querySelector('svg.floorplan');
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const w = svg.width.baseVal.value, h = svg.height.baseVal.value;
      c.width = w * 2; c.height = h * 2;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fdfaf3'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.scale(2, 2); ctx.drawImage(img, 0, 0);
      c.toBlob(b => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = `${plan.name.replace(/\s+/g, '_')}.png`;
        a.click();
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const onExportPDF = async () => {
    if (!plan.id) return;
    // Persist current state first so the server PDF reflects what's on screen.
    try {
      await api.updatePlan(plan.id, plan);
      window.open(api.exportPdfUrl(plan.id), '_blank');
    } catch (e) {
      // Fallback: client-side PDF via jsPDF if server is unreachable.
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      doc.setFontSize(16);
      doc.text(`KitchenForge — ${plan.name}`, 40, 40);
      doc.setFontSize(10);
      doc.text(`Items: ${plan.items.length}`, 40, 60);
      let y = 90;
      plan.items.forEach((it, i) => {
        doc.text(`${i + 1}. ${it.name} (${it.category}) ${it.w}×${it.d}×${it.h} @ (${Math.round(it.x)},${Math.round(it.y)})`, 40, y);
        y += 14;
      });
      doc.save(`${plan.name.replace(/\s+/g, '_')}.pdf`);
    }
  };

  if (!catalog) {
    return <div className="boot">Loading KitchenForge…</div>;
  }

  return (
    <div className="app">
      <header>
        <div className="logo">Kitchen<em>Forge</em></div>

        <div className="room-controls">
          <span>Room</span>
          <input type="number" value={plan.room.width} min="100" max="1200" step="10"
                 onChange={e => setRoom({ width: parseInt(e.target.value) || 100 })}/>
          <span>×</span>
          <input type="number" value={plan.room.depth} min="100" max="1200" step="10"
                 onChange={e => setRoom({ depth: parseInt(e.target.value) || 100 })}/>
          <span>×</span>
          <input type="number" value={plan.room.height} min="200" max="400" step="10"
                 onChange={e => setRoom({ height: parseInt(e.target.value) || 270 })}/>
          <span style={{ fontFamily: 'var(--mono)', textTransform: 'none' }}>cm</span>
        </div>

        <div className="stats">
          <span><strong>{plan.items.length}</strong> items</span>
          <span><strong>{totalRunCm}</strong> cm of run</span>
          <span><strong>€{totalPrice.toFixed(0)}</strong></span>
        </div>

        <div className="actions">
          <button className="btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">↩</button>
          <button className="btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">↪</button>
          <button className="btn" onClick={onExportPNG}>PNG</button>
          <button className="btn" onClick={onExportPDF}>PDF</button>
          <button className="btn" onClick={onSave}>Save</button>
          <button className="btn primary" onClick={() => fileInputRef.current?.click()}>Load</button>
          <input ref={fileInputRef} type="file" accept=".json" hidden onChange={onLoad}/>
        </div>
      </header>

      <div className="workspace">
        <CabinetLibrary />

        <div className="center-stack">
          <div className="center-top">
            <FloorPlan2D />
            <Viewer3D />
          </div>
          <ElevationPlan />
          <QuotePanel />
        </div>

        <Properties />
      </div>

      {state.error && (
        <div className="toast error" onClick={() => setError(null)}>
          {state.error} (click to dismiss)
        </div>
      )}
    </div>
  );
}
