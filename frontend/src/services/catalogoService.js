import api from "../api/axios";

const catalogoService = {
  async listarTiposDocumento() {
    const response = await api.get("catalogos/tipos-documento/");
    return response.data;
  },
};

export default catalogoService;