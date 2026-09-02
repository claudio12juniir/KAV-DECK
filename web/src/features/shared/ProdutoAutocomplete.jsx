import { useEffect, useRef, useState } from "react";
import { Input } from "../../components/ui/Input.jsx";
import { searchProdutos } from "./produtosApi.js";
import "./Autocomplete.css";

export function ProdutoAutocomplete({ onSelecionar, label = "Adicionar produto" }) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [indiceAtivo, setIndiceAtivo] = useState(-1);
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
        const { items } = await searchProdutos(termo.trim());
        setResultados(items);
        setAberto(true);
        setIndiceAtivo(-1);
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(timeoutRef.current);
  }, [termo]);

  function selecionar(produto) {
    onSelecionar(produto);
    setAberto(false);
    setTermo("");
  }

  // Setas navegam a lista sem tirar o foco do campo de texto; Enter
  // confirma o item destacado, Escape fecha sem escolher nada.
  function handleKeyDown(e) {
    if (!aberto || resultados.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceAtivo((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceAtivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && indiceAtivo >= 0) {
      e.preventDefault();
      selecionar(resultados[indiceAtivo]);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  }

  return (
    <div className="autocomplete">
      <Input
        label={label}
        placeholder="Buscar por código ou descrição..."
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        onFocus={() => resultados.length && setAberto(true)}
        onKeyDown={handleKeyDown}
        hint={buscando ? "Buscando..." : "Digite ao menos 2 letras"}
      />
      {aberto && resultados.length > 0 && (
        <ul className="autocomplete-list">
          {resultados.map((produto, index) => (
            <li key={produto.id}>
              <button
                type="button"
                className={index === indiceAtivo ? "ativo" : undefined}
                onMouseEnter={() => setIndiceAtivo(index)}
                onClick={() => selecionar(produto)}
              >
                <strong>{produto.descricao}</strong>
                <span>{produto.codigo}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
