 
import { useMemo, useState } from "react";
import { FaDownload, FaChartBar, FaFileAlt, FaFilePdf } from "react-icons/fa";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "./AdminPaginas.css";
import "./Relatorios.css";
 
 
const dadosExemplo = [
  { id: 124, titulo: "Vazamento de água", categoria: "Abastecimento", status: "Aberta", data: "2026-10-18" },
  { id: 123, titulo: "Bueiro obstruído", categoria: "Drenagem", status: "Em atendimento", data: "2026-10-17" },
  { id: 122, titulo: "Poste danificado", categoria: "Iluminação", status: "Resolvida", data: "2026-10-16" },
  { id: 121, titulo: "Acúmulo de água", categoria: "Drenagem", status: "Aberta", data: "2026-10-15" },
  { id: 120, titulo: "Vazamento na rua", categoria: "Abastecimento", status: "Resolvida", data: "2026-10-12" },
  { id: 119, titulo: "Lâmpada apagada", categoria: "Iluminação", status: "Em atendimento", data: "2026-10-10" },
];
 
function Relatorios() {
  const [periodo, setPeriodo] = useState("todos");
  const [categoria, setCategoria] = useState("Todas");
 
  const dados = useMemo(() => {
    const hoje = new Date("2026-10-19T12:00:00");
    const limite = new Date(hoje);
 
    if (periodo === "7") limite.setDate(hoje.getDate() - 7);
    if (periodo === "30") limite.setDate(hoje.getDate() - 30);
 
    return dadosExemplo.filter((item) => {
      const dataItem = new Date(`${item.data}T12:00:00`);
      const dentroPeriodo = periodo === "todos" || dataItem >= limite;
      const dentroCategoria =
        categoria === "Todas" || item.categoria === categoria;
 
      return dentroPeriodo && dentroCategoria;
    });
  }, [periodo, categoria]);
 
  const total = dados.length;
  const abertas = dados.filter((item) => item.status === "Aberta").length;
  const atendimento = dados.filter(
    (item) => item.status === "Em atendimento"
  ).length;
  const resolvidas = dados.filter(
    (item) => item.status === "Resolvida"
  ).length;
 
  const categorias = ["Abastecimento", "Drenagem", "Iluminação"];
  const status = ["Aberta", "Em atendimento", "Resolvida"];
 
  function exportarCSV() {
    const cabecalho = ["ID", "Título", "Categoria", "Status", "Data"];
    const linhas = dados.map((item) => [
      item.id,
      item.titulo,
      item.categoria,
      item.status,
      item.data,
    ]);
 
    const escapar = (valor) =>
      `"${String(valor).replace(/"/g, '""')}"`;
 
    const conteudo = [cabecalho, ...linhas]
      .map((linha) => linha.map(escapar).join(";"))
      .join("\r\n");
 
    const arquivo = new Blob(
      ["\uFEFF" + conteudo],
      { type: "text/csv;charset=utf-8;" }
    );
 
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");
    link.href = url;
    link.download = "relatorio-denuncias.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
 
  return (
    <div className="admin">
      <Sidebar />
 
      <main className="admin-content">
        <Header />
 
        <section className="relatorios-pagina">
          <div className="relatorios-cabecalho">
            <div>
              <span className="relatorios-etiqueta">
                <FaChartBar /> ANÁLISE DE DADOS
              </span>
              <h1>Relatórios</h1>
              <p>
                Acompanhe as ocorrências e visualize os resultados
                da gestão municipal.
              </p>
            </div>
 
           <div className="relatorios-acoes">
  <button
    className="relatorios-exportar relatorios-pdf"
    type="button"
    onClick={() => window.print()}
  >
    <FaFilePdf /> Exportar PDF
  </button>
 
  <button
    className="relatorios-exportar"
    type="button"
    onClick={exportarCSV}
  >
    <FaDownload /> Exportar CSV
  </button>
</div>
          </div>
 
          <div className="relatorios-filtros">
            <label>
              Período
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
              >
                <option value="todos">Todo o período demonstrativo</option>
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
              </select>
            </label>
 
            <label>
              Categoria
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="Todas">Todas as categorias</option>
                {categorias.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
 
          <div className="relatorios-indicadores">
            <article className="relatorio-card">
              <span>Total de ocorrências</span>
              <strong>{total}</strong>
              <small>Registros no filtro atual</small>
            </article>
 
            <article className="relatorio-card">
              <span>Abertas</span>
              <strong>{abertas}</strong>
              <small>Aguardando atendimento</small>
            </article>
 
            <article className="relatorio-card">
              <span>Em atendimento</span>
              <strong>{atendimento}</strong>
              <small>Em andamento</small>
            </article>
 
            <article className="relatorio-card">
              <span>Resolvidas</span>
              <strong>{resolvidas}</strong>
              <small>Marcadas como concluídas</small>
            </article>
          </div>
 
          <div className="relatorios-graficos">
            <article className="relatorio-painel">
              <h2>Ocorrências por status</h2>
              <p>Distribuição dos registros filtrados.</p>
 
              {status.map((nome) => {
                const quantidade = dados.filter(
                  (item) => item.status === nome
                ).length;
                const largura = total ? (quantidade / total) * 100 : 0;
 
                return (
                  <div className="relatorio-barra-item" key={nome}>
                    <div className="relatorio-barra-legenda">
                      <span>{nome}</span>
                      <strong>{quantidade}</strong>
                    </div>
                    <div className="relatorio-barra-fundo">
                      <div
                        className={`relatorio-barra status-${nome
                          .toLowerCase()
                          .replace(" ", "-")}`}
                        style={{ width: `${largura}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </article>
 
            <article className="relatorio-painel">
              <h2>Ocorrências por categoria</h2>
              <p>Volume de registros por tipo de problema.</p>
 
              {categorias.map((nome) => {
                const quantidade = dados.filter(
                  (item) => item.categoria === nome
                ).length;
                const largura = total ? (quantidade / total) * 100 : 0;
 
                return (
                  <div className="relatorio-barra-item" key={nome}>
                    <div className="relatorio-barra-legenda">
                      <span>{nome}</span>
                      <strong>{quantidade}</strong>
                    </div>
                    <div className="relatorio-barra-fundo">
                      <div
                        className="relatorio-barra categoria-barra"
                        style={{ width: `${largura}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </article>
          </div>
 
          <article className="relatorio-painel relatorio-tabela-painel">
            <div className="relatorio-tabela-cabecalho">
              <div>
                <h2>Detalhamento das ocorrências</h2>
                <p>Consulte os registros incluídos no relatório.</p>
              </div>
              <FaFileAlt />
            </div>
 
            <div className="relatorio-tabela-scroll">
              <table className="relatorio-tabela">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Ocorrência</th>
                    <th>Categoria</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>{item.titulo}</td>
                      <td>{item.categoria}</td>
                      <td>
                        <span className={`relatorio-status status-${item.status
                          .toLowerCase()
                          .replace(" ", "-")}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        {new Date(`${item.data}T12:00:00`).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
 
                  {dados.length === 0 && (
                    <tr>
                      <td colSpan="5" className="relatorio-sem-dados">
                        Nenhuma ocorrência encontrada para esses filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
 
            <small className="relatorio-aviso">
              Dados demonstrativos — ainda não conectados ao banco de dados.
            </small>
          </article>
        </section>
      </main>
    </div>
  );
}
 
export default Relatorios;
 
 