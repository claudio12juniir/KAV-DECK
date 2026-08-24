import { useEffect, useRef, useState } from "react";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { searchClientes } from "../api.js";
import "../../shared/Autocomplete.css";

export function ClienteAutocomplete({ selecionado, onSelecionar, onLimpar }) {
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
        const { items } = await searchClientes(termo.trim());
        setResultados(items);
        setAberto(true);
        setIndiceAtivo(-1);
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(timeoutRef.current);
  }, [termo]);

  function selecionar(cliente) {
    onSelecionar(cliente);
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

  if (selecionado) {
    const bloqueado = selecionado.bloqueioFinanceiro === "BLOQUEADO";
    return (
      <div className="autocomplete-selected">
        <div>
          <strong>{selecionado.participante.razaoSocial}</strong>
          <div className="autocomplete-selected-sub">{selecionado.participante.cpfCnpj}</div>
        </div>
        <div className="autocomplete-selected-actions">
          <Badge tone={bloqueado ? "danger" : "success"}>
            {bloqueado ? "Bloqueado" : "Liberado"}
          </Badge>
          <button type="button" className="autocomplete-trocar" onClick={onLimpar}>
            Trocar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="autocomplete">
      <Input
        placeholder="Buscar por nome ou CNPJ/CPF..."
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        onFocus={() => resultados.length && setAberto(true)}
        onKeyDown={handleKeyDown}
        hint={buscando ? "Buscando..." : "Digite ao menos 2 letras"}
      />
      {aberto && resultados.length > 0 && (
        <ul className="autocomplete-list">
          {resultados.map((cliente, index) => (
            <li key={cliente.participanteId}>
              <button
                type="button"
                className={index === indiceAtivo ? "ativo" : undefined}
                onMouseEnter={() => setIndiceAtivo(index)}
                onClick={() => selecionar(cliente)}
              >
                <strong>{cliente.participante.razaoSocial}</strong>
                <span>{cliente.participante.cpfCnpj}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
