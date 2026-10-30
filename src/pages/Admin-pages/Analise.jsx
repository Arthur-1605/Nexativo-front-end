
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
import "./Analise.css";

const etapas = [
  {
    id: "investigacao",
    titulo: "Em investigação",
    descricao: "Verificação do problema",
  },
  {
    id: "encaminhamento",
    titulo: "Encaminhamento",
    descricao: "Preparando atendimento",
  },
  {
    id: "retorno",
    titulo: "Aguardando retorno",
    descricao: "Aguardando informações",
  },
];

// Cada etapa da tela corresponde a um status no banco
const etapaParaStatus = {
  investigacao: "Aberta",
  encaminhamento: "Em análise",
  retorno: "Em atendimento",
};

const statusParaEtapa = {
  Aberta: "investigacao",
  "Em análise": "encaminhamento",
  "Em atendimento": "retorno",
};

function Analise() {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("Todas");
  const [selecionada, setSelecionada] = useState(null);
  const [responsavelEditado, setResponsavelEditado] = useState("");

  async function carregar() {
    try {
      const base = await buscarOcorrenciasCompletas();

      const detalhes = await Promise.all(
        base.map(async (o) => {
          const [historico, atendimentos] = await Promise.all([
            buscarHistorico(o.id),
            buscarAtendimentos(o.id),
          ]);

          return {
            ...o,
            etapa: statusParaEtapa[o.status] || null,
            responsavel: atendimentos.length
              ? atendimentos[atendimentos.length - 1].equipe_nome
              : "Não atribuído",
            historico: historico.slice().reverse().map(formatarHistorico),
          };
        })
      );

      setOcorrencias(detalhes);
      setErro("");
      return detalhes;
    } catch {
      setErro("Não foi possível carregar as ocorrências.");
      return [];
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function moverOcorrencia(id, novaEtapa) {
    const alvo = ocorrencias.find((o) => o.id === id);
    if (!alvo) return;

    const titulo = etapas.find((e) => e.id === novaEtapa)?.titulo;

    try {
      await atualizarStatus(
        alvo,
        etapaParaStatus[novaEtapa],
        `Movida para ${titulo}`
      );

      const lista = await carregar();
      setSelecionada(lista.find((o) => o.id === id) || null);
    } catch (e) {
      setErro(e.message);
    }
  }

  async function salvarResponsavel() {
    if (!selecionada) return;

    const nome = responsavelEditado.trim();
    if (!nome) return;

    try {
      const equipe = await encontrarEquipe(nome);

      if (!equipe) {
        setErro(`Equipe "${nome}" não encontrada. Use um dos nomes cadastrados.`);
        return;
      }

      await criarAtendimento(
        selecionada.id,
        equipe.id_equipe,
        `Responsável: ${equipe.nome}`
      );

      await registrarHistorico(
        selecionada,
        selecionada.status,
        `Responsável atualizado para ${equipe.nome}`
      );

      setResponsavelEditado("");

      const lista = await carregar();
      setSelecionada(lista.find((o) => o.id === selecionada.id) || null);
    } catch (e) {
      setErro(e.message);
    }
  }

  const filtradas = ocorrencias.filter((ocorrencia) => {
    const termo = busca.toLowerCase();

    const correspondeBusca = [
      ocorrencia.titulo,
      ocorrencia.bairro,
      ocorrencia.rua,
      String(ocorrencia.id),
    ].some((valor) => valor.toLowerCase().includes(termo));

    const correspondePrioridade =
      filtroPrioridade === "Todas" ||
      ocorrencia.prioridade === filtroPrioridade;

    return correspondeBusca && correspondePrioridade;
  });

  return (
    <div className="admin">
      <Sidebar />

      <main className="admin-content">
        <Header />

        <section className="analise-pagina">
          {erro && <p style={{ color: "crimson" }}>{erro}</p>}
          <div className="analise-cabecalho">
            <div>
              <span className="analise-etiqueta">GESTÃO OPERACIONAL</span>
              <h1>Central de análise</h1>
              <p>
                Acompanhe as ocorrências e organize os próximos passos de
                atendimento.
              </p>
            </div>

            <div className="analise-total">
              <span>Ocorrências no fluxo</span>
              <strong>{ocorrencias.length}</strong>
            </div>
          </div>

          <div className="analise-resumo">
            {etapas.map((etapa) => (
              <div className="analise-resumo-item" key={etapa.id}>
                <span>{etapa.titulo}</span>
                <strong>
                  {
                    ocorrencias.filter(
                      (ocorrencia) => ocorrencia.etapa === etapa.id
                    ).length
                  }
                </strong>
              </div>
            ))}
          </div>

          <div className="analise-filtros">
            <label className="analise-busca">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Buscar por problema, rua, bairro ou ID..."
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
              />
            </label>

            <select
              aria-label="Filtrar por prioridade"
              value={filtroPrioridade}
              onChange={(evento) =>
                setFiltroPrioridade(evento.target.value)
              }
            >
              <option value="Todas">Todas as prioridades</option>
              <option value="Alta">Prioridade alta</option>
              <option value="Média">Prioridade média</option>
              <option value="Baixa">Prioridade baixa</option>
            </select>
          </div>

          <div className="analise-quadro">
            {etapas.map((etapa, indice) => {
              const cards = filtradas.filter(
                (ocorrencia) => ocorrencia.etapa === etapa.id
              );

              return (
                <section className="analise-coluna" key={etapa.id}>
                  <header className="analise-coluna-topo">
                    <div>
                      <h2>{etapa.titulo}</h2>
                      <p>{etapa.descricao}</p>
                    </div>
                    <span className="analise-contagem">{cards.length}</span>
                  </header>

                  <div className="analise-lista">
                    {cards.length === 0 && (
                      <div className="analise-vazio">
                        Nenhuma ocorrência nesta etapa.
                      </div>
                    )}

                    {cards.map((ocorrencia) => (
                      <article
                        className="analise-card"
                        key={ocorrencia.id}
                      >
                        <div className="analise-card-topo">
                          <span className="analise-id">
                            #{String(ocorrencia.id).padStart(4, "0")}
                          </span>
                          <span
                            className={`analise-prioridade ${ocorrencia.prioridade.toLowerCase()}`}
                          >
                            {ocorrencia.prioridade}
                          </span>
                        </div>

                        <h3>{ocorrencia.titulo}</h3>
                        <p className="analise-categoria">
                          {ocorrencia.categoria}
                        </p>

                        <div className="analise-local">
                          <span>⌖</span>
                          <div>
                            <strong>{ocorrencia.bairro}</strong>
                            <small>{ocorrencia.rua}</small>
                          </div>
                        </div>

                        <div className="analise-responsavel">
                          <span className="analise-avatar">
                            {ocorrencia.responsavel === "Não atribuído"
                              ? "?"
                              : ocorrencia.responsavel.charAt(0)}
                          </span>
                          <span>{ocorrencia.responsavel}</span>
                        </div>

                        <button
                          className="analise-detalhes"
                          onClick={() => {
                            setSelecionada(ocorrencia);
                            setResponsavelEditado(ocorrencia.responsavel);
                          }}
                        >
                          Ver detalhes
                        </button>

                        <div className="analise-movimentacao">
                          {indice > 0 && (
                            <button
                              onClick={() =>
                                moverOcorrencia(
                                  ocorrencia.id,
                                  etapas[indice - 1].id
                                )
                              }
                            >
                              ← Voltar
                            </button>
                          )}

                          {indice < etapas.length - 1 && (
                            <button
                              className="analise-avancar"
                              onClick={() =>
                                moverOcorrencia(
                                  ocorrencia.id,
                                  etapas[indice + 1].id
                                )
                              }
                            >
                              Avançar →
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      </main>

      {selecionada && (
        <div
          className="analise-modal-fundo"
          onClick={() => setSelecionada(null)}
        >
          <section
            className="analise-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="analise-modal-titulo"
            onClick={(evento) => evento.stopPropagation()}
          >
            <button
              className="analise-modal-fechar"
              onClick={() => setSelecionada(null)}
              aria-label="Fechar detalhes"
            >
              ×
            </button>

            <span className="analise-etiqueta">
              OCORRÊNCIA #{String(selecionada.id).padStart(4, "0")}
            </span>

            <h2 id="analise-modal-titulo">{selecionada.titulo}</h2>
            <p className="analise-modal-descricao">
              {selecionada.descricao}
            </p>

            <div className="analise-modal-info">
              <p>
                <strong>Categoria:</strong> {selecionada.categoria}
              </p>
              <p>
                <strong>Local:</strong> {selecionada.rua},{" "}
                {selecionada.bairro}
              </p>
              <p>
                <strong>Prioridade:</strong> {selecionada.prioridade}
              </p>
              <p>
                <strong>Etapa atual:</strong>{" "}
                {etapas.find((e) => e.id === selecionada.etapa)?.titulo}
              </p>
            </div>

            <label className="analise-label-responsavel">
              Responsável pelo atendimento
              <input
                value={responsavelEditado}
                onChange={(evento) =>
                  setResponsavelEditado(evento.target.value)
                }
                placeholder="Nome da equipe ou responsável"
              />
            </label>

            <button
              className="analise-salvar"
              onClick={salvarResponsavel}
            >
              Salvar responsável
            </button>

            <h3 className="analise-historico-titulo">
              Histórico de atividades
            </h3>

            <ul className="analise-historico">
              {selecionada.historico.map((item, indice) => (
                <li key={`${indice}-${item}`}>
                  <span />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

export default Analise;
