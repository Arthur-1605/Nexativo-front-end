import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  function sair() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    navigate("/", { replace: true });
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <h2 className="home-logo">CidadeAtiva</h2>

        <nav className="home-nav">
          <a href="#inicio">Início</a>
          <a href="#sobre">Sobre</a>
          <button
            className="home-sair"
            onClick={sair}
          >
            Sair
          </button>
        </nav>
      </header>

      <main>
        <section className="home-hero" id="inicio">
          <div className="home-conteudo">
            <span className="home-tag">
              CIDADANIA E INOVAÇÃO
            </span>

            <h1>
              Sua cidade melhor começa com <span>sua participação.</span>
            </h1>

            <p>
              Ajude a transformar sua cidade! Registre ocorrências,
              informe problemas urbanos e acompanhe as melhorias
              que fazem a diferença na comunidade.
            </p>

            <button
              className="home-botao"
              onClick={() => navigate("/denuncia")}
            >
              Registrar ocorrência →
            </button>
          </div>

          <div className="home-ilustracao">
            <div className="home-icone">🏙️</div>
            <h3>Uma cidade melhor para todos</h3>
            <p>
              Identifique problemas, compartilhe informações
              e contribua para uma cidade mais organizada.
            </p>
          </div>
        </section>

        <section className="home-acoes" id="sobre">
          <h2>O que você deseja fazer?</h2>
          <p className="home-subtitulo">
            Escolha uma opção para começar.
          </p>

          <div className="home-cards">
            <article className="home-card">
              <span>📝</span>
              <h3>Nova ocorrência</h3>
              <p>
                Informe problemas encontrados na cidade
                para que possam ser analisados.
              </p>
              <button onClick={() => navigate("/denuncia")}>
                Registrar →
              </button>
            </article>

            <article className="home-card">
              <span>🗺️</span>
              <h3>Mapa da cidade</h3>
              <p>
                Consulte a localização das ocorrências
                registradas no sistema.
              </p>
              <button onClick={() => navigate("/mapa")}>
                Ver mapa →
              </button>
            </article>

            <article className="home-card">
              <span>👤</span>
              <h3>Minha conta</h3>
              <p>
                Acesse esta área para consultar seus
                dados e informações da sua conta.
              </p>
              <button onClick={() => navigate("/perfil")}>
                Meu perfil →
              </button>
            </article>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <p>© 2026 CidadeAtiva — Construindo cidades melhores.</p>
      </footer>
    </div>
  );
}

export default Home;