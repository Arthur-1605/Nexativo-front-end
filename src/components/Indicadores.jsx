
import { useEffect, useState } from "react";

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

function Indicadores() {
  const indicadores = [
    {
      titulo: "Total de denúncias",
      valor: 124,
      descricao: "em relação à semana passada",
      crescimento: "↑ 12%",
      classe: "roxo",
      icone: <FaFileAlt />
    },
    {
      titulo: "Em análise",
      valor: 32,
      descricao: "Aguardando revisão",
      crescimento: "",
      classe: "azul",
      icone: <FaClock />
    },
    {
      titulo: "Alta gravidade",
      valor: 8,
      descricao: "Requer atenção urgente",
      crescimento: "",
      classe: "vermelho",
      icone: <FaExclamationTriangle />
    },
    {
      titulo: "Resolvidas",
      valor: 84,
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
