import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { API_URL } from "../api";
import "./Denuncia.css";

const MAX_DESCRICAO = 500;
const MIN_DESCRICAO = 10;
const ETAPAS = [
  { id: "voce", titulo: "Você", campos: ["nome", "anonimo"] },
  { id: "lugar", titulo: "O lugar", campos: ["cep", "cidade", "bairro", "rua"] },
  { id: "problema", titulo: "O problema", campos: ["categoria", "descricao", "gravidade"] },
];
const ULTIMA = ETAPAS.length - 1;
const CATEGORIAS = [
  "Vazamento de água ou esgoto", "Buraco ou rua danificada", "Iluminação pública",
  "Lixo ou entulho acumulado", "Alagamento ou drenagem", "Árvores e áreas verdes", "Outro assunto",
];
const GRAVIDADES = [
  { value: "baixa", nivel: 1, titulo: "Pode esperar", desc: "Incomoda, mas não há risco agora." },
  { value: "media", nivel: 2, titulo: "Merece atenção", desc: "Atrapalha o dia a dia de quem passa por ali." },
  { value: "alta", nivel: 3, titulo: "É urgente", desc: "Oferece risco à saúde ou à segurança." },
];
const obrigatorio = (mensagem) => ({ validate: (v) => (v ?? "").trim().length > 0 || mensagem });

function Denuncia() {
  const { register, handleSubmit, trigger, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    mode: "onTouched", defaultValues: { gravidade: "media", anonimo: false, categoria: "" },
  });
  const [etapa, setEtapa] = useState(0);
  const [enviado, setEnviado] = useState(null);
  const [erroEnvio, setErroEnvio] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [avisoCep, setAvisoCep] = useState("");
  const [coords, setCoords] = useState(null);
  const [msgLocal, setMsgLocal] = useState("");
  const [copiado, setCopiado] = useState(false);
  const tituloRef = useRef(null);
  const ultimoCep = useRef("");
  const enviando = useRef(false);
  const anonimo = watch("anonimo");
  const descricao = watch("descricao") ?? "";

  useEffect(() => { tituloRef.current?.focus(); }, [etapa, enviado]);

  async function buscarCep(e) {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length !== 8) { setAvisoCep(""); return; }
    if (cep === ultimoCep.current) return;
    ultimoCep.current = cep;
    setAvisoCep("");
    setBuscandoCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!r.ok) throw new Error("ViaCEP indisponível");
      const d = await r.json();
      if (ultimoCep.current !== cep) return;
      if (d.erro) { setAvisoCep("Não encontramos esse CEP. Preencha o endereço manualmente."); return; }
      const preencher = (campo, valor) => { if (valor) setValue(campo, valor, { shouldValidate: true }); };
      preencher("cidade", d.localidade); preencher("bairro", d.bairro); preencher("rua", d.logradouro);
      setAvisoCep("Endereço encontrado. Confira e acrescente o número ou referência.");
    } catch { ultimoCep.current = ""; setAvisoCep("Não conseguimos buscar o CEP agora. Preencha o endereço manualmente."); }
    finally { setBuscandoCep(false); }
  }

  function marcarMinhaPosicao() {
    if (!navigator.geolocation) { setMsgLocal("Seu navegador não permite descobrir a localização. O endereço já ajuda."); return; }
    setMsgLocal("Procurando sua posição no mapa…");
    navigator.geolocation.getCurrentPosition(({ coords: c }) => {
      setCoords({ latitude: c.latitude, longitude: c.longitude }); setMsgLocal("Ponto exato marcado.");
    }, () => { setCoords(null); setMsgLocal("Não conseguimos obter sua posição. Confira o endereço informado."); }, { enableHighAccuracy: true, timeout: 10000 });
  }

  async function avancar() {
    const ok = await trigger(ETAPAS[etapa].campos);
    if (ok) setEtapa((e) => Math.min(e + 1, ULTIMA));
  }
  function aoEnviarFormulario(e) {
    if (etapa < ULTIMA) { e.preventDefault(); void avancar(); return; }
    return handleSubmit(enviar, aoInvalido)(e);
  }
  function aoInvalido(errs) {
    const i = ETAPAS.findIndex((et) => et.campos.some((c) => errs[c]));
    if (i >= 0) setEtapa(i);
  }

  async function enviar(dados) {
    if (enviando.current) return;
    enviando.current = true; setErroEnvio("");
    const usuarioSalvo = localStorage.getItem("usuario");
    let usuarioId = null;
    if (!dados.anonimo && usuarioSalvo) {
      try { usuarioId = JSON.parse(usuarioSalvo)?.id_usuario ?? JSON.parse(usuarioSalvo)?.id ?? null; } catch { usuarioId = null; }
    }
    const corpo = {
      id_usuario: usuarioId,
      nome: dados.anonimo ? "" : (dados.nome ?? "").trim(),
      anonimo: Boolean(dados.anonimo),
      categoria: dados.categoria,
      titulo: `${dados.categoria}: ${dados.descricao.trim().slice(0, 90)}`,
      descricao: dados.descricao.trim(),
      gravidade: dados.gravidade,
      prioridade: dados.gravidade,
      cep: (dados.cep ?? "").trim(),
      cidade: dados.cidade.trim(), bairro: dados.bairro.trim(), rua: dados.rua.trim(),
      latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null,
    };
    try {
      const resp = await fetch(`${API_URL}/denuncia`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
      const resultado = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(resultado.erro || `Não foi possível registrar (erro ${resp.status}).`);
      setEnviado(resultado && typeof resultado === "object" ? resultado : {});
    } catch (e) { setErroEnvio(e.message || "Não conseguimos enviar agora. Confira a conexão e tente novamente."); }
    finally { enviando.current = false; }
  }

  function recomecar() {
    reset({ gravidade: "media", anonimo: false, categoria: "" }); ultimoCep.current = "";
    setAvisoCep(""); setCoords(null); setMsgLocal(""); setCopiado(false); setErroEnvio(""); setEtapa(0); setEnviado(null);
  }
  async function copiarProtocolo(texto) {
    try { await navigator.clipboard.writeText(String(texto)); setCopiado(true); window.setTimeout(() => setCopiado(false), 1800); } catch { setErroEnvio("Não foi possível copiar. Anote o número do protocolo."); }
  }

  if (enviado) {
    const protocolo = enviado.protocolo ?? (enviado.id_ocorrencia ? `#${enviado.id_ocorrencia}` : enviado.id ? `#${enviado.id}` : null);
    return <main className="relato"><section className="cartao sucesso" aria-labelledby="sucesso-titulo">
      <div className="sucesso__selo" aria-hidden="true">✓</div>
      <h1 id="sucesso-titulo" ref={tituloRef} tabIndex={-1}>Obrigado por cuidar do seu bairro</h1>
      <p className="sucesso__lead">Seu relato foi enviado. A equipe poderá conferir as informações e encaminhar o problema para quem resolve.</p>
      {protocolo && <div className="protocolo"><span className="protocolo__rotulo">Número do seu relato</span><strong className="protocolo__codigo">{protocolo}</strong><button type="button" className="botao botao--suave" onClick={() => copiarProtocolo(protocolo)}>{copiado ? "Copiado!" : "Copiar número"}</button><small>Guarde este número para consultar o relato.</small></div>}
      <h2 className="sucesso__subtitulo">O que acontece agora</h2>
      <ol className="linha-tempo"><li className="linha-tempo__item is-feito"><span className="linha-tempo__marcador">✓</span><div><strong>Recebemos seu relato</strong><p>O registro foi enviado ao sistema.</p></div></li><li className="linha-tempo__item"><span className="linha-tempo__marcador">2</span><div><strong>As informações serão conferidas</strong><p>A equipe responsável poderá verificar o local e a descrição.</p></div></li><li className="linha-tempo__item"><span className="linha-tempo__marcador">3</span><div><strong>O caso poderá ser encaminhado</strong><p>O andamento depende da análise da equipe responsável.</p></div></li></ol>
      <button type="button" className="botao botao--primario" onClick={recomecar}>Relatar outro problema</button>
    </section></main>;
  }

  return <main className="relato">
    <header className="relato__topo"><span className="selo">Cuidar da cidade</span><h1>Conte o que está acontecendo no seu bairro</h1><p>Buraco na rua, vazamento, lixo acumulado ou poste apagado. São só três etapas rápidas.</p></header>
    <form className="cartao" onSubmit={aoEnviarFormulario} noValidate>
      <ol className="passos" aria-label="Etapas do relato">{ETAPAS.map((e, i) => <li key={e.id} className={`passos__item${i === etapa ? " is-atual" : ""}${i < etapa ? " is-feito" : ""}`} aria-current={i === etapa ? "step" : undefined}><span className="passos__num">{i < etapa ? "✓" : i + 1}</span><span className="passos__nome">{e.titulo}</span></li>)}</ol>
      <section hidden={etapa !== 0} className="etapa"><h2 ref={etapa === 0 ? tituloRef : null} tabIndex={-1}>Primeiro, quem está contando?</h2><p className="etapa__apoio">Seu nome é opcional. Você também pode enviar sem se identificar.</p>
        <div className="campo"><label htmlFor="nome">Como podemos te chamar? <span className="opcional">(opcional)</span></label><input id="nome" autoComplete="name" placeholder="Seu nome ou apelido" disabled={anonimo} aria-invalid={!!errors.nome} {...register("nome", { validate: (v) => anonimo || !(v ?? "").trim() || true })} /></div>
        <label className="opcao-anonima"><input type="checkbox" {...register("anonimo")} /><span><strong>Prefiro não me identificar</strong><small>Seu nome não será enviado com o relato.</small></span></label>
      </section>
      <section hidden={etapa !== 1} className="etapa"><h2 ref={etapa === 1 ? tituloRef : null} tabIndex={-1}>Onde fica o problema?</h2><p className="etapa__apoio">O endereço ajuda a equipe a encontrar o local.</p>
        <div className="campo"><label htmlFor="cep">CEP <span className="opcional">(opcional)</span></label><input id="cep" inputMode="numeric" maxLength={9} placeholder="88800-000" autoComplete="postal-code" {...register("cep", { onBlur: buscarCep })}/><small className="dica" aria-live="polite">{buscandoCep ? "Procurando o endereço…" : avisoCep}</small></div>
        <div className="grade"><div className="campo"><label htmlFor="cidade">Cidade</label><input id="cidade" autoComplete="address-level2" placeholder="Ex.: Criciúma" aria-invalid={!!errors.cidade} {...register("cidade", obrigatorio("Informe a cidade."))}/>{errors.cidade && <small className="erro">{errors.cidade.message}</small>}</div><div className="campo"><label htmlFor="bairro">Bairro</label><input id="bairro" placeholder="Nome do bairro" aria-invalid={!!errors.bairro} {...register("bairro", obrigatorio("Informe o bairro."))}/>{errors.bairro && <small className="erro">{errors.bairro.message}</small>}</div></div>
        <div className="campo"><label htmlFor="rua">Rua e número (ou referência)</label><input id="rua" autoComplete="street-address" placeholder="Rua, número ou ponto de referência" aria-invalid={!!errors.rua} {...register("rua", obrigatorio("Informe a rua ou uma referência."))}/>{errors.rua && <small className="erro">{errors.rua.message}</small>}</div>
        <div className="local"><button type="button" className="botao botao--contorno" onClick={marcarMinhaPosicao}>⌖ Estou no local, marcar minha posição</button><small className={`dica${coords ? " dica--ok" : ""}`} aria-live="polite">{msgLocal || "Opcional. Ajuda a equipe a encontrar o ponto no mapa."}</small></div>
      </section>
      <section hidden={etapa !== 2} className="etapa"><h2 ref={etapa === 2 ? tituloRef : null} tabIndex={-1}>O que você viu?</h2><p className="etapa__apoio">Conte do seu jeito. Diga há quanto tempo acontece e quem é afetado.</p>
        <div className="campo"><label htmlFor="categoria">Que tipo de problema é?</label><select id="categoria" aria-invalid={!!errors.categoria} {...register("categoria", { required: "Escolha uma categoria." })}><option value="">Escolha uma opção</option>{CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}</select>{errors.categoria && <small className="erro">{errors.categoria.message}</small>}</div>
        <div className="campo"><label htmlFor="descricao">Descreva a situação</label><textarea id="descricao" rows={5} maxLength={MAX_DESCRICAO} placeholder="Ex.: O cano estourou há três dias e a água corre pela calçada…" aria-invalid={!!errors.descricao} {...register("descricao", { validate: v => { const n = (v ?? "").trim().length; if (!n) return "Conte o que está acontecendo."; if (n < MIN_DESCRICAO) return "Escreva pelo menos 10 caracteres."; return true; } })}/><div className="campo__rodape">{errors.descricao ? <small className="erro">{errors.descricao.message}</small> : <span/>}<small className="dica">{descricao.length}/{MAX_DESCRICAO}</small></div></div>
        <fieldset className="gravidade"><legend>Qual a urgência?</legend><div className="gravidade__lista">{GRAVIDADES.map(g => <label key={g.value} className="gravidade__cartao"><input type="radio" value={g.value} {...register("gravidade", { required: true })}/><span className="gravidade__corpo"><span className={`barras nivel-${g.nivel}`} aria-hidden="true"><i/><i/><i/></span><strong>{g.titulo}</strong><small>{g.desc}</small></span></label>)}</div></fieldset><p className="nota-envio">Ao enviar, o relato será registrado para análise da equipe.</p>
      </section>
      {erroEnvio && <p className="alerta" role="alert">{erroEnvio}</p>}
      <div className="navegacao">{etapa > 0 ? <button type="button" className="botao botao--suave" onClick={() => setEtapa(e => e - 1)}>Voltar</button> : <span/>}{etapa < ULTIMA ? <button key="continuar" type="submit" className="botao botao--primario">Continuar</button> : <button key="enviar" type="submit" className="botao botao--primario" disabled={isSubmitting}>{isSubmitting ? "Enviando…" : "Enviar meu relato"}</button>}</div>
    </form>
  </main>;
}
export default Denuncia;
