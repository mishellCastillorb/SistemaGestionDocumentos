import { useState } from "react";
import expedienteService from "../../../services/expedienteService";

function AgregarDocumento({ expedienteId, onDocumentoGuardado }) {
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [nombreDocumento, setNombreDocumento] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!tipoDocumento || !nombreDocumento.trim()) {
      setError("Completa los campos obligatorios.");
      return;
    }

    try {
      setCargando(true);

      const formData = new FormData();
      formData.append("expediente", expedienteId);
      formData.append("tipo_documento", tipoDocumento);
      formData.append("nombre_documento", nombreDocumento);
      formData.append("descripcion", descripcion);

      if (archivo) {
        formData.append("archivo", archivo);
      }

      await expedienteService.subirDocumento(formData);

      setMensaje("Documento agregado correctamente.");
      setTipoDocumento("");
      setNombreDocumento("");
      setDescripcion("");
      setArchivo(null);

      if (onDocumentoGuardado) {
        onDocumentoGuardado();
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el documento.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="card shadow p-4 mt-4">
      <h3>Agregar documento relacionado</h3>

      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Tipo de documento</label>
          <select
            className="form-select"
            value={tipoDocumento}
            onChange={(e) => setTipoDocumento(e.target.value)}
          >
            <option value="">Selecciona un tipo</option>
            <option value="1">Oficio</option>
            <option value="2">Escrito</option>
            <option value="3">Acuerdo</option>
            <option value="4">Notificación</option>
            <option value="5">Anexo</option>
            <option value="6">Evidencia</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Nombre del documento</label>
          <input
            type="text"
            className="form-control"
            value={nombreDocumento}
            onChange={(e) => setNombreDocumento(e.target.value)}
            placeholder="Ej. Oficio de notificación"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Descripción</label>
          <textarea
            className="form-control"
            rows="3"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción del documento"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Archivo</label>
          <input
            type="file"
            className="form-control"
            onChange={(e) => setArchivo(e.target.files[0])}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={cargando}>
          {cargando ? "Guardando..." : "Guardar documento"}
        </button>
      </form>
    </div>
  );
}

export default AgregarDocumento;