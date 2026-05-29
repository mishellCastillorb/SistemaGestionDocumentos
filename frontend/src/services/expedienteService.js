import api from "../api/axios";

const expedienteService = {
  async listarExpedientes() {
    const response = await api.get("expedientes/");
    return response.data;
  },

  async obtenerDetalle(id) {
    const response = await api.get(`expedientes/${id}/`);
    return response.data;
  },

  async movimientosPorExpediente(id) {
    const response = await api.get(`expedientes/${id}/movimientos/`);
    return response.data;
  },

  async cambiarEstado(expedienteId, estadoId) {
    const response = await api.post(
      `expedientes/${expedienteId}/cambiar-estado/`,
      {
        estado_id: estadoId,
      }
    );
    return response.data;
  },

  async concluirExpediente(
    expedienteId,
    motivoConclusionId,
    observacionesFinales
  ) {
    const response = await api.post(`expedientes/${expedienteId}/concluir/`, {
      motivo_conclusion_id: motivoConclusionId,
      observaciones_finales: observacionesFinales,
    });

    return response.data;
  },

  async documentosPorExpediente(id) {
    const response = await api.get(`expedientes/${id}/documentos/`);
    return response.data;
  },

  async subirDocumento(formData) {
    const response = await api.post("documentos/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

   async eliminarDocumento(id) {
    const response = await api.delete(`documentos/${id}/eliminar/`);
    return response.data;
    },
};



export default expedienteService;
