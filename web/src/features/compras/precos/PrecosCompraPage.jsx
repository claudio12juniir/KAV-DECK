import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { ProdutoAutocomplete } from "../../shared/ProdutoAutocomplete.jsx";
import { FornecedorAutocomplete } from "../components/FornecedorAutocomplete.jsx";
import { precosCompraApi } from "./api.js";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

export function PrecosCompraPage() {
  const toast = useToast();
  const [precos, setPrecos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [fornecedor, setFornecedor] = useState(null);
  const [produto, setProduto] = useState(null);
  const [preco, setPreco] = useState("0");
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState(null);

  async function carregar() {
    setCarregando(true);
    try {
      const { items } = await precosCompraApi.list();
      setPrecos(items);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar os preços de compra.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useRealtimeInvalidate("/compras/precos", carregar);

  async function handleSalvar() {
    if (!fornecedor || !produto) return;
    setSalvando(true);
    try {
      await precosCompraApi.upsert({
        fornecedorId: fornecedor.participanteId,
        produtoId: produto.id,
        preco: String(preco || 0),
      });
      toast.success("Preço de compra salvo.");
      setFornecedor(null);
      setProduto(null);
      setPreco("0");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível salvar o preço.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(id) {
    setRemovendoId(id);
    try {
      await precosCompraApi.remove(id);
      toast.success("Preço removido.");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível remover o preço.");
    } finally {
      setRemovendoId(null);
    }
  }

  const columns = [
    { key: "fornecedor", label: "Fornecedor", render: (row) => row.fornecedor.participante.razaoSocial },
    { key: "produto", label: "Produto", render: (row) => `${row.produto.codigo} — ${row.produto.descricao}` },
    { key: "preco", label: "Preço vigente", render: (row) => formatarMoeda(row.preco) },
    { key: "vigenciaEm", label: "Vigência desde", render: (row) => formatarData(row.vigenciaEm) },
    {
      key: "_acoes",
      label: "",
      render: (row) => (
        <button
          type="button"
          className="autocomplete-trocar"
          style={{ color: "var(--color-danger)" }}
          onClick={() => handleRemover(row.id)}
          disabled={removendoId === row.id}
        >
          Excluir
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1>Preços de Compra</h1>
      <p>Preço vigente por fornecedor e produto — atualizar aqui substitui o preço anterior, não guarda histórico.</p>

      <Card style={{ marginBottom: "24px", padding: "20px" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "260px" }}>
            <FornecedorAutocomplete selecionado={fornecedor} onSelecionar={setFornecedor} onLimpar={() => setFornecedor(null)} />
          </div>
          <div style={{ flex: 1, minWidth: "240px" }}>
            <ProdutoAutocomplete label="Produto" onSelecionar={setProduto} />
            {produto && (
              <div style={{ marginTop: "4px", fontSize: "var(--text-sm)" }}>
                Selecionado: {produto.codigo} — {produto.descricao}
              </div>
            )}
          </div>
          <Input label="Preço" type="number" style={{ width: "140px" }} value={preco} onChange={(e) => setPreco(e.target.value)} />
          <Button onClick={handleSalvar} loading={salvando} disabled={!fornecedor || !produto}>
            Salvar
          </Button>
        </div>
      </Card>

      <DataTable columns={columns} rows={precos} loading={carregando} emptyMessage="Nenhum preço de compra cadastrado." />
    </div>
  );
}
