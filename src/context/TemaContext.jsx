
import { createContext, useContext, useEffect, useState } from "react";

const TemaContext = createContext(null);

export function TemaProvider({ children }) {
  const [temaClaro, setTemaClaro] = useState(() => {
    return localStorage.getItem("temaClaro") === "true";
  });

  useEffect(() => {
    document.body.classList.toggle("tema-claro", temaClaro);
    localStorage.setItem("temaClaro", String(temaClaro));
  }, [temaClaro]);

  function alternarTema() {
    setTemaClaro((atual) => !atual);
  }

  function definirTema(claro) {
    setTemaClaro(claro);
  }

  return (
    <TemaContext.Provider
      value={{ temaClaro, alternarTema, definirTema }}
    >
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  const contexto = useContext(TemaContext);

  if (!contexto) {
    throw new Error("useTema deve ser usado dentro de TemaProvider");
  }

  return contexto;
}
