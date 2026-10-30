import { db } from "./db.js";

export async function listarNotasDoUsuario(idUsuario) {

    const [notas] = await db.execute(
        `SELECT id_nota, id_usuario, titulo, conteudo, tipo, data_criacao
        FROM notas
        WHERE id_usuario = ?
        ORDER BY data_criacao DESC`,
        [idUsuario]
    );

    return notas;
}

export async function criarNota(dados) {

    const [resultado] = await db.execute(
        `INSERT INTO notas (id_usuario, titulo, conteudo, tipo)
        VALUES (?, ?, ?, ?)`,
        [dados.id_usuario, dados.titulo, dados.conteudo, dados.tipo || "Manual"]
    );

    return { id_nota: resultado.insertId };
}

// Só apaga se a nota for do usuário que pediu
export async function excluirNota(id, idUsuario) {

    const [resultado] = await db.execute(
        "DELETE FROM notas WHERE id_nota = ? AND id_usuario = ?",
        [id, idUsuario]
    );

    return resultado.affectedRows;
}
