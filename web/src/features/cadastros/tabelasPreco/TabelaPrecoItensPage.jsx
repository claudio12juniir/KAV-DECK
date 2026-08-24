import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "../../../components/ui/Card.jsx";
import { SkeletonLines } from "../../../components/ui/Skeleton.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { ProdutoAutocomplete } from "../../shared/ProdutoAutocomplete.jsx";
import { getTabelaPreco, removeItemTabelaPreco, upsertItemTabelaPreco } from "./api.js";

export function TabelaPrecoItensPage() {
  const { id } = useParams();
  const toast = useToast();
  const [tabela, setTabela] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const dados = await getTabelaPreco(id);
      setTabela(dados);
    } catch (err) {
      setErroCarregar(err.message ?? "Não foi possível carregar esta tabela.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useRealtimeInvalidate("/cadastros/tabelas-preco", carregar);

  async function adicionarProduto(produto) {
    try {
      await upsertItemTabelaPreco(id, produto.id, String(produto.precoReferencia ?? 0));
      toast.success("Produto adicionado à tabela.");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível adicionar o produto.");
    }
  }

  async function alterarPreco(produtoId, preco) {
    try {
      await upsertItemTabelaPreco(id, produtoId, String(preco));
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível atualizar o preço.");
    }
  }

  async function removerItem(produtoId) {
    try {
      await removeItemTabelaPreco(id, produtoId);
      toast.success("Produto removido da tabela.");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível remover o produto.");
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

  return (
    <div>
      <h1>{tabela.nome}</h1>
      <p>Preços por produto nesta tabela.</p>

      <Card style={{ maxWidth: "760px" }}>
        <div style={{ marginBottom: "24px" }}>
          <ProdutoAutocomplete onSelecionar={adicionarProduto} />
        </div>

        {tabela.itens.length === 0 ? (
          <p className="data-table-empty">Nenhum produto nesta tabela ainda.</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Preço</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tabela.itens.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Produto">
                      <strong>{item.produto.descricao}</strong>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
                        {item.produto.codigo}
                      </div>
                    </td>
                    <td data-label="Preço">
                      {item.preco === undefined ? (
                        <span style={{ color: "var(--color-text-faint)" }}>Sem permissão para ver</span>
                      ) : (
                        <input
                          className="field-control"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={item.preco}
                          onBlur={(e) => {
                            if (e.target.value && Number(e.target.value) !== Number(item.preco)) {
                              alterarPreco(item.produtoId, e.target.value);
                            }
                          }}
                        />
                      )}
                    </td>
                    <td data-label="">
                      <button type="button" className="autocomplete-trocar" onClick={() => removerItem(item.produtoId)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
