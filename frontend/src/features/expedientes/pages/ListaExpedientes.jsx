import { useEffect, useState } from "react";
import expedienteService from "../../../services/expedienteService";
import { Link } from "react-router-dom";

function ListaExpedientes() {
  const [expedientes, setExpedientes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarExpedientes();
  }, []);

  const cargarExpedientes = async () => {
    try {
      const data = await expedienteService.listarExpedientes();
      setExpedientes(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los expedientes.");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Lista de expedientes</h2>

      {error && <p className="text-danger">{error}</p>}

      <div className="card shadow p-3">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Número</th>
              <th>Estado</th>
              <th>Fecha apertura</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {expedientes.length > 0 ? (
              expedientes.map((exp) => (
                <tr key={exp.id}>
                  <td>{exp.numero_expediente}</td>
                  <td>{exp.estado_nombre}</td>
                  <td>{exp.fecha_apertura}</td>
                  <td>
                    <Link
                      to={`/expedientes/${exp.id}`}
                      className="btn btn-sm btn-primary"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center">
                  No hay expedientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListaExpedientes;