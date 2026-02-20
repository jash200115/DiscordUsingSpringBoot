import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children, adminOnly }) => {
  const { token, isAdmin } = useAuth();

  if (!token) return <Navigate to="/login" />;

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/chat" />;
  }

  return children;
};

export default ProtectedRoute;