import { useState } from "react";
import quejaService from "../../../services/quejaService";
import { useEffect } from "react";

function CrearQueja() {
  const [formData, setFormData] = useState({
    // folio: "",
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

  // validaciones
  const validar = () => {
    let nuevosErrores = {};

    // if (!formData.folio) nuevosErrores.folio = "El folio es obligatorio";
    if (!formData.tipo_registro) nuevosErrores.tipo_registro = "Seleccione un tipo";
    if (!formData.asunto) nuevosErrores.asunto = "El asunto es obligatorio";
    if (!formData.descripcion) nuevosErrores.descripcion = "La descripción es obligatoria";

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    setErrores({});

    let nuevosErrores = {};

    // if (!formData.folio) nuevosErrores.folio = "El folio es obligatorio";
    if (!formData.tipo_registro)
      nuevosErrores.tipo_registro = "Seleccione un tipo de registro";

    if (!formData.asunto)
      nuevosErrores.asunto = "El asunto es obligatorio";

    if (!formData.descripcion)
      nuevosErrores.descripcion = "La descripción es obligatoria";

    if (!formData.nombre_servidor_publico)
      nuevosErrores.nombre_servidor_publico = "El servidor público es obligatorio";

    if (!formData.cargo_servidor_publico)
      nuevosErrores.cargo_servidor_publico = "El cargo es obligatorio";

    if (!formData.area_involucrada)
      nuevosErrores.area_involucrada = "Seleccione un área";

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      await quejaService.crearQueja(formData);
      setMensaje("Queja registrada correctamente.");
    } catch (err) {
      console.error(err);

      if (err.response?.data) {
        setErrores(err.response.data);
      } else {
        setError("No se pudo registrar la queja.");
      }
    }
  };

  // cargar datos
  useEffect(() => {
    cargarCatalogos();
    cargarFolio();
  }, []);

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
      setFormData(prev => ({
        ...prev,
        folio: data.folio
      }));
    } catch (err) {
      console.error(err);
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
              Folio
            </label>
            <input
              type="text"
              className="form-control"
              value={formData.folio}
              readOnly
            />
          </div>

          {/* TIPO REGISTRO */}
          <div className="mb-3">
            <label className="form-label">
              Tipo de registro <span className="text-danger">*</span>
            </label>
            <select
              className="form-select"
              name="tipo_registro"
              value={formData.tipo_registro}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione...</option>
              {tiposRegistro.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
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
            />
            <div className="invalid-feedback">
              {errores.asunto}
            </div>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="mb-3">
            <label className="form-label">
              Descripción <span className="text-danger">*</span>
            </label>
            <textarea
              className={`form-control ${errores.descripcion ? "is-invalid" : ""}`}
              name="descripcion"
              rows="3"
              value={formData.descripcion}
              onChange={handleChange}
            />
            <div className="invalid-feedback">
              {errores.descripcion}
            </div>
          </div>

          {/* SERVIDOR */}
          <div className="mb-3">
            <label className="form-label">
              Servidor público <span className="text-danger">*</span>
            </label>

            <input
              type="text"
              className={`form-control ${errores.nombre_servidor_publico ? "is-invalid" : ""}`}
              name="nombre_servidor_publico"
              value={formData.nombre_servidor_publico}
              onChange={handleChange}
            />

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
              className={`form-control ${errores.cargo_servidor_publico ? "is-invalid" : ""}`}
              name="cargo_servidor_publico"
              value={formData.cargo_servidor_publico}
              onChange={handleChange}
            />

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
              className={`form-select ${errores.area_involucrada ? "is-invalid" : ""}`}
              name="area_involucrada"
              value={formData.area_involucrada}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nombre}
                </option>
              ))}
            </select>
            <div className="invalid-feedback">
              {errores.area_involucrada}
            </div>
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
            />
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

            <button type="submit" className="btn btn-primary">
              Guardar
            </button>
          </div>
        </form>

        {Object.keys(errores).length > 0 && (
          <div className="alert alert-danger mt-3">
            Por favor completa los campos obligatorios.
          </div>
        )}

        {mensaje && <p className="text-success mt-3">{mensaje}</p>}
        {error && <p className="text-danger mt-3">{error}</p>}
      </div>
    </div>
  );
}

export default CrearQueja;