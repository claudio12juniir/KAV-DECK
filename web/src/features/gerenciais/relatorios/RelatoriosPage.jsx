import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { relatoriosApi } from "./api.js";
import "./RelatoriosPage.css";

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

function primeiroDiaDoMes() {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
}

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

const ABAS = [
  { id: "geral", label: "Visão geral" },
  { id: "dre", label: "DRE" },
  { id: "dfc", label: "Fluxo de caixa" },
  { id: "fiscal", label: "Fiscal (NF-e)" },
  { id: "colaboradores", label: "Colaboradores" },
  { id: "clientes", label: "Vendas por cliente" },
  { id: "produtos", label: "Vendas por produto" },
  { id: "fornecedores", label: "Compras por fornecedor" },
];

// Linha simples label/valor, reaproveitada nos blocos de DRE/DFC/Fiscal —
// esses três são resumos de poucos números, não fazem sentido como tabela.
function LinhaValor({ label, valor, destaque, negativo }) {
  return (
    <div className={`relatorio-linha ${destaque ? "is-destaque" : ""}`}>
      <span>{label}</span>
      <strong className={negativo ? "is-negativo" : ""}>{formatarMoeda(valor)}</strong>
    </div>
  );
}

function VisaoGeral({ dados }) {
  const resultadoPositivo = Number(dados.dre.resultado) >= 0;
  return (
    <div className="relatorio-stats-grid">
      <Card>
        <p className="relatorio-stat-label">Receita líquida (vendas)</p>
        <h2 className="relatorio-stat-valor">{formatarMoeda(dados.dre.receitaLiquida)}</h2>
      </Card>
      <Card>
        <p className="relatorio-stat-label">Custo de mercadorias + pessoal</p>
        <h2 className="relatorio-stat-valor">
          {formatarMoeda(Number(dados.dre.custoMercadorias) + Number(dados.dre.despesasOperacionais))}
        </h2>
      </Card>
      <Card>
        <p className="relatorio-stat-label">Resultado do período</p>
        <h2 className="relatorio-stat-valor">
          <Badge tone={resultadoPositivo ? "success" : "danger"}>{formatarMoeda(dados.dre.resultado)}</Badge>
        </h2>
      </Card>
      <Card>
        <p className="relatorio-stat-label">Saldo de caixa no fim do período</p>
        <h2 className="relatorio-stat-valor">{formatarMoeda(dados.dfc.saldoFinal)}</h2>
      </Card>
      <Card>
        <p className="relatorio-stat-label">Tributos das NF-e emitidas</p>
        <h2 className="relatorio-stat-valor">{formatarMoeda(dados.fiscal.totalTributos)}</h2>
        <p className="relatorio-stat-sub">{dados.fiscal.quantidadeNotas} nota(s) autorizada(s)</p>
      </Card>
      <Card>
        <p className="relatorio-stat-label">Custo mensal com colaboradores</p>
        <h2 className="relatorio-stat-valor">{formatarMoeda(dados.pessoal.totalGeral)}</h2>
        <p className="relatorio-stat-sub">{dados.pessoal.itens.length} colaborador(es) ativo(s)</p>
      </Card>
    </div>
  );
}

function Dre({ dre }) {
  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>DRE simplificado</h3>
      <p className="relatorio-aviso">
        Leitura gerencial rápida, não é um demonstrativo contábil formal — não há classificação de contas por
        natureza no plano de contas atual pra sustentar isso.
      </p>
      <LinhaValor label="Receita bruta" valor={dre.receitaBruta} />
      <LinhaValor label="(-) Devoluções" valor={dre.deducoes} negativo />
      <LinhaValor label="= Receita líquida" valor={dre.receitaLiquida} destaque />
      <LinhaValor label="(-) Custo de mercadorias (compras recebidas)" valor={dre.custoMercadorias} negativo />
      <LinhaValor label="= Lucro bruto" valor={dre.lucroBruto} destaque />
      <LinhaValor label="(-) Despesas avulsas (títulos a pagar)" valor={dre.despesasAvulsas} negativo />
      <LinhaValor label="(-) Custo de pessoal (colaboradores)" valor={dre.custosPessoal} negativo />
      <LinhaValor label="= Resultado do período" valor={dre.resultado} destaque />
    </Card>
  );
}

function Dfc({ dfc }) {
  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>Fluxo de caixa</h3>
      <LinhaValor label="Saldo inicial (antes do período)" valor={dfc.saldoInicial} />
      <LinhaValor label="Entradas no período" valor={dfc.entradas} />
      <LinhaValor label="Saídas no período" valor={dfc.saidas} negativo />
      <LinhaValor label="Saldo final" valor={dfc.saldoFinal} destaque />
    </Card>
  );
}

function Fiscal({ fiscal }) {
  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>Resumo fiscal — notas fiscais de saída autorizadas</h3>
      <p className="relatorio-aviso">
        Tributos das NF-e emitidas no período (não é uma taxa cobrada por emissão — é a soma de ICMS, IPI, PIS e
        COFINS de todos os itens das notas).
      </p>
      <LinhaValor label="Quantidade de notas" valor={fiscal.quantidadeNotas} />
      <LinhaValor label="Valor total das notas" valor={fiscal.valorTotalNotas} />
      <LinhaValor label="ICMS" valor={fiscal.totalIcms} />
      <LinhaValor label="IPI" valor={fiscal.totalIpi} />
      <LinhaValor label="PIS" valor={fiscal.totalPis} />
      <LinhaValor label="COFINS" valor={fiscal.totalCofins} />
      <LinhaValor label="Total de tributos" valor={fiscal.totalTributos} destaque />
    </Card>
  );
}

const TIPO_COLABORADOR_LABEL = {
  COMPRADOR: "Comprador",
  VENDEDOR: "Vendedor",
  REPRESENTANTE: "Representante",
  SEPARADOR: "Separador",
};

function Colaboradores({ pessoal }) {
  const columns = [
    { key: "nome", label: "Nome" },
    { key: "tipo", label: "Função", render: (row) => TIPO_COLABORADOR_LABEL[row.tipo] ?? row.tipo },
    { key: "valorSalario", label: "Salário", render: (row) => formatarMoeda(row.valorSalario) },
    { key: "valorValeAlimentacao", label: "Vale-alimentação", render: (row) => formatarMoeda(row.valorValeAlimentacao) },
    { key: "valorValeTransporte", label: "Vale-transporte", render: (row) => formatarMoeda(row.valorValeTransporte) },
    { key: "valorInss", label: "INSS", render: (row) => formatarMoeda(row.valorInss) },
    { key: "valorOutrosEncargos", label: "Outros encargos", render: (row) => formatarMoeda(row.valorOutrosEncargos) },
    { key: "custoTotal", label: "Total", render: (row) => <strong>{formatarMoeda(row.custoTotal)}</strong> },
  ];
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
        <h3 style={{ margin: 0 }}>Custo mensal por colaborador</h3>
        <strong>Total: {formatarMoeda(pessoal.totalGeral)}</strong>
      </div>
      <DataTable columns={columns} rows={pessoal.itens} emptyMessage="Nenhum colaborador ativo cadastrado." />
    </Card>
  );
}

function ListaValor({ titulo, itens, colunaNome, colunaLabel, colunaExtra }) {
  const columns = [
    { key: "nome", label: colunaLabel, render: (row) => row[colunaNome] },
    ...(colunaExtra ? [colunaExtra] : []),
    { key: "valor", label: "Valor", render: (row) => formatarMoeda(row.valor) },
  ];
  const rows = itens.map((item, index) => ({ id: item.clienteId ?? item.produtoId ?? item.fornecedorId ?? index, ...item }));
  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>{titulo}</h3>
      <DataTable columns={columns} rows={rows} emptyMessage="Nenhum registro no período." />
    </Card>
  );
}

export function RelatoriosPage() {
  const toast = useToast();
  const [dataInicial, setDataInicial] = useState(primeiroDiaDoMes());
  const [dataFinal, setDataFinal] = useState(hojeIso());
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState("geral");

  async function carregar() {
    setCarregando(true);
    try {
      const resultado = await relatoriosApi.principal({ dataInicial, dataFinal });
      setDados(resultado);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar os relatórios.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1>Relatórios</h1>
        <p>Visão financeira, fiscal e de pessoal da empresa no período selecionado.</p>
      </div>

      <Card className="relatorio-filtro">
        <Input label="De" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
        <Input label="Até" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
        <Button loading={carregando} onClick={carregar} style={{ alignSelf: "flex-end" }}>
          Atualizar
        </Button>
      </Card>

      {!dados || carregando ? (
        <Card>Carregando...</Card>
      ) : (
        <>
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

          {aba === "geral" && <VisaoGeral dados={dados} />}
          {aba === "dre" && <Dre dre={dados.dre} />}
          {aba === "dfc" && <Dfc dfc={dados.dfc} />}
          {aba === "fiscal" && <Fiscal fiscal={dados.fiscal} />}
          {aba === "colaboradores" && <Colaboradores pessoal={dados.pessoal} />}
          {aba === "clientes" && (
            <ListaValor
              titulo="Vendas por cliente"
              itens={dados.vendasPorCliente}
              colunaNome="razaoSocial"
              colunaLabel="Cliente"
              colunaExtra={{ key: "pedidos", label: "Pedidos", render: (row) => row.pedidos }}
            />
          )}
          {aba === "produtos" && (
            <ListaValor
              titulo="Vendas por produto"
              itens={dados.vendasPorProduto}
              colunaNome="descricao"
              colunaLabel="Produto"
              colunaExtra={{ key: "quantidade", label: "Quantidade", render: (row) => row.quantidade }}
            />
          )}
          {aba === "fornecedores" && (
            <ListaValor
              titulo="Compras por fornecedor"
              itens={dados.comprasPorFornecedor}
              colunaNome="razaoSocial"
              colunaLabel="Fornecedor"
              colunaExtra={{ key: "pedidos", label: "Pedidos", render: (row) => row.pedidos }}
            />
          )}
        </>
      )}
    </div>
  );
}
