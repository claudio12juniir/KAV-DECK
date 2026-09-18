import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { configuracaoFiscalApi } from "./api.js";

const VAZIO = {
  ambiente: "HOMOLOGACAO",
  serieNfePadrao: "1",
  serieNfcePadrao: "1",
  cscId: "",
  cscToken: "",
  regimeTributario: "",
  inscricaoEstadual: "",
  endereco: {
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cep: "",
    uf: "",
    cidadeCodigoIbge: "",
    cidadeNome: "",
  },
};

export function ConfiguracaoFiscalPage() {
  const toast = useToast();
  const [configuracao, setConfiguracao] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    configuracaoFiscalApi
      .obter()
      .then((dados) => {
        setConfiguracao(dados);
        setForm({
          ambiente: dados.ambiente,
          serieNfePadrao: dados.serieNfePadrao,
          serieNfcePadrao: dados.serieNfcePadrao,
          cscId: dados.cscId ?? "",
          cscToken: dados.cscToken ?? "",
          regimeTributario: dados.regimeTributario ?? "",
          inscricaoEstadual: dados.inscricaoEstadual ?? "",
          endereco: {
            logradouro: dados.enderecoLogradouro ?? "",
            numero: dados.enderecoNumero ?? "",
            complemento: dados.enderecoComplemento ?? "",
            bairro: dados.enderecoBairro ?? "",
            cep: dados.enderecoCep ?? "",
            uf: dados.enderecoUf ?? "",
            cidadeCodigoIbge: dados.enderecoCidadeCodigoIbge ?? "",
            cidadeNome: dados.enderecoCidadeNome ?? "",
          },
        });
      })
      .catch((err) => toast.error(err.message ?? "Não foi possível carregar as configurações fiscais."))
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setEndereco(campo, valor) {
    setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, [campo]: valor } }));
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const enderecoPreenchido = Object.values(form.endereco).some(Boolean) ? form.endereco : undefined;
      const dados = await configuracaoFiscalApi.salvar({
        ambiente: form.ambiente,
        serieNfePadrao: form.serieNfePadrao,
        serieNfcePadrao: form.serieNfcePadrao,
        cscId: form.cscId || undefined,
        cscToken: form.cscToken || undefined,
        regimeTributario: form.regimeTributario || undefined,
        inscricaoEstadual: form.inscricaoEstadual || undefined,
        endereco: enderecoPreenchido,
      });
      setConfiguracao(dados);
      toast.success("Configurações fiscais salvas.");
    } catch (err) {
      toast.error(err.message ?? "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <p>Carregando...</p>;
  if (!configuracao) return <p>Não foi possível carregar as configurações fiscais.</p>;

  return (
    <div>
      <h1>Configurações Fiscais</h1>
      <p>Numeração de documentos e provisionamento na NFe.io — necessário para emitir NF-e/NFC-e reais.</p>

      <div style={{ display: "flex", gap: "12px", margin: "16px 0" }}>
        <Badge tone={configuracao.nfeioCompanyId ? "success" : "neutral"}>
          {configuracao.nfeioCompanyId ? "Company NFe.io provisionada" : "Company NFe.io não provisionada"}
        </Badge>
        <Badge tone={configuracao.nfeioStateTaxConfigurado ? "success" : "neutral"}>
          {configuracao.nfeioStateTaxConfigurado ? "Inscrição estadual configurada" : "Inscrição estadual pendente"}
        </Badge>
      </div>

      <form className="crud-form" onSubmit={handleSalvar} style={{ maxWidth: "640px" }}>
        <Card style={{ padding: "20px" }}>
          <h3 style={{ marginTop: 0 }}>Documento fiscal</h3>
          <div className="crud-form">
            <Select
              label="Ambiente"
              value={form.ambiente}
              onChange={(e) => setForm((prev) => ({ ...prev, ambiente: e.target.value }))}
            >
              <option value="HOMOLOGACAO">Homologação</option>
              <option value="PRODUCAO">Produção</option>
            </Select>
            <Input
              label="Série NF-e padrão"
              required
              value={form.serieNfePadrao}
              onChange={(e) => setForm((prev) => ({ ...prev, serieNfePadrao: e.target.value }))}
            />
            <Input
              label="Série NFC-e padrão"
              required
              value={form.serieNfcePadrao}
              onChange={(e) => setForm((prev) => ({ ...prev, serieNfcePadrao: e.target.value }))}
            />
            <Input
              label="CSC ID (NFC-e)"
              value={form.cscId}
              onChange={(e) => setForm((prev) => ({ ...prev, cscId: e.target.value }))}
            />
            <Input
              label="CSC Token (NFC-e)"
              type="password"
              value={form.cscToken}
              onChange={(e) => setForm((prev) => ({ ...prev, cscToken: e.target.value }))}
            />
          </div>
        </Card>

        <Card style={{ padding: "20px" }}>
          <h3 style={{ marginTop: 0 }}>Dados fiscais da empresa</h3>
          <div className="crud-form">
            <Select
              label="Regime tributário"
              value={form.regimeTributario}
              onChange={(e) => setForm((prev) => ({ ...prev, regimeTributario: e.target.value }))}
            >
              <option value="">Selecione...</option>
              <option value="SimplesNacional">Simples Nacional</option>
              <option value="LucroPresumido">Lucro Presumido</option>
              <option value="LucroReal">Lucro Real</option>
            </Select>
            <Input
              label="Inscrição estadual"
              value={form.inscricaoEstadual}
              onChange={(e) => setForm((prev) => ({ ...prev, inscricaoEstadual: e.target.value }))}
            />
          </div>
        </Card>

        <Card style={{ padding: "20px" }}>
          <h3 style={{ marginTop: 0 }}>Endereço fiscal</h3>
          <p style={{ marginTop: 0, color: "var(--color-text-muted)" }}>
            Exigido pela NFe.io para provisionar a empresa — preencha todos os campos de uma vez.
          </p>
          <div className="crud-form">
            <Input
              label="Logradouro"
              value={form.endereco.logradouro}
              onChange={(e) => setEndereco("logradouro", e.target.value)}
            />
            <Input label="Número" value={form.endereco.numero} onChange={(e) => setEndereco("numero", e.target.value)} />
            <Input
              label="Complemento"
              value={form.endereco.complemento}
              onChange={(e) => setEndereco("complemento", e.target.value)}
            />
            <Input label="Bairro" value={form.endereco.bairro} onChange={(e) => setEndereco("bairro", e.target.value)} />
            <Input
              label="CEP (só números)"
              value={form.endereco.cep}
              onChange={(e) => setEndereco("cep", e.target.value)}
            />
            <Input label="UF" maxLength={2} value={form.endereco.uf} onChange={(e) => setEndereco("uf", e.target.value.toUpperCase())} />
            <Input
              label="Código IBGE do município"
              value={form.endereco.cidadeCodigoIbge}
              onChange={(e) => setEndereco("cidadeCodigoIbge", e.target.value)}
            />
            <Input
              label="Nome do município"
              value={form.endereco.cidadeNome}
              onChange={(e) => setEndereco("cidadeNome", e.target.value)}
            />
          </div>
        </Card>

        <Button type="submit" loading={salvando}>
          Salvar
        </Button>
      </form>
    </div>
  );
}
