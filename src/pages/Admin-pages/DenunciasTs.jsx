
import { useMemo, useState, useEffect, useRef } from "react";
import { API_URL } from "../../api";
import {
  FaSearch,
  FaTimes,
  FaClipboardCheck,
  FaWallet,
  FaHistory,
  FaMapMarkerAlt,
  FaPlus,
  FaTrash,
  FaCheck,
  FaExclamationTriangle,
  FaChartBar,
  FaCalendarAlt,
  FaUser,
  FaEdit,
} from "react-icons/fa";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

import "./AdminPaginas.css";
import "./DenunciaTs.css";

const dataInicial = [
  {
    id: 124,
    titulo: "Vazamento de água",
    categoria: "Abastecimento",
    cidade: "Criciúma",
    bairro: "Rio Maina",
    rua: "Rua Vila Isabel",
    descricao:
      "Vazamento próximo às residências, causando desperdício de água.",
    prioridade: "Alta",
    status: "Em análise",
    responsavel: "Carlos Silva",
    prazo: "2026-10-20",
    estimado: 1500,
    aprovado: 1500,
    gasto: 350,
    observacoes: [],
    historico: [],
    tarefas: [
      { id: 1, titulo: "Verificar a localização", concluida: true },
      { id: 2, titulo: "Agendar vistoria técnica", concluida: false },
    ],
  },
  {
    id: 123,
    titulo: "Buraco na via",
    categoria: "Infraestrutura",
    cidade: "Criciúma",
    bairro: "Centro",
    rua: "Rua João Pessoa",
    descricao: "Buraco na pista dificultando a circulação de veículos.",
    prioridade: "Alta",
    status: "Aberta",
    responsavel: "",
    prazo: "2026-10-15",
    estimado: 2500,
    aprovado: 0,
    gasto: 0,
    observacoes: [],
    historico: [],
    tarefas: [],
  },
  {
    id: 122,
    titulo: "Iluminação pública",
    categoria: "Iluminação",
    cidade: "Criciúma",
    bairro: "Próspera",
    rua: "Rua das Palmeiras",
    descricao: "Poste com iluminação inoperante.",
    prioridade: "Baixa",
    status: "Resolvida",
    responsavel: "Marcos Souza",
    prazo: "2026-10-10",
    estimado: 500,
    aprovado: 450,
    gasto: 420,
    observacoes: [],
    historico: [],
    tarefas: [
      { id: 1, titulo: "Verificar lâmpada", concluida: true },
      { id: 2, titulo: "Confirmar reparo", concluida: true },
    ],
  },
];

const moeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const dataFormatada = (data) => {
  if (!data) return "Sem prazo";

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
};

const hoje = () => {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
};

function DenunciasTs() {

    const [denuncias, setDenuncias] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erroAPI, setErroAPI] = useState("");
    const [selecionada, setSelecionada] = useState(null);

    const [pesquisa, setPesquisa] = useState("");
    const [filtroStatus, setFiltroStatus] = useState("Todos");
    const [filtroPrioridade, setFiltroPrioridade] = useState("Todas");
    const [filtroPrazo, setFiltroPrazo] = useState("Todos");
    const [ordenacao, setOrdenacao] = useState("urgencia");

    const [aba, setAba] = useState("geral");
    const [novaAnotacao, setNovaAnotacao] = useState("");
    const [novaTarefa, setNovaTarefa] = useState("");

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [novoTitulo, setNovoTitulo] = useState("");
    const [novoLocal, setNovoLocal] = useState("");
    const [novaDescricao, setNovaDescricao] = useState("");
    const [novoBairro, setNovoBairro] = useState("");
    const [novaPrioridade, setNovaPrioridade] = useState("Média");

    const [mensagem, setMensagem] = useState("");
    const temporizadorMensagem = useRef(null);
    

    const carregarDenuncias = async () => {
      try {
        setCarregando(true);
        setErroAPI("");

        const resposta = await fetch(`${API_URL}/ocorrencias`);

        if (!resposta.ok) {
          throw new Error(`Erro HTTP ${resposta.status}`);
        }

        const dados = await resposta.json();

        const lista = Array.isArray(dados)
          ? dados
          : dados.ocorrencias ?? dados.dados ?? [];

        if (!Array.isArray(lista)) {
          throw new Error("A API não retornou uma lista de ocorrências.");
        }

        const formatadas = lista.map((item) => ({
          ...item,
          id: item.id ?? item.id_ocorrencia,
          titulo: item.titulo ?? "Ocorrência sem título",
          categoria: item.categoria ?? item.nome_categoria ?? "Não informada",
          cidade: item.cidade ?? "Não informada",
          bairro: item.bairro ?? "Não informado",
          rua: item.rua ?? item.localizacao ?? "Não informada",
          descricao: item.descricao ?? "Sem descrição",
          prioridade: item.prioridade ?? "Média",
          status: item.status ?? "Aberta",
          responsavel: item.responsavel ?? "",
          prazo: item.prazo ?? "",
          estimado: Number(item.estimado ?? 0),
          aprovado: Number(item.aprovado ?? 0),
          gasto: Number(item.gasto ?? 0),
          observacoes: Array.isArray(item.observacoes)
            ? item.observacoes
            : [],
          historico: Array.isArray(item.historico)
            ? item.historico
            : [],
          tarefas: Array.isArray(item.tarefas)
            ? item.tarefas
            : [],
        }));

        setDenuncias(formatadas);
      } catch (erro) {
        console.error("Erro ao carregar ocorrências:", erro);

        setErroAPI(
          "Não foi possível carregar as ocorrências. Verifique se o servidor está ligado e se a rota /ocorrencias existe."
        );
      } finally {
        setCarregando(false);
      }
    };

    useEffect(() => {
      carregarDenuncias();
    }, []);

    useEffect(() => {
      return () => {
        if (temporizadorMensagem.current) {
          clearTimeout(temporizadorMensagem.current);
        }
      };
    }, []);

    const avisar = (texto) => {
  setMensagem(texto);

  if (temporizadorMensagem.current) {
    clearTimeout(temporizadorMensagem.current);
  }

  temporizadorMensagem.current = setTimeout(() => {
    setMensagem("");
  }, 4000);
};

// Mantenha as outras funções do componente abaixo.

const registrarHistorico = (denuncia, texto) => ({
  ...denuncia,
  historico: [
    {
      id: Date.now() + Math.random(),
      texto,
      data: new Date().toLocaleString("pt-BR"),
    },
    ...(denuncia.historico || []),
  ],
});

  const atrasada = (denuncia) =>
    denuncia.status !== "Resolvida" &&
    Boolean(denuncia.prazo) &&
    denuncia.prazo < hoje();

  const atualizarDenuncia = (id, alteracoes, acao = "") => {
    setDenuncias((anteriores) =>
      anteriores.map((denuncia) => {
        if (denuncia.id !== id) return denuncia;

        let atualizada = { ...denuncia, ...alteracoes };

        if (acao) {
          atualizada = registrarHistorico(atualizada, acao);
        }

        return atualizada;
      })
    );

    setSelecionada((anterior) => {
      if (!anterior || anterior.id !== id) return anterior;

      let atualizada = { ...anterior, ...alteracoes };

      if (acao) {
        atualizada = registrarHistorico(atualizada, acao);
      }

      return atualizada;
    });

    if (acao) avisar(acao);
  };

  const filtradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    const resultado = denuncias.filter((denuncia) => {
      const correspondePesquisa = [
        denuncia.id,
        denuncia.titulo,
        denuncia.categoria,
        denuncia.descricao,
        denuncia.cidade,
        denuncia.bairro,
        denuncia.rua,
        denuncia.responsavel,
      ].some((campo) =>
        String(campo ?? "").toLowerCase().includes(termo)
      );

      const correspondeStatus =
        filtroStatus === "Todos" || denuncia.status === filtroStatus;

      const correspondePrioridade =
        filtroPrioridade === "Todas" ||
        denuncia.prioridade === filtroPrioridade;

      const correspondePrazo =
        filtroPrazo === "Todos" ||
        (filtroPrazo === "Atrasadas" && atrasada(denuncia)) ||
        (filtroPrazo === "No prazo" && !atrasada(denuncia));

      return (
        correspondePesquisa &&
        correspondeStatus &&
        correspondePrioridade &&
        correspondePrazo
      );
    });

    const peso = { Alta: 3, Média: 2, Baixa: 1 };

    resultado.sort((a, b) => {
      if (ordenacao === "urgencia") {
        return (peso[b.prioridade] || 0) - (peso[a.prioridade] || 0);
      }

      if (ordenacao === "prazo") {
        return (a.prazo || "9999").localeCompare(b.prazo || "9999");
      }

      return b.id - a.id;
    });

    return resultado;
  }, [
    denuncias,
    pesquisa,
    filtroStatus,
    filtroPrioridade,
    filtroPrazo,
    ordenacao,
  ]);

  const abertas = denuncias.filter((d) => d.status === "Aberta").length;
  const emAnalise = denuncias.filter((d) => d.status === "Em análise").length;
  const resolvidas = denuncias.filter((d) => d.status === "Resolvida").length;
  const atrasadasTotal = denuncias.filter(atrasada).length;

  const pendentes = denuncias.filter(
    (d) => d.status !== "Resolvida"
  ).length;

  const gastoTotal = denuncias.reduce(
    (total, d) => total + Number(d.gasto || 0),
    0
  );

  const orcamentoTotal = denuncias.reduce(
    (total, d) => total + Number(d.aprovado || 0),
    0
  );

  const adicionarDenuncia = (e) => {
    e.preventDefault();

    if (!novoTitulo.trim() || !novoLocal.trim()) {
      avisar("Preencha o título e a localização.");
      return;
    }

    const nova = {
      id: Math.max(0, ...denuncias.map((d) => d.id)) + 1,
      titulo: novoTitulo.trim(),
      categoria: "Nova ocorrência",
      cidade: "Criciúma",
      bairro: novoBairro.trim() || "Não informado",
      rua: novoLocal.trim(),
      descricao: novaDescricao.trim() || "Sem descrição informada.",
      prioridade: novaPrioridade,
      status: "Aberta",
      responsavel: "",
      prazo: "",
      estimado: 0,
      aprovado: 0,
      gasto: 0,
      observacoes: [],
      historico: [],
      tarefas: [],
    };

    const comHistorico = registrarHistorico(
      nova,
      "Ocorrência cadastrada no painel."
    );

    setDenuncias((anteriores) => [comHistorico, ...anteriores]);
    setMostrarFormulario(false);
    setNovoTitulo("");
    setNovoLocal("");
    setNovoBairro("");
    setNovaDescricao("");
    setNovaPrioridade("Média");

    avisar("Ocorrência adicionada com sucesso.");
  };

  const adicionarAnotacao = (e) => {
    e.preventDefault();

    if (!novaAnotacao.trim() || !selecionada) return;

    const anotacao = {
      id: Date.now(),
      texto: novaAnotacao.trim(),
      data: new Date().toLocaleString("pt-BR"),
    };

    const atualizada = {
      ...selecionada,
      observacoes: [anotacao, ...(selecionada.observacoes || [])],
    };

    const comHistorico = registrarHistorico(
      atualizada,
      "Nova observação adicionada."
    );

    setDenuncias((anteriores) =>
      anteriores.map((d) =>
        d.id === comHistorico.id ? comHistorico : d
      )
    );

    setSelecionada(comHistorico);
    setNovaAnotacao("");
    avisar("Observação registrada.");
  };

  const adicionarTarefa = (e) => {
    e.preventDefault();

    if (!novaTarefa.trim() || !selecionada) return;

    const tarefa = {
      id: Date.now(),
      titulo: novaTarefa.trim(),
      concluida: false,
    };

    const tarefas = [...(selecionada.tarefas || []), tarefa];

    atualizarDenuncia(
      selecionada.id,
      { tarefas },
      `Tarefa criada: ${tarefa.titulo}`
    );

    setNovaTarefa("");
  };

  const alternarTarefa = (tarefaId) => {
    if (!selecionada) return;

    const tarefas = (selecionada.tarefas || []).map((tarefa) =>
      tarefa.id === tarefaId
        ? { ...tarefa, concluida: !tarefa.concluida }
        : tarefa
    );

    const tarefa = tarefas.find((t) => t.id === tarefaId);

    atualizarDenuncia(
      selecionada.id,
      { tarefas },
      tarefa
        ? `${tarefa.concluida ? "Tarefa concluída" : "Tarefa reaberta"}: ${tarefa.titulo}`
        : "Tarefas atualizadas."
    );
  };

  const excluirTarefa = (tarefaId) => {
    if (!selecionada) return;

    const tarefasAtuais = selecionada.tarefas || [];
    const tarefa = tarefasAtuais.find((t) => t.id === tarefaId);
    const tarefas = tarefasAtuais.filter((t) => t.id !== tarefaId);

    atualizarDenuncia(
      selecionada.id,
      { tarefas },
      `Tarefa removida: ${tarefa?.titulo || "Tarefa"}`
    );
  };

  const abrirDetalhes = (denuncia) => {
    setSelecionada(denuncia);
    setAba("geral");
    setNovaAnotacao("");
    setNovaTarefa("");
  };

  const fecharDetalhes = () => {
    setSelecionada(null);
    setMensagem("");
  };

  const excluirDenuncia = (id) => {
    const confirmar = window.confirm(
      "Tem certeza de que deseja excluir esta ocorrência?"
    );

    if (!confirmar) return;

    setDenuncias((anteriores) =>
      anteriores.filter((d) => d.id !== id)
    );

    setSelecionada((anterior) =>
      anterior?.id === id ? null : anterior
    );

    avisar("Ocorrência excluída.");
  };

  const progresso = (denuncia) => {
    const tarefas = denuncia.tarefas || [];

    if (!tarefas.length) return 0;

    return Math.round(
      (tarefas.filter((t) => t.concluida).length / tarefas.length) * 100
    );
  };

  const classesStatus = (status) =>
    status
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");

  const classesPrioridade = (prioridade) =>
    prioridade
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  return (
    <div className="admin">
      <Sidebar />

      <main className="admin-content">
        <Header />

        <section className="dashboard-principal denuncia-admin">
          <div className="denuncia-topo">
            <div>
              <span className="denuncia-sobretitulo">
                GESTÃO MUNICIPAL
              </span>
              <h1>Gestão de denúncias</h1>
              <p>
                Acompanhe ocorrências, organize equipes e controle os custos.
              </p>
            </div>

            <button
              className=" btn-nova-ocorrencia"

              onClick={() => setMostrarFormulario(true)}
            >
              <FaPlus />  <p>Nova ocorrência</p>
            </button>
          </div>

          {mensagem && (
            <div className="denuncia-mensagem" role="status">
              <FaCheck /> {mensagem}
              <button
                onClick={() => setMensagem("")}
                aria-label="Fechar aviso"
              >
                <FaTimes />
              </button>
            </div>
          )}
          {carregando && (
            <p role="status">Carregando ocorrências...</p>
          )}

          {erroAPI && (
            <div className="denuncia-mensagem" role="alert">
              <FaExclamationTriangle />
              <span>{erroAPI}</span>
              <button type="button" onClick={carregarDenuncias}>
                Tentar novamente
              </button>
            </div>
          )}
          {/* 1. TABELA PRIMEIRO */}
          <section className="denuncia-card denuncia-tabela-card">
            <div className="denuncia-card-titulo">
              <div>
                <span className="denuncia-sobretitulo">ACOMPANHAMENTO</span>
                <h2>Ocorrências registradas</h2>
              </div>
              <FaClipboardCheck />
            </div>

            <div className="denuncia-filtros">
              <label className="denuncia-pesquisa">
                <FaSearch />
                <input
                  type="search"
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  placeholder="Pesquisar ocorrência..."
                />
              </label>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                aria-label="Filtrar por status"
              >
                <option value="Todos">Todos os status</option>
                <option value="Aberta">Aberta</option>
                <option value="Em análise">Em análise</option>
                <option value="Em execução">Em execução</option>
                <option value="Resolvida">Resolvida</option>
              </select>

              <select
                value={filtroPrioridade}
                onChange={(e) => setFiltroPrioridade(e.target.value)}
                aria-label="Filtrar por prioridade"
              >
                <option value="Todas">Todas as prioridades</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>

              <select
                value={filtroPrazo}
                onChange={(e) => setFiltroPrazo(e.target.value)}
                aria-label="Filtrar por prazo"
              >
                <option value="Todos">Todos os prazos</option>
                <option value="Atrasadas">Atrasadas</option>
                <option value="No prazo">No prazo</option>
              </select>

              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                aria-label="Ordenar ocorrências"
              >
                <option value="urgencia">Maior prioridade</option>
                <option value="prazo">Prazo mais próximo</option>
                <option value="recentes">Mais recentes</option>
              </select>
            </div>

            <div className="denuncia-tabela-wrapper">
              <table className="denuncia-tabela">
                <thead>
                  <tr>
                    <th>Ocorrência</th>
                    <th>Localização</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                    <th>Prazo</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {filtradas.map((denuncia) => (
                    <tr key={denuncia.id}>
                      <td>
                        <strong>{denuncia.titulo}</strong>
                        <small>#{denuncia.id} · {denuncia.categoria}</small>
                      </td>

                      <td>
                        <span>{denuncia.bairro}</span>
                        <small>{denuncia.rua}</small>
                      </td>

                      <td>
                        <span
                          className={`denuncia-badge prioridade-${classesPrioridade(denuncia.prioridade)}`}
                        >
                          {denuncia.prioridade}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`denuncia-badge status-${classesStatus(denuncia.status)}`}
                        >
                          {denuncia.status}
                        </span>
                      </td>

                      <td>
                        <span className={atrasada(denuncia) ? "denuncia-atrasada" : ""}>
                          {dataFormatada(denuncia.prazo)}
                        </span>
                        {atrasada(denuncia) && (
                          <small className="denuncia-atrasada">
                            <FaExclamationTriangle /> Prazo vencido
                          </small>
                        )}
                      </td>

                      <td>
                        <div className="denuncia-acoes-tabela">
                          <button
                            className="denuncia-botao-secundario"
                            onClick={() => abrirDetalhes(denuncia)}
                          >
                            <FaEdit /> Gerenciar
                          </button>

                          <button
                            className="denuncia-icone-excluir"
                            onClick={() => excluirDenuncia(denuncia.id)}
                            aria-label={`Excluir ${denuncia.titulo}`}
                            title="Excluir ocorrência"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!filtradas.length && (
                    <tr>
                      <td colSpan="6">
                        <p className="denuncia-vazio">
                          Nenhuma ocorrência encontrada com esses filtros.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="denuncia-tabela-rodape">
              Exibindo {filtradas.length} de {denuncias.length} ocorrências
            </div>
          </section>

          {/* 2. INDICADORES DEPOIS DA TABELA */}
          <section className="denuncia-indicadores">
            <div className="denuncia-indicador">
              <span className="indicador-icone azul">
                <FaClipboardCheck />
              </span>
              <div>
                <span>Total de ocorrências</span>
                <strong>{denuncias.length}</strong>
                <small>{pendentes} ainda em andamento</small>
              </div>
            </div>

            <div className="denuncia-indicador">
              <span className="indicador-icone laranja">
                <FaExclamationTriangle />
              </span>
              <div>
                <span>Abertas</span>
                <strong>{abertas}</strong>
                <small>Precisam de acompanhamento</small>
              </div>
            </div>

            <div className="denuncia-indicador">
              <span className="indicador-icone roxo">
                <FaChartBar />
              </span>
              <div>
                <span>Em análise</span>
                <strong>{emAnalise}</strong>
                <small>Em avaliação pela equipe</small>
              </div>
            </div>

            <div className="denuncia-indicador">
              <span className="indicador-icone vermelho">
                <FaCalendarAlt />
              </span>
              <div>
                <span>Atrasadas</span>
                <strong>{atrasadasTotal}</strong>
                <small>Prazo ultrapassado</small>
              </div>
            </div>
          </section>
          <section className="denuncia-resumo-grid">
            {/* 3. GRÁFICO DE DESEMPENHO */}
            <section className="denuncia-card">
              <div className="denuncia-card-titulo">
                <div>
                  <span className="denuncia-sobretitulo">DESEMPENHO</span>
                  <h2>Situação das ocorrências</h2>
                </div>
                <FaChartBar />
              </div>

              <div className="denuncia-grafico">
                {[
                  { nome: "Abertas", valor: abertas, classe: "barra-aberta" },
                  { nome: "Em análise", valor: emAnalise, classe: "barra-analise" },
                  { nome: "Resolvidas", valor: resolvidas, classe: "barra-resolvida" },
                ].map((item) => (
                  <div className="denuncia-barra-linha" key={item.nome}>
                    <div className="denuncia-barra-legenda">
                      <span>{item.nome}</span>
                      <strong>{item.valor}</strong>
                    </div>

                    <div className="denuncia-barra-fundo">
                      <div
                        className={item.classe}
                        style={{
                          width: `${denuncias.length
                              ? (item.valor / denuncias.length) * 100
                              : 0
                            }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. FINANCEIRO POR ÚLTIMO */}
            <section className="denuncia-card denuncia-financeiro-card">
              <div className="denuncia-card-titulo">
                <div>
                  <span className="denuncia-sobretitulo">FINANCEIRO</span>
                  <h2>Controle de custos</h2>
                </div>
                <FaWallet />
              </div>

              <div className="denuncia-financeiro-linha">
                <span>Orçamento aprovado</span>
                <strong>{moeda(orcamentoTotal)}</strong>
              </div>

              <div className="denuncia-financeiro-linha">
                <span>Total gasto</span>
                <strong>{moeda(gastoTotal)}</strong>
              </div>

              <div className="denuncia-financeiro-linha total">
                <span>Saldo do orçamento</span>
                <strong className={orcamentoTotal - gastoTotal < 0 ? "texto-vermelho" : ""}>
                  {moeda(orcamentoTotal - gastoTotal)}
                </strong>
              </div>


              <div className="denuncia-progresso-fundo">
                <div
                  style={{
                    width: `${orcamentoTotal > 0
                        ? Math.min((gastoTotal / orcamentoTotal) * 100, 100)
                        : 0
                      }%`,
                  }}
                />
              </div>

              <small>
                {orcamentoTotal > 0
                  ? `${Math.round((gastoTotal / orcamentoTotal) * 100)}% do orçamento aprovado utilizado`
                  : "Nenhum orçamento aprovado registrado."}
              </small>
            </section>
          </section>
        </section>
      </main>

      {/* MODAL DE CADASTRO */}
      {mostrarFormulario && (
        <div
          className="denuncia-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMostrarFormulario(false);
          }}
        >
          <section
            className="denuncia-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-nova-ocorrencia"
          >
            <div className="denuncia-modal-topo">
              <div>
                <span className="denuncia-sobretitulo">CADASTRO</span>
                <h2 id="titulo-nova-ocorrencia">Nova ocorrência</h2>
              </div>

              <button
                className="denuncia-fechar"
                onClick={() => setMostrarFormulario(false)}
                aria-label="Fechar formulário"
              >
                <FaTimes />
              </button>
            </div>

            <form className="denuncia-formulario" onSubmit={adicionarDenuncia}>
              <label>
                Título da ocorrência *
                <input
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  placeholder="Ex.: Vazamento de água"
                  required
                />
              </label>

              <label>
                Rua ou localização *
                <input
                  value={novoLocal}
                  onChange={(e) => setNovoLocal(e.target.value)}
                  placeholder="Informe a rua ou o endereço"
                  required
                />
              </label>

              <label>
                Bairro
                <input
                  value={novoBairro}
                  onChange={(e) => setNovoBairro(e.target.value)}
                  placeholder="Informe o bairro"
                />
              </label>

              <label>
                Prioridade
                <select
                  value={novaPrioridade}
                  onChange={(e) => setNovaPrioridade(e.target.value)}
                >
                  <option>Alta</option>
                  <option>Média</option>
                  <option>Baixa</option>
                </select>
              </label>

              <label>
                Descrição
                <textarea
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  placeholder="Descreva o problema..."
                  rows="4"
                />
              </label>

              <div className="denuncia-form-acoes">
                <button
                  type="button"
                  className="denuncia-botao-secundario"
                  onClick={() => setMostrarFormulario(false)}
                >
                  Cancelar
                </button>

                <button className="denuncia-botao-principal" type="submit">
                  <FaPlus /> Cadastrar ocorrência
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* MODAL DE GERENCIAMENTO */}
      {selecionada && (
        <div
          className="denuncia-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) fecharDetalhes();
          }}
        >
          <section
            className="denuncia-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-detalhes-ocorrencia"
          >
            <div className="denuncia-modal-topo">
              <div>
                <span className="denuncia-sobretitulo">
                  OCORRÊNCIA #{selecionada.id}
                </span>
                <h2 id="titulo-detalhes-ocorrencia">{selecionada.titulo}</h2>
                <p>
                  <FaMapMarkerAlt /> {selecionada.bairro}, {selecionada.cidade}
                </p>
              </div>

              <button
                className="denuncia-fechar"
                onClick={fecharDetalhes}
                aria-label="Fechar detalhes"
              >
                <FaTimes />
              </button>
            </div>

            <nav className="denuncia-abas">
              {[
                ["geral", "Visão geral"],
                ["execucao", "Execução"],
                ["custos", "Financeiro"],
                ["historico", "Histórico"],
              ].map(([valor, texto]) => (
                <button
                  key={valor}
                  className={aba === valor ? "ativa" : ""}
                  onClick={() => setAba(valor)}
                >
                  {texto}
                </button>
              ))}
            </nav>

            <div className="denuncia-modal-conteudo">
              {aba === "geral" && (
                <div className="denuncia-detalhes-grid">
                  <div className="denuncia-campo">
                    <label>Status</label>
                    <select
                      value={selecionada.status}
                      onChange={(e) =>
                        atualizarDenuncia(
                          selecionada.id,
                          { status: e.target.value },
                          `Status alterado para ${e.target.value}.`
                        )
                      }
                    >
                      <option>Aberta</option>
                      <option>Em análise</option>
                      <option>Em execução</option>
                      <option>Resolvida</option>
                    </select>
                  </div>

                  <div className="denuncia-campo">
                    <label>Prioridade</label>
                    <select
                      value={selecionada.prioridade}
                      onChange={(e) =>
                        atualizarDenuncia(
                          selecionada.id,
                          { prioridade: e.target.value },
                          `Prioridade alterada para ${e.target.value}.`
                        )
                      }
                    >
                      <option>Alta</option>
                      <option>Média</option>
                      <option>Baixa</option>
                    </select>
                  </div>

                  <div className="denuncia-campo denuncia-campo-largo">
                    <label>Descrição</label>
                    <p>{selecionada.descricao}</p>
                  </div>

                  <div className="denuncia-campo">
                    <label>Rua</label>
                    <p>{selecionada.rua}</p>
                  </div>

                  <div className="denuncia-campo">
                    <label>Prazo atual</label>
                    <p>{dataFormatada(selecionada.prazo)}</p>
                  </div>

                  <div className="denuncia-campo denuncia-campo-largo">
                    <label>Resumo das tarefas</label>
                    <div className="denuncia-progresso-fundo">
                      <div style={{ width: `${progresso(selecionada)}%` }} />
                    </div>
                    <small>
                      {(selecionada.tarefas || []).filter((t) => t.concluida).length} de{" "}
                      {(selecionada.tarefas || []).length} tarefas concluídas
                    </small>
                  </div>

                  <div className="denuncia-campo denuncia-campo-largo">
                    <label>Observações da equipe</label>

                    <form
                      className="denuncia-form-inline"
                      onSubmit={adicionarAnotacao}
                    >
                      <input
                        value={novaAnotacao}
                        onChange={(e) => setNovaAnotacao(e.target.value)}
                        placeholder="Registrar uma observação..."
                      />
                      <button type="submit" className="denuncia-botao-principal">
                        <FaPlus /> Adicionar
                      </button>
                    </form>

                    {(selecionada.observacoes || []).map((observacao) => (
                      <div className="denuncia-anotacao" key={observacao.id}>
                        <p>{observacao.texto}</p>
                        <small>{observacao.data}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aba === "execucao" && (
                <div className="denuncia-painel-aba">
                  <h3>Planejamento da execução</h3>

                  <div className="denuncia-detalhes-grid">
                    <div className="denuncia-campo">
                      <label>
                        <FaUser /> Responsável
                      </label>
                      <input
                        value={selecionada.responsavel || ""}
                        placeholder="Nome do responsável"
                        onChange={(e) =>
                          atualizarDenuncia(selecionada.id, {
                            responsavel: e.target.value,
                          })
                        }
                        onBlur={() =>
                          atualizarDenuncia(
                            selecionada.id,
                            {},
                            `Responsável definido: ${selecionada.responsavel || "Não definido"}.`
                          )
                        }
                      />
                    </div>

                    <div className="denuncia-campo">
                      <label>
                        <FaCalendarAlt /> Prazo
                      </label>
                      <input
                        type="date"
                        value={selecionada.prazo || ""}
                        onChange={(e) =>
                          atualizarDenuncia(
                            selecionada.id,
                            { prazo: e.target.value },
                            `Prazo atualizado para ${dataFormatada(e.target.value)}.`
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="denuncia-tarefas-topo">
                    <h3>Checklist de execução</h3>
                    <span>
                      {(selecionada.tarefas || []).filter((t) => t.concluida).length}/
                      {(selecionada.tarefas || []).length}
                    </span>
                  </div>

                  <form className="denuncia-form-inline" onSubmit={adicionarTarefa}>
                    <input
                      value={novaTarefa}
                      onChange={(e) => setNovaTarefa(e.target.value)}
                      placeholder="Ex.: Solicitar material..."
                    />
                    <button type="submit" className="denuncia-botao-principal">
                      <FaPlus /> Criar tarefa
                    </button>
                  </form>

                  <div className="denuncia-lista-tarefas">
                    {(selecionada.tarefas || []).map((tarefa) => (
                      <div className="denuncia-tarefa" key={tarefa.id}>
                        <button
                          type="button"
                          className={`denuncia-check ${tarefa.concluida ? "concluida" : ""}`}
                          onClick={() => alternarTarefa(tarefa.id)}
                          aria-label={
                            tarefa.concluida ? "Reabrir tarefa" : "Concluir tarefa"
                          }
                        >
                          {tarefa.concluida && <FaCheck />}
                        </button>

                        <span className={tarefa.concluida ? "riscado" : ""}>
                          {tarefa.titulo}
                        </span>

                        <button
                          type="button"
                          className="denuncia-icone-excluir"
                          onClick={() => excluirTarefa(tarefa.id)}
                          aria-label="Excluir tarefa"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}

                    {!(selecionada.tarefas || []).length && (
                      <p className="denuncia-vazio">
                        Nenhuma tarefa cadastrada.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {aba === "custos" && (
                <div className="denuncia-painel-aba">
                  <h3>Controle financeiro da ocorrência</h3>
                  <p>
                    Preencha os valores para acompanhar o orçamento e os gastos.
                  </p>

                  <div className="denuncia-detalhes-grid">
                    {[
                      ["estimado", "Custo estimado"],
                      ["aprovado", "Orçamento aprovado"],
                      ["gasto", "Valor gasto"],
                    ].map(([campo, rotulo]) => (
                      <div className="denuncia-campo" key={campo}>
                        <label>{rotulo} (R$)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={selecionada[campo] ?? 0}
                          onChange={(e) =>
                            atualizarDenuncia(selecionada.id, {
                              [campo]: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          onBlur={() =>
                            atualizarDenuncia(
                              selecionada.id,
                              {},
                              `${rotulo} atualizado: ${moeda(selecionada[campo])}.`
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div className="denuncia-custos-resumo">
                    <div>
                      <span>Diferença entre estimativa e gasto</span>
                      <strong>
                        {moeda(Number(selecionada.estimado || 0) - Number(selecionada.gasto || 0))}
                      </strong>
                    </div>

                    <div>
                      <span>Saldo do orçamento aprovado</span>
                      <strong
                        className={
                          Number(selecionada.aprovado || 0) -
                            Number(selecionada.gasto || 0) < 0
                            ? "texto-vermelho"
                            : ""
                        }
                      >
                        {moeda(Number(selecionada.aprovado || 0) - Number(selecionada.gasto || 0))}
                      </strong>
                    </div>
                  </div>

                  {Number(selecionada.gasto || 0) >
                    Number(selecionada.aprovado || 0) && (
                      <div className="denuncia-alerta-custo">
                        <FaExclamationTriangle />
                        O gasto está acima do orçamento aprovado.
                      </div>
                    )}
                </div>
              )}

              {aba === "historico" && (
                <div className="denuncia-painel-aba">
                  <h3>
                    <FaHistory /> Histórico de alterações
                  </h3>

                  {!(selecionada.historico || []).length ? (
                    <p className="denuncia-vazio">
                      Nenhuma alteração registrada ainda.
                    </p>
                  ) : (
                    <div className="denuncia-historico">
                      {selecionada.historico.map((item) => (
                        <div className="denuncia-historico-item" key={item.id}>
                          <span className="denuncia-historico-ponto" />
                          <div>
                            <p>{item.texto}</p>
                            <small>{item.data}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="denuncia-nota">
                    Este histórico é temporário e existe apenas nesta sessão.
                    Para auditoria real, precisaremos salvá-lo no backend.
                  </p>
                </div>
              )}
            </div>

            <div className="denuncia-modal-rodape">
              <span>
                <FaEdit /> As alterações são aplicadas nesta interface.
              </span>
              <button
                className="denuncia-botao-secundario"
                onClick={fecharDetalhes}
              >
                Fechar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}


export default DenunciasTs;
