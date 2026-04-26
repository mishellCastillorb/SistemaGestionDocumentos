import { useEffect, useState } from "react";
import authService from "../../../services/authService";
import { Link } from "react-router-dom";

function Dashboard() {
  const perfil = authService.getPerfilGuardado();
  const rol = perfil?.rol?.toLowerCase();
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);

  useEffect(() => {
    if (rol !== "administrador") {
      return;
    }

    const fetchSolicitudes = async () => {
      try {
        const data = await authService.obtenerSolicitudesReset();
        setSolicitudesPendientes(data.length);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSolicitudes();
  }, [rol]);

  const accesosRapidos = {
    administrador: [
      { label: "Registrar nueva queja", path: "/quejas/nueva" },
      { label: "Consultar quejas", path: "/quejas" },
      { label: "Consultar expedientes", path: "/expedientes" },
      { label: "Contraseñas temporales", path: "/admin/usuarios-temporales" },
    ],
    capturista: [
      { label: "Registrar nueva queja", path: "/quejas/nueva" },
      { label: "Consultar quejas", path: "/quejas" },
      { label: "Consultar expedientes", path: "/expedientes" },
    ],
    analista: [
      { label: "Consultar expedientes", path: "/expedientes" },
      { label: "Consultar quejas", path: "/quejas" },
      { label: "Ver perfil", path: "/perfil" },
    ],
    consulta: [
      { label: "Consultar quejas", path: "/quejas" },
      { label: "Consultar expedientes", path: "/expedientes" },
      { label: "Ver perfil", path: "/perfil" },
    ],
  };

  const acciones = accesosRapidos[rol] || [];

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold">Dashboard</h2>
        <p className="text-muted mb-0">
          Panel principal del sistema
        </p>
        {solicitudesPendientes > 0 && (
          <div className="alert alert-warning mt-3">
            Hay <strong>{solicitudesPendientes}</strong> solicitudes de recuperación de contraseña pendientes.
          </div>
        )}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3">
            <h6 className="text-muted">Usuario actual</h6>
            <h4 className="fw-bold">{perfil?.username || "Usuario"}</h4>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3">
            <h6 className="text-muted">Rol</h6>
            <h4 className="fw-bold">{perfil?.rol || "Sin rol"}</h4>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3">
            <h6 className="text-muted">Área</h6>
            <h4 className="fw-bold">{perfil?.area || "Sin área"}</h4>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3">
            <h6 className="text-muted">Acceso</h6>
            <h4 className="fw-bold">Activo</h4>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-3">Bienvenido al sistema</h5>
            <p className="text-muted">
              Este sistema permite registrar quejas y denuncias, administrar expedientes,
              llevar seguimiento de movimientos y gestionar documentos asociados a cada caso.
            </p>

            <p className="mb-0">
              <strong>Usuario:</strong> {perfil?.username || "No disponible"}
            </p>
            <p className="mb-0">
              <strong>Rol:</strong> {perfil?.rol || "No disponible"}
            </p>
            <p className="mb-0">
              <strong>Área:</strong> {perfil?.area || "No disponible"}
            </p>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-3">Accesos rápidos</h5>

            <div className="d-grid gap-2">
              {acciones.map((accion) => (
                <Link
                  key={accion.path}
                  to={accion.path}
                  className="btn btn-outline-primary"
                >
                  {accion.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-3">Resumen del sistema</h5>
            <div className="row g-3">
              <div className="col-md-3">
                <div className="bg-light rounded-4 p-3">
                  <h6 className="text-muted">Quejas registradas</h6>
                  <h3 className="fw-bold">--</h3>
                </div>
              </div>

              <div className="col-md-3">
                <div className="bg-light rounded-4 p-3">
                  <h6 className="text-muted">Expedientes activos</h6>
                  <h3 className="fw-bold">--</h3>
                </div>
              </div>

              <div className="col-md-3">
                <div className="bg-light rounded-4 p-3">
                  <h6 className="text-muted">Expedientes concluidos</h6>
                  <h3 className="fw-bold">--</h3>
                </div>
              </div>

              <div className="col-md-3">
                <div className="bg-light rounded-4 p-3">
                  <h6 className="text-muted">Documentos registrados</h6>
                  <h3 className="fw-bold">--</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-3">Actividad reciente</h5>
            <p className="text-muted mb-0">
              Aqui se mostraran  expedientes recientes, movimientos recientes
              o documentos registrados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;