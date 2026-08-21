import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchIntelMasterSheet } from "../services/dataSheetApi";
import "./DataSheet.css";

const SORT_OPTIONS = [
  { value: "updated_at", label: "Updated Time" },
  { value: "added_at", label: "Added Time" },
  { value: "area", label: "Area" },
  { value: "city", label: "City" },
  { value: "record_type", label: "Type" },
  { value: "city_attractiveness_score", label: "Attractiveness Score" },
  { value: "capital_rotation_ranking", label: "Rotation Rank" },
  { value: "supply_risk_band", label: "Supply Risk Band" },
  { value: "micro_market", label: "Micro-market" },
  { value: "mispricing_index", label: "Mispricing Index" },
  { value: "demand_momentum_score", label: "Demand Momentum Score" },
  { value: "oversupply_risk", label: "Oversupply Risk" },
  { value: "liquidity_depth_score", label: "Liquidity Depth Score" },
  { value: "developer_name", label: "Developer" },
  { value: "developer_reliability_score", label: "Developer Reliability" },
  { value: "execution_risk_band", label: "Execution Risk Band" },
  { value: "deal_name", label: "Deal" },
  { value: "survival_probability", label: "Survival Probability" },
  { value: "downside_irr", label: "Downside IRR" },
  { value: "capital_impairment_band", label: "Capital Impairment Band" },
  { value: "primary_text", label: "Primary Text" },
];

function csvCell(value) {
  const text = value === undefined || value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(items) {
  const headers = [
    "area",
    "city",
    "record_type",
    "primary_text",
    "secondary_text",
    "status",
    "value",
    "city_attractiveness_score",
    "capital_rotation_ranking",
    "supply_risk_band",
    "micro_market",
    "mispricing_index",
    "demand_momentum_score",
    "oversupply_risk",
    "liquidity_depth_score",
    "developer_name",
    "developer_reliability_score",
    "execution_risk_band",
    "deal_name",
    "survival_probability",
    "downside_irr",
    "capital_impairment_band",
    "added_at",
    "updated_at",
    "record_index",
  ];
  const lines = [headers.join(",")];
  items.forEach((row) => {
    lines.push(headers.map((key) => csvCell(row[key])).join(","));
  });
  return lines.join("\n");
}

export default function DataSheet() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedKey, setExpandedKey] = useState("");
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("");
  const [recordType, setRecordType] = useState("");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1 });

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      q: search.trim(),
      area: area.trim(),
      record_type: recordType,
      sort_by: sortBy,
      sort_dir: sortDir,
    }),
    [page, limit, search, area, recordType, sortBy, sortDir]
  );

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    fetchIntelMasterSheet(accessToken, queryParams)
      .then((data) => {
        setItems(Array.isArray(data.items) ? data.items : []);
        setMeta({
          total: Number(data.total || 0),
          total_pages: Number(data.total_pages || 1),
        });
      })
      .catch((err) => setError(err.message || "Failed to fetch master sheet"))
      .finally(() => setLoading(false));
  }, [accessToken, queryParams]);

  if (!accessToken) return <div className="sheet-shell">Login required.</div>;

  function exportCurrentPage() {
    const csv = toCsv(items);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `master-data-sheet-page-${page}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="sheet-shell">
      <header className="sheet-header">
        <div>
          <p className="sheet-kicker">Admin Workspace</p>
          <h1>Master Data Sheet</h1>
        </div>
        <div className="sheet-actions">
          <button className="sheet-btn" onClick={() => navigate("/investor-dashboard")}>
            Dashboard
          </button>
          <button className="sheet-btn sheet-btn-primary" onClick={exportCurrentPage}>
            Export CSV
          </button>
        </div>
      </header>

      <section className="sheet-filters">
        <input
          placeholder="Search all fields"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <input
          placeholder="Filter by area"
          value={area}
          onChange={(e) => {
            setArea(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={recordType}
          onChange={(e) => {
            setRecordType(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          <option value="listing">Listing</option>
          <option value="broker_deal">Broker Deal</option>
          <option value="validation">Validation</option>
          <option value="city_intelligence">City Intelligence</option>
          <option value="micro_market_engine">Micro-market Engine</option>
          <option value="developer_intelligence">Developer Intelligence</option>
          <option value="deal_survival_engine">Deal Survival Engine</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
          <option value={250}>250 / page</option>
        </select>
      </section>

      {error && <div className="sheet-error">{error}</div>}
      {loading ? (
        <div className="sheet-muted">Loading master sheet...</div>
      ) : (
        <>
          <div className="sheet-meta">
            <span>Total records: {meta.total}</span>
            <span>
              Page {page} of {meta.total_pages}
            </span>
          </div>
          <div className="sheet-table-wrap">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>City</th>
                  <th>Type</th>
                  <th>Primary</th>
                  <th>Secondary</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Attractiveness</th>
                  <th>Rotation Rank</th>
                  <th>Supply Risk Band</th>
                  <th>Micro-market</th>
                  <th>Mispricing</th>
                  <th>Demand Momentum</th>
                  <th>Oversupply Risk</th>
                  <th>Liquidity Depth</th>
                  <th>Developer</th>
                  <th>Dev Reliability</th>
                  <th>Execution Risk Band</th>
                  <th>Deal</th>
                  <th>Survival Prob</th>
                  <th>Downside IRR</th>
                  <th>Capital Impairment</th>
                  <th>Added At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const key = `${row.area}-${row.record_type}-${row.record_index}`;
                  const isOpen = expandedKey === key;
                  return (
                    <Fragment key={key}>
                      <tr onClick={() => setExpandedKey(isOpen ? "" : key)}>
                        <td>{row.area}</td>
                        <td>{row.city || row.details?.city || "-"}</td>
                        <td>{row.record_type}</td>
                        <td>{row.primary_text || "-"}</td>
                        <td>{row.secondary_text || "-"}</td>
                        <td>{row.status || "-"}</td>
                        <td>{row.value || "-"}</td>
                        <td>{row.city_attractiveness_score ?? row.details?.city_attractiveness_score ?? "-"}</td>
                        <td>{row.capital_rotation_ranking ?? row.details?.capital_rotation_ranking ?? "-"}</td>
                        <td>{row.supply_risk_band || row.details?.supply_risk_band || "-"}</td>
                        <td>{row.micro_market || row.details?.micro_market || "-"}</td>
                        <td>{row.mispricing_index ?? row.details?.mispricing_index ?? "-"}</td>
                        <td>{row.demand_momentum_score ?? row.details?.demand_momentum_score ?? "-"}</td>
                        <td>{row.oversupply_risk ?? row.details?.oversupply_risk ?? "-"}</td>
                        <td>{row.liquidity_depth_score ?? row.details?.liquidity_depth_score ?? "-"}</td>
                        <td>{row.developer_name || row.details?.developer_name || "-"}</td>
                        <td>{row.developer_reliability_score ?? row.details?.developer_reliability_score ?? "-"}</td>
                        <td>{row.execution_risk_band || row.details?.execution_risk_band || "-"}</td>
                        <td>{row.deal_name || row.details?.deal_name || "-"}</td>
                        <td>{row.survival_probability ?? row.details?.survival_probability ?? "-"}</td>
                        <td>{row.downside_irr ?? row.details?.downside_irr ?? "-"}</td>
                        <td>{row.capital_impairment_band || row.details?.capital_impairment_band || "-"}</td>
                        <td>{row.added_at || "-"}</td>
                        <td>{row.updated_at || "-"}</td>
                      </tr>
                      {isOpen && (
                        <tr className="sheet-details-row">
                          <td colSpan={24}>
                            <pre>{JSON.stringify(row.details || {}, null, 2)}</pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="sheet-pagination">
        <button
          className="sheet-btn"
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <button
          className="sheet-btn"
          type="button"
          disabled={page >= meta.total_pages}
          onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
