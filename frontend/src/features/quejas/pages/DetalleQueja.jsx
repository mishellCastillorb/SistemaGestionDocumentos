import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import quejaService from "../../../services/quejaService";

function DetalleQueja() {
  const { id } = useParams();
  const [queja, setQueja] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDetalle();
  }, []);

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
    return <div className="container mt-5"><p className="text-danger">{error}</p></div>;
  }

  if (!queja) {
    return <div className="container mt-5"><p>Cargando...</p></div>;
  }

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h2 className="mb-4">Detalle de queja</h2>

        <p><strong>Folio:</strong> {queja.folio}</p>
        <p><strong>Asunto:</strong> {queja.asunto}</p>
        <p><strong>Descripción:</strong> {queja.descripcion}</p>
        <p><strong>Fecha de ingreso:</strong> {queja.fecha_ingreso}</p>
        <p><strong>Servidor público:</strong> {queja.nombre_servidor_publico || "No especificado"}</p>
        <p><strong>Cargo:</strong> {queja.cargo_servidor_publico || "No especificado"}</p>
        <p><strong>Área involucrada:</strong> {queja.area_involucrada || "No especificada"}</p>
        <p><strong>Observaciones:</strong> {queja.observaciones || "Sin observaciones"}</p>
      </div>
    </div>
  );
}

export default DetalleQueja;