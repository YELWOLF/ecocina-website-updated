import React, { useMemo } from 'react';
import { usePlan } from '../hooks/usePlan.jsx';

export default function QuotePanel() {
  const { state } = usePlan();
  const { items } = state.plan;

  // Aggregate by name + price for a cleaner quote table.
  const rows = useMemo(() => {
    const map = new Map();
    items.forEach(it => {
      const key = `${it.name}__${it.price ?? 0}`;
      if (map.has(key)) {
        map.get(key).qty += 1;
      } else {
        map.set(key, { name: it.name, unitPrice: it.price ?? 0, qty: 1 });
      }
    });
    return [...map.values()];
  }, [items]);

  const total = rows.reduce((s, r) => s + r.unitPrice * r.qty, 0);

  if (items.length === 0) return null;

  return (
    <div className="quote-panel">
      <div className="quote-title">Quote</div>
      <table className="quote-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit (€)</th>
            <th>Total (€)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.name}</td>
              <td>{r.qty}</td>
              <td>{r.unitPrice.toFixed(0)}</td>
              <td>{(r.unitPrice * r.qty).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}><strong>Grand Total</strong></td>
            <td><strong>€{total.toFixed(0)}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
