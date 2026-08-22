import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Home from "../pages/Home";
import Admin from "../pages/Admin";
import Pricing from "../pages/Pricing";
import InvestorDashboard from "../pages/InvestorDashboard";
import ProtectedRoute from "./ProtectedRoute";
import EnterpriseWorkbench from "../pages/EnterpriseWorkbench";
import DataSheet from "../pages/DataSheet";

const Heatmap = lazy(() => import("../pages/Heatmap"));

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/admin" element={<Admin />} />
        <Route
          path="/investor-dashboard"
          element={
            <ProtectedRoute allow={["admin"]}>
              <InvestorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/enterprise-workbench"
          element={
            <ProtectedRoute allow={["admin"]}>
              <EnterpriseWorkbench />
            </ProtectedRoute>
          }
        />
        <Route
          path="/data-sheet"
          element={
            <ProtectedRoute allow={["admin"]}>
              <DataSheet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/heatmap"
          element={
            <ProtectedRoute allow={["admin"]}>
              <Suspense fallback={<div className="panel">Loading density map...</div>}>
                <Heatmap />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </BrowserRouter>
  );
}
