import { useEffect, useState } from "react";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { listCfop } from "./api.js";

export function CfopPage() {
  const toast = useToast();
  const [cfops, setCfops] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ativo = true;
    listCfop()
      .then(({ items }) => {
        if (ativo) setCfops(items);
      })
      .catch((err) => {
        if (ativo) toast.error(err.message ?? "Não foi possível carregar os CFOPs.");
      })
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useRealtimeInvalidate("/fiscal/cfop", () => setRefreshKey((k) => k + 1));

  const columns = [
    { key: "codigo", label: "Código" },
    { key: "descricao", label: "Descrição" },
  ];

  return (
    <div>
      <h1>CFOP</h1>
      <p>Tabela padronizada pela SEFAZ — consulta apenas, o cadastro é mantido pela equipe técnica.</p>

      <DataTable columns={columns} rows={cfops} loading={carregando} emptyMessage="Nenhum CFOP cadastrado ainda." />
    </div>
  );
}
