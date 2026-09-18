import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { utilitariosFiscaisApi } from "./api.js";
import "../../gerenciais/relatorios/RelatoriosPage.css";

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

function exportarPdf(titulo) {
  const tituloOriginal = document.title;
  document.title = `KAV DECK - ${titulo}`;
  window.print();
  document.title = tituloOriginal;
}

const ABAS = [
  { id: "cfop", label: "Por CFOP" },
  { id: "cfopUf", label: "Por CFOP + UF" },
  { id: "produto", label: "Por produto" },
];

export function UtilitariosFiscaisPage() {
  const toast = useToast();
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [aba, setAba] = useState("cfop");
  const [dados, setDados] = useState({ cfop: [], cfopUf: [], produto: [] });
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    try {
      const params = { dataInicial: dataInicial || undefined, dataFinal: dataFinal || undefined };
      const [cfop, cfopUf, produto] = await Promise.all([
        utilitariosFiscaisApi.porCfop(params),
        utilitariosFiscaisApi.porCfopUf(params),
        utilitariosFiscaisApi.porProduto(params),
      ]);
      setDados({ cfop: cfop.items, cfopUf: cfopUf.items, produto: produto.items });
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar os relatórios fiscais.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colunasCfop = [
    { key: "codigo", label: "CFOP" },
    { key: "descricao", label: "Descrição" },
    { key: "quantidade", label: "Quantidade" },
    { key: "valorTotal", label: "Valor total", render: (row) => formatarMoeda(row.valorTotal) },
  ];
  const colunasCfopUf = [
    { key: "cfop", label: "CFOP" },
    { key: "uf", label: "UF" },
    { key: "quantidade", label: "Quantidade" },
    { key: "valorTotal", label: "Valor total", render: (row) => formatarMoeda(row.valorTotal) },
  ];
  const colunasProduto = [
    { key: "codigo", label: "Código" },
    { key: "descricao", label: "Produto" },
    { key: "quantidade", label: "Quantidade" },
    { key: "valorTotal", label: "Valor total", render: (row) => formatarMoeda(row.valorTotal) },
  ];

  const abaAtual = ABAS.find((a) => a.id === aba);
  const linhas = { cfop: dados.cfop, cfopUf: dados.cfopUf, produto: dados.produto }[aba];
  const colunas = { cfop: colunasCfop, cfopUf: colunasCfopUf, produto: colunasProduto }[aba];
  const rows = linhas.map((item, index) => ({
    id: aba === "cfopUf" ? `${item.cfop}-${item.uf}` : (item.cfopId ?? item.produtoId ?? index),
    ...item,
  }));

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1>Utilitários Fiscais</h1>
        <p>Relatórios agregados a partir dos itens das notas fiscais emitidas.</p>
      </div>

      <Card className="relatorio-filtro">
        <Input label="De" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
        <Input label="Até" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
        <Button loading={carregando} onClick={carregar} style={{ alignSelf: "flex-end" }}>
          Atualizar
        </Button>
      </Card>

      <div className="relatorio-abas">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`relatorio-aba ${aba === item.id ? "is-active" : ""}`}
            onClick={() => setAba(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="relatorio-cabecalho-aba">
          <h3>{abaAtual.label}</h3>
          <Button variant="secondary" size="sm" className="no-print" onClick={() => exportarPdf(abaAtual.label)}>
            Exportar PDF
          </Button>
        </div>
        <DataTable columns={colunas} rows={rows} loading={carregando} emptyMessage="Nenhum registro no período." />
      </Card>
    </div>
  );
}
