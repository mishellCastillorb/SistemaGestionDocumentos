import { Navigate } from "react-router-dom";
import authService from "../../services/authService";

function ProtectedRoute({ children }) {
  return authService.isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;