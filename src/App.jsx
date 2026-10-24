import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { authApi } from "./services/api";
import ProtectedLayout from "./components/ProtectedLayout";
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Students = lazy(() => import("./pages/Students"));
const QRScannerPage = lazy(() => import("./pages/QRScannerPage"));
const VisitorLogs = lazy(() => import("./pages/VisitorLogs"));
const Reports = lazy(() => import("./pages/Reports"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

// Initial app bootstrap: verify whether the staff session is still valid before showing protected pages.
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="brand-mark">
        <span>S</span>
      </div>
      <span>Opening SSU Library...</span>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshSession = useCallback(async () => {
    try {
      // API: GET /auth/me.php checks the current staff session and returns the signed-in profile.
      const response = await authApi.me();
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);
  useEffect(() => {
    const expire = () => {
      setUser(null);
      navigate("/login", { replace: true });
    };
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, [navigate]);

  const logout = async () => {
    try {
      // API: POST /auth/logout.php ends the server-side staff session.
      await authApi.logout();
    } finally {
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  if (loading) return <LoadingScreen />;
  return (
    <Suspense fallback={<LoadingScreen />}>
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <Login onLogin={(profile) => setUser(profile)} />
          )
        }
      />
      <Route
        element={
          user ? (
            <ProtectedLayout user={user} onLogout={logout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/scan" element={<QRScannerPage />} />
        <Route path="/visitors" element={<VisitorLogs />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<SettingsPage user={user} onUserUpdated={setUser} />} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={user ? "/" : "/login"} replace />}
      />
    </Routes>
    </Suspense>
  );
}
