import api from "../api/axios";

const analisisDocumentoService = {
  async aceptarAnalisis(analisisId, comentarioRevisor = "") {
    const response = await api.post(
      `analisis-documentos/${analisisId}/aceptar/`,
      {
        comentario_revisor: comentarioRevisor,
      }
    );

    return response.data;
  },

  async rechazarAnalisis(analisisId, comentarioRevisor = "") {
    const response = await api.post(
      `analisis-documentos/${analisisId}/rechazar/`,
      {
        comentario_revisor: comentarioRevisor,
      }
    );

    return response.data;
  },

  async corregirAnalisis(analisisId, datosCorreccion) {
    const response = await api.post(
      `analisis-documentos/${analisisId}/corregir/`,
      datosCorreccion
    );

    return response.data;
  },
};

export default analisisDocumentoService;