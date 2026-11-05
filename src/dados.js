import { API_URL, cabecalhosAutenticados, lerUsuarioSalvo } from "./api";

// ======================================================
// Camada única de acesso à API: todas as telas passam por aqui
// ======================================================

async function lerResposta(resposta) {
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.erro || dados.mensagem || `Erro ${resposta.status} na requisição.`);
  }

  return dados;
}

async function getJson(caminho) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    headers: cabecalhosAutenticados(),
  });
  return lerResposta(resposta);
}

async function enviar(caminho, metodo, corpo) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    method: metodo,
    headers: cabecalhosAutenticados({ "Content-Type": "application/json" }),
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  return lerResposta(resposta);
}

export function usuarioLogado() {
  const usuario = lerUsuarioSalvo();

  if (!usuario) {
    throw new Error("Faça login para continuar.");
  }

  return usuario;
}

// ======================================================
// Ocorrências
// ======================================================

const dataDoBanco = (valor) => (valor ? new Date(valor) : null);
// Data no formato AAAA-MM-DD, usando o dia local (evita deslocar um dia pelo fuso)
const dataISO = (valor) => {
  const d = dataDoBanco(valor);
  if (!d || Number.isNaN(d.getTime())) return "";
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
};

// Mapeia uma linha de /ocorrencias para o formato usado pelas telas
export function formatarOcorrencia(o) {
  return {
    id: o.id_ocorrencia,
    titulo: o.titulo,
    descricao: o.descricao,
    categoria: o.categoria_nome || "—",
    categoriaId: o.id_categoria,
    bairro: o.bairro || "—",
    rua: o.endereco || "—",
    endereco: o.endereco || "",
    cidade: o.cidade || "—",
    latitude: o.latitude == null ? null : Number(o.latitude),
    longitude: o.longitude == null ? null : Number(o.longitude),
    prioridade: o.prioridade,
    status: o.status,
    responsavel: o.responsavel || "",
    prazo: dataISO(o.prazo),
    orcamentoEstimado: Number(o.orcamento_estimado || 0),
    orcamentoAprovado: Number(o.orcamento_aprovado || 0),
    orcamentoGasto: Number(o.orcamento_gasto || 0),
    impacto: o.observacao_ia || "",
    data: dataDoBanco(o.data_registro),
    usuario: o.usuario_nome || "Denúncia anônima",
  };
}

export async function buscarOcorrenciasCompletas() {
  const lista = await getJson("/ocorrencias");
  return lista.map(formatarOcorrencia);
}

export async function buscarOcorrencia(id) {
  return formatarOcorrencia(await getJson(`/ocorrencias/${id}`));
}

export async function criarOcorrenciaPainel(dados) {
  return enviar("/ocorrencias", "POST", dados);
}

export async function atualizarOcorrencia(id, alteracoes) {
  const resposta = await enviar(`/ocorrencias/${id}`, "PUT", alteracoes);
  return formatarOcorrencia(resposta.ocorrencia);
}

export async function excluirOcorrencia(id) {
  return enviar(`/ocorrencias/${id}`, "DELETE");
}

// Atualiza o status; o servidor registra a mudança no histórico automaticamente
export async function atualizarStatus(ocorrencia, novoStatus, observacao) {
  return enviar(`/ocorrencias/${ocorrencia.id}`, "PUT", {
    status: novoStatus,
    observacao,
  });
}

// Pontos para o mapa: só ocorrências com coordenadas
export async function buscarPontosMapa() {
  const ocorrencias = await buscarOcorrenciasCompletas();

  return ocorrencias.flatMap((o) => {
    if (o.latitude == null || o.longitude == null) return [];

    return [
      {
        id: o.id,
        titulo: o.titulo,
        descricao: o.descricao,
        categoria: o.categoria,
        gravidade: o.prioridade,
        status: o.status,
        endereco: `${o.rua}, ${o.bairro}, ${o.cidade}`,
        posicao: [o.latitude, o.longitude],
      },
    ];
  });
}

export async function buscarEstatisticas() {
  return getJson("/estatisticas");
}

// ======================================================
// Histórico, atendimentos e equipes
// ======================================================

export const buscarHistorico = (id) => getJson(`/ocorrencias/${id}/historico`);

export const buscarAtendimentos = (id) => getJson(`/ocorrencias/${id}/atendimentos`);

export const buscarEquipes = () => getJson("/equipes");

export function formatarHistorico(h) {
  return `${h.novo_status}${h.observacao ? ` — ${h.observacao}` : ""}`;
}

export async function encontrarEquipe(nome) {
  const equipes = await buscarEquipes();
  const alvo = nome.trim().toLowerCase();

  return equipes.find((e) => e.nome.toLowerCase() === alvo) || null;
}

export function registrarHistorico(ocorrencia, novoStatus, observacao) {
  return enviar("/historico", "POST", {
    id_ocorrencia: ocorrencia.id,
    status_anterior: ocorrencia.status,
    novo_status: novoStatus,
    observacao,
  });
}

export function criarAtendimento(idOcorrencia, idEquipe, observacao) {
  return enviar("/atendimentos", "POST", {
    id_ocorrencia: idOcorrencia,
    id_equipe: idEquipe,
    observacao,
  });
}

// ======================================================
// Acompanhamento: observações, tarefas e histórico
// ======================================================

export const buscarObservacoes = (id) => getJson(`/ocorrencias/${id}/observacoes`);

export const criarObservacao = (id, texto) =>
  enviar(`/ocorrencias/${id}/observacoes`, "POST", { texto });

export const buscarTarefas = (id) => getJson(`/ocorrencias/${id}/tarefas`);

export const criarTarefa = (id, titulo) =>
  enviar(`/ocorrencias/${id}/tarefas`, "POST", { titulo });

export const atualizarTarefa = (id, alteracoes) =>
  enviar(`/tarefas/${id}`, "PUT", alteracoes);

export const excluirTarefa = (id) => enviar(`/tarefas/${id}`, "DELETE");

// ======================================================
// Categorias
// ======================================================

export const buscarCategorias = () => getJson("/categorias");

export const criarCategoria = (dados) => enviar("/categorias", "POST", dados);

export const atualizarCategoria = (id, dados) =>
  enviar(`/categorias/${id}`, "PUT", dados);

export const excluirCategoria = (id) => enviar(`/categorias/${id}`, "DELETE");

// ======================================================
// Notificações
// ======================================================

export async function buscarNotificacoes() {
  const usuario = usuarioLogado();
  return getJson(`/usuarios/${usuario.id_usuario}/notificacoes`);
}

export async function marcarNotificacaoLida(id) {
  return enviar(`/notificacoes/${id}/lida`, "PUT");
}

export async function marcarTodasNotificacoesLidas() {
  const usuario = usuarioLogado();
  return enviar(`/usuarios/${usuario.id_usuario}/notificacoes/lidas`, "PUT");
}

// ======================================================
// Perfil e preferências do usuário logado
// ======================================================

export const buscarPerfil = () => getJson("/perfil");

export const atualizarPerfil = (dados) => enviar("/perfil", "PUT", dados);

export const alterarSenha = (senhaAtual, novaSenha) =>
  enviar("/perfil/senha", "PUT", { senha_atual: senhaAtual, nova_senha: novaSenha });

export async function buscarPreferencias() {
  const usuario = usuarioLogado();
  return getJson(`/usuarios/${usuario.id_usuario}/preferencias`);
}

export async function salvarPreferencias(preferencias) {
  const usuario = usuarioLogado();
  return enviar(`/usuarios/${usuario.id_usuario}/preferencias`, "PUT", preferencias);
}

// ======================================================
// Notas
// ======================================================

export async function buscarNotas() {
  const usuario = usuarioLogado();
  return getJson(`/usuarios/${usuario.id_usuario}/notas`);
}

export function criarNota(titulo, conteudo, tipo) {
  return enviar("/notas", "POST", { titulo, conteudo, tipo });
}

export function removerNota(id) {
  return enviar(`/notas/${id}`, "DELETE");
}

// Lê o texto de uma foto de caderno usando a IA
export async function transcreverImagem(arquivo) {
  const imagem = await new Promise((resolver, rejeitar) => {
    const leitor = new FileReader();
    leitor.onload = () => resolver(leitor.result);
    leitor.onerror = () => rejeitar(new Error("Não foi possível ler a imagem."));
    leitor.readAsDataURL(arquivo);
  });

  return enviar("/notas/transcrever", "POST", {
    imagem,
    mimeType: arquivo.type,
  });
}
