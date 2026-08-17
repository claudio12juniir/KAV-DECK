import { useEffect, useRef, useState } from "react";
import { Input } from "../../components/ui/Input.jsx";
import { searchProdutos } from "./produtosApi.js";
import "./Autocomplete.css";

export function ProdutoAutocomplete({ onSelecionar }) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [aberto, setAberto] = useState(false);
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
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(timeoutRef.current);
  }, [termo]);

  return (
    <div className="autocomplete">
      <Input
        label="Adicionar produto"
        placeholder="Buscar por código ou descrição..."
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        onFocus={() => resultados.length && setAberto(true)}
        hint={buscando ? "Buscando..." : "Digite ao menos 2 letras"}
      />
      {aberto && resultados.length > 0 && (
        <ul className="autocomplete-list">
          {resultados.map((produto) => (
            <li key={produto.id}>
              <button
                type="button"
                onClick={() => {
                  onSelecionar(produto);
                  setAberto(false);
                  setTermo("");
                }}
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
