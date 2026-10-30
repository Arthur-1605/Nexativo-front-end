import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../pages/Log e Cad.css";
import { API_URL } from "../api";

function LogeCad() {
  const [modo, setModo] = useState("login");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  function alternarModo(novoModo) {
    setModo(novoModo);
    setNome("");
    setEmail("");
    setSenha("");
    setConfirmarSenha("");
    setMostrarSenha(false);
    setErro("");
    setSucesso("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (modo === "cadastro" && senha !== confirmarSenha) {
      setErro("As senhas não são iguais!");
      return;
    }

    setCarregando(true);

    try {
      const url = modo === "login" ? `${API_URL}/login` : `${API_URL}/usuario`;
      const corpo = modo === "login"
        ? { email, senha }
        : { nome, email, senha };

      const resposta = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo)
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Não foi possível concluir a operação.");
        return;
      }

      if (modo === "login") {
        const { token, ...usuario } = dados;
        localStorage.setItem("token", token);
        localStorage.setItem("usuario", JSON.stringify(usuario));
        navigate(dados.cargo === "Administrador" ? "/admin" : "/home");
      } else {
        setSucesso("Cadastro realizado! Agora faça login.");
        setModo("login");
        setSenha("");
        setConfirmarSenha("");
      }
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    
      <main className="pagina">
        <section className="painel-info">
          <div className="marca">
            <span className="marca-icone">✦</span>
            <span>Não lembro o nome da nossa marca</span>
          </div>
          <div className="info-conteudo">
            <span className="etiqueta">
              Texto
            </span>
            <h1>
              Texto
              <br />
              subtitulo
            </h1>
            <p>
              arrumar texto
            </p>
            <div className="destaque">
              <div className="avatares">
                <span>A</span>
                <span>A</span>
                <span>T</span>
              </div>
              <p>Pode ser nossa inicias</p>
            </div>
          </div>
          <span className="rodape-info">
            Colocar texto
          </span>
        </section>
        <section className="painel-formulario">
          <div className="formulario-container">
            <div className="boas-vindas">
              <span className="mini-icone">✦</span>
              <h2>
                {modo === "login"
                  ? "Bem-vindo de volta!"
                  : "Crie sua conta"}
              </h2>
              <p>
                {modo === "login"
                  ? "Informe seus dados para entrar."
                  : "Preencha os campos para se cadastrar."}
              </p>
            </div>
            <div className="abas">
              <button
                type="button"
                className={modo === "login" ? "aba ativa" : "aba"}
                onClick={() => alternarModo("login")}
              >
                Entrar
              </button>
              <button
                type="button"
                className={modo === "cadastro" ? "aba ativa" : "aba"}
                onClick={() => alternarModo("cadastro")}
              >
                Cadastrar
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              {modo === "cadastro" && (
                <div className="campo">
                  <label htmlFor="nome">Nome completo</label>
                  <input
                    id="nome"
                    type="text"
                    placeholder="Digite seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              )}
              <div className="campo">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="campo">
                <label htmlFor="senha">Senha</label>
                <div className="senha-container">
                  <input
                    id="senha"
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete={
                      modo === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="mostrar-senha"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                  >
                    {mostrarSenha ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>
              {modo === "cadastro" && (
                <div className="campo">
                  <label htmlFor="confirmarSenha">
                    Confirmar senha
                  </label>
                  <input
                    id="confirmarSenha"
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    value={confirmarSenha}
                    onChange={(e) =>
                      setConfirmarSenha(e.target.value)
                    }
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
              )}
              {modo === "login" && (
                <div className="opcoes">
                  <label className="lembrar">
                    <input type="checkbox" />
                    Lembrar de mim
                  </label>
                  <span className="esqueci">
                    Esqueceu a senha?
                  </span>
                </div>
              )}
              {erro && <p style={{ color: "crimson" }}>{erro}</p>}
              {sucesso && <p style={{ color: "green" }}>{sucesso}</p>}
              <button
                type="submit"
                disabled={carregando}
                className="botao-principal"
              >
                {modo === "login"
                  ? "Entrar na conta"
                  : "Criar minha conta"}
                <span>→</span>
              </button>
            </form>
            <p className="trocar-modo">
              {modo === "login"
                ? "Ainda não tem uma conta?"
                : "Já possui uma conta?"}{" "}
              <button
                type="button"
                onClick={() =>
                  alternarModo(
                    modo === "login" ? "cadastro" : "login"
                  )
                }
              >
                {modo === "login" ? "Cadastre-se" : "Faça login"}
              </button>
            </p>
            <p className="termos">
              Ao continuar, você concorda com nossos termos de uso.
            </p>
          </div>
        </section>
      </main>
  );
}

export default LogeCad;