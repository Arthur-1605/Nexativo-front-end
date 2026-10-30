
import { useEffect, useState } from "react";
import {
  buscarOcorrenciasCompletas,
  buscarHistorico,
  buscarAtendimentos,
  formatarHistorico,
  atualizarStatus,
  registrarHistorico,
  criarAtendimento,
  encontrarEquipe
} from "../../dados";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "./AdminPaginas.css";
import "./AltaGravidade.css";

const niveisRisco = ["Todos", "Alto"];

function AltaGravidade() {
  const [incidentes, setIncidentes] = useState([]);
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroRisco, setFiltroRisco] = useState("Todos");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [responsavel, setResponsavel] = useState("");
  const [acao, setAcao] = useState("");
  const [mensagem, setMensagem] = useState("");

  // Esta tela mostra só ocorrências de prioridade Alta
  async function carregar() {
    try {
      const base = await buscarOcorrenciasCompletas();

      const altas = base.filter((o) => o.prioridade === "Alta");

      const detalhes = await Promise.all(
        altas.map(async (o) => {
          const [historico, atendimentos] = await Promise.all([
            buscarHistorico(o.id),
            buscarAtendimentos(o.id),
          ]);

          return {
            ...o,
            risco: "Alto",
            responsavel: atendimentos.length
              ? atendimentos[atendimentos.length - 1].equipe_nome
              : "",
            fatores: [],
            historico: historico.slice().reverse().map(formatarHistorico),
          };
        })
      );

      setIncidentes(detalhes);
      setSelecionadoId((atual) => atual ?? detalhes[0]?.id ?? null);
      return detalhes;
    } catch {
      setMensagem("Não foi possível carregar as ocorrências.");
      return [];
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const categorias = [
    "Todas",
    ...new Set(incidentes.map((item) => item.categoria)),
  ];

  const filtrados = incidentes.filter((item) => {
    const termo = busca.toLowerCase();

    const correspondeBusca = [
      item.titulo,
      item.bairro,
      item.rua,
      String(item.id),
    ].some((valor) => valor.toLowerCase().includes(termo));

    return (
      correspondeBusca &&
      (filtroRisco === "Todos" || item.risco === filtroRisco) &&
      (filtroCategoria === "Todas" ||
        item.categoria === filtroCategoria)
    );
  });

  const selecionado = incidentes.find(
    (item) => item.id === selecionadoId
  );

  async function atribuirResponsavel(evento) {
    evento.preventDefault();

    if (!selecionado || !responsavel.trim()) {
      setMensagem("Informe o nome da equipe responsável.");
      return;
    }

    try {
      const equipe = await encontrarEquipe(responsavel);

      if (!equipe) {
        setMensagem(`Equipe "${responsavel.trim()}" não encontrada.`);
        return;
      }

      await criarAtendimento(
        selecionado.id,
        equipe.id_equipe,
        `Atribuída a ${equipe.nome}`
      );

      await atualizarStatus(
        selecionado,
        "Em atendimento",
        `Responsável atribuído: ${equipe.nome}`
      );

      setResponsavel("");
      await carregar();
      setMensagem("Responsável atribuído.");
    } catch (erro) {
      setMensagem(erro.message);
    }
  }

  async function registrarAcao(evento) {
    evento.preventDefault();

    if (!selecionado || !acao.trim()) {
      setMensagem("Descreva a ação realizada ou planejada.");
      return;
    }

    try {
      await registrarHistorico(
        selecionado,
        selecionado.status,
        `Ação registrada: ${acao.trim()}`
      );

      setAcao("");
      await carregar();
      setMensagem("Ação registrada no histórico.");
    } catch (erro) {
      setMensagem(erro.message);
    }
  }

  return (
    <div className="admin">
      <Sidebar />

      <main className="admin-content">
        <Header />

        <section className="alta-gravidade">
          <div className="ag-cabecalho">
            <div>
              <span className="ag-etiqueta">
                GESTÃO DE RISCO
              </span>
              <h1>Central de incidentes</h1>
              <p>
                Identifique riscos, avalie impactos e organize a
                resposta às ocorrências críticas.
              </p>
            </div>

            <div className="ag-status-sistema">
              <span className="ag-status-ponto" />
              Dados demonstrativos
            </div>
          </div>

          <div className="ag-indicadores">
            <article className="ag-indicador">
              <span>Risco muito alto</span>
              <strong className="ag-numero-critico">
                {incidentes.filter(
                  (item) => item.risco === "Muito alto"
                ).length}
              </strong>
              <small>Exigem avaliação prioritária</small>
            </article>

            <article className="ag-indicador">
              <span>Sem responsável</span>
              <strong>
                {incidentes.filter(
                  (item) => !item.responsavel
                ).length}
              </strong>
              <small>Aguardando atribuição</small>
            </article>

            <article className="ag-indicador">
              <span>Em atendimento</span>
              <strong>
                {incidentes.filter(
                  (item) => item.status === "Em atendimento"
                ).length}
              </strong>
              <small>Com equipe atribuída</small>
            </article>
          </div>

          <div className="ag-filtros">
            <label className="ag-busca">
              <span>⌕</span>
              <input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Buscar ocorrência, endereço ou ID..."
              />
            </label>

            <select
              aria-label="Filtrar nível de risco"
              value={filtroRisco}
              onChange={(evento) =>
                setFiltroRisco(evento.target.value)
              }
            >
              {niveisRisco.map((nivel) => (
                <option key={nivel} value={nivel}>
                  {nivel === "Todos" ? "Todos os riscos" : nivel}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtrar categoria"
              value={filtroCategoria}
              onChange={(evento) =>
                setFiltroCategoria(evento.target.value)
              }
            >
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria === "Todas"
                    ? "Todas as categorias"
                    : categoria}
                </option>
              ))}
            </select>
          </div>

          <div className="ag-conteudo">
            <section className="ag-fila">
              <div className="ag-secao-cabecalho">
                <div>
                  <h2>Fila prioritária</h2>
                  <p>Ocorrências selecionadas para avaliação de risco</p>
                </div>
                <span className="ag-contagem">{filtrados.length}</span>
              </div>

              <div className="ag-lista">
                {filtrados.length === 0 && (
                  <div className="ag-vazio">
                    Nenhuma ocorrência corresponde aos filtros.
                  </div>
                )}

                {filtrados.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`ag-incidente ${
                      selecionadoId === item.id ? "selecionado" : ""
                    }`}
                    onClick={() => {
                      setSelecionadoId(item.id);
                      setMensagem("");
                    }}
                  >
                    <div className="ag-incidente-topo">
                      <span className="ag-id">
                        #{item.id}
                      </span>
                      <span
                        className={`ag-risco ${
                          item.risco === "Muito alto"
                            ? "muito-alto"
                            : "alto"
                        }`}
                      >
                        {item.risco}
                      </span>
                    </div>

                    <h3>{item.titulo}</h3>

                    <p className="ag-categoria">
                      {item.categoria}
                    </p>

                    <div className="ag-incidente-local">
                      <span>⌖</span>
                      <div>
                        <strong>{item.bairro}</strong>
                        <small>{item.rua}</small>
                      </div>
                    </div>

                    <div className="ag-incidente-rodape">
                      <span
                        className={`ag-status ${
                          item.responsavel
                            ? "em-atendimento"
                            : "sem-equipe"
                        }`}
                      >
                        {item.responsavel
                          ? "Equipe atribuída"
                          : "Sem responsável"}
                      </span>
                      <span className="ag-seta">→</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="ag-detalhes">
              {!selecionado ? (
                <div className="ag-vazio">
                  Selecione uma ocorrência para consultar os detalhes.
                </div>
              ) : (
                <>
                  <div className="ag-detalhes-topo">
                    <div>
                      <span className="ag-etiqueta">
                        DETALHES DO INCIDENTE
                      </span>
                      <span className="ag-id ag-id-detalhe">
                        #{selecionado.id}
                      </span>
                    </div>

                    <span
                      className={`ag-risco ${
                        selecionado.risco === "Muito alto"
                          ? "muito-alto"
                          : "alto"
                      }`}
                    >
                      {selecionado.risco}
                    </span>
                  </div>

                  <h2>{selecionado.titulo}</h2>
                  <p className="ag-descricao">
                    {selecionado.descricao}
                  </p>

                  <div className="ag-bloco">
                    <h3>Localização</h3>
                    <div className="ag-info-local">
                      <span className="ag-icone-local">⌖</span>
                      <div>
                        <strong>{selecionado.bairro}</strong>
                        <p>{selecionado.rua}</p>
                        <small>{selecionado.categoria}</small>
                      </div>
                    </div>
                    <div className="ag-mapa-placeholder">
                      <span>⌖</span>
                      <p>
                        Localização do incidente
                        <small>
                          O mapa será conectado aos dados reais posteriormente.
                        </small>
                      </p>
                    </div>
                  </div>

                  <div className="ag-bloco">
                    <h3>Avaliação do impacto</h3>
                    <div className="ag-impacto">
                      <span className="ag-impacto-icone">!</span>
                      <div>
                        <strong>{selecionado.impacto}</strong>
                        <p>
                          Quantidade de pessoas afetadas ainda não
                          confirmada.
                        </p>
                      </div>
                    </div>

                    <ul className="ag-fatores">
                      {selecionado.fatores.map((fator) => (
                        <li key={fator}>
                          <span />
                          {fator}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="ag-bloco">
                    <h3>Encaminhamento</h3>

                    <div className="ag-responsavel-atual">
                      <span>Responsável atual</span>
                      <strong>
                        {selecionado.responsavel || "Não atribuído"}
                      </strong>
                      <small>{selecionado.status}</small>
                    </div>

                    <form
                      className="ag-form"
                      onSubmit={atribuirResponsavel}
                    >
                      <label htmlFor="ag-responsavel">
                        Atribuir equipe ou responsável
                      </label>
                      <input
                        id="ag-responsavel"
                        value={responsavel}
                        onChange={(evento) =>
                          setResponsavel(evento.target.value)
                        }
                        placeholder="Ex.: Equipe hidráulica"
                      />
                      <button type="submit" className="ag-botao-principal">
                        Atribuir responsável
                      </button>
                    </form>
                  </div>

                  <div className="ag-bloco">
                    <h3>Registrar uma ação</h3>
                    <form className="ag-form" onSubmit={registrarAcao}>
                      <label htmlFor="ag-acao">
                        Providência ou atualização
                      </label>
                      <textarea
                        id="ag-acao"
                        value={acao}
                        onChange={(evento) => setAcao(evento.target.value)}
                        placeholder="Descreva a ação realizada ou planejada..."
                        rows={3}
                      />
                      <button type="submit" className="ag-botao-secundario">
                        Registrar no histórico
                      </button>
                    </form>

                    {mensagem && (
                      <p className="ag-mensagem" role="status">
                        {mensagem}
                      </p>
                    )}
                  </div>

                  <div className="ag-bloco ag-bloco-historico">
                    <h3>Histórico de ações</h3>
                    <ul className="ag-historico">
                      {[...selecionado.historico]
                        .reverse()
                        .map((evento, indice) => (
                          <li key={`${indice}-${evento}`}>
                            <span className="ag-historico-ponto" />
                            <p>{evento}</p>
                          </li>
                        ))}
                    </ul>
                  </div>
                </>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AltaGravidade;
