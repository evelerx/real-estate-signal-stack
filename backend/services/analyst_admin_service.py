# services/analyst_admin_service.py

_ANALYST_FLAG_STORE = {}

def set_analyst_flags(area_id: str, flags: dict, analyst_id: str):
    _ANALYST_FLAG_STORE[area_id.lower()] = {
        "flags": flags,
        "analyst_id": analyst_id,
    }
    return {"status": "saved", "area": area_id, "analyst_id": analyst_id}


def get_analyst_flags(area_id: str):
    return _ANALYST_FLAG_STORE.get(area_id.lower(), {"flags": {}})
