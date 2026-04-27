import { Link, useLocation, useNavigate } from "react-router-dom";
import authService from "../../../services/authService";

function Sidebar({ abierto, setAbierto }) {
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
    { label: "Contraseñas temporales", path: "/admin/usuarios-temporales", roles: ["administrador"] },
  ];

  const itemsFiltrados = menuItems.filter((item) => item.roles.includes(rol));

  return (
    <div
      className="d-flex flex-column text-white p-3"
      style={{
        width: abierto ? "260px" : "75px",
        minHeight: "100vh",
        background: "#183b56",
        transition: "width 0.3s ease",
        overflow: "hidden",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        {abierto && (
          <div>
            <h4 className="fw-bold mb-0">SGQD</h4>
            <small className="text-light">Sistema de Gestión</small>
          </div>
        )}

        <button
          className="btn btn-sm btn-outline-light"
          onClick={() => setAbierto(!abierto)}
        >
          ☰
        </button>
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
                className="px-3 py-2 rounded text-nowrap"
                style={{
                  backgroundColor: activo ? "#ffffff" : "transparent",
                  color: activo ? "#183b56" : "#ffffff",
                  fontWeight: activo ? "600" : "400",
                  transition: "0.2s",
                }}
              >
                {abierto ? item.label : item.label.charAt(0)}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        <button className="btn btn-outline-light w-100" onClick={cerrarSesion}>
          {abierto ? "Cerrar sesión" : "⎋"}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
