
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
import {
  buscarPerfil,
  atualizarPerfil,
  alterarSenha,
  buscarPreferencias,
  salvarPreferencias as salvarPreferenciasBD
} from "../../dados";

import "./AdminPaginas.css";
import "./Configuracoes.css";

const PREFERENCIAS_PADRAO = {
  notificacoes: true,
  alertasUrgentes: true,
};

function lerUsuarioLocal() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

function Configuracoes() {
  const { temaClaro, definirTema } = useTema();

  const [usuarioLogado, setUsuarioLogado] = useState(lerUsuarioLocal);
  const idUsuario = usuarioLogado?.id_usuario;

  const [secao, setSecao] = useState("inicio");

  const [perfil, setPerfil] = useState({
    nome: usuarioLogado?.nome || "",
    email: usuarioLogado?.email || "",
    cargo: usuarioLogado?.cargo || "Cidadão",
  });

  const [preferencias, setPreferencias] = useState(
    PREFERENCIAS_PADRAO
  );

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("sucesso");
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [senhas, setSenhas] = useState({ atual: "", nova: "", confirmar: "" });

  function mostrarMensagem(texto, tipo = "sucesso") {
    setMensagem(texto);
    setTipoMensagem(tipo);
  }

  useEffect(() => {
    let cancelado = false;

    async function carregarDados() {
      if (!idUsuario) {
        setCarregandoPerfil(false);
        mostrarMensagem("Faça login novamente para carregar seu perfil.", "erro");
        return;
      }

      setCarregandoPerfil(true);

      try {
        const dados = await buscarPerfil();
        if (cancelado) return;

        setPerfil({
          nome: dados.nome || "",
          email: dados.email || "",
          cargo: dados.cargo || "Funcionário",
        });

        const usuarioAtualizado = { ...usuarioLogado, ...dados };
        setUsuarioLogado(usuarioAtualizado);
        localStorage.setItem("usuario", JSON.stringify(usuarioAtualizado));

        try {
          const preferenciasBanco = await buscarPreferencias();
          if (!cancelado) {
            setPreferencias({
              notificacoes: Boolean(preferenciasBanco.notificacoes),
              alertasUrgentes: Boolean(preferenciasBanco.alertasUrgentes),
            });
          }
        } catch (erro) {
          console.error("Erro ao carregar preferências:", erro);
        }
      } catch (erro) {
        console.error("Erro ao carregar perfil:", erro);
        if (!cancelado) {
          mostrarMensagem(erro.message || "Erro ao carregar os dados.", "erro");
        }
      } finally {
        if (!cancelado) {
          setCarregandoPerfil(false);
        }
      }
    }

    carregarDados();

    return () => {
      cancelado = true;
    };
    // O carregamento depende do ID do usuário conectado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUsuario]);

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

  async function salvarDados(evento) {
    evento.preventDefault();

    const nome = perfil.nome.trim();
    const email = perfil.email.trim();

    if (!nome || !email) {
      mostrarMensagem("Preencha o nome e o e-mail.", "erro");
      return;
    }

    setSalvando(true);
    setMensagem("");

    try {
      const { usuario: atualizado } = await atualizarPerfil({ nome, email });

      const usuarioAtualizado = { ...usuarioLogado, ...atualizado };
      setUsuarioLogado(usuarioAtualizado);
      setPerfil({
        nome: atualizado.nome || "",
        email: atualizado.email || "",
        cargo: atualizado.cargo || "Funcionário",
      });
      localStorage.setItem("usuario", JSON.stringify(usuarioAtualizado));
      mostrarMensagem("Perfil atualizado com sucesso!");
    } catch (erro) {
      console.error("Erro ao salvar perfil:", erro);
      mostrarMensagem(erro.message || "Erro ao salvar o perfil.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  // ---- trocar senha
  async function trocarSenha(evento) {
    evento.preventDefault();

    if (senhas.nova.length < 6) {
      mostrarMensagem("A nova senha deve ter pelo menos 6 caracteres.", "erro");
      return;
    }

    if (senhas.nova !== senhas.confirmar) {
      mostrarMensagem("A confirmação não confere com a nova senha.", "erro");
      return;
    }

    setSalvando(true);
    setMensagem("");

    try {
      await alterarSenha(senhas.atual, senhas.nova);
      setSenhas({ atual: "", nova: "", confirmar: "" });
      mostrarMensagem("Senha alterada com sucesso!");
    } catch (erro) {
      mostrarMensagem(erro.message || "Não foi possível alterar a senha.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarPreferencias(evento) {
    evento.preventDefault();

    setSalvando(true);
    setMensagem("");

    try {
      await salvarPreferenciasBD(preferencias);
      mostrarMensagem("Preferências salvas com sucesso!");
    } catch (erro) {
      console.error("Erro ao salvar preferências:", erro);
      mostrarMensagem(erro.message || "Erro ao salvar as preferências.", "erro");
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
          aria-label="Voltar às configurações"
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
                  <strong>{perfil.nome || "Sem nome"}</strong>
                  <p>{perfil.email}</p>
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
                    disabled={carregandoPerfil || salvando}
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
                    maxLength={190}
                    autoComplete="email"
                    required
                    disabled={carregandoPerfil || salvando}
                  />
                </div>
              </label>

              <div className="perfil-field">
                <span>Tipo de conta</span>

                <div className="perfil-readonly">
                  <FaShieldAlt />
                  <span>{perfil.cargo}</span>
                  <small>Permissão definida pelo sistema</small>
                </div>
              </div>

              <div className="perfil-form-actions">
                <button
                  type="submit"
                  disabled={salvando || carregandoPerfil}
                >
                  <FaSave />
                  {salvando
                    ? "Salvando..."
                    : "Salvar alterações"}
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
              "Altere a senha da sua conta."
            )}
            <form onSubmit={trocarSenha}>
              <label className="perfil-field">
                <span>Senha atual</span>
                <div className="perfil-input">
                  <FaLock />
                  <input
                    type="password"
                    value={senhas.atual}
                    onChange={(e) => setSenhas((a) => ({ ...a, atual: e.target.value }))}
                    autoComplete="current-password"
                    required
                    disabled={salvando}
                  />
                </div>
              </label>
              <label className="perfil-field">
                <span>Nova senha</span>
                <div className="perfil-input">
                  <FaLock />
                  <input
                    type="password"
                    value={senhas.nova}
                    onChange={(e) => setSenhas((a) => ({ ...a, nova: e.target.value }))}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={salvando}
                  />
                </div>
              </label>
              <label className="perfil-field">
                <span>Confirmar nova senha</span>
                <div className="perfil-input">
                  <FaLock />
                  <input
                    type="password"
                    value={senhas.confirmar}
                    onChange={(e) => setSenhas((a) => ({ ...a, confirmar: e.target.value }))}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={salvando}
                  />
                </div>
              </label>
              <div className="perfil-form-actions">
                <button type="submit" disabled={salvando}>
                  <FaSave />
                  {salvando ? "Salvando..." : "Alterar senha"}
                </button>
              </div>
            </form>
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
                  disabled={carregandoPerfil || salvando}
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
                  disabled={carregandoPerfil || salvando}
                />
              </label>

              <div className="perfil-form-actions">
                <button
                  type="submit"
                  disabled={salvando || carregandoPerfil}
                >
                  <FaSave />
                  {salvando
                    ? "Salvando..."
                    : "Salvar preferências"}
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
              O tema é aplicado pelo contexto visual existente
              do sistema.
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
                  {perfil.nome.trim() || "Perfil do usuário"}
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
                  O perfil e as preferências são carregados e
                  salvos pelo servidor.
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
                <span className="perfil-eyebrow">
                  CIDADÃO ATIVO
                </span>

                <h1>Minha conta</h1>

                <p>
                  Gerencie seu perfil e as preferências do painel
                  administrativo.
                </p>
              </div>
            </header>

            {mensagem && (
              <div
                className="perfil-status-message"
                role="status"
                data-tipo={tipoMensagem}
              >
                <FaCheckCircle />
                {mensagem}
              </div>
            )}

            {carregandoPerfil && (
              <p className="perfil-muted-note" role="status">
                Carregando dados da conta...
              </p>
            )}

            {renderConteudo()}
          </section>
        </main>
      </div>
    </div>
  );
}

export default Configuracoes;
