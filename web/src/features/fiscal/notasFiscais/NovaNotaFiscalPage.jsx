import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { listCfopOptions } from "../cfop/api.js";
import { listNaturezasOperacaoOptions } from "../naturezasOperacao/api.js";
import { ParticipanteAutocomplete } from "../../shared/ParticipanteAutocomplete.jsx";
import { ProdutoAutocomplete } from "../../shared/ProdutoAutocomplete.jsx";
import { createNotaFiscal } from "./api.js";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function NovaNotaFiscalPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [serie, setSerie] = useState("1");
  const [numero, setNumero] = useState("");
  const [naturezaOperacaoId, setNaturezaOperacaoId] = useState("");
  const [tipoOperacao, setTipoOperacao] = useState("SAIDA");
  const [participante, setParticipante] = useState(null);
  const [naturezas, setNaturezas] = useState([]);
  const [cfops, setCfops] = useState([]);
  const [itens, setItens] = useState([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    listNaturezasOperacaoOptions().then(setNaturezas);
    listCfopOptions().then(setCfops);
  }, []);

  function adicionarProduto(produto) {
    setItens((prev) => [
      ...prev,
      {
        produtoId: produto.id,
        codigo: produto.codigo,
        descricao: produto.descricao,
        cfopId: "",
        quantidade: 1,
        valorUnitario: produto.precoReferencia ?? 0,
      },
    ]);
  }

  function alterarItem(index, campo, valor) {
    setItens((prev) => prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  }

  function removerItem(index) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  const podeSalvar =
    serie &&
    numero &&
    naturezaOperacaoId &&
    participante &&
    itens.length > 0 &&
    itens.every((item) => item.cfopId) &&
    !salvando;

  async function handleSalvar() {
    setSalvando(true);
    try {
      const nota = await createNotaFiscal({
        serie,
        numero,
        naturezaOperacaoId,
        tipoOperacao,
        participanteId: participante.id,
        itens: itens.map((item) => ({
          produtoId: item.produtoId,
          cfopId: item.cfopId,
          quantidade: String(item.quantidade),
          valorUnitario: String(item.valorUnitario),
        })),
      });
      toast.success("Nota fiscal criada em digitação.");
      navigate(`/fiscal/notas/${nota.id}`);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível criar a nota fiscal.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <h1>Nova nota fiscal</h1>
      <p>Criada em digitação — a transmissão à SEFAZ ainda não está integrada.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px" }}>
        <Card>
          <h3>Cabeçalho</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <Input label="Série" required value={serie} onChange={(e) => setSerie(e.target.value)} />
            <Input label="Número" required value={numero} onChange={(e) => setNumero(e.target.value)} />
            <Select label="Tipo de operação" value={tipoOperacao} onChange={(e) => setTipoOperacao(e.target.value)}>
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
              <option value="PRODUTOR_RURAL">Produtor rural</option>
              <option value="TERCEIROS">Terceiros</option>
              <option value="INUTILIZACAO">Inutilização</option>
            </Select>
            <Select
              label="Natureza da operação"
              required
              value={naturezaOperacaoId}
              onChange={(e) => setNaturezaOperacaoId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {naturezas.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="field-label" style={{ marginBottom: "6px" }}>
            Participante
          </div>
          <ParticipanteAutocomplete
            selecionado={participante}
            onSelecionar={setParticipante}
            onLimpar={() => setParticipante(null)}
          />
        </Card>

        <Card>
          <h3>Itens</h3>
          <div style={{ marginBottom: "24px" }}>
            <ProdutoAutocomplete onSelecionar={adicionarProduto} />
          </div>

          {itens.length === 0 ? (
            <p className="data-table-empty">Nenhum produto adicionado ainda.</p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>CFOP</th>
                    <th>Qtd.</th>
                    <th>Valor unit.</th>
                    <th>Subtotal</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item, index) => (
                    <tr key={`${item.produtoId}-${index}`}>
                      <td data-label="Produto">
                        <strong>{item.descricao}</strong>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{item.codigo}</div>
                      </td>
                      <td data-label="CFOP">
                        <select
                          className="field-control"
                          value={item.cfopId}
                          onChange={(e) => alterarItem(index, "cfopId", e.target.value)}
                        >
                          <option value="">Selecione...</option>
                          {cfops.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td data-label="Qtd.">
                        <input
                          className="field-control"
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantidade}
                          onChange={(e) => alterarItem(index, "quantidade", e.target.value)}
                        />
                      </td>
                      <td data-label="Valor unit.">
                        <input
                          className="field-control"
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.valorUnitario}
                          onChange={(e) => alterarItem(index, "valorUnitario", e.target.value)}
                        />
                      </td>
                      <td data-label="Subtotal">{formatarMoeda(item.quantidade * item.valorUnitario)}</td>
                      <td data-label="">
                        <button type="button" className="autocomplete-trocar" onClick={() => removerItem(index)}>
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Button onClick={handleSalvar} loading={salvando} disabled={!podeSalvar} style={{ alignSelf: "flex-start" }}>
          Criar nota fiscal
        </Button>
      </div>
    </div>
  );
}
