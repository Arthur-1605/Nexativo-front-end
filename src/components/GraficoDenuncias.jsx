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

  const categorias = [
    { categoria: "Vazamento", quantidade: 35 },
    { categoria: "Buraco na via", quantidade: 25 },
    { categoria: "Iluminação", quantidade: 15 },
    { categoria: "Lixo", quantidade: 15 },
    { categoria: "Outros", quantidade: 10 }
  ];

  const evolucao = [
    { dia: "18/09", denuncias: 12 },
    { dia: "19/09", denuncias: 18 },
    { dia: "20/09", denuncias: 14 },
    { dia: "21/09", denuncias: 22 },
    { dia: "22/09", denuncias: 19 },
    { dia: "23/09", denuncias: 25 }
  ];

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