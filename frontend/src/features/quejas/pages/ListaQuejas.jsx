import { useEffect, useState } from "react";
import quejaService from "../../../services/quejaService";
import { Link } from "react-router-dom";

function ListaQuejas() {
  const [quejas, setQuejas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarQuejas();
  }, []);

  const cargarQuejas = async () => {
    try {
      const data = await quejaService.listarQuejas();
      setQuejas(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las quejas.");
    }
  };

  // 🔍 FILTRO DE BÚSQUEDA
  const quejasFiltradas = quejas.filter(
    (queja) =>
      queja.folio
        ?.toLowerCase()
        .includes(busqueda.toLowerCase()) ||
      queja.asunto
        ?.toLowerCase()
        .includes(busqueda.toLowerCase())
  );

  return (
    <div className="container mt-5">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          Lista de quejas y denuncias
        </h2>

        <Link
          to="/quejas/nueva"
          className="btn btn-primary"
        >
          Nueva queja
        </Link>
      </div>

      {/* BUSCADOR */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar por folio o asunto..."
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
              <th>Folio</th>
              <th>Asunto</th>
              <th>Fecha de ingreso</th>
              <th>Área involucrada</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {quejasFiltradas.length > 0 ? (
              quejasFiltradas.map((queja) => (
                <tr key={queja.id}>
                  <td>{queja.folio}</td>

                  <td>{queja.asunto}</td>

                  <td>
                    {new Date(
                      queja.fecha_ingreso
                    ).toLocaleDateString("es-MX")}
                  </td>

                  <td>
                    {queja.area_involucrada_nombre ||
                      "No especificada"}
                  </td>

                  <td>
                    <Link
                      to={`/quejas/${queja.id}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="text-center text-muted"
                >
                  No hay registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListaQuejas;
