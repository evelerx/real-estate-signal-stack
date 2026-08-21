from datetime import datetime

_AUDIT_LOG: list[dict] = []

def log_action(
    user: str,
    action: str,
    before: dict | None,
    after: dict | None,
):
    _AUDIT_LOG.append({
        "user": user,
        "timestamp": datetime.utcnow().isoformat(),
        "action": action,
        "before": before,
        "after": after,
    })

def get_audit_log():
    return _AUDIT_LOG
