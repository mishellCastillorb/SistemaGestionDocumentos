import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./features/auth/pages/Login";
import Dashboard from "./features/auth/pages/Dashboard";
import Perfil from "./features/auth/pages/Perfil";
import CambiarPassword from "./features/auth/pages/CambiarPassword";
import AdminPasswordTemporal from "./features/auth/pages/AdminPasswordTemporal";
import ListaQuejas from "./features/quejas/pages/ListaQuejas";
import CrearQueja from "./features/quejas/pages/CrearQueja";
import DetalleQueja from "./features/quejas/pages/DetalleQueja";
import ListaExpedientes from "./features/expedientes/pages/ListaExpedientes";
import DetalleExpediente from "./features/expedientes/pages/DetalleExpediente";
import ProtectedRoute from "./core/guards/protectedRoute";
import MainLayout from "./shared/components/layout/MainLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/cambiar-password" element={<CambiarPassword />} />
          <Route
            path="/admin/usuarios-temporales"
            element={<AdminPasswordTemporal />}
          />
          <Route path="/quejas" element={<ListaQuejas />} />
          <Route path="/quejas/nueva" element={<CrearQueja />} />
          <Route path="/quejas/:id" element={<DetalleQueja />} />
          <Route path="/expedientes" element={<ListaExpedientes />} />
          <Route path="/expedientes/:id" element={<DetalleExpediente />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;