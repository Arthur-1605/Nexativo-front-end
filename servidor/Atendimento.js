import { db } from "./db.js";


export async function listarAtendimentos(idOcorrencia) {

    const [atendimentos] = await db.execute(
        `SELECT
            a.*,
            e.nome AS equipe_nome,
            e.especialidade
        FROM atendimentos a

        INNER JOIN equipes e
            ON a.id_equipe = e.id_equipe

        WHERE a.id_ocorrencia = ?`,
        [idOcorrencia]
    );

    return atendimentos;
}



export async function criarAtendimento(dados) {

    const [equipe] = await db.execute(
        "SELECT nome FROM equipes WHERE id_equipe = ?",
        [dados.id_equipe]
    );

    if (!equipe.length) {
        throw new Error("EQUIPE_INEXISTENTE");
    }

    await db.execute(
        "UPDATE ocorrencias SET responsavel = ? WHERE id_ocorrencia = ?",
        [equipe[0].nome, dados.id_ocorrencia]
    );

    const [resultado] = await db.execute(
        `INSERT INTO atendimentos
        (
            id_ocorrencia,
            id_equipe,
            observacao
        )
        VALUES (?, ?, ?)`,
        [
            dados.id_ocorrencia,
            dados.id_equipe,
            dados.observacao || null
        ]
    );

    return {
        id_atendimento: resultado.insertId
    };
}

export async function listarEquipes() {

    const [equipes] = await db.execute(
        "SELECT id_equipe, nome, especialidade FROM equipes ORDER BY nome"
    );

    return equipes;
}
