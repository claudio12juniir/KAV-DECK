import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { listSeparadores } from "../../../src/features/colaboradores/api.js";
import { listLotesDisponiveis } from "../../../src/features/estoque/api.js";
import { faturarPedidoVenda, getPedidoVenda, separarPedidoVenda } from "../../../src/features/vendas/api.js";
import { useRealtimeInvalidate } from "../../../src/hooks/useRealtimeInvalidate.js";
import { getSeparadorSalvo, salvarSeparador } from "../../../src/lib/separadorIdentidade.js";
import { Button } from "../../../src/ui/Button.jsx";
import { Card } from "../../../src/ui/Card.jsx";
import { StatusVendaBadge } from "../../../src/ui/StatusBadge.jsx";
import { colors, radius, spacing } from "../../../src/ui/theme.js";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function SeparadorDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [pedido, setPedido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [iniciando, setIniciando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  // Uma entrada por item do pedido: { produtoId, loteId, quantidade }.
  const [picking, setPicking] = useState({});
  const [lotesPorProduto, setLotesPorProduto] = useState({});
  const [carregandoLotes, setCarregandoLotes] = useState(false);

  const [modalSeparadorAberto, setModalSeparadorAberto] = useState(false);
  const [separadoresDisponiveis, setSeparadoresDisponiveis] = useState([]);

  const carregar = useCallback(async () => {
    try {
      const dados = await getPedidoVenda(id);
      setPedido(dados);
      setErro("");
    } catch (err) {
      setErro(err.message ?? "Não foi possível carregar este pedido.");
    }
  }, [id]);

  useEffect(() => {
    setCarregando(true);
    carregar().finally(() => setCarregando(false));
  }, [carregar]);

  useRealtimeInvalidate("/vendas/pedidos", carregar);

  // Busca os lotes disponíveis (FEFO) assim que o pedido está em separação —
  // é o que alimenta a escolha de lote por item.
  useEffect(() => {
    if (!pedido || pedido.status !== "SEPARACAO") return;
    let ativo = true;
    setCarregandoLotes(true);
    Promise.all(
      pedido.itens.map(async (item) => [item.produtoId, await listLotesDisponiveis(item.produtoId)]),
    )
      .then((pares) => {
        if (!ativo) return;
        setLotesPorProduto(Object.fromEntries(pares));
      })
      .finally(() => ativo && setCarregandoLotes(false));
    return () => {
      ativo = false;
    };
  }, [pedido]);

  function definirPicking(produtoId, patch) {
    setPicking((prev) => ({ ...prev, [produtoId]: { ...prev[produtoId], ...patch } }));
  }

  function escolherLote(item, lote) {
    definirPicking(item.produtoId, {
      loteId: lote.id,
      quantidade: String(Math.min(Number(item.quantidade), Number(lote.quantidadeAtual))),
    });
  }

  async function abrirSelecaoDeSeparador() {
    try {
      const lista = await listSeparadores();
      setSeparadoresDisponiveis(lista);
      setModalSeparadorAberto(true);
    } catch (err) {
      Alert.alert("Não foi possível carregar os separadores", err.message ?? "Tente novamente.");
    }
  }

  async function confirmarSeparador(colaborador) {
    await salvarSeparador({ id: colaborador.id, nome: colaborador.nome });
    setModalSeparadorAberto(false);
    await iniciarSeparacao(colaborador.id);
  }

  async function handleIniciarSeparacao() {
    const salvo = await getSeparadorSalvo();
    if (!salvo) {
      abrirSelecaoDeSeparador();
      return;
    }
    await iniciarSeparacao(salvo.id);
  }

  async function iniciarSeparacao(separadorId) {
    setIniciando(true);
    try {
      await separarPedidoVenda(id, separadorId);
      await carregar();
    } catch (err) {
      Alert.alert("Não foi possível iniciar a separação", err.message ?? "Tente novamente.");
    } finally {
      setIniciando(false);
    }
  }

  const todosItensProntos =
    pedido?.itens.length > 0 &&
    pedido.itens.every((item) => {
      const p = picking[item.produtoId];
      return p?.loteId && Number(p?.quantidade) > 0;
    });

  async function handleFinalizarSeparacao() {
    setFinalizando(true);
    try {
      await faturarPedidoVenda(
        id,
        pedido.itens.map((item) => ({
          produtoId: item.produtoId,
          loteId: picking[item.produtoId].loteId,
          quantidade: String(picking[item.produtoId].quantidade),
        })),
      );
      Alert.alert("Separação concluída", "O pedido foi faturado e o estoque baixado.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Não foi possível finalizar", err.message ?? "Tente novamente.");
    } finally {
      setFinalizando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator />
      </View>
    );
  }

  if (erro || !pedido) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erro}>{erro || "Pedido não encontrado."}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>{pedido.cliente.participante.razaoSocial}</Text>
          <Text style={styles.subtitulo}>{formatarData(pedido.dataEmissao)}</Text>
        </View>
        <StatusVendaBadge status={pedido.status} />
      </View>

      <Card style={styles.cardItens}>
        {pedido.itens.map((item) => {
          const lotes = lotesPorProduto[item.produtoId] ?? [];
          const p = picking[item.produtoId];

          return (
            <View key={item.id} style={styles.item}>
              <Text style={styles.itemTitulo}>{item.produto.descricao}</Text>
              <Text style={styles.itemSub}>
                {item.produto.codigo} · Pedido: {item.quantidade} · {formatarMoeda(item.precoUnitario)}
              </Text>

              {pedido.status === "SEPARACAO" && (
                <View style={styles.picking}>
                  {carregandoLotes ? (
                    <Text style={styles.textoMuted}>Carregando lotes...</Text>
                  ) : lotes.length === 0 ? (
                    <Text style={styles.erroPequeno}>Nenhum lote com saldo disponível para este produto.</Text>
                  ) : (
                    <View style={styles.lotesRow}>
                      {lotes.map((lote) => (
                        <Pressable
                          key={lote.id}
                          onPress={() => escolherLote(item, lote)}
                          style={[styles.chipLote, p?.loteId === lote.id && styles.chipLoteSelecionado]}
                        >
                          <Text
                            style={[styles.chipLoteTexto, p?.loteId === lote.id && styles.chipLoteTextoSelecionado]}
                          >
                            Val. {lote.dataValidade ? formatarData(lote.dataValidade) : "—"} · disp.{" "}
                            {lote.quantidadeAtual}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {p?.loteId && (
                    <View style={styles.quantidadeRow}>
                      <Text style={styles.itemSub}>Quantidade separada</Text>
                      <TextInput
                        style={styles.inputQuantidade}
                        keyboardType="decimal-pad"
                        value={String(p.quantidade ?? "")}
                        onChangeText={(valor) => definirPicking(item.produtoId, { quantidade: valor })}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </Card>

      {pedido.status === "ABERTO" && (
        <Button onPress={handleIniciarSeparacao} loading={iniciando}>
          Iniciar separação
        </Button>
      )}

      {pedido.status === "SEPARACAO" && (
        <Button onPress={handleFinalizarSeparacao} loading={finalizando} disabled={!todosItensProntos}>
          Finalizar separação
        </Button>
      )}

      {(pedido.status === "FATURADO" || pedido.status === "CANCELADO") && (
        <Text style={styles.textoMuted}>
          {pedido.status === "FATURADO" ? "Este pedido já foi faturado." : "Este pedido foi cancelado."}
        </Text>
      )}

      <Modal visible={modalSeparadorAberto} animationType="slide" transparent onRequestClose={() => setModalSeparadorAberto(false)}>
        <View style={styles.modalFundo}>
          <View style={styles.modalConteudo}>
            <Text style={styles.modalTitulo}>Quem está separando?</Text>
            <Text style={styles.textoMuted}>
              Fica salvo neste aparelho para as próximas vezes.
            </Text>
            <ScrollView style={{ marginTop: spacing.md, maxHeight: 320 }}>
              {separadoresDisponiveis.map((colaborador) => (
                <Pressable
                  key={colaborador.id}
                  style={styles.opcaoSeparador}
                  onPress={() => confirmarSeparador(colaborador)}
                >
                  <Text style={styles.opcaoSeparadorTexto}>{colaborador.nome}</Text>
                </Pressable>
              ))}
              {separadoresDisponiveis.length === 0 && (
                <Text style={styles.textoMuted}>
                  Nenhum colaborador do tipo Separador cadastrado ainda.
                </Text>
              )}
            </ScrollView>
            <Button variant="secondary" onPress={() => setModalSeparadorAberto(false)} style={{ marginTop: spacing.md }}>
              Cancelar
            </Button>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  conteudo: {
    padding: spacing.md,
    gap: spacing.md,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  erro: {
    color: colors.danger,
    fontSize: 14,
    textAlign: "center",
  },
  erroPequeno: {
    color: colors.danger,
    fontSize: 13,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textFaint,
    marginTop: 2,
  },
  cardItens: {
    padding: 0,
    overflow: "hidden",
  },
  item: {
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 4,
  },
  itemTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  itemSub: {
    fontSize: 13,
    color: colors.textMuted,
  },
  textoMuted: {
    fontSize: 13,
    color: colors.textMuted,
  },
  picking: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  lotesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chipLote: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipLoteSelecionado: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  chipLoteTexto: {
    fontSize: 12,
    color: colors.text,
  },
  chipLoteTextoSelecionado: {
    color: colors.accentText,
  },
  quantidadeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  inputQuantidade: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 90,
    textAlign: "right",
    fontSize: 14,
    color: colors.text,
  },
  modalFundo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalConteudo: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  opcaoSeparador: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  opcaoSeparadorTexto: {
    fontSize: 15,
    color: colors.text,
  },
});
