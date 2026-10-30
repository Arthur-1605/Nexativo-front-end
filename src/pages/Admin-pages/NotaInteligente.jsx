
import { useEffect, useRef, useState } from "react";
import {
  FaBrain,

  FaTrash,
  FaSearch,
  FaFileAlt,
  FaSyncAlt,
  FaCamera,
  FaImage,
  FaKeyboard,
  FaTimes,
  FaCopy,
  FaSave

} from "react-icons/fa";

import Sidebar from "../../components/Sidebar";
import { API_URL } from "../../api";
import { buscarNotas, criarNota, removerNota } from "../../dados";
import Header from "../../components/Header";

import "./AdminPaginas.css";
import "./Notas.css";

const CHAVE_NOTAS = "cidade-ativa-notas";

function Notas() {
  const [notas, setNotas] = useState([]);
  const [erroNotas, setErroNotas] = useState("");

  const [modo, setModo] = useState("digital");
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [busca, setBusca] = useState("");
  const [resumoIA, setResumoIA] = useState("");
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [erroIA, setErroIA] = useState("");

  const [foto, setFoto] = useState(null);
  const [transcricao, setTranscricao] = useState("");
  const [mensagemFoto, setMensagemFoto] = useState("");

  const inputArquivoRef = useRef(null);
  const inputCameraRef = useRef(null);

  function paraNota(n) {
    return {
      id: n.id_nota,
      titulo: n.titulo,
      conteudo: n.conteudo,
      tipo: n.tipo,
      data: n.data_criacao,
    };
  }

  async function carregarNotas() {
    try {
      const lista = await buscarNotas();
      setNotas(lista.map(paraNota));
      setErroNotas("");
    } catch (erro) {
      setErroNotas(erro.message);
    }
  }

  useEffect(() => {
    carregarNotas();
  }, []);

  async function adicionarNota(e) {
    e.preventDefault();

    if (!titulo.trim() || !conteudo.trim()) return;

    try {
      await criarNota(titulo.trim(), conteudo.trim(), "Manual");
      setTitulo("");
      setConteudo("");
      await carregarNotas();
    } catch (erro) {
      setErroNotas(erro.message);
    }
  }

  async function salvarTranscricao() {
    if (!transcricao.trim()) {
      setMensagemFoto("Digite ou transcreva algum texto antes de salvar.");
      return;
    }

    try {
      await criarNota(
        titulo.trim() || "Transcrição de caderno",
        transcricao.trim(),
        "Transcrição"
      );
      setTitulo("");
      setTranscricao("");
      setFoto(null);
      setMensagemFoto("Transcrição salva no histórico.");
      await carregarNotas();
    } catch (erro) {
      setMensagemFoto(erro.message);
    }
  }

  async function excluirNota(id) {
    try {
      await removerNota(id);
      setNotas((atuais) => atuais.filter((nota) => nota.id !== id));
    } catch (erro) {
      setErroNotas(erro.message);
    }
  }

  function selecionarFoto(arquivo) {
    setMensagemFoto("");
    setTranscricao("");

    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      setMensagemFoto("Selecione um arquivo de imagem válido.");
      return;
    }

    if (arquivo.size > 10 * 1024 * 1024) {
      setMensagemFoto("A imagem deve ter no máximo 10 MB.");
      return;
    }

    const url = URL.createObjectURL(arquivo);

    setFoto((anterior) => {
      if (anterior?.url) URL.revokeObjectURL(anterior.url);
      return {
        arquivo,
        url,
        nome: arquivo.name || "Foto do caderno",
      };
    });
  }

  function removerFoto() {
    if (foto?.url) URL.revokeObjectURL(foto.url);
    setFoto(null);
    setTranscricao("");
    setMensagemFoto("");
    if (inputArquivoRef.current) inputArquivoRef.current.value = "";
    if (inputCameraRef.current) inputCameraRef.current.value = "";
  }

  async function copiarTranscricao() {
    try {
      await navigator.clipboard.writeText(transcricao);
      setMensagemFoto("Texto copiado para a área de transferência.");
    } catch {
      setMensagemFoto(
        "Não foi possível copiar automaticamente. Selecione o texto e copie manualmente."
      );
    }
  }

  async function gerarResumoIA() {
    setCarregandoIA(true);
    setErroIA("");
    setResumoIA("");

    try {
      const resposta = await fetch(`${API_URL}/notas/ia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notas: notas.map(({ titulo, conteudo, tipo, data }) => ({
            titulo,
            conteudo,
            tipo,
            data,
          })),
        }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.mensagem || "Não foi possível gerar a análise."
        );
      }

      setResumoIA(resultado.resumo);
    } catch (erro) {
      setErroIA(
        erro.message || "Não foi possível conectar ao servidor de análise."
      );
    } finally {
      setCarregandoIA(false);
    }
  }

  const notasFiltradas = notas.filter((nota) =>
    `${nota.titulo} ${nota.conteudo}`
      .toLowerCase()
      .includes(busca.toLowerCase())
  );

  return (
    <div className="admin">
      <Sidebar />

      <main className="admin-content">
        <Header />

        <section className="notas-pagina">
          {erroNotas && <p style={{ color: "crimson" }}>{erroNotas}</p>}
          <header className="notas-cabecalho">
            <div>
              <span className="notas-etiqueta">
                <FaBrain /> ESPAÇO DE ANOTAÇÕES
              </span>
              <h1>Notas inteligentes</h1>
              <p>
                Registre ideias, fotografe seu caderno e organize suas
                informações em um só lugar.
              </p>
            </div>

            <div className="notas-total">
              <FaFileAlt />
              <span>{notas.length} notas salvas</span>
            </div>
          </header>

          <section className="notas-area-criacao">
            <div className="notas-abas" role="tablist" aria-label="Forma de anotação">
              <button
                type="button"
                role="tab"
                aria-selected={modo === "digital"}
                className={modo === "digital" ? "ativa" : ""}
                onClick={() => setModo("digital")}
              >
                <FaKeyboard /> Escrever
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={modo === "foto"}
                className={modo === "foto" ? "ativa" : ""}
                onClick={() => setModo("foto")}
              >
                <FaCamera /> Foto do caderno
              </button>
            </div>

            {modo === "digital" ? (
              <section className="notas-editor">
                <div className="notas-secao-titulo">
                  <div>
                    <h2>Nova anotação</h2>
                    <p>Escreva diretamente no editor.</p>
                  </div>
                  <FaKeyboard />
                </div>

                <form onSubmit={adicionarNota}>
                  <label htmlFor="nota-titulo">Título</label>
                  <input
                    id="nota-titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex.: Problemas recorrentes no bairro"
                    maxLength={120}
                    required
                  />

                  <label htmlFor="nota-conteudo">Sua anotação</label>
                  <textarea
                    id="nota-conteudo"
                    value={conteudo}
                    onChange={(e) => setConteudo(e.target.value)}
                    placeholder="Comece a escrever suas ideias, observações ou decisões..."
                    rows={7}
                    required
                  />

                  <div className="notas-editor-rodape">
                    <span>{conteudo.length} caracteres</span>
                    <button className="notas-botao-principal" type="submit">
                      <FaSave /> Salvar anotação
                    </button>
                  </div>
                </form>
              </section>
            ) : (
              <section className="notas-editor">
                <div className="notas-secao-titulo">
                  <div>
                    <h2>Digitalizar caderno</h2>
                    <p>
                      Tire uma foto agora ou escolha uma imagem do seu
                      dispositivo.
                    </p>
                  </div>
                  <FaCamera />
                </div>

                <div className="notas-upload-opcoes">
                  <button
                    type="button"
                    className="notas-upload-card"
                    onClick={() => inputCameraRef.current?.click()}
                  >
                    <span className="notas-upload-icone">
                      <FaCamera />
                    </span>
                    <strong>Tirar foto</strong>
                    <span>Abrir a câmera do dispositivo</span>
                  </button>

                  <button
                    type="button"
                    className="notas-upload-card"
                    onClick={() => inputArquivoRef.current?.click()}
                  >
                    <span className="notas-upload-icone">
                      <FaImage />
                    </span>
                    <strong>Enviar imagem</strong>
                    <span>Escolher uma foto salva</span>
                  </button>
                </div>

                <input
                  ref={inputCameraRef}
                  className="notas-input-arquivo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  aria-label="Tirar foto do caderno"
                  onChange={(e) => {
                    selecionarFoto(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />

                <input
                  ref={inputArquivoRef}
                  className="notas-input-arquivo"
                  type="file"
                  accept="image/*"
                  aria-label="Escolher imagem do caderno"
                  onChange={(e) => {
                    selecionarFoto(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />

                {foto && (
                  <div className="notas-foto-preview">
                    <div className="notas-foto-cabecalho">
                      <div>
                        <strong>Imagem selecionada</strong>
                        <span>{foto.nome}</span>
                      </div>
                      <button
                        type="button"
                        className="notas-botao-icon"
                        onClick={removerFoto}
                        aria-label="Remover imagem"
                        title="Remover imagem"
                      >
                        <FaTimes />
                      </button>
                    </div>

                    <img src={foto.url} alt="Prévia da foto do caderno" />

                    <div className="notas-aviso-ia">
                     <FaBrain />
                      <p>
                        A imagem está pronta. A leitura automática da
                        escrita será ativada quando conectarmos o backend
                        ao Gemini.
                      </p>
                    </div>

                    <label htmlFor="nota-titulo-foto">
                      Título da anotação (opcional)
                    </label>
                    <input
                      id="nota-titulo-foto"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ex.: Reunião sobre infraestrutura"
                      maxLength={120}
                    />

                    <div className="notas-transcricao-cabecalho">
                      <div>
                        <h3>Texto transcrito</h3>
                        <p>
                          Você também pode digitar ou colar o texto
                          manualmente neste campo.
                        </p>
                      </div>
                      <span>EDITÁVEL</span>
                    </div>

                    <textarea
                      className="notas-transcricao"
                      value={transcricao}
                      onChange={(e) => setTranscricao(e.target.value)}
                      placeholder="A transcrição aparecerá aqui quando a IA estiver conectada. Por enquanto, você pode escrever ou colar o texto manualmente."
                      rows={8}
                    />

                    <div className="notas-editor-rodape">
                      <span>{transcricao.length} caracteres</span>
                      <div className="notas-acoes-transcricao">
                        <button
                          type="button"
                          className="notas-botao-secundario"
                          onClick={copiarTranscricao}
                          disabled={!transcricao.trim()}
                        >
                          <FaCopy /> Copiar
                        </button>
                        <button
                          type="button"
                          className="notas-botao-principal"
                          onClick={salvarTranscricao}
                          disabled={!transcricao.trim()}
                        >
                          <FaSave /> Salvar texto
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {mensagemFoto && (
                  <p className="notas-mensagem" role="status">
                    {mensagemFoto}
                  </p>
                )}
              </section>
            )}
          </section>

          <section className="notas-ia-resumo">
            <div className="notas-secao-titulo">
              <div>
                <h2>Análise inteligente</h2>
                <p>
                  Encontre padrões e possíveis prioridades nas notas salvas.
                </p>
              </div>
              <FaBrain />
            </div>

            <button
              className="notas-botao-secundario"
              onClick={gerarResumoIA}
              disabled={carregandoIA || notas.length === 0}
              type="button"
            >
              {carregandoIA ? <FaSyncAlt className="notas-girando" /> : <FaBrain />}
              {carregandoIA ? "Analisando..." : "Analisar notas salvas"}
            </button>

            {erroIA && (
              <p className="notas-erro" role="alert">
                {erroIA}
              </p>
            )}

            {resumoIA && (
              <div className="notas-resumo">
                <h3>Resultado da análise</h3>
                <p>{resumoIA}</p>
              </div>
            )}

            {!resumoIA && !erroIA && !carregandoIA && (
              <p className="notas-texto-suave">
                O resultado da análise aparecerá aqui.
              </p>
            )}
          </section>

          <section className="notas-historico">
            <div className="notas-lista-cabecalho">
              <div>
                <h2>Histórico</h2>
                <p>Pesquise, consulte e organize suas anotações.</p>
              </div>

              <div className="notas-busca">
                <FaSearch />
                <input
                  aria-label="Pesquisar notas"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar notas..."
                />
              </div>
            </div>

            <div className="notas-historico-resumo">
              <span>{notas.length} notas registradas</span>
              <span>{notasFiltradas.length} resultados</span>
            </div>

            {notasFiltradas.length === 0 ? (
              <div className="notas-vazio">
                <FaFileAlt />
                <p>Nenhuma anotação encontrada.</p>
              </div>
            ) : (
              <div className="notas-lista-itens">
                {notasFiltradas.map((nota) => (
                  <article className="notas-item" key={nota.id}>
                    <div className="notas-item-conteudo">
                      <div className="notas-item-meta">
                        <span>{nota.tipo}</span>
                        <time dateTime={nota.data}>
                          {new Date(nota.data).toLocaleString("pt-BR")}
                        </time>
                      </div>
                      <h3>{nota.titulo}</h3>
                      <p>{nota.conteudo}</p>
                    </div>

                    <button
                      className="notas-botao-icon notas-excluir"
                      onClick={() => excluirNota(nota.id)}
                      type="button"
                      aria-label={`Excluir nota ${nota.titulo}`}
                      title="Excluir nota"
                    >
                      <FaTrash />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

export default Notas;
