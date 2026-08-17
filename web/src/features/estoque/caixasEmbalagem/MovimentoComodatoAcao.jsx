import { useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { Modal } from "../../../components/ui/Modal.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { ParticipanteAutocomplete } from "../../shared/ParticipanteAutocomplete.jsx";
import { registrarMovimentoComodato } from "./api.js";

export function MovimentoComodatoAcao({ tipoCaixaEmbalagemId }) {
  const toast = useToast();
  const [aberto, setAberto] = useState(false);
  const [participante, setParticipante] = useState(null);
  const [tipo, setTipo] = useState("ENTREGA");
  const [quantidade, setQuantidade] = useState("");
  const [salvando, setSalvando] = useState(false);

  function fechar() {
    setAberto(false);
    setParticipante(null);
    setTipo("ENTREGA");
    setQuantidade("");
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await registrarMovimentoComodato(tipoCaixaEmbalagemId, {
        participanteId: participante.id,
        tipo,
        quantidade,
      });
      toast.success("Movimento de comodato registrado.");
      fechar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível registrar o movimento.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <button type="button" className="autocomplete-trocar" onClick={() => setAberto(true)}>
        Registrar movimento
      </button>
      <Modal
        open={aberto}
        onClose={fechar}
        title="Movimento de comodato"
        footer={
          <>
            <Button variant="ghost" onClick={fechar}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} loading={salvando} disabled={!participante || !quantidade}>
              Salvar
            </Button>
          </>
        }
      >
        <form className="crud-form" onSubmit={handleSalvar}>
          <div>
            <div className="field-label" style={{ marginBottom: "6px" }}>
              Participante
            </div>
            <ParticipanteAutocomplete
              selecionado={participante}
              onSelecionar={setParticipante}
              onLimpar={() => setParticipante(null)}
            />
          </div>
          <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="ENTREGA">Entrega</option>
            <option value="DEVOLUCAO">Devolução</option>
          </Select>
          <div>
            <label className="field-label" style={{ display: "block", marginBottom: "6px" }}>
              Quantidade
            </label>
            <input
              className="field-control"
              type="number"
              min="0"
              step="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
