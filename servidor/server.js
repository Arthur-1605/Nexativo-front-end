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
    alterarStatusUsuario
} from "./UsuarioBD.js";

import {
    listarCategorias,
    buscarCategoriaPorId,
    criarCategoria
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
    marcarComoLida
} from "./Notificacoes.js";

import {
    listarAnexos,
    criarAnexo
} from "./Anexos.js";

dotenv.config();

const app = express();

const FRONTEND_URL =
    process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json({ limit: "10mb" }));

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

console.log(
    process.env.GEMINI_API_KEY
        ? "CHAVE DO GEMINI ENCONTRADA"
        : "CHAVE DO GEMINI NÃO ENCONTRADA"
);

// ======================================================
// MIDDLEWARE: VALIDAR ADMINISTRADOR
// ======================================================

async function exigirAdministrador(req, res, next) {
    try {
        const idUsuario = Number(req.headers["x-usuario-id"]);

        if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
            return res.status(401).json({
                erro: "Faça login como administrador."
            });
        }

        const [usuarios] = await db.execute(
            `SELECT id_usuario, cargo, perfil, status
             FROM usuarios
             WHERE id_usuario = ?
             LIMIT 1`,
            [idUsuario]
        );

        const usuario = usuarios[0];

        if (
            !usuario ||
            usuario.status !== "Ativo" ||
            (
                usuario.perfil !== "Administrador" &&
                usuario.cargo !== "Administrador"
            )
        ) {
            return res.status(403).json({
                erro: "Apenas administradores ativos podem realizar esta ação."
            });
        }

        req.administrador = usuario;
        return next();
    } catch (erro) {
        console.error("Erro ao validar administrador:", erro);

        return res.status(500).json({
            erro: "Não foi possível validar as permissões."
        });
    }
}

// ======================================================
// SERVIDOR HTTP E SOCKET.IO
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
// ROTA INICIAL
// ======================================================

app.get("/", (req, res) => {
    res.json({
        mensagem: "Servidor funcionando!"
    });
});

// As rotas de usuários continuam a partir daqui.
app.get("/categorias", async (req, res) => {
    try {
        const categorias = await listarCategorias();
        return res.json(categorias);
    } catch (erro) {
        console.error("Erro ao listar categorias:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar categorias."
        });
    }
});

app.get("/categorias/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            erro: "ID de categoria inválido."
        });
    }

    try {
        const categoria = await buscarCategoriaPorId(id);

        if (!categoria) {
            return res.status(404).json({
                erro: "Categoria não encontrada."
            });
        }

        return res.json(categoria);
    } catch (erro) {
        console.error("Erro ao buscar categoria:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar categoria."
        });
    }
});

app.post(
    "/categorias",
    exigirAdministrador,
    async (req, res) => {
        try {
            const { nome, descricao } = req.body || {};

            if (typeof nome !== "string" || !nome.trim()) {
                return res.status(400).json({
                    erro: "Informe o nome da categoria."
                });
            }

            const categoria = await criarCategoria({
                nome: nome.trim(),
                descricao: String(descricao || "").trim()
            });

            return res.status(201).json({
                mensagem: "Categoria criada com sucesso.",
                categoria
            });
        } catch (erro) {
            console.error("Erro ao criar categoria:", erro);
            return res.status(500).json({
                erro: "Erro ao criar categoria."
            });
        }
    }
);

// ======================================================
// USUÁRIOS
// ======================================================

// Cadastro público: cria somente contas comuns.
// O gerenciamento de usuários continua protegido em POST /usuario.
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

app.post("/usuario", exigirAdministrador, async (req, res) => {
    try {
        const {
            nome,
            email,
            senha,
            cargo,
            setor,
            perfil
        } = req.body || {};

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
        if (
            erro.message === "EMAIL_JA_CADASTRADO" ||
            erro.code === "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                erro: "Este e-mail já está cadastrado."
            });
        }

        console.error("Erro ao cadastrar usuário:", erro);

        return res.status(500).json({
            erro: "Erro ao cadastrar usuário."
        });
    }
});

app.get("/usuarios", exigirAdministrador, async (req, res) => {
    try {
        const usuarios = await listarUsuarios();
        return res.json(usuarios);
    } catch (erro) {
        console.error("Erro ao listar usuários:", erro);

        return res.status(500).json({
            erro: "Erro ao buscar usuários."
        });
    }
});

app.get("/usuarios/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            erro: "ID de usuário inválido."
        });
    }

    try {
        const usuario = await buscarUsuarioPorId(id);

        if (!usuario) {
            return res.status(404).json({
                erro: "Usuário não encontrado."
            });
        }

        return res.json(usuario);
    } catch (erro) {
        console.error("Erro ao buscar usuário:", erro);

        return res.status(500).json({
            erro: "Erro ao buscar usuário."
        });
    }
});

app.put("/usuarios/:id", exigirAdministrador, async (req, res) => {
    const id = Number(req.params.id);

    const {
        nome,
        email,
        cargo,
        setor,
        perfil
    } = req.body || {};

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
        return res.status(400).json({
            erro: "Preencha todos os campos corretamente."
        });
    }

    if (
        id === req.administrador.id_usuario &&
        perfil !== "Administrador"
    ) {
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
            return res.status(404).json({
                erro: "Usuário não encontrado."
            });
        }

        return res.json({
            mensagem: "Usuário atualizado com sucesso.",
            usuario
        });
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                erro: "Este e-mail já está cadastrado."
            });
        }

        console.error("Erro ao atualizar usuário:", erro);

        return res.status(500).json({
            erro: "Erro ao atualizar usuário."
        });
    }
});

app.patch(
    "/usuarios/:id/status",
    exigirAdministrador,
    async (req, res) => {
        const id = Number(req.params.id);
        const { status } = req.body || {};

        if (
            !Number.isInteger(id) ||
            id <= 0 ||
            !["Ativo", "Inativo"].includes(status)
        ) {
            return res.status(400).json({
                erro: "ID ou status inválido."
            });
        }

        if (
            id === req.administrador.id_usuario &&
            status === "Inativo"
        ) {
            return res.status(400).json({
                erro: "Você não pode desativar sua própria conta."
            });
        }

        try {
            const usuario = await alterarStatusUsuario(id, status);

            if (!usuario) {
                return res.status(404).json({
                    erro: "Usuário não encontrado."
                });
            }

            return res.json({
                mensagem: `Usuário ${status.toLowerCase()} com sucesso.`,
                usuario
            });
        } catch (erro) {
            console.error("Erro ao alterar status:", erro);

            return res.status(500).json({
                erro: "Erro ao alterar status do usuário."
            });
        }
    }
);

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
// CATEGORIAS
// ======================================================

app.get("/categorias", async (req, res) => {
    try {
        return res.json(await listarCategorias());
    } catch (erro) {
        console.error("Erro ao buscar categorias:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar categorias."
        });
    }
});

app.get("/categorias/:id", async (req, res) => {
    try {
        const categoria = await buscarCategoriaPorId(
            Number(req.params.id)
        );

        if (!categoria) {
            return res.status(404).json({
                erro: "Categoria não encontrada."
            });
        }

        return res.json(categoria);
    } catch (erro) {
        console.error("Erro ao buscar categoria:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar categoria."
        });
    }
});

app.post("/categorias", async (req, res) => {
    try {
        const { nome, descricao } = req.body || {};

        if (typeof nome !== "string" || !nome.trim()) {
            return res.status(400).json({
                erro: "Informe o nome da categoria."
            });
        }

        const categoria = await criarCategoria(
            nome.trim(),
            descricao
        );

        return res.status(201).json(categoria);
    } catch (erro) {
        console.error("Erro ao criar categoria:", erro);
        return res.status(500).json({
            erro: "Erro ao criar categoria."
        });
    }
});

// ======================================================
// OCORRÊNCIAS
// ======================================================

app.get("/ocorrencias", async (req, res) => {
    try {
        return res.json(await listarOcorrencias());
    } catch (erro) {
        console.error("Erro ao buscar ocorrências:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar ocorrências."
        });
    }
});

app.get("/ocorrencias/:id", async (req, res) => {
    try {
        const ocorrencia = await buscarOcorrenciaPorId(
            Number(req.params.id)
        );

        if (!ocorrencia) {
            return res.status(404).json({
                erro: "Ocorrência não encontrada."
            });
        }

        return res.json(ocorrencia);
    } catch (erro) {
        console.error("Erro ao buscar ocorrência:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar ocorrência."
        });
    }
});

app.post("/ocorrencias", async (req, res) => {
    try {
        const {
            id_usuario,
            id_categoria,
            titulo,
            descricao,
            prioridade
        } = req.body || {};

        if (
            !id_usuario ||
            !id_categoria ||
            !titulo?.trim?.() ||
            !descricao?.trim?.() ||
            !prioridade
        ) {
            return res.status(400).json({
                erro: "Preencha todos os campos obrigatórios."
            });
        }

        const resultado = await criarOcorrencia({
            id_usuario,
            id_categoria,
            titulo: titulo.trim(),
            descricao: descricao.trim(),
            prioridade
        });

        return res.status(201).json({
            mensagem: "Ocorrência criada com sucesso!",
            ...resultado
        });
    } catch (erro) {
        console.error("Erro ao criar ocorrência:", erro);
        return res.status(500).json({
            erro: "Erro ao criar ocorrência."
        });
    }
});

app.put("/ocorrencias/:id", async (req, res) => {
    try {
        const resultado = await atualizarOcorrencia(
            Number(req.params.id),
            req.body
        );

        return res.json({
            mensagem: "Ocorrência atualizada.",
            resultado
        });
    } catch (erro) {
        console.error("Erro ao atualizar ocorrência:", erro);
        return res.status(500).json({
            erro: "Erro ao atualizar ocorrência."
        });
    }
});

app.delete("/ocorrencias/:id", async (req, res) => {
    try {
        await excluirOcorrencia(Number(req.params.id));

        return res.json({
            mensagem: "Ocorrência excluída."
        });
    } catch (erro) {
        console.error("Erro ao excluir ocorrência:", erro);
        return res.status(500).json({
            erro: "Erro ao excluir ocorrência."
        });
    }
});

// ======================================================
// EQUIPES
// ======================================================

app.get("/equipes", async (req, res) => {
    try {
        return res.json(await listarEquipes());
    } catch (erro) {
        console.error("Erro ao buscar equipes:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar equipes."
        });
    }
});

// ======================================================
// NOTAS
// ======================================================

app.get("/usuarios/:id/notas", async (req, res) => {
    try {
        return res.json(
            await listarNotasDoUsuario(Number(req.params.id))
        );
    } catch (erro) {
        console.error("Erro ao buscar notas:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar notas."
        });
    }
});

app.post("/notas", async (req, res) => {
    try {
        const {
            id_usuario,
            titulo,
            conteudo,
            tipo
        } = req.body || {};

        if (
            !id_usuario ||
            !titulo?.trim?.() ||
            !conteudo?.trim?.()
        ) {
            return res.status(400).json({
                erro: "Informe usuário, título e conteúdo."
            });
        }

        const resultado = await criarNotaBD({
            id_usuario,
            titulo: titulo.trim(),
            conteudo: conteudo.trim(),
            tipo
        });

        return res.status(201).json({
            mensagem: "Nota criada.",
            ...resultado
        });
    } catch (erro) {
        console.error("Erro ao criar nota:", erro);
        return res.status(500).json({
            erro: "Erro ao criar nota."
        });
    }
});

app.delete("/notas/:id", async (req, res) => {
    try {
        const removidas = await excluirNotaBD(
            Number(req.params.id),
            req.query.id_usuario
        );

        if (!removidas) {
            return res.status(404).json({
                erro: "Nota não encontrada."
            });
        }

        return res.json({
            mensagem: "Nota excluída."
        });
    } catch (erro) {
        console.error("Erro ao excluir nota:", erro);
        return res.status(500).json({
            erro: "Erro ao excluir nota."
        });
    }
});

app.post("/notas/ia", async (req, res) => {
    try {
        const notas = Array.isArray(req.body?.notas)
            ? req.body.notas
            : [];

        if (!notas.length) {
            return res.status(400).json({
                mensagem: "Não há notas para analisar."
            });
        }

        const texto = notas
            .map((nota, indice) => {
                return `Nota ${indice + 1} (${nota.tipo || "Geral"}, ${nota.data || "sem data"}): ${nota.titulo || "Sem título"}\n${nota.conteudo || ""}`;
            })
            .join("\n\n");

        const resposta = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents:
                "Resuma as notas abaixo para um administrador da prefeitura, destacando temas recorrentes, pontos de atenção e próximos passos. Responda em português, em até 8 linhas.\n\n" +
                texto
        });

        return res.json({
            resumo: resposta.text || "A IA não retornou um resumo."
        });
    } catch (erro) {
        console.error("Erro na análise das notas:", erro);
        return res.status(500).json({
            mensagem: "Não foi possível gerar a análise."
        });
    }
});

// ======================================================
// LOCALIZAÇÕES
// ======================================================

app.get("/localizacoes", async (req, res) => {
    try {
        return res.json(await listarLocalizacoes());
    } catch (erro) {
        console.error("Erro ao buscar localizações:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar localizações."
        });
    }
});

app.get("/localizacoes/:idOcorrencia", async (req, res) => {
    try {
        const localizacao = await buscarLocalizacao(
            Number(req.params.idOcorrencia)
        );

        if (!localizacao) {
            return res.status(404).json({
                erro: "Localização não encontrada."
            });
        }

        return res.json(localizacao);
    } catch (erro) {
        console.error("Erro ao buscar localização:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar localização."
        });
    }
});

app.post("/localizacoes", async (req, res) => {
    try {
        const resultado = await criarLocalizacao(req.body);

        return res.status(201).json({
            mensagem: "Localização cadastrada.",
            ...resultado
        });
    } catch (erro) {
        console.error("Erro ao cadastrar localização:", erro);
        return res.status(500).json({
            erro: "Erro ao cadastrar localização."
        });
    }
});

// ======================================================
// HISTÓRICO DAS OCORRÊNCIAS
// ======================================================

app.get("/ocorrencias/:id/historico", async (req, res) => {
    try {
        return res.json(
            await listarHistorico(Number(req.params.id))
        );
    } catch (erro) {
        console.error("Erro ao buscar histórico:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar histórico."
        });
    }
});

app.post("/historico", async (req, res) => {
    try {
        const resultado = await criarHistorico(req.body);

        return res.status(201).json({
            mensagem: "Histórico registrado.",
            ...resultado
        });
    } catch (erro) {
        console.error("Erro ao registrar histórico:", erro);
        return res.status(500).json({
            erro: "Erro ao registrar histórico."
        });
    }
});

// ======================================================
// ATENDIMENTOS
// ======================================================

app.get("/ocorrencias/:id/atendimentos", async (req, res) => {
    try {
        return res.json(
            await listarAtendimentos(Number(req.params.id))
        );
    } catch (erro) {
        console.error("Erro ao buscar atendimentos:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar atendimentos."
        });
    }
});

app.post("/atendimentos", async (req, res) => {
    try {
        const resultado = await criarAtendimento(req.body);

        return res.status(201).json({
            mensagem: "Atendimento criado.",
            ...resultado
        });
    } catch (erro) {
        console.error("Erro ao criar atendimento:", erro);
        return res.status(500).json({
            erro: "Erro ao criar atendimento."
        });
    }
});

// ======================================================
// NOTIFICAÇÕES
// ======================================================

app.get("/usuarios/:id/notificacoes", async (req, res) => {
    try {
        return res.json(
            await listarNotificacoes(Number(req.params.id))
        );
    } catch (erro) {
        console.error("Erro ao buscar notificações:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar notificações."
        });
    }
});

app.post("/notificacoes", async (req, res) => {
    try {
        const resultado = await criarNotificacao(req.body);

        return res.status(201).json({
            mensagem: "Notificação criada.",
            ...resultado
        });
    } catch (erro) {
        console.error("Erro ao criar notificação:", erro);
        return res.status(500).json({
            erro: "Erro ao criar notificação."
        });
    }
});

app.put("/notificacoes/:id/lida", async (req, res) => {
    try {
        await marcarComoLida(Number(req.params.id));

        return res.json({
            mensagem: "Notificação marcada como lida."
        });
    } catch (erro) {
        console.error("Erro ao atualizar notificação:", erro);
        return res.status(500).json({
            erro: "Erro ao atualizar notificação."
        });
    }
});

// ======================================================
// ANEXOS
// ======================================================

app.get("/ocorrencias/:id/anexos", async (req, res) => {
    try {
        return res.json(
            await listarAnexos(Number(req.params.id))
        );
    } catch (erro) {
        console.error("Erro ao buscar anexos:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar anexos."
        });
    }
});

app.post("/anexos", async (req, res) => {
    try {
        const resultado = await criarAnexo(req.body);

        return res.status(201).json({
            mensagem: "Anexo registrado.",
            ...resultado
        });
    } catch (erro) {
        console.error("Erro ao registrar anexo:", erro);
        return res.status(500).json({
            erro: "Erro ao registrar anexo."
        });
    }
});

// ======================================================
// DENÚNCIAS
// Aceita o formulário antigo e o formulário público.
// ======================================================

app.post("/denuncia", async (req, res) => {
    const body = req.body || {};

    const usuarioRaw = body.id_usuario ?? body.id ?? null;

    const usuarioId =
        usuarioRaw === null || usuarioRaw === ""
            ? null
            : Number(usuarioRaw);

    const categoriaNome = String(
        body.categoria || ""
    ).trim();

    const categoriaRaw = body.id_categoria ?? null;

    const descricao = String(
        body.descricao || ""
    ).trim();

    const cidade = String(
        body.cidade || ""
    ).trim();

    const bairro = String(
        body.bairro || ""
    ).trim();

    const rua = String(
        body.rua || body.endereco || "Não informado"
    ).trim() || "Não informado";

    const titulo = String(
        body.titulo ||
        `${categoriaNome || "Relato cidadão"}: ${descricao.slice(0, 90)}`
    ).trim();

    const gravidadeBruta = String(
        body.gravidade || body.prioridade || "media"
    ).trim().toLowerCase();

    const prioridades = {
        baixa: "Baixa",
        media: "Média",
        média: "Média",
        alta: "Alta"
    };

    const prioridade =
        prioridades[gravidadeBruta] || "Média";

    if (
        (
            usuarioId !== null &&
            (!Number.isInteger(usuarioId) || usuarioId <= 0)
        ) ||
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
                `SELECT id_usuario
                 FROM usuarios
                 WHERE id_usuario = ?
                   AND status = 'Ativo'
                 LIMIT 1`,
                [usuarioId]
            );

            if (!usuarios.length) {
                return res.status(400).json({
                    erro: "Usuário inexistente ou inativo."
                });
            }
        }

        let categoriaId = Number(categoriaRaw);

        if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
            const [encontradas] = await db.execute(
                `SELECT id_categoria
                 FROM categorias
                 WHERE nome = ?
                 LIMIT 1`,
                [categoriaNome]
            );

            if (encontradas.length) {
                categoriaId = encontradas[0].id_categoria;
            } else {
                const [nova] = await db.execute(
                    `INSERT INTO categorias (nome, descricao)
                     VALUES (?, ?)`,
                    [
                        categoriaNome,
                        "Categoria criada pelo formulário público de denúncias"
                    ]
                );

                categoriaId = nova.insertId;
            }
        } else {
            const categoria = await buscarCategoriaPorId(categoriaId);

            if (!categoria) {
                return res.status(400).json({
                    erro: "A categoria informada não existe."
                });
            }
        }

        const resultado = await criarOcorrencia({
            id_usuario: usuarioId,
            id_categoria: categoriaId,
            titulo,
            descricao,
            prioridade
        });

        const idOcorrencia = resultado.id_ocorrencia;

        if (!idOcorrencia) {
            throw new Error(
                "A criação da ocorrência não retornou id_ocorrencia."
            );
        }

        await criarLocalizacao({
            id_ocorrencia: idOcorrencia,
            endereco: rua,
            bairro,
            cidade,
            latitude: body.latitude ?? null,
            longitude: body.longitude ?? null
        });

        return res.status(201).json({
            mensagem: "Denúncia registrada com sucesso.",
            id_ocorrencia: idOcorrencia,
            protocolo: `NX-${String(idOcorrencia).padStart(6, "0")}`
        });
    } catch (erro) {
        console.error("Erro ao registrar denúncia:", erro);

        return res.status(500).json({
            erro: "Não foi possível registrar a denúncia. Confira o banco de dados e os módulos de ocorrências e localizações."
        });
    }
});

// ======================================================
// PREFERÊNCIAS DOS USUÁRIOS
// ======================================================

app.get(
    "/usuarios/:id/preferencias",
    async (req, res) => {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID inválido."
            });
        }

        try {
            const [usuarios] = await db.execute(
                `SELECT id_usuario
                 FROM usuarios
                 WHERE id_usuario = ?
                 LIMIT 1`,
                [id]
            );

            if (!usuarios.length) {
                return res.status(404).json({
                    erro: "Usuário não encontrado."
                });
            }

            const [linhas] = await db.execute(
                `SELECT notificacoes, alertas_urgentes
                 FROM preferencias_usuarios
                 WHERE id_usuario = ?
                 LIMIT 1`,
                [id]
            );

            if (!linhas.length) {
                await db.execute(
                    `INSERT INTO preferencias_usuarios
                        (id_usuario, notificacoes, alertas_urgentes)
                     VALUES (?, 1, 1)`,
                    [id]
                );

                return res.json({
                    notificacoes: true,
                    alertasUrgentes: true
                });
            }

            return res.json({
                notificacoes: Boolean(linhas[0].notificacoes),
                alertasUrgentes: Boolean(
                    linhas[0].alertas_urgentes
                )
            });
        } catch (erro) {
            console.error("Erro ao buscar preferências:", erro);

            return res.status(500).json({
                erro: "Erro ao buscar preferências."
            });
        }
    }
);

app.put(
    "/usuarios/:id/preferencias",
    async (req, res) => {
        const id = Number(req.params.id);

        const {
            notificacoes,
            alertasUrgentes
        } = req.body || {};

        if (
            !Number.isInteger(id) ||
            id <= 0 ||
            typeof notificacoes !== "boolean" ||
            typeof alertasUrgentes !== "boolean"
        ) {
            return res.status(400).json({
                erro: "Dados inválidos."
            });
        }

        try {
            await db.execute(
                `INSERT INTO preferencias_usuarios
                    (id_usuario, notificacoes, alertas_urgentes)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    notificacoes = VALUES(notificacoes),
                    alertas_urgentes = VALUES(alertas_urgentes)`,
                [
                    id,
                    Number(notificacoes),
                    Number(alertasUrgentes)
                ]
            );

            return res.json({
                mensagem: "Preferências salvas com sucesso."
            });
        } catch (erro) {
            console.error("Erro ao salvar preferências:", erro);

            return res.status(500).json({
                erro: "Erro ao salvar preferências."
            });
        }
    }
);

// ======================================================
// INICIALIZAÇÃO
// ======================================================

const PORT = Number(process.env.PORT) || 3000;

prepararTabelaChat()
    .then(() => {
        servidorHttp.listen(PORT, () => {
            console.log(
                `Servidor rodando em http://localhost:${PORT}`
            );

            console.log(
                "Chat em tempo real preparado; tabela mensagens_chat verificada."
            );
        });
    })
    .catch((erro) => {
        console.error(
            "Não foi possível preparar a tabela do chat. Confira o MySQL:",
            erro
        );

        process.exit(1);
    });