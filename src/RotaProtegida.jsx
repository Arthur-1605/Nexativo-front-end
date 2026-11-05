import { Navigate, Outlet } from "react-router-dom";
import { ehAdministrador, lerUsuarioSalvo } from "./api";

export default function RotaProtegida({ apenasAdmin = false }) {
  const token = localStorage.getItem("token");
  const usuario = lerUsuarioSalvo();

  // Sem autenticação, volta para o login
  if (!token || !usuario?.id_usuario) {
    return <Navigate to="/" replace />;
  }

  // Usuário comum não acessa o painel administrativo
  if (apenasAdmin && !ehAdministrador(usuario)) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
