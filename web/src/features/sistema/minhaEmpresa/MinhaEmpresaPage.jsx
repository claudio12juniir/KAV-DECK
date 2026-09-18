import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { minhaEmpresaApi } from "./api.js";

function arquivoParaDataUrl(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = reject;
    leitor.readAsDataURL(arquivo);
  });
}

export function MinhaEmpresaPage() {
  const toast = useToast();
  const [empresa, setEmpresa] = useState(null);
  const [form, setForm] = useState({ razaoSocial: "", telefone: "", emailServico: "", logotipoDataUrl: "" });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    minhaEmpresaApi
      .obter()
      .then((dados) => {
        setEmpresa(dados);
        setForm({
          razaoSocial: dados.razaoSocial ?? "",
          telefone: dados.telefone ?? "",
          emailServico: dados.emailServico ?? "",
          logotipoDataUrl: dados.logotipoDataUrl ?? "",
        });
      })
      .catch((err) => toast.error(err.message ?? "Não foi possível carregar os dados da empresa."))
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogo(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    try {
      const dataUrl = await arquivoParaDataUrl(arquivo);
      setForm((prev) => ({ ...prev, logotipoDataUrl: dataUrl }));
    } catch {
      toast.error("Não foi possível ler o arquivo de logo.");
    }
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const atualizada = await minhaEmpresaApi.atualizar(form);
      setEmpresa(atualizada);
      toast.success("Dados da empresa atualizados.");
    } catch (err) {
      toast.error(err.message ?? "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <p>Carregando...</p>;

  return (
    <div>
      <h1>Minha Empresa</h1>
      <p>Dados cadastrais usados em documentos, boletos e no cabeçalho do sistema.</p>

      <Card style={{ maxWidth: "560px", marginTop: "20px" }}>
        <form className="crud-form" onSubmit={handleSalvar}>
          <Input label="CNPJ" value={empresa?.cnpj ?? ""} disabled hint="O CNPJ não pode ser alterado." />
          <Input
            label="Razão social"
            required
            value={form.razaoSocial}
            onChange={(e) => setForm((prev) => ({ ...prev, razaoSocial: e.target.value }))}
          />
          <Input
            label="Telefone"
            value={form.telefone}
            onChange={(e) => setForm((prev) => ({ ...prev, telefone: e.target.value }))}
          />
          <Input
            label="E-mail de serviço"
            type="email"
            value={form.emailServico}
            onChange={(e) => setForm((prev) => ({ ...prev, emailServico: e.target.value }))}
          />
          <div className="field">
            <label className="field-label">Logotipo</label>
            {form.logotipoDataUrl && (
              <img
                src={form.logotipoDataUrl}
                alt="Logotipo da empresa"
                style={{ maxWidth: "160px", maxHeight: "80px", display: "block", marginBottom: "8px" }}
              />
            )}
            <input type="file" accept="image/*" onChange={handleLogo} />
          </div>
          <Button type="submit" loading={salvando}>
            Salvar
          </Button>
        </form>
      </Card>
    </div>
  );
}
