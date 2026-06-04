import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import quejaService from "../../../services/quejaService";

function CrearQueja() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    folio: "",
    tipo_registro: "",
    asunto: "",
    descripcion: "",
    nombre_servidor_publico: "",
    cargo_servidor_publico: "",
    area_involucrada: "",
    observaciones: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [tiposRegistro, setTiposRegistro] = useState([]);
  const [areas, setAreas] = useState([]);
  const [errores, setErrores] = useState({});

  const [folioValidando, setFolioValidando] = useState(false);
  const [folioDisponible, setFolioDisponible] = useState(null);

  useEffect(() => {
    cargarCatalogos();
    cargarFolio();
  }, []);

  useEffect(() => {
    const folio = formData.folio.trim();

    setFolioDisponible(null);

    if (!folio) {
      setErrores((prev) => ({
        ...prev,
        folio: "El folio es obligatorio",
      }));
      return;
    }

    if (folio.length > 15) {
      setErrores((prev) => ({
        ...prev,
        folio: "El folio no puede tener más de 15 caracteres",
      }));
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setFolioValidando(true);

        const data = await quejaService.validarFolio(folio);

        setFolioDisponible(data.disponible);

        setErrores((prev) => ({
          ...prev,
          folio: data.disponible ? "" : data.mensaje,
        }));
      } catch (err) {
        console.error(err);

        const mensajeError =
          err.response?.data?.mensaje || "No se pudo validar el folio.";

        setFolioDisponible(false);

        setErrores((prev) => ({
          ...prev,
          folio: mensajeError,
        }));
      } finally {
        setFolioValidando(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [formData.folio]);

  const cargarCatalogos = async () => {
    try {
      const tipos = await quejaService.obtenerTiposRegistro();
      const areasData = await quejaService.obtenerAreas();

      setTiposRegistro(tipos);
      setAreas(areasData);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarFolio = async () => {
    try {
      const data = await quejaService.obtenerSiguienteFolio();

      setFormData((prev) => ({
        ...prev,
        folio: data.folio,
      }));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "No se pudo obtener el folio.");
    }
  };

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === "folio") {
      value = value.slice(0, 15);
    }

    setFormData({
      ...formData,
      [name]: value,
    });

    setErrores({
      ...errores,
      [name]: "",
    });
  };

  const folioValido =
    formData.folio.trim() !== "" &&
    folioDisponible === true &&
    !errores.folio;

  const puedeTipoRegistro = folioValido;

  const puedeAsunto =
    puedeTipoRegistro && formData.tipo_registro.trim() !== "";

  const puedeDescripcion =
    puedeAsunto && formData.asunto.trim() !== "";

  const puedeServidorPublico =
    puedeDescripcion && formData.descripcion.trim().length >= 10;

  const puedeCargo =
    puedeServidorPublico && formData.nombre_servidor_publico.trim() !== "";

  const puedeArea =
    puedeCargo && formData.cargo_servidor_publico.trim() !== "";

  const puedeObservaciones =
    puedeArea && formData.area_involucrada.trim() !== "";

  const puedeGuardar = puedeObservaciones;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");
    setErrores({});

    let nuevosErrores = {};

    if (!formData.folio.trim()) {
      nuevosErrores.folio = "El folio es obligatorio";
    }

    if (formData.folio.trim().length > 15) {
      nuevosErrores.folio = "El folio no puede tener más de 15 caracteres";
    }

    if (folioDisponible !== true) {
      nuevosErrores.folio =
        errores.folio || "El folio debe estar disponible para continuar";
    }

    if (!formData.tipo_registro) {
      nuevosErrores.tipo_registro = "Seleccione un tipo de registro";
    }

    if (!formData.asunto.trim()) {
      nuevosErrores.asunto = "El asunto es obligatorio";
    }

    if (!formData.descripcion.trim()) {
      nuevosErrores.descripcion = "La descripción es obligatoria";
    }

    if (formData.descripcion.trim().length < 10) {
      nuevosErrores.descripcion =
        "La descripción debe tener al menos 10 caracteres";
    }

    if (!formData.nombre_servidor_publico.trim()) {
      nuevosErrores.nombre_servidor_publico =
        "El servidor público es obligatorio";
    }

    if (!formData.cargo_servidor_publico.trim()) {
      nuevosErrores.cargo_servidor_publico = "El cargo es obligatorio";
    }

    if (!formData.area_involucrada) {
      nuevosErrores.area_involucrada = "Seleccione un área";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      const response = await quejaService.crearQueja(formData);

      setMensaje("Queja registrada correctamente.");

      if (response.expediente_id) {
        navigate(`/expedientes/${response.expediente_id}`);
      } else {
        navigate("/quejas");
      }
    } catch (err) {
      console.log("ERROR BACKEND:", err.response?.data);
      console.error(err);

      if (err.response?.data) {
        setErrores(err.response.data);
      } else {
        setError("No se pudo registrar la queja.");
      }
    }
  };

  return (
    <div className="container mt-5 d-flex justify-content-center">
      <div className="card shadow p-4 w-100" style={{ maxWidth: "650px" }}>
        <h4 className="mb-3 fw-bold text-primary">
          Registrar queja o denuncia
        </h4>

        <form onSubmit={handleSubmit}>
          {/* FOLIO */}
          <div className="mb-3">
            <label className="form-label">
              Folio <span className="text-danger">*</span>
            </label>

            <input
              type="text"
              maxLength="15"
              className={`form-control ${
                errores.folio
                  ? "is-invalid"
                  : folioDisponible === true
                  ? "is-valid"
                  : ""
              }`}
              name="folio"
              value={formData.folio}
              onChange={handleChange}
              placeholder="Máximo 15 caracteres"
            />

            {folioValidando && (
              <div className="form-text">Validando folio...</div>
            )}

            {folioDisponible === true && !errores.folio && (
              <div className="valid-feedback">Folio disponible.</div>
            )}

            <div className="invalid-feedback">{errores.folio}</div>
          </div>

          {/* TIPO REGISTRO */}
          <div className="mb-3">
            <label className="form-label">
              Tipo de registro <span className="text-danger">*</span>
            </label>

            <select
              className={`form-select ${
                errores.tipo_registro ? "is-invalid" : ""
              }`}
              name="tipo_registro"
              value={formData.tipo_registro}
              onChange={handleChange}
              disabled={!puedeTipoRegistro}
            >
              <option value="">Seleccione...</option>

              {tiposRegistro.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>

            {!puedeTipoRegistro && (
              <div className="form-text">
                Primero capture un folio disponible.
              </div>
            )}

            <div className="invalid-feedback">{errores.tipo_registro}</div>
          </div>

          {/* ASUNTO */}
          <div className="mb-3">
            <label className="form-label">
              Asunto <span className="text-danger">*</span>
            </label>

            <input
              type="text"
              className={`form-control ${errores.asunto ? "is-invalid" : ""}`}
              name="asunto"
              value={formData.asunto}
              onChange={handleChange}
              disabled={!puedeAsunto}
            />

            {!puedeAsunto && (
              <div className="form-text">
                Primero seleccione el tipo de registro.
              </div>
            )}

            <div className="invalid-feedback">{errores.asunto}</div>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="mb-3">
            <label className="form-label">
              Descripción <span className="text-danger">*</span>
            </label>

            <textarea
              className={`form-control ${
                errores.descripcion ? "is-invalid" : ""
              }`}
              name="descripcion"
              rows="3"
              value={formData.descripcion}
              onChange={handleChange}
              disabled={!puedeDescripcion}
            />

            {!puedeDescripcion && (
              <div className="form-text">Primero escriba el asunto.</div>
            )}

            <div className="invalid-feedback">{errores.descripcion}</div>
          </div>

          {/* SERVIDOR PUBLICO */}
          <div className="mb-3">
            <label className="form-label">
              Servidor público <span className="text-danger">*</span>
            </label>

            <input
              type="text"
              className={`form-control ${
                errores.nombre_servidor_publico ? "is-invalid" : ""
              }`}
              name="nombre_servidor_publico"
              value={formData.nombre_servidor_publico}
              onChange={handleChange}
              disabled={!puedeServidorPublico}
            />

            {!puedeServidorPublico && (
              <div className="form-text">
                Primero escriba una descripción válida.
              </div>
            )}

            <div className="invalid-feedback">
              {errores.nombre_servidor_publico}
            </div>
          </div>

          {/* CARGO */}
          <div className="mb-3">
            <label className="form-label">
              Cargo <span className="text-danger">*</span>
            </label>

            <input
              type="text"
              className={`form-control ${
                errores.cargo_servidor_publico ? "is-invalid" : ""
              }`}
              name="cargo_servidor_publico"
              value={formData.cargo_servidor_publico}
              onChange={handleChange}
              disabled={!puedeCargo}
            />

            {!puedeCargo && (
              <div className="form-text">
                Primero escriba el servidor público.
              </div>
            )}

            <div className="invalid-feedback">
              {errores.cargo_servidor_publico}
            </div>
          </div>

          {/* AREA */}
          <div className="mb-3">
            <label className="form-label">
              Área involucrada <span className="text-danger">*</span>
            </label>

            <select
              className={`form-select ${
                errores.area_involucrada ? "is-invalid" : ""
              }`}
              name="area_involucrada"
              value={formData.area_involucrada}
              onChange={handleChange}
              disabled={!puedeArea}
            >
              <option value="">Seleccione...</option>

              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nombre}
                </option>
              ))}
            </select>

            {!puedeArea && (
              <div className="form-text">Primero escriba el cargo.</div>
            )}

            <div className="invalid-feedback">{errores.area_involucrada}</div>
          </div>

          {/* OBSERVACIONES */}
          <div className="mb-3">
            <label className="form-label">Observaciones</label>

            <textarea
              className="form-control"
              name="observaciones"
              rows="2"
              value={formData.observaciones}
              onChange={handleChange}
              disabled={!puedeObservaciones}
            />

            {!puedeObservaciones && (
              <div className="form-text">
                Primero seleccione el área involucrada.
              </div>
            )}
          </div>

          {/* BOTONES */}
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => window.history.back()}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!puedeGuardar || folioValidando}
            >
              Guardar
            </button>
          </div>
        </form>

        {Object.keys(errores).some((key) => errores[key]) && (
          <div className="alert alert-danger mt-3">
            Por favor completa correctamente los campos obligatorios.
          </div>
        )}

        {mensaje && <p className="text-success mt-3">{mensaje}</p>}
        {error && <p className="text-danger mt-3">{error}</p>}
      </div>
    </div>
  );
}

export default CrearQueja;