import { db } from "./db.js";

// ---------- Observações ----------

export async function listarObservacoes(idOcorrencia) {
    const [linhas] = await db.execute(
        `SELECT o.id_observacao, o.id_ocorrencia, o.texto, o.data_criacao,
                u.nome AS usuario_nome
         FROM observacoes_ocorrencia o
         LEFT JOIN usuarios u ON u.id_usuario = o.id_usuario
         WHERE o.id_ocorrencia = ?
         ORDER BY o.data_criacao DESC, o.id_observacao DESC`,
        [idOcorrencia]
    );
    return linhas;
}

export async function criarObservacao({ id_ocorrencia, id_usuario, texto }) {
    const [resultado] = await db.execute(
        `INSERT INTO observacoes_ocorrencia (id_ocorrencia, id_usuario, texto)
         VALUES (?, ?, ?)`,
        [id_ocorrencia, id_usuario ?? null, texto]
    );
    return { id_observacao: resultado.insertId };
}

// ---------- Tarefas (checklist de execução) ----------

export async function listarTarefas(idOcorrencia) {
    const [linhas] = await db.execute(
        `SELECT id_tarefa, id_ocorrencia, titulo, concluida, data_criacao
         FROM tarefas_ocorrencia
         WHERE id_ocorrencia = ?
         ORDER BY id_tarefa`,
        [idOcorrencia]
    );
    return linhas.map((t) => ({ ...t, concluida: Boolean(t.concluida) }));
}

export async function criarTarefa({ id_ocorrencia, titulo }) {
    const [resultado] = await db.execute(
        `INSERT INTO tarefas_ocorrencia (id_ocorrencia, titulo) VALUES (?, ?)`,
        [id_ocorrencia, titulo]
    );
    return { id_tarefa: resultado.insertId };
}

export async function atualizarTarefa(id, { titulo, concluida }) {
    const [atual] = await db.execute(
        `SELECT titulo, concluida FROM tarefas_ocorrencia WHERE id_tarefa = ?`,
        [id]
    );
    if (!atual.length) return 0;

    const [resultado] = await db.execute(
        `UPDATE tarefas_ocorrencia SET titulo = ?, concluida = ? WHERE id_tarefa = ?`,
        [
            titulo ?? atual[0].titulo,
            concluida === undefined ? atual[0].concluida : Number(Boolean(concluida)),
            id
        ]
    );
    return resultado.affectedRows;
}

export async function excluirTarefa(id) {
    const [resultado] = await db.execute(
        `DELETE FROM tarefas_ocorrencia WHERE id_tarefa = ?`,
        [id]
    );
    return resultado.affectedRows;
}
