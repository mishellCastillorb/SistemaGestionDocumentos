import { useEffect, useState } from "react";
import quejaService from "../../../services/quejaService";
import { Link } from "react-router-dom";

function ListaQuejas() {
  const [quejas, setQuejas] = useState([]);
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

  return (
    <div className="container mt-5">

      {/* encabezadod boton */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Lista de quejas y denuncias</h2>
        <Link to="/quejas/nueva" className="btn btn-primary">
          Nueva queja
        </Link>
      </div>

      {error && <p className="text-danger">{error}</p>}

      <div className="card shadow p-3">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Asunto</th>
              <th>Fecha de ingreso</th>
              <th>Área involucrada</th>
              <th>Acciones</th> {/* nueva columna */}
            </tr>
          </thead>
          <tbody>
            {quejas.length > 0 ? (
              quejas.map((queja) => (
                <tr key={queja.id}>
                  <td>{queja.folio}</td>
                  <td>{queja.asunto}</td>
                  <td>{queja.fecha_ingreso}</td>
                  <td>{queja.area_involucrada || "No especificada"}</td>
                  <td>
                    {/* */}
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
                <td colSpan="5" className="text-center">
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