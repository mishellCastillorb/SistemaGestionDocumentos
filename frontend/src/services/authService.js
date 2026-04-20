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