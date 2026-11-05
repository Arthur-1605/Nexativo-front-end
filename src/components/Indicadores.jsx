
import { useEffect, useState } from "react";
import { buscarEstatisticas } from "../dados";

import {
  FaFileAlt,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle
} from "react-icons/fa";

import "./Indicadores.css";

function NumeroAnimado({ valor, duracao = 1000 }) {
  const [numero, setNumero] = useState(0);

  useEffect(() => {
    const destino = Number(valor);

    if (!Number.isFinite(destino)) {
      setNumero(0);
      return;
    }

    let inicio = null;
    let frame;

    function animar(timestamp) {
      if (inicio === null) inicio = timestamp;

      const progresso = Math.min((timestamp - inicio) / duracao, 1);

      // Suaviza o movimento da contagem
      const suavizado = 1 - Math.pow(1 - progresso, 3);

      setNumero(Math.round(destino * suavizado));

      if (progresso < 1) {
        frame = requestAnimationFrame(animar);
      }
    }

    frame = requestAnimationFrame(animar);

    return () => cancelAnimationFrame(frame);
  }, [valor, duracao]);

  return <>{numero}</>;
}

// Compara os últimos 7 dias com os 7 anteriores
function calcularCrescimento(porDia = []) {
  const ultimos = porDia.slice(-7).reduce((t, d) => t + d.quantidade, 0);
  const anteriores = porDia.slice(-14, -7).reduce((t, d) => t + d.quantidade, 0);

  if (!anteriores) return "";

  const variacao = Math.round(((ultimos - anteriores) / anteriores) * 100);
  if (variacao === 0) return "";

  return `${variacao > 0 ? "↑" : "↓"} ${Math.abs(variacao)}%`;
}

function Indicadores() {
  const [estatisticas, setEstatisticas] = useState(null);

  useEffect(() => {
    buscarEstatisticas()
      .then(setEstatisticas)
      .catch(() => setEstatisticas(null));
  }, []);

  const totais = estatisticas?.totais;
  const crescimento = calcularCrescimento(estatisticas?.porDia);

  const indicadores = [
    {
      titulo: "Total de denúncias",
      valor: totais?.total ?? 0,
      descricao: crescimento ? "em relação à semana passada" : "registradas no total",
      crescimento,
      classe: "roxo",
      icone: <FaFileAlt />
    },
    {
      titulo: "Em análise",
      valor: totais?.emAnalise ?? 0,
      descricao: "Aguardando revisão",
      crescimento: "",
      classe: "azul",
      icone: <FaClock />
    },
    {
      titulo: "Alta gravidade",
      valor: totais?.altaGravidade ?? 0,
      descricao: "Requer atenção urgente",
      crescimento: "",
      classe: "vermelho",
      icone: <FaExclamationTriangle />
    },
    {
      titulo: "Resolvidas",
      valor: totais?.resolvidas ?? 0,
      descricao: "Problemas solucionados",
      crescimento: "",
      classe: "verde",
      icone: <FaCheckCircle />
    }
  ];

  return (
    <section className="indicadores">
      {indicadores.map((indicador) => (
        <div
          className={`indicador-card ${indicador.classe}`}
          key={indicador.titulo}
        >
          <div className="indicador-info">
            <span className="indicador-titulo">
              {indicador.titulo}
            </span>

            <strong className="indicador-valor">
              <NumeroAnimado valor={indicador.valor} />
            </strong>

            <span className="indicador-descricao">
              {indicador.crescimento && (
                <b>{indicador.crescimento}</b>
              )}

              {indicador.descricao}
            </span>
          </div>

          <div className="indicador-icone">
            {indicador.icone}
          </div>
        </div>
      ))}
    </section>
  );
}

export default Indicadores;
