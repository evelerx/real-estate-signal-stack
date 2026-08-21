import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function ProtectedRoute({ children, allow, requireEnterpriseSubscription = false }) {
  const { role, isAuthenticated, subscriptionUnlocked } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  if (!allow.includes(role)) {
    return <Navigate to="/admin" replace />;
  }

  if (
    requireEnterpriseSubscription &&
    role !== "ceo" &&
    role === "subscriptionowner" &&
    !subscriptionUnlocked
  ) {
    return <Navigate to="/pricing" replace />;
  }

  return children;
}

