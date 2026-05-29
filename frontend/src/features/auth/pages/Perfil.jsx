import { Link } from "react-router-dom";
import authService from "../../../services/authService";

function Perfil() {
  const perfil = authService.getPerfilGuardado();

  const inicial = perfil?.username
    ? perfil.username.charAt(0).toUpperCase()
    : "U";

  return (
    <div className="container mt-4">
      <div className="card border-0 shadow rounded-4 overflow-hidden">
        <div
          className="p-4 text-white"
          style={{
            background: "linear-gradient(135deg, #183b56, #0d6efd)",
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center fw-bold"
              style={{ width: "72px", height: "72px", fontSize: "32px" }}
            >
              {inicial}
            </div>

            <div>
              <h2 className="mb-0 fw-bold">{perfil?.username || "Usuario"}</h2>
              <p className="mb-0">{perfil?.rol || "Sin rol"}</p>
            </div>
          </div>
        </div>

        <div className="card-body p-4">
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="bg-light rounded-4 p-3 h-100">
                <small className="text-muted">Correo electrónico</small>
                <h6 className="fw-bold mb-0">
                  {perfil?.email || "No disponible"}
                </h6>
              </div>
            </div>

            <div className="col-md-6">
              <div className="bg-light rounded-4 p-3 h-100">
                <small className="text-muted">Área asignada</small>
                <h6 className="fw-bold mb-0">
                  {perfil?.area || "Sin área"}
                </h6>
              </div>
            </div>

            <div className="col-md-6">
              <div className="bg-light rounded-4 p-3 h-100">
                <small className="text-muted">Nombre de usuario</small>
                <h6 className="fw-bold mb-0">
                  {perfil?.username || "No disponible"}
                </h6>
              </div>
            </div>

            <div className="col-md-6">
              <div className="bg-light rounded-4 p-3 h-100">
                <small className="text-muted">Rol del sistema</small>
                <h6 className="fw-bold mb-0">
                  {perfil?.rol || "No disponible"}
                </h6>
              </div>
            </div>
          </div>

          <Link to="/cambiar-password" className="btn btn-primary rounded-pill">
            Cambiar contraseña
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Perfil;
