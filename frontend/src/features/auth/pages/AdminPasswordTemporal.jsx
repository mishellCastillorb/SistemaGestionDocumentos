import { useEffect, useState } from "react";
import authService from "../../../services/authService";

function AdminPasswordTemporal() {
  const perfil = authService.getPerfilGuardado();
  const esAdministrador = perfil?.rol?.toLowerCase() === "administrador";

  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [passwordTemporal, setPasswordTemporal] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);

  useEffect(() => {
    if (!esAdministrador) {
      return;
    }

    const fetchUsuarios = async () => {
      setCargandoUsuarios(true);
      try {
        const data = await authService.obtenerUsuarios();
        setUsuarios(data);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la lista de usuarios.");
      } finally {
        setCargandoUsuarios(false);
      }
    };

    const fetchSolicitudes = async () => {
      setCargandoSolicitudes(true);
      try {
        const data = await authService.obtenerSolicitudesReset();
        setSolicitudes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setCargandoSolicitudes(false);
      }
    };

    fetchUsuarios();
    fetchSolicitudes();
  }, [esAdministrador]);

  const seleccionarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setPasswordTemporal("");
    setMensaje("");
    setError("");
  };

  const generarContrasena = () => {
    const nuevaContrasena = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2);
    setPasswordTemporal(nuevaContrasena.slice(0, 12));
  };

  const asignarContrasenaTemporal = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!usuarioSeleccionado) {
      setError("Selecciona un usuario antes de asignar la contraseña temporal.");
      return;
    }

    if (!passwordTemporal.trim()) {
      setError("Ingresa una contraseña temporal válida.");
      return;
    }

    setCargando(true);
    try {
      const response = await authService.asignarPasswordTemporal(
        usuarioSeleccionado.id,
        passwordTemporal
      );
      setMensaje(response.mensaje || "Contraseña temporal asignada correctamente.");
      setPasswordTemporal("");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.mensaje ||
          "No se pudo asignar la contraseña temporal."
      );
    } finally {
      setCargando(false);
    }
  };

  if (!esAdministrador) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-4">
        <h2 className="fw-bold mb-3">Acceso no autorizado</h2>
        <p className="text-muted">
          Solo los administradores pueden asignar contraseñas temporales.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold">Contraseñas temporales</h2>
        <p className="text-muted mb-0">
          Asigna contraseñas temporales a los usuarios desde este panel.
        </p>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-3">Solicitudes de contraseña</h5>
            {cargandoSolicitudes ? (
              <p>Cargando solicitudes...</p>
            ) : solicitudes.length === 0 ? (
              <p className="text-muted">No hay solicitudes pendientes.</p>
            ) : (
              <div className="list-group mb-3">
                {solicitudes.map((solicitud) => (
                  <div
                    key={solicitud.id}
                    className="list-group-item d-flex justify-content-between align-items-start"
                  >
                    <div>
                      <strong>{solicitud.usuario.username}</strong>
                      <div className="small text-muted">{new Date(solicitud.creado_en).toLocaleString()}</div>
                    </div>
                    <span className="badge bg-warning text-dark">Pendiente</span>
                  </div>
                ))}
              </div>
            )}
            <h5 className="fw-bold mb-3">Usuarios</h5>
            {cargandoUsuarios ? (
              <p>Cargando usuarios...</p>
            ) : (
              <div className="list-group">
                {usuarios.map((usuario) => (
                  <button
                    key={usuario.id}
                    type="button"
                    className={`list-group-item list-group-item-action ${
                      usuarioSeleccionado?.id === usuario.id ? "active" : ""
                    }`}
                    onClick={() => seleccionarUsuario(usuario)}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{usuario.username}</strong>
                        <div className="small text-muted">
                          {usuario.rol || "Sin rol"} · {usuario.area || "Sin área"}
                        </div>
                      </div>
                      {usuarioSeleccionado?.id === usuario.id && (
                        <span className="badge bg-primary">Seleccionado</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-3">Asignar contraseña temporal</h5>
            <form onSubmit={asignarContrasenaTemporal}>
              <div className="mb-3">
                <label className="form-label">Usuario seleccionado</label>
                <input
                  type="text"
                  className="form-control"
                  value={usuarioSeleccionado ? usuarioSeleccionado.username : "Ninguno"}
                  readOnly
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Contraseña temporal</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={passwordTemporal}
                    onChange={(e) => setPasswordTemporal(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={generarContrasena}
                  >
                    Generar
                  </button>
                </div>
                <small className="text-muted">
                  La contraseña temporal debe tener al menos 6 caracteres.
                </small>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}
              {mensaje && <div className="alert alert-success">{mensaje}</div>}

              <button type="submit" className="btn btn-primary w-100" disabled={cargando}>
                {cargando ? "Guardando..." : "Asignar contraseña temporal"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPasswordTemporal;
