import { db } from "./db.js";

export async function listarAnexos(idOcorrencia) {

    const [anexos] = await db.execute(
        `SELECT *
         FROM anexos
         WHERE id_ocorrencia = ?
         ORDER BY data_upload DESC`,
        [idOcorrencia]
    );

    return anexos;
}



export async function criarAnexo(dados) {

    const [resultado] = await db.execute(
        `INSERT INTO anexos
        (
            id_ocorrencia,
            nome_arquivo,
            caminho_arquivo
        )
        VALUES (?, ?, ?)`,
        [
            dados.id_ocorrencia,
            dados.nome_arquivo,
            dados.caminho_arquivo
        ]
    );

    return {
        id_anexo: resultado.insertId
    };
}