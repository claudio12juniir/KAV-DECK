import { useEffect, useState } from "react";
import { HistoricoModal } from "../../../components/audit/Historico.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { logsApi } from "../../cadastros/logs/api.js";
import { listContasBancariasOptions } from "../contasBancarias/api.js";
import { configuracaoFinanceiraApi } from "./api.js";

export function ConfiguracaoFinanceiraPage() {
  const toast = useToast();
  const [contaId, setContaId] = useState("");
  const [empresaId, setEmpresaId] = useState(null);
  const [opcoesContas, setOpcoesContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [logs, setLogs] = useState([]);
  const [carregandoLogs, setCarregandoLogs] = useState(false);

  useEffect(() => {
    Promise.all([configuracaoFinanceiraApi.obter(), listContasBancariasOptions()])
      .then(([config, opcoes]) => {
        setContaId(config.contaBancariaPadraoBoletoId ?? "");
        setEmpresaId(config.id);
        setOpcoesContas(opcoes);
      })
      .catch((err) => toast.error(err.message ?? "Não foi possível carregar a configuração."))
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function abrirHistorico() {
    setHistoricoAberto(true);
    setCarregandoLogs(true);
    try {
      const { items } = await logsApi.list("configuracao-financeira", empresaId);
      setLogs(items);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar o histórico.");
    } finally {
      setCarregandoLogs(false);
    }
  }

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <div>
          <h1>Configuração</h1>
          <p>Conta padrão usada para emissão de boletos dos títulos a receber.</p>
        </div>
        <Button variant="ghost" onClick={abrirHistorico}>
          Histórico
        </Button>
      </div>

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

      <HistoricoModal
        open={historicoAberto}
        onClose={() => setHistoricoAberto(false)}
        logs={logs}
        loading={carregandoLogs}
        fieldLabels={{ contaBancariaPadraoBoletoId: "Conta padrão para boleto" }}
      />
    </div>
  );
}
