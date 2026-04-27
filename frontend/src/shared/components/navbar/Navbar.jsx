import authService from "../../../services/authService";

function Navbar() {
  const perfil = authService.getPerfilGuardado();

  return (
    <div
      className="d-flex justify-content-between align-items-center bg-white px-4 py-3 shadow-sm rounded"
      style={{ minHeight: "72px" }}
    >
      <div>
        <h5 className="mb-0 fw-bold text-primary">
          Sistema de Gestión de Quejas
        </h5>
        <small className="text-muted">
          Bienvenid@, <strong>{perfil?.username || "usuario"}</strong>
        </small>
      </div>

      <div className="text-end">
        <div className="fw-semibold">{perfil?.rol || "Sin rol"}</div>
        <small className="text-muted">{perfil?.area || "Sin área"}</small>
      </div>
    </div>
  );
}

export default Navbar;