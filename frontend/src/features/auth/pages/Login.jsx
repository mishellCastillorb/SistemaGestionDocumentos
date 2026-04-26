import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../../services/authService";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [resetMensaje, setResetMensaje] = useState("");
  const [resetCargando, setResetCargando] = useState(false);
  const navigate = useNavigate();

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!username.trim() || !password.trim()) {
      setMensaje("Completa usuario y contraseña.");
      return;
    }

    try {
      setCargando(true);

      await authService.login(username, password);
      await authService.getPerfil();

      setMensaje("Inicio de sesión correcto.");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      if (error.response?.status === 401) {
        setMensaje("Usuario o contraseña incorrectos.");
      } else {
        setMensaje("Ocurrió un error al iniciar sesión.");
      }
    } finally {
      setCargando(false);
    }
  };

  const recuperarContrasena = async (e) => {
    e.preventDefault();
    setResetMensaje("");

    if (!resetUsername.trim()) {
      setResetMensaje("Ingresa tu usuario para recuperar tu contraseña.");
      return;
    }

    try {
      setResetCargando(true);
      const response = await authService.resetPasswordRequest(resetUsername);
      setResetMensaje(response.mensaje || "Solicitud enviada. Contacta al administrador si necesitas ayuda.");
    } catch (error) {
      console.error(error);
      setResetMensaje(
        error.response?.data?.detail ||
          error.response?.data?.username ||
          "No se pudo procesar la solicitud."
      );
    } finally {
      setResetCargando(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4">
          <h2 className="mb-4 text-center">Iniciar sesión</h2>

          <form onSubmit={iniciarSesion} className="card p-4 shadow">
            <div className="mb-3">
              <label className="form-label">Usuario</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={cargando}>
              {cargando ? "Entrando..." : "Entrar"}
            </button>

            {mensaje && <p className="mt-3 text-center">{mensaje}</p>}
          </form>

          <div className="card p-4 shadow mt-4">
            <h5 className="fw-bold mb-3">¿Olvidaste tu contraseña?</h5>
            <p className="text-muted small">
              Ingresa tu usuario y te enviaremos indicaciones para recuperar el acceso.
            </p>
            <form onSubmit={recuperarContrasena}>
              <div className="mb-3">
                <label className="form-label">Usuario</label>
                <input
                  type="text"
                  className="form-control"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-outline-primary w-100" disabled={resetCargando}>
                {resetCargando ? "Enviando..." : "Enviar solicitud"}
              </button>
              {resetMensaje && <p className="mt-3 text-center">{resetMensaje}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;