
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { acionarHeader } from "./HeaderEvents";

import {
  FaFileAlt,
  FaClock,
  FaExclamationTriangle,
  FaMapMarkedAlt,
  FaChartPie,
  FaUsers,
  FaLayerGroup,
  FaCog,
  FaArrowLeft,
  FaHeadset,
  FaPencilRuler,
  FaBars,
  FaTimes,
  FaSearch,
  FaBell,
  FaUser,
  FaPlus,
  FaHome,
  FaComments,
  FaSun,
  FaMoon,
} from "react-icons/fa";

import { useTema } from "../context/TemaContext";
import "./Sindebar.css";

const itensPrincipais = [
  { to: "/admin", label: "Dashboard", icon: FaFileAlt },
  { to: "/admin/denuncias", label: "Denúncias", icon: FaFileAlt },
  { to: "/admin/analise", label: "Em análise", icon: FaClock },
  {
    to: "/admin/alta-gravidade",
    label: "Alta gravidade",
    icon: FaExclamationTriangle,
  },
  { to: "/admin/mapa", label: "Mapa", icon: FaMapMarkedAlt },
  { to: "/admin/relatorios", label: "Relatórios", icon: FaChartPie },
  {
    to: "/admin/nota-inteligente",
    label: "Notas inteligentes",
    icon: FaPencilRuler,
  },
  {
    to: "/admin/chat",
    label: "Chat",
    icon: FaComments,
  },
];

const itensConfiguracao = [
  { to: "/admin/usuarios", label: "Usuários", icon: FaUsers },
  { to: "/admin/categorias", label: "Categorias", icon: FaLayerGroup },
  {
    to: "/admin/configuracoes",
    label: "Configurações",
    icon: FaCog,
  },
];

function Sidebar() {
  const [atalhosAbertos, setAtalhosAbertos] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { temaClaro, alternarTema } = useTema();

  useEffect(() => {
    setMenuAberto(false);
    setAtalhosAbertos(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuAberto) return;

    function fecharComEscape(evento) {
      if (evento.key === "Escape") {
        setMenuAberto(false);
      }
    }

    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [menuAberto]);

  function rotaAtiva(to) {
    if (to === "/admin") {
      return location.pathname === "/admin";
    }

    return (
      location.pathname === to ||
      location.pathname.startsWith(`${to}/`)
    );
  }

  function renderItem(item) {
    const Icone = item.icon;
    const ativo = rotaAtiva(item.to);

    return (
      <Link
        key={item.to}
        to={item.to}
        className={`menu-item ${ativo ? "menu-item-ativo" : ""}`}
        aria-current={ativo ? "page" : undefined}
        onClick={() => setMenuAberto(false)}
      >
        <Icone />
        <span>{item.label}</span>
      </Link>
    );
  }
  
  function sair() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    navigate("/", { replace: true });
  }

  return (
    <>
      <div className="mobile-topbar">
        <Link
          to="/admin"
          className="mobile-brand"
          aria-label="Cidadão Ativo, início"
        >
          <span className="logo-icon">A</span>
          <span>
            <strong>Cidadão Ativo</strong>
            <small>Painel administrativo</small>
          </span>
        </Link>

        <button
          type="button"
          className={`mobile-menu-toggle ${
            menuAberto ? "is-open" : ""
          }`}
          onClick={() => setMenuAberto((aberto) => !aberto)}
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          aria-controls="sidebar-navegacao"
        >
          {menuAberto ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {menuAberto && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Fechar menu"
          onClick={() => setMenuAberto(false)}
        />
      )}

      <aside
        id="sidebar-navegacao"
        className={`sidebar ${
          menuAberto ? "sidebar-mobile-aberta" : ""
        }`}
      >
        <div className="sidebar-logo">
          <div className="logo-icon">A</div>

          <div className="topo">
            <h2>Cidadão Ativo</h2>
            <span>Painel Administrativo</span>
          </div>
        </div>

        <nav
          className="sidebar-menu"
          aria-label="Navegação administrativa"
        >
          <p className="menu-title">PRINCIPAL</p>
          {itensPrincipais.map(renderItem)}

          <p className="menu-title">CONFIGURAÇÕES</p>
          {itensConfiguracao.map(renderItem)}
        </nav>

        <div className="sidebar-footer">
          <Link
            to="/denuncia"
            className="back-site"
            onClick={() => setMenuAberto(false)}
          >
            <FaArrowLeft />
            <span><button onClick={sair}>Voltar para o site</button></span>
          </Link>

          <div className="support-card">
            <FaHeadset />
            <div>
              <strong>Precisa de ajuda?</strong>
              <span>Fale com o suporte</span>
            </div>
          </div>
        </div>
      </aside>

      <nav
        className="mobile-bottom-nav"
        aria-label="Atalhos principais"
      >
        {[
          { to: "/admin", label: "Início", icon: FaHome },
          {
            to: "/admin/denuncias",
            label: "Denúncias",
            icon: FaFileAlt,
          },
          {
            to: "/admin/mapa",
            label: "Mapa",
            icon: FaMapMarkedAlt,
          },
          {
            to: "/admin/relatorios",
            label: "Relatórios",
            icon: FaChartPie,
          },
        ].map((item) => {
          const Icone = item.icon;
          const ativo = rotaAtiva(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`mobile-bottom-item ${
                ativo ? "ativo" : ""
              }`}
              aria-current={ativo ? "page" : undefined}
            >
              <Icone />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div
          className={`mobile-quick-menu ${
            atalhosAbertos ? "aberto" : ""
          }`}
        >
         
<div className="mobile-quick-items">
  <button
    type="button"
    aria-label="Pesquisar"
    title="Pesquisar"
    onClick={() => acionarHeader("pesquisa")}
  >
    <FaSearch />
  </button>

  <button
    type="button"
    aria-label="Notificações"
    title="Notificações"
    onClick={() => acionarHeader("notificacoes")}
  >
    <FaBell />
  </button>

  <button
    type="button"
    aria-label="Perfil"
    title="Perfil"
    onClick={() => acionarHeader("perfil")}
  >
    <FaUser />
  </button>

  <button
    type="button"
    aria-label={temaClaro ? "Ativar tema escuro" : "Ativar tema claro"}
    title={temaClaro ? "Tema escuro" : "Tema claro"}
    onClick={alternarTema}
  >
    {temaClaro ? <FaMoon /> : <FaSun />}
  </button>

  <button
    type="button"
    className="mobile-quick-chat"
    aria-label="Abrir Chat"
    title="Chat"
    onClick={() => {
      navigate("/admin/chat");
      setAtalhosAbertos(false);
    }}
  >
    <FaComments />
  </button>

  <button
    type="button"
    className="mobile-quick-settings"
    aria-label="Configurações"
    title="Configurações"
    onClick={() => {
      navigate("/admin/configuracoes");
      setAtalhosAbertos(false);
    }}
  >
    <FaCog />
  </button>
</div>
 
          <button
            type="button"
            className="mobile-quick-toggle"
            onClick={() =>
              setAtalhosAbertos((aberto) => !aberto)
            }
            aria-label={
              atalhosAbertos ? "Fechar atalhos" : "Abrir atalhos"
            }
            aria-expanded={atalhosAbertos}
          >
            <FaPlus />
          </button>
        </div>
      </nav>
    </>
  );
}

export default Sidebar;