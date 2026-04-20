import { Link } from "react-router-dom";
import authService from "../../../services/authService";

function Perfil() {
  const perfil = authService.getPerfilGuardado();

  return (
    <div className="container-fluid">
      <div className="card shadow p-4 rounded-4">
        <h2 className="mb-4">Mi perfil</h2>

        <p><strong>Usuario:</strong> {perfil?.username || "No disponible"}</p>
        <p><strong>Correo:</strong> {perfil?.email || "No disponible"}</p>
        <p><strong>Rol:</strong> {perfil?.rol || "No disponible"}</p>
        <p><strong>Área:</strong> {perfil?.area || "No disponible"}</p>

        <div className="mt-3">
          <Link to="/cambiar-password" className="btn btn-outline-primary">
            Cambiar contraseña
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Perfil;