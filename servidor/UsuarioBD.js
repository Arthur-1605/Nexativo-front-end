
import bcrypt from "bcrypt";
import { db } from "./db.js";

const SALT_ROUNDS = 12;

// Verifica se a senha já está criptografada com bcrypt
const ehHashBcrypt = (valor) =>
    /^\$2[aby]\$\d{2}\$/.test(valor || "");

// ======================================================
// CRIAR USUÁRIO
// ======================================================

export async function criarUsuario({
    nome,
    email,
    senha,
    cargo = "Funcionário",
    setor = "Atendimento",
    perfil = "Usuário",
}) {
    if (
        typeof nome !== "string" ||
        !nome.trim() ||
        typeof email !== "string" ||
        !email.trim() ||
        typeof senha !== "string" ||
        !senha ||
        typeof cargo !== "string" ||
        !cargo.trim() ||
        typeof setor !== "string" ||
        !setor.trim()
    ) {
        throw new Error("DADOS_USUARIO_INVALIDOS");
    }

    const nomeNormalizado = nome.trim();
    const emailNormalizado = email.trim().toLowerCase();
    const cargoNormalizado = cargo.trim();
    const setorNormalizado = setor.trim();

    if (!["Usuário", "Administrador"].includes(perfil)) {
        throw new Error("PERFIL_INVALIDO");
    }

    // Verifica se o e-mail já está cadastrado
    const [existentes] = await db.execute(
        `SELECT id_usuario
         FROM usuarios
         WHERE email = ?
         LIMIT 1`,
        [emailNormalizado]
    );

    if (existentes.length > 0) {
        throw new Error("EMAIL_JA_CADASTRADO");
    }

    // Criptografa a senha antes de salvar
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    const [resultado] = await db.execute(
        `INSERT INTO usuarios
            (nome, email, senha, cargo, setor, perfil, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Ativo')`,
        [
            nomeNormalizado,
            emailNormalizado,
            senhaHash,
            cargoNormalizado,
            setorNormalizado,
            perfil,
        ]
    );

    return buscarUsuarioPorId(resultado.insertId);
}

// ======================================================
// LOGIN
// ======================================================

export async function verificarLogin(email, senha) {
    if (
        typeof email !== "string" ||
        !email.trim() ||
        typeof senha !== "string" ||
        !senha
    ) {
        return null;
    }

    const emailNormalizado = email.trim().toLowerCase();

    const [usuarios] = await db.execute(
        `SELECT
            id_usuario,
            nome,
            email,
            senha,
            cargo,
            setor,
            perfil,
            status,
            data_cadastro
         FROM usuarios
         WHERE email = ?
         LIMIT 1`,
        [emailNormalizado]
    );

    if (usuarios.length === 0) {
        return null;
    }

    const usuario = usuarios[0];

    // Impede o login de usuários inativos
    if (usuario.status !== "Ativo") {
        return null;
    }

    let senhaCorreta = false;

    if (ehHashBcrypt(usuario.senha)) {
        // Compara a senha informada com o hash salvo
        senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha
        );
    } else {
        // Compatibilidade com senhas antigas em texto puro
        senhaCorreta = usuario.senha === senha;

        if (senhaCorreta) {
            const novoHash = await bcrypt.hash(
                senha,
                SALT_ROUNDS
            );

            await db.execute(
                `UPDATE usuarios
                 SET senha = ?
                 WHERE id_usuario = ?`,
                [novoHash, usuario.id_usuario]
            );
        }
    }

    if (!senhaCorreta) {
        return null;
    }

    // Nunca retorna a senha ao frontend
    const {
        senha: senhaOculta,
        ...usuarioPublico
    } = usuario;

    return usuarioPublico;
}

// ======================================================
// LISTAR USUÁRIOS
// ======================================================

export async function listarUsuarios() {
    const [usuarios] = await db.execute(
        `SELECT
            id_usuario,
            nome,
            email,
            cargo,
            setor,
            perfil,
            status,
            data_cadastro
         FROM usuarios
         ORDER BY id_usuario DESC`
    );

    return usuarios;
}

// ======================================================
// BUSCAR USUÁRIO POR ID
// ======================================================

export async function buscarUsuarioPorId(id) {
    const idNormalizado = Number(id);

    if (
        !Number.isInteger(idNormalizado) ||
        idNormalizado <= 0
    ) {
        return null;
    }

    const [usuarios] = await db.execute(
        `SELECT
            id_usuario,
            nome,
            email,
            cargo,
            setor,
            perfil,
            status,
            data_cadastro
         FROM usuarios
         WHERE id_usuario = ?
         LIMIT 1`,
        [idNormalizado]
    );

    return usuarios[0] || null;
}

// ======================================================
// ATUALIZAR USUÁRIO
// ======================================================

export async function atualizarUsuario(
    id,
    { nome, email, cargo, setor, perfil }
) {
    const idNormalizado = Number(id);

    if (
        !Number.isInteger(idNormalizado) ||
        idNormalizado <= 0 ||
        typeof nome !== "string" ||
        !nome.trim() ||
        typeof email !== "string" ||
        !email.trim() ||
        typeof cargo !== "string" ||
        !cargo.trim() ||
        typeof setor !== "string" ||
        !setor.trim() ||
        !["Usuário", "Administrador"].includes(perfil)
    ) {
        throw new Error("DADOS_USUARIO_INVALIDOS");
    }

    const emailNormalizado = email.trim().toLowerCase();

    // Verifica se outro usuário já utiliza o e-mail
    const [existentes] = await db.execute(
        `SELECT id_usuario
         FROM usuarios
         WHERE email = ?
           AND id_usuario <> ?
         LIMIT 1`,
        [emailNormalizado, idNormalizado]
    );

    if (existentes.length > 0) {
        throw new Error("EMAIL_JA_CADASTRADO");
    }

    const [resultado] = await db.execute(
        `UPDATE usuarios
         SET nome = ?,
             email = ?,
             cargo = ?,
             setor = ?,
             perfil = ?
         WHERE id_usuario = ?`,
        [
            nome.trim(),
            emailNormalizado,
            cargo.trim(),
            setor.trim(),
            perfil,
            idNormalizado,
        ]
    );

    if (resultado.affectedRows === 0) {
        const existente = await buscarUsuarioPorId(
            idNormalizado
        );

        if (!existente) {
            return null;
        }
    }

    return buscarUsuarioPorId(idNormalizado);
}

// ======================================================
// ATIVAR OU DESATIVAR USUÁRIO
// ======================================================

export async function alterarStatusUsuario(id, status) {
    const idNormalizado = Number(id);

    if (
        !Number.isInteger(idNormalizado) ||
        idNormalizado <= 0
    ) {
        throw new Error("ID_USUARIO_INVALIDO");
    }

    if (!["Ativo", "Inativo"].includes(status)) {
        throw new Error("STATUS_INVALIDO");
    }

    const [resultado] = await db.execute(
        `UPDATE usuarios
         SET status = ?
         WHERE id_usuario = ?`,
        [status, idNormalizado]
    );

    if (resultado.affectedRows === 0) {
        const existente = await buscarUsuarioPorId(
            idNormalizado
        );

        if (!existente) {
            return null;
        }
    }

    return buscarUsuarioPorId(idNormalizado);
}
