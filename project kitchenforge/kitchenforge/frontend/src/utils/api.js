// Thin wrapper over fetch. Vite dev server proxies /api -> localhost:5000.
const BASE = '/api';

async function jfetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health:      ()         => jfetch('/health'),
  catalog:     ()         => jfetch('/catalog'),
  createPlan:  (plan)     => jfetch('/plans',           { method: 'POST',   body: JSON.stringify(plan || {}) }),
  getPlan:     (id)       => jfetch(`/plans/${id}`),
  updatePlan:  (id, plan) => jfetch(`/plans/${id}`,     { method: 'PUT',    body: JSON.stringify(plan) }),
  deletePlan:  (id)       => jfetch(`/plans/${id}`,     { method: 'DELETE' }),
  geometry:    (id)       => jfetch(`/plans/${id}/3d-geometry`),
  exportPdfUrl: (id)      => `${BASE}/plans/${id}/export`,
};
