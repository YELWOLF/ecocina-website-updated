"""
Convert a Plan into a renderable scene description for the frontend.

We don't ship Three.js BufferGeometry from the server — instead we send a
*scene description* (a list of nodes with position/rotation/size/material)
and the frontend builds Three.js meshes from that. This keeps the wire
format human-readable, debuggable, and tiny.

Coordinate convention:
  - Plan stores items in centimeters with origin at the top-left of the room
    (x = right, y = down) -- a 2D top-down convention.
  - Three.js scene uses meters with Y as up. We convert here:
      scene_x = (plan_x + w/2 - room_w/2) / 100   # center on origin
      scene_z = (plan_y + d/2 - room_d/2) / 100
      scene_y = h/2                                # base sits on floor
  - Wall cabinets float at floor + 140 cm (a sensible default mounting height).
"""

from typing import Dict, Any, List
from models import Plan, Cabinet


WALL_CABINET_MOUNT_HEIGHT_CM = 140.0   # bottom edge of wall cabinet above floor


def _node_for_cabinet(cab: Cabinet, room_w: float, room_d: float) -> Dict[str, Any]:
    # cm -> m
    w_m = cab.w / 100.0
    d_m = cab.d / 100.0
    h_m = cab.h / 100.0

    # center of cabinet's footprint, in scene coords (room centered at origin)
    cx_m = (cab.x + cab.w / 2.0 - room_w / 2.0) / 100.0
    cz_m = (cab.y + cab.d / 2.0 - room_d / 2.0) / 100.0

    if cab.category == "wall":
        cy_m = (WALL_CABINET_MOUNT_HEIGHT_CM + cab.h / 2.0) / 100.0
    else:
        cy_m = h_m / 2.0

    return {
        "id": cab.id,
        "name": cab.name,
        "category": cab.category,
        "kind": cab.kind,
        "material": cab.material,
        "size": {"w": w_m, "d": d_m, "h": h_m},
        "position": {"x": cx_m, "y": cy_m, "z": cz_m},
        "rotationY": cab.rotation,   # degrees, around Y axis
    }


def plan_to_scene(plan: Plan) -> Dict[str, Any]:
    """Return scene description: room dims (m) + list of node descriptors."""
    rw = plan.room.width
    rd = plan.room.depth
    rh = plan.room.height
    nodes: List[Dict[str, Any]] = [
        _node_for_cabinet(c, rw, rd) for c in plan.items
    ]
    return {
        "room": {
            "width": rw / 100.0,
            "depth": rd / 100.0,
            "height": rh / 100.0,
        },
        "nodes": nodes,
    }
