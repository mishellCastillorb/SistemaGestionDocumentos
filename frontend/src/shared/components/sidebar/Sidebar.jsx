import { Link, useLocation, useNavigate } from "react-router-dom";
import authService from "../../../services/authService";

function Sidebar() {
  const perfil = authService.getPerfilGuardado();
  const navigate = useNavigate();
  const location = useLocation();

  const rol = perfil?.rol?.toLowerCase();

  const cerrarSesion = () => {
    authService.logout();
    navigate("/login");
  };

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", roles: ["administrador", "capturista", "analista", "consulta"] },
    { label: "Quejas", path: "/quejas", roles: ["administrador", "capturista", "analista", "consulta"] },
    { label: "Expedientes", path: "/expedientes", roles: ["administrador", "capturista", "analista", "consulta"] },
    { label: "Perfil", path: "/perfil", roles: ["administrador", "capturista", "analista", "consulta"] },
  ];

  const itemsFiltrados = menuItems.filter((item) => item.roles.includes(rol));

  return (
    <div
      className="d-flex flex-column text-white p-3"
      style={{
        width: "260px",
        minHeight: "100vh",
        background: "#183b56",
      }}
    >
      <div className="mb-4">
        <h4 className="fw-bold">SGQD</h4>
        <small className="text-light">Sistema de Gestión</small>
      </div>

      <div className="bg-white text-dark rounded p-3 mb-4 shadow-sm">
        <p className="mb-1 fw-bold">{perfil?.username || "Usuario"}</p>
        <p className="mb-1 small">Rol: {perfil?.rol || "Sin rol"}</p>
        <p className="mb-0 small">Área: {perfil?.area || "Sin área"}</p>
      </div>

      <nav className="nav flex-column gap-2">
        {itemsFiltrados.map((item) => {
          const activo = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="text-decoration-none"
            >
              <div
                className="px-3 py-2 rounded"
                style={{
                  backgroundColor: activo ? "#ffffff" : "transparent",
                  color: activo ? "#183b56" : "#ffffff",
                  fontWeight: activo ? "600" : "400",
                  transition: "0.2s",
                }}
              >
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        <button className="btn btn-outline-light w-100" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default Sidebar;