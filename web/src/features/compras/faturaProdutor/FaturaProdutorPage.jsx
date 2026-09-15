import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { consultarFaturaProdutor, gerarFaturaProdutor, listTransportadoras } from "../api.js";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Fatura de Produtor — fecha, por fornecedor produtor rural, os títulos a
// pagar já gerados no recebimento de cada pedido de compra (não cria título
// novo por conta própria, só consolida — ver
// src/modules/compras/faturaProdutor/service.js). Usada tanto em Compras
// quanto em Contas a Pagar no menu de referência (mesma tela nos dois).
export function FaturaProdutorPage() {
  const toast = useToast();
  const [transportadoraId, setTransportadoraId] = useState("");
  const [transportadoras, setTransportadoras] = useState([]);
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [grupos, setGrupos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    listTransportadoras({ pageSize: 100 }).then(({ items }) => setTransportadoras(items));
  }, []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    consultarFaturaProdutor({
      transportadoraId: transportadoraId || undefined,
      dataInicial: dataInicial || undefined,
      dataFinal: dataFinal || undefined,
    })
      .then(({ items }) => ativo && setGrupos(items.map((g) => ({ ...g, id: g.fornecedorId }))))
      .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar as faturas de produtor."))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transportadoraId, dataInicial, dataFinal, refreshKey]);

  async function handleGerar() {
    setGerando(true);
    try {
      const { items } = await gerarFaturaProdutor({
        transportadoraId: transportadoraId || undefined,
        dataInicial: dataInicial || undefined,
        dataFinal: dataFinal || undefined,
      });
      toast.success(`${items.length} fatura(s) de produtor gerada(s).`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível gerar as faturas.");
    } finally {
      setGerando(false);
    }
  }

  const columns = [
    { key: "fornecedor", label: "Fornecedor (produtor rural)", render: (row) => row.razaoSocial },
    { key: "titulos", label: "Títulos em aberto", render: (row) => row.tituloIds.length },
    { key: "valor", label: "Valor a pagar", render: (row) => formatarMoeda(row.valorAPagar) },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow">Compra</span>
          <h1>Fatura de Produtor</h1>
          <p>Consolida por fornecedor os títulos a pagar já gerados no recebimento — não cria título novo, só agrupa.</p>
        </div>
        <Button onClick={handleGerar} loading={gerando} disabled={grupos.length === 0}>
          Gerar Fatura(s)
        </Button>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "16px" }}>
        <Select label="Transportadora" value={transportadoraId} onChange={(e) => setTransportadoraId(e.target.value)} style={{ minWidth: "240px" }}>
          <option value="">Todas</option>
          {transportadoras.map((t) => (
            <option key={t.id} value={t.id}>
              {t.razaoSocial}
            </option>
          ))}
        </Select>
        <Input label="Data inicial" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
        <Input label="Data final" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
      </div>

      <DataTable columns={columns} rows={grupos} loading={carregando} emptyMessage="Nenhum título de produtor rural pendente neste filtro." />
    </div>
  );
}
