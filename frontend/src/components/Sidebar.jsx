function Sidebar({ onSelectArea }) {
  const areas = ["Wakad", "Hinjewadi", "Baner"];

  return (
    <div
      style={{
        width: "220px",
        borderRight: "1px solid #444",
        padding: "16px",
      }}
    >
      <h3>Areas</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {areas.map((area) => (
          <li
            key={area}
            style={{ cursor: "pointer", marginBottom: "8px" }}
            onClick={() => onSelectArea(area)}
          >
            {area}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
