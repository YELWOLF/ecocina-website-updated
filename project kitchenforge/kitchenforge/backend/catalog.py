"""
Catalog of standard European-style kitchen units.
All measurements in centimeters.

Why this lives in a separate module: the catalog is data, not behavior.
Keeping it isolated means the frontend (which fetches it via /api/catalog)
and the geometry generator can both read it without circular imports,
and a future "import from Excel/PDF" workflow can rewrite this file alone.
"""

CATALOG = {
    "base": {
        "label": "Base Cabinets",
        "color": "#e8dfc9",
        "items": [
            {"name": "B30",  "w": 30,  "d": 60, "h": 87, "price": 120},
            {"name": "B40",  "w": 40,  "d": 60, "h": 87, "price": 145},
            {"name": "B45",  "w": 45,  "d": 60, "h": 87, "price": 155},
            {"name": "B50",  "w": 50,  "d": 60, "h": 87, "price": 170},
            {"name": "B60",  "w": 60,  "d": 60, "h": 87, "price": 195},
            {"name": "B80",  "w": 80,  "d": 60, "h": 87, "price": 240},
            {"name": "B90",  "w": 90,  "d": 60, "h": 87, "price": 265},
            {"name": "B100", "w": 100, "d": 60, "h": 87, "price": 290},
            {"name": "B120", "w": 120, "d": 60, "h": 87, "price": 340},
        ],
    },
    "wall": {
        "label": "Wall Cabinets",
        "color": "#f0e9d6",
        "items": [
            {"name": "W30", "w": 30, "d": 35, "h": 72, "price": 90},
            {"name": "W40", "w": 40, "d": 35, "h": 72, "price": 110},
            {"name": "W50", "w": 50, "d": 35, "h": 72, "price": 125},
            {"name": "W60", "w": 60, "d": 35, "h": 72, "price": 145},
            {"name": "W80", "w": 80, "d": 35, "h": 72, "price": 180},
            {"name": "W90", "w": 90, "d": 35, "h": 72, "price": 200},
        ],
    },
    "tall": {
        "label": "Tall Units",
        "color": "#d4c8a8",
        "items": [
            {"name": "T60",         "w": 60, "d": 60, "h": 210, "price": 380},
            {"name": "Oven Tower",  "w": 60, "d": 60, "h": 210, "kind": "oven-tower", "price": 420},
            {"name": "Fridge Tall", "w": 60, "d": 65, "h": 210, "kind": "fridge",     "price": 450},
            {"name": "Pantry 80",   "w": 80, "d": 60, "h": 210, "price": 480},
        ],
    },
    "appliance": {
        "label": "Appliances & Sinks",
        "color": "#aac4d1",
        "items": [
            {"name": "Sink 60",    "w": 60, "d": 60, "h": 87, "kind": "sink",        "price": 320},
            {"name": "Sink 80",    "w": 80, "d": 60, "h": 87, "kind": "sink",        "price": 380},
            {"name": "Hob 60",     "w": 60, "d": 60, "h": 87, "kind": "hob",         "price": 450},
            {"name": "Hob 90",     "w": 90, "d": 60, "h": 87, "kind": "hob",         "price": 520},
            {"name": "Dishwasher", "w": 60, "d": 60, "h": 87, "kind": "dishwasher",  "price": 600},
            {"name": "Fridge UC",  "w": 60, "d": 60, "h": 87, "kind": "fridge",      "price": 750},
        ],
    },
}


def get_catalog():
    """Return catalog as a plain dict for JSON serialization."""
    return CATALOG
