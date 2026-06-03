# KitchenForge MVP

Web-based kitchen design tool — 2D floor plan editor + real-time 3D viewer +
front/side elevations + PDF/PNG/JSON export.

Stack: **Flask** backend, **React 18 + Vite** frontend, **Three.js** for 3D,
**reportlab** for server-side PDF.

```
kitchenforge/
├── backend/        # Flask API (port 5000)
└── frontend/       # React + Vite (port 3000, proxies /api -> 5000)
```

## Running it (Windows / PowerShell)

### 1. Backend — one-time setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Backend — run

```powershell
# from backend/, with venv activated
python run.py
# -> http://localhost:5000/api/health  =>  {"status":"ok"}
```

### 3. Frontend — one-time setup

In a **second terminal**:

```powershell
cd frontend
npm install
```

### 4. Frontend — run

```powershell
npm run dev
# -> http://localhost:3000
```

Open `http://localhost:3000` and you should see the planner.

## Using it

1. Set room dimensions in the top bar (W × D × H, all cm).
2. Click any cabinet in the **left sidebar** to "arm" it.
3. Click in the room to place it. Drag to move.
4. Keyboard: `R` rotate · `D` duplicate · `Del` remove · `Esc` deselect.
5. Watch the 3D viewer update in real time.
6. Front/Side elevations render below — they reflect cabinets along each wall.
7. **PNG** — exports the 2D floor plan as a high-DPI image.
   **PDF** — exports a one-page PDF with floor plan + item list (server).
   **Save** — writes a JSON file you can re-load later.
   **Load** — pick a previously saved JSON.

## API quick reference

| Method | Path | Purpose |
|--------|------|---------|
| GET    | `/api/health`                  | Sanity check |
| GET    | `/api/catalog`                 | Cabinet/appliance catalog |
| POST   | `/api/plans`                   | Create a plan |
| GET    | `/api/plans/<id>`              | Get plan |
| PUT    | `/api/plans/<id>`              | Update plan |
| DELETE | `/api/plans/<id>`              | Delete plan |
| GET    | `/api/plans/<id>/3d-geometry`  | Scene description for 3D viewer |
| POST   | `/api/plans/<id>/export`       | Returns a PDF |

## Architectural notes

- **All measurements in cm** until the very last moment when Three.js needs
  meters; the conversion lives in `geometry.py` (server) and `Viewer3D.jsx`
  (client).
- **Plans live in memory** on the backend. Restart wipes them. Swap the
  `PLANS` dict in `app.py` for SQLite/Postgres when you outgrow this.
- **The catalog is data, not behavior.** Edit `backend/catalog.py` to add
  cabinets — the frontend picks them up on next reload.
- **Three.js scene is rebuilt on every items change.** That's fine for
  < 100 cabinets. Add a diff layer when you exceed that.
- **2D ↔ 3D ↔ Elevations** all read the same plan from `usePlan()`. Adding a
  fourth view is just another component.

## Next steps (Stage 2 ideas)

- Replace catalog with your own pricing nomenclature → live quote panel.
- Doors & windows on walls, with cutouts in 3D.
- Corner cabinets (L-shaped footprint).
- Material library with real PBR textures.
- Path-traced renders via `three-gpu-pathtracer`.
- Persist plans in SQLite.
