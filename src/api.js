// Endereço base do servidor Express (servidor/server.js)
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Usuário guardado no login (localStorage)
export function lerUsuarioSalvo() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

export function ehAdministrador(usuario) {
  return Boolean(
    usuario &&
      (usuario.perfil === "Administrador" || usuario.cargo === "Administrador")
  );
}

// Cabeçalhos com a identidade do usuário logado, exigidos pelo servidor
export function cabecalhosAutenticados(extras = {}) {
  const usuario = lerUsuarioSalvo();
  const cabecalhos = { ...extras };

  if (usuario?.id_usuario) {
    cabecalhos["x-usuario-id"] = String(usuario.id_usuario);
  }

  return cabecalhos;
}
