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
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(timeoutRef.current);
  }, [termo]);

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
        hint={buscando ? "Buscando..." : "Digite ao menos 2 letras"}
      />
      {aberto && resultados.length > 0 && (
        <ul className="autocomplete-list">
          {resultados.map((cliente) => (
            <li key={cliente.participanteId}>
              <button
                type="button"
                onClick={() => {
                  onSelecionar(cliente);
                  setAberto(false);
                  setTermo("");
                }}
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
