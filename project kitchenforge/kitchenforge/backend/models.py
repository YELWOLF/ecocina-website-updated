"""
Data classes for Plan and Cabinet.

Why dataclasses + dict round-trip rather than SQLAlchemy: the MVP stores plans
in memory (a dict keyed by UUID). Once you move to persistence, swap the
PLANS dict in app.py for SQLAlchemy without changing this file.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import uuid


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class Cabinet:
    name: str
    category: str           # "base" | "wall" | "tall" | "appliance"
    w: float                # cm
    d: float                # cm
    h: float                # cm
    x: float = 0.0          # cm, top-left corner inside room
    y: float = 0.0          # cm
    rotation: int = 0       # 0 | 90 | 180 | 270
    material: str = "oak"
    kind: Optional[str] = None    # "sink" | "hob" | "dishwasher" | "fridge" | "oven-tower"
    price: float = 0.0           # unit price in EUR (catalog default, overridable per instance)
    id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Cabinet":
        # Be tolerant of missing fields so partial PUTs don't blow up.
        return cls(
            id=data.get("id") or str(uuid.uuid4()),
            name=data["name"],
            category=data["category"],
            w=float(data["w"]),
            d=float(data["d"]),
            h=float(data["h"]),
            x=float(data.get("x", 0.0)),
            y=float(data.get("y", 0.0)),
            rotation=int(data.get("rotation", 0)),
            material=data.get("material", "oak"),
            kind=data.get("kind"),
            price=float(data.get("price", 0.0)),
        )


@dataclass
class Room:
    width: float = 400.0
    depth: float = 300.0
    height: float = 270.0


@dataclass
class Plan:
    name: str = "Untitled Plan"
    room: Room = field(default_factory=Room)
    items: List[Cabinet] = field(default_factory=list)
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = field(default_factory=_now_iso)
    updated_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "room": asdict(self.room),
            "items": [c.to_dict() for c in self.items],
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Plan":
        room_data = data.get("room", {})
        return cls(
            id=data.get("id") or str(uuid.uuid4()),
            name=data.get("name", "Untitled Plan"),
            room=Room(
                width=float(room_data.get("width", 400.0)),
                depth=float(room_data.get("depth", 300.0)),
                height=float(room_data.get("height", 270.0)),
            ),
            items=[Cabinet.from_dict(c) for c in data.get("items", [])],
            created_at=data.get("created_at", _now_iso()),
            updated_at=data.get("updated_at", _now_iso()),
        )

    def touch(self):
        self.updated_at = _now_iso()
