import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buscarOcorrenciasCompletas } from "../dados";

import {
  FaSearch,
  FaChevronRight,
  FaMapMarkerAlt,
  FaRobot,
  FaTimes
} from "react-icons/fa";

import "./ListaDenuncias.css";




function ListadeDenuncias() {

  const [denunciaSelecionada, setDenunciaSelecionada] = useState(null);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const navigate = useNavigate();
  const [denuncias, setDenuncias] = useState([]);
  const [erroCarga, setErroCarga] = useState("");

  useEffect(() => {
    buscarOcorrenciasCompletas()
      .then((lista) =>
        setDenuncias(
          lista.slice(0, 10).map((o) => ({
            id: o.id,
            problema: o.titulo,
            descricao: o.descricao,
            categoria: o.categoria,
            cidade: o.cidade,
            bairro: o.bairro,
            rua: o.rua,
            prioridade: o.prioridade,
            status: o.status,
            data: o.data ? o.data.toLocaleDateString("pt-BR") : "",
            hora: o.data
              ? o.data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
              : "",
            analise: o.impacto,
            ia: Boolean(o.impacto)
          }))
        )
      )
      .catch(() => setErroCarga("Não foi possível carregar as denúncias."));
  }, []);

  // pesquisa

const denunciasFiltradas = denuncias.filter((denuncia) =>
  denuncia.problema
    .toLowerCase()
    .includes(pesquisa.toLowerCase())&&
    (filtroPrioridade === "" || 
      denuncia.prioridade === filtroPrioridade
    )&&(filtroStatus === "" || 
      denuncia.status === filtroStatus
    )
);



  return (
    <section className="lista-denuncias">

     

      <div className="lista-topo"> 

        <div>
         

          <p>
            Últimas ocorrências registradas no sistema.
          </p>
        </div>

        <button className="btn-ver-todas" onClick={() => navigate("/admin/denuncias")}>
          Ver todas
          <FaChevronRight />
        </button>

      </div>


      {/* FILTROS */}

      <div className="filtros-denuncias">

        <div className="campo-pesquisa">

          <FaSearch />

          <input
            type="text"
            placeholder="Pesquisar denúncia..."
            value={pesquisa}
            onChange={(e)=> setPesquisa(e.target.value)}
          />

        </div>


        <select value={filtroPrioridade}
        onChange={(e)=> setFiltroPrioridade(e.target.value)}
        >
          <option value="">Prioridade</option>
          <option value="Alta">Alta</option>
          <option value="Média">Média</option>
          <option value="Baixa">Baixa</option>
        </select>


        <select 
         value={filtroStatus}
         onChange={(e) => setFiltroStatus(e.target.value)}
        >
       <option value="">Status</option>
  <option value="Aberta">Aberta</option>
  <option value="Em análise">Em análise</option>
  <option value="Resolvida">Resolvida</option>
        </select>

      </div>


      {/* TABELA */}

      <div className="tabela-denuncias">

        <div className="tabela-cabecalho">

          <span>ID</span>
          <span>PROBLEMA</span>
          <span>LOCALIZAÇÃO</span>
          <span>PRIORIDADE</span>
          <span>STATUS</span>
          <span></span>

        </div>


       {denunciasFiltradas.map((denuncia)=> (

       <div
  className="denuncia-linha"
  key={denuncia.id}
  role="button"
  tabIndex={0}
  onClick={() => setDenunciaSelecionada(denuncia)}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      setDenunciaSelecionada(denuncia);
    }
  }}
>
         

            <span className="denuncia-id">
              #{denuncia.id}
            </span>


            <div className="problema">

              <strong>
                {denuncia.problema}
              </strong>

              {denuncia.ia && (

                <small>
                  <FaRobot />
                  IA analisada
                </small>

              )}

            </div>


        

            <div className="localizacao">

              <FaMapMarkerAlt />

              <div>

                <strong>
                  {denuncia.bairro}
                </strong>

                <span>
                  {denuncia.cidade}
                </span>

              </div>

            </div>

            <span
              className={`prioridade ${denuncia.prioridade
                .toLowerCase()
                .replace("é", "e")}`}
            >
              {denuncia.prioridade}
            </span>

            <span
              className={`status ${denuncia.status
                .toLowerCase()
                .replace(" ", "-")}`}
            >
              {denuncia.status}
            </span>

            <FaChevronRight className="seta-denuncia" />

          </div>

        ))}

      </div>

      {erroCarga && <p className="denuncia-vazio">{erroCarga}</p>}
      {denunciaSelecionada && (

        <div
          className="relatorio-overlay"
          onClick={() => setDenunciaSelecionada(null)}
        >

          <div
            className="relatorio-denuncia"
            onClick={(e) => e.stopPropagation()}
          >


            {/* BOTÃO FECHAR */}

            <button
              className="fechar-relatorio"
              onClick={() => setDenunciaSelecionada(null)}
            >
              <FaTimes />
            </button>


            {/* CABEÇALHO DO RELATÓRIO */}

            <div className="relatorio-header">

              <div>

                <span>
                  DENÚNCIA #{denunciaSelecionada.id}
                </span>

                <h2>
                  {denunciaSelecionada.problema}
                </h2>

                <p>
                  Registrada em {denunciaSelecionada.data} às{" "}
                  {denunciaSelecionada.hora}
                </p>

              </div>


              <span
                className={`status ${denunciaSelecionada.status
                  .toLowerCase()
                  .replace(" ", "-")}`}
              >
                {denunciaSelecionada.status}
              </span>

            </div>


            {/* INFORMAÇÕES */}

            <div className="relatorio-grid">


              {/* DESCRIÇÃO */}

              <div className="relatorio-card">

                <h3>
                  Descrição
                </h3>

                <p>
                  {denunciaSelecionada.descricao}
                </p>


                <div className="dados-local">


                  <div>

                    <span>
                      Cidade
                    </span>

                    <strong>
                      {denunciaSelecionada.cidade}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Bairro
                    </span>

                    <strong>
                      {denunciaSelecionada.bairro}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Rua
                    </span>

                    <strong>
                      {denunciaSelecionada.rua}
                    </strong>

                  </div>


                </div>

              </div>


              {/* LOCALIZAÇÃO */}

              <div className="mapa-relatorio">

                <FaMapMarkerAlt />

                <strong>
                  Localização
                </strong>

                <span>
                  {denunciaSelecionada.rua}
                </span>

                <small>
                  {denunciaSelecionada.bairro},{" "}
                  {denunciaSelecionada.cidade}
                </small>

              </div>

            </div>


            {/* ANÁLISE DA IA */}

            <div className="relatorio-ia">


              <div className="ia-titulo">

                <div className="ia-icone">
                  <FaRobot />
                </div>


                <div>

                  <h3>
                    Análise da Inteligência Artificial
                  </h3>

                  <span>
                    Gemini
                  </span>

                </div>

              </div>


              <div className="ia-conteudo">
                <div>
                  <h4>
                    Análise
                  </h4>
                  <p>
                    {denunciaSelecionada.analise ||
                      "Esta denúncia ainda não foi analisada pela inteligência artificial."}
                  </p>
                </div>
              </div>

            </div>


          </div>

        </div>

      )}

    </section>
  );
}

export default ListadeDenuncias;