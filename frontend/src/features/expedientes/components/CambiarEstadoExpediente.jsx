import { useMemo, useState } from "react";
import expedienteService from "../../../services/expedienteService";

function normalizarEstado(nombreEstado) {
  if (!nombreEstado) return "";

  return nombreEstado
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatearFecha(fecha) {
  if (!fecha) return "";

  return new Date(fecha).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function CambiarEstadoExpediente({
  expediente,
  expedienteId,
  expedienteEstado,
  onEstadoActualizado,
  onConcluirClick,
}) {
  const [estadoId, setEstadoId] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const estados = [
    { id: 1, nombre: "Registrado" },
    { id: 2, nombre: "En revisión" },
    { id: 3, nombre: "En investigación" },
    { id: 5, nombre: "Inactivo" },
  ];

  const estadoActualNormalizado = normalizarEstado(expedienteEstado);

  const fechaMinimaInactivo = useMemo(() => {
    if (expediente?.fecha_apertura) {
      const fecha = new Date(expediente.fecha_apertura);
      fecha.setHours(fecha.getHours() + 72);
      return fecha;
    }

    if (expediente?.fecha_limite_estado) {
      return new Date(expediente.fecha_limite_estado);
    }

    return null;
  }, [expediente]);

  const puedeInactivarse = useMemo(() => {
    if (!fechaMinimaInactivo) return false;

    return new Date() >= fechaMinimaInactivo;
  }, [fechaMinimaInactivo]);

  const obtenerMotivoBloqueo = (estado) => {
    const destino = normalizarEstado(estado.nombre);

    if (destino === estadoActualNormalizado) {
      return "Estado actual";
    }

    if (destino === "concluido") {
      return "Usa el botón Concluir expediente";
    }

    if (destino === "registrado") {
      return "No se puede regresar a Registrado";
    }

    if (
      estadoActualNormalizado === "registrado" &&
      !["en revision", "en investigacion", "inactivo"].includes(destino)
    ) {
      return "No permitido desde Registrado";
    }

    if (
      estadoActualNormalizado === "inactivo" &&
      !["en revision", "en investigacion"].includes(destino)
    ) {
      return "Para reactivar solo usa En revisión o En investigación";
    }

    if (destino === "inactivo" && !puedeInactivarse) {
      return "Disponible después de 72 horas";
    }

    return "";
  };

  const estadosDisponibles = estados.map((estado) => {
    const motivoBloqueo = obtenerMotivoBloqueo(estado);

    return {
      ...estado,
      bloqueado: Boolean(motivoBloqueo),
      motivoBloqueo,
    };
  });

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

      <p>
        <strong>Estado actual:</strong> {expedienteEstado}
      </p>

      {fechaMinimaInactivo && estadoActualNormalizado !== "inactivo" && (
        <div className="alert alert-info small">
          El expediente solo podrá marcarse como <strong>Inactivo</strong>{" "}
          después de 72 horas desde su apertura.
          <br />
          <strong>Disponible a partir de:</strong>{" "}
          {formatearFecha(fechaMinimaInactivo)}
        </div>
      )}

      {estadoActualNormalizado === "inactivo" && (
        <div className="alert alert-warning small">
          Este expediente se encuentra inactivo. Para volver a activarlo, debe
          cambiarse a <strong>En revisión</strong> o{" "}
          <strong>En investigación</strong>.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <select
          className="form-select mb-3"
          value={estadoId}
          onChange={(e) => setEstadoId(e.target.value)}
        >
          <option value="">Seleccione un estado</option>

          {estadosDisponibles.map((estado) => (
            <option
              key={estado.id}
              value={estado.id}
              disabled={estado.bloqueado}
            >
              {estado.nombre}
              {estado.motivoBloqueo ? ` - ${estado.motivoBloqueo}` : ""}
            </option>
          ))}
        </select>

        <button className="btn btn-primary" type="submit">
          Actualizar estado
        </button>
      </form>

      {mensaje && <p className="text-success mt-2">{mensaje}</p>}
      {error && <p className="text-danger mt-2">{error}</p>}

      {onConcluirClick && (
        <div className="border-top pt-3 mt-4">
          <p className="text-muted small mb-2">
            Usa esta opción únicamente cuando el expediente haya finalizado de
            forma definitiva.
          </p>

          <button className="btn btn-danger" onClick={onConcluirClick}>
            Concluir expediente
          </button>
        </div>
      )}
    </div>
  );
}

export default CambiarEstadoExpediente;