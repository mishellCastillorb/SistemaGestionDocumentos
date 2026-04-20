import { useState } from "react";
import expedienteService from "../../../services/expedienteService";

function CambiarEstadoExpediente({ expedienteId, expedienteEstado, onEstadoActualizado }) {
  const [estadoId, setEstadoId] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const estados = [
    { id: 1, nombre: "Registrado" },
    { id: 2, nombre: "En revisión" },
    { id: 3, nombre: "En investigación" },
    { id: 4, nombre: "Activo" },
    { id: 5, nombre: "Inactivo" },
    { id: 6, nombre: "Concluido" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!estadoId) {
      setError("Selecciona un estado.");
      return;
    }

    try {
      await expedienteService.cambiarEstado(expedienteId, Number(estadoId));
      setMensaje("Estado actualizado correctamente.");
      setEstadoId("");

      if (onEstadoActualizado) {
        onEstadoActualizado();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "No se pudo actualizar el estado.");
    }
  };

  return (
    <div className="card shadow p-4 mt-4">
      <h3>Cambiar estado</h3>
      <p><strong>Estado actual:</strong> {expedienteEstado}</p>

      <form onSubmit={handleSubmit}>
        <select
          className="form-select mb-3"
          value={estadoId}
          onChange={(e) => setEstadoId(e.target.value)}
        >
          <option value="">Seleccione un estado</option>

          {estados
            .filter(
              (estado) =>
                estado.nombre.toLowerCase() !== expedienteEstado?.toLowerCase() &&
                estado.nombre.toLowerCase() !== "concluido"
            )
            .map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.nombre}
              </option>
            ))}
        </select>

        <button className="btn btn-primary">Actualizar</button>
      </form>

      {mensaje && <p className="text-success mt-2">{mensaje}</p>}
      {error && <p className="text-danger mt-2">{error}</p>}
    </div>
  );
}

export default CambiarEstadoExpediente;