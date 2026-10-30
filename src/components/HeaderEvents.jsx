
export const HEADER_EVENT = "header-acao";

export function acionarHeader(acao) {
  window.dispatchEvent(
    new CustomEvent(HEADER_EVENT, {
      detail: acao,
    })
  );
}
