import { Navigate, Outlet } from "react-router-dom";

export default function RotaProtegida({ apenasAdmin = false }) {
  const token = localStorage.getItem("token");
  const usuarioSalvo = localStorage.getItem("usuario");

  let usuario = null;

  try {
    usuario = usuarioSalvo
      ? JSON.parse(usuarioSalvo)
      : null;
  } catch {
    usuario = null;
  }

  // Sem autenticação, volta para o login
  if (!token || !usuario?.id_usuario) {
    return <Navigate to="/" replace />;
  }

  // Usuário comum não acessa o painel administrativo
  if (
    apenasAdmin &&
    usuario.cargo !== "Administrador"
  ) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}