import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Admin from "../pages/Admin";
import Heatmap from "../pages/Heatmap";
import Pricing from "../pages/Pricing";
import InvestorDashboard from "../pages/InvestorDashboard";
import ProtectedRoute from "./ProtectedRoute";
import EnterpriseWorkbench from "../pages/EnterpriseWorkbench";
import DataSheet from "../pages/DataSheet";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/admin" element={<Admin />} />
        <Route
          path="/investor-dashboard"
          element={
            <ProtectedRoute
              allow={["ceo", "subscriptionowner", "data_analyst"]}
              requireEnterpriseSubscription
            >
              <InvestorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/enterprise-workbench"
          element={
            <ProtectedRoute
              allow={["ceo", "subscriptionowner", "data_analyst"]}
              requireEnterpriseSubscription
            >
              <EnterpriseWorkbench />
            </ProtectedRoute>
          }
        />
        <Route
          path="/data-sheet"
          element={
            <ProtectedRoute allow={["ceo", "subscriptionowner", "data_analyst", "general"]}>
              <DataSheet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/heatmap"
          element={
            <ProtectedRoute
              allow={["ceo", "subscriptionowner"]}
              requireEnterpriseSubscription
            >
              <Heatmap />
            </ProtectedRoute>
          }
        />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </BrowserRouter>
  );
}
