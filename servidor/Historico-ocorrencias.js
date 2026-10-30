import { db } from "./db.js";



export async function listarHistorico(idOcorrencia) {

    const [historico] = await db.execute(
        `SELECT
            h.*,
            u.nome AS usuario_nome
        FROM historico_ocorrencias h

        INNER JOIN usuarios u
            ON h.id_usuario = u.id_usuario

        WHERE h.id_ocorrencia = ?

        ORDER BY h.data_alteracao DESC`,
        [idOcorrencia]
    );

    return historico;
}


export async function criarHistorico(dados) {

    const [resultado] = await db.execute(
        `INSERT INTO historico_ocorrencias
        (
            id_ocorrencia,
            id_usuario,
            status_anterior,
            novo_status,
            observacao
        )
        VALUES (?, ?, ?, ?, ?)`,
        [
            dados.id_ocorrencia,
            dados.id_usuario,
            dados.status_anterior || null,
            dados.novo_status,
            dados.observacao || null
        ]
    );

    return {
        id_historico: resultado.insertId
    };
}