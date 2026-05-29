import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import expedienteService from "../../../services/expedienteService";
import CambiarEstadoExpediente from "../components/CambiarEstadoExpediente";
import AgregarDocumento from "../components/AgregarDocumento";
import authService from "../../../services/authService";
import {
  FaFilePdf,
  FaTag,
  FaUser,
  FaShieldAlt,
  FaExclamationTriangle,
} from "react-icons/fa";

const formatearFecha = (fecha) => {
  if (!fecha) return "Sin fecha";

  return new Date(fecha).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const obtenerEstadosTimeline = (movimientos, expediente) => {
  const estados = [];

  if (expediente?.fecha_apertura) {
    estados.push({
      estado: "Registrado",
      fecha: expediente.fecha_apertura,
      descripcion: "Apertura del expediente",
      completado: true,
    });
  }

  movimientos
    .filter((mov) =>
      mov.tipo_movimiento?.toLowerCase().includes("cambio de estado")
    )
    .reverse()
    .forEach((mov) => {
      const match = mov.descripcion.match(/estado:\s*(.+)\.?$/i);

      estados.push({
        estado: match ? match[1].replace(".", "") : "Cambio de estado",
        fecha: mov.fecha,
        descripcion: mov.descripcion,
        completado: true,
      });
    });

  if (expediente?.estado_nombre?.toLowerCase() === "concluido") {
    estados.push({
      estado: "Concluido",
      fecha: expediente.fecha_cierre,
      descripcion: "Expediente concluido",
      completado: true,
    });
  }

  return estados;
};

const obtenerClasePrioridad = (prioridad) => {
  if (prioridad === "Alta") return "bg-danger";
  if (prioridad === "Media") return "bg-warning text-dark";
  if (prioridad === "Baja") return "bg-success";

  return "bg-secondary";
};

const obtenerClaseEstadoRevision = (estadoRevision) => {
  if (estadoRevision === "aceptado") return "bg-success";
  if (estadoRevision === "rechazado") return "bg-danger";
  if (estadoRevision === "corregido") return "bg-primary";
  if (estadoRevision === "error") return "bg-danger";

  return "bg-warning text-dark";
};

const formatearConfianza = (confianza) => {
  if (confianza === null || confianza === undefined || confianza === "") {
    return "No calculada";
  }

  return `${Number(confianza).toFixed(2)}%`;
};

function DetalleExpediente() {
  const { id } = useParams();

  const [expediente, setExpediente] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [error, setError] = useState("");

  const [mostrarModalConclusion, setMostrarModalConclusion] = useState(false);
  const [motivoConclusionId, setMotivoConclusionId] = useState("");
  const [observacionesFinales, setObservacionesFinales] = useState("");
  const [concluyendo, setConcluyendo] = useState(false);

  const perfil = authService.getPerfilGuardado();
  const rol = perfil?.rol?.toLowerCase();

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setError("");

      const data = await expedienteService.obtenerDetalle(id);
      setExpediente(data);

      const movs = await expedienteService.movimientosPorExpediente(id);
      setMovimientos(movs);

      const docs = await expedienteService.documentosPorExpediente(id);
      setDocumentos(docs);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el expediente.");
    }
  };

  const concluirExpediente = async () => {
    if (!motivoConclusionId) {
      alert("Selecciona un motivo de conclusión.");
      return;
    }

    if (!observacionesFinales.trim()) {
      alert("Escribe las observaciones finales.");
      return;
    }

    try {
      setConcluyendo(true);

      await expedienteService.concluirExpediente(
        id,
        Number(motivoConclusionId),
        observacionesFinales
      );

      alert("Expediente concluido correctamente.");

      setMostrarModalConclusion(false);
      setMotivoConclusionId("");
      setObservacionesFinales("");

      cargarDatos();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Error al concluir expediente.");
    } finally {
      setConcluyendo(false);
    }
  };

  if (error) {
    return (
      <div className="container mt-5">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (!expediente) {
    return (
      <div className="container mt-5">
        <p>Cargando...</p>
      </div>
    );
  }

  const estaConcluido =
    expediente.estado_nombre?.toLowerCase() === "concluido";

  const estadosTimeline = obtenerEstadosTimeline(movimientos, expediente);

  return (
    <div className="container mt-5">
      <div className="card shadow p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Expediente</h2>

          <Link to="/expedientes" className="btn btn-outline-secondary">
            ← Volver al listado
          </Link>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <div className="bg-light rounded p-3 h-100">
              <small className="text-muted">Número de expediente</small>

              <h5 className="mb-0 fw-bold">
                {expediente.numero_expediente}
              </h5>
            </div>
          </div>

          <div className="col-md-6">
            <div className="bg-light rounded p-3 h-100">
              <small className="text-muted">Estado</small>

              <br />

              <span className="badge bg-warning text-dark">
                {expediente.estado_nombre || "Sin estado"}
              </span>
            </div>
          </div>

          <div className="col-md-6">
            <div className="bg-light rounded p-3 h-100">
              <small className="text-muted">Fecha de apertura</small>

              <h6 className="mb-0">
                {formatearFecha(expediente.fecha_apertura)}
              </h6>
            </div>
          </div>

          <div className="col-md-6">
            <div className="bg-light rounded p-3 h-100">
              <small className="text-muted">Fecha de cierre</small>

              <h6 className="mb-0">
                {expediente.fecha_cierre
                  ? formatearFecha(expediente.fecha_cierre)
                  : "No concluido"}
              </h6>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow p-4 mt-4 mb-4">
        <h3 className="mb-4">Línea del tiempo del expediente</h3>

        <div className="timeline-estados">
          {estadosTimeline.map((item, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-dot"></div>

              {index !== estadosTimeline.length - 1 && (
                <div className="timeline-line"></div>
              )}

              <div className="timeline-content">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="fw-bold mb-1">{item.estado}</h6>

                    <p className="text-muted mb-1">{item.descripcion}</p>
                  </div>

                  <span className="badge bg-primary rounded-pill">
                    {item.fecha ? formatearFecha(item.fecha) : "Sin fecha"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(rol === "administrador" || rol === "analista") && !estaConcluido && (
        <>
          <CambiarEstadoExpediente
            expedienteId={id}
            expedienteEstado={expediente.estado_nombre}
            onEstadoActualizado={cargarDatos}
          />

          <div className="mt-4">
            <button
              className="btn btn-danger"
              onClick={() => setMostrarModalConclusion(true)}
            >
              Concluir expediente
            </button>
          </div>
        </>
      )}

      <div className="card shadow p-4 mt-4">
        <h3 className="mb-3">Documentos relacionados</h3>

        {documentos.length > 0 ? (
          <div className="row g-3">
            {documentos.map((doc) => (
              <div key={doc.id} className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body">
                    <h5 className="fw-bold mb-1">
                      <FaFilePdf className="text-danger me-2" />
                      {doc.nombre_documento}
                    </h5>

                    <span className="badge bg-secondary">
                      {doc.tipo_documento_nombre}
                    </span>

                    <p className="text-muted mt-3 mb-3">
                      {doc.descripcion || "Sin descripción"}
                    </p>

                    <div className="small text-muted mb-3">
                      <div>
                        <strong>Subido por:</strong>{" "}
                        {doc.usuario_registra_nombre || "Usuario"}
                      </div>

                      <div>
                        <strong>ID documento:</strong> #{doc.id}
                      </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {doc.archivo_url && (
                        <a
                          href={doc.archivo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary btn-sm rounded-pill"
                        >
                          Ver PDF
                        </a>
                      )}

                      <button
                        className="btn btn-danger btn-sm rounded-pill"
                        onClick={async () => {
                          const confirmar = window.confirm(
                            "¿Eliminar este documento?"
                          );

                          if (!confirmar) return;

                          try {
                            await expedienteService.eliminarDocumento(doc.id);
                            cargarDatos();
                          } catch (error) {
                            console.error(error);
                            alert("No se pudo eliminar.");
                          }
                        }}
                      >
                        Eliminar
                      </button>
                    </div>

                    {doc.analisis ? (
                      <div className="border rounded-4 p-3 mt-3 bg-light">
                        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                          <div>
                            <h6 className="fw-bold mb-1">
                              <FaShieldAlt className="me-2 text-primary" />
                              Análisis asistido del documento
                            </h6>

                            <small className="text-muted">
                              Sugerencia automática. No representa una decisión
                              final del expediente.
                            </small>
                          </div>

                          <span
                            className={`badge ${obtenerClaseEstadoRevision(
                              doc.analisis.estado_revision
                            )}`}
                          >
                            {doc.analisis.estado_revision_display ||
                              "Pendiente de revisión"}
                          </span>
                        </div>

                        <div className="alert alert-warning py-2 px-3 small mb-3">
                          <FaExclamationTriangle className="me-2" />
                          La clasificación debe ser revisada por un usuario
                          analista o administrador antes de considerarse válida.
                        </div>

                        <div className="d-flex flex-wrap gap-2 mb-3">
                          <span
                            className={`badge ${obtenerClasePrioridad(
                              doc.analisis.prioridad
                            )}`}
                          >
                            Prioridad sugerida: {doc.analisis.prioridad}
                          </span>

                          <span className="badge bg-info text-dark">
                            Confianza:{" "}
                            {formatearConfianza(doc.analisis.confianza)}
                          </span>

                          {doc.analisis.requiere_atencion && (
                            <span className="badge bg-danger">
                              Requiere atención
                            </span>
                          )}
                        </div>

                        <p className="mb-2">
                          <FaTag className="me-2 text-secondary" />
                          <strong>Categoría sugerida:</strong>{" "}
                          {doc.analisis.categoria}
                        </p>

                        {doc.analisis.justificacion && (
                          <p className="mb-2">
                            <strong>Justificación:</strong>{" "}
                            {doc.analisis.justificacion}
                          </p>
                        )}

                        {doc.analisis.palabras_detectadas && (
                          <p className="mb-2">
                            <strong>Palabras detectadas:</strong>{" "}
                            {doc.analisis.palabras_detectadas}
                          </p>
                        )}

                        {doc.analisis.texto_extraido_preview && (
                          <div className="mt-3">
                            <strong>Vista previa del texto extraído:</strong>

                            <div className="bg-white border rounded p-2 mt-1 small text-muted">
                              {doc.analisis.texto_extraido_preview}
                            </div>
                          </div>
                        )}

                        <hr />

                        <div className="small text-muted">
  <div>
    <strong>Fecha del análisis:</strong>{" "}
    {formatearFecha(doc.analisis.creado_en)}
  </div>

  {doc.analisis.revisado_por_nombre && (
    <div>
      <FaUser className="me-1" />
      <strong>Revisado por:</strong>{" "}
      {doc.analisis.revisado_por_nombre}
    </div>
  )}

  {doc.analisis.error_analisis && (
    <div className="text-danger mt-2">
      <strong>Error de análisis:</strong>{" "}
      {doc.analisis.error_analisis}
    </div>
  )}
</div>
                      </div>
                    ) : (
                      <div className="alert alert-secondary small mt-3 mb-0">
                        Este documento aún no tiene análisis automático.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay documentos registrados.</p>
        )}
      </div>

      {(rol === "administrador" || rol === "analista") && !estaConcluido && (
        <AgregarDocumento expedienteId={id} onDocumentoGuardado={cargarDatos} />
      )}

      <div className="card shadow p-4 mt-4">
        <h3 className="mb-3">Movimientos</h3>

        {movimientos.length > 0 ? (
          <ul className="list-group">
            {movimientos.map((mov) => (
              <li key={mov.id} className="list-group-item">
                <strong>{mov.tipo_movimiento}</strong> - {mov.descripcion}
                <br />
                <small className="text-muted">
                  {formatearFecha(mov.fecha)}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay movimientos registrados.</p>
        )}
      </div>

      {mostrarModalConclusion && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Concluir expediente</h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setMostrarModalConclusion(false)}
                />
              </div>

              <div className="modal-body">
                <p className="text-muted">
                  Esta acción cerrará el expediente y ya no se podrán agregar
                  documentos ni cambiar su estado.
                </p>

                <div className="mb-3">
                  <label className="form-label">Motivo de conclusión</label>

                  <select
                    className="form-select"
                    value={motivoConclusionId}
                    onChange={(e) => setMotivoConclusionId(e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    <option value="1">Acuerdo de archivo</option>
                    <option value="2">
                      Acuerdo de calificación de falta administrativa
                    </option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Observaciones finales</label>

                  <textarea
                    className="form-control"
                    rows="4"
                    value={observacionesFinales}
                    onChange={(e) => setObservacionesFinales(e.target.value)}
                    placeholder="Describe el motivo o conclusión del expediente..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setMostrarModalConclusion(false)}
                  disabled={concluyendo}
                >
                  Cancelar
                </button>

                <button
                  className="btn btn-danger"
                  onClick={concluirExpediente}
                  disabled={concluyendo}
                >
                  {concluyendo ? "Concluyendo..." : "Concluir expediente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetalleExpediente;