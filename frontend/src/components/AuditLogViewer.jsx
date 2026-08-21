import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuditLogViewer() {
  const { accessToken, role } = useAuth();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (role !== "ceo") return;

    fetch("http://127.0.0.1:8000/internal/analyst/audit", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((r) => r.json())
      .then(setLogs);
  }, [role, accessToken]);

  if (role !== "ceo") return null;

  return (
    <div className="audit-log">
      <h3>Audit Log</h3>
      {logs.map((l, i) => (
        <pre key={i}>{JSON.stringify(l, null, 2)}</pre>
      ))}
    </div>
  );
}
