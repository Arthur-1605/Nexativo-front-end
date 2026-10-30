import { db } from "./db.js";



export async function listarCategorias() {

    const [categorias] = await db.execute(
        "SELECT * FROM categorias"
    );

    return categorias;
}




export async function buscarCategoriaPorId(id) {

    const [categorias] = await db.execute(
        `SELECT *
         FROM categorias
         WHERE id_categoria = ?`,
        [id]
    );

    return categorias[0] || null;
}




export async function criarCategoria(nome, descricao) {

    const [resultado] = await db.execute(
        `INSERT INTO categorias
        (nome, descricao)
        VALUES (?, ?)`,
        [nome, descricao]
    );

    return {
        id_categoria: resultado.insertId,
        nome,
        descricao
    };
}