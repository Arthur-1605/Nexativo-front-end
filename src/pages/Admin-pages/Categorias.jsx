
import { useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import "./AdminPaginas.css";
import "./Categorias.css";

const iconesDisponiveis = ["💧", "💡", "🕳️", "🚰", "🗑️", "🌳", "🚧", "📍"];

const categoriasIniciais = [
  {
    id: 1,
    nome: "Vazamento de água",
    descricao: "Vazamentos em tubulações e redes de abastecimento.",
    icone: "💧",
    status: "Ativa",
  },
  {
    id: 2,
    nome: "Iluminação pública",
    descricao: "Postes apagados e lâmpadas com defeito.",
    icone: "💡",
    status: "Ativa",
  },
  {
    id: 3,
    nome: "Buracos na via",
    descricao: "Buracos, rachaduras e danos no asfalto.",
    icone: "🕳️",
    status: "Ativa",
  },
  {
    id: 4,
    nome: "Esgoto",
    descricao: "Entupimentos e problemas na rede de esgoto.",
    icone: "🚰",
    status: "Inativa",
  },
];

function Categorias() {
  const [categorias, setCategorias] = useState(categoriasIniciais);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todas");
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [icone, setIcone] = useState("📍");
  const [status, setStatus] = useState("Ativa");

  const totalAtivas = categorias.filter((c) => c.status === "Ativa").length;
  const totalInativas = categorias.filter((c) => c.status === "Inativa").length;

  const categoriasFiltradas = categorias.filter((categoria) => {
    const correspondePesquisa =
      categoria.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
      categoria.descricao.toLowerCase().includes(pesquisa.toLowerCase());

    const correspondeStatus =
      filtroStatus === "Todas" || categoria.status === filtroStatus;

    return correspondePesquisa && correspondeStatus;
  });

  function abrirCadastro() {
    setCategoriaEditando(null);
    setNome("");
    setDescricao("");
    setIcone("📍");
    setStatus("Ativa");
    setModalAberto(true);
  }

  function abrirEdicao(categoria) {
    setCategoriaEditando(categoria);
    setNome(categoria.nome);
    setDescricao(categoria.descricao);
    setIcone(categoria.icone);
    setStatus(categoria.status);
    setModalAberto(true);
  }

  function salvarCategoria(e) {
    e.preventDefault();

    if (!nome.trim()) return;

    if (categoriaEditando) {
      setCategorias((atuais) =>
        atuais.map((categoria) =>
          categoria.id === categoriaEditando.id
            ? {
                ...categoria,
                nome: nome.trim(),
                descricao: descricao.trim() || "Sem descrição",
                icone,
                status,
              }
            : categoria
        )
      );
    } else {
      setCategorias((atuais) => [
        ...atuais,
        {
          id: Date.now(),
          nome: nome.trim(),
          descricao: descricao.trim() || "Sem descrição",
          icone,
          status,
        },
      ]);
    }

    setModalAberto(false);
  }

  function excluirCategoria(categoria) {
    const confirmou = window.confirm(
      `Deseja excluir a categoria "${categoria.nome}"?`
    );

    if (confirmou) {
      setCategorias((atuais) =>
        atuais.filter((c) => c.id !== categoria.id)
      );
    }
  }

  return (
    <div className="admin">
      <Sidebar />

      <main className="admin-content">
        <Header />

        <section className="pagina-categorias">
          <div className="categorias-topo">
            <div>
              <span className="categorias-eyebrow">
                CIDADÃO ATIVO / ADMINISTRAÇÃO
              </span>
              <h1>Gestão de categorias</h1>
              <p>
                Organize os tipos de ocorrência e mantenha tudo sob controle.
              </p>
            </div>

            <button
              type="button"
              className="categorias-btn-principal"
              onClick={abrirCadastro}
            >
              <span>＋</span> Nova categoria
            </button>
          </div>

          <div className="categorias-resumo">
            <article className="categorias-stat">
              <div className="categorias-stat-topo">
                <span>Total de categorias</span>
                <span className="categorias-stat-icone roxo">▦</span>
              </div>
              <strong>{categorias.length}</strong>
              <small>Categorias cadastradas</small>
            </article>

            <article className="categorias-stat">
              <div className="categorias-stat-topo">
                <span>Categorias ativas</span>
                <span className="categorias-stat-icone verde">✓</span>
              </div>
              <strong>{totalAtivas}</strong>
              <small>Disponíveis para ocorrência</small>
            </article>

            <article className="categorias-stat">
              <div className="categorias-stat-topo">
                <span>Categorias inativas</span>
                <span className="categorias-stat-icone laranja">◷</span>
              </div>
              <strong>{totalInativas}</strong>
              <small>Temporariamente desativadas</small>
            </article>
          </div>

          <div className="categorias-painel">
            <div className="categorias-painel-topo">
              <div>
                <h2>Categorias cadastradas</h2>
                <p>
                  {categoriasFiltradas.length} resultado(s) encontrado(s)
                </p>
              </div>
            </div>

            <div className="categorias-ferramentas">
              <div className="categorias-busca">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Pesquisar por nome ou descrição..."
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  aria-label="Pesquisar categorias"
                />
                {pesquisa && (
                  <button
                    type="button"
                    onClick={() => setPesquisa("")}
                    aria-label="Limpar pesquisa"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="categorias-filtros">
                {["Todas", "Ativa", "Inativa"].map((opcao) => (
                  <button
                    key={opcao}
                    type="button"
                    className={
                      filtroStatus === opcao ? "filtro-ativo" : ""
                    }
                    onClick={() => setFiltroStatus(opcao)}
                  >
                    {opcao}
                    {opcao === "Todas" && (
                      <span>{categorias.length}</span>
                    )}
                    {opcao === "Ativa" && <span>{totalAtivas}</span>}
                    {opcao === "Inativa" && <span>{totalInativas}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="categorias-tabela-scroll">
              <table className="categorias-tabela">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th>Status</th>
                    <th className="coluna-acoes">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {categoriasFiltradas.map((categoria) => (
                    <tr key={categoria.id}>
                      <td>
                        <div className="categorias-identidade">
                          <span className="categorias-emoji">
                            {categoria.icone}
                          </span>
                          <div>
                            <strong>{categoria.nome}</strong>
                            <small>ID #{categoria.id}</small>
                          </div>
                        </div>
                      </td>

                      <td className="categorias-descricao">
                        {categoria.descricao}
                      </td>

                      <td>
                        <span
                          className={`categorias-status ${
                            categoria.status === "Ativa"
                              ? "status-ativa"
                              : "status-inativa"
                          }`}
                        >
                          <span />
                          {categoria.status}
                        </span>
                      </td>

                      <td>
                        <div className="categorias-acoes">
                          <button
                            type="button"
                            className="categorias-btn-editar"
                            onClick={() => abrirEdicao(categoria)}
                            title="Editar categoria"
                          >
                            ✎ <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            className="categorias-btn-excluir"
                            onClick={() => excluirCategoria(categoria)}
                            title="Excluir categoria"
                            aria-label={`Excluir ${categoria.nome}`}
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {categoriasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan="4">
                        <div className="categorias-vazio">
                          <span>⌕</span>
                          <strong>Nenhuma categoria encontrada</strong>
                          <p>
                            Tente mudar a pesquisa ou selecionar outro filtro.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setPesquisa("");
                              setFiltroStatus("Todas");
                            }}
                          >
                            Limpar filtros
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {modalAberto && (
          <div
            className="categorias-modal-fundo"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setModalAberto(false);
            }}
          >
            <section
              className="categorias-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-modal-categorias"
            >
              <div className="categorias-modal-topo">
                <div>
                  <span className="categorias-eyebrow">CONFIGURAÇÃO</span>
                  <h2 id="titulo-modal-categorias">
                    {categoriaEditando ? "Editar categoria" : "Nova categoria"}
                  </h2>
                  <p>
                    Preencha os dados abaixo para organizar as ocorrências.
                  </p>
                </div>

                <button
                  type="button"
                  className="categorias-modal-fechar"
                  onClick={() => setModalAberto(false)}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>

              <form onSubmit={salvarCategoria}>
                <label htmlFor="categoria-nome">Nome da categoria *</label>
                <input
                  id="categoria-nome"
                  type="text"
                  placeholder="Ex.: Coleta de lixo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={70}
                  required
                />

                <label htmlFor="categoria-descricao">Descrição</label>
                <textarea
                  id="categoria-descricao"
                  placeholder="Explique quais problemas pertencem a esta categoria..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  maxLength={250}
                />

                <label>Escolha um ícone</label>
                <div className="categorias-seletor-icones">
                  {iconesDisponiveis.map((opcao) => (
                    <button
                      type="button"
                      key={opcao}
                      className={icone === opcao ? "icone-selecionado" : ""}
                      onClick={() => setIcone(opcao)}
                      aria-label={`Selecionar ícone ${opcao}`}
                      aria-pressed={icone === opcao}
                    >
                      {opcao}
                    </button>
                  ))}
                </div>

                <label htmlFor="categoria-status">Status</label>
                <select
                  id="categoria-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Ativa">Ativa</option>
                  <option value="Inativa">Inativa</option>
                </select>

                <div className="categorias-modal-acoes">
                  <button
                    type="button"
                    className="categorias-btn-cancelar"
                    onClick={() => setModalAberto(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="categorias-btn-principal"
                  >
                    {categoriaEditando ? "Salvar alterações" : "Criar categoria"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default Categorias;
