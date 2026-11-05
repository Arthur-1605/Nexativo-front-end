import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

import { useEffect, useState } from "react";
import { buscarEstatisticas } from "../dados";
import "./GraficoDenuncias.css";

function GraficoDenuncias() {
  const [temaClaro, setTemaClaro] = useState(
    document.body.classList.contains("tema-claro")
  );

  useEffect(() => {
    const observarTema = () => {
      setTemaClaro(
        document.body.classList.contains("tema-claro")
      );
    };

    const observer = new MutationObserver(observarTema);

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"]
    });

    return () => observer.disconnect();
  }, []);

  const corPrincipal = temaClaro ? "#198754" : "#8b5cf6";
  const corGrade = temaClaro ? "#d8e6db" : "#26334d";
  const corTexto = temaClaro ? "#718174" : "#71809a";
  const corTooltip = temaClaro ? "#ffffff" : "#111a2e";
  const corBordaTooltip = temaClaro ? "#cfe2d4" : "#293650";
  const corTextoTooltip = temaClaro ? "#24352b" : "#ffffff";

  const [estatisticas, setEstatisticas] = useState(null);

  useEffect(() => {
    buscarEstatisticas()
      .then(setEstatisticas)
      .catch(() => setEstatisticas(null));
  }, []);

  // Categorias reais do banco (só as que têm ocorrências, ordenadas por volume)
  const categorias = (estatisticas?.porCategoria ?? []).filter(
    (c) => c.quantidade > 0
  );

  // Últimos 7 dias, no formato dd/mm
  const evolucao = (estatisticas?.porDia ?? []).slice(-7).map((d) => ({
    dia: d.dia.slice(8, 10) + "/" + d.dia.slice(5, 7),
    denuncias: d.quantidade
  }));

  const estiloTooltip = {
    background: corTooltip,
    border: `1px solid ${corBordaTooltip}`,
    borderRadius: "8px",
    color: corTextoTooltip
  };

  return (
    <section className="graficos-dashboard">

      {/* GRÁFICO DE CATEGORIAS */}
      <div className="grafico-card">
        <div className="grafico-topo">
          <div>
            <h2>Denúncias por categoria</h2>
            <p>Distribuição das ocorrências registradas</p>
          </div>
        </div>

        <div className="grafico-area">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categorias}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={corGrade}
                vertical={false}
              />

              <XAxis
                dataKey="categoria"
                stroke={corTexto}
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke={corTexto}
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip contentStyle={estiloTooltip} />

              <Bar
                dataKey="quantidade"
                fill={corPrincipal}
                radius={[5, 5, 0, 0]}
                barSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO DE EVOLUÇÃO */}
      <div className="grafico-card">
        <div className="grafico-topo">
          <div>
            <h2>Evolução das denúncias</h2>
            <p>Quantidade de ocorrências registradas</p>
          </div>
        </div>

        <div className="grafico-area">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolucao}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={corGrade}
                vertical={false}
              />

              <XAxis
                dataKey="dia"
                stroke={corTexto}
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke={corTexto}
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip contentStyle={estiloTooltip} />

              <Line
                type="monotone"
                dataKey="denuncias"
                stroke={corPrincipal}
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: corPrincipal
                }}
                activeDot={{
                  r: 6,
                  fill: corPrincipal
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </section>
  );
}

export default GraficoDenuncias;