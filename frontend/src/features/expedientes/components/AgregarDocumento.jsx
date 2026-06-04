import { useEffect, useRef, useState } from "react";
import expedienteService from "../../../services/expedienteService";
import catalogoService from "../../../services/catalogoService";

function AgregarDocumento({ expedienteId, onDocumentoGuardado }) {
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [nombreDocumento, setNombreDocumento] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoTipos, setCargandoTipos] = useState(false);

  const inputArchivoRef = useRef(null);

  useEffect(() => {
    const cargarTiposDocumento = async () => {
      try {
        setCargandoTipos(true);
        const data = await catalogoService.listarTiposDocumento();
        setTiposDocumento(data);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los tipos de documento.");
      } finally {
        setCargandoTipos(false);
      }
    };

    cargarTiposDocumento();
  }, []);

  const limpiarFormulario = () => {
    setTipoDocumento("");
    setNombreDocumento("");
    setDescripcion("");
    setArchivo(null);

    if (inputArchivoRef.current) {
      inputArchivoRef.current.value = "";
    }
  };

  const validarArchivoPdf = (file) => {
    const nombreValido = file.name.toLowerCase().endsWith(".pdf");
    const tipoValido = !file.type || file.type === "application/pdf";

    return nombreValido && tipoValido;
  };

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
      formData.append("nombre_documento", nombreDocumento.trim());
      formData.append("descripcion", descripcion.trim());

      if (archivo) {
        formData.append("archivo", archivo);
      }

      await expedienteService.subirDocumento(formData);

      setMensaje("Documento agregado correctamente.");
      limpiarFormulario();

      if (onDocumentoGuardado) {
        onDocumentoGuardado();
      }
    } catch (err) {
      console.error(err);

      const mensajeBackend =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "No se pudo guardar el documento.";

      setError(mensajeBackend);
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
            disabled={cargandoTipos}
          >
            <option value="">
              {cargandoTipos ? "Cargando tipos..." : "Selecciona un tipo"}
            </option>

            {tiposDocumento.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
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
          <label className="form-label">Archivo PDF</label>

          <input
            ref={inputArchivoRef}
            type="file"
            className="form-control"
            accept="application/pdf,.pdf"
            onChange={(e) => {
              const file = e.target.files[0];

              if (!file) {
                setArchivo(null);
                return;
              }

              if (!validarArchivoPdf(file)) {
                setError("Solo se permiten archivos PDF.");
                setArchivo(null);
                e.target.value = "";
                return;
              }

              setError("");
              setArchivo(file);
            }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={cargando || cargandoTipos}
        >
          {cargando ? "Guardando..." : "Guardar documento"}
        </button>
      </form>
    </div>
  );
}

export default AgregarDocumento;
