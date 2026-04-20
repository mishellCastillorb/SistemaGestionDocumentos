import { useState } from "react";
import quejaService from "../../../services/quejaService";

function CrearQueja() {
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

    try {
      await quejaService.crearQueja(formData);
      setMensaje("Queja registrada correctamente.");
      setFormData({
        folio: "",
        tipo_registro: "",
        asunto: "",
        descripcion: "",
        nombre_servidor_publico: "",
        cargo_servidor_publico: "",
        area_involucrada: "",
        observaciones: "",
      });
    } catch (err) {
      console.error(err);
      setError("No se pudo registrar la queja.");
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h2 className="mb-4">Registrar queja o denuncia</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Folio</label>
            <input
              type="text"
              className="form-control"
              name="folio"
              value={formData.folio}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Tipo de registro</label>
            <input
              type="text"
              className="form-control"
              name="tipo_registro"
              value={formData.tipo_registro}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Asunto</label>
            <input
              type="text"
              className="form-control"
              name="asunto"
              value={formData.asunto}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-control"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Servidor público involucrado</label>
            <input
              type="text"
              className="form-control"
              name="nombre_servidor_publico"
              value={formData.nombre_servidor_publico}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Cargo del servidor público</label>
            <input
              type="text"
              className="form-control"
              name="cargo_servidor_publico"
              value={formData.cargo_servidor_publico}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Área involucrada</label>
            <input
              type="text"
              className="form-control"
              name="area_involucrada"
              value={formData.area_involucrada}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Observaciones</label>
            <textarea
              className="form-control"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Guardar
          </button>
        </form>

        {mensaje && <p className="text-success mt-3">{mensaje}</p>}
        {error && <p className="text-danger mt-3">{error}</p>}
      </div>
    </div>
  );
}

export default CrearQueja;