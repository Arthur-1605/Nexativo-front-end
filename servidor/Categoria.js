import { db } from "./db.js";

export async function listarCategorias() {
    const [categorias] = await db.execute(
        `SELECT id_categoria, nome, descricao, icone, status
         FROM categorias
         ORDER BY nome`
    );
    return categorias;
}

export async function buscarCategoriaPorId(id) {
    const [categorias] = await db.execute(
        `SELECT id_categoria, nome, descricao, icone, status
         FROM categorias
         WHERE id_categoria = ?`,
        [id]
    );
    return categorias[0] || null;
}

export async function buscarCategoriaPorNome(nome) {
    const [categorias] = await db.execute(
        `SELECT id_categoria, nome, descricao, icone, status
         FROM categorias
         WHERE nome = ?
         LIMIT 1`,
        [nome]
    );
    return categorias[0] || null;
}

export async function criarCategoria({ nome, descricao = "", icone = "📍", status = "Ativa" }) {
    const [resultado] = await db.execute(
        `INSERT INTO categorias (nome, descricao, icone, status)
         VALUES (?, ?, ?, ?)`,
        [nome, descricao, icone, status]
    );
    return buscarCategoriaPorId(resultado.insertId);
}

export async function atualizarCategoria(id, { nome, descricao, icone, status }) {
    await db.execute(
        `UPDATE categorias
         SET nome = ?, descricao = ?, icone = ?, status = ?
         WHERE id_categoria = ?`,
        [nome, descricao, icone, status, id]
    );
    return buscarCategoriaPorId(id);
}

// Quantas ocorrências usam a categoria (impede excluir categoria em uso)
export async function contarOcorrenciasDaCategoria(id) {
    const [linhas] = await db.execute(
        `SELECT COUNT(*) AS total FROM ocorrencias WHERE id_categoria = ?`,
        [id]
    );
    return Number(linhas[0].total);
}

export async function excluirCategoria(id) {
    const [resultado] = await db.execute(
        `DELETE FROM categorias WHERE id_categoria = ?`,
        [id]
    );
    return resultado.affectedRows;
}
