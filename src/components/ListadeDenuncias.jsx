import { useState } from "react";

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

  const denuncias = [
    {
      id: 124,
      problema: "Vazamento de água",
      descricao:
        "Foi identificado um vazamento de água próximo à residência.",
      cidade: "Criciúma",
      bairro: "Rio Maina",
      rua: "Rua Vila Isabel",
      prioridade: "Média",
      status: "Em análise",
      data: "22/09/2026",
      hora: "10:30",
      ia: true
    },
    {
      id: 123,
      problema: "Buraco na via",
      descricao:
        "Buraco localizado no meio da via, dificultando a passagem de veículos.",
      cidade: "Criciúma",
      bairro: "Centro",
      rua: "Rua João Pessoa",
      prioridade: "Alta",
      status: "Aberta",
      data: "22/09/2026",
      hora: "09:45",
      ia: false
    },
    {
      id: 122,
      problema: "Iluminação pública",
      descricao:
        "Poste de iluminação aparentemente apagado durante a noite.",
      cidade: "Criciúma",
      bairro: "Próspera",
      rua: "Rua das Palmeiras",
      prioridade: "Baixa",
      status: "Resolvida",
      data: "21/09/2026",
      hora: "18:20",
      ia: true
    }
  ];

  
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

        <button className="btn-ver-todas">
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
                    Resumo
                  </h4>

                  <p>
                    A análise da denúncia será apresentada
                    aqui após o processamento pela inteligência
                    artificial.
                  </p>

                </div>


                <div>

                  <h4>
                    Análise
                  </h4>

                  <p>
                    O Gemini irá analisar as informações
                    fornecidas pelo cidadão.
                  </p>

                </div>


                <div>

                  <h4>
                    Recomendação
                  </h4>

                  <p>
                    As recomendações geradas pela IA aparecerão
                    nesta seção.
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