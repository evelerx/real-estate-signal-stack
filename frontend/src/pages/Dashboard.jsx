import { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import MainPanel from "../components/MainPanel";

// TEMP ROLE FLAG — will be replaced by auth later
const ROLE = "admin";

export default function Dashboard() {
  const [selectedArea, setSelectedArea] = useState(null);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Header role={ROLE} />

      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar onSelectArea={setSelectedArea} />
        <MainPanel selectedArea={selectedArea} />
      </div>
    </div>
  );
}
