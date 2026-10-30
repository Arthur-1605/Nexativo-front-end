
import { useEffect, useState } from "react";
import {
  FaUserCircle,
  FaUserEdit,
  FaEnvelope,
  FaCamera,
  FaLock,
  FaBell,
  FaPalette,
  FaChevronRight,
  FaArrowLeft,
  FaSave,
  FaCheckCircle,
  FaShieldAlt,
  FaMoon,
  FaSun,
  FaSignOutAlt,
} from "react-icons/fa";

import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { useTema } from "../../context/TemaContext";

import "./AdminPaginas.css";
import "./Configuracoes.css";

const PERFIL_PADRAO = {
  nome: "",
  email: "",
  cargo: "Administrador",
};

const PREFERENCIAS_PADRAO = {
  notificacoes: true,
  alertasUrgentes: true,
};

function lerStorage(chave, padrao) {
  try {
    const valor = localStorage.getItem(chave);
    return valor ? { ...padrao, ...JSON.parse(valor) } : { ...padrao };
  } catch {
    return { ...padrao };
  }
}

function Configuracoes() {
  const { temaClaro, definirTema } = useTema();

  const [secao, setSecao] = useState("inicio");
  const [perfil, setPerfil] = useState(() =>
    lerStorage("cidadaoAtivoPerfil", PERFIL_PADRAO)
  );
  const [preferencias, setPreferencias] = useState(() =>
    lerStorage("cidadaoAtivoPreferencias", PREFERENCIAS_PADRAO)
  );
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setMensagem("");
  }, [secao]);

  function atualizarPerfil(campo, valor) {
    setPerfil((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function atualizarPreferencia(campo, valor) {
    setPreferencias((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function salvarDados(evento) {
    evento.preventDefault();
    setSalvando(true);
    setMensagem("");

    try {
      localStorage.setItem(
        "cidadaoAtivoPerfil",
        JSON.stringify(perfil)
      );
      setMensagem("Perfil salvo neste navegador.");
    } catch {
      setMensagem("Não foi possível salvar os dados.");
    } finally {
      setSalvando(false);
    }
  }

  function salvarPreferencias(evento) {
    evento.preventDefault();
    setSalvando(true);
    setMensagem("");

    try {
      localStorage.setItem(
        "cidadaoAtivoPreferencias",
        JSON.stringify(preferencias)
      );
      setMensagem("Preferências salvas neste navegador.");
    } catch {
      setMensagem("Não foi possível salvar as preferências.");
    } finally {
      setSalvando(false);
    }
  }

  const secoes = [
    {
      id: "perfil",
      titulo: "Informações pessoais",
      descricao: "Edite seu nome e seus dados de contato.",
      icone: FaUserEdit,
    },
    {
      id: "seguranca",
      titulo: "Segurança",
      descricao: "Gerencie a proteção e o acesso à conta.",
      icone: FaLock,
    },
    {
      id: "preferencias",
      titulo: "Notificações",
      descricao: "Escolha quais avisos deseja receber.",
      icone: FaBell,
    },
    {
      id: "aparencia",
      titulo: "Aparência",
      descricao: "Personalize a visualização do painel.",
      icone: FaPalette,
    },
  ];

  function voltarInicio() {
    setSecao("inicio");
  }

  function renderCabecalhoSecao(titulo, descricao) {
    return (
      <div className="perfil-section-heading">
        <button
          type="button"
          className="perfil-back-button"
          onClick={voltarInicio}
          aria-label="Voltar ao perfil"
        >
          <FaArrowLeft />
          <span>Voltar</span>
        </button>

        <h2>{titulo}</h2>
        <p>{descricao}</p>
      </div>
    );
  }

  function renderConteudo() {
    switch (secao) {
      case "perfil":
        return (
          <section className="perfil-detail-card">
            {renderCabecalhoSecao(
              "Informações pessoais",
              "Mantenha os dados da sua conta atualizados."
            )}

            <form onSubmit={salvarDados}>
              <div className="perfil-avatar-edit">
                <div className="perfil-avatar grande">
                  <FaUserCircle />
                </div>

                <div>
                  <strong>Foto do perfil</strong>
                  <p>
                    O envio de foto será implementado em uma próxima etapa.
                  </p>
                  <button
                    type="button"
                    className="perfil-secondary-button"
                    disabled
                  >
                    <FaCamera /> Adicionar foto
                  </button>
                </div>
              </div>

              <label className="perfil-field">
                <span>Nome completo</span>
                <div className="perfil-input">
                  <FaUserEdit />
                  <input
                    type="text"
                    value={perfil.nome}
                    onChange={(e) =>
                      atualizarPerfil("nome", e.target.value)
                    }
                    placeholder="Digite seu nome"
                    maxLength={100}
                    autoComplete="name"
                    required
                  />
                </div>
              </label>

              <label className="perfil-field">
                <span>E-mail</span>
                <div className="perfil-input">
                  <FaEnvelope />
                  <input
                    type="email"
                    value={perfil.email}
                    onChange={(e) =>
                      atualizarPerfil("email", e.target.value)
                    }
                    placeholder="Digite seu e-mail"
                    maxLength={160}
                    autoComplete="email"
                    required
                  />
                </div>
              </label>

              <div className="perfil-field">
                <span>Tipo de conta</span>
                <div className="perfil-readonly">
                  <FaShieldAlt />
                  <span>{perfil.cargo}</span>
                  <small>Conta administrativa</small>
                </div>
              </div>

              <div className="perfil-form-actions">
                <button type="submit" disabled={salvando}>
                  <FaSave />
                  {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </section>
        );

      case "seguranca":
        return (
          <section className="perfil-detail-card">
            {renderCabecalhoSecao(
              "Segurança",
              "Proteja sua conta administrativa."
            )}

            <div className="perfil-info-banner">
              <FaShieldAlt />
              <div>
                <strong>Proteção da conta</strong>
                <p>
                  A alteração de senha e a gestão das sessões serão
                  implementadas com autenticação no backend.
                </p>
              </div>
            </div>

            <div className="perfil-action-row">
              <div className="perfil-action-icon">
                <FaLock />
              </div>
              <div className="perfil-action-copy">
                <strong>Alterar senha</strong>
                <p>
                  Será necessário validar a identidade da conta no servidor.
                </p>
              </div>
              <span className="perfil-coming-soon">Em breve</span>
            </div>

            <div className="perfil-action-row">
              <div className="perfil-action-icon">
                <FaSignOutAlt />
              </div>
              <div className="perfil-action-copy">
                <strong>Sessões ativas</strong>
                <p>
                  O controle de sessões será conectado ao sistema de login.
                </p>
              </div>
              <span className="perfil-coming-soon">Em breve</span>
            </div>
          </section>
        );

      case "preferencias":
        return (
          <section className="perfil-detail-card">
            {renderCabecalhoSecao(
              "Notificações",
              "Escolha os avisos que deseja manter ativados."
            )}

            <form onSubmit={salvarPreferencias}>
              <label className="perfil-preference-row">
                <div className="perfil-action-icon">
                  <FaBell />
                </div>
                <div className="perfil-action-copy">
                  <strong>Notificações do sistema</strong>
                  <p>Receber avisos sobre novas ocorrências.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferencias.notificacoes}
                  onChange={(e) =>
                    atualizarPreferencia(
                      "notificacoes",
                      e.target.checked
                    )
                  }
                />
              </label>

              <label className="perfil-preference-row">
                <div className="perfil-action-icon urgente">
                  <FaShieldAlt />
                </div>
                <div className="perfil-action-copy">
                  <strong>Alertas de alta gravidade</strong>
                  <p>Dar destaque às ocorrências urgentes.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferencias.alertasUrgentes}
                  onChange={(e) =>
                    atualizarPreferencia(
                      "alertasUrgentes",
                      e.target.checked
                    )
                  }
                />
              </label>

              <div className="perfil-form-actions">
                <button type="submit" disabled={salvando}>
                  <FaSave />
                  {salvando ? "Salvando..." : "Salvar preferências"}
                </button>
              </div>
            </form>
          </section>
        );

      case "aparencia":
        return (
          <section className="perfil-detail-card">
            {renderCabecalhoSecao(
              "Aparência",
              "Escolha o tema do painel administrativo."
            )}

            <div className="perfil-theme-options">
              <button
                type="button"
                className={`perfil-theme-option ${
                  !temaClaro ? "selecionado" : ""
                }`}
                onClick={() => definirTema(false)}
                aria-pressed={!temaClaro}
              >
                <span className="perfil-theme-preview escuro">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="perfil-theme-label">
                  <FaMoon /> Tema escuro
                </span>
                {!temaClaro && <FaCheckCircle />}
              </button>

              <button
                type="button"
                className={`perfil-theme-option ${
                  temaClaro ? "selecionado" : ""
                }`}
                onClick={() => definirTema(true)}
                aria-pressed={temaClaro}
              >
                <span className="perfil-theme-preview claro">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="perfil-theme-label">
                  <FaSun /> Tema claro
                </span>
                {temaClaro && <FaCheckCircle />}
              </button>
            </div>

            <p className="perfil-muted-note">
              O tema é aplicado pelo contexto visual existente do sistema.
            </p>
          </section>
        );

      default:
        return (
          <>
            <section className="perfil-welcome-card">
              <div className="perfil-avatar">
                <FaUserCircle />
              </div>

              <div className="perfil-welcome-copy">
                <span className="perfil-eyebrow">SUA CONTA</span>
                <h2>
                  {perfil.nome.trim() || "Perfil do administrador"}
                </h2>
                <p>
                  {perfil.email.trim() ||
                    "Gerencie suas informações e preferências."}
                </p>
                <span className="perfil-role">
                  <FaShieldAlt /> {perfil.cargo}
                </span>
              </div>
            </section>

            <section className="perfil-section-list">
              <div className="perfil-list-heading">
                <h2>Configurações da conta</h2>
                <p>Escolha uma opção para continuar.</p>
              </div>

              {secoes.map((item) => {
                const Icone = item.icone;

                return (
                  <button
                    type="button"
                    className="perfil-section-link"
                    key={item.id}
                    onClick={() => setSecao(item.id)}
                  >
                    <span className="perfil-section-icon">
                      <Icone />
                    </span>

                    <span className="perfil-section-copy">
                      <strong>{item.titulo}</strong>
                      <small>{item.descricao}</small>
                    </span>

                    <FaChevronRight className="perfil-chevron" />
                  </button>
                );
              })}
            </section>

            <section className="perfil-security-footer">
              <FaShieldAlt />
              <div>
                <strong>Seus dados e sua segurança</strong>
                <p>
                  Esta versão ainda salva algumas informações somente
                  neste navegador. A integração segura com o servidor
                  será feita na próxima etapa.
                </p>
              </div>
            </section>
          </>
        );
    }
  }

  return (
    <div className="admin">
      <Sidebar />

      <div className="admin-content">
        <Header />

        <main className="configuracoes-page">
          <section className="perfil-page">
            <header className="perfil-page-heading">
              <div>
                <span className="perfil-eyebrow">CIDADÃO ATIVO</span>
                <h1>Minha conta</h1>
                <p>
                  Gerencie seu perfil e as preferências do painel
                  administrativo.
                </p>
              </div>
            </header>

            {mensagem && (
              <div className="perfil-status-message" role="status">
                <FaCheckCircle />
                {mensagem}
              </div>
            )}

            {renderConteudo()}
          </section>
        </main>
      </div>
    </div>
  );
}

export default Configuracoes;
