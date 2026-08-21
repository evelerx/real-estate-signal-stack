import ErrorBoundary from "./components/ErrorBoundary";
import AppRouter from "./router/AppRouter";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </AuthProvider>
  );
}
