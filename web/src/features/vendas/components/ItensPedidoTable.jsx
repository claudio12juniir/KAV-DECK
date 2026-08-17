import "../../../components/ui/Table.css";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ItensPedidoTable({ itens, onChangeItem, onRemoveItem }) {
  if (!itens.length) {
    return <p className="data-table-empty">Nenhum produto adicionado ainda.</p>;
  }

  const total = itens.reduce(
    (soma, item) => soma + Number(item.quantidade || 0) * Number(item.precoUnitario || 0) - Number(item.desconto || 0),
    0,
  );

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Qtd.</th>
            <th>Preço unit.</th>
            <th>Desconto</th>
            <th>Subtotal</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {itens.map((item, index) => {
            const subtotal =
              Number(item.quantidade || 0) * Number(item.precoUnitario || 0) - Number(item.desconto || 0);
            return (
              <tr key={`${item.produtoId}-${index}`}>
                <td data-label="Produto">
                  <strong>{item.descricao}</strong>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{item.codigo}</div>
                </td>
                <td data-label="Qtd.">
                  <input
                    className="field-control"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantidade}
                    onChange={(e) => onChangeItem(index, "quantidade", e.target.value)}
                  />
                </td>
                <td data-label="Preço unit.">
                  <input
                    className="field-control"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.precoUnitario}
                    onChange={(e) => onChangeItem(index, "precoUnitario", e.target.value)}
                  />
                </td>
                <td data-label="Desconto">
                  <input
                    className="field-control"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.desconto}
                    onChange={(e) => onChangeItem(index, "desconto", e.target.value)}
                  />
                </td>
                <td data-label="Subtotal">{formatarMoeda(subtotal)}</td>
                <td data-label="">
                  <button type="button" className="autocomplete-trocar" onClick={() => onRemoveItem(index)}>
                    Remover
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ textAlign: "right", padding: "var(--space-3) var(--space-4)", fontWeight: 700 }}>
        Total: {formatarMoeda(total)}
      </div>
    </div>
  );
}
