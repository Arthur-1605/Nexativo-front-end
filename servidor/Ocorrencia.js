import { db } from "./db.js";


export async function listarOcorrencias() {

    const [ocorrencias] = await db.execute(
        `SELECT
            o.*,
            u.nome AS usuario_nome,
            c.nome AS categoria_nome
        FROM ocorrencias o

        LEFT JOIN usuarios u
            ON o.id_usuario = u.id_usuario

        INNER JOIN categorias c
            ON o.id_categoria = c.id_categoria

        ORDER BY o.data_registro DESC`
    );

    return ocorrencias;
}



export async function buscarOcorrenciaPorId(id) {

    const [ocorrencias] = await db.execute(
        `SELECT
            o.*,
            u.nome AS usuario_nome,
            c.nome AS categoria_nome
        FROM ocorrencias o

        LEFT JOIN usuarios u
            ON o.id_usuario = u.id_usuario

        INNER JOIN categorias c
            ON o.id_categoria = c.id_categoria

        WHERE o.id_ocorrencia = ?`,
        [id]
    );

    return ocorrencias[0] || null;
}



export async function criarOcorrencia(dados) {

    const [resultado] = await db.execute(
        `INSERT INTO ocorrencias
        (
            id_usuario,
            id_categoria,
            titulo,
            descricao,
            prioridade,
            status,
            observacao_ia
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            dados.id_usuario,
            dados.id_categoria,
            dados.titulo,
            dados.descricao,
            dados.prioridade,
            dados.status || "Aberta",
            dados.observacao_ia || null
        ]
    );

    return {
        id_ocorrencia: resultado.insertId
    };
}



export async function atualizarOcorrencia(id, dados) {

    const atual = await buscarOcorrenciaPorId(id);

    if (!atual) {
        return null;
    }

    // Campos que não vierem na requisição mantêm o valor atual
    const titulo = dados.titulo ?? atual.titulo;
    const descricao = dados.descricao ?? atual.descricao;
    const prioridade = dados.prioridade ?? atual.prioridade;
    const status = dados.status ?? atual.status;
    const observacao_ia = dados.observacao_ia ?? atual.observacao_ia ?? null;

    const [resultado] = await db.execute(
        `UPDATE ocorrencias
        SET
            titulo = ?,
            descricao = ?,
            prioridade = ?,
            status = ?,
            observacao_ia = ?
        WHERE id_ocorrencia = ?`,
        [titulo, descricao, prioridade, status, observacao_ia, id]
    );

    return resultado;
}



export async function excluirOcorrencia(id) {

    const [resultado] = await db.execute(
        `DELETE FROM ocorrencias
         WHERE id_ocorrencia = ?`,
        [id]
    );

    return resultado;
}