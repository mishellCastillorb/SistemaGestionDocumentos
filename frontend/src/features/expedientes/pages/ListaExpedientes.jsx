import { useEffect, useState } from "react";
import expedienteService from "../../../services/expedienteService";
import { Link } from "react-router-dom";

function ListaExpedientes() {
  const [expedientes, setExpedientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
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

  // 🔍 FILTRO
  const expedientesFiltrados = expedientes.filter(
    (exp) =>
      exp.numero_expediente
        ?.toLowerCase()
        .includes(busqueda.toLowerCase()) ||
      exp.estado_nombre
        ?.toLowerCase()
        .includes(busqueda.toLowerCase())
  );

  return (
    <div className="container mt-5">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Lista de expedientes</h2>
      </div>

      {/* BUSCADOR */}
      <div className="input-group mb-3">


        <input
          type="text"
          className="form-control"
          placeholder="Buscar expediente..."
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
        />
      </div>

      {/* ERROR */}
      {error && (
        <p className="text-danger">{error}</p>
      )}

      {/* TABLA */}
      <div className="card shadow p-3">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Número</th>
              <th>Estado</th>
              <th>Fecha apertura</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {expedientesFiltrados.length > 0 ? (
              expedientesFiltrados.map((exp) => (
                <tr key={exp.id}>
                  <td>
                    {exp.numero_expediente}
                  </td>

                  <td>
                    <span className="badge bg-warning text-dark">
                      {exp.estado_nombre}
                    </span>
                  </td>

                  <td>
                    {new Date(
                      exp.fecha_apertura
                    ).toLocaleDateString("es-MX")}
                  </td>

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
                <td
                  colSpan="4"
                  className="text-center text-muted"
                >
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
