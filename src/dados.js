import { API_URL } from "./api";

async function getJson(caminho) {

  const resposta = await fetch(`${API_URL}${caminho}`);

  if (!resposta.ok) {
    throw new Error(`Erro ao buscar dados (${caminho})`);
  }

  return resposta.json();
}

async function enviar(caminho, metodo, corpo) {

  const resposta = await fetch(`${API_URL}${caminho}`, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo)
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao salvar as alterações.");
  }

  return dados;
}

export function usuarioLogado() {

  const salvo = localStorage.getItem("usuario");

  if (!salvo) {
    throw new Error("Faça login para alterar ocorrências.");
  }

  return JSON.parse(salvo);
}

// Ocorrências já com categoria, endereço e data prontos para as telas
export async function buscarOcorrenciasCompletas() {

  const [ocorrencias, localizacoes, categorias] = await Promise.all([
    getJson("/ocorrencias"),
    getJson("/localizacoes"),
    getJson("/categorias")
  ]);

  const localPorOcorrencia = new Map(
    localizacoes.map((l) => [l.id_ocorrencia, l])
  );

  const nomeCategoria = new Map(
    categorias.map((c) => [c.id_categoria, c.nome])
  );

  return ocorrencias.map((o) => {

    const local = localPorOcorrencia.get(o.id_ocorrencia) || {};

    return {
      id: o.id_ocorrencia,
      titulo: o.titulo,
      descricao: o.descricao,
      categoria: nomeCategoria.get(o.id_categoria) || "—",
      bairro: local.bairro || "—",
      rua: local.endereco || "—",
      cidade: local.cidade || "—",
      prioridade: o.prioridade,
      status: o.status,
      impacto: o.observacao_ia || "",
      data: new Date(o.data_registro)
    };
  });
}

export const buscarHistorico = (id) =>
  getJson(`/ocorrencias/${id}/historico`);

export const buscarAtendimentos = (id) =>
  getJson(`/ocorrencias/${id}/atendimentos`);

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

  const usuario = usuarioLogado();

  return enviar("/historico", "POST", {
    id_ocorrencia: ocorrencia.id,
    id_usuario: usuario.id_usuario,
    status_anterior: ocorrencia.status,
    novo_status: novoStatus,
    observacao
  });
}

export async function atualizarStatus(ocorrencia, novoStatus, observacao) {

  await enviar(`/ocorrencias/${ocorrencia.id}`, "PUT", { status: novoStatus });
  await registrarHistorico(ocorrencia, novoStatus, observacao);
}

export function criarAtendimento(idOcorrencia, idEquipe, observacao) {
  return enviar("/atendimentos", "POST", {
    id_ocorrencia: idOcorrencia,
    id_equipe: idEquipe,
    observacao
  });
}


export async function buscarNotas() {
  const usuario = usuarioLogado();
  return getJson(`/usuarios/${usuario.id_usuario}/notas`);
}

export function criarNota(titulo, conteudo, tipo) {
  const usuario = usuarioLogado();
  return enviar("/notas", "POST", {
    id_usuario: usuario.id_usuario,
    titulo,
    conteudo,
    tipo
  });
}

export async function removerNota(id) {
  const usuario = usuarioLogado();
  const resposta = await fetch(
    `${API_URL}/notas/${id}?id_usuario=${usuario.id_usuario}`,
    { method: "DELETE" }
  );

  if (!resposta.ok) {
    throw new Error("Não foi possível excluir a nota.");
  }
}

// Pontos para o mapa: só ocorrências que têm latitude e longitude
export async function buscarPontosMapa() {

  const [ocorrencias, localizacoes] = await Promise.all([
    buscarOcorrenciasCompletas(),
    getJson("/localizacoes")
  ]);

  const localPorOcorrencia = new Map(
    localizacoes.map((l) => [l.id_ocorrencia, l])
  );

  return ocorrencias.flatMap((o) => {

    const l = localPorOcorrencia.get(o.id);

    if (!l || l.latitude == null || l.longitude == null) {
      return [];
    }

    return [{
      id: o.id,
      titulo: o.titulo,
      descricao: o.descricao,
      categoria: o.categoria,
      gravidade: o.prioridade,
      status: o.status,
      endereco: `${l.endereco}, ${l.bairro}, ${l.cidade}`,
      posicao: [Number(l.latitude), Number(l.longitude)]
    }];
  });
}
