import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BannedScreen } from "./BannedScreen";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-eco-beige">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-eco-green/20 border-t-eco-green" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Banned users (e.g. too many reports) get a plain lock screen — no app access.
  if (user.ban ?? user.BAN) {
    return <BannedScreen />;
  }

  return children;
}
