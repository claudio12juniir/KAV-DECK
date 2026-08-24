import { useEffect, useState } from "react";
import { useRealtimeInvalidate } from "../../hooks/useRealtimeInvalidate.js";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { Modal } from "../ui/Modal.jsx";
import { Select } from "../ui/Select.jsx";
import { DataTable } from "../ui/Table.jsx";
import { useToast } from "../ui/Toast.jsx";
import "./SimpleCrudManager.css";

function valorInicial(fields) {
  return Object.fromEntries(
    fields.map((f) => [f.name, f.default ?? (f.type === "checkbox" ? false : "")]),
  );
}

// Cadastro de apoio simples (tabela + criar/editar/excluir num modal). Não
// usar para entidades com relações/regras específicas (Produto, Participante,
// TabelaPreco, Título, NotaFiscal têm páginas próprias) — isso aqui é só
// para os cadastros que de fato são "a mesma receita".
export function SimpleCrudManager({
  title,
  description,
  api,
  resource,
  fields,
  columns,
  idField = "id",
  searchable = false,
}) {
  const toast = useToast();
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(() => valorInicial(fields));
  const [salvando, setSalvando] = useState(false);
  const [excluir, setExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [opcoesCarregadas, setOpcoesCarregadas] = useState({});

  async function carregar(q) {
    setCarregando(true);
    try {
      const { items } = await api.list(q ? { q } : undefined);
      setItens(items);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar os dados.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (!searchable) {
      carregar();
      return undefined;
    }
    const timeout = setTimeout(() => carregar(busca.trim() || undefined), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  useRealtimeInvalidate(resource, () => carregar(searchable ? busca.trim() || undefined : undefined));

  useEffect(() => {
    fields.forEach((field) => {
      if (field.type === "select" && typeof field.options === "function") {
        field.options().then((opcoes) => {
          setOpcoesCarregadas((prev) => ({ ...prev, [field.name]: opcoes }));
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function abrirNovo() {
    setEditando(null);
    setForm(valorInicial(fields));
    setModalAberto(true);
  }

  function abrirEdicao(registro) {
    setEditando(registro);
    setForm(
      Object.fromEntries(
        fields.map((f) => {
          let valor = registro[f.name] ?? (f.type === "checkbox" ? false : "");
          // <input type="date"> só aceita "AAAA-MM-DD" — o backend devolve
          // datetime ISO completo (ex: "2026-08-24T00:00:00.000Z"), que sem
          // esse corte fica em branco no campo em vez de vir preenchido.
          if (f.type === "date" && typeof valor === "string" && valor.includes("T")) {
            valor = valor.slice(0, 10);
          }
          return [f.name, valor];
        }),
      ),
    );
    setModalAberto(true);
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (editando) {
        await api.update(editando[idField], form);
        toast.success("Atualizado com sucesso.");
      } else {
        await api.create(form);
        toast.success("Criado com sucesso.");
      }
      setModalAberto(false);
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir() {
    setExcluindo(true);
    try {
      await api.remove(excluir[idField]);
      toast.success("Excluído com sucesso.");
      setExcluir(null);
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível excluir.");
    } finally {
      setExcluindo(false);
    }
  }

  const colunasTabela = [
    ...(columns ?? fields.map((f) => ({ key: f.name, label: f.label }))),
    {
      key: "_acoes",
      label: "",
      render: (row) => (
        <div className="crud-row-actions">
          <button type="button" className="autocomplete-trocar" onClick={() => abrirEdicao(row)}>
            Editar
          </button>
          <button
            type="button"
            className="autocomplete-trocar"
            style={{ color: "var(--color-danger)" }}
            onClick={() => setExcluir(row)}
          >
            Excluir
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="crud-header">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        <Button onClick={abrirNovo}>Novo</Button>
      </div>

      {searchable && (
        <div style={{ maxWidth: "320px", marginBottom: "20px" }}>
          <Input
            placeholder="Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      )}

      <DataTable
        columns={colunasTabela}
        rows={itens}
        loading={carregando}
        emptyMessage="Nenhum registro encontrado."
      />

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? "Editar" : "Novo"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} loading={salvando}>
              Salvar
            </Button>
          </>
        }
      >
        <form className="crud-form" onSubmit={handleSalvar}>
          {fields.map((field) => {
            if (field.type === "checkbox") {
              return (
                <label key={field.name} className="crud-checkbox">
                  <input
                    type="checkbox"
                    checked={Boolean(form[field.name])}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.checked }))}
                  />
                  {field.label}
                </label>
              );
            }
            if (field.type === "select") {
              const opcoes = Array.isArray(field.options) ? field.options : opcoesCarregadas[field.name] ?? [];
              return (
                <Select
                  key={field.name}
                  label={field.label}
                  required={field.required}
                  value={form[field.name] ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                >
                  <option value="">Selecione...</option>
                  {opcoes.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              );
            }
            return (
              <Input
                key={field.name}
                label={field.label}
                type={field.type ?? "text"}
                required={field.required}
                placeholder={field.placeholder}
                value={form[field.name] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
              />
            );
          })}
        </form>
      </Modal>

      <Modal
        open={Boolean(excluir)}
        onClose={() => setExcluir(null)}
        title="Excluir registro?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setExcluir(null)}>
              Voltar
            </Button>
            <Button variant="danger" onClick={handleExcluir} loading={excluindo}>
              Sim, excluir
            </Button>
          </>
        }
      >
        Essa ação não pode ser desfeita.
      </Modal>
    </div>
  );
}
