
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HEADER_EVENT } from "./HeaderEvents";
import { createPortal } from "react-dom";
import {
  FaSearch,
  FaBell,
  FaSun,
  FaMoon,
  FaChevronDown,
  FaUser,
  FaSignOutAlt,
  FaCheck,
  FaTimes
} from "react-icons/fa";

import { useTema } from "../context/TemaContext";
import { lerUsuarioSalvo, ehAdministrador } from "../api";
import {
  buscarNotificacoes,
  marcarNotificacaoLida,
  marcarTodasNotificacoesLidas
} from "../dados";
import "./Header.css";

function formatarHoraNotificacao(valor) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "";

  const minutos = Math.round((Date.now() - data.getTime()) / 60000);
  if (minutos < 1) return "Agora";
  if (minutos < 60) return `Há ${minutos} min`;
  if (minutos < 1440) return `Há ${Math.round(minutos / 60)} h`;
  return data.toLocaleDateString("pt-BR");
}

function Header() {
  const navigate = useNavigate();
  const { temaClaro, alternarTema } = useTema();
  const [usuario] = useState(lerUsuarioSalvo);
  const nomeUsuario = usuario?.nome || usuario?.email || "Usuário";
  const primeiroNome = nomeUsuario.split(" ")[0];
  const iniciais = nomeUsuario
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("");
  const rotuloPerfil = ehAdministrador(usuario) ? "Administrador" : "Usuário";

  const [mobile, setMobile] = useState(
    window.matchMedia("(max-width: 700px)").matches
  );

  const [notificacoesAberto, setNotificacoesAberto] = useState(false);
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [pesquisaAberta, setPesquisaAberta] = useState(false);
  const [termoPesquisa, setTermoPesquisa] = useState("");

  const [notificacoes, setNotificacoes] = useState([]);

  const headerRef = useRef(null);
  const pesquisaInputRef = useRef(null);
  const mobilePanelRef = useRef(null);
  const mobilePesquisaInputRef = useRef(null);

  const paginas = [
    {
      nome: "Mapa de denúncias",
      descricao: "Visualizar ocorrências no mapa",
      palavras: "mapa localização locais ocorrências",
      caminho: "/admin/mapa"
    },
    {
      nome: "Lista de denúncias",
      descricao: "Consultar denúncias registradas",
      palavras: "denúncias ocorrências lista registros",
      caminho: "/admin/denuncias"
    },
    {
      nome: "Relatórios",
      descricao: "Consultar relatórios e dados",
      palavras: "relatórios gráficos estatísticas indicadores",
      caminho: "/admin/relatorios"
    },
    {
      nome: "Configurações",
      descricao: "Configurar o sistema",
      palavras: "configurações ajustes preferências",
      caminho: "/admin/configuracoes"
    }
  ];

  const resultadosPesquisa = paginas.filter((pagina) =>
    `${pagina.nome} ${pagina.descricao} ${pagina.palavras}`
      .toLocaleLowerCase("pt-BR")
      .includes(termoPesquisa.trim().toLocaleLowerCase("pt-BR"))
  );

  const quantidadeNaoLidas = notificacoes.filter(
    (notificacao) => !notificacao.lida
  ).length;

  const painelAberto =
    pesquisaAberta || notificacoesAberto || perfilAberto;

  const tituloPainel = pesquisaAberta
    ? "Pesquisar páginas"
    : notificacoesAberto
      ? "Notificações"
      : "Meu perfil";

  function fecharPainel() {
    setNotificacoesAberto(false);
    setPerfilAberto(false);
    setPesquisaAberta(false);
  }

  function abrirPagina(pagina) {
    navigate(pagina.caminho);
    setTermoPesquisa("");
    fecharPainel();
  }

  function alternarNotificacoes() {
    setNotificacoesAberto((aberto) => !aberto);
    setPerfilAberto(false);
    setPesquisaAberta(false);
  }

  function alternarPerfil() {
    setPerfilAberto((aberto) => !aberto);
    setNotificacoesAberto(false);
    setPesquisaAberta(false);
  }

  function alternarPesquisa() {
    setPesquisaAberta((aberta) => !aberta);
    setNotificacoesAberto(false);
    setPerfilAberto(false);
  }

  async function carregarNotificacoes() {
    try {
      const lista = await buscarNotificacoes();
      setNotificacoes(
        lista.map((n) => ({
          id: n.id_notificacao,
          titulo: "Denúncia",
          mensagem: n.mensagem,
          hora: formatarHoraNotificacao(n.data_notificacao),
          lida: Boolean(n.lida)
        }))
      );
    } catch {
      setNotificacoes([]);
    }
  }

  useEffect(() => {
    carregarNotificacoes();
    const intervalo = setInterval(carregarNotificacoes, 60000);
    return () => clearInterval(intervalo);
  }, []);

  async function marcarComoLida(id) {
    setNotificacoes((anteriores) =>
      anteriores.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
    try {
      await marcarNotificacaoLida(id);
    } catch {
      carregarNotificacoes();
    }
  }

  async function marcarTodasComoLidas() {
    setNotificacoes((anteriores) => anteriores.map((n) => ({ ...n, lida: true })));
    try {
      await marcarTodasNotificacoesLidas();
    } catch {
      carregarNotificacoes();
    }
  }

  function sair() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/", { replace: true });
  }

  // Atualiza o modo mobile se a largura da tela mudar.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 700px)");

    function atualizarMobile(evento) {
      setMobile(evento.matches);
    }

    mediaQuery.addEventListener("change", atualizarMobile);

    return () => {
      mediaQuery.removeEventListener("change", atualizarMobile);
    };
  }, []);

  // Coloca o cursor no campo de pesquisa correto.
  useEffect(() => {
    if (pesquisaAberta) {
      const input = mobile
        ? mobilePesquisaInputRef.current
        : pesquisaInputRef.current;

      input?.focus();
    }
  }, [pesquisaAberta, mobile]);

  // Fecha o painel com Escape.
  useEffect(() => {
    function fecharComEscape(evento) {
      if (evento.key === "Escape") {
        fecharPainel();
      }
    }

    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, []);

  // Fecha ao clicar fora, sem fechar quando clicar dentro do painel.
  useEffect(() => {
    function fecharAoClicarFora(evento) {
      const clicouNoHeader =
        headerRef.current?.contains(evento.target);

      const clicouNoPainel =
        mobilePanelRef.current?.contains(evento.target);

      if (clicouNoHeader || clicouNoPainel) {
        return;
      }

      fecharPainel();
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    document.addEventListener("touchstart", fecharAoClicarFora);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      document.removeEventListener("touchstart", fecharAoClicarFora);
    };
  }, []);

  // Recebe os comandos enviados pela Sidebar.
  useEffect(() => {
    function receberAcao(evento) {
      switch (evento.detail) {
        case "pesquisa":
          setPesquisaAberta((aberto) => !aberto);
          setNotificacoesAberto(false);
          setPerfilAberto(false);
          break;

        case "notificacoes":
          setNotificacoesAberto((aberto) => !aberto);
          setPerfilAberto(false);
          setPesquisaAberta(false);
          break;

        case "perfil":
          setPerfilAberto((aberto) => !aberto);
          setNotificacoesAberto(false);
          setPesquisaAberta(false);
          break;

        default:
          break;
      }
    }

    window.addEventListener(HEADER_EVENT, receberAcao);

    return () => {
      window.removeEventListener(HEADER_EVENT, receberAcao);
    };
  }, []);

  return (
    <>
      <header className="header" ref={headerRef}>
        <div className="header-welcome">
          <h1>
            Olá, {primeiroNome}! <span>👋</span>
          </h1>

          <p>Aqui está o resumo das denúncias de hoje.</p>
        </div>

        <div className="header-actions">
          <button
            className="header-icon mobile-search-button"
            type="button"
            onClick={alternarPesquisa}
            aria-label={pesquisaAberta ? "Fechar pesquisa" : "Abrir pesquisa"}
            aria-expanded={pesquisaAberta}
          >
            {pesquisaAberta ? <FaTimes /> : <FaSearch />}
          </button>

          <div
            className={`header-search ${
              pesquisaAberta ? "search-open" : ""
            }`}
          >
            <input
              ref={pesquisaInputRef}
              type="text"
              placeholder="Pesquisar páginas..."
              aria-label="Pesquisar páginas"
              autoComplete="off"
              value={termoPesquisa}
              onChange={(evento) =>
                setTermoPesquisa(evento.target.value)
              }
              onKeyDown={(evento) => {
                if (
                  evento.key === "Enter" &&
                  resultadosPesquisa.length > 0
                ) {
                  abrirPagina(resultadosPesquisa[0]);
                }

                if (evento.key === "Escape") {
                  fecharPainel();
                  setTermoPesquisa("");
                }
              }}
            />

            <FaSearch />

            {termoPesquisa.trim() !== "" && (
              <div className="pesquisa-resultados">
                {resultadosPesquisa.length > 0 ? (
                  resultadosPesquisa.map((pagina) => (
                    <button
                      key={pagina.caminho}
                      type="button"
                      className="pesquisa-resultado"
                      onClick={() => abrirPagina(pagina)}
                    >
                      <strong>{pagina.nome}</strong>
                      <span>{pagina.descricao}</span>
                    </button>
                  ))
                ) : (
                  <p className="pesquisa-sem-resultados">
                    Nenhuma página encontrada.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="header-dropdown">
            <button
              className="header-icon"
              type="button"
              onClick={alternarNotificacoes}
              aria-label="Notificações"
              aria-expanded={notificacoesAberto}
            >
              <FaBell />

              {quantidadeNaoLidas > 0 && (
                <span className="notification-dot">
                  {quantidadeNaoLidas}
                </span>
              )}
            </button>

            {notificacoesAberto && (
              <div className="header-popup notifications-popup">
                <div className="popup-header">
                  <strong>Notificações</strong>

                  {quantidadeNaoLidas > 0 && (
                    <button
                      type="button"
                      className="popup-text-button"
                      onClick={marcarTodasComoLidas}
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>

                <div className="notifications-list">
                  {notificacoes.length === 0 ? (
                    <p className="popup-empty">
                      Nenhuma notificação.
                    </p>
                  ) : (
                    notificacoes.map((notificacao) => (
                      <div
                        key={notificacao.id}
                        className={`notification-item ${
                          notificacao.lida ? "is-read" : "is-unread"
                        }`}
                      >
                        <div className="notification-content">
                          <strong>{notificacao.titulo}</strong>
                          <p>{notificacao.mensagem}</p>
                          <span>{notificacao.hora}</span>
                        </div>

                        {!notificacao.lida && (
                          <button
                            type="button"
                            className="notification-read-button"
                            title="Marcar como lida"
                            aria-label={`Marcar ${notificacao.titulo} como lida`}
                            onClick={() =>
                              marcarComoLida(notificacao.id)
                            }
                          >
                            <FaCheck />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            className="header-icon"
            type="button"
            onClick={alternarTema}
            aria-label={
              temaClaro ? "Ativar tema escuro" : "Ativar tema claro"
            }
            title={temaClaro ? "Tema escuro" : "Tema claro"}
          >
            {temaClaro ? <FaMoon /> : <FaSun />}
          </button>

          <div className="header-dropdown">
            <button
              type="button"
              className="header-profile"
              onClick={alternarPerfil}
              aria-expanded={perfilAberto}
              aria-label="Abrir menu do perfil"
            >
              <div className="profile-avatar">{iniciais}</div>

              <div className="profile-info">
                <strong>{nomeUsuario}</strong>
                <span>{rotuloPerfil}</span>
              </div>

              <FaChevronDown
                className={`profile-arrow ${
                  perfilAberto ? "arrow-open" : ""
                }`}
              />
            </button>

            {perfilAberto && (
              <div className="header-popup profile-popup">
                <div className="profile-popup-info">
                  <div className="profile-avatar">{iniciais}</div>

                  <div>
                    <strong>{nomeUsuario}</strong>
                    <p>{rotuloPerfil}</p>
                  </div>
                </div>

                <div className="popup-divider" />

                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => {
                    setPerfilAberto(false);
                    navigate("/admin/configuracoes");
                  }}
                >
                  <FaUser />
                  <span>Meu perfil</span>
                </button>

                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => {
                    setPerfilAberto(false);
                    sair();
                  }}
                >
                  <FaSignOutAlt />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {mobile &&
        painelAberto &&
        createPortal(
          <div
            className="mobile-panel-overlay"
            onMouseDown={(evento) => {
              if (evento.target === evento.currentTarget) {
                fecharPainel();
              }
            }}
            onTouchStart={(evento) => {
              if (evento.target === evento.currentTarget) {
                fecharPainel();
              }
            }}
          >
            <section
              ref={mobilePanelRef}
              className="mobile-panel"
              role="dialog"
              aria-modal="true"
              aria-label={tituloPainel}
            >
              <div className="mobile-panel-handle" />

              <div className="mobile-panel-header">
                <h2>{tituloPainel}</h2>

                <button
                  type="button"
                  className="mobile-panel-close"
                  onClick={fecharPainel}
                  aria-label="Fechar painel"
                >
                  <FaTimes />
                </button>
              </div>

              {pesquisaAberta && (
                <div className="mobile-panel-content">
                  <div className="mobile-panel-search">
                    <FaSearch />

                    <input
                      ref={mobilePesquisaInputRef}
                      type="text"
                      placeholder="Pesquisar páginas..."
                      aria-label="Pesquisar páginas"
                      autoComplete="off"
                      value={termoPesquisa}
                      onChange={(evento) =>
                        setTermoPesquisa(evento.target.value)
                      }
                      onKeyDown={(evento) => {
                        if (
                          evento.key === "Enter" &&
                          resultadosPesquisa.length > 0
                        ) {
                          abrirPagina(resultadosPesquisa[0]);
                        }

                        if (evento.key === "Escape") {
                          fecharPainel();
                          setTermoPesquisa("");
                        }
                      }}
                    />
                  </div>

                  {termoPesquisa.trim() !== "" && (
                    <div className="mobile-panel-results">
                      {resultadosPesquisa.length > 0 ? (
                        resultadosPesquisa.map((pagina) => (
                          <button
                            key={pagina.caminho}
                            type="button"
                            onClick={() => abrirPagina(pagina)}
                          >
                            <strong>{pagina.nome}</strong>
                            <span>{pagina.descricao}</span>
                          </button>
                        ))
                      ) : (
                        <p>Nenhuma página encontrada.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {notificacoesAberto && (
                <div className="mobile-panel-content">
                  <div className="mobile-panel-notification-heading">
                    <span>
                      {quantidadeNaoLidas} não lida(s)
                    </span>

                    {quantidadeNaoLidas > 0 && (
                      <button
                        type="button"
                        onClick={marcarTodasComoLidas}
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>

                  <div className="mobile-panel-notifications">
                    {notificacoes.length === 0 ? (
                      <p className="popup-empty">
                        Nenhuma notificação.
                      </p>
                    ) : (
                      notificacoes.map((notificacao) => (
                        <div
                          key={notificacao.id}
                          className={`notification-item ${
                            notificacao.lida ? "is-read" : "is-unread"
                          }`}
                        >
                          <div className="notification-content">
                            <strong>{notificacao.titulo}</strong>
                            <p>{notificacao.mensagem}</p>
                            <span>{notificacao.hora}</span>
                          </div>

                          {!notificacao.lida && (
                            <button
                              type="button"
                              className="notification-read-button"
                              title="Marcar como lida"
                              aria-label={`Marcar ${notificacao.titulo} como lida`}
                              onClick={() =>
                                marcarComoLida(notificacao.id)
                              }
                            >
                              <FaCheck />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {perfilAberto && (
                <div className="mobile-panel-content">
                  <div className="mobile-panel-profile">
                    <div className="profile-avatar">{iniciais}</div>

                    <div>
                      <strong>{nomeUsuario}</strong>
                      <p>{rotuloPerfil}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="profile-menu-item"
                    onClick={() => {
                      fecharPainel();
                      navigate("/admin/configuracoes");
                    }}
                  >
                    <FaUser />
                    <span>Meu perfil</span>
                  </button>

                  <button
                    type="button"
                    className="profile-menu-item"
                    onClick={() => {
                      fecharPainel();
                      sair();
                    }}
                  >
                    <FaSignOutAlt />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </section>
          </div>,
          document.body
        )}
    </>
  );
}

export default Header;
