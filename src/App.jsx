import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Admin from "./pages/Admin";
import Denuncia from "./pages/Denuncia";
import Chat from "./pages/Admin-pages/Chat";
import AltaGravidade from "./pages/Admin-pages/AltaGravidade";
import Analise from "./pages/Admin-pages/Analise";
import Mapa from "./pages/Admin-pages/Mapa";
import Relatorios from "./pages/Admin-pages/Relatórios";
import DenunciasTs from "./pages/Admin-pages/DenunciasTs";
import NotaInteligente from "./pages/Admin-pages/NotaInteligente";
import Usuarios from "./pages/Admin-pages/Usuarios";
import Configuracoes from "./pages/Admin-pages/Configurações";
import Categorias from "./pages/Admin-pages/Categorias";
import LogeCad from "./pages/Log e Cad";
import Home from "./pages/Home";
import RotaProtegida from "./RotaProtegida";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Área pública */}
        <Route path="/" element={<LogeCad />} />

        <Route element={<RotaProtegida/>}>
          <Route path="/home" element={<Home />} />
          <Route path="/denuncia" element={<Denuncia />} />
        </Route>

        {/* Painel administrativo */}
        <Route element={<RotaProtegida/>}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/denuncias" element={<DenunciasTs />} />
          <Route path="/admin/analise" element={<Analise />} />
          <Route path="/admin/alta-gravidade" element={<AltaGravidade />} />
          <Route path="/admin/mapa" element={<Mapa />} />
          <Route path="/admin/relatorios" element={<Relatorios />} />
          <Route
            path="/admin/nota-inteligente"
            element={<NotaInteligente />}
          />
          <Route path="/admin/usuarios" element={<Usuarios />} />
          <Route path="/admin/categorias" element={<Categorias />} />
          <Route
            path="/admin/configuracoes"
            element={<Configuracoes />}
          />
          <Route path="/admin/chat" element={<Chat />} />
        </Route>

        {/* Redireciona rotas inexistentes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
