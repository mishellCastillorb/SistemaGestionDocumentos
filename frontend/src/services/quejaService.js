import api from "../api/axios";

const quejaService = {
  async crearQueja(datos) {
    const response = await api.post("quejas/", datos);
    return response.data;
  },

  async listarQuejas() {
    const response = await api.get("quejas/lista/");
    return response.data;
  },

  async obtenerDetalleQueja(id) {
    const response = await api.get(`quejas/${id}/`);
    return response.data;
  },

  async obtenerSiguienteFolio() {
    const response = await api.get("quejas/siguiente-folio/");
    return response.data;
  },

  async validarFolio(folio) {
    const response = await api.get(
      `quejas/validar-folio/?folio=${encodeURIComponent(folio)}`
    );

    return response.data;
  },

  async obtenerTiposRegistro() {
    const response = await api.get("catalogos/tipos-registro/");
    return response.data;
  },

  async obtenerAreas() {
    const response = await api.get("catalogos/areas/");
    return response.data;
  },
};

export default quejaService;