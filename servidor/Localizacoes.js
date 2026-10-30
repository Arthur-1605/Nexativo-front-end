import { db } from "./db.js";



export async function listarLocalizacoes() {

    const [localizacoes] = await db.execute(
        `SELECT *
         FROM localizacoes`
    );

    return localizacoes;
}



export async function buscarLocalizacao(idOcorrencia) {

    const [localizacoes] = await db.execute(
        `SELECT *
         FROM localizacoes
         WHERE id_ocorrencia = ?`,
        [idOcorrencia]
    );

    return localizacoes[0] || null;
}



export async function criarLocalizacao(dados) {

    const [resultado] = await db.execute(
        `INSERT INTO localizacoes
        (
            id_ocorrencia,
            endereco,
            bairro,
            cidade,
            latitude,
            longitude
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            dados.id_ocorrencia,
            dados.endereco,
            dados.bairro,
            dados.cidade,
            dados.latitude || null,
            dados.longitude || null
        ]
    );

    return {
        id_localizacao: resultado.insertId
    };
}