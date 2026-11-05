import { db } from "./db.js";

// Consulta base: traz a ocorrência já com categoria, usuário e localização
const SELECT_OCORRENCIAS = `
    SELECT
        o.id_ocorrencia,
        o.id_ocorrencia AS id,
        o.id_usuario,
        o.id_categoria,
        o.titulo,
        o.descricao,
        o.prioridade,
        o.status,
        o.responsavel,
        o.prazo,
        o.orcamento_estimado,
        o.orcamento_aprovado,
        o.orcamento_gasto,
        o.data_registro,
        o.data_resolucao,
        o.observacao_ia,
        u.nome AS usuario_nome,
        c.nome AS categoria_nome,
        c.icone AS categoria_icone,
        l.endereco,
        l.bairro,
        l.cidade,
        l.latitude,
        l.longitude
    FROM ocorrencias o
    LEFT JOIN usuarios u ON u.id_usuario = o.id_usuario
    INNER JOIN categorias c ON c.id_categoria = o.id_categoria
    LEFT JOIN localizacoes l ON l.id_localizacao = (
        SELECT MIN(l2.id_localizacao) FROM localizacoes l2
        WHERE l2.id_ocorrencia = o.id_ocorrencia
    )
`;

export async function listarOcorrencias() {
    const [ocorrencias] = await db.execute(
        `${SELECT_OCORRENCIAS} ORDER BY o.data_registro DESC, o.id_ocorrencia DESC`
    );
    return ocorrencias;
}

export async function buscarOcorrenciaPorId(id) {
    const [ocorrencias] = await db.execute(
        `${SELECT_OCORRENCIAS} WHERE o.id_ocorrencia = ?`,
        [id]
    );
    return ocorrencias[0] || null;
}

export async function criarOcorrencia(dados) {
    const [resultado] = await db.execute(
        `INSERT INTO ocorrencias
            (id_usuario, id_categoria, titulo, descricao, prioridade, status,
             responsavel, prazo, observacao_ia)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            dados.id_usuario ?? null,
            dados.id_categoria,
            dados.titulo,
            dados.descricao,
            dados.prioridade,
            dados.status || "Aberta",
            dados.responsavel || null,
            dados.prazo || null,
            dados.observacao_ia || null
        ]
    );

    return { id_ocorrencia: resultado.insertId };
}

// Atualiza apenas os campos enviados; os demais mantêm o valor atual
export async function atualizarOcorrencia(id, dados) {
    const atual = await buscarOcorrenciaPorId(id);

    if (!atual) {
        return null;
    }

    const campos = {
        titulo: dados.titulo ?? atual.titulo,
        descricao: dados.descricao ?? atual.descricao,
        prioridade: dados.prioridade ?? atual.prioridade,
        status: dados.status ?? atual.status,
        responsavel: dados.responsavel !== undefined ? (dados.responsavel || null) : atual.responsavel,
        prazo: dados.prazo !== undefined ? (dados.prazo || null) : atual.prazo,
        orcamento_estimado: dados.orcamento_estimado ?? atual.orcamento_estimado,
        orcamento_aprovado: dados.orcamento_aprovado ?? atual.orcamento_aprovado,
        orcamento_gasto: dados.orcamento_gasto ?? atual.orcamento_gasto,
        observacao_ia: dados.observacao_ia ?? atual.observacao_ia ?? null
    };

    // Ao resolver, registra a data de resolução; ao reabrir, limpa
    let dataResolucao = atual.data_resolucao;
    if (campos.status === "Resolvida" && atual.status !== "Resolvida") {
        dataResolucao = new Date();
    } else if (campos.status !== "Resolvida") {
        dataResolucao = null;
    }

    await db.execute(
        `UPDATE ocorrencias
         SET titulo = ?, descricao = ?, prioridade = ?, status = ?,
             responsavel = ?, prazo = ?,
             orcamento_estimado = ?, orcamento_aprovado = ?, orcamento_gasto = ?,
             observacao_ia = ?, data_resolucao = ?
         WHERE id_ocorrencia = ?`,
        [
            campos.titulo, campos.descricao, campos.prioridade, campos.status,
            campos.responsavel, campos.prazo,
            campos.orcamento_estimado, campos.orcamento_aprovado, campos.orcamento_gasto,
            campos.observacao_ia, dataResolucao, id
        ]
    );

    return buscarOcorrenciaPorId(id);
}

export async function excluirOcorrencia(id) {
    const [resultado] = await db.execute(
        `DELETE FROM ocorrencias WHERE id_ocorrencia = ?`,
        [id]
    );
    return resultado.affectedRows;
}
