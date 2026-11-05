 
import { useEffect, useMemo, useState } from "react";
import { buscarOcorrenciasCompletas } from "../../dados";
import { FaDownload, FaChartBar, FaFileAlt, FaFilePdf } from "react-icons/fa";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "./AdminPaginas.css";
import "./Relatorios.css";
 
 
// Data local no formato AAAA-MM-DD
const diaLocal = (data) => {
  if (!data) return "";
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};
 
function Relatorios() {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [erro, setErro] = useState("");
  const [periodo, setPeriodo] = useState("todos");
  const [categoria, setCategoria] = useState("Todas");

  useEffect(() => {
    buscarOcorrenciasCompletas()
      .then((lista) => {
        setOcorrencias(
          lista.map((o) => ({
            id: o.id,
            titulo: o.titulo,
            categoria: o.categoria,
            status: o.status,
            data: diaLocal(o.data),
          }))
        );
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar as ocorrências."));
  }, []);

  const categorias = useMemo(
    () => [...new Set(ocorrencias.map((o) => o.categoria))].sort(),
    [ocorrencias]
  );
 
  const dados = useMemo(() => {
    const hoje = new Date();
    const limite = new Date(hoje);
 
    if (periodo === "7") limite.setDate(hoje.getDate() - 7);
    if (periodo === "30") limite.setDate(hoje.getDate() - 30);
 
    return ocorrencias.filter((item) => {
      const dataItem = new Date(`${item.data}T12:00:00`);
      const dentroPeriodo = periodo === "todos" || dataItem >= limite;
      const dentroCategoria =
        categoria === "Todas" || item.categoria === categoria;
 
      return dentroPeriodo && dentroCategoria;
    });
  }, [ocorrencias, periodo, categoria]);
 
  const total = dados.length;
  const abertas = dados.filter((item) => item.status === "Aberta").length;
  const atendimento = dados.filter(
    (item) => item.status === "Em atendimento"
  ).length;
  const resolvidas = dados.filter(
    (item) => item.status === "Resolvida"
  ).length;
 
  const status = ["Aberta", "Em análise", "Em atendimento", "Resolvida"];
 
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
                <option value="todos">Todo o período</option>
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
              {erro || "Dados em tempo real do banco de dados."}
            </small>
          </article>
        </section>
      </main>
    </div>
  );
}
 
export default Relatorios;
 
 