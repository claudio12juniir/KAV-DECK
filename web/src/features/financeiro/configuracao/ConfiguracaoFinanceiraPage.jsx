import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { listContasBancariasOptions } from "../contasBancarias/api.js";
import { configuracaoFinanceiraApi } from "./api.js";

export function ConfiguracaoFinanceiraPage() {
  const toast = useToast();
  const [contaId, setContaId] = useState("");
  const [opcoesContas, setOpcoesContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    Promise.all([configuracaoFinanceiraApi.obter(), listContasBancariasOptions()])
      .then(([config, opcoes]) => {
        setContaId(config.contaBancariaPadraoBoletoId ?? "");
        setOpcoesContas(opcoes);
      })
      .catch((err) => toast.error(err.message ?? "Não foi possível carregar a configuração."))
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSalvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await configuracaoFinanceiraApi.atualizar(contaId || null);
      toast.success("Configuração salva.");
    } catch (err) {
      toast.error(err.message ?? "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <p>Carregando...</p>;

  return (
    <div>
      <h1>Configuração</h1>
      <p>Conta padrão usada para emissão de boletos dos títulos a receber.</p>

      <Card style={{ maxWidth: "480px", marginTop: "20px", padding: "20px" }}>
        <form className="crud-form" onSubmit={handleSalvar}>
          <Select
            label="Conta padrão para emissão de boletos"
            value={contaId}
            onChange={(e) => setContaId(e.target.value)}
          >
            <option value="">Nenhuma</option>
            {opcoesContas.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Button type="submit" loading={salvando}>
            Salvar
          </Button>
        </form>
      </Card>
    </div>
  );
}
