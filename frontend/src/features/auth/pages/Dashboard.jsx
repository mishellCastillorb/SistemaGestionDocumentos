import { useEffect, useState } from "react";
import authService from "../../../services/authService";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaFileAlt,
  FaFolderOpen,
  FaCheckCircle,
  FaPaperclip
} from "react-icons/fa";

function Dashboard() {
  const perfil = authService.getPerfilGuardado();
  const rol = perfil?.rol?.toLowerCase();

  const [solicitudesPendientes, setSolicitudesPendientes] =
    useState(0);

  // 🔥 NUEVO ESTADO
  const [resumen, setResumen] = useState({
    total_quejas: 0,
    expedientes_activos: 0,
    expedientes_concluidos: 0,
    total_documentos: 0,
  });

  // 🔥 SOLICITUDES RESET
  useEffect(() => {
    if (rol !== "administrador") return;

    const fetchSolicitudes = async () => {
      try {
        const data =
          await authService.obtenerSolicitudesReset();

        setSolicitudesPendientes(data.length);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSolicitudes();
  }, [rol]);

  // DASHBOARD KPIs
  useEffect(() => {
    const obtenerResumen = async () => {
      try {
        const token =
          localStorage.getItem("access");

        const response = await axios.get(
          "http://127.0.0.1:8000/api/dashboard/resumen/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setResumen(response.data);
      } catch (error) {
        console.error(
          "Error dashboard:",
          error
        );
      }
    };

    obtenerResumen();
  }, []);

  const accesosRapidos = {
    administrador: [
      {
        label: "Registrar nueva queja",
        path: "/quejas/nueva",
      },

      {
        label: "Consultar quejas",
        path: "/quejas",
      },

      {
        label: "Consultar expedientes",
        path: "/expedientes",
      },

      {
        label: "Contraseñas temporales",
        path: "/admin/usuarios-temporales",
      },
    ],

    capturista: [
      {
        label: "Registrar nueva queja",
        path: "/quejas/nueva",
      },

      {
        label: "Consultar quejas",
        path: "/quejas",
      },

      {
        label: "Consultar expedientes",
        path: "/expedientes",
      },
    ],

    analista: [
      {
        label: "Consultar expedientes",
        path: "/expedientes",
      },

      {
        label: "Consultar quejas",
        path: "/quejas",
      },

      {
        label: "Ver perfil",
        path: "/perfil",
      },
    ],

    consulta: [
      {
        label: "Consultar quejas",
        path: "/quejas",
      },

      {
        label: "Consultar expedientes",
        path: "/expedientes",
      },

      {
        label: "Ver perfil",
        path: "/perfil",
      },
    ],
  };

  const acciones = accesosRapidos[rol] || [];

  return (
    <div>
      {/* HEADER */}
      <div className="mb-4">
        <h2 className="fw-bold text-primary mb-1">
          Panel principal
        </h2>

        <p className="text-muted mb-0">
          Gestión de quejas, expedientes,
          documentos y movimientos.
        </p>

        {solicitudesPendientes > 0 && (
          <div className="alert alert-warning mt-3 mb-0">
            Hay{" "}
            <strong>
              {solicitudesPendientes}
            </strong>{" "}
            solicitudes de recuperación de
            contraseña pendientes.
          </div>
        )}
      </div>

      <div className="row g-4">
        {/* ACCESOS */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-3">
              Accesos rápidos
            </h5>

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

        {/* KPIs */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-3">
              Resumen del sistema
            </h5>

            <div className="row g-3">
              {/* QUEJAS */}
              <div className="col-md-6">
                <div className="bg-light rounded-4 p-4 h-100">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted">
                        Quejas registradas
                      </small>

                      <h2 className="fw-bold mb-0">
                        {resumen.total_quejas}
                      </h2>
                    </div>

                    <FaFileAlt className="fs-2 text-primary" />
                  </div>
                </div>
              </div>

                {/* ACTIVOS */}
              <div className="col-md-6">
                <div className="bg-light rounded-4 p-4 h-100">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted">
                        Expedientes activos
                      </small>

                      <h2 className="fw-bold mb-0">
                        {
                          resumen.expedientes_activos
                        }
                      </h2>
                    </div>

                    <FaFolderOpen className="fs-2 text-warning" />
                  </div>
                </div>
              </div>

              {/* CONCLUIDOS */}
              <div className="col-md-6">
                <div className="bg-light rounded-4 p-4 h-100">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted">
                        Expedientes concluidos
                      </small>

                      <h2 className="fw-bold mb-0">
                        {
                          resumen.expedientes_concluidos
                        }
                      </h2>
                    </div>

                    <FaCheckCircle className="fs-2 text-success" />
                  </div>
                </div>
              </div>

              {/* DOCUMENTOS */}
              <div className="col-md-6">
                <div className="bg-light rounded-4 p-4 h-100">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted">
                        Documentos registrados
                      </small>

                      <h2 className="fw-bold mb-0">
                        {
                          resumen.total_documentos
                        }
                      </h2>
                    </div>

                    <FaPaperclip className="fs-2 text-secondary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVIDAD */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-3">
              Actividad reciente
            </h5>

            <p className="text-muted mb-0">
              Aquí se mostrarán los expedientes
              recientes, movimientos recientes
              o documentos registrados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
