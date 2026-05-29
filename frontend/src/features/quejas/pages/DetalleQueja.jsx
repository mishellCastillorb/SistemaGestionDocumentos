import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import quejaService from "../../../services/quejaService";
import {
  FaFileAlt,
  FaUserTie,
  FaCalendarAlt,
  FaBuilding,
  FaStickyNote,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { FaFolderOpen } from "react-icons/fa";

function DetalleQueja() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [queja, setQueja] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDetalle();
  }, [id]);

  const cargarDetalle = async () => {
    try {
      const data = await quejaService.obtenerDetalle(id);
      setQueja(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el detalle de la queja.");
    }
  };

  if (error) {
    return (
      <div className="container py-4">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (!queja) {
    return (
      <div className="container py-4">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-4">
          {/* HEADER */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">
                <FaFileAlt className="me-2 text-primary" />
                Detalle de queja
              </h2>

              <span className="badge bg-primary fs-6">
                Folio #{queja.folio}
              </span>
            </div>

            <button
              className="btn btn-outline-secondary rounded-pill"
              onClick={() => navigate("/quejas")}
            >
              ← Volver
            </button>
          </div>

          {
          queja.expediente_id && (
            <Link
              to={`/expedientes/${queja.expediente_id}`}
              className="btn btn-outline-primary rounded-pill mt-3"
            >
              <FaFolderOpen className="me-2" />
              Ver expediente {queja.expediente_numero}
            </Link>
          )
        }

          {/* GRID */}
          <div className="row g-4">
            {/* DATOS GENERALES */}
            <div className="col-md-6">
              <div className="bg-light rounded-4 p-4 h-100">
                <h5 className="fw-bold mb-4 text-primary">
                  <FaStickyNote className="me-2" />
                  Datos generales
                </h5>

                <p>
                  <strong>Asunto:</strong>
                  <br />
                  {queja.asunto}
                </p>

                <p>
                  <strong>
                    <FaCalendarAlt className="me-2 text-secondary" />
                    Fecha de ingreso:
                  </strong>
                  <br />
                  {new Date(queja.fecha_ingreso).toLocaleString("es-MX", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>

                <p>
                  <strong>
                    <FaBuilding className="me-2 text-secondary" />
                    Área involucrada:
                  </strong>
                  <br />
                  {queja.area_involucrada_nombre || "No especificada"}
                </p>
              </div>
            </div>

            {/* SERVIDOR */}
            <div className="col-md-6">
              <div className="bg-light rounded-4 p-4 h-100">
                <h5 className="fw-bold mb-4 text-primary">
                  <FaUserTie className="me-2" />
                  Servidor público
                </h5>

                <p>
                  <strong>Nombre:</strong>
                  <br />
                  {queja.nombre_servidor_publico || "No especificado"}
                </p>

                <p>
                  <strong>Cargo:</strong>
                  <br />
                  {queja.cargo_servidor_publico || "No especificado"}
                </p>
              </div>
            </div>

            {/* DESCRIPCIÓN */}
            <div className="col-12">
              <div className="bg-light rounded-4 p-4">
                <h5 className="fw-bold mb-4 text-primary">
                  <FaStickyNote className="me-2" />
                  Descripción
                </h5>

                <p className="mb-0 lh-lg">
                  {queja.descripcion}
                </p>
              </div>
            </div>

            {/* OBSERVACIONES */}
            <div className="col-12">
              <div className="bg-light rounded-4 p-4">
                <h5 className="fw-bold mb-4 text-primary">
                  Observaciones
                </h5>

                <p className="mb-0">
                  {queja.observaciones || "Sin observaciones"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleQueja;
