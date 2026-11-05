import { db } from "./db.js";

// Números do painel, calculados diretamente no banco
export async function obterEstatisticas() {
    const [[totais]] = await db.execute(
        `SELECT
            COUNT(*) AS total,
            SUM(status = 'Aberta') AS abertas,
            SUM(status = 'Em análise') AS em_analise,
            SUM(status = 'Em atendimento') AS em_atendimento,
            SUM(status = 'Resolvida') AS resolvidas,
            SUM(prioridade = 'Alta' AND status <> 'Resolvida') AS alta_gravidade
         FROM ocorrencias`
    );

    const [porCategoria] = await db.execute(
        `SELECT c.nome AS categoria, COUNT(o.id_ocorrencia) AS quantidade
         FROM categorias c
         LEFT JOIN ocorrencias o ON o.id_categoria = c.id_categoria
         GROUP BY c.id_categoria, c.nome
         ORDER BY quantidade DESC, c.nome`
    );

    // Denúncias por dia nos últimos 30 dias (dias sem registro aparecem com 0)
    const [porDia] = await db.execute(
        `SELECT DATE(data_registro) AS dia, COUNT(*) AS quantidade
         FROM ocorrencias
         WHERE data_registro >= CURDATE() - INTERVAL 29 DAY
         GROUP BY DATE(data_registro)`
    );

    const mapaDias = new Map(
        porDia.map((l) => [
            new Date(l.dia).toISOString().slice(0, 10),
            Number(l.quantidade)
        ])
    );

    const dias = [];
    const hoje = new Date();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(hoje);
        d.setHours(12, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const chave = d.toISOString().slice(0, 10);
        dias.push({ dia: chave, quantidade: mapaDias.get(chave) || 0 });
    }

    return {
        totais: {
            total: Number(totais.total),
            abertas: Number(totais.abertas || 0),
            emAnalise: Number(totais.em_analise || 0),
            emAtendimento: Number(totais.em_atendimento || 0),
            resolvidas: Number(totais.resolvidas || 0),
            altaGravidade: Number(totais.alta_gravidade || 0)
        },
        porCategoria: porCategoria.map((c) => ({
            categoria: c.categoria,
            quantidade: Number(c.quantidade)
        })),
        porDia: dias
    };
}
