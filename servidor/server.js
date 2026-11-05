import { db } from "./db.js";
import { createServer } from "node:http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import jwt from "jsonwebtoken";

import {
    listarNotasDoUsuario,
    criarNota as criarNotaBD,
    excluirNota as excluirNotaBD
} from "./Notas.js";

import {
    criarUsuario,
    verificarLogin,
    listarUsuarios,
    buscarUsuarioPorId,
    atualizarUsuario,
    alterarStatusUsuario,
    atualizarPerfilProprio,
    alterarSenhaProprio,
    obterPreferencias
} from "./UsuarioBD.js";

import {
    listarCategorias,
    buscarCategoriaPorId,
    buscarCategoriaPorNome,
    criarCategoria,
    atualizarCategoria,
    contarOcorrenciasDaCategoria,
    excluirCategoria
} from "./Categoria.js";

import {
    listarOcorrencias,
    buscarOcorrenciaPorId,
    criarOcorrencia,
    atualizarOcorrencia,
    excluirOcorrencia
} from "./Ocorrencia.js";

import {
    listarLocalizacoes,
    buscarLocalizacao,
    criarLocalizacao
} from "./Localizacoes.js";

import {
    listarHistorico,
    criarHistorico
} from "./Historico-ocorrencias.js";

import {
    listarAtendimentos,
    criarAtendimento,
    listarEquipes
} from "./Atendimento.js";

import {
    listarNotificacoes,
    criarNotificacao,
    marcarComoLida,
    marcarTodasComoLidas
} from "./Notificacoes.js";

import {
    listarAnexos,
    criarAnexo
} from "./Anexos.js";

import {
    listarObservacoes,
    criarObservacao,
    listarTarefas,
    criarTarefa,
    atualizarTarefa,
    excluirTarefa
} from "./Acompanhamento.js";

import { obterEstatisticas } from "./Estatisticas.js";

dotenv.config();

const app = express();

const FRONTEND_URL =
    process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json({ limit: "10mb" }));

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MODELO_IA = "gemini-2.5-flash";

console.log(
    process.env.GEMINI_API_KEY
        ? "CHAVE DO GEMINI ENCONTRADA"
        : "CHAVE DO GEMINI NÃO ENCONTRADA"
);

if (!process.env.JWT_SECRET) {
    console.warn("ATENÇÃO: JWT_SECRET não definido no .env; o login falhará.");
}

// Valores aceitos pelo sistema (devem bater com o front-end)
const STATUS_OCORRENCIA = ["Aberta", "Em análise", "Em atendimento", "Resolvida"];
const PRIORIDADES = ["Alta", "Média", "Baixa"];
const STATUS_CATEGORIA = ["Ativa", "Inativa"];

// ======================================================
// MIDDLEWARES DE AUTENTICAÇÃO
// ======================================================

// Carrega o usuário informado no header x-usuario-id, se estiver ativo
async function carregarUsuarioAtivo(req) {
    const idUsuario = Number(req.headers["x-usuario-id"]);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        return null;
    }

    const [usuarios] = await db.execute(
        `SELECT id_usuario, nome, email, cargo, perfil, status
         FROM usuarios
         WHERE id_usuario = ?
         LIMIT 1`,
        [idUsuario]
    );

    const usuario = usuarios[0];

    if (!usuario || usuario.status !== "Ativo") {
        return null;
    }

    return usuario;
}

function ehAdministrador(usuario) {
    return usuario.perfil === "Administrador" || usuario.cargo === "Administrador";
}

async function exigirUsuarioAtivo(req, res, next) {
    try {
        const usuario = await carregarUsuarioAtivo(req);

        if (!usuario) {
            return res.status(401).json({
                erro: "Faça login para continuar."
            });
        }

        req.usuarioAtual = usuario;
        return next();
    } catch (erro) {
        console.error("Erro ao validar usuário:", erro);
        return res.status(500).json({
            erro: "Não foi possível validar sua sessão."
        });
    }
}

async function exigirAdministrador(req, res, next) {
    try {
        const usuario = await carregarUsuarioAtivo(req);

        if (!usuario) {
            return res.status(401).json({
                erro: "Faça login como administrador."
            });
        }

        if (!ehAdministrador(usuario)) {
            return res.status(403).json({
                erro: "Apenas administradores ativos podem realizar esta ação."
            });
        }

        req.administrador = usuario;
        req.usuarioAtual = usuario;
        return next();
    } catch (erro) {
        console.error("Erro ao validar administrador:", erro);

        return res.status(500).json({
            erro: "Não foi possível validar as permissões."
        });
    }
}

// Permite acesso ao próprio usuário ou a um administrador
function podeAcessarUsuario(req, idAlvo) {
    return (
        ehAdministrador(req.usuarioAtual) ||
        req.usuarioAtual.id_usuario === idAlvo
    );
}

// ======================================================
// SERVIDOR HTTP E SOCKET.IO (CHAT)
// ======================================================

const servidorHttp = createServer(app);

const io = new Server(servidorHttp, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST"]
    }
});

const canaisChat = new Set([
    "geral",
    "infraestrutura",
    "atendimento",
    "administracao",
    "tecnologia"
]);

async function prepararTabelaChat() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS mensagens_chat (
            id_mensagem BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            id_usuario INT NOT NULL,
            canal VARCHAR(40) NOT NULL DEFAULT 'geral',
            mensagem TEXT NOT NULL,
            data_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id_mensagem),
            INDEX idx_chat_canal_data (canal, data_envio)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
}

// Protótipo: a identificação por ID não substitui autenticação segura.
io.use(async (socket, next) => {
    try {
        const idUsuario = Number(
            socket.handshake.auth?.id_usuario
        );

        if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
            return next(
                new Error("Faça login para acessar o chat.")
            );
        }

        const [usuarios] = await db.execute(
            `SELECT id_usuario, nome, email, cargo
             FROM usuarios
             WHERE id_usuario = ?
               AND status = 'Ativo'
             LIMIT 1`,
            [idUsuario]
        );

        if (!usuarios.length) {
            return next(
                new Error("Usuário não encontrado ou inativo.")
            );
        }

        socket.data.usuario = usuarios[0];
        return next();
    } catch (erro) {
        console.error("Falha ao validar usuário do chat:", erro);

        return next(
            new Error("Não foi possível validar seu usuário.")
        );
    }
});

io.on("connection", (socket) => {
    socket.on("entrar-canal", async (canalInformado) => {
        const canal = String(canalInformado || "");

        if (!canaisChat.has(canal)) return;

        for (const sala of socket.rooms) {
            if (canaisChat.has(sala)) {
                await socket.leave(sala);
            }
        }

        await socket.join(canal);

        try {
            const [linhas] = await db.execute(
                `SELECT
                    m.id_mensagem AS id,
                    m.canal,
                    m.mensagem AS texto,
                    m.data_envio AS data,
                    DATE_FORMAT(m.data_envio, '%H:%i') AS horario,
                    u.id_usuario,
                    u.nome
                 FROM mensagens_chat m
                 INNER JOIN usuarios u
                    ON u.id_usuario = m.id_usuario
                 WHERE m.canal = ?
                 ORDER BY m.data_envio DESC, m.id_mensagem DESC
                 LIMIT 100`,
                [canal]
            );

            socket.emit("historico-mensagens", {
                canal,
                mensagens: linhas.reverse()
            });
        } catch (erro) {
            console.error(
                "Erro ao carregar histórico do chat:",
                erro
            );

            socket.emit(
                "chat-erro",
                "Não foi possível carregar o histórico deste canal."
            );
        }
    });

    socket.on("enviar-mensagem", async (dados = {}) => {
        const canal = String(dados.canal || "");
        const texto = String(dados.texto || "").trim();

        if (!canaisChat.has(canal)) return;
        if (!socket.rooms.has(canal)) return;
        if (!texto || texto.length > 2000) return;

        try {
            const usuario = socket.data.usuario;

            const [resultado] = await db.execute(
                `INSERT INTO mensagens_chat
                    (id_usuario, canal, mensagem)
                 VALUES (?, ?, ?)`,
                [usuario.id_usuario, canal, texto]
            );

            const [linhas] = await db.execute(
                `SELECT
                    m.id_mensagem AS id,
                    m.canal,
                    m.mensagem AS texto,
                    m.data_envio AS data,
                    DATE_FORMAT(m.data_envio, '%H:%i') AS horario,
                    u.id_usuario,
                    u.nome
                 FROM mensagens_chat m
                 INNER JOIN usuarios u
                    ON u.id_usuario = m.id_usuario
                 WHERE m.id_mensagem = ?
                 LIMIT 1`,
                [resultado.insertId]
            );

            if (linhas.length) {
                io.to(canal).emit("nova-mensagem", linhas[0]);
            }
        } catch (erro) {
            console.error("Erro ao salvar mensagem do chat:", erro);

            socket.emit(
                "chat-erro",
                "Não foi possível salvar a mensagem."
            );
        }
    });
});

// ======================================================
// INTELIGÊNCIA ARTIFICIAL
// ======================================================

// Gera a análise da denúncia e grava em observacao_ia (não bloqueia o cadastro)
async function analisarOcorrenciaIA(idOcorrencia) {
    if (!process.env.GEMINI_API_KEY) return;

    const ocorrencia = await buscarOcorrenciaPorId(idOcorrencia);
    if (!ocorrencia) return;

    const resposta = await ai.models.generateContent({
        model: MODELO_IA,
        contents:
            "Você apoia a gestão de uma prefeitura. Analise a denúncia abaixo " +
            "em no máximo 3 frases curtas, em português: informe o risco à população, " +
            "o impacto provável e a prioridade sugerida (Alta, Média ou Baixa).\n\n" +
            `Categoria: ${ocorrencia.categoria_nome}\n` +
            `Título: ${ocorrencia.titulo}\n` +
            `Descrição: ${ocorrencia.descricao}\n` +
            `Local: ${ocorrencia.endereco || ""}, ${ocorrencia.bairro || ""}, ${ocorrencia.cidade || ""}`
    });

    const texto = (resposta.text || "").trim();

    if (texto) {
        await atualizarOcorrencia(idOcorrencia, {
            observacao_ia: texto.slice(0, 2000)
        });
    }
}

// ======================================================
// ROTA INICIAL
// ======================================================

app.get("/", (req, res) => {
    res.json({
        mensagem: "Servidor funcionando!"
    });
});

// ======================================================
// LOGIN E CADASTRO
// ======================================================

// Cadastro público: cria somente contas comuns.
app.post("/cadastro", async (req, res) => {
    try {
        const { nome, email, senha } = req.body || {};

        if (
            typeof nome !== "string" ||
            !nome.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof senha !== "string" ||
            senha.length < 6
        ) {
            return res.status(400).json({
                erro: "Informe nome, e-mail e senha com pelo menos 6 caracteres."
            });
        }

        const usuario = await criarUsuario({
            nome: nome.trim(),
            email: email.trim(),
            senha,
            cargo: "Funcionário",
            setor: "Atendimento",
            perfil: "Usuário"
        });

        return res.status(201).json({
            mensagem: "Cadastro realizado com sucesso.",
            usuario
        });
    } catch (erro) {
        if (
            erro.message === "EMAIL_JA_CADASTRADO" ||
            erro.code === "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                erro: "Este e-mail já está cadastrado."
            });
        }

        console.error("Erro no cadastro público:", erro);

        return res.status(500).json({
            erro: "Erro ao realizar cadastro."
        });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body || {};

        if (
            typeof email !== "string" ||
            !email.trim() ||
            typeof senha !== "string" ||
            !senha
        ) {
            return res.status(400).json({
                erro: "Informe e-mail e senha."
            });
        }

        const usuario = await verificarLogin(email.trim(), senha);

        if (!usuario) {
            return res.status(401).json({
                erro: "E-mail ou senha incorretos, ou conta inativa."
            });
        }

        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                cargo: usuario.cargo,
                perfil: usuario.perfil
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        return res.json({ ...usuario, token });
    } catch (erro) {
        console.error("Erro no login:", erro);

        return res.status(500).json({
            erro: "Erro interno no login."
        });
    }
});

// ======================================================
// PERFIL DO PRÓPRIO USUÁRIO
// ======================================================

app.get("/perfil", exigirUsuarioAtivo, (req, res) => {
    return res.json(req.usuarioAtual);
});

app.put("/perfil", exigirUsuarioAtivo, async (req, res) => {
    const { nome, email } = req.body || {};

    if (
        typeof nome !== "string" ||
        !nome.trim() ||
        typeof email !== "string" ||
        !email.trim()
    ) {
        return res.status(400).json({
            erro: "Preencha nome e e-mail."
        });
    }

    try {
        const usuario = await atualizarPerfilProprio(
            req.usuarioAtual.id_usuario,
            { nome: nome.trim(), email: email.trim() }
        );

        return res.json({
            mensagem: "Perfil atualizado com sucesso.",
            usuario
        });
    } catch (erro) {
        if (erro.message === "EMAIL_JA_CADASTRADO" || erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                erro: "Este e-mail já está cadastrado."
            });
        }

        console.error("Erro ao atualizar perfil:", erro);

        return res.status(500).json({
            erro: "Erro ao atualizar perfil."
        });
    }
});

app.put("/perfil/senha", exigirUsuarioAtivo, async (req, res) => {
    const { senha_atual, nova_senha } = req.body || {};

    if (
        typeof senha_atual !== "string" ||
        !senha_atual ||
        typeof nova_senha !== "string" ||
        nova_senha.length < 6
    ) {
        return res.status(400).json({
            erro: "Informe a senha atual e uma nova senha com pelo menos 6 caracteres."
        });
    }

    try {
        await alterarSenhaProprio(
            req.usuarioAtual.id_usuario,
            senha_atual,
            nova_senha
        );

        return res.json({
            mensagem: "Senha alterada com sucesso."
        });
    } catch (erro) {
        if (erro.message === "SENHA_ATUAL_INCORRETA") {
            return res.status(400).json({
                erro: "A senha atual está incorreta."
            });
        }

        console.error("Erro ao alterar senha:", erro);

        return res.status(500).json({
            erro: "Erro ao alterar a senha."
        });
    }
});

// ======================================================
// USUÁRIOS (gestão pelo administrador)
// ======================================================

app.get("/usuarios", exigirAdministrador, async (req, res) => {
    try {
        return res.json(await listarUsuarios());
    } catch (erro) {
        console.error("Erro ao listar usuários:", erro);
        return res.status(500).json({ erro: "Erro ao buscar usuários." });
    }
});

app.post("/usuario", exigirAdministrador, async (req, res) => {
    try {
        const { nome, email, senha, cargo, setor, perfil } = req.body || {};

        if (
            typeof nome !== "string" ||
            !nome.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof senha !== "string" ||
            senha.length < 6 ||
            typeof cargo !== "string" ||
            !cargo.trim() ||
            typeof setor !== "string" ||
            !setor.trim() ||
            !["Usuário", "Administrador"].includes(perfil)
        ) {
            return res.status(400).json({
                erro: "Preencha os campos corretamente. A senha deve ter pelo menos 6 caracteres."
            });
        }

        const usuario = await criarUsuario({
            nome: nome.trim(),
            email: email.trim(),
            senha,
            cargo: cargo.trim(),
            setor: setor.trim(),
            perfil
        });

        return res.status(201).json({
            mensagem: "Usuário cadastrado com sucesso.",
            usuario
        });
    } catch (erro) {
        if (erro.message === "EMAIL_JA_CADASTRADO" || erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
        }

        console.error("Erro ao cadastrar usuário:", erro);
        return res.status(500).json({ erro: "Erro ao cadastrar usuário." });
    }
});

app.get("/usuarios/:id", exigirUsuarioAtivo, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ erro: "ID de usuário inválido." });
    }

    if (!podeAcessarUsuario(req, id)) {
        return res.status(403).json({ erro: "Você não pode consultar este usuário." });
    }

    try {
        const usuario = await buscarUsuarioPorId(id);

        if (!usuario) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        return res.json(usuario);
    } catch (erro) {
        console.error("Erro ao buscar usuário:", erro);
        return res.status(500).json({ erro: "Erro ao buscar usuário." });
    }
});

app.put("/usuarios/:id", exigirAdministrador, async (req, res) => {
    const id = Number(req.params.id);
    const { nome, email, cargo, setor, perfil } = req.body || {};

    if (
        !Number.isInteger(id) ||
        id <= 0 ||
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
        return res.status(400).json({ erro: "Preencha todos os campos corretamente." });
    }

    if (id === req.administrador.id_usuario && perfil !== "Administrador") {
        return res.status(400).json({
            erro: "Você não pode remover seu próprio perfil de administrador."
        });
    }

    try {
        const usuario = await atualizarUsuario(id, {
            nome: nome.trim(),
            email: email.trim(),
            cargo: cargo.trim(),
            setor: setor.trim(),
            perfil
        });

        if (!usuario) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        return res.json({
            mensagem: "Usuário atualizado com sucesso.",
            usuario
        });
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY" || erro.message === "EMAIL_JA_CADASTRADO") {
            return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
        }

        console.error("Erro ao atualizar usuário:", erro);
        return res.status(500).json({ erro: "Erro ao atualizar usuário." });
    }
});

app.patch("/usuarios/:id/status", exigirAdministrador, async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body || {};

    if (!Number.isInteger(id) || id <= 0 || !["Ativo", "Inativo"].includes(status)) {
        return res.status(400).json({ erro: "ID ou status inválido." });
    }

    if (id === req.administrador.id_usuario && status === "Inativo") {
        return res.status(400).json({ erro: "Você não pode desativar sua própria conta." });
    }

    try {
        const usuario = await alterarStatusUsuario(id, status);

        if (!usuario) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        return res.json({
            mensagem: `Usuário ${status.toLowerCase()} com sucesso.`,
            usuario
        });
    } catch (erro) {
        console.error("Erro ao alterar status:", erro);
        return res.status(500).json({ erro: "Erro ao alterar status do usuário." });
    }
});

// ======================================================
// PREFERÊNCIAS DO USUÁRIO
// ======================================================

app.get("/usuarios/:id/preferencias", exigirUsuarioAtivo, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ erro: "ID inválido." });
    }

    if (!podeAcessarUsuario(req, id)) {
        return res.status(403).json({ erro: "Acesso negado." });
    }

    try {
        return res.json(await obterPreferencias(id));
    } catch (erro) {
        console.error("Erro ao buscar preferências:", erro);
        return res.status(500).json({ erro: "Erro ao buscar preferências." });
    }
});

app.put("/usuarios/:id/preferencias", exigirUsuarioAtivo, async (req, res) => {
    const id = Number(req.params.id);
    const { notificacoes, alertasUrgentes } = req.body || {};

    if (
        !Number.isInteger(id) ||
        id <= 0 ||
        typeof notificacoes !== "boolean" ||
        typeof alertasUrgentes !== "boolean"
    ) {
        return res.status(400).json({ erro: "Dados inválidos." });
    }

    if (!podeAcessarUsuario(req, id)) {
        return res.status(403).json({ erro: "Acesso negado." });
    }

    try {
        await db.execute(
            `INSERT INTO preferencias_usuarios
                (id_usuario, notificacoes, alertas_urgentes)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
                notificacoes = VALUES(notificacoes),
                alertas_urgentes = VALUES(alertas_urgentes)`,
            [id, Number(notificacoes), Number(alertasUrgentes)]
        );

        return res.json({ mensagem: "Preferências salvas com sucesso." });
    } catch (erro) {
        console.error("Erro ao salvar preferências:", erro);
        return res.status(500).json({ erro: "Erro ao salvar preferências." });
    }
});

// ======================================================
// CATEGORIAS
// ======================================================

// Pública: o formulário de denúncia precisa listar as categorias ativas
app.get("/categorias", async (req, res) => {
    try {
        return res.json(await listarCategorias());
    } catch (erro) {
        console.error("Erro ao buscar categorias:", erro);
        return res.status(500).json({ erro: "Erro ao buscar categorias." });
    }
});

app.get("/categorias/:id", exigirAdministrador, async (req, res) => {
    try {
        const categoria = await buscarCategoriaPorId(Number(req.params.id));

        if (!categoria) {
            return res.status(404).json({ erro: "Categoria não encontrada." });
        }

        return res.json(categoria);
    } catch (erro) {
        console.error("Erro ao buscar categoria:", erro);
        return res.status(500).json({ erro: "Erro ao buscar categoria." });
    }
});

function validarCategoria(corpo) {
    const { nome, descricao, icone, status } = corpo || {};

    if (typeof nome !== "string" || !nome.trim() || nome.trim().length > 100) {
        return { erro: "Informe o nome da categoria (até 100 caracteres)." };
    }

    if (status !== undefined && !STATUS_CATEGORIA.includes(status)) {
        return { erro: "Status de categoria inválido." };
    }

    return {
        dados: {
            nome: nome.trim(),
            descricao: String(descricao || "").trim(),
            icone: String(icone || "📍").trim().slice(0, 16) || "📍",
            status: status || "Ativa"
        }
    };
}

app.post("/categorias", exigirAdministrador, async (req, res) => {
    const { erro, dados } = validarCategoria(req.body);

    if (erro) {
        return res.status(400).json({ erro });
    }

    try {
        const categoria = await criarCategoria(dados);

        return res.status(201).json({
            mensagem: "Categoria criada com sucesso.",
            categoria
        });
    } catch (erroBanco) {
        console.error("Erro ao criar categoria:", erroBanco);
        return res.status(500).json({ erro: "Erro ao criar categoria." });
    }
});

app.put("/categorias/:id", exigirAdministrador, async (req, res) => {
    const id = Number(req.params.id);
    const { erro, dados } = validarCategoria(req.body);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ erro: "ID de categoria inválido." });
    }

    if (erro) {
        return res.status(400).json({ erro });
    }

    try {
        if (!(await buscarCategoriaPorId(id))) {
            return res.status(404).json({ erro: "Categoria não encontrada." });
        }

        const categoria = await atualizarCategoria(id, dados);

        return res.json({
            mensagem: "Categoria atualizada com sucesso.",
            categoria
        });
    } catch (erroBanco) {
        console.error("Erro ao atualizar categoria:", erroBanco);
        return res.status(500).json({ erro: "Erro ao atualizar categoria." });
    }
});

app.delete("/categorias/:id", exigirAdministrador, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ erro: "ID de categoria inválido." });
    }

    try {
        if (!(await buscarCategoriaPorId(id))) {
            return res.status(404).json({ erro: "Categoria não encontrada." });
        }

        if ((await contarOcorrenciasDaCategoria(id)) > 0) {
            return res.status(409).json({
                erro: "Esta categoria possui ocorrências. Desative-a em vez de excluí-la."
            });
        }

        await excluirCategoria(id);

        return res.json({ mensagem: "Categoria excluída." });
    } catch (erroBanco) {
        console.error("Erro ao excluir categoria:", erroBanco);
        return res.status(500).json({ erro: "Erro ao excluir categoria." });
    }
});

// ======================================================
// OCORRÊNCIAS (somente administradores)
// ======================================================

app.get("/ocorrencias", exigirAdministrador, async (req, res) => {
    try {
        return res.json(await listarOcorrencias());
    } catch (erro) {
        console.error("Erro ao buscar ocorrências:", erro);
        return res.status(500).json({ erro: "Erro ao buscar ocorrências." });
    }
});

app.get("/ocorrencias/:id", exigirAdministrador, async (req, res) => {
    try {
        const ocorrencia = await buscarOcorrenciaPorId(Number(req.params.id));

        if (!ocorrencia) {
            return res.status(404).json({ erro: "Ocorrência não encontrada." });
        }

        return res.json(ocorrencia);
    } catch (erro) {
        console.error("Erro ao buscar ocorrência:", erro);
        return res.status(500).json({ erro: "Erro ao buscar ocorrência." });
    }
});

// Cadastro feito pelo painel do administrador
app.post("/ocorrencias", exigirAdministrador, async (req, res) => {
    const {
        id_categoria,
        titulo,
        descricao,
        prioridade,
        rua,
        bairro,
        cidade,
        responsavel,
        prazo
    } = req.body || {};

    if (
        !Number.isInteger(Number(id_categoria)) ||
        typeof titulo !== "string" || !titulo.trim() || titulo.trim().length > 100 ||
        typeof descricao !== "string" || descricao.trim().length < 10 ||
        !PRIORIDADES.includes(prioridade) ||
        typeof rua !== "string" || !rua.trim() ||
        typeof bairro !== "string" || !bairro.trim() ||
        typeof cidade !== "string" || !cidade.trim()
    ) {
        return res.status(400).json({
            erro: "Informe categoria, título, descrição (mínimo 10 caracteres), prioridade, rua, bairro e cidade."
        });
    }

    if (prazo && !/^\d{4}-\d{2}-\d{2}$/.test(prazo)) {
        return res.status(400).json({ erro: "Prazo inválido." });
    }

    try {
        const categoria = await buscarCategoriaPorId(Number(id_categoria));

        if (!categoria) {
            return res.status(400).json({ erro: "A categoria informada não existe." });
        }

        const { id_ocorrencia } = await criarOcorrencia({
            id_usuario: req.administrador.id_usuario,
            id_categoria: categoria.id_categoria,
            titulo: titulo.trim(),
            descricao: descricao.trim(),
            prioridade,
            responsavel: responsavel?.trim() || null,
            prazo: prazo || null
        });

        await criarLocalizacao({
            id_ocorrencia,
            endereco: rua.trim(),
            bairro: bairro.trim(),
            cidade: cidade.trim()
        });

        await criarHistorico({
            id_ocorrencia,
            id_usuario: req.administrador.id_usuario,
            status_anterior: null,
            novo_status: "Aberta",
            observacao: "Ocorrência cadastrada no painel."
        });

        return res.status(201).json({
            mensagem: "Ocorrência criada com sucesso.",
            id_ocorrencia
        });
    } catch (erro) {
        console.error("Erro ao criar ocorrência:", erro);
        return res.status(500).json({ erro: "Erro ao criar ocorrência." });
    }
});

app.put("/ocorrencias/:id", exigirAdministrador, async (req, res) => {
    const id = Number(req.params.id);
    const corpo = req.body || {};

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ erro: "ID de ocorrência inválido." });
    }

    if (corpo.status !== undefined && !STATUS_OCORRENCIA.includes(corpo.status)) {
        return res.status(400).json({ erro: "Status inválido." });
    }

    if (corpo.prioridade !== undefined && !PRIORIDADES.includes(corpo.prioridade)) {
        return res.status(400).json({ erro: "Prioridade inválida." });
    }

    if (corpo.prazo && !/^\d{4}-\d{2}-\d{2}$/.test(corpo.prazo)) {
        return res.status(400).json({ erro: "Prazo inválido." });
    }

    if (corpo.titulo !== undefined && (typeof corpo.titulo !== "string" || !corpo.titulo.trim() || corpo.titulo.trim().length > 100)) {
        return res.status(400).json({ erro: "Título inválido." });
    }

    for (const campo of ["orcamento_estimado", "orcamento_aprovado", "orcamento_gasto"]) {
        if (corpo[campo] !== undefined) {
            const valor = Number(corpo[campo]);
            if (!Number.isFinite(valor) || valor < 0) {
                return res.status(400).json({ erro: `Valor inválido em ${campo}.` });
            }
            corpo[campo] = valor;
        }
    }

    try {
        const atual = await buscarOcorrenciaPorId(id);

        if (!atual) {
            return res.status(404).json({ erro: "Ocorrência não encontrada." });
        }

        const atualizada = await atualizarOcorrencia(id, {
            titulo: corpo.titulo?.trim(),
            descricao: corpo.descricao,
            prioridade: corpo.prioridade,
            status: corpo.status,
            responsavel: corpo.responsavel,
            prazo: corpo.prazo,
            orcamento_estimado: corpo.orcamento_estimado,
            orcamento_aprovado: corpo.orcamento_aprovado,
            orcamento_gasto: corpo.orcamento_gasto,
            observacao_ia: corpo.observacao_ia
        });

        // Mudança de status fica registrada no histórico automaticamente
        if (corpo.status !== undefined && corpo.status !== atual.status) {
            await criarHistorico({
                id_ocorrencia: id,
                id_usuario: req.administrador.id_usuario,
                status_anterior: atual.status,
                novo_status: corpo.status,
                observacao: String(corpo.observacao || "").trim() || null
            });
        }

        return res.json({
            mensagem: "Ocorrência atualizada.",
            ocorrencia: atualizada
        });
    } catch (erro) {
        console.error("Erro ao atualizar ocorrência:", erro);
        return res.status(500).json({ erro: "Erro ao atualizar ocorrência." });
    }
});

app.delete("/ocorrencias/:id", exigirAdministrador, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ erro: "ID de ocorrência inválido." });
    }

    try {
        const removidas = await excluirOcorrencia(id);

        if (!removidas) {
            return res.status(404).json({ erro: "Ocorrência não encontrada." });
        }

        return res.json({ mensagem: "Ocorrência excluída." });
    } catch (erro) {
        console.error("Erro ao excluir ocorrência:", erro);
        return res.status(500).json({ erro: "Erro ao excluir ocorrência." });
    }
});

app.get("/ocorrencias/:id/historico", exigirAdministrador, async (req, res) => {
    try {
        return res.json(await listarHistorico(Number(req.params.id)));
    } catch (erro) {
        console.error("Erro ao buscar histórico:", erro);
        return res.status(500).json({ erro: "Erro ao buscar histórico." });
    }
});

app.get("/ocorrencias/:id/atendimentos", exigirAdministrador, async (req, res) => {
    try {
        return res.json(await listarAtendimentos(Number(req.params.id)));
    } catch (erro) {
        console.error("Erro ao buscar atendimentos:", erro);
        return res.status(500).json({ erro: "Erro ao buscar atendimentos." });
    }
});

app.get("/ocorrencias/:id/anexos", exigirAdministrador, async (req, res) => {
    try {
        return res.json(await listarAnexos(Number(req.params.id)));
    } catch (erro) {
        console.error("Erro ao buscar anexos:", erro);
        return res.status(500).json({ erro: "Erro ao buscar anexos." });
    }
});

app.get("/ocorrencias/:id/observacoes", exigirAdministrador, async (req, res) => {
    try {
        return res.json(await listarObservacoes(Number(req.params.id)));
    } catch (erro) {
        console.error("Erro ao buscar observações:", erro);
        return res.status(500).json({ erro: "Erro ao buscar observações." });
    }
});

app.post("/ocorrencias/:id/observacoes", exigirAdministrador, async (req, res) => {
    const id = Number(req.params.id);
    const texto = String(req.body?.texto || "").trim();

    if (!Number.isInteger(id) || id <= 0 || !texto || texto.length > 2000) {
        return res.status(400).json({ erro: "Informe um texto de até 2000 caracteres." });
    }

    try {
        if (!(await buscarOcorrenciaPorId(id))) {
            return res.status(404).json({ erro: "Ocorrência não encontrada." });
        }

        const { id_observacao } = await criarObservacao({
            id_ocorrencia: id,
            id_usuario: req.administrador.id_usuario,
            texto
        });

        const observacoes = await listarObservacoes(id);
        return res.status(201).json({
            mensagem: "Observação registrada.",
            observacao: observacoes.find((o) => o.id_observacao === id_observacao) || { id_observacao, texto }
        });
    } catch (erro) {
        console.error("Erro ao criar observação:", erro);
        return res.status(500).json({ erro: "Erro ao registrar observação." });
    }
});

app.get("/ocorrencias/:id/tarefas", exigirAdministrador, async (req, res) => {
    try {
        return res.json(await listarTarefas(Number(req.params.id)));
    } catch (erro) {
        console.error("Erro ao buscar tarefas:", erro);
        return res.status(500).json({ erro: "Erro ao buscar tarefas." });
    }
});

app.post("/ocorrencias/:id/tarefas", exigirAdministrador, async (req, res) => {
    const id = Number(req.params.id);
    const titulo = String(req.body?.titulo || "").trim();

    if (!Number.isInteger(id) || id <= 0 || !titulo || titulo.length > 150) {
        return res.status(400).json({ erro: "Informe um título de até 150 caracteres." });
    }

    try {
        const { id_tarefa } = await criarTarefa({ id_ocorrencia: id, titulo });
        return res.status(201).json({
            mensagem: "Tarefa criada.",
            tarefa: { id_tarefa, id_ocorrencia: id, titulo, concluida: false }
        });
    } catch (erro) {
        console.error("Erro ao criar tarefa:", erro);
        return res.status(500).json({ erro: "Erro ao criar tarefa." });
    }
});

app.put("/tarefas/:id", exigirAdministrador, async (req, res) => {
    const id = Number(req.params.id);
    const { titulo, concluida } = req.body || {};

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ erro: "ID de tarefa inválido." });
    }

    if (titulo !== undefined && (typeof titulo !== "string" || !titulo.trim())) {
        return res.status(400).json({ erro: "Título inválido." });
    }

    try {
        const alteradas = await atualizarTarefa(id, {
            titulo: titulo?.trim(),
            concluida
        });

        if (!alteradas) {
            return res.status(404).json({ erro: "Tarefa não encontrada." });
        }

        return res.json({ mensagem: "Tarefa atualizada." });
    } catch (erro) {
        console.error("Erro ao atualizar tarefa:", erro);
        return res.status(500).json({ erro: "Erro ao atualizar tarefa." });
    }
});

app.delete("/tarefas/:id", exigirAdministrador, async (req, res) => {
    try {
        const removidas = await excluirTarefa(Number(req.params.id));

        if (!removidas) {
            return res.status(404).json({ erro: "Tarefa não encontrada." });
        }

        return res.json({ mensagem: "Tarefa excluída." });
    } catch (erro) {
        console.error("Erro ao excluir tarefa:", erro);
        return res.status(500).json({ erro: "Erro ao excluir tarefa." });
    }
});

// ======================================================
// ESTATÍSTICAS DO PAINEL
// ======================================================

app.get("/estatisticas", exigirAdministrador, async (req, res) => {
    try {
        return res.json(await obterEstatisticas());
    } catch (erro) {
        console.error("Erro ao calcular estatísticas:", erro);
        return res.status(500).json({ erro: "Erro ao calcular estatísticas." });
    }
});

// ======================================================
// EQUIPES
// ======================================================

app.get("/equipes", exigirAdministrador, async (req, res) => {
    try {
        return res.json(await listarEquipes());
    } catch (erro) {
        console.error("Erro ao buscar equipes:", erro);
        return res.status(500).json({ erro: "Erro ao buscar equipes." });
    }
});

// ======================================================
// NOTAS
// ======================================================

app.get("/usuarios/:id/notas", exigirUsuarioAtivo, async (req, res) => {
    const id = Number(req.params.id);

    if (!podeAcessarUsuario(req, id)) {
        return res.status(403).json({ erro: "Acesso negado." });
    }

    try {
        return res.json(await listarNotasDoUsuario(id));
    } catch (erro) {
        console.error("Erro ao buscar notas:", erro);
        return res.status(500).json({ erro: "Erro ao buscar notas." });
    }
});

app.post("/notas", exigirUsuarioAtivo, async (req, res) => {
    const { titulo, conteudo, tipo } = req.body || {};
    const idUsuario = req.usuarioAtual.id_usuario;

    if (!titulo?.trim?.() || !conteudo?.trim?.()) {
        return res.status(400).json({ erro: "Informe título e conteúdo." });
    }

    try {
        const resultado = await criarNotaBD({
            id_usuario: idUsuario,
            titulo: titulo.trim(),
            conteudo: conteudo.trim(),
            tipo
        });

        return res.status(201).json({ mensagem: "Nota criada.", ...resultado });
    } catch (erro) {
        console.error("Erro ao criar nota:", erro);
        return res.status(500).json({ erro: "Erro ao criar nota." });
    }
});

app.delete("/notas/:id", exigirUsuarioAtivo, async (req, res) => {
    try {
        // Só remove notas do próprio usuário autenticado
        const removidas = await excluirNotaBD(
            Number(req.params.id),
            req.usuarioAtual.id_usuario
        );

        if (!removidas) {
            return res.status(404).json({ erro: "Nota não encontrada." });
        }

        return res.json({ mensagem: "Nota excluída." });
    } catch (erro) {
        console.error("Erro ao excluir nota:", erro);
        return res.status(500).json({ erro: "Erro ao excluir nota." });
    }
});

app.post("/notas/ia", exigirUsuarioAtivo, async (req, res) => {
    try {
        const notas = Array.isArray(req.body?.notas) ? req.body.notas : [];

        if (!notas.length) {
            return res.status(400).json({ mensagem: "Não há notas para analisar." });
        }

        const texto = notas
            .map((nota, indice) => {
                return `Nota ${indice + 1} (${nota.tipo || "Geral"}, ${nota.data || "sem data"}): ${nota.titulo || "Sem título"}\n${nota.conteudo || ""}`;
            })
            .join("\n\n");

        const resposta = await ai.models.generateContent({
            model: MODELO_IA,
            contents:
                "Resuma as notas abaixo para um administrador da prefeitura, destacando temas recorrentes, pontos de atenção e próximos passos. Responda em português, em até 8 linhas.\n\n" +
                texto
        });

        return res.json({
            resumo: resposta.text || "A IA não retornou um resumo."
        });
    } catch (erro) {
        console.error("Erro na análise das notas:", erro);
        return res.status(500).json({ mensagem: "Não foi possível gerar a análise." });
    }
});

// Transcreve o texto de uma foto de caderno/anotação usando o Gemini
app.post("/notas/transcrever", exigirUsuarioAtivo, async (req, res) => {
    const { imagem, mimeType } = req.body || {};

    if (typeof imagem !== "string" || !imagem) {
        return res.status(400).json({ erro: "Envie a imagem." });
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(mimeType)) {
        return res.status(400).json({ erro: "Formato de imagem não suportado." });
    }

    // Aceita tanto base64 puro quanto data URL
    const base64 = imagem.includes(",") ? imagem.split(",")[1] : imagem;

    try {
        const resposta = await ai.models.generateContent({
            model: MODELO_IA,
            contents: [
                {
                    role: "user",
                    parts: [
                        { inlineData: { mimeType, data: base64 } },
                        {
                            text: "Transcreva fielmente o texto manuscrito ou impresso nesta imagem. Responda somente com o texto transcrito, sem comentários nem formatação extra."
                        }
                    ]
                }
            ]
        });

        const texto = (resposta.text || "").trim();

        if (!texto) {
            return res.status(422).json({ erro: "Não foi possível identificar texto nesta imagem." });
        }

        return res.json({ texto });
    } catch (erro) {
        console.error("Erro na transcrição:", erro);
        return res.status(500).json({ erro: "Não foi possível transcrever a imagem agora." });
    }
});

// ======================================================
// LOCALIZAÇÕES
// ======================================================

app.get("/localizacoes", exigirAdministrador, async (req, res) => {
    try {
        return res.json(await listarLocalizacoes());
    } catch (erro) {
        console.error("Erro ao buscar localizações:", erro);
        return res.status(500).json({ erro: "Erro ao buscar localizações." });
    }
});

app.get("/localizacoes/:idOcorrencia", exigirAdministrador, async (req, res) => {
    try {
        const localizacao = await buscarLocalizacao(Number(req.params.idOcorrencia));

        if (!localizacao) {
            return res.status(404).json({ erro: "Localização não encontrada." });
        }

        return res.json(localizacao);
    } catch (erro) {
        console.error("Erro ao buscar localização:", erro);
        return res.status(500).json({ erro: "Erro ao buscar localização." });
    }
});

// ======================================================
// HISTÓRICO
// ======================================================

app.post("/historico", exigirAdministrador, async (req, res) => {
    const { id_ocorrencia, novo_status } = req.body || {};

    if (!Number.isInteger(Number(id_ocorrencia)) || !STATUS_OCORRENCIA.includes(novo_status)) {
        return res.status(400).json({ erro: "Informe a ocorrência e um status válido." });
    }

    try {
        const resultado = await criarHistorico({
            id_ocorrencia: Number(id_ocorrencia),
            id_usuario: req.administrador.id_usuario,
            status_anterior: req.body.status_anterior || null,
            novo_status,
            observacao: String(req.body.observacao || "").trim() || null
        });

        return res.status(201).json({ mensagem: "Histórico registrado.", ...resultado });
    } catch (erro) {
        console.error("Erro ao registrar histórico:", erro);
        return res.status(500).json({ erro: "Erro ao registrar histórico." });
    }
});

// ======================================================
// ATENDIMENTOS
// ======================================================

app.post("/atendimentos", exigirAdministrador, async (req, res) => {
    const { id_ocorrencia, id_equipe, observacao } = req.body || {};

    if (!Number.isInteger(Number(id_ocorrencia)) || !Number.isInteger(Number(id_equipe))) {
        return res.status(400).json({ erro: "Informe a ocorrência e a equipe." });
    }

    try {
        const resultado = await criarAtendimento({
            id_ocorrencia: Number(id_ocorrencia),
            id_equipe: Number(id_equipe),
            observacao
        });

        return res.status(201).json({ mensagem: "Atendimento criado.", ...resultado });
    } catch (erro) {
        if (erro.message === "EQUIPE_INEXISTENTE") {
            return res.status(400).json({ erro: "A equipe informada não existe." });
        }

        console.error("Erro ao criar atendimento:", erro);
        return res.status(500).json({ erro: "Erro ao criar atendimento." });
    }
});

// ======================================================
// NOTIFICAÇÕES
// ======================================================

app.get("/usuarios/:id/notificacoes", exigirUsuarioAtivo, async (req, res) => {
    const id = Number(req.params.id);

    if (!podeAcessarUsuario(req, id)) {
        return res.status(403).json({ erro: "Acesso negado." });
    }

    try {
        return res.json(await listarNotificacoes(id));
    } catch (erro) {
        console.error("Erro ao buscar notificações:", erro);
        return res.status(500).json({ erro: "Erro ao buscar notificações." });
    }
});

app.put("/usuarios/:id/notificacoes/lidas", exigirUsuarioAtivo, async (req, res) => {
    const id = Number(req.params.id);

    if (!podeAcessarUsuario(req, id)) {
        return res.status(403).json({ erro: "Acesso negado." });
    }

    try {
        await marcarTodasComoLidas(id);
        return res.json({ mensagem: "Notificações marcadas como lidas." });
    } catch (erro) {
        console.error("Erro ao atualizar notificações:", erro);
        return res.status(500).json({ erro: "Erro ao atualizar notificações." });
    }
});

app.put("/notificacoes/:id/lida", exigirUsuarioAtivo, async (req, res) => {
    try {
        await marcarComoLida(Number(req.params.id));
        return res.json({ mensagem: "Notificação marcada como lida." });
    } catch (erro) {
        console.error("Erro ao atualizar notificação:", erro);
        return res.status(500).json({ erro: "Erro ao atualizar notificação." });
    }
});

// ======================================================
// ANEXOS
// ======================================================

app.post("/anexos", exigirAdministrador, async (req, res) => {
    try {
        const resultado = await criarAnexo(req.body);
        return res.status(201).json({ mensagem: "Anexo registrado.", ...resultado });
    } catch (erro) {
        console.error("Erro ao registrar anexo:", erro);
        return res.status(500).json({ erro: "Erro ao registrar anexo." });
    }
});

// ======================================================
// DENÚNCIAS (formulário público e área logada)
// ======================================================

app.post("/denuncia", async (req, res) => {
    const body = req.body || {};

    const usuarioRaw = body.id_usuario ?? body.id ?? null;
    const usuarioId =
        usuarioRaw === null || usuarioRaw === ""
            ? null
            : Number(usuarioRaw);

    const categoriaRaw = body.id_categoria ?? null;
    const categoriaNome = String(body.categoria || "").trim();
    const descricao = String(body.descricao || "").trim();
    const cidade = String(body.cidade || "").trim();
    const bairro = String(body.bairro || "").trim();
    const rua = String(body.rua || body.endereco || "").trim() || "Não informado";

    const titulo = String(
        body.titulo ||
        `${categoriaNome || "Relato cidadão"}: ${descricao.slice(0, 90)}`
    ).trim().slice(0, 100);

    const gravidadeBruta = String(body.gravidade || body.prioridade || "media")
        .trim()
        .toLowerCase();

    const prioridades = {
        baixa: "Baixa",
        media: "Média",
        "média": "Média",
        alta: "Alta"
    };

    const prioridade = prioridades[gravidadeBruta] || "Média";

    if (
        (usuarioId !== null && (!Number.isInteger(usuarioId) || usuarioId <= 0)) ||
        !titulo ||
        descricao.length < 10 ||
        !cidade ||
        !bairro ||
        (!categoriaNome && !categoriaRaw)
    ) {
        return res.status(400).json({
            erro: "Informe categoria, descrição com pelo menos 10 caracteres, cidade e bairro válidos."
        });
    }

    try {
        if (usuarioId !== null) {
            const [usuarios] = await db.execute(
                `SELECT id_usuario FROM usuarios WHERE id_usuario = ? AND status = 'Ativo' LIMIT 1`,
                [usuarioId]
            );

            if (!usuarios.length) {
                return res.status(400).json({ erro: "Usuário inexistente ou inativo." });
            }
        }

        // A categoria precisa existir e estar ativa; o formulário público não cria categorias
        const categoria = categoriaRaw !== null && Number.isInteger(Number(categoriaRaw))
            ? await buscarCategoriaPorId(Number(categoriaRaw))
            : await buscarCategoriaPorNome(categoriaNome);

        if (!categoria || categoria.status !== "Ativa") {
            return res.status(400).json({ erro: "A categoria informada não está disponível." });
        }

        const { id_ocorrencia } = await criarOcorrencia({
            id_usuario: usuarioId,
            id_categoria: categoria.id_categoria,
            titulo,
            descricao,
            prioridade
        });

        await criarLocalizacao({
            id_ocorrencia,
            endereco: rua,
            bairro,
            cidade,
            latitude: body.latitude ?? null,
            longitude: body.longitude ?? null
        });

        await criarHistorico({
            id_ocorrencia,
            id_usuario: usuarioId,
            status_anterior: null,
            novo_status: "Aberta",
            observacao: "Denúncia registrada pelo formulário."
        });

        // Avisa os administradores que têm notificações ativadas
        const [admins] = await db.execute(
            `SELECT u.id_usuario
             FROM usuarios u
             LEFT JOIN preferencias_usuarios p ON p.id_usuario = u.id_usuario
             WHERE (u.perfil = 'Administrador' OR u.cargo = 'Administrador')
               AND u.status = 'Ativo'
               AND COALESCE(p.notificacoes, 1) = 1`
        );

        const mensagem = prioridade === "Alta"
            ? `Nova denúncia de alta prioridade: ${titulo}`
            : `Nova denúncia registrada: ${titulo}`;

        for (const admin of admins) {
            await criarNotificacao({
                id_usuario: admin.id_usuario,
                id_ocorrencia,
                mensagem
            });
        }

        // Análise pela IA em segundo plano: a denúncia já está salva mesmo se a IA falhar
        analisarOcorrenciaIA(id_ocorrencia).catch((erro) =>
            console.error("Falha na análise automática da IA:", erro)
        );

        return res.status(201).json({
            mensagem: "Denúncia registrada com sucesso.",
            id_ocorrencia,
            protocolo: `NX-${String(id_ocorrencia).padStart(6, "0")}`
        });
    } catch (erro) {
        console.error("Erro ao registrar denúncia:", erro);

        return res.status(500).json({
            erro: "Não foi possível registrar a denúncia. Tente novamente em instantes."
        });
    }
});

// ======================================================
// INICIALIZAÇÃO
// ======================================================

const PORT = Number(process.env.PORT) || 3000;

prepararTabelaChat()
    .then(() => {
        servidorHttp.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`);
            console.log("Chat em tempo real preparado; tabela mensagens_chat verificada.");
        });
    })
    .catch((erro) => {
        console.error("Não foi possível preparar a tabela do chat. Confira o MySQL:", erro);
        process.exit(1);
    });
