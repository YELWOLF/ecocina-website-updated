"""
KitchenForge Flask API.
"""

from io import BytesIO

from flask import Flask, jsonify, request, send_file, abort
from flask_cors import CORS

from catalog import get_catalog
from models import Plan
from geometry import plan_to_scene
import db

# PDF export — reportlab is light, has no native deps, and renders crisp vectors.
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm as RL_CM
from reportlab.pdfgen import canvas as rl_canvas


app = Flask(__name__)
CORS(app)

db.init_db()


# ---------- health & catalog ------------------------------------------------

@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/api/catalog")
def catalog():
    return jsonify(get_catalog())


# ---------- plans -----------------------------------------------------------

@app.post("/api/plans")
def create_plan():
    data = request.get_json(silent=True) or {}
    plan = Plan.from_dict(data) if data else Plan()
    db.save_plan(plan)
    return jsonify(plan.to_dict()), 201


@app.get("/api/plans")
def list_plans():
    return jsonify([p.to_dict() for p in db.list_plans()])


@app.get("/api/plans/<plan_id>")
def get_plan(plan_id):
    plan = db.get_plan(plan_id)
    if not plan:
        abort(404)
    return jsonify(plan.to_dict())


@app.put("/api/plans/<plan_id>")
def update_plan(plan_id):
    existing = db.get_plan(plan_id)
    if not existing:
        abort(404)
    data = request.get_json(silent=True) or {}
    data["id"] = plan_id
    data["created_at"] = existing.created_at
    plan = Plan.from_dict(data)
    plan.touch()
    db.save_plan(plan)
    return jsonify(plan.to_dict())


@app.delete("/api/plans/<plan_id>")
def delete_plan_route(plan_id):
    if not db.delete_plan(plan_id):
        abort(404)
    return ("", 204)


# ---------- 3D geometry -----------------------------------------------------

@app.get("/api/plans/<plan_id>/3d-geometry")
def plan_geometry(plan_id):
    plan = db.get_plan(plan_id)
    if not plan:
        abort(404)
    return jsonify(plan_to_scene(plan))


# ---------- PDF export ------------------------------------------------------

@app.post("/api/plans/<plan_id>/export")
def export_plan(plan_id):
    """Generate a one-page PDF with the floor plan + an item list."""
    plan = db.get_plan(plan_id)
    if not plan:
        abort(404)

    buf = BytesIO()
    page = landscape(A4)
    c = rl_canvas.Canvas(buf, pagesize=page)
    page_w, page_h = page

    # --- Title ---
    c.setFont("Helvetica-Bold", 18)
    c.drawString(2 * RL_CM, page_h - 1.6 * RL_CM, f"KitchenForge — {plan.name}")
    c.setFont("Helvetica", 9)
    c.drawString(2 * RL_CM, page_h - 2.1 * RL_CM,
                 f"Room: {plan.room.width:.0f} × {plan.room.depth:.0f} × {plan.room.height:.0f} cm   "
                 f"·   Items: {len(plan.items)}")

    # --- Floor plan area ---
    margin_x = 2 * RL_CM
    margin_top = 3 * RL_CM
    avail_w = page_w / 2 - 1.5 * margin_x
    avail_h = page_h - margin_top - 2 * RL_CM
    scale = min(avail_w / plan.room.width, avail_h / plan.room.depth)

    origin_x = margin_x
    origin_y = page_h - margin_top - plan.room.depth * scale

    # walls
    c.setStrokeColorRGB(0, 0, 0)
    c.setLineWidth(2)
    c.rect(origin_x, origin_y, plan.room.width * scale, plan.room.depth * scale, stroke=1, fill=0)

    # items
    cat_fill = {
        "base":      (0.91, 0.87, 0.79),
        "wall":      (0.94, 0.91, 0.84),
        "tall":      (0.83, 0.78, 0.66),
        "appliance": (0.67, 0.77, 0.82),
    }
    c.setLineWidth(0.6)
    for it in plan.items:
        ix = origin_x + it.x * scale
        # PDF Y axis is bottom-up, plan Y is top-down — flip:
        iy = origin_y + (plan.room.depth - it.y - it.d) * scale
        iw = it.w * scale
        ih = it.d * scale
        r, g, b = cat_fill.get(it.category, (0.85, 0.85, 0.85))
        c.setFillColorRGB(r, g, b)
        c.setStrokeColorRGB(0.3, 0.3, 0.3)
        c.rect(ix, iy, iw, ih, stroke=1, fill=1)
        c.setFillColorRGB(0.15, 0.15, 0.15)
        c.setFont("Helvetica", 6)
        c.drawCentredString(ix + iw / 2, iy + ih / 2 - 2, it.name)

    # --- Item list (right half) ---
    list_x = page_w / 2 + 0.5 * RL_CM
    list_y = page_h - margin_top
    c.setFillColorRGB(0, 0, 0)
    total_price = sum(it.price for it in plan.items)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(list_x, list_y, "Item list")
    list_y -= 0.6 * RL_CM
    c.setFont("Helvetica", 9)
    c.drawString(list_x, list_y, "#   Code           Cat          W × D × H        Price (€)")
    list_y -= 0.4 * RL_CM
    c.line(list_x, list_y, list_x + 13 * RL_CM, list_y)
    list_y -= 0.4 * RL_CM
    for i, it in enumerate(plan.items, 1):
        if list_y < 1.5 * RL_CM:
            c.showPage()
            list_y = page_h - margin_top
            c.setFont("Helvetica", 9)
        line = (f"{i:<3} {it.name:<13} {it.category:<10} "
                f"{int(it.w)}×{int(it.d)}×{int(it.h)} cm   "
                f"€{it.price:.0f}")
        c.drawString(list_x, list_y, line)
        list_y -= 0.4 * RL_CM
    list_y -= 0.2 * RL_CM
    c.line(list_x, list_y, list_x + 13 * RL_CM, list_y)
    list_y -= 0.4 * RL_CM
    c.setFont("Helvetica-Bold", 9)
    c.drawString(list_x, list_y, f"Grand Total: €{total_price:.0f}")

    c.showPage()
    c.save()
    buf.seek(0)
    return send_file(
        buf,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"{plan.name.replace(' ', '_')}.pdf",
    )


# ---------- error handlers --------------------------------------------------

@app.errorhandler(404)
def not_found(_e):
    return jsonify({"error": "not found"}), 404


if __name__ == "__main__":
    # Use run.py for the dev server. This block is here for `python app.py` too.
    app.run(host="0.0.0.0", port=5000, debug=True)
