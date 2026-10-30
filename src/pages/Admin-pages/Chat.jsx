
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  FaComments,
  FaPaperPlane,
  FaUsers,
  FaHashtag,
} from "react-icons/fa";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import "./Chat.css";

const canais = [
  { id: "geral", nome: "Geral" },
  { id: "infraestrutura", nome: "Infraestrutura" },
  { id: "atendimento", nome: "Atendimento" },
  { id: "administracao", nome: "Administração" },
  { id: "tecnologia", nome: "Tecnologia" },
];

function Chat() {
  const usuario = (() => {
    try {
      return JSON.parse(localStorage.getItem("usuario") || "null");
    } catch {
      return null;
    }
  })();
  const idUsuario = Number(usuario?.id_usuario);
  const nome = String(usuario?.nome || usuario?.email || "Usuário");
  const [canal, setCanal] = useState("geral");
  const [mensagem, setMensagem] = useState("");
  const [mensagens, setMensagens] = useState([]);
  const [conectado, setConectado] = useState(false);
  const [erroChat, setErroChat] = useState("");
  const socketRef = useRef(null);
  const mensagensRef = useRef(null);

  useEffect(() => {
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      setErroChat("Entre na sua conta para acessar o chat.");
      return undefined;
    }

    const socket = io("http://localhost:3000", {
      auth: { id_usuario: idUsuario },
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      setConectado(true);
      setErroChat("");
    });
    socket.on("disconnect", () => setConectado(false));
    socket.on("connect_error", (erro) => {
      setConectado(false);
      setErroChat(erro.message || "Não foi possível conectar ao chat.");
    });
    socket.on("chat-erro", (texto) => setErroChat(texto));
    socket.on("historico-mensagens", (dados) => {
      setMensagens((anteriores) => {
        const outras = anteriores.filter((item) => item.canal !== dados.canal);
        return [...outras, ...(dados.mensagens || [])];
      });
    });
    socket.on("nova-mensagem", (dados) => {
      setMensagens((anteriores) => {
        if (anteriores.some((item) => item.id === dados.id)) return anteriores;
        return [...anteriores, dados];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [idUsuario]);

  useEffect(() => {
    if (!conectado || !socketRef.current) return;
    setErroChat("");
    socketRef.current.emit("entrar-canal", canal);
  }, [canal, conectado]);

  useEffect(() => {
    mensagensRef.current?.scrollTo({
      top: mensagensRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [mensagens]);

  function enviarMensagem(e) {
    e.preventDefault();
    const texto = mensagem.trim();
    if (!texto || !socketRef.current?.connected) return;
    socketRef.current.emit("enviar-mensagem", { canal, texto });
    setMensagem("");
  }

  const canalAtual = canais.find((item) => item.id === canal);

  return (
    <div className="admin">
      <Sidebar />

      <main className="admin-content">
        <Header />

        <section className="Content-chat">
          <div className="chat-topo">
            <div>
              <h1>
                <FaComments /> Chat interno
              </h1>
              <p>Converse com a equipe do Nexativo.</p>
            </div>

            <span className={`chat-status ${conectado ? "online" : ""}`}>
              <span />
              {conectado ? "Conectado" : "Desconectado"}
            </span>
          </div>

          {erroChat && <p className="chat-erro" role="status">{erroChat}</p>}
          {Number.isInteger(idUsuario) && idUsuario > 0 ? (
            <div className="chat-layout">
              <aside className="chat-canais">
                <h3><FaUsers /> Canais da equipe</h3>

                {canais.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`chat-canal ${
                      canal === item.id ? "ativo" : ""
                    }`}
                    onClick={() => setCanal(item.id)}
                  >
                    <FaHashtag />
                    {item.nome}
                  </button>
                ))}

                <div className="chat-usuario">
                  <span className="chat-avatar">
                    {nome.trim().charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <strong>{nome}</strong>
                    <small>Seu perfil</small>
                  </div>
                </div>
              </aside>

              <div className="chat-conversa">
                <header className="chat-conversa-topo">
                  <div>
                    <h2><FaHashtag /> {canalAtual?.nome}</h2>
                    <p>Canal de comunicação interna</p>
                  </div>
                </header>

                <div className="chat-mensagens" ref={mensagensRef}>
                  {mensagens.filter((item) => item.canal === canal).length === 0 ? (
                    <div className="chat-vazio">
                      <FaComments />
                      <h3>Nenhuma mensagem ainda</h3>
                      <p>Envie a primeira mensagem deste canal.</p>
                    </div>
                  ) : (
                    mensagens
                      .filter((item) => item.canal === canal)
                      .map((item, indice) => (
                        <article
                          key={item.id || `${item.nome}-${item.horario}-${indice}`}
                          className={`chat-mensagem ${
                            (item.id_usuario && item.id_usuario === idUsuario) || item.nome === nome ? "minha" : ""
                          }`}
                        >
                          <span className="chat-avatar">
                            {(item.nome || "?").charAt(0).toUpperCase()}
                          </span>

                          <div className="chat-mensagem-corpo">
                            <div className="chat-mensagem-info">
                              <strong>{item.nome}</strong>
                              <time>{item.horario || ""}</time>
                            </div>
                            <p>{item.texto}</p>
                          </div>
                        </article>
                      ))
                  )}
                </div>

                <form className="chat-formulario" onSubmit={enviarMensagem}>
                  <input
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder={
                      conectado
                        ? `Mensagem para ${canalAtual?.nome}...`
                        : "Aguardando conexão com o servidor..."
                    }
                    maxLength={2000}
                    disabled={!conectado}
                  />

                  <button
                    type="submit"
                    aria-label="Enviar mensagem"
                    disabled={!conectado || !mensagem.trim()}
                  >
                    <FaPaperPlane />
                    <span>Enviar</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="chat-identificacao">
              <h2>Entre na sua conta</h2>
              <p>O chat usa o usuário conectado para identificar suas mensagens.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Chat;
