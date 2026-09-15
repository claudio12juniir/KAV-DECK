import { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { listCategoriasOptions } from "../../cadastros/categorias/api.js";
import { listDepartamentosOptions } from "../../cadastros/departamentos/api.js";
import { listItensVenda, marcarItemImpresso, totaisItensVenda } from "../api.js";

function DropdownMenu({ items, onSelect, onClose }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: "calc(100% + 4px)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 10,
        minWidth: "200px",
      }}
      onMouseLeave={onClose}
    >
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className="autocomplete-trocar"
          style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px" }}
          onClick={() => onSelect(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

const TURNO_LABEL = { MANHA: "Manhã", TARDE: "Tarde", NOITE: "Noite", SOS: "SOS", RETIRA: "Retira" };

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarTurno(turno) {
  return turno ? (TURNO_LABEL[turno] ?? turno) : "—";
}

// Componente único pra 4 telas do mapeamento SpaceSoft que são, por baixo, a
// mesma tabela de itens de venda vista por ângulos diferentes de filtro (ver
// MAPEAMENTO_VENDAS_SPACESOFT.md seções 9/10/11/15, reconfirmadas ao vivo
// contra o sistema de referência): Consulta de Itens, Controle de Produção
// (data única, sem os demais filtros, botão "Lotes"), Listagem para Compra
// (toggle impresso) e Terminal de Preços (toggle valor zero, ligado por
// padrão). `variante` decide filtros, colunas e valor inicial de cada um —
// ver uso em WorkspaceRoutes.jsx.
//
// Gap conhecido (não implementado por falta de campo no schema): as colunas
// "OBS. PEDIDO"/"OBS. VENDA" da referência mostram uma observação a nível de
// pedido — PedidoVenda não tem esse campo hoje (só ItemPedidoVenda.observacao,
// já coberto pela coluna "Obs. produto"). Os filtros "Natureza" e "Tag" da
// referência também não têm campo equivalente no pedido ainda.
export function ItensVendaPage({ variante, titulo, descricao }) {
  const toast = useToast();
  const navigate = useNavigate();
  const diaUnico = variante === "producao";
  const comImpresso = variante === "listaCompra";
  const comValorZero = variante === "terminalPrecos";
  const comCategoria = variante === "consulta";
  const comDepartamento = variante === "consulta" || variante === "terminalPrecos";
  const comPeriodo = variante === "consulta" || variante === "terminalPrecos";
  const comClienteProduto = variante !== "producao";

  const [dataUnica, setDataUnica] = useState(hoje());
  const [dataInicial, setDataInicial] = useState(diaUnico ? "" : hoje());
  const [dataFinal, setDataFinal] = useState(diaUnico ? "" : hoje());
  const [cliente, setCliente] = useState("");
  const [produto, setProduto] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [departamentoId, setDepartamentoId] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [impresso, setImpresso] = useState(comImpresso ? false : undefined);
  const [valorZero, setValorZero] = useState(comValorZero);
  const [exibirTotais, setExibirTotais] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [totais, setTotais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mostrarImprimir, setMostrarImprimir] = useState(false);
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  const [mostrarOrdenar, setMostrarOrdenar] = useState(false);
  const [ordenacao, setOrdenacao] = useState("lancamento");

  function stub(nomeRecurso) {
    return () => {
      toast.error(`${nomeRecurso} ainda não implementado nesta versão do KAV DECK.`);
      setMostrarImprimir(false);
      setMostrarOpcoes(false);
    };
  }

  useEffect(() => {
    if (comCategoria) listCategoriasOptions().then(setCategorias);
    if (comDepartamento) listDepartamentosOptions().then(setDepartamentos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtros = {
    ...(diaUnico ? { data: dataUnica || undefined } : { dataInicial: dataInicial || undefined, dataFinal: dataFinal || undefined }),
    ...(comClienteProduto ? { cliente: cliente || undefined, produto: produto || undefined } : {}),
    ...(comCategoria ? { categoriaId: categoriaId || undefined } : {}),
    ...(comDepartamento ? { departamentoId: departamentoId || undefined } : {}),
    ...(comPeriodo ? { periodo: periodo || undefined } : {}),
    ...(comImpresso ? { impresso } : {}),
    ...(comValorZero ? { valorZero: valorZero || undefined } : {}),
    pageSize: 200,
  };

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    const requisicao = exibirTotais
      ? totaisItensVenda(filtros).then((items) => ({ items, total: items.length }))
      : listItensVenda(filtros);
    requisicao
      .then(({ items, total: totalRecebido }) => {
        if (!ativo) return;
        if (exibirTotais) setTotais(items);
        else setItens(items);
        setTotal(totalRecebido ?? items.length);
      })
      .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar os itens."))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUnica, dataInicial, dataFinal, cliente, produto, categoriaId, departamentoId, periodo, impresso, valorZero, exibirTotais, refreshKey]);

  async function handleMarcarImpresso(id, novoValor) {
    try {
      await marcarItemImpresso(id, novoValor);
      toast.success(novoValor ? "Item marcado como impresso." : "Item marcado como não impresso.");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível atualizar o item.");
    }
  }

  const colProduto = { key: "produto", label: "Produto", render: (row) => `${row.produto.codigo} — ${row.produto.descricao}` };
  const colUnd = { key: "und", label: "Und.", render: (row) => row.produto.unidadeMedida?.sigla ?? "—" };
  const colQtd = { key: "quantidade", label: "Qtd." };
  const colValor = {
    key: "valor",
    label: "Valor",
    render: (row) => (
      <>
        {formatarMoeda(row.precoUnitario)}
        {Number(row.precoUnitario) === 0 && <div style={{ color: "var(--color-warning)", fontSize: "var(--text-xs)" }}>Valor zero</div>}
      </>
    ),
  };
  const colParcial = {
    key: "parcial",
    label: "T. parcial",
    render: (row) => formatarMoeda(Number(row.quantidade) * Number(row.precoUnitario) - Number(row.desconto || 0)),
  };
  const colObsProduto = { key: "obs", label: "Obs. produto", render: (row) => row.observacao ?? "—" };
  const colCliente = { key: "cliente", label: "Cliente", render: (row) => row.pedidoVenda.cliente.participante.razaoSocial };
  const colEntrega = { key: "entrega", label: "Entrega", render: (row) => formatarTurno(row.pedidoVenda.turno) };
  const colNumero = {
    key: "numero",
    label: "Número",
    render: (row) => <Link to={`/vendas/${row.pedidoVenda.id}`}>{row.pedidoVenda.id.slice(0, 8)}</Link>,
  };
  const colDataEmiss = { key: "dataEmiss", label: "Data emiss.", render: (row) => formatarData(row.pedidoVenda.dataEmissao) };
  const colImpresso = {
    key: "impresso",
    label: "Impresso",
    render: (row) => (
      <Button variant={row.impresso ? "secondary" : "ghost"} onClick={() => handleMarcarImpresso(row.id, !row.impresso)}>
        {row.impresso ? "Sim" : "Não"}
      </Button>
    ),
  };

  // Ordem de coluna copiada exatamente da tela de referência de cada
  // variante — não é a mesma ordem entre elas (ex.: Controle de Produção
  // começa por Número/Data/Cliente, as outras três começam por Qtd/Und/Produto).
  const colunasDetalhe =
    variante === "producao"
      ? [
          { ...colNumero, label: "Número ped." },
          colDataEmiss,
          colCliente,
          colQtd,
          colUnd,
          colProduto,
          { ...colObsProduto, label: "Observação" },
        ]
      : variante === "listaCompra"
        ? [colQtd, colUnd, colProduto, colValor, colParcial, colObsProduto, colImpresso, colCliente, colNumero, colEntrega]
        : [colQtd, colUnd, colProduto, colValor, colParcial, colObsProduto, colCliente, colEntrega, colNumero, colDataEmiss];

  const colunasTotais = [
    { key: "produto", label: "Produto", render: (row) => `${row.produto?.codigo ?? ""} — ${row.produto?.descricao ?? "—"}` },
    { key: "und", label: "Und.", render: (row) => row.produto?.unidadeMedida?.sigla ?? "—" },
    { key: "quantidadeTotal", label: "Qtd. total" },
  ];

  const linhasTotais = totais.map((t) => ({ ...t, id: t.produtoId }));

  const itensExibidos =
    variante === "terminalPrecos" && ordenacao === "produto"
      ? [...itens].sort((a, b) => a.produto.descricao.localeCompare(b.produto.descricao))
      : itens;

  const rotuloContador = { consulta: "Itens Vendidos", listaCompra: "Pedidos", terminalPrecos: "Itens" }[variante];
  const rangeAte = Math.min(total, itens.length);

  // Consulta de Itens é a única das 4 variantes cuja referência usa barra
  // lateral de filtros (ver captura "Controle de Itens de Venda" em
  // Downloads/kav deck vendas) — as outras 3 usam filtro horizontal no topo
  // (Controle de Produção, Listagem para Compra, Terminal de Preços).
  const comSidebarFiltros = variante === "consulta";

  const camposFiltro = (
    <>
      {diaUnico ? (
        <Input label="Data emissão" type="date" value={dataUnica} onChange={(e) => setDataUnica(e.target.value)} />
      ) : (
        <>
          <Input label="Data inicial" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
          <Input label="Data final" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
        </>
      )}
      {comClienteProduto && (
        <>
          <Input label="Cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Buscar por nome..." />
          {comPeriodo && (
            <Select label="Período da entrega" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(TURNO_LABEL).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </Select>
          )}
          <Input label="Produto" value={produto} onChange={(e) => setProduto(e.target.value)} placeholder="Buscar por descrição..." />
          {comCategoria && (
            <Select label="Categoria" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          )}
          {comDepartamento && (
            <Select label="Departamento" value={departamentoId} onChange={(e) => setDepartamentoId(e.target.value)}>
              <option value="">Todos</option>
              {departamentos.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          )}
        </>
      )}
      {comImpresso && (
        <Select label="Impresso" value={impresso === undefined ? "" : String(impresso)} onChange={(e) => setImpresso(e.target.value === "" ? undefined : e.target.value === "true")}>
          <option value="false">Não impresso</option>
          <option value="true">Impresso</option>
          <option value="">Todos</option>
        </Select>
      )}
      {comValorZero && (
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input type="checkbox" checked={valorZero} onChange={(e) => setValorZero(e.target.checked)} />
          Valor igual a 0
        </label>
      )}
    </>
  );

  const avisoValorZero = comValorZero && valorZero && (
    <div style={{ marginBottom: "16px" }}>
      <Badge tone="warning">Mostrando só itens vendidos por R$ 0,00 — confira se são bonificações antes de considerar erro.</Badge>
    </div>
  );

  const linhaContador = !diaUnico && (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <strong>
          {rotuloContador} ({itens.length ? 1 : 0} - {rangeAte})
        </strong>
        <button type="button" className="icon-btn" title="Atualizar" onClick={() => setRefreshKey((k) => k + 1)}>
          <FiRefreshCw />
        </button>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {variante === "listaCompra" && (
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="checkbox" checked={exibirTotais} onChange={(e) => setExibirTotais(e.target.checked)} />
            Exibir totais
          </label>
        )}
        {variante === "listaCompra" && (
          <div style={{ position: "relative" }}>
            <Button variant="ghost" onClick={() => setMostrarOpcoes((v) => !v)}>
              Opções ▾
            </Button>
            {mostrarOpcoes && <DropdownMenu items={["Formatar Qtd"]} onSelect={stub("Essa opção")} onClose={() => setMostrarOpcoes(false)} />}
          </div>
        )}
        {variante === "terminalPrecos" && (
          <div style={{ position: "relative" }}>
            <Button variant="ghost" onClick={() => setMostrarOrdenar((v) => !v)}>
              ↕ ▾
            </Button>
            {mostrarOrdenar && (
              <DropdownMenu
                items={["Ordenar por lançamento", "Ordenar por produto"]}
                onSelect={(item) => {
                  setOrdenacao(item === "Ordenar por produto" ? "produto" : "lancamento");
                  setMostrarOrdenar(false);
                }}
                onClose={() => setMostrarOrdenar(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );

  const tabela = (
    <DataTable
      columns={exibirTotais && !diaUnico ? colunasTotais : colunasDetalhe}
      rows={exibirTotais && !diaUnico ? linhasTotais : itensExibidos}
      loading={carregando}
      emptyMessage="Nenhum item encontrado para este filtro."
    />
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <div>
          <h1>{titulo}</h1>
          <p>{descricao}</p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {diaUnico && (
            <Button variant="secondary" onClick={() => navigate("/estoque")}>
              Lotes
            </Button>
          )}
          {(variante === "consulta" || variante === "listaCompra") && (
            <>
              {variante === "consulta" && (
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" checked={exibirTotais} onChange={(e) => setExibirTotais(e.target.checked)} />
                  Exibir totais
                </label>
              )}
              <div style={{ position: "relative" }}>
                <Button variant="ghost" onClick={() => setMostrarImprimir((v) => !v)}>
                  Imprimir ▾
                </Button>
                {mostrarImprimir && (
                  <DropdownMenu
                    items={variante === "consulta" ? ["Itens", "Totais", "Itens com preço"] : ["Detalhado", "Totais", "Totais Detalhado", "Por Data"]}
                    onSelect={stub("Impressão")}
                    onClose={() => setMostrarImprimir(false)}
                  />
                )}
              </div>
              <Button variant="ghost" onClick={stub("Exportar")}>
                Exportar
              </Button>
            </>
          )}
        </div>
      </div>

      {comSidebarFiltros ? (
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
          <Card style={{ width: "280px", flexShrink: 0 }}>
            <h3 style={{ marginTop: 0 }}>Filtros</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>{camposFiltro}</div>
          </Card>
          <div style={{ flex: 1, minWidth: 0 }}>
            {avisoValorZero}
            {linhaContador}
            {tabela}
          </div>
        </div>
      ) : (
        <>
          <Card style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>{camposFiltro}</div>
          </Card>
          {avisoValorZero}
          {linhaContador}
          {tabela}
        </>
      )}
    </div>
  );
}
