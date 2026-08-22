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

function formatarDataBr(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

// Exportar em PDF usa a impressão nativa do navegador (o usuário escolhe
// "Salvar como PDF" no destino) em vez de gerar o arquivo em JS — evita
// puxar libs pesadas (jsPDF/html2canvas) só pra isso, e o resultado é texto
// selecionável de verdade, não uma imagem. O título vira o nome sugerido
// do arquivo na maioria dos navegadores.
function exportarPdf(titulo, periodoLabel) {
  const tituloOriginal = document.title;
  document.title = `KAV DECK - ${titulo} - ${periodoLabel}`.replace(/\s+/g, " ");
  window.print();
  document.title = tituloOriginal;
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

function CabecalhoAba({ titulo, periodoLabel, acoesExtra }) {
  return (
    <div className="relatorio-cabecalho-aba">
      <div>
        <h3>{titulo}</h3>
        <p className="relatorio-periodo-print">Período: {periodoLabel}</p>
      </div>
      <div className="relatorio-cabecalho-aba-acoes">
        {acoesExtra}
        <Button variant="secondary" size="sm" className="no-print" onClick={() => exportarPdf(titulo, periodoLabel)}>
          Exportar PDF
        </Button>
      </div>
    </div>
  );
}

function VisaoGeral({ dados, periodoLabel }) {
  const resultadoPositivo = Number(dados.dre.resultado) >= 0;
  return (
    <div>
      <CabecalhoAba titulo="Visão geral" periodoLabel={periodoLabel} />
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
    </div>
  );
}

function Dre({ dre, periodoLabel }) {
  return (
    <Card>
      <CabecalhoAba titulo="DRE simplificado" periodoLabel={periodoLabel} />
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

function Dfc({ dfc, periodoLabel }) {
  return (
    <Card>
      <CabecalhoAba titulo="Fluxo de caixa" periodoLabel={periodoLabel} />
      <LinhaValor label="Saldo inicial (antes do período)" valor={dfc.saldoInicial} />
      <LinhaValor label="Entradas no período" valor={dfc.entradas} />
      <LinhaValor label="Saídas no período" valor={dfc.saidas} negativo />
      <LinhaValor label="Saldo final" valor={dfc.saldoFinal} destaque />
    </Card>
  );
}

function Fiscal({ fiscal, periodoLabel }) {
  return (
    <Card>
      <CabecalhoAba titulo="Resumo fiscal — notas fiscais de saída autorizadas" periodoLabel={periodoLabel} />
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

function Colaboradores({ pessoal, periodoLabel }) {
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
      <CabecalhoAba
        titulo="Custo mensal por colaborador"
        periodoLabel={periodoLabel}
        acoesExtra={<strong>Total: {formatarMoeda(pessoal.totalGeral)}</strong>}
      />
      <DataTable columns={columns} rows={pessoal.itens} emptyMessage="Nenhum colaborador ativo cadastrado." />
    </Card>
  );
}

function ListaValor({ titulo, itens, colunaNome, colunaLabel, colunaExtra, periodoLabel }) {
  const columns = [
    { key: "nome", label: colunaLabel, render: (row) => row[colunaNome] },
    ...(colunaExtra ? [colunaExtra] : []),
    { key: "valor", label: "Valor", render: (row) => formatarMoeda(row.valor) },
  ];
  const rows = itens.map((item, index) => ({ id: item.clienteId ?? item.produtoId ?? item.fornecedorId ?? index, ...item }));
  return (
    <Card>
      <CabecalhoAba titulo={titulo} periodoLabel={periodoLabel} />
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

  const periodoLabel = `${formatarDataBr(dataInicial)} a ${formatarDataBr(dataFinal)}`;

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

          {aba === "geral" && <VisaoGeral dados={dados} periodoLabel={periodoLabel} />}
          {aba === "dre" && <Dre dre={dados.dre} periodoLabel={periodoLabel} />}
          {aba === "dfc" && <Dfc dfc={dados.dfc} periodoLabel={periodoLabel} />}
          {aba === "fiscal" && <Fiscal fiscal={dados.fiscal} periodoLabel={periodoLabel} />}
          {aba === "colaboradores" && <Colaboradores pessoal={dados.pessoal} periodoLabel={periodoLabel} />}
          {aba === "clientes" && (
            <ListaValor
              titulo="Vendas por cliente"
              itens={dados.vendasPorCliente}
              colunaNome="razaoSocial"
              colunaLabel="Cliente"
              colunaExtra={{ key: "pedidos", label: "Pedidos", render: (row) => row.pedidos }}
              periodoLabel={periodoLabel}
            />
          )}
          {aba === "produtos" && (
            <ListaValor
              titulo="Vendas por produto"
              itens={dados.vendasPorProduto}
              colunaNome="descricao"
              colunaLabel="Produto"
              colunaExtra={{ key: "quantidade", label: "Quantidade", render: (row) => row.quantidade }}
              periodoLabel={periodoLabel}
            />
          )}
          {aba === "fornecedores" && (
            <ListaValor
              titulo="Compras por fornecedor"
              itens={dados.comprasPorFornecedor}
              colunaNome="razaoSocial"
              colunaLabel="Fornecedor"
              colunaExtra={{ key: "pedidos", label: "Pedidos", render: (row) => row.pedidos }}
              periodoLabel={periodoLabel}
            />
          )}
        </>
      )}
    </div>
  );
}
