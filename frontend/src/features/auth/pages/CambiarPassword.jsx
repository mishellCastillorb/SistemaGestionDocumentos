import { useState } from "react";
import authService from "../../../services/authService";

function CambiarPassword() {
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!passwordActual || !passwordNueva || !confirmarPassword) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (passwordNueva !== confirmarPassword) {
      setError("La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    try {
      const response = await authService.cambiarPassword(
        passwordActual,
        passwordNueva
      );

      setMensaje(response.mensaje || "Contraseña actualizada correctamente.");
      setPasswordActual("");
      setPasswordNueva("");
      setConfirmarPassword("");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          "No se pudo cambiar la contraseña."
      );
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow p-4">
            <h2 className="mb-4 text-center">Cambiar contraseña</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Contraseña actual</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Nueva contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary w-100">
                Actualizar contraseña
              </button>
            </form>

            {mensaje && <p className="text-success mt-3 text-center">{mensaje}</p>}
            {error && <p className="text-danger mt-3 text-center">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CambiarPassword;