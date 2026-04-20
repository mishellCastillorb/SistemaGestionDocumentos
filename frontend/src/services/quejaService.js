import api from "../api/axios";

const quejaService = {
  async listarQuejas() {
    const response = await api.get("quejas/lista/");
    return response.data;
  },

  async crearQueja(data) {
    const response = await api.post("quejas/", data);
    return response.data;
  },

  async obtenerDetalle(id) {
    const response = await api.get(`quejas/${id}/`);
    return response.data;
  },
};

export default quejaService;