import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { ProdutoAutocomplete } from "../../shared/ProdutoAutocomplete.jsx";
import { listLotes } from "../api.js";
import { criarInventario } from "./api.js";

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "sem validade";
}

export function NovoInventarioPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [lotesDoProduto, setLotesDoProduto] = useState([]);
  const [loteEscolhido, setLoteEscolhido] = useState("");
  const [quantidadeContada, setQuantidadeContada] = useState("");
  const [itens, setItens] = useState([]);
  const [salvando, setSalvando] = useState(false);

  async function aoSelecionarProduto(produto) {
    const { items } = await listLotes({ produtoId: produto.id, pageSize: 50 });
    setLotesDoProduto(items.map((l) => ({ ...l, produtoDescricao: produto.descricao, produtoCodigo: produto.codigo })));
    setLoteEscolhido(items[0]?.id ?? "");
  }

  function adicionarItem() {
    const lote = lotesDoProduto.find((l) => l.id === loteEscolhido);
    if (!lote || !quantidadeContada) return;
    setItens((prev) => [
      ...prev,
      {
        loteId: lote.id,
        produtoDescricao: lote.produtoDescricao,
        produtoCodigo: lote.produtoCodigo,
        validade: lote.dataValidade,
        quantidadeSistema: lote.quantidadeAtual,
        quantidadeContada,
      },
    ]);
    setLotesDoProduto([]);
    setLoteEscolhido("");
    setQuantidadeContada("");
  }

  function removerItem(index) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSalvar() {
    setSalvando(true);
    try {
      const inventario = await criarInventario(
        itens.map((item) => ({ loteId: item.loteId, quantidadeContada: String(item.quantidadeContada) })),
      );
      toast.success("Inventário criado.");
      navigate(`/estoque/inventarios/${inventario.id}`);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível criar o inventário.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <h1>Novo inventário físico</h1>
      <p>Busque o produto, escolha o lote e informe a quantidade contada.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "760px" }}>
        <Card>
          <h3>Adicionar contagem</h3>
          <div style={{ marginBottom: "24px" }}>
            <ProdutoAutocomplete onSelecionar={aoSelecionarProduto} />
          </div>

          {lotesDoProduto.length > 0 && (
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ minWidth: "220px" }}>
                <Select label="Lote" value={loteEscolhido} onChange={(e) => setLoteEscolhido(e.target.value)}>
                  {lotesDoProduto.map((l) => (
                    <option key={l.id} value={l.id}>
                      Validade: {formatarData(l.dataValidade)} — sistema: {l.quantidadeAtual}
                    </option>
                  ))}
                </Select>
              </div>
              <div style={{ minWidth: "160px" }}>
                <label className="field-label" style={{ display: "block", marginBottom: "6px" }}>
                  Quantidade contada
                </label>
                <input
                  className="field-control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantidadeContada}
                  onChange={(e) => setQuantidadeContada(e.target.value)}
                />
              </div>
              <Button type="button" variant="secondary" onClick={adicionarItem} disabled={!quantidadeContada}>
                Adicionar
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <h3>Itens do inventário</h3>
          {itens.length === 0 ? (
            <p className="data-table-empty">Nenhum item adicionado ainda.</p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Validade</th>
                    <th>Sistema</th>
                    <th>Contado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item, index) => (
                    <tr key={`${item.loteId}-${index}`}>
                      <td data-label="Produto">
                        <strong>{item.produtoDescricao}</strong>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
                          {item.produtoCodigo}
                        </div>
                      </td>
                      <td data-label="Validade">{formatarData(item.validade)}</td>
                      <td data-label="Sistema">{item.quantidadeSistema}</td>
                      <td data-label="Contado">{item.quantidadeContada}</td>
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

        <Button onClick={handleSalvar} loading={salvando} disabled={itens.length === 0} style={{ alignSelf: "flex-start" }}>
          Criar inventário
        </Button>
      </div>
    </div>
  );
}
