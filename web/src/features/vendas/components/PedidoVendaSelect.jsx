import { useEffect, useState } from "react";
import { Select } from "../../../components/ui/Select.jsx";
import { listPedidosVenda } from "../api.js";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

// Seletor simples de pedido de venda — reutilizado por Devolução e
// Ocorrências, que só precisam referenciar um pedido já existente (não
// criar/editar itens como o Terminal de Venda faz).
export function PedidoVendaSelect({ label = "Pedido de venda", status, value, onChange }) {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    listPedidosVenda({ status, pageSize: 50 }).then(({ items }) => setPedidos(items));
  }, [status]);

  return (
    <Select label={label} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">—</option>
      {pedidos.map((pedido) => (
        <option key={pedido.id} value={pedido.id}>
          {pedido.cliente.participante.razaoSocial} — {formatarData(pedido.dataEmissao)}
        </option>
      ))}
    </Select>
  );
}
