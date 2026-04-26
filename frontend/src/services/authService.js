import api from "../api/axios";

const authService = {
  async login(username, password) {
    const response = await api.post("login/", { username, password });
    const { access, refresh } = response.data;

    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);

    return response.data;
  },

  async getPerfil() {
    const response = await api.get("mi-perfil/");
    localStorage.setItem("perfil", JSON.stringify(response.data));
    return response.data;
  },

  async cambiarPassword(password_actual, password_nueva) {
    const response = await api.post("cambiar-password/", {
      password_actual,
      password_nueva,
    });
    return response.data;
  },

  async resetPasswordRequest(username) {
    const response = await api.post("password-reset-request/", { username });
    return response.data;
  },

  async obtenerUsuarios() {
    const response = await api.get("usuarios/");
    return response.data;
  },

  async obtenerSolicitudesReset() {
    const response = await api.get("password-reset-requests/");
    return response.data;
  },

  async asignarPasswordTemporal(usuario_id, password_temporal) {
    const response = await api.post("usuarios/temporal/", {
      usuario_id,
      password_temporal,
    });
    return response.data;
  },

  logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("perfil");
  },

  getToken() {
    return localStorage.getItem("access");
  },

  getPerfilGuardado() {
    const perfil = localStorage.getItem("perfil");
    return perfil ? JSON.parse(perfil) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem("access");
  },
};

export default authService;