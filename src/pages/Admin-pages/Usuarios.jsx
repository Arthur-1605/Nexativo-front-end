
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../../api";

import {
  FaUsers,
  FaUserCheck,
  FaUserSlash,
  FaSearch,
  FaPlus,
  FaEllipsisV,
  FaFilter,
  FaTimes,
  FaEnvelope,
  FaShieldAlt,
} from "react-icons/fa";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

import "./AdminPaginas.css";
import "./Usuarios.css";

const setoresDisponiveis = [
  "Infraestrutura",
  "Atendimento",
  "Administração",
  "Tecnologia",
];

const usuarioInicial = {
  nome: "",
  email: "",
  senha: "",
  setor: "Atendimento",
  cargo: "",
  perfil: "Usuário",
};

async function lerResposta(resposta) {
  const texto = await resposta.text();

  let dados = {};

  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = {};
    }
  }

  if (!resposta.ok) {
    throw new Error(
      dados.erro ||
      dados.mensagem ||
      `Erro na requisição (${resposta.status}).`
    );
  }

  return dados;
}

export default function Usuarios() {
  const [usuarioLogado] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("usuario") || "null");
    } catch {
      return null;
    }
  });

  const ehAdministrador =
    usuarioLogado?.perfil === "Administrador" ||
    usuarioLogado?.cargo === "Administrador";

  const headersAdmin = {
    "Content-Type": "application/json",
    "x-usuario-id": String(usuarioLogado?.id_usuario || ""),
  };

  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formulario, setFormulario] = useState({ ...usuarioInicial });
  const [erro, setErro] = useState("");
  const [erroPagina, setErroPagina] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [alterandoStatus, setAlterandoStatus] = useState(null);

  const carregarUsuarios = useCallback(async () => {
    if (!ehAdministrador) return;

    setCarregando(true);
    setErroPagina("");

    try {
      const resposta = await fetch(`${API_URL}/usuarios`, {
        headers: headersAdmin,
      });

      const dados = await lerResposta(resposta);

      if (!Array.isArray(dados)) {
        throw new Error("O servidor não retornou uma lista de usuários.");
      }

      setUsuarios(
        dados.map((usuario) => ({
          ...usuario,
          id: usuario.id_usuario,
          setor: usuario.setor || "Atendimento",
          perfil:
            usuario.perfil ||
            (usuario.cargo === "Administrador"
              ? "Administrador"
              : "Usuário"),
          status: usuario.status || "Ativo",
        }))
      );
    } catch (erro) {
      setErroPagina(
        erro.message || "Não foi possível carregar os usuários."
      );
    } finally {
      setCarregando(false);
    }
  }, [ehAdministrador, usuarioLogado?.id_usuario]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const termo = pesquisa.trim().toLowerCase();

    const correspondePesquisa =
      (usuario.nome || "").toLowerCase().includes(termo) ||
      (usuario.email || "").toLowerCase().includes(termo) ||
      (usuario.setor || "").toLowerCase().includes(termo) ||
      (usuario.cargo || "").toLowerCase().includes(termo) ||
      (usuario.perfil || "").toLowerCase().includes(termo);

    const correspondeStatus =
      filtroStatus === "Todos" || usuario.status === filtroStatus;

    return correspondePesquisa && correspondeStatus;
  });

  const totalUsuarios = usuarios.length;

  const usuariosAtivos = usuarios.filter(
    (usuario) => usuario.status === "Ativo"
  ).length;

  const usuariosInativos = usuarios.filter(
    (usuario) => usuario.status === "Inativo"
  ).length;

  function abrirCadastro() {
    if (!ehAdministrador || salvando) return;

    setUsuarioEditando(null);
    setFormulario({ ...usuarioInicial });
    setErro("");
    setModalAberto(true);
    setMenuAberto(null);
  }

  function abrirEdicao(usuario) {
    if (!ehAdministrador || salvando) return;

    setUsuarioEditando(usuario.id);

    setFormulario({
      nome: usuario.nome || "",
      email: usuario.email || "",
      senha: "",
      setor: usuario.setor || "Atendimento",
      cargo: usuario.cargo || "",
      perfil: usuario.perfil || "Usuário",
    });

    setErro("");
    setModalAberto(true);
    setMenuAberto(null);
  }

  function fecharModal() {
    if (salvando) return;

    setModalAberto(false);
    setUsuarioEditando(null);
    setFormulario({ ...usuarioInicial });
    setErro("");
  }

  function atualizarCampo(e) {
    const { name, value } = e.target;

    setFormulario((atual) => ({
      ...atual,
      [name]: value,
    }));

    setErro("");
  }

  async function cadastrarUsuario(e) {
    e.preventDefault();

    if (!ehAdministrador || salvando) return;

    const nome = formulario.nome.trim();
    const email = formulario.email.trim().toLowerCase();
    const cargo = formulario.cargo.trim();
    const setor = formulario.setor;
    const perfil = formulario.perfil;
    const senha = formulario.senha;

    if (!nome || !email || !cargo || !setor) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    if (
      usuarioEditando === null &&
      senha.trim().length < 6
    ) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (!["Usuário", "Administrador"].includes(perfil)) {
      setErro("Selecione um tipo de acesso válido.");
      return;
    }

    const emailJaExiste = usuarios.some(
      (usuario) =>
        usuario.email?.toLowerCase() === email &&
        String(usuario.id) !== String(usuarioEditando)
    );

    if (emailJaExiste) {
      setErro("Já existe um usuário cadastrado com esse e-mail.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const editando = usuarioEditando !== null;

      const url = editando
        ? `${API_URL}/usuarios/${usuarioEditando}`
        : `${API_URL}/usuario`;

      const corpo = {
        nome,
        email,
        cargo,
        setor,
        perfil,
      };

      if (!editando) {
        corpo.senha = senha;
      }

      const resposta = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: headersAdmin,
        body: JSON.stringify(corpo),
      });

      await lerResposta(resposta);

      setModalAberto(false);
      setUsuarioEditando(null);
      setFormulario({ ...usuarioInicial });

      await carregarUsuarios();
    } catch (erro) {
      setErro(
        erro.message || "Não foi possível salvar o usuário."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function alterarStatus(usuarioId) {
    if (!ehAdministrador || alterandoStatus !== null) return;

    const usuario = usuarios.find(
      (item) => String(item.id) === String(usuarioId)
    );

    if (!usuario) return;

    if (String(usuario.id) === String(usuarioLogado?.id_usuario)) {
      setErroPagina(
        "Você não pode alterar o status da sua própria conta nesta tela."
      );
      setMenuAberto(null);
      return;
    }

    const novoStatus =
      usuario.status === "Ativo" ? "Inativo" : "Ativo";

    setErroPagina("");
    setAlterandoStatus(usuarioId);

    try {
      const resposta = await fetch(
        `${API_URL}/usuarios/${usuarioId}/status`,
        {
          method: "PATCH",
          headers: headersAdmin,
          body: JSON.stringify({ status: novoStatus }),
        }
      );

      await lerResposta(resposta);

      setMenuAberto(null);
      await carregarUsuarios();
    } catch (erro) {
      setErroPagina(
        erro.message || "Não foi possível alterar o status."
      );
    } finally {
      setAlterandoStatus(null);
    }
  }

  if (!usuarioLogado) {
    return (
      <div className="admin">
        <main className="admin-content">
          <section className="pagina-usuarios">
            <h1>Gerenciamento de usuários</h1>
            <p>Faça login para acessar esta página.</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="admin">
      <Sidebar />

      <main className="admin-content">
        <Header />

        <section className="pagina-usuarios">
          <div className="usuarios-topo">
            <div>
              <h1>Gerenciamento de usuários</h1>
              <p className="usuarios-subtitulo">
                Gerencie os membros e os acessos da equipe.
              </p>
            </div>

            {ehAdministrador && (
              <button
                type="button"
                className="btn-novo-usuario"
                onClick={abrirCadastro}
              >
                <FaPlus />
                Novo usuário
              </button>
            )}
          </div>

          {!ehAdministrador && (
            <div className="usuarios-aviso-permissao">
              <FaShieldAlt />
              <span>
                Você tem acesso somente à visualização.
                Apenas administradores podem cadastrar ou editar usuários.
              </span>
            </div>
          )}

          {erroPagina && (
            <div className="usuarios-form-erro" role="alert">
              {erroPagina}
              <button
                type="button"
                onClick={() => setErroPagina("")}
                aria-label="Fechar mensagem"
              >
                <FaTimes />
              </button>
            </div>
          )}

          <div className="usuarios-indicadores">
            <div className="usuario-card">
              <div className="usuario-card-icone">
                <FaUsers />
              </div>
              <div>
                <span>Total de usuários</span>
                <h2>{totalUsuarios}</h2>
              </div>
            </div>

            <div className="usuario-card">
              <div className="usuario-card-icone usuario-card-ativo">
                <FaUserCheck />
              </div>
              <div>
                <span>Usuários ativos</span>
                <h2>{usuariosAtivos}</h2>
              </div>
            </div>

            <div className="usuario-card">
              <div className="usuario-card-icone usuario-card-inativo">
                <FaUserSlash />
              </div>
              <div>
                <span>Usuários inativos</span>
                <h2>{usuariosInativos}</h2>
              </div>
            </div>
          </div>

          <div className="usuarios-conteudo">
            <div className="usuarios-lista-topo">
              <div>
                <h2>Equipe cadastrada</h2>
                <p>
                  {usuariosFiltrados.length} usuário(s) encontrado(s)
                </p>
              </div>

              <div className="usuarios-ferramentas">
                <div className="usuarios-busca">
                  <FaSearch />
                  <input
                    type="search"
                    placeholder="Buscar usuário..."
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                    aria-label="Buscar usuário"
                  />
                </div>

                <div className="usuarios-filtro">
                  <FaFilter />
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    aria-label="Filtrar por status"
                  >
                    <option value="Todos">Todos os status</option>
                    <option value="Ativo">Ativos</option>
                    <option value="Inativo">Inativos</option>
                  </select>
                </div>
              </div>
            </div>

            {carregando ? (
              <div className="usuarios-vazio">
                <p>Carregando usuários...</p>
              </div>
            ) : usuariosFiltrados.length > 0 ? (
              <div className="usuarios-tabela-wrapper">
                <table className="usuarios-tabela">
                  <thead>
                    <tr>
                      <th>USUÁRIO</th>
                      <th>SETOR</th>
                      <th>CARGO</th>
                      <th>TIPO DE ACESSO</th>
                      <th>STATUS</th>
                      {ehAdministrador && <th>AÇÕES</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {usuariosFiltrados.map((usuario) => (
                      <tr key={usuario.id}>
                        <td>
                          <div className="usuario-identidade">
                            <div className="usuario-avatar">
                              {(usuario.nome || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="usuario-dados">
                              <strong>{usuario.nome}</strong>
                              <span>
                                <FaEnvelope />
                                {usuario.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>{usuario.setor}</td>
                        <td>{usuario.cargo}</td>

                        <td>
                          <span className="usuario-perfil">
                            <FaShieldAlt />
                            {usuario.perfil}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`usuario-status ${
                              usuario.status === "Ativo"
                                ? "status-ativo"
                                : "status-inativo"
                            }`}
                          >
                            {usuario.status}
                          </span>
                        </td>

                        {ehAdministrador && (
                          <td>
                            <div className="usuario-acoes">
                              <button
                                type="button"
                                className="usuario-menu-botao"
                                aria-label={`Ações para ${usuario.nome}`}
                                aria-expanded={menuAberto === usuario.id}
                                onClick={() =>
                                  setMenuAberto(
                                    menuAberto === usuario.id
                                      ? null
                                      : usuario.id
                                  )
                                }
                              >
                                <FaEllipsisV />
                              </button>

                              {menuAberto === usuario.id && (
                                <div className="usuario-menu">
                                  <button
                                    type="button"
                                    onClick={() => abrirEdicao(usuario)}
                                  >
                                    Editar usuário
                                  </button>

                                  <button
                                    type="button"
                                    disabled={alterandoStatus !== null}
                                    onClick={() =>
                                      alterarStatus(usuario.id)
                                    }
                                  >
                                    {alterandoStatus === usuario.id
                                      ? "Alterando..."
                                      : usuario.status === "Ativo"
                                        ? "Desativar usuário"
                                        : "Ativar usuário"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="usuarios-vazio">
                <div className="usuarios-vazio-icone">
                  <FaUsers />
                </div>

                <h3>
                  {usuarios.length === 0
                    ? "Nenhum usuário cadastrado"
                    : "Nenhum usuário encontrado"}
                </h3>

                <p>
                  {usuarios.length === 0
                    ? "Os usuários cadastrados aparecerão aqui."
                    : "Tente alterar a pesquisa ou o filtro."}
                </p>

                {ehAdministrador && usuarios.length === 0 && (
                  <button
                    type="button"
                    className="btn-novo-usuario"
                    onClick={abrirCadastro}
                  >
                    <FaPlus />
                    Cadastrar primeiro usuário
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {ehAdministrador && modalAberto && (
          <div
            className="usuarios-modal-fundo"
            onClick={(e) => {
              if (
                e.target === e.currentTarget &&
                !salvando
              ) {
                fecharModal();
              }
            }}
          >
            <div
              className="usuarios-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-modal-usuario"
            >
              <div className="usuarios-modal-topo">
                <div>
                  <h2 id="titulo-modal-usuario">
                    {usuarioEditando !== null
                      ? "Editar usuário"
                      : "Cadastrar usuário"}
                  </h2>
                  <p>
                    Defina os dados e o acesso do membro da equipe.
                  </p>
                </div>

                <button
                  type="button"
                  className="usuarios-modal-fechar"
                  onClick={fecharModal}
                  disabled={salvando}
                  aria-label="Fechar modal"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={cadastrarUsuario}>
                <label htmlFor="nome">Nome completo</label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  placeholder="Ex.: João da Silva"
                  value={formulario.nome}
                  onChange={atualizarCampo}
                  autoComplete="name"
                  required
                />

                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Ex.: joao@empresa.com"
                  value={formulario.email}
                  onChange={atualizarCampo}
                  autoComplete="email"
                  required
                />

                {usuarioEditando === null && (
                  <>
                    <label htmlFor="senha">Senha inicial</label>
                    <input
                      id="senha"
                      name="senha"
                      type="password"
                      placeholder="Mínimo de 6 caracteres"
                      value={formulario.senha}
                      onChange={atualizarCampo}
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </>
                )}

                <label htmlFor="setor">Setor</label>
                <select
                  id="setor"
                  name="setor"
                  value={formulario.setor}
                  onChange={atualizarCampo}
                  required
                >
                  {setoresDisponiveis.map((setor) => (
                    <option key={setor} value={setor}>
                      {setor}
                    </option>
                  ))}
                </select>

                <label htmlFor="cargo">Cargo</label>
                <input
                  id="cargo"
                  name="cargo"
                  type="text"
                  placeholder="Ex.: Analista de infraestrutura"
                  value={formulario.cargo}
                  onChange={atualizarCampo}
                  required
                />

                <label htmlFor="perfil">Tipo de acesso</label>
                <select
                  id="perfil"
                  name="perfil"
                  value={formulario.perfil}
                  onChange={atualizarCampo}
                  required
                >
                  <option value="Usuário">Usuário</option>
                  <option value="Administrador">Administrador</option>
                </select>

                {erro && (
                  <p className="usuarios-form-erro" role="alert">
                    {erro}
                  </p>
                )}

                <div className="usuarios-modal-acoes">
                  <button
                    type="button"
                    className="usuarios-btn-cancelar"
                    onClick={fecharModal}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="btn-novo-usuario"
                    disabled={salvando}
                  >
                    {salvando
                      ? "Salvando..."
                      : usuarioEditando !== null
                        ? "Salvar alterações"
                        : "Cadastrar usuário"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
