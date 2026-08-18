import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Modal } from "../../../components/ui/Modal.jsx";
import { SkeletonLines } from "../../../components/ui/Skeleton.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { fecharInventario, getInventario } from "./api.js";

export function InventarioDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [inventario, setInventario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState("");
  const [confirmarFechamento, setConfirmarFechamento] = useState(false);
  const [fechando, setFechando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const dados = await getInventario(id);
      setInventario(dados);
    } catch (err) {
      setErroCarregar(err.message ?? "Não foi possível carregar este inventário.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useRealtimeInvalidate("/estoque/inventarios", carregar);

  async function handleFechar() {
    setFechando(true);
    try {
      const resultado = await fecharInventario(id);
      toast.success(`Inventário fechado. ${resultado.ajustesAplicados} ajuste(s) aplicado(s).`);
      setConfirmarFechamento(false);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível fechar o inventário.");
    } finally {
      setFechando(false);
    }
  }

  if (carregando) {
    return (
      <Card>
        <SkeletonLines count={6} />
      </Card>
    );
  }

  if (erroCarregar) {
    return (
      <Card>
        <p style={{ color: "var(--color-danger)", margin: 0 }}>{erroCarregar}</p>
      </Card>
    );
  }

  const columns = [
    { key: "produto", label: "Produto", render: (row) => row.produto.descricao },
    { key: "quantidadeSistema", label: "Sistema" },
    { key: "quantidadeContada", label: "Contado" },
  ];

  return (
    <div>
      <h1>Inventário físico</h1>
      <p>{new Date(inventario.data).toLocaleString("pt-BR")}</p>

      <Card style={{ marginBottom: "24px" }}>
        <h3>Itens contados</h3>
        <DataTable columns={columns} rows={inventario.itens} emptyMessage="Nenhum item neste inventário." />
      </Card>

      <Button variant="danger" onClick={() => setConfirmarFechamento(true)}>
        Fechar inventário
      </Button>

      <Modal
        open={confirmarFechamento}
        onClose={() => setConfirmarFechamento(false)}
        title="Fechar este inventário?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmarFechamento(false)}>
              Voltar
            </Button>
            <Button variant="danger" onClick={handleFechar} loading={fechando}>
              Sim, fechar
            </Button>
          </>
        }
      >
        Isso gera ajustes reais de estoque para as diferenças entre a contagem e o sistema. Essa ação não pode ser
        desfeita.
      </Modal>
    </div>
  );
}
