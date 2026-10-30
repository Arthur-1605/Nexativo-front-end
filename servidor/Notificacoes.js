import { db } from "./db.js";



export async function listarNotificacoes(idUsuario) {

    const [notificacoes] = await db.execute(
        `SELECT *
         FROM notificacoes
         WHERE id_usuario = ?
         ORDER BY data_notificacao DESC`,
        [idUsuario]
    );

    return notificacoes;
}



export async function criarNotificacao(dados) {

    const [resultado] = await db.execute(
        `INSERT INTO notificacoes
        (
            id_usuario,
            id_ocorrencia,
            mensagem
        )
        VALUES (?, ?, ?)`,
        [
            dados.id_usuario,
            dados.id_ocorrencia,
            dados.mensagem
        ]
    );

    return {
        id_notificacao: resultado.insertId
    };
}



export async function marcarComoLida(id) {

    await db.execute(
        `UPDATE notificacoes
         SET lida = 1
         WHERE id_notificacao = ?`,
        [id]
    );

}