import { useEffect, useRef, useState } from "react";

// Mesmo padrão de busca com debounce dos autocompletes do app web
// (ClienteAutocomplete/FornecedorAutocomplete/ProdutoAutocomplete): espera
// 300ms de pausa na digitação e exige pelo menos 2 caracteres antes de
// bater na API.
export function useBuscaComDebounce(buscar) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (termo.trim().length < 2) {
      setResultados([]);
      return undefined;
    }
    setBuscando(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        const { items } = await buscar(termo.trim());
        setResultados(items);
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termo]);

  function limpar() {
    setTermo("");
    setResultados([]);
  }

  return { termo, setTermo, resultados, buscando, limpar };
}
