import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import expedienteService from "../../../services/expedienteService";
import CambiarEstadoExpediente from "../components/CambiarEstadoExpediente";
import AgregarDocumento from "../components/AgregarDocumento";
import authService from "../../../services/authService";

function DetalleExpediente() {
  const { id } = useParams();

  const [expediente, setExpediente] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [error, setError] = useState("");

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

  return (
    <div className="container mt-5">
      <div className="card shadow p-4 mb-4">
        <h2>Expediente</h2>

        <p><strong>Número:</strong> {expediente.numero_expediente}</p>
        <p><strong>Estado:</strong> {expediente.estado_nombre || "Sin estado"}</p>
        <p><strong>Fecha apertura:</strong> {expediente.fecha_apertura}</p>
        <p><strong>Fecha cierre:</strong> {expediente.fecha_cierre || "No concluido"}</p>
      </div>

      {(rol === "administrador" || rol === "analista") && (
        <CambiarEstadoExpediente
          expedienteId={id}
          expedienteEstado={expediente.estado_nombre}
          onEstadoActualizado={cargarDatos}
        />
      )}

      <div className="card shadow p-4 mt-4">
        <h3>Documentos relacionados</h3>

        {documentos.length > 0 ? (
          <ul className="list-group">
            {documentos.map((doc) => {
              console.log(doc);

              return (
                <li key={doc.id} className="list-group-item">
                  <strong>{doc.nombre_documento}</strong>
                  <br />
                  <span>Tipo: {doc.tipo_documento_nombre}</span>
                  <br />
                  <span>Descripción: {doc.descripcion || "Sin descripción"}</span>
                  <br />
                  {doc.archivo_url && (
                    <a
                      href={doc.archivo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-outline-secondary mt-2"
                    >
                      Ver archivo
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No hay documntos registrados.</p>
        )}
      </div>

      {(rol === "administrador" || rol === "analista") && (
        <AgregarDocumento
          expedienteId={id}
          onDocumentoGuardado={cargarDatos}
        />
      )}

      <div className="card shadow p-4 mt-4">
        <h3>Movimientos</h3>

        {movimientos.length > 0 ? (
          <ul className="list-group">
            {movimientos.map((mov) => (
              <li key={mov.id} className="list-group-item">
                <strong>{mov.tipo_movimiento}</strong> - {mov.descripcion}
                <br />
                <small>{mov.fecha}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay movimientos registrados.</p>
        )}
      </div>
    </div>
  );
}

export default DetalleExpediente;